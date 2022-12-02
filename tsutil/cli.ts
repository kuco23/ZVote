require("dotenv").config()
import { task } from "hardhat/config";
import * as fs from "fs"
import { postreidon } from "./poseidon/poseidon"
import { MerkleTree } from "./merkle_tree";
import { 
  deployContract, getTickets, 
  registerTicket, spendTicket
} from "./livenet"
const snarkjs = require("snarkjs")

const TREE_DEPTH = 21

function getUserData() {
  fs.appendFileSync("./user_data.json", "")
  const content = fs.readFileSync("./user_data.json").toString()
  return (content == "") ? {} : JSON.parse(content)
}

function updateUserData(
  keys: string[], values: string[] | string[][]
) {
  const data = getUserData()
  for (let i = 0; i < keys.length; i++) 
    data[keys[i]] = values[i]
  fs.writeFileSync("./user_data.json", JSON.stringify(data))
}

async function createProof(pub: any) {
  return await snarkjs.plonk.fullProve(pub,
    "./snark_data/ticket_spender_js/ticket_spender.wasm",
    "./snark_data/ticket_spender_final.zkey"
  )
}

async function getSoliditySnark(pub: any, proof: any) {
  const callargs = await snarkjs.plonk
    .exportSolidityCallData(proof, pub)
  return callargs.slice(0, callargs.indexOf(","))
}

task("deploy", "Deployment of AnonymousVoting contract")
  .addParam("voters")
  .addOptionalParam("start")
  .addOptionalParam("end")
  .addOptionalParam("duration")
  .setAction(async (args, hre) => {
    if (args.duration !== undefined) {
      const duration = Number(args.duration)
      args.start = Math.floor(Date.now() / 1000) + duration
      args.end = args.start + duration
    }
    const contract = await deployContract(
      hre.ethers, args.voters.split(" "),
      args.start, args.end)
    updateUserData(["contract"], [contract.address])
    console.log(contract.address)
  })

task("register", "Register a voting ticket")
  .addParam("option")
  .setAction(async (args, hre) => {
    const data = getUserData()
    const { secret, ticket, serial } = await registerTicket(
      hre.ethers, args.option, data.contract)
    updateUserData(
      ["option", "secret", "ticket", "serial"], 
      [args.option, secret, ticket, serial])
  })

task("spend", "Spend a ticket with a zk-snark")
  .setAction(async (args, hre) => {
    const data = getUserData()

    // get user values from data
    const secret = data.secret
    const option = data.option
    const ticket = postreidon([secret, option])
    const serial = postreidon([secret, ticket])

    // get tickets from the smart contract
    const tickets: string[] = await getTickets(
      hre.ethers, data.contract)

    // build a Merkle tree and obtain the root
    const merkleTree = new MerkleTree(TREE_DEPTH)
    tickets.map(x => merkleTree.addElement(x))
    const merkleRoot = merkleTree.root()
    
    // get the Merkle proof of "ticket in tickets"
    const index = tickets.indexOf(ticket)
    const merkleProof = merkleTree.proof(index)
    
    // build a zksnark for solidity
    const zksnark = await createProof({
      option: option,
      serial: serial,
      root: merkleRoot,
      ticket: ticket,
      secret: secret,
      proof: merkleProof
    })
    const solproof = await getSoliditySnark(
      zksnark.proof, zksnark.publicSignals)
    
    // call the contract to spend the ticket
    await spendTicket(
      hre.ethers, option, serial, 
      solproof, data.contract)
  })
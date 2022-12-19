require("dotenv").config()
import { task } from "hardhat/config";
import * as fs from "fs"
import * as crypto from "crypto"
import BN from "bn.js"
import { 
  deployContract, fullSpendTicket,
  registerTicket, getWinner, registerElection, 
  getTickets, getMerkleRoot
} from "./api"

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

task("deploy", "Deployment of AnonymousVoting contract")
  .setAction(async (args, hre) => {
    const contract = await deployContract(hre.ethers)
    updateUserData(["contract"], [contract.address])
    console.log(`deployed at: ${contract.address}`)
  })

task("election", "Define a new anonymous election")
  .addParam("voters")
  .addOptionalParam("electionId")
  .addOptionalParam("start")
  .addOptionalParam("end")
  .addOptionalParam("duration")
  .addOptionalParam("contract")
  .setAction(async (args, hre) => {
    const data = getUserData()
    if (args.electionId === undefined) {
      const id = crypto.randomBytes(32)
      args.electionId = new BN(id).toString()
    }
    if (args.duration !== undefined) {
      const duration = Number(args.duration)
      args.start = Math.floor(Date.now() / 1000) + duration
      args.end = args.start + duration
    }
    await registerElection(
      hre.ethers,
      args.electionId,
      args.voters.split(" "),
      args.start, args.end, 
      args.contract ?? data.contract
    )
    updateUserData(["electionId"], [args.electionId])
    console.log(`election id: ${args.electionId}`)
  })

task("register", "Register a voting ticket")
  .addParam("option")
  .addOptionalParam("secret")
  .addOptionalParam("electionId")
  .addOptionalParam("contract")
  .setAction(async (args, hre) => {
    const data = getUserData()
    if (args.secret === undefined) {
      const sec = crypto.randomBytes(32)
      args.secret = new BN(sec).toString()
    }
    const signers = await hre.ethers.getSigners()
    const { secret, ticket, serial } = await registerTicket(
      hre.ethers, 
      args.electionId ?? data.electionId, 
      args.secret, 
      args.option,
      args.contract ?? data.contract, 
      signers[0]
    )
    updateUserData(
      ["option", "secret", "ticket", "serial"], 
      [args.option, secret, ticket, serial]
    )
    console.log(`secret: ${secret}`)
  })

task("vote", "Vote by spending your ticket with a zk-snark")
  .addOptionalParam("option")
  .addOptionalParam("secret")
  .addOptionalParam("electionId")
  .addOptionalParam("contract")
  .setAction(async (args, hre) => {
    const data = getUserData()
    const signers = await hre.ethers.getSigners()
    const { merkleRoot } = await fullSpendTicket(
      hre.ethers, 
      args.electionId ?? data.electionId, 
      args.secret ?? data.secret, 
      args.option ?? data.option, 
      args.contract ?? data.contract, 
      signers[1]
    )
    updateUserData(["root"], [merkleRoot])
  })

task("winner", "Get winner after voting ends")
  .addOptionalParam("electionId")
  .addOptionalParam("contract")
  .setAction(async (args, hre) => {
    const data = getUserData()
    const signers = await hre.ethers.getSigners()
    if (data.root === undefined) {
      data.root = await getMerkleRoot(
        hre.ethers,
        args.electionId ?? data.electionId,
        args.contract ?? data.contract,
        signers[0]
      )
    }
    const winner = await getWinner(
      hre.ethers, 
      data.root, 
      args.electionId ?? data.electionId, 
      args.contract ?? data.contract
    )
    console.log(`winner is ${winner}`)
  })
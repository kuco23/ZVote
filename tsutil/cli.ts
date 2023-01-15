require("dotenv").config()
import { task } from "hardhat/config";
import * as crypto from "crypto"
import BN from "bn.js"
import { 
  deployContract, fullSpendTicket,
  registerTicket, getWinner, registerElection, 
  getMerkleRoot
} from "./api"

function randomBytes(nbytes: number) {
  return new BN(crypto.randomBytes(nbytes)).toString()
}

task("deploy", "Deployment of AnonymousVoting contract")
  .setAction(async (args, hre) => {
    const contract = await deployContract(hre.ethers)
    console.log(`contract address: ${contract.address}`)
  })

task("election", "Define a new anonymous election")
  .addOptionalParam("electionId")
  .addParam("start")
  .addParam("end")
  .addParam("voters")
  .addParam("contract")
  .addParam("signer")
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners()
    const now = Math.floor(Date.now() / 1000)
    if (args.start.startsWith("now+"))
      args.start = now + Number(args.start.slice(4))
    if (args.end.startsWith("now+"))
      args.end = now + Number(args.end.slice(4))
    await registerElection(
      hre.ethers,
      args.electionId ?? randomBytes(32),
      args.voters.split(" "),
      args.start, args.end, 
      args.contract,
      signers[Number(args.signer)]
    )
    console.log(`election id: ${args.electionId}`)
  })

task("register", "Register a voting ticket")
  .addOptionalParam("secret")
  .addParam("option")
  .addParam("electionId")
  .addParam("contract")
  .addParam("signer")
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners()
    const { secret, ticket, serial } = await registerTicket(
      hre.ethers, 
      args.electionId, 
      args.secret ?? randomBytes(32), 
      args.option,
      args.contract, 
      signers[Number(args.signer)]
    )
    console.log(`secret: ${secret}`)
    console.log(`ticket: ${ticket}`)
    console.log(`serial: ${serial}`)
  })

task("vote", "Vote by spending your ticket with a zk-snark")
  .addParam("option")
  .addParam("secret")
  .addParam("electionId")
  .addParam("contract")
  .addParam("signer")
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners()
    const { merkleRoot } = await fullSpendTicket(
      hre.ethers, 
      args.electionId, 
      args.secret, 
      args.option, 
      args.contract, 
      signers[Number(args.signer)]
    )
    console.log(`Merkle root: ${merkleRoot}`)
  })

task("winner", "Get winner after voting ends")
  .addParam("electionId")
  .addParam("contract")
  .addParam("signer")
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners()
    const merkleRoot = await getMerkleRoot(
      hre.ethers,
      args.electionId,
      args.contract,
      signers[Number(args.signer)]
    )
    const winner = await getWinner(
      hre.ethers, 
      merkleRoot,
      args.electionId, 
      args.contract
    )
    console.log(`winner is ${winner}`)
  })
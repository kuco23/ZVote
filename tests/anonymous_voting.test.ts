import "@nomiclabs/hardhat-truffle5"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"
import * as fs from "fs"
import { poseidon } from "../tsutil/poseidon"
import { 
  p, nRoundsF, N_ROUNDS_P, 
  POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "../tsutil/constants"
const snarkjs = require("snarkjs")

const HOUR = 60*60
const BEFORE_VOTING_PERIOD_MSG = "should be before the voting period"
const DURING_VOTING_PERIOD_MSG = "should be inside the voting period"
const AFTER_VOTING_PERIOD_MSG = "should be after the voting period"
const TICKET_ALREADY_REGISTERED_MSG = "ticket already registered"
const ONLY_VOTERS = "sender has to be registered as a voter"

function formatSolidityCalldata(calldata: string) {
  const i = calldata.indexOf(",")
  const proof = calldata.slice(0, i)
  const pub = JSON.parse(calldata.slice(i+1))
  return { proof: proof, pub: pub }
}

// Get proof (done via python and snarkjs outside here).
// Merkle tree has to contain the same elements as here.
async function getSoliditySnark() {
  const pub = JSON.parse(fs.readFileSync(
    "./snark_data/public.json").toString())
  const proof = JSON.parse(fs.readFileSync(
    "./snark_data/proof.json").toString())
  const callargs = await snarkjs.plonk.exportSolidityCallData(proof, pub)
  return formatSolidityCalldata(callargs)
}

describe("Tests for AnonymousVoting contract", async () => {
  let ticketSpender: any
  let anonymousVoting: any
  let accounts: SignerWithAddress[]
  let voters: SignerWithAddress[]
  let startVotingTime: number
  let endVotingTime: number

  beforeEach(async() => {
    accounts = await ethers.getSigners()
    voters = accounts.slice(0,6)
    startVotingTime = await time.latest() + HOUR
    endVotingTime = startVotingTime + HOUR
    const TicketSpender = await ethers.getContractFactory("TicketSpender")
    ticketSpender = await TicketSpender.deploy()
    const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting")
    anonymousVoting = await AnonymousVoting.deploy(
      ticketSpender.address, 
      voters.map(x => x.address), 
      startVotingTime, endVotingTime,
      p, nRoundsF, N_ROUNDS_P[1], 
      POSEIDON_C(3)!, POSEIDON_S(3)!, 
      POSEIDON_M(3)!, POSEIDON_P(3)!)
  })

  describe("function unit tests", async () => {
    
    it("should correctly set the constructor arguments", async () => {
      const ticketSpenderAddr = await anonymousVoting.ticketSpender()
      expect(ticketSpenderAddr).to.equal(ticketSpender.address)
      const votingPeriod = await anonymousVoting.votingPeriod()
      expect(votingPeriod.start.toString()).to.equal(startVotingTime.toString())
      expect(votingPeriod.end.toString()).to.equal(endVotingTime.toString())
      const votersAddr = await anonymousVoting.getVoters()
      expect(votersAddr.length).to.equal(voters.length)
      for (let i = 0; i < voters.length; i++) 
        expect(votersAddr[i]).to.equal(voters[i].address)
    })

    it("should fail at registering tickets inside the voting period", async () => {
      await time.increase(HOUR)
      const prms = anonymousVoting.registerTicket(0)
      expect(prms).to.be.revertedWith(BEFORE_VOTING_PERIOD_MSG)
    })

    it("should fail at spending tickets outside the voting period", async () => {
      const prms = anonymousVoting.spendTicket(0,0,"0x0")
      expect(prms).to.be.revertedWith(DURING_VOTING_PERIOD_MSG)
    })

    it("should fail at getting the winner before the end of the voting period", async () => {
      await time.increase(HOUR)
      const prms = anonymousVoting.getWinner()
      expect(prms).to.be.revertedWith(AFTER_VOTING_PERIOD_MSG)
    })

    it("should correctly register a new ticket", async () => {
      await anonymousVoting.registerTicket(1)
      const tickets = await anonymousVoting.getTickets()
      expect(tickets.length).to.equal(1)
      expect(tickets[0].toString()).to.equal("1")
    })

    it("should fail at one address registering two tickets", async () => {
      await anonymousVoting.registerTicket(1)
      const prms = anonymousVoting.registerTicket(2)
      expect(prms).to.be.revertedWith(TICKET_ALREADY_REGISTERED_MSG)
    })

    it("should fail registering ticket from non-voter account", async () => {
      const prms = anonymousVoting.connect(accounts[6]).registerTicket(1)
      expect(prms).to.be.revertedWith(ONLY_VOTERS)
    })

  })

  describe("voting", async() => {

    it("should simulate voting process", async () => {
      // create ticket and its serial number
      const option = new BN("1")
      const secret = new BN("12345678910")
      const ticket = poseidon([secret, option])
      const serial = poseidon([secret, ticket])

      // register voting tickets
      await anonymousVoting.connect(voters[1]).registerTicket("111")
      await anonymousVoting.connect(voters[2]).registerTicket("222")
      await anonymousVoting.connect(voters[3]).registerTicket("333")
      await anonymousVoting.connect(voters[0]).registerTicket(
        ticket.toString())
      await anonymousVoting.connect(voters[4]).registerTicket("444")
      await anonymousVoting.connect(voters[5]).registerTicket("555")

      // move time to start the voting period
      await time.increase(HOUR)
          
      // spend the ticket (call contract from another account)
      const solargs = await getSoliditySnark()
      await anonymousVoting.connect(voters[5]).spendTicket(
          option.toString(), serial.toString(), solargs['proof'])
      
      // move time to end the voting period
      await time.increase(HOUR)
      
      // check that winner was calculated correctly
      const winner = await anonymousVoting.getWinner()
      expect(winner.toString()).to.equal("1")
    })
  })
})
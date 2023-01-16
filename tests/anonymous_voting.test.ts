import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat"
import { expect } from "chai"
import { Contract } from "ethers";
import { postreidon } from "../tsutil/poseidon/poseidon"
import { MerkleTree } from "../tsutil/merkleTree";
import { createProof, getSoliditySnark } from "../tsutil/snark"

const TREE_DEPTH = 21

const HOUR = 60*60

const ELECTION_REGISTERED_MSG = "election already registered"
const ELECTION_NOT_REGISTERED_MSG = "election not registered"
const BEFORE_VOTING_PERIOD_MSG = "should be before the voting period"
const DURING_VOTING_PERIOD_MSG = "should be inside the voting period"
const AFTER_VOTING_PERIOD_MSG = "should be after the voting period"
const TICKET_ALREADY_REGISTERED_MSG = "voter already registered ticket"
const ONLY_VOTERS = "sender has to be registered as a voter"

describe("Tests for AnonymousVoting contract", async () => {
  let anonymousVoting: Contract
  let accounts: SignerWithAddress[]
  let voters: SignerWithAddress[]
  let startVotingTime: number
  let endVotingTime: number

  beforeEach(async() => {
    accounts = await ethers.getSigners()
    voters = accounts.slice(0,6)
    startVotingTime = await time.latest() + HOUR
    endVotingTime = startVotingTime + HOUR
    // deploy the contract and register election
    const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting")
    anonymousVoting = await AnonymousVoting.deploy()
    await anonymousVoting.registerElection(
      1, voters.map(x => x.address),
      startVotingTime, endVotingTime)
  })

  describe("ticket registering", async () => {

    it("should fail at registering an already registered election", async () => {
      const prms = anonymousVoting.registerElection(1)
      expect(prms).to.be.revertedWith(ELECTION_REGISTERED_MSG)
    })

    it("should fail at registering ticket to non election", async () => {
      const prms = anonymousVoting.registerTicket(0,1)
      expect(prms).to.be.revertedWith(ELECTION_NOT_REGISTERED_MSG)
    })

    it("should fail registering ticket from non-voter account", async () => {
      const prms = anonymousVoting.connect(accounts[6]).registerTicket(1)
      expect(prms).to.be.revertedWith(ONLY_VOTERS)
    })

    it("should fail at one address registering two tickets", async () => {
      await anonymousVoting.registerTicket(1,1)
      const prms = anonymousVoting.registerTicket(1,2)
      expect(prms).to.be.revertedWith(TICKET_ALREADY_REGISTERED_MSG)
    })

    it("should fail at registering tickets inside the voting period", async () => {
      await time.increase(HOUR)
      const prms = anonymousVoting.registerTicket(1,0)
      expect(prms).to.be.revertedWith(BEFORE_VOTING_PERIOD_MSG)
    })

    it("should correctly register a new ticket", async () => {
      await anonymousVoting.registerTicket(1,1)
      const tickets = await anonymousVoting.getTickets(1)
      expect(tickets.length).to.equal(1)
      expect(tickets[0].toString()).to.equal("1")
    })

  })

  describe("ticket spending", async () => {

    it("should fail at spending the ticket of unregistered election", async () => {
      time.increase(HOUR)
      const prms = anonymousVoting.spendTicket(1,0,0,0,"0x0")
      expect(prms).to.be.revertedWith(ELECTION_NOT_REGISTERED_MSG)
    })

    it("should fail at spending tickets outside the voting period", async () => {
      const prms1 = anonymousVoting.spendTicket(1,0,0,0,"0x0")
      expect(prms1).to.be.revertedWith(DURING_VOTING_PERIOD_MSG)
      time.increase(2 * HOUR)
      const prms2 = anonymousVoting.spendTicket(1,0,0,0,"0x0")
      expect(prms2).to.be.revertedWith(DURING_VOTING_PERIOD_MSG)
    })

  })
  
  describe("winner fetching", async () => {

    it("should fail at getting the winner before the end of the voting period", async () => {
      const prms1 = anonymousVoting.getWinner(1)
      expect(prms1).to.be.revertedWith(AFTER_VOTING_PERIOD_MSG)
      await time.increase(HOUR)
      const prms2 = anonymousVoting.getWinner(1)
      expect(prms2).to.be.revertedWith(AFTER_VOTING_PERIOD_MSG)
    })

  })

  describe("voting", async() => {

    it("should simulate voting process", async () => {
      // create ticket and its serial number
      const option = "123"
      const secret = "12345678910"
      const ticket = postreidon([secret, option])
      const serial = postreidon([secret, ticket])

      // register voting tickets
      await anonymousVoting.connect(voters[1]).registerTicket(1,"111")
      await anonymousVoting.connect(voters[2]).registerTicket(1,"222")
      await anonymousVoting.connect(voters[3]).registerTicket(1,"333")
      await anonymousVoting.connect(voters[0]).registerTicket(1, ticket)
      await anonymousVoting.connect(voters[4]).registerTicket(1,"444")
      await anonymousVoting.connect(voters[5]).registerTicket(1,"555")

      // move time to start the voting period
      await time.increase(HOUR)
      
      // fetch all registered tickets
      let tickets = await anonymousVoting.getTickets(1)
      tickets = tickets.map((x: any) => x.toString())
      
      // construct Merkle root and proof of ticket in tickets
      const merkleTree = new MerkleTree(TREE_DEPTH)
      tickets.map((x: string) => merkleTree.addElement(x))
      const merkleRoot = merkleTree.root()
      const merkleProof = merkleTree.proof(tickets.indexOf(ticket))
      
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
  
      // spend the ticket (call contract from another account)
      await anonymousVoting.connect(voters[5]).spendTicket(
          1, merkleRoot, option, serial, solproof)

      // move time to end the voting period
      await time.increase(HOUR)
      
      // check that winner was calculated correctly
      const winner = await anonymousVoting.getWinner(1,merkleRoot)
      expect(winner.toString()).to.equal(option)
    })
  })
})
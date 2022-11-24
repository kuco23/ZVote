import "@nomiclabs/hardhat-truffle5"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"
import * as fs from "fs"
import { poseidon } from "../poseidon/poseidon"
import { 
  p, nRoundsF, N_ROUNDS_P,
  POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "../poseidon/constants"
const snarkjs = require("snarkjs")

const HOUR = 60*60

const t = 3 // test for chosen t (range 2 to 17)
const nRoundsP = N_ROUNDS_P[t - 2]
const C = POSEIDON_C(t)!
const S = POSEIDON_S(t)!
const M = POSEIDON_M(t)!
const P = POSEIDON_P(t)!

function formatSolidityCalldata(calldata: string) {
  const i = calldata.indexOf(",")
  const proof = calldata.slice(0, i)
  const pub = JSON.parse(calldata.slice(i+1))
  return { proof: proof, pub: pub }
}

describe("Tests for AnonymousVoting contract", async () => {
  let anonymousVoting: any
  let voters: SignerWithAddress[]
  let startVotingTime: number
  let endVotingTime: number

  beforeEach(async() => {
    startVotingTime = Math.floor(Date.now() / 1000) + HOUR
    endVotingTime = startVotingTime + HOUR
    voters = await ethers.getSigners()
    const voterAddresses = voters.map(x => x.address)
    const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting")
    anonymousVoting = await AnonymousVoting.deploy(
      voterAddresses, startVotingTime, endVotingTime,
      p, t, nRoundsF, nRoundsP, C, S, M, P)
  })

  describe('voting simulation', async() => {

    it("should simulate the voting process", async () => {
      // create ticket and its serial number
      const secret = new BN("012345678910")
      const ticket = poseidon([secret, secret])
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
      await time.increase(HOUR+1)
      
      // get proof (done via python and snarkjs outside here)
      // merkle tree has to contain the same elements as here
      const pub = JSON.parse(fs.readFileSync(
        "./snark_data/public.json").toString())
      const proof = JSON.parse(fs.readFileSync(
        "./snark_data/proof.json").toString())
      const callargs = await snarkjs.plonk.exportSolidityCallData(proof, pub)
      const realargs = formatSolidityCalldata(callargs)
      
      // spend the ticket (call contract from another account)
      await anonymousVoting.connect(voters[5]).spendTicket(
          serial.toString(), 1, realargs['proof'])
      
      // move time to end the voting period
      await time.increase(HOUR+1)
      
      // check that winner was calculated correctly
      const winner = await anonymousVoting.currentWinner()
      expect(winner.toString()).to.equal("1")
    })
  })
})
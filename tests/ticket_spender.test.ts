import "@nomiclabs/hardhat-truffle5"
import { ethers } from "hardhat"
import { expect } from "chai"
import * as fs from "fs"
const snarkjs = require("snarkjs")

// requires snarkjs-generated files 
// public.json and proof.json

function formatSolidityCalldata(calldata: string) {
  const i = calldata.indexOf(",")
  const proof = calldata.slice(0, i)
  const pub = JSON.parse(calldata.slice(i+1))
  return { proof: proof, pub: pub }
}

describe("Tests for TicketSpender contract", async () => {
  let ticketSpender: any

  beforeEach(async() => {
    const TicketSpender = await ethers.getContractFactory("TicketSpender")
    ticketSpender = await TicketSpender.deploy()
  })
 
  describe('proof verification', async() => {

    it("should verify a proof or fail trying", async () => {
      const pub = JSON.parse(fs.readFileSync(
        "./snark_data/public.json").toString())
      const proof = JSON.parse(fs.readFileSync(
        "./snark_data/proof.json").toString())
      const callargs = await snarkjs.plonk.exportSolidityCallData(proof, pub)
      const realargs = formatSolidityCalldata(callargs)
      const resp1 = await ticketSpender.verifyTicketSpending(
        realargs.pub[0], realargs.pub[1], realargs.pub[2], 
        realargs.proof)
      expect(resp1).to.equal(true)
      const resp2 = await ticketSpender.verifyTicketSpending(
        realargs.pub[0], realargs.pub[1], realargs.pub[2],
        realargs.proof.replace("1", "0"))
      expect(resp2).to.equal(false)
      const resp3 = await ticketSpender.verifyTicketSpending(
        realargs.pub[1], realargs.pub[0], realargs.pub[2], 
        realargs.proof)
      expect(resp3).to.equal(false)
    })

  })
})
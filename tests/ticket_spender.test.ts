import { ethers } from "hardhat"
import { expect } from "chai"
import { Contract } from "ethers"
import { postreidon } from "../tsutil/poseidon/poseidon"
import { MerkleTree } from "../tsutil/merkleTree"
import { createProof, getSoliditySnark } from "../tsutil/snark"

const TREE_DEPTH = 21

describe("Tests for TicketSpender contract", async () => {
  let ticketSpender: Contract

  beforeEach(async() => {
    const TicketSpender = await ethers.getContractFactory("TicketSpender")
    ticketSpender = await TicketSpender.deploy()
  })
 
  describe('proof verification', async() => {

    it("should verify a proof or fail trying", async () => {
      // create ticket and its serial number
      const option = "1"
      const secret = "12345678910"
      const ticket = postreidon([secret, option])
      const serial = postreidon([secret, ticket])

      // get a ticket array example and get Merkle data
      const tickets = ["111", "222", "333", ticket, "444", "555"]
      const merkleTree = new MerkleTree(TREE_DEPTH)
      tickets.map(x => merkleTree.addElement(x))
      const merkleRoot = merkleTree.root()
      const merkleProof = merkleTree.proof(tickets.indexOf(ticket))

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
      
      // submit a correct proof
      const resp1 = await ticketSpender.verifyTicketSpending(
        option, serial, merkleRoot, solproof)      
      expect(resp1).to.equal(true)

      // submit a slightly altered proof
      const resp2 = await ticketSpender.verifyTicketSpending(
        option, serial, merkleRoot, solproof.replace("1", "0"))
      expect(resp2).to.equal(false)

      // submit shuffled arguments but right proof
      const resp3 = await ticketSpender.verifyTicketSpending(
        serial, merkleRoot, option, solproof)
      expect(resp3).to.equal(false)
    })

  })
})
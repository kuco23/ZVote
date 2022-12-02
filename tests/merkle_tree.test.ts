import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"
import { Contract } from "ethers"
import { MerkleTree } from "../tsutil/merkle_tree"
import { postreidon } from "../tsutil/poseidon/poseidon"
import { 
    p, nRoundsF, N_ROUNDS_P,
    POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "../tsutil/poseidon/constants"

const depth = 21
const t = 3

describe("Tests for MerkleTree contract", async () => {
  let merkleTreeContract: Contract
  let merkleTree: MerkleTree

  beforeEach(async() => {
    merkleTree = new MerkleTree(depth)
    const MerkleTreeFactory = await ethers
      .getContractFactory("MerkleTreeTester")
    merkleTreeContract = await MerkleTreeFactory.deploy(
      p, t, nRoundsF, N_ROUNDS_P[t - 2], 
      POSEIDON_C(t)!, POSEIDON_S(t)!, 
      POSEIDON_M(t)!, POSEIDON_P(t)!)
  })
 
  describe("Build a Merkle tree", async() => {

    it("should correctly insert an element", async () => {
        await merkleTreeContract.addElementPub(1)
        const element = await merkleTreeContract.getElementAt(0)
        expect(element.toString()).to.equal("1")
    })

    it("should give a correct merkle root", async () => {
        const data = [123124152, 1231, 313131319]
        data.map(async x => {
          const hashed = postreidon([x.toString()])
          merkleTree.addElement(hashed)
          await merkleTreeContract.addElementPub(hashed)
        })
        const merkleRoot = await merkleTreeContract.merkleRoot()
        expect(merkleRoot).to.equal(merkleTree.root())
        
        const merkleProof = merkleTree.proof(1)
        merkleTree.verifyProof(
          postreidon([data[1].toString()]), 
          merkleProof, merkleRoot
        )
        
    })
  })
})
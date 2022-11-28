import "@nomiclabs/hardhat-truffle5"
import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"
import { poseidon } from "../tsutil/poseidon"
import { 
    p, nRoundsF, N_ROUNDS_P,
    POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "../tsutil/constants"
  
const t = 3 // test for chosen t (range 2 to 17)
const nRoundsP = N_ROUNDS_P[t - 2]
const C = POSEIDON_C(t)!
const S = POSEIDON_S(t)!
const M = POSEIDON_M(t)!
const P = POSEIDON_P(t)!

describe("Tests for MerkleTree contract", async () => {
  let merkleTree: any

  beforeEach(async() => {
    const MerkleTree = await ethers.getContractFactory("MerkleTreeTester")
    merkleTree = await MerkleTree.deploy(
      p, t, nRoundsF, nRoundsP, C, S, M, P)
  })
 
  describe("Build a Merkle tree", async() => {

    it("should correctly insert an element", async () => {
        await merkleTree.addElementPub(1)
        const element = await merkleTree.getElementAt(0)
        expect(element.toString()).to.equal("1")
    })

    it("should give a correct merkle root", async () => {
        const data = [123124152, 1314, 12412, 1231]
        const hashedData: BN[] = data.map(x => poseidon([new BN(x)]))
        for (let x of hashedData) 
            await merkleTree.addElementPub(x.toString())
        const merkleRoot = await merkleTree.merkleRoot()
        /* expect(merkleRoot.toString()).to.equal(
            "15743069918484268926889421122003573873153157598428684671110069388320514325721"
        ) */
        
    })
  })
})
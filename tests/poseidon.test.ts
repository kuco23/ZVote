import "@nomiclabs/hardhat-truffle5"
import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"
import { 
  p, nRoundsF, N_ROUNDS_P,
  POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "../poseidon/constants"
import { 
  poseidon as poseidonTs, ark, mix, mixLast, mixS
} from "../poseidon/poseidon"

const t = 3 // test for chosen t (range 2 to 17)
const nRoundsP = N_ROUNDS_P[t - 2]
const C = POSEIDON_C(t)!
const S = POSEIDON_S(t)!
const M = POSEIDON_M(t)!
const P = POSEIDON_P(t)!
const CBN = C.map(x => new BN(x))
const SBN = S.map(x => new BN(x))
const MBN = M.map(l => l.map(x => new BN(x)))
const PBN = P.map(l => l.map(x => new BN(x)))

describe("Tests for Poseidon contract", async () => {
  let poseidon: any

  beforeEach(async() => {
    const Poseidon = await ethers.getContractFactory("PoseidonTester")
    poseidon = await Poseidon.deploy(p, t, nRoundsF, nRoundsP, C, S, M, P)
  })
 
  describe('constants', async() => {

    it("should test whether constants were set correctly", async () => {
      const cp = await poseidon.p()
      const ct = await poseidon.t()
      const cnRoundsF = await poseidon.nRoundsF()
      const cnRoundsP = await poseidon.nRoundsP()

      expect(cp.toString()).to.equal(p)
      expect(ct.toString()).to.equal(t.toString())
      expect(cnRoundsF.toString()).to.equal(nRoundsF.toString())
      expect(cnRoundsP.toString()).to.equal(nRoundsP.toString())
      
      const cC = await poseidon.getC()
      const cS = await poseidon.getS()
      const cM = await poseidon.getM()
      const cP = await poseidon.getP()

      expect(cC.length).to.equal(C.length)
      for (let i = 0; i < C.length; i++) 
        expect(cC[i].toString()).to.equal(C[i])
      
      expect(cS.length).to.equal(S.length)
      for (let i = 0; i < S.length; i++) 
        expect(cS[i].toString()).to.equal(S[i])
      
      expect(cM.length).to.equal(M.length)
      for (let i = 0; i < M.length; i++) {
        expect(cM[i].length).to.equal(M[i].length)
        for (let j = 0; j < M[i].length; j++) 
          expect(cM[i][j].toString()).to.equal(M[i][j])
      }

      expect(cP.length).to.equal(P.length)
      for (let i = 0; i < P.length; i++) {
        expect(cP[i].length).to.equal(P[i].length)
        for (let j = 0; j < P[i].length; j++) 
          expect(cP[i][j].toString()).to.equal(P[i][j])
      } 
    })
  })

  describe("auxilary functions", async () => {

    it("should test cutprepend", async () => {
      const input = [1,2,3]
      const solout = await poseidon.cutprependPub(input, 4, 2)
      expect(solout.length).to.equal(3)
      expect(solout[0].toString()).to.equal("4")
      expect(solout[1].toString()).to.equal("1")
      expect(solout[2].toString()).to.equal("2")
    })

    it("should test ark", async () => {
      const input = [31, 13, 341]
      const tsout = ark(t, CBN, 2, input.map(x => new BN(x)))
      const solout = await poseidon.arkPub(2, input)
      expect(solout.length).to.equal(tsout.length)
      for (let i = 0; i < tsout.length; i++)
        expect(solout[i].toString()).to.equal(tsout[i].toString())
    })

    it("should test mixM", async () => {
      const input = [23124, 132123, 44121]
      const tsout = mix(t, MBN, input.map(x => new BN(x)))
      const solout = await poseidon.mixMPub(input)
      expect(solout.length).to.equal(tsout.length)
      for (let i = 0; i < tsout.length; i++) 
        expect(solout[i].toString()).to.equal(tsout[i].toString())
    })

    it("should test mixLast", async () => {
      const input = [23214, 1323, 1432]
      const tsout = mixLast(t, MBN, 2, input.map(x => new BN(x)))
      const solout = await poseidon.mixLastPub(2, input)
      expect(solout.toString()).to.equal(tsout.toString())
    })

    it("should test mixS", async () => {
      const input = [2312, 2315, 5362]
      const tsout = mixS(t, SBN, 0, input.map(x => new BN(x)))
      const solout = await poseidon.mixSPub(0, input)
      expect(tsout.length).to.equal(solout.length)
      for (let i = 0; i < tsout.length; i++) 
        expect(solout[i].toString()).to.equal(tsout[i].toString())
    })
  })

  describe("Testing poseidon function", async () => {

    it("should test poseidon", async () => {
      const input = [0,1]
      const tsout = poseidonTs(input.map(x => new BN(x)))
      const solout = await poseidon.poseidon(input)
      expect(solout.toString()).to.equal(tsout.toString())
    })

  })
})
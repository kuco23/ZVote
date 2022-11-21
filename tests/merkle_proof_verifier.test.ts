import "@nomiclabs/hardhat-truffle5"
import { ethers } from "hardhat"
import { expect } from "chai"
import BN from "bn.js"

describe("Tests for the verifier", async () => {
  let verifier: any

  beforeEach(async() => {
    const Verifier = await ethers.getContractFactory("PlonkVerifier")
    verifier = await Verifier.deploy()
  })
 
  describe('constants', async() => {
    
  })
})
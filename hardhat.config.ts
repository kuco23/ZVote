

require("dotenv").config()
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-truffle5"
import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-web3"
import "./tsutil/cli"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    coston: {
      url: "https://coston-api.flare.network/ext/C/rpc",
      accounts: [process.env.PRIVATE_KEY!],
      chainId:  16
    }
  }
}

export default config
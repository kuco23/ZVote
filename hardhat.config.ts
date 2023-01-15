

require("dotenv").config()
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-truffle5"
import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-web3"
import "./tsutil/cli"
import "hardhat-gas-reporter"

const accounts = JSON.parse(process.env.PRIVATE_KEYS!)

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
  gasReporter: {
    enabled: true
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    coston: {
      url: "https://coston-api.flare.network/ext/C/rpc",
      accounts: accounts,
      chainId:  16
    },
    costwo: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      accounts: accounts,
      chainId: 114
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: accounts,
      chainId: 43113
    }
  }
}

export default config
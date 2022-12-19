

require("dotenv").config()
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-truffle5"
import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-web3"
import "./tsutil/cli"
import "hardhat-gas-reporter"

const voterAccount = process.env.PRIVATE_KEY2!
const votingAccount = process.env.PRIVATE_KEY1!

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
      accounts: [voterAccount, votingAccount],
      chainId:  16
    },
    costwo: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      accounts: [voterAccount, votingAccount],
      chainId: 114
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [voterAccount, votingAccount],
      chainId: 43113
    }
  }
}

export default config
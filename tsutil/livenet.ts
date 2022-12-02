import * as crypto from "crypto"
import BN from "bn.js"
import { poseidon } from "./poseidon/poseidon"
import { 
  p, nRoundsF, N_ROUNDS_P,
  POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
} from "./poseidon/constants"

async function contractAt(
  ethers: any, contractAddr: string
) {
  const AnonymousVoting = await ethers
    .getContractFactory("AnonymousVoting")
  return AnonymousVoting.attach(contractAddr)
}

export async function deployContract(
  ethers: any, voters: string[],
  startVotingTime: string | number, 
  endVotingTime: string | number
) {
  const AnonymousVoting = await ethers
    .getContractFactory("AnonymousVoting")
  return AnonymousVoting.deploy(
    voters, startVotingTime, endVotingTime,
    p, nRoundsF, N_ROUNDS_P[1], 
    POSEIDON_C(3)!, POSEIDON_S(3)!, 
    POSEIDON_M(3)!, POSEIDON_P(3)!
  )
}

export async function registerTicket(
  ethers: any, option: string, contractAddr: string
) {
  const secret = new BN(crypto.randomBytes(32).toString("hex"), "hex")
  const ticket = poseidon([secret, new BN(option)]).toString()
  const serial = poseidon([secret, new BN(ticket)]).toString()
  const anonymousVoting = await contractAt(ethers, contractAddr)
  await anonymousVoting.registerTicket(ticket)
  return {
    secret: secret.toString(),
    ticket: ticket,
    serial: serial
  }
}

export async function getTickets(
  ethers: any, contractAddr: string
): Promise<string[]> {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  return anonymousVoting.getTickets()
}

export async function spendTicket(
  ethers: any, 
  option: string, serial: string, proof: string, 
  contractAddr: string
) {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  anonymousVoting.spendTicket(option, serial, proof)
}

export async function getWinner(ethers: any, contractAddr: string) {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  return anonymousVoting.getWinner()
}
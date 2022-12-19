import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers"
import { MerkleTree } from "./merkleTree"
import { postreidon } from "./poseidon/poseidon"
import { createProof, getSoliditySnark } from "./snark"

const TREE_DEPTH = 21

export function getMerkleTree(tickets: string[]) {
  const merkleTree = new MerkleTree(TREE_DEPTH)
  tickets.map(x => merkleTree.addElement(x))
  return merkleTree
}

export async function deployContract(ethers: any) {
  const AnonymousVoting = await ethers
    .getContractFactory("AnonymousVoting")
  return AnonymousVoting.deploy()
}

async function contractAt(
  ethers: any, contractAddr: string
): Promise<Contract> {
  const AnonymousVoting = await ethers
    .getContractFactory("AnonymousVoting")
  return AnonymousVoting.attach(contractAddr)
}

export async function registerElection(
  ethers: any, 
  electionId: string, 
  voters: string[],
  startVotingTime: string | number, 
  endVotingTime: string | number,
  contractAddr: string
) {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  await anonymousVoting.registerElection(
    electionId, voters, startVotingTime, endVotingTime)
}

export async function registerTicket(
  ethers: any, electionId: string, 
  secret: string, option: string, 
  contractAddr: string, signer: SignerWithAddress
) {
  const ticket = postreidon([secret, option])
  const serial = postreidon([secret, ticket])
  const anonymousVoting = await contractAt(ethers, contractAddr)
  await anonymousVoting
    .connect(signer)
    .registerTicket(electionId, ticket)
  return {
    secret: secret.toString(),
    ticket: ticket,
    serial: serial
  }
}

export async function fullSpendTicket(
  ethers: any, electionId: string,
  secret: string, option: string,
  contractAddr: string, 
  signer: SignerWithAddress
) {
  // get ticket and serial
  const ticket: string = postreidon([secret, option])
  const serial: string = postreidon([secret, ticket])

  // get tickets from the smart contract
  const tickets: string[] = await getTickets(
    ethers, electionId, contractAddr, signer)

  // get Merkle proof and Merkle root of ticket array
  const index = tickets.indexOf(ticket)
  const merkleTree = getMerkleTree(tickets)
  const merkleRoot = merkleTree.root()
  const merkleProof = merkleTree.proof(index)
  
  // build a zksnark
  const zksnark = await createProof({
    option: option,
    serial: serial,
    root: merkleRoot,
    ticket: ticket,
    secret: secret,
    proof: merkleProof
  })

  // get solidity formatted proof
  const solproof = await getSoliditySnark(
    zksnark.proof, zksnark.publicSignals)
  
  // call the contract to spend the ticket
  const anonymousVoting = await contractAt(ethers, contractAddr)
  await anonymousVoting
    .connect(signer)
    .spendTicket(electionId, merkleRoot, option, serial, solproof)
  
  return {
    merkleRoot: merkleRoot
  }
}

export async function getWinner(
  ethers: any, 
  merkleRoot: string, 
  electionId: string, 
  contractAddr: string
) {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  return anonymousVoting.getWinner(electionId, merkleRoot)
}

export async function getTickets(
  ethers: any, electionId: string,
  contractAddr: string, signer: SignerWithAddress
): Promise<string[]> {
  const anonymousVoting = await contractAt(ethers, contractAddr)
  const tickets = await anonymousVoting
    .connect(signer)
    .getTickets(electionId)
  return tickets.map((x: any) => x.toString())
}

export async function getMerkleRoot(
  ethers: any, electionId: string, 
  contractAddr: string, signer: SignerWithAddress
) {
  const tickets = await getTickets(
    ethers, electionId, contractAddr, signer
  )
  const merkleTree = getMerkleTree(tickets)
  return merkleTree.root()

}
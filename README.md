# Decentralized Anonymous Voting

This is a simple implementation of a decentralized anonymous voting system, based on the main idea of zerocash, using zk-snarks.
The voting system requires voters to be predefined and makes the voting results publicly known at all times without revealing voter choices.

> **Note:**
> Zerocash implements a decentralized anonymous currency by making use of zk-snarks to transfer an unknown coin to an unknown recipients by nullifying the coin and making a new one that follows a correct format. Here we only nullify the unknown coin (called a ticket), which acts as casting a vote.

The implementation relies heavily on the poseidon hash function,
which has a circuit optimized for zk-snark construction.

## Preliminaries

Before the start you should run 
```powershell
yarn
```
and download a one-time trusted setup [here](https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau) into the root folder, then run 
```sh
sh generate-setup.sh
``` 
Then paste into `.env` file two private keys that will be used to call the contract - one will be a voter address, the other will be used to anonymously spend the ticket. E.g.
```env
PRIVATE_KEY1=0x82269c48441421acbc608d61d43861f9c55532a39c2829bb29559b9be8f66938
PRIVATE_KEY2=0xca64e5b7a2d468e85207631ffee95fc0acc87ac653b4ffe39312b1631a928cfb
```

## Voting flow

After the voting contract is deployed, the voting flow is as follows:
- a user registers an election by specifying the election id, eligible voter addresses, and the voting period;
- before the voting period, voters register tickets to the smart contract;
- during the voting period, voters vote for an option by spending their tickets in a zero-knowledge way, which is done by sending a zk-snark to the contract;
- after the voting period, the winner is considered fixed.

You can use hardhat's cli app to do the steps above.
First, you can deploy the contract as
```powershell
yarn hardhat deploy 
    --network costwo
```
which outputs the deployed contract's address.
Then you can register an election with
```powershell
yarn hardhat election
    --election-id <number>
    --voters <address[]> 
    --start <unix>
    --end <unix>
    --contract <string>
    --network <costwo | fuji>
```
Ticket registering is then done via
```powershell
yarn hardhat register
    --secret <number>
    --option <number>
    --election-id <number>
    --contract <string>
    --network <costwo | fuji>
```
Finally casting the vote can be done with
```powershell
yarn hardhat vote
    --secret <number>
    --option <number>
    --election-id <number>
    --contract <string>
    --network <costwo | fuji>
```
This fetches the logged contract address, secret value, ticket, its serial and from the contract all registered tickets. Then it uses those values to construct a zk-snark and sends it to the contract. After the voting period you can fetch the winner
```powershell
yarn hardhat winner
    --election-id <number>
    --contract <string>
    --network costwo
```

> **Note:**
> For the theory to work, the contract should calculate the Merkle root of a registered tickets' Merkle tree (of some fixed depth). To avoid gas fees, this is not done, and each election tracks voting at each Merkle root passed along the vote. So, winners are indexed by election id and the Merkle root.

For easier usage, the app constantly logs your previous cli parameters and uses them in further cli runs, as seen in [examples](#examples).

## Raw Contract Usage

## Registering an election
An election is registered by calling `registerElection` and passing the parameters:
- `electionId`: a 256-bit number that identifies your election (should be random to not collide with any other ids);
- `voters`: an array of eligible voter addresses;
- `start`: start of the voting period (in unix time);
- `end`: end of the voting period (in unix time).

### Registering a ticket
Before registering a ticket you should pick a secret 256-bit number and your voting option. The ticket is registered before the start of the voting period, by calling `registerTicket` with the following parameters:
- `electionId`: id of your election;
- `ticket`: the poseidon commitment of your secret and vote option `poseidon(secret, option)`.

This adds your ticket to the list of all registered tickets.

> **Warn:** 
> Ticket can be registered only from eligible addresses and only once. They can't be deleted or replaced.

### Spending the ticket
Once the voting period starts, you can spend your ticket by calling `spendTicket` with the following parameters:
- `electionId`: id of your election;
- `merkleRoot`: the root of the Merkle tree (with depth 21), constructed from the registered tickets array;
- `option`: your voting option;
- `serial`: the ticket's serial number, calculated as `poseidon(secret, ticket);
- `proof`: zk-snark that can be produced from the values:
    - `option`,
    - `serial`,
    - `merkleRoot`,
    - `ticket`,
    - `secret`,
    - `merkleProof`,

    and it says "the `merkleProof` is a valid proof of `ticket` being inside a Merkle tree with root `merkleRoot` and it holds that `ticket = poseidon(secret, option)` and `serial = poseidon(secret, ticket)`".

You can produce the zk-snark with snarkjs, as
```typescript
import { createProof, getSoliditySnark } from "./tsutil/snark"
const zksnark = await createProof({
    option: option,
    serial: serial,
    root: merkleRoot,
    ticket: ticket,
    secret: secret,
    proof: merkleProof
})
const solproof = await getSoliditySnark(
    zksnark.proof, zksnark.publicSignals
)
```

> **Note:** 
> The Merkle tree uses poseidon hash function, the tools to produce tree, proof and root are included in `tsutil/merkleTree.ts`.

## Examples

Here it is shown how to use the cli app's storage functionality to make voting easier on Flare's costwo (coston2) network.

```powershell
yarn hardhat deploy 
    --network costwo
```
```powershell
yarn hardhat election
    --voters "0x7d5e4A9CFD6068Fc282d86CBe342a4517eD69422 0x409E6415f3f8656e093F8a5Fed48872474231C30"
    --duration 300
    --network costwo
```
```powershell
yarn hardhat register
    --option 1
    --network costwo
```
Wait for the voting period to start and then run
```powershell
yarn hardhat vote
    --network costwo
```
Wait for the voting period to end and then call
```powershell
yarn hardhat winner 
    --network costwo
```
It should output 1.

> **Note:**
> Values are generated / stored automatically. 
Also duration parameter sets the election start to `now + duration` and election end to `now + 2 duration`.

## Testing
To test, run
```powershell
yarn test tests/*
```

## To-do
- [ ] Find a way to hardcode poseidon constants in the `AnonymousVoting` contract and use them to initialise `Poseidon`,
- [x] Find a way for `AnonymousVoting` to inherit `TicketSpender` without `verifyProof` blocking the following code execution.
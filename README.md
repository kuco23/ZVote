# ZVote

This is a simple implementation of a decentralized anonymous voting system, based on the main idea of ZCash, using zk-snarks.
The voting system requires voters to be predefined and makes the voting results publicly known at all times without revealing voter choices.

> **Note:**
> ZCash implements a decentralized anonymous currency by making use of zk-snarks to transfer an unknown coin to an unknown recipients by nullifying the coin and making a new one that follows a correct format. Here we only nullify the unknown coin (called a ticket), which acts as casting a vote.

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
Then paste into `.env` file the private keys that will be used to sign transactions. There should be at least two - one to register a ticket and another that can spend that ticket anonymously. Ideally the account that spends the ticket should not be connected to the voter in any way.
```txt
PRIVATE_KEYS = ["0x82269c48441421acbc608d61d43861f9c55532a39c2829bb29559b9be8f66938","0xca64e5b7a2d468e85207631ffee95fc0acc87ac653b4ffe39312b1631a928cfb"]
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
    --network <costwo | fuji>
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
    --signer <number>
    --network <costwo | fuji>
```
Ticket registering is then done via
```powershell
yarn hardhat register
    --secret <number>
    --option <number>
    --election-id <number>
    --contract <string>
    --signer <number>
    --network <costwo | fuji>
```
Finally casting the vote can be done with
```powershell
yarn hardhat vote
    --secret <number>
    --option <number>
    --election-id <number>
    --contract <string>
    --signer <number>
    --network <costwo | fuji>
```
This fetches the logged contract address, secret value, ticket, its serial and from the contract all registered tickets. Then it uses those values to construct a zk-snark and sends it to the contract. After the voting period ends, you can fetch the winner with
```powershell
yarn hardhat winner
    --election-id <number>
    --contract <string>
    --signer <number>
    --network <costwo | fuji>
```

> **Note:**
> For the theory to work, the contract should calculate the Merkle root of a registered tickets' Merkle tree (of some fixed depth). To avoid gas fees, this is not done, and each election tracks voting at each Merkle root passed along the vote. So, winners are indexed by election id and the Merkle root.

To see a concreate example of the usage, see [examples](#examples).

## Raw Contract Usage

### Registering an election
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
> Ticket can be registered only from eligible addresses and each address can register only one ticket. Once registered they can't be deleted or replaced.

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
The Merkle tree uses poseidon hash function, the tools to produce tree, proof and root are included in `tsutil/merkleTree.ts`.

## Examples

Here is an example of voting on fuji (Avalanche testnet) network, using the private keys from our previous `.env` and the contract deployed on fuji at [`0xa66F33E726A5E8dC6E42e94079794eD879279708`](https://testnet.avascan.info/blockchain/all/address/0xa66F33E726A5E8dC6E42e94079794eD879279708/transactions).

```powershell
yarn hardhat election \
    --election-id 513 \
    --start now+60 \
    --end now+180 \
    --voters "0x7d5e4A9CFD6068Fc282d86CBe342a4517eD69422 0x409E6415f3f8656e093F8a5Fed48872474231C30" \
    --contract 0xa66F33E726A5E8dC6E42e94079794eD879279708 \
    --signer 0 \
    --network fuji
```
```powershell
yarn hardhat register \
    --option 23 \
    --secret "11054812941044457585219289267184674311117003953631" \
    --election-id 513 \
    --contract 0xa66F33E726A5E8dC6E42e94079794eD879279708 \
    --signer 0 \
    --network fuji 
```
```powershell
sleep 60
```
```powershell
yarn hardhat vote \
    --option 23 \
    --secret "11054812941044457585219289267184674311117003953631" \
    --election-id 513 \
    --contract 0xa66F33E726A5E8dC6E42e94079794eD879279708 \
    --signer 1 \
    --network fuji
```
```powershell
sleep 120
```
```powershell
yarn hardhat winner \
    --election-id 513 \
    --contract 0xa66F33E726A5E8dC6E42e94079794eD879279708 \
    --signer 1 \
    --network fuji
```
It should output `winner is 23`.

> **Note:**
> Values `election-id` and `secret` can be ommited when registering a new election and ticket, as they are then generated randomly and outputed in the terminal.

## Testing
To test only the anonymous voting contract and its dependencies, run
```powershell
yarn test tests/anonymous_voting.test.ts
yarn test tests/ticket_spender.test.ts
```

## To-do
- [ ] Find a way to hardcode poseidon constants in the `AnonymousVoting` contract and use them to initialise `Poseidon`,
- [x] Find a way for `AnonymousVoting` to inherit `TicketSpender` without `verifyProof` blocking the following code execution.
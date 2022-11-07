## Merkle Tree Circom
This is a small implementation of a merkle proof in circom, 
along with a compatible implementation of merkle proofs in python.
The code implements two hash functions - sha256 and poseidon,
with the latter being specifically designed to be snark friendly.

## Producing circom input
Usually you start with a list of hashes that hide (or represent) some data
and want to generate a merkle proof of a chosen hash belonging to that list.
To do this with circom, you need to generate the `input.json` file that 
logs the (later private) proof along with the (always public) merkle root.

The tools for generating this stuff are inside `merkle_proof.py` file and
producing `input.json` is done as follows:
```python
from poseidon.poseidon import poseidon

# constants
TREE_DEPTH = 21 # can save arrays of length up to 2^20
HASH_FUN = poseidon # hashing function applied used by merkle tree

# define secret data and deal publicly with hashes
data = [123124152, 12312241, 518394148, 14191, 141323500091]
hashed_data = [HASH_FUN(d) for d in data]

# proving HASH_FUN(1) is in the merkle_tree
merkle_tree = merkleTree(hashed_data, TREE_DEPTH, HASH_FUN)
merkle_proof = merkleProof(merkle_tree, 1)
merkle_root = merkle_tree[0][0]

# check that the proof is ok
verifyMerkleProof(
    hashed_data[1], merkle_proof, merkle_root, HASH_FUN)

# generate input.json that is used by circom
print(generateCircomInputPoseidon(
    hashed_data[1], merkle_proof, merkle_root))
```

## Producing the proof
Once the `input.json` file is acquired, the rest is taken care of by
circom and snarkjs, as dictated [here](https://github.com/iden3/snarkjs#guide).
Note that when using sha256 the zero-knowledge proof calculation is very intense
(might not go through).

## TO-DO
- [ ] Check that circom merkle tree inputs are binary arrays,
- [x] Enable Python to produce Merkle proofs for arrays of any size.
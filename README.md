## Merkle Tree Circom
This is a small implementation of a merkle proof in circom, 
along with a compatible implementation of merkle proofs in python.

## Producing circom input
Usually you start with a list of hashes that hide (or represent) some data
and want to generate a merkle proof of a chosen hash belonging to that list.
To do this with circom, you need to generate the `input.json` file that 
logs the (later private) proof along with the (always public) merkle root.

The tools for generating this stuff are inside `merkle_proof.py` file and
producing `input.json` is done as follows:
```python
# has to be of power 2 length
data = [
    'a', 'b', 'c', 'd',
    'e', 'f', 'g', 'h'
]
hashed_data = [sha256g(d) for d in data]

# proving sha256g('b') is in sha256g(data)
merkle_tree = getMerkleTree(hashed_data)
merkle_proof = getMerkleProof(merkle_tree, 1)
merkle_root = merkle_tree[0][0]
verifyMerkleProof(hashed_data[1], merkle_proof, merkle_root)

# generating the circom's input.json
print(generateCircomInput(hashed_data[1], merkle_proof, merkle_root))
```

## Producing the proof
Once the `input.json` file is acquired, the rest is taken care of by
circom and snarkjs, as dictated [here](https://github.com/iden3/snarkjs#guide).
Note that the calculation of the zero-knowledge proof is very intense.

## TO-DO
- [ ] Check that circom inputs are binary arrays,
- [ ] Enable Python to produce Merkle proofs for arrays of any size.
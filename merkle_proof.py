from math import log
from functools import reduce
from collections import deque
from json import dumps

def getMerkleTree(fun, data):
    tree_depth = int(log(len(data), 2)) + 1
    merkle_tree = deque([data])
    for _ in range(tree_depth-1):
        level = merkle_tree[0]
        merkle_tree.appendleft([
            fun(level[2*j], level[2*j+1])
            for j in range(len(level) // 2)
        ])
    return merkle_tree


def getMerkleProof(merkle_tree, i):
    tree_depth = len(merkle_tree)
    merkle_proof = [None] * (tree_depth - 1)
    for j in reversed(range(1, tree_depth)):
        d = 1 if i % 2 == 0 else -1
        l, r = merkle_tree[j][i], merkle_tree[j][i+d]
        merkle_proof[j-1] = (l, r) if d == 1 else (r, l)
        i //= 2
    return merkle_proof


def verifyMerkleProof(fun, leaf, merkle_proof, merkle_root):
    assert leaf in merkle_proof[-1]
    for i in reversed(range(len(merkle_proof))):
        h1, h2 = merkle_proof[i]
        hsh = fun(h1, h2)
        if i > 0:
            assert (hsh in merkle_proof[i-1]), (
                f"hashing at level {i} doesn't produce"
                f"a hash at level {i-1}")
        else:
            assert (hsh == merkle_root), (
                "end hash doesn't mash the merkle root")


def generateCircomInputPoseidon(leaf, merkle_proof, merkle_root):
    return dumps({
        'leaf': str(leaf),
        'proof': [[str(node) for node in pair] for pair in merkle_proof],
        'root': str(merkle_root)
    })

def generateCircomInputSha256(leaf, merkle_proof, merkle_root):
    input_json = {}
    input_json['leaf'] = list(leaf)
    input_json['proof'] = [
        [list(h) for h in p] for p in merkle_proof
    ]
    input_json['root'] = list(merkle_root)
    return dumps(input_json)

if __name__ == '__main__':

    from sha256.sha256 import sha256
    from poseidon.poseidon import poseidon

    fun_sha = lambda *ins: reduce(str.__add__, ins, '')
    fun_pos = poseidon

    # length has to be power of 2
    data = list(range(8))
    hashed_data = [poseidon(d) for d in data]

    # proving poseidon(1) is in the merkle_tree
    merkle_tree = getMerkleTree(fun_pos, hashed_data)
    merkle_proof = getMerkleProof(merkle_tree, 1)
    merkle_root = merkle_tree[0][0]
    verifyMerkleProof(
        fun_pos, hashed_data[1], merkle_proof, merkle_root)

    print(generateCircomInputPoseidon(
        hashed_data[1], merkle_proof, merkle_root))

from math import log
from collections import deque
from json import dumps
from sha256 import sha256g, sha256


def getMerkleTree(data):
    tree_depth = int(log(len(data), 2)) + 1
    merkle_tree = deque([data])
    for _ in range(tree_depth-1):
        level = merkle_tree[0]
        merkle_tree.appendleft([
            sha256(level[2*j] + level[2*j+1])
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


def verifyMerkleProof(leaf, merkle_proof, merkle_root):
    assert leaf in merkle_proof[-1]
    for i in reversed(range(len(merkle_proof))):
        h1, h2 = merkle_proof[i]
        sha = sha256(h1 + h2)
        if i > 0:
            assert (sha in merkle_proof[i-1]), (
                f"hashing at level {i} doesn't produce"
                f"a hash at level {i-1}")
        else:
            assert (sha == merkle_root), (
                "end hash doesn't mash the merkle root")


def generateCircomInput(leaf, merkle_proof, merkle_root):
    input_json = {}
    input_json['leaf'] = list(leaf)
    input_json['proof'] = [
        [list(h) for h in p] for p in merkle_proof
    ]
    input_json['root'] = list(merkle_root)
    return dumps(input_json)


if __name__ == '__main__':

    # has to be power of 2
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

    print(generateCircomInput(
        hashed_data[1], merkle_proof, merkle_root))

from functools import reduce
from json import dumps


def merkleTree(data, depth, fun):
    ndata = len(data)

    merkle_tree = [dict() for _ in range(depth)]
    for i in range(ndata):
        merkle_tree[depth-1][i] = data[i]

    for i in reversed(range(1, depth)):
        lim = ndata // 2
        if ndata % 2 != 0: lim += 1
        for j in range(lim):
            if 2 * j + 1 == ndata: 
                merkle_tree[i][2 *j + 1] = merkle_tree[i][2*j]
            merkle_tree[i-1][j] = fun(
                merkle_tree[i][2*j], 
                merkle_tree[i][2*j+1]
            )
        ndata = lim

    return merkle_tree

def merkleProof(merkle_tree, i):
    tree_depth = len(merkle_tree)
    merkle_proof = [None] * (tree_depth - 1)
    for j in reversed(range(1, tree_depth)):
        d = 1 if i % 2 == 0 else -1
        l, r = merkle_tree[j][i], merkle_tree[j][i+d]
        merkle_proof[j-1] = (l, r) if d == 1 else (r, l)
        i //= 2
    return merkle_proof


def verifyMerkleProof(leaf, merkle_proof, merkle_root, fun):
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
                "end hash doesn't match the merkle root")


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

    from sha256.sha256 import sha256, bitarray
    from poseidon.poseidon import poseidon

    fun_sha = lambda *ins: sha256(reduce(bitarray.__add__, ins))
    fun_pos = poseidon

    TREE_DEPTH = 21
    HASH_FUN = fun_pos
    
    data = list(range(8))
    hashed_data = [HASH_FUN(d) for d in data]

    # proving poseidon(1) is in the merkle_tree
    merkle_tree = merkleTree(hashed_data, TREE_DEPTH, HASH_FUN)
    merkle_proof = merkleProof(merkle_tree, 1)
    merkle_root = merkle_tree[0][0]
    verifyMerkleProof(
        hashed_data[1], merkle_proof, merkle_root, HASH_FUN)

    print(generateCircomInputPoseidon(
        hashed_data[1], merkle_proof, merkle_root))
    
    print(hashed_data[0])

    print(poseidon(0,1))
from json import dumps
from ..poseidon.poseidon import poseidon

class MerkleTree:
    
    def __init__(self, depth):
        self.tree = [dict() for _ in range(depth)]
        self.depth = depth
        self._size = 0
    
    def __len__(self):
        return self._size
    
    def root(self):
        assert self._size > 0, "tree is empty"
        return self.tree[0][0]
    
    def addElement(self, x):
        self.tree[self.depth-1][self._size] = x
        index = self._size
        for d in reversed(range(1, self.depth)):
            if (index % 2 == 0):
                self.tree[d][index+1] = self.tree[d][index]
            index //= 2
            self.tree[d-1][index] = poseidon(
                self.tree[d][2*index], 
                self.tree[d][2*index+1]
            )
        self._size += 1
    
    def proof(self, i):
        assert 0 <= i < self._size
        merkle_proof = [None] * (self.depth - 1)
        for j in reversed(range(1, self.depth)):
            d = 1 if i % 2 == 0 else -1
            l, r = self.tree[j][i], self.tree[j][i+d]
            merkle_proof[j-1] = (l, r) if d == 1 else (r, l)
            i //= 2
        return merkle_proof
    
    @staticmethod
    def verifyProof(leaf, merkle_proof, merkle_root):
        assert leaf in merkle_proof[-1]
        for i in reversed(range(len(merkle_proof))):
            hsh = poseidon(*merkle_proof[i])
            if i > 0:
                assert (hsh in merkle_proof[i-1]), (
                    f"hashing at level {i} doesn't produce"
                    f"a hash at level {i-1}")
            else:
                assert (hsh == merkle_root), (
                    "end hash doesn't match the merkle root")
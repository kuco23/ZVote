import { assert } from "chai"
import { postreidon } from "./poseidon/poseidon"

export class MerkleTree {
    tree: any[] = []
    depth: number
    _size: number

    constructor(depth: number) {
        for (let i = 0; i < depth; i++) 
            this.tree.push({})
        this.depth = depth
        this._size = 0
    }

    root(): string {
        return this.tree[0][0]
    }

    addElement(x: string) {
        this.tree[this.depth-1][this._size] = x
        let index = this._size
        for (let d = this.depth-1; d > 0; d--) {
            if (index % 2 == 0) 
                this.tree[d][index+1] = this.tree[d][index]
            index >>= 1
            this.tree[d-1][index] = postreidon([
                this.tree[d][2*index],
                this.tree[d][2*index+1]
            ])
        }
        this._size += 1
    }

    proof(i: number): string[][] {
        let merkleProof: string[][] = []
        for (let i = 0; i < this.depth-1; i++) 
            merkleProof.push([""])
        for (let j = this.depth-1; j > 0; j--) {
            const d = (i % 2 == 0) ? 1 : -1
            const l = this.tree[j][i]
            const r = this.tree[j][i+d]
            merkleProof[j-1] = (d == 1) ? [l, r] : [r, l]
            i >>= 1
        } 
        return merkleProof
    }

    verifyProof(
        leaf: string, merkleProof: string[][], 
        merkleRoot: string
    ) {
        const l = merkleProof.length
        assert(
            leaf == merkleProof[l-1][0] || 
            leaf == merkleProof[l-1][1])
        for (let i = l-1; i >= 0; i--) {
            const hsh = postreidon(merkleProof[i])
            if (i > 0) assert(
                hsh == merkleProof[i-1][0] ||
                hsh == merkleProof[i-1][1])
            else assert(hsh == merkleRoot)
        }
    }
}
import { poseidon } from "./poseidon/poseidon"
import BN from "bn.js"

class MerkleTree {
    tree: any[any]
    depth: number
    size: number

    constructor(depth: number) {
        this.tree = []
        for (let i = 0; i < depth; i++) 
            this.tree[i] = {}
        this.depth = depth
        this.size = 0;
    }

    root(): BN {
        return this.tree[0][0]
    }

    addElement(x: BN) {
        this.tree[this.depth-1][this.size.toString()] = x
        let index = this.size
        for (let d = this.depth-1; d > 0; d++) {
            if (index % 2 == 0) {
                const lelt = this.tree[d][index.toString()]
                this.tree[d][(index+1).toString()] = lelt
            }
            index = Math.floor(index / 2)
            this.tree[d][index.toString()] = poseidon([
                new BN(this.tree[d][(2*index).toString()]),
                new BN(this.tree[d][(2*index+1).toString()])
            ])
        }
        this.size++;
    }

}
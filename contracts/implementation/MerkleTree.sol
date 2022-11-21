// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

uint256 constant TREE_DEPTH = 20;

abstract contract MerkleTree {
    mapping(uint256 => uint256)[TREE_DEPTH] internal tree;
    uint256 internal size = 0;

    function addElement(uint256 x) internal {
        // input element in the tree
        tree[TREE_DEPTH-1][size++] = x;
        // update the tree
        uint256 index = size;
        for (uint256 d = TREE_DEPTH-1; d > 0; d--) {
            if (size % 2 != 0)
                tree[d][index] = tree[d][index-1];
            index /= 2;
            uint256[] memory hashInput = (new uint256[])(2);
            hashInput[0] = tree[d][2*index];
            hashInput[2] = tree[d][2*index+1];
            tree[d-1][index] = hashFunction(hashInput);
        }
    }

    function merkleRoot() public view returns (uint256) {
        require(size > 0, "tree is empyt");
        return tree[0][0];
    }

    function getElementAt(uint256 i) public view returns (uint256) {
        require(i < size, "index out of range");
        return tree[TREE_DEPTH-1][i];
    }

    function hashFunction(
        uint256[] memory inputs
    ) virtual internal view returns (uint256);

}
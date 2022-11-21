// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "./Poseidon.sol";
import "./MerkleTree.sol";
import "./MerkleProofVerifier.sol";

contract App is Poseidon, MerkleTree, PlonkVerifier {
    address public owner;
    uint256[] internal nullifiers;

    constructor(
        uint256 _p, 
        uint256 _t,
        uint256 _nRoundsF,
        uint256 _nRoundsP,
        uint256[] memory _C,
        uint256[] memory _S,
        uint256[][] memory _M,
        uint256[][] memory _P
    ) Poseidon(
        _p, _t, _nRoundsF, _nRoundsP, 
        _C, _S, _M, _P
    ) { 
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function hashFunction(
        uint256[] memory inputs
    ) override internal view returns (uint256) {
        return poseidon(inputs);
    }
    
    function addTrustedEntity(uint256 x) external onlyOwner {
        addElement(x);
    }

    function proveInclusion(
        bytes memory proof, uint256 x
    ) external view {
        uint256[] memory pubSignals = new uint256[](1);
        pubSignals[0] = x;
        verifyProof(proof, pubSignals);
    }
}
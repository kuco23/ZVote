// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "./PlonkVerifier.sol";

contract TicketSpender is PlonkVerifier {
    
    function verifyTicketSpending(
        bytes memory proof, 
        uint256 serial, uint256 root
    ) public view returns (bool) {
        uint256[] memory pubSignals = new uint256[](2);
        pubSignals[0] = serial;
        pubSignals[1] = root;
        return verifyProof(proof, pubSignals);
    }
}
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "./PlonkVerifier.sol";

contract TicketSpender is PlonkVerifier {

    function verifyTicketSpending(
        uint256 option, uint256 serial, uint256 root,
        bytes memory proof
    ) public view returns (bool) {
        uint256[] memory pubSignals = new uint256[](3);
        pubSignals[0] = option;
        pubSignals[1] = serial;
        pubSignals[2] = root;
        return verifyProof(proof, pubSignals);
    }
}
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "../implementation/TicketSpender.sol";

contract TicketSpenderTester is TicketSpender {
    
    function verifyTicketSpendingPub(
        bytes memory proof, 
        uint256 serial, uint256 root
    ) public view returns (bool) {
        return verifyTicketSpending(proof, serial, root);
    }
}
pragma circom 2.0.0;

include "../circomlib/circuits/poseidon.circom";
include "./merkle_proof.circom";

template TicketSpender(K) {
    signal input option;
    signal input serial;
    signal input root;
    signal input ticket;
    signal input secret;
    signal input proof[K][2];

    // prove ticket is inside Merkle Tree
    component merkleProof = MerkleProof(K);
    merkleProof.leaf <== ticket;
    merkleProof.root <== root;
    for (var i = 0; i < K; i++) {
        merkleProof.proof[i][0] <== proof[i][0];
        merkleProof.proof[i][1] <== proof[i][1];
    }

    // prove we can unlock the ticket
    component poseidon1 = Poseidon(2);
    poseidon1.inputs[0] <== secret;
    poseidon1.inputs[1] <== option;
    poseidon1.out === ticket;

    // prove serial uniquely identifies the ticket
    component poseidon2 = Poseidon(2);
    poseidon2.inputs[0] <== secret;
    poseidon2.inputs[1] <== ticket;
    poseidon2.out === serial;
}

component main {public [option, serial, root]} = TicketSpender(20);
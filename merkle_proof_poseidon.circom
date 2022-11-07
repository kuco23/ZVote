pragma circom 2.0.0;

include "./circomlib/circuits/poseidon.circom";

template EqualToOneOf() {
    signal input test;
    signal input pos1;
    signal input pos2;
	(test - pos1) * (test - pos2) === 0;
}

template MerkleProof (K) {
	signal input leaf;
	signal input proof[K][2];
	signal input root;

	// check that leaf is equal to either 
	// left or right bottom proof element
	component leafok = EqualToOneOf();
	leafok.test <== leaf;
	leafok.pos1 <== proof[K-1][0];
	leafok.pos2 <== proof[K-1][1];
	
	// verify the merkle proof tree hashing structure (K > 0)
	component poseidon[K];
	component proofok[K-1];
	for (var k = K-1; k >= 0; k--) {
		poseidon[k] = Poseidon(2);
		poseidon[k].inputs[0] <== proof[k][0];
		poseidon[k].inputs[1] <== proof[k][1];
		if (k > 0) {
			proofok[k-1] = EqualToOneOf();
			proofok[k-1].test <== poseidon[k].out;
			proofok[k-1].pos1 <== proof[k-1][0];
			proofok[k-1].pos2 <== proof[k-1][1];
		}
	}
	
	// verify the last hash matches the merkle root
	poseidon[0].out === root;
}

component main {public [root]} = MerkleProof(20);
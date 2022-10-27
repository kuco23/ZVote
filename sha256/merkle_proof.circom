pragma circom 2.0.0;

include "../circomlib/circuits/sha256/sha256.circom";
include "../circomlib/circuits/gates.circom";
include "../circomlib/circuits/gates.circom";

template EqualToOneOf(N) {
    signal input test[N];
    signal input pos1[N];
    signal input pos2[N];

    component mand1 = MultiAND(N);
	component mand2 = MultiAND(N);
	for (var i = 0; i < N; i++) {
		mand1.in[i] <== 1 - test[i] + pos1[i];
		mand2.in[i] <== 1 - test[i] + pos2[i];
	}
	component or = OR();
	or.a <== mand1.out;
	or.b <== mand2.out;
	or.out === 1;
}

template MerkleProof (K) {
	var N = 256;

	signal input leaf[N];
	signal input proof[K][2][N];
	signal input root[N];

	// should also check that all of the 
	// inputs are bit arrays

	// check that leaf is equal to either 
	// left or right bottom proof element
	component leafok = EqualToOneOf(N);
	for (var n = 0; n < N; n++) {
		leafok.test[n] <== leaf[n];
		leafok.pos1[n] <== proof[K-1][0][n];
		leafok.pos2[n] <== proof[K-1][1][n];
	}

	// verify the merkle proof tree hashing structure (K > 0)
	component sha[K];
	component eto[K-1];
	for (var k = K-1; k >= 0; k--) {
		sha[k] = Sha256(2 * N);
		for (var n = 0; n < N; n++) {
			sha[k].in[n] <== proof[k][0][n];
			sha[k].in[N + n] <== proof[k][1][n];
		}
		if (k > 0) {
			eto[k-1] = EqualToOneOf(N);
			for (var n = 0; n < N; n++) {
				eto[k-1].test[n] <== sha[k].out[n];
				eto[k-1].pos1[n] <== proof[k-1][0][n];
				eto[k-1].pos2[n] <== proof[k-1][1][n];
			}
		}
	}
	
	// verify the last hash matches the merkle root
	for (var n = 0; n < N; n++)
		sha[0].out[n] === root[n];
}

component main {public [root]} = MerkleProof(3);
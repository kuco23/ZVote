pragma circom 2.0.0;

include "../circomlib/circuits/gates.circom";

template EqualToOne(N) {
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
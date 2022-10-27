include "../circomlib/circuits/poseidon.circom";

template Poseidon2(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    component ps = Poseidon(nInputs);
    for (var i=0; i<nInputs; i++) {
        ps.inputs[i] <== inputs[i];
    }
    out <== ps.out;
    log(out);
}

component main {public [inputs]} = Poseidon2(2);
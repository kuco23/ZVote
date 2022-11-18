circuitName=merkle_proof_poseidon
powersoftau=powersOfTau28_hez_final_16

circom $circuitName.circom --r1cs --wasm &&
node ${circuitName}_js/generate_witness.js ${circuitName}_js/$circuitName.wasm input.json witness.wtns
contractName=MerkleProofVerifier
circuitName=merkle_proof_poseidon
powersoftau=powersOfTau28_hez_final_16

circom $circuitName.circom --r1cs --wasm &&
node ${circuitName}_js/generate_witness.js ${circuitName}_js/$circuitName.wasm input.json witness.wtns &&
snarkjs plonk setup $circuitName.r1cs $powersoftau.ptau ${circuitName}_final.zkey &&
snarkjs zkey export verificationkey ${circuitName}_final.zkey verification_key.json &&
snarkjs plonk prove ${circuitName}_final.zkey witness.wtns proof.json public.json &&
snarkjs plonk verify verification_key.json public.json proof.json &&
snarkjs zkey export solidityverifier ${circuitName}_final.zkey contracts/${contractName}.sol
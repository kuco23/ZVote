circuit_name=ticket_spender

mkdir -p snark_data &&
circom circuits/$circuit_name.circom --wasm -o snark_data &&
node snark_data/${circuit_name}_js/generate_witness.js \
    snark_data/${circuit_name}_js/$circuit_name.wasm \
    snark_data/input.json \
    snark_data/witness.wtns \
&&
snarkjs plonk prove \
    snark_data/${circuit_name}_final.zkey \
    snark_data/witness.wtns \
    snark_data/proof.json \
    snark_data/public.json \
&&
snarkjs plonk verify \
    snark_data/verification_key.json \
    snark_data/public.json \
    snark_data/proof.json \
&&
snarkjs zkey export soliditycalldata \
    snark_data/public.json \
    snark_data/proof.json

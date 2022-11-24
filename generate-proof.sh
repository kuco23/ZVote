circuit_name=ticket_spender
data_folder=snark_data

mkdir -p $data_folder &&
circom circuits/$circuit_name.circom --wasm -o $data_folder &&
node $data_folder/${circuit_name}_js/generate_witness.js \
    $data_folder/${circuit_name}_js/$circuit_name.wasm \
    input.json $data_folder/witness.wtns \
&&
snarkjs plonk prove \
    $data_folder/${circuit_name}_final.zkey \
    $data_folder/witness.wtns \
    $data_folder/proof.json \
    $data_folder/public.json \
&&
snarkjs plonk verify \
    $data_folder/verification_key.json \
    $data_folder/public.json \
    $data_folder/proof.json
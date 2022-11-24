circuit_name=ticket_spender
powersoftau=powersOfTau28_hez_final_16
data_folder=snark_data

mkdir -p $data_folder &&
circom circuits/$circuit_name.circom  --r1cs -o $data_folder &&
snarkjs plonk setup \
    $data_folder/$circuit_name.r1cs \
    $powersoftau.ptau \
    $data_folder/${circuit_name}_final.zkey \
&&
snarkjs zkey export verificationkey \
    $data_folder/${circuit_name}_final.zkey \
    $data_folder/verification_key.json

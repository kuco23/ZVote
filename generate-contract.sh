circuit_name=ticket_spender
contract_name=PlonkVerifier

snarkjs zkesv \
    snark_data/${circuit_name}_final.zkey \
    contracts/implementation/${contract_name}.sol
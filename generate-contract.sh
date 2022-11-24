circuit_name=ticket_spender
contract_name=TicketSpenderVerifier
data_folder=snark_data

snarkjs zkey export solidityverifier \
    $data_folder/${circuit_name}_final.zkey \
    contracts/implementation/${contract_name}.sol
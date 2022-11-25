from random import getrandbits
from json import dump
from web3 import Web3
from solc import compile_standard

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

def genPrivateKey():
    return getrandbits(255)

def addressFromPrivateKey(privateKey):
    return w3.eth.account.from_key(privateKey).address

def deployContract(path): 
    with open(file, 'r') as contract_sol:
        contract = compile_standard(
            {
                "language": "Solidity",
                "sources": {
                    "SimpleStorage.sol": {
                        "content": contract_sol
                    }
                },
                "settings": {
                    "outputSelection": {
                        "*": {
                            "*": [
                                "abi", 
                                "metadata", 
                                "evm.bytecode", 
                                "evm.bytecode.sourceMap"
                            ]
                        }
                    }
                },
            },
            solc_version="0.8.9",
        )
    with open("compiled_code.json", "w") as file:
        dump(contract, file)


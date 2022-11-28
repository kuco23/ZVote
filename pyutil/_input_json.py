from json import dumps
from .poseidon import poseidon
from ._merkle_tree import MerkleTree

def getWitnessArguments(option, secret, tickets, tree_depth):
    # get the ticket and its serial number
    ticket = poseidon(secret, option)
    serial = poseidon(secret, ticket)

    # construct the Merkle tree
    merkle_tree = MerkleTree(tree_depth)
    for x in tickets: merkle_tree.addElement(x)

    # get Merkle proof of ticket in tickets
    ticket_idx = tickets.index(ticket)
    merkle_proof = merkle_tree.proof(ticket_idx)

    # verify the Merkle proof
    merkle_root = merkle_tree.root()
    merkle_tree.verifyProof(ticket, merkle_proof, merkle_root)

    return {
        "option": option,
        "serial": serial,
        "root": merkle_root,
        "ticket": ticket,
        "secret": secret,
        "proof": merkle_proof
    }

def generateCircomInput(option, serial, root, ticket, secret, proof):
    return dumps({
        "option": str(option),
        "serial": str(serial),
        "root": str(root),
        "ticket": str(ticket),
        "secret": str(secret),
        "proof": [[str(node) for node in pair] for pair in proof],
    })

def createCircomInputJson(option, serial, root, ticket, secret, proof):
    open("snark_data/input.json", "a").close()
    with open("snark_data/input.json", "w") as inpt:
        inpt.write(generateCircomInput(
            option, serial, root, ticket, secret, proof
        ))

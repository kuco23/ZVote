from pyutil import (
    poseidon, getWitnessArguments,
    createCircomInputJson
)

TREE_DEPTH = 21

# define personal input values
option = 1 # must be int
secret = 12345678910

# construct the voting ticket
ticket = poseidon(secret, option)

# fetch all voting tickets from by making
# a view call to the smart contract
tickets = [111, 222, 333, ticket, 444, 555]

# get arguments for witness generation
witness_args = getWitnessArguments(
    option, secret, tickets, TREE_DEPTH)

# generate circom input
createCircomInputJson(**witness_args)
from json import dumps
from poseidon.poseidon import poseidon
from pyutil import createCircomInputJson

if __name__ == '__main__':
    from random import getrandbits
    
    TREE_DEPTH = 21

    # define input values
    secret = 12345678910
    ticket = poseidon(secret, secret)
    tickets = tickets = [111, 222, 333, ticket, 444, 555]

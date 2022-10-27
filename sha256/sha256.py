from copy import deepcopy
from functools import reduce
from bitarray import bitarray, util

K = [
    '0x428a2f98', '0x71374491', '0xb5c0fbcf', '0xe9b5dba5',
    '0x3956c25b', '0x59f111f1', '0x923f82a4', '0xab1c5ed5',
    '0xd807aa98', '0x12835b01', '0x243185be', '0x550c7dc3',
    '0x72be5d74', '0x80deb1fe', '0x9bdc06a7', '0xc19bf174',
    '0xe49b69c1', '0xefbe4786', '0x0fc19dc6', '0x240ca1cc',
    '0x2de92c6f', '0x4a7484aa', '0x5cb0a9dc', '0x76f988da',
    '0x983e5152', '0xa831c66d', '0xb00327c8', '0xbf597fc7',
    '0xc6e00bf3', '0xd5a79147', '0x06ca6351', '0x14292967',
    '0x27b70a85', '0x2e1b2138', '0x4d2c6dfc', '0x53380d13',
    '0x650a7354', '0x766a0abb', '0x81c2c92e', '0x92722c85',
    '0xa2bfe8a1', '0xa81a664b', '0xc24b8b70', '0xc76c51a3',
    '0xd192e819', '0xd6990624', '0xf40e3585', '0x106aa070',
    '0x19a4c116', '0x1e376c08', '0x2748774c', '0x34b0bcb5',
    '0x391c0cb3', '0x4ed8aa4a', '0x5b9cca4f', '0x682e6ff3',
    '0x748f82ee', '0x78a5636f', '0x84c87814', '0x8cc70208',
    '0x90befffa', '0xa4506ceb', '0xbef9a3f7', '0xc67178f2'
]

H = [
    '0x6a09e667', '0xbb67ae85', '0x3c6ef372', '0xa54ff53a',
    '0x510e527f', '0x9b05688c', '0x1f83d9ab', '0x5be0cd19'
]

Kb = [util.hex2ba(k[2:]) for k in K]
Hb = [util.hex2ba(h[2:]) for h in H]

def _binsum(x, y):
    r, z = 0, bitarray([0] * 32)
    for i in reversed(range(32)):
        if x[i] == y[i]:
            z[i] = r
            r = x[i]
        else:
            z[i] = not r
    return z

binsum = lambda *args: reduce(_binsum, args)
chunks = lambda l, k: [l[i:i+k] for i in range(0,len(l),k)]

ch = lambda x, y, z: (x & y) ^ (~ x & z)
maj = lambda x, y, z: (x & y) ^ (x & z) ^ (y & z)

rotr = lambda s, n: (s >> n) | (s << (len(s) - n))
bsigma0 = lambda x: rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)
bsigma1 = lambda x: rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)
ssigma0 = lambda x: rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)
ssigma1 = lambda x: rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)

def pad(bits):
    ln = len(bits)
    k = (448 - ln - 1) % 512
    lb = bitarray(bin(ln)[2:].zfill(64))
    return bits + [1] + (k * [0]) + lb

def sha256(bits):
    compressor = deepcopy(Hb)
    for chunk in chunks(pad(bits), 512):

        W = chunks(chunk, 32)
        for t in range(16, 64):
            W.append(binsum(
                ssigma1(W[t-2]), W[t-7],
                ssigma0(W[t-15]), W[t-16]))

        a, b, c, d, e, f, g, h = compressor
        for t in range(64):
            T1 = binsum(h, bsigma1(e), ch(e,f,g), Kb[t], W[t])
            T2 = binsum(bsigma0(a), maj(a,b,c))
            h,g,f,e,d,c,b,a = g,f,e,binsum(d,T1),c,b,a,binsum(T1,T2)

        for j, w in enumerate([a,b,c,d,e,f,g,h]):
            compressor[j] = binsum(compressor[j], w)

    return reduce(bitarray.__add__, compressor)

def sha256g(inpt):
    bits = bitarray()
    if isinstance(inpt, str):
        bits.frombytes(inpt.encode())
    elif isinstance(inpt, int):
        bits = util.int2ba(inpt)
    elif isinstance(inpt, bytes):
        bits.frombytes(inpt.encode())
    elif isinstance(inpt, bytearray):
        bits = inpt
    else:
        assert False
    return sha256(bits)

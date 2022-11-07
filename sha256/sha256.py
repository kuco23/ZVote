from copy import deepcopy
from functools import reduce
from bitarray import bitarray, util
from .constants import K, H

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

from .constants import *

p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68]

def sigma(inpt):
    return pow(inpt, 5, p)

def ark(t, C, r, inpt):
    return [(inpt[i] + C[i+r]) % p for i in range(t)]

def mix(t, M, inpt):
    out = [0] * t
    for i in range(t):
        lc = 0
        for j in range(t):
            lc += M[j][i] * inpt[j] % p
        out[i] = lc % p
    return out

def mixLast(t, M, s, inpt):
    lc = 0
    for j in range(t):
        lc += M[j][s] * inpt[j] % p
    return lc % p

def mixS(t, S, r, inpt):
    out = [0] * t
    lc = 0
    for i in range(t):
        lc += S[(t * 2 - 1) * r + i] * inpt[i] % p
    out[0] = lc % p
    for i in range(1, t):
        out[i] = (inpt[i] + inpt[0] * S[(t*2-1)*r + t + i - 1]) % p
    return out

def poseidonEx(nins, nouts, ins, initialState):

    # set constants
    t = nins + 1
    nRoundsF = 8
    nRoundsP = N_ROUNDS_P[t - 2]
    C = POSEIDON_C(t)
    S = POSEIDON_S(t)
    M = POSEIDON_M(t)
    P = POSEIDON_P(t)

    # set holders
    sigmaF = [0] * t
    mixLast_ = [0] * nouts
    mix_ = [0] * t
    mixS_ = [0] * t
    
    # commonly used constant
    hnRoundsF = nRoundsF // 2

    ark_= ark(t, C, 0, [initialState] + ins[:(t-1)])
    for r in range(hnRoundsF-1):
        for j in range(t):
            if r == 0:
                sigmaF[j] = sigma(ark_[j])
            else:
                sigmaF[j] = sigma(mix_[j])
        
        ark_ = ark(t, C, (r+1)*t, sigmaF)
        mix_ = mix(t, M, ark_)
    
    for j in range(t):
        sigmaF[j] = sigma(mix_[j])

    ark_ = ark(t, C, hnRoundsF*t, sigmaF)
    mix_ = mix(t, P, ark_)

    for r in range(nRoundsP):
        if r == 0:
            sigmaP = sigma(mix_[0])
        else:
            sigmaP = sigma(mixS_[0])
        
        inpt = [0] * t
        for j in range(t):
            if j == 0:
                inpt[j] = sigmaP + C[(hnRoundsF+1)*t + r]
            else:
                if r == 0:
                    inpt[j] = mix_[j]
                else:
                    inpt[j] = mixS_[j]
        mixS_ = mixS(t, S, r, inpt)
    
    for r in range(hnRoundsF-1):
        for j in range(t):
            if r == 0:
                sigmaF[j] = sigma(mixS_[j])
            else:
                sigmaF[j] = sigma(mix_[j])

        ark_= ark(t, C, (hnRoundsF+1)*t + nRoundsP + r*t, sigmaF)
        mix_ = mix(t, M, ark_)
    
    for j in range(t):
        sigmaF[j] = sigma(mix_[j])

    for i in range(nouts):
        mixLast_[i] = mixLast(t, M, i, sigmaF)
    
    return mixLast_

def poseidon(*ins):
    return poseidonEx(len(ins), 1, list(ins), 0)[0]

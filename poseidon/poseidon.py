from .constants import *

p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

N_ROUNDS_P = [
    56, 57, 56, 60, 60, 63, 64, 63,
    60, 66, 60, 65, 70, 60, 64, 68
]

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
    ark_ = [0] * nRoundsF
    sigmaF = [[0] * t for _ in range(nRoundsF)]
    sigmaP = [0] * nRoundsP
    mix_ = [0] * (nRoundsF - 1)
    mixS_ = [0] * nRoundsP
    mixLast_ = [0] * nouts

    hnRoundsF = nRoundsF // 2

    ark_[0] = ark( t, C, 0, [initialState] + ins[:(t-1)])
    for r in range(nRoundsF//2-1):
        for j in range(t):
            if r == 0:
                sigmaF[r][j] = sigma(ark_[0][j])
            else:
                sigmaF[r][j] = sigma(mix_[r-1][j])
        
        ark_[r+1] = ark(t, C, (r+1)*t, sigmaF[r])
        mix_[r] = mix(t, M, ark_[r+1])
    
    for j in range(t):
        sigmaF[hnRoundsF-1][j] = sigma(mix_[hnRoundsF-2][j])

    ark_[hnRoundsF] = ark(t, C, hnRoundsF*t, sigmaF[hnRoundsF-1])
    mix_[hnRoundsF-1] = mix(t, P, ark_[hnRoundsF])

    for r in range(nRoundsP):
        if r == 0:
            sigmaP[r] = sigma(mix_[hnRoundsF-1][0])
        else:
            sigmaP[r] = sigma(mixS_[r-1][0])
        
        inpt = [0] * t
        for j in range(t):
            if j == 0:
                inpt[j] = sigmaP[r] + C[(hnRoundsF+1)*t + r]
            else:
                if r == 0:
                    inpt[j] = mix_[hnRoundsF-1][j]
                else:
                    inpt[j] = mixS_[r-1][j]
        mixS_[r] = mixS(t, S, r, inpt)
    
    for r in range(hnRoundsF-1):
        for j in range(t):
            if r == 0:
                sigmaF[hnRoundsF + r][j] = sigma(mixS_[nRoundsP-1][j])
            else:
                sigmaF[hnRoundsF + r][j] = sigma(mix_[hnRoundsF + r - 1][j])

        ark_[hnRoundsF + r + 1] = ark(t, C, (hnRoundsF+1)*t + nRoundsP + r*t, sigmaF[hnRoundsF + r])
        mix_[hnRoundsF + r] = mix(t, M, ark_[hnRoundsF + r + 1])
    
    for j in range(t):
        sigmaF[nRoundsF - 1][j] = sigma(mix_[nRoundsF - 2][j])

    for i in range(nouts):
        mixLast_[i] = mixLast(t, M, i, sigmaF[nRoundsF - 1])
    
    return mixLast_

def poseidon(*ins):
    return poseidonEx(len(ins), 1, list(ins), 0)[0]

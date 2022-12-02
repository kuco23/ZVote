import BN from "bn.js"
import { 
    p, N_ROUNDS_P, POSEIDON_C, POSEIDON_S, POSEIDON_M, POSEIDON_P
  } from "./constants"

const pBN = new BN(p)

function zeros(dim: number): BN[] {
    const ar: BN[] = [];
    for (let i = 0; i < dim; i++) 
        ar.push(new BN(0))
    return ar
}

export function sigma(inpt: BN): BN {
    return inpt
        .pow(new BN(5))
        .mod(pBN)
}

export function ark(
    t: number, C: BN[], r: number, inpt: BN[]
): BN[] {
    const out: BN[] = zeros(t)
    for (let i = 0; i < t; i++) 
        out[i] = inpt[i]
            .add(C[i+r])
            .mod(pBN)
    return out
}

export function mix(
    t: number, M: BN[][], inpt: BN[]
): BN[] {
    const out: BN[] = zeros(t)
    for (let i = 0; i < t; i++)
        for (let j = 0; j < t; j++) 
            out[i] = out[i]
                .add(M[j][i].mul(inpt[j]))
                .mod(pBN)
    return out
}

export function mixLast(
    t: number, M: BN[][], s: number, inpt: BN[]
): BN {
    let lc: BN = new BN(0)
    for (let j = 0; j < t; j++) 
        lc = lc
            .add(M[j][s].mul(inpt[j]))
            .mod(pBN)
    return lc
}

export function mixS(
    t: number, S: BN[], r: number, inpt: BN[]
): BN[] {
    const shift = (t * 2 - 1) * r
    const out: BN[] = zeros(t)
    let lc = new BN(0)
    for (let i = 0; i < t; i++) 
        lc = lc
            .add(S[shift + i].mul(inpt[i]))
            .mod(pBN)
    out[0] = lc
    for (let i = 1; i < t; i++) 
        out[i] = inpt[0]
            .mul(S[shift + t + i - 1])
            .add(inpt[i])
            .mod(pBN)
    return out
}

export function poseidonEx(
    nins: number, nouts: number, ins: BN[], initialState: BN
) {
    // set constants
    const t = nins + 1
    const nRoundsF = 8
    const nRoundsP = N_ROUNDS_P[t-2]
    const C = POSEIDON_C(t)!.map(x => new BN(x))
    const S = POSEIDON_S(t)!.map(x => new BN(x))
    const M = POSEIDON_M(t)!.map(l => l.map(x => new BN(x)))
    const P = POSEIDON_P(t)!.map(l => l.map(x => new BN(x)))

    // set holders
    let sigmaF = zeros(t)
    let mixLast_ = zeros(nouts)
    let mix_ = zeros(t)
    let mixS_ = zeros(t)
    let ark_ = zeros(t)

    // commonly used constant
    const hnRoundsF = Math.floor(nRoundsF / 2)
    const arkshift = (hnRoundsF+1)*t

    ark_ = ark(t, C, 0, [initialState].concat(ins.slice(0,t-1)))
    for (let r = 0; r < hnRoundsF-1; r++) {
        for (let j = 0; j < t; j++) {
            if (r == 0)
                sigmaF[j] = sigma(ark_[j])
            else 
                sigmaF[j] = sigma(mix_[j])
        }
        ark_ = ark(t, C, (r+1)*t, sigmaF)
        mix_ = mix(t, M, ark_)
    }

    for (let j = 0; j < t; j++) 
        sigmaF[j] = sigma(mix_[j])
    
    ark_ = ark(t, C, hnRoundsF*t, sigmaF)
    mix_ = mix(t, P, ark_)

    let sigmaP: BN
    for (let r = 0; r < nRoundsP; r++) {
        if (r == 0) 
            sigmaP = sigma(mix_[0])
        else 
            sigmaP = sigma(mixS_[0])
        
        let inpt = zeros(t)
        for (let j = 0; j < t; j++) {
            if (j == 0)
                inpt[j] = sigmaP
                    .add(C[arkshift+r])
                    .mod(pBN)
            else {
                if (r == 0)
                    inpt[j] = mix_[j]
                else
                    inpt[j] = mixS_[j]
            }
        }
        mixS_ = mixS(t, S, r, inpt)
    }

    for (let r = 0; r < hnRoundsF-1; r++) {
        for (let j = 0; j < t; j++) {
            if (r == 0) 
                sigmaF[j] = sigma(mixS_[j])
            else 
                sigmaF[j] = sigma(mix_[j])
        }
        ark_ = ark(t, C, arkshift + nRoundsP + r*t, sigmaF)
        mix_ = mix(t, M, ark_)
    }

    for (let j = 0; j < t; j++) 
        sigmaF[j] = sigma(mix_[j])
    
    for (let i = 0; i < nouts; i++) 
        mixLast_[i] = mixLast(t, M, i, sigmaF)
    
    return mixLast_
}

export function poseidon(ins: BN[]): BN {
    return poseidonEx(ins.length, 1, ins, new BN(0))[0]
}

export function postreidon(ins: string[]): string {
    return poseidon(ins.map(x => new BN(x))).toString()
}
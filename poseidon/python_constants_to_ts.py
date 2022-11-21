from json import dumps
from constants import POSEIDON_S, POSEIDON_C, POSEIDON_M, POSEIDON_P

file = f'./constants.ts'

N_ROUNDS_P = [
    56, 57, 56, 60, 60, 63, 64, 63, 
    60, 66, 60, 65, 70, 60, 64, 68
]

bodyC, bodyS, bodyM, bodyP = "", "", "", ""
for t in range(2, 18):
    C = POSEIDON_C(t)
    S = POSEIDON_S(t)
    M = POSEIDON_M(t)
    P = POSEIDON_P(t) 

    jsonC = dumps([str(c) for c in C], indent=2)
    jsonS = dumps([str(s) for s in S], indent=2)
    jsonM = dumps([[str(m) for m in m_] for m_ in M], indent=2)
    jsonP = dumps([[str(p) for p in p_] for p_ in P], indent=2)

    bodyC += f"""
    if (t == {t}) {{
        return {jsonC}
    }}
    """
    bodyS += f"""
    if (t == {t}) {{
        return {jsonS}
    }}
    """
    bodyM += f"""
    if (t == {t}) {{
        return {jsonM}
    }}
    """
    bodyP += f"""
    if (t == {t}) {{
        return {jsonP}
    }}
    """

constants = f"""
export const p = "21888242871839275222246405745257275088548364400416034343698204186575808495617"
export const nRoundsF = 8
export const N_ROUNDS_P = {N_ROUNDS_P}
export function POSEIDON_C(t: number): string[] | undefined {{
    {bodyC}
}}
export function POSEIDON_S(t: number): string[] | undefined {{
    {bodyS}
}}
export function POSEIDON_M(t: number): string[][] | undefined {{
    {bodyM}
}}
export function POSEIDON_P(t: number): string[][] | undefined {{
    {bodyP}
}}
"""

open(file, 'a').close()
with open(file, 'w') as constants_file:
    constants_file.write(constants)
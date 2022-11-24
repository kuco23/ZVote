from json import dumps
from constants import POSEIDON_S, POSEIDON_C, POSEIDON_M, POSEIDON_P

file = '../contracts/implementation/PoseidonConstants.sol'
t = 3 # AnonymousVoting needs poseidon only for two inputs

p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68]
S, C, M, P = POSEIDON_S(t), POSEIDON_C(t), POSEIDON_M(t), POSEIDON_P(t)

constants = f"""
// SPDX-License-Identifier: GPL-3.0
// This file is generated with constants_py_to_sol.py 

pragma solidity >=0.8.0;

abstract contract PoseidonConstants {{

    function get_poseidon_t() public pure returns (uint256) {{
        return {t};
    }}

    function get_poseidon_p() public pure returns (uint256) {{
        return {p};
    }}

    function get_poseidon_nRoundsF() public pure returns (uint256) {{
        return 8;
    }}

    function get_poseidon_nRoundsP() public pure returns (uint256) {{
        return {N_ROUNDS_P[t-2]};
    }}

    function get_poseidon_C() public pure returns (uint256[] memory) {{
        uint256[{len(C)}] memory Cf = {dumps(C, indent=2)};
        uint256[] memory Cd = new uint256[]({len(C)});
        for (uint256 i = 0; i < {len(C)}; i++) {{
            Cd[i] = Cf[i];
        }}
        return Cd;
    }}

    function get_poseidon_S() public pure returns (uint256[] memory) {{
        uint256[{len(S)}] memory Sf = {dumps(S, indent=2)};
        uint256[] memory Sd = new uint256[]({len(S)});
        for (uint256 i = 0; i < {len(S)}; i++) {{
            Sd[i] = Sf[i];
        }}
        return Sd;
    }}

    function get_poseidon_M() public pure returns (uint256[][] memory) {{
        uint256[{len(M)}][{len(M[0])}] memory Mf = {dumps(M, indent=2)};
        uint256[][] memory Md = new uint256[][]({len(M)});
        for (uint256 i = 0; i < {len(M)}; i++) {{
            Md[i] = new uint256[]({len(M[0])});
            for (uint256 j = 0; j < {len(M[0])}; j++)
                Md[i][j] = Mf[i][j];
        }}
        return Md;
    }}

    function get_poseidon_P() public pure returns (uint256[][] memory) {{
        uint256[{len(P)}][{len(P[0])}] memory Pf = {dumps(P, indent=2)};
        uint256[][] memory Pd = new uint256[][]({len(P)});
        for (uint256 i = 0; i < {len(P)}; i++) {{
            Pd[i] = new uint256[]({len(P[0])});
            for (uint256 j = 0; j < {len(P[0])}; j++)
                Pd[i][j] = Pf[i][j];
        }}
        return Pd;
    }}
}}
"""

open(file, 'a').close()
with open(file, 'w') as constants_sol:
    constants_sol.write(constants)
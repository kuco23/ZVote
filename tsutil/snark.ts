const snarkjs = require("snarkjs")

export async function createProof(pub: any) {
  return await snarkjs.plonk.fullProve(pub,
    "./snark_data/ticket_spender_js/ticket_spender.wasm",
    "./snark_data/ticket_spender_final.zkey"
  )
}
  
  export async function getSoliditySnark(
    proof: any, pub: any
) {
  const callargs = await snarkjs.plonk
    .exportSolidityCallData(proof, pub)
  return callargs.slice(0, callargs.indexOf(","))
}


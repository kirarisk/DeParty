// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import DePartyIDL from '../target/idl/de_party.json'
import type { DeParty } from '../target/types/de_party'

// Re-export the generated IDL and type
export { DeParty, DePartyIDL }

// The programId is imported from the program IDL.
export const DEPARTY_PROGRAM_ID = new PublicKey(DePartyIDL.address)

// This is a helper function to get the Test Anchor program.
export function getDepartyProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...DePartyIDL, address: address ? address.toBase58() : DePartyIDL.address } as DeParty, provider)
}

// This is a helper function to get the program ID for the Test program depending on the cluster.
export function getDepartyProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Test program on devnet and testnet.
      return new PublicKey('ParTyJHHCxDHCZkeXBZTAtMQT1t1eospvjgYdpYQmHb')
    case 'mainnet-beta':
    default:
      return DEPARTY_PROGRAM_ID
  }
}

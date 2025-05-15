'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { DepartyList } from './departy-ui'
import { useRouter } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'

export default function DashboardFeature() {
  const { publicKey } = useWallet()
  const router = useRouter()

  const navigateToPartyCall = async (partyAddress: PublicKey, partyName: string, partyCreator?: PublicKey, isOnEr?: boolean) => {
    if (!publicKey) {
      toast.error("Wallet not connected.")
      return
    }

    try {
      // Generate room name based on party name (kebab-case)
      const roomNameForCall = partyName.replace(/\s+/g, '-').toLowerCase()
      const userNameForCall = publicKey.toString()

      toast.success(`Preparing to join party: ${partyName}...`)
      
      // Build URL with all necessary parameters
      let callUrl = `/call?room=${encodeURIComponent(roomNameForCall)}&user=${encodeURIComponent(userNameForCall)}`;
      
      // Add party information if available
      if (partyAddress) {
        callUrl += `&partyAddress=${encodeURIComponent(partyAddress.toString())}`;
      }
      
      if (partyCreator) {
        callUrl += `&partyCreator=${encodeURIComponent(partyCreator.toString())}`;
      }
      
      if (isOnEr !== undefined) {
        callUrl += `&isOnEr=${isOnEr}`;
      }
      
      // Navigate to the dedicated call page with all parameters
      router.push(callUrl)

    } catch (e) {
      console.error("Failed to navigate to party call:", e)
      toast.error((e as Error).message || "Could not prepare for the call.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">DeParty</h1>
        <p className="text-xl text-slate-400">
          Parties made fun, fair, and fast.
        </p>
      </div>

      {!publicKey ? (
        <div className="flex flex-col items-center justify-center p-12 bg-base-200 rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Connect your wallet to get started</h2>
          <WalletButton />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <DepartyList onJoinSuccess={navigateToPartyCall} />
        </div>
      )}
    </div>
  )
}

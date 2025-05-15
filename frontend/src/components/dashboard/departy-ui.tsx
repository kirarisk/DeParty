'use client'

import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useDepartyProgram, useDepartyProfile, useDepartyParty, useDepartyPolls } from './departy-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'

// Interface for the Party account data based on Rust struct
interface PartyAccountData {
  name: string;
  description: string;
  creator: PublicKey;
  members: PublicKey[];
  createdAt: BN; // Mapped from i64
  mint: PublicKey;
  tokensRequired: BN; // Mapped from u64
  capacity: number; // Mapped from u8
  // bump: number; // Not typically used directly in UI rendering of properties
}

// Define a basic type for Poll account data based on usage
interface PollAccount {
  pollType: number;
  target?: PublicKey | null;
  pollQuestion: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  voted: PublicKey[];
  startTime: BN;
  endTime: BN;
  party: PublicKey;
}

export function DepartyCreate() {
  const { initializeProtocol } = useDepartyProgram()
  const { publicKey } = useWallet()
  
  // Based on de-party.ts: setup(new BN(0.01 * LAMPORTS_PER_SOL), new BN(100), 51)
  // Assuming: subscriptionPrice = 0.01 SOL, subscriptionAllowance = 100, feeBasisPoints = 51 (0.51%)
  const subscriptionPrice = new BN(0.01 * LAMPORTS_PER_SOL)
  const subscriptionAllowance = new BN(100)
  const feeBasisPoints = 51

  return (
    <div className="card bg-base-200 shadow-lg p-6">
      <h2 className="card-title text-2xl mb-4">Initialize DeParty Protocol</h2>
      <p className="mb-4">Set up the DeParty protocol with default parameters:</p>
      <div className="flex flex-col gap-4">
        <div>
          <div className="form-control">
            <label className="label">Party Creation Fee: {subscriptionPrice.toNumber() / LAMPORTS_PER_SOL} SOL</label>
          </div>
          <div className="form-control">
            <label className="label">Reward Fee: {feeBasisPoints / 100}%</label>
          </div>
          <div className="form-control">
            <label className="label">Vote Consensus Threshold: {subscriptionAllowance.toString()}</label>
          </div>
        </div>
    <button
          className="btn btn-primary"
      onClick={() =>
        initializeProtocol.mutateAsync({
              subscriptionPrice,
              subscriptionAllowance,
              feeBasisPoints
            }).catch(err => toast.error("Failed to initialize: " + (err as Error).message))
      }
      disabled={!publicKey || initializeProtocol.isPending}
    >
          {initializeProtocol.isPending ? 'Initializing...' : 'Initialize Protocol'}
    </button>
      </div>
    </div>
  )
}

export function ProfileCreate() {
  const { publicKey } = useWallet()
  const { createProfile } = useDepartyProfile({ publicKey: publicKey! })
  const [name, setName] = useState('')
  
  return (
    <div className="card bg-base-200 shadow-lg p-6">
      <h2 className="card-title text-2xl mb-4">Create Your Profile</h2>
      <div className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label">Your Name</label>
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <Button
          className="btn btn-primary"
          onClick={() => {
            if (name) createProfile.mutateAsync(name).catch(err => toast.error("Failed to create profile: " + (err as Error).message))
          }}
          disabled={!name || !publicKey || createProfile.isPending}
        >
          {createProfile.isPending ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </div>
    </div>
  )
}

export function PartyCreate() {
  const { publicKey } = useWallet()
  const { createParty } = useDepartyParty()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tokensRequired, setTokensRequired] = useState('')
  const [memberLimit, setMemberLimit] = useState('')
  const [mintAddress, setMintAddress] = useState('')

  return (
    <div className="card bg-base-200 shadow-lg p-6 mt-6">
      <h2 className="card-title text-2xl mb-4">Create New Party</h2>
      <div className="flex flex-col gap-3">
        <div className="form-control">
          <label className="label">Party Name</label>
          <Input
            type="text"
            placeholder="Enter party name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control">
          <label className="label">Description</label>
          <Input
            type="text"
            placeholder="Enter party description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input input-bordered w-full"
          />
              </div>
        <div className="form-control">
          <label className="label">Token Mint Address (for access)</label>
          <Input
            type="text"
            placeholder="Enter token mint address"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            className="input input-bordered w-full"
          />
              </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label">Required Token Amount (tokens_required)</label>
            <Input
              type="number"
              placeholder="e.g., 100"
              value={tokensRequired}
              onChange={(e) => setTokensRequired(e.target.value)}
              className="input input-bordered w-full"
            />
            </div>
          <div className="form-control">
            <label className="label">Capacity (memberLimit)</label>
            <Input
              type="number"
              placeholder="e.g., 50"
              value={memberLimit}
              onChange={(e) => setMemberLimit(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
        </div>
        <Button
          className="btn btn-primary mt-3"
          onClick={() => {
            if (name && description && tokensRequired && memberLimit && mintAddress && !isNaN(parseInt(tokensRequired)) && !isNaN(parseInt(memberLimit))) {
              try {
                createParty.mutateAsync({
                  name,
                  description,
                  tokensRequired: new BN(tokensRequired),
                  memberLimit: parseInt(memberLimit),
                  mint: new PublicKey(mintAddress)
                }).catch(err => toast.error("Failed to create party: " + (err as Error).message))
              } catch (e) {
                toast.error("Invalid mint address or parameters.")
              }
            }
          }}
          disabled={
            !name || 
            !description || 
            !tokensRequired || 
            !memberLimit || 
            !mintAddress || 
            isNaN(parseInt(tokensRequired)) || 
            isNaN(parseInt(memberLimit)) ||
            !publicKey || 
            createParty.isPending
          }
        >
          {createParty.isPending ? 'Creating Party...' : 'Create Party'}
        </Button>
      </div>
    </div>
  )
}

export function PartyList({ onJoinSuccess }: { onJoinSuccess?: (partyAddress: PublicKey, partyName: string, partyCreator: PublicKey, isOnEr: boolean) => void }) {
  const { publicKey } = useWallet()
  const { getParties, joinParty, endParty } = useDepartyParty()
  
  if (getParties.isLoading) {
    return <div className="flex items-center justify-center p-6"><span className="loading loading-spinner loading-lg"></span></div>
  }
  
  if (!getParties.data || getParties.data.length === 0) {
    return (
      <div className="alert alert-info mt-6">
        <p>No parties found. Create a new party to get started!</p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 mt-6">
      <h2 className="text-2xl font-bold">Available Parties</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {getParties.data.map((partyAccount) => (
          <PartyCard 
            key={partyAccount.publicKey.toString()} 
            party={partyAccount.account as PartyAccountData}
            partyAddress={partyAccount.publicKey}
            source={partyAccount.source}
            onJoin={async () => {
              try {
                const result = await joinParty.mutateAsync({
                  partyAddress: partyAccount.publicKey,
                  partyName: partyAccount.account.name || 'Unnamed Party',
                  isOnEr: partyAccount.source === 'er'
                });
                if (onJoinSuccess && result) {
                  console.log("[PartyCard] Join success, passing to callback:", {
                    partyAddress: result.partyAddress.toString(),
                    partyName: result.partyName,
                    creator: partyAccount.account.creator.toString(),
                    isOnEr: partyAccount.source === 'er'
                  });
                  
                  onJoinSuccess(
                    result.partyAddress, 
                    result.partyName,
                    partyAccount.account.creator,
                    partyAccount.source === 'er'
                  );
                }
              } catch (err) {
                // Error is already handled by the mutation's onError
              }
            }}
            isJoining={joinParty.isPending}
            endPartyMutation={endParty}
          />
        ))}
      </div>
    </div>
  )
}

function PartyCard({ 
  party, 
  partyAddress,
  source,
  onJoin,
  isJoining,
  endPartyMutation
}: { 
  party: PartyAccountData, 
  partyAddress: PublicKey,
  source?: string,
  onJoin: () => Promise<void>,
  isJoining: boolean,
  endPartyMutation: any
}) {
  const { publicKey } = useWallet()
  const isOwner = publicKey && party && party.creator && party.creator.equals(publicKey)
  const isMember = publicKey && party && party.members && party.members.some((member: PublicKey) => member.equals(publicKey!))
  const [isEndingParty, setIsEndingParty] = useState(false)
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)
  
  const [showPolls, setShowPolls] = useState(false)
  
  if (!party) {
    return null;
  }
  
  const handleEndParty = async () => {
    if (!publicKey) return;
    setIsEndingParty(true);
    try {
      await endPartyMutation.mutateAsync({
        partyAddress,
        isOnEr: source === 'er'
      });
      setShowConfirmEnd(false);
    } catch (e) {
      // Error is handled by the mutation
    } finally {
      setIsEndingParty(false);
    }
  };

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h3 className="card-title text-xl">{party.name || 'Unnamed Party'}</h3>
          <div className="flex gap-2">
            {source === 'er' && <div className="badge badge-secondary">ER</div>}
            <div className="badge badge-outline">
              {(party.members ? party.members.length : 0)}/{party.capacity ? party.capacity.toString() : 'N/A'} Members
            </div>
          </div>
        </div>
        <p className="my-2 text-sm text-gray-400">{party.description || 'No description.'}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="badge badge-primary">
            Required: {party.tokensRequired ? party.tokensRequired.toString() : 'N/A'} units of
          </div>
          <div className="badge">
            Token: {party.mint ? ellipsify(party.mint.toString()) : 'N/A'}
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          {!isMember && publicKey && (
            <Button
              className="btn btn-primary btn-sm"
              onClick={onJoin}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Party'}
            </Button>
          )}
          {isMember && (
            <>
              <Button
                className="btn btn-outline btn-sm"
                onClick={() => setShowPolls(!showPolls)}
              >
                {showPolls ? 'Hide Polls' : 'Show Polls'}
              </Button>
            </>
          )}
          {isOwner && !showConfirmEnd && (
            <Button
              className="btn btn-error btn-sm"
              onClick={() => setShowConfirmEnd(true)}
            >
              End Party
            </Button>
          )}
          {isOwner && showConfirmEnd && (
            <div className="flex gap-2">
              <Button
                className="btn btn-outline btn-sm"
                onClick={() => setShowConfirmEnd(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn btn-error btn-sm"
                onClick={handleEndParty}
                disabled={isEndingParty}
              >
                {isEndingParty ? 'Ending...' : 'Confirm End'}
              </Button>
            </div>
          )}
          <ExplorerLink 
            path={`account/${partyAddress}`} 
            label="View On-Chain" 
            className="btn btn-ghost btn-xs"
          />
        </div>
        
        {showPolls && isMember && (
          <div className="mt-4 border-t pt-4">
            <PartyPolls 
              partyAddress={partyAddress} 
              partyCreator={party.creator} 
              source={source} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

function PartyPolls({ partyAddress, partyCreator, source }: { partyAddress: PublicKey, partyCreator: PublicKey, source?: string }) {
  const { publicKey } = useWallet()
  const { cluster } = useCluster()
  const { startPoll, vote, getActivePoll } = useDepartyPolls()
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const [pollType, setPollType] = useState<number>(2)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [targetProfileAddress, setTargetProfileAddress] = useState('')
  const isOnEr = source === 'er'

  const activePollQueryKey: [string, string, { cluster: any, partyAddress: PublicKey | null }] = 
    ['departy', 'active-poll', { cluster: cluster.network, partyAddress }]

  const { data: activePollData, isLoading: isActivePollLoading, error: activePollError, refetch: refetchActivePoll } = 
    useQuery<PollAccount | null, Error>({
      queryKey: activePollQueryKey,
      queryFn: async () => {
        const result = await getActivePoll.refetch({ queryKey: activePollQueryKey } as any)
        return result.data as PollAccount | null;
      },
      enabled: !!publicKey && !!partyAddress, 
    }
  );
  
  const handleCreatePoll = () => {
    if (!publicKey) return;
    let targetPubKey: PublicKey | null = null;
    if ((pollType === 0 || pollType === 1) && targetProfileAddress) {
      try {
        targetPubKey = new PublicKey(targetProfileAddress);
      } catch (e) {
        toast.error("Invalid target profile address");
        return;
      }
    } else if (pollType === 0 || pollType === 1) {
      toast.error("Target profile address is required for mute/kick polls.");
      return;
    }

    startPoll.mutateAsync({
      partyAddress,
      pollType,
      question: pollType === 2 ? question : `Vote to ${pollType === 0 ? 'mute' : 'kick'} target member?`, 
      options: pollType === 2 ? options : ['Yes', 'No'], 
      targetProfile: targetPubKey,
    }).then(() => {
      setShowCreatePoll(false);
      setQuestion('')
      setOptions(['Yes', 'No'])
      setTargetProfileAddress('')
      refetchActivePoll(); 
    }).catch(err => toast.error("Failed to create poll: " + (err as Error).message));
  }
  
  const handleVote = () => {
    if (selectedOption === null) return;
    
    vote.mutateAsync({
      partyAddress,
      optionIndex: selectedOption
    }).then(() => {
      setSelectedOption(null); 
      refetchActivePoll(); 
    }).catch(err => toast.error("Failed to vote: " + (err as Error).message));
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold">Polls</h4>
        {partyCreator && (
            <Button
            className="btn btn-sm btn-outline"
            onClick={() => setShowCreatePoll(!showCreatePoll)}
            >
            {showCreatePoll ? 'Cancel' : 'Create New Poll'}
            </Button>
        )}
            </div>

      {showCreatePoll && partyCreator && (
        <div className="card bg-base-300 p-4 rounded-lg">
          <h5 className="font-semibold mb-3 text-md">Create New Poll</h5>
          <div className="form-control mb-3">
            <label className="label text-sm">Poll Type</label>
            <select 
              className="select select-bordered w-full select-sm"
              value={pollType}
              onChange={(e) => setPollType(parseInt(e.target.value))}
            >
              <option value={2}>General Poll</option>
              <option value={0}>Mute Member</option>
              <option value={1}>Kick Member</option>
            </select>
              </div>

          {(pollType === 0 || pollType === 1) && (
            <div className="form-control mb-3">
              <label className="label text-sm">Target Member Profile Address (Pubkey)</label>
              <Input
                  type="text"
                placeholder="Enter profile PublicKey of the member"
                value={targetProfileAddress}
                onChange={(e) => setTargetProfileAddress(e.target.value)}
                className="input input-bordered w-full input-sm"
              />
              </div>
          )}
          
          {pollType === 2 && ( 
            <div className="form-control mb-3">
              <label className="label text-sm">Question</label>
              <Input
                  type="text"
                placeholder="Enter poll question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="input input-bordered w-full input-sm"
              />
              </div>
          )}
          
          {pollType === 2 && ( 
            <div className="form-control mb-3">
              <label className="label text-sm">Options (max 5)</label>
              <div className="flex flex-col gap-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                  type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index] = e.target.value
                        setOptions(newOptions)
                      }}
                      className="input input-bordered w-full input-sm"
                    />
                    {options.length > 2 && (
                      <Button
                        className="btn btn-square btn-xs btn-error btn-outline"
                        onClick={() => {
                          const newOptions = [...options]
                          newOptions.splice(index, 1)
                          setOptions(newOptions)
                        }}
                      >
                        X
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 5 && (
                  <Button
                    className="btn btn-xs mt-1 self-start"
                    onClick={() => setOptions([...options, ''])}
                  >
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button
              className="btn btn-primary btn-sm"
              onClick={handleCreatePoll}
              disabled={
                startPoll.isPending ||
                (pollType === 2 && (!question || options.some(o => !o))) ||
                ((pollType === 0 || pollType === 1) && !targetProfileAddress) 
              }
            >
              {startPoll.isPending ? 'Creating Poll...' : 'Create Poll'}
            </Button>
          </div>
        </div>
      )}
      
      {isActivePollLoading && <div className="text-center py-4"><span className="loading loading-spinner"></span></div>}
      {activePollError && <p className="text-error text-sm text-center py-4">Error loading poll: {activePollError.message}</p>}
      {activePollData && (
        <div className="card bg-base-300 p-4 rounded-lg mt-4">
          <h5 className="font-semibold mb-2 text-md">Active Poll</h5>
          <p className="text-sm mb-1">Type: {
            activePollData.pollType === 0 ? "Mute Member" :
            activePollData.pollType === 1 ? "Kick Member" :
            "General"
          }</p>
          {activePollData.target && activePollData.target.toString() !== PublicKey.default.toString() && (
             <p className="text-xs text-gray-400 mb-2">Target: {ellipsify(activePollData.target.toString())}</p>
          )}
          <p className="mb-3 font-medium">{activePollData.pollQuestion}</p>
          
          <div className="space-y-2">
            {activePollData.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-base-content/20 rounded-md hover:bg-base-content/10 transition-colors">
                <input
                  type="radio"
                  name={`vote-option-${partyAddress.toString()}-${activePollData.startTime.toString()}`}
                  id={`option-${partyAddress.toString()}-${index}-${activePollData.startTime.toString()}`}
                  className="radio radio-primary radio-sm"
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  disabled={!!(publicKey && activePollData.voted && activePollData.voted.find((voter: PublicKey) => voter.equals(publicKey)))}
                />
                <label htmlFor={`option-${partyAddress.toString()}-${index}-${activePollData.startTime.toString()}`} className="flex-grow text-sm cursor-pointer">{option}</label>
                {activePollData.votes && activePollData.votes[index] !== undefined && (
                  <span className="badge badge-sm badge-ghost">{activePollData.votes[index].toString()} votes</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
             <p className="text-xs text-gray-500">Total Votes: {activePollData.totalVotes ? activePollData.totalVotes.toString() : '0'}</p>
            <Button
              className="btn btn-primary btn-sm"
              onClick={handleVote}
              disabled={vote.isPending || selectedOption === null || 
                !!(publicKey && activePollData.voted && activePollData.voted.find((voter: PublicKey) => voter.equals(publicKey)))
              }
            >
              {vote.isPending ? 'Voting...' : (publicKey && activePollData.voted && activePollData.voted.find((voter: PublicKey) => voter.equals(publicKey))) ? 'Voted' : 'Submit Vote'}
            </Button>
          </div>
        </div>
      )}
      {!isActivePollLoading && !activePollData && (
        <p className="text-sm text-gray-400 text-center py-4">No active poll for this party.</p>
      )}
    </div>
  )
}

export function UserProfileCard({ publicKey }: { publicKey: PublicKey | null }) {
  if (!publicKey) {
    console.log("[UserProfileCard] Render: No publicKey, showing ProfileCreate directly");
    return <ProfileCreate />;
  }

  const { getProfile, closeAccount } = useDepartyProfile({ publicKey })

  console.log("[UserProfileCard] Render with publicKey:", publicKey?.toString(), "Profile query state:", {
    isLoading: getProfile.isLoading,
    isError: getProfile.isError,
    isFetched: getProfile.isFetched,
    data: getProfile.data
  });
  
  if (getProfile.isLoading) {
    console.log("[UserProfileCard] Render: isLoading is true, showing spinner");
    return <div className="flex items-center justify-center p-6"><span className="loading loading-spinner loading-lg"></span><p className="ml-2">Loading profile...</p></div>
  }
  
  if (getProfile.data) {
    console.log("[UserProfileCard] Render: getProfile.data exists, showing profile details", getProfile.data);
    return (
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Your Profile</h2>
          <div className="stats shadow mb-4 bg-base-100 rounded-lg">
            <div className="stat p-4">
              <div className="stat-title text-sm">Name</div>
              <div className="stat-value text-lg">{getProfile.data.name}</div>
            </div>
            <div className="stat p-4">
              <div className="stat-title text-sm">Address</div>
              <div className="stat-value text-lg">{ellipsify(publicKey!.toString())}</div>
            </div>
              </div>

          <div className="card-actions justify-end">
            <Button
              className="btn btn-error btn-sm"
              onClick={() => closeAccount.mutateAsync().catch(err => toast.error("Failed to close account: " + (err as Error).message))}
              disabled={closeAccount.isPending}
            >
              {closeAccount.isPending ? 'Closing Account...' : 'Close Account'}
            </Button>
          </div>
                        </div>
                        </div>
    )
  }
  
  console.log("[UserProfileCard] Render: Fallback, showing ProfileCreate. isError:", getProfile.isError, "isFetched:", getProfile.isFetched, "!data:", !getProfile.data);
  return <ProfileCreate />;
}

export function DepartyList({ onJoinSuccess }: { onJoinSuccess?: (partyAddress: PublicKey, partyName: string, partyCreator: PublicKey, isOnEr: boolean) => void }) {
  const { getConfig, configPda, treasuryPda } = useDepartyProgram()
  const { publicKey } = useWallet()
  const { getProfile: getCurrentUserProfile } = useDepartyProfile({ publicKey })

  if (getConfig.isLoading) {
    return <div className="flex items-center justify-center p-6"><span className="loading loading-spinner loading-lg"></span><p className="ml-2">Loading protocol config...</p></div>
  }

  if (!getConfig.data) {
    return (
      <div className="text-center mt-10">
         <DepartyCreate />
                  </div>
    )
  }
  
  return (
    <div className="space-y-6">
        <div className="grid gap-4 p-4">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-2xl">Protocol Configuration</h2>
              <div className="space-y-1 mt-3 text-sm">
                <p><span className="font-semibold">Admin:</span> {ellipsify(getConfig.data.admin.toString())}</p>
                <p><span className="font-semibold">Party Creation Fee:</span> {getConfig.data.partyFee ? getConfig.data.partyFee.toNumber() / LAMPORTS_PER_SOL : 'N/A'} SOL</p>
                <p><span className="font-semibold">Reward Fee:</span> {getConfig.data.rewardBasisPoints ? getConfig.data.rewardBasisPoints / 100 : 'N/A'}%</p>
                <p><span className="font-semibold">Vote Consensus Threshold:</span> {getConfig.data.voteConsensus ? getConfig.data.voteConsensus.toString() : 'N/A'}</p>
                <div className="flex gap-2 mt-3">
                  <ExplorerLink path={`account/${configPda}`} label="View Config" className="btn btn-xs btn-outline" />
                  <ExplorerLink path={`account/${treasuryPda}`} label="View Treasury" className="btn btn-xs btn-outline" />
                </div>
              </div>
            </div>
          </div>

          {publicKey && <UserProfileCard publicKey={publicKey} />}
          {!publicKey && (
            <div className="mt-6">
              <p className="text-center mb-2">Connect your wallet to create a profile and interact with parties.</p>
          </div>
        )}
          
          {getCurrentUserProfile.isLoading && publicKey && (
             <div className="flex items-center justify-center p-6 mt-6"><span className="loading loading-spinner loading-md"></span><p className="ml-2">Verifying profile for party features...</p></div>
          )}

          {publicKey && getCurrentUserProfile.data && getConfig.data && (
            <>
              <PartyCreate />
              <PartyList onJoinSuccess={onJoinSuccess} />
            </>
          )}

      </div>
    </div>
  )
}



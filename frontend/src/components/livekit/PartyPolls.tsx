'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useDepartyPolls } from '../dashboard/departy-data-access';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useQuery, QueryClient, useQueryClient } from '@tanstack/react-query';
import { handleMutePollSuccess, getRoomNameFromUrl } from './livekit-utils';

// Define a basic type for Poll account data based on usage
interface PollAccount {
  pollType: number;
  target?: PublicKey | null;
  pollQuestion: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  voted: PublicKey[];
  startTime: { toNumber: () => number };
  endTime: { toNumber: () => number };
  party: PublicKey;
  source: string;
  ended: boolean;
}

export function CallRoomPolls({ 
  partyAddress, 
  partyCreator,
  isOnEr,
  members = []
}: { 
  partyAddress: PublicKey, 
  partyCreator: PublicKey,
  isOnEr?: boolean,
  members?: { publicKey: PublicKey, name: string }[]
}) {
  const { publicKey } = useWallet();
  const { cluster } = useCluster();
  const { startPoll, vote, getActivePoll, fetchPollForParty } = useDepartyPolls();
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollType, setPollType] = useState<number>(2);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Yes', 'No']);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [targetMember, setTargetMember] = useState<string>('');
  const [activePoll, setActivePoll] = useState<PollAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const isCreator = publicKey && partyCreator && partyCreator.equals(publicKey);
  
  // Use a ref to track component mounted state
  const isMountedRef = useRef(true);
  // Use a ref to track if initial fetch has happened
  const initialFetchDoneRef = useRef(false);

  const queryClient = useQueryClient();
  
  // Just use a direct query
  const pollQueryKey = useMemo(() => 
    ['departy', 'active-poll', { 
      cluster: cluster.network, 
      partyAddress: partyAddress 
    }], 
    [cluster.network, partyAddress]
  );
  
  const { 
    data: activePollData, 
    isLoading: isActivePollLoading, 
    error: activePollError, 
    refetch: refetchActivePoll
  } = useQuery<PollAccount | null, Error>({
    queryKey: pollQueryKey,
    queryFn: async () => {
      if (!publicKey || !partyAddress) {
        return null;
      }
      
      try {
        // Force an update to the query key in getActivePoll
        
        // Invalidate the query to ensure we get a fresh result
        queryClient.resetQueries({ queryKey: ['departy', 'active-poll'] });
        
        // Now try to fetch directly using getActivePoll
        const context = {
          queryKey: pollQueryKey,
          meta: undefined
        };
          
        // This is the key part - manually call the getActivePoll function
        if (typeof getActivePoll.fetchStatus === 'undefined') {
          // If it's a function we can call directly
          await getActivePoll.refetch();
          return getActivePoll.data;
        } else {
          // Otherwise use the query client
          await queryClient.refetchQueries({ queryKey: pollQueryKey });
          return queryClient.getQueryData(pollQueryKey);
        }
      } catch (error) {
        console.error("[CallRoomPolls] Error in poll fetch:", error);
        return null;
      }
    },
    enabled: !!publicKey && !!partyAddress,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });

  // Update local state from query data
  useEffect(() => {
    if (activePollData) {
      setActivePoll(activePollData);
    }
  }, [activePollData]);

  // Explicitly tell getActivePoll to use the current partyAddress
  useEffect(() => {
    if (partyAddress && publicKey) {
      // Use invalidateQueries instead of removeQueries
      queryClient.invalidateQueries({ queryKey: ['departy', 'active-poll'] });
    }
  }, [partyAddress, publicKey, queryClient]);

  // Function to directly fetch the poll data without using refetch - memoize this to reduce rerenders
  const directFetchPoll = useCallback(async () => {
    if (!partyAddress || !publicKey) return null;
    
    try {
      // Force the query client to remove any cached data - use invalidateQueries instead
      queryClient.invalidateQueries({ 
        queryKey: ['departy', 'active-poll']
      });
      
      // Trigger a refetch - this should call getActivePoll.queryFn
      const refetchResult = await getActivePoll.refetch();
      
      if (refetchResult.data) {
        // Cast to unknown first to satisfy TypeScript
        return refetchResult.data as unknown as PollAccount;
      }
      
      return null;
    } catch (error) {
      console.error("[CallRoomPolls] Error in directFetchPoll:", error);
      return null;
    }
  }, [partyAddress, publicKey, queryClient, getActivePoll]);

  // Updated fetchActivePoll to use proper fetch methods
  const fetchActivePoll = useCallback(async () => {
    if (!partyAddress || !publicKey || !isMountedRef.current || isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First approach: Try direct fetch using fetchPollForParty
      const pollData = await fetchPollForParty(partyAddress, null);
      
      if (pollData) {
        setActivePoll(pollData as PollAccount);
        setIsLoading(false);
        return;
      }
      
      // Second approach: Try refetch using the query system
      
      // Invalidate any existing queries first
      queryClient.invalidateQueries({ queryKey: ['departy', 'active-poll'] });
      
      // Now try refetch
      const refetchResult = await getActivePoll.refetch();
      
      if (refetchResult.data) {
        setActivePoll(refetchResult.data as unknown as PollAccount);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("[CallRoomPolls] Error refreshing poll:", error);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [partyAddress, publicKey, isLoading, fetchPollForParty, queryClient, getActivePoll]);

  // Initial fetch only - no automatic polling
  useEffect(() => {
    isMountedRef.current = true;
    
    const doInitialFetch = async () => {
      if (initialFetchDoneRef.current || !partyAddress || !publicKey) return;
      
      // Mark that we've done the initial fetch to prevent repeat calls
      initialFetchDoneRef.current = true;
      
      // Use the same approach as our fetchActivePoll function
      await fetchActivePoll();
    };
    
    doInitialFetch();
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [partyAddress, publicKey, fetchActivePoll]);
  
  // Manual refresh function that users can trigger - memoized to reduce rerenders
  const manualRefresh = useCallback(() => {
    if (isLoading) {
      return; // Prevent multiple simultaneous loads
    }
    fetchActivePoll();
  }, [fetchActivePoll, isLoading]);
  
  // Memoize this function to reduce rerenders
  const hasVoted = useMemo(() => {
    if (!publicKey || !activePoll) return false;
    return activePoll.voted.some(voter => voter.equals(publicKey));
  }, [publicKey, activePoll]);
  
  // Memoize this function to reduce rerenders
  const getMemberName = useCallback((pubkey: string) => {
    const member = members.find(m => m.publicKey.toString() === pubkey);
    return member ? member.name : pubkey.substring(0, 6) + '...';
  }, [members]);
  
  const handleCreatePoll = useCallback(async () => {
    if (!publicKey || isCreatingPoll) return;
    
    let targetPubKey: PublicKey | null = null;
    if ((pollType === 0 || pollType === 1) && targetMember) {
      try {
        targetPubKey = new PublicKey(targetMember);
      } catch (err) {
        toast.error("Please select a valid member");
        return;
      }
    } else if (pollType === 0 || pollType === 1) {
      toast.error("Please select a member to mute/kick");
      return;
    }
    
    // Begin showing loading state
    setIsCreatingPoll(true);
    toast.loading("Creating poll...", { id: "create-poll" });
    
    // Prepare poll data
    const pollData = {
      partyAddress,
      pollType,
      question: pollType === 2 ? question : `Vote to ${pollType === 0 ? 'mute' : 'kick'} selected member?`,
      options: pollType === 2 ? options : ['Yes', 'No'],
      targetProfile: targetPubKey,
      isOnEr
    };
    
    try {
      await startPoll.mutateAsync(pollData);
      
      toast.dismiss("create-poll");
      toast.success("Poll created successfully!");
      
      // Reset form
      setShowCreatePoll(false);
      setQuestion('');
      setOptions(['Yes', 'No']);
      setTargetMember('');
      
      // Manually refresh after a short delay
      setTimeout(() => {
        fetchActivePoll();
        setIsCreatingPoll(false);
      }, 1000);
    } catch (err) {
      toast.dismiss("create-poll");
      toast.error(`Failed to create poll: ${(err as Error).message}`);
      setIsCreatingPoll(false);
    }
  }, [publicKey, pollType, targetMember, question, options, partyAddress, isOnEr, startPoll, isCreatingPoll, fetchActivePoll]);
  
  const handleVote = useCallback(async () => {
    if (selectedOption === null || !activePoll || isVoting) return;
    
    // Begin showing loading state
    setIsVoting(true);
    toast.loading("Submitting your vote...", { id: "submit-vote" });
    
    // Detect if poll is on ER from the source field
    const isOnErLayer = activePoll.source === 'er';
    
    // Prepare vote data
    const voteData = {
      partyAddress,
      optionIndex: selectedOption,
      isOnEr: isOnErLayer,
      pollData: activePoll // Pass the full poll data for threshold checking
    };
    
    try {
      const result = await vote.mutateAsync(voteData);
      
      toast.dismiss("submit-vote");
      toast.success("Vote submitted successfully!");
      
      // Check if this was a mute poll and if poll has reached threshold
      // We'll do this by checking if the vote result includes a closePollSignature
      // which indicates the poll reached its threshold and was closed
      if (result && typeof result !== 'string' && result.closePollSignature && activePoll.pollType === 0 && activePoll.target) {
        // This was a successful mute poll vote that reached threshold
        try {
          // Find the member who was targeted by the poll
          const targetMember = members.find(m => m.publicKey.toString() === activePoll.target?.toString());
          
          if (targetMember) {
            // Try to mute the target member using our utility function
            toast.loading(`Muting ${targetMember.name || targetMember.publicKey.toString().substring(0, 8)}...`, { id: "muting-user" });
            
            // Get the room name from URL
            const roomName = getRoomNameFromUrl();
            
            if (roomName) {
              try {
                // Get a track ID from recent events if possible
                const recentTrackEvents = (window as any).recentLiveKitEvents || [];
                const targetUserTrackEvent = recentTrackEvents.find((event: any) => 
                  event?.participant === targetMember.publicKey.toString() && 
                  event?.event === 'trackPublished' &&
                  event?.args?.[0]?.kind === 'audio'
                );
                
                // Execute the mute operation, passing track ID if found
                await handleMutePollSuccess(
                  targetMember.publicKey.toString(),
                  targetMember.name,
                  targetUserTrackEvent?.args?.[0]?.trackSid
                );
                
                toast.dismiss("muting-user");
                toast.success(`Successfully muted ${targetMember.name || targetMember.publicKey.toString().substring(0, 8)}`);
              } catch (error) {
                toast.dismiss("muting-user");
                toast.error(`Error muting participant: ${error instanceof Error ? error.message : String(error)}`);
              }
            } else {
              toast.dismiss("muting-user");
              toast.error("Could not determine room name for muting participant");
            }
          }
        } catch (err) {
          console.error("Error handling mute after successful poll:", err);
        }
      }
      
      setSelectedOption(null);
      
      // Manually refresh after a short delay
      setTimeout(() => {
        fetchActivePoll();
        setIsVoting(false);
      }, 1000);
    } catch (err) {
      toast.dismiss("submit-vote");
      toast.error(`Failed to vote: ${(err as Error).message}`);
      setIsVoting(false);
    }
  }, [selectedOption, activePoll, partyAddress, vote, isVoting, fetchActivePoll, members]);

  // Optimize rendering - don't show until we have minimal data loaded
  if (!publicKey || !partyAddress) {
    return null;
  }
  
  return (
    <div className="bg-base-200 rounded-lg space-y-2">
      <div className="flex justify-between items-center p-3 border-b border-base-300">
        <h3 className="font-bold">Party Polls</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="py-1 px-2 h-8"
            onClick={manualRefresh}
            disabled={isLoading}
          >
            {isLoading ? 
              <span className="inline-block animate-spin">⟳</span> : 
              <span>↻</span>
            }
          </Button>
          {publicKey && (
            <Button
              size="sm"
              variant={showCreatePoll ? "outline" : "default"}
              onClick={() => setShowCreatePoll(!showCreatePoll)}
              className="py-1 px-2 h-8"
            >
              {showCreatePoll ? 'Cancel' : 'Create Poll'}
            </Button>
          )}
        </div>
      </div>
      
      {showCreatePoll && publicKey && (
        <div className="space-y-2 bg-base-300 p-3 mx-3 mb-3 rounded-md">
          <h4 className="font-medium text-sm">Create New Poll</h4>
          
          <div className="space-y-2">
            <label className="text-xs block">Poll Type</label>
            <select 
              className="select select-bordered w-full select-sm text-sm h-8"
              value={pollType}
              onChange={(e) => setPollType(parseInt(e.target.value))}
            >
              <option value={2}>General Poll</option>
              <option value={0}>Mute Member</option>
              <option value={1}>Kick Member</option>
            </select>
          </div>
          
          {(pollType === 0 || pollType === 1) && members.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs block">Select Member</label>
              <select
                className="select select-bordered w-full select-sm text-sm h-8"
                value={targetMember}
                onChange={(e) => setTargetMember(e.target.value)}
              >
                <option value="">Select member...</option>
                {members.map((member) => (
                  <option key={member.publicKey.toString()} value={member.publicKey.toString()}>
                    {member.name || member.publicKey.toString().substring(0, 10) + '...'}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {pollType === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-xs block">Question</label>
                <Input
                  type="text"
                  placeholder="Enter poll question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs block">Options</label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-1">
                      <Input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);
                        }}
                        className="h-8 text-sm"
                      />
                      {options.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newOptions = [...options];
                            newOptions.splice(index, 1);
                            setOptions(newOptions);
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {options.length < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                      onClick={() => setOptions([...options, ''])}
                    >
                      + Add Option
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          
          <Button
            className="w-full h-8 text-sm mt-2"
            disabled={
              startPoll.isPending ||
              isCreatingPoll ||
              (pollType === 2 && (!question || options.some(o => !o))) ||
              ((pollType === 0 || pollType === 1) && !targetMember)
            }
            onClick={handleCreatePoll}
          >
            {isCreatingPoll ? 
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span> 
              : 'Create Poll'
            }
          </Button>
        </div>
      )}
      
      {isLoading && <div className="text-center py-2 px-3 text-sm">Loading polls...</div>}
      
      {activePoll ? (
        <div className="bg-base-300 p-3 mx-3 mb-3 rounded-md">
          <div className="mb-2">
            <h4 className="font-medium text-sm">{activePoll.pollQuestion}</h4>
            <div className="text-xs text-gray-500 flex justify-between mt-1">
              <span>
                {activePoll.pollType === 0 ? "Mute Poll" :
                 activePoll.pollType === 1 ? "Kick Poll" :
                 "General Poll"}
                {activePoll.ended && " (Ended)"}
              </span>
              <span>Votes: {activePoll.totalVotes}</span>
            </div>
            
            {(activePoll.pollType === 0 || activePoll.pollType === 1) && activePoll.target && (
              <div className="text-xs mt-1">
                Target: {getMemberName(activePoll.target.toString())}
              </div>
            )}
          </div>
          
          <div className="space-y-1 mb-3">
            {activePoll.options.map((option, index) => (
              <div 
                key={index} 
                className={`flex items-center p-2 rounded-md border ${
                  selectedOption === index ? 'border-primary bg-primary/10' : 'border-gray-300'
                } ${!activePoll.ended ? 'cursor-pointer hover:bg-base-200 transition-colors' : ''}`}
                onClick={() => !hasVoted && !activePoll.ended && setSelectedOption(index)}
              >
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="poll-option"
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  disabled={hasVoted || activePoll.ended}
                  className="mr-2 h-3 w-3"
                />
                <label htmlFor={`option-${index}`} className={`flex-1 ${!activePoll.ended ? 'cursor-pointer' : ''} text-sm`}>
                  {option}
                </label>
                <span className="text-xs bg-base-200 px-1 rounded">{activePoll.votes[index]}</span>
              </div>
            ))}
          </div>
          
          <Button
            className="w-full h-8 text-sm"
            disabled={vote.isPending || selectedOption === null || hasVoted || isVoting || activePoll.ended}
            onClick={handleVote}
          >
            {isVoting ? 
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Voting...
              </span> 
              : hasVoted ? 'You voted' : activePoll.ended ? 'Poll Ended' : 'Submit Vote'
            }
          </Button>
        </div>
      ) : (
        !isLoading && <div className="text-center py-3 px-3 text-xs text-gray-500">No active polls right now.</div>
      )}
    </div>
  );
} 
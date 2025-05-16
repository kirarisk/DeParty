'use client'

import { getDepartyProgram, getDepartyProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram, Connection as SolanaConnection, Commitment } from '@solana/web3.js'
import { useMutation, useQuery, QueryFunctionContext, useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN, AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount} from "@solana/spl-token";

// Configuration for Ephemeral Rollup
const ER_RPC_ENDPOINT = "https://devnet.magicblock.app/";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app/";
const ER_DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

export function useDepartyProgram() {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  // Base Layer Setup
  const baseProvider = useAnchorProvider()
  const programId = useMemo(() => getDepartyProgramId(cluster.network as Cluster), [cluster])
  const baseProgram = useMemo(() => {
    if (!baseProvider || !programId) return null;
    return getDepartyProgram(baseProvider, programId)
  }, [baseProvider, programId])

  // Ephemeral Rollup (ER) Layer Setup
  const erConnection = useMemo(() => {
    try {
      return new SolanaConnection(ER_RPC_ENDPOINT, { wsEndpoint: ER_WS_ENDPOINT });
    } catch (error) {
      console.error("Failed to initialize Ephemeral Rollup connection:", error);
      return null;
    }
  }, []);

  const erProvider = useMemo(() => {
    if (!erConnection || !wallet.connected || !wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      console.warn("[useDepartyProgram] ER Provider cannot be initialized: missing erConnection or wallet not fully available.");
      return null;
    }
    const erAnchorWallet = {
      publicKey: wallet.publicKey!,
      signTransaction: wallet.signTransaction!,
      signAllTransactions: wallet.signAllTransactions!,
    };
    return new AnchorProvider(erConnection, erAnchorWallet, AnchorProvider.defaultOptions());
  }, [erConnection, wallet.connected, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  const erProgram = useMemo(() => {
    if (!erProvider || !programId) {
      console.warn("[useDepartyProgram] ER Program cannot be initialized: missing erProvider or programId.");
      return null;
    }
    return getDepartyProgram(erProvider, programId);
  }, [erProvider, programId]);

  // PDAs and protocol functions (primarily interact with baseProgram)
  const configPda = useMemo(() => {
    if (!baseProgram) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      baseProgram.programId
    )
    return pda
  }, [baseProgram])

  const treasuryPda = useMemo(() => {
    if (!baseProgram) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      baseProgram.programId
    )
    return pda
  }, [baseProgram])

  const getConfig = useQuery({
    queryKey: ['departy', 'config', { cluster }],
    queryFn: () => {
      if (!baseProgram || !configPda) throw new Error("Base program or configPda not available for getConfig");
      return baseProgram.account.config.fetch(configPda)
    },
    enabled: !!baseProgram && !!configPda,
  })

  const initializeProtocol = useMutation({
    mutationKey: ['departy', 'initialize', { cluster }],
    mutationFn: async (params: { subscriptionPrice: BN, subscriptionAllowance: BN, feeBasisPoints: number }) => {
      if (!baseProgram || !configPda || !treasuryPda || !baseProvider?.wallet?.publicKey) throw new Error("Base program or required accounts not available for initializeProtocol");
      return baseProgram.methods
        .setup(params.subscriptionPrice, params.subscriptionAllowance, params.feeBasisPoints)
      .accountsPartial({
        config: configPda,
        admin: baseProvider.wallet.publicKey,
        treasury: treasuryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature as string)
      return getConfig.refetch()
    },
    onError: (error) => {
      console.error('Initialize protocol error:', error)
      toast.error('Failed to initialize protocol')
    },
  })

  return {
    baseProgram,
    erProgram,
    programId,
    configPda,
    treasuryPda,
    getConfig,
    initializeProtocol,
    baseProvider,
    erProvider,
    erConnection,
  }
}

export function useDepartyProfile({ publicKey }: { publicKey: PublicKey | null }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { baseProgram } = useDepartyProgram()
  const queryClient = useQueryClient();

  const profilePda = useMemo(() => {
    if (!publicKey || !baseProgram) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("profile"),
        publicKey.toBuffer()
      ],
      baseProgram.programId
    )
    return pda
  }, [baseProgram, publicKey])

  const queryKey = ['departy', 'profile', { cluster, publicKey }];

  const getProfile = useQuery({
    queryKey,
    queryFn: () => {
      if (!profilePda || !baseProgram) throw new Error("Profile PDA or baseProgram is not available");
      return baseProgram.account.profile.fetch(profilePda)
        .catch(error => {
          return null;
        });
    },
    enabled: !!publicKey && !!profilePda && !!baseProgram,
  })

  const createProfile = useMutation({
    mutationKey: ['departy', 'create-profile', { cluster, publicKey }],
    mutationFn: async (name: string) => {
      if (!profilePda || !publicKey || !baseProgram) throw new Error("Profile PDA, public key, or baseProgram is not available for creation");
      return baseProgram.methods
        .init(name)
      .accountsPartial({
          profile: profilePda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (tx) => {
      transactionToast(tx as string)
      return getProfile.refetch()
    },
    onError: (error) => {
      console.error('Create profile error:', error)
      toast.error('Failed to create profile')
    },
  })

  const closeAccount = useMutation({
    mutationKey: ['departy', 'closeAccount', { cluster, publicKey }],
    mutationFn: async () => {
      if (!profilePda || !publicKey || !baseProgram) throw new Error("Profile PDA, public key or baseProgram is not available for closing");
      return baseProgram.methods.closeProfile()
        .accountsPartial({
          profile: profilePda,
          user: publicKey, 
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' as Commitment });
    },
    onSuccess: (tx) => {
      transactionToast(tx as string)
      queryClient.invalidateQueries({ queryKey });
      toast.success('Account closed successfully')
    },
    onError: (error) => {
      console.error('Close account error:', error)
      toast.error('Failed to close account')
    },
  })

  return {
    profilePda,
    getProfile,
    createProfile,
    closeAccount
  }
}

export function useDepartyParty() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const publicKey = wallet.publicKey
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { baseProgram, erProgram, programId: baseProgramId, treasuryPda } = useDepartyProgram()
  const { profilePda } = useDepartyProfile({ publicKey })
  const queryClient = useQueryClient();
  
  // Create a direct ER connection that's independent of erProgram
  const directErConnection = useMemo(() => {
    try {
      return new SolanaConnection(ER_RPC_ENDPOINT, { 
        wsEndpoint: ER_WS_ENDPOINT,
        commitment: 'confirmed' 
      });
    } catch (error) {
      console.error("Failed to create direct ER connection:", error);
      return null;
    }
  }, []);

  const getParties = useQuery({
    queryKey: ['departy', 'parties', { cluster, erProgramAvailable: !!erProgram }],
    queryFn: async () => {
      let combinedParties: any[] = [];

      // Fetch parties from base layer
      if (baseProgram) {
        try {
          console.log("[getParties] Fetching parties from base layer...");
          const baseLayerParties = await baseProgram.account.party.all();
          combinedParties = combinedParties.concat(baseLayerParties.map(p => ({ ...p, source: 'base' })));
          console.log(`[getParties] Fetched ${baseLayerParties.length} parties from base layer.`);
        } catch (e) {
          console.error("Failed to fetch base layer parties:", e);
          toast.error("Could not fetch parties from base layer.");
        }
      }

      // Create a Delegation Program instance to fetch delegated parties
      if (connection && baseProgram) {
        try {
          console.log("[getParties] Creating Delegation Program instance to fetch delegated parties...");
          
          // Create a provider for the Delegation Program
          const delegationProvider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
          );
          
          // Create a Program instance for the Delegation Program using the base program's IDL
          // The Delegation Program uses the same account structure, just with a different owner
          const delegationProgram = new Program(
            { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
            delegationProvider
          );
          
          // Fetch all party accounts owned by the Delegation Program
          console.log("[getParties] Fetching delegated parties from ER using Delegation Program...");
          try {
            const delegatedParties = await delegationProgram.account.party.all();
            console.log(`[getParties] Fetched ${delegatedParties.length} delegated parties from ER.`);
            combinedParties = combinedParties.concat(delegatedParties.map(p => ({ ...p, source: 'er' })));
          } catch (e) {
            console.error("Failed to fetch delegated parties from ER:", e);
          }
        } catch (e) {
          console.error("Failed to initialize Delegation Program:", e);
        }
      }
      
      // Deduplicate and prioritize ER parties
      const partyMap = new Map();
      combinedParties.forEach(party => {
        const key = party.publicKey.toString();
        if (!partyMap.has(key) || party.source === 'er') {
          partyMap.set(key, party);
        }
      });
      
      const finalParties = Array.from(partyMap.values());
      console.log(`[getParties] Total unique parties after merge: ${finalParties.length}`);
      return finalParties;
    },
    enabled: !!baseProgram,
  })

  const createParty = useMutation({
    mutationKey: ['departy', 'create-party', { cluster }],
    mutationFn: async (params: {
      name: string, 
      description: string, 
      tokensRequired: BN,
      memberLimit: number,
      mint: PublicKey
    }) => {
      if (!publicKey || !profilePda || !baseProgram || !treasuryPda) throw new Error('User, profile, baseProgram or treasuryPda not available');
      
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any, 
        params.mint,
        publicKey
      )
      
      const [partyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("party"),
          params.mint.toBuffer(),
          publicKey.toBuffer()
        ],
        baseProgram.programId
      )

      const signature = await baseProgram.methods
        .create(
          params.name, 
          params.description, 
          params.tokensRequired,
          params.memberLimit
        )
        .accountsPartial({
          party: partyPda,
          mint: params.mint,
          tokenAccount: tokenAccount.address,
          user: publicKey,
          treasury: treasuryPda,
          profile: profilePda
        })
        .rpc()
      
      return {
        signature,
        partyAddress: partyPda,
        mint: params.mint,
        creator: publicKey
      }
    },
    onSuccess: async (result) => {
      transactionToast(result.signature as string)
      if (result.partyAddress && result.mint && result.creator) {
        try {
          toast.loading('Delegating party to rollup...', { id: 'delegating' });
          await delegateParty.mutateAsync({
            partyAddress: result.partyAddress,
            mint: result.mint,
            creator: result.creator,
          });
        } catch (e) {
          console.error("Delegation call failed after party creation:", e);
          toast.dismiss('delegating');
          getParties.refetch(); 
        }
      } else {
        getParties.refetch();
      }
    },
    onError: (error) => {
      console.error('Create party error:', error)
      toast.error('Failed to create party: ' + (error as Error).message)
    },
  })

  const delegateParty = useMutation({
    mutationKey: ['departy', 'delegate-party', { cluster, user: publicKey }],
    mutationFn: async (params: { partyAddress: PublicKey; mint: PublicKey; creator: PublicKey }) => {
      if (!baseProgram) throw new Error('Base program not available for delegation instruction.');
      if (!publicKey) throw new Error('User not available for delegation');
      return baseProgram.methods 
        .delegateParty(params.mint, params.creator)
        .accountsPartial({
          pda: params.partyAddress, 
          payer: publicKey, 
        })
        .rpc({ commitment: 'confirmed' as Commitment });
    },
    onSuccess: async (signature, variables) => {
      toast.dismiss('delegating');
      transactionToast(signature as string);
      
      // Verify the PDA is available on ER after delegation (after a short delay)
      setTimeout(async () => {
        try {
          const partyPublicKey = variables.partyAddress;
          const accountInfo = await directErConnection?.getAccountInfo(partyPublicKey, 'confirmed');
          
          if (accountInfo) {
            toast.success('Party verified on rollup! Will appear in your listings.');
          } else {
            toast.error('Party delegated but not yet available on rollup. Try refreshing later.');
          }
        } catch (e) {
          console.error("[delegateParty] Error during post-delegation verification:", e);
        }
        getParties.refetch();
      }, 2000);
      
      toast.success('Party delegated successfully to rollup!');
    },
    onError: (error) => {
      toast.dismiss('delegating');
      console.error('Delegate party error:', error);
      toast.error('Failed to delegate party: ' + (error as Error).message);
      getParties.refetch(); 
    },
  });

  const joinParty = useMutation({
    mutationKey: ['departy', 'join-party', { cluster }],
    mutationFn: async (params: { partyAddress: PublicKey; partyName: string; isOnEr?: boolean }) => {
      if (!publicKey || !profilePda || !baseProgram) throw new Error('User, profile or baseProgram not available')
      
      // Determine if this party is on ER by checking if isOnEr is explicitly passed
      // or by attempting to fetch it via delegationProgram
      let isOnEr = params.isOnEr;
      
      if (isOnEr === undefined && erProgram) {
        try {
          // Create a delegation program instance to check if this party exists on ER
          const delegationProvider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
          );
          
          const delegationProgram = new Program(
            { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
            delegationProvider
          );
          
          // Try to fetch the party from ER
          await delegationProgram.account.party.fetch(params.partyAddress);
          isOnEr = true;
          console.log(`[joinParty] Party ${params.partyAddress.toString()} found on ER.`);
        } catch (e) {
          isOnEr = false;
          console.log(`[joinParty] Party ${params.partyAddress.toString()} not found on ER, assuming base layer.`);
        }
      }
      
      try {
        let partyAccountInfo;
        let targetProgram;
        
        if (isOnEr && erProgram) {
          console.log(`[joinParty] Using Delegation Program for ER party.`);
          // For ER parties, we need to create a delegation program instance to access the account
          const delegationProvider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
          );
          
          const delegationProgram = new Program(
            { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
            delegationProvider
          );
          
          // Fetch the party account using the delegation program
          partyAccountInfo = await delegationProgram.account.party.fetch(params.partyAddress);
          // But use erProgram for transaction signing
          targetProgram = erProgram;
        } else {
          console.log(`[joinParty] Using base program for party.`);
          partyAccountInfo = await baseProgram.account.party.fetch(params.partyAddress);
          targetProgram = baseProgram;
        }
        
        if (!targetProgram) {
          throw new Error("Program not available for joining party");
        }
        
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          publicKey as any, 
          partyAccountInfo.mint,
          publicKey
        );
        
        console.log(`[joinParty] Sending transaction using ${isOnEr ? 'ER' : 'base'} program.`);
        const signature = await targetProgram.methods
          .join()
          .accountsPartial({
            party: params.partyAddress,
            user: publicKey,
            tokenAccount: tokenAccount.address,
            profile: profilePda
          })
          .rpc()
          
        return { 
          signature, 
          partyAddress: params.partyAddress, 
          partyName: params.partyName,
          success: true 
        };
      } catch (error) {
        console.error('Join party error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      transactionToast(data.signature as string);
      toast.success('Successfully joined the party!');
      getParties.refetch();
    },
    onError: (error) => {
      console.error('Join party error:', error);
      toast.error('Failed to join party: ' + (error as Error).message);
    },
  });
  


  const endParty = useMutation({
    mutationKey: ['departy', 'end-party', { cluster }],
    mutationFn: async (params: { partyAddress: PublicKey; isOnEr?: boolean }) => {
      if (!publicKey || !baseProgram) throw new Error('User or baseProgram not available for ending party');
      
      try {
        let targetProgram;
        
        if (params.isOnEr && erProgram) {
          console.log(`[endParty] Using ER program for party ${params.partyAddress.toString()}`);
          targetProgram = erProgram;
          
          // Step 1: Undelegate the party from ER with confirmed commitment
          console.log(`[endParty] Undelegating party from ER (waiting for confirmation)...`);
          const undelegateSignature = await targetProgram.methods
            .undelegateParty()
            .accountsPartial({
              party: params.partyAddress,
              payer: publicKey
            })
            .rpc({ commitment: 'confirmed' as Commitment });
          
          transactionToast(undelegateSignature);
          console.log(`[endParty] Party undelegation confirmed! Now closing...`);
          
          // Use baseProgram to close the party since it's now undelegated
          targetProgram = baseProgram;
        } else {
          console.log(`[endParty] Using base program for party ${params.partyAddress.toString()}`);
          targetProgram = baseProgram;
        }
        
        if (!targetProgram) {
          throw new Error("Program not available for ending party");
        }
        
        // Step 2: Close the party (with confirmed commitment)
        console.log(`[endParty] Closing party (waiting for confirmation)...`);
        const signature = await targetProgram.methods
          .closeParty()
          .accountsPartial({
            party: params.partyAddress,
            user: publicKey
          })
          .rpc({ commitment: 'confirmed' as Commitment });
          
        return { 
          signature, 
          partyAddress: params.partyAddress,
          success: true 
        };
      } catch (error) {
        console.error('End party error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      transactionToast(data.signature as string);
      toast.success('Successfully ended the party!');
      getParties.refetch();
    },
    onError: (error) => {
      console.error('End party error:', error);
      toast.error('Failed to end party: ' + (error as Error).message);
    },
  });

  return {
    getParties,
    createParty,
    joinParty,
    delegateParty,
    endParty,
  }
}


export function useDepartyPolls() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const publicKey = wallet.publicKey
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { baseProgram, erProgram, configPda, treasuryPda } = useDepartyProgram()
  const { profilePda } = useDepartyProfile({ publicKey })
  const queryClient = useQueryClient();

  const startPoll = useMutation({
    mutationKey: ['departy', 'start-poll', { cluster }],
    mutationFn: async (params: { 
      partyAddress: PublicKey, 
      pollType: number,
      question: string, 
      options: string[],
      targetProfile?: PublicKey | null
    }) => {
      if (!publicKey || !profilePda || !baseProgram || !configPda) 
        throw new Error('User, profile, base program or config pda not available for poll')
      
      // Only derive targetPDA if targetProfile is provided
      let targetPDA: PublicKey | null = null;
      if (params.targetProfile) {
        [targetPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("profile"),
          params.targetProfile.toBuffer()
        ],
        baseProgram.programId
      );
      }

      const [pollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          params.partyAddress.toBuffer()
        ],
        baseProgram.programId
      );
      
      const signature = await baseProgram.methods
        .startPoll(
          params.pollType,
          params.question,
          params.options,
          params.partyAddress
        )
        .accountsPartial({
          user: publicKey,
          config: configPda,
          poll: pollPda,
          profile: profilePda,
          target: targetPDA
        })
        .rpc()
      
      return {
        signature,
        pollAddress: pollPda,
        partyAddress: params.partyAddress
      }
    },
    onSuccess: async (result) => {
      transactionToast(result.signature as string)
      if (result.pollAddress && result.partyAddress) {
        try {
          toast.loading('Delegating poll to rollup...', { id: 'delegating-poll' });
          await delegatePoll.mutateAsync({
            pollAddress: result.pollAddress,
            partyAddress: result.partyAddress
          });
        } catch (e) {
          console.error("Poll delegation failed:", e);
          toast.dismiss('delegating-poll');
        }
      }
    },
    onError: (error) => {
      console.error('Start poll error:', error)
      toast.error('Failed to start poll: ' + (error as Error).message)
    },
  })

  const delegatePoll = useMutation({
    mutationKey: ['departy', 'delegate-poll', { cluster, user: publicKey }],
    mutationFn: async (params: { pollAddress: PublicKey; partyAddress: PublicKey }) => {
      if (!baseProgram) 
        throw new Error('Programs not available for delegation instruction.');
      if (!publicKey) 
        throw new Error('User not available for delegation');
      
      return baseProgram.methods
        .delegatePoll(params.partyAddress, publicKey)
        .accountsPartial({
          pda: params.pollAddress,
          payer: publicKey
        })
        .rpc({ commitment: 'confirmed' as Commitment });
    },
    onSuccess: async (signature) => {
      toast.dismiss('delegating-poll');
      transactionToast(signature as string);
      toast.success('Poll delegated successfully to rollup!');
    },
    onError: (error) => {
      toast.dismiss('delegating-poll');
      console.error('Delegate poll error:', error);
      toast.error('Failed to delegate poll: ' + (error as Error).message);
    },
  });

  const vote = useMutation({
    mutationKey: ['departy', 'vote', { cluster }],
    mutationFn: async (params: { 
      partyAddress: PublicKey,
      optionIndex: number,
      pollData?: any,  // Pass the poll data to check for vote threshold
      isOnEr?: boolean
    }) => {
      if (!publicKey || !baseProgram || !configPda) 
        throw new Error('User, program, or config not available for vote')
      
      console.log("[vote] Starting vote for party:", params.partyAddress.toString());
      
      // Determine if this poll is on ER by checking if isOnEr is explicitly passed
      // or by attempting to fetch it via delegationProgram
      let isOnEr = params.isOnEr;
      
      if (isOnEr === undefined && erProgram) {
        try {
          console.log(`[vote] Checking if poll is on ER...`);
          // Create a delegation program instance to check if this poll exists on ER
          const delegationProvider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
          );
          
          const delegationProgram = new Program(
            { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
            delegationProvider
          );
          
          // Derive the poll PDA
          const [pollPda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("poll"),
              params.partyAddress.toBuffer()
            ],
            baseProgram.programId
          );
          
          // Try to fetch the poll from ER
          await delegationProgram.account.poll.fetch(pollPda);
          isOnEr = true;
          console.log(`[vote] Poll for party ${params.partyAddress.toString()} found on ER.`);
        } catch (e) {
          isOnEr = false;
          console.log(`[vote] Poll for party ${params.partyAddress.toString()} not found on ER, assuming base layer.`);
        }
      }
      
      try {
        console.log("[vote] Using", isOnEr ? "ER" : "base layer", "for voting");
        
        // Derive the poll PDA
        const [pollPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("poll"),
            params.partyAddress.toBuffer()
          ],
          baseProgram.programId
        );
        
        console.log("[vote] Poll PDA:", pollPda.toString());
        
        let pollAccountInfo;
        let targetProgram;
        
        if (isOnEr && erProgram) {
          console.log(`[vote] Using Delegation Program for ER poll.`);
          // For ER polls, we need to create a delegation program instance to access the account
          const delegationProvider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
          );
          
          const delegationProgram = new Program(
            { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
            delegationProvider
          );
          
          // Fetch the poll account using the delegation program
          pollAccountInfo = await delegationProgram.account.poll.fetch(pollPda);
          // But use erProgram for transaction signing
          targetProgram = erProgram;
        } else {
          console.log(`[vote] Using base program for poll.`);
          pollAccountInfo = await baseProgram.account.poll.fetch(pollPda);
          targetProgram = baseProgram;
        }
        
        if (!targetProgram) {
          throw new Error("Program not available for voting");
        }
        
        console.log(`[vote] Sending vote transaction using ${isOnEr ? 'ER' : 'base'} program.`);
        const signature = await erProgram.methods
          .vote(params.optionIndex)
          .accountsPartial({
            party: params.partyAddress,
            poll: pollPda,
            voter: publicKey,
            config: configPda
          })
          .rpc()
        
        console.log("[vote] Vote submitted successfully:", signature);
        
        // Get the current poll data to check if threshold is reached
        let currentPollData = params.pollData;
        if (!currentPollData) {
          try {
            console.log("[vote] Fetching updated poll data to check threshold");
            currentPollData = await fetchPollForParty(params.partyAddress, null);
          } catch (e) {
            console.error("[vote] Error fetching updated poll data:", e);
            // Return just the vote signature if we can't check the threshold
            return signature;
          }
        }
        
        // Check if the vote threshold has been reached
        // Note: Check all possible property names since they might be camelCase or snake_case
        const totalVotes = 
          currentPollData?.totalVotes || 
          currentPollData?.total_votes || 
          currentPollData?.totalvotes || 0;
          
        const requiredVotes = 
          currentPollData?.requiredVotes || 
          currentPollData?.required_votes || 
          currentPollData?.requiredvotes || 0;
        
        console.log("[vote] Checking vote threshold:", {
          totalVotes,
          requiredVotes,
          pollData: currentPollData
        });
        
        // If threshold reached, undelegate and close the poll
        if (totalVotes >= requiredVotes-1) {
          console.log("[vote] Vote threshold reached! Processing poll completion...");
          
          // If the poll is on ER, we need to undelegate it first
          if (erProgram) {
            try {
              console.log("[vote] Undelegating poll from ER");
              
              // Use the same method as in joinParty function when undelegating
              const undelegateSignature = await erProgram.methods
                .undelegatePoll()
                .accountsPartial({
                  poll: pollPda,
                  payer: publicKey
                })
                .rpc({ commitment: 'confirmed' as Commitment });
                
              console.log("[vote] Poll undelegated successfully:", undelegateSignature);
              
              // Wait a bit for the undelegation to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Now close the poll using baseProgram
              try {
                console.log("[vote] Closing poll with baseProgram after undelegation");
                const closePollSignature = await baseProgram.methods
                  .closePoll()  // Use closePoll as specified by the user
                  .accountsPartial({
                    poll: pollPda,
                    user: publicKey
                  })
                  .rpc();
                  
                console.log("[vote] Poll closed successfully:", closePollSignature);
                return { voteSignature: signature, closePollSignature };
              } catch (e) {
                console.error("[vote] Error closing poll:", e);
                return signature;
              }
            } catch (e) {
              console.error("[vote] Error undelegating poll:", e);
              return signature;
            }
          } else {
            // If the poll is on base layer, just close it directly
            try {
              console.log("[vote] Closing poll on base layer directly");
              const closePollSignature = await baseProgram.methods
                .closePoll()  // Use closePoll as specified by the user
                .accountsPartial({
                  poll: pollPda,
                  user: publicKey
                })
                .rpc();
                
              console.log("[vote] Poll closed successfully:", closePollSignature);
              return { voteSignature: signature, closePollSignature };
            } catch (e) {
              console.error("[vote] Error closing poll:", e);
              return signature;
            }
          }
        }
        
        // For now, just return the signature (closing polls will be implemented later)
        return signature;
      } catch (error) {
        console.error('Vote error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      if (typeof result === 'string') {
        // Simple vote
        transactionToast(result);
        toast.success('Vote submitted successfully!');
      } else if (result && result.voteSignature && result.closePollSignature) {
        // Vote + poll closure
        transactionToast(result.voteSignature);
        transactionToast(result.closePollSignature);
        toast.success('Vote submitted and poll threshold reached! Poll has been closed.');
      }
    },
    onError: (error) => {
      console.error('Vote error:', error)
      toast.error('Failed to vote: ' + (error as Error).message)
    },
  })

  // Add this new function to explicitly fetch a poll with a specific partyAddress
  const fetchPollForParty = async (specificPartyAddress: PublicKey, queryClient: any) => {
    if (!publicKey || !baseProgram) {
      return null;
    }
    
    // Derive the poll PDA using the specific party address
    const [pollPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        specificPartyAddress.toBuffer()
      ],
      baseProgram.programId
    );
    
    let result = null;
    
    // Try base layer first
    try {
      const pollData = await baseProgram.account.poll.fetch(pollPda);
      result = { ...pollData, source: 'base' };
    } catch (e) {
      // Poll not found on base layer, will try ER
    }
    
    // Try ER if not found on base layer
    if (!result && baseProgram.idl) {
      try {
        const delegationProvider = new AnchorProvider(
          wallet.publicKey ? new SolanaConnection(ER_RPC_ENDPOINT) : baseProgram.provider.connection,
          wallet as any,
          AnchorProvider.defaultOptions()
        );
        
        const delegationProgram = new Program(
          { ...baseProgram.idl, address: ER_DELEGATION_PROGRAM_ID.toBase58() },
          delegationProvider
        );
        
        try {
          const pollData = await erProgram.account.poll.fetch(pollPda);
          result = { ...pollData, source: 'er' };
        } catch (e) {
          // Poll not found on ER layer either
        }
      } catch (e) {
        // Error setting up delegation program
      }
    }
    
    return result;
  };

  const getActivePoll = useQuery<any, Error, any, [string, string, { cluster: Cluster, partyAddress: PublicKey | null}]> ({
    queryKey: ['departy', 'active-poll', { cluster: cluster.network as Cluster, partyAddress: null }], 
    queryFn: async (context: QueryFunctionContext<[string, string, { cluster: Cluster, partyAddress: PublicKey | null}]>) => {
      const { partyAddress } = context.queryKey[2];
      
      if (!publicKey || !partyAddress || !baseProgram) {
        return null;
      }
      
      // Use our explicit fetch function to get the poll
      return await fetchPollForParty(partyAddress, null);
    },
    enabled: false, 
  })

  return {
    startPoll,
    delegatePoll,
    vote,
    getActivePoll,
    fetchPollForParty
  }
}



'use client';

import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  RoomName,
  GridLayout,
  ParticipantTile,
  useTracks,
  useParticipants,
  useToken,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { generateRandomUserId } from '../../lib/helper';
import { CallRoomPolls } from './PartyPolls';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

// Define a lightweight Polls toggle button to minimize re-renders
const PollsToggleButton = memo(({ showPolls, togglePolls }: { showPolls: boolean; togglePolls: () => void }) => (
  <button
    className="lk-button"
    onClick={togglePolls}
    style={{ margin: '0 0.5rem' }}
  >
    {showPolls ? 'Hide Polls' : 'Show Polls'}
  </button>
));

// Memoize the VideoConferenceLayout component to prevent unnecessary re-renders
const VideoConferenceLayout = memo(function VideoConferenceLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ flexGrow: 1, width: '100%', height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
});

// Memoize the CallRoomPollsWrapper component to prevent unnecessary re-renders
const CallRoomPollsWrapper = memo(function CallRoomPollsWrapper({ 
  partyAddress, 
  partyCreator, 
  isOnEr 
}: { 
  partyAddress: PublicKey, 
  partyCreator: PublicKey, 
  isOnEr?: boolean 
}) {
  const participants = useParticipants();
  
  // Memoize the members array to prevent unnecessary re-renders
  const members = useMemo(() => {
    return participants.map(participant => ({
      publicKey: new PublicKey(participant.identity),
      name: participant.name || participant.identity.substring(0, 10) + '...'
    }));
  }, [participants]);
  
  return (
    <CallRoomPolls 
      partyAddress={partyAddress}
      partyCreator={partyCreator}
      isOnEr={isOnEr}
      members={members}
    />
  );
});

// Named function expression to fix react/display-name issue
const LiveKitCallRoom = function LiveKitCallRoom() {
  const [showPolls, setShowPolls] = useState(false);
  const [tryToConnect, setTryToConnect] = useState(false);
  const [connected, setConnected] = useState(false);
  const initialized = useRef(false);
  
  // Use callback for stable function references
  const togglePolls = useCallback(() => {
    setShowPolls(prev => !prev);
  }, []);

  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  const partyAddressParam = params?.get('partyAddress');
  const partyCreatorParam = params?.get('partyCreator');
  const isOnEr = params?.get('isOnEr') === 'true';

  const { publicKey } = useWallet();
  
  // Parse party data from URL params
  const partyAddress = useMemo(() => {
    if (!partyAddressParam) return null;
    try {
      return new PublicKey(partyAddressParam);
    } catch (e) {
      console.error("Invalid party address:", e);
      return null;
    }
  }, [partyAddressParam]);
  
  const partyCreator = useMemo(() => {
    if (!partyCreatorParam) return null;
    try {
      return new PublicKey(partyCreatorParam);
    } catch (e) {
      console.error("Invalid party creator:", e);
      return null;
    }
  }, [partyCreatorParam]);

  const serverUrl = process.env.NEXT_PUBLIC_LK_SERVER_URL;
  const tokenEndpoint = process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT;

  const token = useToken(tokenEndpoint, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });
  
  // Log initial configuration only once
  useEffect(() => {
    if (!initialized.current) {
      console.log('LiveKit configuration:', {
        serverUrl,
        tokenEndpoint,
        roomName,
        userIdentity,
        partyAddress: partyAddress?.toString(),
        partyCreator: partyCreator?.toString()
      });
      initialized.current = true;
    }
  }, [serverUrl, tokenEndpoint, roomName, userIdentity, partyAddress, partyCreator]);

  if (!tokenEndpoint) {
    return <div style={{padding: '1rem'}}>Error: NEXT_PUBLIC_LK_TOKEN_ENDPOINT is not defined. Check .env.local and restart server.</div>;
  }
  if (!serverUrl) {
    return <div style={{padding: '1rem'}}>Error: NEXT_PUBLIC_LK_SERVER_URL is not defined. Check .env.local and restart server.</div>;
  }

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={tryToConnect}
        video={true}
        audio={true}
        onConnected={() => setConnected(true)}
        onDisconnected={() => {
          setTryToConnect(false);
          setConnected(false);
        }}
      >
        {!connected && (
          <div style={{ display: 'grid', placeContent: 'center', height: '100%' }}>
            <button
              className="lk-button"
              onClick={() => {
                setTryToConnect(true);
              }}
              disabled={tryToConnect || !token}
            >
              {tryToConnect ? 'Connecting...' : (token ? 'Enter Room' : 'Fetching Token...')}
            </button>
          </div>
        )}

        {connected && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', padding: '0.5rem'}}>
              <RoomName />
            </h1>
            <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100% - var(--lk-control-bar-height) - 40px)' }}>
              <div style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
                <VideoConferenceLayout />
              </div>
              
              {partyAddress && partyCreator && showPolls && (
                <div style={{ 
                  width: '320px', 
                  minWidth: '320px',
                  overflowY: 'auto', 
                  borderLeft: '1px solid var(--lk-border-color)',
                  backgroundColor: 'var(--lk-bg-color)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--lk-border-color)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Party Tools</h3>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <CallRoomPollsWrapper 
                      partyAddress={partyAddress} 
                      partyCreator={partyCreator}
                      isOnEr={isOnEr}
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              {partyAddress && partyCreator && (
                <PollsToggleButton showPolls={showPolls} togglePolls={togglePolls} />
              )}
            </div>
            <ControlBar />
            <RoomAudioRenderer />
          </div>
        )}
      </LiveKitRoom>
    </div>
  );
};

export default LiveKitCallRoom;

/**
 * Admin utilities for LiveKit operations
 * These can be used directly from the browser console
 */

// Apply these to the window object
export function setupLiveKitAdminUtils() {
  if (typeof window === 'undefined') return;
  
  // Utility to mute a participant by identity
  window.livekitAdmin = {
    // Mute a participant by their identity (public key)
    muteParticipant: async (participantIdentity: string, muted: boolean = true) => {
      if (!participantIdentity) {
        console.error('Participant identity is required');
        return false;
      }
      
      try {
        // Find the track ID for this participant from captured events
        const trackEvent = window.recentLiveKitEvents?.find(
          (e: any) => e.participant === participantIdentity && 
                      e.args?.[0]?.kind === 'audio'
        );
        
        const trackSid = trackEvent?.args?.[0]?.trackSid;
        
        // Get room information from URL or stored state
        const roomName = new URLSearchParams(window.location.search).get('room');
        const roomId = window.currentRoomId;
        
        if (!roomName && !roomId) {
          console.error('No room information available');
          return false;
        }
        
        console.log(`Muting participant ${participantIdentity} in room ${roomName || roomId}`);
        console.log(`Using track SID: ${trackSid || 'None - will be looked up by server'}`);
        
        // Make the API call
        const response = await fetch('/api/livekit/mute-participant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName,
            roomID: roomId,
            participantIdentity,
            trackSid,
            muted
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to mute participant:', error);
          return false;
        }
        
        const result = await response.json();
        console.log('Mute operation successful:', result);
        return true;
      } catch (err) {
        console.error('Error muting participant:', err);
        return false;
      }
    },
    
    // List all participants that can be muted based on captured events
    listParticipants: () => {
      if (!window.recentLiveKitEvents || window.recentLiveKitEvents.length === 0) {
        console.log('No LiveKit events captured yet');
        return [];
      }
      
      // Get unique participants from events
      const participants = [...new Set(
        window.recentLiveKitEvents
          .filter((e: any) => e.participant)
          .map((e: any) => e.participant)
      )];
      
      console.log('Available participants:', participants);
      return participants;
    },
    
    // Help text
    help: () => {
      console.log(`
LiveKit Admin Utilities:
-----------------------
window.livekitAdmin.muteParticipant(participantIdentity, muted = true)
  Mute or unmute a participant by their identity (public key)
  
window.livekitAdmin.listParticipants()
  List all participants that can be muted based on captured events
  
window.livekitAdmin.help()
  Show this help text
      `);
    }
  };
  
  // Log a help message to the console
  console.log('[LiveKit Admin] Admin utilities loaded. Type window.livekitAdmin.help() for commands');
}

// Add type declarations for the global window object
declare global {
  interface Window {
    livekitAdmin: {
      muteParticipant: (participantIdentity: string, muted?: boolean) => Promise<boolean>;
      listParticipants: () => string[];
      help: () => void;
    };
  }
} 
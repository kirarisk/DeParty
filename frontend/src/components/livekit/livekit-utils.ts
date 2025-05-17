/**
 * Utility functions for LiveKit operations
 */

/**
 * Mute a participant in a LiveKit room
 * @param roomName The name of the room
 * @param participantIdentity The identity of the participant to mute
 * @param muted Whether to mute (true) or unmute (false)
 * @param trackSid Optional track SID if already known
 * @param roomID Optional room ID if different from room name
 * @returns Promise with the result of the operation
 */
export async function muteParticipant(
  roomName: string,
  participantIdentity: string,
  muted: boolean,
  trackSid?: string,
  roomID?: string
): Promise<{success: boolean, message: string, trackSid?: string}> {
  try {
    const response = await fetch('/api/livekit/mute-participant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        roomID,
        participantIdentity,
        trackSid,
        muted
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to ${muted ? 'mute' : 'unmute'} participant`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in muteParticipant:', error);
    throw error;
  }
}

/**
 * Extract room name from the URL query parameters
 * @returns The room name from URL or null if not found
 */
export function getRoomNameFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

/**
 * Extract room ID from the URL or global state
 * @returns The room ID if available, or null
 */
export function getRoomIdFromState(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check for room ID in window object (if LiveKit client stores it there)
  return (window as any).currentRoomId || null;
}

/**
 * Handle the result of a mute poll by muting the target participant
 * @param targetIdentity The identity (public key) of the participant to mute
 * @param userName A display name for the participant (for notifications)
 * @param trackSid Optional track SID if already known
 * @returns Promise with the result of the mute operation
 */
export async function handleMutePollSuccess(
  targetIdentity: string,
  userName?: string,
  trackSid?: string
): Promise<boolean> {
  try {
    const roomName = getRoomNameFromUrl();
    const roomID = getRoomIdFromState();
    
    if (!roomName && !roomID) {
      console.error('Cannot mute: Neither room name nor room ID found');
      return false;
    }
    
    // If we get a trackMuted event, it might have the track ID
    const liveKitEvent = (window as any).lastTrackMutedEvent;
    const eventTrackId = liveKitEvent?.args?.[0]?.trackSid;
    
    // Use the track ID from the event if available and matches the participant
    const effectiveTrackId = 
      (liveKitEvent?.participant === targetIdentity && eventTrackId) 
        ? eventTrackId 
        : trackSid;
    
    const result = await muteParticipant(
      roomName || '', 
      targetIdentity,
      true,
      effectiveTrackId,
      roomID || undefined
    );
    
    console.log(`Successfully muted ${userName || targetIdentity}`, result);
    return true;
  } catch (error) {
    console.error('Failed to mute participant after poll:', error);
    return false;
  }
} 
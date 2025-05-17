import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, TrackType } from 'livekit-server-sdk';

// Get LiveKit server details from environment variables with fallbacks to different patterns
const livekitHost = 
  process.env.NEXT_PUBLIC_LK_SERVER_URL || 
  process.env.LIVEKIT_URL || 
  '';

const livekitApiKey = 
  process.env.LK_API_KEY || 
  '';

const livekitApiSecret = 
  process.env.LK_API_SECRET || 
  '';

// Log environment variables on initialization (only their presence, not actual values)
console.log('LiveKit environment variables loaded:', {
  hasHost: !!livekitHost,
  hasApiKey: !!livekitApiKey, 
  hasApiSecret: !!livekitApiSecret,
  hostVarName: process.env.NEXT_PUBLIC_LIVEKIT_URL ? 'NEXT_PUBLIC_LIVEKIT_URL' : 
               (process.env.LIVEKIT_URL ? 'LIVEKIT_URL' : 'none')
});

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { roomName, roomID, participantIdentity, muted, trackSid } = body;

    // Log the request for debugging
    console.log('Mute participant request details:', {
      roomName,
      roomID,
      participantIdentity,
      muted,
      trackSid,
      body
    });

    // We need either roomName or roomID
    if ((!roomName && !roomID) || !participantIdentity) {
      return NextResponse.json(
        { message: 'Missing required parameters (roomName/roomID and participantIdentity)' },
        { status: 400 }
      );
    }

    // Use either provided roomName or roomID
    const effectiveRoomName = roomID || roomName;

    // Verify we have LiveKit credentials
    if (!livekitHost || !livekitApiKey || !livekitApiSecret) {
      console.error('Missing LiveKit configuration:', {
        hasHost: !!livekitHost,
        hasApiKey: !!livekitApiKey,
        hasApiSecret: !!livekitApiSecret
      });
      return NextResponse.json(
        { 
          message: 'Server not configured for LiveKit',
          details: {
            hasHost: !!livekitHost,
            hasApiKey: !!livekitApiKey,
            hasApiSecret: !!livekitApiSecret
          }
        },
        { status: 500 }
      );
    }

    console.log(`Creating RoomServiceClient with host: ${livekitHost}`);
    // Create a LiveKit Room Service client
    const roomService = new RoomServiceClient(
      livekitHost,
      livekitApiKey,
      livekitApiSecret
    );

    // If trackSid is directly provided, use it
    if (trackSid) {
      console.log(`Using provided trackSid: ${trackSid} to mute participant: ${participantIdentity}`);
      await roomService.mutePublishedTrack(effectiveRoomName, participantIdentity, trackSid, muted);
      
      return NextResponse.json(
        { 
          success: true, 
          message: `Participant ${participantIdentity} ${muted ? 'muted' : 'unmuted'} successfully using provided trackSid`,
          trackSid
        },
        { status: 200 }
      );
    }
    
    // Otherwise, fetch participant info to find their tracks
    console.log(`Getting participant: ${participantIdentity} in room: ${effectiveRoomName}`);
    // First, we need to get the participant to find their tracks
    const participant = await roomService.getParticipant(effectiveRoomName, participantIdentity);
    
    if (!participant || !participant.tracks) {
      console.error('Participant not found or has no tracks:', {
        participantExists: !!participant,
        tracksExist: participant ? !!participant.tracks : false
      });
      return NextResponse.json(
        { message: 'Participant not found or has no tracks' },
        { status: 404 }
      );
    }

    console.log('Participant found with tracks:', participant.tracks);
    // Find the audio track (assuming the first audio track is the one we want to mute)
    const tracks = Object.values(participant.tracks);
    const audioTracks = tracks.filter(track => track.type === TrackType.AUDIO);

    if (audioTracks.length === 0) {
      console.error('No audio track found for participant');
      return NextResponse.json(
        { 
          message: 'No audio track found for participant',
          availableTracks: tracks.map(t => ({ sid: t.sid, type: t.type }))
        },
        { status: 404 }
      );
    }

    // Get the first audio track's SID
    const audioTrackSid = audioTracks[0].sid;
    console.log(`Found audio track with SID: ${audioTrackSid}`);

    // Mute the track
    console.log(`Attempting to ${muted ? 'mute' : 'unmute'} track ${audioTrackSid}`);
    await roomService.mutePublishedTrack(effectiveRoomName, participantIdentity, audioTrackSid, muted);

    console.log('Mute operation completed successfully');
    return NextResponse.json(
      { 
        success: true, 
        message: `Participant ${participantIdentity} ${muted ? 'muted' : 'unmuted'} successfully`,
        trackSid: audioTrackSid
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error muting participant:', error);
    return NextResponse.json(
      { 
        message: 'Failed to mute participant', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
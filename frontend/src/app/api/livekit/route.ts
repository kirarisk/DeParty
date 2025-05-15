import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';

// Use the environment variable names confirmed by the user
const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;

const createToken = async (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API key or secret is not configured on the server.');
  }
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return await at.toJwt();
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('roomName'); // param from useToken is roomName
    const identity = searchParams.get('identity');
    const name = searchParams.get('name');
    const metadata = searchParams.get('metadata');

    if (!identity) {
      return NextResponse.json({ error: 'Missing identity parameter' }, { status: 400 });
    }
    if (!roomName) {
      return NextResponse.json({ error: 'Missing roomName parameter' }, { status: 400 });
    }

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true, // Or false, depending on your needs
    };

    const tokenUserInfo: AccessTokenOptions = { identity };
    if (name) tokenUserInfo.name = name;
    if (metadata) tokenUserInfo.metadata = metadata;
    
    console.log(`Generating token for room: ${roomName}, identity: ${identity}, name: ${name}`);

    const token = await createToken(tokenUserInfo, grant);

    return NextResponse.json({ accessToken: token }); // useToken expects { accessToken: ... }
  } catch (e: any) {
    console.error("Error in /api/livekit GET:", e.message);
    return NextResponse.json({ error: e.message || 'Failed to create token' }, { status: 500 });
  }
}
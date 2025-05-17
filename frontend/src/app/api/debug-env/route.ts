import { NextRequest, NextResponse } from 'next/server';

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Important: Never expose actual secrets in production. This is for debugging only.
  const envVars = {
    // LiveKit variables
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'not set',
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 'is set (value hidden)' : 'not set',
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? 'is set (value hidden)' : 'not set',
    
    // Node environment
    NODE_ENV: process.env.NODE_ENV || 'not set',
    
    // Other potentially useful environment info
    NEXT_RUNTIME: process.env.NEXT_RUNTIME || 'not set',
    
    // Check if we're in a development or production environment
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development'
  };

  return NextResponse.json(envVars);
} 
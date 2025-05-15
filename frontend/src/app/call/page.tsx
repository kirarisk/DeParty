'use client';

import LiveKitCallRoom from '../../components/livekit/LiveKitCallRoom';

export default function CallPage() {
  // LiveKitCallRoom will pick up roomName and user from URL query params
  return <LiveKitCallRoom />;
} 
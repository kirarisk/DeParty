'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import to avoid SSR issues with Spectacle
const DePartyPresentation = dynamic(
  () => import('../../components/presentation/DePartyPresentation'),
  { ssr: false }
);

export default function PresentationPage() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <DePartyPresentation />
    </div>
  );
} 
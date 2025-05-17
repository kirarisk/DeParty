'use client';

import { useEffect } from 'react';
import { setupLiveKitAdminUtils } from './admin-utils';

/**
 * Component that captures LiveKit events for use in server-side muting functionality
 * This component doesn't render anything - it just sets up event listeners
 */
export function LiveKitEventCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize storage for events
    window.recentLiveKitEvents = window.recentLiveKitEvents || [];
    
    // Function to handle capturing LiveKit events
    const captureEvent = (event: any) => {
      if (!event || !event.type) return;
      
      // Only store specific event types we care about
      if (
        event.type === 'room-event' && 
        (
          event.detail?.event === 'trackPublished' || 
          event.detail?.event === 'trackMuted' ||
          event.detail?.event === 'trackUnmuted'
        )
      ) {
        // Store the event details
        const eventDetail = event.detail;
        
        // Store the entire event for debugging
        console.log('Captured LiveKit event:', eventDetail);
        
        // Save the event for later use
        window.recentLiveKitEvents.unshift(eventDetail);
        
        // For mute events, also save as lastTrackMutedEvent
        if (eventDetail?.event === 'trackMuted') {
          window.lastTrackMutedEvent = eventDetail;
        }
        
        // Keep only the last 20 events to avoid memory issues
        if (window.recentLiveKitEvents.length > 20) {
          window.recentLiveKitEvents.pop();
        }
        
        // Also store roomID when available
        if (eventDetail?.roomID) {
          window.currentRoomId = eventDetail.roomID;
        }
      }
    };

    // Set up event listeners for LiveKit events
    window.addEventListener('livekit:event', captureEvent);
    
    // Set up admin utilities
    setupLiveKitAdminUtils();
    
    // Cleanup function
    return () => {
      window.removeEventListener('livekit:event', captureEvent);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

// Add type declarations for the global window object
declare global {
  interface Window {
    recentLiveKitEvents: any[];
    lastTrackMutedEvent: any;
    currentRoomId: string | null;
  }
} 
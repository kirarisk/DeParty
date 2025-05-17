// Simple script to check if environment variables are available
console.log('Checking environment variables:');

// Check LiveKit variables
console.log('NEXT_PUBLIC_LIVEKIT_URL:', process.env.NEXT_PUBLIC_LIVEKIT_URL ? 'is set (starts with: ' + process.env.NEXT_PUBLIC_LIVEKIT_URL.substring(0, 8) + '...)' : 'not set');
console.log('LIVEKIT_URL:', process.env.LIVEKIT_URL ? 'is set (starts with: ' + process.env.LIVEKIT_URL.substring(0, 8) + '...)' : 'not set');
console.log('LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY ? 'is set (not showing value)' : 'not set');
console.log('LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET ? 'is set (not showing value)' : 'not set');

// Suggest workarounds
console.log('\nIf environment variables are not set, you might need to:');
console.log('1. Make sure .env.local file exists in the project root');
console.log('2. Restart your Next.js development server');
console.log('3. Ensure variable names match exactly (case sensitive)');
console.log('4. Consider adding these variables to your deployment environment if using production'); 
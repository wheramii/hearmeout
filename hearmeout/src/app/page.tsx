import { Suspense } from 'react';
import { AppProvider } from '@/lib/AppContext';
import { PlayerProvider } from '@/lib/PlayerContext';
import { AppGate } from '@/components/AppGate';
import { OAuthCallbackHandler } from '@/components/OAuthCallbackHandler';

export default function Home() {
  return (
    <AppProvider>
      <PlayerProvider>
        <Suspense fallback={null}>
          <OAuthCallbackHandler />
        </Suspense>
        <AppGate />
      </PlayerProvider>
    </AppProvider>
  );
}

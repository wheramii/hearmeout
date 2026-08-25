import { Suspense } from 'react';
import { AppProvider } from '@/lib/AppContext';
import { AppGate } from '@/components/AppGate';
import { OAuthCallbackHandler } from '@/components/OAuthCallbackHandler';

export default function Home() {
  return (
    <AppProvider>
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>
      <AppGate />
    </AppProvider>
  );
}

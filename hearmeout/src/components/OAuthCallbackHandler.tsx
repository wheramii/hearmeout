'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/AppContext';

// Picks up the ?spotify=connected / ?spotify_error=... redirect from
// /api/auth/callback/spotify, reflects it into app state, then strips the
// query string so a refresh doesn't replay the toast.
export function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, showScreen, onSpotifyConnected } = useApp();

  useEffect(() => {
    const connected = searchParams.get('spotify');
    const error = searchParams.get('spotify_error');
    if (connected === 'connected') {
      onSpotifyConnected();
      showScreen('profile');
      showToast('Spotify подключён — история прослушиваний синхронизирована');
      router.replace('/');
    } else if (error) {
      showScreen('profile');
      showToast('Не удалось подключить Spotify');
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

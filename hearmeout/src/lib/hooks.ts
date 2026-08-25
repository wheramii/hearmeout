'use client';

import { useEffect, useState } from 'react';
import { fetchDeezerArtistPhoto } from './deezer';

export function useDeezerArtistPhoto(name: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!name) return;
    let cancelled = false;
    fetchDeezerArtistPhoto(name).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [name]);
  return url;
}

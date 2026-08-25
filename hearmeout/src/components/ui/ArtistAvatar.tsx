'use client';

import { useDeezerArtistPhoto } from '@/lib/hooks';
import { CoverArt } from './CoverArt';

import type { CSSProperties } from 'react';

export function ArtistAvatar({ name, className = 'art artist-art', fallbackStyle }: { name: string; className?: string; fallbackStyle?: CSSProperties }) {
  const photo = useDeezerArtistPhoto(name);
  return <CoverArt url={photo ?? undefined} fallbackLetter={(name[0] || '?').toUpperCase()} className={className} fallbackStyle={fallbackStyle} />;
}

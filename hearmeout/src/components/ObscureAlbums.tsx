'use client';

import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';

export function ObscureAlbums({ genre, rowClass }: { genre: string; rowClass: string }) {
  const { t, spotifyObscure, openAlbum } = useApp();
  const albums = spotifyObscure[genre];

  if (albums === 'error') return <div className="empty-state">{t('generic.loadError')}</div>;
  if (!albums) return <div className="archive-loading">{t('obscure.loading')}</div>;
  if (!albums.length) return <div className="empty-state">{t('obscure.empty')}</div>;

  return (
    <div className={rowClass}>
      {albums.map((a) => (
        <div className="cover" key={a.id} onClick={() => openAlbum(a.id)}>
          <CoverArt url={a.cover ?? undefined} fallbackLetter={a.artist[0] || '?'} className="art" />
          <div className="meta"><div className="t">{a.title}</div><div className="a">{a.artist}</div></div>
        </div>
      ))}
    </div>
  );
}

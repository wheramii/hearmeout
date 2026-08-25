'use client';

import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';
import type { CatalogAlbum } from '@/lib/spotifyCatalog';

type Props = { rowClass: string; albums?: CatalogAlbum[] | 'error' | null };

export function SpotifyNewSection({ rowClass, albums }: Props) {
  const { t, spotifyNew, openAlbum } = useApp();
  const list = albums === undefined ? spotifyNew : albums;

  if (list === 'error') return <div className="empty-state">{t('spotifyNew.error')}</div>;
  if (!list) return <div className="archive-loading">{t('spotifyNew.loading')}</div>;
  if (!list.length) return <div className="empty-state">{t('spotifyNew.empty')}</div>;

  return (
    <div className={rowClass}>
      {list.map((a) => (
        <div className="cover" key={a.id} onClick={() => openAlbum(a.id)}>
          <CoverArt url={a.cover ?? undefined} fallbackLetter={a.artist[0] || '?'} className="art" />
          <div className="meta"><div className="t">{a.title}</div><div className="a">{a.artist}</div></div>
        </div>
      ))}
    </div>
  );
}

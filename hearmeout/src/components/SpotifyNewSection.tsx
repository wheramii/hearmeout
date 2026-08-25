'use client';

import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';

export function SpotifyNewSection({ rowClass }: { rowClass: string }) {
  const { spotifyNew, openAlbum } = useApp();

  if (spotifyNew === 'error') return <div className="empty-state">Не удалось загрузить новинки Spotify</div>;
  if (!spotifyNew) return <div className="archive-loading">Загружаю новинки Spotify…</div>;
  if (!spotifyNew.length) return <div className="empty-state">Пока нет новинок</div>;

  return (
    <div className={rowClass}>
      {spotifyNew.map((a) => (
        <div className="cover" key={a.id} onClick={() => openAlbum(a.id)}>
          <CoverArt url={a.cover ?? undefined} fallbackLetter={a.artist[0] || '?'} className="art" />
          <div className="meta"><div className="t">{a.title}</div><div className="a">{a.artist}</div></div>
        </div>
      ))}
    </div>
  );
}

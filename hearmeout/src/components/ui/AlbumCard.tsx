'use client';

import { useApp } from '@/lib/AppContext';
import type { Album } from '@/lib/types';
import { CoverArt } from './CoverArt';

export function AlbumCard({ album, rankBadge }: { album: Album; rankBadge?: number }) {
  const { t, openAlbum, albumRatings, spotifyCovers } = useApp();
  const rating = albumRatings[album.id];
  const cover = spotifyCovers[album.id] || album.cover;
  return (
    <div className="cover" onClick={() => openAlbum(album.id)}>
      <CoverArt url={cover} fallbackLetter={album.artist[0] || '?'} className="art">
        {rankBadge != null && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--lime)', color: '#1F1D1C', fontFamily: 'var(--font-ibm-plex-mono),monospace', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>
            #{rankBadge}
          </span>
        )}
        {album.unknown ? album.artist : ''}
      </CoverArt>
      <div className="meta">
        <div className="t">{album.title}</div>
        <div className="a">{album.artist}{album.unknown ? ` · ${album.listeners}` : ''}</div>
        <div className="r" style={{ color: 'var(--muted)', fontSize: 10.5, marginTop: 1 }}>
          {rating ? `★ ${rating.avg.toFixed(1)} · ${rating.count}` : t('album.noRatings')}
        </div>
      </div>
    </div>
  );
}

export function AlbumListRow({ album, rank }: { album: Album; rank: number }) {
  const { openAlbum } = useApp();
  return (
    <div className="list-row" onClick={() => openAlbum(album.id)}>
      <div className="rank">{rank}</div>
      <CoverArt url={album.cover} fallbackLetter={album.artist[0] || '?'} className="art-sm" />
      <div className="info">
        <div className="t">{album.title}</div>
        <div className="a">{album.artist} · {album.year}</div>
      </div>
    </div>
  );
}

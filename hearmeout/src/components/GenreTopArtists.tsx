'use client';

import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';

const GENRES = ['Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Pop', 'Latin'];

export function GenreTopArtists({ rowClass }: { rowClass: string }) {
  const { spotifyGenreArtists } = useApp();

  return (
    <>
      {GENRES.map((genre) => {
        const artists = spotifyGenreArtists[genre];
        return (
          <div key={genre}>
            <div className="section-head"><h2>{genre}</h2><span>Spotify</span></div>
            {artists === 'error' ? (
              <div className="empty-state">Не удалось загрузить</div>
            ) : !artists ? (
              <div className="archive-loading">Загружаю…</div>
            ) : artists.length ? (
              <div className={rowClass}>
                {artists.map((ar) => (
                  <a className="cover" key={ar.id} href={`https://open.spotify.com/artist/${ar.id}`} target="_blank" rel="noreferrer">
                    <CoverArt url={ar.photo ?? undefined} fallbackLetter={ar.name[0] || '?'} className="art artist-art" />
                    <div className="meta"><div className="t">{ar.name}</div></div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty-state">Нет данных</div>
            )}
          </div>
        );
      })}
    </>
  );
}

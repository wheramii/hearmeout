'use client';

import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';

const GENRES = ['Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Pop', 'Latin'];

function GenreRow({ genre, rowClass }: { genre: string; rowClass: string }) {
  const { t, spotifyGenreArtists } = useApp();
  const artists = spotifyGenreArtists[genre];

  return (
    <div>
      <div className="section-head"><h2>{genre}</h2><span>Spotify</span></div>
      {artists === 'error' ? (
        <div className="empty-state">{t('generic.loadError')}</div>
      ) : !artists ? (
        <div className="archive-loading">{t('genreTop.loading')}</div>
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
        <div className="empty-state">{t('recap.noData')}</div>
      )}
    </div>
  );
}

export function GenreTopArtists({ rowClass }: { rowClass: string }) {
  return (
    <>
      {GENRES.map((g) => <GenreRow key={g} genre={g} rowClass={rowClass} />)}
    </>
  );
}

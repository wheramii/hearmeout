'use client';

import { useApp } from '@/lib/AppContext';
import type { Device, SpotifyArtistAlbum } from '@/lib/types';
import { coverArtUrl } from '@/lib/musicbrainz';
import { CoverArt } from '../ui/CoverArt';
import { ArtistAvatar } from '../ui/ArtistAvatar';
import { toLocale } from '@/lib/i18n';

function SpotifyAlbumCard({ album, gridClass, fallbackLetter, onOpen, unreleasedLabel }: {
  album: SpotifyArtistAlbum;
  gridClass: string;
  fallbackLetter: string;
  onOpen: (id: string) => void;
  unreleasedLabel?: string;
}) {
  return (
    <div className={gridClass === 'd-grid' ? undefined : undefined}>
      <div className="cover" onClick={() => onOpen(album.id)} style={{ cursor: 'pointer' }}>
        <CoverArt url={album.cover ?? undefined} fallbackLetter={fallbackLetter} className="art" />
        <div className="meta">
          <div className="t">{album.title}</div>
          <div className="a">{unreleasedLabel ?? (album.year ?? '—')}</div>
        </div>
      </div>
    </div>
  );
}

export function ArtistScreen({ device }: { device: Device }) {
  const { t, state, language, showScreen, openAlbum } = useApp();
  const art = state.currentArtist;
  const gridClass = device === 'mobile' ? 'grid-cards' : 'd-grid';

  if (!art) {
    return (
      <>
        <button className="back-btn" onClick={() => showScreen('catalog')}>{t('artist.back')}</button>
        <div className="empty-state">{t('artist.notSelected')}</div>
      </>
    );
  }

  if (art.source === 'spotify') {
    let body;
    if (art.loading) {
      body = <div className="archive-loading">{t('artist.loadingAlbums')}</div>;
    } else if (art.error) {
      body = <div className="empty-state">{art.error}</div>;
    } else {
      body = (
        <>
          {!!art.genres?.length && (
            <div className="tags" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {art.genres.map((g) => <span className="chip" key={g}>{g}</span>)}
            </div>
          )}
          <div className="recap-stats-row">
            <div className="recap-stat">
              <div className="rv">{art.followers != null ? art.followers.toLocaleString(toLocale(language)) : '—'}</div>
              <div className="rl">{t('artist.followers')}</div>
            </div>
            <div className="recap-stat">
              <div className="rv">{art.popularity != null ? art.popularity : '—'}</div>
              <div className="rl">{t('artist.popularity')}</div>
            </div>
          </div>
          <div className="section-head"><h2>{t('artist.releasedAlbums')}</h2><span>{art.releasedAlbums?.length ?? 0}</span></div>
          {art.releasedAlbums?.length ? (
            <div className={gridClass}>
              {art.releasedAlbums.map((al) => (
                <SpotifyAlbumCard key={al.id} album={al} gridClass={gridClass} fallbackLetter={art.name[0] || '?'} onOpen={openAlbum} />
              ))}
            </div>
          ) : (
            <div className="empty-state">{t('artist.notFound')}</div>
          )}
          <div className="section-head"><h2>{t('artist.upcomingAlbums')}</h2><span>{art.upcomingAlbums?.length ?? 0}</span></div>
          {art.upcomingAlbums?.length ? (
            <div className={gridClass}>
              {art.upcomingAlbums.map((al) => (
                <SpotifyAlbumCard key={al.id} album={al} gridClass={gridClass} fallbackLetter={art.name[0] || '?'} onOpen={openAlbum} unreleasedLabel={t('artist.unreleased')} />
              ))}
            </div>
          ) : (
            <div className="empty-state">{t('artist.noUpcoming')}</div>
          )}
        </>
      );
    }

    return (
      <>
        <button className="back-btn" onClick={() => showScreen('catalog')}>{t('artist.back')}</button>
        <div className="album-hero">
          <CoverArt url={art.photo ?? undefined} fallbackLetter={art.name[0] || '?'} className="art-lg cover-fallback" />
          <h1>{art.name}</h1>
          <div className="sub">{t('artist.subtitleSpotify')}</div>
        </div>
        {body}
      </>
    );
  }

  let body;
  if (art.loading) {
    body = <div className="archive-loading">{t('artist.loadingAlbums')}</div>;
  } else if (art.error) {
    body = <div className="empty-state">{art.error}</div>;
  } else if (!art.albums || !art.albums.length) {
    body = <div className="empty-state">{t('artist.notFound')}</div>;
  } else {
    body = (
      <>
        <div className="section-head"><h2>{t('artist.albums')}</h2><span>{art.albums.length}</span></div>
        <div className={gridClass}>
          {art.albums.map((g) => {
            const year = g['first-release-date'] ? g['first-release-date'].slice(0, 4) : '—';
            const cover = coverArtUrl(g.id);
            return (
              <div className="cover" key={g.id}>
                <CoverArt url={cover} fallbackLetter={art.name[0] || '?'} className="art" />
                <div className="meta"><div className="t">{g.title}</div><div className="a">{year}</div></div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <button className="back-btn" onClick={() => showScreen('catalog')}>{t('artist.back')}</button>
      <div className="album-hero">
        <ArtistAvatar name={art.name} className="art-lg cover-fallback" fallbackStyle={{ fontSize: 48 }} />
        <h1>{art.name}</h1>
        <div className="sub">{t('artist.subtitle')}</div>
      </div>
      {body}
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { StarsAvg } from '../ui/StarsAvg';
import { PlayIcon } from '../ui/Icons';
import { pluralForKey, toLocale } from '@/lib/i18n';
import { usePlayer, type QueueTrack } from '@/lib/PlayerContext';
import { TransportRing } from '../DockedPlayer';
import { AlbumReviews } from '../AlbumReviews';
import { AlbumRatingDistribution } from '../AlbumRatingDistribution';
import { AlbumTagsSummary } from '../AlbumTagsSummary';

export function AlbumScreen({ device }: { device: Device }) {
  const { state, t, language, albums, liveAlbums, failedAlbumIds, albumRatings, myRatings, spotifyCovers, reviewsVersion, goBack, openRateFor, openSpotifyArtist, ensureLiveAlbum, lovedItems, toggleLoved } = useApp();
  const { currentTrack, playQueue } = usePlayer();
  const staticMatch = albums.find((x) => x.id === state.currentAlbumId);
  const enriched = liveAlbums[state.currentAlbumId];
  // No `|| albums[0]` fallback here on purpose: silently substituting an
  // unrelated album when enrichment fails (e.g. Spotify rate-limited) is
  // exactly what looked like clicking one album but landing on another.
  const a = enriched || staticMatch;

  useEffect(() => {
    if (state.activeScreen === 'album' && !enriched) ensureLiveAlbum(state.currentAlbumId, staticMatch?.spotifyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeScreen, state.currentAlbumId, enriched]);

  const [wishlisted, setWishlisted] = useState(false);
  useEffect(() => { setWishlisted(false); }, [a?.id]);

  if (!a) {
    const failed = !!failedAlbumIds[state.currentAlbumId];
    return (
      <>
        <button className="back-btn" onClick={() => goBack('catalog')}>{t('album.backToCatalog')}</button>
        <div className="empty-state">{failed ? t('album.loadError') : t('album.loading')}</div>
      </>
    );
  }

  const ratingInfo = albumRatings[a.id];
  const myStars = myRatings.find((r) => r.albumId === a.id)?.stars ?? null;
  const cover = spotifyCovers[a.id] || a.cover;

  const heroArt = (
    <CoverArt url={cover} fallbackLetter={a.artist[0] || '?'} className="art-lg" />
  );

  const artistLabel = a.artistId ? (
    <span style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--line)' }} onClick={() => openSpotifyArtist(a.artistId!)}>
      {a.artist}
    </span>
  ) : a.artist;

  const albumIsCurrent = currentTrack?.albumId === a.id;
  const trackQueue: QueueTrack[] = a.tracklist.map((tr) => ({ title: tr, artist: a.artist, cover, albumId: a.id, spotifyId: a.spotifyId }));

  const tracklist = a.tracklist.length ? (
    a.tracklist.map((tr, i) => {
      const isRowCurrent = albumIsCurrent && currentTrack?.title === tr;
      return (
        <div className={`list-row ${isRowCurrent ? 'playing' : ''}`} key={tr} onClick={() => playQueue(trackQueue, i)}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <div className="info"><div className="t">{tr}</div></div>
        </div>
      );
    })
  ) : (
    <div className="empty-state">{t('album.tracklistEmpty')}</div>
  );

  const headerPlayBtn = !a.tracklist.length ? null : albumIsCurrent ? (
    <TransportRing size={52} />
  ) : (
    <button className="header-play-btn" onClick={() => playQueue(trackQueue, 0)} aria-label={t('album.rateAlbum')}>
      <PlayIcon size={20} />
    </button>
  );

  const openSpotifyUrl = a.spotifyId ? `https://open.spotify.com/album/${a.spotifyId}` : null;
  const albumLoved = lovedItems.some((li) => li.type === 'album' && li.title === a.title && li.artist === a.artist);

  const actions = (justify: 'center' | undefined) => (
    <div className={`album-actions ${justify === 'center' ? 'center' : ''}`}>
      <button className="action-chip primary" onClick={() => openRateFor(a.id, 'album')}>{t('album.rateAlbum')}</button>
      <button className={`action-chip ${wishlisted ? 'added' : ''}`} onClick={() => setWishlisted((v) => !v)}>
        {wishlisted ? t('album.inWishlist') : t('album.addWishlist')}
      </button>
      <button
        className={`action-chip ${albumLoved ? 'added' : ''}`}
        onClick={() => toggleLoved('album', a.title, a.artist, a.spotifyId ?? null, spotifyCovers[a.id] || a.cover || null)}
      >
        ♥ {albumLoved ? t('album.loved') : t('album.love')}
      </button>
      {openSpotifyUrl && (
        <a className="action-chip" href={openSpotifyUrl} target="_blank" rel="noreferrer">{t('album.openInSpotify')}</a>
      )}
    </div>
  );

  const metaMono = [a.genre, a.year || null].filter(Boolean).join(' · ');

  const distSection = ratingInfo && (
    <>
      <div className="section-head" style={{ marginTop: 22 }}><h2>{t('album.ratingDistribution')}</h2></div>
      <AlbumRatingDistribution albumId={a.id} refreshToken={reviewsVersion} />
      <AlbumTagsSummary albumId={a.id} refreshToken={reviewsVersion} />
    </>
  );

  if (device === 'mobile') {
    return (
      <>
        <button className="back-btn" onClick={() => goBack('catalog')}>{t('album.backToCatalog')}</button>
        <div className="album-hero">
          {metaMono && <div className="meta-mono">{metaMono}</div>}
          {heroArt}
          <h1>{a.title}</h1>
          <span className="artist-link">{artistLabel}</span>
          {headerPlayBtn && (
            <div className="album-title-row" style={{ justifyContent: 'center', marginTop: 14 }}>
              {headerPlayBtn}
              <span className="preview-label">{t('album.preview30s')}</span>
            </div>
          )}
        </div>
        <div className="avg-rating">
          {ratingInfo ? (
            <>
              <div>
                <div className="num">{ratingInfo.avg.toFixed(1)}</div>
                <div className="rd">{ratingInfo.count.toLocaleString(toLocale(language))} {pluralForKey(language, ratingInfo.count, 'album.ratingOne', 'album.ratingFew', 'album.ratingMany')}</div>
              </div>
              <StarsAvg rating={ratingInfo.avg} />
            </>
          ) : (
            <div className="rd">{t('album.noRatings')}</div>
          )}
        </div>
        {myStars != null && ratingInfo && (
          <div className="rd" style={{ textAlign: 'center', marginTop: -10, marginBottom: 14 }}>
            {t('album.yourVsAvg', { mine: myStars.toFixed(1), avg: ratingInfo.avg.toFixed(1) })}
          </div>
        )}
        {actions('center')}
        {distSection}
        <div className="section-head" style={{ marginTop: 22 }}><h2>{t('album.tracklist')}</h2><span>{a.tracklist.length ? `${a.tracklist.length} ${t('album.tracksCount')}` : ''}</span></div>
        <div style={{ marginBottom: 22 }}>{tracklist}</div>
        <div className="section-head"><h2>{t('album.reviews')}</h2></div>
        <AlbumReviews albumId={a.id} refreshToken={reviewsVersion} />
      </>
    );
  }

  return (
    <>
      <button className="back-btn" onClick={() => goBack('catalog')}>{t('album.backToCatalog')}</button>
      <div className="album-band">
        {heroArt}
        <div className="album-band-mid">
          {metaMono && <div className="meta-mono">{metaMono}</div>}
          <div className="album-title-row">
            <h1>{a.title}</h1>
            {headerPlayBtn}
            {headerPlayBtn && <span className="preview-label">{t('album.preview30s')}</span>}
          </div>
          <span className="artist-link">{artistLabel}</span>
          {actions(undefined)}
        </div>
        <div className="album-band-score">
          {ratingInfo ? (
            <>
              <div className="num">{ratingInfo.avg.toFixed(1)}</div>
              <StarsAvg rating={ratingInfo.avg} />
              <div className="rd">{ratingInfo.count.toLocaleString(toLocale(language))} {pluralForKey(language, ratingInfo.count, 'album.ratingOne', 'album.ratingFew', 'album.ratingMany')}</div>
              {myStars != null && (
                <div className="rd" style={{ marginTop: 4 }}>{t('album.yourVsAvg', { mine: myStars.toFixed(1), avg: ratingInfo.avg.toFixed(1) })}</div>
              )}
            </>
          ) : (
            <div className="rd">{t('album.noRatings')}</div>
          )}
        </div>
      </div>
      {distSection}
      <div className="d-two-col">
        <div>
          <div className="section-head"><h2>{t('album.tracklist')}</h2><span>{a.tracklist.length ? `${a.tracklist.length} ${t('album.tracksCount')}` : ''}</span></div>
          {tracklist}
        </div>
        <div>
          <div className="section-head"><h2>{t('album.reviews')}</h2></div>
          <AlbumReviews albumId={a.id} refreshToken={reviewsVersion} />
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { StarsAvg } from '../ui/StarsAvg';
import { pluralForKey, toLocale } from '@/lib/i18n';
import { TrackPreview } from '../TrackPreview';
import { AlbumReviews } from '../AlbumReviews';

export function AlbumScreen({ device }: { device: Device }) {
  const { state, t, language, albums, liveAlbums, albumRatings, spotifyCovers, reviewsVersion, showScreen, openRateFor, openSpotifyArtist, ensureLiveAlbum } = useApp();
  const staticMatch = albums.find((x) => x.id === state.currentAlbumId);
  const enriched = liveAlbums[state.currentAlbumId];
  const a = enriched || staticMatch || albums[0];

  useEffect(() => {
    if (state.activeScreen === 'album' && !enriched) ensureLiveAlbum(state.currentAlbumId, staticMatch?.spotifyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeScreen, state.currentAlbumId, enriched]);

  const [wishlisted, setWishlisted] = useState(false);
  useEffect(() => setWishlisted(false), [a.id]);

  const ratingInfo = albumRatings[a.id];
  const cover = spotifyCovers[a.id] || a.cover;

  const heroArt = (
    <CoverArt url={cover} fallbackLetter={a.artist[0] || '?'} className="art-lg" />
  );

  const artistLabel = a.artistId ? (
    <span style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--line)' }} onClick={() => openSpotifyArtist(a.artistId!)}>
      {a.artist}
    </span>
  ) : a.artist;

  const tracklist = a.tracklist.length ? (
    a.tracklist.map((tr, i) => (
      <div className="list-row" key={tr}>
        <span className="n">{String(i + 1).padStart(2, '0')}</span>
        <div className="info"><div className="t">{tr}</div></div>
      </div>
    ))
  ) : (
    <div className="empty-state">{t('album.tracklistEmpty')}</div>
  );

  const ratingBlock = (
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
  );

  const previewBlock = (
    <div className="dz-preview-wrap" style={device === 'desktop' ? { maxWidth: 420 } : undefined}>
      <div className="dz-preview-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--lime)' }}>●</span> {t('album.preview')}
      </div>
      <div className="dz-preview-player">
        <TrackPreview artist={a.artist} title={a.title} />
      </div>
    </div>
  );

  const wishlistBtn = (
    <button
      className={`btn-ghost ${wishlisted ? 'added' : ''}`}
      style={device === 'desktop' ? { width: '100%' } : undefined}
      onClick={() => setWishlisted((v) => !v)}
    >
      {wishlisted ? t('album.inWishlist') : t('album.addWishlist')}
    </button>
  );

  if (device === 'mobile') {
    return (
      <>
        <button className="back-btn" onClick={() => showScreen('catalog')}>{t('album.backToCatalog')}</button>
        <div className="album-hero">
          {heroArt}
          <h1>{a.title}</h1>
          <div className="sub">{artistLabel}{a.year ? ` · ${a.year}` : ''}</div>
          <div className="tags">{a.genre && <span className="chip">{a.genre}</span>}</div>
        </div>
        {ratingBlock}
        {previewBlock}
        <button className="btn-primary" onClick={() => openRateFor(a.id, 'album')}>{t('album.rateAlbum')}</button>
        {wishlistBtn}
        <div className="section-head"><h2>{t('album.tracklist')}</h2><span>{a.tracklist.length ? `${a.tracklist.length} ${t('album.tracksCount')}` : ''}</span></div>
        <div style={{ marginBottom: 22 }}>{tracklist}</div>
        <div className="section-head"><h2>{t('album.reviews')}</h2></div>
        <AlbumReviews albumId={a.id} refreshToken={reviewsVersion} />
      </>
    );
  }

  return (
    <>
      <button className="back-btn" onClick={() => showScreen('catalog')}>{t('album.backToCatalog')}</button>
      <div className="d-album-layout">
        <div className="cover-col">
          {heroArt}
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => openRateFor(a.id, 'album')}>{t('album.rateAlbum')}</button>
          {wishlistBtn}
        </div>
        <div className="info-col">
          <div className="eyebrow">{t('album.eyebrow')}</div>
          <h1>{a.title}</h1>
          <div className="sub">{artistLabel}{a.year ? ` · ${a.year}` : ''}</div>
          <div className="tags" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>{a.genre && <span className="chip">{a.genre}</span>}</div>
          <div style={{ justifyContent: 'flex-start', maxWidth: 340 }}>{ratingBlock}</div>
          {previewBlock}
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
        </div>
      </div>
    </>
  );
}

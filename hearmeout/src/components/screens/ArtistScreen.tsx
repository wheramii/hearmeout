'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, SpotifyArtistAlbum } from '@/lib/types';
import { coverArtUrl } from '@/lib/musicbrainz';
import { CoverArt } from '../ui/CoverArt';
import { ArtistAvatar } from '../ui/ArtistAvatar';

function SpotifyAlbumCard({ album, fallbackLetter, onOpen, unreleasedLabel, score }: {
  album: SpotifyArtistAlbum;
  fallbackLetter: string;
  onOpen: (id: string) => void;
  unreleasedLabel?: string;
  score?: number;
}) {
  return (
    <div className="cover" onClick={() => onOpen(album.id)} style={{ cursor: 'pointer' }}>
      <CoverArt url={album.cover ?? undefined} fallbackLetter={fallbackLetter} className="art">
        {score != null && <span className="disco-badge">{score.toFixed(1)}</span>}
      </CoverArt>
      <div className="meta">
        <div className="t">{album.title}</div>
        <div className="a">{unreleasedLabel ?? (album.year ?? '—')}</div>
      </div>
    </div>
  );
}

export function ArtistScreen({ device }: { device: Device }) {
  const { t, state, albumRatings, myRatings, goBack, openAlbum, showToast, lovedItems, toggleLoved, viewFriend } = useApp();
  const art = state.currentArtist;
  const gridClass = device === 'mobile' ? 'grid-cards' : 'd-grid';
  const [resolvingGroup, setResolvingGroup] = useState<string | null>(null);

  const openMbGroup = async (title: string, artistName: string, groupId: string) => {
    if (resolvingGroup) return;
    setResolvingGroup(groupId);
    try {
      const res = await fetch(`/api/spotify/resolve-album?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artistName)}`);
      if (!res.ok) { showToast(t('toast.albumOpenFailed')); return; }
      const { id } = await res.json();
      openAlbum(id);
    } catch {
      showToast(t('toast.albumOpenFailed'));
    } finally {
      setResolvingGroup(null);
    }
  };

  const communityScore = useMemo(() => {
    if (!art?.releasedAlbums) return null;
    let sum = 0, ratingsCount = 0, albumsWithRatings = 0;
    for (const al of art.releasedAlbums) {
      const info = albumRatings[al.id];
      if (info) { sum += info.avg * info.count; ratingsCount += info.count; albumsWithRatings++; }
    }
    if (!ratingsCount) return null;
    return { avg: sum / ratingsCount, count: ratingsCount, albumsWithRatings };
  }, [art, albumRatings]);

  const [topFan, setTopFan] = useState<{ id: string; name: string; handle: string; avatarUrl: string | null; hours: number } | null>(null);
  useEffect(() => {
    if (!art || art.source !== 'spotify') { setTopFan(null); return; }
    let cancelled = false;
    setTopFan(null);
    fetch(`/api/artist/${art.id}/top-fan?name=${encodeURIComponent(art.name)}`)
      .then((r) => (r.ok ? r.json() : { topFan: null }))
      .then((d) => { if (!cancelled) setTopFan(d.topFan); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art?.id, art?.source]);

  const yourStats = useMemo(() => {
    if (!art?.releasedAlbums) return null;
    const ids = new Set(art.releasedAlbums.map((al) => al.id));
    const mine = myRatings.filter((r) => ids.has(r.albumId));
    if (!mine.length) return null;
    const top = [...mine].sort((a, b) => b.stars - a.stars)[0];
    const topAlbum = art.releasedAlbums.find((al) => al.id === top.albumId);
    return {
      count: mine.length,
      avg: mine.reduce((s, r) => s + r.stars, 0) / mine.length,
      topTitle: topAlbum?.title ?? null,
    };
  }, [art, myRatings]);

  if (!art) {
    return (
      <>
        <button className="back-btn" onClick={() => goBack('catalog')}>{t('artist.back')}</button>
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
          <div className="section-head"><h2>{t('artist.releasedAlbums')}</h2><span>{art.releasedAlbums?.length ?? 0}</span></div>
          {art.releasedAlbums?.length ? (
            <div className={gridClass}>
              {art.releasedAlbums.map((al) => (
                <SpotifyAlbumCard key={al.id} album={al} fallbackLetter={art.name[0] || '?'} onOpen={openAlbum} score={albumRatings[al.id]?.avg} />
              ))}
            </div>
          ) : (
            <div className="empty-state">{t('artist.notFound')}</div>
          )}
          <div className="section-head" style={{ marginTop: 26 }}><h2>{t('artist.upcomingAlbums')}</h2><span>{art.upcomingAlbums?.length ?? 0}</span></div>
          {art.upcomingAlbums?.length ? (
            <div className={gridClass}>
              {art.upcomingAlbums.map((al) => (
                <SpotifyAlbumCard key={al.id} album={al} fallbackLetter={art.name[0] || '?'} onOpen={openAlbum} unreleasedLabel={t('artist.unreleased')} />
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
        <button className="back-btn" onClick={() => goBack('catalog')}>{t('artist.back')}</button>
        <div className="artist-band">
          <CoverArt url={art.photo ?? undefined} fallbackLetter={art.name[0] || '?'} className="artist-band-photo" />
          <div className="artist-band-mid">
            <div className="meta-mono">{t('artist.subtitleSpotify')}</div>
            <h1>{art.name}</h1>
            {!!art.genres?.length && (
              <div className="tags" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 4px' }}>
                {art.genres.map((g) => <span className="chip" key={g}>{g}</span>)}
              </div>
            )}
            <button
              className={`action-chip ${lovedItems.some((li) => li.type === 'artist' && li.title === art.name) ? 'added' : ''}`}
              style={{ marginTop: 10 }}
              onClick={() => toggleLoved('artist', art.name, null, art.id, art.photo ?? null)}
            >
              ♥ {lovedItems.some((li) => li.type === 'artist' && li.title === art.name) ? t('artist.loved') : t('artist.love')}
            </button>
          </div>
          <div className="album-band-score">
            {communityScore ? (
              <>
                <div className="num">{communityScore.avg.toFixed(1)}</div>
                <div className="rd">{t('artist.communityRatings', { count: communityScore.count })}</div>
              </>
            ) : (
              <div className="rd">{t('album.noRatings')}</div>
            )}
          </div>
        </div>

        {topFan && (
          <div className="friend-row" onClick={() => viewFriend(topFan.id)} style={{ cursor: 'pointer', marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div className="info">
              <div className="n">{t('artist.topFan', { name: topFan.name })}</div>
              <div className="h">{t('artist.topFanHours', { hours: topFan.hours })}</div>
            </div>
          </div>
        )}

        {yourStats && (
          <div className="rate-card" style={{ marginTop: 0 }}>
            <div className="rate-card-label">{t('artist.yourAndArtist')}</div>
            <div className="stat-grid cols-2" style={{ marginBottom: yourStats.topTitle ? 10 : 0 }}>
              <div className="box"><div className="v">{yourStats.count}</div><div className="l">{t('artist.yourRatedCount')}</div></div>
              <div className="box"><div className="v">{yourStats.avg.toFixed(1)}</div><div className="l">{t('history.avg')}</div></div>
            </div>
            {yourStats.topTitle && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('artist.yourTop', { title: yourStats.topTitle })}</div>}
          </div>
        )}

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
              <div className="cover" key={g.id} onClick={() => openMbGroup(g.title, art.name, g.id)} style={{ cursor: 'pointer', opacity: resolvingGroup === g.id ? 0.6 : 1 }}>
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
      <button className="back-btn" onClick={() => goBack('catalog')}>{t('artist.back')}</button>
      <div className="album-hero">
        <ArtistAvatar name={art.name} className="art-lg" fallbackStyle={{ fontSize: 48 }} />
        <h1>{art.name}</h1>
        <div className="sub">{t('artist.subtitle')}</div>
        <button
          className={`action-chip ${lovedItems.some((li) => li.type === 'artist' && li.title === art.name) ? 'added' : ''}`}
          style={{ marginTop: 10 }}
          onClick={() => toggleLoved('artist', art.name, null, art.id, null)}
        >
          ♥ {lovedItems.some((li) => li.type === 'artist' && li.title === art.name) ? t('artist.loved') : t('artist.love')}
        </button>
      </div>
      {body}
    </>
  );
}

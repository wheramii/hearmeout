'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile, RecapData, RecapPeriod } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { pluralForKey, toLocale, type TranslationKey } from '@/lib/i18n';
import { CoverArt } from '../ui/CoverArt';
import { PlayIcon } from '../ui/Icons';
import { usePlayer } from '@/lib/PlayerContext';
import { TransportRing } from '../DockedPlayer';
import { PremiumLock } from '../ui/PremiumLock';
import { PremiumBadge } from '../ui/PremiumBadge';
import { drawRecapPoster } from '@/lib/posterCanvas';
import { accentMix } from '@/lib/accentGradient';

const PERIOD_KEY: Record<RecapPeriod, TranslationKey> = { day: 'recap.day', month: 'recap.month', season: 'recap.season' };

function PosterDownloadButton({ data, name, periodLabel }: { data: RecapData; name: string; periodLabel: string }) {
  const { t } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawRecapPoster(canvas, data, name, periodLabel);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hearmeout-recap.png';
    link.click();
  };

  return (
    <PremiumLock label={t('recap.posterLocked')}>
      <button className="btn-ghost" style={{ width: '100%', marginTop: 14 }} onClick={download}>{t('recap.downloadPoster')}</button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </PremiumLock>
  );
}

export function RecapScreen(_props: { device: Device }) {
  const { state, t, language, me, ensureRecap, recapCache, closeRecap, setRecapPeriod, setRecapSeasonKey, recapSeasons, openAlbum, openSpotifyArtist, showToast } = useApp();
  const { currentTrack, playQueue } = usePlayer();
  const targetId = state.recapViewUserId === 'me' ? me?.id : state.recapViewUserId;
  const isMe = state.recapViewUserId === 'me';
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!targetId) return;
    ensureRecap(state.recapViewUserId, state.recapPeriod, state.recapSeasonKey);
  }, [state.recapViewUserId, state.recapPeriod, state.recapSeasonKey, targetId, ensureRecap]);

  // Once the real available seasons load, default to the most recent one
  // instead of leaving the picker on "no season selected".
  useEffect(() => {
    if (state.recapPeriod === 'season' && !state.recapSeasonKey && recapSeasons?.length) {
      setRecapSeasonKey(recapSeasons[0].key);
    }
  }, [state.recapPeriod, state.recapSeasonKey, recapSeasons, setRecapSeasonKey]);

  useEffect(() => {
    if (isMe || !targetId) { setProfile(null); return; }
    let cancelled = false;
    fetch(`/api/users/${targetId}`).then((res) => (res.ok ? res.json() : null)).then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => { cancelled = true; };
  }, [isMe, targetId]);

  if (!targetId) return <div className="empty-state">{t('app.loading')}</div>;
  const isSeason = state.recapPeriod === 'season';
  const cacheKey = `${targetId}:${state.recapPeriod}${isSeason && state.recapSeasonKey ? ':' + state.recapSeasonKey : ''}`;
  const r = isSeason && !state.recapSeasonKey ? undefined : recapCache[cacheKey];
  const name = isMe ? me?.name : profile?.name;
  const avatarUrl = isMe ? me?.avatarUrl ?? null : profile?.avatarUrl ?? null;
  const vibe = r
    ? `${r.trackCount} ${pluralForKey(language, r.trackCount, 'recap.trackOne', 'recap.trackFew', 'recap.trackMany')}${r.topGenres[0] ? t('recap.vibeGenre', { genre: r.topGenres[0] }) : ''}`
    : '';

  const artistRowClick = (id: string | null) => { if (id) openSpotifyArtist(id); };
  const trackRowClick = (albumId: string | null) => { if (albumId) openAlbum(albumId); };

  return (
    <>
      <div className="recap-full-top">
        <button className="recap-close" onClick={closeRecap}>✕</button>
        <div className="segmented">
          {(['day', 'month', 'season'] as RecapPeriod[]).map((p) => (
            <button
              key={p}
              className={state.recapPeriod === p ? 'on' : ''}
              onClick={() => {
                if (p === 'season' && !me?.isPremium) { showToast(t('recap.seasonLocked')); return; }
                setRecapPeriod(p);
              }}
            >
              {t(PERIOD_KEY[p])}{p === 'season' && !me?.isPremium && <PremiumBadge />}
            </button>
          ))}
        </div>
        {isSeason && (
          recapSeasons === null ? (
            <div className="archive-loading" style={{ marginTop: 10 }}>{t('recap.loading')}</div>
          ) : recapSeasons.length ? (
            <select
              className="select-field"
              style={{ marginTop: 10 }}
              value={state.recapSeasonKey ?? ''}
              onChange={(e) => setRecapSeasonKey(e.target.value)}
            >
              {recapSeasons.map((s) => (
                <option key={s.key} value={s.key}>{t(`season.${s.season}` as TranslationKey)} {s.year}</option>
              ))}
            </select>
          ) : (
            <div className="empty-state" style={{ marginTop: 10 }}>{t('recap.noData')}</div>
          )
        )}
      </div>
      <div className="recap-hero">
        <div className="recap-hero-avatar" style={userAvatarStyle({ avatarUrl })} />
        <div className="recap-hero-name">{name}</div>
        <div className="recap-hero-period-row">
          <div className="recap-hero-period">{t(PERIOD_KEY[state.recapPeriod])} {t('recap.periodLabel')}</div>
        </div>
        {r && (r.trackCount > 0 ? <div className="recap-hero-vibe">«{vibe}»</div> : <div className="recap-hero-vibe">{t('recap.vibeEmpty')}</div>)}
      </div>
      {!r ? (
        <div className="archive-loading">{t('recap.loading')}</div>
      ) : (
        <>
          <div className="recap-stats-row">
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(0) }}>{r.minutes.toLocaleString(toLocale(language))}</div><div className="rl">{t('recap.minutes')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(1 / 3) }}>{r.uniqueArtists}</div><div className="rl">{t('recap.artists')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(2 / 3) }}>{r.topGenres.length}</div><div className="rl">{t('recap.genresCount')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(1) }}>{r.trackCount}</div><div className="rl">{t('recap.plays')}</div></div>
          </div>
          {r.topSongs[0] && (
            <div className="recap-song-card" onClick={() => trackRowClick(r.topSongs[0].albumId)}>
              <div className="art-md" style={r.topSongs[0].cover ? { backgroundImage: `url('${r.topSongs[0].cover}')` } : undefined} />
              <div className="info">
                <div className="rsc-label">{t('recap.songOfWeek')}</div>
                <div className="rsc-title">{r.topSongs[0].title}</div>
                <div className="rsc-artist">{r.topSongs[0].artist}</div>
              </div>
              {currentTrack?.title === r.topSongs[0].title && currentTrack?.artist === r.topSongs[0].artist ? (
                <div onClick={(e) => e.stopPropagation()}><TransportRing size={44} /></div>
              ) : (
                <button
                  className="header-play-btn"
                  style={{ width: 44, height: 44 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playQueue([{ title: r.topSongs[0].title, artist: r.topSongs[0].artist, cover: r.topSongs[0].cover, albumId: r.topSongs[0].albumId }], 0);
                  }}
                  aria-label={t('recap.songOfWeek')}
                >
                  <PlayIcon size={18} />
                </button>
              )}
            </div>
          )}
          <div className="recap-section">
            <div className="recap-section-label">{t('recap.topArtists')}</div>
            {r.topArtists.length ? r.topArtists.map((a, i) => (
              <div
                className="recap-rank-row"
                key={`${a.id ?? a.name}-${i}`}
                style={a.id ? { cursor: 'pointer' } : undefined}
                onClick={() => artistRowClick(a.id)}
              >
                <span className="rr-num">{i + 1}</span>
                <CoverArt url={a.cover ?? undefined} fallbackLetter={a.name[0] || '?'} className="cover-thumb-sm" />
                <span className="rr-name">{a.name}</span>
              </div>
            )) : <div className="empty-state">{t('recap.noData')}</div>}
          </div>
          <div className="recap-section">
            <div className="recap-section-label">{t('recap.topSongs')}</div>
            {r.topSongs.length ? r.topSongs.map((s, i) => (
              <div
                className="recap-rank-row"
                key={`${s.albumId ?? s.title}-${i}`}
                style={s.albumId ? { cursor: 'pointer' } : undefined}
                onClick={() => trackRowClick(s.albumId)}
              >
                <span className="rr-num">{i + 1}</span>
                <CoverArt url={s.cover ?? undefined} fallbackLetter={s.artist[0] || '?'} className="cover-thumb-sm" />
                <span className="rr-name">{s.title} <span style={{ opacity: 0.6 }}>— {s.artist}</span></span>
              </div>
            )) : <div className="empty-state">{t('recap.noData')}</div>}
          </div>
          <div className="recap-section">
            <div className="recap-section-label">{t('recap.topGenres')}</div>
            {r.topGenres.length ? (
              <div className="recap-genre-chips">{r.topGenres.map((g) => <span className="chip" key={g}>{g}</span>)}</div>
            ) : <div className="empty-state">{t('recap.noData')}</div>}
          </div>
          <PosterDownloadButton data={r} name={name || ''} periodLabel={`${t(PERIOD_KEY[state.recapPeriod])} ${t('recap.periodLabel')}`} />
        </>
      )}
    </>
  );
}

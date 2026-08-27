'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile, RecapPeriod } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { pluralForKey, toLocale, type TranslationKey } from '@/lib/i18n';
import { CoverArt } from '../ui/CoverArt';
import { CirclePlayer } from '../CirclePlayer';

const PERIOD_KEY: Record<RecapPeriod, TranslationKey> = { day: 'recap.day', month: 'recap.month', season: 'recap.season' };

export function RecapScreen(_props: { device: Device }) {
  const { state, t, language, me, ensureRecap, recapCache, closeRecap, setRecapPeriod, openAlbum, openSpotifyArtist } = useApp();
  const targetId = state.recapViewUserId === 'me' ? me?.id : state.recapViewUserId;
  const isMe = state.recapViewUserId === 'me';
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!targetId) return;
    ensureRecap(state.recapViewUserId, state.recapPeriod);
  }, [state.recapViewUserId, state.recapPeriod, targetId, ensureRecap]);

  useEffect(() => {
    if (isMe || !targetId) { setProfile(null); return; }
    let cancelled = false;
    fetch(`/api/users/${targetId}`).then((res) => (res.ok ? res.json() : null)).then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => { cancelled = true; };
  }, [isMe, targetId]);

  if (!targetId) return <div className="empty-state">{t('app.loading')}</div>;
  const r = recapCache[`${targetId}:${state.recapPeriod}`];
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
            <button key={p} className={state.recapPeriod === p ? 'on' : ''} onClick={() => setRecapPeriod(p)}>
              {t(PERIOD_KEY[p])}
            </button>
          ))}
        </div>
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
            <div className="recap-stat"><div className="rv">{r.minutes.toLocaleString(toLocale(language))}</div><div className="rl">{t('recap.minutes')}</div></div>
            <div className="recap-stat"><div className="rv">{r.uniqueArtists}</div><div className="rl">{t('recap.artists')}</div></div>
            <div className="recap-stat"><div className="rv">{r.topGenres.length}</div><div className="rl">{t('recap.genresCount')}</div></div>
            <div className="recap-stat"><div className="rv">{r.trackCount}</div><div className="rl">{t('recap.plays')}</div></div>
          </div>
          {r.topSongs[0] && (
            <div className="recap-song-card" onClick={() => trackRowClick(r.topSongs[0].albumId)}>
              <div className="art-md" style={r.topSongs[0].cover ? { backgroundImage: `url('${r.topSongs[0].cover}')` } : undefined} />
              <div className="info">
                <div className="rsc-label">{t('recap.songOfWeek')}</div>
                <div className="rsc-title">{r.topSongs[0].title}</div>
                <div className="rsc-artist">{r.topSongs[0].artist}</div>
              </div>
              <CirclePlayer artist={r.topSongs[0].artist} title={r.topSongs[0].title} size={44} />
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
        </>
      )}
    </>
  );
}

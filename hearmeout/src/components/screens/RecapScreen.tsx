'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile, RecapPeriod } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';

const PERIOD_LABEL: Record<RecapPeriod, string> = { day: 'День', month: 'Месяц', season: 'Сезон' };

export function RecapScreen(_props: { device: Device }) {
  const { state, me, ensureRecap, recapCache, closeRecap, setRecapPeriod } = useApp();
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

  if (!targetId) return <div className="empty-state">Загрузка…</div>;
  const r = recapCache[`${targetId}:${state.recapPeriod}`];
  const name = isMe ? me?.name : profile?.name;
  const avatarUrl = isMe ? me?.avatarUrl ?? null : profile?.avatarUrl ?? null;

  return (
    <>
      <div className="recap-full-top">
        <button className="recap-close" onClick={closeRecap}>✕</button>
        <div className="segmented">
          {(['day', 'month', 'season'] as RecapPeriod[]).map((p) => (
            <button key={p} className={state.recapPeriod === p ? 'on' : ''} onClick={() => setRecapPeriod(p)}>
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      <div className="recap-hero">
        <div className="recap-hero-avatar" style={userAvatarStyle({ avatarUrl })} />
        <div className="recap-hero-name">{name}</div>
        <div className="recap-hero-period">{PERIOD_LABEL[state.recapPeriod]} · Рекап</div>
        {r && <div className="recap-hero-vibe">«{r.vibe}»</div>}
      </div>
      {!r ? (
        <div className="archive-loading">Считаю рекап…</div>
      ) : (
        <>
          <div className="recap-stats-row">
            <div className="recap-stat"><div className="rv">{r.minutes.toLocaleString('ru-RU')}</div><div className="rl">МИНУТ</div></div>
            <div className="recap-stat"><div className="rv">{r.uniqueArtists}</div><div className="rl">АРТИСТОВ</div></div>
            <div className="recap-stat"><div className="rv">{r.topGenres.length}</div><div className="rl">ЖАНРА</div></div>
          </div>
          <div className="recap-section">
            <div className="recap-section-label">Топ артисты</div>
            {r.topArtists.length ? r.topArtists.map((a, i) => (
              <div className="recap-rank-row" key={a}><span className="rr-num">{i + 1}</span><span className="rr-name">{a}</span></div>
            )) : <div className="empty-state">Нет данных</div>}
          </div>
          <div className="recap-section">
            <div className="recap-section-label">Топ треки</div>
            {r.topSongs.length ? r.topSongs.map((s, i) => (
              <div className="recap-rank-row" key={s}><span className="rr-num">{i + 1}</span><span className="rr-name">{s}</span></div>
            )) : <div className="empty-state">Нет данных</div>}
          </div>
          <div className="recap-section">
            <div className="recap-section-label">Топ жанры</div>
            {r.topGenres.length ? (
              <div className="recap-genre-chips">{r.topGenres.map((g) => <span className="chip" key={g}>{g}</span>)}</div>
            ) : <div className="empty-state">Нет данных</div>}
          </div>
        </>
      )}
    </>
  );
}

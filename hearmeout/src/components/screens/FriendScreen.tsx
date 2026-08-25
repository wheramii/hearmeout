'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { RecapOpenButton, Top4Grid } from '../ProfileBlocks';

export function FriendScreen(_props: { device: Device }) {
  const { t, state, me, showScreen } = useApp();
  const [f, setF] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.viewingUserId) { setF(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${state.viewingUserId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) { setF(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [state.viewingUserId]);

  if (loading) return <div className="archive-loading">{t('friend.loadingProfile')}</div>;
  if (!f || !me) {
    return (
      <>
        <button className="back-btn" onClick={() => showScreen('profile')}>{t('friend.back')}</button>
        <div className="empty-state">{t('friend.notFound')}</div>
      </>
    );
  }

  const overlap = me.genres.map((mg) => {
    const fg = f.genres.find((x) => x.g === mg.g);
    return { g: mg.g, me: mg.pct, friend: fg ? fg.pct : 0 };
  });
  const denom = overlap.reduce((s, o) => s + Math.max(o.me, o.friend), 0);
  const matchScore = denom > 0 ? Math.round((overlap.reduce((s, o) => s + Math.min(o.me, o.friend), 0) / denom) * 100) : 0;

  return (
    <>
      <button className="back-btn" onClick={() => showScreen('profile')}>{t('friend.back')}</button>
      <div className="profile-head">
        <div className="avatar-lg" style={{ cursor: 'default', ...userAvatarStyle(f) }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-space-grotesk),sans-serif', fontSize: 19, fontWeight: 700 }}>{f.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.handle}</div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="box"><div className="v">{f.stats.ratings}</div><div className="l">{t('profile.ratings')}</div></div>
        <div className="box"><div className="v">{f.stats.avg || '—'}</div><div className="l">{t('profile.avg')}</div></div>
        <div className="box"><div className="v">{f.stats.reviews}</div><div className="l">{t('profile.reviews')}</div></div>
      </div>

      <div className="section-head"><h2>{t('friend.recap')}</h2><span>{t('profile.recapPeriods')}</span></div>
      <div style={{ marginBottom: 24 }}><RecapOpenButton userId={f.id} label={t('friend.recapOf', { name: f.name.split(' ')[0] })} /></div>

      <div className="section-head"><h2>{t('friend.compare')}</h2><span>{t('friend.withYou')}</span></div>
      {overlap.length ? (
        <div className="compare-block">
          <div className="compare-score"><div className="v">{matchScore}%</div><div className="l">{t('friend.matchScore')}</div></div>
          {overlap.map((o) => (
            <div className="compare-row" key={o.g}>
              <div className="g">{o.g}</div>
              <div className="bars">
                <div className="b me"><i style={{ width: `${o.me}%` }} /></div>
                <div className="b fr"><i style={{ width: `${o.friend}%` }} /></div>
              </div>
            </div>
          ))}
          <div className="compare-legend">
            <span><i style={{ background: 'var(--lime)' }} />{t('friend.you')}</span>
            <span><i style={{ background: 'var(--muted)' }} />{f.name.split(' ')[0]}</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">{t('friend.notEnoughCompare')}</div>
      )}

      <div className="section-head"><h2>{t('friend.top4')}</h2><span>{t('friend.byRatings')}</span></div>
      <Top4Grid ids={f.top4Albums} />
    </>
  );
}

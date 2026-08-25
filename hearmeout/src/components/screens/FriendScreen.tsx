'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { RecapOpenButton, Top4Grid } from '../ProfileBlocks';

export function FriendScreen(_props: { device: Device }) {
  const { state, me, showScreen } = useApp();
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

  if (loading) return <div className="archive-loading">Загружаю профиль…</div>;
  if (!f || !me) {
    return (
      <>
        <button className="back-btn" onClick={() => showScreen('profile')}>← Профиль</button>
        <div className="empty-state">Друг не найден</div>
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
      <button className="back-btn" onClick={() => showScreen('profile')}>← Профиль</button>
      <div className="profile-head">
        <div className="avatar-lg" style={{ cursor: 'default', ...userAvatarStyle(f) }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-space-grotesk),sans-serif', fontSize: 19, fontWeight: 700 }}>{f.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.handle}</div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="box"><div className="v">{f.stats.ratings}</div><div className="l">ОЦЕНОК</div></div>
        <div className="box"><div className="v">{f.stats.avg || '—'}</div><div className="l">СР. БАЛЛ</div></div>
        <div className="box"><div className="v">{f.stats.reviews}</div><div className="l">РЕЦЕНЗИЙ</div></div>
      </div>

      <div className="section-head"><h2>Рекап друга</h2><span>день / месяц / сезон</span></div>
      <div style={{ marginBottom: 24 }}><RecapOpenButton userId={f.id} label={`Рекап ${f.name.split(' ')[0]}`} /></div>

      <div className="section-head"><h2>Сравнение вкусов</h2><span>с вами</span></div>
      {overlap.length ? (
        <div className="compare-block">
          <div className="compare-score"><div className="v">{matchScore}%</div><div className="l">СОВПАДЕНИЕ ПО ЖАНРАМ</div></div>
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
            <span><i style={{ background: 'var(--lime)' }} />Вы</span>
            <span><i style={{ background: 'var(--muted)' }} />{f.name.split(' ')[0]}</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">Пока недостаточно данных для сравнения</div>
      )}

      <div className="section-head"><h2>Топ-4 альбома</h2><span>по оценкам</span></div>
      <Top4Grid ids={f.top4Albums} />
    </>
  );
}

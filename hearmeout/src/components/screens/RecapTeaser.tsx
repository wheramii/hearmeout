'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/AppContext';

export function RecapTeaser() {
  const { me, ensureRecap, recapCache, openRecap } = useApp();

  useEffect(() => {
    if (me) ensureRecap('me', 'day');
  }, [me, ensureRecap]);

  if (!me) return null;
  const r = recapCache[`${me.id}:day`];

  return (
    <div className="recap-teaser" onClick={() => openRecap('me')}>
      <span className="rt-arrow">→</span>
      <div className="rt-label">Рекап дня</div>
      {r && r.topArtists[0] ? (
        <>
          <h3>{r.topArtists[0]} — на первом месте сегодня</h3>
          <p>{r.minutes} мин · «{r.vibe}»</p>
        </>
      ) : (
        <>
          <h3>Пока рано подводить итоги дня</h3>
          <p>Подключи Spotify и послушай что-нибудь — рекап появится здесь</p>
        </>
      )}
    </div>
  );
}

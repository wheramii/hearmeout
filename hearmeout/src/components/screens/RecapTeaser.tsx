'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { pluralForKey } from '@/lib/i18n';

export function RecapTeaser() {
  const { me, t, language, ensureRecap, recapCache, openRecap } = useApp();

  useEffect(() => {
    if (me) ensureRecap('me', 'day');
  }, [me, ensureRecap]);

  if (!me) return null;
  const r = recapCache[`${me.id}:day`];
  const vibe = r
    ? `${r.trackCount} ${pluralForKey(language, r.trackCount, 'recap.trackOne', 'recap.trackFew', 'recap.trackMany')}${r.topGenres[0] ? t('recap.vibeGenre', { genre: r.topGenres[0] }) : ''}`
    : '';

  return (
    <div className="recap-teaser" onClick={() => openRecap('me')}>
      <span className="rt-arrow">→</span>
      <div className="rt-label">{t('recapTeaser.title')}</div>
      {r && r.topArtists[0] ? (
        <>
          <h3>{r.topArtists[0].name} {t('recapTeaser.topToday')}</h3>
          <p>{r.minutes} {t('awards.minutesShort')} · «{vibe}»</p>
        </>
      ) : (
        <>
          <h3>{t('recapTeaser.notYet')}</h3>
          <p>{t('recapTeaser.connectPrompt')}</p>
        </>
      )}
    </div>
  );
}

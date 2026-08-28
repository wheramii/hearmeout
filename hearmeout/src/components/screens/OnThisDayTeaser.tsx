'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { OnThisDayGroup } from '@/app/api/on-this-day/route';
import { PremiumBadge } from '../ui/PremiumBadge';

export function OnThisDayTeaser() {
  const { me, t } = useApp();
  const [data, setData] = useState<OnThisDayGroup[] | null>(null);

  useEffect(() => {
    // Never even requested for a non-premium account — the API 403s anyway,
    // this just skips the wasted request (real gate is server-side).
    if (!me?.isPremium) return;
    let cancelled = false;
    fetch('/api/on-this-day').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!cancelled && d) setData(d.groups);
    });
    return () => { cancelled = true; };
  }, [me]);

  if (!me) return null;

  if (!me.isPremium) {
    return (
      <div className="recap-teaser" style={{ cursor: 'default' }}>
        <div className="rt-label">{t('onThisDay.title')}<PremiumBadge /></div>
        <p>{t('onThisDay.locked')}</p>
      </div>
    );
  }

  if (!data || !data.length) return null;
  const top = data[0];
  const track = top.tracks[0];
  if (!track) return null;

  return (
    <div className="recap-teaser">
      <span className="rt-arrow">🕓</span>
      <div className="rt-label">{t('onThisDay.title')}</div>
      <h3>{track.title}</h3>
      <p>{track.artist} · {top.year}</p>
    </div>
  );
}

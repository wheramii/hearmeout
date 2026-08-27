'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { OnThisDayGroup } from '@/app/api/on-this-day/route';

export function OnThisDayTeaser() {
  const { me, t } = useApp();
  const [data, setData] = useState<OnThisDayGroup[] | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    fetch('/api/on-this-day').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!cancelled && d) setData(d.groups);
    });
    return () => { cancelled = true; };
  }, [me]);

  if (!me || !data || !data.length) return null;
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

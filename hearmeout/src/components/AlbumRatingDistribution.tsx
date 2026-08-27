'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { accentMix } from '@/lib/accentGradient';

// Ratings are stored in 0.1 steps (see StarPicker), so the real possible
// values are 0.1..5.0 — one bucket per exact value, 50 in total.
const BUCKET_COUNT = 50;

// Real per-tenth-star breakdown of the `ratings` table for this album — no
// placeholder bars: renders nothing while loading, and the "no ratings"
// message once loaded with zero rows.
export function AlbumRatingDistribution({ albumId, refreshToken }: { albumId: string; refreshToken: number }) {
  const { t } = useApp();
  const [counts, setCounts] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCounts(null);
    supabase
      .from('ratings')
      .select('stars')
      .eq('album_id', albumId)
      .then(({ data }) => {
        if (cancelled) return;
        const buckets = new Array(BUCKET_COUNT).fill(0);
        for (const row of (data || []) as { stars: number }[]) {
          const tenths = Math.min(BUCKET_COUNT, Math.max(1, Math.round(Number(row.stars) * 10)));
          buckets[tenths - 1]++;
        }
        setCounts(buckets);
      });
    return () => { cancelled = true; };
  }, [albumId, refreshToken]);

  if (counts === null) return null;

  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return <div className="rating-dist-empty">{t('album.noRatings')}</div>;

  const max = Math.max(...counts);

  return (
    <div className="rating-dist">
      <div className="rating-dist-chart">
        {counts.map((n, i) => {
          const value = (i + 1) / 10;
          const pct = n ? Math.max(6, Math.round((n / max) * 100)) : 0;
          return (
            <div
              key={i}
              className="rating-dist-bar"
              style={{ height: `${pct}%`, background: accentMix((i + 1) / 50) }}
              title={n ? `${value.toFixed(1)} ★ · ${n}` : undefined}
            />
          );
        })}
      </div>
      <div className="rating-dist-axis">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  );
}

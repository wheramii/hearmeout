'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/lib/supabaseClient';

const STARS = [5, 4, 3, 2, 1];

// Real per-star breakdown of the `ratings` table for this album — bucketed
// by rounding each stored half-step score (0.5–5.0) to its nearest whole
// star. No placeholder numbers: renders nothing while loading, and an
// explicit "no ratings" message once loaded with zero rows.
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
        const buckets = [0, 0, 0, 0, 0];
        for (const row of (data || []) as { stars: number }[]) {
          const bucket = Math.min(5, Math.max(1, Math.round(Number(row.stars))));
          buckets[5 - bucket]++;
        }
        setCounts(buckets);
      });
    return () => { cancelled = true; };
  }, [albumId, refreshToken]);

  if (counts === null) return null;

  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return <div className="rating-dist-empty">{t('album.noRatings')}</div>;

  return (
    <div className="rating-dist">
      {STARS.map((star, i) => {
        const n = counts[i];
        const pct = Math.round((n / total) * 100);
        return (
          <div className="rating-dist-row" key={star}>
            <span className="rating-dist-label">{star}</span>
            <div className="rating-dist-track"><div className="rating-dist-fill" style={{ width: `${pct}%` }} /></div>
            <span className="rating-dist-pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

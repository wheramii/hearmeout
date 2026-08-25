'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { starsText, userAvatarStyle } from '@/lib/format';
import type { AlbumReview } from '@/lib/types';

type Row = { stars: number; review: string | null; users: { name: string; handle: string; avatar_url: string | null } | null };

export function AlbumReviews({ albumId, refreshToken }: { albumId: string; refreshToken: number }) {
  const { t } = useApp();
  const [reviews, setReviews] = useState<AlbumReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    supabase
      .from('ratings')
      .select('stars, review, users(name, handle, avatar_url)')
      .eq('album_id', albumId)
      .not('review', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data || []) as unknown as Row[];
        setReviews(
          rows
            .filter((r) => r.review)
            .map((r) => ({
              stars: r.stars,
              review: r.review as string,
              user: { name: r.users?.name ?? '', handle: r.users?.handle ?? '', avatarUrl: r.users?.avatar_url ?? null },
            }))
        );
      });
    return () => { cancelled = true; };
  }, [albumId, refreshToken]);

  if (reviews === null) return <div className="archive-loading">{t('reviews.loading')}</div>;
  if (!reviews.length) return <div className="empty-state">{t('reviews.empty')}</div>;

  return (
    <>
      {reviews.map((r, i) => (
        <div className="review-card" key={i}>
          <div className="head">
            <div className="user">
              <div className="avatar" style={userAvatarStyle(r.user)} />
              <div className="uname">{r.user.handle}</div>
            </div>
            <div className="stars-dot">{starsText(r.stars)}</div>
          </div>
          <p>{r.review}</p>
        </div>
      ))}
    </>
  );
}

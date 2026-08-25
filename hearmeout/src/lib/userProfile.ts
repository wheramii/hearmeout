import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicProfile } from './types';

export async function getUserProfile(admin: SupabaseClient, userId: string): Promise<PublicProfile | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: user, error: userErr }, { data: ratings }, { data: genreRows }, { data: todayRows }] = await Promise.all([
    admin.from('users').select('id, name, handle, avatar_url').eq('id', userId).maybeSingle(),
    admin.from('ratings').select('album_id, stars, review').eq('user_id', userId).order('stars', { ascending: false }),
    admin.from('listening_events').select('genre').eq('user_id', userId).not('genre', 'is', null).limit(5000),
    admin.from('listening_events').select('duration_ms').eq('user_id', userId).gte('played_at', startOfDay.toISOString()),
  ]);

  if (userErr) throw userErr;
  if (!user) return null;

  const ratingsList = ratings || [];
  const avg = ratingsList.length ? ratingsList.reduce((s, r) => s + Number(r.stars), 0) / ratingsList.length : 0;
  const reviewsCount = ratingsList.filter((r) => r.review).length;
  const top4Albums = ratingsList.slice(0, 4).map((r) => r.album_id as string);

  const genreCounts = new Map<string, number>();
  for (const row of genreRows || []) {
    const g = row.genre as string;
    genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
  }
  const totalGenreEvents = [...genreCounts.values()].reduce((s, n) => s + n, 0);
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g, count]) => ({ g, pct: totalGenreEvents ? Math.round((count / totalGenreEvents) * 100) : 0 }));

  const minutesToday = Math.round((todayRows || []).reduce((s, r) => s + (r.duration_ms || 0), 0) / 60000);

  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: user.avatar_url,
    stats: { ratings: ratingsList.length, avg: Math.round(avg * 10) / 10, reviews: reviewsCount },
    genres,
    top4Albums,
    minutesToday,
  };
}

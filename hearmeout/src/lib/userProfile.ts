import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiUser, PublicProfile } from './types';

// `viewerId` is who's asking — friends-of-friends discovery (showing this
// person's own friend list) and their recent activity only go out when the
// viewer is this person themself or already an accepted friend of theirs,
// so a stranger's full social graph isn't exposed to anyone who finds a link.
export async function getUserProfile(
  admin: SupabaseClient,
  userId: string,
  viewerId?: string | null
): Promise<PublicProfile | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: user, error: userErr }, { data: ratings }, { data: genreRows }, { data: todayRows }] = await Promise.all([
    admin.from('users').select('id, name, handle, avatar_url, created_at').eq('id', userId).maybeSingle(),
    admin.from('ratings').select('album_id, stars, review, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('listening_events').select('genre').eq('user_id', userId).not('genre', 'is', null).limit(5000),
    admin.from('listening_events').select('duration_ms').eq('user_id', userId).gte('played_at', startOfDay.toISOString()),
  ]);

  if (userErr) throw userErr;
  if (!user) return null;

  const ratingsList = ratings || [];
  const avg = ratingsList.length ? ratingsList.reduce((s, r) => s + Number(r.stars), 0) / ratingsList.length : 0;
  const reviewsCount = ratingsList.filter((r) => r.review).length;
  const top4Albums = [...ratingsList].sort((a, b) => Number(b.stars) - Number(a.stars)).slice(0, 4).map((r) => r.album_id as string);

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

  const profile: PublicProfile = {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: user.avatar_url,
    stats: { ratings: ratingsList.length, avg: Math.round(avg * 10) / 10, reviews: reviewsCount },
    genres,
    top4Albums,
    minutesToday,
    joinedAt: user.created_at as string,
  };

  const isSelf = !!viewerId && viewerId === userId;
  const isMutualFriend = !isSelf && !!viewerId && await isFriendOf(admin, userId, viewerId);
  if (isSelf || isMutualFriend) {
    profile.recentRatings = ratingsList.slice(0, 20).map((r) => ({
      albumId: r.album_id as string,
      stars: Number(r.stars),
      review: r.review as string | null,
      createdAt: r.created_at as string,
    }));
    const { data: friendRows } = await admin
      .from('friendships')
      .select('friend:friend_id(id, name, handle, avatar_url)')
      .eq('user_id', userId);
    profile.friends = (friendRows || [])
      .map((row) => {
        const f = row.friend as unknown as { id: string; name: string; handle: string; avatar_url: string | null } | null;
        return f ? { id: f.id, name: f.name, handle: f.handle, avatarUrl: f.avatar_url } : null;
      })
      .filter((f): f is ApiUser => f !== null);
  }

  return profile;
}

async function isFriendOf(admin: SupabaseClient, userId: string, viewerId: string): Promise<boolean> {
  const { data } = await admin
    .from('friendships')
    .select('user_id')
    .eq('user_id', userId)
    .eq('friend_id', viewerId)
    .maybeSingle();
  return !!data;
}

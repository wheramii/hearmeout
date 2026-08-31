import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

// Scoped to listening time, not ratings — ratings.album_id has no
// server-side artist mapping (album->artist only exists at the app layer,
// via Spotify catalog data), but listening_events already carries
// artist_id/artist directly. `name` is a fallback match for
// MusicBrainz-sourced artists, which don't have a Spotify artist id.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const { id } = await context.params;
  const name = new URL(request.url).searchParams.get('name') || '';

  const admin = supabaseAdmin();
  const { data: friendRows } = await admin.from('friendships').select('friend_id, friend:friend_id(id, name, handle, avatar_url)').eq('user_id', userId);
  const friendIds = (friendRows || []).map((r) => r.friend_id as string);
  if (!friendIds.length) return NextResponse.json({ topFan: null });

  let query = admin.from('listening_events').select('user_id, duration_ms').in('user_id', friendIds);
  query = name ? query.or(`artist_id.eq.${id},artist.eq.${name}`) : query.eq('artist_id', id);
  const { data: eventRows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const msByUser = new Map<string, number>();
  for (const r of eventRows || []) {
    const k = r.user_id as string;
    msByUser.set(k, (msByUser.get(k) || 0) + (r.duration_ms || 0));
  }
  if (!msByUser.size) return NextResponse.json({ topFan: null });

  const [topId] = [...msByUser.entries()].sort((a, b) => b[1] - a[1])[0];
  const winnerRow = (friendRows || []).find((r) => r.friend_id === topId);
  const winner = winnerRow?.friend as unknown as { id: string; name: string; handle: string; avatar_url: string | null } | null;
  if (!winner) return NextResponse.json({ topFan: null });

  return NextResponse.json({
    topFan: { id: winner.id, name: winner.name, handle: winner.handle, avatarUrl: winner.avatar_url, hours: Math.round((msByUser.get(topId)! / 3600000) * 10) / 10 },
  });
}

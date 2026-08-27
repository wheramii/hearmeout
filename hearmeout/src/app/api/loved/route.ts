import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const admin = supabaseAdmin();
  const { data } = await admin
    .from('loved_tracks')
    .select('id, track_id, track_title, artist, cover_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  const tracks = (data || []).map((r) => ({
    id: r.id, trackId: r.track_id, title: r.track_title, artist: r.artist, cover: r.cover_url, createdAt: r.created_at,
  }));
  return NextResponse.json({ tracks });
}

// Toggle — loving an already-loved track un-loves it. Identified by
// (trackId, title, artist) rather than trackId alone since CSV-imported
// rows don't always have a real Spotify track id.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title : null;
  const artist = typeof body?.artist === 'string' ? body.artist : null;
  if (!title || !artist) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  const trackId = typeof body?.trackId === 'string' ? body.trackId : null;
  const cover = typeof body?.cover === 'string' ? body.cover : null;

  const admin = supabaseAdmin();
  let existingQuery = admin.from('loved_tracks').select('id').eq('user_id', userId).eq('track_title', title).eq('artist', artist);
  existingQuery = trackId ? existingQuery.eq('track_id', trackId) : existingQuery.is('track_id', null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    await admin.from('loved_tracks').delete().eq('id', existing.id);
    return NextResponse.json({ loved: false });
  }
  await admin.from('loved_tracks').insert({ user_id: userId, track_id: trackId, track_title: title, artist, cover_url: cover });
  return NextResponse.json({ loved: true });
}

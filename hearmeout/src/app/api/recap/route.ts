import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import type { RecapData, RecapPeriod } from '@/lib/types';

const PERIOD_DAYS: Record<RecapPeriod, number> = { day: 1, month: 30, season: 90 };

export async function GET(request: NextRequest) {
  const viewerId = await getCurrentUserId();
  if (!viewerId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get('period') as RecapPeriod) || 'day';
  const targetUserId = url.searchParams.get('userId') || viewerId;
  const days = PERIOD_DAYS[period] ?? 1;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = supabaseAdmin();
  const { data: events, error } = await admin
    .from('listening_events')
    .select('track_id, track_title, artist, artist_id, album_id, cover_url, genre, duration_ms')
    .eq('user_id', targetUserId)
    .gte('played_at', since)
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = events || [];
  const minutes = Math.round(rows.reduce((s, r) => s + (r.duration_ms || 0), 0) / 60000);
  const uniqueArtists = new Set(rows.map((r) => r.artist_id || r.artist).filter(Boolean)).size;

  type ArtistAgg = { id: string | null; name: string; cover: string | null; count: number };
  type TrackAgg = { title: string; artist: string; albumId: string | null; cover: string | null; count: number };

  const artistAgg = new Map<string, ArtistAgg>();
  const trackAgg = new Map<string, TrackAgg>();
  const genreCounts = new Map<string, number>();

  for (const r of rows) {
    if (r.artist) {
      const key = r.artist_id || r.artist;
      const existing = artistAgg.get(key);
      if (existing) existing.count += 1;
      else artistAgg.set(key, { id: r.artist_id, name: r.artist, cover: r.cover_url, count: 1 });
    }
    if (r.track_title && r.artist) {
      const key = r.track_id || `${r.track_title}—${r.artist}`;
      const existing = trackAgg.get(key);
      if (existing) existing.count += 1;
      else trackAgg.set(key, { title: r.track_title, artist: r.artist, albumId: r.album_id, cover: r.cover_url, count: 1 });
    }
    if (r.genre) genreCounts.set(r.genre, (genreCounts.get(r.genre) || 0) + 1);
  }

  const topArtists = [...artistAgg.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((a) => ({ id: a.id, name: a.name, cover: a.cover }));
  const topSongs = [...trackAgg.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => ({ title: t.title, artist: t.artist, albumId: t.albumId, cover: t.cover }));
  const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  const recap: RecapData = { topArtists, topSongs, topGenres, minutes, uniqueArtists, trackCount: rows.length };
  return NextResponse.json(recap);
}

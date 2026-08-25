import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { pluralRu } from '@/lib/pluralize';
import type { RecapData, RecapPeriod } from '@/lib/types';

const PERIOD_DAYS: Record<RecapPeriod, number> = { day: 1, month: 30, season: 90 };

function topN(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

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
    .select('track_title, artist, genre, duration_ms')
    .eq('user_id', targetUserId)
    .gte('played_at', since)
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = events || [];
  const minutes = Math.round(rows.reduce((s, r) => s + (r.duration_ms || 0), 0) / 60000);
  const uniqueArtists = new Set(rows.map((r) => r.artist).filter(Boolean)).size;

  const artistCounts = new Map<string, number>();
  const trackCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  for (const r of rows) {
    if (r.artist) artistCounts.set(r.artist, (artistCounts.get(r.artist) || 0) + 1);
    if (r.track_title && r.artist) {
      const key = `${r.track_title} — ${r.artist}`;
      trackCounts.set(key, (trackCounts.get(key) || 0) + 1);
    }
    if (r.genre) genreCounts.set(r.genre, (genreCounts.get(r.genre) || 0) + 1);
  }

  const topArtists = topN(artistCounts, 3);
  const topSongs = topN(trackCounts, 3);
  const topGenres = topN(genreCounts, 3);

  const vibe = rows.length === 0
    ? 'пока нет данных за этот период — послушай что-нибудь в Spotify, и рекап заполнится'
    : `${rows.length} ${pluralRu(rows.length, 'трек', 'трека', 'треков')}${topGenres[0] ? `, чаще всего — ${topGenres[0]}` : ''}`;

  const recap: RecapData = { topArtists, topSongs, topGenres, minutes, uniqueArtists, vibe };
  return NextResponse.json(recap);
}

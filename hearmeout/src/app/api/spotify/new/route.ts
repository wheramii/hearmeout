import { NextRequest, NextResponse } from 'next/server';
import { fetchNewOnSpotify } from '@/lib/spotifyCatalog';
import { withSpotifyCache } from '@/lib/spotifyCache';

export async function GET(request: NextRequest) {
  const market = new URL(request.url).searchParams.get('market');
  try {
    const albums = await withSpotifyCache(`new:${market || 'global'}`, 600, () => fetchNewOnSpotify(10, market));
    return NextResponse.json(albums, { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

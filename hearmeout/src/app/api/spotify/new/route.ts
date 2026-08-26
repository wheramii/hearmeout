import { NextRequest, NextResponse } from 'next/server';
import { fetchNewOnSpotify } from '@/lib/spotifyCatalog';
import { withSpotifyCache } from '@/lib/spotifyCache';

export async function GET(request: NextRequest) {
  const market = new URL(request.url).searchParams.get('market');
  try {
    const albums = await withSpotifyCache(`new:${market || 'global'}`, 600, () => fetchNewOnSpotify(10, market));
    // No Cache-Control: Netlify's edge cache keys this route by path only,
    // ignoring the `market` query string — every region would otherwise
    // get whatever got cached for the first request, market included.
    // withSpotifyCache above already caches correctly per market.
    return NextResponse.json(albums);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchObscureAlbums } from '@/lib/spotifyCatalog';
import { withSpotifyCache } from '@/lib/spotifyCache';

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const genre = params.get('genre') || 'electronic';
  const market = params.get('market');
  try {
    const albums = await withSpotifyCache(
      `obscure:${genre}:${market || 'global'}`,
      3600,
      () => fetchObscureAlbums(genre, 10, market)
    );
    return NextResponse.json(albums, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

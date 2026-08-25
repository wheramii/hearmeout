import { NextRequest, NextResponse } from 'next/server';
import { fetchGenreTopArtists } from '@/lib/spotifyCatalog';
import { withSpotifyCache } from '@/lib/spotifyCache';

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const genre = params.get('genre');
  const market = params.get('market');
  if (!genre) return NextResponse.json({ error: 'genre_required' }, { status: 400 });
  try {
    const artists = await withSpotifyCache(
      `genre-artists:${genre}:${market || 'global'}`,
      3600,
      () => fetchGenreTopArtists(genre, 8, market)
    );
    return NextResponse.json(artists, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

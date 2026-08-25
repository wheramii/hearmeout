import { NextRequest, NextResponse } from 'next/server';
import { fetchGenreTopArtists } from '@/lib/spotifyCatalog';

export async function GET(request: NextRequest) {
  const genre = new URL(request.url).searchParams.get('genre');
  if (!genre) return NextResponse.json({ error: 'genre_required' }, { status: 400 });
  try {
    const artists = await fetchGenreTopArtists(genre, 8);
    return NextResponse.json(artists, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

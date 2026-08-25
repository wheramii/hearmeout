import { NextRequest, NextResponse } from 'next/server';
import { fetchObscureAlbums } from '@/lib/spotifyCatalog';

export async function GET(request: NextRequest) {
  const genre = new URL(request.url).searchParams.get('genre') || 'electronic';
  try {
    const albums = await fetchObscureAlbums(genre);
    return NextResponse.json(albums, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

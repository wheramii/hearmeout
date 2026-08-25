import { NextResponse } from 'next/server';
import { fetchSpotifyAlbumDetail } from '@/lib/spotifyCatalog';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const album = await fetchSpotifyAlbumDetail(id);
    if (!album) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(album, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ALBUMS } from '@/lib/data';
import { fetchAlbumCovers } from '@/lib/spotifyCatalog';

export async function GET() {
  try {
    const ids = ALBUMS.filter((a) => a.spotifyId).map((a) => ({ ourId: a.id, spotifyId: a.spotifyId! }));
    const covers = await fetchAlbumCovers(ids);
    return NextResponse.json(covers, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { fetchNewOnSpotify } from '@/lib/spotifyCatalog';

export async function GET() {
  try {
    const albums = await fetchNewOnSpotify();
    return NextResponse.json(albums, { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

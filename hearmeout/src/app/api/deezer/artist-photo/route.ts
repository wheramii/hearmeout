import { NextRequest, NextResponse } from 'next/server';

// Same reasoning as /api/deezer/preview — do this server-side instead of
// through the public corsproxy.io the client used to hit directly.
export async function GET(request: NextRequest) {
  const name = new URL(request.url).searchParams.get('name') || '';
  if (!name) return NextResponse.json({ error: 'missing_query' }, { status: 400 });

  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`);
    if (!res.ok) throw new Error(`Deezer search failed: ${res.status}`);
    const data = await res.json();
    const artist = (data.data || [])[0];
    if (!artist?.picture_medium) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(
      { photo: artist.picture_medium },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

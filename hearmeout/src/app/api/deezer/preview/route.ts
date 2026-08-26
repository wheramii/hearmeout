import { NextRequest, NextResponse } from 'next/server';

// Server-side so it never depends on the public corsproxy.io service the
// client used to call directly — that proxy is flaky enough (rate limits,
// outages) that it was leaving the preview player permanently stuck in
// "loading" for real visitors. A plain server-to-server fetch has no CORS
// restriction at all, so no proxy is needed here.
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const artist = params.get('artist') || '';
  const title = params.get('title') || '';
  if (!artist && !title) return NextResponse.json({ error: 'missing_query' }, { status: 400 });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=1`);
    if (!res.ok) throw new Error(`Deezer search failed: ${res.status}`);
    const data = await res.json();
    const track = (data.data || [])[0];
    if (!track || !track.preview) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(
      { title: track.title, preview: track.preview },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

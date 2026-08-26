import { NextRequest, NextResponse } from 'next/server';

// Server-side so it never depends on the public corsproxy.io service the
// client used to call directly — that proxy is flaky enough (rate limits,
// outages) that it was leaving the preview player permanently stuck in
// "loading" for real visitors. A plain server-to-server fetch has no CORS
// restriction at all, so no proxy is needed here.

type DeezerTrack = { id: number; title: string; preview: string; artist?: { name?: string } };
type DeezerAlbum = { id: number; artist?: { name?: string } };

function normalize(s: string): string {
  const stripped = s
    .split('')
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f; // drop combining diacritics (café -> cafe)
    })
    .join('');
  return stripped.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Deezer's plain keyword search matches loosely against track titles — for
// an ALBUM title that isn't itself a track name (most albums), that can
// return something from a completely different artist. Scoring candidates
// by how closely their artist name matches the one we asked for catches
// that instead of blindly trusting the first hit.
function artistMatchScore(candidateArtist: string | undefined, wantedArtist: string): number {
  const a = normalize(candidateArtist || '');
  const w = normalize(wantedArtist);
  if (!a || !w) return 0;
  if (a === w) return 3;
  if (a.includes(w) || w.includes(a)) return 2;
  if (w.split(' ').some((word) => word.length > 2 && a.includes(word))) return 1;
  return 0;
}

async function searchDeezer<T>(path: string, q: string, limit: number): Promise<T[]> {
  const res = await fetch(`https://api.deezer.com${path}?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

function bestByArtist<T extends { artist?: { name?: string } }>(items: T[], wantedArtist: string): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const score = artistMatchScore(item.artist?.name, wantedArtist);
    if (score > (best?.score ?? 0)) best = { item, score };
  }
  return best;
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const artist = params.get('artist') || '';
  const title = params.get('title') || '';
  if (!artist && !title) return NextResponse.json({ error: 'missing_query' }, { status: 400 });

  try {
    const [albums, tracks] = await Promise.all([
      searchDeezer<DeezerAlbum>('/search/album', `${artist} ${title}`, 3),
      searchDeezer<DeezerTrack>('/search', `${artist} ${title}`, 5),
    ]);
    const bestAlbum = bestByArtist(albums, artist);
    const bestTrack = bestByArtist(tracks, artist);

    let result: { title: string; preview: string } | null = null;

    if (bestAlbum && bestAlbum.score > 0 && (!bestTrack || bestAlbum.score >= bestTrack.score)) {
      const albumRes = await fetch(`https://api.deezer.com/album/${bestAlbum.item.id}`);
      if (albumRes.ok) {
        const albumData = await albumRes.json();
        const firstPreviewable = (albumData.tracks?.data || []).find((t: DeezerTrack) => t.preview);
        if (firstPreviewable) result = { title: firstPreviewable.title, preview: firstPreviewable.preview };
      }
    }

    if (!result && bestTrack && bestTrack.score > 0 && bestTrack.item.preview) {
      result = { title: bestTrack.item.title, preview: bestTrack.item.preview };
    }

    if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(result, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// Deezer has no CORS headers, so the browser hits it through a public CORS proxy —
// ported as-is from the prototype. Same external-dependency caveat applies:
// the proxy occasionally rate-limits or goes down.
function corsProxy(url: string) {
  return 'https://corsproxy.io/?url=' + encodeURIComponent(url);
}

export async function fetchDeezerArtistPhoto(name: string): Promise<string | null> {
  try {
    const res = await fetch(corsProxy(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`));
    if (!res.ok) return null;
    const data = await res.json();
    const artist = (data.data || [])[0];
    return artist?.picture_medium || null;
  } catch {
    return null;
  }
}

export async function fetchTrackPreview(artistName: string, albumTitle: string): Promise<{ title: string; preview: string } | null> {
  const res = await fetch(corsProxy(`https://api.deezer.com/search?q=${encodeURIComponent(artistName + ' ' + albumTitle)}&limit=1`));
  if (!res.ok) throw new Error('request failed');
  const data = await res.json();
  const track = (data.data || [])[0];
  if (!track || !track.preview) return null;
  return { title: track.title, preview: track.preview };
}

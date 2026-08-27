import type { SupabaseClient } from '@supabase/supabase-js';
import { getSpotifyAppToken } from './spotifyAppAuth';

// The Extended Streaming History export has real spotify_track_uri values
// but no cover art or artist id — importStreamingHistory stores those as
// null. This looks each unique track up (singular /v1/tracks/{id}) and
// backs the real cover/artist id into every listening_events row that
// shares it. Runs after the import response is sent (fire-and-forget) so a
// large import isn't held up by thousands of sequential Spotify requests.
//
// A first version of this ran 8 requests concurrently with no pacing —
// confirmed live: it got 429'd by Spotify with Retry-After: ~41000s (11+
// hours), and that penalty turned out to be shared across every /v1/*/{id}
// singular-lookup endpoint on this app's client-credentials token, not just
// /v1/tracks — so it broke brand-new (uncached) album and artist pages
// app-wide for that whole window, not just this enrichment. This version
// runs one request at a time with a real delay between them, and — the
// important part — stops the entire run the moment it sees a 429 instead
// of ploughing through the rest of the queue and making the penalty worse.
// Same for every account — the earlier idea of a higher cap for premium
// users was dropped: capping it for everyone else felt like taking
// something away rather than a premium perk, so this stays one number.
const REQUEST_DELAY_MS = 150;
const MAX_TRACKS_PER_RUN = 400;

export async function enrichListeningHistoryCovers(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: rows } = await admin
    .from('listening_events')
    .select('track_id')
    .eq('user_id', userId)
    .is('cover_url', null)
    .not('track_id', 'is', null);
  const uniqueIds = [...new Set((rows || []).map((r) => r.track_id as string))].slice(0, MAX_TRACKS_PER_RUN);
  if (!uniqueIds.length) return;

  const token = await getSpotifyAppToken();
  for (const trackId of uniqueIds) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 429) return; // shared token is rate-limited — stop, don't make it worse
      if (!res.ok) continue;
      const data = await res.json();
      const cover: string | null = data.album?.images?.[0]?.url ?? null;
      const artistId: string | null = data.artists?.[0]?.id ?? null;
      const albumId: string | null = data.album?.id ?? null;
      if (!cover && !artistId && !albumId) continue;
      await admin
        .from('listening_events')
        .update({ cover_url: cover, artist_id: artistId, album_id: albumId })
        .eq('user_id', userId)
        .eq('track_id', trackId);
    } catch {
      // best-effort — one bad track shouldn't stop the rest of the run
    }
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }
}

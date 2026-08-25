import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchArtistGenres, fetchRecentlyPlayed, refreshAccessToken } from './spotify';

export async function syncSpotifyForUser(admin: SupabaseClient, userId: string): Promise<{ imported: number }> {
  const { data: conn, error: connErr } = await admin
    .from('connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'spotify')
    .maybeSingle();
  if (connErr) throw connErr;
  if (!conn) throw new Error('not_connected');

  let accessToken = conn.access_token as string;
  const expiresAt = new Date(conn.expires_at as string).getTime();
  if (Date.now() > expiresAt - 60_000) {
    const refreshed = await refreshAccessToken(conn.refresh_token as string);
    accessToken = refreshed.access_token;
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await admin
      .from('connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshed.refresh_token || conn.refresh_token,
        expires_at: newExpiresAt,
      })
      .eq('user_id', userId)
      .eq('provider', 'spotify');
  }

  const items = await fetchRecentlyPlayed(accessToken);
  if (!items.length) return { imported: 0 };

  const artistIds = items.flatMap((i) => i.track.artists.map((a) => a.id));
  const genreByArtist = await fetchArtistGenres(accessToken, artistIds);

  const rows = items.map((i) => ({
    user_id: userId,
    track_id: i.track.id,
    track_title: i.track.name,
    artist: i.track.artists.map((a) => a.name).join(', '),
    album: i.track.album.name,
    genre: genreByArtist.get(i.track.artists[0]?.id) || null,
    release_year: i.track.album.release_date ? parseInt(i.track.album.release_date.slice(0, 4), 10) : null,
    played_at: i.played_at,
    duration_ms: i.track.duration_ms,
    source: 'spotify' as const,
  }));

  const { error: insertErr } = await admin
    .from('listening_events')
    .upsert(rows, { onConflict: 'user_id,track_id,played_at', ignoreDuplicates: true });
  if (insertErr) throw insertErr;

  return { imported: rows.length };
}

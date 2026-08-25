import type { SupabaseClient } from '@supabase/supabase-js';

// Spotify's official "Download your data" export comes as a zip of JSON
// files the user extracts themselves — we only ever see the loose JSON
// files. Two shapes exist in the wild:
//  - Extended streaming history (what we ask for): ts, ms_played,
//    master_metadata_track_name, master_metadata_album_artist_name,
//    master_metadata_album_album_name, spotify_track_uri.
//  - The older/plainer "Account data" export some users grab by mistake:
//    endTime, artistName, trackName, msPlayed — no album, no track id.
// Podcast-episode rows share the same file but carry episode_name instead
// of a track name, so they're naturally skipped by requiring a track title.
type NormalizedRow = {
  playedAt: string;
  durationMs: number;
  trackTitle: string;
  artist: string;
  album: string | null;
  trackId: string | null;
};

function extractTrackId(uri?: string | null): string | null {
  if (!uri) return null;
  const m = /^spotify:track:([a-zA-Z0-9]+)$/.exec(uri);
  return m ? m[1] : null;
}

function normalizeEntry(raw: unknown): NormalizedRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.ts === 'string' && typeof r.master_metadata_track_name === 'string') {
    return {
      playedAt: r.ts,
      durationMs: Number(r.ms_played) || 0,
      trackTitle: r.master_metadata_track_name,
      artist: typeof r.master_metadata_album_artist_name === 'string' ? r.master_metadata_album_artist_name : 'Unknown',
      album: typeof r.master_metadata_album_album_name === 'string' ? r.master_metadata_album_album_name : null,
      trackId: extractTrackId(typeof r.spotify_track_uri === 'string' ? r.spotify_track_uri : null),
    };
  }

  if (typeof r.endTime === 'string' && typeof r.trackName === 'string') {
    const iso = new Date(r.endTime.replace(' ', 'T') + 'Z');
    if (Number.isNaN(iso.getTime())) return null;
    return {
      playedAt: iso.toISOString(),
      durationMs: Number(r.msPlayed) || 0,
      trackTitle: r.trackName,
      artist: typeof r.artistName === 'string' ? r.artistName : 'Unknown',
      album: null,
      trackId: null,
    };
  }

  return null;
}

// Plays under 5s are almost always an accidental tap or a skip mid-load,
// not a real listen — filtered out the same way most Spotify-stats tools do.
const MIN_MS_PLAYED = 5000;
const UPSERT_CHUNK = 1000;

export type ImportResult = { imported: number; skipped: number; filesRead: number; errors: string[] };

export async function importStreamingHistory(
  admin: SupabaseClient,
  userId: string,
  files: { name: string; text: string }[]
): Promise<ImportResult> {
  const errors: string[] = [];
  const rows: NormalizedRow[] = [];

  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.text);
    } catch {
      errors.push(`${file.name}: не похоже на JSON`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${file.name}: ожидался список записей`);
      continue;
    }
    for (const raw of parsed) {
      const row = normalizeEntry(raw);
      if (row) rows.push(row);
    }
  }

  const filtered = rows.filter((r) => r.durationMs >= MIN_MS_PLAYED);
  const skipped = rows.length - filtered.length;
  if (!filtered.length) return { imported: 0, skipped, filesRead: files.length, errors };

  const dbRows = filtered.map((r) => ({
    user_id: userId,
    track_id: r.trackId,
    track_title: r.trackTitle,
    artist: r.artist,
    artist_id: null,
    album: r.album,
    album_id: null,
    cover_url: null,
    genre: null,
    release_year: null,
    played_at: r.playedAt,
    duration_ms: r.durationMs,
    source: 'spotify' as const,
  }));

  let imported = 0;
  for (let i = 0; i < dbRows.length; i += UPSERT_CHUNK) {
    const chunk = dbRows.slice(i, i + UPSERT_CHUNK);
    const { error } = await admin
      .from('listening_events')
      .upsert(chunk, { onConflict: 'user_id,track_id,played_at', ignoreDuplicates: true });
    if (error) { errors.push(error.message); continue; }
    imported += chunk.length;
  }

  return { imported, skipped, filesRead: files.length, errors };
}

import { supabaseAdmin } from './supabaseAdmin';

// Shared, durable cache for Spotify catalog responses. Netlify's serverless
// functions cold-start per request, so an in-memory cache wouldn't survive
// between invocations — this table is read by every instance and every
// visitor, so N users looking at the homepage cost Spotify one request
// instead of N. On a fetch failure (rate limit, outage) we fall back to
// whatever's cached, even if stale, rather than showing an error.
export async function withSpotifyCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const admin = supabaseAdmin();
  const { data: cached } = await admin
    .from('spotify_cache')
    .select('payload, expires_at')
    .eq('key', key)
    .maybeSingle();

  const now = Date.now();
  if (cached && new Date(cached.expires_at).getTime() > now) {
    return cached.payload as T;
  }

  try {
    const fresh = await fetcher();
    await admin.from('spotify_cache').upsert({
      key,
      payload: fresh,
      fetched_at: new Date(now).toISOString(),
      expires_at: new Date(now + ttlSeconds * 1000).toISOString(),
    });
    return fresh;
  } catch (err) {
    if (cached) return cached.payload as T;
    throw err;
  }
}

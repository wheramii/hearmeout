-- HearMeOut — migration 005: shared server-side cache for Spotify catalog
-- responses. Netlify serverless functions cold-start per request, so an
-- in-memory cache doesn't survive between invocations — this table is a
-- durable, shared cache all instances (and all visitors) read from, cutting
-- down how often we actually hit Spotify's rate-limited /search endpoint.
-- Run in Supabase SQL Editor after migration_004_covers_and_links.sql.

create table if not exists spotify_cache (
  key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists spotify_cache_expires_at_idx on spotify_cache (expires_at);

alter table spotify_cache enable row level security;

-- Only the service-role key (server-side) ever touches this table.
create policy "spotify_cache_no_public_access" on spotify_cache
  for all using (false);

-- HearMeOut — migration 004: store Spotify ids/cover art on listening events
-- so recap can show real thumbnails and link straight to the artist/album.
-- Run in Supabase SQL Editor after migration_003_language_region.sql.

alter table listening_events add column if not exists artist_id text;
alter table listening_events add column if not exists album_id text;
alter table listening_events add column if not exists cover_url text;

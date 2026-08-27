-- HearMeOut — migration 010: generalizes migration_009's loved_tracks
-- (tracks only) into loved_items (tracks, albums, and artists) — the
-- track-only version turned out to have no discoverable way to like
-- anything except a track buried in Stats' recent-plays list, and the user
-- specifically asked for albums and artists too. loved_tracks was just
-- shipped and effectively unused, so this replaces it outright rather than
-- trying to migrate rows. Run in Supabase SQL Editor after migration_009.

drop table if exists loved_tracks;

create table if not exists loved_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  item_type text not null check (item_type in ('track', 'album', 'artist')),
  item_id text,
  title text not null,
  artist text,
  cover_url text,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id, title, artist)
);

create index if not exists loved_items_user_idx on loved_items (user_id, created_at desc);

alter table loved_items enable row level security;

create policy "loved_items are publicly readable" on loved_items
  for select using (true);

-- HearMeOut — migration 009: freemium foundation. Adds the premium flag
-- (defaults false for everyone — no self-serve toggle, flipped by hand
-- until real billing exists), profile banner + accent palette, and a
-- table for the new "loved tracks" free feature. Run in Supabase SQL
-- Editor after migration_008.

alter table users add column if not exists is_premium boolean not null default false;
alter table users add column if not exists banner_url text;
alter table users add column if not exists accent_palette text;

create table if not exists loved_tracks (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  track_id text,
  track_title text not null,
  artist text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  unique (user_id, track_id, track_title, artist)
);

create index if not exists loved_tracks_user_idx on loved_tracks (user_id, created_at desc);

alter table loved_tracks enable row level security;

create policy "loved_tracks are publicly readable" on loved_tracks
  for select using (true);

-- HearMeOut — Supabase schema
-- Paste into Supabase SQL Editor and run once on a fresh project.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique,
  name text,
  handle text unique,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists connections (
  user_id uuid references users(id) on delete cascade,
  provider text check (provider in ('spotify','apple_music')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  primary key (user_id, provider)
);

create table if not exists listening_events (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  track_id text,
  track_title text,
  artist text,
  album text,
  genre text,
  release_year int,
  played_at timestamptz not null,
  source text check (source in ('spotify','apple_music')),
  created_at timestamptz default now(),
  unique (user_id, track_id, played_at)
);

create index if not exists listening_events_user_played_idx
  on listening_events (user_id, played_at desc);

create table if not exists ratings (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  album_id text not null,
  stars numeric(2,1) check (stars >= 0 and stars <= 5),
  review text,
  created_at timestamptz default now(),
  unique (user_id, album_id)
);

create index if not exists ratings_album_idx on ratings (album_id);

-- Row Level Security --------------------------------------------------

alter table users enable row level security;
alter table connections enable row level security;
alter table listening_events enable row level security;
alter table ratings enable row level security;

-- users: profiles are publicly readable, only the owner can edit their own row
create policy "users are publicly readable" on users
  for select using (true);
create policy "users can update own row" on users
  for update using (auth.uid() = auth_user_id);
create policy "users can insert own row" on users
  for insert with check (auth.uid() = auth_user_id);

-- connections: tokens are private to the owner
create policy "connections owner read" on connections
  for select using (
    user_id in (select id from users where auth_user_id = auth.uid())
  );
create policy "connections owner write" on connections
  for all using (
    user_id in (select id from users where auth_user_id = auth.uid())
  );

-- listening_events: private to the owner (used for personal recap/stats)
create policy "listening_events owner read" on listening_events
  for select using (
    user_id in (select id from users where auth_user_id = auth.uid())
  );
create policy "listening_events owner write" on listening_events
  for all using (
    user_id in (select id from users where auth_user_id = auth.uid())
  );

-- ratings/reviews: publicly readable (shown on album pages), owner-only write
create policy "ratings are publicly readable" on ratings
  for select using (true);
create policy "ratings owner write" on ratings
  for all using (
    user_id in (select id from users where auth_user_id = auth.uid())
  );

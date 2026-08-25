-- HearMeOut — migration 002: real accounts, real recap data, real ratings.
-- Run in Supabase SQL Editor after schema.sql.

alter table listening_events add column if not exists duration_ms integer;

-- Public aggregate rating per album — powers "album rating" everywhere in
-- the UI. security_invoker so it respects the querying role's RLS grants
-- (both users and ratings are public-select anyway, but this keeps intent
-- explicit as policies evolve).
create or replace view album_ratings
  with (security_invoker = true) as
select album_id, avg(stars)::numeric(3,2) as avg_stars, count(*) as ratings_count
from ratings
group by album_id;

create table if not exists friendships (
  user_id uuid references users(id) on delete cascade,
  friend_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

alter table friendships enable row level security;

-- Friend lists are publicly readable (shown on profile pages); writes only
-- happen through the service-role API routes (no anon/authenticated policy
-- for insert/update/delete, so RLS blocks direct client writes).
create policy "friendships are publicly readable" on friendships
  for select using (true);

-- HearMeOut — migration 012: friend match-percent history (one row per
-- pair per day, opportunistically recorded whenever the Match screen
-- actually computes a live score) and per-review vibe tags. Run in
-- Supabase SQL Editor after migration_011.

create table if not exists match_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  friend_id uuid not null references users(id) on delete cascade,
  pct int not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id, snapshot_date)
);

create index if not exists match_snapshots_pair_idx on match_snapshots (user_id, friend_id, snapshot_date);

alter table match_snapshots enable row level security;

-- Same as friend_requests: private between the two parties, only the
-- service-role API routes read/write this table.
create policy "match_snapshots_no_direct_access" on match_snapshots
  for all using (false);

alter table ratings add column if not exists tags text[];

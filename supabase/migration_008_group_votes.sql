-- HearMeOut — migration 008: monthly member voting inside groups, on top
-- of the auto-computed awards from migration 007. One vote per member per
-- group per month; voting again just changes your pick. Run in Supabase
-- SQL Editor after migration_007.

create table if not exists group_votes (
  group_id uuid references groups(id) on delete cascade,
  month_key text not null,
  voter_id uuid references users(id) on delete cascade,
  candidate_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (group_id, month_key, voter_id)
);

create index if not exists group_votes_group_month_idx on group_votes (group_id, month_key);

alter table group_votes enable row level security;

create policy "group_votes are publicly readable" on group_votes
  for select using (true);

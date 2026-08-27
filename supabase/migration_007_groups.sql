-- HearMeOut — migration 007: private groups with monthly auto-computed
-- awards. Run in Supabase SQL Editor after migration_006.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on group_members (user_id);

alter table groups enable row level security;
alter table group_members enable row level security;

-- All reads/writes go through service-role API routes (like friendships) —
-- no anon/authenticated policy for insert/update/delete, so RLS blocks
-- direct client writes. Select is public so a member list can render.
create policy "groups are publicly readable" on groups
  for select using (true);

create policy "group_members are publicly readable" on group_members
  for select using (true);

-- HearMeOut — migration 006: real password accounts (via Supabase Auth) and
-- a proper friend-request flow (pending -> accepted/declined) instead of
-- instant mutual add. Run in Supabase SQL Editor after migration_005.

-- users.auth_user_id already exists in schema.sql — this just makes the
-- lookup (used on every login) fast.
create index if not exists users_auth_user_id_idx on users (auth_user_id);

create table if not exists friend_requests (
  id bigint generated always as identity primary key,
  from_user_id uuid references users(id) on delete cascade not null,
  to_user_id uuid references users(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined')) not null default 'pending',
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id)
);

create index if not exists friend_requests_to_user_pending_idx
  on friend_requests (to_user_id) where status = 'pending';

alter table friend_requests enable row level security;

-- Requests are private between the two parties — only the service-role API
-- routes read/write this table (no anon/authenticated policy at all).
create policy "friend_requests_no_direct_access" on friend_requests
  for all using (false);

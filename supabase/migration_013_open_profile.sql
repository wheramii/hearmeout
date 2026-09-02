-- Adds the open/closed profile-visibility toggle. Closed (the default) is
-- what the app already enforced server-side before this column existed:
-- only the account owner and accepted friends see the full profile, anyone
-- else gets a name-card stub. Open lets the owner opt back in to being
-- visible to anyone, e.g. someone using their /u/[handle] share link.
alter table users add column if not exists is_open_profile boolean not null default false;

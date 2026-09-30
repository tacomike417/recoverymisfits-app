-- ============================================================
-- THE PORCH, STEP 1: the tables and who can see what. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project (not Infinite Pulls).
-- SAFE TO RUN TWICE. Changes nothing that already exists.
--
-- The rules this enforces:
--   * Anyone can BROWSE, even with no account.
--   * Nobody can post, comment, react or report until they have confirmed
--     who they are (verified_at is set by the confirm-email function only).
--   * Posts and comments never go straight into the tables from a phone.
--     They go through the porch function, which runs the word filter, the
--     link check and the photo check first. The tables refuse direct writes.
--   * Blocking works both ways: you never see them, they never see you.
--   * The sober date only exists here if the member chose to show it.
-- ============================================================

-- ---------- members (the public side of an account) ----------
create table if not exists public.porch_members (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  handle       text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  bio          text check (char_length(bio) <= 160),
  avatar_path  text,
  cover_path   text,
  sober_date   date,                 -- only filled in when they chose to show it
  verified_at  timestamptz,          -- set ONLY by the confirm-email function
  frozen_at    timestamptz,          -- paused by reports until a person looks
  created_at   timestamptz not null default now()
);
alter table public.porch_members enable row level security;

-- the private side of confirming who you are; nobody reads this but the server
create table if not exists public.porch_identity (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email_hash   text not null unique, -- one confirmed email = one member
  code_hash    text,
  code_expires timestamptz,
  tries        int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.porch_identity enable row level security;
revoke all on public.porch_identity from anon, authenticated;

-- ---------- posts, comments, reactions ----------
create table if not exists public.porch_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  need        text not null check (need in ('talk','win','hard','question','moment')),
  body        text check (char_length(body) <= 2000),
  photo_paths text[] not null default '{}',
  card_style  smallint,              -- which handwritten card a text-only post uses
  created_at  timestamptz not null default now(),
  hidden_at   timestamptz,           -- taken down by a moderator or by its owner
  check (coalesce(char_length(body),0) > 0 or cardinality(photo_paths) > 0)
);
create index if not exists porch_posts_new on public.porch_posts (created_at desc) where hidden_at is null;
alter table public.porch_posts enable row level security;

create table if not exists public.porch_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.porch_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  hidden_at  timestamptz
);
create index if not exists porch_comments_post on public.porch_comments (post_id, created_at);
alter table public.porch_comments enable row level security;

create table if not exists public.porch_reactions (
  post_id    uuid not null references public.porch_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('proud','metoo')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);
alter table public.porch_reactions enable row level security;

-- ---------- safety ----------
create table if not exists public.porch_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.porch_blocks enable row level security;

create table if not exists public.porch_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id     uuid references public.porch_posts(id) on delete cascade,
  comment_id  uuid references public.porch_comments(id) on delete cascade,
  member_id   uuid references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('hate','harassment','sexual','spam','self_harm','other')),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  handled_at  timestamptz,
  check (num_nonnulls(post_id, comment_id, member_id) = 1)
);
alter table public.porch_reports enable row level security;

create table if not exists public.porch_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.porch_moderators enable row level security;

-- ---------- helpers ----------
create or replace function public.porch_verified(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members where user_id = p and verified_at is not null and frozen_at is null);
$$;

-- true if either person has blocked the other
create or replace function public.porch_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and exists (
    select 1 from porch_blocks
     where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- ---------- who can see what ----------
drop policy if exists "anyone reads members" on public.porch_members;
create policy "anyone reads members" on public.porch_members for select
  using (not public.porch_blocked(auth.uid(), user_id));
drop policy if exists "members edit their own profile" on public.porch_members;
create policy "members edit their own profile" on public.porch_members for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- a member can change their own words and pictures, never their own verified/frozen stamps
revoke update on public.porch_members from anon, authenticated;
grant update (bio, avatar_path, cover_path, sober_date) on public.porch_members to authenticated;

drop policy if exists "anyone reads posts" on public.porch_posts;
create policy "anyone reads posts" on public.porch_posts for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id));
revoke insert, update, delete on public.porch_posts from anon, authenticated;   -- only through the porch function

drop policy if exists "anyone reads comments" on public.porch_comments;
create policy "anyone reads comments" on public.porch_comments for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id));
revoke insert, update, delete on public.porch_comments from anon, authenticated;

drop policy if exists "anyone reads reactions" on public.porch_reactions;
create policy "anyone reads reactions" on public.porch_reactions for select using (true);
drop policy if exists "confirmed members react" on public.porch_reactions;
create policy "confirmed members react" on public.porch_reactions for insert to authenticated
  with check (auth.uid() = user_id and public.porch_verified(auth.uid()));
drop policy if exists "members take back their reaction" on public.porch_reactions;
create policy "members take back their reaction" on public.porch_reactions for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "members see their own blocks" on public.porch_blocks;
create policy "members see their own blocks" on public.porch_blocks for select to authenticated
  using (auth.uid() = blocker_id);
drop policy if exists "members block" on public.porch_blocks;
create policy "members block" on public.porch_blocks for insert to authenticated
  with check (auth.uid() = blocker_id);
drop policy if exists "members unblock" on public.porch_blocks;
create policy "members unblock" on public.porch_blocks for delete to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "confirmed members report" on public.porch_reports;
create policy "confirmed members report" on public.porch_reports for insert to authenticated
  with check (auth.uid() = reporter_id and public.porch_verified(auth.uid()));
drop policy if exists "moderators read reports" on public.porch_reports;
create policy "moderators read reports" on public.porch_reports for select to authenticated
  using (exists (select 1 from public.porch_moderators m where m.user_id = auth.uid()));

-- ---------- photos ----------
insert into storage.buckets (id, name, public)
values ('porch', 'porch', true)
on conflict (id) do nothing;
-- nobody uploads straight from a phone; the porch function checks the photo first and stores it

select 'porch step 1: ok' as status,
       (select count(*) from public.porch_members) as members,
       (select count(*) from public.porch_posts) as posts;

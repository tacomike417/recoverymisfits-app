-- ============================================================
-- FEED PREVIEW VOTES -- 29 Sep 2026 (Mike).
-- Run in the RECOVERY MISFITS Supabase project (not Infinite Pulls).
-- Anyone can add a vote from recoverymisfits.org/feed/.
-- Nobody can read votes from the site. Read them here with the query at the bottom.
-- SAFE TO RUN TWICE.
-- ============================================================
create table if not exists public.feed_votes (
  id         bigint generated always as identity primary key,
  choice     text not null check (choice in ('like','dislike','other')),
  note       text check (char_length(note) <= 1000),
  name       text check (char_length(name) <= 60),
  created_at timestamptz not null default now()
);
alter table public.feed_votes enable row level security;
revoke all on public.feed_votes from anon, authenticated;
grant insert (choice, note, name) on public.feed_votes to anon, authenticated;
drop policy if exists "anyone can vote" on public.feed_votes;
create policy "anyone can vote" on public.feed_votes for insert to anon, authenticated with check (true);

select 'feed votes: ok' as status;

-- ============================================================
-- THE PORCH, STEP 68: THE POST LOG. 7 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "this misfits share desk just needs to be a log file for me, easy to read, simple.
-- let me know what was posted today, and what is scheduled for later today, thats it since
-- we have this all automated."
--
-- One small table. misfits-post (the poster on Mike's computer) writes to it:
--   state 'posted'  = it went out. One row per post.
--   state 'planned' = an extra that is lined up for a set time.
-- Only moderators can read it. Nobody writes to it from the site. The page is /feed/share-desk.html.
-- The old table porch_share_desk is left alone (nothing reads it any more).
-- ============================================================

create table if not exists public.porch_post_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  state    text not null default 'posted' check (state in ('posted', 'planned')),
  kind     text not null default 'video'  check (kind in ('video', 'picture', 'meme')),
  title    text not null default '',
  caption  text not null default '',
  places   text not null default ''
);
create index if not exists porch_post_log_at on public.porch_post_log (at);
alter table public.porch_post_log enable row level security;

drop policy if exists "moderators read the post log" on public.porch_post_log;
create policy "moderators read the post log" on public.porch_post_log
  for select to authenticated
  using (exists (select 1 from public.porch_moderators m where m.user_id = auth.uid()));

grant select on public.porch_post_log to authenticated;

-- what a correct result looks like: one row, status ok, and mike_is_a_moderator is true
select 'porch step 68: ok' as status,
       exists (select 1 from public.porch_moderators m join public.porch_members p on p.user_id = m.user_id
                where p.handle = 'tacomike417') as mike_is_a_moderator;

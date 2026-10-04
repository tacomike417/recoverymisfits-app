-- ============================================================
-- THE PORCH, STEP 47: THE SHARE DESK. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "a list of spins, and memes recovery misfits has posted, then almost like a
-- share manager. i dont want to get confused on if i have shared it yet. share to
-- instagram story, or facebook reel. then i can click i did it."
--
-- One small table: which thing, which place, when it was ticked. Only moderators can
-- read it or write it. The page is /feed/share-desk.html.
--   item  = 'spin:<id>' or 'post:<id>'
--   place = 'instagram', 'facebook', or 'skip' (archived without sharing)
-- ============================================================

create table if not exists public.porch_share_desk (
  item     text not null check (item ~ '^(spin|post):[0-9a-f-]{36}$'),
  place    text not null check (place in ('instagram', 'facebook', 'skip')),
  done_at  timestamptz not null default now(),
  done_by  uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (item, place)
);
alter table public.porch_share_desk enable row level security;

drop policy if exists "moderators run the share desk" on public.porch_share_desk;
create policy "moderators run the share desk" on public.porch_share_desk
  for all to authenticated
  using      (exists (select 1 from public.porch_moderators m where m.user_id = auth.uid()))
  with check (exists (select 1 from public.porch_moderators m where m.user_id = auth.uid()));

grant select, insert, update, delete on public.porch_share_desk to authenticated;

-- what a correct result looks like: one row, status ok, and mike_is_a_moderator is true
select 'porch step 47: ok' as status,
       exists (select 1 from public.porch_moderators m join public.porch_members p on p.user_id = m.user_id
                where p.handle = 'tacomike417') as mike_is_a_moderator;

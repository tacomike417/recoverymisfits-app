-- ============================================================
-- THE PORCH, STEP 19: SEE WHO YOU BLOCKED, AND MUTE. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- From Mike's big list: "Blocked people list (see who you blocked, unblock)" and
-- "Mute somebody without blocking them".
--
-- 1. porch_my_blocks(): the people YOU blocked, name and face, so you can unblock.
--    (A block hides their profile from you, so the app can't look them up the
--    normal way. This hands back only your own list.)
-- 2. MUTE: their shares and Spins stop showing up in your feed. They aren't told,
--    nothing changes for them, and you're still friends. Only you can see your mutes.
-- ============================================================

create or replace function public.porch_my_blocks()
returns table (user_id uuid, handle text, avatar_path text)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.handle, m.avatar_path
  from porch_blocks b join porch_members m on m.user_id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by m.handle;
$$;
revoke all on function public.porch_my_blocks() from public, anon;
grant execute on function public.porch_my_blocks() to authenticated;

create table if not exists public.porch_mutes (
  muter_id   uuid not null references auth.users(id) on delete cascade,
  muted_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id <> muted_id)
);
alter table public.porch_mutes enable row level security;
drop policy if exists "see your own mutes" on public.porch_mutes;
create policy "see your own mutes" on public.porch_mutes for select to authenticated using (auth.uid() = muter_id);
drop policy if exists "mute" on public.porch_mutes;
create policy "mute" on public.porch_mutes for insert to authenticated with check (auth.uid() = muter_id);
drop policy if exists "unmute" on public.porch_mutes;
create policy "unmute" on public.porch_mutes for delete to authenticated using (auth.uid() = muter_id);
revoke all on public.porch_mutes from anon;
grant select, insert, delete on public.porch_mutes to authenticated;

-- check: should say ready
select 'blocked list + mute ready' as status,
       (select count(*) from public.porch_mutes) as mutes_so_far;

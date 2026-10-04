-- ============================================================
-- THE PORCH, STEP 56: PROFILE COUNTS + ACTIVE NOW. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: the row on a profile, like Infinite Pulls: "Active now", then Friends and Groups.
-- No followers (you're friends or you're not). Nothing here touches the sober date.
--   * porch_seen: when each person was last on the Porch. No phone can read the table;
--     the function below hands out one person's time to signed-in people only.
--   * porch_ping(): the page calls it every few minutes while you're on the Porch.
--   * porch_profile_stats(user): friends, open groups they're in, and when they were last on.
-- ============================================================

create table if not exists public.porch_seen (
  user_id uuid primary key references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
alter table public.porch_seen enable row level security;
revoke all on public.porch_seen from anon, authenticated;

create or replace function public.porch_ping()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into porch_seen (user_id, at) values (auth.uid(), now())
  on conflict (user_id) do update set at = now() where porch_seen.at < now() - interval '1 minute';
end $$;
revoke all on function public.porch_ping() from public, anon;
grant execute on function public.porch_ping() to authenticated;

create or replace function public.porch_profile_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'friends', (select count(*) from porch_friends where a = p_user or b = p_user),
    'groups',  (select count(*) from porch_group_members m join porch_groups g on g.id = m.group_id
                 where m.user_id = p_user and g.status = 'open'),
    'seen_at', case when auth.uid() is null or public.porch_blocked(auth.uid(), p_user) then null
                    else (select at from porch_seen where user_id = p_user) end);
$$;
revoke all on function public.porch_profile_stats(uuid) from public;
grant execute on function public.porch_profile_stats(uuid) to anon, authenticated;

select 'porch step 56: ok' as status, (select count(*) from public.porch_seen) as people_seen_so_far;

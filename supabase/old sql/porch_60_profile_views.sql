-- ============================================================
-- THE PORCH, STEP 60: ONE BIG VIEWS NUMBER ON A PROFILE. 5 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "put a little views counter on there too ... make it super liberal ... Combine the reel
-- stats in there and your post stats and all that stuff and just make that one big number."
--   * porch_view_totals: two running counts per person (profile opens, shares seen). No phone
--     can read the table. It only stores numbers, never who looked.
--   * porch_profile_view(user): somebody opened that profile. Every open counts.
--   * porch_post_views(ids): those shares were on somebody's screen. Every time counts.
--   * porch_profile_stats(user) now also hands back "views" = profile opens + shares seen + Spin plays.
-- ============================================================

create table if not exists public.porch_view_totals (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  profile_views bigint not null default 0,
  post_views    bigint not null default 0
);
alter table public.porch_view_totals enable row level security;
revoke all on public.porch_view_totals from anon, authenticated;

create or replace function public.porch_profile_view(p_user uuid)
returns void language sql security definer set search_path = public as $$
  insert into porch_view_totals (user_id, profile_views)
  select m.user_id, 1 from porch_members m where m.user_id = p_user
  on conflict (user_id) do update set profile_views = porch_view_totals.profile_views + 1;
$$;
revoke all on function public.porch_profile_view(uuid) from public;
grant execute on function public.porch_profile_view(uuid) to anon, authenticated;

create or replace function public.porch_post_views(p_ids uuid[])
returns void language sql security definer set search_path = public as $$
  insert into porch_view_totals (user_id, post_views)
  select p.user_id, count(*) from porch_posts p
   where p.id = any (p_ids[1:60]) and p.hidden_at is null
   group by p.user_id
  on conflict (user_id) do update set post_views = porch_view_totals.post_views + excluded.post_views;
$$;
revoke all on function public.porch_post_views(uuid[]) from public;
grant execute on function public.porch_post_views(uuid[]) to anon, authenticated;

create or replace function public.porch_profile_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'friends', (select count(*) from porch_friends where a = p_user or b = p_user),
    'groups',  (select count(*) from porch_group_members m join porch_groups g on g.id = m.group_id
                 where m.user_id = p_user and g.status = 'open'),
    'views',   coalesce((select profile_views + post_views from porch_view_totals where user_id = p_user), 0)
             + coalesce((select sum(views) from porch_spins where user_id = p_user), 0),
    'seen_at', case when auth.uid() is null or public.porch_blocked(auth.uid(), p_user) then null
                    else (select at from porch_seen where user_id = p_user) end);
$$;
revoke all on function public.porch_profile_stats(uuid) from public;
grant execute on function public.porch_profile_stats(uuid) to anon, authenticated;

-- A correct result: one row that says 'porch step 60: ok'.
select 'porch step 60: ok' as status, (select count(*) from public.porch_view_totals) as people_counted_so_far;

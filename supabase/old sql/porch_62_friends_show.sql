-- ============================================================
-- THE PORCH, STEP 62: FRIENDS SHOW ON PROFILES. ONE RULE. 5 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "by being on a recovery site, means most likely you are in recovery, and that's as
-- far as anonymity goes ... showing the list isn't harmful. I'd say just show it." And then
-- the rule for the whole site: "public people can show up, non public no."
--
-- Until now a friends list could only be read by its owner. This adds one door,
-- porch_friends_of(), that hands out somebody's friends by that one rule:
--   * a confirmed member (or a moderator) sees ALL of that person's friends
--   * anybody else (not signed in, or no confirmed email) only gets anything when the
--     profile is Public, and then only the friends who are Public too
-- Blocks, breaks, frozen accounts and the house accounts are left out either way.
-- The friends table itself stays locked: nobody can read it directly but its owner.
-- ============================================================

create or replace function public.porch_friends_of(p_user uuid)
returns table (user_id uuid, handle text, avatar_path text, real_name text)
language sql stable security definer set search_path = public as $$
  with v as (
    select auth.uid() as me,
           (auth.uid() is not null and (public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()))) as full_view
  ),
  owner as (
    select m.user_id, m.visibility from porch_members m, v
    where m.user_id = p_user
      and m.verified_at is not null and m.frozen_at is null
      and (m.away_at is null or m.user_id = v.me)
      and not public.porch_blocked(v.me, m.user_id)
      and (v.full_view or m.user_id = v.me or m.visibility = 'public')
  ),
  ids as (
    select case when f.a = p_user then f.b else f.a end as fid
    from porch_friends f where f.a = p_user or f.b = p_user
  )
  select m.user_id, m.handle, m.avatar_path, m.real_name
  from ids
  join porch_members m on m.user_id = ids.fid
  cross join v
  where exists (select 1 from owner)
    and m.verified_at is not null and m.frozen_at is null and m.away_at is null
    and not public.porch_house(m.user_id)
    and not public.porch_blocked(v.me, m.user_id)
    and (v.full_view or p_user = v.me or m.visibility = 'public')
  order by lower(m.handle)
  limit 300;
$$;
revoke all on function public.porch_friends_of(uuid) from public;
grant execute on function public.porch_friends_of(uuid) to anon, authenticated;

-- ---- what a correct result looks like: one row.
--   door_made = true
--   friendships = how many friendships there are on the Porch today
select 'porch step 62: ok' as status,
       exists (select 1 from pg_proc where proname = 'porch_friends_of') as door_made,
       (select count(*) from public.porch_friends) as friendships;

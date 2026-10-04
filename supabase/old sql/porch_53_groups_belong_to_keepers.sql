-- ============================================================
-- THE PORCH, STEP 53: A GROUP BELONGS TO ITS KEEPERS AND MEMBERS. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "just keeper and co keeper and who they choose, i dont need to be a part of
-- everything, this snuck up on me." Until now a site moderator could read every group,
-- see who was in it, take people out, and change its address, joined or not. No more.
--
-- AFTER THIS a moderator who is not a member of a group:
--   CANNOT read what is shared in it or its comments
--   CANNOT see who is in it
--   CANNOT take somebody out of it, or change its address, picture or banner
-- A moderator STILL: looks at a new group before it opens, can close a group (or open a
-- closed one back up), and sees a share from a group ONLY if somebody reports it.
-- A moderator who joins a group is a member there like anybody else.
-- ============================================================

-- may this person see this share (and so its comments)? Not in a group = yes. In a group = members only.
create or replace function public.porch_post_ok(p uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select group_id is null or public.porch_in_group(group_id, u) from porch_posts where id = p), true);
$$;

-- group shares: members only. This sits ON TOP of the rules already there.
drop policy if exists "group shares: members only" on public.porch_posts;
create policy "group shares: members only" on public.porch_posts as restrictive for select
  using (group_id is null or public.porch_in_group(group_id, auth.uid()));

-- who is in a group: only the people in it
drop policy if exists "see who is in your groups" on public.porch_group_members;
create policy "see who is in your groups" on public.porch_group_members for select to authenticated
  using (user_id = auth.uid() or public.porch_in_group(group_id, auth.uid()));

-- only a keeper takes somebody out of the group
create or replace function public.porch_group_remove(p_group uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.porch_is_keeper(p_group, me) then raise exception 'Only the keepers can do that.' using errcode = '42501'; end if;
  if public.porch_is_keeper(p_group, p_user) then raise exception 'That''s a keeper.' using errcode = 'P0001'; end if;
  delete from porch_group_members where group_id = p_group and user_id = p_user;
end $$;

-- only a keeper changes the address
create or replace function public.porch_group_set_address(p_group uuid, p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); s text;
begin
  if not exists (select 1 from porch_groups where id = p_group and me in (keeper_id, cokeeper_id)) then
    raise exception 'Only a Keeper can change the address.' using errcode = 'P0001';
  end if;
  s := public.porch_group_address_check(p_slug, p_group);
  update porch_groups set slug = s where id = p_group;
  return s;
end $$;

-- A correct result: one row, status 'groups: ok', and the list of who is a moderator right now.
select 'groups: ok' as status,
       (select string_agg(m.handle, ', ' order by m.handle)
          from public.porch_moderators o join public.porch_members m on m.user_id = o.user_id) as moderators_right_now;

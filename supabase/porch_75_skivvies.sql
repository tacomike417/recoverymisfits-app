-- ============================================================
-- THE PORCH, STEP 75: SKIVVIES -- THE ACCOUNT AND THE GROUP. 2 Nov 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "there should be a skivvies group and all notes go in skivvies", and the group
-- "has to look like skivvies, you know, so they know they're in the right spot."
--
-- FIRST make the account ON THE SITE (name: skivvies). THEN run this. It:
--   1. lets the skivvies account post (no email, no wait), names it Skivvies, makes the
--      profile Public, gives it the Skivvies picture and banner, and adds it to the house
--      accounts. It is NOT a moderator.
--   2. opens the group Skivvies (recoverymisfits.org/groups/skivvies), anybody can join,
--      kept by skivvies and recoverymisfits, with the Skivvies picture and banner.
-- The "Write a note" box, the Skivvies sign-up lane and the button on skivvies.org come in
-- the next steps.
-- ============================================================

do $$
declare u uuid; co uuid; g uuid;
begin
  select id into u from auth.users where email = 'skivvies@rm.invalid';
  if u is null then select user_id into u from porch_members where lower(handle) = 'skivvies'; end if;
  if u is null then return; end if;
  insert into porch_testers (handle) values ('skivvies') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'skivvies', now(), 'Skivvies')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Skivvies';
  update porch_members
     set bio = 'New underwear for people on day one of recovery in Stark County. Because rock bottom shouldn''t be bare bottom.',
         visibility = 'public',
         welcomed_at = coalesce(welcomed_at, now()),
         avatar_path = '/assets/house/skivvies/avatar.webp',
         cover_path = '/assets/house/skivvies/cover.webp'
   where user_id = u;

  select user_id into co from porch_members where lower(handle) = 'recoverymisfits';
  select id into g from porch_groups where slug = 'skivvies' and status <> 'declined';
  if g is null then
    select id into g from porch_groups where lower(btrim(name)) = 'skivvies' and status in ('waiting_cokeeper', 'waiting_review', 'open');
  end if;
  if g is null then
    insert into porch_groups (name, slug, about, who_for, kind, keeper_id, cokeeper_id, status, approved_at, last_share_at,
                              avatar_path, cover_path)
    values ('Skivvies', 'skivvies',
            'New underwear for people on day one of recovery. Write a note for someone''s first day. It goes in their pack.',
            'Anybody who wants to cover a butt.', 'open', u, co, 'open', now(), now(),
            '/assets/house/skivvies/avatar.webp', '/assets/house/skivvies/cover.webp')
    returning id into g;
  else
    update porch_groups set slug = 'skivvies', kind = 'open', keeper_id = u, cokeeper_id = co, status = 'open',
           approved_at = coalesce(approved_at, now()), last_share_at = now(), warned_at = null, closed_at = null,
           avatar_path = '/assets/house/skivvies/avatar.webp', cover_path = '/assets/house/skivvies/cover.webp'
     where id = g;
  end if;
  insert into porch_group_members (group_id, user_id) values (g, u) on conflict do nothing;
  if co is not null then insert into porch_group_members (group_id, user_id) values (g, co) on conflict do nothing; end if;
end $$;

-- skivvies is one of the house accounts (the list as it stands today, plus skivvies)
create or replace function public.porch_house(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members
                 where user_id = p and handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober',
                                                  'welcomematt', 'soberriot', 'realmrhyde', 'skivvies'));
$$;

-- ---- what a correct result looks like: status ALL SET, can_post true, keeper skivvies, cokeeper recoverymisfits
select case when m.user_id is null
         then 'NOT YET. Make the account on the site first (name: skivvies), then run this again.'
         when g.id is null then 'The account is set, but the group did not open. Tell Claude.'
         else 'ALL SET. Skivvies is open.' end as status,
       m.real_name as shows_as, m.verified_at is not null as can_post,
       g.name as group_name, g.status as group_status, g.kind as who_can_join,
       (select handle from public.porch_members where user_id = g.keeper_id) as keeper,
       (select handle from public.porch_members where user_id = g.cokeeper_id) as cokeeper
from (select 1) x
left join public.porch_members m on lower(m.handle) = 'skivvies'
left join public.porch_groups g on g.slug = 'skivvies' and g.status <> 'declined';

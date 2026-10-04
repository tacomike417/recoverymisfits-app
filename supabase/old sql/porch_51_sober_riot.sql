-- ============================================================
-- THE PORCH, STEP 51: SOBER RIOT -- THE ACCOUNT AND THE GROUP. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "a group called SOBER RIOT ... one of those big rock and roll look at me style
-- recovery groups with simple powerful memes that post a few times a day ... i just dont
-- want people see im running this ... people see the keepers of the group."
--
-- FIRST make the account ON THE SITE (name: soberriot). THEN run this. It:
--   1. lets the soberriot account post (no email, no 3-day wait), names it SOBER RIOT, makes
--      the profile Public, and adds it to the house accounts. It is NOT a moderator.
--   2. opens the group SOBER RIOT (recoverymisfits.org/groups/sober-riot), anybody can join,
--      kept by soberriot and recoverymisfits.
--   3. keeps a group alive while shares on the Porch are tagged with it (a group closes after
--      90 quiet days; a tagged share counts as the group being used).
-- The picture and banner go on in a later step, when the art is done.
-- ============================================================

do $$
declare u uuid; co uuid; g uuid;
begin
  select id into u from auth.users where email = 'soberriot@rm.invalid';
  if u is null then select user_id into u from porch_members where lower(handle) = 'soberriot'; end if;
  if u is null then return; end if;
  insert into porch_testers (handle) values ('soberriot') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'soberriot', now(), 'SOBER RIOT')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'SOBER RIOT';
  update porch_members
     set bio = 'Loud, proud sobriety. Tap the group button and get in here. Front row''s open.',
         visibility = 'public',
         welcomed_at = coalesce(welcomed_at, now())
   where user_id = u;

  select user_id into co from porch_members where lower(handle) = 'recoverymisfits';
  select id into g from porch_groups where slug = 'sober-riot' and status <> 'declined';
  if g is null then
    select id into g from porch_groups where lower(btrim(name)) = 'sober riot' and status in ('waiting_cokeeper', 'waiting_review', 'open');
  end if;
  if g is null then
    insert into porch_groups (name, slug, about, who_for, kind, keeper_id, cokeeper_id, status, approved_at, last_share_at)
    values ('SOBER RIOT', 'sober-riot',
            'Loud, proud sobriety. Show up, turn it up, and bring somebody with you. New here? Front row.',
            'Anybody who wants to stay sober out loud.', 'open', u, co, 'open', now(), now())
    returning id into g;
  else
    update porch_groups set slug = 'sober-riot', kind = 'open', keeper_id = u, cokeeper_id = co, status = 'open',
           approved_at = coalesce(approved_at, now()), last_share_at = now(), warned_at = null, closed_at = null
     where id = g;
  end if;
  insert into porch_group_members (group_id, user_id) values (g, u) on conflict do nothing;
  if co is not null then insert into porch_group_members (group_id, user_id) values (g, co) on conflict do nothing; end if;
end $$;

-- soberriot is one of the house accounts
create or replace function public.porch_house(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members
                 where user_id = p and handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober', 'welcomematt', 'soberriot'));
$$;

-- a share on the Porch that is tagged with a group counts as that group being used
create or replace function public.porch_tag_keeps_group() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tag_group_id is not null then
    update porch_groups set last_share_at = now(), warned_at = null where id = new.tag_group_id and status = 'open';
  end if;
  return null;
end $$;
drop trigger if exists porch_tag_keeps_group on public.porch_posts;
create trigger porch_tag_keeps_group after insert on public.porch_posts
  for each row execute function public.porch_tag_keeps_group();

-- ---- what a correct result looks like
select case when m.user_id is null
         then 'NOT YET. Make the account on the site first (name: soberriot), then run this again.'
         when g.id is null then 'The account is set, but the group did not open. Tell Claude.'
         else 'ALL SET. SOBER RIOT is open.' end as status,
       m.real_name as shows_as, m.verified_at is not null as can_post,
       g.name as group_name, g.status as group_status, g.kind as who_can_join,
       (select handle from public.porch_members where user_id = g.keeper_id) as keeper,
       (select handle from public.porch_members where user_id = g.cokeeper_id) as cokeeper
from (select 1) x
left join public.porch_members m on lower(m.handle) = 'soberriot'
left join public.porch_groups g on g.slug = 'sober-riot' and g.status <> 'declined';

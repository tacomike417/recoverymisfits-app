-- ============================================================
-- THE PORCH, STEP 18: PROFILES, PRIVACY AND FINDING FRIENDS. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "protecting their level of anonymity is paramount"
--
-- 1. SOBER DATE IS YOURS ALONE. It comes off every Porch profile and can never
--    be put back on one. It only lives in your own app account (the
--    `profiles` table, which only you can read). People only ever see it if you
--    share a coin, your Survival Pile or a post yourself.
-- 2. WHO CAN SEE MY PROFILE: "members" (default: only people signed in to
--    Recovery Misfits) or "public" (anybody with the link). Members-only means
--    your profile, shares, comments and Spins are invisible to anybody who
--    isn't signed in, including shared Spin links.
-- 3. FIND FRIENDS NEAR ME: your phone's location, rounded to about 7 miles
--    (one decimal of latitude and longitude), kept in a table NOBODY can read.
--    The app only ever gets back names and faces, never a place or a distance.
--    Turn it off any time and the location is deleted.
-- 4. MOST ACTIVE: the people sharing and commenting most in the last 2 weeks.
-- 5. Profile links (recoverymisfits.org/u/<name>) read through
--    porch_profile_card(), which hands over nothing for a members-only profile.
-- ============================================================

-- ---------- 1. sober date: off every profile, for good ----------
update public.porch_members set sober_date = null where sober_date is not null;
revoke update (sober_date) on public.porch_members from authenticated;
alter table public.porch_members drop constraint if exists porch_members_no_sober_date;
alter table public.porch_members add constraint porch_members_no_sober_date check (sober_date is null);

-- ---------- 2. who can see my profile ----------
alter table public.porch_members add column if not exists visibility text not null default 'members';
alter table public.porch_members drop constraint if exists porch_members_visibility_check;
alter table public.porch_members add constraint porch_members_visibility_check check (visibility in ('members', 'public'));
grant update (visibility) on public.porch_members to authenticated;

create or replace function public.porch_is_public(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select visibility = 'public' from porch_members where user_id = p), false);
$$;
grant execute on function public.porch_is_public(uuid) to anon, authenticated;

-- signed in = any Recovery Misfits account; not signed in = only public profiles
drop policy if exists "anyone reads members" on public.porch_members;
create policy "anyone reads members" on public.porch_members for select
  using (not public.porch_blocked(auth.uid(), user_id)
         and (auth.uid() is not null or visibility = 'public'));

drop policy if exists "anyone reads posts" on public.porch_posts;
create policy "anyone reads posts" on public.porch_posts for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id)
         and (auth.uid() is not null or public.porch_is_public(user_id)));

drop policy if exists "anyone reads comments" on public.porch_comments;
create policy "anyone reads comments" on public.porch_comments for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id)
         and (auth.uid() is not null
              or (public.porch_is_public(user_id)
                  and exists (select 1 from public.porch_posts p where p.id = post_id and public.porch_is_public(p.user_id)))));

-- who loved, respun or hearted what: signed-in people only (it maps who's active)
drop policy if exists "anyone reads reactions" on public.porch_reactions;
create policy "anyone reads reactions" on public.porch_reactions for select using (auth.uid() is not null);
drop policy if exists "anyone reads respins" on public.porch_respins;
create policy "anyone reads respins" on public.porch_respins for select
  using (auth.uid() is not null and not public.porch_blocked(auth.uid(), user_id));
drop policy if exists "anyone reads comment hearts" on public.porch_comment_hearts;
create policy "anyone reads comment hearts" on public.porch_comment_hearts for select using (auth.uid() is not null);

-- pictures are only ever set by the porch function (it checks every photo), never straight from a phone
revoke update (avatar_path, cover_path) on public.porch_members from authenticated;

drop policy if exists "read spins" on public.porch_spins;
create policy "read spins" on public.porch_spins for select
  using (
    auth.uid() = user_id
    or (status = 'ready'
        and (pinned or expires_at > now())
        and not public.porch_blocked(auth.uid(), user_id)
        and (auth.uid() is not null or public.porch_is_public(user_id))
        and not exists (select 1 from public.porch_posts p where p.id = post_id and p.hidden_at is not null))
  );

-- a shared Spin link: a members-only Spin answers { locked: true } and nothing else
create or replace function public.porch_spin_card(p_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare s porch_spins; m porch_members;
begin
  select * into s from porch_spins where id = p_id;
  if s.id is null or s.status <> 'ready' or not (s.pinned or s.expires_at > now())
     or exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null) then
    return null;
  end if;
  select * into m from porch_members where user_id = s.user_id;
  if m.frozen_at is not null then return null; end if;
  if coalesce(m.visibility, 'members') <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'id', s.id, 'video_guid', s.video_guid, 'caption', s.caption, 'muted', s.muted,
    'width', s.width, 'height', s.height, 'length_s', s.length_s,
    'resolutions', s.resolutions, 'music', s.music, 'handle', m.handle,
    'respins', (select count(*) from porch_respins r where r.spin_id = s.id));
end $$;
revoke all on function public.porch_spin_card(uuid) from public;
grant execute on function public.porch_spin_card(uuid) to anon, authenticated;

-- a profile link: public profiles only. Members only AND nobody-by-that-name both answer
-- { locked: true }, so a link can never confirm that somebody is on the Porch.
create or replace function public.porch_profile_card(p_handle text)
returns json language plpgsql stable security definer set search_path = public as $$
declare m porch_members;
begin
  select * into m from porch_members where handle = lower(p_handle) and frozen_at is null;
  if m.user_id is null or m.visibility <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'handle', m.handle, 'bio', m.bio, 'avatar_path', m.avatar_path, 'cover_path', m.cover_path,
    'spins', coalesce((select json_agg(x) from (
       select s.id, s.video_guid from porch_spins s
       where s.user_id = m.user_id and s.status = 'ready' and (s.pinned or s.expires_at > now())
         and not exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null)
       order by s.pinned desc, s.created_at desc limit 9) x), '[]'::json));
end $$;
revoke all on function public.porch_profile_card(text) from public;
grant execute on function public.porch_profile_card(text) to anon, authenticated;

-- ---------- 3. near me: a rounded spot nobody can read ----------
create table if not exists public.porch_places (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  lat        real not null,
  lng        real not null,
  sets_today int not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.porch_places enable row level security;
revoke all on public.porch_places from anon, authenticated;     -- no policies: nobody reads or writes it directly

create or replace function public.porch_set_place(p_lat double precision, p_lng double precision)
returns void language plpgsql security definer set search_path = public as $$
declare cur porch_places;
begin
  if auth.uid() is null or not public.porch_verified(auth.uid()) then raise exception 'confirm first' using errcode = '28000'; end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return; end if;
  select * into cur from porch_places where user_id = auth.uid();
  -- at most 5 moves a day, so nobody can walk their spot around to pin somebody down
  if cur.user_id is not null and cur.updated_at > now() - interval '1 day' and cur.sets_today >= 5 then return; end if;
  insert into porch_places (user_id, lat, lng, sets_today, updated_at)
  values (auth.uid(), round(p_lat::numeric, 1), round(p_lng::numeric, 1), 1, now())
  on conflict (user_id) do update
    set lat = excluded.lat, lng = excluded.lng, updated_at = now(),
        sets_today = case when porch_places.updated_at > now() - interval '1 day' then porch_places.sets_today + 1 else 1 end;
end $$;
grant execute on function public.porch_set_place(double precision, double precision) to authenticated;

create or replace function public.porch_forget_place()
returns void language sql security definer set search_path = public as $$
  delete from porch_places where user_id = auth.uid();
$$;
grant execute on function public.porch_forget_place() to authenticated;

create or replace function public.porch_has_place()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_places where user_id = auth.uid());
$$;
grant execute on function public.porch_has_place() to authenticated;

-- names and faces only, about 30 miles around, in a shuffled order (new every day) so the
-- order can't be used to work out who is closer; never a place or a distance.
-- Only people who confirmed an email can look.
create or replace function public.porch_near_me()
returns table (user_id uuid, handle text, avatar_path text, bio text)
language sql stable security definer set search_path = public as $$
  with mine as (select lat, lng from porch_places where porch_places.user_id = auth.uid())
  select m.user_id, m.handle, m.avatar_path, m.bio
  from porch_places p
  join mine on true
  join porch_members m on m.user_id = p.user_id
  where p.user_id <> auth.uid()
    and public.porch_verified(auth.uid())
    and m.verified_at is not null and m.frozen_at is null
    and not public.porch_blocked(auth.uid(), p.user_id)
    and abs(p.lat - mine.lat) <= 0.5
    and abs(p.lng - mine.lng) <= 0.5 / greatest(cos(radians(mine.lat)), 0.2)
  order by md5(p.user_id::text || current_date::text)
  limit 20;
$$;
grant execute on function public.porch_near_me() to authenticated;

-- ---------- 4. most active in the last 2 weeks ----------
create or replace function public.porch_most_active()
returns table (user_id uuid, handle text, avatar_path text, bio text)
language sql stable security definer set search_path = public as $$
  with acts as (
    select p.user_id from porch_posts p where p.created_at > now() - interval '14 days' and p.hidden_at is null
    union all
    select c.user_id from porch_comments c where c.created_at > now() - interval '14 days' and c.hidden_at is null
  )
  select m.user_id, m.handle, m.avatar_path, m.bio
  from acts a join porch_members m on m.user_id = a.user_id
  where a.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and m.verified_at is not null and m.frozen_at is null
    and not public.porch_blocked(auth.uid(), a.user_id)
  group by m.user_id, m.handle, m.avatar_path, m.bio
  order by count(*) desc, m.handle
  limit 15;
$$;
grant execute on function public.porch_most_active() to authenticated;

-- new functions can be run by everybody unless told otherwise; these are for signed-in people only
revoke execute on function public.porch_set_place(double precision, double precision) from public, anon;
revoke execute on function public.porch_forget_place() from public, anon;
revoke execute on function public.porch_has_place() from public, anon;
revoke execute on function public.porch_near_me() from public, anon;
revoke execute on function public.porch_most_active() from public, anon;

-- ---------- 5. the double check: sober dates live only where you can read your own ----------
-- What a correct result looks like:
--   porch_profiles_with_sober_date = 0
--   app_accounts_table_locked      = true   (row security is on)
--   app_accounts_rules             = rules that only ever match your own row (auth.uid() = id)
select
  (select count(*) from public.porch_members where sober_date is not null) as porch_profiles_with_sober_date,
  (select relrowsecurity from pg_class where oid = to_regclass('public.profiles')) as app_accounts_table_locked,
  (select string_agg(policyname || ' [' || cmd || ']: ' || coalesce(qual, '') || coalesce(' / ' || with_check, ''), '  |  ')
     from pg_policies where schemaname = 'public' and tablename = 'profiles') as app_accounts_rules;

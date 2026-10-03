-- ============================================================
-- THE PORCH, STEP 39: TAKE A BREAK, AND RETIRED NAMES. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "alcoholics ... do things hastily and then they regret it." Two things:
--
-- 1. TAKE A BREAK (like deactivating on Facebook). Your profile, shares, Spins and comments
--    are hidden from everybody else. Nothing is erased, your name stays yours, and it all
--    comes back the moment you say "I'm back". Messages you already sent stay in your
--    friends' chats, the same as Facebook.
--
-- 2. RETIRED NAMES. "If they delete their account, their username is retired. I don't want
--    anybody to duplicate the account." When an account is fully deleted, that name can never
--    be signed up again, by anybody. Only a scrambled fingerprint of the name is kept, not
--    the name itself, so nothing readable about the person is left behind.
-- ============================================================

-- ---------- 1. take a break ----------
alter table public.porch_members add column if not exists away_at timestamptz;

create or replace function public.porch_away(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members where user_id = p and away_at is not null);
$$;
revoke all on function public.porch_away(uuid) from public;
grant execute on function public.porch_away(uuid) to anon, authenticated;

-- These sit ON TOP of the rules already there: somebody on a break is hidden from everyone
-- but themselves (and the moderators).
drop policy if exists "on a break: hidden" on public.porch_members;
create policy "on a break: hidden" on public.porch_members as restrictive for select
  using (away_at is null or user_id = auth.uid() or public.porch_is_mod(auth.uid()));
drop policy if exists "on a break: hidden" on public.porch_posts;
create policy "on a break: hidden" on public.porch_posts as restrictive for select
  using (user_id = auth.uid() or not public.porch_away(user_id) or public.porch_is_mod(auth.uid()));
drop policy if exists "on a break: hidden" on public.porch_spins;
create policy "on a break: hidden" on public.porch_spins as restrictive for select
  using (user_id = auth.uid() or not public.porch_away(user_id) or public.porch_is_mod(auth.uid()));
drop policy if exists "on a break: hidden" on public.porch_comments;
create policy "on a break: hidden" on public.porch_comments as restrictive for select
  using (user_id = auth.uid() or not public.porch_away(user_id) or public.porch_is_mod(auth.uid()));

create or replace function public.porch_take_break()
returns void language sql security definer set search_path = public as $$
  update porch_members set away_at = now() where user_id = auth.uid() and away_at is null;
  delete from porch_places where user_id = auth.uid();          -- off the "near me" list too
$$;
create or replace function public.porch_come_back()
returns void language sql security definer set search_path = public as $$
  update porch_members set away_at = null where user_id = auth.uid();
$$;
revoke all on function public.porch_take_break() from public, anon;
revoke all on function public.porch_come_back() from public, anon;
grant execute on function public.porch_take_break() to authenticated;
grant execute on function public.porch_come_back() to authenticated;

-- the links and the people lists leave them out too
create or replace function public.porch_profile_card(p_handle text)
returns json language plpgsql stable security definer set search_path = public as $$
declare m porch_members;
begin
  select * into m from porch_members where handle = lower(p_handle) and frozen_at is null and away_at is null;
  if m.user_id is null or m.visibility <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'handle', m.handle, 'bio', m.bio, 'avatar_path', m.avatar_path, 'cover_path', m.cover_path,
    'spins', coalesce((select json_agg(x) from (
       select s.id, s.video_guid from porch_spins s
       where s.user_id = m.user_id and s.status = 'ready' and (s.pinned or s.expires_at > now())
         and not exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null)
       order by s.pinned desc, s.created_at desc limit 9) x), '[]'::json));
end $$;
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
  if m.away_at is not null then return json_build_object('locked', true); end if;      -- on a break: same as Members only
  if coalesce(m.visibility, 'members') <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'id', s.id, 'video_guid', s.video_guid, 'caption', s.caption, 'muted', s.muted,
    'width', s.width, 'height', s.height, 'length_s', s.length_s,
    'resolutions', s.resolutions, 'music', s.music, 'handle', m.handle,
    'respins', (select count(*) from porch_respins r where r.spin_id = s.id));
end $$;
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
    and m.verified_at is not null and m.frozen_at is null and m.away_at is null
    and not public.porch_blocked(auth.uid(), p.user_id)
    and abs(p.lat - mine.lat) <= 0.5
    and abs(p.lng - mine.lng) <= 0.5 / greatest(cos(radians(mine.lat)), 0.2)
  order by md5(p.user_id::text || current_date::text)
  limit 20;
$$;
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
    and m.verified_at is not null and m.frozen_at is null and m.away_at is null
    and not public.porch_blocked(auth.uid(), a.user_id)
  group by m.user_id, m.handle, m.avatar_path, m.bio
  order by count(*) desc, m.handle
  limit 15;
$$;

-- ---------- 2. retired names ----------
create table if not exists public.retired_names (
  hash text primary key,
  at   timestamptz not null default now()
);
alter table public.retired_names enable row level security;
revoke all on public.retired_names from anon, authenticated;      -- nobody reads it from the app

-- two fingerprints per name: the name as typed, and the look-alike version (tac0mike = tacomike)
create or replace function public.name_prints(p text)
returns text[] language sql immutable as $$
  select array[
    encode(sha256(convert_to('n:' || lower(btrim(coalesce(p, ''))), 'UTF8')), 'hex'),
    encode(sha256(convert_to('s:' || public.name_squash(translate(lower(coalesce(p, '')), '1', 'l')), 'UTF8')), 'hex')];
$$;
create or replace function public.name_retired(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select btrim(coalesce(p, '')) <> '' and exists (select 1 from retired_names where hash = any (public.name_prints(p)));
$$;
revoke all on function public.name_retired(text) from public, anon, authenticated;
-- only the server calls this, when an account is fully deleted
create or replace function public.name_retire(p_name text)
returns void language sql security definer set search_path = public as $$
  insert into retired_names (hash) select unnest(public.name_prints(p_name)) where btrim(coalesce(p_name, '')) <> ''
  on conflict do nothing;
$$;
revoke all on function public.name_retire(text) from public, anon, authenticated;

-- the name check everybody already goes through (sign-up and the profile name) now knows about them
create or replace function public.name_blocked(p_name text, p_pages boolean default true)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare raw text := lower(coalesce(p_name, ''));
        sq  text := name_squash(p_name);
        sq2 text := name_squash(translate(lower(coalesce(p_name, '')), '1', 'l'));     -- a 1 can be an i or an l
        plain text := regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]', '', 'g');
        words text[] := regexp_split_to_array(translate(lower(coalesce(p_name, '')), '013457@$', 'oieastas'), '[^a-z]+');
begin
  if raw = '' then return false; end if;
  if exists (select 1 from name_passes where handle = raw) then return false; end if;
  if name_retired(p_name) then return true; end if;                 -- a deleted account's name never comes back
  return exists (
    select 1 from taken_names t where
      (t.how = 'inside' and (sq like '%' || t.word || '%' or sq2 like '%' || t.word || '%' or plain like '%' || t.word || '%'))
      or (t.how = 'word' and (t.word = any (words) or sq = t.word))
      or (t.how = 'whole' and p_pages and (raw = t.word or sq = t.word))
  );
end $$;

-- ---- what a correct result looks like: one row that says READY, with 4 "on a break" rules
select 'READY. Take a break and retired names are in place.' as status,
       (select count(*) from pg_policies where policyname = 'on a break: hidden') as break_rules,
       (select count(*) from public.porch_members where away_at is not null) as on_a_break_now,
       (select count(*) / 2 from public.retired_names) as names_retired;

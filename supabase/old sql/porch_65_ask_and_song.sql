-- PORCH STEP 65 (6 Oct 2026, Mike): ASK ME ABOUT + MY SONG on a profile.
--   * ASK ME ABOUT: up to 3 conversation starters. Members only, like links. No wait to add them.
--   * MY SONG: one song (title + artist). Members see it, and it shows on the outside page of a
--     PUBLIC profile. No song file and no cover art is kept here, only the words.
--   * Tap a starter on somebody who isn't your friend yet -> a friend request WITH A NOTE on it.
--     They get one alert. "Be Friends and Reply" makes you friends and the note becomes the first
--     message. "Not Now" is quiet: the asker is never told.
--   * A brand-new account (under 3 days) can send an Ask, 3 a day. Plain Add Friend keeps its wait.
-- SAFE TO RUN TWICE.

-- ---------- 1. where the starters and the song live ----------
create table if not exists public.porch_more (
  user_id uuid primary key references auth.users(id) on delete cascade,
  asks text[] not null default '{}',
  song jsonb,
  updated_at timestamptz not null default now()
);
alter table public.porch_more enable row level security;   -- no policies on purpose: the functions below are the only way in
revoke all on public.porch_more from anon, authenticated;

create or replace function public.porch_more_set(p_asks text[], p_song jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare clean text[] := '{}'; a text; s jsonb := null; t text; r text; u text;
begin
  if auth.uid() is null or not public.porch_verified(auth.uid()) then raise exception 'members only'; end if;
  foreach a in array coalesce(p_asks, '{}') loop
    a := btrim(regexp_replace(a, '\s+', ' ', 'g'));
    if char_length(a) between 1 and 40
       and a !~* '(https?://|www\.)\S|\m[a-z0-9-]{2,}\.(com|org|net|io|co|me|app|tv|ly|gg|fm|info|biz|us|link|shop|store|xyz|site|online)\M'
       and not (lower(a) = any(select lower(x) from unnest(clean) x))
       and coalesce(array_length(clean, 1), 0) < 3 then
      clean := clean || a;
    end if;
  end loop;
  if p_song is not null and jsonb_typeof(p_song) = 'object' then
    t := left(btrim(coalesce(p_song ->> 'title', '')), 120);
    r := left(btrim(coalesce(p_song ->> 'artist', '')), 120);
    u := coalesce(p_song ->> 'apple', '');
    if char_length(u) > 300 or u !~ '^https://(music|itunes)\.apple\.com/[^\s<>"'']+$' then u := null; end if;
    if t <> '' then s := jsonb_build_object('title', t, 'artist', r, 'apple', u); end if;
  end if;
  insert into porch_more (user_id, asks, song, updated_at) values (auth.uid(), clean, s, now())
  on conflict (user_id) do update set asks = excluded.asks, song = excluded.song, updated_at = now();
  return json_build_object('asks', clean, 'song', s);
end $$;

-- somebody's starters and song: members only (or your own)
create or replace function public.porch_more_of(p_user uuid)
returns json language sql stable security definer set search_path = public as $$
  select coalesce((
    select json_build_object('asks', k.asks, 'song', k.song)
    from porch_more k join porch_members m on m.user_id = k.user_id
    where k.user_id = p_user
      and auth.uid() is not null
      and (auth.uid() = p_user
           or ((public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()))
               and m.frozen_at is null and m.away_at is null
               and not public.porch_blocked(auth.uid(), p_user)))
  ), json_build_object('asks', '{}'::text[], 'song', null));
$$;
revoke all on function public.porch_more_set(text[], jsonb) from public;
revoke all on function public.porch_more_of(uuid) from public;
grant execute on function public.porch_more_set(text[], jsonb) to authenticated;
grant execute on function public.porch_more_of(uuid) to authenticated;

-- ---------- 2. the outside page of a PUBLIC profile also gets the song ----------
create or replace function public.porch_profile_card(p_handle text)
returns json language plpgsql stable security definer set search_path = public as $$
declare m porch_members;
begin
  select * into m from porch_members where handle = lower(p_handle) and frozen_at is null and away_at is null;
  if m.user_id is null or m.visibility <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'handle', m.handle, 'real_name', m.real_name, 'created_at', m.created_at,
    'bio', m.bio, 'avatar_path', m.avatar_path, 'cover_path', m.cover_path,
    'song', (select k.song from porch_more k where k.user_id = m.user_id),
    'spins', coalesce((select json_agg(x) from (
       select s.id, s.video_guid from porch_spins s
       where s.user_id = m.user_id and s.status = 'ready' and (s.pinned or s.expires_at > now())
         and not exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null)
       order by s.pinned desc, s.created_at desc limit 9) x), '[]'::json));
end $$;
grant execute on function public.porch_profile_card(text) to anon, authenticated;

-- ---------- 3. a note can ride on a friend request ----------
alter table public.porch_friend_requests add column if not exists note text check (char_length(note) <= 300);
alter table public.porch_friend_requests add column if not exists about text check (char_length(about) <= 40);
alter table public.porch_friend_requests add column if not exists snoozed_at timestamptz;
-- a phone can only ever put the two names in. The note goes in through the porch function, which
-- runs the slur / threat / link checks first.
revoke insert, update on public.porch_friend_requests from anon, authenticated;
grant insert (from_id, to_id) on public.porch_friend_requests to authenticated;

-- the note becomes the first message. No buzz for it: the person is looking right at it.
create or replace function public.porch_note_to_dm(p_from uuid, p_to uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare x uuid := least(p_from, p_to); y uuid := greatest(p_from, p_to); tid uuid; ts timestamptz;
begin
  if p_body is null or btrim(p_body) = '' or public.porch_blocked(p_from, p_to) then return; end if;
  insert into porch_threads (a, b) values (x, y) on conflict (a, b) do nothing;
  select id into tid from porch_threads where a = x and b = y;
  perform set_config('porch.quiet_dm', '1', true);
  insert into porch_dm (thread_id, from_id, body) values (tid, p_from, p_body) returning created_at into ts;
  perform set_config('porch.quiet_dm', '', true);
  update porch_threads set last_at = ts, last_from = p_from, last_preview = left(regexp_replace(p_body, '\s+', ' ', 'g'), 90),
         a_read_at = case when x = p_from then ts else a_read_at end,
         b_read_at = case when y = p_from then ts else b_read_at end
   where id = tid;
end $$;
revoke all on function public.porch_note_to_dm(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.porch_push_dm()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text; t porch_threads; them uuid;
begin
  if coalesce(current_setting('porch.quiet_dm', true), '') = '1' then return new; end if;
  select * into t from porch_threads where id = new.thread_id;
  them := case when t.a = new.from_id then t.b else t.a end;
  if not exists (select 1 from porch_push where user_id = them) then return new; end if;
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('dm_id', new.id)
  );
  return new;
exception when others then
  return new;
end $$;

-- BE FRIENDS: only works if they really asked you. A note on the request becomes the first message.
create or replace function public.porch_confirm_friend(p_from uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n text;
begin
  if me is null or not public.porch_can_act(me) then return false; end if;
  delete from porch_friend_requests where from_id = p_from and to_id = me returning note into n;
  if not found then return false; end if;
  delete from porch_friend_requests where from_id = me and to_id = p_from;
  insert into porch_friends (a, b) values (least(me, p_from), greatest(me, p_from)) on conflict do nothing;
  delete from porch_notes where user_id = me and actor_id = p_from and kind = 'friend_request';
  perform public.porch_note(p_from, me, 'friend_accept', null, null);
  perform public.porch_note_to_dm(p_from, me, n);
  return true;
end $$;
revoke all on function public.porch_confirm_friend(uuid) from anon;
grant execute on function public.porch_confirm_friend(uuid) to authenticated;

-- same trigger as step 41, plus: if they had asked you with a note and you add them, the note still lands
create or replace function public.porch_friend_request_added()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if public.porch_house(new.to_id) then
    delete from porch_friend_requests where (from_id = new.to_id and to_id = new.from_id) or (from_id = new.from_id and to_id = new.to_id);
    insert into porch_friends (a, b) values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id)) on conflict do nothing;
    perform public.porch_note(new.from_id, new.to_id, 'friend_accept', null, null);
    return null;
  end if;
  if exists (select 1 from porch_friend_requests where from_id = new.to_id and to_id = new.from_id) then
    select note into n from porch_friend_requests where from_id = new.to_id and to_id = new.from_id;
    delete from porch_friend_requests where (from_id = new.to_id and to_id = new.from_id) or (from_id = new.from_id and to_id = new.to_id);
    insert into porch_friends (a, b) values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id)) on conflict do nothing;
    delete from porch_notes where user_id = new.from_id and actor_id = new.to_id and kind = 'friend_request';
    perform public.porch_note(new.to_id, new.from_id, 'friend_accept', null, null);
    perform public.porch_note_to_dm(new.to_id, new.from_id, n);
    perform public.porch_note_to_dm(new.from_id, new.to_id, new.note);
    return null;
  end if;
  if exists (select 1 from porch_friends where a = least(new.from_id, new.to_id) and b = greatest(new.from_id, new.to_id)) then
    delete from porch_friend_requests where from_id = new.from_id and to_id = new.to_id;
    return null;
  end if;
  perform public.porch_note(new.to_id, new.from_id, 'friend_request', null, null);
  return null;
end $$;

-- SEND AN ASK. Only the porch function can call this (it checks the words first).
-- Answers: ok | friends (already friends, just message) | friends_now (they had asked you too)
--          already (you asked, they haven't answered) | limit (3 a day while new) | no
create or replace function public.porch_ask_send(p_from uuid, p_to uuid, p_about text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare had text; has_row boolean; fresh boolean; back boolean;
begin
  if p_from is null or p_to is null or p_from = p_to or not public.porch_verified(p_from) then return 'no'; end if;
  if public.porch_blocked(p_from, p_to) or public.porch_house(p_to) then return 'no'; end if;
  if not exists (select 1 from porch_members m where m.user_id = p_to and m.verified_at is not null and m.frozen_at is null and m.away_at is null) then return 'no'; end if;
  if public.porch_are_friends(p_from, p_to) then return 'friends'; end if;
  p_note := left(btrim(coalesce(p_note, '')), 300); p_about := left(btrim(coalesce(p_about, '')), 40);
  if p_note = '' then return 'no'; end if;
  select true, note into has_row, had from porch_friend_requests where from_id = p_from and to_id = p_to;
  if has_row and had is not null then return 'already'; end if;
  select not exists (select 1 from auth.users u where u.id = p_from and u.created_at < now() - interval '3 days') into fresh;
  if fresh and (select count(*) from porch_friend_requests where from_id = p_from and note is not null and created_at > now() - interval '1 day') >= 3 then
    return 'limit';
  end if;
  if has_row then
    update porch_friend_requests set note = p_note, about = nullif(p_about, ''), snoozed_at = null where from_id = p_from and to_id = p_to;
    perform public.porch_note(p_to, p_from, 'friend_request', null, null);
    return 'ok';
  end if;
  select exists (select 1 from porch_friend_requests where from_id = p_to and to_id = p_from) into back;
  insert into porch_friend_requests (from_id, to_id, note, about) values (p_from, p_to, p_note, nullif(p_about, ''));
  return case when back then 'friends_now' else 'ok' end;
end $$;
revoke all on function public.porch_ask_send(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.porch_ask_send(uuid, uuid, text, text) to service_role;

-- NOT NOW: it leaves your list and your alerts. They still see "Requested". Nobody is told.
create or replace function public.porch_request_not_now(p_from uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update porch_friend_requests set snoozed_at = now() where from_id = p_from and to_id = auth.uid();
  if not found then return false; end if;
  delete from porch_notes where user_id = auth.uid() and actor_id = p_from and kind = 'friend_request';
  return true;
end $$;
revoke all on function public.porch_request_not_now(uuid) from public;
grant execute on function public.porch_request_not_now(uuid) to authenticated;

select 'porch step 65: ok' as result,
       (select count(*) from pg_proc where proname in ('porch_more_set', 'porch_more_of', 'porch_ask_send', 'porch_request_not_now', 'porch_note_to_dm')) as functions,
       (select count(*) from information_schema.columns where table_name = 'porch_friend_requests' and column_name in ('note', 'about', 'snoozed_at')) as new_columns;

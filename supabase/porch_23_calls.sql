-- ============================================================
-- THE PORCH, STEP 23: VIDEO AND VOICE CALLS. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "I just think it's important to be able to do this, and I think it'll be cool."
-- One-on-one calls between FRIENDS, video or voice, started from a chat.
--
-- * The call itself goes phone to phone (or through Cloudflare's relay when two
--   phones can't reach each other). Nothing is recorded and nothing about what's
--   said or seen is stored anywhere.
-- * This table only holds the "handshake": who's calling who, and the technical
--   notes two phones swap to find each other. Only those two people can read
--   their row, the notes are wiped the moment the call ends, and the whole row is
--   deleted after a day.
-- * Friends only. Blocking stops calls both ways. One call at a time.
-- * A call nobody answers leaves "Missed video call" in the chat.
-- ============================================================

create table if not exists public.porch_calls (
  id          uuid primary key default gen_random_uuid(),
  caller      uuid not null references auth.users(id) on delete cascade,
  callee      uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'video' check (kind in ('video', 'voice')),
  status      text not null default 'ringing' check (status in ('ringing', 'accepted', 'declined', 'ended', 'missed')),
  offer       jsonb,
  answer      jsonb,
  created_at  timestamptz not null default now(),
  answered_at timestamptz,
  ended_at    timestamptz,
  caller_seen timestamptz not null default now(),
  callee_seen timestamptz
);
create index if not exists porch_calls_callee on public.porch_calls (callee, status, created_at desc);
alter table public.porch_calls enable row level security;
revoke all on public.porch_calls from anon, authenticated;
grant select on public.porch_calls to authenticated;
drop policy if exists "your own calls" on public.porch_calls;
create policy "your own calls" on public.porch_calls for select to authenticated
  using (auth.uid() in (caller, callee));

-- is this person on a live call right now? (ringing in the last minute, or answered
-- and their phone has checked in within the last 25 seconds)
create or replace function public.porch_on_call(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_calls c
    where u in (c.caller, c.callee)
      and ((c.status = 'ringing' and c.created_at > now() - interval '60 seconds')
        or (c.status = 'accepted' and c.ended_at is null
            and c.caller_seen > now() - interval '25 seconds' and c.callee_seen > now() - interval '25 seconds')));
$$;
revoke all on function public.porch_on_call(uuid) from public, anon, authenticated;

-- "Missed video call" lands in the chat between the two of them
create or replace function public.porch_call_missed(c porch_calls)
returns void language plpgsql security definer set search_path = public as $$
declare x uuid; y uuid; t uuid; says text; at timestamptz := now();
begin
  if public.porch_blocked(c.caller, c.callee) then return; end if;
  x := least(c.caller, c.callee); y := greatest(c.caller, c.callee);
  says := case when c.kind = 'voice' then 'Missed voice call' else 'Missed video call' end;
  insert into porch_threads (a, b) values (x, y) on conflict (a, b) do nothing;
  select id into t from porch_threads where a = x and b = y;
  if t is null then return; end if;
  insert into porch_dm (thread_id, from_id, body, created_at) values (t, c.caller, says, at);
  update porch_threads set last_at = at, last_from = c.caller, last_preview = says,
         a_read_at = case when a = c.caller then at else a_read_at end,
         b_read_at = case when b = c.caller then at else b_read_at end
   where id = t;
exception when others then
  return;
end $$;
revoke all on function public.porch_call_missed(porch_calls) from public, anon, authenticated;

-- start a call: returns its id
create or replace function public.porch_call_start(p_to uuid, p_kind text, p_offer jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c uuid; old porch_calls;
begin
  if me is null or not public.porch_verified(me) then raise exception 'Confirm who you are first.' using errcode = 'P0001'; end if;
  if p_to is null or p_to = me then raise exception 'Pick a friend to call.' using errcode = 'P0001'; end if;
  if public.porch_blocked(me, p_to) or not public.porch_are_friends(me, p_to) then raise exception 'You can call friends only.' using errcode = 'P0001'; end if;
  if p_offer is null then raise exception 'That didn''t go through. Try again.' using errcode = 'P0001'; end if;
  -- tidy up: day-old rows go; calls that rang out become missed; anything of mine still open is over
  delete from porch_calls where created_at < now() - interval '1 day';
  for old in select * from porch_calls where status = 'ringing' and created_at <= now() - interval '60 seconds' and (caller in (me, p_to) or callee in (me, p_to)) loop
    update porch_calls set status = 'missed', ended_at = now(), offer = null, answer = null where id = old.id;
    perform public.porch_call_missed(old);
  end loop;
  update porch_calls set status = 'ended', ended_at = now(), offer = null, answer = null
   where me in (caller, callee) and status in ('ringing', 'accepted') and ended_at is null;
  if public.porch_on_call(p_to) then raise exception 'They''re on another call.' using errcode = 'P0001'; end if;
  if (select count(*) from porch_calls where caller = me and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'That''s a lot of calls. Take a breather and try again in a bit.' using errcode = 'P0001';
  end if;
  insert into porch_calls (caller, callee, kind, offer)
  values (me, p_to, case when p_kind = 'voice' then 'voice' else 'video' end, p_offer)
  returning id into c;
  return c;
end $$;

-- the friend picks up
create or replace function public.porch_call_answer(p_call uuid, p_answer jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update porch_calls set status = 'accepted', answer = p_answer, answered_at = now(), callee_seen = now()
   where id = p_call and callee = auth.uid() and status = 'ringing' and created_at > now() - interval '75 seconds';
  if not found then raise exception 'That call is over.' using errcode = 'P0001'; end if;
end $$;

-- hang up, decline, or give up ringing. Either person. Wipes the handshake notes.
create or replace function public.porch_call_end(p_call uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c porch_calls;
begin
  select * into c from porch_calls where id = p_call and me in (caller, callee);
  if c.id is null or c.status not in ('ringing', 'accepted') then return; end if;
  update porch_calls
     set status = case when c.status = 'accepted' then 'ended' when me = c.callee then 'declined' else 'missed' end,
         ended_at = now(), offer = null, answer = null
   where id = p_call;
  if c.status = 'ringing' and me = c.caller then perform public.porch_call_missed(c); end if;
end $$;

-- each phone checks in every couple of seconds while a call is up: "I'm still here",
-- and gets back where the call stands
create or replace function public.porch_call_ping(p_call uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c porch_calls;
begin
  update porch_calls set caller_seen = case when caller = me then now() else caller_seen end,
                         callee_seen = case when callee = me then now() else callee_seen end
   where id = p_call and me in (caller, callee)
  returning * into c;
  if c.id is null then return json_build_object('status', 'ended'); end if;
  -- the other phone went quiet for 25 seconds in the middle of a call: it's over
  if c.status = 'accepted' and least(c.caller_seen, c.callee_seen) < now() - interval '25 seconds' then
    update porch_calls set status = 'ended', ended_at = now(), offer = null, answer = null where id = p_call;
    return json_build_object('status', 'ended');
  end if;
  return json_build_object('status', c.status, 'answer', c.answer);
end $$;

revoke all on function public.porch_call_start(uuid, text, jsonb), public.porch_call_answer(uuid, jsonb),
  public.porch_call_end(uuid), public.porch_call_ping(uuid) from public, anon;
grant execute on function public.porch_call_start(uuid, text, jsonb), public.porch_call_answer(uuid, jsonb),
  public.porch_call_end(uuid), public.porch_call_ping(uuid) to authenticated;

-- ---------- the ring: a new call goes to porch-push ----------
create or replace function public.porch_push_call()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if not exists (select 1 from porch_push where user_id = new.callee) then return new; end if;
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('call_id', new.id)
  );
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists porch_push_call on public.porch_calls;
create trigger porch_push_call after insert on public.porch_calls
  for each row execute function public.porch_push_call();

-- check: should say ready
select 'calls ready' as status, (select count(*) from public.porch_calls) as calls_so_far;

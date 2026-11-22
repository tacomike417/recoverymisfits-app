-- porch_76_skivvies_lane.sql  (2 Nov 2026, Mike)
--
-- THE SKIVVIES LANE. "If they join through Recovery Misfits, it's got to be simple ...
-- it stays focused on skivvies in that group where you can post a note."
--
--   recoverymisfits.org/skivvies  ->  sign up (or sign in), confirm an email once
--   -> skivvies_lane_join()  ->  in the Skivvies group, nothing else pushed at them
--
-- Notes are written in the group, go to the Skivvies admin (Miscellaneous project,
-- edge function skivvies-note), and when Mike approves one, that function calls
-- skivvies_post_note() here: the note goes up in the group from the skivvies house
-- account, and the writer gets a DM from skivvies saying so.

-- who came in through a lane (only Skivvies for now)
create table if not exists public.porch_lanes (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  lane      text not null check (lane in ('skivvies')),
  joined_at timestamptz not null default now()
);
alter table public.porch_lanes enable row level security;
drop policy if exists "see your own lane" on public.porch_lanes;
create policy "see your own lane" on public.porch_lanes for select using (user_id = auth.uid());

-- the shared secret the Skivvies admin uses to post approved notes. No policies: nobody
-- can read it through the API. Set once, below.
create table if not exists public.skivvies_bridge (
  id     boolean primary key default true check (id),
  secret text not null
);
alter table public.skivvies_bridge enable row level security;
revoke all on public.skivvies_bridge from anon, authenticated;
insert into public.skivvies_bridge (secret)
values (replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;

-- JOIN THE CREW. Called by /skivvies.html once the email is confirmed.
-- p_new: the account was made in the lane just now, so Welcome Matt and the
-- "invite a friend" message are switched off for it. An existing RM member
-- joining the crew keeps whatever they already had.
create or replace function public.skivvies_lane_join(p_new boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid;
begin
  if me is null then raise exception 'Sign in first.' using errcode = 'P0001'; end if;
  if not public.porch_verified(me) then raise exception 'Confirm your email first.' using errcode = 'P0001'; end if;
  select id into g from porch_groups where slug = 'skivvies' and status = 'open';
  if g is null then raise exception 'The Skivvies group isn''t open.' using errcode = 'P0001'; end if;

  insert into porch_group_members (group_id, user_id) values (g, me) on conflict do nothing;

  if p_new then
    insert into porch_lanes (user_id, lane) values (me, 'skivvies') on conflict do nothing;
    insert into porch_greet (user_id, m_done, m_result, i_done, i_result, c_done, c_result)
    values (me, now(), 'skivvies lane', now(), 'skivvies lane', now(), 'skivvies lane')
    on conflict (user_id) do update set
      m_done = coalesce(porch_greet.m_done, now()), m_result = coalesce(porch_greet.m_result, 'skivvies lane'),
      i_done = coalesce(porch_greet.i_done, now()), i_result = coalesce(porch_greet.i_result, 'skivvies lane'),
      c_done = coalesce(porch_greet.c_done, now()), c_result = coalesce(porch_greet.c_result, 'skivvies lane');
    update porch_members set welcomed_at = coalesce(welcomed_at, now()) where user_id = me;
  end if;
  return 'skivvies';
end $$;
revoke all on function public.skivvies_lane_join(boolean) from public, anon;
grant execute on function public.skivvies_lane_join(boolean) to authenticated;

-- AN APPROVED NOTE GOES UP. Only the Skivvies admin's edge function knows the secret.
create or replace function public.skivvies_post_note(p_secret text, p_body text, p_sign text, p_writer uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare house uuid; g uuid; pid uuid; th uuid; x uuid; y uuid; txt text; dm text;
begin
  if p_secret is null or p_secret <> (select secret from skivvies_bridge) then
    raise exception 'no' using errcode = '42501';
  end if;
  txt := btrim(coalesce(p_body, ''));
  if char_length(txt) < 2 or char_length(txt) > 600 then raise exception 'bad note' using errcode = 'P0001'; end if;
  select user_id into house from porch_members where handle = 'skivvies';
  select id into g from porch_groups where slug = 'skivvies';
  if house is null or g is null then raise exception 'skivvies is not set up' using errcode = 'P0001'; end if;

  txt := '“' || txt || '”' || E'\n\n— ' || coalesce(nullif(btrim(p_sign), ''), 'somebody in recovery');
  insert into porch_posts (user_id, need, body, group_id) values (house, 'hope', txt, g) returning id into pid;

  -- tell the writer, from the skivvies account
  if p_writer is not null and p_writer <> house and exists (select 1 from porch_members where user_id = p_writer) then
    begin
      dm := 'Your note got approved 🧡 It''s up in the Skivvies group now, and it''s going in somebody''s pack on their first day. Thank you.';
      x := least(house, p_writer); y := greatest(house, p_writer);
      insert into porch_threads (a, b) values (x, y)
      on conflict (a, b) do update set last_at = now() returning id into th;
      insert into porch_dm (thread_id, from_id, body) values (th, house, dm);
      update porch_threads set last_at = now(), last_from = house, last_preview = left(dm, 90) where id = th;
    exception when others then null;          -- the note is up either way
    end;
  end if;
  return pid;
end $$;
revoke all on function public.skivvies_post_note(text, text, text, uuid) from public;
grant execute on function public.skivvies_post_note(text, text, text, uuid) to anon, authenticated;

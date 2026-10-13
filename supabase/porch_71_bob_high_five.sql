-- ============================================================
-- THE PORCH, STEP 71: HIGH FIVE, BOB. 13 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
-- Paste ALL of this into the Supabase SQL Editor and press Run.
--
-- Mike: like "thank the bus driver" in Fortnite. Bob (one of the two skull men in the logo,
-- Bill and Bob) sits at the top of the Everyone feed. Tap him and you high-five him. It means
-- "we're here, you're not alone" and it does nothing else: no names, no streaks, no points,
-- no alerts, nothing tied to a sober date.
--
--   * One high five counts per person per day. The day turns over at midnight Eastern.
--     Tapping again later just plays it again; it doesn't count twice.
--   * Only confirmed members count (the same people who can post). Anybody else who taps him
--     still gets the high five on screen, it just isn't counted.
--   * Nobody can see who high-fived Bob. The page only ever gets a number, and the number
--     only shows once it is 2 or more.
--   * Every house account high-fives Bob once every morning at its own random time between
--     4am and 10am Eastern, so the number is real and never empty. A timer in the database
--     does it every 10 minutes (the same pg_cron timer the daily posts use, but this one
--     runs plain SQL, so there is no function to deploy).
--     To stop it:  select cron.unschedule('porch-bob-house');
--
-- A correct result is ONE row at the bottom:
--   status = 'porch step 71: ok', timer_on = true, house_accounts_found = 8 (or how many of the
--   house accounts exist), and high_fives_today = however many have gone in so far today
--   (after 10am Eastern it is at least the house accounts).
-- ============================================================

create extension if not exists pg_cron;

-- ---- the table: one row per person per day. Nobody reads it from the app.
create table if not exists public.porch_bob_high_fives (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null default ((now() at time zone 'America/New_York')::date),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists porch_bob_high_fives_day on public.porch_bob_high_fives (day);
alter table public.porch_bob_high_fives enable row level security;
revoke all on public.porch_bob_high_fives from anon, authenticated;
grant insert on public.porch_bob_high_fives to authenticated;

-- true when this person's high five counts: a confirmed member who isn't paused by a report
create or replace function public.porch_bob_can(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p is not null and exists (select 1 from porch_members m
                                   where m.user_id = p and m.verified_at is not null and m.frozen_at is null);
$$;
revoke all on function public.porch_bob_can(uuid) from public, anon;
grant execute on function public.porch_bob_can(uuid) to authenticated;

-- you can only put in YOUR OWN row, for TODAY, and only as a confirmed member.
-- There is no "read" rule at all, so nobody can see anybody's rows (not even their own).
drop policy if exists "bob: my own high five, today" on public.porch_bob_high_fives;
create policy "bob: my own high five, today" on public.porch_bob_high_fives
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and day = (now() at time zone 'America/New_York')::date
    and public.porch_bob_can(auth.uid())
  );

-- ---- the house accounts' morning high fives
-- Each one gets its own time every day, somewhere from 4:00 to 10:00am Eastern. The time comes
-- from the account's name and the date, so it is different every day but never changes during
-- the day (no matter how many times the timer knocks). The row is stamped with that time.
create or replace function public.porch_bob_house_tick()
returns int language plpgsql volatile security definer set search_path = public as $$
declare
  today date := (now() at time zone 'America/New_York')::date;
  added int := 0; n int; r record; at_time timestamptz;
begin
  for r in
    select m.user_id, m.handle from porch_members m
    where m.handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober',
                       'welcomematt', 'soberriot', 'realmrhyde', 'starkrecovery')
  loop
    -- 4:00am Eastern + 0..360 minutes
    at_time := ((today::timestamp + interval '4 hours'
                 + make_interval(mins => (('x' || substr(md5(r.handle || ':' || today::text), 1, 7))::bit(28)::int % 361)))
                at time zone 'America/New_York');
    if now() >= at_time then
      insert into porch_bob_high_fives (user_id, day, created_at) values (r.user_id, today, at_time)
      on conflict do nothing;
      get diagnostics n = row_count; added := added + n;
    end if;
  end loop;
  return added;
end $$;
revoke all on function public.porch_bob_house_tick() from public, anon, authenticated;
grant execute on function public.porch_bob_house_tick() to service_role;

-- ---- what the page asks: today's number, and whether you did it.
--   others = how many OTHER people high-fived Bob today
--   mine   = you did, today
--   can    = your high five would count (you are a confirmed member)
-- It also gives the house accounts their turn if the timer missed one (belt and braces).
create or replace function public.porch_bob_today()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'America/New_York')::date;
begin
  perform public.porch_bob_house_tick();
  return jsonb_build_object(
    'day',    today,
    'others', (select count(*) from porch_bob_high_fives b where b.day = today
                and b.user_id <> coalesce(me, '00000000-0000-0000-0000-000000000000'::uuid)),
    'mine',   me is not null and exists (select 1 from porch_bob_high_fives b where b.day = today and b.user_id = me),
    'can',    public.porch_bob_can(me));
end $$;
revoke all on function public.porch_bob_today() from public;
grant execute on function public.porch_bob_today() to anon, authenticated;

-- ---- the tap. Counts once a day for a confirmed member; any other tap just answers today's state.
create or replace function public.porch_bob_high_five()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'America/New_York')::date;
begin
  if public.porch_bob_can(me) then
    insert into porch_bob_high_fives (user_id, day) values (me, today) on conflict do nothing;
  end if;
  return public.porch_bob_today();
end $$;
revoke all on function public.porch_bob_high_five() from public, anon;
grant execute on function public.porch_bob_high_five() to authenticated;

-- ---- the timer: every 10 minutes from 8:00 to 15:50 world time, which covers 4 to 10am Eastern
-- in summer AND in winter. Plain SQL, nothing to deploy.
select cron.unschedule('porch-bob-house') where exists (select 1 from cron.job where jobname = 'porch-bob-house');
select cron.schedule('porch-bob-house', '*/10 8-15 * * *', $job$ select public.porch_bob_house_tick(); $job$);

-- catch up right now if it's already past some of their times today
select public.porch_bob_house_tick();

-- ---- what a correct result looks like: one row, status ok, timer_on = true
select 'porch step 71: ok' as status,
       (select active from cron.job where jobname = 'porch-bob-house') as timer_on,
       (select schedule from cron.job where jobname = 'porch-bob-house') as timer,
       (select count(*) from public.porch_members
         where handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober',
                          'welcomematt', 'soberriot', 'realmrhyde', 'starkrecovery')) as house_accounts_found,
       (select count(*) from public.porch_bob_high_fives
         where day = (now() at time zone 'America/New_York')::date) as high_fives_today;

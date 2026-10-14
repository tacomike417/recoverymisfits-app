-- PORCH STEP 72: the house accounts high-five Bob right after midnight (14 Oct 2026, Mike)
-- Mike: "It's supposed to count the house high fives too. So it always starts at like eight."
-- Before this, each house account picked its own time between 4 and 10am Eastern, so early in the
-- morning the count was still low. Now all 8 give Bob their high five between 12:00 and 12:30am
-- Eastern. The first person to open the Porch after that triggers it (the page asks for today's
-- count, and that runs the house turn), and the old 10-minute timer still runs as a backup.
-- Nothing else changes: one per account per day, same table, same page.

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
    -- 12:00am Eastern + 0..30 minutes (different every day, from the name and the date)
    at_time := ((today::timestamp
                 + make_interval(mins => (('x' || substr(md5(r.handle || ':' || today::text), 1, 7))::bit(28)::int % 31)))
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

-- the backup timer: every 10 minutes, all day
select cron.unschedule('porch-bob-house') where exists (select 1 from cron.job where jobname = 'porch-bob-house');
select cron.schedule('porch-bob-house', '*/10 * * * *', $job$ select public.porch_bob_house_tick(); $job$);

-- catch up today right now
select public.porch_bob_house_tick();

-- ---- what a correct result looks like: one row, status ok, house_accounts_found = 8,
--      house_high_fives_today = 8, high_fives_today = 8 or more
select 'porch step 72: ok' as status,
       (select count(*) from public.porch_members
         where handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober',
                          'welcomematt', 'soberriot', 'realmrhyde', 'starkrecovery')) as house_accounts_found,
       (select count(*) from public.porch_bob_high_fives b join public.porch_members m on m.user_id = b.user_id
         where b.day = (now() at time zone 'America/New_York')::date
           and m.handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober',
                            'welcomematt', 'soberriot', 'realmrhyde', 'starkrecovery')) as house_high_fives_today,
       (select count(*) from public.porch_bob_high_fives
         where day = (now() at time zone 'America/New_York')::date) as high_fives_today;

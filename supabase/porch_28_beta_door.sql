-- ============================================================
-- THE PORCH, STEP 28: THE BETA DOOR. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- Run AFTER porch_27_long_spins.sql.
--
-- Mike: "make some sort of page that says beta.html and let me send it out, and anybody
-- that signs up through that gets full access to the site right away."
--
-- recoverymisfits.org/beta.html marks the phone as a beta phone. The first time that
-- person lands on the Porch signed in, the app calls porch_beta_join() and they become
-- a beta tester: on the testers list, able to post right away (no email step, no 3-day
-- wait), 60-second Spins, and friends with tacomike417 so there is somebody to see.
--
-- IT IS NOT THE LAUNCH. Everybody without the link still sees "coming at the end of
-- October". Two brakes, both here:
--   the cap:        25 testers in all. Change it:  update porch_beta set cap = 40;
--   the off switch: update porch_beta set open = false;     (back on: set open = true)
-- With the door shut or full, a beta phone still sees the Porch but can't post until
-- it confirms an email, the same as anybody will at launch.
--
-- Take somebody back out:
--   delete from porch_testers where handle = 'somebody';
-- ============================================================

create table if not exists public.porch_beta (
  id   boolean primary key default true check (id),
  open boolean not null default true,
  cap  int     not null default 25
);
alter table public.porch_beta enable row level security;      -- no policies: nobody reads it directly
revoke all on public.porch_beta from anon, authenticated;
insert into public.porch_beta (id) values (true) on conflict do nothing;

create or replace function public.porch_beta_join()
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); h text; b record; mike uuid;
begin
  if me is null then return 'signed-out'; end if;
  select lower(split_part(email, '@', 1)) into h from auth.users where id = me;
  if h is null or h !~ '^[a-z0-9._-]{3,32}$' then return 'no-name'; end if;
  if exists (select 1 from porch_testers where handle = h) then
    update porch_members set verified_at = coalesce(verified_at, now()) where user_id = me;
    return 'already';
  end if;
  select * into b from porch_beta where id;
  if not found or not b.open then return 'closed'; end if;
  if (select count(*) from porch_testers) >= b.cap then return 'full'; end if;

  insert into porch_testers (handle) values (h) on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at) values (me, h, now())
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now());
  insert into porch_spin_long (user_id) values (me) on conflict do nothing;

  select user_id into mike from porch_members where handle = 'tacomike417';
  if mike is not null and mike <> me then
    insert into porch_friends (a, b) values (least(me, mike), greatest(me, mike)) on conflict do nothing;
  end if;
  return 'ok';
end $$;
revoke all on function public.porch_beta_join() from public, anon;
grant execute on function public.porch_beta_join() to authenticated;

-- check: the door, and who is in
select (select open from public.porch_beta) as door_open,
       (select cap from public.porch_beta) as cap,
       (select count(*) from public.porch_testers) as testers_now,
       (select string_agg(handle, ', ' order by handle) from public.porch_testers) as testers;

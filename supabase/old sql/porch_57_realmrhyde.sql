-- ============================================================
-- THE PORCH, STEP 57: REALMRHYDE posts an Original Manuscript short every morning. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- The realmrhyde account is ALREADY made on the site (Mike). This:
--   1. lets it post without the 3-day wait, and makes it a house account (public profile)
--   2. adds a knock on the porch-daily function at exactly 6:13 in the morning, Eastern.
--      (The timer runs on world time, so it knocks at 10:13 and 11:13; the function only
--      posts when it is 6:13am or later in the Eastern morning, once a day.)
-- ============================================================

do $$
declare u uuid;
begin
  select user_id into u from porch_members where lower(handle) = 'realmrhyde';
  if u is null then select id into u from auth.users where email = 'realmrhyde@rm.invalid'; end if;
  if u is null then return; end if;
  insert into porch_testers (handle) values ('realmrhyde') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at) values (u, 'realmrhyde', now())
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now());
  update porch_members
     set bio = coalesce(nullif(btrim(bio), ''), 'The original manuscript, 1938. A few lines of it every morning at 6:13.'),
         visibility = 'public',
         welcomed_at = coalesce(welcomed_at, now())
   where user_id = u;
end $$;

-- realmrhyde is one of the house accounts
create or replace function public.porch_house(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members
                 where user_id = p and handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober', 'welcomematt', 'soberriot', 'realmrhyde'));
$$;

-- the 6:13am knock
select cron.unschedule('porch-hyde-613') where exists (select 1 from cron.job where jobname = 'porch-hyde-613');
select cron.schedule('porch-hyde-613', '13 10,11 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, account = 'ready', timer_on = true
select case when m.user_id is null then 'NOT FOUND. Check the name is exactly realmrhyde on the site, then run this again.' else 'ready' end as account,
       m.handle, m.visibility,
       (select active from cron.job where jobname = 'porch-hyde-613') as timer_on,
       (select schedule from cron.job where jobname = 'porch-hyde-613') as timer
from (select 1) x left join public.porch_members m on lower(m.handle) = 'realmrhyde';

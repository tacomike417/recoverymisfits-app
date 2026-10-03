-- ============================================================
-- THE PORCH, STEP 42: THE 4:17 KNOCK. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "25-40 sober spins that belong to the recoverymisfits account ... post one every
-- other day around 4:17pm."
--
-- The other house jobs are knocked on the hour. This adds one more knock at 17 minutes past,
-- at the two hours that are 4pm Eastern (one in summer, one in winter). The porch-daily
-- function does the rest: it only posts a Spin at or after 4:17pm Eastern, every other day.
-- To stop just this knock:  select cron.unschedule('porch-spins-417');
-- ============================================================

select cron.unschedule('porch-spins-417') where exists (select 1 from cron.job where jobname = 'porch-spins-417');
select cron.schedule('porch-spins-417', '17 20,21 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, active = true
select jobname, schedule, active,
       (select count(*) from public.porch_house_reels where n >= 1001) as misfit_spins_on_the_list,
       (select count(*) from public.porch_house_reels where n >= 1001 and status = 'posted') as already_posted
from cron.job where jobname = 'porch-spins-417';

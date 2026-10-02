-- ============================================================
-- THE PORCH, STEP 33: THE DAILY PRAYER AT 7. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- Run this AFTER the porch-daily function is deployed again.
--
-- Mike: the 365 prayers "get posted under that Spiritual Misfit account."
-- Same timer as the meme, with one more knock so 7am Eastern is covered in
-- summer and in winter: 10:00, 11:00 and 12:00 UTC. The function decides what
-- is due: the meme from 6am, the prayer from 7am, each one once a day.
-- To stop everything:  select cron.unschedule('porch-daily-meme');
-- ============================================================

select cron.unschedule('porch-daily-meme') where exists (select 1 from cron.job where jobname = 'porch-daily-meme');
select cron.schedule('porch-daily-meme', '0 10,11,12 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, active = true
select jobname, schedule, active, 'meme at 6am, prayer at 7am, Eastern' as means from cron.job where jobname = 'porch-daily-meme';

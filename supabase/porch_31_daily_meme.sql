-- ============================================================
-- THE PORCH, STEP 31: MEME OF THE DAY, EVERY MORNING AT 6. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- Run this AFTER the porch-daily function is deployed.
--
-- Mike: "I want it to post the meme of the day every morning at 6 a.m."
--
-- A timer that knocks on the porch-daily function. It knocks at 10:00 and 11:00
-- UTC, which is 6am Eastern in summer and in winter. The function itself waits
-- for 6am Eastern and only ever posts once a day, so the extra knock does nothing.
-- To stop it:  select cron.unschedule('porch-daily-meme');
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('porch-daily-meme') where exists (select 1 from cron.job where jobname = 'porch-daily-meme');
select cron.schedule('porch-daily-meme', '0 10,11 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, active = true
select jobname, schedule, active, '6am Eastern, every day' as means from cron.job where jobname = 'porch-daily-meme';

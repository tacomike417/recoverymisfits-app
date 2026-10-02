-- ============================================================
-- THE PORCH, STEP 34: THE JOKES AT NOON. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- Run this AFTER the porch-daily function is deployed again.
--
-- Mike: "can the recovery misfits account post memes every day and then every other
-- day post these little text things that I got?" Yes. Same timer, two more knocks so
-- noon Eastern is covered in summer and winter: 10, 11, 12, 16 and 17 UTC. The function
-- decides what is due: meme from 6am, prayer from 7am, a joke from noon every other day.
-- To stop everything:  select cron.unschedule('porch-daily-meme');
-- ============================================================

select cron.unschedule('porch-daily-meme') where exists (select 1 from cron.job where jobname = 'porch-daily-meme');
select cron.schedule('porch-daily-meme', '0 10,11,12,16,17 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, active = true
select jobname, schedule, active, 'meme 6am, prayer 7am, joke at noon every other day, Eastern' as means from cron.job where jobname = 'porch-daily-meme';

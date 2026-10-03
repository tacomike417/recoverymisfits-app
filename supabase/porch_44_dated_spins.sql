-- ============================================================
-- THE PORCH, STEP 44: THE DATED SPINS, ONE A MORNING. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "I want to post one a day with the date ones on the right date ... this batch is
-- independent of that ... have them post in the morning at 4:17am, I'll catch 'em then."
--
--   1. A Spin on the waiting list can carry its own day (post_on). The 19 new ones do:
--      4 Oct to 22 Oct, with the countdown to the Porch opening on the right mornings.
--   2. The 4:17 knock now also comes at 4:17 in the MORNING (it already came at 4:17pm
--      for the every-other-day line, which is not changed).
--   3. The old spin-24 ("Hit me up in Messenger", with the Facebook logo) comes off the
--      afternoon line. The corrected one is in the new batch.
-- ============================================================

alter table public.porch_house_reels add column if not exists post_on date;

select cron.unschedule('porch-spins-417') where exists (select 1 from cron.job where jobname = 'porch-spins-417');
select cron.schedule('porch-spins-417', '17 8,9,20,21 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

update public.porch_house_reels set status = 'failed'
where n >= 1001 and n < 2001 and title = 'misfits spin-24' and status = 'queued';

-- ---- what a correct result looks like: one row, active = true, old_spin_24 says "off the line"
select jobname, schedule, active,
       (select count(*) from public.porch_house_reels where n >= 1001 and n < 2001 and status = 'queued') as afternoon_line_waiting,
       (select count(*) from public.porch_house_reels where n >= 1001 and n < 2001 and status = 'posted') as afternoon_line_posted,
       coalesce((select case when status = 'failed' then 'off the line' else status end
                 from public.porch_house_reels where n >= 1001 and n < 2001 and title = 'misfits spin-24'), 'not found') as old_spin_24,
       (select count(*) from public.porch_house_reels where n >= 2001) as dated_spins_on_the_list
from cron.job where jobname = 'porch-spins-417';

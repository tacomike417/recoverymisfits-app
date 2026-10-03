-- ============================================================
-- THE PORCH, STEP 35: THE REELS FOR SPIRITUAL MISFIT. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "I just put 100 reels in there. These go on the spiritual misfit one ...
-- backlog it and post like six of them to start, and then do one every other day
-- until they run out."
--
-- * porch_house_reels: the waiting list. One row per reel, in order. Nobody can read
--   or write it from the app; only the porch-daily function touches it.
-- * The timer gets two more knocks so 5pm Eastern is covered in summer and winter.
--   meme 6am, prayer 7am, joke at noon every other day, reel at 5pm every other day.
-- To stop everything:  select cron.unschedule('porch-daily-meme');
-- ============================================================

create table if not exists public.porch_house_reels (
  n          int primary key,
  video_guid text not null unique,
  title      text,
  caption    text,
  status     text not null default 'uploading' check (status in ('uploading','queued','posted','failed')),
  spin_id    uuid,
  posted_at  timestamptz,
  created_at timestamptz not null default now()
);
alter table public.porch_house_reels enable row level security;
revoke all on public.porch_house_reels from anon, authenticated;

select cron.unschedule('porch-daily-meme') where exists (select 1 from cron.job where jobname = 'porch-daily-meme');
select cron.schedule('porch-daily-meme', '0 10,11,12,16,17,21,22 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like: one row, active = true, reels_waiting = 0 for now
select jobname, schedule, active,
       (select count(*) from public.porch_house_reels) as reels_on_the_list
from cron.job where jobname = 'porch-daily-meme';

-- ============================================================
-- THE PORCH, STEP 46: "YOUR FRIENDS SHARED", ONCE A MORNING. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "do we send out phone notifications for new posts by people you are friends
-- with? ... a once a day version ... 8:30am for recovery misfits".
--
-- One alert a day, at 8:30am Eastern, to everybody who has a friend that shared since
-- yesterday morning: "3 friends shared on the Porch". Nobody gets one on a day none of
-- their friends shared. Group shares are left out.
--
-- The knock comes at 12:30 and 13:30 UTC so it is 8:30am in summer AND in winter; the
-- porch-push function only acts on the one that really is 8:30, and only once a day.
--
-- Deploy porch-push BEFORE running this.
-- To stop it:  select cron.unschedule('porch-friends-digest');
-- ============================================================

create or replace function public.porch_friends_digest_knock()
returns void language plpgsql security definer set search_path = public as $$
declare s text;
begin
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('digest', 'friends')
  );
end $$;
revoke all on function public.porch_friends_digest_knock() from public, anon, authenticated;

select cron.unschedule('porch-friends-digest')
  where exists (select 1 from cron.job where jobname = 'porch-friends-digest');
select cron.schedule('porch-friends-digest', '30 12,13 * * *', $job$select public.porch_friends_digest_knock();$job$);

-- what a correct result looks like: one row, status ok, job_on is true
select 'porch step 46: ok' as status,
       exists (select 1 from cron.job where jobname = 'porch-friends-digest' and active) as job_on;

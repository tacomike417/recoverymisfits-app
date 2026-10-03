-- ============================================================
-- THE PORCH, STEP 37: A FOURTH HOUSE ACCOUNT, anotherdaysober. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: the question that ends each Another Day Sober reading, as a picture that matches
-- the reading page, "every single morning at 4 a.m.", with a link to the reading under it.
--
-- RUN THIS TWICE:
--   1. Run it. It opens the name (the name is on the taken list, because it is a page on
--      the site) and adds 4am to the timer. It will say NOT YET.
--   2. Make the account ON THE SITE: hold the Account button, Add account, tap the
--      sign-up tab, name anotherdaysober, pick a password.
--   3. Run it again. It will say ALL SET.
-- It is a beta tester with 60-second Spins. It is NOT a moderator.
-- ============================================================

do $$
declare u uuid; has_wall boolean := to_regclass('public.name_passes') is not null;
begin
  select id into u from auth.users where email = 'anotherdaysober@rm.invalid';

  if u is null then
    if has_wall then insert into name_passes values ('anotherdaysober') on conflict do nothing; end if;
    return;
  end if;

  insert into porch_testers (handle) values ('anotherdaysober') on conflict do nothing;
  if has_wall then insert into name_passes values ('another day sober') on conflict do nothing; end if;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'anotherdaysober', now(), 'Another Day Sober')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Another Day Sober';
  if has_wall then delete from name_passes where handle in ('another day sober', 'anotherdaysober'); end if;
  insert into porch_spin_long (user_id) select u where not exists (select 1 from porch_spin_long where user_id = u);
end $$;

-- ---- the timer: the same knocks as before, plus 4am Eastern (8 and 9 UTC cover summer and winter)
select cron.unschedule('porch-daily-meme') where exists (select 1 from cron.job where jobname = 'porch-daily-meme');
select cron.schedule('porch-daily-meme', '0 8,9,10,11,12,16,17,21,22 * * *', $job$
  select net.http_post(
    url := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb);
$job$);

-- ---- what a correct result looks like
select case when u.id is null
         then 'NOT YET. Make the account on the site (name: anotherdaysober), then run this again.'
         else 'ALL SET. anotherdaysober is ready.' end as status,
       m.handle, m.real_name as shows_as,
       m.verified_at is not null as can_post,
       exists (select 1 from public.porch_testers t where t.handle = 'anotherdaysober') as tester,
       (select schedule from cron.job where jobname = 'porch-daily-meme') as timer
from (select 1) x
left join auth.users u on u.email = 'anotherdaysober@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

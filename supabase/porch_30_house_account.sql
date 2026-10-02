-- ============================================================
-- THE PORCH, STEP 30: THE HOUSE ACCOUNT, recoverymisfits. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "I need one house account called Recovery Misfits, all one word ...
-- I don't have an extra email anymore, but give me full permissions."
--
-- No email needed. You run this TWICE:
--   1st run: opens the door for the name (it is on the taken list) and tells you
--            to make the account in Supabase: Authentication > Users > Add user.
--   2nd run: finds the account and gives it everything: on the Porch, confirmed
--            (can post without an email), beta tester, 60-second Spins, moderator,
--            and "Recovery Misfits" as the name on its profile.
-- The password is only ever typed by you, in Supabase. It is not in this file.
-- ============================================================

do $$
declare u uuid; has_wall boolean := to_regclass('public.name_passes') is not null;
begin
  select id into u from auth.users where email = 'recoverymisfits@rm.invalid';

  if u is null then
    if has_wall then insert into name_passes values ('recoverymisfits') on conflict do nothing; end if;
    return;
  end if;

  insert into porch_testers (handle) values ('recoverymisfits') on conflict do nothing;
  if has_wall then insert into name_passes values ('recovery misfits') on conflict do nothing; end if;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'recoverymisfits', now(), 'Recovery Misfits')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Recovery Misfits';
  if has_wall then delete from name_passes where handle in ('recovery misfits', 'recoverymisfits'); end if;
  insert into porch_spin_long (user_id) select u where not exists (select 1 from porch_spin_long where user_id = u);
  insert into porch_moderators (user_id) select u where not exists (select 1 from porch_moderators where user_id = u);
end $$;

-- ---- what a correct result looks like
select case when u.id is null
         then 'STEP 1 DONE. Now make the account: Authentication > Users > Add user > Create new user. Email: recoverymisfits@rm.invalid  Tick Auto Confirm User. Then run this again.'
         else 'ALL SET. recoverymisfits is ready.' end as status,
       m.handle, m.real_name as shows_as,
       m.verified_at is not null as can_post,
       exists (select 1 from public.porch_testers t where t.handle = 'recoverymisfits') as tester,
       exists (select 1 from public.porch_spin_long l where l.user_id = u.id) as long_spins,
       exists (select 1 from public.porch_moderators o where o.user_id = u.id) as moderator
from (select 1) x
left join auth.users u on u.email = 'recoverymisfits@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

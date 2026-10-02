-- ============================================================
-- THE PORCH, STEP 32: A SECOND HOUSE ACCOUNT, spiritual_misfit. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "start another house account called like spiritual misfit ... I don't want
-- to turn anybody away that might not believe in God ... if it's coming from the
-- house account, it looks like we started a religion here."
--
-- The daily prayer posts from here, not from recoverymisfits. Anybody who doesn't
-- want it can Mute this one account.
-- FIRST make the account in Supabase: Authentication > Users > Add user >
-- Create new user. Email: spiritual_misfit@rm.invalid  Tick Auto Confirm User.
-- THEN run this. It can post without an email, is a beta tester, and has
-- 60-second Spins. It is NOT a moderator.
-- ============================================================

do $$
declare u uuid;
begin
  select id into u from auth.users where email = 'spiritual_misfit@rm.invalid';
  if u is null then return; end if;
  insert into porch_testers (handle) values ('spiritual_misfit') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'spiritual_misfit', now(), 'Spiritual Misfit')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Spiritual Misfit';
  insert into porch_spin_long (user_id) select u where not exists (select 1 from porch_spin_long where user_id = u);
end $$;

-- ---- what a correct result looks like
select case when u.id is null
         then 'NOT YET. Make the account first: Authentication > Users > Add user. Email: spiritual_misfit@rm.invalid  Then run this again.'
         else 'ALL SET. spiritual_misfit is ready.' end as status,
       m.handle, m.real_name as shows_as,
       m.verified_at is not null as can_post,
       exists (select 1 from public.porch_testers t where t.handle = 'spiritual_misfit') as tester,
       exists (select 1 from public.porch_spin_long l where l.user_id = u.id) as long_spins
from (select 1) x
left join auth.users u on u.email = 'spiritual_misfit@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

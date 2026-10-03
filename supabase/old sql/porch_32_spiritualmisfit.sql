-- ============================================================
-- THE PORCH, STEP 32: A SECOND HOUSE ACCOUNT, spiritualmisfit. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "start another house account called like spiritual misfit ... I don't want
-- to turn anybody away that might not believe in God ... if it's coming from the
-- house account, it looks like we started a religion here."
--
-- The daily prayer posts from here, not from recoverymisfits. Anybody who doesn't
-- want it can Mute this one account.
-- FIRST make the account in Supabase: Authentication > Users > Add user >
-- Create new user. Email: spiritualmisfit@rm.invalid  Tick Auto Confirm User.
-- THEN run this. It can post without an email, is a beta tester, and has
-- 60-second Spins. It is NOT a moderator.
-- ============================================================

-- FIRST: the account got made as spiritualmisfit@rminvalid.com (wrong ending), so the
-- site could never find it. This fixes the spelling in place. No deleting, no dashboard.
do $$
begin
  if not exists (select 1 from auth.users where email = 'spiritualmisfit@rm.invalid') then
    update auth.users set email = 'spiritualmisfit@rm.invalid'
    where email in ('spiritualmisfit@rminvalid.com', 'spiritual_misfit@rm.invalid', 'spiritual_misfit@rminvalid.com', 'spiritualmisfit@rm.invalid.com');
  end if;
  if to_regclass('auth.identities') is not null then
    begin
      execute $q$update auth.identities set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb('spiritualmisfit@rm.invalid'::text))
               where user_id = (select id from auth.users where email = 'spiritualmisfit@rm.invalid') and provider = 'email'$q$;
    exception when others then null; end;
  end if;
end $$;

do $$
declare u uuid;
begin
  select id into u from auth.users where email = 'spiritualmisfit@rm.invalid';
  if u is null then return; end if;
  insert into porch_testers (handle) values ('spiritualmisfit') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'spiritualmisfit', now(), 'Spiritual Misfit')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Spiritual Misfit';
  insert into porch_spin_long (user_id) select u where not exists (select 1 from porch_spin_long where user_id = u);
end $$;

-- ---- what a correct result looks like
select case when u.id is null
         then 'NOT YET. Make the account first: Authentication > Users > Add user. Email: spiritualmisfit@rm.invalid  Then run this again.'
         else 'ALL SET. spiritualmisfit is ready.' end as status,
       m.handle, m.real_name as shows_as,
       m.verified_at is not null as can_post,
       exists (select 1 from public.porch_testers t where t.handle = 'spiritualmisfit') as tester,
       exists (select 1 from public.porch_spin_long l where l.user_id = u.id) as long_spins
from (select 1) x
left join auth.users u on u.email = 'spiritualmisfit@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

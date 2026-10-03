-- ============================================================
-- THE PORCH, STEP 36: A THIRD HOUSE ACCOUNT, shitmysponsorsays. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "another batch coming. It's called Shit My Sponsor Says. And I need to make an
-- account for it."
--
-- FIRST make the account ON THE SITE, the normal way (no Supabase screens): hold the
-- Account button, Add account, tap the sign-up tab, name shitmysponsorsays, pick a
-- password. THEN run this. It lets the account post without an email, makes it a beta
-- tester with 60-second Spins, and puts "Shit My Sponsor Says" on its profile.
-- It is NOT a moderator.
-- ============================================================

do $$
declare u uuid;
begin
  select id into u from auth.users where email = 'shitmysponsorsays@rm.invalid';
  if u is null then return; end if;
  insert into porch_testers (handle) values ('shitmysponsorsays') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'shitmysponsorsays', now(), 'Shit My Sponsor Says')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Shit My Sponsor Says';
  insert into porch_spin_long (user_id) select u where not exists (select 1 from porch_spin_long where user_id = u);
end $$;

-- ---- what a correct result looks like
select case when u.id is null
         then 'NOT YET. Make the account on the site first (name: shitmysponsorsays), then run this again.'
         else 'ALL SET. shitmysponsorsays is ready.' end as status,
       m.handle, m.real_name as shows_as,
       m.verified_at is not null as can_post,
       exists (select 1 from public.porch_testers t where t.handle = 'shitmysponsorsays') as tester,
       exists (select 1 from public.porch_spin_long l where l.user_id = u.id) as long_spins
from (select 1) x
left join auth.users u on u.email = 'shitmysponsorsays@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

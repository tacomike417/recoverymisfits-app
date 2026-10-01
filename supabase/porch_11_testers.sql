-- ============================================================
-- THE PORCH, STEP 11: TESTERS. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- So Mike can test with a second account of his own right now:
-- * Testers (by username) skip the 3-day wait for brand-new accounts,
--   for posting, commenting, reacting, friending and messaging.
-- * Everything else still applies to them (confirm email, filters, blocks).
-- * Take somebody off the list any time: delete from porch_testers where handle = '...';
-- ============================================================
create table if not exists public.porch_testers (handle text primary key);
alter table public.porch_testers enable row level security;
revoke all on public.porch_testers from anon, authenticated;

insert into public.porch_testers (handle) values ('tacomike417'), ('misfit_tester')
on conflict do nothing;

create or replace function public.porch_can_act(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.porch_verified(p)
     and (exists (select 1 from auth.users u where u.id = p and u.created_at < now() - interval '3 days')
          or exists (select 1 from porch_members m join porch_testers t on t.handle = m.handle where m.user_id = p)
          or exists (select 1 from porch_moderators d where d.user_id = p));
$$;

select 'porch step 11: ok' as status, (select string_agg(handle, ', ') from public.porch_testers) as testers;

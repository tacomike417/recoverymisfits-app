-- ============================================================
-- THE PORCH, STEP 15: BETA TESTERS POST WITHOUT CONFIRMING AN EMAIL. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- (Has everything step 14 had too, so it's fine whether step 14 ran or not.)
--
-- Mike: "give all beta testers full access to post without confirmation,
-- I'm trying to make it easy on them."
-- * Every tester's name card is marked confirmed, so they can post, comment,
--   message and make Spins right away.
-- * A tester added later gets the same thing the first time they open the Porch.
-- * Everybody else still confirms an email once (one email = one person).
-- ============================================================

create or replace function public.porch_join()
returns void language plpgsql security definer set search_path = public as $$
declare h text; t boolean;
begin
  if auth.uid() is null then return; end if;
  select lower(split_part(email, '@', 1)) into h from auth.users where id = auth.uid();
  if h is null or h !~ '^[a-z0-9._-]{3,32}$' then return; end if;
  t := exists (select 1 from porch_testers where handle = h);
  insert into porch_members (user_id, handle, verified_at)
  values (auth.uid(), h, case when t then now() end)
  on conflict (user_id) do update
    set verified_at = coalesce(porch_members.verified_at, excluded.verified_at);
end $$;
grant execute on function public.porch_join() to authenticated;

-- name cards for anybody with a friend, a friend request or a tester spot (from step 14)
insert into public.porch_members (user_id, handle)
select u.id, lower(split_part(u.email, '@', 1))
from auth.users u
where u.email like '%@rm.invalid'
  and lower(split_part(u.email, '@', 1)) ~ '^[a-z0-9._-]{3,32}$'
  and not exists (select 1 from public.porch_members m where m.user_id = u.id)
  and (exists (select 1 from public.porch_friends f where f.a = u.id or f.b = u.id)
       or exists (select 1 from public.porch_friend_requests r where r.from_id = u.id or r.to_id = u.id)
       or exists (select 1 from public.porch_testers t where t.handle = lower(split_part(u.email, '@', 1))))
on conflict do nothing;

-- testers: confirmed now
update public.porch_members m set verified_at = now()
where m.verified_at is null and exists (select 1 from public.porch_testers t where t.handle = m.handle);

select m.handle, case when m.verified_at is null then 'NOT confirmed' else 'can post ✓' end as status
from public.porch_members m join public.porch_testers t on t.handle = m.handle
order by m.handle;

-- ============================================================
-- THE PORCH, STEP 14: EVERYBODY ON THE PORCH HAS THEIR NAME. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "krazyk226, fire_l0ve and I are all friends but you'd never know it.
-- Messages just says misfit and I couldn't find them when I looked them up."
--
-- Why: a Porch name card (porch_members) only got made when somebody confirmed
-- an email. Friends who hadn't done that yet had no card, so the Porch showed
-- "misfit" and search couldn't find them.
-- Fix:
-- * porch_join(): the Porch calls this when you open it; it makes your name
--   card from your app username if you don't have one yet. Confirming an email
--   is still what lets you post; this is only your name and face.
-- * Everybody who already has a friend on the Porch gets their card now.
-- ============================================================

create or replace function public.porch_join()
returns void language plpgsql security definer set search_path = public as $$
declare h text;
begin
  if auth.uid() is null then return; end if;
  if exists (select 1 from porch_members where user_id = auth.uid()) then return; end if;
  select lower(split_part(email, '@', 1)) into h from auth.users where id = auth.uid();
  if h is null or h !~ '^[a-z0-9._-]{3,32}$' then return; end if;
  insert into porch_members (user_id, handle) values (auth.uid(), h)
  on conflict do nothing;
end $$;
grant execute on function public.porch_join() to authenticated;

-- backfill: anybody with a friend, a friend request or a tester spot gets their name card
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

-- what it did: every tester should show their name
select m.handle, case when m.verified_at is null then 'name card ok (email not confirmed yet)' else 'name card ok, confirmed' end as status
from public.porch_members m join public.porch_testers t on t.handle = m.handle
order by m.handle;

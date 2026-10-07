-- ============================================================
-- THE PORCH, STEP 67: NO MORE 3-DAY WAIT FOR NEW ACCOUNTS. 7 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "we might want to lift that 3 day posting ban. that's pretty rough
-- stuff ... i'd just let them post away and let the report button do the work."
--
-- porch_can_act() is the rule the database checks before a heart, a friend
-- request, a Respin and the like. It used to say: confirmed email AND the
-- account is 3 days old (testers and moderators skipped the wait).
-- Now it says: confirmed email. That is all.
--
-- Nothing else changes. One confirmed email per person, the hourly limits
-- and the report button all still stand.
-- ============================================================

create or replace function public.porch_can_act(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.porch_verified(p);
$$;

select 'ok: new accounts can post right away' as result;

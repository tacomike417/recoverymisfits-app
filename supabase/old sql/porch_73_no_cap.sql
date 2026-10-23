-- ============================================================
-- THE PORCH, STEP 73: NO CAP ON THE BETA DOOR. 17 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "remove the cap. That'll end that." The "You" button now walks anybody with an
-- account into the Porch through the beta door, so the 25-tester cap from
-- porch_28_beta_door.sql would have quietly stopped people from posting. The door stays
-- open and uncapped; the off switch still works (update porch_beta set open = false).
-- ============================================================

update public.porch_beta set cap = 1000000 where id;

-- check: cap should read 1000000, door_open true
select (select open from public.porch_beta) as door_open,
       (select cap from public.porch_beta) as cap,
       (select count(*) from public.porch_testers) as testers_now;

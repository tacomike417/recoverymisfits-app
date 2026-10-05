-- ============================================================
-- THE PORCH, STEP 59: THE SHARE DESK GETS A YOUTUBE TICK. 5 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- The share desk could only remember Instagram and Facebook. This lets it remember
-- "I put this one on YouTube" too. Nothing already ticked changes.
-- ============================================================
do $$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.porch_share_desk'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%instagram%'
  loop execute format('alter table public.porch_share_desk drop constraint %I', c); end loop;
  alter table public.porch_share_desk add constraint porch_share_desk_place_check
    check (place in ('instagram', 'facebook', 'youtube', 'skip'));
end $$;

-- A correct result: one row that says 'porch step 59: ok'.
select 'porch step 59: ok' as status, (select count(*) from public.porch_share_desk) as ticks_so_far;

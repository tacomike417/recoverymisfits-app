-- ============================================================
-- THE PORCH, STEP 25: A NAME ON YOUR PROFILE (IF YOU WANT ONE). 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "I want people to be able to add their name if they want... Mike N. for
-- example, to show them that is ok, they don't have to use their full name."
--
-- * Optional. Empty unless somebody types one. 40 letters at most.
-- * Shows on their profile under their Porch name, to whoever can already see
--   that profile. Nothing else changes.
-- ============================================================

alter table public.porch_members add column if not exists real_name text;
alter table public.porch_members drop constraint if exists porch_members_real_name_len;
alter table public.porch_members add constraint porch_members_real_name_len check (real_name is null or char_length(real_name) <= 40);
grant update (real_name) on public.porch_members to authenticated;

-- check: should say ready
select 'profile name ready' as status, (select count(*) from public.porch_members where real_name is not null) as names_so_far;

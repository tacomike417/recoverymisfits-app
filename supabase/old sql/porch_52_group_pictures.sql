-- ============================================================
-- THE PORCH, STEP 52: GROUP PICTURES. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "i have no idea how to change the images for a group." There was no way: every
-- group got a colored square. Now a group can have its own picture and banner, and its
-- keepers change them from the group page (the porch function checks who is asking).
--
-- This adds the place to keep the picture (the banner column was already there), and puts
-- the SOBER RIOT art on the group and on the soberriot profile.
-- ============================================================

alter table public.porch_groups add column if not exists avatar_path text;

update public.porch_groups
   set avatar_path = '/assets/house/soberriot/avatar.webp', cover_path = '/assets/house/soberriot/cover.webp'
 where slug = 'sober-riot';

update public.porch_members
   set avatar_path = '/assets/house/soberriot/avatar.webp', cover_path = '/assets/house/soberriot/cover.webp'
 where lower(handle) = 'soberriot';

-- A correct result: one row, status 'group pictures: ok', and both say true.
select 'group pictures: ok' as status,
       exists (select 1 from public.porch_groups where slug = 'sober-riot' and avatar_path is not null and cover_path is not null) as group_has_art,
       exists (select 1 from public.porch_members where lower(handle) = 'soberriot' and avatar_path is not null and cover_path is not null) as profile_has_art;

-- ============================================================
-- THE PORCH, STEP 45: A RESHARE WITH NO WORDS GOES THROUGH. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "tried to share a spiritual misfit post on the porch and it didn't go through."
-- The rule on shares said "words, or a photo, or a Spin". A reshare with nothing typed
-- has none of the three, so the database turned it away. Now a reshare counts too.
-- ============================================================

alter table public.porch_posts drop constraint if exists porch_posts_check;
alter table public.porch_posts add constraint porch_posts_check
  check (coalesce(char_length(body), 0) > 0 or cardinality(photo_paths) > 0 or need = 'moment' or reshare_of is not null);

-- what a correct result looks like: one row, status ok
select 'porch step 45: ok' as status;

-- ============================================================
-- THE PORCH, STEP 40: THE HOUSE ACCOUNTS ARE PUBLIC. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "we'll make all the house accounts public so they can at least see some stuff."
-- Somebody who isn't signed in only sees shares from Public profiles. Everybody else starts
-- as Members only, so without this a stranger's first look at the Porch is an empty page.
-- This only changes the four house accounts. Nobody else's setting is touched.
-- ============================================================

update public.porch_members set visibility = 'public'
where handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober');

-- ---- what a correct result looks like: four rows, every one says public
select handle, real_name as shows_as, visibility
from public.porch_members
where handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober')
order by handle;

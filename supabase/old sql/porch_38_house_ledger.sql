-- ============================================================
-- THE PORCH, STEP 38: THE HOUSE ACCOUNTS' LEDGER. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "the one I edited ... it shot out the original one from yesterday."
-- The daily jobs used to check "did this one go up yet?" by looking for a share with the
-- same words. Edit the words and it looked like it never went up, so it went up again.
-- This is a plain list of what each house account has already put up. The jobs write to
-- it and go by it, so editing or deleting a house share never brings it back.
-- Nobody can read or change it from the app.
-- ============================================================

create table if not exists public.porch_house_posted (
  handle text not null,
  list   text not null,
  key    text not null,
  at     timestamptz not null default now(),
  primary key (handle, list, key)
);
alter table public.porch_house_posted enable row level security;
revoke all on public.porch_house_posted from anon, authenticated;

-- ---- what a correct result looks like: one row that says READY
select 'READY. The ledger is in place.' as status, count(*) as written_down_so_far from public.porch_house_posted;

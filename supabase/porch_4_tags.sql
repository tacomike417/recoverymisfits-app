-- ============================================================
-- THE PORCH, STEP 4: the tags become Experience, Strength, Hope and A question.
-- 30 Sep 2026. Mike: keep the Porch positive, not a poor-me fest.
-- Old "win" and "hard" shares stay allowed so nothing already posted breaks;
-- the app just stops offering them.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- ============================================================
alter table public.porch_posts drop constraint if exists porch_posts_need_check;
alter table public.porch_posts add constraint porch_posts_need_check
  check (need in ('talk','experience','strength','hope','question','win','hard','moment'));

select 'porch step 4: ok' as status;

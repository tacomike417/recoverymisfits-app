-- ============================================================
-- THE PORCH, STEP 13: THE BETA TESTERS. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "tacomike417, fire_l0ve, and krazyk226 -- we are all the beta testers,
-- make us all friends on the app."
-- * fire_l0ve and krazyk226 join the tester list (no 3-day wait for new accounts).
-- * All the testers become friends with each other (misfit_tester too, it's
--   Mike's second account).
-- * The Porch page itself only opens for these names (that's in feed/porch.html);
--   everybody else sees "coming at the end of October".
-- ============================================================

-- fix a typo from the first version of this step (it said kraxyk226)
delete from public.porch_testers where handle = 'kraxyk226';

insert into public.porch_testers (handle) values
  ('tacomike417'), ('misfit_tester'), ('fire_l0ve'), ('krazyk226')
on conflict do nothing;

-- app accounts are "<username>@rm.invalid" behind the scenes
with t as (
  select u.id from auth.users u
  where lower(u.email) in ('tacomike417@rm.invalid', 'misfit_tester@rm.invalid',
                           'fire_l0ve@rm.invalid', 'krazyk226@rm.invalid')
)
insert into public.porch_friends (a, b)
select x.id, y.id from t x join t y on x.id < y.id
on conflict do nothing;

-- clear any friend requests between them, they're friends now
delete from public.porch_friend_requests r
using auth.users f, auth.users o
where f.id = r.from_id and o.id = r.to_id
  and lower(f.email) in ('tacomike417@rm.invalid', 'misfit_tester@rm.invalid', 'fire_l0ve@rm.invalid', 'krazyk226@rm.invalid')
  and lower(o.email) in ('tacomike417@rm.invalid', 'misfit_tester@rm.invalid', 'fire_l0ve@rm.invalid', 'krazyk226@rm.invalid');

-- what it found: every tester should say "has an account"
select split_part(e, '@', 1) as tester,
       case when u.id is null then 'NO ACCOUNT YET -- sign up in the app, then run this again'
            else 'has an account' end as status
from unnest(array['tacomike417@rm.invalid', 'misfit_tester@rm.invalid', 'fire_l0ve@rm.invalid', 'krazyk226@rm.invalid']) e
left join auth.users u on lower(u.email) = e;

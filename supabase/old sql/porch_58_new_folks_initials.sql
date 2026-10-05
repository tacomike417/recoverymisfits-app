-- ============================================================
-- THE PORCH, STEP 58: NEW FOLKS SHOW WITH OR WITHOUT A PICTURE. 5 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: a buddy signed up and "I can't even find him on the site." The Welcome our new
-- folks row only showed people with a profile picture. Now everybody who joined in the
-- last 14 days shows; no picture means their initials. Everything else is the same.
-- ============================================================
create or replace function public.porch_new_folks()
returns table (user_id uuid, handle text, avatar_path text, real_name text, post_id uuid)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.handle, m.avatar_path, m.real_name,
         (select p.id from porch_posts p
           where p.user_id = m.user_id and p.hidden_at is null and p.group_id is null
           order by p.created_at limit 1)
  from porch_members m
  where m.created_at > now() - interval '14 days'
    and m.verified_at is not null                                -- a full Porch member (Level 2)
    and m.frozen_at is null and m.away_at is null
    and m.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and (auth.uid() is not null or m.visibility = 'public')      -- a stranger only sees Public profiles
    and not public.porch_house(m.user_id)
    and not public.porch_blocked(auth.uid(), m.user_id)
  order by m.created_at desc
  limit 20;
$$;
revoke all on function public.porch_new_folks() from public;
grant execute on function public.porch_new_folks() to anon, authenticated;

-- ---- what a correct result looks like: one row. on_the_row is how many new people show now.
select 'porch step 58: ok' as status,
       (select count(*) from public.porch_members m
         where m.created_at > now() - interval '14 days' and not public.porch_house(m.user_id)
           and m.verified_at is not null and m.frozen_at is null and m.away_at is null) as on_the_row;

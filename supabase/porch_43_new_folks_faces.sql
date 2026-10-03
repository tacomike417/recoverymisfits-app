-- ============================================================
-- THE PORCH, STEP 43: THE NEW FOLKS RAIL SHOWS FACES ONLY. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "in there I think it should be level 2 accounts only who have uploaded a profile
-- picture."
--
-- "Welcome our new folks" now only shows somebody who (1) is a full Porch member, meaning
-- they confirmed and can post, and (2) has put up a profile picture. Everything else about
-- the rail is the same: the last 14 days, newest first, never the house accounts, never
-- somebody on a break, and a stranger still only sees Public profiles.
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
    and coalesce(m.avatar_path, '') <> ''                        -- with a profile picture
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

-- ---- what a correct result looks like: one row. with_a_picture is who can show on the rail.
select 'porch step 43: ok' as status,
       (select count(*) from public.porch_members m
         where m.created_at > now() - interval '14 days' and not public.porch_house(m.user_id)) as joined_in_14_days,
       (select count(*) from public.porch_members m
         where m.created_at > now() - interval '14 days' and not public.porch_house(m.user_id)
           and m.verified_at is not null and coalesce(m.avatar_path, '') <> ''
           and m.frozen_at is null and m.away_at is null) as with_a_picture;

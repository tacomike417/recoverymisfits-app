-- ============================================================
-- THE PORCH, STEP 61: OUTSIDERS CAN'T NOSE AROUND. 5 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "On the site everything is fair game if you have the level 2 account. What I don't
-- want is outsiders to be able to nose around."
--
-- Until now any account could read the whole Porch, and an account is just a name and a
-- password. Now reading what members share takes a confirmed email (Level 2). An account
-- with no confirmed email sees exactly what somebody who isn't signed in sees: the house
-- accounts and anybody who chose Public. Nothing else.
--
-- These rules sit ON TOP of the ones already there (the same way "on a break" does), so
-- blocks, breaks, hidden posts and groups all keep working. Nobody's settings change.
-- ============================================================

create or replace function public.porch_reader(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select viewer is null                       -- not signed in: the older rules already keep them to Public
      or viewer = owner                       -- your own things, always
      or public.porch_verified(viewer)        -- confirmed an email: a full member
      or public.porch_is_mod(viewer)
      or public.porch_is_public(owner);       -- the house accounts, and anybody who chose Public
$$;
revoke all on function public.porch_reader(uuid, uuid) from public;
grant execute on function public.porch_reader(uuid, uuid) to anon, authenticated;

drop policy if exists "confirmed members read" on public.porch_members;
create policy "confirmed members read" on public.porch_members as restrictive for select
  using (public.porch_reader(auth.uid(), user_id));

drop policy if exists "confirmed members read" on public.porch_posts;
create policy "confirmed members read" on public.porch_posts as restrictive for select
  using (public.porch_reader(auth.uid(), user_id));

drop policy if exists "confirmed members read" on public.porch_comments;
create policy "confirmed members read" on public.porch_comments as restrictive for select
  using (public.porch_reader(auth.uid(), user_id));

drop policy if exists "confirmed members read" on public.porch_spins;
create policy "confirmed members read" on public.porch_spins as restrictive for select
  using (public.porch_reader(auth.uid(), user_id));

-- who loved, respun or hearted what: it maps who is active, so confirmed members only (and your own)
drop policy if exists "confirmed members read" on public.porch_reactions;
create policy "confirmed members read" on public.porch_reactions as restrictive for select
  using (auth.uid() = user_id or public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()));

drop policy if exists "confirmed members read" on public.porch_respins;
create policy "confirmed members read" on public.porch_respins as restrictive for select
  using (auth.uid() = user_id or public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()));

drop policy if exists "confirmed members read" on public.porch_comment_hearts;
create policy "confirmed members read" on public.porch_comment_hearts as restrictive for select
  using (auth.uid() = user_id or public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()));

-- ---------- the two rows of faces: same rule ----------
-- "Welcome our new folks" (step 58, one line changed: signed in is no longer enough)
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
    and (public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()) or m.visibility = 'public')   -- anybody else only sees Public profiles
    and not public.porch_house(m.user_id)
    and not public.porch_blocked(auth.uid(), m.user_id)
  order by m.created_at desc
  limit 20;
$$;
revoke all on function public.porch_new_folks() from public;
grant execute on function public.porch_new_folks() to anon, authenticated;

-- "Most active" (step 39, one line added)
create or replace function public.porch_most_active()
returns table (user_id uuid, handle text, avatar_path text, bio text)
language sql stable security definer set search_path = public as $$
  with acts as (
    select p.user_id from porch_posts p where p.created_at > now() - interval '14 days' and p.hidden_at is null
    union all
    select c.user_id from porch_comments c where c.created_at > now() - interval '14 days' and c.hidden_at is null
  )
  select m.user_id, m.handle, m.avatar_path, m.bio
  from acts a join porch_members m on m.user_id = a.user_id
  where a.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and m.verified_at is not null and m.frozen_at is null and m.away_at is null
    and (public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()) or m.visibility = 'public')
    and not public.porch_blocked(auth.uid(), a.user_id)
  group by m.user_id, m.handle, m.avatar_path, m.bio
  order by count(*) desc, m.handle
  limit 15;
$$;
revoke execute on function public.porch_most_active() from public, anon;
grant execute on function public.porch_most_active() to authenticated;

-- ---- what a correct result looks like: one row.
--   rules_on         = 7   (one new rule on each of the seven tables)
--   confirmed_now    = how many members have a confirmed email today (they see everything, same as before)
--   not_confirmed    = how many accounts are on the Porch list WITHOUT one (these now see house + Public only)
select 'porch step 61: ok' as status,
       (select count(*) from pg_policies where schemaname = 'public' and policyname = 'confirmed members read') as rules_on,
       (select count(*) from public.porch_members where verified_at is not null) as confirmed_now,
       (select count(*) from public.porch_members where verified_at is null) as not_confirmed;

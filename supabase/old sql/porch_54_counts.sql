-- ============================================================
-- THE PORCH, STEP 54: THE NUMBERS. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "we have to put views in on these reels, follower count, heart count, reshare
-- count etc on these posts, its what makes social media social media ... do the most
-- liberal counting method." Every number here is something that really happened:
--   VIEWS on a Spin   every time it plays, and every time it loops, by anybody (signed in
--                     or not, the person who made it too). No "once per person".
--   HEARTS, RESHARES  how many there are on a share.
--   FRIENDS           how many friends somebody has (the list itself stays private).
-- Nothing is multiplied and nothing is made up.
-- ============================================================

alter table public.porch_spins add column if not exists views bigint not null default 0;

-- one play (or one loop) of a Spin
create or replace function public.porch_spin_view(p_spin uuid)
returns void language sql security definer set search_path = public as $$
  update porch_spins set views = views + 1 where id = p_spin and status = 'ready';
$$;
revoke all on function public.porch_spin_view(uuid) from public;
grant execute on function public.porch_spin_view(uuid) to anon, authenticated;

-- hearts and reshares for a handful of shares (only ones this person can see)
create or replace function public.porch_post_counts(p_ids uuid[])
returns table (post_id uuid, hearts bigint, reshares bigint)
language sql stable security definer set search_path = public as $$
  select p.id,
         (select count(*) from porch_reactions r where r.post_id = p.id and r.kind = 'proud'),
         (select count(*) from porch_posts s where s.reshare_of = p.id and s.hidden_at is null)
    from porch_posts p
   where p.id = any (p_ids[1:120]) and p.hidden_at is null and public.porch_post_ok(p.id, auth.uid());
$$;
revoke all on function public.porch_post_counts(uuid[]) from public;
grant execute on function public.porch_post_counts(uuid[]) to anon, authenticated;

-- how many friends (a number only; who they are stays private)
create or replace function public.porch_friend_count(p_user uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from porch_friends where a = p_user or b = p_user;
$$;
revoke all on function public.porch_friend_count(uuid) from public;
grant execute on function public.porch_friend_count(uuid) to anon, authenticated;

-- A correct result: one row, status 'counts: ok'.
select 'counts: ok' as status, (select count(*) from public.porch_spins) as spins, (select coalesce(sum(views), 0) from public.porch_spins) as views_so_far;

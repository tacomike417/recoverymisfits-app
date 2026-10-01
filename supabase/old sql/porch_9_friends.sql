-- ============================================================
-- THE PORCH, STEP 9: FRIENDS instead of follows. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- The Facebook way, because that's what our people know:
--   Add Friend -> they Confirm (or Delete) -> you're Friends.
-- * It's mutual. Nobody is "followed" by a stranger.
-- * No friend counts anywhere (no ego stuff). You see your own friends list only.
-- * Blocking somebody ends the friendship and any request, both ways.
-- * Alerts: "sent you a friend request", "accepted your friend request".
-- * Anybody who already followed each other both ways becomes Friends.
-- ============================================================

-- ---------- requests ----------
create table if not exists public.porch_friend_requests (
  from_id    uuid not null references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
create index if not exists porch_friend_requests_to on public.porch_friend_requests (to_id);
alter table public.porch_friend_requests enable row level security;

drop policy if exists "see requests you sent or got" on public.porch_friend_requests;
create policy "see requests you sent or got" on public.porch_friend_requests for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);
drop policy if exists "send a friend request" on public.porch_friend_requests;
create policy "send a friend request" on public.porch_friend_requests for insert to authenticated
  with check (auth.uid() = from_id and public.porch_can_act(auth.uid())
              and not public.porch_blocked(from_id, to_id)
              and exists (select 1 from public.porch_members m where m.user_id = to_id and m.verified_at is not null));
drop policy if exists "cancel or delete a request" on public.porch_friend_requests;
create policy "cancel or delete a request" on public.porch_friend_requests for delete to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

-- ---------- friends (one row per pair, smaller id first) ----------
create table if not exists public.porch_friends (
  a          uuid not null references auth.users(id) on delete cascade,
  b          uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists porch_friends_b on public.porch_friends (b);
alter table public.porch_friends enable row level security;

drop policy if exists "see your own friends" on public.porch_friends;
create policy "see your own friends" on public.porch_friends for select to authenticated
  using (auth.uid() = a or auth.uid() = b);
drop policy if exists "unfriend" on public.porch_friends;
create policy "unfriend" on public.porch_friends for delete to authenticated
  using (auth.uid() = a or auth.uid() = b);
revoke insert, update on public.porch_friends from anon, authenticated;   -- only Confirm makes friends

-- are these two friends? (the app and, later, Messages use this)
create or replace function public.porch_are_friends(x uuid, y uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select x is not null and y is not null and exists (select 1 from porch_friends where a = least(x, y) and b = greatest(x, y));
$$;

-- CONFIRM: only works if they really asked you
create or replace function public.porch_confirm_friend(p_from uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.porch_can_act(me) then return false; end if;
  delete from porch_friend_requests where from_id = p_from and to_id = me;
  if not found then return false; end if;
  delete from porch_friend_requests where from_id = me and to_id = p_from;
  insert into porch_friends (a, b) values (least(me, p_from), greatest(me, p_from)) on conflict do nothing;
  delete from porch_notes where user_id = me and actor_id = p_from and kind = 'friend_request';
  perform public.porch_note(p_from, me, 'friend_accept', null, null);
  return true;
end $$;
revoke all on function public.porch_confirm_friend(uuid) from anon;
grant execute on function public.porch_confirm_friend(uuid) to authenticated;

-- ---------- alerts ----------
alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept'));

create or replace function public.porch_friend_request_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- they already asked you? then this is a yes: you're friends
  if exists (select 1 from porch_friend_requests where from_id = new.to_id and to_id = new.from_id) then
    delete from porch_friend_requests where (from_id = new.to_id and to_id = new.from_id) or (from_id = new.from_id and to_id = new.to_id);
    insert into porch_friends (a, b) values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id)) on conflict do nothing;
    delete from porch_notes where user_id = new.from_id and actor_id = new.to_id and kind = 'friend_request';
    perform public.porch_note(new.to_id, new.from_id, 'friend_accept', null, null);
    return null;
  end if;
  if exists (select 1 from porch_friends where a = least(new.from_id, new.to_id) and b = greatest(new.from_id, new.to_id)) then
    delete from porch_friend_requests where from_id = new.from_id and to_id = new.to_id;
    return null;
  end if;
  perform public.porch_note(new.to_id, new.from_id, 'friend_request', null, null);
  return null;
end $$;
drop trigger if exists porch_friend_request_added on public.porch_friend_requests;
create trigger porch_friend_request_added after insert on public.porch_friend_requests
  for each row execute function public.porch_friend_request_added();

-- a cancelled or deleted request takes its alert with it
create or replace function public.porch_friend_request_gone()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from porch_notes where user_id = old.to_id and actor_id = old.from_id and kind = 'friend_request';
  return old;
end $$;
drop trigger if exists porch_friend_request_gone on public.porch_friend_requests;
create trigger porch_friend_request_gone after delete on public.porch_friend_requests
  for each row execute function public.porch_friend_request_gone();

-- spam cap: 50 friend requests an hour
create or replace function public.porch_friend_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from porch_friend_requests where from_id = new.from_id and created_at > now() - interval '1 hour') >= 50 then
    raise exception 'slow down' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists porch_friend_cap on public.porch_friend_requests;
create trigger porch_friend_cap before insert on public.porch_friend_requests
  for each row execute function public.porch_friend_cap();

-- blocking ends it, both ways
create or replace function public.porch_block_unfriends()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from porch_friends where a = least(new.blocker_id, new.blocked_id) and b = greatest(new.blocker_id, new.blocked_id);
  delete from porch_friend_requests where (from_id = new.blocker_id and to_id = new.blocked_id) or (from_id = new.blocked_id and to_id = new.blocker_id);
  return new;
end $$;
drop trigger if exists porch_block_unfriends on public.porch_blocks;
create trigger porch_block_unfriends after insert on public.porch_blocks
  for each row execute function public.porch_block_unfriends();

-- ---------- carry over: people who followed each other both ways are Friends ----------
insert into public.porch_friends (a, b)
select distinct least(f1.follower_id, f1.followed_id), greatest(f1.follower_id, f1.followed_id)
  from public.porch_follows f1
  join public.porch_follows f2 on f2.follower_id = f1.followed_id and f2.followed_id = f1.follower_id
on conflict do nothing;

select 'porch step 9: ok' as status,
       (select count(*) from public.porch_friends) as friends,
       (select count(*) from public.porch_friend_requests) as requests;

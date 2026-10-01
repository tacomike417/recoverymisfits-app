-- ============================================================
-- THE PORCH, STEP 20: GROUPS. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike's rules (1 Oct 2026):
-- * It takes TWO people to start a group: a Keeper and a Co-keeper. (Not "admin" or
--   "moderator", those lean ego. A keeper keeps the porch light on.)
-- * Starting a group is a privilege you earn: the Keeper is an ACTIVE member with 30
--   days on the Porch, and applies for the group. The Co-keeper is an active member
--   too and has to say "I'm in".
-- * "Active" (between Mike and the database; the app never shows these numbers, so
--   nobody posts junk to hit a number and it never turns into a scoreboard):
--     picture and bio filled in, 5 or more shares, 10 or more comments on other
--     people's shares, showed up on 8 or more different days in the last 30, not
--     paused, and nothing of theirs taken down in the last 30 days.
--   Hearts don't count. Moderators skip the test (Mike seeds the first groups).
-- * Then Mike (a moderator) approves EVERY group before it opens. "No self-centered
--   crazy groups." The Friday night home group, the meeting after the meeting: fine.
-- * A group nobody shares in for 90 days closes. Heads-up to the keepers at 75 days.
--   Closed is not erased.
-- * No sober-date rule. Sober dates stay private.
--
-- How it's kept safe:
-- * What's shared in a group is seen ONLY by its members, for both kinds of group
--   ("open" = join right away, "ask" = a keeper says yes first).
-- * Who's in a group is seen only by its members.
-- * Moderators can look in on any group (that's how Mike keeps them honest). The
--   group page and the privacy page say so.
-- * Nobody writes to these tables directly. Everything goes through the functions
--   below, which check who's asking.
-- ============================================================

-- ---------- tables ----------
create table if not exists public.porch_groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 3 and 40),
  about         text not null default '' check (char_length(about) <= 200),
  who_for       text not null default '' check (char_length(who_for) <= 120),
  kind          text not null default 'open' check (kind in ('open', 'ask')),
  cover_path    text,
  keeper_id     uuid references auth.users(id) on delete set null,
  cokeeper_id   uuid references auth.users(id) on delete set null,
  status        text not null default 'waiting_cokeeper'
                check (status in ('waiting_cokeeper', 'waiting_review', 'open', 'declined', 'closed')),
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  last_share_at timestamptz,
  warned_at     timestamptz,
  closed_at     timestamptz
);
-- one live group per name
create unique index if not exists porch_groups_name on public.porch_groups (lower(btrim(name)))
  where status in ('waiting_cokeeper', 'waiting_review', 'open');
alter table public.porch_groups enable row level security;

create table if not exists public.porch_group_members (
  group_id  uuid not null references public.porch_groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists porch_group_members_user on public.porch_group_members (user_id);
alter table public.porch_group_members enable row level security;

create table if not exists public.porch_group_asks (
  group_id   uuid not null references public.porch_groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.porch_group_asks enable row level security;

-- a share can belong to a group. Deleting a group deletes its shares (never set null:
-- that would turn private shares public).
alter table public.porch_posts add column if not exists group_id uuid references public.porch_groups(id) on delete cascade;
create index if not exists porch_posts_group on public.porch_posts (group_id, created_at desc) where group_id is not null;

-- ---------- helpers ----------
create or replace function public.porch_is_mod(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_moderators where user_id = p);
$$;

-- in the group, and the group is open
create or replace function public.porch_in_group(g uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select g is not null and u is not null and exists (
    select 1 from porch_group_members m join porch_groups gr on gr.id = m.group_id
     where m.group_id = g and m.user_id = u and gr.status = 'open');
$$;

create or replace function public.porch_is_keeper(g uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_groups where id = g and u is not null and (keeper_id = u or cokeeper_id = u));
$$;

-- may this person see this share (and so its comments)? Not in a group = yes.
create or replace function public.porch_post_ok(p uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select group_id is null or public.porch_in_group(group_id, u) or public.porch_is_mod(u) from porch_posts where id = p), true);
$$;
grant execute on function public.porch_is_mod(uuid), public.porch_in_group(uuid, uuid),
  public.porch_is_keeper(uuid, uuid), public.porch_post_ok(uuid, uuid) to anon, authenticated;

-- an ACTIVE member (see the top of this file). Numbers live here and nowhere else.
create or replace function public.porch_active(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members m
                  where m.user_id = u and m.verified_at is not null and m.frozen_at is null
                    and m.avatar_path is not null and char_length(btrim(coalesce(m.bio, ''))) > 0)
     and (select count(*) from porch_posts p where p.user_id = u and p.hidden_at is null) >= 5
     and (select count(*) from porch_comments c join porch_posts p on p.id = c.post_id
           where c.user_id = u and c.hidden_at is null and p.user_id <> u) >= 10
     and (select count(distinct d) from (
            select (created_at at time zone 'utc')::date d from porch_posts where user_id = u and created_at > now() - interval '30 days'
            union
            select (created_at at time zone 'utc')::date from porch_comments where user_id = u and created_at > now() - interval '30 days') x) >= 8
     and not exists (select 1 from porch_posts where user_id = u and hidden_at > now() - interval '30 days')
     and not exists (select 1 from porch_comments where user_id = u and hidden_at > now() - interval '30 days');
$$;
revoke all on function public.porch_active(uuid) from public, anon, authenticated;

-- can I apply to start a group right now? (the app shows Apply, or a kind "keep showing up")
create or replace function public.porch_group_can_start()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (public.porch_is_mod(auth.uid())
    or (public.porch_active(auth.uid())
        and exists (select 1 from porch_members where user_id = auth.uid() and created_at <= now() - interval '30 days')));
$$;

-- for the moderator's approval screen only: who's asking, and how they've shown up
create or replace function public.porch_group_facts(p_group uuid)
returns table (role text, user_id uuid, handle text, avatar_path text, days_here int, shares bigint, comments bigint, days_active_30 bigint)
language sql stable security definer set search_path = public as $$
  select k.role, m.user_id, m.handle, m.avatar_path,
         floor(extract(epoch from now() - m.created_at) / 86400)::int,
         (select count(*) from porch_posts p where p.user_id = m.user_id and p.hidden_at is null),
         (select count(*) from porch_comments c where c.user_id = m.user_id and c.hidden_at is null),
         (select count(distinct d) from (
            select (created_at at time zone 'utc')::date d from porch_posts where user_id = m.user_id and created_at > now() - interval '30 days'
            union
            select (created_at at time zone 'utc')::date from porch_comments where user_id = m.user_id and created_at > now() - interval '30 days') x)
  from porch_groups g
  cross join lateral (values ('keeper', g.keeper_id), ('cokeeper', g.cokeeper_id)) k(role, uid)
  join porch_members m on m.user_id = k.uid
  where g.id = p_group and public.porch_is_mod(auth.uid());
$$;

-- ---------- who can read what ----------
revoke all on public.porch_groups, public.porch_group_members, public.porch_group_asks from anon, authenticated;
grant select on public.porch_groups, public.porch_group_members, public.porch_group_asks to authenticated;

drop policy if exists "see groups" on public.porch_groups;
create policy "see groups" on public.porch_groups for select to authenticated
  using (status = 'open' or auth.uid() in (keeper_id, cokeeper_id) or public.porch_is_mod(auth.uid()));

drop policy if exists "see who is in your groups" on public.porch_group_members;
create policy "see who is in your groups" on public.porch_group_members for select to authenticated
  using (user_id = auth.uid() or public.porch_in_group(group_id, auth.uid()) or public.porch_is_mod(auth.uid()));

drop policy if exists "see asks" on public.porch_group_asks;
create policy "see asks" on public.porch_group_asks for select to authenticated
  using (user_id = auth.uid() or public.porch_is_keeper(group_id, auth.uid()));

-- group shares: members only (same rules as step 18 otherwise)
drop policy if exists "anyone reads posts" on public.porch_posts;
create policy "anyone reads posts" on public.porch_posts for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id)
         and (auth.uid() is not null or public.porch_is_public(user_id))
         and (group_id is null or public.porch_in_group(group_id, auth.uid()) or public.porch_is_mod(auth.uid())));

drop policy if exists "anyone reads comments" on public.porch_comments;
create policy "anyone reads comments" on public.porch_comments for select
  using (hidden_at is null and not public.porch_blocked(auth.uid(), user_id)
         and public.porch_post_ok(post_id, auth.uid())
         and (auth.uid() is not null
              or (public.porch_is_public(user_id)
                  and exists (select 1 from public.porch_posts p where p.id = post_id and public.porch_is_public(p.user_id)))));

-- no hearts on a group share from outside the group
create or replace function public.porch_reaction_group_check()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.porch_post_ok(new.post_id, new.user_id) then
    raise exception 'not in that group' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists porch_reaction_group_check on public.porch_reactions;
create trigger porch_reaction_group_check before insert on public.porch_reactions
  for each row execute function public.porch_reaction_group_check();

-- a share in a group keeps it awake
create or replace function public.porch_group_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.group_id is not null then
    update porch_groups set last_share_at = now(), warned_at = null where id = new.group_id;
  end if;
  return new;
end $$;
drop trigger if exists porch_group_touch on public.porch_posts;
create trigger porch_group_touch after insert on public.porch_posts
  for each row execute function public.porch_group_touch();

-- ---------- notifications ----------
alter table public.porch_notes add column if not exists group_id uuid references public.porch_groups(id) on delete cascade;
alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept','respin','comment_love',
                  'group_cokeeper','group_review','group_open','group_declined','group_ask','group_in','group_quiet','group_closed'));

create or replace function public.porch_gnote(p_user uuid, p_actor uuid, p_kind text, p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or not exists (select 1 from porch_members where user_id = p_user) then return; end if;
  insert into porch_notes (user_id, actor_id, kind, group_id) values (p_user, coalesce(p_actor, p_user), p_kind, p_group);
end $$;
revoke all on function public.porch_gnote(uuid, uuid, text, uuid) from public, anon, authenticated;

-- ---------- starting a group ----------
create or replace function public.porch_group_start(p_name text, p_about text, p_who text, p_kind text, p_cokeeper uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; mod boolean;
begin
  if me is null or not public.porch_verified(me) then raise exception 'Confirm who you are first.' using errcode = 'P0001'; end if;
  mod := public.porch_is_mod(me);
  if not public.porch_group_can_start() then
    raise exception 'Groups are started by active members who''ve been on the Porch 30 days. Keep showing up and this opens up.' using errcode = 'P0001';
  end if;
  if p_cokeeper is null or p_cokeeper = me or not public.porch_verified(p_cokeeper) or public.porch_blocked(me, p_cokeeper) then
    raise exception 'Pick a Co-keeper who''s on the Porch.' using errcode = 'P0001';
  end if;
  if not (public.porch_active(p_cokeeper) or public.porch_is_mod(p_cokeeper)) then
    raise exception 'Your Co-keeper needs to be an active member too. Pick somebody who''s been showing up.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 3 and 40 then raise exception 'Give the group a name, 3 to 40 letters.' using errcode = 'P0001'; end if;
  if exists (select 1 from porch_groups where lower(btrim(name)) = lower(btrim(p_name)) and status in ('waiting_cokeeper', 'waiting_review', 'open')) then
    raise exception 'There''s already a group with that name.' using errcode = 'P0001';
  end if;
  if (select count(*) from porch_groups where keeper_id = me and status in ('waiting_cokeeper', 'waiting_review')) >= 2 and not mod then
    raise exception 'You already have groups waiting. Let those open first.' using errcode = 'P0001';
  end if;
  insert into porch_groups (name, about, who_for, kind, keeper_id, cokeeper_id)
  values (btrim(p_name), left(btrim(coalesce(p_about, '')), 200), left(btrim(coalesce(p_who, '')), 120),
          case when p_kind = 'ask' then 'ask' else 'open' end, me, p_cokeeper)
  returning id into g;
  perform public.porch_gnote(p_cokeeper, me, 'group_cokeeper', g);
  return g;
end $$;

-- the Co-keeper says "I'm in" (or no thanks)
create or replace function public.porch_group_cokeeper(p_group uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g porch_groups; m record;
begin
  select * into g from porch_groups where id = p_group;
  if g.id is null or g.cokeeper_id is distinct from me or g.status <> 'waiting_cokeeper' then
    raise exception 'That invite is gone.' using errcode = 'P0001';
  end if;
  delete from porch_notes where group_id = p_group and kind = 'group_cokeeper';
  if not p_yes then
    update porch_groups set status = 'declined' where id = p_group;
    perform public.porch_gnote(g.keeper_id, me, 'group_declined', p_group);
    return;
  end if;
  update porch_groups set status = 'waiting_review' where id = p_group;
  for m in select user_id from porch_moderators loop
    perform public.porch_gnote(m.user_id, g.keeper_id, 'group_review', p_group);
  end loop;
end $$;

-- a moderator says yes or no
create or replace function public.porch_group_review(p_group uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g porch_groups;
begin
  if not public.porch_is_mod(me) then raise exception 'Not yours to approve.' using errcode = '42501'; end if;
  select * into g from porch_groups where id = p_group;
  if g.id is null or g.status <> 'waiting_review' then raise exception 'That one''s already handled.' using errcode = 'P0001'; end if;
  delete from porch_notes where group_id = p_group and kind = 'group_review';
  if p_yes then
    update porch_groups set status = 'open', approved_at = now(), last_share_at = now() where id = p_group;
    insert into porch_group_members (group_id, user_id)
      select p_group, u from unnest(array[g.keeper_id, g.cokeeper_id]) u where u is not null
      on conflict do nothing;
    perform public.porch_gnote(g.keeper_id, me, 'group_open', p_group);
    perform public.porch_gnote(g.cokeeper_id, me, 'group_open', p_group);
  else
    update porch_groups set status = 'declined' where id = p_group;
    perform public.porch_gnote(g.keeper_id, me, 'group_declined', p_group);
    perform public.porch_gnote(g.cokeeper_id, me, 'group_declined', p_group);
  end if;
end $$;

-- ---------- joining and leaving ----------
-- returns 'in' (you're a member now) or 'asked' (a keeper has to say yes)
create or replace function public.porch_group_join(p_group uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g porch_groups;
begin
  if me is null or not public.porch_verified(me) then raise exception 'Confirm who you are first.' using errcode = 'P0001'; end if;
  select * into g from porch_groups where id = p_group and status = 'open';
  if g.id is null then raise exception 'That group isn''t open.' using errcode = 'P0001'; end if;
  if public.porch_blocked(me, g.keeper_id) or public.porch_blocked(me, g.cokeeper_id) then
    raise exception 'That group isn''t open.' using errcode = 'P0001';
  end if;
  if exists (select 1 from porch_group_members where group_id = p_group and user_id = me) then return 'in'; end if;
  if g.kind = 'open' then
    insert into porch_group_members (group_id, user_id) values (p_group, me) on conflict do nothing;
    return 'in';
  end if;
  insert into porch_group_asks (group_id, user_id) values (p_group, me) on conflict do nothing;
  if found then
    perform public.porch_gnote(g.keeper_id, me, 'group_ask', p_group);
    perform public.porch_gnote(g.cokeeper_id, me, 'group_ask', p_group);
  end if;
  return 'asked';
end $$;

-- a keeper answers somebody who asked
create or replace function public.porch_group_answer(p_group uuid, p_user uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.porch_is_keeper(p_group, me) then raise exception 'Only the keepers can do that.' using errcode = '42501'; end if;
  delete from porch_group_asks where group_id = p_group and user_id = p_user;
  if not found then return; end if;
  delete from porch_notes where group_id = p_group and kind = 'group_ask' and actor_id = p_user;
  if p_yes then
    insert into porch_group_members (group_id, user_id) values (p_group, p_user) on conflict do nothing;
    perform public.porch_gnote(p_user, me, 'group_in', p_group);
  end if;   -- a "no" is quiet: nobody gets told
end $$;

-- leave a group, or take back an ask. Keepers stay (a group always has a keeper).
create or replace function public.porch_group_leave(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if public.porch_is_keeper(p_group, me) then raise exception 'Keepers keep the light on. Ask a moderator if you need to step away.' using errcode = 'P0001'; end if;
  delete from porch_group_members where group_id = p_group and user_id = me;
  delete from porch_group_asks where group_id = p_group and user_id = me;
end $$;

-- a keeper (or a moderator) takes somebody out of the group
create or replace function public.porch_group_remove(p_group uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not (public.porch_is_keeper(p_group, me) or public.porch_is_mod(me)) then raise exception 'Only the keepers can do that.' using errcode = '42501'; end if;
  if public.porch_is_keeper(p_group, p_user) then raise exception 'That''s a keeper.' using errcode = 'P0001'; end if;
  delete from porch_group_members where group_id = p_group and user_id = p_user;
end $$;

-- a moderator closes a group, or opens a closed one back up
create or replace function public.porch_group_set_open(p_group uuid, p_open boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.porch_is_mod(auth.uid()) then raise exception 'Not yours to do.' using errcode = '42501'; end if;
  if p_open then
    update porch_groups set status = 'open', closed_at = null, warned_at = null, last_share_at = now() where id = p_group and status = 'closed';
  else
    update porch_groups set status = 'closed', closed_at = now() where id = p_group and status = 'open';
  end if;
end $$;

-- ---------- the 90-day rule ----------
-- The app runs this when somebody opens the Groups tab. Heads-up at 75 quiet days,
-- closed at 90. Closed is not erased: a moderator can open it back up.
create or replace function public.porch_groups_sweep()
returns void language plpgsql security definer set search_path = public as $$
declare g record;
begin
  for g in select * from porch_groups where status = 'open' and warned_at is null
            and coalesce(last_share_at, approved_at, created_at) < now() - interval '75 days' loop
    update porch_groups set warned_at = now() where id = g.id;
    perform public.porch_gnote(g.keeper_id, g.keeper_id, 'group_quiet', g.id);
    perform public.porch_gnote(g.cokeeper_id, g.cokeeper_id, 'group_quiet', g.id);
  end loop;
  for g in select * from porch_groups where status = 'open'
            and coalesce(last_share_at, approved_at, created_at) < now() - interval '90 days' loop
    update porch_groups set status = 'closed', closed_at = now() where id = g.id;
    perform public.porch_gnote(g.keeper_id, g.keeper_id, 'group_closed', g.id);
    perform public.porch_gnote(g.cokeeper_id, g.cokeeper_id, 'group_closed', g.id);
  end loop;
end $$;

-- when somebody deletes their Porch account: out of every group; a Co-keeper steps up
-- to Keeper; a group left with no keeper closes. (The porch function calls this.)
create or replace function public.porch_groups_forget(p uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from porch_group_members where user_id = p;
  delete from porch_group_asks where user_id = p;
  update porch_groups set keeper_id = cokeeper_id, cokeeper_id = null where keeper_id = p;
  update porch_groups set cokeeper_id = null where cokeeper_id = p;
  update porch_groups set status = 'closed', closed_at = now() where keeper_id is null and status in ('open', 'waiting_cokeeper', 'waiting_review');
end $$;
revoke all on function public.porch_groups_forget(uuid) from public, anon, authenticated;

-- signed-in people only
revoke all on function public.porch_group_start(text, text, text, text, uuid), public.porch_group_cokeeper(uuid, boolean),
  public.porch_group_review(uuid, boolean), public.porch_group_join(uuid), public.porch_group_answer(uuid, uuid, boolean),
  public.porch_group_leave(uuid), public.porch_group_remove(uuid, uuid), public.porch_group_set_open(uuid, boolean),
  public.porch_groups_sweep(), public.porch_group_can_start(), public.porch_group_facts(uuid) from public, anon;
grant execute on function public.porch_group_start(text, text, text, text, uuid), public.porch_group_cokeeper(uuid, boolean),
  public.porch_group_review(uuid, boolean), public.porch_group_join(uuid), public.porch_group_answer(uuid, uuid, boolean),
  public.porch_group_leave(uuid), public.porch_group_remove(uuid, uuid), public.porch_group_set_open(uuid, boolean),
  public.porch_groups_sweep(), public.porch_group_can_start(), public.porch_group_facts(uuid) to authenticated;

-- check: should say ready
select 'groups ready' as status,
       (select count(*) from public.porch_groups) as groups_so_far,
       (select count(*) from public.porch_moderators) as moderators;

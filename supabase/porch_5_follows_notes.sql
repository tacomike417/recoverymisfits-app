-- ============================================================
-- THE PORCH, STEP 5: follows and notifications. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * Follow anybody. No follower counts anywhere (no ego stuff). You can see
--   who YOU follow and who follows YOU, nobody else's lists.
-- * Notifications are written by the database itself, never by a phone:
--     comment   somebody commented on your share
--     proud     somebody tapped Proud of you
--     metoo     somebody tapped Me too
--     mention   somebody @tagged you in a share or a comment
--     follow    somebody followed you
-- * Nothing is sent to you by somebody you blocked, or who blocked you.
-- * Take back a Proud of you / Me too, or unfollow, and that notification goes too.
-- ============================================================

-- ---------- follows ----------
create table if not exists public.porch_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
alter table public.porch_follows enable row level security;

drop policy if exists "see your own follows" on public.porch_follows;
create policy "see your own follows" on public.porch_follows for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = followed_id);
drop policy if exists "confirmed members follow" on public.porch_follows;
create policy "confirmed members follow" on public.porch_follows for insert to authenticated
  with check (auth.uid() = follower_id and public.porch_verified(auth.uid())
              and not public.porch_blocked(follower_id, followed_id));
drop policy if exists "members unfollow" on public.porch_follows;
create policy "members unfollow" on public.porch_follows for delete to authenticated
  using (auth.uid() = follower_id);

-- ---------- notifications ----------
create table if not exists public.porch_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,   -- who it's for
  actor_id   uuid not null references auth.users(id) on delete cascade,   -- who did it
  kind       text not null check (kind in ('comment','proud','metoo','mention','follow')),
  post_id    uuid references public.porch_posts(id) on delete cascade,
  comment_id uuid references public.porch_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists porch_notes_mine on public.porch_notes (user_id, created_at desc);
alter table public.porch_notes enable row level security;

drop policy if exists "see your own notifications" on public.porch_notes;
create policy "see your own notifications" on public.porch_notes for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "mark your own read" on public.porch_notes;
create policy "mark your own read" on public.porch_notes for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke insert, delete, update on public.porch_notes from anon, authenticated;
grant update (read_at) on public.porch_notes to authenticated;

-- one helper does the writing, and refuses self-notes and blocked pairs
create or replace function public.porch_note(p_user uuid, p_actor uuid, p_kind text, p_post uuid, p_comment uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor or public.porch_blocked(p_user, p_actor) then return; end if;
  if not exists (select 1 from porch_members where user_id = p_user) then return; end if;
  insert into porch_notes (user_id, actor_id, kind, post_id, comment_id)
  values (p_user, p_actor, p_kind, p_post, p_comment);
end $$;

-- @names in some text -> the members they point at
create or replace function public.porch_mentioned(t text)
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct m.user_id
    from regexp_matches(coalesce(t, ''), '@([A-Za-z0-9._-]{3,32})', 'g') as x(h)
    join porch_members m on m.handle = lower(rtrim(x.h[1], '._-'))
   limit 10;
$$;

-- a new share: tell anybody it @tags
create or replace function public.porch_note_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  for u in select * from public.porch_mentioned(new.body) loop
    perform public.porch_note(u, new.user_id, 'mention', new.id, null);
  end loop;
  return new;
end $$;
drop trigger if exists porch_note_post on public.porch_posts;
create trigger porch_note_post after insert on public.porch_posts
  for each row execute function public.porch_note_post();

-- a new comment: tell the share's owner, and anybody it @tags
create or replace function public.porch_note_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; u uuid;
begin
  select user_id into owner from porch_posts where id = new.post_id;
  perform public.porch_note(owner, new.user_id, 'comment', new.post_id, new.id);
  for u in select * from public.porch_mentioned(new.body) loop
    if u <> owner then perform public.porch_note(u, new.user_id, 'mention', new.post_id, new.id); end if;
  end loop;
  return new;
end $$;
drop trigger if exists porch_note_comment on public.porch_comments;
create trigger porch_note_comment after insert on public.porch_comments
  for each row execute function public.porch_note_comment();

-- Proud of you / Me too: tell the owner; taking it back takes the note back
create or replace function public.porch_note_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    select user_id into owner from porch_posts where id = new.post_id;
    perform public.porch_note(owner, new.user_id, new.kind, new.post_id, null);
    return new;
  end if;
  delete from porch_notes where actor_id = old.user_id and post_id = old.post_id and kind = old.kind;
  return old;
end $$;
drop trigger if exists porch_note_reaction on public.porch_reactions;
create trigger porch_note_reaction after insert or delete on public.porch_reactions
  for each row execute function public.porch_note_reaction();

-- follows: tell them; unfollowing takes it back
create or replace function public.porch_note_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.porch_note(new.followed_id, new.follower_id, 'follow', null, null);
    return new;
  end if;
  delete from porch_notes where actor_id = old.follower_id and user_id = old.followed_id and kind = 'follow';
  return old;
end $$;
drop trigger if exists porch_note_follow on public.porch_follows;
create trigger porch_note_follow after insert or delete on public.porch_follows
  for each row execute function public.porch_note_follow();

select 'porch step 5: ok' as status,
       (select count(*) from public.porch_follows) as follows,
       (select count(*) from public.porch_notes) as notifications;

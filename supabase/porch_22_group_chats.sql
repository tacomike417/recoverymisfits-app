-- ============================================================
-- THE PORCH, STEP 22: GROUP CHATS IN MESSAGES. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "group chats in messages yes. and yeah cap it, and friends only."
-- Like a group text: three or more people in one private chat. Nothing to do with
-- Groups (no Keeper, no approval).
--
-- * FRIENDS ONLY: whoever starts the chat can only put their own friends in it.
-- * CAPPED at 12 people.
-- * Only the people in a chat can read it. Photos stay in the private bucket.
-- * Anybody can leave. Whoever started it can add friends, take somebody out, and
--   name the chat. If they leave, whoever's been in it longest takes that over.
-- * Nobody gets put in a chat with somebody they've blocked (or who blocked them),
--   and you never see messages from somebody you've blocked.
-- * Words and photos go through the porch function (same checks as one-on-one
--   messages), so nothing goes straight into these tables from a phone.
-- ============================================================

create table if not exists public.porch_gchats (
  id           uuid primary key default gen_random_uuid(),
  name         text check (char_length(name) <= 40),
  owner_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_at      timestamptz not null default now(),
  last_from    uuid,
  last_preview text
);
alter table public.porch_gchats enable row level security;

create table if not exists public.porch_gchat_members (
  chat_id   uuid not null references public.porch_gchats(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  read_at   timestamptz,
  primary key (chat_id, user_id)
);
create index if not exists porch_gchat_members_user on public.porch_gchat_members (user_id);
alter table public.porch_gchat_members enable row level security;

create table if not exists public.porch_gdm (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.porch_gchats(id) on delete cascade,
  from_id     uuid not null references auth.users(id) on delete cascade,
  body        text check (char_length(body) <= 2000),
  photo_paths text[] not null default '{}',
  racy        boolean not null default false,
  created_at  timestamptz not null default now(),
  unsent_at   timestamptz
);
create index if not exists porch_gdm_chat on public.porch_gdm (chat_id, created_at desc);
alter table public.porch_gdm enable row level security;

create or replace function public.porch_in_gchat(c uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select c is not null and u is not null and exists (select 1 from porch_gchat_members where chat_id = c and user_id = u);
$$;
grant execute on function public.porch_in_gchat(uuid, uuid) to authenticated;

revoke all on public.porch_gchats, public.porch_gchat_members, public.porch_gdm from anon, authenticated;
grant select on public.porch_gchats, public.porch_gchat_members, public.porch_gdm to authenticated;

drop policy if exists "your group chats" on public.porch_gchats;
create policy "your group chats" on public.porch_gchats for select to authenticated
  using (public.porch_in_gchat(id, auth.uid()));
drop policy if exists "who is in your group chats" on public.porch_gchat_members;
create policy "who is in your group chats" on public.porch_gchat_members for select to authenticated
  using (public.porch_in_gchat(chat_id, auth.uid()));
drop policy if exists "messages in your group chats" on public.porch_gdm;
create policy "messages in your group chats" on public.porch_gdm for select to authenticated
  using (public.porch_in_gchat(chat_id, auth.uid()) and not public.porch_blocked(auth.uid(), from_id));

-- ---------- start, add, leave, remove, name, read ----------
create or replace function public.porch_gchat_start(p_name text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c uuid; ids uuid[]; u uuid;
begin
  if me is null or not public.porch_verified(me) then raise exception 'Confirm who you are first.' using errcode = 'P0001'; end if;
  select array_agg(distinct x) into ids from unnest(coalesce(p_members, '{}')) x where x is not null and x <> me;
  if coalesce(array_length(ids, 1), 0) < 2 then raise exception 'Pick at least two friends. For one friend, just message them.' using errcode = 'P0001'; end if;
  if array_length(ids, 1) > 11 then raise exception 'A group chat holds 12 people.' using errcode = 'P0001'; end if;
  foreach u in array ids loop
    if not public.porch_are_friends(me, u) or public.porch_blocked(me, u) then raise exception 'You can only add your friends.' using errcode = 'P0001'; end if;
  end loop;
  -- nobody lands in a chat with somebody they've blocked
  if exists (select 1 from unnest(ids) x, unnest(ids) y where x < y and public.porch_blocked(x, y)) then
    raise exception 'Two of those friends can''t be in a chat together.' using errcode = 'P0001';
  end if;
  insert into porch_gchats (name, owner_id) values (nullif(left(btrim(coalesce(p_name, '')), 40), ''), me) returning id into c;
  insert into porch_gchat_members (chat_id, user_id, read_at) values (c, me, now());
  insert into porch_gchat_members (chat_id, user_id) select c, x from unnest(ids) x;
  return c;
end $$;

create or replace function public.porch_gchat_add(p_chat uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not exists (select 1 from porch_gchats where id = p_chat and owner_id = me) then raise exception 'Only whoever started the chat can add people.' using errcode = 'P0001'; end if;
  if not public.porch_are_friends(me, p_user) or public.porch_blocked(me, p_user) then raise exception 'You can only add your friends.' using errcode = 'P0001'; end if;
  if (select count(*) from porch_gchat_members where chat_id = p_chat) >= 12 then raise exception 'A group chat holds 12 people.' using errcode = 'P0001'; end if;
  if exists (select 1 from porch_gchat_members m where m.chat_id = p_chat and public.porch_blocked(m.user_id, p_user)) then
    raise exception 'They can''t be added to this chat.' using errcode = 'P0001';
  end if;
  insert into porch_gchat_members (chat_id, user_id) values (p_chat, p_user) on conflict do nothing;
end $$;

-- take somebody out of every part of a chat; hand the chat on, or end it if it's empty
create or replace function public.porch_gchat_drop(p_chat uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from porch_gchat_members where chat_id = p_chat and user_id = p_user;
  if not exists (select 1 from porch_gchat_members where chat_id = p_chat) then
    delete from porch_gchats where id = p_chat;
  else
    update porch_gchats set owner_id = (select user_id from porch_gchat_members where chat_id = p_chat order by joined_at, user_id limit 1)
     where id = p_chat and (owner_id = p_user or owner_id is null);
  end if;
end $$;
revoke all on function public.porch_gchat_drop(uuid, uuid) from public, anon, authenticated;

create or replace function public.porch_gchat_leave(p_chat uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.porch_in_gchat(p_chat, auth.uid()) then return; end if;
  perform public.porch_gchat_drop(p_chat, auth.uid());
end $$;

create or replace function public.porch_gchat_remove(p_chat uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from porch_gchats where id = p_chat and owner_id = auth.uid()) then raise exception 'Only whoever started the chat can do that.' using errcode = 'P0001'; end if;
  if p_user = auth.uid() then return; end if;
  perform public.porch_gchat_drop(p_chat, p_user);
end $$;

create or replace function public.porch_gchat_rename(p_chat uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update porch_gchats set name = nullif(left(btrim(coalesce(p_name, '')), 40), '') where id = p_chat and owner_id = auth.uid();
  if not found then raise exception 'Only whoever started the chat can name it.' using errcode = 'P0001'; end if;
end $$;

create or replace function public.porch_gchat_read(p_chat uuid)
returns void language sql security definer set search_path = public as $$
  update porch_gchat_members set read_at = now() where chat_id = p_chat and user_id = auth.uid();
$$;

-- leaving the Porch: out of every group chat (the porch function calls this)
create or replace function public.porch_gchats_forget(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c record;
begin
  delete from porch_gdm where from_id = p;
  for c in select chat_id from porch_gchat_members where user_id = p loop
    perform public.porch_gchat_drop(c.chat_id, p);
  end loop;
end $$;
revoke all on function public.porch_gchats_forget(uuid) from public, anon, authenticated;

revoke all on function public.porch_gchat_start(text, uuid[]), public.porch_gchat_add(uuid, uuid), public.porch_gchat_leave(uuid),
  public.porch_gchat_remove(uuid, uuid), public.porch_gchat_rename(uuid, text), public.porch_gchat_read(uuid) from public, anon;
grant execute on function public.porch_gchat_start(text, uuid[]), public.porch_gchat_add(uuid, uuid), public.porch_gchat_leave(uuid),
  public.porch_gchat_remove(uuid, uuid), public.porch_gchat_rename(uuid, text), public.porch_gchat_read(uuid) to authenticated;

-- ---------- the unread number on the Messages icon counts group chats too ----------
create or replace function public.porch_dm_unread()
returns integer language sql stable security definer set search_path = public as $$
  select (
    (select count(*) from porch_threads t
      where (t.a = auth.uid() or t.b = auth.uid())
        and t.last_from is not null and t.last_from <> auth.uid()
        and not public.porch_blocked(t.a, t.b)
        and t.last_at > coalesce(case when t.a = auth.uid() then t.a_read_at else t.b_read_at end, '-infinity'))
    +
    (select count(*) from porch_gchat_members m join porch_gchats c on c.id = m.chat_id
      where m.user_id = auth.uid()
        and c.last_from is not null and c.last_from <> auth.uid()
        and not public.porch_blocked(auth.uid(), c.last_from)
        and c.last_at > coalesce(m.read_at, '-infinity'))
  )::int;
$$;
grant execute on function public.porch_dm_unread() to authenticated;

-- ---------- private photos: the people in the chat, nobody else ----------
drop policy if exists "porch dm photos: people in the group chat" on storage.objects;
create policy "porch dm photos: people in the group chat" on storage.objects for select to authenticated
  using (bucket_id = 'porch-dm' and exists (
    select 1 from public.porch_gchat_members m
     where m.chat_id::text = (storage.foldername(name))[1] and m.user_id = auth.uid()));

-- ---------- the buzz ----------
create or replace function public.porch_push_gdm()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text;
begin
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('gdm_id', new.id)
  );
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists porch_push_gdm on public.porch_gdm;
create trigger porch_push_gdm after insert on public.porch_gdm
  for each row execute function public.porch_push_gdm();

-- check: should say ready
select 'group chats ready' as status, (select count(*) from public.porch_gchats) as chats_so_far;

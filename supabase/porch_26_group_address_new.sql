-- ============================================================
-- THE PORCH, STEP 26: GROUP ADDRESSES + "NEW IN MY GROUPS". 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "I want groups to have their own address set by the user so it'll be
-- recoverymisfits.org/groups/usersetsname" and "notifications of new group posts on
-- that group tab, only the number of updates on subscribed groups."
--
-- 1. ADDRESS. Every group gets one: small letters, numbers and dashes, 3 to 30 long.
--    Whoever starts the group picks it; if they don't, it's made from the group's
--    name. A Keeper, Co-keeper or moderator can change it later. Groups that already
--    exist get one made from their name right now.
--    The page at that address only ever shows the group's name and what it's for.
--    Never who's in it, never what's shared. Only groups that are open.
-- 2. NEW. Each member has a "last looked" time per group. The GROUPS tab shows how
--    many shares landed in your groups since you last looked (other people's only).
-- ============================================================

-- ---------- 1. the address ----------
alter table public.porch_groups add column if not exists slug text;
alter table public.porch_groups drop constraint if exists porch_groups_slug_ok;
alter table public.porch_groups add constraint porch_groups_slug_ok
  check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');
create unique index if not exists porch_groups_slug on public.porch_groups (slug) where slug is not null and status <> 'declined';

-- "Friday Night Porch!" -> "friday-night-porch"
create or replace function public.porch_slug(t text)
returns text language sql immutable as $$
  select nullif(btrim(left(btrim(regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'), '-'), 30), '-'), '');
$$;

create or replace function public.porch_slug_free(s text, g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from porch_groups where slug = s and status <> 'declined' and (g is null or id <> g));
$$;
revoke all on function public.porch_slug_free(text, uuid) from public, anon, authenticated;

-- tidy what somebody typed and say plainly if it won't work. Returns the clean address.
create or replace function public.porch_group_address_check(p_slug text, p_group uuid default null)
returns text language plpgsql stable security definer set search_path = public as $$
declare s text := public.porch_slug(p_slug);
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = 'P0001'; end if;
  if s is null or char_length(s) < 3 then raise exception 'The address needs at least 3 letters or numbers.' using errcode = 'P0001'; end if;
  if s in ('new', 'start', 'find', 'mine', 'all', 'index', 'admin', 'mod', 'mods', 'help', 'rules', 'groups', 'group', 'porch', 'official', 'staff') then
    raise exception 'That address is set aside. Try another one.' using errcode = 'P0001';
  end if;
  if not public.porch_slug_free(s, p_group) then raise exception 'Another group has that address. Try another one.' using errcode = 'P0001'; end if;
  return s;
end $$;

create or replace function public.porch_group_set_address(p_group uuid, p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); s text;
begin
  if not exists (select 1 from porch_groups where id = p_group and (me in (keeper_id, cokeeper_id) or public.porch_is_mod(me))) then
    raise exception 'Only a Keeper can change the address.' using errcode = 'P0001';
  end if;
  s := public.porch_group_address_check(p_slug, p_group);
  update porch_groups set slug = s where id = p_group;
  return s;
end $$;

-- a group with no address gets one from its name (adds -2, -3 ... if that's taken)
create or replace function public.porch_group_auto_slug(p_name text, g uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare base text := coalesce(public.porch_slug(p_name), 'group'); s text; i int := 1;
begin
  if char_length(base) < 3 then base := 'group-' || base; end if;
  if base in ('new', 'start', 'find', 'mine', 'all', 'index', 'admin', 'mod', 'mods', 'help', 'rules', 'groups', 'group', 'porch', 'official', 'staff') then base := base || '-group'; end if;
  s := base;
  while not public.porch_slug_free(s, g) loop
    i := i + 1; s := btrim(left(base, 30 - char_length('-' || i)), '-') || '-' || i;
  end loop;
  return s;
end $$;
revoke all on function public.porch_group_auto_slug(text, uuid) from public, anon, authenticated;

create or replace function public.porch_group_slug_fill()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.slug is null then new.slug := public.porch_group_auto_slug(new.name, new.id); end if;
  return new;
end $$;
drop trigger if exists porch_group_slug_fill on public.porch_groups;
create trigger porch_group_slug_fill before insert on public.porch_groups
  for each row execute function public.porch_group_slug_fill();

-- the groups that are already here
do $$
declare r record;
begin
  for r in select id, name from porch_groups where slug is null order by created_at loop
    update porch_groups set slug = public.porch_group_auto_slug(r.name, r.id) where id = r.id;
  end loop;
end $$;

-- what the address page may show to anybody: the name and what it's for. Nothing else.
create or replace function public.porch_group_card(p_slug text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('slug', g.slug, 'name', g.name, 'about', g.about, 'who_for', g.who_for, 'kind', g.kind)
    from porch_groups g where g.slug = lower(btrim(p_slug)) and g.status = 'open' limit 1;
$$;

revoke all on function public.porch_group_address_check(text, uuid), public.porch_group_set_address(uuid, text) from public, anon;
grant execute on function public.porch_group_address_check(text, uuid), public.porch_group_set_address(uuid, text) to authenticated;
revoke all on function public.porch_group_card(text) from public;
grant execute on function public.porch_group_card(text) to anon, authenticated;

-- ---------- 2. new in my groups ----------
alter table public.porch_group_members add column if not exists seen_at timestamptz not null default now();

create or replace function public.porch_groups_new()
returns table (group_id uuid, n integer) language sql stable security definer set search_path = public as $$
  select m.group_id, count(p.id)::int
    from porch_group_members m
    join porch_groups g on g.id = m.group_id and g.status = 'open'
    join porch_posts p on p.group_id = m.group_id and p.created_at > m.seen_at
                      and p.user_id <> auth.uid() and p.hidden_at is null
                      and not public.porch_blocked(auth.uid(), p.user_id)
   where m.user_id = auth.uid()
   group by m.group_id;
$$;

create or replace function public.porch_group_seen(p_group uuid)
returns void language sql security definer set search_path = public as $$
  update porch_group_members set seen_at = now() where group_id = p_group and user_id = auth.uid();
$$;

revoke all on function public.porch_groups_new(), public.porch_group_seen(uuid) from public, anon;
grant execute on function public.porch_groups_new(), public.porch_group_seen(uuid) to authenticated;

-- check: should say ready, and groups_without_address should be 0
select 'group addresses ready' as status,
       (select count(*) from public.porch_groups where slug is null) as groups_without_address,
       (select count(*) from public.porch_groups) as groups_so_far;

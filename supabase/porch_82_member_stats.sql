-- porch_82_member_stats.sql (22 Nov 2026, Mike) -- Recovery Misfits project
-- MEMBER STATS: a page only tacomike417 can open (/feed/stats.html) to see who signed up, whether they use the
-- site, where they came from and what they do. Mike: "make it general for me to glance at and see, but when i
-- click on their name it gives me as much detailed info as possible so i can wrap my head around this."
--
-- Two new things get recorded from now on (Mike said yes to both):
--   rm_seen    one row per person per day they open the app: which parts they opened and how many times.
--              Page names and counts only. Never anything anybody writes.
--   rm_source  where a person first came from (Facebook, Instagram, an invite, typed it in...), saved once.
--              Only people who sign up from now on have one; the 40 already here came before this existed.
-- Sober date shows on the stats page (Mike, 22 Nov: "i do want to see ... what length of sobriety is coming on
-- board"). Message words are never shown, only how many were sent.

create table if not exists public.rm_seen (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  parts    text[] not null default '{}',
  hits     integer not null default 0,
  first_at timestamptz not null default now(),
  last_at  timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.rm_seen enable row level security;      -- no policies: only the functions below touch it

create table if not exists public.rm_source (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  src         text,          -- facebook, instagram, google, invite, direct...
  ref         text,          -- the full address they came from, when the browser says
  landing     text,          -- the first page they opened
  inv         text,          -- an invite link carries the first 8 letters of the inviter's id (never their name)
  first_visit timestamptz,   -- when that first visit happened (can be days before sign-up)
  at          timestamptz not null default now()
);
alter table public.rm_source enable row level security;

-- Called by nav.js on every page, at most once every 15 minutes per page.
create or replace function public.rm_ping(p_part text, p_src text default null, p_ref text default null,
  p_landing text default null, p_first timestamptz default null, p_inv text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  u  uuid := auth.uid();
  d  date := (now() at time zone 'America/New_York')::date;
  pt text := left(coalesce(nullif(trim(p_part), ''), 'other'), 40);
begin
  if u is null then return; end if;
  insert into rm_seen (user_id, day, parts, hits) values (u, d, array[pt], 1)
  on conflict (user_id, day) do update set
    hits = rm_seen.hits + 1,
    last_at = now(),
    parts = case when pt = any (rm_seen.parts) or cardinality(rm_seen.parts) >= 40 then rm_seen.parts else rm_seen.parts || pt end;
  if p_src is not null then
    insert into rm_source (user_id, src, ref, landing, inv, first_visit)
    values (u, left(p_src, 60), left(p_ref, 300), left(p_landing, 300), left(p_inv, 16), p_first)
    on conflict (user_id) do nothing;
  end if;
end $$;
revoke all on function public.rm_ping(text, text, text, text, timestamptz, text) from public, anon;
grant execute on function public.rm_ping(text, text, text, text, timestamptz, text) to authenticated;

-- Only tacomike417.
create or replace function public.rm_stats_ok() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from auth.users where id = auth.uid() and lower(split_part(email, '@', 1)) = 'tacomike417');
$$;
revoke all on function public.rm_stats_ok() from public, anon;
grant execute on function public.rm_stats_ok() to authenticated;

-- The menu learns about the new row (same function the whole site's You menu already uses, porch_80).
create or replace function public.rm_menu_extras() returns json
language sql stable security definer set search_path to 'public' as $$
  select json_build_object(
    'board',   public.cornerstones_is_board(),
    'mod',     exists (select 1 from public.porch_moderators where user_id = auth.uid()),
    'prayers', public.prayer_jar_ok(),
    'stats',   public.rm_stats_ok());
$$;

-- Accounts that aren't real members, so the page can set them aside.
create or replace function public.rm_stats_kind(h text) returns text language sql immutable as $$
  select case
    when h in ('recoverymisfits','spiritualmisfit','shitmysponsorsays','anotherdaysober','welcomematt','soberriot','starkrecovery','skivvies') then 'house'
    when h in ('misfit_tester','walktest2','looktest1','username2') then 'test'
    when h = 'tacomike417' then 'me'
    else 'member' end;
$$;

-- THE LIST: one row per account.
create or replace function public.rm_admin_stats() returns json
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.rm_stats_ok() then raise exception 'not allowed' using errcode = '42501'; end if;
  return (select coalesce(json_agg(r order by r.joined desc), '[]'::json) from (
    select
      u.id,
      lower(split_part(u.email, '@', 1)) as handle,
      public.rm_stats_kind(lower(split_part(u.email, '@', 1))) as kind,
      u.created_at as joined,
      u.last_sign_in_at as last_in,
      m.verified_at is not null as porch,
      m.avatar_path,
      coalesce(m.sober_date::text, p.data ->> 'soberDate') as sober,
      (select max(s.day) from rm_seen s where s.user_id = u.id) as seen_day,
      (select count(*) from rm_seen s where s.user_id = u.id and s.day > current_date - 30) as days30,
      (select max(k) from jsonb_object_keys(case when jsonb_typeof(p.data -> 'opened') = 'object' then p.data -> 'opened' else '{}'::jsonb end) k) as read_mmdd,
      (select max(ps.at) from porch_seen ps where ps.user_id = u.id) as porch_seen,
      (select count(*) from porch_posts x where x.user_id = u.id and x.hidden_at is null) as posts,
      (select count(*) from porch_spins x where x.user_id = u.id) as spins,
      (select count(*) from porch_comments x where x.user_id = u.id and x.hidden_at is null) as comments,
      (select count(*) from porch_reactions x where x.user_id = u.id) as likes,
      (select count(*) from porch_dm x where x.from_id = u.id) as messages,
      (select count(*) from porch_friends x where x.a = u.id or x.b = u.id) as friends,
      (select count(*) from porch_group_members x where x.user_id = u.id) as groups,
      (select count(*) from porch_bob_high_fives x where x.user_id = u.id) as high_fives,
      src.src, src.inv
    from auth.users u
    left join porch_members m on m.user_id = u.id
    left join profiles p on p.id = u.id
    left join rm_source src on src.user_id = u.id
  ) r);
end $$;
revoke all on function public.rm_admin_stats() from public, anon;
grant execute on function public.rm_admin_stats() to authenticated;

-- ONE PERSON, everything we have.
create or replace function public.rm_admin_user(p_id uuid) returns json
language plpgsql stable security definer set search_path to 'public' as $$
declare j json;
begin
  if not public.rm_stats_ok() then raise exception 'not allowed' using errcode = '42501'; end if;
  select json_build_object(
    'id', u.id,
    'handle', lower(split_part(u.email, '@', 1)),
    'kind', public.rm_stats_kind(lower(split_part(u.email, '@', 1))),
    'joined', u.created_at,
    'last_in', u.last_sign_in_at,
    'member', case when m.user_id is null then null else json_build_object(
        'real_name', m.real_name, 'bio', m.bio, 'avatar_path', m.avatar_path, 'visibility', m.visibility,
        'verified_at', m.verified_at, 'frozen_at', m.frozen_at, 'away_at', m.away_at, 'welcomed_at', m.welcomed_at) end,
    'sober', coalesce(m.sober_date::text, p.data ->> 'soberDate'),
    'joined_date', p.data ->> 'joinedDate',
    'opened', p.data -> 'opened',
    'stack', p.data -> 'stack',
    'source', (select row_to_json(s) from (select src, ref, landing, inv, first_visit, at from rm_source where user_id = u.id) s),
    'invited_by', (select lower(split_part(x.email, '@', 1)) from rm_source s join auth.users x on left(x.id::text, 8) = s.inv where s.user_id = u.id limit 1),
    'invited', (select coalesce(json_agg(lower(split_part(x.email, '@', 1))), '[]'::json) from rm_source s join auth.users x on x.id = s.user_id where s.inv = left(u.id::text, 8)),
    'seen', (select coalesce(json_agg(row_to_json(s) order by s.day desc), '[]'::json) from
              (select day, parts, hits, first_at, last_at from rm_seen where user_id = u.id order by day desc limit 90) s),
    'porch_seen', (select max(at) from porch_seen where user_id = u.id),
    'counts', json_build_object(
        'posts', (select count(*) from porch_posts x where x.user_id = u.id and x.hidden_at is null),
        'spins', (select count(*) from porch_spins x where x.user_id = u.id),
        'spin_views', (select coalesce(sum(views), 0) from porch_spins x where x.user_id = u.id),
        'comments', (select count(*) from porch_comments x where x.user_id = u.id and x.hidden_at is null),
        'likes_given', (select count(*) from porch_reactions x where x.user_id = u.id),
        'likes_got', (select count(*) from porch_reactions r join porch_posts x on x.id = r.post_id where x.user_id = u.id and r.user_id <> u.id),
        'messages', (select count(*) from porch_dm x where x.from_id = u.id),
        'chats', (select count(*) from porch_threads x where x.a = u.id or x.b = u.id),
        'friends', (select count(*) from porch_friends x where x.a = u.id or x.b = u.id),
        'groups', (select count(*) from porch_group_members x where x.user_id = u.id),
        'high_fives', (select count(*) from porch_bob_high_fives x where x.user_id = u.id),
        'profile_views', (select coalesce(sum(profile_views), 0) from porch_view_totals x where x.user_id = u.id)),
    'friends', (select coalesce(json_agg(lower(split_part(x.email, '@', 1)) order by 1), '[]'::json) from porch_friends f
                 join auth.users x on x.id = case when f.a = u.id then f.b else f.a end where f.a = u.id or f.b = u.id),
    'groups', (select coalesce(json_agg(g.name), '[]'::json) from porch_group_members gm join porch_groups g on g.id = gm.group_id where gm.user_id = u.id),
    'timeline', (select coalesce(json_agg(row_to_json(t) order by t.at desc), '[]'::json) from (
        select * from (
          select created_at as at, 'share' as what, left(coalesce(body, ''), 160) as words from porch_posts where user_id = u.id and hidden_at is null
          union all select created_at, 'spin', left(coalesce(caption, ''), 160) from porch_spins where user_id = u.id
          union all select created_at, 'comment', left(coalesce(body, ''), 160) from porch_comments where user_id = u.id and hidden_at is null
          union all select created_at, 'like', kind from porch_reactions where user_id = u.id
          union all select created_at, 'message', null from porch_dm where from_id = u.id
          union all select f.created_at, 'friend', lower(split_part(x.email, '@', 1)) from porch_friends f
                      join auth.users x on x.id = case when f.a = u.id then f.b else f.a end where f.a = u.id or f.b = u.id
          union all select gm.joined_at, 'group', g.name from porch_group_members gm join porch_groups g on g.id = gm.group_id where gm.user_id = u.id
          union all select created_at, 'high five', null from porch_bob_high_fives where user_id = u.id
        ) a order by at desc limit 150) t)
  ) into j
  from auth.users u
  left join porch_members m on m.user_id = u.id
  left join profiles p on p.id = u.id
  where u.id = p_id;
  return j;
end $$;
revoke all on function public.rm_admin_user(uuid) from public, anon;
grant execute on function public.rm_admin_user(uuid) to authenticated;

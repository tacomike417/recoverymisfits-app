-- ============================================================
-- PORCH 50 -- HASHTAGS, AND TAG A GROUP (4 Oct 2026, Mike: "build in the smart
-- tagging with hash tags on all of it ... when you post or make a reel ... the
-- ability to tag any group you've joined to promote the group if its public").
--
-- 1. HASHTAGS. A #word in a share, a Spin's words or a comment is a tag. This
--    keeps a list of which share carries which tag, so tapping a tag can show
--    everything with it. Shares inside a group are left out (only members see
--    those), and so is anything a moderator took down.
-- 2. TAG A GROUP. A share or a Spin can point at ONE open group the person is in.
--    The server checks that (the porch and spins functions); this only adds the
--    place to keep it.
--
-- SAFE TO RUN TWICE.
-- ============================================================

alter table public.porch_posts add column if not exists tag_group_id uuid references public.porch_groups(id) on delete set null;
alter table public.porch_spins add column if not exists tag_group_id uuid references public.porch_groups(id) on delete set null;

create table if not exists public.porch_post_tags (
  post_id    uuid not null references public.porch_posts(id) on delete cascade,
  tag        text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, tag)
);
create index if not exists porch_post_tags_tag on public.porch_post_tags (tag, created_at desc);
alter table public.porch_post_tags enable row level security;
drop policy if exists "read tags" on public.porch_post_tags;
create policy "read tags" on public.porch_post_tags for select to anon, authenticated using (true);
revoke insert, update, delete on public.porch_post_tags from anon, authenticated;
grant select on public.porch_post_tags to anon, authenticated;

-- every #tag in a piece of text, lower case. A tag starts with a letter, 2 to 40 long,
-- and sits at the start or after a space or "(" (so the # in a web link is not a tag).
create or replace function public.porch_tags_in(t text)
returns setof text language sql immutable as $$
  select distinct lower(m[1])
    from regexp_matches(coalesce(t, ''), '(?:^|[\s(])#([A-Za-z][A-Za-z0-9_]{1,39})', 'g') as m;
$$;

-- work out one share's tags again: its own words plus its comments
create or replace function public.porch_retag(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare po porch_posts;
begin
  select * into po from porch_posts where id = p;
  delete from porch_post_tags where post_id = p;
  if po.id is null or po.hidden_at is not null or po.group_id is not null then return; end if;
  insert into porch_post_tags (post_id, tag, created_at)
  select p, x.tag, po.created_at from (
    select porch_tags_in(po.body) as tag
    union
    select porch_tags_in(c.body) from porch_comments c where c.post_id = p and c.hidden_at is null
  ) x
  on conflict do nothing;
end $$;
revoke all on function public.porch_retag(uuid) from public, anon, authenticated;

create or replace function public.porch_retag_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform porch_retag(new.id); return null; end $$;
drop trigger if exists porch_retag_post on public.porch_posts;
create trigger porch_retag_post after insert or update of body, hidden_at, group_id on public.porch_posts
  for each row execute function public.porch_retag_post();

create or replace function public.porch_retag_comment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from porch_posts where id = old.post_id) then perform porch_retag(old.post_id); end if;
    return null;
  end if;
  perform porch_retag(new.post_id); return null;
end $$;
drop trigger if exists porch_retag_comment on public.porch_comments;
create trigger porch_retag_comment after insert or delete or update of body, hidden_at on public.porch_comments
  for each row execute function public.porch_retag_comment();

-- the tags people use most (last 90 days), for the # picker
create or replace function public.porch_top_tags()
returns table (tag text, n bigint)
language sql stable security definer set search_path = public as $$
  select tag, count(*) as n from porch_post_tags
   where created_at > now() - interval '90 days'
   group by tag order by n desc, tag limit 30;
$$;
revoke all on function public.porch_top_tags() from public;
grant execute on function public.porch_top_tags() to anon, authenticated;

-- tag everything that is already on the Porch
do $$ declare r record; begin
  for r in select id from porch_posts where hidden_at is null and group_id is null
            and (body like '%#%' or exists (select 1 from porch_comments c where c.post_id = porch_posts.id and c.body like '%#%'))
  loop perform porch_retag(r.id); end loop;
end $$;

-- A correct result: one row, status 'tags: ok'. tags_found is how many were already on the Porch (0 is fine).
select 'tags: ok' as status, (select count(*) from public.porch_post_tags) as tags_found;

-- porch_80_prayer_jar.sql (5 Nov 2026, Mike) -- Recovery Misfits project
-- COOKIE'S PRAYER JAR: Corinna's private place to keep the prayers she writes.
-- Only her (prayer_jar_users) gets the button, and only the writer can ever read a prayer.
-- Also rm_menu_extras(): one call so "your menu" shows the same rows on every page.
create table if not exists public.prayer_jar_users (handle text primary key);
insert into public.prayer_jar_users (handle) values ('fire_l0ve') on conflict do nothing;
alter table public.prayer_jar_users enable row level security;   -- no policies: nobody reads it through the API

create or replace function public.prayer_jar_ok() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from auth.users u join public.prayer_jar_users p on p.handle = lower(split_part(u.email, '@', 1)) where u.id = auth.uid());
$$;

create table if not exists public.porch_prayers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 120),
  body       text not null check (char_length(body) between 1 and 20000),
  prayed_on  date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists porch_prayers_mine on public.porch_prayers (user_id, prayed_on desc, created_at desc);
alter table public.porch_prayers enable row level security;
drop policy if exists "my prayers" on public.porch_prayers;
create policy "my prayers" on public.porch_prayers for all
  using (user_id = auth.uid() and public.prayer_jar_ok())
  with check (user_id = auth.uid() and public.prayer_jar_ok());

grant select, insert, update, delete on public.porch_prayers to authenticated;

create or replace function public.rm_menu_extras() returns json
language sql stable security definer set search_path to 'public' as $$
  select json_build_object(
    'board',   public.cornerstones_is_board(),
    'mod',     exists (select 1 from public.porch_moderators where user_id = auth.uid()),
    'prayers', public.prayer_jar_ok());
$$;
revoke all on function public.rm_menu_extras() from public, anon;
grant execute on function public.rm_menu_extras() to authenticated;
revoke all on function public.prayer_jar_ok() from public, anon;
grant execute on function public.prayer_jar_ok() to authenticated;

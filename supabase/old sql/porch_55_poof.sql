-- ============================================================
-- THE PORCH, STEP 55: POOF. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- A Poof is one picture in a private chat that can be opened ONCE, for 10 seconds.
-- Mike's rules:
--   * Only between two people who are friends AND have built a rapport: each of them
--     has sent the other at least 5 messages (10 back and forth).
--   * Each person flips Poof ON for themselves. It starts OFF. Both have to be on.
--   * Same picture rule as Messages: spicy is fine, full nudity is blocked. That is
--     checked by the porch function before anything is stored.
--   * The picture lives in its own locked bucket that NO phone can read. Only the
--     porch function can hand it over, once.
-- ============================================================

-- ---------- 1. the switch (yours only; nobody else can read it) ----------
create table if not exists public.porch_poof (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  is_on      boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.porch_poof enable row level security;
drop policy if exists "your own poof switch" on public.porch_poof;
create policy "your own poof switch" on public.porch_poof for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.porch_poof from anon, authenticated;

create or replace function public.porch_poof_set(p_on boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = 'P0001'; end if;
  insert into porch_poof (user_id, is_on) values (auth.uid(), coalesce(p_on, false))
  on conflict (user_id) do update set is_on = excluded.is_on, updated_at = now();
  return coalesce(p_on, false);
end $$;
revoke all on function public.porch_poof_set(boolean) from public, anon;
grant execute on function public.porch_poof_set(boolean) to authenticated;

-- ---------- 2. the message columns ----------
alter table public.porch_dm add column if not exists poof          boolean not null default false;
alter table public.porch_dm add column if not exists poof_seen_at  timestamptz;
alter table public.porch_dm add column if not exists poof_reported boolean not null default false;
create index if not exists porch_dm_poof_files on public.porch_dm (created_at) where poof and photo_paths <> '{}';

-- ---------- 3. the rapport rule ----------
-- how many real messages (not Poofs, not unsent) x has sent y
create or replace function public.porch_poof_count(x uuid, y uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from porch_dm d join porch_threads t on t.id = d.thread_id
   where t.a = least(x, y) and t.b = greatest(x, y) and d.from_id = x and not d.poof and d.unsent_at is null;
$$;
revoke all on function public.porch_poof_count(uuid, uuid) from public, anon, authenticated;

-- '' = x may send y a Poof. Anything else says why not. The porch function asks this.
create or replace function public.porch_poof_can(x uuid, y uuid)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if x is null or y is null or x = y then return 'nope'; end if;
  if public.porch_blocked(x, y) or not public.porch_are_friends(x, y) then return 'friends'; end if;
  if public.porch_poof_count(x, y) < 5 or public.porch_poof_count(y, x) < 5 then return 'rapport'; end if;
  if not coalesce((select is_on from porch_poof where user_id = x), false) then return 'me_off'; end if;
  if not coalesce((select is_on from porch_poof where user_id = y), false) then return 'them_off'; end if;
  return '';
end $$;
revoke all on function public.porch_poof_can(uuid, uuid) from public, anon, authenticated;
grant execute on function public.porch_poof_can(uuid, uuid) to service_role;

-- what the chat screen asks. Their switch is only told once the rapport is there.
create or replace function public.porch_poof_state(p_other uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); ok boolean; mine int; theirs int;
begin
  if me is null or p_other is null or me = p_other then return jsonb_build_object('rapport', false, 'me_on', false, 'them_on', false); end if;
  mine := public.porch_poof_count(me, p_other); theirs := public.porch_poof_count(p_other, me);
  ok := mine >= 5 and theirs >= 5 and public.porch_are_friends(me, p_other) and not public.porch_blocked(me, p_other);
  return jsonb_build_object(
    'rapport', ok,
    'me_on',   coalesce((select is_on from porch_poof where user_id = me), false),
    'them_on', ok and coalesce((select is_on from porch_poof where user_id = p_other), false));
end $$;
revoke all on function public.porch_poof_state(uuid) from public, anon;
grant execute on function public.porch_poof_state(uuid) to authenticated;

-- ---------- 4. the locked bucket: private, and NO policy, so no phone can read it ----------
insert into storage.buckets (id, name, public)
values ('porch-poof', 'porch-poof', false)
on conflict (id) do update set public = false;

select 'porch step 55: ok' as status,
       (select count(*) from public.porch_poof where is_on) as people_with_poof_on,
       (select count(*) from public.porch_dm where poof) as poofs;

-- ============================================================
-- THE PORCH, STEP 27: LONGER SPINS (60 seconds). 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "Let people apply. 'I need longer Spins. Apply to have my account upgraded.'
-- It'd be based on how many you post and how active you are."
--
-- Spins stay 15 seconds for everybody. An account on the porch_spin_long list gets 60.
-- Anybody on the Porch can ask; a moderator sees the ask with that person's numbers
-- (Spins posted, shares, comments, days on the Porch) and says yes or not yet.
-- A "not yet" can ask again after 30 days.
-- The beta testers start with 60.
--
-- By hand, with their handle in it:
--   give 60:   insert into porch_spin_long (user_id) select user_id from porch_members where handle = 'somebody' on conflict do nothing;
--   take back: delete from porch_spin_long where user_id = (select user_id from porch_members where handle = 'somebody');
-- ============================================================

create table if not exists public.porch_spin_long (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.porch_spin_long enable row level security;      -- no policies: nobody reads it directly
revoke all on public.porch_spin_long from anon, authenticated;

create table if not exists public.porch_spin_long_asks (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  why        text check (why is null or char_length(why) <= 300),
  status     text not null default 'open' check (status in ('open', 'yes', 'no')),
  asked_at   timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.porch_spin_long_asks enable row level security;
revoke all on public.porch_spin_long_asks from anon, authenticated;

insert into public.porch_spin_long (user_id)
select m.user_id from public.porch_members m join public.porch_testers t on t.handle = m.handle
on conflict do nothing;

-- what the app asks: how long can MY Spins be, and did I already ask?
create or replace function public.porch_long_spin_me()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'long', exists (select 1 from porch_spin_long where user_id = auth.uid()),
    'max',  case when exists (select 1 from porch_spin_long where user_id = auth.uid()) then 60 else 15 end,
    'ask',  (select case when status = 'no' and decided_at < now() - interval '30 days' then null else status end
               from porch_spin_long_asks where user_id = auth.uid()));
$$;

-- "I need longer Spins"
create or replace function public.porch_long_spin_ask(p_why text default null)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a record;
begin
  if me is null or not public.porch_verified(me) then raise exception 'Confirm who you are first.' using errcode = 'P0001'; end if;
  if exists (select 1 from porch_spin_long where user_id = me) then return 'have'; end if;
  select * into a from porch_spin_long_asks where user_id = me;
  if found and a.status = 'open' then return 'open'; end if;
  if found and a.status = 'no' and a.decided_at > now() - interval '30 days' then
    raise exception 'Not yet. Keep posting, and ask again in a few weeks.' using errcode = 'P0001';
  end if;
  insert into porch_spin_long_asks (user_id, why, status, asked_at, decided_at)
  values (me, nullif(left(btrim(coalesce(p_why, '')), 300), ''), 'open', now(), null)
  on conflict (user_id) do update set why = excluded.why, status = 'open', asked_at = now(), decided_at = null;
  return 'open';
end $$;

-- the moderator's list, with the numbers to decide by
create or replace function public.porch_long_spin_asks()
returns table (user_id uuid, handle text, avatar_path text, why text, asked_at timestamptz,
               spins bigint, shares bigint, comments bigint, days_here int)
language sql stable security definer set search_path = public as $$
  select a.user_id, m.handle, m.avatar_path, a.why, a.asked_at,
         (select count(*) from porch_spins s where s.user_id = a.user_id and s.status = 'ready'),
         (select count(*) from porch_posts p where p.user_id = a.user_id and p.hidden_at is null),
         (select count(*) from porch_comments c where c.user_id = a.user_id and c.hidden_at is null),
         greatest(0, (current_date - m.created_at::date))::int
    from porch_spin_long_asks a join porch_members m on m.user_id = a.user_id
   where a.status = 'open' and public.porch_is_mod(auth.uid())
   order by a.asked_at;
$$;

-- yes or not yet
create or replace function public.porch_long_spin_decide(p_user uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.porch_is_mod(auth.uid()) then raise exception 'Moderators only.' using errcode = 'P0001'; end if;
  update porch_spin_long_asks set status = case when p_yes then 'yes' else 'no' end, decided_at = now() where user_id = p_user;
  if p_yes then insert into porch_spin_long (user_id) values (p_user) on conflict do nothing;
  else delete from porch_spin_long where user_id = p_user; end if;
end $$;

revoke all on function public.porch_long_spin_me(), public.porch_long_spin_ask(text), public.porch_long_spin_asks(), public.porch_long_spin_decide(uuid, boolean) from public, anon;
grant execute on function public.porch_long_spin_me(), public.porch_long_spin_ask(text), public.porch_long_spin_asks(), public.porch_long_spin_decide(uuid, boolean) to authenticated;

-- check: should list the beta testers, each with 60-second Spins
select m.handle as has_60_second_spins
from public.porch_spin_long l join public.porch_members m on m.user_id = l.user_id
order by m.handle;

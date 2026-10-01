-- ============================================================
-- THE PORCH, STEP 21: TRUSTED GROUP STARTERS. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "give us three unlimited access to start groups, I am going to start some
-- feeder groups."
--
-- A short list of people who skip the "active member with 30 days" test, as the
-- Keeper or as the Co-keeper, and can have as many groups waiting as they like.
-- To start: tacomike417, fire_l0ve, krazyk226.
-- Everything else stays: it still takes two (the Co-keeper taps "I'm in"), and a
-- moderator still approves every group before it opens.
--
-- Later this is also how somebody who runs a good group gets trusted to start
-- another one: add them here.
--   add:     insert into porch_group_starters (user_id) select user_id from porch_members where handle = 'somebody';
--   remove:  delete from porch_group_starters where user_id = (select user_id from porch_members where handle = 'somebody');
-- ============================================================

create table if not exists public.porch_group_starters (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.porch_group_starters enable row level security;      -- no policies: nobody reads it directly
revoke all on public.porch_group_starters from anon, authenticated;

insert into public.porch_group_starters (user_id)
select user_id from public.porch_members where handle in ('tacomike417', 'fire_l0ve', 'krazyk226')
on conflict do nothing;

create or replace function public.porch_group_trusted(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_group_starters where user_id = u);
$$;
revoke all on function public.porch_group_trusted(uuid) from public, anon, authenticated;

create or replace function public.porch_group_can_start()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (public.porch_is_mod(auth.uid()) or public.porch_group_trusted(auth.uid())
    or (public.porch_active(auth.uid())
        and exists (select 1 from porch_members where user_id = auth.uid() and created_at <= now() - interval '30 days')));
$$;

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
  if not (public.porch_active(p_cokeeper) or public.porch_is_mod(p_cokeeper) or public.porch_group_trusted(p_cokeeper)) then
    raise exception 'Your Co-keeper needs to be an active member too. Pick somebody who''s been showing up.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 3 and 40 then raise exception 'Give the group a name, 3 to 40 letters.' using errcode = 'P0001'; end if;
  if exists (select 1 from porch_groups where lower(btrim(name)) = lower(btrim(p_name)) and status in ('waiting_cokeeper', 'waiting_review', 'open')) then
    raise exception 'There''s already a group with that name.' using errcode = 'P0001';
  end if;
  if (select count(*) from porch_groups where keeper_id = me and status in ('waiting_cokeeper', 'waiting_review')) >= 2 and not mod and not public.porch_group_trusted(me) then
    raise exception 'You already have groups waiting. Let those open first.' using errcode = 'P0001';
  end if;
  insert into porch_groups (name, about, who_for, kind, keeper_id, cokeeper_id)
  values (btrim(p_name), left(btrim(coalesce(p_about, '')), 200), left(btrim(coalesce(p_who, '')), 120),
          case when p_kind = 'ask' then 'ask' else 'open' end, me, p_cokeeper)
  returning id into g;
  perform public.porch_gnote(p_cokeeper, me, 'group_cokeeper', g);
  return g;
end $$;

revoke all on function public.porch_group_can_start(), public.porch_group_start(text, text, text, text, uuid) from public, anon;
grant execute on function public.porch_group_can_start(), public.porch_group_start(text, text, text, text, uuid) to authenticated;

-- check: should list the three of you
select m.handle as trusted_to_start_groups
from public.porch_group_starters s join public.porch_members m on m.user_id = s.user_id
order by m.handle;

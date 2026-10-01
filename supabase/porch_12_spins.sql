-- ============================================================
-- THE PORCH, STEP 12: SOBER SPINS. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Short videos, 15 seconds max, built exactly like Jeff's Loops, plus:
--   * RESPIN: put somebody's Spin on your own profile (they get told).
--   * MUSIC: free Freesound tracks nobody owns (the track is saved with the Spin).
--
-- How it fits the Porch: every Spin has a Porch share behind it (need =
-- 'moment'), so comments, Proud of you, saves, reports, notifications and
-- the moderator screen all work on Spins with nothing new. That share is
-- made when the video is ready, and the feed itself doesn't show it --
-- Spins live in their own row and player, like Loops.
--
-- Videos go straight from the phone to Bunny; the `spins` function holds
-- the Bunny key. A Spin lasts 30 days; pin up to 3 to keep them.
-- ============================================================

-- the share behind a Spin has no words or photos of its own sometimes
alter table public.porch_posts drop constraint if exists porch_posts_check;
alter table public.porch_posts add constraint porch_posts_check
  check (coalesce(char_length(body), 0) > 0 or cardinality(photo_paths) > 0 or need = 'moment');

-- ---------- spins ----------
create table if not exists public.porch_spins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_id     uuid references public.porch_posts(id) on delete set null,
  video_guid  text not null unique,
  caption     text check (char_length(caption) <= 500),
  muted       boolean not null default false,
  status      text not null default 'uploading' check (status in ('uploading','ready','failed')),
  pinned      boolean not null default false,
  length_s    real,
  width       int,
  height      int,
  resolutions text,
  music       jsonb,                                  -- { id, name, by } from Freesound
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days'
);
create index if not exists porch_spins_user on public.porch_spins (user_id, created_at desc);
create index if not exists porch_spins_new on public.porch_spins (created_at desc) where status = 'ready';
alter table public.porch_spins enable row level security;

drop policy if exists "read spins" on public.porch_spins;
create policy "read spins" on public.porch_spins for select
  using (
    auth.uid() = user_id
    or (status = 'ready'
        and (pinned or expires_at > now())
        and not public.porch_blocked(auth.uid(), user_id)
        and not exists (select 1 from public.porch_posts p where p.id = post_id and p.hidden_at is not null))
  );
revoke insert, update, delete on public.porch_spins from anon, authenticated;   -- only through the spins function

-- ---------- respins ----------
create table if not exists public.porch_respins (
  user_id    uuid not null references auth.users(id) on delete cascade,
  spin_id    uuid not null references public.porch_spins(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spin_id)
);
create index if not exists porch_respins_spin on public.porch_respins (spin_id);
alter table public.porch_respins enable row level security;
drop policy if exists "anyone reads respins" on public.porch_respins;
create policy "anyone reads respins" on public.porch_respins for select
  using (not public.porch_blocked(auth.uid(), user_id));
drop policy if exists "respin" on public.porch_respins;
create policy "respin" on public.porch_respins for insert to authenticated
  with check (auth.uid() = user_id and public.porch_can_act(auth.uid())
              and exists (select 1 from public.porch_spins s
                           where s.id = spin_id and s.status = 'ready' and s.user_id <> auth.uid()
                             and not public.porch_blocked(auth.uid(), s.user_id)));
drop policy if exists "undo a respin" on public.porch_respins;
create policy "undo a respin" on public.porch_respins for delete to authenticated
  using (auth.uid() = user_id);

-- ---------- alerts: "respun your Spin" ----------
alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept','respin'));

create or replace function public.porch_note_respin()
returns trigger language plpgsql security definer set search_path = public as $$
declare s porch_spins;
begin
  if tg_op = 'INSERT' then
    select * into s from porch_spins where id = new.spin_id;
    perform public.porch_note(s.user_id, new.user_id, 'respin', s.post_id, null);
    return new;
  end if;
  select * into s from porch_spins where id = old.spin_id;
  if s.id is not null then
    delete from porch_notes where actor_id = old.user_id and user_id = s.user_id and kind = 'respin' and post_id is not distinct from s.post_id;
  end if;
  return old;
end $$;
drop trigger if exists porch_note_respin on public.porch_respins;
create trigger porch_note_respin after insert or delete on public.porch_respins
  for each row execute function public.porch_note_respin();

-- spam cap: 100 respins an hour
create or replace function public.porch_respin_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from porch_respins where user_id = new.user_id and created_at > now() - interval '1 hour') >= 100 then
    raise exception 'slow down' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists porch_respin_cap on public.porch_respins;
create trigger porch_respin_cap before insert on public.porch_respins
  for each row execute function public.porch_respin_cap();

select 'porch step 12: ok' as status,
       (select count(*) from public.porch_spins) as spins,
       (select count(*) from public.porch_respins) as respins;

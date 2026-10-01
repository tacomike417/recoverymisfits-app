-- ============================================================
-- THE PORCH, STEP 7: the rest of the list. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
--   1. Save a share (private: only you ever see what you saved)
--   2. Link previews (the porch function fills these in)
--   3. The 3-day wait now covers reacting, following and reporting too,
--      and a blocked person can't react to your shares
--   4. Spam caps: 300 reactions, 50 follows an hour; 20 reports a day
--   5. "Somebody might be in danger" reports NEVER pause the person.
--      They go straight to the moderators instead.
--   6. Moderators get a notification for every new report
--   7. Phone notifications: where each phone's push address is kept, and a
--      trigger that hands every new notification to the porch-push function
-- ============================================================

-- ---------- 1. saves ----------
create table if not exists public.porch_saves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.porch_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.porch_saves enable row level security;
drop policy if exists "your own saves" on public.porch_saves;
create policy "your own saves" on public.porch_saves for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 2. link previews ----------
alter table public.porch_posts add column if not exists link_preview jsonb;

-- ---------- 3. who can act: confirmed, not paused, account 3+ days old ----------
create or replace function public.porch_can_act(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.porch_verified(p)
     and exists (select 1 from auth.users u where u.id = p and u.created_at < now() - interval '3 days');
$$;

drop policy if exists "confirmed members react" on public.porch_reactions;
create policy "confirmed members react" on public.porch_reactions for insert to authenticated
  with check (auth.uid() = user_id and public.porch_can_act(auth.uid())
              and not public.porch_blocked(auth.uid(), (select p.user_id from public.porch_posts p where p.id = post_id)));

drop policy if exists "confirmed members follow" on public.porch_follows;
create policy "confirmed members follow" on public.porch_follows for insert to authenticated
  with check (auth.uid() = follower_id and public.porch_can_act(auth.uid())
              and not public.porch_blocked(follower_id, followed_id));

drop policy if exists "confirmed members report" on public.porch_reports;
create policy "confirmed members report" on public.porch_reports for insert to authenticated
  with check (auth.uid() = reporter_id and public.porch_can_act(auth.uid()));

-- ---------- 4. spam caps ----------
create or replace function public.porch_cap()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'porch_reactions' then
    select count(*) into n from porch_reactions where user_id = new.user_id and created_at > now() - interval '1 hour';
    if n >= 300 then raise exception 'slow down' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'porch_follows' then
    select count(*) into n from porch_follows where follower_id = new.follower_id and created_at > now() - interval '1 hour';
    if n >= 50 then raise exception 'slow down' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'porch_reports' then
    select count(*) into n from porch_reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
    if n >= 20 then raise exception 'slow down' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
drop trigger if exists porch_cap on public.porch_reactions;
create trigger porch_cap before insert on public.porch_reactions for each row execute function public.porch_cap();
drop trigger if exists porch_cap on public.porch_follows;
create trigger porch_cap before insert on public.porch_follows for each row execute function public.porch_cap();
drop trigger if exists porch_cap on public.porch_reports;
create trigger porch_cap before insert on public.porch_reports for each row execute function public.porch_cap();

-- ---------- 5 + 6. reports: danger reports never pause; moderators are told ----------
alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report'));

create or replace function public.porch_report_added()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := public.porch_report_target(new);
  reporters int;
  m uuid;
begin
  if target is null or target = new.reporter_id then return new; end if;
  -- every moderator hears about it (shown as coming from the reported person, not the reporter)
  for m in select user_id from porch_moderators loop
    if m <> target then
      insert into porch_notes (user_id, actor_id, kind, post_id, comment_id)
      values (m, target, 'report', coalesce(new.post_id, (select post_id from porch_comments where id = new.comment_id)), new.comment_id);
    end if;
  end loop;
  if new.reason = 'self_harm' then return new; end if;              -- never pause somebody who might be hurting
  if exists (select 1 from porch_moderators where user_id = target) then return new; end if;
  select count(distinct r.reporter_id) into reporters
    from porch_reports r
   where public.porch_report_target(r) = target
     and r.handled_at is null
     and r.reason <> 'self_harm'
     and r.created_at > now() - interval '30 days';
  if reporters >= 3 then
    update porch_members set frozen_at = coalesce(frozen_at, now()) where user_id = target;
  end if;
  return new;
end $$;

-- moderators can see that they ARE moderators (the app shows them the Reports screen)
drop policy if exists "see if you are a moderator" on public.porch_moderators;
create policy "see if you are a moderator" on public.porch_moderators for select to authenticated
  using (auth.uid() = user_id);

-- ---------- 7. phone notifications ----------
create table if not exists public.porch_push (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists porch_push_user on public.porch_push (user_id);
alter table public.porch_push enable row level security;
drop policy if exists "your own phones" on public.porch_push;
create policy "your own phones" on public.porch_push for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- private settings only the server reads (the push keys and the trigger's password
-- are made and kept here automatically; nothing to copy anywhere)
create table if not exists public.porch_settings (key text primary key, value text not null);
alter table public.porch_settings enable row level security;
revoke all on public.porch_settings from anon, authenticated;
insert into public.porch_settings (key, value)
values ('push_secret', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

create extension if not exists pg_net;

create or replace function public.porch_push_note()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if not exists (select 1 from porch_push where user_id = new.user_id) then return new; end if;
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('note_id', new.id)
  );
  return new;
exception when others then
  return new;                                   -- a push problem never blocks the notification itself
end $$;
drop trigger if exists porch_push_note on public.porch_notes;
create trigger porch_push_note after insert on public.porch_notes
  for each row execute function public.porch_push_note();

select 'porch step 7: ok' as status,
       (select count(*) from public.porch_moderators) as moderators,
       (select count(*) from public.porch_settings) as settings;

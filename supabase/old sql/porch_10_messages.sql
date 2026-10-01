-- ============================================================
-- THE PORCH, STEP 10: MESSAGES. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * Private chats between FRIENDS only. Words, photos and links.
-- * Rated R, not rated X (Mike): adults talking like adults. Slurs, threats and
--   scam/porn links are stopped; spicy photos come through blurred ("Tap to
--   see"); full nudity is blocked. All of that is checked by the porch function,
--   so nothing goes straight into these tables from a phone.
-- * Only the two people in a chat can ever read it. Photos live in a PRIVATE
--   bucket that only those two can open.
-- * Blocking somebody hides the chat and stops new messages, both ways.
-- * Every new message hands off to porch-push for the buzz on their phone.
-- ============================================================

-- ---------- chats (one per pair, smaller id first) ----------
create table if not exists public.porch_threads (
  id           uuid primary key default gen_random_uuid(),
  a            uuid not null references auth.users(id) on delete cascade,
  b            uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_at      timestamptz not null default now(),
  last_from    uuid,
  last_preview text,
  a_read_at    timestamptz,
  b_read_at    timestamptz,
  unique (a, b),
  check (a < b)
);
create index if not exists porch_threads_a on public.porch_threads (a, last_at desc);
create index if not exists porch_threads_b on public.porch_threads (b, last_at desc);
alter table public.porch_threads enable row level security;
drop policy if exists "your own chats" on public.porch_threads;
create policy "your own chats" on public.porch_threads for select to authenticated
  using ((auth.uid() = a or auth.uid() = b) and not public.porch_blocked(a, b));
revoke insert, update, delete on public.porch_threads from anon, authenticated;

-- ---------- messages ----------
create table if not exists public.porch_dm (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.porch_threads(id) on delete cascade,
  from_id     uuid not null references auth.users(id) on delete cascade,
  body        text check (char_length(body) <= 2000),
  photo_paths text[] not null default '{}',
  racy        boolean not null default false,     -- spicy photo: shown blurred until tapped
  created_at  timestamptz not null default now(),
  unsent_at   timestamptz
);
create index if not exists porch_dm_thread on public.porch_dm (thread_id, created_at desc);
alter table public.porch_dm enable row level security;
drop policy if exists "messages in your own chats" on public.porch_dm;
create policy "messages in your own chats" on public.porch_dm for select to authenticated
  using (exists (select 1 from public.porch_threads t
                  where t.id = thread_id and (auth.uid() = t.a or auth.uid() = t.b)
                    and not public.porch_blocked(t.a, t.b)));
revoke insert, update, delete on public.porch_dm from anon, authenticated;

-- ---------- read marks + the unread count ----------
create or replace function public.porch_dm_read(p_thread uuid)
returns void language sql security definer set search_path = public as $$
  update porch_threads
     set a_read_at = case when a = auth.uid() then now() else a_read_at end,
         b_read_at = case when b = auth.uid() then now() else b_read_at end
   where id = p_thread and (a = auth.uid() or b = auth.uid());
$$;
grant execute on function public.porch_dm_read(uuid) to authenticated;

create or replace function public.porch_dm_unread()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from porch_threads t
   where (t.a = auth.uid() or t.b = auth.uid())
     and t.last_from is not null and t.last_from <> auth.uid()
     and not public.porch_blocked(t.a, t.b)
     and t.last_at > coalesce(case when t.a = auth.uid() then t.a_read_at else t.b_read_at end, '-infinity');
$$;
grant execute on function public.porch_dm_unread() to authenticated;

-- ---------- private photos ----------
insert into storage.buckets (id, name, public)
values ('porch-dm', 'porch-dm', false)
on conflict (id) do update set public = false;

drop policy if exists "porch dm photos: only the two people in the chat" on storage.objects;
create policy "porch dm photos: only the two people in the chat" on storage.objects for select to authenticated
  using (bucket_id = 'porch-dm' and exists (
    select 1 from public.porch_threads t
     where t.id::text = (storage.foldername(name))[1]
       and (auth.uid() = t.a or auth.uid() = t.b)));

-- ---------- the buzz: every new message goes to porch-push ----------
create or replace function public.porch_push_dm()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text; t porch_threads; them uuid;
begin
  select * into t from porch_threads where id = new.thread_id;
  them := case when t.a = new.from_id then t.b else t.a end;
  if not exists (select 1 from porch_push where user_id = them) then return new; end if;
  select value into s from porch_settings where key = 'push_secret';
  perform net.http_post(
    url     := 'https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-porch-secret', s),
    body    := jsonb_build_object('dm_id', new.id)
  );
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists porch_push_dm on public.porch_dm;
create trigger porch_push_dm after insert on public.porch_dm
  for each row execute function public.porch_push_dm();

-- leaving the Porch takes your chats with you
-- (the porch function's "leave" deletes threads you're in; photos go with the folder)

select 'porch step 10: ok' as status,
       (select count(*) from public.porch_threads) as chats,
       (select count(*) from public.porch_dm) as messages;

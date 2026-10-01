-- ============================================================
-- THE PORCH, STEP 17: HEART A COMMENT OR A REPLY. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "i want to put the ability to heart on comments and comment replies"
-- * Anybody who can react on the Porch can heart any comment or reply
--   (not their own), and tap again to take it back.
-- * The person who wrote it gets "loved your comment" (bell + phone alert).
--   Taking the heart back takes the alert back too.
-- * Same spam cap as the other reactions: 300 an hour.
-- ============================================================

create table if not exists public.porch_comment_hearts (
  comment_id uuid not null references public.porch_comments(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists porch_comment_hearts_user on public.porch_comment_hearts (user_id, created_at desc);
alter table public.porch_comment_hearts enable row level security;

drop policy if exists "anyone reads comment hearts" on public.porch_comment_hearts;
create policy "anyone reads comment hearts" on public.porch_comment_hearts for select using (true);
drop policy if exists "heart a comment" on public.porch_comment_hearts;
create policy "heart a comment" on public.porch_comment_hearts for insert to authenticated
  with check (auth.uid() = user_id and public.porch_can_act(auth.uid())
              and not public.porch_blocked(auth.uid(), (select c.user_id from public.porch_comments c where c.id = comment_id)));
drop policy if exists "take back a comment heart" on public.porch_comment_hearts;
create policy "take back a comment heart" on public.porch_comment_hearts for delete to authenticated
  using (auth.uid() = user_id);

-- the new kind of alert
alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept','respin','comment_love'));

create or replace function public.porch_note_comment_heart()
returns trigger language plpgsql security definer set search_path = public as $$
declare c porch_comments;
begin
  if tg_op = 'INSERT' then
    select * into c from porch_comments where id = new.comment_id;
    perform public.porch_note(c.user_id, new.user_id, 'comment_love', c.post_id, c.id);
    return new;
  end if;
  delete from porch_notes where actor_id = old.user_id and kind = 'comment_love' and comment_id = old.comment_id;
  return old;
end $$;
drop trigger if exists porch_note_comment_heart on public.porch_comment_hearts;
create trigger porch_note_comment_heart after insert or delete on public.porch_comment_hearts
  for each row execute function public.porch_note_comment_heart();

create or replace function public.porch_comment_heart_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from porch_comment_hearts where user_id = new.user_id and created_at > now() - interval '1 hour') >= 300 then
    raise exception 'slow down' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists porch_comment_heart_cap on public.porch_comment_hearts;
create trigger porch_comment_heart_cap before insert on public.porch_comment_hearts
  for each row execute function public.porch_comment_heart_cap();

-- check: should say ready
select 'comment hearts ready' as status, count(*) as hearts_so_far from public.porch_comment_hearts;

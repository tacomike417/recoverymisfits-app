-- ============================================================
-- THE PORCH, STEP 6: replies and edits. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * Reply to a comment, the Facebook way: one level deep. A reply to a
--   reply hangs under the same first comment.
-- * Edit your own share or comment. It goes through the same word, link and
--   heat checks as a new one (the porch function does that), and shows "edited".
-- * New notification: "reply" (somebody replied to your comment).
-- ============================================================

alter table public.porch_comments add column if not exists parent_id uuid references public.porch_comments(id) on delete cascade;
alter table public.porch_comments add column if not exists edited_at timestamptz;
alter table public.porch_posts    add column if not exists edited_at timestamptz;
create index if not exists porch_comments_parent on public.porch_comments (parent_id) where parent_id is not null;

alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow'));

-- a new comment: a reply tells the person replied to; everything tells the
-- share's owner (once); @tags tell whoever is tagged (once)
create or replace function public.porch_note_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; pa uuid; u uuid;
begin
  select user_id into owner from porch_posts where id = new.post_id;
  if new.parent_id is not null then
    select user_id into pa from porch_comments where id = new.parent_id;
    perform public.porch_note(pa, new.user_id, 'reply', new.post_id, new.id);
  end if;
  if owner is distinct from pa then
    perform public.porch_note(owner, new.user_id, 'comment', new.post_id, new.id);
  end if;
  for u in select * from public.porch_mentioned(new.body) loop
    if u is distinct from owner and u is distinct from pa then
      perform public.porch_note(u, new.user_id, 'mention', new.post_id, new.id);
    end if;
  end loop;
  return new;
end $$;

select 'porch step 6: ok' as status,
       (select count(*) from public.porch_comments where parent_id is not null) as replies;

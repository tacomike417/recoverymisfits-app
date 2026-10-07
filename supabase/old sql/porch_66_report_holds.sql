-- ============================================================
-- THE PORCH, STEP 66: a report takes the post down until a moderator looks.
-- 7 Oct 2026, Mike: "we have to use the honor system and trust these guys
-- will do the next right thing. but let the report button definitely flag
-- and take down the post until it has been moderated."
--
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * ONE report on a share or a comment hides it right away. It is "held",
--   not gone: held_at says a report did it and nobody has looked yet.
-- * A moderator then picks: "It's fine" puts it back, "Take it down" keeps
--   it down.
-- * NOT held: "Somebody might be in danger" reports (a cry for help stays
--   up so people can answer it), anything a moderator posted, and a report
--   on a whole profile (there is no single post to hold).
-- * Everything else about reports is unchanged: moderators get a note for
--   every report, and 3 different people reporting someone still pauses them.
-- ============================================================

alter table public.porch_posts    add column if not exists held_at timestamptz;
alter table public.porch_comments add column if not exists held_at timestamptz;

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
  if new.reason = 'self_harm' then return new; end if;              -- never pause or hide somebody who might be hurting
  if exists (select 1 from porch_moderators where user_id = target) then return new; end if;
  -- STEP 66: the reported thing comes down until a moderator looks
  if new.post_id is not null then
    update porch_posts set hidden_at = now(), held_at = now() where id = new.post_id and hidden_at is null;
  elsif new.comment_id is not null then
    update porch_comments set hidden_at = now(), held_at = now() where id = new.comment_id and hidden_at is null;
  end if;
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

-- A correct result: one row, status 'porch step 66: ok', both columns true.
select 'porch step 66: ok' as status,
       exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'porch_posts' and column_name = 'held_at') as posts_can_be_held,
       exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'porch_comments' and column_name = 'held_at') as comments_can_be_held;

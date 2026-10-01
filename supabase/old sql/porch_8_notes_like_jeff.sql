-- ============================================================
-- THE PORCH, STEP 8: notifications the way Jeff's site does them. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * No repeats: the same person doing the same thing to the same share or
--   comment only tells you once a day (stops follow/unfollow spam too).
-- * Each notification buzzes a phone once, and only while it's fresh.
-- * Read notifications older than 60 days clean themselves up.
-- ============================================================

alter table public.porch_notes add column if not exists pushed_at timestamptz;
create index if not exists porch_notes_unread on public.porch_notes (user_id) where read_at is null;

create or replace function public.porch_note(p_user uuid, p_actor uuid, p_kind text, p_post uuid, p_comment uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor or public.porch_blocked(p_user, p_actor) then return; end if;
  if not exists (select 1 from porch_members where user_id = p_user) then return; end if;
  if exists (select 1 from porch_notes
              where user_id = p_user and actor_id = p_actor and kind = p_kind
                and post_id is not distinct from p_post and comment_id is not distinct from p_comment
                and created_at > now() - interval '1 day') then return; end if;
  insert into porch_notes (user_id, actor_id, kind, post_id, comment_id)
  values (p_user, p_actor, p_kind, p_post, p_comment);
end $$;

-- the push function claims a notification before it buzzes, so it only ever goes once
create or replace function public.porch_claim_push(p_id uuid)
returns setof public.porch_notes language sql security definer set search_path = public as $$
  update porch_notes set pushed_at = now()
   where id = p_id and pushed_at is null and created_at > now() - interval '1 hour'
  returning *;
$$;
revoke all on function public.porch_claim_push(uuid) from anon, authenticated;

-- tidy-up: read ones older than 60 days (runs every night at 4am Eastern if pg_cron is on)
create or replace function public.porch_prune_notes()
returns void language sql security definer set search_path = public as $$
  delete from porch_notes where read_at is not null and read_at < now() - interval '60 days';
$$;
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('porch-prune-notes') where exists (select 1 from cron.job where jobname = 'porch-prune-notes');
    perform cron.schedule('porch-prune-notes', '0 8 * * *', 'select public.porch_prune_notes()');
  end if;
end $$;

select 'porch step 8: ok' as status,
       (select count(*) from public.porch_notes) as notifications;

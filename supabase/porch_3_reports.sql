-- ============================================================
-- THE PORCH, STEP 3: reports pause people, a person unpauses. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * 3 DIFFERENT confirmed members reporting someone (their posts, comments or
--   profile) within 30 days pauses that person: they can still read, but
--   can't post, comment or react until a moderator looks.
-- * The pause lifts on its own once every open report about them is handled.
-- * Moderators are never paused.
-- ============================================================

create or replace function public.porch_report_target(r public.porch_reports)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(r.member_id,
                  (select user_id from porch_posts where id = r.post_id),
                  (select user_id from porch_comments where id = r.comment_id));
$$;

create or replace function public.porch_report_added()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := public.porch_report_target(new);
  reporters int;
begin
  if target is null or target = new.reporter_id then return new; end if;
  if exists (select 1 from porch_moderators where user_id = target) then return new; end if;
  select count(distinct r.reporter_id) into reporters
    from porch_reports r
   where public.porch_report_target(r) = target
     and r.handled_at is null
     and r.created_at > now() - interval '30 days';
  if reporters >= 3 then
    update porch_members set frozen_at = coalesce(frozen_at, now()) where user_id = target;
  end if;
  return new;
end $$;
drop trigger if exists porch_report_added on public.porch_reports;
create trigger porch_report_added after insert on public.porch_reports
  for each row execute function public.porch_report_added();

create or replace function public.porch_report_handled()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := public.porch_report_target(new);
begin
  if new.handled_at is not null and old.handled_at is null and target is not null
     and not exists (select 1 from porch_reports r
                      where public.porch_report_target(r) = target and r.handled_at is null) then
    update porch_members set frozen_at = null where user_id = target;
  end if;
  return new;
end $$;
drop trigger if exists porch_report_handled on public.porch_reports;
create trigger porch_report_handled after update on public.porch_reports
  for each row execute function public.porch_report_handled();

-- a report is only accepted once per person per thing
create unique index if not exists porch_reports_once
  on public.porch_reports (reporter_id, coalesce(post_id, comment_id, member_id));

-- make Mike the first moderator (his Recovery Misfits username is tacomike417)
insert into public.porch_moderators (user_id)
select id from auth.users where email = 'tacomike417@rm.invalid'
on conflict do nothing;

select 'porch step 3: ok' as status,
       (select count(*) from public.porch_moderators) as moderators;

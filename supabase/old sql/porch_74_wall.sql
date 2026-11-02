-- ============================================================
-- THE PORCH, STEP 74: WRITE ON SOMEBODY'S PAGE. 23 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "we have the new people circles there, and it says say hi, but there is no way to
-- post hi or anything on their feed... can we make it so I can post on these peoples feeds
-- like they do in facebook? same post types as my personal nothing new but we need that
-- breadcrumb thing like they do on facebook" (Dan Buckley ▸ Mike Nasvadi).
--
-- * A share can be written ON somebody's page: wall_of = whose page. It is still the
--   writer's share (user_id). It shows on the Porch with "Writer ▸ Whose page", and in
--   the grid on that person's profile.
-- * The person whose page it is can delete it (the porch function checks wall_of too),
--   and gets an alert: "wrote on your page".
-- * Any confirmed member can write on any member's page, unless one has blocked the
--   other. Not in a group, not a reshare. The porch function checks all of that.
-- ============================================================

alter table public.porch_posts add column if not exists wall_of uuid references auth.users(id) on delete cascade;
create index if not exists porch_posts_wall on public.porch_posts (wall_of, created_at desc) where wall_of is not null and hidden_at is null;

alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept','respin','comment_love',
                  'group_cokeeper','group_review','group_open','group_declined','group_ask','group_in','group_quiet','group_closed',
                  'reshare','wall'));

-- tell the person whose page it is
create or replace function public.porch_note_wall()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.wall_of is null or new.wall_of = new.user_id then return new; end if;
  perform public.porch_note(new.wall_of, new.user_id, 'wall', new.id, null);
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists porch_note_wall on public.porch_posts;
create trigger porch_note_wall after insert on public.porch_posts
  for each row execute function public.porch_note_wall();

-- check: should say ready
select 'wall ready' as status, (select count(*) from public.porch_posts where wall_of is not null) as wall_posts_so_far;

-- ============================================================
-- THE PORCH, STEP 24: RESHARE A POST. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike kept this one from the big list: put somebody's share on the Porch for your
-- friends, with a few words of your own if you want. Like Respin, for posts.
--
-- * A reshare is a share of its own that points at the original.
-- * The original always shows with its author's name. If the author deletes it,
--   the reshares go with it.
-- * Never from inside a group (what's shared in a group stays in the group), and
--   Spins use Respin. The porch function checks both.
-- * The author gets "reshared your share". No reshare counts anywhere.
-- ============================================================

alter table public.porch_posts add column if not exists reshare_of uuid references public.porch_posts(id) on delete cascade;
create index if not exists porch_posts_reshare on public.porch_posts (reshare_of) where reshare_of is not null;

alter table public.porch_notes drop constraint if exists porch_notes_kind_check;
alter table public.porch_notes add constraint porch_notes_kind_check
  check (kind in ('comment','reply','proud','metoo','mention','follow','report','friend_request','friend_accept','respin','comment_love',
                  'group_cokeeper','group_review','group_open','group_declined','group_ask','group_in','group_quiet','group_closed',
                  'reshare'));

-- tell the author
create or replace function public.porch_note_reshare()
returns trigger language plpgsql security definer set search_path = public as $$
declare who uuid;
begin
  if new.reshare_of is null then return new; end if;
  select user_id into who from porch_posts where id = new.reshare_of;
  perform public.porch_note(who, new.user_id, 'reshare', new.reshare_of, null);
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists porch_note_reshare on public.porch_posts;
create trigger porch_note_reshare after insert on public.porch_posts
  for each row execute function public.porch_note_reshare();

-- check: should say ready
select 'reshare ready' as status, (select count(*) from public.porch_posts where reshare_of is not null) as reshares_so_far;

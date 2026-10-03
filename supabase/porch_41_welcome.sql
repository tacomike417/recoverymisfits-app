-- ============================================================
-- THE PORCH, STEP 41: NOBODY SAYS HI INTO AN EMPTY ROOM. 3 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike, on getting people to stay: "I want to do number one for sure ... one of those
-- rails that you scroll through of new people on the site, welcome our new folks ...
-- and number four, I think that's a good one too."
--
--   1. THE HOUSE SAYS HI. The first time somebody shares, the Recovery Misfits account
--      leaves one comment on it. Once per person, ever. It is the house and it says so.
--   2. THE NEW FOLKS RAIL. porch_new_folks() hands the app the people who joined in the
--      last 14 days, so everybody can say hi.
--   3. THE HOUSE ACCOUNTS SAY YES. A friend request to a house account is accepted on
--      the spot, so a new person's friends list isn't empty on day one.
-- ============================================================

-- ---------- which accounts are the house ----------
create or replace function public.porch_house(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members
                 where user_id = p and handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober'));
$$;

-- ---------- 1. the house says hi ----------
alter table public.porch_members add column if not exists welcomed_at timestamptz;

-- everybody who has already shared something counts as welcomed (no late hellos on old posts)
update public.porch_members m set welcomed_at = now()
where m.welcomed_at is null and exists (select 1 from public.porch_posts p where p.user_id = m.user_id);

create or replace function public.porch_welcome_first_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare host uuid;
begin
  begin
    if new.hidden_at is not null or new.group_id is not null or new.reshare_of is not null then return null; end if;
    if public.porch_house(new.user_id) then return null; end if;
    update porch_members set welcomed_at = now() where user_id = new.user_id and welcomed_at is null;
    if not found then return null; end if;                       -- already welcomed
    select user_id into host from porch_members where handle = 'recoverymisfits';
    if host is null then return null; end if;
    insert into porch_comments (post_id, user_id, body)
    values (new.id, host, 'Welcome to the Porch. We''re glad you''re here. 👋');
  exception when others then
    null;                                                        -- a hello must never stop a share from posting
  end;
  return null;
end $$;
drop trigger if exists porch_welcome_first_post on public.porch_posts;
create trigger porch_welcome_first_post after insert on public.porch_posts
  for each row execute function public.porch_welcome_first_post();

-- ---------- 2. the new folks rail ----------
create or replace function public.porch_new_folks()
returns table (user_id uuid, handle text, avatar_path text, real_name text, post_id uuid)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.handle, m.avatar_path, m.real_name,
         (select p.id from porch_posts p
           where p.user_id = m.user_id and p.hidden_at is null and p.group_id is null
           order by p.created_at limit 1)
  from porch_members m
  where m.created_at > now() - interval '14 days'
    and m.frozen_at is null and m.away_at is null
    and m.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and (auth.uid() is not null or m.visibility = 'public')      -- a stranger only sees Public profiles
    and not public.porch_house(m.user_id)
    and not public.porch_blocked(auth.uid(), m.user_id)
  order by m.created_at desc
  limit 20;
$$;
revoke all on function public.porch_new_folks() from public;
grant execute on function public.porch_new_folks() to anon, authenticated;

-- ---------- 3. the house accounts say yes ----------
create or replace function public.porch_friend_request_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- a house account: yes, right away
  if public.porch_house(new.to_id) then
    delete from porch_friend_requests where (from_id = new.to_id and to_id = new.from_id) or (from_id = new.from_id and to_id = new.to_id);
    insert into porch_friends (a, b) values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id)) on conflict do nothing;
    perform public.porch_note(new.from_id, new.to_id, 'friend_accept', null, null);
    return null;
  end if;
  -- they already asked you? then this is a yes: you're friends
  if exists (select 1 from porch_friend_requests where from_id = new.to_id and to_id = new.from_id) then
    delete from porch_friend_requests where (from_id = new.to_id and to_id = new.from_id) or (from_id = new.from_id and to_id = new.to_id);
    insert into porch_friends (a, b) values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id)) on conflict do nothing;
    delete from porch_notes where user_id = new.from_id and actor_id = new.to_id and kind = 'friend_request';
    perform public.porch_note(new.to_id, new.from_id, 'friend_accept', null, null);
    return null;
  end if;
  if exists (select 1 from porch_friends where a = least(new.from_id, new.to_id) and b = greatest(new.from_id, new.to_id)) then
    delete from porch_friend_requests where from_id = new.from_id and to_id = new.to_id;
    return null;
  end if;
  perform public.porch_note(new.to_id, new.from_id, 'friend_request', null, null);
  return null;
end $$;

-- requests already waiting on a house account: say yes to those too
with waiting as (
  delete from public.porch_friend_requests r
  where public.porch_house(r.to_id)
  returning r.from_id, r.to_id
)
insert into public.porch_friends (a, b)
select least(from_id, to_id), greatest(from_id, to_id) from waiting
on conflict do nothing;

-- ---- what a correct result looks like: one row, status ok, waiting_on_house is 0
select 'porch step 41: ok' as status,
       (select count(*) from public.porch_friend_requests r where public.porch_house(r.to_id)) as waiting_on_house,
       (select count(*) from public.porch_new_folks()) as new_folks_in_14_days,
       exists (select 1 from public.porch_members where handle = 'recoverymisfits') as house_can_say_hi;

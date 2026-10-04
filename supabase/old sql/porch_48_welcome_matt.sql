-- ============================================================
-- THE PORCH, STEP 48: WELCOME MATT, THE GREETER ROBOT. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN AS MANY TIMES AS YOU LIKE.
--
-- Mike: "a humble servant of recovery misfits who has taken on the role as greeter but
-- he is a robot, just a worker robot that greets everyone ... I love Welcome Matt lol."
--
-- FIRST make the account ON THE SITE, the normal way (no Supabase screens): hold the
-- Account button, Add account, tap the sign-up tab, name welcomematt, pick a password.
-- THEN run this. It lets the account post without an email, makes it a tester, puts
-- "Welcome Matt", his picture, his banner and his line on the profile, makes the profile Public,
-- and adds him to the house accounts. He is NOT a moderator.
--
-- This step only makes HIM. What he says to new people is the next step.
-- ============================================================

do $$
declare u uuid;
begin
  select id into u from auth.users where email = 'welcomematt@rm.invalid';
  if u is null then return; end if;
  insert into porch_testers (handle) values ('welcomematt') on conflict do nothing;
  insert into porch_members (user_id, handle, verified_at, real_name) values (u, 'welcomematt', now(), 'Welcome Matt')
  on conflict (user_id) do update set verified_at = coalesce(porch_members.verified_at, now()), real_name = 'Welcome Matt';
  update porch_members
     set avatar_path = '/assets/house/welcomematt/avatar.webp',
         cover_path = '/assets/house/welcomematt/cover.webp',
         bio = 'Greeter robot. I set up the chairs, hold the door, and say hi. Glad you''re here.',
         visibility = 'public',
         welcomed_at = coalesce(welcomed_at, now())
   where user_id = u;
end $$;

-- he is one of the house accounts (no welcome for him, friend requests to him are a yes)
create or replace function public.porch_house(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from porch_members
                 where user_id = p and handle in ('recoverymisfits', 'spiritualmisfit', 'shitmysponsorsays', 'anotherdaysober', 'welcomematt'));
$$;

-- ---- what a correct result looks like
select case when u.id is null
         then 'NOT YET. Make the account on the site first (name: welcomematt), then run this again.'
         else 'ALL SET. Welcome Matt is ready.' end as status,
       m.handle, m.real_name as shows_as, m.bio as his_line,
       m.avatar_path is not null as has_picture, m.cover_path is not null as has_banner,
       m.verified_at is not null as can_post
from (select 1) x
left join auth.users u on u.email = 'welcomematt@rm.invalid'
left join public.porch_members m on m.user_id = u.id;

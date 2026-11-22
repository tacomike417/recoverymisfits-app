-- porch_83_reflect.sql (v267, 22 Nov 2026, Mike: READ | REFLECT | SHARE on the daily stack)
-- REFLECT = today's conversation about one reading. Each reading gets ONE thread a day, made the
-- first time anybody opens it. The thread is an ordinary Porch post from the house account
-- (recoverymisfits) with need = 'reflect', so the comments, hearts, replies, reports and alerts
-- the Porch already has all work on it. The feed hides need='reflect' posts (feed/porch.html);
-- they are only reached from the daily stack.

create unique index if not exists porch_posts_reflect_one_a_day
  on porch_posts ((link_preview->>'reflect'), (link_preview->>'day'))
  where need = 'reflect';

-- today's thread for a reading: found, or made. Signed-in people only.
create or replace function public.rm_reflect_thread(p_reading text, p_title text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  d text := to_char((now() at time zone 'America/New_York')::date, 'YYYY-MM-DD');
  r text := left(regexp_replace(coalesce(p_reading, ''), '[^a-z0-9-]', '', 'g'), 40);
  t text := left(regexp_replace(coalesce(p_title, ''), '[\r\n<>]', '', 'g'), 80);
  house uuid := '09e3fc86-154b-4902-b853-1babf130c6b9';
  pid uuid;
begin
  if auth.uid() is null or r = '' then return null; end if;
  select id into pid from porch_posts
   where need = 'reflect' and link_preview->>'reflect' = r and link_preview->>'day' = d limit 1;
  if pid is not null then return pid; end if;
  begin
    insert into porch_posts (user_id, need, body, link_preview)
    values (house, 'reflect',
            'Reflect: ' || coalesce(nullif(t, ''), r) || ' · ' || to_char((now() at time zone 'America/New_York')::date, 'FMDay, FMMonth FMDD'),
            jsonb_build_object('reflect', r, 'day', d))
    returning id into pid;
  exception when unique_violation then
    select id into pid from porch_posts
     where need = 'reflect' and link_preview->>'reflect' = r and link_preview->>'day' = d limit 1;
  end;
  return pid;
end $$;
revoke all on function public.rm_reflect_thread(text, text) from public, anon;
grant execute on function public.rm_reflect_thread(text, text) to authenticated;

-- how many people have said something on each reading today (for the little count on the cards)
create or replace function public.rm_reflect_counts()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(p.link_preview->>'reflect', n), '{}'::jsonb)
  from (
    select p.link_preview, count(c.*) n
    from porch_posts p join porch_comments c on c.post_id = p.id and c.hidden_at is null
    where p.need = 'reflect'
      and p.link_preview->>'day' = to_char((now() at time zone 'America/New_York')::date, 'YYYY-MM-DD')
    group by p.link_preview
  ) p;
$$;
revoke all on function public.rm_reflect_counts() from public, anon;
grant execute on function public.rm_reflect_counts() to authenticated;

-- 83b: let a post be a 'reflect' thread
alter table porch_posts drop constraint porch_posts_need_check;
alter table porch_posts add constraint porch_posts_need_check check (need = any (array['talk','experience','strength','hope','question','win','hard','moment','reflect']));

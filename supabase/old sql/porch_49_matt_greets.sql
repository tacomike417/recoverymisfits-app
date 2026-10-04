-- ============================================================
-- THE PORCH, STEP 49: WELCOME MATT GOES TO WORK. 4 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
-- Run AFTER porch_48 (Matt has to exist).
--
-- Mike's calls:
--   * "Both comment": the Recovery Misfits account still says welcome right away on a
--     first share (porch_41). Matt adds his own comment 2 to 8 minutes later, one of
--     ten lines, picked at random.
--   * Everybody new gets ONE message from Matt some time in their first day (1 to 20
--     hours after they join):
--       "Beep boop. Welcome to the Porch! I'm Matt, the greeter robot. I can't fix much,
--        but I can point you to the coffee. Take a look around, there's a lot of good
--        sobriety here."  and a yellow heart.
--   * "i dont want people to message him": nobody can reply. The app hides the typing
--     box in a chat with Matt and says he is a robot (v161).
--   * "in another message send the invite link like hey, invite a friend if you think
--     it'll help": a SECOND message, 2 to 6 hours after the first. It only goes out
--     from October 20 on (launch day): before that, an invited friend cannot get in.
-- Nobody who is already here gets a late hello or a late message.
--
-- To stop him:  select cron.unschedule('porch-matt-greets');
-- To see it:    select * from public.porch_greet order by coalesce(c_due, m_due) desc limit 20;
-- ============================================================

create table if not exists public.porch_greet (
  user_id  uuid primary key references auth.users(id) on delete cascade,   -- once per person, ever
  post_id  uuid,
  c_due    timestamptz,     -- when Matt's comment is due
  c_done   timestamptz,
  c_result text,
  m_due    timestamptz,     -- when Matt's message is due
  m_done   timestamptz,
  m_result text,
  i_due    timestamptz,     -- when the "invite a friend" message is due
  i_done   timestamptz,
  i_result text
);
alter table public.porch_greet add column if not exists i_due    timestamptz;
alter table public.porch_greet add column if not exists i_done   timestamptz;
alter table public.porch_greet add column if not exists i_result text;
alter table public.porch_greet enable row level security;    -- no policies: nobody reads or writes it through the app
create index if not exists porch_greet_c on public.porch_greet (c_due) where c_done is null and c_due is not null;
create index if not exists porch_greet_m on public.porch_greet (m_due) where m_done is null and m_due is not null;

-- everybody who is already here counts as greeted
insert into public.porch_greet (user_id, c_done, c_result, m_done, m_result)
select m.user_id, now(), 'before Matt', now(), 'before Matt' from public.porch_members m
on conflict (user_id) do nothing;

-- ---------- somebody joins: his message is due some time in their first day ----------
create or replace function public.porch_greet_join()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into porch_greet (user_id, m_due) values (new.user_id, now() + make_interval(mins => 60 + floor(random() * 1141)::int))
    on conflict (user_id) do nothing;
    update porch_greet set i_due = m_due + make_interval(mins => 120 + floor(random() * 241)::int)
     where user_id = new.user_id and i_due is null and m_done is null;
  exception when others then
    null;                                   -- a hello must never stop somebody from joining
  end;
  return null;
end $$;
drop trigger if exists porch_greet_join on public.porch_members;
create trigger porch_greet_join after insert on public.porch_members
  for each row execute function public.porch_greet_join();

-- ---------- their first share: his comment is due in 2 to 8 minutes ----------
create or replace function public.porch_greet_first_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.hidden_at is not null or new.group_id is not null or new.reshare_of is not null then return null; end if;
    if public.porch_house(new.user_id) then return null; end if;
    insert into porch_greet (user_id, post_id, c_due)
    values (new.user_id, new.id, now() + make_interval(mins => 2 + floor(random() * 7)::int))
    on conflict (user_id) do update set post_id = excluded.post_id, c_due = excluded.c_due
      where porch_greet.post_id is null and porch_greet.c_done is null;
  exception when others then
    null;                                   -- a hello must never stop a share from posting
  end;
  return null;
end $$;
drop trigger if exists porch_greet_first_post on public.porch_posts;
create trigger porch_greet_first_post after insert on public.porch_posts
  for each row execute function public.porch_greet_first_post();

-- ---------- the job ----------
create or replace function public.porch_greet_run()
returns int language plpgsql security definer set search_path = public as $$
declare
  matt uuid;
  q record;
  th uuid;
  x uuid; y uuid;
  n int := 0;
  hello text := 'Beep boop. Welcome to the Porch! I''m Matt, the greeter robot. I can''t fix much, but I can point you to the coffee. Take a look around, there''s a lot of good sobriety here. 💛';
  ask text := 'Beep. One more thing. If you think the Porch would help somebody you know, invite them: https://recoverymisfits.org/feed/porch.html?invite=1 💛';
  lines text[] := array[
    'Beep boop. Welcome! I saved you a seat. 💛',
    'Welcome to the Porch. I''m the robot who holds the door. Glad you came in.',
    'New face! My circuits are happy. Welcome. 👋',
    'Welcome! The chairs are set up and the coffee is on.',
    'Beep. A first share. That takes guts. Welcome to the Porch.',
    'Welcome in. I''m Matt, the greeter robot. You''re in good company here.',
    'Glad you''re here. I dusted off a chair for you. 💛',
    'Welcome to the Porch! Robots can''t clap, so imagine a happy beep.',
    'You showed up. That''s the hard part. Welcome. 👋',
    'Door''s always open. Welcome to the Porch.'
  ];
begin
  select user_id into matt from porch_members where handle = 'welcomematt';
  if matt is null then return 0; end if;

  -- 1. a first share: Matt's comment
  for q in select * from porch_greet
            where c_done is null and c_due is not null and c_due <= now()
            order by c_due limit 20
  loop
    if q.user_id = matt or public.porch_house(q.user_id)
       or not exists (select 1 from porch_posts p where p.id = q.post_id and p.user_id = q.user_id and p.hidden_at is null) then
      update porch_greet set c_done = now(), c_result = 'share is gone' where user_id = q.user_id;
      continue;
    end if;
    begin
      insert into porch_comments (post_id, user_id, body)
      values (q.post_id, matt, lines[1 + floor(random() * array_length(lines, 1))::int]);
      update porch_greet set c_done = now(), c_result = 'greeted' where user_id = q.user_id;
      n := n + 1;
    exception when others then
      update porch_greet set c_done = now(), c_result = 'failed: ' || left(sqlerrm, 200) where user_id = q.user_id;
    end;
  end loop;

  -- 2. everybody new: one message in their first day
  for q in select * from porch_greet
            where m_done is null and m_due is not null and m_due <= now()
            order by m_due limit 20
  loop
    if q.user_id = matt or public.porch_house(q.user_id)
       or not exists (select 1 from porch_members m where m.user_id = q.user_id and m.frozen_at is null and m.away_at is null) then
      update porch_greet set m_done = now(), m_result = 'not here' where user_id = q.user_id;
      continue;
    end if;
    begin
      x := least(matt, q.user_id); y := greatest(matt, q.user_id);
      insert into porch_threads (a, b) values (x, y)
      on conflict (a, b) do update set last_at = now()
      returning id into th;
      insert into porch_dm (thread_id, from_id, body) values (th, matt, hello);
      update porch_threads set last_at = now(), last_from = matt, last_preview = left(hello, 90) where id = th;
      update porch_greet set m_done = now(), m_result = 'messaged' where user_id = q.user_id;
      n := n + 1;
    exception when others then
      update porch_greet set m_done = now(), m_result = 'failed: ' || left(sqlerrm, 200) where user_id = q.user_id;
    end;
  end loop;

  -- 3. "invite a friend", a few hours after the hello. Not before launch day (Oct 20, Eastern).
  if now() >= timestamptz '2026-10-20 00:00 America/New_York' then
    for q in select * from porch_greet
              where i_done is null and i_due is not null and i_due <= now() and m_result = 'messaged'
              order by i_due limit 20
    loop
      if not exists (select 1 from porch_members m where m.user_id = q.user_id and m.frozen_at is null and m.away_at is null) then
        update porch_greet set i_done = now(), i_result = 'not here' where user_id = q.user_id;
        continue;
      end if;
      begin
        x := least(matt, q.user_id); y := greatest(matt, q.user_id);
        insert into porch_threads (a, b) values (x, y)
        on conflict (a, b) do update set last_at = now()
        returning id into th;
        insert into porch_dm (thread_id, from_id, body) values (th, matt, ask);
        update porch_threads set last_at = now(), last_from = matt, last_preview = left(ask, 90) where id = th;
        update porch_greet set i_done = now(), i_result = 'messaged' where user_id = q.user_id;
        n := n + 1;
      exception when others then
        update porch_greet set i_done = now(), i_result = 'failed: ' || left(sqlerrm, 200) where user_id = q.user_id;
      end;
    end loop;
  end if;
  return n;
end $$;
revoke all on function public.porch_greet_run() from public, anon, authenticated;

-- ---------- every 2 minutes ----------
select cron.unschedule('porch-matt-greets')
  where exists (select 1 from cron.job where jobname = 'porch-matt-greets');
select cron.schedule('porch-matt-greets', '*/2 * * * *', $job$select public.porch_greet_run();$job$);

-- what a correct result looks like: one row, status ok, matt_found and job_on are true
select 'porch step 49: ok' as status,
       exists (select 1 from public.porch_members where handle = 'welcomematt') as matt_found,
       exists (select 1 from cron.job where jobname = 'porch-matt-greets' and active) as job_on,
       (select count(*) from public.porch_greet where m_result = 'before Matt') as already_here;

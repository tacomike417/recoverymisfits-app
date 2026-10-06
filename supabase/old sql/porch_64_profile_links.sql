-- PORCH STEP 64 (6 Oct 2026, Mike): LINKS ON A PROFILE (website, Instagram, YouTube ...).
--   * One "Add a link" box; the app works out what kind of link it is.
--   * MEMBERS ONLY, always. Links live in their own table that nobody can read directly, so an
--     outsider can never get them, even off a Public profile.
--   * Earn it: 30 days on the Porch before you can add links (cuts spam). The founding misfits
--     and the house accounts can add them right away.
--   * 5 links at most.
create table if not exists public.porch_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  links text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.porch_links enable row level security;   -- no policies on purpose: the functions below are the only way in
revoke all on public.porch_links from anon, authenticated;

-- can I add links yet? -> {"ok": true/false, "days_left": n}
create or replace function public.porch_links_can()
returns json language plpgsql stable security definer set search_path = public as $$
declare m porch_members; d int;
begin
  select * into m from porch_members where user_id = auth.uid();
  if m.user_id is null or not public.porch_verified(auth.uid()) then return json_build_object('ok', false, 'days_left', null); end if;
  if public.porch_house(m.user_id) or m.handle in ('tacomike417', 'misfit_tester', 'fire_l0ve', 'krazyk226') then
    return json_build_object('ok', true, 'days_left', 0);
  end if;
  d := greatest(0, ceil(extract(epoch from (m.created_at + interval '30 days' - now())) / 86400.0)::int);
  return json_build_object('ok', d = 0, 'days_left', d);
end $$;

-- save my links (the whole list each time)
create or replace function public.porch_links_set(p_links text[])
returns text[] language plpgsql security definer set search_path = public as $$
declare clean text[] := '{}'; l text;
begin
  if not coalesce((public.porch_links_can() ->> 'ok')::boolean, false) then raise exception 'links not open yet'; end if;
  foreach l in array coalesce(p_links, '{}') loop
    l := btrim(l);
    if l ~* '^https?://[^\s<>"'']{4,200}$' and not (l = any(clean)) and coalesce(array_length(clean, 1), 0) < 5 then
      clean := clean || l;
    end if;
  end loop;
  insert into porch_links (user_id, links, updated_at) values (auth.uid(), clean, now())
  on conflict (user_id) do update set links = excluded.links, updated_at = now();
  return clean;
end $$;

-- somebody's links: members only (or your own)
create or replace function public.porch_links_of(p_user uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce((
    select k.links from porch_links k join porch_members m on m.user_id = k.user_id
    where k.user_id = p_user
      and auth.uid() is not null
      and (auth.uid() = p_user
           or ((public.porch_verified(auth.uid()) or public.porch_is_mod(auth.uid()))
               and m.frozen_at is null and m.away_at is null
               and not public.porch_blocked(auth.uid(), p_user)))
  ), '{}'::text[]);
$$;

revoke all on function public.porch_links_can() from public;
revoke all on function public.porch_links_set(text[]) from public;
revoke all on function public.porch_links_of(uuid) from public;
grant execute on function public.porch_links_can() to authenticated;
grant execute on function public.porch_links_set(text[]) to authenticated;
grant execute on function public.porch_links_of(uuid) to authenticated;

select 'porch step 64: ok' as result,
       (select count(*) from pg_proc where proname in ('porch_links_can', 'porch_links_set', 'porch_links_of')) as functions;

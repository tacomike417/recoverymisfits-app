-- porch_79_skivvies_note_used.sql (4 Nov 2026, Mike) -- Recovery Misfits project
-- When Mike taps "Use this note" in the Skivvies admin, the writer gets a DM
-- (and a phone push, through the porch_push_dm trigger) from the skivvies house account.
-- Called only by the skivvies-note edge function, which holds the bridge secret.
create or replace function public.skivvies_note_used(p_secret text, p_writer uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare house uuid; th uuid; x uuid; y uuid; dm text;
begin
  if p_secret is null or p_secret <> (select secret from skivvies_bridge) then
    raise exception 'no' using errcode = '42501';
  end if;
  select user_id into house from porch_members where handle = 'skivvies';
  if house is null then raise exception 'skivvies is not set up' using errcode = 'P0001'; end if;
  if p_writer is null or p_writer = house or not exists (select 1 from porch_members where user_id = p_writer) then
    return;
  end if;
  dm := 'Your Skivvies note just went out in a pack 🍑 Thank you.';
  x := least(house, p_writer); y := greatest(house, p_writer);
  insert into porch_threads (a, b) values (x, y)
  on conflict (a, b) do update set last_at = now() returning id into th;
  insert into porch_dm (thread_id, from_id, body) values (th, house, dm);
  update porch_threads set last_at = now(), last_from = house, last_preview = left(dm, 90) where id = th;
end $$;
revoke all on function public.skivvies_note_used(text, uuid) from public;
grant execute on function public.skivvies_note_used(text, uuid) to anon, authenticated;

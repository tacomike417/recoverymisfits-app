-- ============================================================
-- THE PORCH, STEP 69: POOF OPENS UP SOONER. 11 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "poof messages start after 2 message exchanges each instead of 5".
-- Same rules otherwise: friends, not blocked, and BOTH people have Poof switched on
-- (the switch is now at the top of Messages). Only the number changes, 5 -> 2.
-- ============================================================

-- '' = x may send y a Poof. Anything else says why not. The porch function asks this.
create or replace function public.porch_poof_can(x uuid, y uuid)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if x is null or y is null or x = y then return 'nope'; end if;
  if public.porch_blocked(x, y) or not public.porch_are_friends(x, y) then return 'friends'; end if;
  if public.porch_poof_count(x, y) < 2 or public.porch_poof_count(y, x) < 2 then return 'rapport'; end if;
  if not coalesce((select is_on from porch_poof where user_id = x), false) then return 'me_off'; end if;
  if not coalesce((select is_on from porch_poof where user_id = y), false) then return 'them_off'; end if;
  return '';
end $$;
revoke all on function public.porch_poof_can(uuid, uuid) from public, anon, authenticated;
grant execute on function public.porch_poof_can(uuid, uuid) to service_role;

-- what the chat screen asks. Their switch is only told once the rapport is there.
create or replace function public.porch_poof_state(p_other uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); ok boolean; mine int; theirs int;
begin
  if me is null or p_other is null or me = p_other then return jsonb_build_object('rapport', false, 'me_on', false, 'them_on', false); end if;
  mine := public.porch_poof_count(me, p_other); theirs := public.porch_poof_count(p_other, me);
  ok := mine >= 2 and theirs >= 2 and public.porch_are_friends(me, p_other) and not public.porch_blocked(me, p_other);
  return jsonb_build_object(
    'rapport', ok,
    'me_on',   coalesce((select is_on from porch_poof where user_id = me), false),
    'them_on', ok and coalesce((select is_on from porch_poof where user_id = p_other), false));
end $$;
revoke all on function public.porch_poof_state(uuid) from public, anon;
grant execute on function public.porch_poof_state(uuid) to authenticated;


select 'porch step 69: ok' as status,
       (select position('< 2' in pg_get_functiondef('public.porch_poof_can(uuid,uuid)'::regprocedure)) > 0) as can_uses_2,
       (select position('>= 2' in pg_get_functiondef('public.porch_poof_state(uuid)'::regprocedure)) > 0) as state_uses_2;

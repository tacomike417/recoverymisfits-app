-- PORCH STEP 63 (5 Oct 2026): the outside profile page (the big invite) shows the name people
-- see and "Misfit since". Still only for a profile its owner set to Public. Nothing else changes.
create or replace function public.porch_profile_card(p_handle text)
returns json language plpgsql stable security definer set search_path = public as $$
declare m porch_members;
begin
  select * into m from porch_members where handle = lower(p_handle) and frozen_at is null and away_at is null;
  if m.user_id is null or m.visibility <> 'public' then return json_build_object('locked', true); end if;
  return json_build_object(
    'handle', m.handle, 'real_name', m.real_name, 'created_at', m.created_at,
    'bio', m.bio, 'avatar_path', m.avatar_path, 'cover_path', m.cover_path,
    'spins', coalesce((select json_agg(x) from (
       select s.id, s.video_guid from porch_spins s
       where s.user_id = m.user_id and s.status = 'ready' and (s.pinned or s.expires_at > now())
         and not exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null)
       order by s.pinned desc, s.created_at desc limit 9) x), '[]'::json));
end $$;
grant execute on function public.porch_profile_card(text) to anon, authenticated;
select 'porch step 63: ok' as result,
       (public.porch_profile_card('tacomike417')::jsonb ? 'real_name') as has_name;

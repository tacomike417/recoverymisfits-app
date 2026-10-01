-- ============================================================
-- THE PORCH, STEP 16: SPIN LINKS ANYBODY CAN OPEN. 1 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "lets do all the viral stuff"
-- * A shared Spin link (recoverymisfits.org/s/<id>) shows the Spin's picture in
--   a text or Messenger preview, and plays the Spin for someone who isn't a
--   member yet, with a button to come join.
-- * This gives that page just what it needs about ONE Spin: the video, the
--   caption, the sound and who made it. Nothing else, and nothing that's
--   expired, still processing or taken down.
-- ============================================================

create or replace function public.porch_spin_card(p_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', s.id, 'video_guid', s.video_guid, 'caption', s.caption, 'muted', s.muted,
    'width', s.width, 'height', s.height, 'length_s', s.length_s,
    'resolutions', s.resolutions, 'music', s.music,
    'handle', coalesce(m.handle, 'misfit'),
    'respins', (select count(*) from porch_respins r where r.spin_id = s.id))
  from porch_spins s
  left join porch_members m on m.user_id = s.user_id
  where s.id = p_id
    and s.status = 'ready'
    and (s.pinned or s.expires_at > now())
    and not exists (select 1 from porch_posts p where p.id = s.post_id and p.hidden_at is not null)
$$;
revoke all on function public.porch_spin_card(uuid) from public;
grant execute on function public.porch_spin_card(uuid) to anon, authenticated;

-- check: the newest Spin, the way a shared link will see it
select public.porch_spin_card(id) as newest_spin_link
from public.porch_spins where status = 'ready' order by created_at desc limit 1;

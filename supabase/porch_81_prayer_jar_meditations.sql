-- porch_81: Cookie's Prayer Jar gets her guided meditations (13 Nov 2026). Private, same rule as her prayers.
-- ALREADY RUN on the recoverymisfits project. Kept here for the record.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prayer-jar', 'prayer-jar', false, 73400320, array['video/mp4','audio/mpeg','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "prayer jar: only its people can play" on storage.objects;
create policy "prayer jar: only its people can play" on storage.objects
  for select to authenticated
  using (bucket_id = 'prayer-jar' and public.prayer_jar_ok());

-- The video itself went in through a two-hour upload door for one exact file name (policy removed afterward).
-- To add another meditation later, ask Claude to open the door again for the new file name.

-- porch_78 (3 Nov 2026): remove the one-night transfer bucket used to move the OPS 008 voice files
-- from Mike's browser into the build container (the container can't reach supabase.co directly).
-- Safe to run more than once.
delete from storage.objects where bucket_id = 'tmp008';
drop policy if exists "tmp008 anon upload" on storage.objects;
delete from storage.buckets where id = 'tmp008';

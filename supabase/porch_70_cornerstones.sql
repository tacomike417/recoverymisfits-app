-- ============================================================
-- THE PORCH, STEP 70: THE CORNERSTONES BOARD FOLDER. 11 Oct 2026 (v2: the board's names and jobs).
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "create a cornerstones folder and put all our cornerstone stuff in there for the board
-- members to see. So it only shows up for CrazyK226, that Fire Love account, and the Taco Mike account."
--
-- The papers live in a PRIVATE storage bucket, "cornerstones". Nobody can read, add or remove a
-- file in it unless they are signed in as one of the board accounts below. No public links.
-- The page is /feed/cornerstones.html. The button is in your menu on the Porch (board only).
-- ============================================================

-- who is on the board (by Recovery Misfits name)
create table if not exists public.cornerstones_board (
  handle text primary key
);
alter table public.cornerstones_board enable row level security;   -- no policies: read only through the function
revoke all on public.cornerstones_board from anon, authenticated;
-- names and jobs live here, not in the page, because the app's code is public
alter table public.cornerstones_board add column if not exists name text;
alter table public.cornerstones_board add column if not exists role text;
alter table public.cornerstones_board add column if not exists sort int not null default 9;
insert into public.cornerstones_board (handle, name, role, sort) values
  ('krazyk226',   'Konner Shields',  'President', 1),
  ('fire_l0ve',   'Corinna Nasvadi', 'Secretary', 2),
  ('tacomike417', 'Mike Nasvadi',    'Treasurer', 3)
on conflict (handle) do update set name = excluded.name, role = excluded.role, sort = excluded.sort;

-- true when the person signed in is on the board
create or replace function public.cornerstones_is_board()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.users u
    join public.cornerstones_board b on b.handle = lower(split_part(u.email, '@', 1))
    where u.id = auth.uid()
  );
$$;
revoke all on function public.cornerstones_is_board() from public, anon;
grant execute on function public.cornerstones_is_board() to authenticated;

-- the board at the top of the page: name, job, Porch name and picture. Board only.
create or replace function public.cornerstones_people()
returns table (handle text, name text, role text, avatar_path text)
language sql stable security definer set search_path = public as $$
  select b.handle, b.name, b.role, m.avatar_path
  from public.cornerstones_board b
  left join public.porch_members m on m.handle = b.handle
  where public.cornerstones_is_board()
  order by b.sort;
$$;
revoke all on function public.cornerstones_people() from public, anon;
grant execute on function public.cornerstones_people() to authenticated;

-- the private bucket (25 MB a file; PDFs and pictures)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cornerstones', 'cornerstones', false, 26214400,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- board only: see, add, replace, remove
drop policy if exists "cornerstones board read"   on storage.objects;
drop policy if exists "cornerstones board add"    on storage.objects;
drop policy if exists "cornerstones board change" on storage.objects;
drop policy if exists "cornerstones board remove" on storage.objects;
create policy "cornerstones board read"   on storage.objects for select to authenticated
  using (bucket_id = 'cornerstones' and public.cornerstones_is_board());
create policy "cornerstones board add"    on storage.objects for insert to authenticated
  with check (bucket_id = 'cornerstones' and public.cornerstones_is_board());
create policy "cornerstones board change" on storage.objects for update to authenticated
  using (bucket_id = 'cornerstones' and public.cornerstones_is_board())
  with check (bucket_id = 'cornerstones' and public.cornerstones_is_board());
create policy "cornerstones board remove" on storage.objects for delete to authenticated
  using (bucket_id = 'cornerstones' and public.cornerstones_is_board());

-- check: all three should say "has an account"
select b.handle as board, b.name, b.role,
       case when u.id is null then 'NO ACCOUNT YET' else 'has an account' end as status
from public.cornerstones_board b
left join auth.users u on lower(split_part(u.email, '@', 1)) = b.handle
order by b.handle;

-- ============================================================
-- THE PORCH, STEP 77: CORNERSTONES HEADQUARTERS. 3 Nov 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike (3 Nov 2026): the Cornerstones folder becomes the nonprofit's headquarters on the phone: "pull out my
-- phone, find what I need, and get it to somebody in seconds." Home, I'm at the bank, Prove we're a nonprofit,
-- Who's in charge, Find paperwork, Tasks & deadlines, the whole library.
--
-- This step adds the TASKS & DEADLINES list. The papers still live in the private "cornerstones" bucket
-- (porch_70). Board only, same rule: public.cornerstones_is_board().
-- Every row here is a real item from the Nov 2026 cleanup. Nothing made up.
-- ============================================================

create table if not exists public.cornerstones_tasks (
  id          bigserial primary key,
  title       text not null,
  note        text,
  due         date,                                   -- null = no date, just a to-do
  kind        text not null default 'todo' check (kind in ('deadline', 'todo')),
  link        text,                                   -- where to do it (a web address), optional
  done_at     timestamptz,
  done_by     text,                                   -- Porch name of who ticked it
  sort        int not null default 9,
  created_at  timestamptz not null default now()
);
alter table public.cornerstones_tasks enable row level security;
revoke all on public.cornerstones_tasks from anon;
grant select, insert, update, delete on public.cornerstones_tasks to authenticated;
grant usage, select on sequence public.cornerstones_tasks_id_seq to authenticated;

drop policy if exists "cornerstones tasks board read"   on public.cornerstones_tasks;
drop policy if exists "cornerstones tasks board add"    on public.cornerstones_tasks;
drop policy if exists "cornerstones tasks board change" on public.cornerstones_tasks;
drop policy if exists "cornerstones tasks board remove" on public.cornerstones_tasks;
create policy "cornerstones tasks board read"   on public.cornerstones_tasks for select to authenticated using (public.cornerstones_is_board());
create policy "cornerstones tasks board add"    on public.cornerstones_tasks for insert to authenticated with check (public.cornerstones_is_board());
create policy "cornerstones tasks board change" on public.cornerstones_tasks for update to authenticated using (public.cornerstones_is_board()) with check (public.cornerstones_is_board());
create policy "cornerstones tasks board remove" on public.cornerstones_tasks for delete to authenticated using (public.cornerstones_is_board());

-- the real list (Nov 2026). Safe to run twice: each title goes in once.
insert into public.cornerstones_tasks (title, note, due, kind, link, done_at, sort)
select * from (values
  ('IRS Form 990-N (e-Postcard) for 2026', 'Due every year by May 15. Free. Lists the current officers.', date '2027-05-15', 'deadline', 'https://www.irs.gov/charities-non-profits/annual-electronic-filing-requirement-for-small-exempt-organizations-form-990-n-e-postcard', null::timestamptz, 1),
  ('Ohio Attorney General annual charity report for 2026', 'Due the same day as the IRS postcard. Officers to list: Konner Shields (President), Corinna Nasvadi (Secretary), Michael Nasvadi (Treasurer).', date '2027-05-15', 'deadline', 'https://charitableregistration.ohioago.gov', null::timestamptz, 2),
  ('IRS 8822-B follow-up', 'Mailed certified Nov 3, 2026 (address 820 S. Linden, Mike as responsible party). If no IRS letter by this date, mail a new copy marked SECOND REQUEST.', date '2027-01-02', 'deadline', null, null::timestamptz, 3),
  ('Ohio Statement of Continued Existence', 'Keeps the corporation on the books. File on bsportal.ohiosos.gov.', date '2030-06-05', 'deadline', 'https://bsportal.ohiosos.gov', null::timestamptz, 4),
  ('Renew the Skivvies and Recovery Misfits trade names', 'Registered Nov 2, 2026, good for 5 years. $25 each.', date '2031-11-02', 'deadline', 'https://bsportal.ohiosos.gov', null::timestamptz, 5),
  ('Save the Ohio approval certificates', 'Three still pending from Nov 2: Recovery Misfits name (202630606402), Skivvies name (202630606396), new Articles (202630606570). Agent address change (202630606378) is done.', null, 'todo', 'https://businesssearch.ohiosos.gov', null::timestamptz, 6),
  ('Upload the new Articles to the Ohio AG portal', 'After Ohio approves Form 541. Organization > Upload Documents.', null, 'todo', 'https://charitableregistration.ohioago.gov', null::timestamptz, 7),
  ('Send the IRS a copy of the new Articles', 'After Ohio approves Form 541: a one-page letter with the Articles attached. Claude writes it.', null, 'todo', null, null::timestamptz, 8),
  ('Open the new bank account', 'The old Huntington account (x4845) closed Aug 14, 2026. Bring: signed Nov 2 minutes, IRS 501(c)(3) letter, EIN, IDs. Signers: Mike and Konner. Add the Skivvies and Recovery Misfits names once the certificates come.', null, 'todo', null, null::timestamptz, 9),
  ('Close the CSE credit union account', 'Stephen and Mike are signers. Balance unknown, probably empty. Check it, close it, move anything left to the new account.', null, 'todo', null, null::timestamptz, 10),
  ('Konner signs two pages', 'The Articles consent page (Mike and Corinna already signed) and the last page of the restated bylaws (all three sign). Then photos go in the folder.', null, 'todo', null, null::timestamptz, 11),
  ('Confirm the IRS 8822-B went out certified', 'Corinna mails it Nov 3. Keep the receipt with the tracking number.', null, 'todo', null, null::timestamptz, 12),
  ('Ohio: agent address changed to 820 S. Linden Ave, Alliance', 'Approved. Effective Nov 2, 2026. Certificate is in filings/.', date '2026-11-02', 'deadline', null, timestamptz '2026-11-03 05:20-05', 20),
  ('Ohio: trade names, agent address and new Articles filed', 'Four filings submitted and paid Nov 2, 2026 ($153). Receipts are in filings/.', date '2026-11-02', 'deadline', null, timestamptz '2026-11-02 20:30-05', 21),
  ('Ohio AG portal updated', 'Address to Alliance; trade names Skivvies and Recovery Misfits; purpose updated. Nov 2, 2026.', date '2026-11-02', 'deadline', null, timestamptz '2026-11-02 20:45-05', 22),
  ('Board meeting: new board, officers, bylaws, programs', 'Nov 2, 2026 at Mike''s house. Signed minutes are in minutes/.', date '2026-11-02', 'deadline', null, timestamptz '2026-11-02 19:00-05', 23)
) as v(title, note, due, kind, link, done_at, sort)
where not exists (select 1 from public.cornerstones_tasks t where t.title = v.title);

-- check
select id, kind, due, done_at is not null as done, title from public.cornerstones_tasks order by done_at nulls first, due nulls last, sort;

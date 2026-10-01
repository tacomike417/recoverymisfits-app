-- ============================================================
-- THE PORCH, STEP 2: confirm who you are. 30 Sep 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- * Porch names are the same usernames the app already uses, so the name
--   rule matches account.js: 3-32 of a-z 0-9 . _ -
-- * The email itself is NEVER stored. Only a scrambled fingerprint of it,
--   so the same email can't confirm two accounts. Nobody, not even Mike,
--   can read somebody's email out of this database.
-- * A code that was sent but not yet entered does not lock the email, so
--   somebody can't squat on another person's address.
-- ============================================================

alter table public.porch_members drop constraint if exists porch_members_handle_check;
alter table public.porch_members add constraint porch_members_handle_check
  check (handle ~ '^[a-z0-9._-]{3,32}$');

alter table public.porch_identity alter column email_hash drop not null;
alter table public.porch_identity add column if not exists pending_hash text;
alter table public.porch_identity add column if not exists sends int not null default 0;
alter table public.porch_identity add column if not exists sends_since timestamptz not null default now();

select 'porch step 2: ok' as status;

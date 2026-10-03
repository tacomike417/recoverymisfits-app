-- ============================================================
-- THE PORCH, STEP 29: NAMES NOBODY CAN TAKE. 2 Oct 2026.
-- Run in the RECOVERY MISFITS Supabase project. SAFE TO RUN TWICE.
--
-- Mike: "these names are already taken. So they can't sign up as recovery
-- misfits, or recovery misfits admin, things like that. We need to build that."
--
-- What it does:
-- * taken_names: the list. Three kinds of match:
--     inside = anywhere in the name (recoverymisfits, admin, the hard slurs)
--     word   = a whole word in the name (mod, staff: "rm_mod" yes, "modesto" no)
--     whole  = the whole name (the site's own pages: help, coins, porch ...)
-- * It reads past tricks: capitals, dots, dashes, spaces, and number-letters
--   (Rec0very.M1sfits and r-e-c-o-v-e-r-y_misfits are both caught).
-- * The wall is in the database: a new account with a taken name is refused,
--   and so is a profile NAME (the optional one) that uses one.
-- * People who already have a name keep it. This only stops new ones.
-- * name_passes: Mike's way in. Put a name there and that one name can be
--   signed up one time (for house accounts):
--     insert into name_passes values ('recoverymisfits');
-- * Add a word later:  insert into taken_names values ('newword', 'inside');
--   Take one off:      delete from taken_names where word = 'thatword';
-- Plain cussing is NOT on the list (Rated R). Slurs and X-rated words are.
-- ============================================================

create table if not exists public.taken_names (
  word text primary key,
  how  text not null default 'inside' check (how in ('inside', 'word', 'whole'))
);
alter table public.taken_names enable row level security;      -- nobody reads the list from the app

create table if not exists public.name_passes (handle text primary key);
alter table public.name_passes enable row level security;

-- squash a name down: lowercase, number-letters swapped, everything else dropped
create or replace function public.name_squash(p text)
returns text language sql immutable as $$
  select regexp_replace(translate(lower(coalesce(p, '')), '013457@$!|', 'oieastasil'), '[^a-z]', '', 'g')
$$;

create or replace function public.name_blocked(p_name text, p_pages boolean default true)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare raw text := lower(coalesce(p_name, ''));
        sq  text := name_squash(p_name);
        sq2 text := name_squash(translate(lower(coalesce(p_name, '')), '1', 'l'));     -- a 1 can be an i or an l
        plain text := regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]', '', 'g');
        words text[] := regexp_split_to_array(translate(lower(coalesce(p_name, '')), '013457@$', 'oieastas'), '[^a-z]+');
begin
  if raw = '' then return false; end if;
  if exists (select 1 from name_passes where handle = raw) then return false; end if;
  return exists (
    select 1 from taken_names t where
      (t.how = 'inside' and (sq like '%' || t.word || '%' or sq2 like '%' || t.word || '%' or plain like '%' || t.word || '%'))
      or (t.how = 'word' and (t.word = any (words) or sq = t.word))
      or (t.how = 'whole' and p_pages and (raw = t.word or sq = t.word))
  );
end $$;
revoke all on function public.name_blocked(text, boolean) from public;
grant execute on function public.name_blocked(text, boolean) to anon, authenticated;

-- ---- the list
insert into public.taken_names (word, how) values
  -- us
  ('recoverymisfit','inside'),('recoverymisft','inside'),('recoverymsfit','inside'),('recoverymisfts','inside'),('recovrymisfit','inside'),
  ('misfitsofficial','inside'),('misfitsteam','inside'),('misfitshq','inside'),('misfitstaff','inside'),('misfitsupport','inside'),
  ('tacomike','inside'),('nasvadi','inside'),
  -- anybody who sounds in charge
  ('admin','inside'),('moderator','inside'),('official','inside'),('helpdesk','inside'),('customerservice','inside'),
  ('customersupport','inside'),('techsupport','inside'),('sysop','inside'),('webmaster','inside'),
  ('alcoholicsanonymous','inside'),('narcoticsanonymous','inside'),('aaworldservices','inside'),
  ('mod','word'),('mods','word'),('staff','word'),('founder','word'),('billing','word'),
  -- hate
  ('nigger','inside'),('nigga','inside'),('niggr','inside'),('faggot','inside'),('fagot','inside'),('retard','inside'),
  ('tranny','inside'),('wetback','inside'),('hitler','inside'),('nazi','inside'),('whitepower','inside'),('whitepride','inside'),
  ('kukluxklan','inside'),('kkk','inside'),('1488','inside'),('gasthejew','inside'),('sandnigg','inside'),('towelhead','inside'),
  ('fag','word'),('fags','word'),('kike','word'),('spic','word'),('chink','word'),('gook','word'),('coon','word'),('beaner','word'),('dyke','word'),
  -- X-rated
  ('cunt','inside'),('pussy','inside'),('blowjob','inside'),('handjob','inside'),('jizz','inside'),('porn','inside'),
  ('rapist','inside'),('raping','inside'),('molest','inside'),('pedophile','inside'),('paedophile','inside'),('childlover','inside'),
  ('pedo','word'),('rape','word'),('cock','word'),('penis','word'),('vagina','word'),('cum','word'),('anal','word'),('whore','word'),('slut','word'),
  -- cruel
  ('killyourself','inside'),('kys','word'),('gokill','inside'),
  -- the site's own pages (a name is also a link: recoverymisfits.org/<name>)
  ('beta','whole'),('s','whole'),('u','whole'),('api','whole'),('app','whole'),('feed','whole'),('porch','whole'),('theporch','whole'),
  ('login','whole'),('signin','whole'),('signup','whole'),('account','whole'),('settings','whole'),('help','whole'),('about','whole'),
  ('privacy','whole'),('terms','whole'),('me','whole'),('home','whole'),('index','whole'),('www','whole'),('static','whole'),
  ('assets','whole'),('images','whole'),('cdn','whole'),('blog','whole'),('news','whole'),('shop','whole'),('store','whole'),
  ('search','whole'),('explore','whole'),('notifications','whole'),('messages','whole'),('spins','whole'),('spin','whole'),
  ('friends','whole'),('groups','whole'),('group','whole'),('profile','whole'),('user','whole'),('users','whole'),('null','whole'),
  ('undefined','whole'),('misfit','whole'),('misfits','whole'),('recovery','whole'),('everyone','whole'),('anonymous','whole'),
  ('another-day-sober','whole'),('share-in','whole'),('assets-trudge','whole'),('audio','whole'),('audio-lag-test','whole'),
  ('basics','whole'),('burn-pad','whole'),('chapters','whole'),('coins','whole'),('corner','whole'),('css','whole'),('data','whole'),
  ('engine','whole'),('fear-compass','whole'),('fun','whole'),('game','whole'),('game2','whole'),('gratitude-journal','whole'),
  ('halloween-game','whole'),('meme','whole'),('nightly-inventory','whole'),('on-awakening','whole'),('pile','whole'),('qr','whole'),
  ('reader','whole'),('readings','whole'),('recovery-engine','whole'),('recovery-misfits-first-five-coins','whole'),
  ('sober-date','whole'),('story','whole'),('survival-pile','whole'),('test','whole'),('tools','whole'),('unofficial-story','whole'),
  ('untangler','whole'),('white-knuckler','whole')
on conflict (word) do nothing;

-- ---- the wall at sign-up. If anything about the check itself breaks, sign-up still works.
create or replace function public.names_wall_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare h text := lower(split_part(coalesce(new.email, ''), '@', 1)); bad boolean := false;
begin
  if new.email is null or new.email not like '%@rm.invalid' then return new; end if;
  begin
    bad := name_blocked(h);
    delete from name_passes where handle = h;           -- a pass works one time
  exception when others then bad := false; end;
  if bad then raise exception 'name_taken' using errcode = '23505'; end if;
  return new;
end $$;
drop trigger if exists names_wall_signup on auth.users;
create trigger names_wall_signup before insert on auth.users
  for each row execute function public.names_wall_signup();

-- ---- the wall on the Porch name card and the optional profile NAME
create or replace function public.names_wall_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.real_name is not null and (tg_op = 'INSERT' or new.real_name is distinct from old.real_name)
     and name_blocked(new.real_name, false) then
    raise exception 'name_taken' using errcode = '23505';
  end if;
  return new;
end $$;
drop trigger if exists names_wall_member on public.porch_members;
create trigger names_wall_member before insert or update of real_name on public.porch_members
  for each row execute function public.names_wall_member();

-- ---- what a correct result looks like: every row says OK
select want.name, want.blocked as should_block, public.name_blocked(want.name) as blocks,
       case when public.name_blocked(want.name) = want.blocked then 'OK' else 'WRONG' end as result
from (values ('recoverymisfits', true), ('Rec0very.M1sfits', true), ('recovery_misfits_admin', true),
             ('rm_mod', true), ('help', true), ('grateful_gina', false), ('modesto_mike', false),
             ('krazyk226', false), ('fire_l0ve', false), ('misfit_tester', false)) as want(name, blocked);

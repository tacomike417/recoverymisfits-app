/* ===========================================================================
   THE ACCOUNT — anonymous, and only as much of one as this app needs.

   WHAT IT IS. A name somebody made up and a password. No email, no phone
   number, no real name, nothing recoverable. The row on the server says
   "mike417" and holds a blob of their settings, and that is the entire
   extent of what this app knows about anybody.

   WHAT IT IS FOR. A sober date and a reading stack are the two things
   somebody would be upset to lose and would have to rebuild by hand. Phones
   get replaced, site data gets cleared, and on an iPhone the app you install
   cannot see what Safari stored. An account is the only thing that survives
   all three.

   WHAT IT DELIBERATELY IS NOT. There is no password reset, because there is
   no email to send one to. That is said plainly on the sign-up screen rather
   than discovered later. It is a real trade and the person makes it with
   their eyes open.

   WHY NO SUPABASE LIBRARY. Their client is sixty-odd kilobytes and nav.js is
   on every page of this app, so it would ride along on every single load to
   do four HTTP calls. Those four calls are written out below. It also means
   one less thing on a CDN that has to be up for the app to work.

   LOCAL-FIRST, ALWAYS. Every screen in this app reads localStorage and
   always will. This file syncs a copy; it never becomes the source of
   truth. Signed out, offline, server down, account forgotten -- the app
   behaves exactly as it did before any of this existed. That is the rule
   that keeps a sync feature from ever being able to take the app down.
   ======================================================================== */
(function () {
  "use strict";

  var URL_BASE = "https://rlytvfehbglsjfvprtbp.supabase.co";
  var ANON_KEY = "sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P";

  /* The address is synthetic and undeliverable on purpose. ".invalid" is
     reserved by RFC 2606 precisely so it can never resolve to a real
     mailbox anywhere, which is the property we want: the account needs a
     unique string, not a way to reach anybody. */
  var MAIL_DOMAIN = "@rm.invalid";

  var TOKEN_KEY = "rm_account_v1";
  var SOBER_KEY = "rm_sober_date";          /* the same key nav.js uses */

  /* ---- what we hold on to ------------------------------------------------ */
  var session = null;                        /* {access, refresh, expires, uid, name} */
  try {
    session = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch (e) { session = null; }

  function remember(s) {
    session = s;
    try {
      if (s) localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  /* ---- names -------------------------------------------------------------
     Lowercased so "Mike417" and "mike417" cannot become two accounts that
     look identical when written down. Letters, numbers, dot, dash and
     underscore -- enough to make a name, not enough to smuggle anything
     into an address. */
  function cleanName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function nameProblem(name) {
    var n = cleanName(name);
    if (n.length < 3) return "Pick a name at least 3 characters long.";
    if (n.length > 32) return "That name is too long.";
    if (!/^[a-z0-9._-]+$/.test(n)) return "Letters, numbers, dots, dashes and underscores only.";
    return null;
  }

  function passwordProblem(pw) {
    if (String(pw || "").length < 8) return "Use at least 8 characters.";
    return null;
  }

  /* ---- talking to the server --------------------------------------------- */
  function post(path, body, token) {
    return fetch(URL_BASE + path, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (token || ANON_KEY)
      },
      body: JSON.stringify(body)
    });
  }

  function stash(json, name) {
    if (!json || !json.access_token) return null;
    var s = {
      access: json.access_token,
      refresh: json.refresh_token,
      /* a minute of slack, so we refresh slightly early rather than
         discovering the token died mid-request */
      expires: Date.now() + ((json.expires_in || 3600) - 60) * 1000,
      uid: json.user && json.user.id,
      name: name || (session && session.name) || ""
    };
    remember(s);
    return s;
  }

  /* Supabase says a lot of different things when a sign-in fails. The person
     only ever needs to know one of them, and it must not say WHICH half was
     wrong -- "no account by that name" turns this into a tool for checking
     whether somebody you know uses a recovery app. */
  function readError(json, fallback) {
    var m = (json && (json.msg || json.message || json.error_description ||
                      json.error)) || "";
    if (/already registered|already exists|duplicate/i.test(m)) {
      return "That name is taken. Try another.";
    }
    if (/invalid login|invalid credentials|grant/i.test(m)) {
      return "That name or password isn't right.";
    }
    if (/password/i.test(m) && /short|least|weak/i.test(m)) {
      return "Use at least 8 characters.";
    }
    return m || fallback;
  }

  /* ---- the four calls ----------------------------------------------------- */

  async function signUp(name, password) {
    var bad = nameProblem(name) || passwordProblem(password);
    if (bad) return { ok: false, error: bad };
    try {
      var res = await post("/auth/v1/signup",
        { email: cleanName(name) + MAIL_DOMAIN, password: password });
      var json = await res.json().catch(function () { return null; });
      if (!res.ok) return { ok: false, error: readError(json, "Could not create that account.") };
      /* With email confirmation off, signup hands back a session directly.
         If the project is ever switched back on, there is no session here --
         say so rather than looking like it worked. */
      if (!json || !json.access_token) {
        return { ok: false, error: "The account was made but could not be signed in. Try signing in." };
      }
      stash(json, cleanName(name));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "No connection. Try again when you have signal." };
    }
  }

  async function signIn(name, password) {
    var bad = nameProblem(name);
    if (bad) return { ok: false, error: "That name or password isn't right." };
    try {
      var res = await post("/auth/v1/token?grant_type=password",
        { email: cleanName(name) + MAIL_DOMAIN, password: password });
      var json = await res.json().catch(function () { return null; });
      if (!res.ok || !json || !json.access_token) {
        return { ok: false, error: readError(json, "That name or password isn't right.") };
      }
      stash(json, cleanName(name));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "No connection. Try again when you have signal." };
    }
  }

  async function refresh() {
    if (!session || !session.refresh) return false;
    try {
      var res = await post("/auth/v1/token?grant_type=refresh_token",
        { refresh_token: session.refresh });
      var json = await res.json().catch(function () { return null; });
      if (!res.ok || !json || !json.access_token) {
        /* The refresh token is dead -- signed out somewhere else, or it
           simply expired. Drop it rather than retrying forever. */
        remember(null);
        return false;
      }
      stash(json, session.name);
      return true;
    } catch (e) {
      /* Offline is not the same as signed out. Keep the session and try
         again next time. */
      return false;
    }
  }

  async function token() {
    if (!session) return null;
    if (Date.now() < session.expires) return session.access;
    var ok = await refresh();
    return ok ? session.access : null;
  }

  function signOut() {
    /* Local only, and deliberately: the settings stay on this phone exactly
       as they are. Signing out is "stop syncing", not "erase my date". */
    remember(null);
  }

  /* ---- the blob ----------------------------------------------------------
     One jsonb column, one row per account, and row-level security means the
     server will not hand over anybody else's even if we asked. The sober
     date lives here today; whatever the reading stack turns into drops in
     beside it with no migration and no second round of this work. */

  async function pull() {
    var t = await token();
    if (!t) return null;
    try {
      var res = await fetch(URL_BASE + "/rest/v1/profiles?select=data,updated_at",
        { headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + t } });
      if (!res.ok) return null;
      var rows = await res.json();
      if (!rows || !rows.length) return null;
      return { data: rows[0].data || {}, updatedAt: rows[0].updated_at };
    } catch (e) { return null; }
  }

  async function push(data) {
    var t = await token();
    if (!t || !session.uid) return false;
    try {
      var res = await fetch(
        URL_BASE + "/rest/v1/profiles?id=eq." + encodeURIComponent(session.uid),
        {
          method: "PATCH",
          headers: {
            "apikey": ANON_KEY,
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ data: data })
        });
      return res.ok;
    } catch (e) { return false; }
  }

  /* ---- what this app actually keeps -------------------------------------- */
  function localSettings() {
    var out = {};
    try {
      var d = localStorage.getItem(SOBER_KEY);
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.soberDate = d;
    } catch (e) {}
    return out;
  }

  function applySettings(data) {
    if (!data) return;
    try {
      if (data.soberDate && /^\d{4}-\d{2}-\d{2}$/.test(data.soberDate)) {
        localStorage.setItem(SOBER_KEY, data.soberDate);
      }
    } catch (e) {}
  }

  window.RMAccount = {
    signedIn: function () { return !!session; },
    name: function () { return (session && session.name) || ""; },
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    pull: pull,
    push: push,
    local: localSettings,
    apply: applySettings,
    nameProblem: nameProblem,
    passwordProblem: passwordProblem
  };
})();

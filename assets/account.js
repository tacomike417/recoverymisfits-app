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

  /* WHOSE DATE IS THAT.

     Signing out leaves the date on the phone on purpose -- it is still your
     date and this app does not take it off your device. But the phone alone
     cannot tell "a date somebody set before they ever made an account" from
     "a date the last account left behind", and those two want opposite
     things: the first should be adopted by a new account, the second must
     never be.

     So whenever an account writes the date, it signs it. No signature means
     nobody has claimed it and a new account may take it. A signature that
     is not yours means it is not yours, and signing in swaps the phone over
     to your own. */
  var OWNER_KEY = "rm_sober_owner";

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
    /* the switcher's copy of this account stays fresh (see THE ACCOUNT SWITCHER below) */
    if (s && s.name) { var a = accts(); a[s.name] = { s: s, keep: (a[s.name] && a[s.name].keep) || {} }; saveAccts(a); }
  }

  /* ---- THE ACCOUNT SWITCHER (2 Oct 2026, Mike) ---------------------------
     "I need an account switcher to add accounts ... Instagram's is pretty nice.
     You just hold your finger on the account thing. It comes up, lets you
     switch right there."

     Every account that has signed in on this phone stays in a list on this
     phone (rm_accounts_v1), each with its own sign-in. Switching swaps which
     one is live and reloads the page; nobody types a password again. Signing
     in while already signed in ADDS an account instead of replacing one.

     EACH ACCOUNT KEEPS ITS OWN SOBER DATE. The date on the phone is put away
     with the account it belongs to and brought back when that account comes
     back, so a house account never wears somebody's sober time. */
  var ACCTS_KEY = "rm_accounts_v1";
  var KEEP = ["rm_sober_date", "rm_sober_owner", "rm_joined_date"];
  /* WHAT EACH ACCOUNT HAS ALREADY BEEN SHOWN (2 Oct 2026, Mike: "when I switch between
     accounts, it keeps shooting my coin notification up"). The coin and Survival Pile
     pop-ups remember the last one they showed in ONE spot on the phone, so two accounts
     with different coins each looked brand new to the other. Now each account carries
     its own, and a switch never sets one off. */
  var SHOWN = ["rm_coin_seen", "rm_pile_seen"];
  function accts() { try { return JSON.parse(localStorage.getItem(ACCTS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function saveAccts(a) { try { localStorage.setItem(ACCTS_KEY, JSON.stringify(a)); } catch (e) {} }
  /* put the live account away, with the date it owns */
  function park() {
    if (!session || !session.name) return;
    var keep = {}, own = "";
    try { own = localStorage.getItem("rm_sober_owner") || ""; } catch (e) {}
    if (!own || own === session.uid) KEEP.forEach(function (k) { try { var v = localStorage.getItem(k); if (v != null) keep[k] = v; } catch (e) {} });
    SHOWN.forEach(function (k) { try { var v = localStorage.getItem(k); if (v != null) keep[k] = v; } catch (e) {} });
    var a = accts(); a[session.name] = { s: session, keep: keep }; saveAccts(a);
  }
  function bring(entry) {
    KEEP.concat(SHOWN).forEach(function (k) { try { if (entry.keep && entry.keep[k] != null) localStorage.setItem(k, entry.keep[k]); else localStorage.removeItem(k); } catch (e) {} });
    /* nothing remembered for this account yet: whatever coin or card it is on gets
       marked as shown, quietly, instead of popping up because of the switch
       (coins.js reads rm_coin_quiet; assets/pile-reveal.js reads rm_welcome_skip) */
    try {
      if (!entry.keep || entry.keep.rm_coin_seen == null) localStorage.setItem("rm_coin_quiet", "1");
      if (!entry.keep || entry.keep.rm_pile_seen == null) localStorage.setItem("rm_welcome_skip", "1");
    } catch (e) {}
    remember(entry.s);
  }
  function accounts() {
    var a = accts(), cur = (session && session.name) || "";
    if (cur && !a[cur]) { a[cur] = { s: session, keep: {} }; saveAccts(a); }
    return Object.keys(a).sort(function (x, y) { return x === cur ? -1 : y === cur ? 1 : x < y ? -1 : 1; })
      .map(function (n) { return { name: n, current: n === cur }; });
  }
  function switchTo(name) {
    var t = accts()[name];
    if (!t || !t.s) return false;
    if (session && session.name === name) return true;
    park(); bring(t);
    return true;
  }
  function forget(name) { var a = accts(); delete a[name]; saveAccts(a); }

  /* ---- names -------------------------------------------------------------
     Lowercased so "Mike417" and "mike417" cannot become two accounts that
     look identical when written down. Letters, numbers, dot, dash and
     underscore -- enough to make a name, not enough to smuggle anything
     into an address. */
  function cleanName(name) {
    return String(name || "").trim().toLowerCase();
  }

  /* THE TWO THINGS PEOPLE TYPE HERE OUT OF HABIT.

     Every sign-up form they have ever filled in wanted an email, so some
     of them will put one here without thinking. A phone number is the other
     reflex. Both would be the one thing this app promises not to hold, and
     the charset rule would have caught them -- but "letters and numbers
     only" does not tell somebody WHY, and being told why is the whole point
     of this screen. So they get named, before anything else is checked. */
  function nameProblem(name) {
    var raw = String(name || "").trim();
    var n = cleanName(name);

    if (raw.indexOf("@") !== -1 || /\.(com|net|org|edu|gov|co|io|me)\b/i.test(raw)) {
      return "Please don't use your email. Nothing here needs one — " +
             "pick a username instead.";
    }
    if (/\d[\d\s().-]{6,}/.test(raw)) {
      return "Please don't use your phone number. Pick a username instead.";
    }
    if (n.length < 3) return "Your username needs at least 3 characters.";
    if (n.length > 32) return "That username is too long.";
    if (!/^[a-z0-9._-]+$/.test(n)) {
      return "Letters, numbers, dots, dashes and underscores only.";
    }
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
    /* signing in as somebody else while signed in: the first account is put away, not lost */
    if (session && session.name && s.name && session.name !== s.name) park();
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
    /* name_taken / "Database error saving new user": the database's wall for names
       nobody can take (supabase/porch_29_names_taken.sql). Same words as a real
       taken name, on purpose: nobody gets told there is a list. */
    if (/already registered|already exists|duplicate|name_taken|database error saving new user/i.test(m)) {
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
    /* names nobody can take (recoverymisfits, admin, slurs ...). The database refuses
       them anyway; asking first is just a faster, cleaner no. */
    try {
      var nb = await post("/rest/v1/rpc/name_blocked", { p_name: cleanName(name) });
      if (nb.ok && (await nb.json()) === true) return { ok: false, error: "That name is taken. Try another." };
    } catch (e) {}
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
    var raw = String(name || "").trim();
    if (raw.indexOf("@") !== -1) {
      return { ok: false, error: "That's an email. Sign in with your username." };
    }
    var bad = nameProblem(name);
    /* Anything else stays deliberately vague -- see readError. */
    if (bad) return { ok: false, error: "That name or password isn't right." };
    try {
      var res = await post("/auth/v1/token?grant_type=password",
        { email: cleanName(name) + MAIL_DOMAIN, password: password });
      var json = await res.json().catch(function () { return null; });
      if (!res.ok || !json || !json.access_token) {
        return { ok: false, error: readError(json, "That name or password isn't right.") };
      }
      stash(json, cleanName(name));
      /* SIGNING IN IS NOT A MILESTONE (5 Oct 2026). If this phone has no note of the coin or the
         pile card this account is on (a private window, a new phone, cleared data), mark them
         quietly instead of popping them. coins.js reads rm_coin_quiet; pile-reveal.js reads
         rm_welcome_skip. Sign-UP never comes through here, so a new account still gets its first. */
      try {
        /* also when the notes on this phone were left by a DIFFERENT account (signed out of one, into another) */
        var who = cleanName(name), other = localStorage.getItem("rm_last_in") !== who;
        if (other || localStorage.getItem("rm_coin_seen") == null) localStorage.setItem("rm_coin_quiet", String(Date.now()));
        if (other || localStorage.getItem("rm_pile_seen") == null) localStorage.setItem("rm_welcome_skip", "1");
        localStorage.setItem("rm_last_in", who);
      } catch (e2) {}
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
        forget(session.name);
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

  /* A DELETED ACCOUNT LEAVES NOTHING ON THE PHONE (3 Oct 2026, Mike: "All record of them
     wiped"). Signing out keeps the sober date here on purpose; deleting does not. This
     clears this account's sober date, its coins and pile markers and its saved face, and
     must run BEFORE signOut so the date isn't signed and kept. */
  function wipeMine() {
    KEEP.concat(SHOWN).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    try {
      var f = JSON.parse(localStorage.getItem("rm_faces_v1") || "{}") || {};
      if (session && session.name && f[session.name]) { delete f[session.name]; localStorage.setItem("rm_faces_v1", JSON.stringify(f)); }
    } catch (e) {}
  }

  function signOut() {
    /* SIGN THE DATE ON THE WAY OUT.

       The date stays on this phone -- signing out is "stop syncing", not
       "erase my date". But it has to leave with a signature on it, or the
       next account to be made on this phone finds an unsigned date and
       quite reasonably takes it for its own. That is exactly how a new
       account ended up wearing somebody else's sober time. */
    claimLocal();
    try { localStorage.removeItem("rm_joined_date"); } catch (e) {}   /* the Misfitversary is the account's */
    var was = (session && session.name) || "";
    remember(null);
    /* the switcher: this account leaves the list, and if another one is on this
       phone it takes over (the way Instagram does it) */
    if (was) forget(was);
    var rest = accts(), names = Object.keys(rest);
    if (names.length && rest[names[0]].s) bring(rest[names[0]]);
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

  /* ---- update: THE ONLY SAFE WAY TO CHANGE ONE THING ---------------------
     push() replaces the WHOLE blob. So anything that pulled a copy earlier,
     changed its one key and pushed it back later was quietly putting every
     OTHER key back the way it was when it pulled. That is exactly how the
     reading stack kept vanishing: Your Corner pulled on page load, the stack
     was saved, then opening a reading pushed Your Corner's old copy over it.

     update(fn) reads the account FRESH, hands the blob to fn to change its
     own key, and writes it straight back. Every caller goes through one
     line, one at a time, so two parts of the app saving at once cannot step
     on each other either. fn changes the blob in place (or returns a new
     one). Resolves true when it saved, false when it did not. */
  var line = Promise.resolve();
  function update(fn) {
    var run = line.then(async function () {
      var remote = await pull();
      if (!remote) return false;          /* no read, no write -- never guess */
      var data = remote.data || {};
      var next = fn(data);
      return push(next && typeof next === "object" ? next : data);
    }).catch(function () { return false; });
    line = run.then(function () {}, function () {});
    return run;
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
        claimLocal();
      }
    } catch (e) {}
  }

  function uid() { return (session && session.uid) || ""; }

  function localOwner() {
    try { return localStorage.getItem(OWNER_KEY) || ""; } catch (e) { return ""; }
  }

  /* Unclaimed, or claimed by whoever is signed in right now. */
  function localIsMine() {
    var o = localOwner();
    return !o || o === uid();
  }

  function claimLocal() {
    try {
      if (uid()) localStorage.setItem(OWNER_KEY, uid());
    } catch (e) {}
  }

  /* Somebody else's date, on this phone. Taken off rather than shown to the
     wrong person under their own name. */
  function forgetLocal() {
    try {
      localStorage.removeItem(SOBER_KEY);
      localStorage.removeItem(OWNER_KEY);
    } catch (e) {}
  }

  /* HEAL WHAT WAS ALREADY THERE.

     Every date set before this file learned about signatures is unsigned,
     including the ones that plainly belong to somebody's account. If there
     is a session and an unsigned date sitting next to it, that date is
     theirs -- they are the only account that has touched this phone. Sign
     it now, once, so the next account cannot mistake it for unclaimed.

     Runs on every page because account.js is fetched by nav.js, and it
     costs one localStorage read when there is nothing to do. */
  (function healUnsignedDate() {
    try {
      if (!session || !session.uid) return;
      if (localStorage.getItem(OWNER_KEY)) return;
      var d = localStorage.getItem(SOBER_KEY);
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) claimLocal();
    } catch (e) {}
  })();

  /* ---- the switcher's sheet --------------------------------------------- */
  var swEl = null;
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var SW_CSS = "#rmAccountBtn,[data-rm-switch]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:none}" +
    ".rm-sw{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.66);font-family:Arial,sans-serif}" +
    ".rm-sw-box{position:relative;width:100%;max-width:480px;max-height:80vh;overflow:auto;padding:10px 14px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#f7f1e3;color:#1b1a17;border-top:1px solid #d8ceb6}" +
    ".rm-sw-g{width:44px;height:5px;margin:2px auto 10px;border-radius:3px;background:#cfc4aa}" +
    ".rm-sw-x{position:absolute;right:8px;top:8px;width:44px;height:44px;border:0;border-radius:50%;background:none;color:#1b1a17;font-size:20px;cursor:pointer}" +
    ".rm-sw h3{margin:0 44px 8px 6px;font:800 13px Arial,sans-serif;letter-spacing:.14em;color:#8a6118}" +
    ".rm-sw-row{display:flex;align-items:center;gap:13px;width:100%;padding:10px 8px;border:0;border-radius:14px;background:none;color:#1b1a17;text-align:left;cursor:pointer;font:800 17px Arial,sans-serif}" +
    ".rm-sw-row:active{background:#efe6d0}" +
    ".rm-sw-av{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#c9a24a;color:#1a1408;font:800 18px Arial,sans-serif}" +
    ".rm-sw-av img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".rm-sw-row small{display:block;margin-top:2px;font:500 13.5px Arial,sans-serif;color:#6e675b}" +
    ".rm-sw-row .ck{margin-left:auto;flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#e0bd6a;color:#1a1408;font-size:15px}" +
    ".rm-sw-add .rm-sw-av{background:none;border:2px dashed #b8862b;color:#8a6118;font-size:26px;font-weight:400}" +
    ".rm-sw-line{display:flex;align-items:center;gap:4px}.rm-sw-line .rm-sw-row{flex:1;min-width:0}" +
    ".rm-sw-rm{flex:none;width:44px;height:44px;border:0;background:none;display:grid;place-items:center;cursor:pointer;padding:0}" +
    ".rm-sw-rm span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#c0392b;color:#fff;font:800 13px Arial,sans-serif}" +
    ".rm-sw-who{cursor:default}.rm-sw-p{margin:6px 8px 16px;font:500 16px/1.4 Arial,sans-serif;color:#3a362e}" +
    ".rm-sw-yn{display:flex;gap:10px;padding:0 4px}.rm-sw-yn button{flex:1;height:52px;border-radius:14px;font:800 17px Arial,sans-serif;cursor:pointer}" +
    ".rm-sw-no{border:1.5px solid #b9ad92;background:none;color:#1b1a17}.rm-sw-yes{border:0;background:#c0392b;color:#fff}";
  function swCSS() { if (document.getElementById("rm-sw-css")) return; var st = document.createElement("style"); st.id = "rm-sw-css"; st.textContent = SW_CSS; document.head.appendChild(st); }
  function swShut() { if (swEl) { swEl.remove(); swEl = null; } }
  function swClose() {
    if (!swEl) return;
    if (window.PorchBack && window.PorchBack.pop && window.PorchBack.pop("switcher")) return;
    if (swEl._own) { swEl._own = false; try { history.back(); return; } catch (e) {} }
    swShut();
  }
  /* REMOVE AN ACCOUNT FROM THIS PHONE (3 Oct 2026, Mike: "that little like remove account
     thing ... a little circle that's red or an X ... then confirmation saying you sure. And
     then yes or no, all like how they do on Facebook, really simple"). It only takes the
     sign-in off this phone. The account itself is untouched. */
  function swDraw() {
    var list = accounts();
    swEl.querySelector(".rm-sw-box").innerHTML = '<div class="rm-sw-g"></div><button type="button" class="rm-sw-x" data-sw-x aria-label="Close">&#10005;</button><h3>' + (list.length ? "SWITCH ACCOUNT" : "ACCOUNTS") + "</h3>" +
      list.map(function (a) {
        return '<div class="rm-sw-line"><button type="button" class="rm-sw-row" data-sw="' + esc(a.name) + '"><span class="rm-sw-av" data-sw-av="' + esc(a.name) + '">' + esc(a.name.slice(0, 2).toUpperCase()) + '</span><span><span data-sw-nm="' + esc(a.name) + '">' + esc(a.name) + "</span>" + (a.current ? "<small>Signed in now</small>" : "") + "</span></button>" +
          '<button type="button" class="rm-sw-rm" data-sw-rm="' + esc(a.name) + '" aria-label="Remove ' + esc(a.name) + ' from this phone"><span>&#10005;</span></button></div>';
      }).join("") +
      '<button type="button" class="rm-sw-row rm-sw-add" data-sw-add><span class="rm-sw-av">+</span><span>' + (list.length ? "Add account" : "Sign in or make an account") + "</span></button>";
    paintFaces();
    return list;
  }
  function swAsk(n) {
    swEl.querySelector(".rm-sw-box").innerHTML = '<div class="rm-sw-g"></div><h3>REMOVE ACCOUNT?</h3>' +
      '<div class="rm-sw-row rm-sw-who"><span class="rm-sw-av" data-sw-av="' + esc(n) + '">' + esc(n.slice(0, 2).toUpperCase()) + '</span><span><span data-sw-nm="' + esc(n) + '">' + esc(n) + "</span></span></div>" +
      '<p class="rm-sw-p">Take this account off this phone? The account is not deleted. You can sign in again anytime.</p>' +
      '<div class="rm-sw-yn"><button type="button" class="rm-sw-no" data-sw-no>No</button><button type="button" class="rm-sw-yes" data-sw-yes="' + esc(n) + '">Yes, remove</button></div>';
    paintFaces();
  }
  function switcher() {
    if (swEl) return;
    swCSS();
    swEl = document.createElement("div"); swEl.className = "rm-sw"; swEl.setAttribute("role", "dialog"); swEl.setAttribute("aria-modal", "true"); swEl.setAttribute("aria-label", "Switch account");
    swEl.innerHTML = '<div class="rm-sw-box"></div>';
    document.body.appendChild(swEl);
    var list = swDraw();
    /* the phone's back button closes it: the Porch's own back stack there, a plain history step anywhere else */
    if (window.PorchBack && window.PorchBack.push) { var z = window.PorchBack.push("switcher", swShut); }
    else { try { history.pushState({ rmsw: 1 }, ""); swEl._own = true; window.addEventListener("popstate", function once() { window.removeEventListener("popstate", once); if (swEl) { swEl._own = false; swShut(); } }); } catch (e) {} }
    swEl.addEventListener("click", function (e) {
      if (e.target === swEl || e.target.closest("[data-sw-x]")) return swClose();
      if (e.target.closest("[data-sw-add]")) { location.href = "/account.html?add=1"; return; }
      if (e.target.closest("[data-sw-no]")) { swDraw(); return; }
      var rm = e.target.closest("[data-sw-rm]"); if (rm) { swAsk(rm.getAttribute("data-sw-rm")); return; }
      var yes = e.target.closest("[data-sw-yes]");
      if (yes) {
        var who = yes.getAttribute("data-sw-yes");
        if (session && session.name === who) { signOut(); swShut(); location.replace(session ? location.pathname : "/account.html"); return; }
        forget(who); swDraw(); return;
      }
      var r = e.target.closest("[data-sw]"); if (!r) return;
      var n = r.getAttribute("data-sw");
      if (session && session.name === n) return swClose();
      if (switchTo(n)) { swShut(); location.replace(location.pathname); }
    });
    /* faces and profile names, for the ones that are on the Porch */
    loadFaces(list.map(function (a) { return a.name; })).then(paintFaces);
  }

  /* ---- FACES (2 Oct 2026, Mike: "I have my profile picture set, but it just does not show
     down there on the rail, and it doesn't show up in the box"). Two reasons it didn't:
     the switcher asked for pictures without saying who was asking, and the Porch only
     hands a Members-only profile to somebody signed in; and the Account button only ever
     wore your picture on the Porch page. Now the pictures are asked for as the signed-in
     person, kept on the phone so they show at once, and the Account button wears yours
     on every page. */
  var FACES_KEY = "rm_faces_v1";
  function faces() { try { return JSON.parse(localStorage.getItem(FACES_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function faceURL(p) { return !p ? "" : p.charAt(0) === "/" ? p : URL_BASE + "/storage/v1/object/public/porch/" + p; }
  async function loadFaces(names) {
    names = (names || []).filter(Boolean); if (!names.length) return;
    try {
      var t = (await token()) || ANON_KEY;
      var r = await fetch(URL_BASE + "/rest/v1/porch_members?handle=in.(" + names.map(function (n) { return '"' + encodeURIComponent(n) + '"'; }).join(",") + ")&select=handle,avatar_path,real_name",
        { headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + t } });
      if (!r.ok) return;
      var rows = await r.json(), f = faces();
      (rows || []).forEach(function (m) { f[m.handle] = { av: m.avatar_path || "", rn: m.real_name || "" }; });
      try { localStorage.setItem(FACES_KEY, JSON.stringify(f)); } catch (e) {}
    } catch (e) {}
  }
  function paintFaces() {
    var f = faces();
    if (swEl) Object.keys(f).forEach(function (h) {
      var av = swEl.querySelector('[data-sw-av="' + h + '"]'), nm = swEl.querySelector('[data-sw-nm="' + h + '"]');
      if (av && f[h].av) av.innerHTML = '<img src="' + esc(faceURL(f[h].av)) + '" alt="">';
      if (nm && f[h].rn) nm.textContent = f[h].rn + " \u00b7 " + h;
    });
    railFace();
  }
  /* your picture on the Account button, on every page. The Porch page draws its own
     (class "pin"), so this leaves that one alone. */
  function railFace() {
    var b = document.getElementById("rmAccountBtn"); if (!b || b.classList.contains("pin") || !session) return;
    var me = faces()[session.name], img = b.querySelector("img"); if (!img || !me || !me.av) return;
    var src = faceURL(me.av); if (img.getAttribute("data-face") === src) return;
    img.setAttribute("data-face", src); img.src = src;
    img.style.cssText = "width:28px;height:28px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1.5px #1a160e,0 0 0 3px #e0bd6a";
  }
  (function keepRailFace() {
    if (!session) return;
    var tick = function () { try { railFace(); } catch (e) {} };
    setInterval(tick, 1500); setTimeout(tick, 400);
    loadFaces([session.name]).then(tick);
  })();

  /* ---- THE ROLL-OUT (v233, 7 Oct 2026) -----------------------------------
     Mike: "the account switcher ... can work like facebooks, where you hold down and it rolls out the profile
     pics and you pick one. saves space, looks good."
     Hold the You button and the accounts on this phone roll up out of it as pills: yours at the bottom, the
     others over it, "Add account" on top. Keep your finger down, slide to one and let go; or let go first and
     tap one. Tapping the dark closes it, and so does the phone's back button.
     Taking an account OFF this phone still lives in the full sheet: the small "Manage" pill opens it. */
  var roEl = null, roHot = null;
  var RO_CSS = "#rmAccountBtn,[data-rm-switch]{touch-action:none}" +
    ".rm-ro{position:fixed;inset:0;z-index:2147483600;font-family:Arial,sans-serif;-webkit-user-select:none;user-select:none;touch-action:none}" +
    ".rm-ro-dim{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;transition:opacity .18s}" +
    ".rm-ro.in .rm-ro-dim{opacity:1}" +
    ".rm-ro-col{position:absolute;display:flex;flex-direction:column;align-items:flex-end;gap:10px;padding:6px}" +
    ".rm-ro-p{display:flex;align-items:center;gap:10px;max-width:78vw;padding:6px 6px 6px 16px;border:0;border-radius:999px;background:#f7f1e3;color:#1b1a17;font:700 15px Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.6);cursor:pointer;" +
      "opacity:0;transform:translateY(26px) scale(.6);transform-origin:100% 100%;transition:transform .26s cubic-bezier(.2,1.5,.35,1),opacity .16s}" +
    ".rm-ro.in .rm-ro-p{opacity:1;transform:none}" +
    ".rm-ro-p b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}" +
    ".rm-ro-p .rm-sw-av{width:44px;height:44px;font-size:15px}" +
    ".rm-ro-p.me{box-shadow:0 0 0 3px #d8b45b,0 6px 20px rgba(0,0,0,.6)}" +
    ".rm-ro-p.hot{background:#fff;transform:scale(1.07)!important}" +
    ".rm-ro-p.add .rm-sw-av{background:#e9e0cc;border:0;color:#1b1a17;font-size:24px;font-weight:400}" +
    ".rm-ro-p.mng{padding:9px 16px;background:rgba(247,241,227,.16);color:#f7f1e3;font-size:13px;box-shadow:none}" +
    ".rm-ro-tip{position:fixed;z-index:2147483500;max-width:210px;padding:10px 14px;border-radius:14px;background:#f7f1e3;color:#1b1a17;font:700 13.500px/1.3 Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.55);pointer-events:none;opacity:0;transition:opacity .25s}" +
    ".rm-ro-tip.in{opacity:1}";
  function roShut() { if (roEl) { roEl.remove(); roEl = null; roHot = null; } }
  function roClose() {
    if (!roEl) return;
    if (window.PorchBack && window.PorchBack.pop && window.PorchBack.pop("rollout")) return;
    if (roEl._own) { roEl._own = false; try { history.back(); return; } catch (e) {} }
    roShut();
  }
  function roAct(pill) {
    if (!pill) return;
    var k = pill.getAttribute("data-ro");
    if (k === "+") { location.href = "/account.html?add=1"; return; }
    if (k === "*") { roClose(); setTimeout(switcher, 260); return; }
    if (session && session.name === k) return roClose();
    if (switchTo(k)) { roShut(); location.replace(location.pathname); }
  }
  function roPaint() {
    if (!roEl) return; var f = faces();
    roEl.querySelectorAll("[data-ro-av]").forEach(function (av) { var m = f[av.getAttribute("data-ro-av")]; if (m && m.av) av.innerHTML = '<img src="' + esc(faceURL(m.av)) + '" alt="">'; });
  }
  function rollout(btn) {
    if (roEl || swEl) return;
    swCSS(); if (!document.getElementById("rm-ro-css")) { var st = document.createElement("style"); st.id = "rm-ro-css"; st.textContent = RO_CSS; document.head.appendChild(st); }
    var list = accounts(), cur = session && session.name;
    if (!list.length) return switcher();
    /* top to bottom on the screen: Manage, Add account, the others, then you (nearest your thumb) */
    var others = list.filter(function (a) { return a.name !== cur; }), mine = list.filter(function (a) { return a.name === cur; });
    var pill = function (a, i, me) { return '<button type="button" class="rm-ro-p' + (me ? " me" : "") + '" data-ro="' + esc(a.name) + '" style="transition-delay:' + (i * 40) + 'ms"><b>' + esc(a.name) + '</b><span class="rm-sw-av" data-ro-av="' + esc(a.name) + '">' + esc(a.name.slice(0, 2).toUpperCase()) + "</span></button>"; };
    var n = others.length + mine.length;
    var html = '<button type="button" class="rm-ro-p mng" data-ro="*" style="transition-delay:' + ((n + 1) * 40) + 'ms">Manage</button>' +
      '<button type="button" class="rm-ro-p add" data-ro="+" style="transition-delay:' + (n * 40) + 'ms"><b>Add account</b><span class="rm-sw-av">+</span></button>' +
      others.map(function (a, i) { return pill(a, others.length - i, false); }).join("") + mine.map(function (a) { return pill(a, 0, true); }).join("");
    roEl = document.createElement("div"); roEl.className = "rm-ro"; roEl.setAttribute("role", "dialog"); roEl.setAttribute("aria-modal", "true"); roEl.setAttribute("aria-label", "Switch account");
    roEl.innerHTML = '<div class="rm-ro-dim" data-ro-x></div><div class="rm-ro-col">' + html + "</div>";
    var r = btn && btn.getBoundingClientRect ? btn.getBoundingClientRect() : { top: innerHeight - 70, right: innerWidth - 16 };
    var col = roEl.querySelector(".rm-ro-col");
    col.style.bottom = Math.max(70, innerHeight - r.top + 12) + "px"; col.style.right = Math.max(10, innerWidth - r.right - 6) + "px";
    document.body.appendChild(roEl);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (roEl) roEl.classList.add("in"); }); });
    if (window.PorchBack && window.PorchBack.push) { window.PorchBack.push("rollout", roShut); }
    else { try { history.pushState({ rmro: 1 }, ""); roEl._own = true; window.addEventListener("popstate", function once() { window.removeEventListener("popstate", once); if (roEl) { roEl._own = false; roShut(); } }); } catch (e) {} }
    roEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-ro-x]")) return roClose();
      roAct(e.target.closest("[data-ro]"));
    });
    roPaint(); loadFaces(list.map(function (a) { return a.name; })).then(roPaint);
    try { localStorage.setItem("rm_hold_tip", "1"); } catch (e) {}
  }
  /* finger still down after the hold: slide onto a pill and let go */
  function roTrack(e) {
    if (!roEl) return;
    var t = document.elementFromPoint(e.clientX, e.clientY), pl = t && t.closest ? t.closest(".rm-ro-p") : null;
    if (pl === roHot) return;
    if (roHot) roHot.classList.remove("hot");
    roHot = pl; if (pl) { pl.classList.add("hot"); try { if (navigator.vibrate) navigator.vibrate(6); } catch (x) {} }
  }
  /* ONE TIME, when there are two or more accounts on this phone and they have never held the button:
     a small note over it, so the hold is not a secret. */
  (function holdTip() {
    try {
      if (localStorage.getItem("rm_hold_tip") || accounts().length < 2) return;
      setTimeout(function () {
        var b = document.getElementById("rmAccountBtn"); if (!b || roEl || swEl) return;
        swCSS(); if (!document.getElementById("rm-ro-css")) { var st = document.createElement("style"); st.id = "rm-ro-css"; st.textContent = RO_CSS; document.head.appendChild(st); }
        var r = b.getBoundingClientRect(), tip = document.createElement("div");
        tip.className = "rm-ro-tip"; tip.textContent = "Hold this button to switch accounts.";
        tip.style.bottom = (innerHeight - r.top + 12) + "px"; tip.style.right = Math.max(10, innerWidth - r.right - 6) + "px";
        document.body.appendChild(tip);
        requestAnimationFrame(function () { tip.classList.add("in"); });
        setTimeout(function () { tip.classList.remove("in"); setTimeout(function () { tip.remove(); }, 300); }, 6000);
        try { localStorage.setItem("rm_hold_tip", "1"); } catch (e) {}
      }, 2500);
    } catch (e) {}
  })();

  /* HOLD YOUR FINGER ON THE ACCOUNT BUTTON (the one in the bottom rail, on every
     page). Half a second and the switcher comes up; a plain tap still does what
     it always did. */
  (function holdToSwitch() {
    var SEL = "#rmAccountBtn,[data-rm-switch]", tmr = 0, x0 = 0, y0 = 0, fired = 0, down = false;
    try { swCSS(); } catch (e) {}      /* so an iPhone never shows its own link bubble on the button */
    function stop() { clearTimeout(tmr); tmr = 0; }
    document.addEventListener("pointerdown", function (e) {
      var t = e.target.closest && e.target.closest(SEL); if (!t) return;
      swCSS(); x0 = e.clientX; y0 = e.clientY; stop(); down = true;
      /* v233: the hold rolls the accounts out of the button (the full sheet is still behind "Manage") */
      tmr = setTimeout(function () { tmr = 0; fired = Date.now(); try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) {} rollout(t); }, 480);
    }, true);
    document.addEventListener("pointermove", function (e) {
      if (tmr && (Math.abs(e.clientX - x0) > 12 || Math.abs(e.clientY - y0) > 12)) stop();
      if (down && roEl) roTrack(e);
    }, true);
    document.addEventListener("pointerup", function () { if (down && roEl && roHot) { var h = roHot; roHot = null; h.classList.remove("hot"); roAct(h); } down = false; }, true);
    document.addEventListener("pointercancel", function () { down = false; if (roHot) { roHot.classList.remove("hot"); roHot = null; } }, true);
    ["pointerup", "pointercancel", "scroll"].forEach(function (ev) { document.addEventListener(ev, stop, true); });
    /* the tap that ends a long press must not also open the button */
    document.addEventListener("click", function (e) {
      if (fired && Date.now() - fired < 1200 && e.target.closest && e.target.closest(SEL)) { e.preventDefault(); e.stopPropagation(); fired = 0; }
    }, true);
    document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(SEL)) e.preventDefault(); }, true);
    /* on a desktop, holding the mouse on a link starts dragging it, which cancelled the hold */
    document.addEventListener("dragstart", function (e) { if (e.target.closest && e.target.closest(SEL)) e.preventDefault(); }, true);
  })();

  window.RMAccount = {
    accounts: accounts,      /* every account signed in on this phone */
    switchTo: switchTo,      /* then reload the page */
    switcher: switcher,      /* the sheet */
    rollout: rollout,        /* the pills that roll out of the You button (v233) */
    signedIn: function () { return !!session; },
    name: function () { return (session && session.name) || ""; },
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    wipeMine: wipeMine,
    token: token,          /* a fresh access token, for the Porch (30 Sep 2026) */
    pull: pull,
    push: push,
    update: update,
    local: localSettings,
    apply: applySettings,
    uid: uid,
    anonKey: ANON_KEY,     /* the public key, for reading the Porch from account.html */
    localOwner: localOwner,
    localIsMine: localIsMine,
    claimLocal: claimLocal,
    forgetLocal: forgetLocal,
    nameProblem: nameProblem,
    passwordProblem: passwordProblem
  };
})();

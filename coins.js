/* coins.js — Recovery Misfits sobriety coins
   ===========================================================================

   WHAT THIS DOES, IN THREE PIECES:

     1. Puts the person's coin on the sober rail where the share icon used to
        be, hanging over the top edge of the plate so it reads as an object
        sitting on the bar rather than another button punched into it.
        Tapping it still goes to /sober-date.html, exactly as before.

     2. Shows the coin big and glowing when they earn a new one, and once
        for somebody who has just made an account. Close it and the coin
        flies down and lands in its spot on the rail.

     3. Hands the current coin to any other page that wants it --
        sober-date.html draws it on the share card.

   IT DRIVES ITSELF. nav.js only has to load this file. Everything here finds
   the rail on its own and repaints when the counter changes, so the two
   files cannot drift out of step.

   THE COIN ART is /assets/coins/*.webp -- 512px, transparent, about 100 KB
   each. Only ever one is fetched: the one this person has earned. */

(function () {
  "use strict";

  /* Same key nav.js writes. Read, never written here. */
  var SOBER_KEY = "rm_sober_date";

  /* The last coin this phone has SHOWN this person. The reveal fires when
     the coin they would see stops matching this, which is exactly their
     milestone day -- no separate date list to keep in sync with the art. */
  var SEEN_KEY = "rm_coin_seen";

  var BASE = "/assets/coins/";

  /* ---- reading the date ---------------------------------------------------
     localStorage THROWS in iOS private browsing rather than returning null,
     which is why every touch of it here is wrapped. Same reasoning as
     nav.js: no stored date is the honest answer on those phones. */
  function soberYMD() {
    var v = null;
    try { v = localStorage.getItem(SOBER_KEY); } catch (e) { return ""; }
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  }
  function seen() {
    try { return localStorage.getItem(SEEN_KEY) || ""; } catch (e) { return ""; }
  }
  function markSeen(file) {
    try { localStorage.setItem(SEEN_KEY, file); } catch (e) {}
  }

  function daysSober(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    var s = new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0);
    var n = new Date();
    var t = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
    return Math.floor((t - s) / 86400000);
  }

  /* YEARS ARE COUNTED OFF THE ANNIVERSARY, not by dividing days by 365.25.
     A person sober since 29 February wants their coin on the day the
     calendar says, and arithmetic on an average year length gets that wrong
     by a day in a way that is impossible to explain to somebody who is
     looking at their own date. */
  function fullYears(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return 0;
    var sy = +m[1], sm = +m[2] - 1, sd = +m[3];
    var n = new Date();
    var y = n.getFullYear() - sy;
    if (n.getMonth() < sm || (n.getMonth() === sm && n.getDate() < sd)) y--;
    return y < 0 ? 0 : y;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ---- THE LADDER ---------------------------------------------------------

     24 hours, 30 / 60 / 90 days, 6 months, then every anniversary to 55.

     THE SIX-MONTH COIN DOES NOT EXIST YET. It is in the ladder anyway, and
     if the file is missing the <img> quietly falls back to the 90-day coin
     (see the onerror below). Drop coin-06-months.webp into /assets/coins/
     and it starts appearing on its own -- nothing here needs editing.

     Above 55 years the coin stops climbing rather than 404ing. Somebody with
     56 years has earned better than a broken image. */
  var MAX_YEARS = 55;

  /* NO DATE, NO ACCOUNT -- a question mark, not an empty space. It is still
     a real coin so the bar looks the same for everybody, and tapping it goes
     to the account page instead of the share card, because the thing they
     need first is somewhere to put their date.

     It is marked `silent` so the reveal never fires on it. Nobody has
     earned anything yet and a celebration would be a lie. */
  var NO_DATE = {
    file: "coin-no-date.webp",
    label: "no sober date set",
    fallback: null,
    href: "/account.html",
    silent: true
  };

  /* ---- NO ACCOUNT, NO COIN ------------------------------------------------

     THE RULE, AS OF 21 SEP 2026: you have an account and you get the app, or
     you do not and you get the default site. The coin and the day count are
     both account things. Signed out, never signed up -- same answer either
     way, because from the bar's point of view they are the same state.

     READ OFF STORAGE, NOT OFF RMAccount. nav.js only fetches account.js when
     there is a token to use it with, so somebody without an account never
     has window.RMAccount at all -- asking it whether they are signed in gets
     a confident "no idea" every time. The session is one localStorage read:

        rm_account_v1   present = signed in.

     WORTH KNOWING WHEN THE REST CATCHES UP: nav.js still reads the sober
     date out of localStorage, so a date set without an account is still
     sitting on those phones. This hides it rather than deleting it -- when
     the date moves to the account for real, this test does not change. */
  var TOKEN_KEY = "rm_account_v1";

  function noAccount() {
    try { return !localStorage.getItem(TOKEN_KEY); } catch (e) { return true; }
  }

  function coinFor(ymd) {
    if (!ymd) return NO_DATE;
    if (noAccount()) return NO_DATE;
    var d = daysSober(ymd);
    if (d === null || d < 0) return NO_DATE;

    var y = fullYears(ymd);
    if (y >= 1) {
      var n = y > MAX_YEARS ? MAX_YEARS : y;
      return {
        file: "coin-" + pad2(n) + (n === 1 ? "-year" : "-years") + ".webp",
        label: n === 1 ? "1 year" : n + " years",
        fallback: null
      };
    }
    if (d >= 180) return { file: "coin-06-months.webp", label: "6 months",
                           fallback: "coin-90-days.webp" };
    if (d >= 90)  return { file: "coin-90-days.webp",  label: "90 days",  fallback: null };
    if (d >= 60)  return { file: "coin-60-days.webp",  label: "60 days",  fallback: null };
    if (d >= 30)  return { file: "coin-30-days.webp",  label: "30 days",  fallback: null };
    return          { file: "coin-24-hours.webp", label: "24 hours", fallback: null };
  }

  /* Anyone can ask what coin is current -- sober-date.html draws it on the
     share card. Exposed before anything else runs so a page that loads this
     file late still gets an answer. */
  var api = window.RMCoins = window.RMCoins || {};
  api.current = function () { return coinFor(soberYMD()); };
  api.src = function (c) { return c ? BASE + c.file : ""; };
  api.locked = noAccount;

  /* ---- styles -------------------------------------------------------------
     Injected rather than shipped in a stylesheet so this file is the only
     thing to add or remove. Everything is scoped to .rm-coin* so nothing
     here can reach into a page's own rules. */
  function injectStyles() {
    if (document.getElementById("rm-coin-css")) return;
    var s = document.createElement("style");
    s.id = "rm-coin-css";
    s.textContent = [
      /* THE PLATE HAS TO STOP CLIPPING. The rail is drawn inside a box with
         overflow:hidden, which is what kept the scaled artwork tidy -- and
         which would slice the top off any coin hanging over the edge. The
         rail fits its box exactly, so letting it show costs nothing. */
      ".rm-rail-fit{overflow:visible}",
      ".rm-rail{overflow:visible}",
      /* nav.js hides the well's contents when it has no date of its own.
         The zeros are ours and are meant to be seen, so they win. */
      ".rm-rail.no-date.rm-coins-locked .rm-rail-count > *{visibility:visible}",

      /* THE COIN IS THE BUTTON. The well behind it is turned off -- a coin
         sitting in a sunken rectangle reads as a picture of a button, and
         the whole point is that this thing sits ON the bar.

         EVERY RULE BELOW IS PREFIXED WITH .rm-rail, and that is not tidiness.
         nav.js styles the wells with `.rm-rail-act img{width:19px}`, which
         is a more specific selector than a bare class -- the coin came out
         19px wide and tucked inside the plate until these were raised above
         it. Do not simplify these selectors. */
      ".rm-rail .rm-rail-act.rm-share{",
        "flex:0 0 58px;background:none;box-shadow:none;",
        "position:relative;overflow:visible;gap:0",
      "}",
      ".rm-rail .rm-rail-act.rm-share span{display:none}",  /* the word SHARE goes */

      /* THE COIN IS CENTERED ON THE PLATE, NOT ON ITS BUTTON, and it is
         bigger than the plate is tall -- so it breaks the top edge and the
         bottom edge by the same amount and sits proud of the bar on every
         side.

         THE ARITHMETIC, because -13px looks arbitrary and is not: the plate
         is 64 tall, the button inside it is 44 and therefore starts 10 down.
         A 70px coin centered on the PLATE wants to start at (64-70)/2 = -3,
         which against its button is -3 - 10 = -13. Change the diameter and
         this number changes with it: top = (64 - D)/2 - 10.

         At 70 it also runs wider than its 58px well, which is the point --
         it crosses the brass dividers on both sides. z-index lifts it over
         them; without it the divider after the coin paints on top. */
      ".rm-rail .rm-rail-act img.rm-coin-rail{",
        "position:absolute;left:50%;top:-13px;z-index:3;",
        "width:70px;height:70px;margin-left:-35px;",
        "display:block;flex:none;",
        "filter:drop-shadow(0 3px 6px rgba(0,0,0,.8))",
                " drop-shadow(0 0 8px rgba(215,178,83,.34));",
        "transition:transform .14s ease",
      "}",
      ".rm-rail .rm-rail-act.rm-share:active img.rm-coin-rail{transform:scale(.93)}",
      ".rm-rail .rm-rail-act.rm-share:active{filter:none}",  /* no brightness flash */

      /* THE SHARE ICON IS GONE FOR GOOD. There is a coin for every state
         now, including "no date yet", so the well never falls back to the
         old graphic. The original <img> stays in nav.js's markup and is
         simply never shown -- deleting it there would mean editing two
         files to change one thing. */
      ".rm-rail .rm-rail-act.rm-share img.rm-coin-fallback{display:none}",

      /* NO ACCOUNT: the counter reads 000, not nothing.

         A blank well is easy to look past. Three zeros are not -- they are
         a number, they are YOUR number, and they are wrong. That itch is
         the whole point: it is the difference between noticing the bar and
         doing something about it. The tiles are the same artwork the real
         count uses, dimmed a little so it reads as inactive rather than as
         somebody genuinely on day zero. */
      ".rm-rail.rm-coins-locked .rm-rail-count{opacity:.55}",

      /* ---- the reveal ----------------------------------------------------
         NO CONTAINER, on purpose. A card around the coin makes it a
         notification; on its own in the dark it is the thing itself. */
      ".rm-coin-reveal{",
        "position:fixed;inset:0;z-index:2147483000;",
        "display:flex;flex-direction:column;align-items:center;",
        "justify-content:center;gap:22px;",
        "background:rgba(6,6,5,.93);",
        "-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);",
        "opacity:0;transition:opacity .28s ease;",
        "padding:0 24px;",                            /* 16px+ side gutter */
      "}",
      ".rm-coin-reveal.on{opacity:1}",

      /* The glow is a real light behind the coin, not a ring drawn on it,
         so the transparent edge of the art stays an edge. */
      ".rm-coin-stage{position:relative;display:grid;place-items:center}",
      ".rm-coin-stage::before{",
        "content:'';position:absolute;width:150%;height:150%;",
        "border-radius:50%;",
        "background:radial-gradient(circle,rgba(215,178,83,.40) 0%,",
                   "rgba(215,178,83,.14) 42%,transparent 68%);",
        "animation:rmCoinHalo 2.6s ease-in-out infinite",
      "}",
      ".rm-coin-big{",
        "position:relative;display:block;",
        "width:min(62vw,270px);height:auto;",
        "filter:drop-shadow(0 0 18px rgba(215,178,83,.55));",
        "animation:rmCoinIn .62s cubic-bezier(.16,1.1,.3,1) both,",
                  "rmCoinBreathe 2.6s ease-in-out .62s infinite",
      "}",
      "@keyframes rmCoinIn{",
        "from{opacity:0;transform:scale(.55) rotate(-14deg)}",
        "to{opacity:1;transform:scale(1) rotate(0)}",
      "}",
      "@keyframes rmCoinBreathe{",
        "0%,100%{filter:drop-shadow(0 0 14px rgba(215,178,83,.45))}",
        "50%{filter:drop-shadow(0 0 26px rgba(215,178,83,.8))}",
      "}",
      "@keyframes rmCoinHalo{",
        "0%,100%{opacity:.55;transform:scale(.94)}",
        "50%{opacity:1;transform:scale(1.06)}",
      "}",

      ".rm-coin-say{",
        "margin:0;text-align:center;color:#f4ecdb;",
        "font-family:'RM Rail',Oswald,'Avenir Next Condensed',",
                    "'Roboto Condensed','Arial Narrow',system-ui,sans-serif;",
        "font-weight:500;font-size:clamp(19px,6vw,26px);",
        "letter-spacing:.13em;text-transform:uppercase;",
        "text-shadow:0 2px 0 #000;",
        "animation:rmCoinSay .5s ease .5s both",
      "}",
      "@keyframes rmCoinSay{from{opacity:0;transform:translateY(9px)}",
                           "to{opacity:1;transform:none}}",

      /* 44px target, which is the smallest anything tappable is allowed to
         be anywhere else in this app. */
      ".rm-coin-x{",
        "position:absolute;top:max(14px,env(safe-area-inset-top,0px));",
        "right:14px;width:44px;height:44px;",
        "display:grid;place-items:center;",
        "background:none;border:0;cursor:pointer;",
        "color:#cbbf9f;font-size:30px;line-height:1;padding:0;",
      "}",
      ".rm-coin-x:active{color:#f4ecdb}",

      /* WHILE IT IS FLYING HOME nothing else should animate on it. */
      ".rm-coin-big.flying{animation:none;transition:",
        "transform .52s cubic-bezier(.5,0,.55,1),opacity .52s ease}",

      "@media (prefers-reduced-motion:reduce){",
        ".rm-coin-big,.rm-coin-say,.rm-coin-stage::before{animation:none}",
        ".rm-coin-big.flying{transition:opacity .2s ease}",
      "}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- the coin on the rail ----------------------------------------------- */

  function railBtn() { return document.getElementById("rmShareSoberDateBtn"); }

  /* THREE ZEROS, drawn with nav.js's own tiles so it is plainly the same
     counter rather than a different thing wearing its clothes. Three because
     it fills the well at the size the tiles are drawn at -- one lonely 0
     reads as a rendering fault, and six looks like a bug.

     nav.js repaints this well whenever the count changes and will write the
     real number straight back over it, which is why this runs on every paint
     rather than once. It writes only when the markup differs, so the
     observer watching the bar cannot chase its own tail. */
  var ZEROS = '<img class="rm-rail-tile" src="/assets/rail/tile-0.webp" alt="">'
            + '<img class="rm-rail-tile" src="/assets/rail/tile-0.webp" alt="">'
            + '<img class="rm-rail-tile" src="/assets/rail/tile-0.webp" alt="">'
            + '<span class="rm-rail-days">Days</span>';

  function zeroCount() {
    var box = document.getElementById("rmRailCount");
    if (!box) return;
    if (box.innerHTML === ZEROS) return;
    box.innerHTML = ZEROS;
    box.className = "rm-rail-count";
    box.setAttribute("aria-label", "No sober date — sign in to start counting");
  }

  function paintRail() {
    var btn = railBtn();
    if (!btn) return;

    var coin = coinFor(soberYMD());

    /* THE WHOLE BAR TELLS ONE STORY. nav.js repaints the rail whenever the
       count changes and will happily write the date back over this, which is
       why it is re-applied here on every paint rather than once at start.
       Writing only when it differs keeps the observer from chasing itself. */
    var rail = document.querySelector(".rm-rail");
    var locked = noAccount();
    if (rail) rail.classList.toggle("rm-coins-locked", locked);
    if (locked) zeroCount();

    /* SIGN IN, not "signed out" -- it reads the same to somebody who just
       signed out and to somebody who never had an account, and it says what
       to do rather than what happened. Tapping the coin goes there. */
    var label = document.getElementById("rmSoberBarText");
    if (label && locked && label.textContent !== "Sign In") {
      label.textContent = "Sign In";
    }

    /* Keep the original share icon in the markup, hidden, so the no-date
       state has something honest to fall back to. */
    var old = btn.querySelector("img:not(.rm-coin-rail)");
    if (old && !old.classList.contains("rm-coin-fallback")) {
      old.classList.add("rm-coin-fallback");
    }

    var img = btn.querySelector(".rm-coin-rail");
    if (!coin) { if (img) img.remove(); return; }

    if (!img) {
      img = document.createElement("img");
      img.className = "rm-coin-rail";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.width = 60; img.height = 60;
      /* The six-month coin may not be drawn yet. One retry at the fallback,
         then leave it -- never a loop. */
      img.addEventListener("error", function () {
        var fb = img.getAttribute("data-fallback");
        if (fb && img.src.indexOf(fb) === -1) {
          img.removeAttribute("data-fallback");
          img.src = BASE + fb;
        } else {
          img.remove();
        }
      });
      btn.appendChild(img);
    }

    var want = BASE + coin.file;
    if (img.getAttribute("data-file") !== coin.file) {
      img.setAttribute("data-file", coin.file);
      if (coin.fallback) img.setAttribute("data-fallback", coin.fallback);
      else img.removeAttribute("data-fallback");
      img.src = want;
    }

    /* WHERE THE COIN GOES depends on which coin it is. An earned coin opens
       the share card. The question mark opens the account page, because
       somebody with no date does not want to share one -- they want
       somewhere to put it. nav.js's own href is the default. */
    if (coin.href) {
      if (!btn.getAttribute("data-home")) {
        btn.setAttribute("data-home", btn.getAttribute("href") || "/sober-date.html");
      }
      btn.setAttribute("href", coin.href);
      btn.setAttribute("aria-label", "Set your sober date");
    } else {
      var home = btn.getAttribute("data-home");
      if (home) btn.setAttribute("href", home);
      btn.setAttribute("aria-label", "Your " + coin.label + " coin — share your sober date");
    }
  }
  api.paintRail = paintRail;

  /* ---- the reveal --------------------------------------------------------- */

  var openEl = null;
  var pushed = false;

  function close() {
    if (!openEl) return;
    var el = openEl;
    openEl = null;

    var big = el.querySelector(".rm-coin-big");
    var target = document.querySelector(".rm-coin-rail");

    /* THE COIN GOES HOME. Measure where it is and where it is going, then
       move it there -- so the big coin and the little one on the bar are
       plainly the same object. If the rail is not on this page (or the
       picture never loaded) it just fades. */
    if (big && target && big.getBoundingClientRect().width) {
      var a = big.getBoundingClientRect();
      var b = target.getBoundingClientRect();
      var k = b.width / a.width;
      var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      big.classList.add("flying");
      /* next frame, or the browser folds this into the starting style */
      requestAnimationFrame(function () {
        big.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + k + ")";
        big.style.opacity = "0.15";
      });
    }

    el.classList.remove("on");
    setTimeout(function () { el.remove(); }, 540);
    document.documentElement.style.overflow = "";

    /* We pushed a history entry so the phone's own back button closes this.
       If we are closing by any other route, take that entry back off so
       back does not then leave the page they were on. */
    if (pushed) {
      pushed = false;
      try { history.back(); } catch (e) {}
    }
  }
  api.close = close;

  function show(coin) {
    if (openEl) return;
    coin = coin || coinFor(soberYMD());
    if (!coin) return;

    injectStyles();

    var el = document.createElement("div");
    el.className = "rm-coin-reveal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "You earned your " + coin.label + " coin");

    var x = document.createElement("button");
    x.type = "button";
    x.className = "rm-coin-x";
    x.setAttribute("aria-label", "Close");
    x.innerHTML = "&times;";

    var stage = document.createElement("div");
    stage.className = "rm-coin-stage";

    var big = document.createElement("img");
    big.className = "rm-coin-big";
    big.alt = "Your " + coin.label + " coin";
    big.src = BASE + coin.file;
    if (coin.fallback) {
      big.addEventListener("error", function once() {
        big.removeEventListener("error", once);
        big.src = BASE + coin.fallback;
      });
    }
    stage.appendChild(big);

    var say = document.createElement("p");
    say.className = "rm-coin-say";
    say.textContent = "KEEP COMING BACK!";

    el.appendChild(x);
    el.appendChild(stage);
    el.appendChild(say);
    document.body.appendChild(el);
    openEl = el;

    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { el.classList.add("on"); });

    x.addEventListener("click", close);
    /* Tapping the dark closes it too. Tapping the coin does not -- people
       tap the thing they are looking at. */
    el.addEventListener("click", function (e) {
      if (e.target === el) close();
    });

    /* ONE STEP BACK, AND BACK NEVER LEAVES THE APP. This covers the screen,
       so the phone's back button and the iPhone edge swipe have to dismiss
       it -- not navigate away from the page underneath. */
    try {
      history.pushState({ rmCoin: 1 }, "");
      pushed = true;
    } catch (e) { pushed = false; }

    markSeen(coin.file);
  }
  api.show = show;

  window.addEventListener("popstate", function () {
    if (openEl) { pushed = false; close(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openEl) close();
  });

  /* ---- when it fires -------------------------------------------------------

     Two moments, and only two:

       * THE DAY THEY EARN ONE. The coin they would see no longer matches the
         coin this phone last showed them, which can only happen on a
         milestone day.

       * ONCE FOR A NEW ACCOUNT. Somebody who just signed up has nothing
         stored, so the first coin they are entitled to is shown once and
         then remembered.

     Those are the same test, which is why there is only one line of it.

     WORTH KNOWING: an existing person on the day this ships has nothing
     stored either, so they get their current coin once. That felt right --
     it is an introduction, not a false milestone -- but it is a decision,
     not an accident. Set rm_coin_seen at install time to skip it. */
  function maybeReveal() {
    var coin = coinFor(soberYMD());
    if (!coin || coin.silent) return;
    if (seen() === coin.file) return;
    show(coin);
  }

  /* ---- REPLAY: Ctrl+Alt+W --------------------------------------------------
     A desktop convenience for looking at the animation without waiting for
     a milestone. Phones have no keyboard, so in practice this is a
     desk-only affordance -- it is not a feature anybody on a phone will
     ever reach, by design. */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.altKey && (e.key === "w" || e.key === "W")) {
      e.preventDefault();
      if (openEl) { close(); return; }
      var c = coinFor(soberYMD());
      if (c && !c.silent) show(c);
    }
  });

  /* ---- wiring ------------------------------------------------------------
     nav.js builds the rail whenever the count changes, which can replace the
     button underneath us. Watching the bar means this never has to be
     called by hand from there. */
  function start() {
    injectStyles();
    paintRail();

    var bar = document.getElementById("rmAppBar") || document.body;
    try {
      new MutationObserver(function () { paintRail(); })
        .observe(bar, { childList: true, subtree: true });
    } catch (e) {}

    /* The rail is built by a deferred script, so it may not exist for a
       frame or two after this runs. A few cheap retries, then stop. */
    var tries = 0;
    var t = setInterval(function () {
      paintRail();
      if (++tries > 20 || document.querySelector(".rm-coin-rail")) clearInterval(t);
    }, 150);

    maybeReveal();

    /* Crossing midnight while the app is open is the one time a milestone
       can arrive without a page load. */
    setInterval(function () { paintRail(); maybeReveal(); }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

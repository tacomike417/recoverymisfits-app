/* ===========================================================================
   YOUR CORNER — the personal strip at the bottom of the home screen.

   Three cards and a share button: how far to the next milestone, how much of
   today's stack has been opened, and how many coins are in the case.

   IT IS AN ACCOUNT FEATURE, on purpose and by the same rule the sober rail
   follows: you have an account and you get the app, or you do not and you
   get the default site. Signed out, every card still DRAWS -- empty, with
   the milestone card reading SET YOUR SOBER DATE and going to the sign-up
   page. An empty card somebody can see is an invitation; a missing section
   is nothing at all.

   NOTHING NEW IS WRITTEN TO localStorage. What this file keeps -- which
   rows were opened today -- goes in the account's own jsonb blob, beside
   the sober date, exactly where assets/account.js said the reading stack
   would end up. The two localStorage reads below (the token and the sober
   date) are the ones the rest of the app already does; when those move to
   the account for real, this file changes in the same two places nav.js and
   coins.js do.
   ======================================================================== */
(function () {
  "use strict";

  var TOKEN_KEY = "rm_account_v1";     /* present = signed in */
  var SOBER_KEY = "rm_sober_date";     /* the same key nav.js and coins.js use */

  function noAccount() {
    try { return !localStorage.getItem(TOKEN_KEY); } catch (e) { return true; }
  }
  function soberYMD() {
    try {
      var d = localStorage.getItem(SOBER_KEY) || "";
      return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
    } catch (e) { return ""; }
  }

  /* ---- counting days ------------------------------------------------------
     Midnight to midnight in the reader's own timezone, the same arithmetic
     the rail does. Day one is the day after the date, which is how the rooms
     count it and how the 24 hour coin is earned. */
  function daysSober(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    var start = new Date(+m[1], +m[2] - 1, +m[3]);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var d = Math.floor((today - start) / 86400000);
    return d < 0 ? null : d;
  }

  /* Days from the sober date to the nth anniversary. Counted off the calendar
     rather than by multiplying 365, for the same reason coins.js counts years
     that way: somebody sober since 29 February gets their coin on the day the
     calendar says, and an average year length is a day out in a way that
     cannot be explained to the person looking at their own date. */
  function daysToAnniversary(ymd, n) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    var start = new Date(+m[1], +m[2] - 1, +m[3]);
    var at = new Date(+m[1] + n, +m[2] - 1, +m[3]);
    return Math.round((at - start) / 86400000);
  }

  /* ---- THE LADDER ---------------------------------------------------------

     TWO LADDERS, AND WHICHEVER RUNG IS CLOSER WINS.

     The coins are the ladder that matters -- there is a picture waiting at
     the end of every one of them. But after the first year every coin is 365
     days away, and a bar that moves a third of a percent a day is a bar
     nobody looks at twice. So the round numbers are in here too: 100, 250,
     500, and every 500 after that. At 2,929 days the next coin is nine years
     at 3,287, and 3,000 is nine weeks away. It shows 3,000.

     The coin rungs are the same list coins.js draws from, and they have to
     stay the same list. If a coin is added there, add it here. */
  var MAX_YEARS = 55;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function ladder(ymd) {
    var out = [];                            /* {days, label, coin, file} */
    out.push({ days: 1,   label: "24 HOURS", coin: true, file: "coin-24-hours.webp" });
    out.push({ days: 30,  label: "30 DAYS",  coin: true, file: "coin-30-days.webp" });
    out.push({ days: 60,  label: "60 DAYS",  coin: true, file: "coin-60-days.webp" });
    out.push({ days: 90,  label: "90 DAYS",  coin: true, file: "coin-90-days.webp" });
    out.push({ days: 180, label: "6 MONTHS", coin: true, file: "coin-06-months.webp" });
    for (var y = 1; y <= MAX_YEARS; y++) {
      var d = daysToAnniversary(ymd, y);
      if (d == null) break;
      out.push({
        days: d,
        label: y === 1 ? "1 YEAR" : y + " YEARS",
        coin: true,
        file: "coin-" + pad2(y) + (y === 1 ? "-year" : "-years") + ".webp"
      });
    }
    /* The round numbers. 100 and 250 early on, where a month feels long, then
       every 500 the rest of the way. */
    var rounds = [100, 250];
    for (var r = 500; r <= 30000; r += 500) rounds.push(r);
    rounds.forEach(function (n) {
      out.push({ days: n, label: comma(n) + " DAYS", coin: false });
    });

    out.sort(function (a, b) { return a.days - b.days; });
    /* A round number that lands on the same day as a coin is not a second
       milestone -- the coin wins, because the coin is the thing you get. */
    var seen = {}, clean = [];
    out.forEach(function (x) {
      if (seen[x.days]) {
        if (x.coin) {
          seen[x.days].coin = true;
          seen[x.days].label = x.label;
          seen[x.days].file = x.file;
        }
        return;
      }
      seen[x.days] = x; clean.push(x);
    });
    return clean;
  }

  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* Where they are on it: the rung behind them, the rung ahead, and how many
     coins are already in the case. */
  function standing(ymd) {
    var d = daysSober(ymd);
    if (d == null) return null;
    var rungs = ladder(ymd);
    var prev = 0, next = null, earned = [], nextCoin = null;
    for (var i = 0; i < rungs.length; i++) {
      var r = rungs[i];
      if (r.days <= d) { prev = r.days; if (r.coin) earned.push(r); }
      else {
        if (!next) next = r;
        /* The next COIN is not always the next milestone -- at 2,929 days the
           next milestone is 3,000 and the next coin is nine years. The case
           wants the coin. */
        if (r.coin) { nextCoin = r; break; }
      }
    }
    return { days: d, prev: prev, next: next, coins: earned.length,
             earned: earned, nextCoin: nextCoin };
  }

  /* ---- the blob -----------------------------------------------------------
     One pull on load, one push on a timer. account.js's push() replaces the
     whole blob, so the copy held here is the one that gets written back --
     read it, change the one key, put it all back. Anything else on the
     account travels along untouched. */
  var blob = null;
  var pushTimer = null;

  function account() { return window.RMAccount || null; }

  /* ONLY "opened" GOES UP. This used to push its whole copy of the blob --
     the copy it pulled when the page loaded -- which put back anything saved
     since: a stack edited a minute ago vanished the moment a reading was
     opened. update() reads the account fresh and changes just this key. */
  function send() {
    var a = account();
    if (!a || !blob) return;
    var opened = blob.opened;
    if (a.update) {
      a.update(function (data) { data.opened = opened; return data; });
    }
  }

  function savePresently() {
    if (pushTimer) clearTimeout(pushTimer);
    /* TWO SECONDS, because opening three rows in a row is one thought, not
       three, and it has no business being three round trips. */
    pushTimer = setTimeout(function () {
      pushTimer = null;
      send();
    }, 2000);
  }

  /* A page being closed is the most likely moment for a pending write to be
     lost, so it goes out immediately rather than waiting out the timer. */
  function saveNow() {
    if (!pushTimer) return;
    clearTimeout(pushTimer); pushTimer = null;
    send();
  }

  function todayKey() {
    var d = new Date();
    return ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  /* ---- today's stack ------------------------------------------------------
     The total is however many rows are actually showing, because the stack is
     theirs to edit -- somebody who has turned two of them off is looking at
     2 OF 2, not 2 OF 5 with three they never asked for. */
  function stackRows() {
    var box = document.querySelector(".stack");
    if (!box) return [];
    return Array.prototype.filter.call(
      box.querySelectorAll(".row[data-stack]"),
      function (r) { return !r.hidden; }
    );
  }

  function openedToday() {
    if (!blob || !blob.opened) return [];
    var list = blob.opened[todayKey()];
    return Array.isArray(list) ? list : [];
  }

  function markOpened(id) {
    if (!id || noAccount()) return;
    if (!blob) blob = {};
    if (!blob.opened) blob.opened = {};
    var k = todayKey();
    var list = Array.isArray(blob.opened[k]) ? blob.opened[k] : [];
    if (list.indexOf(id) === -1) list.push(id);
    /* ONLY TODAY IS KEPT. A year of this would be a year of dead keys riding
       along in every pull and every push for a card that only ever asks
       about today. */
    blob.opened = {}; blob.opened[k] = list;
    savePresently();
    paint();
  }

  /* ---- painting ---------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  /* THE SURVIVAL PILE DOOR. Once the pile is switched on (or previewed on
     this phone), the milestone card is titled Your Survival Pile and opens
     it. Until then it is the old Next Milestone card, untouched. */
  var PILE_ON = false;
  function pileOn() {
    try { if (localStorage.getItem("rm_pile_preview") === "1") return true; } catch (e) {}
    return PILE_ON;
  }
  function pileDoor() {
    var card = $("cardMilestone"), key = $("msKey");
    if (!card || !pileOn()) return;
    if (/account\.html/.test(card.getAttribute("href") || "")) return;  /* no date yet: sign-up first */
    card.setAttribute("href", "/survival-pile.html");
    if (key) key.innerHTML = "Up<br>Next";
    card.classList.add("is-up");
    var title = $("msTitle");
    if (title) title.hidden = false;
    var ico = card.querySelector(".ccard-ico");
    if (ico && !ico.querySelector(".pile-fan")) {
      ico.innerHTML = '<span class="pile-fan" aria-hidden="true">' +
        '<img src="/assets/survival-pile/cards/1111-thumb.webp" alt="">' +
        '<img src="/assets/survival-pile/cards/222-thumb.webp" alt="">' +
        '<img src="/assets/survival-pile/cards/new-years-thumb.webp" alt=""></span>';
    }
  }

  function paint() {
    var root = $("your-corner");
    if (!root) return;

    var locked = noAccount();
    var ymd = locked ? "" : soberYMD();
    var st = ymd ? standing(ymd) : null;

    root.classList.toggle("is-locked", locked || !st);

    /* ---- milestone ---- */
    var label = $("msLabel"), togo = $("msToGo"), bar = $("msBar"),
        card = $("cardMilestone");

    if (st && st.next) {
      label.textContent = st.next.label;
      label.classList.remove("is-cta");
      var left = st.next.days - st.days;
      togo.textContent = comma(left) + (left === 1 ? " DAY TO GO" : " DAYS TO GO");
      var span = st.next.days - st.prev;
      var pct = span > 0 ? ((st.days - st.prev) / span) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
      card.setAttribute("href", "./sober-date.html");
    } else if (st) {
      /* Past the top of the ladder. Fifty-five years and still counting is
         not an error state and is not getting an empty card. */
      label.textContent = comma(st.days) + " DAYS";
      label.classList.remove("is-cta");
      togo.textContent = "STILL COUNTING";
      bar.style.width = "100%";
      card.setAttribute("href", "./sober-date.html");
    } else {
      label.textContent = "SET YOUR SOBER DATE";
      label.classList.add("is-cta");
      togo.textContent = "START HERE";
      bar.style.width = "0%";
      card.setAttribute("href", "./account.html?next=set");
    }

    pileDoor();

    /* ---- today's stack ---- */
    var rows = stackRows();
    var total = rows.length;
    var done = openedToday();
    var opened = 0;
    rows.forEach(function (r) {
      if (done.indexOf(r.getAttribute("data-stack")) !== -1) opened++;
    });

    $("stackCopy").textContent = opened + " OF " + total + " OPENED";
    var dots = $("stackDots");
    dots.textContent = "";
    for (var i = 0; i < total; i++) {
      var s = document.createElement("span");
      s.className = "cdot" + (i < opened ? " on" : "");
      s.setAttribute("aria-hidden", "true");
      if (i < opened) s.textContent = "✓";
      dots.appendChild(s);
    }

    /* ---- coins ----
       THE ICON IS THEIR OWN COIN, not a drawing of some coins. The rail at
       the bottom of the screen has already loaded that exact image, so it
       costs nothing and it turns a generic card into their card. The drawn
       one stays in the HTML underneath and comes back the moment there is no
       coin to show -- signed out, or no date set. */
    var n = st ? st.coins : 0;
    $("coinCopy").textContent = n + " EARNED";

    var slot = document.querySelector("#cardCoins .ccard-ico");
    var real = slot && slot.querySelector(".coin-real");
    var src = "";
    try {
      if (st && window.RMCoins && RMCoins.current) src = RMCoins.src(RMCoins.current());
    } catch (e) {}

    if (slot && src) {
      if (!real) {
        real = new Image();
        real.className = "coin-real";
        real.alt = "";
        real.setAttribute("aria-hidden", "true");
        slot.appendChild(real);
      }
      if (real.getAttribute("src") !== src) real.src = src;
      slot.classList.add("has-coin");
    } else if (slot) {
      slot.classList.remove("has-coin");
    }
  }

  /* ---- wiring ------------------------------------------------------------- */
  function wire() {
    var root = $("your-corner");
    if (!root || root.dataset.wired) return;
    root.dataset.wired = "1";

    /* Opening a row is what counts as opening it. Delegated off .stack so a
       prayer row built later, or a stack somebody has just reordered, is
       covered without re-wiring anything. */
    var box = document.querySelector(".stack");
    if (box) {
      box.addEventListener("click", function (e) {
        var row = e.target.closest(".row[data-stack]");
        if (row) markOpened(row.getAttribute("data-stack"));
      });
    }

    /* The stack card goes UP THE PAGE to the stack, rather than to a screen
       of its own. The thing it is talking about is already on this page and
       the only reasonable answer to "3 of 5" is to show them the other two. */
    var sc = $("cardStack");
    if (sc) sc.addEventListener("click", function () {
      var head = document.querySelector(".stackhead");
      if (head) head.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("pagehide", saveNow);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveNow();
    });
  }

  /* ---- the ladder, for anybody else who needs it --------------------------
     coins.html draws the case off this. ONE LADDER, exported, rather than a
     second copy of the same list in a second file -- two copies of a list of
     milestones is two lists that disagree the first time one is edited. */
  window.RMCorner = {
    standing: standing,
    ladder: ladder,
    days: daysSober,
    comma: comma,
    soberYMD: soberYMD,
    noAccount: noAccount
  };

  /* ---- start -------------------------------------------------------------- */
  function start() {
    /* On a page with no corner on it -- the coin case -- this file is here
       only for the ladder above. Nothing to draw, nothing to fetch. */
    if (!$("your-corner")) return;

    wire();
    paint();
    fetch("/data/survival-pile.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { PILE_ON = !!(d && d.live); paint(); })
      .catch(function () {});

    /* PAINT AGAIN A FEW TIMES. coins.js is fetched by nav.js and arrives when
       it arrives -- the first paint usually happens before it, and the coin
       card wants the image coins.js knows about. Same handful of retries the
       rail itself uses, and every one of them is a no-op once the card is
       already right. */
    [150, 400, 900, 2000, 4000].forEach(function (ms) { setTimeout(paint, ms); });

    if (noAccount()) return;

    /* account.js is fetched by nav.js and arrives whenever it arrives. Ask a
       few times and then stop -- the cards are already drawn and correct for
       somebody whose blob has not landed; the numbers just fill in. */
    var tries = 0;
    (function waitForAccount() {
      var a = account();
      if (a && a.pull) {
        a.pull().then(function (r) {
          blob = (r && r.data) || {};
          paint();
        }).catch(function () { /* no signal: the cards stay as drawn */ });
        return;
      }
      if (++tries > 40) return;      /* 40 x 250ms = ten seconds */
      setTimeout(waitForAccount, 250);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  /* The stack can be re-painted by the editor after this file has run, which
     changes the total. Watch it rather than guess. */
  (function watchStack() {
    if (!$("your-corner")) return;
    var box = document.querySelector(".stack");
    if (!box) { setTimeout(watchStack, 300); return; }
    new MutationObserver(function () { paint(); })
      .observe(box, { childList: true, attributes: true, attributeFilter: ["hidden"] });
  })();

  /* Somebody who leaves the app open across midnight gets today's card, not
     last night's. */
  setInterval(function () { if ($("your-corner")) paint(); }, 60000);
})();

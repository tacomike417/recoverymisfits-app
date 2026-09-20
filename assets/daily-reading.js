/* ===========================================================================
   THE DAILY READING — the behavior behind the Home screen and Another Day
   Sober: today's entry, the text size, read aloud, and sharing.

   It reads /data/readings.json with the same MM-DD key and builds the same
   share address the old widget did, so a link shared from either screen is
   the same link it always was, and a text size somebody set still applies.
   ======================================================================== */

(function () {
  "use strict";

  var DATA_URL = "/data/readings.json";
  var readingEl = document.getElementById("reading");
  var titleEl   = document.getElementById("title");
  var dateWrap  = document.getElementById("dateline");
  var dateText  = document.getElementById("dateText");
  var sayEl     = document.getElementById("say");

  /* ---- text size ---------------------------------------------------------
     THE SAME KEY THE OLD PAGE USED. Somebody who set this reading two sizes
     bigger last week should not have to do it again because the page was
     redrawn. */
  var SIZE_KEY = "dp_reading_size_px";
  var MIN = 12, MAX = 22, STEP = 2, DEFAULT_SIZE = 12;

  function setSize(px) {
    px = Math.max(MIN, Math.min(MAX, px));
    readingEl.style.fontSize = px + "px";
    try { localStorage.setItem(SIZE_KEY, String(px)); } catch (e) {}
    return px;
  }
  function savedSize() {
    try {
      var v = parseInt(localStorage.getItem(SIZE_KEY), 10);
      if (!isNaN(v)) return Math.max(MIN, Math.min(MAX, v));
    } catch (e) {}
    return DEFAULT_SIZE;
  }
  setSize(savedSize());
  document.getElementById("smaller").onclick = function () { setSize(savedSize() - STEP); };
  document.getElementById("bigger").onclick  = function () { setSize(savedSize() + STEP); };

  /* ---- the reading -------------------------------------------------------
     Same MM-DD key and the same share address the old widget built, so a link
     shared from this page and a link shared from the old one are one link. */
  var MONTHS = ["january","february","march","april","may","june","july",
                "august","september","october","november","december"];
  /* THE DATE ON THE FRONT OF A TITLE, however it was typed.
     The stored titles are "September 19 — The Amends..." and the date has to
     come off, because both screens print the date separately. The first
     version of this demanded a full month name, a day, and a dash -- and
     five real days in the file do not look like that:

       "Dec 23 — Selfish vs. Self-Seeking"     abbreviated month
       "Dec 24 — Long Day"
       "Dec 25 — Grace: The Greatest Gift"
       "August 9, 2026 - All"                  carries a year

     Those five printed their own date as the headline. So: three letters of
     a month is enough, an optional full ending, an optional trailing dot,
     and an optional year. Checked against all 365 by tools/title-strip-test.mjs.

     Two more are simply typed wrong in data/readings.json and no regex should
     paper over them -- "Jsnusty 11" and "ly 8". They need fixing in the data. */
  var MONTHS3 = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  var LEADING_DATE = new RegExp(
    "^(" + MONTHS3.join("|") + ")[a-z]*\\.?\\s+\\d{1,2}(?:,?\\s*\\d{4})?\\s*[-\u2013\u2014]\\s*", "i");

  var MONTHS_TITLE = ["January","February","March","April","May","June","July",
                      "August","September","October","November","December"];

  function labelToDate(lbl) {
    var m = /^(\d{2})-(\d{2})$/.exec(String(lbl || ""));
    if (!m) return "";
    var name = MONTHS_TITLE[Number(m[1]) - 1];
    return name ? name + " " + Number(m[2]) : "";
  }

  function slugify(t) {
    var s = String(t || "").replace(LEADING_DATE, "").trim() || String(t || "");
    return s.toLowerCase().replace(/[’'"]/g, "").replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  var now = new Date();
  var params = new URLSearchParams(location.search);
  var bodyEl = document.body;

  /* WHICH DAY THIS PAGE IS, in the order the answer is most certain.

     data-reading is on the 365 generated pages under /another-day-sober/,
     each of which IS one particular day and stays that day forever. The
     ?reading= parameter is the old way of opening a past day on the app
     screen. With neither, it is today. */
  var label = bodyEl.getAttribute("data-reading") || params.get("reading") ||
    (String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"));

  var postTitle = "", postUrl = "", spoken = "";

  /* THE GENERATED PAGES ARRIVE WITH THE READING ALREADY IN THEM.

     Those 365 pages exist so a crawler can read the words without running
     any JavaScript -- that is the entire reason they are built. So on them
     this file does NOT fetch anything and does NOT touch the reading. It
     picks up the title and the paragraphs that are already on the page, so
     that read-aloud and share have something to work with, and stops.

     It matters that it does not fetch: a failed fetch calls fail(), and
     fail() empties the reading area. On a page that came out of the oven
     with its reading in it, a flaky signal would wipe words that were
     already there and sitting in front of somebody. */
  if (bodyEl.hasAttribute("data-prerendered")) {
    postTitle = (titleEl.textContent || "").trim();
    var already = readingEl.querySelectorAll("p");
    var lines = [];
    for (var pi = 0; pi < already.length; pi++) {
      var t = (already[pi].textContent || "").trim();
      if (t) lines.push(t);
    }
    spoken = postTitle + ". " + lines.join(" ");
    /* The page's own address IS the share link here -- no need to rebuild it
       from a slug and hope the two agree. */
    postUrl = location.origin + location.pathname;
  } else
  fetch(DATA_URL, { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (all) {
      var entry = all[label];
      if (!entry) { fail("There is no reading filed under " + label + "."); return; }

      var raw = String(entry.title || "").trim();
      /* The stored title carries its own date: "September 18 — Workplace
         Amends". The date goes on the brush stroke and the rest is the
         headline, which is how the mockup sets it. */
      var m = raw.match(LEADING_DATE);
      postTitle = raw.replace(LEADING_DATE, "").trim() || raw;
      /* Five of the readings do not carry a date in their title. Rather
         than leave the brush stroke empty on those, the date is built from
         the MM-DD the reading is filed under, so all 365 look the same --
         and so this screen matches the generated pages, which do the same
         thing in scripts/build_pages.py. */
      var shown = m ? m[0].replace(/\s*[-–—]\s*$/, "").trim() : labelToDate(label);
      if (shown) { dateText.textContent = shown; dateWrap.hidden = false; }

      titleEl.textContent = postTitle;
      document.title = postTitle + " — Recovery Misfits";

      var paras = String(entry.body || "").split(/\n{2,}/)
                    .map(function (p) { return p.trim(); })
                    .filter(Boolean);
      readingEl.innerHTML = "";
      paras.forEach(function (p) {
        var el = document.createElement("p");
        el.textContent = p;
        readingEl.appendChild(el);
      });
      spoken = postTitle + ". " + paras.join(" ");
      postUrl = location.origin + "/another-day-sober/" + label + "/" + slugify(raw) + "/";
    })
    .catch(function () { fail("Today’s reading would not load. Check your signal and try again."); });

  function fail(msg) {
    /* The error stays INSIDE the reading area, the way the brief asks: the
       page around it -- the name, the controls, the way out -- all still
       work while this one part is missing. */
    readingEl.innerHTML = "";
    var p = document.createElement("p");
    p.className = "state";
    p.textContent = msg;
    readingEl.appendChild(p);
  }

  /* ---- read aloud --------------------------------------------------------
     The browser's own voice. NEVER on arrival -- it is started by a tap and
     by nothing else, and the button says which way it is pointing so nobody
     presses it twice and ends up with two voices. */
  var speakBtn = document.getElementById("speak");
  var synth = window.speechSynthesis;
  if (!synth) {
    speakBtn.hidden = true;
  } else {
    speakBtn.onclick = function () {
      if (synth.speaking || synth.paused) { stopSpeaking(); return; }
      if (!spoken) { sayEl.textContent = "Nothing to read yet."; return; }
      var u = new SpeechSynthesisUtterance(spoken);
      u.rate = 0.95;
      u.onend = stopSpeaking;
      u.onerror = function () { stopSpeaking(); sayEl.textContent = "Read aloud is not available on this device."; };
      synth.speak(u);
      speakBtn.setAttribute("aria-pressed", "true");
      speakBtn.setAttribute("aria-label", "Stop reading aloud");
      sayEl.textContent = "Reading aloud. Tap the speaker again to stop.";
    };
    function stopSpeaking() {
      try { synth.cancel(); } catch (e) {}
      speakBtn.setAttribute("aria-pressed", "false");
      speakBtn.setAttribute("aria-label", "Read this aloud");
      if (/Reading aloud/.test(sayEl.textContent)) sayEl.textContent = "";
    }
    /* Leaving the page with a voice still going is how somebody ends up with
       the app talking at them from a tab they thought they closed. */
    window.addEventListener("pagehide", function () { try { synth.cancel(); } catch (e) {} });
  }

  /* ---- share -------------------------------------------------------------
     The phone's own share sheet, which is where Facebook, Messages and Copy
     all live -- one button instead of four, as the mockup has it. Where
     there is no share sheet the link is copied instead and the page says so
     out loud for a screen reader. */
  document.getElementById("share").onclick = function () {
    if (!postUrl) { sayEl.textContent = "Nothing to share yet."; return; }
    var text = "Check this out: " + postTitle;
    if (navigator.share) {
      navigator.share({ title: postTitle, text: text, url: postUrl })
        .catch(function () { /* they backed out; nothing to report */ });
      return;
    }
    var copy = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(postUrl)
      : Promise.reject();
    copy.then(function () { sayEl.textContent = "Link copied."; })
        .catch(function () { sayEl.textContent = postUrl; });
    setTimeout(function () { if (sayEl.textContent === "Link copied.") sayEl.textContent = ""; }, 3000);
  };
})();

/* ===========================================================================
   THE CALENDAR — the behavior only.

   The links themselves are NOT built here. scripts/build_pages.py writes all
   twelve months of real <a href> into the HTML, because a crawler does not
   run this file, and a calendar drawn in JavaScript would put all 365
   readings straight back to being orphans. Everything below is for the
   person holding the phone: which month is showing, the arrows, lining the
   grid up with the week, and the two circles.
   ======================================================================== */
(function () {
  "use strict";

  var cal = document.getElementById("cal");
  if (!cal) return;

  var grids = cal.querySelectorAll(".cal-grid");
  var monthEl = document.getElementById("calMonth");
  var prevBtn = document.getElementById("calPrev");
  var nextBtn = document.getElementById("calNext");
  if (!grids.length || !monthEl) return;

  var NAMES = ["January","February","March","April","May","June","July",
               "August","September","October","November","December"];

  var today = new Date();
  var year = today.getFullYear();
  var leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  /* ---- line each month up with the week ---------------------------------
     The readings are perpetual -- "September 15" belongs to no particular
     year -- so there is no correct weekday to bake into the HTML, and none
     is. The grid is padded HERE, for whatever year it is being read in, and
     re-padded if somebody leaves the app open across New Year. With this
     file blocked it stays a plain seven-wide run of dates, which still
     reads fine and is all the crawler ever needed. */
  function padGrids() {
    for (var i = 0; i < grids.length; i++) {
      var grid = grids[i];
      var old = grid.querySelectorAll(".cal-pad");
      for (var k = 0; k < old.length; k++) old[k].remove();

      var first = new Date(year, i, 1).getDay();
      for (var d = 0; d < first; d++) {
        var pad = document.createElement("span");
        pad.className = "cal-pad";
        pad.setAttribute("aria-hidden", "true");
        grid.insertBefore(pad, grid.firstChild);
      }

      /* February 29th is in the markup so the month keeps its shape in a
         leap year. In every other year it is not a date and is taken out. */
      if (i === 1) {
        var cells = grid.querySelectorAll(".cal-day");
        var last = cells[cells.length - 1];
        if (last && last.textContent.trim() === "29") last.hidden = !leap;
      }
    }
  }

  /* ---- the two circles --------------------------------------------------
     Today gets a ring. The reading you are actually looking at gets the
     filled circle. On the app screen those are the same day and you see one
     circle; on a reading you opened from a search result they are usually
     different, and the filled one is the one that wins. */
  function mark() {
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    var todayHref = "/another-day-sober/" + mm + "-" + dd + "/";
    var here = location.pathname;

    var all = cal.querySelectorAll(".cal-day");
    for (var i = 0; i < all.length; i++) {
      var a = all[i];
      var href = a.getAttribute("href") || "";
      a.classList.toggle("is-today", href.indexOf(todayHref) === 0);
      a.classList.toggle("is-current", !!href && href === here);
      if (href && href === here) a.setAttribute("aria-current", "page");
    }
  }

  /* ---- which month is showing ------------------------------------------ */
  var shown = 0;

  function show(i) {
    shown = (i + grids.length) % grids.length;
    for (var k = 0; k < grids.length; k++) grids[k].hidden = (k !== shown);
    monthEl.textContent = NAMES[shown];
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { show(shown - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { show(shown + 1); });

  padGrids();
  mark();

  /* Opens on the month of the reading you are on -- or on this month, which
     is the same thing on the app screen. Landing on January when you are
     reading September is a calendar you have to operate before it is any
     use. */
  var own = (document.body.getAttribute("data-reading") || "").slice(0, 2);
  var start = Number(own);
  show(start >= 1 && start <= 12 ? start - 1 : today.getMonth());
})();

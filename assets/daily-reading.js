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
  var LEADING_DATE = new RegExp("^(" + MONTHS.join("|") + ")\\s+\\d{1,2}\\s*[-–—]\\s*", "i");

  function slugify(t) {
    var s = String(t || "").replace(LEADING_DATE, "").trim() || String(t || "");
    return s.toLowerCase().replace(/[’'"]/g, "").replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  var now = new Date();
  var params = new URLSearchParams(location.search);
  var label = params.get("reading") ||
    (String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"));

  var postTitle = "", postUrl = "", spoken = "";

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
      var shown = m ? m[0].replace(/\s*[-–—]\s*$/, "").trim() : "";
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

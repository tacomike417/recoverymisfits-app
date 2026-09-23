/* ===========================================================================
   THE SURVIVAL PILE -- WHICH CARDS SOMEBODY HAS, WORKED OUT FROM THEIR DATE.

   Nothing about who has which card is stored anywhere. It is worked out,
   every time, from three things: the sober date, today, and the day they
   joined. That one decision is what makes the rules Mike set hold on their
   own:

     * A RESET EMPTIES THE PILE. Move the sober date later and every card is
       worked out again from the new date -- the old ones are simply not
       there any more. Nothing to wipe, nothing left behind, nothing public.
     * FIXING A TYPO COSTS NOTHING. Whatever the right date earns is what
       shows. There is no stored card to lose by correcting it.
     * SOMEBODY WITH YEARS BEHIND THEM gets every card those years earned,
       each with the real day it was earned on, the first time they open it.

   ALL THE DATE MATH IS DONE ON PLAIN CALENDAR DAYS, never on clock time.
   A sober date is a day, not a moment. Counting milliseconds between two
   midnights comes up an hour short after the clocks spring forward and
   rounds a whole day away -- so every day here is a whole number (days
   since 1970, in UTC, where there is no daylight saving) and the phone's
   own clock is only asked one thing: what is today's date.

   window.RMPile = {
     load()                         -> Promise of the card list (.live = the switch)
     isOn(cards)                    -> false until Mike turns awarding on
     earned(cards, sober, today, joined) -> every card earned, newest first
     next(cards, sober, today, joined)   -> { days } until the next one, or null
     todayYMD(), soberYMD(), joinedYMD()
     fmt(ymd)                       -> "September 14, 2018"
   }
   ======================================================================== */
(function () {
  "use strict";

  var DAY = 86400000;
  var MONTHS = ["January","February","March","April","May","June","July",
                "August","September","October","November","December"];

  /* ---- plain calendar days ------------------------------------------------ */
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function num(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / DAY); }
  function numOf(s) { var p = parse(s); return p ? num(p[0], p[1], p[2]) : null; }
  function ymd(n) {
    var d = new Date(n * DAY);
    var p = function (x) { return (x < 10 ? "0" : "") + x; };
    return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
  }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  function todayYMD() {
    var t = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
    return t.getFullYear() + "-" + p(t.getMonth() + 1) + "-" + p(t.getDate());
  }

  /* YEARS-MONTHS-DAYS, BY ADDING TO THE SOBER DATE -- years, then months,
     then days -- so every card has exactly one day it lands on and none can
     be skipped over.
       * Years land where the coins land: somebody sober since February 29 has
         their anniversary on March 1 in a year without one (coins.js counts
         years the same way, so a card and a coin never disagree).
       * Months that run short are clamped to their last day: January 31 plus
         one month is the end of February, never a made-up March 3. */
  function addYMD(s, Y, M, D) {
    var y = s[0] + Y, m = s[1], d = s[2];
    if (d > daysIn(y, m)) { m += 1; d = 1; }          /* Feb 29 -> Mar 1 */
    m += M;
    while (m > 12) { m -= 12; y += 1; }
    d = Math.min(d, daysIn(y, m));
    return num(y, m, d) + D;
  }

  /* ---- the holidays -------------------------------------------------------- */
  function nthWeekday(y, m, weekday, n) {      /* n-th weekday (0=Sun) of month */
    var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return num(y, m, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  function lastWeekday(y, m, weekday) {
    var last = daysIn(y, m);
    var wd = new Date(Date.UTC(y, m - 1, last)).getUTCDay();
    return num(y, m, last - ((wd - weekday + 7) % 7));
  }

  /* SUPER BOWL SUNDAY IS SET BY THE NFL, not by the calendar. It has been the
     second Sunday of February since 2022 and the first Sunday before that
     (back to 2004). Checked against the real games through 2027; ADD NEXT
     YEAR'S DATE HERE if the league ever moves it. */
  var SUPER_BOWL = { 2027: [2, 14] };
  function superBowl(y) {
    if (SUPER_BOWL[y]) return num(y, SUPER_BOWL[y][0], SUPER_BOWL[y][1]);
    if (y >= 2022) return nthWeekday(y, 2, 0, 2);
    if (y >= 2004) return nthWeekday(y, 2, 0, 1);
    return lastWeekday(y, 1, 0);
  }

  var HOLIDAY = {
    "new-years":     function (y) { return num(y, 1, 1); },
    "super-bowl":    superBowl,
    "valentines":    function (y) { return num(y, 2, 14); },
    "st-patricks":   function (y) { return num(y, 3, 17); },
    "big-book":      function (y) { return num(y, 4, 10); },
    "memorial-day":  function (y) { return lastWeekday(y, 5, 1); },
    "founders-day":  function (y) { return num(y, 6, 10); },
    "july-4":        function (y) { return num(y, 7, 4); },
    "dr-bob":        function (y) { return num(y, 8, 8); },
    "labor-day":     function (y) { return nthWeekday(y, 9, 1, 1); },
    "halloween":     function (y) { return num(y, 10, 31); },
    "thanksgiving":  function (y) { return nthWeekday(y, 11, 4, 4); },
    "christmas-eve": function (y) { return num(y, 12, 24); },
    "christmas":     function (y) { return num(y, 12, 25); }
  };

  /* ---- who has what -------------------------------------------------------
     Every earning, one row each, newest first. A holiday earned five years
     running is five rows (five editions); the page groups them. */
  function earned(cards, soberS, todayS, joinedS) {
    var s = parse(soberS), S = numOf(soberS), T = numOf(todayS || todayYMD());
    if (!s || S === null || T === null || S > T) return [];
    var J = numOf(joinedS), out = [];
    var tYear = parse(todayS || todayYMD())[0];

    cards.forEach(function (c) {
      var at;
      if (c.kind === "start") {
        /* THE NIGHT THEY DECIDED -- the day before the sober date. */
        out.push({ card: c, n: S - 1 });
      } else if (c.kind === "days") {
        at = S + c.n - 1;   /* the sober date is day one */
        if (at <= T) out.push({ card: c, n: at });
      } else if (c.kind === "ymd") {
        at = addYMD(s, c.ymd[0], c.ymd[1], c.ymd[2]);
        if (at <= T) out.push({ card: c, n: at });
      } else if (c.kind === "holiday" && HOLIDAY[c.holiday]) {
        /* Every year they were sober for it, from the sober date on. It lands
           ON the holiday itself, and the edition is
           the year of that morning, so New Year's Eve 2026 is the 2027 card. */
        for (var y = s[0]; y <= tYear; y++) {
          var h = HOLIDAY[c.holiday](y);
          if (h >= S && h <= T) out.push({ card: c, n: h, edition: parse(ymd(h))[0] });
        }
      } else if (c.kind === "misfitversary" && J !== null) {
        var j = parse(joinedS), k = 1;
        while ((at = addYMD(j, k, 0, 0)) <= T) { out.push({ card: c, n: at, years: k }); k++; }
      }
    });

    out.sort(function (a, b) { return b.n - a.n; });
    out.forEach(function (e) { e.date = ymd(e.n); });
    return out;
  }

  /* DAYS UNTIL THE NEXT ONE. Only a number -- never which card. */
  function next(cards, soberS, todayS, joinedS) {
    var s = parse(soberS), S = numOf(soberS), T = numOf(todayS || todayYMD());
    if (!s || S === null || T === null || S > T) return null;
    var best = null;
    function consider(at) { if (at > T && (best === null || at < best)) best = at; }
    var tYear = parse(todayS || todayYMD())[0];
    cards.forEach(function (c) {
      if (c.kind === "days") consider(S + c.n - 1);
      else if (c.kind === "ymd") consider(addYMD(s, c.ymd[0], c.ymd[1], c.ymd[2]));
      else if (c.kind === "holiday" && HOLIDAY[c.holiday]) {
        for (var y = tYear - 1; y <= tYear + 1; y++) {
          var h = HOLIDAY[c.holiday](y);
          if (h >= S) consider(h);
        }
      } else if (c.kind === "misfitversary" && joinedS) {
        var j = parse(joinedS);
        for (var k = 1; k < 80; k++) { var at = addYMD(j, k, 0, 0); if (at > T) { consider(at); break; } }
      }
    });
    return best === null ? null : { days: best - T };
  }

  /* ---- what this phone knows ---------------------------------------------- */
  function soberYMD() {
    try {
      var v = localStorage.getItem("rm_sober_date");
      return v && parse(v) ? v : "";
    } catch (e) { return ""; }
  }
  /* THE DAY THEY JOINED, for the Misfitversary. The first day this phone
     ever opened the app (topbar.js writes it). */
  function joinedYMD() {
    try {
      /* The account's join date (copied here by nav.js). */
      var jd = localStorage.getItem("rm_joined_date") || "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(jd)) return jd;
      var ms = +localStorage.getItem("rm_first_seen_at");
      if (!ms) return "";
      var d = new Date(ms), p = function (x) { return (x < 10 ? "0" : "") + x; };
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    } catch (e) { return ""; }
  }

  function fmt(s) {
    var p = parse(s);
    return p ? MONTHS[p[1] - 1] + " " + p[2] + ", " + p[0] : "";
  }

  var cache = null;
  function load() {
    if (!cache) {
      cache = fetch("/data/survival-pile.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error("survival-pile.json " + r.status); return r.json(); })
        .then(function (d) {
          var cards = (d && d.cards) || [];
          cards.live = !!(d && d.live);
          return cards;
        });
      cache.catch(function () { cache = null; });
    }
    return cache;
  }

  /* THE SWITCH. Nothing is awarded -- no pile, no popup, nothing -- until
     "live" is true in data/survival-pile.json. The one exception is a
     preview: open the page once with ?preview=1 and this phone shows the
     real pile from then on (?preview=0 turns it back off). Nobody else is
     affected by it. */
  function isOn(cards) {
    try {
      var q = new URLSearchParams(location.search).get("preview");
      if (q === "1") localStorage.setItem("rm_pile_preview", "1");
      if (q === "0") localStorage.removeItem("rm_pile_preview");
      if (localStorage.getItem("rm_pile_preview") === "1") return true;
    } catch (e) {}
    return !!(cards && cards.live);
  }

  var api = {
    isOn: isOn,
    load: load, earned: earned, next: next,
    todayYMD: todayYMD, soberYMD: soberYMD, joinedYMD: joinedYMD, fmt: fmt,
    _addYMD: addYMD, _holiday: HOLIDAY, _num: num, _ymd: ymd
  };
  if (typeof window !== "undefined") window.RMPile = api;
  if (typeof module !== "undefined") module.exports = api;
})();

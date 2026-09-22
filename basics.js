/* ===========================================================================
   RECOVERY BASICS — the card between the daily stack and Your Corner.

   One of the 43 basics, plain enough to read at two in the morning.

   ONE A DAY, THE SAME ONE FOR EVERYBODY. The card is picked off the calendar
   rather than at random, so it behaves like the reading and the meme already
   do: somebody who mentions today's basic to somebody else in the same room
   is talking about the same card. ANOTHER ONE still works -- it walks a
   shuffled bag for as long as the page is open -- and the next time the page
   loads, the day's card is back.

   NO ACCOUNT NEEDED AND NOTHING STORED. The pick is arithmetic on today's
   date, so it is the same answer signed in, signed out, or on somebody
   else's phone, and there is nothing to write anywhere.

   THE HOLIDAY CARDS NEVER NAME THE HOLIDAY. That is deliberate and comes
   from the copy this was built from: the badge says HOLIDAY WATCH whatever
   is coming. New Year is the one exception, because "New Year's Eve" is the
   thing being described rather than somebody's religion.
   ======================================================================== */
(function () {
  "use strict";

  var SRC = "/data/recovery-basics.json";
  var TOTAL = 43;
  var DAY = 86400000;

  var root = null, cards = null;
  var bag = [], lastId = null;

  /* ---- dates --------------------------------------------------------------
     Everything below runs at noon local. A date at midnight is one daylight
     saving change away from being the day before, and the whole point of this
     file is that everybody gets the same card on the same day. */
  function noon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
  function between(a, b) { return Math.round((noon(a) - noon(b)) / DAY); }

  /* Which day it is, counted from a fixed point rather than from the start of
     the year -- a day-of-year index jumps by one every 1 January and would
     hand out the same card two days running. */
  function dayNumber(now) {
    return Math.floor(noon(now).getTime() / DAY);
  }

  function nth(year, month, weekday, n) {
    var first = new Date(year, month, 1, 12);
    var off = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + off + (n - 1) * 7, 12);
  }
  function last(year, month, weekday) {
    var end = new Date(year, month + 1, 0, 12);
    return new Date(year, month, end.getDate() - ((end.getDay() - weekday + 7) % 7), 12);
  }

  /* The days people most often have to get through. Not a religious list --
     these are the ones where there is drink in the house and a room full of
     relatives, which is the whole reason the seasonal cards exist. */
  function holidays(y) {
    return [
      new Date(y, 0, 1, 12),      /* New Year's Day */
      last(y, 4, 1),              /* Memorial Day */
      new Date(y, 6, 4, 12),      /* Fourth of July */
      nth(y, 8, 1, 1),            /* Labor Day */
      nth(y, 10, 4, 4),           /* Thanksgiving */
      new Date(y, 11, 25, 12)     /* the one in December */
    ];
  }

  function nearest(now) {
    var all = holidays(now.getFullYear()).concat(holidays(now.getFullYear() + 1));
    all.sort(function (a, b) {
      return Math.abs(between(a, now)) - Math.abs(between(b, now));
    });
    return all[0];
  }

  var RANGES = {
    holiday_minus_10_to_7:   [7, 10],
    holiday_minus_7_to_3:    [3, 7],
    holiday_minus_14_to_1:   [1, 14],
    holiday_minus_7_to_plus_1: [-1, 7],
    holiday_minus_1_to_0:    [0, 1],
    holiday_plus_1_to_2:     [-2, -1]
  };

  function active(rule, now) {
    var m = now.getMonth(), d = now.getDate(), w = now.getDay();
    if (rule === "dec_26_to_31") return m === 11 && d >= 26;
    if (rule === "jan_1_to_3") return m === 0 && d <= 3;
    if (rule === "may_20_to_aug_31") return (m === 4 && d >= 20) || m === 5 || m === 6 || m === 7;
    if (rule === "sep_1_to_feb_15_weekends") {
      var inSeason = m >= 8 || m === 0 || (m === 1 && d <= 15);
      return inSeason && (w === 0 || w === 6);
    }
    var r = RANGES[rule];
    if (!r) return false;
    var delta = between(nearest(now), now);
    return delta >= r[0] && delta <= r[1];
  }

  /* THE TIGHTEST WINDOW WINS.

     Several of these are live at once and they are not equally useful on a
     given day. Four days before Thanksgiving, both "holiday plans need an
     exit plan" and "football season can be a drinking season" are true, and
     picking between them by rotation handed out the football one -- which is
     a fine card and the wrong card that week. The day after a holiday was
     doing the same thing: "you can decline the invitation" for a day that had
     already happened, while "the day after matters" sat unused.

     So each rule carries a rank, tightest first. Small number wins; ties
     rotate off the day number, which is how Jan 1 gets either the new-year
     card or the day-after card without either one being wrong. */
  var RANK = {
    holiday_minus_1_to_0:      1,   /* the day itself */
    holiday_plus_1_to_2:       1,   /* the morning after */
    jan_1_to_3:                1,
    dec_26_to_31:              2,
    holiday_minus_7_to_3:      3,   /* the week before */
    holiday_minus_10_to_7:     3,
    holiday_minus_7_to_plus_1: 4,
    holiday_minus_14_to_1:     5,   /* the fortnight before */
    may_20_to_aug_31:          9,   /* whole seasons, last */
    sep_1_to_feb_15_weekends:  9
  };

  /* ---- which card ---------------------------------------------------------
     A seasonal card wins whenever one is in its window. Evergreen otherwise,
     walked in order off the day number so the 33 of them come round evenly
     rather than clustering the way random does. */
  function today() {
    var now = new Date();
    var n = dayNumber(now);

    var live = cards.seasonal.filter(function (c) { return active(c.rule, now); });
    if (live.length) {
      var best = 99;
      live.forEach(function (c) {
        var r = RANK[c.rule] === undefined ? 9 : RANK[c.rule];
        if (r < best) best = r;
      });
      var top = live.filter(function (c) {
        return (RANK[c.rule] === undefined ? 9 : RANK[c.rule]) === best;
      });
      return top[n % top.length];
    }

    return cards.evergreen[n % cards.evergreen.length];
  }

  function shuffled(list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ANOTHER ONE. A bag rather than a coin toss, so pressing it six times
     shows six different cards instead of the same two. */
  function another() {
    if (!bag.length) {
      bag = shuffled(cards.evergreen).filter(function (c) { return c.id !== lastId; });
    }
    return bag.shift();
  }

  /* The corner flag names a season, never somebody's holiday. "Holiday watch"
     over a card about summer cookouts was just wrong, so the two long-season
     rules get their own word. */
  function flagFor(rule) {
    if (rule === "may_20_to_aug_31" || rule === "sep_1_to_feb_15_weekends") {
      return "Season Watch";
    }
    return "Holiday Watch";
  }

  function paint(card) {
    if (!card) return;
    var flag = root.querySelector(".flag");
    if (flag && card.rule) flag.textContent = flagFor(card.rule);
    root.classList.toggle("is-seasonal", !!card.rule);
    root.classList.remove("is-changing");
    void root.offsetWidth;                   /* restart the swap animation */
    root.querySelector("[data-basic-title]").textContent = card.title;
    root.querySelector("[data-basic-body]").textContent = card.body;
    /* The catalogue number off the approved plate. It is the card's own id,
       two digits, out of the 43 that exist. */
    var count = root.querySelector("[data-basic-count]");
    if (count) {
      count.textContent = (card.id < 10 ? "0" : "") + card.id + " / " + TOTAL;
    }
    root.classList.add("is-changing");
    lastId = card.id;
    try {
      window.dispatchEvent(new CustomEvent("recoverymisfits:recovery-basic-change",
                                           { detail: card }));
    } catch (e) {}
  }

  function start() {
    root = document.getElementById("rm-basic");
    if (!root) return;

    var next = root.querySelector("[data-basic-next]");
    if (next) next.addEventListener("click", function () { paint(another()); });

    fetch(SRC, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("recovery-basics.json " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.evergreen || !data.evergreen.length) throw new Error("no cards");
        cards = data;
        root.hidden = false;
        paint(today());
      })
      .catch(function (e) {
        /* NO SIGNAL, NO CARD, NO HOLE IN THE PAGE. The section starts hidden
           and only appears once there is something real to put in it -- an
           empty battered frame saying nothing is worse than no frame. */
        if (window.console) console.error(e);
      });

    /* Somebody who leaves the app open overnight gets the new day's card. */
    setInterval(function () {
      if (!cards) return;
      var t = today();
      if (t && t.id !== lastId && !bag.length) paint(t);
    }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

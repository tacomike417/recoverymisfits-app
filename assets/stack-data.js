/* ==========================================================================
   THE DAILY STACK'S CONTENTS, IN ONE PLACE (v264, 22 Nov 2026).

   The Today page and the Porch both show the daily stack, so what is IN it lives
   here and both read it. Edit a reading, a prayer, an absolute or a morning line
   here and both places change together. This was moved, word for word, out of the
   stack script in index.html; the notes that came with it came too.

   Exposes window.RMStackData:
     ITEMS, byId(id), DEFAULT_ORDER, DEFAULT_OFF, PRAYERS, ABSOLUTES, MORNING,
     MORNING_CLOSER, MORNING_THANKS, MORNING_STORY, MEME_ICO, PRAY_ICO, EVE_ICO,
     ABS_ICO, READY, todayAbsolute(), todayIntention(), HREF, resolve(saved)
   ========================================================================== */
(function () {
  "use strict";
  /* THE DEFAULT STACK. This order is what a new account gets, and it is the
     order the page has always shown them in. */
  var ITEMS = [
    { id: "awakening",   t: "On Awakening",            d: "Start the day with intention.",  ico: "assets/pages/r-ico-sun.webp" },
    { id: "hours24",     t: "Twenty-Four Hours a Day", d: "A thought for today.",           ico: "assets/pages/r-ico-cal.webp" },
    { id: "reflections", t: "Daily Reflections",       d: "Experience, strength and hope.", ico: "assets/pages/r-ico-sprout.webp" },
    { id: "anotherday",  t: "Another Day Sober",       d: "Daily step study.",              ico: "assets/pages/r-ico-road.webp" }
  ];
  /* MEME OF THE DAY. A door, not a drawer -- it opens ./meme.html, where the
     share button lives. Pushed here rather than written into the list above
     so the four dailies stay the four dailies. */
  var MEME_ICO =
    '<svg class="ico ico-drawn" viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="9" width="34" height="26" rx="3"/><path d="M7 28l8-7 6 5 7-8 9 9" stroke-linejoin="round"/><circle cx="17" cy="17" r="2.6"/><path d="M17 35v4M31 35v4M14 39h20" stroke-linecap="round"/></svg>';
  ITEMS.push({
    id: "meme",
    t: "Meme of the Day",
    d: "One a day. Made to be shared.",
    icoHTML: MEME_ICO
  });
  /* HOW IT WORKS (v272, 26 Nov 2026, Mike: "find how it works from the original manuscript... put that up
     there in the daily stack so I can start reading that again every single day"). The opening of Chapter
     Five through the twelve steps and the a, b, c, in the ORIGINAL MANUSCRIPT wording ("followed our
     directions", "to others, especially alcoholics"), which is public domain. Its own page, like On
     Awakening. Off until somebody adds it, like everything added after launch.
     v274, SAME DAY: Mike changed his mind -- "use the one that is the current one for everybody. I don't
     want to confuse anybody." The page now carries the wording read in meetings ("followed our path",
     "spiritual awakening", "to alcoholics"), not the manuscript's. */
  var HIW_ICO =
    '<svg class="ico ico-drawn" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M7 40h9v-8h9v-8h9v-8h8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M10 22l10-10M20 12h-6M20 12v6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  ITEMS.push({
    id: "howitworks",
    t: "How It Works",
    d: "Chapter Five. Read it daily.",
    icoHTML: HIW_ICO
  });
  /* MEETING GUIDE. AA's own meeting finder app -- a door out, on for
     everybody like the meme, and removable in the editor like any row. */
  ITEMS.push({
    id: "meetings",
    t: "AA\u2019s Meeting Guide App",
    d: "Find a meeting near you.",
    icoHTML: '<img class="ico ico-app" src="assets/pages/meeting-guide.png" alt="" aria-hidden="true">'
  });

  /* ---- THE PRAYERS -------------------------------------------------------
     Each one is a row you can add to your stack, and tapping it opens the
     words right there rather than sending you somewhere.

     WHAT IS IN HERE AND WHY. Only prayers whose text we can carry honestly:

       St Francis  -- first printed anonymously in 1912 and in the public
                      domain. This is the traditional English wording, NOT
                      the rendering in the Twelve and Twelve, which is a
                      1952 book and is not ours to copy.
       Serenity    -- the short form, as it is said in every room and
                      printed on AA's own material.

     THE TWO BIG BOOK PRAYERS ARE HERE WITH NO WORDS IN THEM ON PURPOSE.
     The Third Step and Seventh Step prayers come off pages 63 and 76. The
     1939 first edition is the one this project decided to use and the
     modern editions are not -- and the wording is not identical between
     them. Typing them from memory would most likely put the copyrighted
     wording in the app, which is the one thing we said we would not do.

     A prayer with no text is not offered in the picker at all, so nothing
     here is broken or half-shown. Paste the 1939 wording into `text` and
     the row appears on its own. */
  /* A MARK OF THEIR OWN. Handing a prayer one of the dailies' icons made
     St Francis turn up wearing the 24 Hours calendar, which reads as a bug
     rather than as a placeholder. This is drawn in the same gold line as
     the rest of the page and shared by all of them, which also says they
     are a set. Swap in real art per prayer whenever it exists. */
  var PRAY_ICO =
    '<svg class="ico ico-drawn" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M24 6v9M24 33v9M6 24h9M33 24h9" stroke-linecap="round"/>' +
      '<path d="M24 15c2.6 4.6 4.4 6.4 9 9-4.6 2.6-6.4 4.4-9 9-2.6-4.6-4.4-6.4-9-9 4.6-2.6 6.4-4.4 9-9z"/>' +
    '</svg>';

  var PRAYERS = [
    { id: "pr-serenity", t: "The Serenity Prayer", d: "The one we say together.",
      src: "The short form, as it is said in meetings.",
      text: [
        "God, grant me the serenity to accept the things I cannot change,",
        "the courage to change the things I can,",
        "and the wisdom to know the difference."
      ] },

    /* THE 1939 FIRST EDITION, AND ONLY THE 1939 FIRST EDITION. Its copyright
       was not renewed, so that text is public domain and this app can hold
       it outright instead of sending somebody off to a link. The wording in
       later editions differs and is still under copyright -- if either of
       these is ever edited, it is checked back against the first edition,
       never against a modern printing or a meeting handout. */

    { id: "pr-step3", t: "Third Step Prayer", d: "Offering yourself.",
      src: "Alcoholics Anonymous, 1st edition (1939), p. 63. Public domain.",
      text: [
        "God, I offer myself to Thee—to build with me and to do with me as Thou wilt.",
        "Relieve me of the bondage of self, that I may better do Thy will.",
        "Take away my difficulties, that victory over them may bear witness to those I would help of Thy Power, Thy Love, and Thy Way of life.",
        "May I do Thy will always!"
      ] },

    { id: "pr-step7", t: "Seventh Step Prayer", d: "Asking for them to be removed.",
      src: "Alcoholics Anonymous, 1st edition (1939), p. 76. Public domain.",
      text: [
        "My Creator, I am now willing that you should have all of me, good and bad.",
        "I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows.",
        "Grant me strength, as I go out from here, to do your bidding.",
        "Amen."
      ] },

    { id: "pr-francis", t: "Prayer of St. Francis", d: "An instrument of peace.",
      src: "Traditional. First printed anonymously in 1912; public domain.",
      text: [
        "Lord, make me an instrument of Thy peace.",
        "Where there is hatred, let me sow love;",
        "where there is injury, pardon;",
        "where there is doubt, faith;",
        "where there is despair, hope;",
        "where there is darkness, light;",
        "and where there is sadness, joy.",
        "",
        "O Divine Master, grant that I may not so much seek",
        "to be consoled as to console;",
        "to be understood as to understand;",
        "to be loved as to love.",
        "",
        "For it is in giving that we receive;",
        "it is in pardoning that we are pardoned;",
        "and it is in dying that we are born to eternal life."
      ] }
  ];

  /* A prayer with nothing to say is not offered. */
  var READY = PRAYERS.filter(function (p) { return p.text && p.text.length; });
  READY.forEach(function (p) { p.kind = "prayer"; ITEMS.push(p); });

  /* ---- THE ABSOLUTE OF THE DAY ------------------------------------------
     Honesty, purity, unselfishness, love -- the Oxford Group's four, which
     came into AA through its founders. One a day, in that order, starting
     over on the 1st of every month.

     The 1st is honesty every month without fail, which is the whole reason
     it resets rather than running off a continuous count: somebody can look
     at a calendar and know which one it is, and two people on the phone are
     always on the same one. Months are not multiples of four, so the run
     breaks at the end of every month -- a 31-day month ends on unselfishness
     and the next one still begins on honesty. The reset is the rule; the run
     is only what happens in between. */
  var ABSOLUTES = [
    { name: "Honesty",
      ask:  "Is it true or is it false?",
      body: "Today I will try to tell the complete truth. I will try not to " +
            "rationalize, exaggerate, or omit facts." },

    { name: "Purity",
      ask:  "Is it right or is it wrong?",
      body: "Today I will try to keep my motives completely pure. I will try " +
            "not to have hidden agendas." },

    { name: "Unselfishness",
      ask:  "How will this affect the other person?",
      body: "Today I will try to ask myself if I am acting out of self-interest " +
            "or concern for others. I will try to be willing to help someone " +
            "else without expecting anything in return." },

    { name: "Love",
      ask:  "Is it ugly or is it beautiful?",
      body: "Today I will try to keep my actions and words centered in kindness, " +
            "connection, and care instead of resentment and malice." }
  ];

  function todayAbsolute() {
    /* Local time, off this phone's clock -- the same clock the reading card
       at the top reads, so the two can never disagree about the day. */
    var i = (new Date().getDate() - 1) % ABSOLUTES.length;
    return { i: i, a: ABSOLUTES[i] };
  }

  /* ---- FIRST THINGS, FRANCIS ---------------------------------------------
     Twelve mornings. One line of the prayer, two things to try, and the same
     closing line every day.

     This grew out of an EVENING review -- a booklet that pairs each line of
     the prayer with a Tradition, two page ranges in two books, and eight to
     fourteen questions to answer at bedtime. Almost nobody does it. Partly
     that is the length, and partly it is the hour: a question at the end of
     the day can only tell you what you already know. "Was I an instrument of
     peace today?" answered at eleven at night is a verdict on a day you
     already spent, delivered too late to spend it any differently.

     So the questions were turned around and moved to the front of the day.
     Same lines, same twelve, but as things to try rather than things to
     grade. Going into the day with a direction beats going in blind and
     adding it up afterward.

     Everything else from the booklet is gone on purpose: the Traditions, the
     readings, the page ranges. They can be their own add-on if they are ever
     wanted; none of them is what makes this useful at seven in the morning.

     THE WORDING HERE IS WRITTEN, not lifted. The prayer lines are the 1912
     original, which is public domain, and the twelve intentions are this
     app's own words. The credit at the bottom is a thank-you for where the
     practice came from, not a reproduction of anybody's booklet. */
  var MORNING = [
    { line: "Lord, make me an instrument of Thy peace.",
      qs: ["Today I will try to be a peaceful presence wherever I go.",
           "Today I will try to leave a room calmer than I found it."] },

    { line: "Where there is hatred, let me bring love.",
      qs: ["Today I will try to meet hostility without returning it.",
           "Today I will try to do one thing that helps somebody."] },

    { line: "Where there is wrong, let me bring the spirit of forgiveness.",
      qs: ["Today I will try to let go of something I have been holding onto.",
           "Today I will try to forgive before I am asked to."] },

    { line: "Where there is discord, let me bring harmony.",
      qs: ["Today I will try not to push my opinion or my will on anyone.",
           "Today I will try to let someone else be right."] },

    { line: "Where there is error, let me bring truth.",
      qs: ["Today I will try to say only what is true, even when it costs me.",
           "Today I will try not to shade the truth to be liked."] },

    { line: "Where there is doubt, let me bring faith.",
      qs: ["Today I will try to act even where I am afraid.",
           "Today I will try to trust somebody a little further than is comfortable."] },

    { line: "Where there is despair, let me bring hope.",
      qs: ["Today I will try to notice what is going right.",
           "Today I will try to say an encouraging word to someone who needs it."] },

    { line: "Where there is shadow, let me bring light.",
      qs: ["Today I will try to look for the good in everyone I deal with.",
           "Today I will try to keep gossip out of my mouth."] },

    { line: "Where there is sadness, let me bring joy.",
      qs: ["Today I will try to carry my mood rather than hand it to someone else.",
           "Today I will try to bring some lightness into somebody's day."] },

    { line: "May I seek more to comfort, than to be comforted.",
      qs: ["Today I will try to ask someone how they are, and mean it.",
           "Today I will try to stay out of my own stuff long enough to notice theirs."] },

    { line: "May I seek more to understand, than to be understood.",
      qs: ["Today I will try to listen all the way through before I answer.",
           "Today I will try to be tolerant of people who are hard to be around."] },

    { line: "May I seek more to love, than to be loved.",
      qs: ["Today I will try to be kind, especially to the ones I do not like.",
           "Today I will try to let someone know that they matter."] }
  ];

  /* THE SAME LAST LINE EVERY MORNING. It closes nearly every page of the
     booklet it came from, turned around the same way as the rest. A line you
     meet twelve mornings running is one you start saying to yourself without
     opening anything. */
  var MORNING_CLOSER = "Today I will try to live up to my own ideals.";

  /* A thank-you, not a citation. Nothing of theirs is reproduced here -- the
     words are this app's and the prayer is public domain -- but the practice
     came from somewhere and saying so costs nothing. No individual is named:
     a group can be thanked, a member cannot. */
  var MORNING_THANKS =
    "With thanks to the Afternoon Alkies, Akron, Ohio, whose evening " +
    "review this grew out of.";

  /* WHAT THE (i) BESIDE THE THANK-YOU SAYS. Mike's own words, about why one
     line a day. */
  var MORNING_STORY =
    "Bill W. suggested we read the Prayer of St. Francis slowly for our " +
    "meditation. Well, one line a day is pretty damn slow. There\u2019s a " +
    "little group in Akron that all agreed to do this together and see how " +
    "our days go. It\u2019s been working for me for a while now.";

  function todayIntention() {
    var i = (new Date().getDate() - 1) % MORNING.length;
    return { i: i, e: MORNING[i] };
  }

  /* A sun coming up over the line, for the one thing here you do first. */
  var EVE_ICO =
    '<svg class="ico ico-drawn" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M8 34h32" stroke-linecap="round"/>' +
      '<path d="M16 34a8 8 0 0 1 16 0" stroke-linejoin="round"/>' +
      '<path d="M24 12v5M13 17l3 3M35 17l-3 3" stroke-linecap="round"/>' +
    '</svg>';

  ITEMS.push({
    id: "evening", kind: "evening",
    t: "First Things, Francis",
    d: "A line of the prayer, and two things to try.",
    icoHTML: EVE_ICO
  });

  /* A compass needle, not the prayers' star -- this one is about which way
     you are pointed today. */
  var ABS_ICO =
    '<svg class="ico ico-drawn" viewBox="0 0 48 48" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="16"/>' +
      '<path d="M30 18l-4 10-10 4 4-10z" stroke-linejoin="round"/>' +
    '</svg>';

  ITEMS.push({
    id: "absolute", kind: "absolute",
    t: "Absolute of the Day",
    d: "Honesty, purity, unselfishness, love.",
    icoHTML: ABS_ICO
  });

  /* The four dailies are the default stack. A prayer, and the absolute, are
     things you go and add -- so they start off the stack rather than on it.
     Nothing new ever turns itself on in somebody's morning. */
  var DEFAULT_ORDER = ITEMS.map(function (i) { return i.id; });
  /* MEME OF THE DAY IS THE ONE EXCEPTION to the rule below it, decided on
     purpose. Everything else added after launch starts off the stack so
     nobody opens the app to readings they never asked for. This one is meant
     to be passed around, and a feature nobody can see does not get passed
     around -- so it is on for everybody, and anyone who does not want it can
     take it off in the editor like any other row. */
  var DEFAULT_OFF = READY.map(function (p) { return p.id; }).concat(["absolute", "evening", "meetings", "howitworks"]);

  /* WHERE EACH DOOR GOES. On Today these live on the rows themselves; the Porch
     needs them too. ext = opens in a new tab, the same as on Today. */
  var HREF = {
    awakening:   { href: "/on-awakening.html" },
    hours24:     { href: "https://www.hazeldenbettyford.org/thought-for-the-day", ext: true },
    reflections: { href: "https://www.aa.org/daily-reflections", ext: true },
    anotherday:  { href: "/another-day-sober.html" },
    howitworks:  { href: "/how-it-works.html" },
    meme:        { href: "/meme.html" },
    meetings:    { href: "https://www.aa.org/meeting-guide-app", ext: true }
  };

  function byId(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }

  /* A SAVED ARRANGEMENT -> WHAT SHOWS. The same rules the Today page uses:
     only known ids, no repeats, anything new appended to the order, and a reading
     the saved arrangement never heard of stays OFF. */
  function resolve(saved) {
    var order = DEFAULT_ORDER.slice(), off = DEFAULT_OFF.slice(), savedOrder = null;
    if (saved && typeof saved === "object" && Array.isArray(saved.order) && saved.order.length) {
      order = saved.order.slice(); off = Array.isArray(saved.off) ? saved.off.slice() : []; savedOrder = saved.order;
      var known = {}; savedOrder.forEach(function (id) { known[id] = 1; });
      DEFAULT_OFF.forEach(function (id) { if (!known[id] && off.indexOf(id) === -1) off.push(id); });
    }
    var seen = {}, clean = [];
    order.forEach(function (id) { if (byId(id) && !seen[id]) { seen[id] = 1; clean.push(id); } });
    DEFAULT_ORDER.forEach(function (id) { if (!seen[id]) { seen[id] = 1; clean.push(id); } });
    off = off.filter(function (id, i, a) { return byId(id) && a.indexOf(id) === i; });
    return { order: clean, off: off, shown: clean.filter(function (id) { return off.indexOf(id) === -1; }) };
  }

  window.RMStackData = {
    ITEMS: ITEMS, byId: byId, DEFAULT_ORDER: DEFAULT_ORDER, DEFAULT_OFF: DEFAULT_OFF,
    PRAYERS: PRAYERS, READY: READY, ABSOLUTES: ABSOLUTES, MORNING: MORNING,
    MORNING_CLOSER: MORNING_CLOSER, MORNING_THANKS: MORNING_THANKS, MORNING_STORY: MORNING_STORY,
    MEME_ICO: MEME_ICO, PRAY_ICO: PRAY_ICO, EVE_ICO: EVE_ICO, ABS_ICO: ABS_ICO,
    todayAbsolute: todayAbsolute, todayIntention: todayIntention, HREF: HREF, resolve: resolve
  };
})();

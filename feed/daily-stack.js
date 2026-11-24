/* ==========================================================================
   THE DAILY STACK ON THE PORCH (v264, 22 Nov 2026, Mike: "integrate the person's
   daily stack right on their wall unless that's too invasive" ... "as long as it
   works like what is there now so it's not confusing").

   WHAT IT IS. Your own daily stack, at the top of YOUR Porch feed, as a row of
   cards you swipe sideways. Only you see it -- it is drawn on your phone from your
   own account; nothing about it is ever posted or shown to anybody else.

   IT IS THE SAME STACK AS THE TODAY PAGE, NOT A SECOND ONE:
     - the same readings, prayers, absolute and morning line (/assets/stack-data.js)
     - the same arrangement (account blob .stack, the "rm_stack" photograph first)
     - the same "opened today" list (account blob .opened), so a reading opened here
       is ticked on Today and the other way round
     - the same doors: a reading opens the same page or site; a prayer, the absolute
       and First Things, Francis open over the page, and Back closes them
     - Edit goes to Today's own editor (?edit=stack). One place arranges a stack.

   WHO SEES WHAT.
     - Not signed in: nothing (the Porch asks them to join).
     - Has used readings before (an arrangement or an opened day in the account):
       the stack, open every morning.
     - Never used them: one small "Start your day here?" offer. Add = on for good;
       X = gone for good. Either answer is kept in the account, so it follows them.
   FOLDING. The arrow folds it to one line; the line opens it again. Remembered for
   the day. A new day starts open. When everything is read it folds itself, green.
   ========================================================================== */
(function () {
  "use strict";
  var D = window.RMStackData;
  if (!D) return;
  var box = document.getElementById("dstack");
  if (!box) return;

  function uid() {
    try { return (JSON.parse(localStorage.getItem("rm_account_v1") || "null") || {}).uid || ""; } catch (e) { return ""; }
  }
  if (!uid()) return;                                   /* members only */

  var FOLD = "rm_ds_fold";
  var blob = null;                                      /* the account's saved data, once it lands */
  var arr = null;                                       /* { order, off, shown } */
  var openedNow = [];
  var pending = null;

  function todayKey() {
    var d = new Date();
    return ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function ico(it) {
    if (it.ico) return '<img class="dsico" src="/' + it.ico.replace(/^\/+/, "") + '" alt="" aria-hidden="true">';
    return '<span class="dsico dsdrawn">' + (it.icoHTML || D.PRAY_ICO) + "</span>";
  }
  /* the kit's drawings where they fit, our own icons everywhere else */
  var BOOKS = '<svg class="dsbooks" viewBox="0 0 256 256" aria-hidden="true"><g stroke="#EDB83F" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M42 67 159 21l58 31-118 51z" fill="#CB9732"/><path d="M42 67v35l57 29 118-50V52L99 103z" fill="#181714"/><path d="M58 88 99 108l104-43" stroke="#F1EBDD" fill="none" stroke-width="3"/><path d="M36 124 153 79l62 32-120 51z" fill="#DBA738"/><path d="M36 124v34l59 33 120-51v-29L95 162z" fill="#181714"/><path d="M48 147 95 170l106-47" stroke="#F1EBDD" fill="none" stroke-width="3"/><path d="M45 185 161 141l54 29-118 51z" fill="#C58F27"/><path d="M45 185v27l52 25 118-45v-22L97 221z" fill="#181714"/><path d="M59 204 97 224l102-42" stroke="#F1EBDD" fill="none" stroke-width="3"/></g></svg>';
  var SUNBOOK = '<svg viewBox="0 0 256 256" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M128 91a42 42 0 0 0-84 0h84Z" transform="translate(42 0)" fill="#EDB83F" stroke="#EDB83F" stroke-width="3"/><g stroke="#EDB83F" stroke-width="3"><path d="M128 91 L213 68"/><path d="M128 91 L204 47"/><path d="M128 91 L190 29"/><path d="M128 91 L172 15"/><path d="M128 91 L151 6"/><path d="M128 91 L128 3"/><path d="M128 91 L105 6"/><path d="M128 91 L84 15"/><path d="M128 91 L66 29"/><path d="M128 91 L52 47"/><path d="M128 91 L43 68"/></g><path d="M24 118q54-18 104 10 50-28 104-10v96q-57-17-104 11-47-28-104-11z" fill="#F1EBDD" stroke="#EDB83F" stroke-width="6"/><path d="M128 130v90" stroke="#15140E" stroke-width="6"/><path d="M41 134q41-9 73 9M41 150q41-9 73 9M41 166q41-9 73 9M41 182q41-9 73 9M142 143q32-18 73-9M142 159q32-18 73-9M142 175q32-18 73-9M142 191q32-18 73-9" stroke="#282219" stroke-width="3"/><path d="M23 221q54-14 105 15 52-28 106-15" stroke="#EDB83F" stroke-width="5"/></g></svg>';
  var SPROUT = '<svg viewBox="0 0 256 256" aria-hidden="true"><g fill="none" stroke="#F1EBDD" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M130 220V105"/><path d="M130 146C81 142 56 113 46 52c56 1 85 27 86 74" fill="#BBB19A"/><path d="M130 122C132 72 157 43 213 33c-1 57-26 91-83 109" fill="#E9DFC6"/><path d="M130 146 76 87M130 124 182 76" stroke="#786E57" stroke-width="4"/></g></svg>';
  var CHECK = '<svg class="dstick" viewBox="0 0 256 256" role="img" aria-label="Read"><circle cx="128" cy="128" r="94" fill="#000a" stroke="#E6B13C" stroke-width="12"/><path d="m78 127 34 33 67-72" fill="none" stroke="#F1EBDD" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TALK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  var ART = { reflections: SUNBOOK, anotherday: SPROUT };
  function art(it) { return ART[it.id] || ico(it); }
  var rcounts = {};
  /* THE TALK (v269, Mike: "only for the daily readings. Daily Reflections, 24 Hours a Day, Another Day
     Sober. You don't need it for all the other stuff."). Tap one of these three: the reading opens like
     always, and when you come back to the Porch its conversation is waiting in a sheet on top. */
  var TALKS = { reflections: 1, hours24: 1, anotherday: 1 };
  var PEND = "rm_talk_pending";

  function opensOver(it) { return it && (it.kind === "prayer" || it.kind === "absolute" || it.kind === "evening"); }

  /* ---- what the account says ---- */
  function fromCache() {
    try {
      var v = JSON.parse(localStorage.getItem("rm_stack") || "null");
      if (v && (v.uid || "") === uid()) return v;
    } catch (e) {}
    return null;
  }
  function openedFrom(b) {
    var l = b && b.opened && b.opened[todayKey()];
    return Array.isArray(l) ? l.slice() : [];
  }
  /* has this person ever used readings? An arrangement saved, or a day opened. */
  function usedBefore(b) {
    if (!b) return !!fromCache();
    return !!((b.stack && b.stack.order) || b.stackOff || (b.opened && Object.keys(b.opened).length));
  }
  function mode() {
    var b = blob || {};
    if (b.porchStack === "off") return "none";
    if (b.porchStack === "on" || usedBefore(blob)) return "stack";
    return blob ? "offer" : "none";                     /* never guess an offer before the account answers */
  }

  /* ---- folding ---- */
  function foldGet() {
    try { var f = JSON.parse(localStorage.getItem(FOLD) || "null"); if (f && f.u === uid() && f.d === todayKey()) return f.f; } catch (e) {}
    return null;
  }
  function foldSet(v) { try { localStorage.setItem(FOLD, JSON.stringify({ u: uid(), d: todayKey(), f: v })); } catch (e) {} }

  /* ---- painting ---- */
  function paint() {
    var m = mode();
    box.hidden = m === "none";
    if (m === "none") { box.innerHTML = ""; return; }
    if (m === "offer") {
      box.innerHTML =
        '<div class="dsoffer"><span class="dssun" aria-hidden="true"></span>' +
        '<p><b>Start your day here?</b>Put the daily readings at the top of your Porch. Only you see them.</p>' +
        '<button type="button" class="dsadd" data-ds-add>Add</button>' +
        '<button type="button" class="dsno" data-ds-no aria-label="No thanks">&#10005;</button></div>';
      return;
    }
    var shown = arr.shown, total = shown.length, done = 0, next = null;
    shown.forEach(function (id) { if (openedNow.indexOf(id) !== -1) done++; else if (!next) next = id; });
    var all = total > 0 && done === total;
    var f = foldGet(); var folded = f === null ? all : f;
    var nextIt = next ? D.byId(next) : null;
    var count = all ? "✓ All " + total + " read today" : done ? done + " of " + total + " read" : total + (total === 1 ? " reading" : " readings") + " today";

    if (!total) {
      box.innerHTML = '<div class="dsstrip"><span class="dssun" aria-hidden="true"></span><b>Daily Stack</b>' +
        '<em>Nothing in it yet</em><button type="button" class="dsedit" data-ds-edit>Pick some</button></div>';
      return;
    }
    if (folded) {
      box.innerHTML =
        '<button type="button" class="dsstrip' + (all ? " dsall" : "") + '" data-ds-fold="0" aria-expanded="false">' +
        '<span class="dssun" aria-hidden="true"></span><b>Daily Stack</b>' +
        '<em>' + esc(all ? count : count + (nextIt ? " · next: " + nextIt.t : "")) + '</em>' +
        '<span class="dsarrow" aria-hidden="true">&#8964;</span></button>';
      return;
    }
    /* THE NEW LOOK (v267, 22 Nov 2026, Mike: "i like that build it"). The woodgrain bar with READ | REFLECT |
       SHARE, wide gritty cards with the next one peeking in, Edit + dots + "3 of 7" + fold under them.
       Everything it does is the same as before: same readings, same doors, same ticks, same editor. */
    var oldRow = document.getElementById("dscards"), keep = oldRow ? oldRow.scrollLeft : null;
    box.innerHTML =
      '<section class="dsbox" aria-label="Your daily stack">' +
        '<div class="dsbar">' + BOOKS + '<h2>The Daily Stack</h2></div>' +   /* v269: READ | REFLECT | SHARE came off (Mike: confusing). Share comes back later, inside the talk sheet. */
        '<div class="dswrap"><button type="button" class="dsl" aria-label="Back" hidden>&#8249;</button><button type="button" class="dsr" aria-label="More" hidden>&#8250;</button>' +
        '<div class="dscards" id="dscards">' +
          shown.map(function (id) {
            var it = D.byId(id), isDone = openedNow.indexOf(id) !== -1, isNext = id === next;
            var h = D.HREF[id], n = rcounts[id] || 0;
            var tag = opensOver(it) ? 'button type="button"' : 'a href="' + esc(h ? h.href : "/index.html?today=1") + '"' + (h && h.ext ? ' target="_blank" rel="noopener"' : "");
            var end = opensOver(it) ? "button" : "a";
            return '<' + tag + ' class="dscard' + (isDone ? " done" : "") + (isNext ? " next" : "") + '" data-ds-id="' + esc(id) + '">' +
              '<span class="dsart">' + art(it) + '</span>' +
              '<span class="dscp">' + (isNext ? '<span class="dsgo">Read next</span>' : "") +
                '<b>' + esc(it.t) + '</b><span>' + esc(it.d) + '</span>' +
                (TALKS[id] && n >= 2 ? '<em class="dstalk" data-ds-talk="' + esc(id) + '" role="button" aria-label="Talk about today\u2019s ' + esc(it.t) + '">' + TALK + n + " talking</em>" : "") + '</span>' +
              (isDone ? CHECK : "") +
              '</' + end + '>';
          }).join("") +
        '</div></div>' +
        '<div class="dsmeta"><button type="button" class="dsedit" data-ds-edit>&#9998; Edit</button>' +
          '<span class="dsdots" aria-hidden="true">' + shown.map(function (id) { return '<i' + (openedNow.indexOf(id) !== -1 ? ' class="f"' : "") + '></i>'; }).join("") + '</span>' +
          '<span class="dsct"><b id="dsCur">1</b> of ' + total + '</span>' +
          '<button type="button" class="dsfold" data-ds-fold="1" aria-label="Fold it up" aria-expanded="true">&#8963;</button></div>' +
      '</section>';
    var row = document.getElementById("dscards");
    /* first paint of the day starts on the next one to read; a repaint keeps your place */
    if (row && keep !== null) row.scrollLeft = keep;
    else { var nx = row && row.querySelector(".dscard.next"); if (row && nx) row.scrollLeft = Math.max(0, nx.offsetLeft - row.firstElementChild.offsetLeft); }
    dragScroll(row);
    row.addEventListener("scroll", markCurrent, { passive: true });
    markCurrent();
  }

  /* WHICH CARD IS IN VIEW. READ, REFLECT and SHARE all act on it, and "3 of 7" says which it is. */
  function currentCard() {
    var row = document.getElementById("dscards"); if (!row) return null;
    var cs = row.querySelectorAll(".dscard"), best = null, bd = 1e9, x0 = row.getBoundingClientRect().left + 12;
    for (var i = 0; i < cs.length; i++) { var d0 = Math.abs(cs[i].getBoundingClientRect().left - x0); if (d0 < bd) { bd = d0; best = i; } }
    return best === null ? null : { i: best, el: cs[best], id: cs[best].getAttribute("data-ds-id") };
  }
  function markCurrent() {
    var c = currentCard(); if (!c) return;
    var n = document.getElementById("dsCur"); if (n) n.textContent = c.i + 1;
    var dots = box.querySelectorAll(".dsdots i");
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("c", i === c.i);
  }

  /* ---- ON A COMPUTER (v265, Mike: "i cannot scroll side to side on a computer, fix that").
     Three ways, all of them: drag it with the mouse (like the strips on Ohio Peer Supporter), roll the
     mouse wheel over it, or click the arrows at its ends. The arrows only show on a computer with a
     mouse, and only on a side that has more to see. Phones swipe, as before. ---- */
  var dragged = false;
  var STEP = function (row) { var c = row.querySelector(".dscard"); return c ? c.offsetWidth + 10 : 150; };
  function arrows(row) {
    var wrap = row.parentNode; if (!wrap) return;
    var l = wrap.querySelector(".dsl"), r = wrap.querySelector(".dsr");
    if (!l || !r) return;
    var max = row.scrollWidth - row.clientWidth;
    l.hidden = row.scrollLeft <= 4; r.hidden = row.scrollLeft >= max - 4 || max <= 4;
  }
  function dragScroll(row) {
    if (!row || row._drag) return; row._drag = 1;
    var down = false, x0 = 0, s0 = 0, id = null;
    row.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; dragged = false; x0 = e.clientX; s0 = row.scrollLeft; id = e.pointerId;
    });
    row.addEventListener("pointermove", function (e) {
      if (!down || e.pointerId !== id) return;
      var dx = e.clientX - x0;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; row.classList.add("grab"); try { row.setPointerCapture(id); } catch (x) {} }
      if (dragged) { row.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    function up() {
      if (!down) return; down = false;
      if (dragged) {
        row.classList.remove("grab");
        setTimeout(function () { dragged = false; }, 0);
      }
    }
    row.addEventListener("pointerup", up); row.addEventListener("pointercancel", up);
    row.addEventListener("dragstart", function (e) { e.preventDefault(); });
    /* the wheel: one card per notch, and only while there is somewhere to go -- at either end the page scrolls as usual */
    var wheelBusy = 0;
    row.addEventListener("wheel", function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      var max = row.scrollWidth - row.clientWidth;
      if ((d > 0 && row.scrollLeft >= max - 4) || (d < 0 && row.scrollLeft <= 4)) return;
      e.preventDefault();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { row.scrollLeft += d; return; }      /* a trackpad swipes sideways on its own */
      var now = Date.now(); if (now - wheelBusy < 180) return; wheelBusy = now;
      row.scrollBy({ left: (d > 0 ? 1 : -1) * STEP(row), behavior: "smooth" });
    }, { passive: false });
    row.addEventListener("scroll", function () { arrows(row); }, { passive: true });
    var wrap = row.parentNode;
    if (wrap) wrap.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".dsl,.dsr"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      row.scrollBy({ left: (b.classList.contains("dsr") ? 1 : -1) * STEP(row) * 2, behavior: "smooth" });
    });
    setTimeout(function () { arrows(row); }, 50);
  }

  /* ---- opened: the same list Today keeps ---- */
  function markOpened(id) {
    if (openedNow.indexOf(id) === -1) openedNow.push(id);
    var k = todayKey(), A = window.RMAccount;
    if (blob) { blob.opened = {}; blob.opened[k] = openedNow.slice(); }
    if (A && A.update) {
      A.update(function (data) {
        var cur = data.opened && Array.isArray(data.opened[k]) ? data.opened[k] : [];
        openedNow.forEach(function (x) { if (cur.indexOf(x) === -1) cur.push(x); });
        data.opened = {}; data.opened[k] = cur;            /* only today is kept, same as Today */
        return data;
      });
    }
  }
  function setFlag(v) {
    if (!blob) blob = {};
    blob.porchStack = v;
    var A = window.RMAccount;
    if (A && A.update) A.update(function (data) { data.porchStack = v; return data; });
  }

  /* ---- reading over the Porch: a prayer, the absolute, First Things, Francis ---- */
  function readOver(it) {
    var t = it.t, html = "", src = "", info = "";
    if (it.kind === "absolute") {
      var a = D.todayAbsolute(); t = "Absolute of the Day";
      html = '<p class="dsabs">' + esc(a.a.name) + '</p><p class="dsask">' + esc(a.a.ask) + '</p><p class="dsbody">' + esc(a.a.body) + '</p>' +
        '<p class="dsadots" aria-hidden="true">' + D.ABSOLUTES.map(function (_, n) { return '<i' + (n === a.i ? ' class="on"' : "") + '></i>'; }).join("") + '</p>';
    } else if (it.kind === "evening") {
      var n = D.todayIntention(); t = "First Things, Francis";
      html = '<p class="dsevc">Day ' + (n.i + 1) + ' of ' + D.MORNING.length + '</p><p class="dsevl">' + esc(n.e.line) + '</p>' +
        '<ul class="dsevq">' + n.e.qs.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + '</ul>' +
        '<p class="dsevx">' + esc(D.MORNING_CLOSER) + '</p>';
      src = D.MORNING_THANKS; info = D.MORNING_STORY;
    } else {
      html = '<div class="dspray">' + (it.text || []).map(function (l) { return l ? "<span>" + esc(l) + "</span>" : '<span class="gap"></span>'; }).join("") + '</div>';
      src = it.src || "";
    }
    document.getElementById("dsrTitle").textContent = t;
    document.getElementById("dsrBody").innerHTML = html;
    var s = document.getElementById("dsrSrc");
    s.innerHTML = src ? esc(src) + (info ? ' <button type="button" class="dsinfo" data-ds-info aria-expanded="false">i</button>' : "") : "";
    s.hidden = !src;
    var ib = document.getElementById("dsrInfo"); ib.textContent = info; ib.hidden = true;
    if (window.PorchLayer) window.PorchLayer.open("dsread");
  }


  /* ==========================================================================
     THE EDITOR, RIGHT HERE ON THE PORCH (v266, Mike: "you cheaped out in coding the edit feature
     and now it jumps all these different screens and never goes back to the porch... don't cheap
     out"). Edit opens a sheet over the Porch; Back or the X closes it and you are on the Porch,
     where you were. It is the Today page's editor, the same rules and the same words:
       - the gold arrow moves a reading up (to move one down, move the one under it up)
       - minus takes a reading off; nothing is deleted, it waits under "Not shown"
       - plus puts it back where it was; the prayers wait in their own drawer
       - every change is saved to the account at once (the same .stack the Today page reads),
         and if it can't be saved the sheet goes back and says so in plain words
     The stack behind the sheet changes as you go, so you can see what you did.
     ========================================================================== */
  var UPSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 12l6-6 6 6"/></svg>';
  var GROUPS = { prayer: "Prayers" };
  var groupOpen = {};
  var lastGood = null;
  var chain = Promise.resolve();
  var QUIET = false;
  try { QUIET = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function snap() { return { order: arr.order.slice(), off: arr.off.slice() }; }
  function reshow() { arr = D.resolve({ order: arr.order, off: arr.off }); }
  function isOff(id) { return arr.off.indexOf(id) !== -1; }
  function $e(id) { return document.getElementById(id); }

  function eRowOn(it, i) {
    return '<div class="dserow" data-row-id="' + esc(it.id) + '">' +
      '<button class="dsmv" type="button" data-move="' + esc(it.id) + '"' + (i === 0 ? " disabled" : "") +
        ' aria-label="Move ' + esc(it.t) + ' up one">' + UPSVG + '</button>' +
      ico(it) + '<span class="dset"><b>' + esc(it.t) + '</b><span>' + esc(it.d) + '</span></span>' +
      '<button class="dstg" type="button" data-take="' + esc(it.id) + '" aria-label="Take ' + esc(it.t) + ' off your stack">&minus;</button></div>';
  }
  function eRowOff(it) {
    return '<div class="dserow isoff" data-row-id="' + esc(it.id) + '">' +
      ico(it) + '<span class="dset"><b>' + esc(it.t) + '</b><span>' + esc(it.d) + '</span></span>' +
      '<button class="dstg add" type="button" data-addback="' + esc(it.id) + '" aria-label="Put ' + esc(it.t) + ' back on your stack">+</button></div>';
  }
  function paintEditor() {
    var on = arr.shown, setAside = arr.order.filter(isOff), loose = [], boxed = {}, kinds = [];
    setAside.forEach(function (id) {
      var it = D.byId(id), k = it && it.kind;
      if (k && GROUPS[k]) { if (!boxed[k]) { boxed[k] = []; kinds.push(k); } boxed[k].push(id); } else loose.push(id);
    });
    $e("dseOn").innerHTML = on.map(function (id, i) { return eRowOn(D.byId(id), i); }).join("");
    $e("dseOff").innerHTML = loose.map(function (id) { return eRowOff(D.byId(id)); }).join("") +
      kinds.map(function (k) {
        var open = !!groupOpen[k], list = boxed[k];
        return '<div class="dsgrp' + (open ? " open" : "") + '"><button class="dsgh" type="button" data-group="' + k + '" aria-expanded="' + open + '">' +
          '<span>' + GROUPS[k] + '</span><em>' + list.length + '</em><span class="dsgc" aria-hidden="true">&#8964;</span></button>' +
          '<div' + (open ? "" : " hidden") + '>' + list.map(function (id) { return eRowOff(D.byId(id)); }).join("") + '</div></div>';
      }).join("");
    $e("dseOnEmpty").hidden = on.length > 0;
    $e("dseOffEmpty").hidden = setAside.length > 0;
  }
  function marks() {
    var m = {};
    document.querySelectorAll("#dsedit [data-row-id]").forEach(function (el) { m[el.getAttribute("data-row-id")] = el.getBoundingClientRect().top; });
    return m;
  }
  function travel(before, nudge) {
    var moved = [];
    document.querySelectorAll("#dsedit [data-row-id]").forEach(function (el) {
      var id = el.getAttribute("data-row-id");
      if (id === nudge) { el.classList.remove("justmoved"); void el.offsetWidth; el.classList.add("justmoved"); }
      if (QUIET || !(id in before)) return;
      var d = before[id] - el.getBoundingClientRect().top; if (!d) return;
      el.style.transition = "none"; el.style.transform = "translateY(" + d + "px)"; moved.push(el);
    });
    if (moved.length) requestAnimationFrame(function () {
      moved.forEach(function (el) { el.style.transition = "transform .28s cubic-bezier(.2,.8,.2,1)"; el.style.transform = "translateY(0)"; });
    });
  }
  function say(t, busy) { var b = $e("dseSay"); if (!b) return; b.textContent = t || ""; b.hidden = !t; b.className = "dsesay" + (busy ? " busy" : ""); }
  function save() {
    var A = window.RMAccount;
    if (!A || !A.update) return Promise.resolve(false);
    chain = chain.then(function () {
      var want = { order: arr.order.slice(), off: arr.off.slice() };
      return A.update(function (data) { data.stack = want; delete data.stackOff; return data; }).then(function (ok) {
        if (ok === false) return false;
        lastGood = snap();
        if (blob) { blob.stack = want; delete blob.stackOff; }
        try { localStorage.setItem("rm_stack", JSON.stringify({ order: want.order, off: want.off, uid: uid() })); } catch (e) {}
        return true;
      });
    }).catch(function () { return false; });
    return chain;
  }
  function change(work, nudge) {
    var was = lastGood || snap();
    work(); reshow();
    var b = marks(); paintEditor(); travel(b, nudge); paint();
    if (!navigator.onLine) return undo(was, "You’re offline, so that didn’t save. Try again when you have signal.");
    say("Saving…", true);
    save().then(function (ok) { if (ok) say(""); else undo(was, "That didn’t save. Check your signal and try again."); });
  }
  function undo(was, why) {
    arr = D.resolve(was);
    var b = marks(); paintEditor(); travel(b, null); paint();
    say(why);
  }
  function move(id) {
    var on = arr.shown, at = on.indexOf(id); if (at < 1) return;
    var a = arr.order.indexOf(on[at]), b = arr.order.indexOf(on[at - 1]);
    change(function () { var o = arr.order; var x = o[a]; o[a] = o[b]; o[b] = x; }, id);
    var again = document.querySelector('#dsedit [data-move="' + id + '"]');
    if (again && !again.disabled) { try { again.focus({ preventScroll: true }); } catch (e) {} }
  }
  function openEditor() {
    if (!navigator.onLine) { say(""); }
    lastGood = snap(); groupOpen = {};
    paintEditor(); say(navigator.onLine ? "" : "You’re offline. You can look, but changes need a signal.");
    if (window.PorchLayer) window.PorchLayer.open("dsedit");
    try { document.querySelector("#dsedit .sheet").scrollTop = 0; } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#dsedit")) return;
    var mv = t.closest("[data-move]"); if (mv && !mv.disabled) { move(mv.getAttribute("data-move")); return; }
    var tk = t.closest("[data-take]"); if (tk) { var id = tk.getAttribute("data-take"); change(function () { if (!isOff(id)) arr.off.push(id); }, id); return; }
    var ad = t.closest("[data-addback]"); if (ad) { var id2 = ad.getAttribute("data-addback"); change(function () { arr.off = arr.off.filter(function (x) { return x !== id2; }); }, id2); return; }
    var g = t.closest("[data-group]"); if (g) { var k = g.getAttribute("data-group"); groupOpen[k] = !groupOpen[k]; var b = marks(); paintEditor(); travel(b, null); return; }
  });


  /* ==========================================================================
     READ | REFLECT | SHARE (v267). All three act on the card in view.
       READ    opens it, exactly like tapping the card.
       REFLECT opens today's conversation about that reading: one thread per reading per day, an ordinary
               Porch post from the house account (supabase/porch_83_reflect.sql), so comments, hearts,
               replies, reports and alerts all work the way they do everywhere else. The feed hides them.
       SHARE   starts a Porch share about the reading. Our own readings (the prayers, the Absolute, First
               Things, Francis) go in whole; the others go in as title, date and a link, because AA's
               and Hazelden's words are theirs.
     ========================================================================== */
  var SITE = "https://recoverymisfits.org";
  function todayWords() { return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
  function fullText(it) {
    if (it.kind === "absolute") { var a = D.todayAbsolute().a; return a.name + "\n" + a.ask + "\n" + a.body; }
    if (it.kind === "evening") { var n = D.todayIntention().e; return n.line + "\n" + n.qs.map(function (q) { return "• " + q; }).join("\n") + "\n" + D.MORNING_CLOSER; }
    if (it.kind === "prayer") return (it.text || []).join("\n");
    return "";
  }
  function linkFor(id) { var h = D.HREF[id]; if (!h) return ""; return h.ext ? h.href : SITE + h.href; }
  function doRead(c) { c.el.click(); }
  function doShare(c) {
    var it = D.byId(c.id), txt = fullText(it), link = linkFor(c.id);
    var words = "📖 " + it.t + " · " + todayWords() + "\n" + (txt ? txt + "\n" : "") + (link ? link + "\n" : "") + "\n";
    if (window.RMToPorch) window.RMToPorch({ words: words });
  }
  function reflectHead(it) {
    var h = document.getElementById("rfhead"); if (!h) return;
    var link = linkFor(it.id), host = "";
    try { host = link ? new URL(link).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    /* "Open link", always those words (Mike). Ours opens in the lightbox over the Porch; AA's and Hazelden's
       open in their own window (on the installed app that slides up over it with an X), since their sites
       refuse to be shown inside ours. */
    var own = link && link.indexOf(SITE) === 0;
    var go = opensOver(it) ? '<button type="button" class="rfgo" data-rf-read="' + esc(it.id) + '">Open link</button>'
      : own ? '<button type="button" class="rfgo" data-rf-light="' + esc(link.slice(SITE.length)) + '" data-rf-title="' + esc(it.t) + '">Open link</button>'
      : link ? '<a class="rfgo" href="' + esc(link) + '" target="_blank" rel="noopener">Open link \u2197</a>' : "";
    h.innerHTML = '<div class="rfx"><span class="rfart">' + art(it) + '</span><div><b>' + esc(it.t) + '</b><span>' + esc(todayWords()) + '</span>' + go + '</div></div>' +
      '<p class="rfq">What did it say to you?</p>' +
      '<div class="rfempty"><b>Be the first</b>Nobody\u2019s said anything about today\u2019s reading yet. What did it stir up for you?</div>';
    h.hidden = false;
    var t = document.querySelector("#comments .chead b"); if (t) t.textContent = "Talk about today\u2019s reading";
    var cm = document.getElementById("comments"); if (cm) cm.classList.add("rf");
    var ask = function () { var b = document.getElementById("cin"); if (b && cm && cm.classList.contains("rf") && b.placeholder === "Say something kind\u2026") b.placeholder = "Say what it stirred up\u2026"; };
    [60, 400, 1200].forEach(function (ms) { setTimeout(ask, ms); });
  }
  function reflectDone() {
    var h = document.getElementById("rfhead"); if (h) { h.hidden = true; h.innerHTML = ""; }
    var t = document.querySelector("#comments .chead b"); if (t) t.textContent = "Comments";
    var cm = document.getElementById("comments"); if (cm) cm.classList.remove("rf");
    var b = document.getElementById("cin"); if (b) b.placeholder = "Say something kind\u2026";
    loadCounts();
  }
  function doReflect(id) {
    var P = window.Porch, it = D.byId(id); if (!P || !it) return;
    P.gate(async function () {
      var pid = null;
      try { pid = await P.rpc("rm_reflect_thread", { p_reading: id, p_title: it.t }); } catch (e) {}
      if (!pid) return P.toast("That didn’t open. Check your signal and try again.");
      reflectHead(it);
      P.openCommentsFor(pid, reflectDone);
    });
  }
  function loadCounts() {
    var P = window.Porch; if (!P || !P.rpc) return;
    P.rpc("rm_reflect_counts", {}).then(function (c) { rcounts = c || {}; paint(); }).catch(function () {});
  }
  document.addEventListener("click", function (e) {
    var lb = e.target.closest && e.target.closest("[data-rf-light]"); if (!lb) return;
    e.preventDefault();
    document.getElementById("dslTitle").textContent = lb.getAttribute("data-rf-title") || "Today\u2019s reading";
    document.getElementById("dslFrame").src = lb.getAttribute("data-rf-light");
    if (window.PorchLayer) window.PorchLayer.open("dslight");
  });
  document.addEventListener("click", function (e) {
    var r = e.target.closest && e.target.closest("[data-rf-read]"); if (!r) return;
    e.preventDefault(); var it = D.byId(r.getAttribute("data-rf-read")); if (it) { markOpened(it.id); readOver(it); }
  });

  /* ---- taps ---- */
  box.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-ds-add]")) { setFlag("on"); paint(); return; }
    if (t.closest("[data-ds-no]")) { setFlag("off"); paint(); return; }
    if (t.closest("[data-ds-edit]")) { e.preventDefault(); openEditor(); return; }
    var tk = t.closest("[data-ds-talk]");
    if (tk) { e.preventDefault(); e.stopPropagation(); if (!dragged) doReflect(tk.getAttribute("data-ds-talk")); return; }
    var fb = t.closest("[data-ds-fold]");
    if (fb) { foldSet(fb.getAttribute("data-ds-fold") === "1"); paint(); return; }
    var c = t.closest("[data-ds-id]");
    if (!c) return;
    if (dragged) { e.preventDefault(); return; }       /* the end of a mouse drag is not a tap */
    var id = c.getAttribute("data-ds-id"), it = D.byId(id);
    markOpened(id);
    /* v270: the three daily readings open their white talk sheet right here; "Open link" inside it opens the reading */
    if (TALKS[id]) { e.preventDefault(); doReflect(id); setTimeout(paint, 400); return; }
    if (opensOver(it)) { e.preventDefault(); readOver(it); setTimeout(paint, 400); return; }
    /* a link: let it go (same page, or a new tab for the outside sites); repaint for when they come back */
    setTimeout(paint, 300);
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest("[data-ds-info]")) return;
    var ib = document.getElementById("dsrInfo"); ib.hidden = !ib.hidden;
    e.target.closest("[data-ds-info]").setAttribute("aria-expanded", ib.hidden ? "false" : "true");
  });

  /* ---- start: the photograph first, then the account ---- */
  arr = D.resolve(fromCache());
  if (fromCache()) paint();
  var tries = 0;
  (function wait() {
    var A = window.RMAccount;
    if (A && A.pull) {
      A.pull().then(function (r) {
        blob = (r && r.data) || {};
        arr = D.resolve(blob.stack || (Array.isArray(blob.stackOff) ? { order: D.DEFAULT_ORDER, off: blob.stackOff.concat(D.DEFAULT_OFF) } : fromCache()));   /* the old shape: same as Today reads it */
        openedNow = openedFrom(blob);
        paint();
        setTimeout(loadCounts, 1200);   /* after the Porch is up */
      }).catch(function () { paint(); });
      return;
    }
    if (++tries < 40) setTimeout(wait, 250);
  })();
  /* came back from a reading page, or the app was left open past midnight */
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") paint(); });
  setInterval(function () { var k = todayKey(); if (k !== paint._k) { paint._k = k; if (blob) openedNow = openedFrom(blob); paint(); } }, 60000);
  paint._k = todayKey();
  /* COMING BACK FROM THE READING. An outside site opened in a new tab: this page becomes visible again.
     Another Day Sober opened in this tab: the Porch loads fresh. Either way the talk sheet comes up, once,
     if they come back within half an hour. */
  function talkIfPending() {
    var v = null; try { v = JSON.parse(sessionStorage.getItem(PEND) || "null"); } catch (e) {}
    if (!v || !TALKS[v.id] || Date.now() - v.at > 30 * 60000 || Date.now() - v.at < 1500) return;
    try { sessionStorage.removeItem(PEND); } catch (e) {}
    var n = 0;
    (function go() {
      if (window.Porch && window.Porch.gate && !document.querySelector(".layer.open")) return doReflect(v.id);
      if (++n < 30) setTimeout(go, 300);
    })();
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") setTimeout(talkIfPending, 350); });
  window.addEventListener("pageshow", function () { setTimeout(talkIfPending, 900); });
  window.PorchDailyStack = { paint: paint };
})();

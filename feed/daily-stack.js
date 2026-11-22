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
        '<em>Nothing in it yet</em><a class="dsedit" href="/index.html?today=1&amp;edit=stack">Pick some</a></div>';
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
    var d = new Date();
    var day = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    box.innerHTML =
      '<section class="dsbox" aria-label="Your daily stack">' +
        '<div class="dshead"><span class="dssun" aria-hidden="true"></span>' +
          '<div class="dst"><b>Your Daily Stack</b><span>' + esc(day) + " · " + esc(count) + '</span></div>' +
          '<a class="dsedit" href="/index.html?today=1&amp;edit=stack">Edit</a>' +
          '<button type="button" class="dsfold" data-ds-fold="1" aria-label="Fold it up" aria-expanded="true">&#8963;</button></div>' +
        '<div class="dscards" id="dscards">' +
          shown.map(function (id) {
            var it = D.byId(id), isDone = openedNow.indexOf(id) !== -1, isNext = id === next;
            var h = D.HREF[id];
            var tag = opensOver(it) ? 'button type="button"' : 'a href="' + esc(h ? h.href : "/index.html?today=1") + '"' + (h && h.ext ? ' target="_blank" rel="noopener"' : "");
            var end = opensOver(it) ? "button" : "a";
            return '<' + tag + ' class="dscard' + (isDone ? " done" : "") + (isNext ? " next" : "") + '" data-ds-id="' + esc(id) + '">' +
              (isNext ? '<span class="dsgo">Read next</span>' : "") +
              (isDone ? '<span class="dstick" aria-label="Read">✓</span>' : "") +
              ico(it) + '<b>' + esc(it.t) + '</b><span>' + esc(it.d) + '</span></' + end + '>';
          }).join("") +
        '</div>' +
        '<div class="dsdots" aria-hidden="true">' + shown.map(function (id) { return '<i' + (openedNow.indexOf(id) !== -1 ? ' class="f"' : "") + '></i>'; }).join("") + '</div>' +
      '</section>';
    var row = document.getElementById("dscards");
    /* start on the next one to read, so nobody swipes past what they already did */
    var nx = row && row.querySelector(".dscard.next");
    if (row && nx) row.scrollLeft = Math.max(0, nx.offsetLeft - row.offsetLeft - 14);
    dragScroll(row);
  }

  /* ---- a mouse can drag the row on a computer, like the strips on Ohio Peer Supporter ---- */
  var dragged = false;
  function dragScroll(row) {
    if (!row || row._drag) return; row._drag = 1;
    var down = false, x0 = 0, s0 = 0;
    row.addEventListener("mousedown", function (e) { down = true; dragged = false; x0 = e.pageX; s0 = row.scrollLeft; row.classList.add("grab"); e.preventDefault(); });
    window.addEventListener("mousemove", function (e) { if (!down) return; var dx = e.pageX - x0; if (Math.abs(dx) > 5) dragged = true; row.scrollLeft = s0 - dx; });
    window.addEventListener("mouseup", function () { down = false; row.classList.remove("grab"); setTimeout(function () { dragged = false; }, 0); });
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

  /* ---- taps ---- */
  box.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-ds-add]")) { setFlag("on"); paint(); return; }
    if (t.closest("[data-ds-no]")) { setFlag("off"); paint(); return; }
    var fb = t.closest("[data-ds-fold]");
    if (fb) { foldSet(fb.getAttribute("data-ds-fold") === "1"); paint(); return; }
    var c = t.closest("[data-ds-id]");
    if (!c) return;
    if (dragged) { e.preventDefault(); return; }       /* the end of a mouse drag is not a tap */
    var id = c.getAttribute("data-ds-id"), it = D.byId(id);
    markOpened(id);
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
      }).catch(function () { paint(); });
      return;
    }
    if (++tries < 40) setTimeout(wait, 250);
  })();
  /* came back from a reading page, or the app was left open past midnight */
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") paint(); });
  setInterval(function () { var k = todayKey(); if (k !== paint._k) { paint._k = k; if (blob) openedNow = openedFrom(blob); paint(); } }, 60000);
  paint._k = todayKey();
  window.PorchDailyStack = { paint: paint };
})();

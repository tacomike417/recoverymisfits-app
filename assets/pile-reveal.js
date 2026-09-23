/* ===========================================================================
   THE SURVIVAL PILE REVEAL -- the newest card, big, once.

   HOW IT BEHAVES (Mike, 23 Sep 2026):
     * The day somebody earns a card, it opens big over whatever page they
       are on, like the coins do, on a dark screen with white sparkles.
     * ONLY THE NEWEST CARD. Somebody with years of history gets their newest
       one and nothing else -- no "41 cards added". The rest are sitting in
       the pile for them to find.
     * Under the card: the milestone, then the date. An X to close. That is
       all -- they can screenshot it, or save it properly from the pile.
     * A coin on the same day goes first. This waits until the coin is
       closed, then shows the card.
     * Account only, and off until the pile is switched on (or previewed),
       exactly like the pile page itself.

   Remembers what it has shown in rm_pile_seen (card code + date), so a
   holiday card fires again each new year and a card is never shown twice.

   Loaded by nav.js on every page. Needs assets/survival-pile.js, and loads
   it itself if the page has not.
   ======================================================================== */
(function () {
  "use strict";
  if (window.__rmPileReveal) return;
  window.__rmPileReveal = true;

  var ART = "/assets/survival-pile/cards/";
  var SEEN_KEY = "rm_pile_seen";

  function signedIn() {
    try { return !!localStorage.getItem("rm_account_v1"); } catch (e) { return false; }
  }
  function seen() { try { return localStorage.getItem(SEEN_KEY) || ""; } catch (e) { return ""; } }
  function markSeen(k) { try { localStorage.setItem(SEEN_KEY, k); } catch (e) {} }

  function needPile() {
    if (window.RMPile) return Promise.resolve(window.RMPile);
    return new Promise(function (ok) {
      var s = document.createElement("script");
      s.src = "/assets/survival-pile.js";
      s.onload = function () { ok(window.RMPile || null); };
      s.onerror = function () { ok(null); };
      document.head.appendChild(s);
    });
  }

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function milestone(e) {
    var c = e.card;
    if (c.kind === "start") return "That night...";
    if (c.kind === "misfitversary") return e.years + (e.years === 1 ? " year" : " years") + " a Misfit";
    if (c.kind === "holiday") return (c.unlocks || c.name || "") + " " + e.edition;
    return c.unlocks || "";
  }

  /* ---- styles --------------------------------------------------------------- */
  function styles() {
    if (document.getElementById("rm-pile-reveal-css")) return;
    var s = document.createElement("style");
    s.id = "rm-pile-reveal-css";
    s.textContent = [
      ".rm-pr{position:fixed;inset:0;z-index:10100;display:flex;flex-direction:column;align-items:center;justify-content:center;",
        "padding:24px 16px;background:rgba(6,6,5,.95);opacity:0;transition:opacity .35s ease;overflow:hidden}",
      ".rm-pr.on{opacity:1}",
      /* the soft white glow behind the card */
      ".rm-pr::before{content:'';position:absolute;left:50%;top:44%;width:130vmin;height:130vmin;transform:translate(-50%,-50%);",
        "background:radial-gradient(circle,rgba(255,255,255,.22) 0%,rgba(255,255,255,.07) 35%,rgba(255,255,255,0) 65%);pointer-events:none}",
      /* the sparkles */
      ".rm-pr-sp{position:absolute;inset:0;pointer-events:none}",
      ".rm-pr-sp i{position:absolute;display:block;border-radius:50%;background:#fff;",
        "box-shadow:0 0 6px 2px rgba(255,255,255,.85);opacity:0;animation:rmPrTw ease-in-out infinite}",
      ".rm-pr-sp b{position:absolute;display:block;color:#fff;font-weight:400;line-height:1;opacity:0;",
        "text-shadow:0 0 8px rgba(255,255,255,.9);animation:rmPrTw ease-in-out infinite}",
      "@keyframes rmPrTw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}",
      /* the card: no box around it */
      ".rm-pr-card{position:relative;width:min(84vw,420px);aspect-ratio:5/7;border-radius:14px;overflow:hidden;",
        "box-shadow:0 22px 60px rgba(0,0,0,.75),0 0 40px rgba(255,255,255,.18);transform:scale(.6) translateY(30px);",
        "transition:transform .6s cubic-bezier(.2,1.4,.4,1)}",
      ".rm-pr.on .rm-pr-card{transform:none}",
      ".rm-pr-card img{width:100%;height:100%;object-fit:cover;display:block}",
      ".rm-pr-badge{position:absolute;left:50%;bottom:.6%;transform:translateX(-50%);padding:3px 14px;border-radius:999px;",
        "background:#9b2b24;color:#f6ecd6;border:2px solid #d7b253;font-weight:700;font-size:17px;line-height:1.1;",
        "box-shadow:0 2px 6px rgba(0,0,0,.5)}",
      ".rm-pr-ms{position:relative;margin:22px 0 0;text-align:center;font-weight:800;font-size:22px;line-height:1.2;color:#f6ecd6}",
      ".rm-pr-when{position:relative;margin:6px 0 0;text-align:center;font-weight:700;font-size:12px;letter-spacing:1.6px;",
        "text-transform:uppercase;color:#d7b253}",
      ".rm-pr-x{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;z-index:2;display:grid;place-items:center;",
        "width:44px;height:44px;border-radius:50%;border:1px solid rgba(215,178,83,.45);background:rgba(14,14,13,.9);",
        "color:#f6ecd6;font-size:22px;cursor:pointer}",
      "@media (prefers-reduced-motion:reduce){.rm-pr-sp i,.rm-pr-sp b{animation:none;opacity:.6}",
        ".rm-pr-card{transition:none;transform:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  function sparkles(box) {
    var n = 70, h = "";
    for (var i = 0; i < n; i++) {
      var left = (Math.random() * 100).toFixed(1), top = (Math.random() * 100).toFixed(1);
      var dur = (1.6 + Math.random() * 2.4).toFixed(2), delay = (Math.random() * 3).toFixed(2);
      if (i % 7 === 0) {
        var fs = Math.round(10 + Math.random() * 14);
        h += '<b style="left:' + left + '%;top:' + top + '%;font-size:' + fs + 'px;animation-duration:' + dur +
             's;animation-delay:' + delay + 's">&#10022;</b>';
      } else {
        var sz = (1.5 + Math.random() * 3).toFixed(1);
        h += '<i style="left:' + left + '%;top:' + top + '%;width:' + sz + 'px;height:' + sz +
             'px;animation-duration:' + dur + 's;animation-delay:' + delay + 's"></i>';
      }
    }
    box.innerHTML = h;
  }

  /* ---- open / close ---------------------------------------------------------- */
  var openEl = null, pushed = false;

  function close() {
    if (!openEl) return;
    var el = openEl; openEl = null;
    el.classList.remove("on");
    setTimeout(function () { el.remove(); }, 380);
    document.documentElement.style.overflow = "";
    if (pushed) { pushed = false; try { history.back(); } catch (e) {} }
  }

  function show(e, P) {
    styles();
    var c = e.card;
    var el = document.createElement("div");
    el.className = "rm-pr";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "New card in your Survival Pile");

    var badge = c.kind === "holiday" ? e.edition : c.kind === "misfitversary" ? e.years : null;
    el.innerHTML =
      '<div class="rm-pr-sp"></div>' +
      '<button type="button" class="rm-pr-x" aria-label="Close">&times;</button>' +
      '<div class="rm-pr-card"><img src="' + ART + esc(c.code) + '.webp" alt="' + esc(c.name || "") + '">' +
        (badge != null ? '<span class="rm-pr-badge">' + esc(badge) + '</span>' : "") + '</div>' +
      '<p class="rm-pr-ms">' + esc(milestone(e)) + '</p>' +
      '<p class="rm-pr-when">' + esc(P.fmt(e.date)) + '</p>';
    sparkles(el.querySelector(".rm-pr-sp"));

    document.body.appendChild(el);
    openEl = el;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("on"); }); });

    el.querySelector(".rm-pr-x").addEventListener("click", close);
    /* Tapping the dark closes it; tapping the card does not. */
    el.addEventListener("click", function (ev) { if (ev.target === el) close(); });

    /* ONE STEP BACK, AND BACK NEVER LEAVES THE APP. */
    try { history.pushState({ rmPileReveal: 1 }, ""); pushed = true; } catch (err) { pushed = false; }
  }

  window.addEventListener("popstate", function () { if (openEl) { pushed = false; close(); } });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && openEl) close(); });

  /* ---- when it fires ----------------------------------------------------------- */
  function coinOpen() { return !!document.querySelector(".rm-coin-reveal"); }

  function whenCoinDone(fn) {
    /* Give coins.js its moment first, then wait for its reveal to close. */
    setTimeout(function tick() {
      if (coinOpen()) { setTimeout(tick, 400); return; }
      setTimeout(fn, 500);
    }, 1500);
  }

  function run() {
    if (!signedIn()) return;
    needPile().then(function (P) {
      if (!P) return;
      return P.load().then(function (cards) {
        if (!P.isOn(cards)) return;
        var sober = P.soberYMD();
        if (!sober) return;
        var list = P.earned(cards, sober, P.todayYMD(), P.joinedYMD());
        var e = list[0];
        if (!e || !e.card || !e.card.art) return;
        var key = e.card.code + "@" + e.date;
        if (seen() === key) return;
        whenCoinDone(function () {
          if (openEl || seen() === key) return;
          markSeen(key);
          show(e, P);
        });
      });
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();

  window.RMPileReveal = { close: close };
})();

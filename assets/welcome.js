/* ===========================================================================
   THE WELCOME DECK -- three cards that show somebody around the app.

   HOW IT BEHAVES (Mike, 24 Sep 2026):
     * The first time somebody with an account opens the app, this opens
       before anything else. Swipe through Welcome, Daily Stack, Survival Pile.
     * A NEW sign-up gets their first coin right after they close it. Everybody
       who was already here gets the deck once, starting today, and no coin
       repeat (coins.js already knows they have seen theirs).
     * IT TAKES PRECEDENCE OVER THE SURVIVAL PILE. No card pops up that day,
       and a card they earned that day is not saved up for tomorrow either --
       it is simply in their pile for them to find. One thing at a time.
     * Afterwards the deck lives in the Survival Pile under Your Misfitversaries,
       with their join date, and opens this same viewer. Never shareable.

   Remembers it has been shown in rm_welcome_seen. Account only.
   Loaded by nav.js on every page. window.RMWelcome.open() shows it on demand.
   ======================================================================== */
(function () {
  "use strict";
  if (window.RMWelcome) return;

  var CARDS = ["/assets/survival-pile/welcome/welcome-01.webp",
               "/assets/survival-pile/welcome/welcome-02.webp",
               "/assets/survival-pile/welcome/welcome-03.webp"];
  var NAMES = ["Welcome", "Daily Stack", "Survival Pile"];

  function signedIn() { try { return !!localStorage.getItem("rm_account_v1"); } catch (e) { return false; } }
  function seen() { try { return !!localStorage.getItem("rm_welcome_seen"); } catch (e) { return true; } }
  function todayLocal() {
    var d = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  /* The welcome owns today: no Survival Pile card pops up (pile-reveal reads
     rm_coin_day), and whatever card is newest right now is marked as already
     shown (rm_welcome_skip) so it does not jump out tomorrow either. */
  function claimTheDay() {
    try {
      localStorage.setItem("rm_welcome_seen", String(Date.now()));
      localStorage.setItem("rm_coin_day", todayLocal());
      localStorage.setItem("rm_welcome_skip", "1");
    } catch (e) {}
  }

  function styles() {
    if (document.getElementById("rm-welcome-css")) return;
    var s = document.createElement("style");
    s.id = "rm-welcome-css";
    s.textContent = [
      ".rm-welcome{position:fixed;inset:0;z-index:10200;display:flex;flex-direction:column;align-items:center;justify-content:center;",
        "background:rgba(6,6,5,.96);opacity:0;transition:opacity .3s ease}",
      ".rm-welcome.on{opacity:1}",
      ".rm-welcome::before{content:'';position:absolute;left:50%;top:45%;width:120vmin;height:120vmin;transform:translate(-50%,-50%);",
        "background:radial-gradient(circle,rgba(216,180,91,.16) 0%,rgba(216,180,91,0) 60%);pointer-events:none}",
      ".rm-wl-x{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;z-index:2;display:grid;place-items:center;",
        "width:44px;height:44px;border-radius:50%;border:1px solid rgba(215,178,83,.45);background:rgba(14,14,13,.9);",
        "color:#f6ecd6;font-size:22px;cursor:pointer}",
      ".rm-wl-track{position:relative;width:100%;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;",
        "-webkit-overflow-scrolling:touch;scrollbar-width:none}",
      ".rm-wl-track::-webkit-scrollbar{display:none}",
      ".rm-wl-slide{flex:0 0 100%;display:flex;justify-content:center;scroll-snap-align:center;padding:8px 0}",
      ".rm-wl-slide img{width:min(82vw,400px,calc((100vh - 170px) * 5 / 7));height:auto;aspect-ratio:5/7;border-radius:14px;",
        "box-shadow:0 20px 55px rgba(0,0,0,.75);user-select:none;-webkit-user-drag:none}",
      ".rm-wl-dots{position:relative;display:flex;gap:10px;margin-top:18px}",
      ".rm-wl-dots button{width:11px;height:11px;padding:0;border-radius:50%;border:1.5px solid #d7b253;background:transparent;cursor:pointer}",
      ".rm-wl-dots button[aria-current='true']{background:#d7b253}",
      ".rm-wl-hint{position:relative;margin:12px 0 0;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:1.6px;",
        "text-transform:uppercase;color:rgba(241,230,207,.6)}",
      "@media (prefers-reduced-motion:reduce){.rm-welcome{transition:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  var openEl = null, pushed = false;

  function close() {
    if (!openEl) return;
    var el = openEl; openEl = null;
    el.classList.remove("on");
    setTimeout(function () { el.remove(); }, 320);
    document.documentElement.style.overflow = "";
    window.__rmWelcomePending = false;
    if (pushed) { pushed = false; try { history.back(); } catch (e) {} }
  }

  function open(start) {
    if (openEl) return;
    styles();
    var el = document.createElement("div");
    el.className = "rm-welcome";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Welcome to Recovery Misfits");
    el.innerHTML =
      '<button type="button" class="rm-wl-x" aria-label="Close">&times;</button>' +
      '<div class="rm-wl-track">' + CARDS.map(function (src, i) {
        return '<div class="rm-wl-slide"><img src="' + src + '" alt="' + NAMES[i] + '" draggable="false"></div>';
      }).join("") + '</div>' +
      '<div class="rm-wl-dots">' + CARDS.map(function (s, i) {
        return '<button type="button" aria-label="Card ' + (i + 1) + ' of 3"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
      }).join("") + '</div>' +
      '<p class="rm-wl-hint">Swipe for more</p>';
    document.body.appendChild(el);
    openEl = el;
    document.documentElement.style.overflow = "hidden";

    var track = el.querySelector(".rm-wl-track");
    var dots = el.querySelectorAll(".rm-wl-dots button");
    var hint = el.querySelector(".rm-wl-hint");
    function at() { return Math.round(track.scrollLeft / (track.clientWidth || 1)); }
    function go(i) { track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" }); }
    track.addEventListener("scroll", function () {
      var i = at();
      dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      hint.textContent = i === CARDS.length - 1 ? "Tap X when you're ready" : "Swipe for more";
    }, { passive: true });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); }); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(Math.min(at() + 1, CARDS.length - 1));
      if (e.key === "ArrowLeft") go(Math.max(at() - 1, 0));
    });
    if (start) requestAnimationFrame(function () { track.scrollLeft = start * track.clientWidth; });

    el.querySelector(".rm-wl-x").addEventListener("click", close);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("on"); }); });
    /* ONE STEP BACK, AND BACK NEVER LEAVES THE APP. */
    try { history.pushState({ rmWelcome: 1 }, ""); pushed = true; } catch (e) { pushed = false; }
  }

  window.addEventListener("popstate", function () { if (openEl) { pushed = false; close(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openEl) close(); });

  window.RMWelcome = { open: open, close: close, cards: CARDS };

  /* FIRST TIME WITH AN ACCOUNT: open it, and claim the day. */
  function run() {
    if (!signedIn() || seen()) { window.__rmWelcomePending = false; return; }
    claimTheDay();
    open(0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();

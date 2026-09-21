(function () {
  const mount = document.getElementById("rm-topbar");
  if (!mount) return;

  /* =======================================================================
     THE BUILD BADGE -- OFF BY DEFAULT, AND SWITCHED ON FROM THE PHONE.

     It answers one question: standing in a parking lot with a phone, am I
     looking at today's deploy or a copy the browser kept from twenty
     minutes ago. Nobody using the app needs that, so it stays hidden.

     The catch is that you need it exactly when shipping a change to bring
     it back is the slow part. So it is not deleted, it is switched:

         recoverymisfits.org/?ver=1     turn it on, and it stays on
         recoverymisfits.org/?ver=0     turn it off again

     The switch lives in this browser's own storage, so it is on for that
     one phone and invisible to everybody else -- including you on a
     different device. Bump RM_VERSION on any deploy worth telling apart;
     tapping the badge reloads past the cache.
     ==================================================================== */
  const RM_VERSION = "v435";

  const SHOW_VER = (function () {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("ver") === "1") localStorage.setItem("rm_show_ver", "1");
      if (q.get("ver") === "0") localStorage.removeItem("rm_show_ver");
      return localStorage.getItem("rm_show_ver") === "1";
    } catch (e) {
      /* private mode, storage blocked -- the badge is a debugging nicety
         and is not worth throwing on somebody's phone over. */
      return false;
    }
  })();

  /* -------------------------
     Google Analytics (GA4)
  ------------------------- */
  const GA_ID = "G-CYJ3W1HQ10";

  function loadGAOnce() {
    if (window.__rm_ga_loaded) return;
    window.__rm_ga_loaded = true;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  loadGAOnce();

  /* -------------------------
     Inject styles once
  ------------------------- */
  if (!document.getElementById("rm-topbar-styles")) {
    const style = document.createElement("style");
    style.id = "rm-topbar-styles";
    style.textContent = `
      #rm-topbar{
        position: sticky;
        top: 0;
        z-index: 9000;
        background:#0e0e10;
        border-bottom:1px solid rgba(255,255,255,.06);
        box-shadow:0 2px 10px rgba(0,0,0,.28);
        font-family:Roboto,Arial,sans-serif;
      }

      .rm-topbar-inner{
        max-width:980px;
        margin:0 auto;
        padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      /* The build badge -- see the switch at the top of this file. */
      .rm-ver{
        position:absolute;
        top:calc(6px + env(safe-area-inset-top, 0px));
        right:8px;
        z-index:2;
        padding:3px 7px;
        border-radius:6px;
        border:1px solid rgba(215,178,83,.34);
        background:rgba(215,178,83,.10);
        color:#d7b253;
        font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
        letter-spacing:.6px;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }
      .rm-ver:active{background:rgba(215,178,83,.22)}

      .rm-logo{
        width:min(80%, 320px);
        height:auto;
        display:block;
        user-select:none;
      }

/* -------------------------
         Install prompt (mobile only)
         Clipped to start right at the topbar's bottom edge so it
         unrolls out from underneath it — the topbar itself never moves.
      ------------------------- */
      #rm-install-scrim{
        position:fixed;
        top:var(--rm-topbar-h, 64px);
        left:0;
        right:0;
        bottom:0;
        background:rgba(0,0,0,.35);
        z-index:10000;
        opacity:0;
        pointer-events:none;
        transition:opacity .25s ease;
      }
      #rm-install-scrim.rm-open{
        opacity:1;
        pointer-events:auto;
      }

      #rm-install-wrap{
        position:fixed;
        top:var(--rm-topbar-h, 64px);
        left:0;
        right:0;
        z-index:10001;
        overflow:hidden;
        max-height:0;
        transition:max-height .32s cubic-bezier(.32,.72,0,1);
      }
      /* THE WALKTHROUGH IS TALLER THAN THE OLD ONE-LINER, and 280px cut the
         buttons clean off the bottom -- on the exact screen that is meant to
         be the easiest in the app. It gets the screen below the topbar, and
         scrolls inside itself on a short phone rather than hiding the way
         out. */
      #rm-install-wrap.rm-open{
        max-height:calc(100dvh - var(--rm-topbar-h, 64px));
        overflow-y:auto;
        -webkit-overflow-scrolling:touch;
      }

      #rm-install-sheet{
        background:#232326;
        color:#fff;
        font-family:Roboto,Arial,sans-serif;
        padding:16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
        border-radius:0 0 18px 18px;
        box-shadow:0 8px 24px rgba(0,0,0,.35);
      }

      .rm-install-row{
        display:flex;
        align-items:center;
        gap:12px;
      }

      .rm-install-icon{
        width:44px;
        height:44px;
        border-radius:10px;
        flex:0 0 auto;
        display:block;
        border:1px solid rgba(255,255,255,.15);
        object-fit:cover;
      }

      .rm-install-copy{
        flex:1 1 auto;
        min-width:0;
      }

      .rm-install-title{
        font-weight:1000;
        font-size:14px;
        line-height:1.25;
      }

      .rm-install-sub{
        font-size:12px;
        color:#b8b8bd;
        font-weight:700;
        margin-top:2px;
        line-height:1.3;
      }

      .rm-install-actions{
        display:flex;
        align-items:center;
        gap:8px;
        margin-top:14px;
      }

      /* THE STEPS. Bigger type than the rest of this app on purpose: this
         is read once, by somebody who may be shaky, tired, and holding the
         phone at arm's length. Nothing here is decorative. */
      .rm-steps{
        list-style:none;
        margin:14px 0 4px;
        padding:0;
        display:flex;
        flex-direction:column;
        gap:12px;
      }

      .rm-steps li{
        display:flex;
        align-items:flex-start;
        gap:11px;
        font-size:15px;
        line-height:1.45;
        color:#f0f0f2;
      }

      .rm-step-n{
        flex:0 0 auto;
        width:26px;
        height:26px;
        border-radius:50%;
        background:#d6b36a;
        color:#111;
        font-weight:1000;
        font-size:14px;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .rm-step-t{ flex:1 1 auto; }
      .rm-step-t b{ color:#fff; }

      /* The icon they are hunting for, inline in the sentence, at the size
         it really appears. A name alone ("the Share icon") is no help to
         somebody who has never gone looking for it. */
      .rm-step-ico{
        display:inline-flex;
        vertical-align:-6px;
        width:26px;
        height:26px;
        margin:0 2px;
        padding:3px;
        border-radius:7px;
        background:rgba(255,255,255,.12);
        color:#fff;
      }
      .rm-step-ico svg{ width:100%; height:100%; }

      .rm-point{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        margin-top:12px;
        color:#d6b36a;
        font-size:13px;
        font-weight:900;
      }

      .rm-point-arrow{
        font-size:20px;
        line-height:1;
        animation:rm-nudge 1.6s ease-in-out infinite;
      }

      @keyframes rm-nudge{
        0%,100%{ transform:translateY(0); }
        50%{ transform:translateY(5px); }
      }

      @media (prefers-reduced-motion:reduce){
        .rm-point-arrow{ animation:none; }
      }

      .rm-install-cta{
        flex:1 1 auto;
        text-align:center;
        padding:11px 14px;
        border-radius:999px;
        background:#fff;
        color:#111;
        font-weight:1000;
        font-size:13px;
        border:none;
        cursor:pointer;
        text-decoration:none;
        display:block;
      }

      .rm-install-dismiss{
        flex:0 0 auto;
        padding:11px 16px;
        border-radius:999px;
        background:transparent;
        color:#b8b8bd;
        font-weight:900;
        font-size:13px;
        border:1px solid rgba(255,255,255,.2);
        cursor:pointer;
      }
    `;
    document.head.appendChild(style);
  }

  /* -------------------------
     Build top bar
  ------------------------- */
  /* THE UPDATE BANNER IS GONE, and so is updates.html. It announced changes
     to an app whose changes speak for themselves, and it cost every visitor
     a fetch of a whole page on every load to find out there was nothing to
     say. The Updates tab it fed became SHARE -- see nav.js. */
  mount.innerHTML = `
    <div class="rm-topbar-inner">
      <img class="rm-logo" src="/PWA-header.png" alt="Recovery Misfits" />
    </div>
    ${SHOW_VER ? `<button class="rm-ver" type="button" id="rmVer"
            title="Tap to reload past the cache">${RM_VERSION}</button>` : ""}
  `;

  /* A cache-busting query on the reload, so the badge is also the answer to
     "am I actually seeing the new one". Absent unless the switch is on. */
  const verBtn = document.getElementById("rmVer");
  if (verBtn) {
    verBtn.addEventListener("click", () => {
      const u = new URL(location.href);
      u.searchParams.set("v", Date.now().toString(36));
      location.replace(u.toString());
    });
  }

  /* -------------------------
     Keep the install sheet's top edge pinned exactly to the
     topbar's real rendered height, which varies with safe-area insets.
  ------------------------- */
  function syncTopbarHeightVar() {
    const h = mount.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--rm-topbar-h", h + "px");
  }
  syncTopbarHeightVar();
  window.addEventListener("resize", syncTopbarHeightVar);

  /* -------------------------
     Platform detection
  ------------------------- */
  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  /* WHICH BROWSER MATTERS MORE THAN WHICH PHONE ON AN IPHONE.
     Add to Home Screen exists ONLY in Safari. Chrome on an iPhone does not
     have it. Neither does the browser inside Facebook, Instagram or
     Messenger -- and a link shared in a group chat opens in exactly those.
     Telling somebody to "tap Share, then Add to Home Screen" when the
     option is not there is how a person decides the app is broken and
     themselves along with it. So those get sent to Safari first. */
  const iosInApp = isIOS && /fban|fbav|fb_iab|instagram|messenger|line\/|twitter|micromessenger|snapchat|tiktok/i.test(ua);
  const iosOtherBrowser = isIOS && /crios|fxios|edgios|opt\/|duckduckgo|brave/i.test(ua);
  const iosSafari = isIOS && !iosInApp && !iosOtherBrowser;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.tacomike.recoverymisfits&hl=en_US";

  const APP_ICON_URL = "/icon-192.png";

  /* -------------------------
     Install sheet (mobile only)
  ------------------------- */
  const DISMISS_KEY = "rm_install_sheet_dismissed_at";
  const DISMISS_DAYS = 14;

  function recentlyDismissed() {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!dismissedAt) return false;
    const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
  }

  function buildInstallSheet() {
    const scrim = document.createElement("div");
    scrim.id = "rm-install-scrim";

    const wrap = document.createElement("div");
    wrap.id = "rm-install-wrap";

    const sheet = document.createElement("div");
    sheet.id = "rm-install-sheet";
    wrap.appendChild(sheet);

    if (isAndroid) {
      sheet.innerHTML = `
        <div class="rm-install-row">
          <img class="rm-install-icon" src="${APP_ICON_URL}" alt="" />
          <div class="rm-install-copy">
            <div class="rm-install-title">Get the free Recovery Misfits app</div>
            <div class="rm-install-sub">Faster, works offline, one tap from your home screen.</div>
          </div>
        </div>
        <div class="rm-install-actions">
          <a class="rm-install-cta" id="rm-install-cta" href="${PLAY_STORE_URL}">Install</a>
          <button class="rm-install-dismiss" id="rm-install-dismiss">Not now</button>
        </div>
      `;
    } else if (isIOS && !iosSafari) {
      /* WRONG BROWSER. One job here: get them into Safari. Nothing about
         home screens yet -- that instruction is useless until they are
         somewhere it can work. */
      sheet.innerHTML = `
        <div class="rm-install-row">
          <img class="rm-install-icon" src="${APP_ICON_URL}" alt="" />
          <div class="rm-install-copy">
            <div class="rm-install-title">Open this in Safari first</div>
            <div class="rm-install-sub">This browser can&rsquo;t save apps to your home screen. Safari can.</div>
          </div>
        </div>
        <ol class="rm-steps">
          <li><span class="rm-step-n">1</span><span class="rm-step-t"><b>Copy the link</b> with the button below.</span></li>
          <li><span class="rm-step-n">2</span><span class="rm-step-t"><b>Open Safari</b> &mdash; the blue compass on your home screen.</span></li>
          <li><span class="rm-step-n">3</span><span class="rm-step-t"><b>Paste it</b> in the bar at the top and go.</span></li>
        </ol>
        <div class="rm-install-actions">
          <button class="rm-install-cta" id="rm-install-copy">Copy the link</button>
          <button class="rm-install-dismiss" id="rm-install-dismiss">Not now</button>
        </div>
      `;
    } else if (isIOS) {
      /* THE WALKTHROUGH. Three steps, each with the icon they are hunting
         for drawn right there, because "the Share icon" means nothing to
         somebody who has never gone looking for it. The arrow at the foot
         points at the real button, which on an iPhone lives at the bottom
         of the screen. */
      sheet.innerHTML = `
        <div class="rm-install-row">
          <img class="rm-install-icon" src="${APP_ICON_URL}" alt="" />
          <div class="rm-install-copy">
            <div class="rm-install-title">Put Recovery Misfits on your phone</div>
            <div class="rm-install-sub">Takes about ten seconds. It&rsquo;s free, and it works with no signal.</div>
          </div>
        </div>

        <ol class="rm-steps">
          <li>
            <span class="rm-step-n">1</span>
            <span class="rm-step-t">Tap this button at the bottom of your screen
              <span class="rm-step-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 15.5V3.5"/><path d="M8.2 7.1 12 3.3l3.8 3.8"/>
                  <path d="M6 11.5H5a1.5 1.5 0 0 0-1.5 1.5v6.5A1.5 1.5 0 0 0 5 21h14a1.5 1.5 0 0 0 1.5-1.5V13a1.5 1.5 0 0 0-1.5-1.5h-1"/>
                </svg>
              </span>
            </span>
          </li>
          <li>
            <span class="rm-step-n">2</span>
            <span class="rm-step-t">Scroll down the list and tap
              <b>Add to Home Screen</b>
              <span class="rm-step-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8.2v7.6M8.2 12h7.6"/>
                </svg>
              </span>
            </span>
          </li>
          <li>
            <span class="rm-step-n">3</span>
            <span class="rm-step-t">Tap <b>Add</b> in the top corner. Done &mdash; it&rsquo;s on your home screen with the rest of your apps.</span>
          </li>
        </ol>

        <div class="rm-point" aria-hidden="true">
          <span class="rm-point-arrow">&darr;</span>
          <span class="rm-point-text">the button is down there</span>
        </div>

        <div class="rm-install-actions">
          <button class="rm-install-cta" id="rm-install-cta">Got it</button>
          <button class="rm-install-dismiss" id="rm-install-dismiss">Not now</button>
        </div>
      `;
    } else {
      return null;
    }

    document.body.appendChild(scrim);
    document.body.appendChild(wrap);
    return { scrim, wrap };
  }

  function closeInstallSheet(scrim, wrap) {
    wrap.classList.remove("rm-open");
    scrim.classList.remove("rm-open");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setTimeout(() => {
      scrim.remove();
      wrap.remove();
    }, 350);
  }

  /* `force` is the Share tab asking for it by name. A no last Tuesday
     silences the sheet that comes up on its own, never the one somebody
     deliberately went looking for. */
  function initInstallSheet(force) {
    if (isStandalone) return;
    if (!isAndroid && !isIOS) return;
    if (!force && recentlyDismissed()) return;

    const built = buildInstallSheet();
    if (!built) return;
    const { scrim, wrap } = built;

    // Re-confirm the topbar height right before showing, in case the
    // the topbar's height can settle a frame or two after first paint.
    syncTopbarHeightVar();

    // Slide in after a short delay so it feels intentional, not a flash-on-load.
    setTimeout(() => {
      wrap.classList.add("rm-open");
      scrim.classList.add("rm-open");
    }, 700);

    const cta = document.getElementById("rm-install-cta");
    const dismissBtn = document.getElementById("rm-install-dismiss");

    if (isAndroid && cta) {
      cta.addEventListener("click", () => {
        if (window.gtag) window.gtag("event", "play_store_install_click");
        closeInstallSheet(scrim, wrap);
      });
    }

    if (isIOS && cta) {
      cta.addEventListener("click", () => closeInstallSheet(scrim, wrap));
    }

    /* Wrong browser: hand them the address so there is nothing to type.
       It says so on the button afterward, because a button that silently
       did something gets pressed again and again. */
    const copyBtn = document.getElementById("rm-install-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const url = "https://recoverymisfits.org/";
        try {
          await navigator.clipboard.writeText(url);
          copyBtn.textContent = "Copied \u2014 now open Safari";
        } catch (_) {
          copyBtn.textContent = url;
        }
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => closeInstallSheet(scrim, wrap));
    }

    scrim.addEventListener("click", () => closeInstallSheet(scrim, wrap));
  }

  initInstallSheet();

  /* ASKED FOR BY NAME. The sheet comes up on its own once, then stays quiet
     for a while -- but somebody who tapped "Not now" in the car park and
     wants it later needs a way back to it. The Share tab calls this. */
  window.RMInstall = {
    open: function () {
      if (isStandalone) return false;         /* already installed */
      if (!isAndroid && !isIOS) return false; /* a desktop has no home screen */
      const existing = document.getElementById("rm-install-wrap");
      if (existing) {
        existing.classList.add("rm-open");
        const sc = document.getElementById("rm-install-scrim");
        if (sc) sc.classList.add("rm-open");
        return true;
      }
      initInstallSheet(true);
      return true;
    },
    canInstall: function () {
      return !isStandalone && (isAndroid || isIOS);
    }
  };

  window.addEventListener("appinstalled", () => {
    if (window.gtag) window.gtag("event", "pwa_installed");
  });
})();
(function () {
  const mount = document.getElementById("rm-topbar");
  if (!mount) return;

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

      .rm-logo{
        width:min(80%, 320px);
        height:auto;
        display:block;
        user-select:none;
      }

      .rm-update-dot{
        width:8px;
        height:8px;
        border-radius:50%;
        background:#ff3b30;
        display:inline-block;
        vertical-align:middle;
      }

      .rm-update-banner{
        max-width:980px;
        margin:0 auto;
        padding:10px 12px 12px;
      }

      .rm-update-banner-inner{
        border:1px solid #f0d98c;
        border-radius:14px;
        background:#fff8cc;
        padding:10px 12px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      }

      .rm-banner-text{
        font-size:12px;
        color:#333;
        font-weight:900;
        line-height:1.3;
      }

      .rm-banner-text small{
        display:block;
        font-size:10px;
        color:#666;
        font-weight:900;
        letter-spacing:.05em;
        text-transform:uppercase;
      }

      .rm-banner-close{
        border:1px solid rgba(0,0,0,.2);
        background:#111;
        color:#fff;
        border-radius:8px;
        padding:6px 10px;
        font-size:11px;
        font-weight:1000;
        cursor:pointer;
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
      #rm-install-wrap.rm-open{
        max-height:280px;
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
  mount.innerHTML = `
    <div class="rm-topbar-inner">
      <img class="rm-logo" src="/PWA-header.png" alt="Recovery Misfits" />
    </div>

    <div class="rm-update-banner" id="rm-update-banner" style="display:none;">
      <div class="rm-update-banner-inner">
        <div class="rm-banner-text" id="rm-banner-text">
          <small>update:</small>
        </div>
        <button class="rm-banner-close" id="rm-banner-close">Close</button>
      </div>
    </div>
  `;

  const bannerWrap = document.getElementById("rm-update-banner");
  const bannerText = document.getElementById("rm-banner-text");
  const bannerClose = document.getElementById("rm-banner-close");

  /* -------------------------
     Keep the install sheet's top edge pinned exactly to the
     topbar's real rendered height (varies with safe-area insets,
     and grows when the update banner is showing).
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
    } else if (isIOS) {
      sheet.innerHTML = `
        <div class="rm-install-row">
          <img class="rm-install-icon" src="${APP_ICON_URL}" alt="" />
          <div class="rm-install-copy">
            <div class="rm-install-title">Add Recovery Misfits to your Home Screen</div>
            <div class="rm-install-sub">Tap the Share icon below, then "Add to Home Screen."</div>
          </div>
        </div>
        <div class="rm-install-actions">
          <button class="rm-install-cta" id="rm-install-cta">Got it</button>
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

  function initInstallSheet() {
    if (isStandalone) return;
    if (!isAndroid && !isIOS) return;
    if (recentlyDismissed()) return;

    const built = buildInstallSheet();
    if (!built) return;
    const { scrim, wrap } = built;

    // Re-confirm the topbar height right before showing, in case the
    // update banner rendered in between and grew the topbar.
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

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => closeInstallSheet(scrim, wrap));
    }

    scrim.addEventListener("click", () => closeInstallSheet(scrim, wrap));
  }

  initInstallSheet();

  window.addEventListener("appinstalled", () => {
    if (window.gtag) window.gtag("event", "pwa_installed");
  });

  /* -------------------------
     Update loader
  ------------------------- */
  async function loadLatestUpdate() {
    try {
      const res = await fetch("./updates.html", { cache: "no-store" });
      if (!res.ok) return null;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const marker = doc.getElementById("rm-update-marker");
      if (!marker) return null;

      return {
        id: marker.getAttribute("data-update-id") || "",
        title: marker.getAttribute("data-update-title") || "",
        banner: marker.getAttribute("data-update-banner") || "",
        date: marker.getAttribute("data-update-date") || ""
      };
    } catch {
      return null;
    }
  }

  (async function initUpdatesUI() {
    const update = await loadLatestUpdate();
    if (!update || !update.id) return;

    const dismissedKey = "rm_dismissed_update_banner_id";
    const dismissedId = localStorage.getItem(dismissedKey) || "";

    if (dismissedId === update.id) return;

    // Auto-expire the banner after 14 days from its posted date, even if
    // nobody ever clicks Close, so it can't linger indefinitely.
    const BANNER_EXPIRE_DAYS = 14;
    if (update.date) {
      const postedAt = new Date(update.date + "T00:00:00");
      if (!isNaN(postedAt.getTime())) {
        const elapsedDays = (Date.now() - postedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (elapsedDays > BANNER_EXPIRE_DAYS) return;
      }
    }

    bannerText.innerHTML =
      "<small>update:</small> " + (update.banner || update.title);

    bannerWrap.style.display = "block";
    syncTopbarHeightVar();

    bannerClose.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      bannerWrap.style.display = "none";
      localStorage.setItem(dismissedKey, update.id);
    });

    bannerWrap.addEventListener("click", (e) => {
      if (e.target && e.target.id === "rm-banner-close") return;
      window.location.href = "./updates.html";
    });
  })();
})();
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
        background:#fff;
        border-bottom:1px solid rgba(0,0,0,.12);
        font-family:Roboto,Arial,sans-serif;
      }

      .rm-topbar-inner{
        max-width:980px;
        margin:0 auto;
        padding:10px 12px;
        display:grid;
        grid-template-columns: 1fr auto 1fr;
        align-items:center;
        gap:10px;
      }

      .rm-left{
        display:flex;
        align-items:center;
        justify-content:flex-start;
        min-height:36px;
      }

      .rm-right{
        display:flex;
        align-items:center;
        justify-content:flex-end;
        min-height:36px;
      }

      .rm-brand{
        text-align:center;
        line-height:1.05;
        user-select:none;
      }

      .rm-brand-title{
        font-weight:1000;
        font-size:16px;
        letter-spacing:.2px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
      }

      .rm-brand-sub{
        margin-top:3px;
        font-size:12px;
        color:#666;
        font-weight:900;
        letter-spacing:.1px;
      }

      .rm-brand-sub.small{
        font-size:11px;
        color:#888;
      }

      .rm-install-btn{
        padding:8px 12px;
        border-radius:999px;
        border:1px solid rgba(0,0,0,.18);
        background:#111;
        color:#fff;
        font-weight:1000;
        cursor:pointer;
        font-size:12px;
        white-space:nowrap;
      }

      .rm-ios-note{
        font-size:12px;
        color:#111;
        font-weight:900;
        line-height:1.15;
      }

      .rm-ios-note span{
        display:block;
        color:#666;
        font-weight:900;
        margin-top:2px;
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
    `;
    document.head.appendChild(style);
  }

  /* -------------------------
     Build top bar
  ------------------------- */
  mount.innerHTML = `
    <div class="rm-topbar-inner">
      <div class="rm-left" id="rm-left"></div>

      <div class="rm-brand">
        <div class="rm-brand-title" id="rm-brand-title">Recovery Misfits v2</div>
        <div class="rm-brand-sub">Free recovery tools</div>
        <div class="rm-brand-sub small">No account. No spam. Always free.</div>
      </div>

      <div class="rm-right"></div>
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

  const left = document.getElementById("rm-left");
  const bannerWrap = document.getElementById("rm-update-banner");
  const bannerText = document.getElementById("rm-banner-text");
  const bannerClose = document.getElementById("rm-banner-close");
  const brandTitle = document.getElementById("rm-brand-title");

  /* -------------------------
     Platform detection
  ------------------------- */
  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  let deferredPrompt = null;

  function showIOSInstructions() {
    left.innerHTML = `
      <div class="rm-ios-note">
        Install on iPhone:
        <span>Safari → Share → Add to Home Screen</span>
      </div>
    `;
  }

  function showInstallButton() {
    left.innerHTML = `
      <button class="rm-install-btn" id="rm-install-btn">Install free app</button>
    `;
    document.getElementById("rm-install-btn").addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      left.innerHTML = "";
    });
  }

  if (!isStandalone) {
    if (isIOS) {
      showIOSInstructions();
    } else {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
      });
    }
  }

  window.addEventListener("appinstalled", () => {
    left.innerHTML = "";
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
        banner: marker.getAttribute("data-update-banner") || ""
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

    bannerText.innerHTML =
      "<small>update:</small> " + (update.banner || update.title);

    bannerWrap.style.display = "block";

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

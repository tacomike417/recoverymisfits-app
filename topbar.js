(function () {
  const mount = document.getElementById("rm-topbar");
  if (!mount) return;

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
        grid-template-columns: 1fr auto 1fr; /* left / centered brand / right */
        align-items:center;
        gap:10px;
      }

      .rm-left{
        display:flex;
        align-items:center;
        gap:10px;
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

      .rm-install-btn:disabled{
        opacity:.5;
        cursor:default;
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

      /* Banner that drops under the top bar */
      .rm-update-banner{
        max-width:980px;
        margin:0 auto;
        padding:10px 12px 12px;
      }

      .rm-update-banner-inner{
        border:1px solid rgba(0,0,0,.12);
        border-radius:14px;
        background:#fff;
        box-shadow:0 1px 0 rgba(0,0,0,.03);
        padding:12px 12px;
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
      }

      .rm-banner-text{
        font-weight:950;
        color:#111;
        line-height:1.25;
        font-size:13px;
      }

      .rm-banner-text small{
        display:block;
        margin-top:4px;
        font-size:12px;
        color:#666;
        font-weight:900;
      }

      .rm-banner-close{
        border:1px solid rgba(0,0,0,.18);
        background:#111;
        color:#fff;
        width:30px;
        height:30px;
        border-radius:10px;
        cursor:pointer;
        font-weight:1000;
        line-height:28px;
        text-align:center;
        flex:0 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  /* -------------------------
     Build top bar shell
  ------------------------- */
  mount.innerHTML = `
    <div class="rm-topbar-inner">
      <div class="rm-left" id="rm-left"></div>

      <div class="rm-brand" id="rm-brand">
        <div class="rm-brand-title" id="rm-brand-title">Recovery Misfits v2</div>
        <div class="rm-brand-sub">Free recovery tools</div>
      </div>

      <div class="rm-right" id="rm-right"></div>
    </div>

    <div class="rm-update-banner" id="rm-update-banner" style="display:none;">
      <div class="rm-update-banner-inner">
        <div class="rm-banner-text" id="rm-banner-text"></div>
        <button class="rm-banner-close" id="rm-banner-close" aria-label="Close">×</button>
      </div>
    </div>
  `;

  const left = document.getElementById("rm-left");
  const right = document.getElementById("rm-right");
  const bannerWrap = document.getElementById("rm-update-banner");
  const bannerText = document.getElementById("rm-banner-text");
  const bannerClose = document.getElementById("rm-banner-close");
  const brandTitle = document.getElementById("rm-brand-title");

  bannerClose.addEventListener("click", () => {
    bannerWrap.style.display = "none";
  });

  /* -------------------------
     Detect platform
  ------------------------- */
  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  let deferredPrompt = null;

  /* -------------------------
     Install UI
  ------------------------- */
  function showIOSInstructions() {
    // iOS doesn’t support beforeinstallprompt. This is the “easy” version.
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
  });

  /* -------------------------
     Pull latest update from updates.html and show banner
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
    } catch (err) {
      return null;
    }
  }

  /* -------------------------
     Update dot + banner (static for now)
  ------------------------- */
  (async function initUpdatesUI() {
    const update = await loadLatestUpdate();
    if (!update || !update.id) return;

    // Show banner (static; user closes it)
    const bannerLine = update.banner || "New update available.";
    const titleLine = update.title || "";
    bannerText.innerHTML = "";
    bannerText.appendChild(document.createTextNode(bannerLine));
    if (titleLine) {
      const sm = document.createElement("small");
      sm.textContent = titleLine;
      bannerText.appendChild(sm);
    }
    bannerWrap.style.display = "block";

    // Show update dot if unseen
    const lastSeen = localStorage.getItem("lastSeenUpdateId") || "";
    if (lastSeen !== update.id) {
      const dot = document.createElement("span");
      dot.className = "rm-update-dot";
      brandTitle.appendChild(dot);
    }

    // Optional: clicking the banner takes you to Updates
    bannerWrap.addEventListener("click", (e) => {
      // Don’t navigate when they hit the close button
      if (e.target && e.target.id === "rm-banner-close") return;
      window.location.href = "./updates.html";
    });
  })();
})();

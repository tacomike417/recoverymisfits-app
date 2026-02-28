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
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
      }

      .rm-brand{
        font-weight:1000;
        font-size:16px;
        letter-spacing:.2px;
      }

      .rm-install-btn{
        padding:8px 12px;
        border-radius:999px;
        border:1px solid rgba(0,0,0,.18);
        background:#111;
        color:#fff;
        font-weight:900;
        cursor:pointer;
        font-size:12px;
      }

      .rm-install-btn:disabled{
        opacity:.5;
        cursor:default;
      }

      .rm-update-dot{
        width:8px;
        height:8px;
        border-radius:50%;
        background:#ff3b30;
        display:inline-block;
        margin-left:6px;
        vertical-align:middle;
      }

      .rm-ios-note{
        font-size:12px;
        color:#666;
        font-weight:800;
      }
    `;
    document.head.appendChild(style);
  }

  /* -------------------------
     Build top bar
  ------------------------- */
  mount.innerHTML = `
    <div class="rm-topbar-inner">
      <div class="rm-brand" id="rm-brand">
        Recovery Misfits
      </div>
      <div id="rm-install-wrap"></div>
    </div>
  `;

  const installWrap = document.getElementById("rm-install-wrap");

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
     Update marker indicator
  ------------------------- */
  const marker = document.getElementById("rm-update-marker");
  const brand = document.getElementById("rm-brand");

  if (marker) {
    const updateId = marker.getAttribute("data-update-id");
    const lastSeen = localStorage.getItem("lastSeenUpdateId");

    if (updateId && lastSeen !== updateId) {
      const dot = document.createElement("span");
      dot.className = "rm-update-dot";
      brand.appendChild(dot);
    }
  }

  /* -------------------------
     Install logic
  ------------------------- */

  function showIOSInstructions() {
    installWrap.innerHTML = `
      <div class="rm-ios-note">Add to Home Screen in Safari</div>
    `;
  }

  function showInstallButton() {
    installWrap.innerHTML = `
      <button class="rm-install-btn" id="rm-install-btn">Install</button>
    `;
    document
      .getElementById("rm-install-btn")
      .addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        installWrap.innerHTML = "";
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

  /* -------------------------
     Hide install if already installed
  ------------------------- */
  window.addEventListener("appinstalled", () => {
    installWrap.innerHTML = "";
  });
})();

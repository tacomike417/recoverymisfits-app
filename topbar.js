// topbar.js — Recovery Misfits shared top bar + install detection (v2)
(() => {
  const mount = document.getElementById("rm-topbar");
  if (!mount) return;

  const STYLE_ID = "rm-topbar-style";

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Inject styles once
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .rm-topbar{
        position:sticky;
        top:0;
        z-index:9000;
        background:#fff;
        border-bottom:1px solid rgba(0,0,0,.12);
        font-family:Roboto,Arial,sans-serif;
      }

      .rm-topbar__row1{
        display:grid;
        grid-template-columns: 1fr auto 1fr;
        align-items:center;
        padding:10px 12px 6px;
      }

      .rm-title{
        text-align:center;
        font-weight:900;
        font-size:16px;
        letter-spacing:.01em;
      }

      .rm-topbar__actions{
        justify-self:end;
        display:flex;
        gap:8px;
        align-items:center;
      }

      .rm-topbar__row2{
        text-align:center;
        padding-bottom:10px;
      }

      .rm-mode{
        font-size:12px;
        opacity:.75;
      }

      .rm-btn{
        border:1px solid rgba(0,0,0,.18);
        background:#fff;
        color:#111;
        padding:8px 10px;
        border-radius:10px;
        font-weight:700;
        font-size:13px;
        cursor:pointer;
        line-height:1;
        white-space:nowrap;
      }

      .rm-btn--primary{
        background:#000;
        color:#fff;
        border-color:#000;
      }

      @media (max-width: 360px){
        .rm-btn{ font-size:12px; padding:7px 8px; }
      }
    `;
    document.head.appendChild(s);
  }

  // Build UI
  const header = document.createElement("header");
  header.className = "rm-topbar";
  header.innerHTML = `
    <div class="rm-topbar__row1">
      <div></div>
      <div class="rm-title">Recovery Misfits v2</div>
      <div class="rm-topbar__actions">
        <button id="rm-install-btn" class="rm-btn rm-btn--primary" style="display:none;">
          Install App • Always Free
        </button>
        <button id="rm-howto-btn" class="rm-btn" style="display:none;">
          How to install
        </button>
      </div>
    </div>

    <div class="rm-topbar__row2">
      <div class="rm-mode" id="rm-mode">Browser Mode</div>
    </div>
  `;

  mount.replaceChildren(header);

  // Wire install detection
  const modeEl = document.getElementById("rm-mode");
  const installBtn = document.getElementById("rm-install-btn");
  const howtoBtn = document.getElementById("rm-howto-btn");

  let deferredPrompt = null;

  function setModeText() {
    if (isStandalone()) {
      modeEl.textContent = "Installed (App Mode)";
      installBtn.style.display = "none";
      howtoBtn.style.display = "none";
    } else {
      modeEl.textContent = "Browser Mode";
    }
  }

  setModeText();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone()) installBtn.style.display = "inline-flex";
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = "none";
  });

  setTimeout(() => {
    if (!deferredPrompt && !isStandalone()) {
      howtoBtn.style.display = "inline-flex";
      howtoBtn.textContent = isIOS() ? "Install (iPhone)" : "How to install";
    }
  }, 1200);

  howtoBtn.addEventListener("click", () => {
    alert(
      isIOS()
        ? "On iPhone: tap Share → Add to Home Screen."
        : "Use the install icon in your browser."
    );
  });

  window.addEventListener("visibilitychange", setModeText);
  window.addEventListener("focus", setModeText);
})();

// topbar.js — Recovery Misfits shared top bar (black) + install support
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
        background:#000;
        color:#fff;
        border-bottom:1px solid #111;
        font-family:Roboto,Arial,sans-serif;
      }

      .rm-topbar__row{
        display:grid;
        grid-template-columns: 1fr auto 1fr;
        align-items:center;
        padding:10px 12px;
      }

      .rm-title{
        text-align:center;
        font-weight:900;
        font-size:16px;
        letter-spacing:.03em;
        color:#fff;
      }

      .rm-topbar__actions{
        justify-self:end;
        display:flex;
        gap:8px;
        align-items:center;
      }

      .rm-btn{
        border:1px solid #444;
        background:#111;
        color:#fff;
        padding:7px 10px;
        border-radius:10px;
        font-weight:700;
        font-size:12px;
        cursor:pointer;
        line-height:1;
        white-space:nowrap;
      }

      .rm-btn--primary{
        background:#fff;
        color:#000;
        border-color:#fff;
      }

      @media (max-width: 360px){
        .rm-btn{ font-size:11px; padding:6px 8px; }
      }
    `;
    document.head.appendChild(s);
  }

  // Build UI
  const header = document.createElement("header");
  header.className = "rm-topbar";
  header.innerHTML = `
    <div class="rm-topbar__row">
      <div></div>
      <div class="rm-title">Recovery Misfits</div>
      <div class="rm-topbar__actions">
        <button id="rm-install-btn" class="rm-btn rm-btn--primary" style="display:none;">
          Install
        </button>
        <button id="rm-howto-btn" class="rm-btn" style="display:none;">
          Install Help
        </button>
      </div>
    </div>
  `;

  mount.replaceChildren(header);

  const installBtn = document.getElementById("rm-install-btn");
  const howtoBtn = document.getElementById("rm-howto-btn");

  let deferredPrompt = null;

  // Android/Chrome install prompt
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

  // iPhone or fallback instructions
  setTimeout(() => {
    if (!deferredPrompt && !isStandalone()) {
      howtoBtn.style.display = "inline-flex";
      howtoBtn.textContent = isIOS() ? "Install (iPhone)" : "Install Help";
    }
  }, 1200);

  howtoBtn.addEventListener("click", () => {
    alert(
      isIOS()
        ? "On iPhone: tap Share → Add to Home Screen."
        : "Use your browser's install option."
    );
  });
})();

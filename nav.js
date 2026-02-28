// nav.js — Recovery Misfits shared bottom nav + sobriety counter
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  /* =========================
     Storage Keys
     ========================= */
  const SOBER_KEY = "rm_sober_date";          // stored as YYYY-MM-DD
  const SOBER_MODE_KEY = "rm_sober_inclusive"; // "1" or "0"
  const DEFAULT_INCLUSIVE = true;

  /* =========================
     Date Helpers
     ========================= */
  function pad2(n) { return String(n).padStart(2, "0"); }

  function todayLocalYMD() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  function parseYMD(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
    if (!m) return null;
    const dt = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    return isNaN(dt) ? null : dt;
  }

  function daysBetween(a, b) {
    const d1 = parseYMD(a);
    const d2 = parseYMD(b);
    if (!d1 || !d2) return null;
    return Math.floor((d2 - d1) / 86400000);
  }

  /* =========================
     Input Normalization
     ========================= */
  function normalizeInput(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";

    const digits = s.replace(/\D/g, "");
    let mm, dd, yyyy;

    if (digits.length === 8) {
      mm = digits.slice(0,2);
      dd = digits.slice(2,4);
      yyyy = digits.slice(4);
    } else {
      const parts = s.split(/[-/]/);
      if (parts.length !== 3) return "";
      mm = parts[0].padStart(2,"0");
      dd = parts[1].padStart(2,"0");
      yyyy = parts[2];
    }

    const m = Number(mm), d = Number(dd), y = Number(yyyy);
    const test = new Date(y, m-1, d);
    if (test.getMonth()+1 !== m || test.getDate() !== d) return "";

    return `${yyyy}-${mm}-${dd}`;
  }

  function ymdToDisplay(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
    return m ? `${m[2]}-${m[3]}-${m[1]}` : "";
  }

  /* =========================
     Storage
     ========================= */
  function getSoberDate() {
    return localStorage.getItem(SOBER_KEY) || "";
  }

  function setSoberDate(input) {
    const normalized = normalizeInput(input);
    if (!normalized) return;

    if (daysBetween(normalized, todayLocalYMD()) < 0) return;
    localStorage.setItem(SOBER_KEY, normalized);
  }

  function computeDays() {
    const start = getSoberDate();
    if (!start) return null;
    const diff = daysBetween(start, todayLocalYMD());
    if (diff === null) return null;
    const inclusive = localStorage.getItem(SOBER_MODE_KEY) !== "0";
    return inclusive ? diff + 1 : diff;
  }

  /* =========================
     Icons
     ========================= */
  const ICONS = {
    flame: `<svg viewBox="0 0 24 24" class="rm-ico"><path d="M12 2s3 4 3 7-2 4-2 6 2 3 2 5a3 3 0 0 1-6 0c0-2 2-3 2-5s-2-3-2-6 3-7 3-7z" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>`
  };

  /* =========================
     Styles
     ========================= */
  if (!document.getElementById("rm-style")) {
    const s = document.createElement("style");
    s.id = "rm-style";
    s.textContent = `
      nav#bottomBar{position:fixed;bottom:0;left:0;right:0;height:64px;background:#000;display:flex;justify-content:center;align-items:center;z-index:9500}
      .rmCounter{background:#111;border:1px solid #333;color:#fff;border-radius:14px;padding:6px 12px;display:flex;gap:8px;align-items:center;cursor:pointer}
      .rmCounterTop{font-size:10px;color:#aaa;text-transform:uppercase}
      .rmCounterDays{font-size:14px;font-weight:700}
      .rmModalBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;padding:14px;z-index:9999}
      .rmModal{background:#0b0b0b;border:1px solid #222;border-radius:16px;padding:14px;width:100%;max-width:420px;color:#fff}
      .rmModal input{background:#000;border:1px solid #333;border-radius:10px;padding:10px;color:#fff;width:100%}
      .rmBtn{margin-top:8px;padding:10px;border-radius:10px;background:#111;border:1px solid #333;color:#fff;cursor:pointer;width:100%}
    `;
    document.head.appendChild(s);
  }

  /* =========================
     Build Counter UI
     ========================= */
  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  const btn = document.createElement("div");
  btn.className = "rmCounter";

  btn.innerHTML = `
    ${ICONS.flame}
    <div>
      <div class="rmCounterTop">Sober</div>
      <div class="rmCounterDays" id="rmDays">Set Date</div>
    </div>
  `;

  function refresh() {
    const el = btn.querySelector("#rmDays");
    const days = computeDays();
    el.textContent = days == null ? "Set Date" : `${days} ${days===1?"Day":"Days"}`;
  }

  function openModal() {
    const backdrop = document.createElement("div");
    backdrop.className = "rmModalBackdrop";

    const modal = document.createElement("div");
    modal.className = "rmModal";

    modal.innerHTML = `
      <h3>Set Sober Date</h3>
      <input id="rmInput" type="text" placeholder="Sobriety date (MM-DD-YYYY)" value="${ymdToDisplay(getSoberDate())}">
      <button class="rmBtn" id="save">Save</button>
      <button class="rmBtn" id="clear">Clear</button>
      <button class="rmBtn" id="close">Close</button>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const input = modal.querySelector("#rmInput");

    modal.querySelector("#save").onclick = () => {
      setSoberDate(input.value);
      backdrop.remove();
      refresh();
    };

    modal.querySelector("#clear").onclick = () => {
      localStorage.removeItem(SOBER_KEY);
      backdrop.remove();
      refresh();
    };

    modal.querySelector("#close").onclick = () => backdrop.remove();
    backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };
  }

  btn.onclick = openModal;
  refresh();
  setInterval(refresh, 60000);

  nav.appendChild(btn);
  mount.replaceChildren(nav);
})();

// nav.js — Recovery Misfits v2 shared bottom nav + sobriety counter (MM-DD-YYYY or MMDDYYYY)
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  /* =========================
     Sobriety Counter (storage)
     ========================= */
  const SOBER_KEY = "rm_sober_date";          // stored as YYYY-MM-DD
  const SOBER_MODE_KEY = "rm_sober_inclusive"; // "1" or "0"
  const DEFAULT_INCLUSIVE = true;              // count start date as Day 1

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function todayLocalYMD() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseYMDToLocalDate(ymd) {
    // ymd expected "YYYY-MM-DD" — parse as local midnight
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || "").trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    const dt = new Date(y, mo, da, 0, 0, 0, 0);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== da) return null;
    return dt;
  }

  function daysBetweenLocal(startYMD, endYMD) {
    const s = parseYMDToLocalDate(startYMD);
    const e = parseYMDToLocalDate(endYMD);
    if (!s || !e) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((e.getTime() - s.getTime()) / msPerDay);
  }

  function getInclusiveSetting() {
    const raw = localStorage.getItem(SOBER_MODE_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
    return DEFAULT_INCLUSIVE;
  }

  function setInclusiveSetting(val) {
    localStorage.setItem(SOBER_MODE_KEY, val ? "1" : "0");
  }

  function getSoberDateYMD() {
    const v = localStorage.getItem(SOBER_KEY);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  }

  function normalizeSoberInput(raw) {
    // Accepts: "MM-DD-YYYY", "MM/DD/YYYY", "MMDDYYYY", "M-D-YYYY", "M/D/YYYY"
    // Returns: "YYYY-MM-DD" or "" if invalid
    const s = String(raw || "").trim();
    if (!s) return "";

    const digits = s.replace(/\D/g, "");
    let mm, dd, yyyy;

    if (digits.length === 8) {
      // MMDDYYYY
      mm = digits.slice(0, 2);
      dd = digits.slice(2, 4);
      yyyy = digits.slice(4, 8);
    } else {
      const parts = s.split(/[-/]/).map(p => p.trim()).filter(Boolean);
      if (parts.length !== 3) return "";
      mm = parts[0].padStart(2, "0");
      dd = parts[1].padStart(2, "0");
      yyyy = parts[2];
    }

    if (!/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd) || !/^\d{4}$/.test(yyyy)) return "";

    const m = Number(mm);
    const d = Number(dd);
    const y = Number(yyyy);

    if (y < 1900 || y > 2100) return "";
    if (m < 1 || m > 12) return "";
    if (d < 1 || d > 31) return "";

    // Validate real calendar date (catches 02/30, etc.)
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== (m - 1) || dt.getDate() !== d) return "";

    return `${yyyy}-${mm}-${dd}`;
  }

  function ymdToDisplayMDY(ymd) {
    // "YYYY-MM-DD" -> "MM-DD-YYYY"
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!m) return "";
    return `${m[2]}-${m[3]}-${m[1]}`;
  }

  function setSoberDate(input) {
    if (!input || !String(input).trim()) {
      localStorage.removeItem(SOBER_KEY);
      return;
    }

    const normalized = normalizeSoberInput(input);
    if (!normalized) return;

    // Prevent future dates
    const diff = daysBetweenLocal(normalized, todayLocalYMD());
    if (diff === null || diff < 0) return;

    localStorage.setItem(SOBER_KEY, normalized);
  }

  function computeSoberDays() {
    const start = getSoberDateYMD();
    if (!start) return null;

    const today = todayLocalYMD();
    const diff = daysBetweenLocal(start, today);
    if (diff === null) return null;

    const inclusive = getInclusiveSetting();
    const days = inclusive ? diff + 1 : diff;
    return Math.max(0, days);
  }

  /* =========================
     SVG ICONS (inline)
     ========================= */
  const ICONS = {
    home: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 10.5V21h11V10.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    tools: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M14 7a5 5 0 0 0-6.5 6.5L3 18l3 3 4.5-4.5A5 5 0 0 0 17 10l-3 3-2-2 2-4z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    book: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M5 19h11" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
      </svg>
    `,
    audio: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M4 12V9a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
        <path d="M4 12a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M20 12a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
      </svg>
    `,
    fun: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2l-2 2H10l-2-2H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M9 13h2M10 12v2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
        <circle cx="16" cy="14" r="1" fill="currentColor"/>
      </svg>
    `,
    updates: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M2 10h4v12H2z" fill="currentColor"/>
        <path d="M22 10a2 2 0 0 0-2-2h-6l1-5v-1a2 2 0 0 0-2-2l-1 1-5 8v11h11a2 2 0 0 0 2-2l1-7v-1z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    `,
    flame: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M12 2s3 4 3 7-2 4-2 6 2 3 2 5a3 3 0 0 1-6 0c0-2 2-3 2-5s-2-3-2-6 3-7 3-7z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
      </svg>
    `
  };

  /* =========================
     NAV ITEMS (edit here only)
     ========================= */
  const items = [
    { href: "./index2.html",   icon: ICONS.home,    label: "Home" },
    { href: "./tools.html",    icon: ICONS.tools,   label: "Tools" },
    { href: "./readings.html", icon: ICONS.book,    label: "Readings" },
    { href: "./audio.html",    icon: ICONS.audio,   label: "Audio" },
    { href: "./fun.html",      icon: ICONS.fun,     label: "Fun" },
    { href: "./updates.html",  icon: ICONS.updates, label: "Updates" }
  ];

  /* =========================
     Inject shared styles once
     ========================= */
  const styleId = "rm-bottom-nav-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      nav#bottomBar{
        position:fixed;
        bottom:0;
        left:0;
        right:0;
        height:64px;
        background:#000;
        border-top:1px solid #222;
        display:flex;
        justify-content:space-around;
        align-items:center;
        z-index:9500;
        gap:2px;
      }

      .navItem{
        flex:1;
        min-width:0;
        text-align:center;
        text-decoration:none;
        font-size:11px;
        padding:8px 4px;
        color:#bbb;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
      }

      .navItem .ico{
        display:flex;
        align-items:center;
        justify-content:center;
        margin-bottom:3px;
      }

      .navItem.active{
        color:#fff;
        font-weight:700;
      }

      .rm-ico{
        width:20px;
        height:20px;
        display:block;
      }

      /* ===== Sobriety counter pill (center) ===== */
      .rmCounterWrap{
        flex:1.25;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0 6px;
      }

      .rmCounter{
        width:100%;
        max-width:140px;
        height:44px;
        border-radius:14px;
        border:1px solid #2a2a2a;
        background:linear-gradient(180deg, #111, #070707);
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        cursor:pointer;
        user-select:none;
        -webkit-tap-highlight-color: transparent;
      }

      .rmCounter:active{
        transform:translateY(1px);
      }

      .rmCounter .rmCounterText{
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        line-height:1.05;
      }

      .rmCounter .rmCounterTop{
        font-size:10px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:#bdbdbd;
      }

      .rmCounter .rmCounterDays{
        font-size:14px;
        font-weight:900;
        letter-spacing:.02em;
      }

      /* ===== Modal ===== */
      .rmModalBackdrop{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.62);
        z-index:9999;
        display:flex;
        align-items:flex-end;
        justify-content:center;
        padding:14px;
      }

      .rmModal{
        width:min(520px, 100%);
        border-radius:16px;
        background:#0b0b0b;
        border:1px solid #222;
        box-shadow:0 10px 40px rgba(0,0,0,.55);
        padding:14px;
      }

      .rmModal h3{
        margin:0 0 8px 0;
        font-size:14px;
        color:#fff;
        letter-spacing:.02em;
      }

      .rmModal p{
        margin:0 0 10px 0;
        font-size:12px;
        color:#bdbdbd;
      }

      .rmRow{
        display:flex;
        gap:10px;
        align-items:center;
        flex-wrap:wrap;
      }

      .rmModal input[type="text"]{
        background:#000;
        color:#fff;
        border:1px solid #2a2a2a;
        border-radius:12px;
        padding:10px 12px;
        font-size:14px;
        width:190px;
      }

      .rmBtn{
        border:1px solid #2a2a2a;
        background:#111;
        color:#fff;
        border-radius:12px;
        padding:10px 12px;
        font-size:13px;
        font-weight:700;
        cursor:pointer;
      }

      .rmBtn.rmDanger{
        background:#160909;
        border-color:#3a1a1a;
      }

      .rmToggle{
        display:flex;
        align-items:center;
        gap:8px;
        font-size:12px;
        color:#bdbdbd;
        margin-top:10px;
      }

      .rmHelp{
        margin-top:8px;
        font-size:11px;
        color:#9a9a9a;
      }
    `;
    document.head.appendChild(style);
  }

  /* =========================
     Determine active page
     ========================= */
  function currentFile() {
    const path = window.location.pathname;
    return (path.split("/").pop() || "").toLowerCase();
  }
  const cur = currentFile();

  /* =========================
     Build nav + counter
     ========================= */
  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  function buildLinkItem(it) {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    const target = (it.href.split("/").pop() || "").toLowerCase();
    if (target && cur === target) a.classList.add("active");

    a.innerHTML = `<span class="ico">${it.icon}</span>${it.label}`;
    return a;
  }

  // Insert the counter in the middle
  const midIndex = Math.floor(items.length / 2);

  items.forEach((it, idx) => {
    if (idx === midIndex) {
      const wrap = document.createElement("div");
      wrap.className = "rmCounterWrap";

      const btn = document.createElement("div");
      btn.className = "rmCounter";
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.setAttribute("aria-label", "Sobriety counter. Tap to set sober date.");

      btn.innerHTML = `
        <span class="ico">${ICONS.flame}</span>
        <span class="rmCounterText">
          <span class="rmCounterTop">Sober</span>
          <span class="rmCounterDays" id="rmSoberDays">Set Date</span>
        </span>
      `;

      function refreshCounterText() {
        const el = btn.querySelector("#rmSoberDays");
        if (!el) return;
        const days = computeSoberDays();
        if (days === null) {
          el.textContent = "Set Date";
          return;
        }
        el.textContent = `${days} ${days === 1 ? "Day" : "Days"}`;
      }

      function openModal() {
        const backdrop = document.createElement("div");
        backdrop.className = "rmModalBackdrop";

        const modal = document.createElement("div");
        modal.className = "rmModal";

        const existingYMD = getSoberDateYMD();
        const inclusive = getInclusiveSetting();

        modal.innerHTML = `
          <h3>Set Sober Date</h3>
          <p>This stays on your device (saved in local storage).</p>

          <div class="rmRow">
            <input
              id="rmSoberDateInput"
              type="text"
              inputmode="numeric"
              placeholder="MM-DD-YYYY or MMDDYYYY"
              value="${ymdToDisplayMDY(existingYMD)}"
              aria-label="Enter sober date as MM-DD-YYYY or MMDDYYYY"
            />
            <button class="rmBtn" id="rmSaveSoberDate">Save</button>
            <button class="rmBtn rmDanger" id="rmClearSoberDate">Clear</button>
            <button class="rmBtn" id="rmCloseSoberModal">Close</button>
          </div>

          <div class="rmHelp">Examples: 02-27-2026 or 02272026</div>

          <label class="rmToggle">
            <input id="rmInclusiveToggle" type="checkbox" ${inclusive ? "checked" : ""} />
            Count start date as “Day 1”
          </label>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const input = modal.querySelector("#rmSoberDateInput");
        const saveBtn = modal.querySelector("#rmSaveSoberDate");
        const clearBtn = modal.querySelector("#rmClearSoberDate");
        const closeBtn = modal.querySelector("#rmCloseSoberModal");
        const incToggle = modal.querySelector("#rmInclusiveToggle");

        function markInvalid() {
          if (!input) return;
          input.style.borderColor = "#6a2a2a";
          input.style.outline = "none";
        }

        function markValid() {
          if (!input) return;
          input.style.borderColor = "#2a2a2a";
        }

        function close() {
          backdrop.remove();
          refreshCounterText();
        }

        // click outside closes
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) close();
        });

        closeBtn.addEventListener("click", close);

        // Press Enter to save
        input?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveBtn.click();
          }
        });

        // Live validate (doesn't nag, just resets border when okay)
        input?.addEventListener("input", () => {
          const v = input.value.trim();
          if (!v) {
            markValid();
            return;
          }
          const ok = !!normalizeSoberInput(v);
          if (ok) markValid();
        });

        saveBtn.addEventListener("click", () => {
          const val = (input?.value || "").trim();
          const normalized = normalizeSoberInput(val);

          if (!normalized) {
            markInvalid();
            input?.focus();
            return;
          }

          // Prevent future dates
          const diff = daysBetweenLocal(normalized, todayLocalYMD());
          if (diff === null || diff < 0) {
            markInvalid();
            input?.focus();
            return;
          }

          // Save in storage as YYYY-MM-DD
          localStorage.setItem(SOBER_KEY, normalized);

          // Rewrite the field to MM-DD-YYYY (nice feedback)
          if (input) input.value = ymdToDisplayMDY(normalized);

          close();
        });

        clearBtn.addEventListener("click", () => {
          localStorage.removeItem(SOBER_KEY);
          close();
        });

        incToggle.addEventListener("change", () => {
          setInclusiveSetting(!!incToggle.checked);
          refreshCounterText();
        });
      }

      btn.addEventListener("click", openModal);
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal();
        }
      });

      refreshCounterText();
      setInterval(refreshCounterText, 60 * 1000);

      wrap.appendChild(btn);
      nav.appendChild(wrap);
    }

    nav.appendChild(buildLinkItem(it));
  });

  mount.replaceChildren(nav);
})();

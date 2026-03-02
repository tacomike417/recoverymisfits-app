// nav.js — Recovery Misfits v2 shared bottom nav + sobriety bar
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  /* =========================
     Sobriety Counter (storage)
     ========================= */
  const SOBER_KEY = "rm_sober_date"; // stored as YYYY-MM-DD

  function pad2(n) { return String(n).padStart(2, "0"); }

  function todayLocalYMD() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseYMDToLocalDate(ymd) {
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

  function getSoberDateYMD() {
    const v = localStorage.getItem(SOBER_KEY);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  }

  // Accepts: MM-DD-YYYY, MM/DD/YYYY, M-D-YYYY, or MMDDYYYY
  function normalizeSoberInput(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";

    const digits = s.replace(/\D/g, "");
    let mm, dd, yyyy;

    if (digits.length === 8) {
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

    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== (m - 1) || dt.getDate() !== d) return "";

    return `${yyyy}-${mm}-${dd}`;
  }

  function ymdToDisplayMDY(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!m) return "";
    return `${m[2]}-${m[3]}-${m[1]}`;
  }

  function computeSoberDays() {
    const start = getSoberDateYMD();
    if (!start) return null;
    const today = todayLocalYMD();
    const diff = daysBetweenLocal(start, today);
    if (diff === null) return null;
    return Math.max(0, diff + 1); // inclusive
  }

  /* =========================
     SVG ICONS
     ========================= */
  const ICONS = {
    home: `<svg viewBox="0 0 24 24" class="rm-ico"><path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5V21h11V10.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    tools:`<svg viewBox="0 0 24 24" class="rm-ico"><path d="M14 7a5 5 0 0 0-6.5 6.5L3 18l3 3 4.5-4.5A5 5 0 0 0 17 10l-3 3-2-2 2-4z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    book:`<svg viewBox="0 0 24 24" class="rm-ico"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M5 19h11" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>`,
    audio:`<svg viewBox="0 0 24 24" class="rm-ico"><path d="M4 12V9a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M4 12a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M20 12a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>`,
    fun:`<svg viewBox="0 0 24 24" class="rm-ico"><path d="M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2l-2 2H10l-2-2H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>`,
    updates:`<svg viewBox="0 0 24 24" class="rm-ico"><path d="M2 10h4v12H2z" fill="currentColor"/><path d="M22 10a2 2 0 0 0-2-2h-6l1-5v-1a2 2 0 0 0-2-2l-1 1-5 8v11h11a2 2 0 0 0 2-2l1-7v-1z" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>`
  };

  /* =========================
     NAV ITEMS — UPDATED FOR LAUNCH
     ========================= */
  const items = [
    { href: "./index.html",    icon: ICONS.home,    label: "Home" },
    { href: "./tools.html",    icon: ICONS.tools,   label: "Tools" },
    { href: "./readings.html", icon: ICONS.book,    label: "Readings" },
    { href: "./audio.html",    icon: ICONS.audio,   label: "Audio" },
    { href: "./fun.html",      icon: ICONS.fun,     label: "Fun" },
    { href: "./updates.html",  icon: ICONS.updates, label: "Updates" }
  ];

  /* =========================
     Active page detection
     ========================= */
  function currentFile() {
    const path = window.location.pathname;
    return (path.split("/").pop() || "").toLowerCase();
  }
  const cur = currentFile();

  /* =========================
     Build UI
     ========================= */
  const wrapper = document.createElement("div");

  const soberBar = document.createElement("div");
  soberBar.id = "rmSoberBar";
  soberBar.innerHTML = `
    <span class="rmSoberText" id="rmSoberBarText">Sober: Set your date</span>
    <span class="rmSoberSub" id="rmSoberBarSub"></span>
  `;

  function refreshSoberBar() {
    const main = soberBar.querySelector("#rmSoberBarText");
    const sub = soberBar.querySelector("#rmSoberBarSub");
    const days = computeSoberDays();
    const ymd = getSoberDateYMD();

    if (!ymd || days === null) {
      main.textContent = "Sober: Set your date";
      sub.textContent = "";
      return;
    }

    main.textContent = `Sober: ${days} ${days === 1 ? "Day" : "Days"}`;
    sub.textContent = `Since ${ymdToDisplayMDY(ymd)}`;
  }

  soberBar.addEventListener("click", () => {
    alert("Set sober date modal here"); // placeholder
  });

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

  items.forEach(it => nav.appendChild(buildLinkItem(it)));

  wrapper.appendChild(soberBar);
  wrapper.appendChild(nav);
  mount.replaceChildren(wrapper);

  refreshSoberBar();
  setInterval(refreshSoberBar, 60000);
})();

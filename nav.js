// nav.js — Recovery Misfits v2 shared bottom nav + sobriety bar
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  const SOBER_KEY = "rm_sober_date";
  const STYLE_ID = "rm-nav-styles";

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

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
    return Math.max(0, diff + 1);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #rm-bottom-nav {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        width: 100%;
      }

      #rm-bottom-nav .rm-nav-wrap {
        width: 100%;
        max-width: 980px;
        margin: 0 auto;
        padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 8px);
        box-sizing: border-box;
      }

      #rmSoberBar {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        width: 100%;
        margin: 0 auto 8px;
        padding: 10px 14px;
        border-radius: 16px;
        background: linear-gradient(180deg, #fff7df 0%, #f3e0ac 100%);
        color: #111;
        border: 1px solid rgba(0,0,0,.12);
        box-shadow: 0 8px 24px rgba(0,0,0,.14);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      #rmSoberBar:hover {
        transform: translateY(-1px);
      }

      #rmSoberBarText {
        font-size: 15px;
        font-weight: 800;
        line-height: 1.2;
        letter-spacing: .2px;
      }

      #rmSoberBarSub {
        font-size: 12px;
        opacity: .78;
        line-height: 1.2;
      }

      #bottomBar {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        width: 100%;
        margin: 0 auto;
        padding: 8px;
        border-radius: 20px;
        background: rgba(10,10,10,.96);
        border: 1px solid rgba(255,255,255,.08);
        box-shadow: 0 10px 30px rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .navItem {
        min-height: 58px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: rgba(255,255,255,.78);
        border-radius: 14px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .2px;
        transition: background .18s ease, color .18s ease, transform .18s ease;
        -webkit-tap-highlight-color: transparent;
      }

      .navItem:hover {
        background: rgba(255,255,255,.06);
        color: #fff;
      }

      .navItem:active {
        transform: scale(.98);
      }

      .navItem.active {
        background: #f3e0ac;
        color: #111;
      }

      .ico {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }

      .rm-ico {
        width: 22px;
        height: 22px;
        display: block;
      }

      @media (max-width: 700px) {
        #rm-bottom-nav .rm-nav-wrap {
          padding-left: 8px;
          padding-right: 8px;
        }

        #bottomBar {
          gap: 4px;
          padding: 6px;
          border-radius: 16px;
        }

        .navItem {
          min-height: 54px;
          font-size: 10px;
        }

        .ico {
          width: 22px;
          height: 22px;
        }

        .rm-ico {
          width: 20px;
          height: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const ICONS = {
    home: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5V21h11V10.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    tools: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M14 7a5 5 0 0 0-6.5 6.5L3 18l3 3 4.5-4.5A5 5 0 0 0 17 10l-3 3-2-2 2-4z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    book: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    audio: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M4 12V9a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12v4a2 2 0 0 0 2 2h1v-6H8a2 2 0 0 0-2 2zm12 0v6h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    fun: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2l-2 2H10l-2-2H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    updates: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M2 10h4v12H2z" fill="currentColor"/><path d="M22 10a2 2 0 0 0-2-2h-6l1-5v-1a2 2 0 0 0-2-2l-1 1-5 8v11h11a2 2 0 0 0 2-2l1-7v-1z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  const items = [
    { href: "./index.html", label: "Home", icon: ICONS.home },
    { href: "./tools.html", label: "Tools", icon: ICONS.tools },
    { href: "./readings.html", label: "Readings", icon: ICONS.book },
    { href: "./audio.html", label: "Audio", icon: ICONS.audio },
    { href: "./fun.html", label: "Fun", icon: ICONS.fun },
    { href: "./updates.html", label: "Updates", icon: ICONS.updates }
  ];

  injectStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "rm-nav-wrap";

  const soberBar = document.createElement("div");
  soberBar.id = "rmSoberBar";
  soberBar.setAttribute("role", "button");
  soberBar.setAttribute("tabindex", "0");
  soberBar.innerHTML = `
    <span id="rmSoberBarText">Sober: Set your date</span>
    <span id="rmSoberBarSub"></span>
  `;

  function refreshSoberBar() {
    const main = soberBar.querySelector("#rmSoberBarText");
    const sub = soberBar.querySelector("#rmSoberBarSub");

    const days = computeSoberDays();
    const ymd = getSoberDateYMD();

    if (!ymd || days === null) {
      main.textContent = "Sober: Set your date";
      sub.textContent = "Tap here to add it";
      return;
    }

    main.textContent = `Sober: ${days} ${days === 1 ? "Day" : "Days"}`;
    sub.textContent = `Since ${ymdToDisplayMDY(ymd)}`;
  }

  function goToSoberDate() {
    window.location.href = "./sober-date.html";
  }

  soberBar.addEventListener("click", goToSoberDate);
  soberBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToSoberDate();
    }
  });

  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  const cur = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  items.forEach((it) => {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    const hrefFile = it.href.replace("./", "").toLowerCase();
    if (hrefFile === cur) {
      a.classList.add("active");
    }

    a.innerHTML = `<span class="ico">${it.icon}</span><span>${it.label}</span>`;
    nav.appendChild(a);
  });

  wrapper.appendChild(soberBar);
  wrapper.appendChild(nav);
  mount.replaceChildren(wrapper);

  refreshSoberBar();
  setInterval(refreshSoberBar, 60000);
})();

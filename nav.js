// nav.js — Recovery Misfits v2 shared bottom nav + sober date bar
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

  function ymdToDisplayDMY(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!m) return "";
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  function parseDMYToYMD(value) {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(value || "").trim());
    if (!m) return "";
    const da = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);

    const dt = new Date(y, mo - 1, da, 0, 0, 0, 0);
    if (
      Number.isNaN(dt.getTime()) ||
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo - 1 ||
      dt.getDate() !== da
    ) {
      return "";
    }

    const today = parseYMDToLocalDate(todayLocalYMD());
    if (!today || dt.getTime() > today.getTime()) return "";

    return `${y}-${pad2(mo)}-${pad2(da)}`;
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
      body {
        padding-bottom: calc(138px + env(safe-area-inset-bottom, 0px));
      }

      #rm-bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        width: 100%;
        pointer-events: none;
      }

      #rm-bottom-nav .rm-nav-wrap {
        width: 100%;
        max-width: 980px;
        margin: 0 auto;
        padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 8px);
        box-sizing: border-box;
        pointer-events: auto;
      }

      #rmSoberBar {
        width: 100%;
        margin: 0 auto 6px;
        padding: 8px 10px;
        border-radius: 14px;
        background: linear-gradient(180deg, #181818 0%, #0f0f0f 100%);
        color: #f5f5f5;
        border: 1px solid rgba(214,179,106,.20);
        border-left: 4px solid #d6b36a;
        box-shadow: 0 8px 20px rgba(0,0,0,.24);
        box-sizing: border-box;
      }

      .rm-sober-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .rm-sober-copy {
        min-width: 0;
        flex: 1 1 auto;
      }

      .rm-sober-kicker {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: #d6b36a;
        margin-bottom: 2px;
      }

      #rmSoberBarText {
        font-size: 14px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: .02em;
        margin-bottom: 1px;
      }

      #rmSoberBarSub {
        font-size: 11px;
        color: rgba(255,255,255,.72);
        line-height: 1.2;
      }

      .rm-sober-actions {
        display: flex;
        flex-direction: row;
        gap: 6px;
        flex: 0 0 auto;
      }

      .rm-sober-btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 10px;
        padding: 6px 8px;
        text-decoration: none;
        cursor: pointer;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        line-height: 1;
        white-space: nowrap;
        transition: transform .15s ease, background .15s ease, color .15s ease, border-color .15s ease;
      }

      .rm-sober-btn:hover {
        transform: translateY(-1px);
      }

      .rm-sober-btn:active {
        transform: scale(.98);
      }

      .rm-sober-btn.set {
        background: #d6b36a;
        color: #111;
        border-color: #d6b36a;
      }

      .rm-sober-btn.share {
        background: transparent;
        color: #f5f5f5;
        border-color: rgba(255,255,255,.18);
      }

      #bottomBar {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        width: 100%;
        margin: 0 auto;
        padding: 6px;
        border-radius: 16px;
        background: rgba(10,10,10,.96);
        border: 1px solid rgba(255,255,255,.08);
        box-shadow: 0 10px 30px rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .navItem {
        min-height: 56px;
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

      .rm-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10001;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0,0,0,.72);
      }

      .rm-modal-backdrop.show {
        display: flex;
      }

      .rm-modal {
        width: min(420px, 100%);
        background: linear-gradient(180deg, #171717, #0d0d0d);
        color: #f5f5f5;
        border: 1px solid rgba(214,179,106,.22);
        border-radius: 18px;
        box-shadow: 0 12px 34px rgba(0,0,0,.38);
        padding: 18px;
        box-sizing: border-box;
      }

      .rm-modal h3 {
        margin: 0 0 8px;
        font-size: 20px;
        letter-spacing: .04em;
      }

      .rm-modal p {
        margin: 0 0 12px;
        color: rgba(255,255,255,.72);
        font-size: 14px;
        line-height: 1.4;
      }

      .rm-modal input {
        width: 100%;
        box-sizing: border-box;
        padding: 14px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.14);
        background: #0f0f0f;
        color: #fff;
        font-size: 16px;
        outline: none;
      }

      .rm-modal-note {
        margin-top: 10px;
        font-size: 12px;
        color: #d6b36a;
      }

      .rm-modal-row {
        display: flex;
        gap: 10px;
        margin-top: 12px;
      }

      .rm-modal-row button {
        flex: 1 1 0;
        appearance: none;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .rm-modal-cancel {
        background: transparent;
        color: #f5f5f5;
        border: 1px solid rgba(255,255,255,.16);
      }

      .rm-modal-save {
        background: #d6b36a;
        color: #111;
        border: 1px solid #d6b36a;
      }

      @media (max-width: 700px) {
        body {
          padding-bottom: calc(148px + env(safe-area-inset-bottom, 0px));
        }

        #rm-bottom-nav .rm-nav-wrap {
          padding-left: 8px;
          padding-right: 8px;
        }

        #rmSoberBar {
          padding: 7px 8px;
          border-radius: 12px;
        }

        .rm-sober-top {
          gap: 8px;
        }

        .rm-sober-kicker {
          font-size: 8px;
        }

        #rmSoberBarText {
          font-size: 13px;
        }

        #rmSoberBarSub {
          font-size: 10px;
        }

        .rm-sober-actions {
          gap: 5px;
        }

        .rm-sober-btn {
          padding: 6px 7px;
          font-size: 9px;
        }

        #bottomBar {
          gap: 4px;
          padding: 6px;
          border-radius: 16px;
        }

        .navItem {
          min-height: 52px;
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
  soberBar.innerHTML = `
    <div class="rm-sober-top">
      <div class="rm-sober-copy">
        <div class="rm-sober-kicker">One Day At A Time</div>
        <div id="rmSoberBarText">Sober Date Not Set</div>
        <div id="rmSoberBarSub">Set your date and keep going.</div>
      </div>
      <div class="rm-sober-actions">
        <button type="button" class="rm-sober-btn set" id="rmSetSoberDateBtn">Set</button>
        <a class="rm-sober-btn share" id="rmShareSoberDateBtn" href="./sober-date.html">Share</a>
      </div>
    </div>
  `;

  function refreshSoberBar() {
    const main = soberBar.querySelector("#rmSoberBarText");
    const sub = soberBar.querySelector("#rmSoberBarSub");

    const days = computeSoberDays();
    const ymd = getSoberDateYMD();

    if (!ymd || days === null) {
      main.textContent = "Sober Date Not Set";
      sub.textContent = "Set your date and keep going.";
      return;
    }

    main.textContent = `${days.toLocaleString()} ${days === 1 ? "Day" : "Days"} Sober`;
    sub.textContent = `Since ${ymdToDisplayDMY(ymd)}`;
  }

  function ensureModal() {
    let modal = document.getElementById("rmSoberDateModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "rmSoberDateModal";
    modal.className = "rm-modal-backdrop";
    modal.innerHTML = `
      <div class="rm-modal" role="dialog" aria-modal="true" aria-labelledby="rmSoberDateModalTitle">
        <h3 id="rmSoberDateModalTitle">Set Sober Date</h3>
        <p>Enter your sober date as DD-MM-YYYY.</p>
        <input id="rmSoberDateInput" type="text" inputmode="numeric" maxlength="10" placeholder="DD-MM-YYYY" />
        <div class="rm-modal-note">Saved only on this device.</div>
        <div class="rm-modal-row">
          <button type="button" class="rm-modal-cancel" id="rmSoberDateCancel">Cancel</button>
          <button type="button" class="rm-modal-save" id="rmSoberDateSave">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector("#rmSoberDateInput");
    const cancel = modal.querySelector("#rmSoberDateCancel");
    const save = modal.querySelector("#rmSoberDateSave");

    input.addEventListener("input", () => {
      let v = input.value.replace(/[^\d]/g, "").slice(0, 8);
      if (v.length > 4) v = `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4)}`;
      else if (v.length > 2) v = `${v.slice(0, 2)}-${v.slice(2)}`;
      input.value = v;
    });

    cancel.addEventListener("click", () => {
      modal.classList.remove("show");
    });

    save.addEventListener("click", () => {
      const ymd = parseDMYToYMD(input.value);
      if (!ymd) {
        alert("Please enter a real past date in DD-MM-YYYY format.");
        return;
      }
      localStorage.setItem(SOBER_KEY, ymd);
      modal.classList.remove("show");
      refreshSoberBar();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });

    return modal;
  }

  function openSoberModal() {
    const modal = ensureModal();
    const input = modal.querySelector("#rmSoberDateInput");
    const current = getSoberDateYMD();

    input.value = current ? ymdToDisplayDMY(current) : "";
    modal.classList.add("show");
    setTimeout(() => input.focus(), 30);
  }

  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  const cur = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  items.forEach((it) => {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    const hrefFile = it.href.replace("./", "").toLowerCase();
    if (hrefFile === cur) a.classList.add("active");

    a.innerHTML = `<span class="ico">${it.icon}</span><span>${it.label}</span>`;
    nav.appendChild(a);
  });

  wrapper.appendChild(soberBar);
  wrapper.appendChild(nav);
  mount.replaceChildren(wrapper);

  const setBtn = soberBar.querySelector("#rmSetSoberDateBtn");
  if (setBtn) {
    setBtn.addEventListener("click", openSoberModal);
  }

  refreshSoberBar();
  setInterval(refreshSoberBar, 60000);
})();

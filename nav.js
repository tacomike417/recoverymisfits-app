// nav.js — Recovery Misfits v2 bottom app bar with left sober panel
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

  /* ---- ASK THE BROWSER TO KEEP IT -----------------------------------------

     WHY THE SOBER DATE KEEPS DISAPPEARING.

     By default a site's storage is "best-effort", which means exactly what it
     sounds like. Two things throw it away and neither is the user clearing
     anything:

       * Safari deletes script-written storage after SEVEN DAYS with no tap
         on the site. Not low disk, not a cache clear -- just not opening the
         app for a week. Somebody who checks their day count every morning is
         fine; somebody who opens it when things are hard loses their date
         precisely because things were not hard for a while. That is the
         worst possible failure for this particular number.

       * Any browser under storage pressure drops the least recently used
         origins, and it takes ALL of an origin's data at once.

     navigator.storage.persist() moves the site to "persistent", where data
     is only removed if the person deletes it themselves. Chrome and Safari
     decide silently from how much you use the site; Firefox asks. Installed
     web apps are treated far more generously than a tab.

     It is one call, it has no downside, and this app had never made it.
     It does NOT survive somebody clearing site data by hand -- nothing on
     the device does. That needs an account, which is a bigger conversation. */
  async function keepStorage() {
    try {
      if (!navigator.storage || !navigator.storage.persist) return null;
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    } catch (e) {
      return null;
    }
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

  /* THE BAR SAYS THE DATE THE WAY A PERSON SAYS IT OUT LOUD.

     "15-09-2018" reads as a part number. This is the one screen whose whole
     job is to make that date feel like yours, so it says "September 15th,
     2018" -- which is also how everybody actually says it in a meeting. */
  const MONTH_NAMES_LONG = ["January","February","March","April","May","June",
                            "July","August","September","October","November","December"];

  function ordinalSuffix(n) {
    /* 11th, 12th and 13th are the three that break the tidy rule. */
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (n % 10 === 1) return "st";
    if (n % 10 === 2) return "nd";
    if (n % 10 === 3) return "rd";
    return "th";
  }

  function ymdToDisplayLong(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!m) return "";
    const month = MONTH_NAMES_LONG[Number(m[2]) - 1];
    if (!month) return "";
    const day = Number(m[3]);
    return `${month} ${day}${ordinalSuffix(day)}, ${Number(m[1])}`;
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
      html, body {
        overflow-x: hidden;
      }

      body {
        padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
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
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 10px);
        box-sizing: border-box;
        pointer-events: auto;
      }

      #rmAppBar {
        display: flex;
        align-items: stretch;
        gap: 8px;
        width: 100%;
        margin: 0 auto;
        padding: 8px;
        border-radius: 20px;
        background: rgba(10,10,10,.97);
        border: 1px solid rgba(255,255,255,.08);
        box-shadow: 0 10px 30px rgba(0,0,0,.28);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-sizing: border-box;
      }

      .rm-sober-panel {
        flex: 0 0 310px;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 16px;
        background: linear-gradient(180deg, #181818 0%, #0f0f0f 100%);
        color: #f5f5f5;
        border: 1px solid rgba(214,179,106,.18);
        border-left: 4px solid #d6b36a;
        box-sizing: border-box;
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
        line-height: 1;
      }

      .rm-sober-main {
        font-size: 14px;
        font-weight: 900;
        line-height: 1.1;
        color: #fff;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .rm-sober-sub {
        font-size: 11px;
        color: rgba(255,255,255,.72);
        line-height: 1.15;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .rm-sober-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 0 0 auto;
      }

      .rm-sober-btn {
        appearance: none;
        border-radius: 10px;
        padding: 6px 8px;
        text-decoration: none;
        cursor: pointer;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        line-height: 1;
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,.12);
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
        border-color: rgba(255,255,255,.16);
      }

      .rm-nav-links {
        flex: 1 1 auto;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 6px;
      }

      .navItem {
        min-height: 68px;
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

      /* The code on WHITE, always. On the app's dark ground a QR does not
         scan on half the phones out there, and "it works on mine" is how
         that ships. 220px is about the floor for a phone reading it off
         another phone at arm's length. */
      .rm-qr-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin: 14px 0 4px;
      }

      .rm-qr {
        width: 232px;
        max-width: 72vw;
        aspect-ratio: 1;
        background: #fff;
        border-radius: 16px;
        padding: 12px;
        box-sizing: border-box;
        box-shadow: 0 10px 28px rgba(0,0,0,.45);
      }

      .rm-qr svg { width: 100%; height: 100%; display: block; }

      .rm-qr-url {
        font-size: 15px;
        letter-spacing: .02em;
        color: #f5f5f5;
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
      /* ---- THE SOBER DATE WHEELS ---------------------------------------
         Three columns you spin, the way a phone asks for a date, instead of
         typing DD-MM-YYYY into a box and being told off for getting it
         wrong. The date somebody is entering here is often the single most
         important date in their life -- it should not be a form field with
         a validation error hanging off it.

         Scroll-snap does the work. Each column is an ordinary scroller whose
         items snap to centre; the reading is taken from scrollTop once it
         settles, so there is no drag maths to get wrong and it keeps native
         momentum on a real phone. */
      .rm-wheels {
        position: relative;
        display: grid;
        grid-template-columns: 1.55fr 1fr 1.2fr;
        gap: 2px;
        margin: 4px 0 2px;
        /* 5 rows of 40px. Odd number, so there IS a middle. */
        height: 200px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.10);
        background: #0f0f0f;
        overflow: hidden;
      }

      /* The lit band across the middle, under the numbers. */
      .rm-wheels::before {
        content: "";
        position: absolute;
        left: 6px; right: 6px; top: 80px; height: 40px;
        border-top: 1px solid rgba(214,179,106,.45);
        border-bottom: 1px solid rgba(214,179,106,.45);
        background: rgba(214,179,106,.09);
        border-radius: 8px;
        pointer-events: none;
        z-index: 1;
      }

      /* Fade top and bottom so the column reads as a wheel turning away
         rather than a list that has been cut off. */
      .rm-wheels::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        background: linear-gradient(180deg,
          #0f0f0f 0%, rgba(15,15,15,.72) 16%, rgba(15,15,15,0) 38%,
          rgba(15,15,15,0) 62%, rgba(15,15,15,.72) 84%, #0f0f0f 100%);
      }

      .rm-wheel {
        position: relative;
        z-index: 3;
        height: 100%;
        overflow-y: scroll;
        scroll-snap-type: y mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        /* Nothing but the middle row is a hit target for the eye, so the
           scrollbar would only be clutter. */
        text-align: center;
      }
      .rm-wheel::-webkit-scrollbar { display: none; }

      /* 80px of nothing above and below, so the first and last items can
         reach the middle. */
      .rm-wheel .pad { height: 80px; }

      .rm-wheel .opt {
        height: 40px;
        line-height: 40px;
        scroll-snap-align: center;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 17px;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,.34);
        white-space: nowrap;
        transition: color .12s ease, transform .12s ease;
        user-select: none;
      }
      .rm-wheel .opt.near { color: rgba(255,255,255,.58); }
      .rm-wheel .opt.sel {
        color: #f7efd9;
        font-weight: 700;
        transform: scale(1.06);
      }
      /* A day that does not exist in the chosen month is still in the column,
         because a column that changes length under your thumb is worse. It
         just cannot be landed on. */
      .rm-wheel .opt.void { opacity: .18; }

      .rm-wheel-read {
        margin: 10px 0 0;
        text-align: center;
        font-size: 13px;
        color: rgba(255,255,255,.74);
      }
      .rm-wheel-read b { color: #f7efd9; font-weight: 700; }
      .rm-wheel-read .days { color: #d6b36a; font-weight: 700; }


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

      /* =====================================================================
         SHARE THE APP — built to the approved mockup.

         EVERY RULE HERE IS SCOPED TO .rm-share-sheet. nav.js is loaded by
         every page in the app and .rm-modal is also the Sober Date dialog;
         restyling the shared class would have quietly redressed a screen
         nobody asked me to touch.
         ================================================================= */
      /* THE TITLE IS IN THE ARTWORK, so the real words live here where only a
         screen reader will find them. The dialog still has a name; it is just
         not drawn twice. */
      .rm-sr-only {
        position: absolute !important;
        width: 1px; height: 1px;
        margin: -1px; padding: 0; border: 0;
        clip: rect(0 0 0 0); clip-path: inset(50%);
        overflow: hidden; white-space: nowrap;
      }
      .rm-share-sheet .rm-modal {
        position: relative;
        width: min(340px, 100%);
        padding: 30px 16px 16px;
        border-radius: 16px;
        border: 1px solid rgba(215,178,83,.45);
        background:
          linear-gradient(180deg, rgba(241,231,207,.05), rgba(241,231,207,0) 40%),
          #14140f;
        box-shadow: 0 20px 50px rgba(0,0,0,.6);
        overflow: visible;
        text-align: center;
      }
      /* the worn grain, under everything, never over the code */
      .rm-share-sheet .rm-modal::before {
        content: "";
        position: absolute; inset: 0;
        border-radius: inherit;
        pointer-events: none;
        opacity: .16;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='s'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23s)'/%3E%3C/svg%3E");
      }
      .rm-share-sheet .rm-modal > * { position: relative; z-index: 1; }

      /* THE BANNER CARRIES ITS OWN TAPE. It was cut out of the mockup with
         the tape corners attached, so it hangs over the top edge of the
         sheet the way it is drawn rather than sitting inside it. */
      .rm-share-banner {
        display: block;
        width: 306px; max-width: 104%;
        height: auto;
        margin: -46px auto 2px;
        pointer-events: none;
      }
      .rm-share-sheet .rm-share-lead {
        font-family: "RM Type", "Courier New", Courier, monospace;
        font-size: 12px; line-height: 1.35;
        color: #eee6d5;
        margin: 4px 0 12px;
      }

      .rm-share-code { position: relative; }
      /* THE CODE ON WHITE WITH ITS QUIET ZONE. A phone camera needs the pale
         margin around a code as much as the code itself; on the app's dark
         ground a code with no border does not scan. */
      .rm-share-sheet .rm-qr {
        width: 164px; height: 164px;
        margin: 0 auto;
        padding: 10px;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(0,0,0,.45);
      }
      .rm-share-sheet .rm-qr svg { width: 100%; height: 100%; display: block; }
      .rm-share-pass {
        position: absolute; right: 4px; top: 10px;
        width: 56px; height: auto; pointer-events: none;
      }
      .rm-share-stars {
        position: absolute; left: 6px; bottom: 10px;
        width: 42px; height: auto; pointer-events: none;
      }

      .rm-share-sheet .rm-qr-url {
        display: block;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px; letter-spacing: .4px;
        color: #f4ecd8;
        margin: 12px 0 0;
      }
      .rm-share-rule { display: block; width: 150px; height: auto; margin: 1px auto 12px; }

      .rm-share-sheet .rm-modal-row { display: flex; gap: 10px; margin: 0; }
      .rm-share-sheet .rm-modal-row button {
        flex: 1 1 0;
        min-height: 46px;
        border-radius: 10px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-weight: 800; font-size: 13px; letter-spacing: 1.6px;
        text-transform: uppercase;
        cursor: pointer;
      }
      .rm-share-sheet .rm-modal-cancel {
        border: 1.5px solid rgba(215,178,83,.75);
        background: transparent;
        color: #f4ecd8;
      }
      .rm-share-sheet .rm-modal-save {
        border: 0;
        background: linear-gradient(180deg, #ecce85 0%, #ddb765 52%, #cda44d 100%);
        color: #17130b;
      }
      /* COPY LINK is the quiet third option, the way the mockup has it:
         under the two buttons, no box around it, but still a real 44px
         target because it is a real thing to tap. */
      .rm-share-copy {
        display: inline-flex; align-items: center; justify-content: center; gap: 9px;
        min-height: 44px; margin: 4px auto 0; padding: 8px 14px;
        border: 0; background: none; cursor: pointer;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-weight: 700; font-size: 12.5px; letter-spacing: 1.4px;
        text-transform: uppercase; color: #eee6d5;
      }
      .rm-share-copy svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.8; }
      .rm-share-copy:active { color: #d7b253; }
      .rm-share-say {
        min-height: 16px; margin: 2px 0 0;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 11.5px; color: #aaa497;
      }

      @media (max-width: 340px) {
        .rm-share-banner { width: 270px; margin-top: -40px; }
        .rm-share-sheet .rm-qr { width: 146px; height: 146px; }
      }

      @media (max-width: 900px) {
        body {
          padding-bottom: calc(172px + env(safe-area-inset-bottom, 0px));
        }

        #rmAppBar {
          flex-direction: column;
        }

        .rm-sober-panel {
          flex: 1 1 auto;
          width: 100%;
        }

        .rm-nav-links {
          width: 100%;
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .navItem {
          min-height: 58px;
          font-size: 10px;
        }
      }

      @media (max-width: 640px) {
        body {
          padding-bottom: calc(170px + env(safe-area-inset-bottom, 0px));
        }

        #rm-bottom-nav .rm-nav-wrap {
          padding-left: 8px;
          padding-right: 8px;
        }

        #rmAppBar {
          padding: 6px;
          gap: 6px;
          border-radius: 16px;
        }

        .rm-sober-panel {
          padding: 8px 9px;
          border-radius: 13px;
        }

        .rm-sober-main {
          font-size: 13px;
        }

        .rm-sober-sub {
          font-size: 10px;
        }

        .rm-sober-actions {
          flex-direction: row;
          gap: 5px;
        }

        .rm-sober-btn {
          padding: 6px 7px;
          font-size: 8px;
          border-radius: 8px;
        }

        .rm-nav-links {
          gap: 4px;
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .navItem {
          min-height: 52px;
          font-size: 9px;
          border-radius: 12px;
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
    share: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><path d="M4 12v7a1.6 1.6 0 0 0 1.6 1.6h12.8A1.6 1.6 0 0 0 20 19v-7" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M12 15.5V3.8M8 7.4l4-3.6 4 3.6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  /* ROOT-ABSOLUTE, NOT "./".

     This bar is on every page of the app, and "./readings.html" only means
     the right thing on a page that sits at the top of the site. The 366
     generated reading pages live three folders down, at
     /another-day-sober/09-15/some-title/ -- and from there "./readings.html"
     asks for a file inside that folder, which does not exist. Every tab on
     the bar was a 404 on all 366 of them.

     A leading slash means the same thing from any depth. */
  const items = [
    { href: "/index.html", label: "Home", icon: ICONS.home },
    { href: "/tools.html", label: "Tools", icon: ICONS.tools },
    { href: "/readings.html", label: "Readings", icon: ICONS.book },
    { href: "/audio.html", label: "Audio", icon: ICONS.audio },
    { href: "/fun.html", label: "Fun", icon: ICONS.fun },
    /* SHARE, NOT A PAGE. It opens the code sheet rather than going anywhere,
       which is why it carries data-rm-share and a href that means "no
       destination" -- the click handler below stops it. */
    { href: "#share", label: "Share", icon: ICONS.share, share: true }
  ];

  injectStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "rm-nav-wrap";

  const appBar = document.createElement("div");
  appBar.id = "rmAppBar";

  const soberPanel = document.createElement("div");
  soberPanel.className = "rm-sober-panel";
  soberPanel.innerHTML = `
    <div class="rm-sober-copy">
      <div class="rm-sober-kicker">Sober Date</div>
      <div class="rm-sober-main" id="rmSoberBarText">None</div>
      <div class="rm-sober-sub" id="rmSoberBarSub">Home feeling ---</div>
    </div>
    <div class="rm-sober-actions">
      <button type="button" class="rm-sober-btn set" id="rmSetSoberDateBtn">Set</button>
      <a class="rm-sober-btn share" id="rmShareSoberDateBtn" href="/sober-date.html">Share</a>
      <a class="rm-sober-btn share" id="rmAccountBtn" href="/account.html">Account</a>
    </div>
  `;

  function refreshSoberPanel() {
    const main = soberPanel.querySelector("#rmSoberBarText");
    const sub = soberPanel.querySelector("#rmSoberBarSub");
    const setBtnEl = soberPanel.querySelector("#rmSetSoberDateBtn");

    const days = computeSoberDays();
    const ymd = getSoberDateYMD();

    if (!ymd || days === null) {
      main.textContent = "None";
      sub.textContent = "Set your sober date";
      if (setBtnEl) setBtnEl.style.display = "";
      return;
    }

    main.textContent = `${days.toLocaleString()} days`;
    sub.textContent = `Since ${ymdToDisplayLong(ymd)}`;

    /* SET HAS DONE ITS JOB, SO IT STOPS TAKING UP THE BAR.

       It is hidden, not removed, and the difference matters: sober-date.html's
       "Change my sober date" button works by reaching over and clicking THIS
       button, and .click() still fires on an element with display:none. Delete
       it and that screen's only way to change the date quietly stops working.

       So the way back in is still there -- it just lives on the Share screen
       now instead of sitting on the bar forever. */
    if (setBtnEl) setBtnEl.style.display = "none";
  }

  /* ---- the sober date wheels ---------------------------------------------

     Three scrollers, snapped to their middle row. The value of a wheel is
     just round(scrollTop / 40) -- no drag handling, no velocity maths, and
     the browser keeps its own momentum and rubber-banding, which is most of
     what makes a picker feel right on a phone.

     THE TWO THINGS THAT GO WRONG WITH A DATE PICKER, both handled here:

       1. February. Thirty-one days are always on the day wheel, because a
          column that grows and shrinks under your thumb is horrible. The
          ones that do not exist this month are dimmed and cannot be landed
          on -- land on one and it slides back to the last real day.

       2. The future. This is a SOBER date. Tomorrow is not a valid answer,
          and neither is next year, so anything past today is dimmed the
          same way and the wheels walk themselves back to today.
  */
  const WHEEL_H = 40;
  const MONTHS_LONG = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
  /* Far enough back for anybody. AA started in 1935. */
  const YEAR_MIN = 1935;

  let wheelEls = null;

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

  function wheelIndex(el) {
    return Math.round(el.scrollTop / WHEEL_H);
  }

  function wheelValues() {
    if (!wheelEls) return null;
    const now = new Date();
    const yearMax = now.getFullYear();
    const m = Math.min(11, Math.max(0, wheelIndex(wheelEls.m)));
    const y = Math.min(yearMax, Math.max(YEAR_MIN, YEAR_MIN + wheelIndex(wheelEls.y)));
    const d = Math.min(31, Math.max(1, wheelIndex(wheelEls.d) + 1));
    return { y: y, m: m, d: d };
  }

  function wheelYMD() {
    const v = wheelValues();
    if (!v) return "";
    const d = Math.min(v.d, daysInMonth(v.y, v.m));
    return `${v.y}-${pad2(v.m + 1)}-${pad2(d)}`;
  }

  function scrollWheelTo(el, i, smooth) {
    el.scrollTo({ top: i * WHEEL_H, behavior: smooth ? "smooth" : "auto" });
  }

  function setWheels(ymd) {
    if (!wheelEls) return;
    const parts = String(ymd || "").split("-");
    const now = new Date();
    let y = parseInt(parts[0], 10) || now.getFullYear();
    let m = (parseInt(parts[1], 10) || now.getMonth() + 1) - 1;
    let d = parseInt(parts[2], 10) || now.getDate();
    y = Math.min(now.getFullYear(), Math.max(YEAR_MIN, y));
    m = Math.min(11, Math.max(0, m));
    d = Math.min(daysInMonth(y, m), Math.max(1, d));
    scrollWheelTo(wheelEls.m, m, false);
    scrollWheelTo(wheelEls.d, d - 1, false);
    scrollWheelTo(wheelEls.y, y - YEAR_MIN, false);
    paintWheels();
  }

  /* Which rows are dead right now, and the running total under the wheels. */
  function paintWheels() {
    if (!wheelEls) return;
    const v = wheelValues();
    if (!v) return;
    const now = new Date();
    const thisY = now.getFullYear(), thisM = now.getMonth(), thisD = now.getDate();
    const dim = daysInMonth(v.y, v.m);

    wheelEls.m.querySelectorAll(".opt").forEach((el, i) => {
      el.classList.toggle("void", v.y === thisY && i > thisM);
    });
    wheelEls.d.querySelectorAll(".opt").forEach((el, i) => {
      const day = i + 1;
      const future = (v.y === thisY && v.m === thisM && day > thisD);
      el.classList.toggle("void", day > dim || future);
    });
    wheelEls.y.querySelectorAll(".opt").forEach((el, i) => {
      el.classList.toggle("void", YEAR_MIN + i > thisY);
    });

    [wheelEls.m, wheelEls.d, wheelEls.y].forEach((el) => {
      const sel = wheelIndex(el);
      el.querySelectorAll(".opt").forEach((o, i) => {
        o.classList.toggle("sel", i === sel);
        o.classList.toggle("near", Math.abs(i - sel) === 1);
      });
    });

    const read = document.getElementById("rmWheelRead");
    if (read) {
      const ymd = wheelYMD();
      const days = daysBetweenLocal(ymd, todayLocalYMD());
      read.innerHTML = `<b>${MONTHS_LONG[v.m]} ${Math.min(v.d, dim)}, ${v.y}</b>` +
        (days >= 0 ? ` &middot; <span class="days">${days.toLocaleString()} day${days === 1 ? "" : "s"}</span>` : "");
    }
  }

  /* After a wheel settles, walk it back out of any dead row it landed in. */
  function settleWheels() {
    if (!wheelEls) return;
    const now = new Date();
    const thisY = now.getFullYear(), thisM = now.getMonth(), thisD = now.getDate();
    let v = wheelValues();

    if (v.y > thisY) { scrollWheelTo(wheelEls.y, thisY - YEAR_MIN, true); v.y = thisY; }
    if (v.y === thisY && v.m > thisM) { scrollWheelTo(wheelEls.m, thisM, true); v.m = thisM; }
    const dim = daysInMonth(v.y, v.m);
    let maxD = dim;
    if (v.y === thisY && v.m === thisM) maxD = Math.min(dim, thisD);
    if (v.d > maxD) scrollWheelTo(wheelEls.d, maxD - 1, true);
    paintWheels();
  }

  function buildWheels(modal) {
    const m = modal.querySelector("#rmWheelM");
    const d = modal.querySelector("#rmWheelD");
    const y = modal.querySelector("#rmWheelY");
    if (!m || !d || !y) return;
    wheelEls = { m: m, d: d, y: y };

    const fill = (el, labels) => {
      el.innerHTML = '<div class="pad"></div>' +
        labels.map((t) => `<div class="opt">${t}</div>`).join("") +
        '<div class="pad"></div>';
    };
    fill(m, MONTHS_LONG);
    fill(d, Array.from({ length: 31 }, (_, i) => String(i + 1)));
    const thisY = new Date().getFullYear();
    fill(y, Array.from({ length: thisY - YEAR_MIN + 1 }, (_, i) => String(YEAR_MIN + i)));

    [m, d, y].forEach((el) => {
      let t = null;
      el.addEventListener("scroll", () => {
        paintWheels();
        clearTimeout(t);
        /* scrollend is not everywhere yet, so this is the fallback that
           actually runs on the phones this app is installed on. */
        t = setTimeout(settleWheels, 130);
      }, { passive: true });

      /* Tapping a row is quicker than spinning to it, and a keyboard has to
         work at all -- this is the one screen somebody might be filling in
         with shaking hands. */
      el.addEventListener("click", (e) => {
        const opt = e.target.closest(".opt");
        if (!opt || opt.classList.contains("void")) return;
        const list = [...el.querySelectorAll(".opt")];
        scrollWheelTo(el, list.indexOf(opt), true);
        setTimeout(settleWheels, 220);
      });
      el.addEventListener("keydown", (e) => {
        const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        scrollWheelTo(el, Math.max(0, wheelIndex(el) + step), true);
        setTimeout(settleWheels, 220);
      });
    });
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
        <p>Spin to your date.</p>
        <div class="rm-wheels" id="rmWheels">
          <div class="rm-wheel" id="rmWheelM" role="listbox" aria-label="Month" tabindex="0"></div>
          <div class="rm-wheel" id="rmWheelD" role="listbox" aria-label="Day" tabindex="0"></div>
          <div class="rm-wheel" id="rmWheelY" role="listbox" aria-label="Year" tabindex="0"></div>
        </div>
        <p class="rm-wheel-read" id="rmWheelRead" role="status" aria-live="polite"></p>
        <div class="rm-modal-note">Saved only on this device.</div>
        <div class="rm-modal-row">
          <button type="button" class="rm-modal-cancel" id="rmSoberDateCancel">Cancel</button>
          <button type="button" class="rm-modal-save" id="rmSoberDateSave">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancel = modal.querySelector("#rmSoberDateCancel");
    const save = modal.querySelector("#rmSoberDateSave");
    buildWheels(modal);

    cancel.addEventListener("click", () => {
      modal.classList.remove("show");
    });

    save.addEventListener("click", () => {
      const ymd = wheelYMD();
      if (!ymd) return;
      localStorage.setItem(SOBER_KEY, ymd);
      /* Asked HERE as well as on load, because saving a sober date is the
         strongest signal this person means it -- and Chrome and Safari both
         decide whether to grant persistence from engagement. */
      keepStorage();
      modal.classList.remove("show");
      refreshSoberPanel();
      /* And up to the account, if there is one. Fire and forget -- the date
         is already saved on this phone, so a failed push costs nothing but
         a later sync. */
      pushSoberDate();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });

    return modal;
  }

  function openSoberModal() {
    const modal = ensureModal();
    modal.classList.add("show");
    /* Set the wheels AFTER the modal is displayed. A scroller inside
       display:none has no height, so every scrollTop written to it is
       silently thrown away and all three wheels open on January 1st of the
       first year. */
    requestAnimationFrame(() => setWheels(getSoberDateYMD() || todayLocalYMD()));
  }

  const navLinks = document.createElement("div");
  navLinks.className = "rm-nav-links";

  // Which file we are on -- and, for a page that is really a child of one
  // of the tabs, which tab it should light up instead. Another Day Sober is
  // opened FROM Readings, so Readings is the tab that belongs lit while you
  // are in it. Without this it lights nothing, and a bar with no tab lit
  // reads as though you have left the app.
  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const declared = (document.body.getAttribute("data-rm-nav") || "").toLowerCase();
  const cur = declared || file;

  items.forEach((it) => {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    /* Strips "./" or a leading "/" alike, so the tab still lights up now
       that the hrefs above are root-absolute. */
    const hrefFile = it.href.replace(/^\.?\//, "").toLowerCase();
    if (hrefFile === cur) a.classList.add("active");

    if (it.share) a.setAttribute("data-rm-share", "");
    a.innerHTML = `<span class="ico">${it.icon}</span><span>${it.label}</span>`;
    navLinks.appendChild(a);
  });

  appBar.appendChild(soberPanel);
  appBar.appendChild(navLinks);
  wrapper.appendChild(appBar);
  mount.replaceChildren(wrapper);

  const setBtn = soberPanel.querySelector("#rmSetSoberDateBtn");
  if (setBtn) {
    setBtn.addEventListener("click", openSoberModal);
  }

  refreshSoberPanel();
  setInterval(refreshSoberPanel, 60000);

  /* ---- THE ACCOUNT, IF THERE IS ONE -------------------------------------

     account.js fetches itself, the same way the QR encoder does and for the
     same reason: this bar is on every page of the app, and adding a script
     tag to all of them by hand is fifteen chances to miss one.

     EVERYTHING BELOW IS ALLOWED TO FAIL. No account, no signal, server
     having a bad morning -- localStorage is still the source of truth and
     every screen reads it exactly as it did before any of this existed. A
     sync feature must never be able to take the app down, and the way you
     guarantee that is by never letting it be the thing the app depends on.

     THE DATE ONLY EVER MOVES FORWARD INTO A PHONE THAT HAS NONE. If this
     phone and the account disagree, this does nothing at all and leaves it
     to account.html to ask the person which is right -- quietly overwriting
     somebody's sober date because a server said so is the single worst
     thing this code could do. */
  let accountLoading = null;
  function loadAccount() {
    if (window.RMAccount) return Promise.resolve(true);
    if (accountLoading) return accountLoading;
    accountLoading = new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "/assets/account.js";
      tag.onload = () => resolve(!!window.RMAccount);
      tag.onerror = () => resolve(false);
      document.head.appendChild(tag);
    });
    return accountLoading;
  }

  /* Only bothers the network for somebody who actually has an account --
     the token is in localStorage, so this costs one read for everybody else. */
  function hasAccountToken() {
    try { return !!localStorage.getItem("rm_account_v1"); } catch (e) { return false; }
  }

  async function syncFromAccount() {
    if (!hasAccountToken()) return;
    if (!(await loadAccount())) return;
    try {
      const remote = await window.RMAccount.pull();
      if (!remote || !remote.data) return;

      const here = getSoberDateYMD();
      const there = remote.data.soberDate;

      if (there && !here) {
        /* This phone has nothing. Fill it in and say so on the bar. */
        window.RMAccount.apply(remote.data);
        refreshSoberPanel();
      } else if (here && !there) {
        /* The account has nothing. Send this phone's copy up. */
        await window.RMAccount.push(Object.assign({}, remote.data, { soberDate: here }));
      }
      /* here && there && different -> left alone on purpose. account.html asks. */
    } catch (e) { /* best effort, always */ }
  }

  /* When somebody sets their date on this phone, the account hears about it. */
  async function pushSoberDate() {
    if (!hasAccountToken()) return;
    if (!(await loadAccount())) return;
    try {
      const d = getSoberDateYMD();
      if (!d) return;
      const remote = await window.RMAccount.pull();
      const base = (remote && remote.data) || {};
      if (base.soberDate === d) return;
      await window.RMAccount.push(Object.assign({}, base, { soberDate: d }));
    } catch (e) {}
  }

  syncFromAccount();

  /* Asked again on every load, for everybody who already has a date saved
     from before this existed. persisted() is checked first so a browser that
     has already said yes is never asked twice. */
  if (getSoberDateYMD()) keepStorage();

  /* =======================================================================
     SHARE — the code somebody points a phone at.

     This replaced the Updates tab. Handing the app to somebody at a meeting
     used to mean spelling out an address; now they point a camera at your
     screen and they have it.

     The code is DRAWN HERE, from RM_QR, rather than being a picture: it can
     never go stale, it needs no network, and it still works in a church
     basement with one bar of signal. The two buttons under it are for
     somebody who is not standing in front of you.
     ==================================================================== */
  const SHARE_URL = "https://recoverymisfits.org/";
  const SHARE_LABEL = "recoverymisfits.org";

  /* THE ENCODER FETCHES ITSELF. nav.js is on every page of this app; adding
     a second script tag to all of them by hand is fifteen chances to miss
     one, and the miss shows up as a share sheet with a hole in it on the
     one page nobody checked. It is asked for once, the first time somebody
     opens the sheet, and never on a page load. */
  let qrLoading = null;
  function loadQR() {
    if (window.RM_QR && window.RM_QR.svg) return Promise.resolve(true);
    if (qrLoading) return qrLoading;
    qrLoading = new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "/qr.js";
      tag.onload = () => resolve(!!(window.RM_QR && window.RM_QR.svg));
      tag.onerror = () => resolve(false);
      document.head.appendChild(tag);
    });
    return qrLoading;
  }

  /* WHERE FOCUS WAS WHEN THE SHEET OPENED, so it can be put back. A dialog
     that swallows focus and never returns it strands anyone using a keyboard
     or a screen reader on a page they cannot get back to. */
  let shareOpener = null;

  function ensureShareModal() {
    let modal = document.getElementById("rmShareModal");
    if (modal) return modal;

    const code = (window.RM_QR && window.RM_QR.svg)
      ? window.RM_QR.svg(SHARE_URL, { margin: 2, dark: "#111111", light: "#ffffff" })
      : "";

    modal = document.createElement("div");
    modal.id = "rmShareModal";
    modal.className = "rm-modal-backdrop rm-share-sheet";
    modal.innerHTML = `
      <div class="rm-modal" role="dialog" aria-modal="true" aria-labelledby="rmShareTitle">
        <img class="rm-share-banner" src="/assets/pages/s-banner.webp" alt="" aria-hidden="true">
        <h3 id="rmShareTitle" class="rm-sr-only">Share the app</h3>
        <p class="rm-share-lead">Point a phone camera at the code.</p>

        <div class="rm-share-code">
          ${code ? `<div class="rm-qr">${code}</div>` : ""}
          <img class="rm-share-pass" src="/assets/pages/s-passiton.webp" alt="" aria-hidden="true">
          <img class="rm-share-stars" src="/assets/pages/s-stars.webp" alt="" aria-hidden="true">
        </div>

        <b class="rm-qr-url">${SHARE_LABEL}</b>
        <img class="rm-share-rule" src="/assets/pages/s-urlrule.webp" alt="" aria-hidden="true">

        <div class="rm-modal-row">
          <button type="button" class="rm-modal-cancel" id="rmShareClose">Close</button>
          <button type="button" class="rm-modal-save" id="rmShareSend">Send link</button>
        </div>
        <button type="button" class="rm-share-copy" id="rmShareCopy">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round"/></svg>
          Copy link
        </button>
        <p class="rm-share-say" id="rmShareSay" role="status" aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(modal);

    const say = (msg) => {
      const el = modal.querySelector("#rmShareSay");
      el.textContent = msg;
      setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 2600);
    };

    function close() {
      modal.classList.remove("show");
      /* Back where it came from, not to the top of the page. */
      if (shareOpener && document.contains(shareOpener)) {
        try { shareOpener.focus(); } catch (_) {}
      }
      shareOpener = null;
    }
    modal.rmClose = close;

    modal.querySelector("#rmShareClose").addEventListener("click", close);
    /* Tapping the dark closes it too. A sheet with one way out is a trap
       the first time somebody opens it by accident. */
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

    /* ESCAPE CLOSES IT, AND TAB STAYS INSIDE IT. Both are the same listener
       because both are about the sheet owning the keyboard while it is up. */
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const focusable = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const send = modal.querySelector("#rmShareSend");
    send.addEventListener("click", async () => {
      /* The phone's own share sheet where there is one, the clipboard
         everywhere else -- and it says which happened, because a button
         that silently did something gets pressed four times. */
      try {
        if (navigator.share) {
          await navigator.share({ title: "Recovery Misfits", url: SHARE_URL });
          return;
        }
      } catch (_) { return; }
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        say("Link copied.");
      } catch (_) { say(SHARE_URL); }
    });

    modal.querySelector("#rmShareCopy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        say("Link copied.");
      } catch (_) {
        /* No clipboard permission: show the address so it can be read out or
           typed. Better than a button that appears to do nothing. */
        say(SHARE_URL);
      }
    });

    return modal;
  }

  navLinks.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-rm-share]");
    if (!btn) return;
    e.preventDefault();
    await loadQR();
    /* NO SIGNAL, NO CODE -- but still a sheet. The address and the Send
       Link button are the parts that matter on a phone with one bar, and a
       dead tab would be worse than a sheet missing its picture. */
    shareOpener = btn;
    const sheet = ensureShareModal();
    sheet.classList.add("show");
    /* Focus goes INTO the sheet so Escape and Tab reach it, and so a screen
       reader starts reading the dialog rather than the page behind it. */
    const firstBtn = sheet.querySelector("#rmShareClose");
    if (firstBtn) { try { firstBtn.focus(); } catch (_) {} }
  });
})();

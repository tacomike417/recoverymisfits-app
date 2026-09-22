// nav.js — Recovery Misfits v2 bottom app bar with left sober panel
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  const SOBER_KEY = "rm_sober_date";
  const STYLE_ID = "rm-nav-styles";

  /* ---- THE COINS ---------------------------------------------------------
     coins.js owns everything to do with sobriety coins: the one on the rail
     where the share icon used to be, the reveal when somebody earns a new
     one, and the picture the share card draws. It is loaded from here rather
     than added to fifteen separate pages, because this file is already on
     every one of them.

     It drives itself -- it finds the rail, repaints when the count changes,
     and needs nothing called from in here. If it fails to load, the rail
     keeps its original share icon and nothing else notices. */
  (function loadCoins() {
    if (document.getElementById("rm-coins-js")) return;
    const c = document.createElement("script");
    c.id = "rm-coins-js";
    c.src = "/coins.js";
    c.defer = true;
    document.head.appendChild(c);
  })();

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
    /* Reading storage THROWS in iOS private browsing and wherever site data
       is blocked -- it does not quietly return null. Unguarded, that took
       the whole counter down mid-render on those phones. No stored date is
       the honest answer there. */
    let v = null;
    try { v = localStorage.getItem(SOBER_KEY); } catch (e) { return ""; }
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

  /* THE RAIL SAYS IT SHORT.

     The date well in the plate is about eighty pixels of usable room, so the
     spoken-out-loud version ("September 15th, 2018") does not fit and gets
     chopped by the ellipsis. The rail gets the short form instead -- same
     date, same order, three-letter month. The long form is still what the
     rest of the app uses. */
  function ymdToRail(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!m) return "";
    const month = MONTH_NAMES_LONG[Number(m[2]) - 1];
    if (!month) return "";
    return `${month.slice(0, 3).toUpperCase()} ${Number(m[3])}, ${Number(m[1])}`;
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

      /* ROOM FOR THE WHOLE STACK, INCLUDING THE PART THAT IS NOT ALWAYS
         THERE. Greeting 34 + rail 71 + nav 66 + 10 = 181, and the greeting
         only exists for somebody signed in -- so the padding has to be sized
         for the tallest case or the last row of a page hides under the bar
         the moment you make an account. */
      body {
        padding-bottom: calc(186px + var(--rm-rail-extra, 0px) + env(safe-area-inset-bottom, 0px));
      }

      /* THE BAR BRINGS ITS OWN TYPE.

         Almost nothing inside this bar declared a font, so every word in it
         was inherited from whatever page it happened to be sitting on --
         and this app's pages do not agree. The ones on daily-reading.css
         handed it a serif; the ones with their own :root handed it
         something else; a page with neither fell through to Times New
         Roman. Same bar, different face, depending which tab you were on.

         One declaration here and the whole bar inherits from the bar
         instead of from the page. The explicit line-height is the other
         half: without it the panel's height moved with the inherited
         metrics, which is why the bar stood 143px tall on Home and 129px
         on Tools. */
      /* A <button> does not inherit font-family from its parent -- browsers
         hand form controls their own UI font unless told otherwise -- so
         pinning it on the bar alone left every button in here in Arial
         while the text around it was system-ui. */
      #rm-bottom-nav button,
      #rm-bottom-nav a,
      #rm-bottom-nav input,
      .rm-modal-backdrop button,
      .rm-modal-backdrop input { font-family: inherit; }

      #rm-bottom-nav {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        line-height: 1.2;
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

      /* GLAD YOU ARE HERE, <name>.

         Sits across the top of the bar and only exists for somebody signed
         in. The name is read straight out of the stored session -- no
         network and no account.js, just one localStorage read on a page
         that was going to read localStorage anyway. */
      .rm-greet {
        display:inline-flex;align-items:center;gap:7px;
        margin:0 0 7px 4px;
        padding:6px 12px;
        border-radius:999px;
        background:rgba(10,10,10,.92);
        border:1px solid rgba(255,255,255,.08);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        font-size:12px;letter-spacing:.2px;line-height:1;
        color:#aaa497;
        max-width:calc(100% - 8px);
      }
      .rm-greet span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .rm-greet b{color:#d6b36a;font-weight:800}
      .rm-greet svg{width:13px;height:13px;flex:none;fill:none;
        stroke:#d6b36a;stroke-width:2;opacity:.9}

      /* ---- THE SOBER RAIL -------------------------------------------------
         THE PLATE IS ARTWORK, NOT CSS. An earlier pass drew this -- gradients,
         box-shadows, a hand-rolled screw -- and it was never going to be the
         beaten brass placard in the drawing. It is one PNG now, with the
         wear, the screws, the brass edge and the four sunken wells baked in.

         EVERYTHING LIVE SITS ON TOP OF IT, positioned by percentage against
         the wells that are painted into the plate. The date changes, the
         count changes every night, and a screen reader has to read both --
         none of that can be part of a picture.

         THE NUMBERS COME FROM THE ART TOO. The wells were measured off the
         delivered plate rather than guessed:

             date well     x  21.0 ..  114.7   of 390
             counter well  x 123.0 ..  274.7
             share well    x 283.0 ..  326.7
             account well  x 335.0 ..  380.7
             all of them   y  10   ..   53.7   of 64

         Change the plate and those four numbers have to change with it.
      */
      /* THE RAIL'S LETTERING IS OSWALD LIGHT.

         The approved mockup uses a thin condensed all-caps face for every
         word on the plate -- SOBER SINCE, the date, DAYS, SHARE, ACCOUNT.
         That is Oswald, and the app already ships the 600 cut for its
         headlines; this is the 500. Measured off the mockup, the strokes on
         the plate are about a sixth of the cap height -- Medium, not Light.
         It is self-hosted like the rest, so the rail draws with no network. */
      @font-face{
        font-family:"RM Rail";
        src:url("/assets/fonts/oswald-500.woff2") format("woff2");
        font-weight:500;font-style:normal;font-display:swap;
      }

      /* ONE PICTURE, DRAWN AT ONE SIZE, SCALED AS A WHOLE.

         The rail is laid out at exactly 374 x 64 -- the size the artwork was
         drawn for -- and then the entire thing, plate and lettering and
         tiles together, is scaled by one number to fit whatever phone it
         landed on. Nothing inside is ever resized on its own, so the picture
         cannot stretch and the wells cannot drift off the art.

         --rm-rail-s is that number, set from the real measured width just
         below. 374 wide is an iPhone 15; a small Android comes out at 0.81
         and a Pro Max at 1.11, and the proportions are identical in all
         three. */
      /* NARROWER THAN THE BAR IT SITS ON.

         The rail and the nav below it were the same 374px, but the nav
         insets its contents by 8px and rounds its corners, so the rail's
         artwork ran edge to edge past it and read like an umbrella over the
         top. At 90% it tucks inside the bar's footprint. The scale factor
         is measured from this box, so the whole picture just comes down
         with it -- nothing inside needed touching. */
      .rm-rail-fit{
        position:relative;
        width:90%;
        margin:0 auto 7px;
        height:calc(64px * var(--rm-rail-s, 1));
        overflow:hidden;
      }
      .rm-rail {
        position:absolute;top:0;left:var(--rm-rail-x, 0px);
        width:374px;
        height:64px;
        transform-origin:top left;
        transform:scale(var(--rm-rail-s, 1));
        color:#eee4cf;
        background-image:url("/assets/rail/rail-plate.webp");
        background-size:100% 100%;
        background-repeat:no-repeat;
        font-family:"RM Rail",Oswald,"Avenir Next Condensed","Roboto Condensed",
                    "Arial Narrow",system-ui,sans-serif;
        font-weight:500;
        /* the plate carries its own edge, so nothing is drawn around it */
      }
      .rm-rail button,.rm-rail a{
        color:inherit;font-family:inherit;font-weight:inherit;
        text-decoration:none;border:0;background:transparent;padding:0;
        -webkit-tap-highlight-color:transparent;
      }
      .rm-rail button:focus-visible,.rm-rail a:focus-visible{
        outline:2px solid #f0d27d;outline-offset:2px;border-radius:4px}

      /* THE PLATE IS ONLY A PLATE.

         Everything that used to be painted into the picture -- the four
         wells, the brass dividers -- is drawn here instead, laid out by
         flexbox. That is the whole point: a well drawn in code sits exactly
         where its content sits, so it cannot drift off the art, and the
         underlay becomes a piece of metal with nothing on it to line up
         with. Swap the plate for a different one and none of this moves. */
      .rm-rail{display:flex;align-items:center;padding:0 8px}

      .rm-rail-date,.rm-rail-count,.rm-rail-act{
        height:44px;display:flex;align-items:center;
        border-radius:5px;
        background:linear-gradient(180deg,rgba(0,0,0,.62),rgba(0,0,0,.40));
        box-shadow:inset 0 1px 2px rgba(0,0,0,.85),
                   inset 0 0 0 1px rgba(215,178,83,.12),
                   0 1px 0 rgba(255,255,255,.05);
      }
      /* the thin brass hairlines between the sections */
      .rm-rail-sep{
        flex:0 0 1px;height:34px;margin:0 5px;
        background:linear-gradient(180deg,transparent,
                   rgba(215,178,83,.45) 18%,rgba(215,178,83,.45) 82%,transparent);
      }

      /* Both lines are centered in the well, the way they are in the
         mockup -- they are nearly the same width, so centering reads as one
         stacked block rather than two left-hung lines. */
      .rm-rail-date{flex:0 0 76px;
        flex-direction:column;justify-content:center;
        gap:3px;padding:0 3px;cursor:pointer;text-align:center}
      .rm-rail-count{flex:1 1 auto;min-width:0;justify-content:center;gap:1px}
      .rm-rail-act.rm-share  {flex:0 0 46px}
      .rm-rail-act.rm-account{flex:0 0 54px}

      .rm-rail-date:active,.rm-rail-act:active{filter:brightness(1.35)}

      .rm-rail-date .k{
        color:#d9ab4e;font-size:9.5px;line-height:1;font-weight:500;
        letter-spacing:.11em;text-transform:uppercase;white-space:nowrap;
        text-shadow:0 1px 0 #000;
      }
      .rm-rail-date .v{
        max-width:100%;overflow:hidden;color:#f4ecdb;
        font-size:12.5px;line-height:1;font-weight:500;letter-spacing:.045em;
        text-transform:uppercase;white-space:nowrap;text-overflow:clip;
        text-shadow:0 1px 0 #000;
      }

      /* THE TILES GROW AND SHRINK WITH THE COUNT.

         There is one well and the number in it can be one digit or six, so
         the tiles are sized per length: as big as the well allows, then
         stepped down only as far as each extra digit forces. Two days is
         not a reason to draw a small number. */
      .rm-rail-tile{width:26px;height:35px;display:block;flex:none}
      .rm-rail-count.d4 .rm-rail-tile{width:24px;height:32px}
      .rm-rail-count.d5 .rm-rail-tile{width:20px;height:27px}
      .rm-rail-count.d6 .rm-rail-tile{width:17px;height:23px}

      .rm-rail-days{
        margin-left:8px;color:#efe3c6;font-size:12.5px;font-weight:500;
        letter-spacing:.07em;line-height:1;flex:none;text-transform:uppercase;
        text-shadow:0 1px 0 #000;
      }
      .rm-rail-count.d5 .rm-rail-days{margin-left:7px;font-size:11.5px}
      .rm-rail-count.d6 .rm-rail-days{margin-left:6px;font-size:10.5px}

      .rm-rail-act{
        flex-direction:column;justify-content:center;gap:3px;
        cursor:pointer;font-size:9px;font-weight:500;letter-spacing:.055em;
        text-transform:uppercase;white-space:nowrap;
        text-shadow:0 1px 0 #000;
      }
      .rm-rail-act img{width:19px;height:19px;display:block;flex:none}

      /* No date yet: the counter has nothing honest to show, so its well
         stays empty rather than showing a number this app invented. */
      .rm-rail.no-date .rm-rail-count > *{visibility:hidden}

      /* No small-screen overrides: the whole rail is scaled by --rm-rail-s,
         so a 320px phone gets the same picture at 81%, not a different
         layout. The only thing that still changes inside the rail is the
         tile size, and that is driven by how many digits there are. */

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

      /* Same reasoning as the bar: these are appended to <body>, so they
         inherit from the page unless told otherwise. */
      .rm-modal-backdrop {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        line-height: 1.2;
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
          padding-bottom: calc(186px + var(--rm-rail-extra, 0px) + env(safe-area-inset-bottom, 0px));
        }

        #rmAppBar {
          flex-direction: column;
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
          padding-bottom: calc(186px + var(--rm-rail-extra, 0px) + env(safe-area-inset-bottom, 0px));
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
    /* A FRAMED PICTURE, because that is what a meme is.

       Same drawing as the Meme of the Day row on the home screen -- frame,
       hill, sun -- minus the little legs it stands on there. At 24px those
       legs are three grey smudges under the box and read as damage. */
    meme: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M3.4 15.6l4.6-4.3 3.4 3.1 4-4.6 5.2 5.4" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.9" cy="9.3" r="1.5" fill="currentColor"/></svg>`,

    /* A QR CODE, NOT THE SHARE GLYPH.

       This tab opens a QR code. It used to draw the box-with-an-up-arrow --
       which is the exact icon our own iPhone install instructions tell
       people to look for in Safari. Two different buttons, same picture, on
       a screen where one of them is how you install the app. A QR code
       looks like what it does. */
    share: `<svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
      <rect x="3.2" y="3.2" width="7.4" height="7.4" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.3"/>
      <rect x="13.4" y="3.2" width="7.4" height="7.4" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.3"/>
      <rect x="3.2" y="13.4" width="7.4" height="7.4" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.3"/>
      <path d="M13.4 13.4h3.3v3.3h-3.3zM17.5 13.4h3.3v3.3h-3.3zM13.4 17.5h3.3v3.3h-3.3zM17.5 17.5h3.3v3.3h-3.3z" fill="currentColor"/>
    </svg>`
  };

  /* ROOT-ABSOLUTE, NOT "./".

     This bar is on every page of the app, and "./tools.html" only means
     the right thing on a page that sits at the top of the site. The 366
     generated reading pages live three folders down, at
     /another-day-sober/09-15/some-title/ -- and from there "./tools.html"
     asks for a file inside that folder, which does not exist. Every tab on
     the bar was a 404 on all 366 of them.

     A leading slash means the same thing from any depth. */
  /* HOME IS THE READINGS PAGE. 22 Sep 2026.

     It used to be the daily reading itself and Readings was its own tab, which
     meant the first screen of the app was one reading and the way to everything
     else was a tab down at the bottom. Turning that around -- the stack, the
     prayers and the shelf on the front door, with today's reading on a card at
     the top of it -- freed the Readings tab, and Meme of the Day took it.

     /readings.html still exists and sends people here, for bookmarks and for
     whatever Google already has. */
  const items = [
    { href: "/index.html", label: "Home", icon: ICONS.home },
    { href: "/tools.html", label: "Tools", icon: ICONS.tools },
    { href: "/meme.html", label: "Memes", icon: ICONS.meme },
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
  soberPanel.className = "rm-rail";
  soberPanel.setAttribute("aria-label", "Sobriety counter");
  soberPanel.innerHTML = `
    <button type="button" class="rm-rail-date" id="rmSetSoberDateBtn"
            aria-label="Set or change your sober date">
      <span class="k">Sober Since</span>
      <span class="v" id="rmSoberBarText">Set Date</span>
    </button>

    <i class="rm-rail-sep" aria-hidden="true"></i>

    <div class="rm-rail-count" id="rmRailCount" aria-live="polite"></div>

    <i class="rm-rail-sep" aria-hidden="true"></i>

    <a class="rm-rail-act rm-share" id="rmShareSoberDateBtn" href="/sober-date.html"
       aria-label="Share your sober date">
      <img src="/assets/rail/icon-share.webp" alt="" width="19" height="19">
      <span>Share</span>
    </a>

    <i class="rm-rail-sep" aria-hidden="true"></i>

    <a class="rm-rail-act rm-account" id="rmAccountBtn" href="/account.html"
       aria-label="Your anonymous account">
      <img src="/assets/rail/icon-account.webp" alt="" width="19" height="19">
      <span>Account</span>
    </a>
  `;

  /* ---- THE COUNTER ------------------------------------------------------
     One <img> per digit, straight off the ten delivered tiles. They
     were drawn once at 3x; nothing here redraws them.

     Every digit is preloaded on the first count, because the tiles change at
     midnight and on the day 2,929 becomes 2,930 the phone should not be
     fetching a "3" for the first time while somebody is looking at it. */
  let tilesWarmed = false;
  function warmTiles() {
    if (tilesWarmed) return;
    tilesWarmed = true;
    for (let d = 0; d <= 9; d++) new Image().src = "/assets/rail/tile-" + d + ".webp";
  }

  function drawCount(n) {
    const box = soberPanel.querySelector("#rmRailCount");
    if (!box) return;
    const text = String(Math.max(0, Math.round(Number(n))));
    let html = "";
    for (const ch of text) {
      html += '<img class="rm-rail-tile" src="/assets/rail/tile-' + ch + '.webp" alt="">';
    }
    html += '<span class="rm-rail-days">Days</span>';
    box.innerHTML = html;
    box.className = "rm-rail-count" + (text.length >= 4 ? " d" + Math.min(6, text.length) : "");
    /* The tiles carry no thousands separator, but the screen reader gets the
       grouped number, because "fourteen thousand eight hundred seventy one"
       is what a person says. */
    box.setAttribute("aria-label", Number(n).toLocaleString("en-US") + " days sober");
    warmTiles();
  }

  function refreshSoberPanel() {
    const main = soberPanel.querySelector("#rmSoberBarText");
    const days = computeSoberDays();
    const ymd = getSoberDateYMD();

    if (!ymd || days === null) {
      /* NO COUNT WHEN THERE IS NO DATE. A zero on the tiles would be a
         number this app invented, and on this counter that is not a
         harmless placeholder. */
      soberPanel.classList.add("no-date");
      main.textContent = "Set Date";
      return;
    }

    soberPanel.classList.remove("no-date");
    main.textContent = ymdToRail(ymd);
    drawCount(days);
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
      /* Same story writing. Somebody in private browsing can still set a
         date and see it on this screen; it just will not be here tomorrow,
         which is exactly what an account is for. */
      try { localStorage.setItem(SOBER_KEY, ymd); } catch (e) {}
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
  // of the tabs, which tab it could light up instead. Another Day Sober and
  // the 366 generated reading pages are all opened FROM the home screen, so
  // Home is the tab that belongs lit while you are in one of them. They say
  // so with data-rm-nav="index.html". Without this they light nothing, and a
  // bar with no tab lit reads as though you have left the app.
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

  /* THE GREETING, IF THERE IS SOMEBODY TO GREET. Signed out, it is simply
     not in the DOM. */
  const greetName = (function () {
    try {
      const raw = localStorage.getItem("rm_account_v1");
      if (!raw) return "";
      const j = JSON.parse(raw);
      return (j && typeof j.name === "string") ? j.name : "";
    } catch (e) { return ""; }
  })();

  /* THE RAIL IS ITS OWN ROW ABOVE THE BAR, not a panel inside it.

     #rmAppBar is a flex row that becomes a column on a phone, so a child of
     it sat beside the nav on a wide screen and under it on a narrow one.
     The rail is meant to span the full width directly above the nav on
     every size, which is what the approved layout shows. */
  appBar.appendChild(navLinks);

  /* ABOVE THE BAR, NOT INSIDE IT. #rmAppBar is a flex row that turns into a
     column on a phone, so a third child lands either beside the nav or
     underneath it depending on the width. Its own strip above the bar is
     the same thing on every screen. */
  if (greetName) {
    const greet = document.createElement("div");
    greet.className = "rm-greet";
    greet.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M20 7.5L10 17l-5-4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<span>Glad you&rsquo;re here, <b></b></span>';
    /* textContent, not innerHTML: that name came out of a box somebody typed
       into, and it is about to appear on every page of the app. */
    greet.querySelector("b").textContent = greetName;
    wrapper.appendChild(greet);
  }

  /* THE RAIL GOES IN A BOX THAT MEASURES ITSELF.

     The rail itself is always 374 x 64. This box is whatever the phone
     gives it, and the ratio between the two is the scale factor for the
     whole picture. Watched with a ResizeObserver so a rotation or a
     split-screen resize is picked up the same as a fresh load; browsers
     without one fall back to the resize event, which covers both. */
  const railFit = document.createElement("div");
  railFit.className = "rm-rail-fit";
  railFit.appendChild(soberPanel);

  wrapper.appendChild(railFit);
  wrapper.appendChild(appBar);
  mount.replaceChildren(wrapper);

  const RAIL_W = 374, RAIL_H = 64;
  /* On a phone the rail fills the width. On a laptop that same sum would
     make it 185px tall, which is a billboard, so the scale stops a little
     past phone size and the rail centers in whatever is left. */
  const RAIL_MAX_S = 1.15;
  function fitRail() {
    /* A hidden tab, a backgrounded home-screen app and the moment before
       first layout all measure zero. Falling back to the viewport keeps the
       rail from painting once at its unscaled 374px on a 320px phone before
       the observer catches up. */
    let w = railFit.getBoundingClientRect().width;
    if (!w) w = Math.min(window.innerWidth || 0, RAIL_W) - 16;
    if (w <= 0) return;
    const scale = Math.min(w / RAIL_W, RAIL_MAX_S);
    const root = document.documentElement.style;
    root.setProperty("--rm-rail-s", String(scale));
    root.setProperty("--rm-rail-x", ((w - RAIL_W * scale) / 2).toFixed(2) + "px");
    /* The page's bottom padding was written for a 64px rail. Hand it the
       difference so the last line of a reading never ends up under the bar
       on a big phone, and no dead space opens up on a small one. */
    root.setProperty("--rm-rail-extra", (RAIL_H * (scale - 1)).toFixed(2) + "px");
  }
  fitRail();
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(fitRail).observe(railFit);
  } else {
    window.addEventListener("resize", fitRail);
    window.addEventListener("orientationchange", fitRail);
  }

  const setBtn = soberPanel.querySelector("#rmSetSoberDateBtn");
  if (setBtn) {
    setBtn.addEventListener("click", () => {
      /* NO ACCOUNT, NO WHEELS. THE BUTTON GOES WHERE IT SAYS IT GOES.

         Signed out, this button reads SIGN IN and the rail beside it reads
         000 DAYS -- and it was still opening the date picker, because the
         old test here also asked whether a date happened to be sitting in
         localStorage. Anybody who set a date on this phone before accounts
         existed still has one there, so they pressed SIGN IN and got a set
         of date wheels. Two different answers from one button depending on
         a value nobody can see is how a screen stops being trusted.

         THE RULE, AS OF 21 SEP 2026: you have an account and you get the
         app, or you do not and you get the default site. The date, the
         counter and the coin are all account things, so the picker is one
         too. No token, no picker -- they go to the account screen and come
         straight back to these wheels afterwards.

         The old date is not touched. It is still on the phone and it is
         still theirs; signing in is what puts it back on the rail. */
      if (!hasAccountToken() && !/\/account\.html/.test(location.pathname)) {
        location.href = "/account.html?next=set";
        return;
      }
      openSoberModal();
    });
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

      /* A date on this phone that a DIFFERENT account signed is not this
         person's, so it never travels up to their account. account.html
         takes it off the phone the moment they sign in; until then this
         just refuses to spread it. */
      const mine = !window.RMAccount.localIsMine ||
                   window.RMAccount.localIsMine();

      if (there && !here) {
        /* This phone has nothing. Fill it in and say so on the bar. */
        window.RMAccount.apply(remote.data);
        refreshSoberPanel();
      } else if (here && !there && mine) {
        /* The account has nothing. Send this phone's copy up. */
        await window.RMAccount.push(Object.assign({}, remote.data, { soberDate: here }));
        if (window.RMAccount.claimLocal) window.RMAccount.claimLocal();
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
      /* They just typed it in on this phone, so it is theirs by definition. */
      if (window.RMAccount.claimLocal) window.RMAccount.claimLocal();
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

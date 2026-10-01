/* SOBER SPINS (30 Sep 2026, Mike). Short videos, 15 seconds max, built
 * exactly like Jeff's Infinite Loops, in black and gold, plus:
 *   RESPIN  put somebody's Spin on your own profile (they get told)
 *   MUSIC   free Freesound tracks nobody owns, picked in the maker
 *
 *   * A SOBER SPINS row at the top of the Porch, newest first.
 *   * Tap one: full screen, swipe up for the next. Plays muted; the sound pill
 *     turns it on (and it stays on). Tap pauses, double-tap is Proud of you.
 *     Proud of you, comments, Respin, Share and ⋯ down the side.
 *   * Make one from SPINS on the rail, the + tile, or the + in the player.
 *     The maker makes the video right on the phone; it uploads straight to
 *     Bunny; a pill says how it's going and when it's live.
 *   * A Spin lasts 30 days. Pin up to 3 to keep them on your profile.
 *
 * Every Spin has a Porch share behind it (post_id), so comments, Proud of you,
 * reports and alerts are the Porch's own. Talks to porch.html through
 * window.Porch; every screen goes on the phone's back button (window.PorchBack).
 */
(function () {
  'use strict';
  if (window.PorchSpins) return;

  const CDN = 'https://vz-e533a6c3-9fe.b-cdn.net';
  const TUS = 'https://video.bunnycdn.com/tusupload';
  const TUS_LIB = 'https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js';
  const MB_LIB = 'https://cdn.jsdelivr.net/npm/mediabunny@1.60.0/dist/bundles/mediabunny.min.mjs';
  const MAKER = '/feed/spins/spin-maker.js?v=22';
  const MAX_S = 15.5;
  const RAIL_N = 14;
  const COLS = 'id,user_id,post_id,video_guid,caption,muted,status,pinned,length_s,width,height,resolutions,music,created_at,expires_at';

  const P = () => window.Porch;
  const back = () => window.PorchBack;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const meId = () => (P() && P().me.uid) || '';
  const at = (uid) => '@' + (P() ? P().name(uid) : 'misfit');

  function srcFor(l) {
    const have = String(l.resolutions || '').match(/\d+/g);
    let r = 480;
    if (have && have.length) { const ok = have.map(Number).filter((n) => n <= 720).sort((a, b) => b - a); if (ok.length) r = ok[0]; }
    return `${CDN}/${l.video_guid}/play_${r}p.mp4`;
  }
  const thumbFor = (l) => `${CDN}/${l.video_guid}/thumbnail.jpg`;
  const daysLeft = (l) => Math.ceil((new Date(l.expires_at).getTime() - Date.now()) / 86400000);
  function captionHTML(t) {
    return esc(t || '').replace(/(^|[^A-Za-z0-9_])@([A-Za-z0-9._-]{3,32})/g, (m, pre, h) =>
      `${pre}<b class="sp-at" data-sp-name="${esc(h.replace(/[._-]+$/, ''))}">@${h}</b>`);
  }
  const say = (t) => P() && P().toast(t);

  /* ---------------- its own look (black and gold) ---------------- */
  const CSS = `
.sp-rail{margin:14px 0 2px}
.sp-rail h2{margin:0 12px 8px;font:500 13px "RM Rail",Oswald,sans-serif;letter-spacing:.14em;color:var(--gold);display:flex;align-items:center;gap:7px}
.sp-rail h2 svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.sp-row{display:flex;gap:8px;overflow-x:auto;padding:0 12px 4px;scroll-snap-type:x proximity;scrollbar-width:none}
.sp-row::-webkit-scrollbar{display:none}
.sp-tile{flex:0 0 108px;height:176px;border-radius:12px;position:relative;overflow:hidden;background:#15130e;border:0;padding:0;cursor:pointer;scroll-snap-align:start;color:#fff}
.sp-tile>img.sp-th{width:100%;height:100%;object-fit:cover;display:block}
.sp-tile::after{content:"";position:absolute;inset:auto 0 0 0;height:50%;background:linear-gradient(transparent,rgba(0,0,0,.75));pointer-events:none}
.sp-tile .sp-who{position:absolute;z-index:1;left:6px;right:6px;bottom:6px;display:flex;align-items:center;gap:5px;font:800 11px/1.1 Arial,sans-serif;text-shadow:0 1px 3px #000;text-align:left}
.sp-tile .sp-who span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-tile .sp-who .av{width:22px;height:22px;font-size:9px;box-shadow:0 0 0 2px var(--gold2)}
.sp-badge{position:absolute;z-index:1;top:6px;left:6px;padding:3px 7px;border-radius:999px;background:rgba(0,0,0,.65);font:800 10px/1 Arial,sans-serif;color:#fff}
.sp-tile.sp-dim>img.sp-th,.sp-gt.sp-dim img{opacity:.45}
.sp-make{background:linear-gradient(160deg,#2a2316,#100f0c)!important;display:grid;place-items:center;border:2px dashed rgba(224,189,106,.6)!important}
.sp-make b{display:block;font:900 13px/1.2 Arial,sans-serif;color:var(--gold2);text-align:center}
.sp-plus{display:block;margin:0 auto 6px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#17130b;font:900 28px/40px Arial;text-align:center}
.sp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.sp-gt{position:relative;aspect-ratio:9/16;border:0;padding:0;background:#15130e;overflow:hidden;cursor:pointer;color:#fff}
.sp-gt img{width:100%;height:100%;object-fit:cover;display:block}
.sp-gt .sp-len{position:absolute;left:6px;bottom:6px;font:800 11px/1 Arial,sans-serif;text-shadow:0 1px 3px #000}
.sp-gt .sp-re{position:absolute;right:6px;bottom:6px;padding:2px 6px;border-radius:999px;background:rgba(0,0,0,.65);font:800 10px/1.3 Arial,sans-serif}
.sp-note{margin:10px 16px;color:var(--faint);font-size:12.5px}

.sp{position:fixed;inset:0;background:#000;color:#fff}
.sp-list{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none}
.sp-list::-webkit-scrollbar{display:none}
.sp-item{position:relative;height:100vh;height:100dvh;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#000}
.sp-item video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:transparent}
.sp-bg{position:absolute;inset:-40px;background:#000 center/cover no-repeat;filter:blur(28px) brightness(.45);pointer-events:none}
.sp-item.tall .sp-bg{display:none}
.sp-item.tall video{object-fit:cover}
.sp-shade{position:absolute;inset:auto 0 0 0;height:48%;background:linear-gradient(transparent,rgba(0,0,0,.78));pointer-events:none}
.sp-foot{position:absolute;left:14px;right:86px;bottom:calc(22px + env(safe-area-inset-bottom,0px));font:600 14px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.sp-by{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:0;border:0;background:none;color:#fff;font:900 15px/1.2 Arial,sans-serif;cursor:pointer}
.sp-by .av{width:34px;height:34px;font-size:13px;box-shadow:0 0 0 2px var(--gold2)}
.sp-respun{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.5);font:800 12px/1.2 Arial,sans-serif;color:#f6e3a8}
.sp-cap{margin:0;white-space:pre-wrap;word-break:break-word;max-height:30vh;overflow:auto}
.sp-at{color:#f6e3a8;cursor:pointer;font-weight:800}
.sp-music{display:flex;align-items:center;gap:6px;margin-top:6px;font:700 12.5px/1.2 Arial,sans-serif;opacity:.9}
.sp-music i{font-style:normal;animation:spinme 4s linear infinite;display:inline-block}
@keyframes spinme{to{transform:rotate(360deg)}}
.sp-meta{margin-top:6px;font-size:12px;opacity:.8}
.sp-side{position:absolute;right:8px;bottom:calc(28px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px;align-items:center}
.sp-side button{width:64px;border:0;background:none;color:#fff;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;font:800 11.5px/1.1 Arial,sans-serif;text-shadow:0 1px 3px #000;padding:0}
.sp-side svg{width:34px;height:34px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.7));fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sp-side .on svg{fill:#e52e71;stroke:#ff8fb5}
.sp-side .on.re svg{fill:none;stroke:#e0bd6a}
.sp-side .on{color:#f6e3a8}
.sp-side button:active{transform:scale(.9)}
.sp-snd{position:absolute;z-index:3;top:calc(8px + env(safe-area-inset-top,0px));right:10px;height:44px;padding:0 14px 0 10px;border:2px solid rgba(255,255,255,.9);border-radius:999px;background:#dc2626;color:#fff;display:flex;align-items:center;gap:6px;cursor:pointer;font:900 14px/1 Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.sp-snd svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.sp-snd .on{display:none}
.sp.sound .sp-snd{background:#16a34a}
.sp.sound .sp-snd .on{display:inline}
.sp.sound .sp-snd .off{display:none}
.sp-new{position:absolute;z-index:3;top:calc(8px + env(safe-area-inset-top,0px));right:146px;width:44px;height:44px;border-radius:50%;border:0;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#17130b;font:900 26px/44px Arial;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.sp-x{position:absolute;z-index:4;top:calc(10px + env(safe-area-inset-top,0px));left:10px;display:grid;place-items:center;width:42px;height:42px;border-radius:50%;border:0;background:rgba(0,0,0,.5);color:#fff;cursor:pointer}
.sp-x svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round}
.sp-top{position:absolute;top:calc(22px + env(safe-area-inset-top,0px));left:62px;font:500 15px "RM Rail",Oswald,sans-serif;letter-spacing:.12em;color:#f6e3a8;text-shadow:0 1px 3px #000;pointer-events:none}
.sp-paused{position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:rgba(0,0,0,.45);display:none;place-items:center;pointer-events:none}
.sp-paused svg{width:44px;height:44px;fill:#fff;margin-left:6px}
.sp-item.paused .sp-paused{display:grid}
.sp-muted{position:absolute;top:calc(66px + env(safe-area-inset-top,0px));right:10px;padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.55);font:800 12px/1 Arial,sans-serif}
.sp-flash{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;display:grid;place-items:center;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;transform:scale(.6)}
.sp-flash svg{width:100%;height:100%;fill:#fff;filter:drop-shadow(0 4px 14px rgba(0,0,0,.5))}
.sp-flash.on{opacity:1;transform:scale(1)}
.sp-empty{height:100dvh;display:grid;place-items:center;text-align:center;padding:24px;font:700 16px/1.5 Arial,sans-serif}

.spn{position:fixed;inset:0;background:#0c0b09;color:#fff;overflow:auto;font:500 15px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif}
.spn-in{max-width:520px;margin:0 auto;padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(24px + env(safe-area-inset-bottom,0px))}
.spn h2{margin:0 0 12px;font:400 26px "RM Head",Impact,sans-serif;letter-spacing:.02em;color:#fff}
.spn-prev{display:block;width:100%;max-height:52vh;border-radius:14px;background:#000;object-fit:contain}
.spn textarea{display:block;box-sizing:border-box;width:100%;margin:12px 0 0;min-height:84px;border-radius:12px;border:1px solid #2e2a21;background:#15130e;color:#fff;padding:12px;font:500 16px/1.4 Arial,sans-serif;resize:vertical}
.spn-snd{margin:12px 0 0}
.spn-snd p{margin:0 0 6px;font:800 13px/1.2 Arial,sans-serif;color:#c9bfa8}
.spn-snd div{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.spn-snd button{padding:13px 8px;border-radius:12px;border:2px solid #2e2a21;background:#15130e;color:#958c78;font:900 15px/1 Arial,sans-serif;cursor:pointer}
.spn-snd button.on[data-snd="on"]{background:#16a34a;border-color:#16a34a;color:#fff}
.spn-snd button.on[data-snd="off"]{background:#dc2626;border-color:#dc2626;color:#fff}
.spn-mus{margin:12px 0 0;padding:10px 12px;border-radius:12px;background:#2a2316;color:#f6e3a8;font:800 13.5px/1.3 Arial,sans-serif}
.spn-go{display:block;width:100%;margin:16px 0 0;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#17130b;font:900 17px/1 Arial,sans-serif;cursor:pointer}
.spn-go[disabled]{opacity:.5}
.spn-alt{display:block;width:100%;margin:10px 0 0;padding:13px;border:1px solid #2e2a21;border-radius:14px;background:none;color:#fff;font:800 15px/1 Arial,sans-serif;cursor:pointer}
.spn-err{margin:12px 0 0;padding:12px;border-radius:12px;background:#3b0d12;color:#ffd7d9;font-weight:700}
.spn-fine{margin:10px 0 0;color:#958c78;font-size:12.5px}
.spn-x{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;border:0;background:#1d1a14;color:#fff;cursor:pointer;flex:none}
.spn-x svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round}
.spn-head{display:flex;align-items:center;gap:10px;margin:0 0 12px}
.spn-head h2{margin:0}
.sp-pill{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:30001;max-width:calc(100% - 32px);padding:10px 16px;border-radius:999px;background:#100f0c;color:#fff;border:2px solid #e0bd6a;box-shadow:0 8px 26px rgba(0,0,0,.5);font:800 14px/1.2 Arial,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-pill .bar{display:block;height:4px;margin-top:6px;border-radius:2px;background:#2e2a21;overflow:hidden}
.sp-pill .bar i{display:block;height:100%;background:#e0bd6a;width:0;transition:width .3s}
.sp-sheet .menu button svg{width:20px;height:20px;margin:0 12px -4px 0;fill:none;stroke:var(--gold2);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`;
  (function addCSS() { const s = document.createElement('style'); s.id = 'spins-css'; s.textContent = CSS; document.head.appendChild(s); })();

  /* ---- a full-screen layer on the phone's back button ---- */
  function pushLayer(tag, el, close) {
    const b = back(); const z = b ? b.push(tag, close) : 20050;
    el.style.zIndex = String(z || 20050);
  }
  function popLayer(tag, close) { const b = back(); if (!b || !b.pop(tag)) close(); }

  /* ======================================================================
     READING SPINS
     ====================================================================== */
  const sets = new Map();          /* 'rail' | 'prof:<uid>' -> [spins] */
  async function latest(n) {
    const r = await P().rest('porch_spins?status=eq.ready&select=' + COLS + '&order=created_at.desc&limit=' + (n * 2));
    const now = Date.now();
    return r.filter((l) => l.pinned || new Date(l.expires_at).getTime() > now).slice(0, n);
  }
  function tileHTML(l, set, i, mine) {
    let badge = '', dim = false;
    if (l.status === 'uploading') { badge = 'Processing…'; dim = true; }
    else if (l.status === 'failed') { badge = 'Failed'; dim = true; }
    else if (l.pinned) badge = '📌 Pinned';
    else if (mine) { const d = daysLeft(l); badge = d <= 0 ? 'Gone soon, pin it' : d <= 7 ? `${d}d left` : ''; if (d <= 0) dim = true; }
    return `<button type="button" class="sp-tile${dim ? ' sp-dim' : ''}" data-sp-open="${esc(set)}" data-sp-i="${i}" aria-label="Spin by ${esc(at(l.user_id))}">
      ${l.status === 'ready' ? `<img class="sp-th" src="${esc(thumbFor(l))}" alt="" loading="lazy">` : ''}
      ${badge ? `<span class="sp-badge">${esc(badge)}</span>` : ''}
      <span class="sp-who">${P().avatar(P().people[l.user_id])}<span>${esc(at(l.user_id))}</span></span></button>`;
  }
  const makeTile = () => `<button type="button" class="sp-tile sp-make" data-sp-make><span><span class="sp-plus">+</span><b>Give it<br>a spin</b></span></button>`;
  const SPIN_ICO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3a9 9 0 0 1 8.4 5.8M3.6 15.2A9 9 0 0 0 12 21"/></svg>';

  async function railHTML() {
    let list = [];
    try { list = await latest(RAIL_N); } catch (_) { return ''; }
    if (!list.length && !meId()) return '';
    await P().loadPeople(list.map((l) => l.user_id));
    sets.set('rail', list);
    return `<section class="sp-rail" data-sp-rail><h2>${SPIN_ICO}SOBER SPINS</h2>
      <div class="sp-row">${meId() ? makeTile() : ''}${list.map((l, i) => tileHTML(l, 'rail', i, l.user_id === meId())).join('')}</div></section>`;
  }
  async function paintRail() {
    const host = document.getElementById('spinrail'); if (!host) return;
    host.innerHTML = await railHTML();
  }

  /* THE SPINS TAB ON A PROFILE: their own Spins (pinned first) and the Spins
     they RESPUN, newest first, three across. Yours shows ones still processing. */
  async function profileGrid(grid, uid) {
    if (!grid) return;
    const mine = uid === meId();
    grid.innerHTML = '<div class="skel" style="height:160px"></div>';
    let own = [], re = [];
    try {
      own = await P().rest('porch_spins?user_id=eq.' + uid + '&select=' + COLS + '&order=pinned.desc,created_at.desc&limit=60' + (mine ? '' : '&status=eq.ready'));
      const now = Date.now();
      own = own.filter((l) => mine || l.pinned || new Date(l.expires_at).getTime() > now);
      const rr = await P().rest('porch_respins?user_id=eq.' + uid + '&select=spin_id,created_at&order=created_at.desc&limit=60');
      if (rr.length) {
        const got = await P().rest('porch_spins?id=in.(' + rr.map((r) => r.spin_id).join(',') + ')&status=eq.ready&select=' + COLS);
        const by = {}; got.forEach((s) => (by[s.id] = s));
        re = rr.map((r) => by[r.spin_id] && Object.assign({}, by[r.spin_id], { respunBy: uid, respunAt: r.created_at })).filter(Boolean);
      }
    } catch (_) { grid.innerHTML = '<p class="pempty">The Spins didn\'t load.</p>'; return; }
    const list = own.concat(re);
    await P().loadPeople(list.map((l) => l.user_id));
    const key = 'prof:' + uid; sets.set(key, list);
    grid.dataset.spGrid = uid;
    if (!list.length && !mine) { grid.innerHTML = '<p class="pempty">No Spins right now.</p>'; return; }
    grid.innerHTML = `<div class="sp-grid">
      ${mine ? `<button type="button" class="sp-gt sp-make" data-sp-make><span><span class="sp-plus">+</span><b style="color:var(--gold2);font:900 13px Arial">Give it<br>a spin</b></span></button>` : ''}
      ${list.map((l, i) => {
        let badge = '', dim = false;
        if (l.status === 'uploading') { badge = 'Processing…'; dim = true; }
        else if (l.status === 'failed') { badge = 'Failed'; dim = true; }
        else if (l.pinned && !l.respunBy) badge = '📌';
        else if (mine && !l.respunBy) { const d = daysLeft(l); badge = d <= 0 ? 'Gone soon' : d <= 7 ? `${d}d left` : ''; dim = d <= 0; }
        return `<button type="button" class="sp-gt${dim ? ' sp-dim' : ''}" data-sp-open="${esc(key)}" data-sp-i="${i}" aria-label="Play Spin">
          ${l.status === 'ready' ? `<img src="${esc(thumbFor(l))}" alt="" loading="lazy">` : ''}
          ${badge ? `<span class="sp-badge">${esc(badge)}</span>` : ''}
          ${l.length_s ? `<span class="sp-len">▶ ${Math.round(l.length_s)}s</span>` : ''}
          ${l.respunBy ? `<span class="sp-re">↻ ${esc(at(l.user_id))}</span>` : ''}</button>`;
      }).join('')}</div>
      ${mine ? '<p class="sp-note">Spins last 30 days. Pin up to 3 from a Spin\'s ⋯ to keep them. Spins you Respin show here too.</p>' : ''}`;
  }

  /* ======================================================================
     THE PLAYER
     ====================================================================== */
  let soundOn = false;
  try { soundOn = localStorage.getItem('rm-spin-sound') === 'on'; } catch (_) {}
  const saveSound = () => { try { localStorage.setItem('rm-spin-sound', soundOn ? 'on' : 'off'); } catch (_) {} };
  let sp = null, spList = [], io = null;
  const proud = new Set(), respun = new Set(), talkN = new Map();
  const paintSound = () => { if (sp) sp.classList.toggle('sound', soundOn); };

  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/></svg>';
  const TALK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>';
  const RESPIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>';
  const SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>';
  const MORE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6" fill="#fff"/><circle cx="12" cy="12" r="1.6" fill="#fff"/><circle cx="19" cy="12" r="1.6" fill="#fff"/></svg>';

  function itemHTML(l, i) {
    const scr = (window.innerHeight || 800) / (window.innerWidth || 400);
    const tall = l.height && l.width ? l.height / l.width >= scr * 0.92 : false;
    const mine = l.user_id === meId() && !l.respunBy;
    const d = daysLeft(l);
    const isRe = respun.has(l.id), own = l.user_id === meId();
    return `<section class="sp-item${tall ? ' tall' : ''}" data-sp-item="${i}">
      <div class="sp-bg" style="background-image:url('${esc(thumbFor(l))}')"></div>
      <video playsinline loop muted preload="none" poster="${esc(thumbFor(l))}" data-src="${esc(srcFor(l))}"></video>
      <div class="sp-shade"></div>
      ${l.muted ? '<span class="sp-muted">🔇 No sound on this one</span>' : ''}
      <span class="sp-paused" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg></span>
      <span class="sp-flash" aria-hidden="true">${HEART}</span>
      <div class="sp-foot">
        ${l.respunBy ? `<span class="sp-respun">↻ Respun by ${esc(at(l.respunBy))}</span><br>` : ''}
        <button type="button" class="sp-by" data-sp-person="${esc(l.user_id)}">${P().avatar(P().people[l.user_id])}<span>${esc(at(l.user_id))}</span></button>
        ${l.caption ? `<p class="sp-cap">${captionHTML(l.caption)}</p>` : ''}
        ${l.music && l.music.name ? `<div class="sp-music"><i>♫</i>${esc(l.music.name)} · ${esc(l.music.by || '')}</div>` : ''}
        ${mine ? `<div class="sp-meta">${l.pinned ? '📌 Pinned, stays on your profile' : d > 0 ? `Gone in ${d} day${d === 1 ? '' : 's'} · pin it to keep it` : 'Gone soon · pin it to keep it'}</div>` : ''}
      </div>
      <div class="sp-side">
        <button type="button" data-sp-proud class="${proud.has(l.post_id) ? 'on' : ''}" aria-label="Proud of you">${HEART}<span>Proud</span></button>
        <button type="button" data-sp-talk aria-label="Comments">${TALK}<span class="n">${talkN.get(l.post_id) || 0}</span></button>
        ${own ? '' : `<button type="button" data-sp-respin class="re${isRe ? ' on' : ''}" aria-label="Respin to my profile">${RESPIN}<span>${isRe ? 'Respun' : 'Respin'}</span></button>`}
        <button type="button" data-sp-share aria-label="Share">${SHARE}<span>Share</span></button>
        <button type="button" data-sp-more aria-label="More">${MORE}</button>
      </div></section>`;
  }

  async function loadMarks(list) {
    const pids = list.map((l) => l.post_id).filter(Boolean), sids = list.map((l) => l.id);
    try {
      if (pids.length) {
        const cs = await P().rest('porch_comments?post_id=in.(' + pids.join(',') + ')&select=post_id');
        pids.forEach((p) => talkN.set(p, 0)); cs.forEach((c) => talkN.set(c.post_id, (talkN.get(c.post_id) || 0) + 1));
      }
      if (meId()) {
        if (pids.length) (await P().rest('porch_reactions?user_id=eq.' + meId() + '&kind=eq.proud&post_id=in.(' + pids.join(',') + ')&select=post_id')).forEach((r) => proud.add(r.post_id));
        (await P().rest('porch_respins?user_id=eq.' + meId() + '&spin_id=in.(' + sids.join(',') + ')&select=spin_id')).forEach((r) => respun.add(r.spin_id));
      }
    } catch (_) {}
  }
  function paintSide(i) {
    if (!sp) return; const l = spList[i]; if (!l) return;
    const el = sp.querySelector(`[data-sp-item="${i}"]`); if (!el) return;
    el.querySelector('[data-sp-proud]').classList.toggle('on', proud.has(l.post_id));
    el.querySelector('[data-sp-talk] .n').textContent = String(talkN.get(l.post_id) || 0);
    const r = el.querySelector('[data-sp-respin]');
    if (r) { r.classList.toggle('on', respun.has(l.id)); r.querySelector('span').textContent = respun.has(l.id) ? 'Respun' : 'Respin'; }
  }
  function current() { if (!sp) return -1; const list = sp.querySelector('.sp-list'); return Math.round(list.scrollTop / Math.max(1, list.clientHeight)); }
  function wake(i) {
    if (!sp) return;
    sp.querySelectorAll('[data-sp-item]').forEach((el) => {
      const k = Number(el.getAttribute('data-sp-item')), v = el.querySelector('video');
      if (Math.abs(k - i) <= 1 && !v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.preload = 'auto'; }
      if (k === i) {
        const l = spList[k];
        v.muted = !soundOn || !!(l && l.muted);
        el.classList.remove('paused');
        const p = v.play();
        if (p && p.catch) p.catch(() => { soundOn = false; paintSound(); v.muted = true; v.play().catch(() => {}); });
      } else { try { v.pause(); } catch (_) {} }
    });
  }
  function closePlayer() {
    if (io) { io.disconnect(); io = null; }
    if (sp) { sp.querySelectorAll('video').forEach((v) => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {} }); sp.remove(); sp = null; }
  }
  const leavePlayer = () => popLayer('spins', closePlayer);

  async function openPlayer(list, start, then) {
    if (!list || !list.length) return;
    closePlayer();
    spList = list.filter((l) => l.status === 'ready');
    if (!spList.length) { say('That Spin is still processing.'); return; }
    start = Math.max(0, Math.min(spList.length - 1, spList.indexOf(list[start]) >= 0 ? spList.indexOf(list[start]) : 0));
    await Promise.all([P().loadPeople(spList.map((l) => l.user_id).concat(spList.map((l) => l.respunBy).filter(Boolean))), loadMarks(spList)]);
    sp = document.createElement('div');
    sp.className = 'sp'; sp.setAttribute('role', 'dialog'); sp.setAttribute('aria-label', 'Sober Spins');
    sp.innerHTML = `<div class="sp-list">${spList.map(itemHTML).join('')}</div>
      <button type="button" class="sp-x" data-sp-close aria-label="Close Spins, back to the Porch"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <span class="sp-top">SOBER SPINS</span>
      ${meId() ? '<button type="button" class="sp-new" data-sp-make aria-label="Make a Spin">+</button>' : ''}
      <button type="button" class="sp-snd" data-sp-snd aria-label="Sound on or off">
        <svg class="off" viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z" fill="#fff"/><path d="m16 9 5 6M21 9l-5 6"/></svg><span class="off">Sound off</span>
        <svg class="on" viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z" fill="#fff"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg><span class="on">Sound on</span></button>`;
    paintSound();
    document.body.appendChild(sp);
    pushLayer('spins', sp, closePlayer);
    const listEl = sp.querySelector('.sp-list');
    listEl.scrollTop = start * listEl.clientHeight;
    io = new IntersectionObserver((ents) => { ents.forEach((e) => { if (e.isIntersecting && e.intersectionRatio >= 0.6) wake(Number(e.target.getAttribute('data-sp-item'))); }); }, { root: listEl, threshold: [0.6] });
    sp.querySelectorAll('[data-sp-item]').forEach((el) => io.observe(el));
    wake(start);
    sp.addEventListener('click', onPlayerClick);
    /* swipe down on the first Spin closes, the way Reels and Stories do */
    let y0 = null;
    listEl.addEventListener('touchstart', (e) => { y0 = listEl.scrollTop <= 2 && e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
    listEl.addEventListener('touchmove', (e) => { if (y0 != null && e.touches[0].clientY - y0 > 110) { y0 = null; leavePlayer(); } }, { passive: true });
    listEl.addEventListener('touchend', () => { y0 = null; }, { passive: true });
    if (then) setTimeout(then, 250);
  }

  let lastTap = 0, tapTimer = 0;
  function flash(el) { const f = el.querySelector('.sp-flash'); if (!f) return; f.classList.add('on'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('on'), 650); }

  async function onPlayerClick(e) {
    if (e.target.closest('[data-sp-close]')) { e.preventDefault(); leavePlayer(); return; }
    if (e.target.closest('[data-sp-make]')) { e.stopPropagation(); return start(); }
    const item = e.target.closest('[data-sp-item]');
    const i = item ? Number(item.getAttribute('data-sp-item')) : current();
    const l = spList[i];
    const person = e.target.closest('[data-sp-person]');
    if (person) { const id = person.getAttribute('data-sp-person'); leavePlayer(); setTimeout(() => P().openProfile(id), 160); return; }
    const nm = e.target.closest('[data-sp-name]');
    if (nm) { const h = nm.getAttribute('data-sp-name'); leavePlayer(); setTimeout(() => P().openHandle(h), 160); return; }
    if (!l) return;
    if (e.target.closest('[data-sp-snd]')) {
      soundOn = !soundOn; saveSound(); paintSound();
      const cur = sp.querySelector(`[data-sp-item="${current()}"]`), lc = spList[current()];
      if (cur) { const v = cur.querySelector('video'); if (lc && lc.muted && soundOn) say('No sound on this one.'); v.muted = !soundOn || !!(lc && lc.muted); if (v.paused && !cur.classList.contains('paused')) v.play().catch(() => {}); }
      return;
    }
    if (e.target.closest('[data-sp-proud]')) { return P().gate(() => toggleProud(i)); }
    if (e.target.closest('[data-sp-talk]')) { if (l.post_id) P().openCommentsFor(l.post_id, () => { talkN.set(l.post_id, P().commentCount(l.post_id)); paintSide(i); }); return; }
    if (e.target.closest('[data-sp-respin]')) { return P().gate(() => toggleRespin(i)); }
    if (e.target.closest('[data-sp-share]')) { share(l); return; }
    if (e.target.closest('[data-sp-more]')) { openMenu(i); return; }
    if (e.target.closest('.sp-side, .sp-foot')) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      clearTimeout(tapTimer); lastTap = 0; flash(item);
      if (!proud.has(l.post_id)) P().gate(() => toggleProud(i));
      return;
    }
    lastTap = now;
    tapTimer = setTimeout(() => {
      const v = item.querySelector('video');
      if (v.paused) { item.classList.remove('paused'); v.muted = !soundOn || !!l.muted; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }
      else { v.pause(); item.classList.add('paused'); }
    }, 280);
  }

  async function toggleProud(i) {
    const l = spList[i]; if (!l || !l.post_id) return;
    const was = proud.has(l.post_id);
    if (was) proud.delete(l.post_id); else proud.add(l.post_id);
    paintSide(i);
    try {
      if (was) await P().rest('porch_reactions?post_id=eq.' + l.post_id + '&user_id=eq.' + meId() + '&kind=eq.proud', { method: 'DELETE' });
      else await P().rest('porch_reactions', { method: 'POST', body: { post_id: l.post_id, user_id: meId(), kind: 'proud' } });
    } catch (err) {
      if (err.status === 409) return;
      if (was) proud.add(l.post_id); else proud.delete(l.post_id);
      paintSide(i); say(err.status === 403 || err.status === 401 ? 'You can cheer people on once your account is 3 days old.' : "That didn't go through.");
    }
  }
  /* RESPIN: puts their Spin on your profile (and tells them). Tap again to take it off. */
  async function toggleRespin(i) {
    const l = spList[i]; if (!l) return;
    const was = respun.has(l.id);
    if (was) respun.delete(l.id); else respun.add(l.id);
    paintSide(i);
    try {
      if (was) await P().rest('porch_respins?user_id=eq.' + meId() + '&spin_id=eq.' + l.id, { method: 'DELETE' });
      else await P().rest('porch_respins', { method: 'POST', body: { user_id: meId(), spin_id: l.id } });
      say(was ? 'Taken off your profile.' : 'Respun. It\'s on your profile now.');
    } catch (err) {
      if (err.status === 409) return;
      if (was) respun.add(l.id); else respun.delete(l.id);
      paintSide(i); say(err.status === 403 || err.status === 401 ? 'You can Respin once your account is 3 days old.' : "That didn't go through.");
    }
  }

  /* ---- a Porch-style bottom sheet of our own ---- */
  let sheetN = 0;
  function sheet(title, inner) {
    const id = 'spsheet' + (++sheetN);
    const el = document.createElement('div');
    el.id = id; el.className = 'layer sp-sheet'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="dim" data-close></div><div class="sheet"><div class="g"></div>${title ? `<h3>${esc(title)}</h3>` : ''}<div class="menu">${inner}</div></div>`;
    document.body.appendChild(el);
    P().open(id);
    const obs = new MutationObserver(() => { if (!el.classList.contains('open')) { obs.disconnect(); setTimeout(() => el.remove(), 50); } });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return el;
  }
  const closeSheet = () => P().closeTop();

  /* SHARE: send it to a friend in Messages, share the video itself (with the
     RECOVERY MISFITS mark), or just the link. */
  const linkFor = (l) => location.origin + '/feed/porch.html?spin=' + l.id;
  async function share(l) {
    const url = linkFor(l), title = `${at(l.user_id)} on Recovery Misfits`;
    const el = sheet('Share this Spin', `
      <button type="button" data-sh="dm">${TALK}Send in Messages</button>
      <button type="button" data-sh="video">${SHARE}Share the video</button>
      <button type="button" data-sh="link"><svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>Share the link</button>
      <p class="fine" style="margin:10px 0 0">The video carries the RECOVERY MISFITS mark wherever it goes.</p>`);
    let ready = null;
    const getting = fetch(srcFor(l)).then((r) => { if (!r.ok) throw new Error('fetch'); return r.blob(); })
      .then((blob) => (ready = new File([blob], 'recovery-misfits-spin.mp4', { type: 'video/mp4' }))).catch(() => null);
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-sh]'); if (!b) return;
      const w = b.getAttribute('data-sh');
      if (w === 'dm') { await closeSheet(); P().gate(() => P().pickFriendToSend(url)); return; }
      if (w === 'link') {
        await closeSheet();
        try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(url); say('Link copied.'); } catch (_) { say(url); }
        return;
      }
      let file = ready;
      if (!file) {
        b.disabled = true; b.lastChild.textContent = 'Getting the video…';
        file = await getting;
        b.disabled = false;
        if (!file) { b.lastChild.textContent = 'Share the video'; say("Couldn't get the video. Try the link."); return; }
        b.lastChild.textContent = 'Ready, tap to share'; return;
      }
      await closeSheet();
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title, text: `${title} ${url}` }); return; } }
      catch (err) { if (err && err.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = 'recovery-misfits-spin.mp4';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      say('Saved. Post it anywhere!');
    });
  }

  function openMenu(i) {
    const l = spList[i]; if (!l) return;
    const mine = !!meId() && l.user_id === meId();
    const rows = mine
      ? `${l.pinned ? '<button type="button" data-m="unpin">Unpin</button>' : '<button type="button" data-m="pin">📌 Pin to my profile (keeps it)</button>'}
         <button type="button" data-m="caption">✏️ Edit caption</button>
         <button type="button" data-m="copy">🔗 Copy link</button>
         <button type="button" class="bad" data-m="delete">🗑 Delete this Spin</button>`
      : `<button type="button" data-m="copy">🔗 Copy link</button>
         <button type="button" data-m="report">🚩 Report this Spin</button>
         <button type="button" class="bad" data-m="block">Block ${esc(at(l.user_id))}</button>`;
    const el = sheet('', rows + '<button type="button" data-close style="color:var(--muted)">Cancel</button>');
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-m],[data-why]'); if (!b) return;
      const m = b.getAttribute('data-m');
      if (m === 'copy') { try { await navigator.clipboard.writeText(linkFor(l)); say('Link copied.'); } catch (_) {} return closeSheet(); }
      if (m === 'pin' || m === 'unpin') {
        const r = await callSpins({ action: 'pin', id: l.id, on: m === 'pin' });
        if (r.error) return say(r.error);
        l.pinned = m === 'pin'; say(l.pinned ? 'Pinned. It stays on your profile.' : 'Unpinned.'); return closeSheet();
      }
      if (m === 'caption') { await closeSheet(); return editCaption(i); }
      if (m === 'delete') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap again to delete it for good'; return; }
        b.disabled = true; b.textContent = 'Deleting…';
        const r = await callSpins({ action: 'delete', id: l.id });
        if (r.error) { b.disabled = false; return say(r.error); }
        await closeSheet(); say('Deleted.'); setTimeout(leavePlayer, 150); refreshRows(); return;
      }
      if (m === 'report') {
        el.querySelector('.menu').innerHTML = '<p style="margin:0 0 6px;font-weight:700">What\'s wrong with it?</p>' +
          [['hate', 'Hate or slurs'], ['harassment', 'Bullying or harassment'], ['sexual', 'Sexual stuff'], ['spam', 'Spam or a scam'], ['self_harm', 'Somebody might be in danger'], ['other', 'Something else (like it uses my video or music)']]
            .map((x) => `<button type="button" data-why="${x[0]}">${x[1]}</button>`).join('') + '<button type="button" data-close style="color:var(--muted)">Cancel</button>';
        return;
      }
      if (b.hasAttribute('data-why')) {
        try { await P().rest('porch_reports', { method: 'POST', body: { reporter_id: meId(), post_id: l.post_id, reason: b.getAttribute('data-why') } }); }
        catch (err) { if (err.status !== 409) { await closeSheet(); return say("That didn't send. Try again."); } }
        await closeSheet(); return say('Thanks for looking out. A real person will look at it.');
      }
      if (m === 'block') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = "Tap again: you won't see each other at all"; return; }
        try { await P().rest('porch_blocks', { method: 'POST', body: { blocker_id: meId(), blocked_id: l.user_id } }); } catch (err) { if (err.status !== 409) return say("That didn't go through."); }
        await closeSheet(); say('Blocked.'); setTimeout(leavePlayer, 150); refreshRows();
      }
    });
  }
  function editCaption(i) {
    const l = spList[i]; if (!l) return;
    const el = sheet('Edit caption', `<textarea class="field" maxlength="500" style="min-height:110px;font-size:16px">${esc(l.caption || '')}</textarea><button type="button" class="btn" data-save>Save</button>`);
    el.querySelector('[data-save]').addEventListener('click', async () => {
      const caption = el.querySelector('textarea').value.trim();
      const r = await callSpins({ action: 'caption', id: l.id, caption });
      if (r.error) return say(r.error);
      l.caption = r.caption;
      const foot = sp && sp.querySelector(`[data-sp-item="${i}"] .sp-foot`);
      if (foot) { const p = foot.querySelector('.sp-cap'); if (p) p.innerHTML = captionHTML(l.caption || ''); else if (l.caption) foot.querySelector('.sp-by').insertAdjacentHTML('afterend', `<p class="sp-cap">${captionHTML(l.caption)}</p>`); }
      closeSheet();
    });
  }

  /* its own fetch: the spins function answers with its own `status` (ready,
     uploading, failed), which the Porch's fn() would write over */
  async function callSpins(body) {
    const t = await P().tok();
    if (!t) return { error: 'Sign in first.' };
    try {
      const r = await fetch(P().DB + '/functions/v1/spins', { method: 'POST', headers: { apikey: P().KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok && !j.error) j.error = "That didn't go through. Try again.";
      return j;
    } catch (_) { return { error: 'No connection. Try again when you have signal.' }; }
  }

  /* ======================================================================
     MAKING ONE: the maker (spin-maker.js) makes the video on the phone,
     then this screen: caption, sound on/off, post. It uploads straight to
     Bunny with a pill that says how it's going.
     ====================================================================== */
  let newEl = null, picked = null, pickedURL = '', pickedMusic = null, uploading = false;
  let makerReady = null;
  const musicApi = {
    async search(q) { const r = await callSpins({ action: 'music_search', q }); if (r.error) throw new Error(r.error); return r.tracks || []; },
    async file(id) {
      const t = await P().tok();
      const r = await fetch(P().DB + '/functions/v1/spins', { method: 'POST', headers: { apikey: P().KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'music_file', id }) });
      if (!r.ok) throw new Error('music');
      return r.blob();
    }
  };
  function openMaker() {
    if (!makerReady) makerReady = new Promise((ok, no) => {
      if (window.PorchSpinMaker) return ok();
      const s = document.createElement('script'); s.src = MAKER;
      s.onload = ok; s.onerror = () => { makerReady = null; no(new Error('load')); };
      document.head.appendChild(s);
    });
    makerReady.then(() => {
      window.PorchSpinMaker.open({ music: musicApi, onDone: (file, music) => startWithFile(file, music) });
      fixMakerZ();
    }).catch(() => say("Couldn't open the maker. Check your connection."));
  }
  function fixMakerZ() { const m = document.querySelector('.lpm'); if (m && back()) m.style.zIndex = String(back().top()); }
  function start() {
    if (!meId()) return P().gate(() => {});
    if (uploading) return say('One Spin is still uploading. Hang on a sec.');
    P().gate(openMaker);
  }

  function closeNew() { if (pickedURL) { try { URL.revokeObjectURL(pickedURL); } catch (_) {} pickedURL = ''; } if (newEl) { newEl.remove(); newEl = null; } }
  const leaveNew = () => popLayer('spinnew', closeNew);
  function lengthOf(url) {
    return new Promise((ok) => {
      const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      const done = (n) => { v.removeAttribute('src'); ok(n); };
      v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0); v.onerror = () => done(-1);
      setTimeout(() => done(0), 8000); v.src = url;
    });
  }
  const HEAD = (t) => `<div class="spn-head"><button type="button" class="spn-x" data-spn-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><h2>${t}</h2></div>`;
  async function startWithFile(file, music) {
    if (!file) return openMaker();
    if (!newEl) {
      newEl = document.createElement('div'); newEl.className = 'spn'; newEl.setAttribute('role', 'dialog');
      document.body.appendChild(newEl); pushLayer('spinnew', newEl, closeNew);
    }
    if (pickedURL) { try { URL.revokeObjectURL(pickedURL); } catch (_) {} }
    picked = file; pickedMusic = music || null; pickedURL = URL.createObjectURL(file);
    newEl.innerHTML = `<div class="spn-in">${HEAD('NEW SPIN')}<div class="spn-fine">Checking the video…</div></div>`;
    const secs = await lengthOf(pickedURL);
    if (!newEl) return;
    if (secs > MAX_S) {
      newEl.innerHTML = `<div class="spn-in">${HEAD('NEW SPIN')}<div class="spn-err">That video is ${Math.round(secs)} seconds. Spins are 15 seconds max.</div><button type="button" class="spn-go" data-spn-maker>Back to the maker</button></div>`;
      return;
    }
    newEl.innerHTML = `<div class="spn-in">${HEAD('NEW SPIN')}
      <video class="spn-prev" src="${esc(pickedURL)}" playsinline autoplay loop muted></video>
      ${pickedMusic ? `<div class="spn-mus">♫ ${esc(pickedMusic.name)} · ${esc(pickedMusic.by)}</div>` : ''}
      <form class="spn-form">
        <textarea maxlength="500" placeholder="Say something… @ to tag people"></textarea>
        <div class="spn-snd"><p>Sound on your Spin</p><div>
          <button type="button" data-snd="on" class="on">🔊 Sound on</button><button type="button" data-snd="off">🔇 Sound off</button>
        </div><input type="hidden" name="muted" value=""></div>
        <button type="submit" class="spn-go">Post Spin</button>
        <button type="button" class="spn-alt" data-spn-maker>Back to the maker</button>
        <p class="spn-fine">Lasts 30 days. Pin up to 3 to keep them. Only post video you have the right to share.</p>
      </form></div>`;
    const form = newEl.querySelector('form');
    form.querySelectorAll('[data-snd]').forEach((b) => b.addEventListener('click', () => {
      form.querySelectorAll('[data-snd]').forEach((x) => x.classList.toggle('on', x === b));
      form.querySelector('[name=muted]').value = b.getAttribute('data-snd') === 'off' ? '1' : '';
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const caption = form.querySelector('textarea').value.trim(), muted = form.querySelector('[name=muted]').value === '1';
      const f = picked, mu = pickedMusic; if (!f) return;
      form.querySelector('.spn-go').disabled = true;
      leaveNew(); upload(f, caption, muted, mu);
    });
  }
  document.addEventListener('click', (e) => {
    if (newEl && e.target.closest('[data-spn-close]')) { e.preventDefault(); leaveNew(); }
    if (newEl && e.target.closest('[data-spn-maker]')) { e.preventDefault(); leaveNew(); setTimeout(openMaker, 260); }
  });

  /* ---- uploading, with a pill that says how it's going ---- */
  let pill = null;
  function pillSay(html, onTap) {
    if (!pill) { pill = document.createElement('div'); pill.className = 'sp-pill'; document.body.appendChild(pill); pill.addEventListener('click', () => { if (pill && pill._tap) pill._tap(); }); }
    pill.innerHTML = html; pill._tap = onTap || null;
  }
  function pillGone(ms) { const p = pill; setTimeout(() => { if (pill === p && p) { p.remove(); pill = null; } }, ms || 0); }
  let tusReady = null;
  function loadTus() {
    if (window.tus) return Promise.resolve(window.tus);
    if (!tusReady) tusReady = new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = TUS_LIB; s.async = true;
      s.onload = () => (window.tus ? ok(window.tus) : no(new Error('no tus'))); s.onerror = () => { tusReady = null; no(new Error('load')); };
      document.head.appendChild(s);
    });
    return tusReady;
  }
  /* SHRINK IT FIRST: re-made on the phone at 720p, about 3 Mbps, so it goes up
     fast. Anything goes wrong and the original goes up instead. */
  async function shrink(file, onP) {
    if (!('VideoEncoder' in window) || file.size < 6 * 1024 * 1024) return file;
    try {
      const M = await import(MB_LIB);
      const input = new M.Input({ source: new M.BlobSource(file), formats: M.ALL_FORMATS });
      const vt = await input.getPrimaryVideoTrack(); if (!vt) return file;
      const w = vt.displayWidth, h = vt.displayHeight, short = Math.min(w, h);
      const size = short > 720 ? (w <= h ? { width: 720 } : { height: 720 }) : {};
      const output = new M.Output({ format: new M.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new M.BufferTarget() });
      const conv = await M.Conversion.init({ input, output, video: Object.assign({ codec: 'avc', bitrate: 3000000 }, size), audio: { codec: 'aac', bitrate: 128000 }, trim: { start: 0, end: 15.5 }, showWarnings: false });
      if (!conv.isValid || (conv.discardedTracks || []).length) return file;
      conv.onProgress = (p) => onP && onP(p);
      await conv.execute();
      const buf = output.target.buffer;
      if (!buf || buf.byteLength < 1000 || buf.byteLength >= file.size) return file;
      return new File([buf], 'spin.mp4', { type: 'video/mp4' });
    } catch (_) { return file; }
  }
  async function upload(file, caption, muted, music) {
    uploading = true;
    pillSay('Getting your Spin ready… keep this page open<span class="bar"><i></i></span>');
    file = await shrink(file, (p) => { const pct = Math.round(p * 100); pillSay(`Getting your Spin ready… ${pct}% · keep this page open<span class="bar"><i style="width:${pct}%"></i></span>`); });
    pillSay('Starting your Spin…<span class="bar"><i></i></span>');
    const [tus, made] = await Promise.all([loadTus().catch(() => null), callSpins({ action: 'start', caption, muted, bytes: file.size, music: music ? { id: music.id, name: music.name, by: music.by } : null })]);
    if (made.error || !tus) { uploading = false; pillSay('😕 ' + esc(made.error || "Couldn't load the uploader. Try again.")); pillGone(6000); return; }
    const up = new tus.Upload(file, {
      endpoint: TUS, retryDelays: [0, 3000, 5000, 10000, 20000], chunkSize: 8 * 1024 * 1024,
      headers: { AuthorizationSignature: made.signature, AuthorizationExpire: String(made.expire), VideoId: made.guid, LibraryId: String(made.library) },
      metadata: { filetype: file.type || 'video/mp4', title: 'spin' },
      onProgress: (sent, total) => { const pct = total ? Math.round((sent / total) * 100) : 0; pillSay(`Uploading your Spin… ${pct}% · keep this page open<span class="bar"><i style="width:${pct}%"></i></span>`); },
      onError: () => { uploading = false; pillSay('😕 The upload stopped. Check your connection and try again.'); pillGone(6000); },
      onSuccess: () => { pillSay('Almost there… getting it ready to play<span class="bar"><i style="width:100%"></i></span>'); waitReady(made.id, 0); }
    });
    up.start();
  }
  function waitReady(id, tries) {
    setTimeout(async () => {
      const r = await callSpins({ action: 'done', id });
      if (r.status === 'ready') {
        uploading = false;
        pillSay('🎉 Your Spin is live! Tap to watch', async () => {
          pillGone(0);
          const d = await P().rest('porch_spins?id=eq.' + id + '&select=' + COLS);
          if (d[0]) openPlayer([d[0]], 0);
        });
        pillGone(9000); refreshRows(); return;
      }
      if (r.status === 'failed' || tries > 90) { uploading = false; pillSay('😕 ' + esc(r.error || "That one didn't work. Try another video.")); pillGone(7000); refreshRows(); return; }
      const pc = Math.max(0, Math.min(99, Math.round(Number(r.progress) || 0)));
      pillSay(`Almost there… getting it ready to play${pc ? ' · ' + pc + '%' : ''}<span class="bar"><i style="width:${pc || 100}%"></i></span>`);
      waitReady(id, tries + 1);
    }, tries < 5 ? 2000 : 4000);
  }

  async function refreshRows() {
    paintRail();
    document.querySelectorAll('[data-sp-grid]').forEach((el) => profileGrid(el, el.dataset.spGrid));
  }

  /* ---- taps on the rows (Porch and profiles) ---- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-sp-make]') && !e.target.closest('.sp')) { e.preventDefault(); e.stopPropagation(); start(); return; }
    const t = e.target.closest('[data-sp-open]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    const list = sets.get(t.getAttribute('data-sp-open')) || [];
    const l = list[Number(t.getAttribute('data-sp-i'))]; if (!l) return;
    if (l.status !== 'ready') {
      say(l.status === 'failed' ? "That one didn't work. Deleting it so you can try again." : 'Still processing. Give it a minute.');
      if (l.status === 'failed' && l.user_id === meId()) callSpins({ action: 'delete', id: l.id }).then(refreshRows);
      return;
    }
    const ready = list.filter((x) => x.status === 'ready');
    openPlayer(ready, ready.indexOf(l));
  }, true);

  /* ---- the SPINS button on the rail: newest Spins, or the maker if there are none ---- */
  async function openLatest() {
    let list = [];
    try { list = await latest(30); } catch (_) {}
    if (!list.length) { say('No Spins yet. Give it a spin!'); return start(); }
    openPlayer(list, 0);
  }
  /* a link: ?spin=<id> (and from an alert: the Spin's post, maybe a comment) */
  async function openById(id, commentId) {
    try {
      const d = await P().rest('porch_spins?id=eq.' + id + '&select=' + COLS);
      if (!d[0]) return say('That Spin is gone.');
      openPlayer([d[0]], 0, commentId ? () => P().openCommentsFor(d[0].post_id, null, commentId) : null);
    } catch (_) { say("That Spin didn't load."); }
  }
  async function openPost(postId, commentId) {
    try {
      const d = await P().rest('porch_spins?post_id=eq.' + postId + '&select=' + COLS);
      if (!d[0]) return say('That Spin is gone.');
      openPlayer([d[0]], 0, commentId ? () => P().openCommentsFor(postId, null, commentId) : null);
    } catch (_) { say("That Spin didn't load."); }
  }

  window.PorchSpins = { paintRail, profileGrid, openLatest, openById, openPost, start, refreshRows };
})();

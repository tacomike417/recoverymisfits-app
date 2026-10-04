/* PHOTO FUN (4 Oct 2026, Mike: "for new posts we could do cool things with photos ... a photo
 * collage ... with a hashtag on it and they look like a polaroid collage ... a bunch of little
 * graphics like that we could bake into the pics ... you get to see what the post looks like
 * before you post it").
 *
 *   STICKERS  PorchPhotoFun.decorate(photo, stickers) -> { data, stickers } or null
 *             A full-screen editor: tap a word, a sticker or your day count, drag it, pinch
 *             (or pull the corner) to size and turn it. Done bakes them INTO the picture.
 *   COLLAGE   PorchPhotoFun.collage(photos, { bg, tag, seed, caps }) -> picture
 *             2 to 4 photos as tilted Polaroids on a wood table, a corkboard or black, with
 *             a hashtag written across them.
 *
 * Everything happens on the phone. What comes out is one ordinary JPEG, so the rest of the
 * Porch (the photo check, the feed, sending it to a friend) treats it like any other photo.
 * feed/porch.html owns the buttons; this file owns the pictures.
 */
(function () {
  'use strict';
  if (window.PorchPhotoFun) return;

  const MAX_STICKERS = 8;
  const STICKER_FILES = ['grateful', 'still-here', 'odaat', 'proud-of-me', 'day-one', 'showed-up', 'keep-going', 'sunrise', 'small-wins', 'we-got-this',
    'not-today', 'new-me', 'clean-slate', 'breathe', 'coffee-first', 'good-vibes', 'glow-up', 'big-mood', 'love-this', 'lets-gooo', 'hi-friends', 'misfit', 'recovery-misfits'];
  /* path-neutral on purpose: nothing here belongs to one program */
  const WORDS = [
    ['script', 'Blessed'], ['script', 'Grateful'], ['script', 'One day at a time'], ['script', 'Still here'], ['script', 'Thank you'], ['script', 'Proud of me'],
    ['script', 'Good morning'], ['script', 'Made it'],
    ['marker', 'DAY ONE'], ['marker', 'I SHOWED UP'], ['marker', 'STILL HERE'], ['marker', 'KEEP GOING'], ['marker', 'NOT TODAY'], ['marker', 'SOBER OUT LOUD'],
    ['marker', '#MISFITS'], ['marker', '#GRATEFUL'],
  ];
  const FONTS = [['RM Script', '/assets/fonts/dancing-script-700.woff2'], ['RM Marker', '/assets/fonts/permanent-marker-400.woff2']];
  const FACE = { script: '700 120px "RM Script", "Brush Script MT", cursive', marker: '400 110px "RM Marker", Impact, sans-serif', strip: '400 104px "RM Marker", Impact, sans-serif' };

  let fontsP = null;
  function loadFonts() {
    if (!fontsP) fontsP = Promise.all(FONTS.map(([name, url]) => {
      try { const f = new FontFace(name, 'url(' + url + ')'); return f.load().then((x) => { document.fonts.add(x); }, () => {}); } catch (_) { return Promise.resolve(); }
    }));
    return fontsP;
  }
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('image')); i.src = src; });
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const say = (t) => { try { window.Porch && window.Porch.toast(t); } catch (_) {} };

  /* ---- a word as a little picture, so the editor and the finished photo draw the very same thing ---- */
  const wordCache = {};
  function wordArt(kind, text) {
    const key = kind + '|' + text;
    if (wordCache[key]) return wordCache[key];
    const c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = FACE[kind];
    const w = Math.ceil(x.measureText(text).width), pad = kind === 'strip' ? 44 : 36, h = kind === 'script' ? 190 : 170;
    c.width = w + pad * 2; c.height = h;
    x.font = FACE[kind]; x.textBaseline = 'middle'; x.textAlign = 'center';
    const cx = c.width / 2, cy = h / 2 + (kind === 'script' ? 6 : 8);
    if (kind === 'strip') {
      x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 14; x.shadowOffsetY = 5;
      x.fillStyle = '#fbf8f0'; x.fillRect(10, 14, c.width - 20, h - 34);
      x.shadowColor = 'transparent'; x.fillStyle = '#16130e'; x.fillText(text, cx, cy - 4);
    } else if (kind === 'marker') {
      x.lineJoin = 'round'; x.lineWidth = 16; x.strokeStyle = '#16130e'; x.strokeText(text, cx, cy);
      x.fillStyle = '#ffd21f'; x.fillText(text, cx, cy);
    } else {
      x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 16; x.shadowOffsetY = 4;
      x.fillStyle = '#fff'; x.fillText(text, cx, cy);
    }
    return (wordCache[key] = { src: c.toDataURL('image/png'), ratio: c.height / c.width });
  }
  function soberDays() {
    let d = ''; try { d = localStorage.getItem('rm_sober_date') || ''; } catch (_) {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const p = d.split('-').map(Number), then = new Date(p[0], p[1] - 1, p[2]), now = new Date();
    const n = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000) + 1;
    if (!(n > 0)) return null;
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { n, since: MON[p[1] - 1] + ' ' + p[2] + ', ' + p[0] };
  }

  /* ---- the look ---- */
  const CSS = `
.pfx{position:fixed;inset:0;z-index:30000;display:flex;flex-direction:column;background:#0b0b0a;color:#fff;touch-action:none;-webkit-user-select:none;user-select:none}
.pfx-top{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 8px}
.pfx-top b{flex:1;text-align:center;font:500 15px "RM Rail",Oswald,sans-serif;letter-spacing:.14em}
.pfx-x{width:44px;height:44px;border:0;border-radius:50%;background:none;color:#fff;font:400 26px/1 Arial,sans-serif;cursor:pointer}
.pfx-done{min-width:76px;height:40px;padding:0 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#17130b;font:800 15px Arial,sans-serif;cursor:pointer}
.pfx-stage{position:relative;flex:1;min-height:0;margin:0 12px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.pfx-pic{position:relative;line-height:0}
.pfx-pic>img{display:block;max-width:100%;border-radius:10px;pointer-events:none}
.pfx-s{position:absolute;left:0;top:0;transform-origin:center;cursor:grab;touch-action:none}
.pfx-s img{display:block;width:100%;pointer-events:none;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))}
.pfx-s.w img{filter:none}
.pfx-s.on{outline:2px dashed rgba(255,255,255,.9);outline-offset:4px;border-radius:6px}
.pfx-del,.pfx-grip{position:absolute;width:30px;height:30px;border:0;border-radius:50%;display:none;place-items:center;font:900 16px/1 Arial,sans-serif;cursor:pointer;touch-action:none}
.pfx-s.on .pfx-del,.pfx-s.on .pfx-grip{display:grid}
.pfx-del{left:-17px;top:-17px;background:#e5484d;color:#fff}
.pfx-grip{right:-17px;bottom:-17px;background:#fff;color:#000}
.pfx-tray{flex:none;padding:10px 12px calc(12px + env(safe-area-inset-bottom,0px));background:#151411;border-top:1px solid #2e2a21}
.pfx-tabs{display:flex;gap:8px;margin-bottom:10px}
.pfx-tabs button{padding:8px 15px;border-radius:999px;border:1px solid #3a3426;background:none;color:#958c78;font:700 14px Arial,sans-serif;cursor:pointer}
.pfx-tabs button.on{background:#e0bd6a;border-color:#e0bd6a;color:#17130b}
.pfx-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:74px;align-content:start;gap:8px;max-height:26vh;overflow-y:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch}
.pfx-grid button{display:block;height:74px;min-width:0;padding:6px;border-radius:12px;border:1px solid #3a3426;background:#1f1d18;overflow:hidden;cursor:pointer}
.pfx-grid button.wide{grid-column:span 2}
.pfx-grid img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}
.pfx-note{margin:8px 2px 0;color:#958c78;font:400 13px/1.35 Arial,sans-serif}
.pfx-none{grid-column:1/-1;margin:6px 2px;color:#c9bfa8;font:400 14px/1.4 Arial,sans-serif}`;
  function addCSS() { if (document.getElementById('photo-fun-css')) return; const s = document.createElement('style'); s.id = 'photo-fun-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ================================================================ STICKERS */
  async function decorate(photo, had) {
    addCSS();
    await loadFonts();
    let img; try { img = await loadImg(photo); } catch (_) { say("That photo couldn't be opened."); return null; }
    return new Promise((done) => {
      const el = document.createElement('div'); el.className = 'pfx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Add stickers');
      el.innerHTML = `<div class="pfx-top"><button type="button" class="pfx-x" aria-label="Cancel">✕</button><b>ADD STICKERS</b><button type="button" class="pfx-done">Done</button></div>
        <div class="pfx-stage"><div class="pfx-pic"><img alt=""></div></div>
        <div class="pfx-tray"><div class="pfx-tabs"><button type="button" data-tab="words" class="on">Words</button><button type="button" data-tab="stickers">Stickers</button><button type="button" data-tab="days">My days</button></div>
          <div class="pfx-grid"></div><p class="pfx-note">Tap one to add it. Drag to move. Pinch, or pull the white corner, to size and turn it.</p></div>`;
      document.body.appendChild(el);
      const pic = el.querySelector('.pfx-pic'), pimg = pic.querySelector('img'), stage = el.querySelector('.pfx-stage'), grid = el.querySelector('.pfx-grid');
      pimg.src = photo;
      let list = (had || []).map((s) => Object.assign({}, s)), sel = -1, finished = false;

      /* fit the picture in the space it has */
      function fit() {
        const r = stage.getBoundingClientRect(), k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
        pimg.style.width = Math.max(40, Math.floor(img.naturalWidth * k)) + 'px'; pimg.style.height = 'auto';
        paint();
      }
      function paint() {
        const W = pimg.clientWidth, H = pimg.clientHeight;
        pic.querySelectorAll('.pfx-s').forEach((n) => n.remove());
        list.forEach((s, i) => {
          const d = document.createElement('div'); d.className = 'pfx-s' + (s.word ? ' w' : '') + (i === sel ? ' on' : ''); d.dataset.i = String(i);
          const w = s.w * W, h = w * s.ratio;
          d.style.width = w + 'px';
          d.style.transform = `translate(${s.x * W - w / 2}px,${s.y * H - h / 2}px) rotate(${s.r}deg)`;
          d.innerHTML = `<img src="${esc(s.src)}" alt=""><button type="button" class="pfx-del" aria-label="Take it off">×</button><button type="button" class="pfx-grip" aria-label="Size and turn">⤡</button>`;
          pic.appendChild(d);
        });
      }
      function add(src, ratio, word, w) {
        if (list.length >= MAX_STICKERS) return say('That\'s ' + MAX_STICKERS + ". Take one off to add another.");
        const n = list.length;
        list.push({ src, ratio, word: !!word, x: 0.5 + ((n % 3) - 1) * 0.08, y: 0.72 - (n % 4) * 0.12, w: w || 0.42, r: 0 });
        sel = list.length - 1; paint();
      }

      /* the tray. v174: fixed-height rows, no aspect-ratio. On iPhone the Words and Stickers lists (the long ones that
         scroll) came out squashed on top of each other; Safari shrinks aspect-ratio rows inside a box with a max-height. */
      function tray(tab) {
        el.querySelectorAll('.pfx-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
        if (tab === 'stickers') {
          grid.innerHTML = STICKER_FILES.map((f) => `<button type="button" data-st="${f}"><img src="/feed/spins/stickers/${f}.webp" alt="${esc(f.replace(/-/g, ' '))}" loading="lazy"></button>`).join('');
        } else if (tab === 'days') {
          const sd = soberDays();
          if (!sd) { grid.innerHTML = '<p class="pfx-none">Set your sober date on the gold plate at the bottom of the app, and your day count shows up here as a sticker. Only you choose whether it goes on a photo.</p>'; return; }
          const n = sd.n.toLocaleString('en-US');
          const opts = [['strip', n + (sd.n === 1 ? ' DAY' : ' DAYS')], ['marker', 'DAY ' + n], ['script', n + (sd.n === 1 ? ' day sober' : ' days sober')], ['strip', 'SOBER SINCE ' + sd.since.toUpperCase()]];
          grid.innerHTML = opts.map((o) => { const a = wordArt(o[0], o[1]); return `<button type="button" class="wide" data-w="${o[0]}" data-t="${esc(o[1])}"><img src="${a.src}" alt="${esc(o[1])}"></button>`; }).join('');
        } else {
          grid.innerHTML = WORDS.map((o) => { const t = o[0] === 'script' && o[1] === 'Blessed' ? 'Blessed ♡' : o[1]; const a = wordArt(o[0], t); return `<button type="button" class="wide" data-w="${o[0]}" data-t="${esc(t)}"><img src="${a.src}" alt="${esc(t)}"></button>`; }).join('');
        }
        grid.scrollTop = 0;
      }
      el.querySelector('.pfx-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) tray(b.dataset.tab); });
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.st) return add('/feed/spins/stickers/' + b.dataset.st + '.webp', 1, false, 0.3);
        if (b.dataset.w) { const a = wordArt(b.dataset.w, b.dataset.t); add(a.src, a.ratio, true, Math.min(0.8, Math.max(0.36, 0.11 / a.ratio + 0.16))); }
      });

      /* moving them: one finger drags, two fingers (or the corner) size and turn */
      const pts = new Map(); let drag = null, pinch = null, grip = null;
      const center = (s) => { const r = pimg.getBoundingClientRect(); return { x: r.left + s.x * r.width, y: r.top + s.y * r.height }; };
      pic.addEventListener('pointerdown', (e) => {
        const node = e.target.closest('.pfx-s');
        if (e.target.closest('.pfx-del')) { e.preventDefault(); list.splice(Number(node.dataset.i), 1); sel = -1; paint(); return; }
        if (!node) { if (sel !== -1 && pts.size === 0) { sel = -1; paint(); } }
        else { const i = Number(node.dataset.i); if (i !== sel) { sel = i; paint(); } }
        if (sel < 0) return;
        e.preventDefault();
        try { pic.setPointerCapture(e.pointerId); } catch (_) {}
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const s = list[sel];
        if (e.target.closest('.pfx-grip')) { const c = center(s); grip = { id: e.pointerId, d: Math.hypot(e.clientX - c.x, e.clientY - c.y) || 1, a: Math.atan2(e.clientY - c.y, e.clientX - c.x), w: s.w, r: s.r }; return; }
        if (pts.size === 1) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: s.x, sy: s.y };
        else if (pts.size === 2) {
          const p = [...pts.values()]; drag = null;
          pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, a: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x), w: s.w, r: s.r };
        }
      });
      pic.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId) || sel < 0) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const s = list[sel], W = pimg.clientWidth, H = pimg.clientHeight;
        if (grip && grip.id === e.pointerId) {
          const c = center(s), d = Math.hypot(e.clientX - c.x, e.clientY - c.y), a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
          s.w = Math.min(1.4, Math.max(0.1, grip.w * d / grip.d)); s.r = grip.r + (a - grip.a) * 180 / Math.PI;
        } else if (pinch && pts.size >= 2) {
          const p = [...pts.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), a = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
          s.w = Math.min(1.4, Math.max(0.1, pinch.w * d / pinch.d)); s.r = pinch.r + (a - pinch.a) * 180 / Math.PI;
        } else if (drag && drag.id === e.pointerId) {
          s.x = Math.min(1.05, Math.max(-0.05, drag.sx + (e.clientX - drag.x) / W)); s.y = Math.min(1.05, Math.max(-0.05, drag.sy + (e.clientY - drag.y) / H));
        } else return;
        const node = pic.querySelector('.pfx-s.on'); if (!node) return;
        const w = s.w * W, h = w * s.ratio;
        node.style.width = w + 'px'; node.style.transform = `translate(${s.x * W - w / 2}px,${s.y * H - h / 2}px) rotate(${s.r}deg)`;
      });
      const up = (e) => { pts.delete(e.pointerId); if (grip && grip.id === e.pointerId) grip = null; if (pts.size < 2) pinch = null; if (drag && drag.id === e.pointerId) drag = null; };
      pic.addEventListener('pointerup', up); pic.addEventListener('pointercancel', up);

      /* leaving */
      function leave(result) {
        if (finished) return; finished = true;
        window.removeEventListener('resize', fit); el.remove(); done(result);
      }
      let z = null;
      try { z = window.PorchBack && window.PorchBack.push('deco', () => leave(null)); } catch (_) {}
      if (typeof z === 'number') el.style.zIndex = String(z + 5);
      const back = (result) => {
        if (finished) return; finished = true; window.removeEventListener('resize', fit); el.remove();
        let landed = false; const go = () => { if (landed) return; landed = true; setTimeout(() => done(result), 0); };
        window.addEventListener('popstate', go, { once: true });
        let popped = false; try { popped = !!(window.PorchBack && window.PorchBack.pop('deco')); } catch (_) {}
        if (!popped) { window.removeEventListener('popstate', go); go(); }
        setTimeout(go, 700);
      };
      el.querySelector('.pfx-x').addEventListener('click', () => back(null));
      el.querySelector('.pfx-done').addEventListener('click', async () => {
        const b = el.querySelector('.pfx-done'); b.disabled = true; b.textContent = '…';
        let data = photo;
        try { data = await bake(img, list); } catch (_) { say("That didn't work. Try again."); b.disabled = false; b.textContent = 'Done'; return; }
        back({ data, stickers: list });
      });
      window.addEventListener('resize', fit);
      tray('words');
      requestAnimationFrame(fit);
    });
  }
  /* the picture with the stickers drawn in */
  async function bake(img, list) {
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
    for (const s of list) {
      let si; try { si = await loadImg(s.src); } catch (_) { continue; }
      const w = s.w * W, h = w * s.ratio;
      x.save(); x.translate(s.x * W, s.y * H); x.rotate(s.r * Math.PI / 180);
      if (!s.word) { x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = W * 0.012; x.shadowOffsetY = W * 0.004; }
      x.drawImage(si, -w / 2, -h / 2, w, h); x.restore();
    }
    return jpeg(c);
  }
  function jpeg(c) { let q = 0.9, out = c.toDataURL('image/jpeg', q); while (out.length > 3.6e6 && q > 0.45) { q -= 0.1; out = c.toDataURL('image/jpeg', q); } return out; }

  /* ================================================================ COLLAGE */
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const SPOTS = {
    2: { size: 560, at: [[330, 350, -7], [750, 720, 6]], tag: [540, 540, -4] },
    3: { size: 470, at: [[300, 310, -7], [790, 340, 6], [545, 770, -3]], tag: [540, 560, -4] },
    4: { size: 440, at: [[295, 300, -7], [790, 315, 6], [310, 790, 4], [785, 800, -5]], tag: [540, 548, -4] },
  };
  function drawBg(x, bg, rnd) {
    if (bg === 'cork') {
      x.fillStyle = '#b58a5c'; x.fillRect(0, 0, 1080, 1080);
      for (let i = 0; i < 5200; i++) { const r = rnd(); x.fillStyle = r < 0.5 ? 'rgba(92,62,34,.5)' : r < 0.8 ? 'rgba(214,176,128,.55)' : 'rgba(60,40,22,.45)'; const s = 1.5 + rnd() * 4; x.fillRect(rnd() * 1080, rnd() * 1080, s, s * (0.6 + rnd())); }
    } else if (bg === 'black') {
      const g = x.createRadialGradient(540, 380, 60, 540, 540, 820); g.addColorStop(0, '#2c2c2a'); g.addColorStop(1, '#0b0b0a'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
    } else {
      const shades = ['#3b2a1c', '#4a3524', '#33241a', '#453021', '#3f2c1e'];
      let px = -20;
      while (px < 1100) {
        const w = 120 + rnd() * 90; x.fillStyle = shades[Math.floor(rnd() * shades.length)]; x.fillRect(px, 0, w, 1080);
        x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, 1080); x.stroke();
        for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(0,0,0,' + (0.05 + rnd() * 0.08) + ')'; x.lineWidth = 1 + rnd() * 2; const gx = px + rnd() * w; x.beginPath(); x.moveTo(gx, 0); x.bezierCurveTo(gx + 14 * (rnd() - 0.5), 360, gx + 14 * (rnd() - 0.5), 720, gx + 8 * (rnd() - 0.5), 1080); x.stroke(); }
        px += w;
      }
      const g = x.createRadialGradient(540, 540, 300, 540, 540, 820); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
    }
  }
  function fitText(x, text, face, max, start) { let s = start; do { x.font = face.replace(/\d+px/, s + 'px'); if (x.measureText(text).width <= max) break; s -= 2; } while (s > 14); return s; }
  async function collage(photos, o) {
    o = o || {};
    await loadFonts();
    const n = Math.min(4, photos.length), lay = SPOTS[n]; if (!lay) throw new Error('2 to 4 photos');
    const rnd = rng((o.seed || 1) * 7919), bg = o.bg || 'wood';
    const imgs = []; for (let i = 0; i < n; i++) imgs.push(await loadImg(photos[i]));
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
    const x = c.getContext('2d');
    drawBg(x, bg, rng(17));                                  /* the table stays put when they shuffle */
    /* which photo sits where, and who is on top, changes with the shuffle */
    const order = imgs.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
    const spots = lay.at.map((a) => [a[0] + (rnd() - 0.5) * 46, a[1] + (rnd() - 0.5) * 46, a[2] + (rnd() - 0.5) * 9]);
    const stack = spots.map((_, i) => i); if ((o.seed || 1) > 1) stack.sort(() => rnd() - 0.5);
    const S = lay.size, pad = S * 0.045, foot = S * 0.2;
    for (const k of stack) {
      const im = imgs[order[k]], sp = spots[k], cap = (o.caps || [])[order[k]] || '';
      x.save(); x.translate(sp[0], sp[1]); x.rotate(sp[2] * Math.PI / 180);
      x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 30; x.shadowOffsetY = 12;
      x.fillStyle = '#fbf8f0'; x.fillRect(-S / 2, -S / 2 - foot / 2 + pad, S, S + foot - pad);
      x.shadowColor = 'transparent';
      const inner = S - pad * 2, top = -S / 2 - foot / 2 + pad * 2;
      const side = Math.min(im.naturalWidth, im.naturalHeight), sx = (im.naturalWidth - side) / 2, sy = (im.naturalHeight - side) / 2;
      x.drawImage(im, sx, sy, side, side, -inner / 2, top, inner, inner);
      x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; x.strokeRect(-inner / 2, top, inner, inner);
      if (cap) { x.fillStyle = '#26221b'; x.textAlign = 'center'; x.textBaseline = 'middle'; fitText(x, cap, FACE.marker, inner - 20, Math.round(foot * 0.5)); x.fillText(cap, 0, top + inner + (foot - pad) / 2 + 2); }
      /* tape on the table, a pin on the corkboard */
      const ty = -S / 2 - foot / 2 + pad;
      if (bg === 'cork') { x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 6; x.shadowOffsetY = 3; x.fillStyle = '#d93a3f'; x.beginPath(); x.arc(0, ty + 16, 13, 0, Math.PI * 2); x.fill(); x.shadowColor = 'transparent'; x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(-4, ty + 12, 4, 0, Math.PI * 2); x.fill(); }
      else { x.save(); x.rotate(-0.05 + rnd() * 0.1); x.fillStyle = bg === 'black' ? 'rgba(240,240,235,.5)' : 'rgba(255,236,150,.72)'; x.fillRect(-S * 0.16, ty - 16, S * 0.32, 38); x.restore(); }
      x.restore();
    }
    const tag = String(o.tag || '').trim();
    if (tag) {
      x.save(); x.translate(lay.tag[0], lay.tag[1]); x.rotate(lay.tag[2] * Math.PI / 180);
      const size = fitText(x, tag, FACE.strip, 900, 84), w = x.measureText(tag).width + 70, h = size * 1.5;
      x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 22; x.shadowOffsetY = 8;
      x.fillStyle = bg === 'cork' ? '#ffd21f' : '#fbf8f0'; x.fillRect(-w / 2, -h / 2, w, h);
      x.shadowColor = 'transparent'; x.fillStyle = '#16130e'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(tag, 0, 4);
      x.restore();
    }
    return jpeg(c);
  }

  /* put stickers they already placed back onto a fresh picture (a collage redrawn with a new look) */
  async function apply(photo, stickers) { if (!stickers || !stickers.length) return photo; return bake(await loadImg(photo), stickers); }

  window.PorchPhotoFun = { decorate, collage, apply, loadFonts, MAX_STICKERS };
})();

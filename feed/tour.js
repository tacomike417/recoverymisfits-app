/* THE PORCH TOUR (2 Oct 2026, Mike).
 *
 * "Matt's going to sign up and he's going to be like, what do I do next? ... some sort of
 * pop up that says, hey, you haven't filled out your account information yet ... a very
 * graphical tutorial ... with little screenshots ... so people aren't calling me every
 * five minutes. Update your profile, make a post, make a spin, and how to share it to
 * YouTube Shorts. Real, real, real intuitive. As soon as they start getting confused on
 * the tutorial they close it out."
 *
 * SO: one thing per screen. A big title, one real screenshot with a gold ring on the thing
 * to tap, one short line, and a button that DOES it (the tour steps aside and the real
 * screen opens). "Next" just looks. The X is always there. Nothing is required.
 *
 * It comes up by itself EVERY time somebody lands on the Porch signed in, until they tick
 * "Don't show me this again" at the bottom of it. A
 * small "Getting started" strip sits above the feed until the three things are done or
 * they close it, and "How the Porch works" stays in the account menu for good.
 *
 * The pictures are in /feed/tour/. They are real screenshots; if a screen changes a lot,
 * retake them.
 *
 * v91, 2 Oct 2026, Mike: "just walk them right through what they're doing ... make it like
 * an interactive tutorial that they can't fuck up." So the gold button on each step no
 * longer just opens a screen and leaves. THE COACH (bottom of this file) takes over: the
 * tour steps aside, the real screen comes up, and a gold ring and one short line sit on
 * the exact button to tap next. It watches the screen and moves on by itself. Nothing is
 * blocked; the coach never eats a tap. When the thing is done, the tour comes back on the
 * next step. Back out halfway, and the tour comes back on the same step.
 *
 * Phone first, at 393. Leans on window.Porch and window.PorchBack (feed/porch.html).
 */
(function () {
  'use strict';
  if (window.PorchTour) return;

  const P = () => window.Porch;
  const IMG = '/feed/tour/';
  const V = '1';
  const SEEN = 'rm_porch_tour';          /* '1' once they have been shown the tour */
  const AT = 'rm_porch_tour_at';         /* the step to pick up at */
  const HIDE = 'rm_porch_tour_hide';     /* they closed the Getting started strip */
  /* EVERY TIME, UNTIL THEY SAY STOP (2 Oct 2026, Mike: "show for everybody on the beta ...
     until they click that little don't show me this again"). Closing it with the X does
     not count. Only the tick does. */
  const OFF = 'rm_porch_tour_off';
  const get = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* what they have already done, so a finished step says so instead of nagging */
  const did = { profile: false, post: false, spin: false };
  async function loadDid() {
    const p = P(); if (!p || !p.me || !p.me.uid) return;
    did.profile = !!(p.me.member && p.me.member.avatar_path);
    try { did.post = (await p.rest('porch_posts?user_id=eq.' + p.me.uid + '&select=id&limit=1')).length > 0; } catch (_) {}
    try { did.spin = (await p.rest('porch_spins?user_id=eq.' + p.me.uid + '&status=eq.ready&select=id&limit=1')).length > 0; } catch (_) {}
  }
  const doneCount = () => (did.profile ? 1 : 0) + (did.post ? 1 : 0) + (did.spin ? 1 : 0);

  const pic = (f, alt) => `<img class="pt-img" src="${IMG}${f}?v=${V}" alt="${esc(alt)}" loading="eager" decoding="async">`;
  const STEPS = [
    { k: 'hello' },
    { k: 'profile', n: 1, title: 'Add your picture',
      body: () => pic('1-profile.webp', 'The profile screen with the picture circle ringed'),
      line: 'A picture and a line about you.', go: 'Add it now' },
    { k: 'post', n: 2, title: 'Say something',
      body: () => pic('2-post.webp', 'The gold plus button open, with Say something ringed'),
      line: 'Say hi to the Porch. Anything at all.', go: 'Say something now' },
    { k: 'spin', n: 3, title: 'Make a Spin',
      body: () => pic('3-spin.webp', 'The Spin maker with Record and Upload'),
      line: 'A short video. Record one, or use one from your phone.', go: 'Make one now' },
    { k: 'share', n: 4, title: 'Put your Spin on YouTube, Facebook, TikTok, etc.', small: true,
      body: () => `<div class="pt-two">
          <figure>${pic('4a-share.webp', 'A Spin with the share arrow ringed')}<figcaption><b>1</b> Open your Spin. Tap the arrow.</figcaption></figure>
          <figure>${pic('4b-video.webp', 'The share choices with Share this video ringed')}<figcaption><b>2</b> Tap <i>Share this video</i>.</figcaption></figure>
        </div>`,
      line: '<b>3</b> Pick the app you want.', go: 'Share it now' },
    { k: 'more' }
  ];
  const stepOf = (k) => STEPS.findIndex((x) => x.k === k);

  const CSS = `
.pt{position:fixed;inset:0;z-index:20060;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.72);font-family:Arial,sans-serif}
.pt-box{position:relative;width:100%;max-width:480px;max-height:94vh;overflow:auto;padding:18px 20px calc(20px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#191814;color:#f1e7cf;border-top:1px solid rgba(224,189,106,.35);text-align:center}
.pt-x{position:absolute;right:10px;top:10px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#f1e7cf;display:grid;place-items:center;cursor:pointer}
.pt-x svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.pt-dots{display:flex;gap:6px;justify-content:center;margin:4px 0 12px}
.pt-dots i{width:26px;height:5px;border-radius:3px;background:rgba(224,189,106,.22)}
.pt-dots i.on{background:#e0bd6a}
.pt-k{margin:0 0 4px;font:500 12.5px "RM Rail",Oswald,"Arial Narrow",sans-serif;letter-spacing:.18em;color:#e0bd6a}
.pt h2{margin:0 40px 10px;font:400 32px/1.05 "RM Head",Impact,sans-serif;letter-spacing:.01em;text-transform:uppercase}
.pt-img{display:block;width:100%;max-width:300px;max-height:44vh;margin:0 auto;border-radius:16px;border:1px solid rgba(224,189,106,.3);object-fit:contain;background:#0d0d0b}
.pt-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pt-two figure{margin:0}
.pt-two .pt-img{max-height:36vh}
.pt-two figcaption{margin-top:7px;font:700 14px/1.3 Arial,sans-serif;text-align:left}
.pt b.n,.pt-two figcaption b,.pt-line b{display:inline-grid;place-items:center;width:22px;height:22px;margin-right:5px;border-radius:50%;background:#e0bd6a;color:#1a1408;font:400 14px "RM Head",Impact,sans-serif;vertical-align:1px}
.pt-line{margin:12px 0 14px;font:700 17px/1.4 Arial,sans-serif}
.pt-sub{margin:0 0 16px;font:15.5px/1.5 Arial,sans-serif;color:#cfc4a8}
.pt-done{display:inline-block;margin:0 0 10px;padding:5px 12px;border-radius:999px;background:rgba(120,190,120,.16);color:#9fd49f;font:800 13px Arial,sans-serif}
.pt-go{display:block;width:100%;padding:16px 18px;border:0;border-radius:15px;cursor:pointer;background:linear-gradient(135deg,#f3dfa0,#e0bd6a 55%,#c9973a);color:#1a1408;font:400 22px/1 "RM Head",Impact,sans-serif;letter-spacing:.04em;text-transform:uppercase}
.pt-next{display:block;width:100%;margin-top:9px;padding:14px 18px;border:1.5px solid rgba(224,189,106,.4);border-radius:15px;cursor:pointer;background:none;color:#f1e7cf;font:800 16px Arial,sans-serif}
.pt h2.sm{font-size:24px;line-height:1.1}
.pt-off{display:flex;align-items:center;justify-content:center;gap:9px;margin:14px 0 0;color:#b9ad92;font:700 14px Arial,sans-serif;cursor:pointer}
.pt-off input{width:22px;height:22px;flex:none;accent-color:#e0bd6a}
.pt-skip{display:inline-block;margin-top:10px;padding:10px 14px;border:0;background:none;color:#a99d82;font:700 14px Arial,sans-serif;cursor:pointer}
.pt-more{display:grid;gap:8px;margin:4px 0 14px;text-align:left}
.pt-more button{display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(224,189,106,.25);background:rgba(255,255,255,.03);color:#f1e7cf;cursor:pointer;font:800 16px Arial,sans-serif;text-align:left}
.pt-more small{display:block;margin-top:2px;font:500 13.5px/1.3 Arial,sans-serif;color:#b9ad92}
.pt-more i{margin-left:auto;font-style:normal;color:#e0bd6a;font-size:20px}
.pt-strip{display:flex;align-items:center;gap:10px;width:calc(100% - 20px);margin:8px 10px 4px;padding:11px 12px 11px 14px;border-radius:14px;border:1px solid rgba(224,189,106,.4);background:linear-gradient(135deg,rgba(224,189,106,.16),rgba(224,189,106,.05));color:#f1e7cf;text-align:left;cursor:pointer;font:800 15px Arial,sans-serif}
.pt-strip small{display:block;margin-top:1px;font:600 13px Arial,sans-serif;color:#cfc4a8}
.pt-strip .go{margin-left:auto;color:#e0bd6a;white-space:nowrap}
.pt-tip{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:11px 13px;border-radius:14px;border:1px solid rgba(224,189,106,.4);background:rgba(224,189,106,.1);text-align:left;font:700 15px/1.35 Arial,sans-serif}
.pt-q{flex:none;display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;border:2px solid #e0bd6a;color:#e0bd6a;font:800 17px Arial,sans-serif}
.pt-ring{position:fixed;display:grid;place-items:center;border-radius:50%;border:3px solid #e0bd6a;background:#191814;color:#e0bd6a;font:800 20px Arial,sans-serif;pointer-events:none;animation:ptpulse 1.4s ease-in-out infinite}
.pt-ring small{position:absolute;top:calc(100% + 9px);right:-4px;white-space:nowrap;padding:5px 10px;border-radius:999px;background:#e0bd6a;color:#1a1408;font:800 12.5px Arial,sans-serif}
.pt-hand{margin:8px 0 0;font:600 13.5px Arial,sans-serif;color:#b9ad92}
.pt-cheer{margin:0 44px 10px;padding:8px 12px;border-radius:12px;background:rgba(120,190,120,.16);color:#9fd49f;font:800 15px/1.3 Arial,sans-serif}
@keyframes ptpulse{0%,100%{box-shadow:0 0 0 0 rgba(224,189,106,.75)}50%{box-shadow:0 0 0 12px rgba(224,189,106,0)}}
.co-ring{position:fixed;z-index:2147483000;pointer-events:none;border:3px solid #e0bd6a;border-radius:16px;animation:ptpulse 1.4s ease-in-out infinite;transition:left .18s,top .18s,width .18s,height .18s}
.co-bub{position:fixed;z-index:2147483001;pointer-events:none;display:flex;align-items:flex-start;gap:8px;padding:12px 8px 12px 14px;border-radius:16px;background:#e0bd6a;color:#1a1408;box-shadow:0 10px 30px rgba(0,0,0,.6);font:800 16.5px/1.3 Arial,sans-serif;text-align:left}
.co-bub p{margin:0;flex:1;padding-top:3px}
.co-bub p b{font-weight:900;text-decoration:underline}
.co-bub button{pointer-events:auto;flex:none;width:30px;height:30px;border:0;border-radius:50%;background:rgba(26,20,8,.14);color:#1a1408;font-size:15px;cursor:pointer}
.co-bub::after{content:"";position:absolute;left:var(--ax,50%);width:14px;height:14px;margin-left:-7px;background:#e0bd6a;transform:rotate(45deg)}
.co-bub.up::after{top:-6px}
.co-bub.down::after{bottom:-6px}
.co-bub.none::after{display:none}
.co-bub.ok{background:#1f2a1c;color:#bfe6bf;border:2px solid #7dbb7d;justify-content:center;text-align:center}
.co-bub.ok button{display:none}
.pt-strip .x{flex:none;width:34px;height:34px;margin:-4px -4px -4px 0;border:0;border-radius:50%;background:none;color:#a99d82;font-size:18px;cursor:pointer}`;
  function addCSS() { if (document.getElementById('pt-css')) return; const s = document.createElement('style'); s.id = 'pt-css'; s.textContent = CSS; document.head.appendChild(s); }

  let el = null, at = 0, cheer = '';
  const XSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function shut() { if (el) { el.remove(); el = null; } paintStrip(); }
  function close() { const b = window.PorchBack; if (!b || !b.pop('tour')) shut(); }

  function draw() {
    if (!el) return;
    const s = STEPS[at], last = STEPS.length - 1;
    const name = (P() && P().me && P().me.member && P().me.member.handle) || '';
    const dots = `<div class="pt-dots">${[1, 2, 3, 4].map((n) => `<i class="${s.n && n <= s.n ? 'on' : ''}"></i>`).join('')}</div>`;
    let h = `<button type="button" class="pt-x" data-pt-x aria-label="Close">${XSVG}</button>`;
    if (s.k === 'hello') {
      h += `<p class="pt-k">WELCOME TO THE PORCH</p><h2>${name ? 'Hey ' + esc(name) : 'Hey there'}</h2>
        <p class="pt-sub">Four quick things. You do each one for real, and I point at every button.</p>
        <div class="pt-tip"><span class="pt-q">?</span><span>Tap the <b>?</b> at the top any time. This comes right back.</span></div>
        <button type="button" class="pt-go" data-pt-next>Show me</button>
        <button type="button" class="pt-skip" data-pt-x>Not now</button>`;
    } else if (s.k === 'more') {
      const row = (k, t, sub) => `<button type="button" data-pt-more="${k}"><span>${t}<small>${sub}</small></span><i>&rsaquo;</i></button>`;
      h += `<p class="pt-k">THAT&rsquo;S THE BASICS</p><h2>Want to see what else you can do?</h2>
        <div class="pt-more">
          ${row('friends', 'Find friends', 'Add a few. Their shares show up under Friends.')}
          ${row('messages', 'Messages', 'Talk to a friend, just the two of you.')}
          ${row('groups', 'Groups', 'Small rooms for people on the same road.')}
          ${row('invite', 'Invite somebody', 'Send the Porch to a friend.')}
        </div>
        <button type="button" class="pt-next" data-pt-x>I&rsquo;m good. Take me to the Porch.</button>`;
    } else {
      const done = did[s.k];
      const needSpin = s.k === 'share' && !did.spin;
      const c = cheer; cheer = '';
      h += `${dots}${c ? `<p class="pt-cheer">&#10003; ${c}</p>` : ''}<p class="pt-k">${c ? 'NEXT: ' : ''}${s.n} OF 4</p><h2${s.small ? ' class="sm"' : ''}>${s.title}</h2>
        ${done ? '<span class="pt-done">&#10003; Done</span>' : ''}
        ${s.body()}
        <p class="pt-line">${s.line}</p>
        ${done ? '' : needSpin ? `<button type="button" class="pt-go" data-pt-go="spin">Make a Spin first</button>` : `<button type="button" class="pt-go" data-pt-go="${s.k}">${s.go}</button>`}
        ${done ? '' : '<p class="pt-hand">I&rsquo;ll point at every button.</p>'}
        <button type="button" class="${done ? 'pt-go' : 'pt-next'}" data-pt-next>${done ? 'Show me more' : 'Skip this one'}</button>`;
    }
    h += `<label class="pt-off"><input type="checkbox" data-pt-off${get(OFF) === '1' ? ' checked' : ''}> Don&rsquo;t show me this again</label>`;
    el.querySelector('.pt-box').innerHTML = h;
    el.querySelector('.pt-box').scrollTop = 0;
    const old = el.querySelector('.pt-ring'); if (old) old.remove();
    const qb = s.k === 'hello' && document.querySelector('[data-tour]');
    if (qb) { const r = qb.getBoundingClientRect();
      if (r.width > 2 && r.top >= 0 && r.bottom < el.querySelector('.pt-box').getBoundingClientRect().top) {
        const g = document.createElement('div'); g.className = 'pt-ring'; g.innerHTML = '?<small>This one</small>';
        g.style.cssText = `left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px`; el.appendChild(g); } }
  }

  async function open(step, say) {
    if (el) return;
    coachStop(); cheer = say || '';
    addCSS(); set(SEEN, '1');
    await loadDid();
    at = Math.max(0, Math.min(STEPS.length - 1, step == null ? (Number(get(AT)) || 0) : step));
    el = document.createElement('div'); el.className = 'pt'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'How the Porch works');
    el.innerHTML = '<div class="pt-box"></div>';
    document.body.appendChild(el);
    const b = window.PorchBack; const z = b ? b.push('tour', shut) : 20060; el.style.zIndex = String(z || 20060);
    el.addEventListener('change', (e) => { if (e.target.matches('[data-pt-off]')) { if (e.target.checked) set(OFF, '1'); else { try { localStorage.removeItem(OFF); } catch (_) {} } } });
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-pt-x]')) { if (STEPS[at].k === 'more') set(AT, '0'); else set(AT, String(at)); return close(); }
      if (e.target.closest('[data-pt-next]')) { at = Math.min(STEPS.length - 1, at + 1); set(AT, String(at)); return draw(); }
      const g = e.target.closest('[data-pt-go]');
      if (g) { const k = g.getAttribute('data-pt-go'); set(AT, String(stepOf(k))); close(); setTimeout(() => coach(k), 350); return; }
      const m = e.target.closest('[data-pt-more]');
      if (m) { const k = m.getAttribute('data-pt-more'); set(AT, '0'); close(); setTimeout(() => { try { P().goTo(k); } catch (_) {} }, 120); }
    });
    draw();
  }

  /* THE STRIP above the feed: "Getting started · 1 of 3 done". Gone once all three are
     done, or when they tap its X. */
  async function paintStrip() {
    const feed = document.getElementById('feed'); if (!feed || !feed.parentNode) return;
    let s = document.getElementById('pt-strip');
    const p = P();
    if (!p || !p.me || !p.me.uid || get(HIDE) === '1' || !get(SEEN)) { if (s) s.remove(); return; }
    addCSS(); await loadDid();
    const n = doneCount();
    if (n >= 3) { if (s) s.remove(); return; }
    if (!s) { s = document.createElement('div'); s.id = 'pt-strip'; s.className = 'pt-strip'; s.setAttribute('role', 'button'); s.tabIndex = 0; feed.parentNode.insertBefore(s, feed); }
    const next = !did.profile ? 'Add your picture' : !did.post ? 'Say something' : 'Make a Spin';
    s.innerHTML = `<span>Getting started<small>${n} of 3 done &middot; next: ${next}</small></span><span class="go">Show me &rsaquo;</span><button type="button" class="x" data-pt-hide aria-label="Hide this">&#10005;</button>`;
    s.onclick = (e) => {
      if (e.target.closest('[data-pt-hide]')) { set(HIDE, '1'); s.remove(); return; }
      open(!did.profile ? 1 : !did.post ? 2 : 3);
    };
  }

  /* A NEW COIN OR A SURVIVAL PILE CARD GOES FIRST (2 Oct 2026, Mike: "a coin or one of
     those survival pile things popped up. I closed it. It closed the tutorial"). Those
     reveals close themselves with the phone's back button, and back also shuts whatever
     Porch layer is on top, which was the tour. So the tour waits its turn: nothing of
     theirs on screen, twice in a row, before it comes up. */
  /* ONE THING AT A TIME (3 Oct 2026, Mike): the welcome deck, a new coin and a pile card all come
     before this, and none of them come until the sign-up walk is over (rm_walk_hold). */
  const walkHeld = () => { try { const h = Number(localStorage.getItem('rm_walk_hold')) || 0; return !!h && Date.now() - h < 30 * 60 * 1000; } catch (_) { return false; } };
  const revealUp = () => !!document.querySelector('.rm-coin-reveal, .rm-pr, .rm-welcome') || !!window.__rmWelcomePending || (window.__rmRevealSoon || 0) > Date.now() || walkHeld();
  function whenClear(fn, tries) {
    let clear = 0, n = 0;
    const tick = () => {
      if (revealUp() || document.querySelector('.layer.open, .spn, .lpm')) clear = 0; else clear++;
      if (clear >= 2) return fn();
      if (++n < (tries || 180)) setTimeout(tick, 700);
    };
    setTimeout(tick, 1800);
  }

  /* ================================================================ THE COACH
     One gold ring and one short line, on the real screen, on the button to tap next.
     Every 300ms it looks at what is on screen and picks the first line that fits, so
     there is no wrong order to do things in. It never covers or eats a tap. */
  const seen = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? e : null; };
  const q = (sel) => { const all = document.querySelectorAll(sel); for (let i = 0; i < all.length; i++) if (seen(all[i])) return all[i]; return null; };
  const HIDE_IT = { hide: true };
  const otherLayer = (ids) => { const l = document.querySelectorAll('.layer.open'); for (let i = 0; i < l.length; i++) if (ids.indexOf(l[i].id) < 0) return true; return false; };
  const mine = () => (P().me.member || {});
  const GUIDES = {
    profile: {
      start: () => P().setup(),
      look: (c) => {
        if (q('.crop')) return { at: q('.crop-go'), say: 'Slide it where you want it. Then tap <b>Use this</b>.' };
        if (q('#photosrc.open')) return { at: q('#photosrc .psrc'), say: 'Take one now, or choose one from your phone.' };
        if (q('#setup.open')) {
          c.was = true;
          const go = q('#setup [data-su-go]'), av = q('#setup [data-su-av]');
          if (av) {
            const st = document.getElementById('sustatus');
            if (st && /Checking/.test(st.textContent)) return { at: av, say: 'Checking your picture&hellip;' };
            if (!mine().avatar_path) return { at: av, say: 'Tap the circle. Pick a picture. It doesn&rsquo;t have to be your face.' };
            const bio = document.getElementById('subio');
            if (bio && !bio.value.trim()) return { at: bio, say: 'Looking good. Type a line about you. Or skip it and tap <b>Next</b>.' };
            return { at: go, say: 'Now tap <b>Next</b>.' };
          }
          if (q('#setup .vis')) return { at: go, say: 'Pick who can see your profile. Then tap <b>Next</b>.' };
          return { at: go, say: 'Add a friend if you see one. Then tap <b>Show my profile</b>.' };
        }
        if (c.was && q('#profile.open')) return { fin: mine().avatar_path ? 'That&rsquo;s your profile. Looking good.' : 'That&rsquo;s your profile. Add a picture any time.' };
        return null;
      }
    },
    post: {
      start: async () => { const t = document.getElementById('toast'); if (t) t.textContent = ''; await home(); },
      look: (c) => {
        if (q('#compose.open')) {
          c.was = true; c.asked = false;
          const body = document.getElementById('cbody'), send = document.getElementById('csend');
          if (!body.value.trim()) return { at: body, say: 'Type anything. Even just &ldquo;Hi, I&rsquo;m new here.&rdquo;' };
          if (/ing/.test(send.textContent)) return { at: send, say: 'Sharing&hellip;' };
          return { at: send, say: 'Now tap <b>Share</b>.' };
        }
        if (c.was) {
          const t = document.getElementById('toast');
          if (c.posted || (t && /^Shared/.test(t.textContent))) return { fin: 'You&rsquo;re on the Porch. Nice.' };
          if (!c.asked) { c.asked = true; newest('porch_posts').then((id) => { if (id && id !== c.before) c.posted = true; }); }
        }
        if (document.querySelector('#dial.open')) return { at: q('#dial [data-go="say"]'), say: 'Tap <b>Say something</b>.' };
        if (otherLayer([])) return HIDE_IT;
        return { at: q('#dfab'), say: 'Tap the gold <b>+</b>.' };
      },
      before: () => newest('porch_posts')
    },
    spin: {
      start: () => home(),
      look: (c) => {
        const pill = q('.sp-pill');
        if (pill) {
          if (/live/i.test(pill.textContent)) return { fin: 'Your Spin is up!' };
          if (/😕/.test(pill.textContent)) return { at: q('#dfab'), say: 'That one didn&rsquo;t work. Tap the gold <b>+</b> and try another.' };
          return { at: pill, say: 'It&rsquo;s uploading. Keep this page open.' };
        }
        if (q('.spn')) {
          const post = q('.spn .spn-go[type="submit"]'), bk = q('.spn [data-spn-maker]');
          if (post) return post.disabled ? HIDE_IT : { at: post, say: 'Add a few words if you want. Then tap <b>Post Spin</b>.' };
          if (bk) return { at: bk, say: 'Too long. Tap <b>Back to the maker</b> and use a shorter one.' };
          return HIDE_IT;
        }
        if (q('.lpc')) return { at: q('.lpc [data-cam-go]'), say: 'Tap the big button to record. Tap it again to stop.' };
        if (q('.lpm.lpm-blank')) return { at: q('.lpm .lpm-doors'), say: '<b>Record</b> uses your camera. <b>Upload</b> uses a video from your phone.' };
        if (q('.lpm')) { const go = q('.lpm .lpm-go'); return go && !go.disabled ? { at: go, say: 'Add words or music if you want. Then tap <b>Make my Spin</b>.' } : HIDE_IT; }
        if (document.querySelector('#dial.open')) return { at: q('#dial [data-go="spin"]'), say: 'Tap <b>Give it a spin</b>.' };
        if (otherLayer([])) return HIDE_IT;
        return { at: q('#dfab'), say: 'Tap the gold <b>+</b>.' };
      }
    },
    share: {
      start: async () => { await home(); const id = await newest('porch_spins', '&status=eq.ready'); if (id && window.PorchSpins) window.PorchSpins.openById(id); },
      look: (c) => {
        const sh = q('.sp-sheet.open');
        if (sh) {
          c.was = true;
          const v = q('.sp-sheet.open [data-sh="video"]'); if (!v) return HIDE_IT;
          if (v.disabled) return { at: v, say: 'Getting your video ready&hellip;' };
          if (v.classList.contains('ready')) return { at: v, say: 'It&rsquo;s ready. Tap it one more time.' };
          return { at: v, say: 'Tap <b>Share this video</b>.' };
        }
        if (c.tapAt && Date.now() - c.tapAt < 1500) return { fin: 'Now pick YouTube, Facebook or TikTok from your phone&rsquo;s list.', next: 'more', hold: 4200 };
        if (q('.sp')) { c.was = true; return { at: q('.sp [data-sp-share]'), say: 'Tap <b>Share</b>.' }; }
        return c.was ? null : HIDE_IT;
      },
      /* the sheet shutting right after a tap on "Share this video" = the phone's own share list is up */
      tap: (c, e) => { const v = e.target.closest && e.target.closest('[data-sh="video"]'); if (v && !v.disabled) c.tapAt = Date.now(); }
    }
  };
  /* their newest share or Spin, to tell when a new one lands */
  async function newest(table, more) {
    try { const p = P(); const r = await p.rest(table + '?user_id=eq.' + p.me.uid + (more || '') + '&select=id&order=created_at.desc&limit=1'); return (r[0] && r[0].id) || ''; } catch (_) { return ''; }
  }

  /* back to the feed first, so the gold + is right there */
  async function home() { try { await P().closeAll(); window.scrollTo(0, 0); } catch (_) {} }

  let co = null;
  function coachStop() {
    if (!co) return;
    clearInterval(co.tmr); document.removeEventListener('click', co.onTap, true); window.removeEventListener('scroll', co.onMove, true);
    if (co.ring) co.ring.remove(); if (co.bub) co.bub.remove(); co = null;
  }
  function paint(c, at, say, ok) {
    if (!c.bub) {
      c.ring = document.createElement('div'); c.ring.className = 'co-ring';
      c.bub = document.createElement('div'); c.bub.className = 'co-bub'; c.bub.setAttribute('role', 'status');
      c.bub.innerHTML = '<p></p><button type="button" aria-label="Stop showing me">&#10005;</button>';
      c.bub.querySelector('button').addEventListener('click', () => { coachStop(); try { P().toast('OK. Tap the ? up top to pick this back up.'); } catch (_) {} paintStrip(); });
      document.body.appendChild(c.ring); document.body.appendChild(c.bub);
    }
    if (say == null) { c.ring.style.display = 'none'; c.bub.style.display = 'none'; c.key = ''; return; }
    const vv = window.visualViewport, vh = vv ? vv.height : window.innerHeight, vw = window.innerWidth;
    let r = at ? at.getBoundingClientRect() : null;
    /* off the screen? bring it to them, once */
    if (r && (r.bottom > vh - 4 || r.top < 4) && c.scrolled !== say) { c.scrolled = say; try { at.scrollIntoView({ block: 'center' }); } catch (_) {} r = at.getBoundingClientRect(); }
    if (r && (r.top > vh || r.bottom < 0)) r = null;
    const key = say + '|' + (r ? [r.left, r.top, r.width, r.height].map(Math.round).join(',') : '') + '|' + Math.round(vh);
    if (key === c.key) return; c.key = key;
    c.bub.className = 'co-bub' + (ok ? ' ok' : ''); c.bub.querySelector('p').innerHTML = say;
    c.bub.style.display = ''; c.bub.style.width = Math.min(310, vw - 24) + 'px';
    const w = c.bub.offsetWidth, h = c.bub.offsetHeight;
    if (!r) {
      c.ring.style.display = 'none'; c.bub.classList.add('none');
      c.bub.style.left = (vw - w) / 2 + 'px'; c.bub.style.top = Math.max(12, vh * 0.42 - h / 2) + 'px'; return;
    }
    const round = Math.abs(r.width - r.height) < 6 && r.width < 110;
    c.ring.style.cssText = `display:block;left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px;border-radius:${round ? '50%' : '18px'}`;
    const cx = r.left + r.width / 2, left = Math.max(12, Math.min(vw - 12 - w, cx - w / 2));
    const below = r.top + r.height / 2 < vh / 2;
    c.bub.classList.add(below ? 'up' : 'down');
    c.bub.style.left = left + 'px';
    c.bub.style.top = (below ? Math.min(vh - h - 8, r.bottom + 20) : Math.max(8, r.top - 20 - h)) + 'px';
    c.bub.style.setProperty('--ax', Math.max(22, Math.min(w - 22, cx - left)) + 'px');
  }
  async function coach(k) {
    const g = GUIDES[k]; if (!g) return;
    coachStop(); addCSS();
    const c = co = { k, lost: 0 };
    if (g.before) c.before = await g.before();
    if (co !== c) return;
    try { await g.start(); } catch (_) {}
    if (co !== c) return;
    c.onTap = (e) => { if (g.tap) g.tap(c, e); setTimeout(tick, 60); };
    c.onMove = () => { if (!c.raf) c.raf = requestAnimationFrame(() => { c.raf = 0; c.key = ''; tick(); }); };
    document.addEventListener('click', c.onTap, true); window.addEventListener('scroll', c.onMove, true);
    function tick() {
      if (co !== c || c.done) return;
      if (revealUp()) return paint(c, null, null);            /* a coin or a pile card goes first */
      let s = null;
      const ok = seen(document.getElementById('rulesok'));
      if (ok) s = { at: ok, say: 'The house rules. Give them a read, then tap <b>I&rsquo;m in</b>.' };
      else { try { s = g.look(c); } catch (_) {} if (!s && document.querySelector('.layer.open')) s = HIDE_IT; }
      if (s && s.fin) {
        c.done = true; clearInterval(c.tmr);
        paint(c, null, '&#10003; ' + s.fin, true);
        const nxt = s.next ? stepOf(s.next) : stepOf(k) + 1;
        /* the tour comes back for the next thing, after any coin that just popped */
        let clear = 0; const wait = () => { if (co !== c) return; if (revealUp()) clear = 0; else clear++; if (clear >= 2) { set(AT, String(nxt)); coachStop(); open(nxt, s.next ? '' : s.fin); } else setTimeout(wait, 600); };
        setTimeout(wait, s.hold || 1500); return;
      }
      if (!s) { if (++c.lost > 5) { coachStop(); open(stepOf(k)); } return paint(c, null, null); }   /* they backed out: same step again */
      c.lost = 0;
      if (s.hide) return paint(c, null, null);
      paint(c, s.at, s.say);
    }
    c.tmr = setInterval(tick, 300); setTimeout(tick, 250);
  }

  /* every visit to the Porch signed in, until they tick "Don't show me this again" */
  function maybe() {
    const p = P(); if (!p || !p.me || !p.me.uid) return;
    paintStrip();
    if (get(OFF) !== '1') whenClear(() => { if (!el && !co) open(0); });
  }

  window.PorchTour = { open, maybe, coach, coaching: () => !!co, fresh: () => get(OFF) !== '1', refresh: paintStrip };
})();

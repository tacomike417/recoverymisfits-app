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
 * It comes up by itself the first time somebody lands on the Porch signed in. After that a
 * small "Getting started" strip sits above the feed until the three things are done or
 * they close it, and "How the Porch works" stays in the account menu for good.
 *
 * The pictures are in /feed/tour/. They are real screenshots; if a screen changes a lot,
 * retake them.
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
      line: 'Tap the circle. Pick a picture. Add a line about you.',
      go: 'Set up my profile', act: () => P().setup() },
    { k: 'post', n: 2, title: 'Say something',
      body: () => pic('2-post.webp', 'The gold plus button open, with Say something ringed'),
      line: 'Tap the gold + at the bottom. Pick one.',
      go: 'Try it now', act: () => P().compose() },
    { k: 'spin', n: 3, title: 'Make a Spin',
      body: () => pic('3-spin.webp', 'The Spin maker with Record and Upload'),
      line: 'A short video. Record one, or upload one from your phone.',
      go: 'Make a Spin', act: () => { if (window.PorchSpins) window.PorchSpins.start(); } },
    { k: 'share', n: 4, title: 'Put your Spin on YouTube',
      body: () => `<div class="pt-two">
          <figure>${pic('4a-share.webp', 'A Spin with the share arrow ringed')}<figcaption><b>1</b> Open your Spin. Tap the arrow.</figcaption></figure>
          <figure>${pic('4b-video.webp', 'The share choices with Share this video ringed')}<figcaption><b>2</b> Tap <i>Share this video</i>.</figcaption></figure>
        </div>`,
      line: '<b>3</b> Pick YouTube. Same for Instagram, TikTok and Facebook.' },
    { k: 'more' }
  ];

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
.pt-skip{display:inline-block;margin-top:10px;padding:10px 14px;border:0;background:none;color:#a99d82;font:700 14px Arial,sans-serif;cursor:pointer}
.pt-more{display:grid;gap:8px;margin:4px 0 14px;text-align:left}
.pt-more button{display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(224,189,106,.25);background:rgba(255,255,255,.03);color:#f1e7cf;cursor:pointer;font:800 16px Arial,sans-serif;text-align:left}
.pt-more small{display:block;margin-top:2px;font:500 13.5px/1.3 Arial,sans-serif;color:#b9ad92}
.pt-more i{margin-left:auto;font-style:normal;color:#e0bd6a;font-size:20px}
.pt-strip{display:flex;align-items:center;gap:10px;width:calc(100% - 20px);margin:8px 10px 4px;padding:11px 12px 11px 14px;border-radius:14px;border:1px solid rgba(224,189,106,.4);background:linear-gradient(135deg,rgba(224,189,106,.16),rgba(224,189,106,.05));color:#f1e7cf;text-align:left;cursor:pointer;font:800 15px Arial,sans-serif}
.pt-strip small{display:block;margin-top:1px;font:600 13px Arial,sans-serif;color:#cfc4a8}
.pt-strip .go{margin-left:auto;color:#e0bd6a;white-space:nowrap}
.pt-strip .x{flex:none;width:34px;height:34px;margin:-4px -4px -4px 0;border:0;border-radius:50%;background:none;color:#a99d82;font-size:18px;cursor:pointer}`;
  function addCSS() { if (document.getElementById('pt-css')) return; const s = document.createElement('style'); s.id = 'pt-css'; s.textContent = CSS; document.head.appendChild(s); }

  let el = null, at = 0;
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
        <p class="pt-sub">${did.profile ? 'Want a quick look at how things work here?' : 'You haven&rsquo;t set up your profile yet. Let&rsquo;s fix that and show you around.'}<br>Four quick things. About a minute.</p>
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
      h += `${dots}<p class="pt-k">${s.n} OF 4</p><h2>${s.title}</h2>
        ${done ? '<span class="pt-done">&#10003; You did this one</span>' : ''}
        ${s.body()}
        <p class="pt-line">${s.line}</p>
        ${s.go ? `<button type="button" class="pt-go" data-pt-go>${done ? 'Do it again' : s.go}</button>` : ''}
        <button type="button" class="${s.go ? 'pt-next' : 'pt-go'}" data-pt-next>${at === last - 1 ? 'Got it' : 'Next'}</button>`;
    }
    el.querySelector('.pt-box').innerHTML = h;
    el.querySelector('.pt-box').scrollTop = 0;
  }

  async function open(step) {
    if (el) return;
    addCSS(); set(SEEN, '1');
    await loadDid();
    at = Math.max(0, Math.min(STEPS.length - 1, step == null ? (Number(get(AT)) || 0) : step));
    el = document.createElement('div'); el.className = 'pt'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'How the Porch works');
    el.innerHTML = '<div class="pt-box"></div>';
    document.body.appendChild(el);
    const b = window.PorchBack; const z = b ? b.push('tour', shut) : 20060; el.style.zIndex = String(z || 20060);
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-pt-x]')) { if (STEPS[at].k === 'more') set(AT, '0'); else set(AT, String(at)); return close(); }
      if (e.target.closest('[data-pt-next]')) { at = Math.min(STEPS.length - 1, at + 1); set(AT, String(at)); return draw(); }
      if (e.target.closest('[data-pt-go]')) {
        const s = STEPS[at]; set(AT, String(Math.min(STEPS.length - 1, at + 1)));     /* pick up at the next one when they come back */
        close(); setTimeout(() => { try { s.act(); } catch (_) {} }, 120); return;
      }
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

  /* the first time on the Porch signed in: the tour comes up by itself */
  function maybe() {
    const p = P(); if (!p || !p.me || !p.me.uid) return;
    if (!get(SEEN)) { setTimeout(() => { if (!document.querySelector('.layer.open, .spn, .lpm')) open(0); else { set(SEEN, '1'); paintStrip(); } }, 900); return; }
    paintStrip();
  }

  window.PorchTour = { open, maybe, fresh: () => !get(SEEN), refresh: paintStrip };
})();

/* PORCH ALERTS, EVERYWHERE IN THE APP (1 Oct 2026, Mike: "if they work on their phones
   great, but i need them to work site wide, new messages, comments, replies, tags").
 *
 * nav.js loads this on every page except the Porch itself (which has its own bell),
 * and only on a phone that has already been on the Porch (rm_porch_ok), so nobody
 * else pays for it and nothing shows before somebody can use the Porch.
 *
 *  - a red number on the bottom bar's Porch tab: new notifications + unread messages
 *  - when something new comes in, a paper card slides down from the top saying
 *    exactly what happened ("grateful_gina tagged you in a comment", "krazyk226
 *    messaged you: hey!"), and tapping it goes straight to it on the Porch, like
 *    Facebook. It goes away on its own, or swipe it up.
 * Checks when the page opens, every 45 seconds while it's on screen, and whenever
 * the app comes back to the front. Nothing is stored except which alert was last shown.
 */
(function () {
  'use strict';
  if (window.RMPorchAlerts) return;
  window.RMPorchAlerts = true;
  if (/\/feed\/(porch|soon)\.html/.test(location.pathname)) return;

  const DB = 'https://rlytvfehbglsjfvprtbp.supabase.co';
  const KEY = 'sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P';
  const SEEN = 'rm_alert_seen';
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const pic = (p) => (String(p).charAt(0) === '/' ? p : `${DB}/storage/v1/object/public/porch/${p}`);
  const WORDS = {
    comment: 'commented on your share', reply: 'replied to your comment', proud: 'loved your share',
    metoo: 'said Me too', follow: 'started following you', friend_request: 'sent you a friend request',
    friend_accept: 'accepted your friend request', respin: 'respun your Spin', comment_love: 'loved your comment',
    report: 'was reported. Take a look.',
  };

  function loadAccount() {
    if (window.RMAccount) return Promise.resolve(true);
    return new Promise((ok) => {
      const s = document.createElement('script'); s.src = '/assets/account.js';
      s.onload = () => ok(!!window.RMAccount); s.onerror = () => ok(false);
      document.head.appendChild(s);
    });
  }
  async function token() {
    if (!(await loadAccount())) return null;
    const A = window.RMAccount;
    if (!A.signedIn()) return null;
    try { return await A.token(); } catch (_) { return null; }
  }
  async function get(path, t) {
    const r = await fetch(DB + '/rest/v1/' + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + t } });
    if (!r.ok) throw new Error('rest ' + r.status);
    return r.json();
  }

  /* ---- the red number on the Porch tab ---- */
  function paintCount(n) {
    const tab = document.querySelector('#rm-bottom-nav a[href="/feed/porch.html"]');
    if (!tab) return;
    let b = tab.querySelector('.rm-porch-n');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('b'); b.className = 'rm-porch-n'; tab.style.position = 'relative'; tab.appendChild(b); }
    b.textContent = n > 99 ? '99+' : String(n);
    b.setAttribute('aria-label', n + ' new on the Porch');
  }

  /* ---- the paper card ---- */
  function css() {
    if (document.getElementById('rm-alert-css')) return;
    const s = document.createElement('style'); s.id = 'rm-alert-css';
    s.textContent = `
.rm-porch-n{position:absolute;top:2px;right:calc(50% - 22px);min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:9px;background:#e0352b;color:#fff;font:800 11px/18px Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #11110f;pointer-events:none}
.rm-alert{position:fixed;z-index:2147483000;left:10px;right:10px;top:calc(10px + env(safe-area-inset-top,0px));max-width:460px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:#f7f1e3;color:#1b1a17;border:1px solid #d8ceb6;box-shadow:0 14px 40px rgba(0,0,0,.45);text-decoration:none;transform:translateY(-140%);transition:transform .35s cubic-bezier(.2,1.2,.4,1);font:15px/1.35 -apple-system,Segoe UI,Roboto,Arial,sans-serif;touch-action:pan-x}
.rm-alert.on{transform:translateY(0)}
.rm-alert .av{flex:none;width:44px;height:44px;border-radius:50%;overflow:hidden;display:grid;place-items:center;color:#fff;font:800 16px Arial,sans-serif;background:#8a6bb8}
.rm-alert .av img{width:100%;height:100%;object-fit:cover;display:block}
.rm-alert .tx{flex:1;min-width:0}
.rm-alert .tx span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rm-alert .tx small{display:block;margin-top:2px;color:#9c7428;font:800 12px Arial,sans-serif}
.rm-alert .k{position:absolute;left:44px;top:42px;width:22px;height:22px;border-radius:50%;border:2px solid #f7f1e3;display:grid;place-items:center;color:#fff;font:900 11px Arial,sans-serif}
@media (prefers-reduced-motion:reduce){.rm-alert{transition:none}}`;
    document.head.appendChild(s);
  }
  const COLORS = ['#c4563c', '#3f7f8f', '#8a6bb8', '#b98f33', '#4f8f5a', '#b8577c', '#5b6fb8', '#9a7b4f'];
  function initials(h) {
    const parts = String(h).replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s._\-0-9]+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts.length > 1 ? parts[0].charAt(0) + parts[1].charAt(0) : parts[0].slice(0, 2)).toUpperCase();
  }
  function avatar(m) {
    const h = (m && m.handle) || '?'; let n = 0;
    for (let i = 0; i < h.length; i++) n = (n * 31 + h.charCodeAt(i)) >>> 0;
    return `<span class="av" style="background:${COLORS[n % COLORS.length]}">${m && m.avatar_path ? `<img src="${esc(pic(m.avatar_path))}" alt="">` : esc(initials(h))}</span>`;
  }
  const KCOLOR = { comment: '#2d88ff', reply: '#2d88ff', proud: '#e52e71', comment_love: '#e52e71', mention: '#8a3ffc', dm: '#0a84ff',
    follow: '#31a24c', friend_request: '#31a24c', friend_accept: '#31a24c', respin: '#c9922b', metoo: '#c9922b', report: '#c4563c' };
  let shown = null;
  function show(item) {
    css();
    if (shown) { shown.remove(); shown = null; }
    const a = document.createElement('a'); a.className = 'rm-alert'; a.href = item.url; a.setAttribute('role', 'alert');
    a.innerHTML = `${avatar(item.who)}<i class="k" style="background:${KCOLOR[item.kind] || '#9c7428'}" aria-hidden="true">${item.kind === 'dm' ? '✉' : item.kind === 'proud' || item.kind === 'comment_love' ? '♥' : item.kind === 'mention' ? '@' : '•'}</i>
      <span class="tx"><span><b>${esc((item.who && item.who.handle) || 'Somebody')}</b> ${esc(item.text)}</span><small>Tap to see it ›</small></span>`;
    document.body.appendChild(a); shown = a;
    requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add('on')));
    let y0 = null;
    a.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    a.addEventListener('touchmove', (e) => { if (y0 != null && e.touches[0].clientY - y0 < -25) { hide(a); y0 = null; } }, { passive: true });
    setTimeout(() => hide(a), 8000);
  }
  function hide(a) { if (!a || !a.isConnected) return; a.classList.remove('on'); setTimeout(() => { a.remove(); if (shown === a) shown = null; }, 400); }
  function seen() { try { return localStorage.getItem(SEEN) || ''; } catch (_) { return ''; } }
  function markSeen(k) { try { localStorage.setItem(SEEN, k); } catch (_) {} }

  /* where tapping takes you: the same links the phone alerts use */
  function urlFor(n) {
    const q = new URLSearchParams();
    if (n.post_id) { q.set('s', n.post_id); if (n.comment_id) q.set('c', n.comment_id); q.set('k', n.kind); q.set('a', n.actor_id); }
    else if (n.kind === 'report') q.set('mod', '1');
    else if (n.kind === 'friend_request' || n.kind === 'friend_accept' || n.kind === 'follow') q.set('who', n.actor_id);
    else q.set('notes', '1');
    return '/feed/porch.html?' + q.toString();
  }

  let busy = false;
  async function check() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const t = await token(); if (!t) return;
      const uid = window.RMAccount.uid();
      const [notes, threads] = await Promise.all([
        get('porch_notes?user_id=eq.' + uid + '&read_at=is.null&select=id,kind,actor_id,post_id,comment_id,created_at&order=created_at.desc&limit=30', t).catch(() => []),
        get('porch_threads?or=(a.eq.' + uid + ',b.eq.' + uid + ')&select=*&order=last_at.desc&limit=20', t).catch(() => []),
      ]);
      const mine = (th) => (th.a === uid ? th.a_read_at : th.b_read_at);
      const unreadDms = threads.filter((th) => th.last_from && th.last_from !== uid && (!mine(th) || th.last_at > mine(th)));
      paintCount(notes.length + unreadDms.length);

      /* the newest thing that happened, note or message */
      const n0 = notes[0], d0 = unreadDms[0];
      const useDm = d0 && (!n0 || d0.last_at > n0.created_at);
      const key = useDm ? 'd:' + d0.id + ':' + d0.last_at : n0 ? 'n:' + n0.id : '';
      if (!key) return;
      const last = seen();
      const when = new Date(useDm ? d0.last_at : n0.created_at).getTime();
      markSeen(key);
      if (key === last) return;
      if (!last && Date.now() - when > 10 * 60 * 1000) return;   /* first time on this phone: no alert for old news */
      if (Date.now() - when > 24 * 3600 * 1000) return;

      const actor = useDm ? (d0.a === uid ? d0.b : d0.a) : n0.actor_id;
      const who = (await get('porch_members?user_id=eq.' + actor + '&select=handle,avatar_path', t).catch(() => []))[0] || null;
      if (useDm) {
        let pv = String(d0.last_preview || '').trim();
        if (/recoverymisfits\.org\/(s\/|feed\/porch\.html\?spin=)/i.test(pv)) pv = 'sent you a Spin';
        else if (/recoverymisfits\.org\/feed\/porch\.html\?s=/i.test(pv)) pv = 'sent you a share';
        else pv = 'messaged you' + (pv ? ': ' + (pv.length > 80 ? pv.slice(0, 80) + '…' : pv) : '');
        show({ kind: 'dm', who, text: pv, url: '/feed/porch.html?dm=' + actor });
      } else {
        let spin = false;
        if (n0.post_id) { try { spin = ((await get('porch_posts?id=eq.' + n0.post_id + '&select=need', t))[0] || {}).need === 'moment'; } catch (_) {} }
        let text = n0.kind === 'mention'
          ? (n0.comment_id ? (spin ? 'tagged you in a comment on a Spin' : 'tagged you in a comment') : (spin ? 'tagged you in a Spin' : 'tagged you in a share'))
          : (WORDS[n0.kind] || 'did something on the Porch');
        if (spin) text = text.replace('your share', 'your Spin');
        if (n0.comment_id && n0.kind !== 'comment_love') {
          try { const c = (await get('porch_comments?id=eq.' + n0.comment_id + '&select=body', t))[0]; if (c && c.body) text += ': “' + (c.body.length > 80 ? c.body.slice(0, 80) + '…' : c.body) + '”'; } catch (_) {}
        }
        show({ kind: n0.kind, who, text, url: urlFor(n0) });
      }
    } catch (_) { /* no signal: try again next time */ } finally { busy = false; }
  }

  setTimeout(check, 1500);
  setInterval(check, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();

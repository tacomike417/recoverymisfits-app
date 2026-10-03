/* SPIN LINKS: recoverymisfits.org/s/<id> (1 Oct 2026, Mike: "lets do all the viral stuff").
 *
 * A Cloudflare Pages Function. It runs on Cloudflare for every /s/... link, so a
 * shared Spin:
 *   - shows its picture, who made it and the caption in a text, Messenger or
 *     Facebook preview (the og: tags below), not a bare link
 *   - PLAYS for anybody, member or not, with one button under it:
 *       has an account here  -> "More Spins on the Porch"
 *       new here             -> "Join free" (same words as the Porch's own door, 3 Oct 2026)
 * Phone first, at 393. No back button on screen: the phone's own back works.
 * What it can read about a Spin comes from porch_spin_card() (SQL step 16), which
 * only hands over ready, unexpired, not-taken-down Spins.
 */
const DB = 'https://rlytvfehbglsjfvprtbp.supabase.co';
const KEY = 'sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P';   // the public key the app already ships
const CDN = 'https://vz-e533a6c3-9fe.b-cdn.net';

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function srcFor(s) {
  const have = String(s.resolutions || '').match(/\d+/g);
  let r = 480;
  if (have && have.length) { const ok = have.map(Number).filter((n) => n <= 720).sort((a, b) => b - a); if (ok.length) r = ok[0]; }
  return `${CDN}/${s.video_guid}/play_${r}p.mp4`;
}

async function card(id) {
  try {
    const r = await fetch(DB + '/rest/v1/rpc/porch_spin_card', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: id }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && (j.video_guid || j.locked) ? j : null;
  } catch (_) { return null; }
}

export async function onRequestGet({ params, request }) {
  const id = String(params.id || '').toLowerCase();
  const url = new URL(request.url);
  const c = /^[0-9a-f-]{36}$/.test(id) ? await card(id) : null;
  /* MEMBERS ONLY (1 Oct 2026): the maker's profile is Members only, so nothing about
     the Spin is handed out; signed-in members get a button into the Porch */
  const html = c && c.locked ? locked(id, url.origin) : page(c, id, url.origin);
  const s = c;
  return new Response(html, {
    status: s ? 200 : 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': s ? 'public, max-age=60' : 'no-store' },
  });
}

function locked(id, origin) {
  const porch = '/feed/porch.html?spin=' + encodeURIComponent(id);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>A Sober Spin · Recovery Misfits</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#11110f">
<link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="manifest" href="/manifest.json">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:title" content="A Sober Spin on Recovery Misfits">
<meta property="og:description" content="Shared on the Porch. Members only.">
<meta property="og:image" content="${origin}/icon-512.png">
<meta name="twitter:card" content="summary">
${LOCK_CSS}
</head><body><div class="gone">
  <img src="/icon-192.png" alt="" style="width:76px;height:76px;border-radius:18px;margin-bottom:18px">
  <h1>For members</h1>
  <p>This Spin is only for people signed in to Recovery Misfits.</p>
  <a class="go" id="go" href="/account.html?next=feed">Join free</a>
  <a class="alt" id="alt" href="/account.html?signin=1">I have an account</a>
</div>
<script>
try { var a = JSON.parse(localStorage.getItem('rm_account_v1') || 'null');
  if (a && a.name) { var g = document.getElementById('go'); g.href = ${JSON.stringify(porch)}; g.textContent = 'Watch it on the Porch'; document.getElementById('alt').hidden = true; } } catch (e) {}
</script></body></html>`;
}
const LOCK_CSS = `<style>
@font-face{font-family:"RM Head";src:url("/assets/fonts/anton-400.woff2") format("woff2");font-display:swap}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#11110f;color:#f1e7cf;font-family:Arial,sans-serif}
.gone{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;text-align:center}
.gone h1{margin:0 0 10px;font:400 34px/1.05 "RM Head",Impact,sans-serif;text-transform:uppercase}
.gone p{margin:0 0 4px;font:600 16px/1.4 Arial,sans-serif;color:#ddd2b8;max-width:320px}
.go{display:block;width:100%;max-width:340px;margin:18px 0 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#11110f;text-decoration:none;font:400 21px/1 "RM Head",Impact,sans-serif;letter-spacing:.03em;text-transform:uppercase}
.alt{margin-top:14px;color:#ddd2b8;font:700 14px Arial,sans-serif}
[hidden]{display:none!important}
</style>`;

function page(s, id, origin) {
  const handle = s ? s.handle : '';
  const title = s ? `@${handle} on Recovery Misfits` : 'Recovery Misfits';
  const cap = s && s.caption ? String(s.caption).replace(/\s+/g, ' ').trim() : '';
  const desc = cap ? (cap.length > 150 ? cap.slice(0, 147) + '…' : cap) : 'A Sober Spin from the Recovery Misfits Porch. Good company between meetings.';
  const thumb = s ? `${CDN}/${s.video_guid}/thumbnail.jpg` : origin + '/icon-512.png';
  const link = origin + '/s/' + id;
  const porch = '/feed/porch.html?spin=' + encodeURIComponent(id);
  const music = s && s.music && s.music.name ? `${s.music.name}${s.music.by ? ' · ' + s.music.by : ''}` : '';
  const tall = s && s.width && s.height ? s.height / s.width > 1.5 : true;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#11110f">
<meta name="robots" content="noindex, follow">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="manifest" href="/manifest.json">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:type" content="${s ? 'video.other' : 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(link)}">
<meta property="og:image" content="${esc(thumb)}">
<meta property="og:image:alt" content="${esc(s ? 'Sober Spin by @' + handle : 'Recovery Misfits')}">
${s ? `<meta property="og:video" content="${esc(srcFor(s))}">
<meta property="og:video:secure_url" content="${esc(srcFor(s))}">
<meta property="og:video:type" content="video/mp4">
${s.width && s.height ? `<meta property="og:video:width" content="${s.width}"><meta property="og:video:height" content="${s.height}">` : ''}` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(thumb)}">
<style>
@font-face{font-family:"RM Head";src:url("/assets/fonts/anton-400.woff2") format("woff2");font-display:swap}
@font-face{font-family:"RM Rail";src:url("/assets/fonts/oswald-500.woff2") format("woff2");font-weight:500;font-display:swap}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#000;color:#fff;font-family:Arial,sans-serif}
body{overflow:hidden}
.v{position:fixed;inset:0;display:grid;place-items:center;background:#000}
.bg{position:absolute;inset:-30px;background:center/cover no-repeat;filter:blur(26px) brightness(.45);transform:scale(1.1)}
video{position:relative;width:100%;height:100%;object-fit:${tall ? 'cover' : 'contain'};background:transparent}
.shade{position:fixed;left:0;right:0;bottom:0;height:62%;background:linear-gradient(to top,rgba(0,0,0,.92),rgba(0,0,0,.55) 45%,rgba(0,0,0,0));pointer-events:none}
.top{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:calc(14px + env(safe-area-inset-top)) 16px 10px;font:500 14px "RM Rail",Oswald,"Arial Narrow",sans-serif;letter-spacing:.16em;color:#e0bd6a;text-shadow:0 1px 6px rgba(0,0,0,.7)}
.top img{width:28px;height:28px;border-radius:8px}
.snd{position:fixed;top:calc(12px + env(safe-area-inset-top));right:14px;padding:8px 13px;border:0;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font:700 13px Arial,sans-serif;cursor:pointer}
.snd[hidden]{display:none}
.foot{position:fixed;left:0;right:0;bottom:0;padding:0 16px calc(18px + env(safe-area-inset-bottom))}
.by{margin:0;font:800 17px Arial,sans-serif;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.cap{margin:6px 0 0;font:600 15px/1.4 Arial,sans-serif;max-height:4.2em;overflow:hidden;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.mus{margin:8px 0 0;font:700 12.5px Arial,sans-serif;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.go{display:block;width:100%;margin:16px 0 0;padding:16px;border:0;border-radius:16px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#11110f;text-align:center;text-decoration:none;font:400 21px/1 "RM Head",Impact,sans-serif;letter-spacing:.03em;text-transform:uppercase;box-shadow:0 8px 26px rgba(224,189,106,.3)}
.sub{margin:9px 0 0;text-align:center;font:600 13px Arial,sans-serif;color:#ddd2b8}
.gone{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;background:#11110f;color:#f1e7cf}
.gone h1{margin:0 0 10px;font:400 34px/1.05 "RM Head",Impact,sans-serif;text-transform:uppercase}
.gone p{margin:0 0 4px;font:600 16px/1.4 Arial,sans-serif;color:#ddd2b8}
.gone .go{max-width:340px}
</style>
</head>
<body>
${s ? `<div class="v"><div class="bg" style="background-image:url('${esc(thumb)}')"></div>
<video src="${esc(srcFor(s))}" poster="${esc(thumb)}" playsinline autoplay muted loop preload="auto"></video></div>
<div class="shade"></div>
<div class="top"><img src="/icon-192.png" alt="">SOBER SPINS</div>
${s.muted ? '' : '<button type="button" class="snd" id="snd">🔇 Tap for sound</button>'}
<div class="foot">
  <p class="by">@${esc(handle)}</p>
  ${cap ? `<p class="cap">${esc(cap)}</p>` : ''}
  ${music ? `<p class="mus">♫ ${esc(music)}</p>` : ''}
  <a class="go" id="go" href="/account.html?next=feed">Join free</a>
  <p class="sub" id="sub">Free. Anonymous. Every path welcome.</p>
</div>` : `<div class="gone">
  <img src="/icon-192.png" alt="" style="width:76px;height:76px;border-radius:18px;margin-bottom:18px">
  <h1>This Spin is gone</h1>
  <p>Spins last 30 days unless they're pinned.</p>
  <a class="go" href="/">Visit Recovery Misfits</a>
</div>`}
<script>
(function () {
  var v = document.querySelector('video'), b = document.getElementById('snd');
  /* already a member here? one tap into the Porch instead of joining */
  try {
    var a = JSON.parse(localStorage.getItem('rm_account_v1') || 'null');
    if (a && a.name) {
      var go = document.getElementById('go'), sub = document.getElementById('sub');
      if (go) { go.href = ${JSON.stringify(porch)}; go.textContent = 'More Spins on the Porch'; }
      if (sub) sub.textContent = 'Good company between meetings.';
    }
  } catch (e) {}
  if (!v) return;
  function sound(on) { v.muted = !on; if (b) b.textContent = on ? '🔊 Sound on' : '🔇 Tap for sound'; v.play().catch(function () {}); }
  if (b) b.addEventListener('click', function (e) { e.stopPropagation(); sound(v.muted); });
  v.addEventListener('click', function () { if (v.paused) v.play().catch(function () {}); else if (b) sound(v.muted); else v.pause(); });
})();
</script>
</body>
</html>`;
}

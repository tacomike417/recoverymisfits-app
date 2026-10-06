/* PROFILE LINKS: recoverymisfits.org/u/<name> (1 Oct 2026, Mike). The short link
 * recoverymisfits.org/<name> (functions/[handle].js) shows this same page.
 *
 * A Cloudflare Pages Function, like the Spin links in functions/s/.
 *   Public profile        -> header, picture, @name, bio and their Spins, plus one
 *                            button (join, or "Open in the app" for members)
 *   Members only / no one -> the SAME "for members" page either way, so a link
 *                            never even confirms that somebody is on the Porch.
 *                            Members get a button that opens it in the app.
 * Mike: "protecting their level of anonymity is paramount." What it can read comes
 * from porch_profile_card() (SQL step 18), which hands over nothing for a
 * members-only profile. Phone first. No back button on screen.
 */
const DB = 'https://rlytvfehbglsjfvprtbp.supabase.co';
const KEY = 'sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P';   // the public key the app already ships
const CDN = 'https://vz-e533a6c3-9fe.b-cdn.net';
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const pic = (p) => (String(p).charAt(0) === '/' ? p : `${DB}/storage/v1/object/public/porch/${p}`);

async function card(h) {
  try {
    const r = await fetch(DB + '/rest/v1/rpc/porch_profile_card', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_handle: h }),
    });
    return r.ok ? await r.json() : null;
  } catch (_) { return null; }
}

export async function onRequestGet({ params, request }) {
  const h = String(params.handle || '').toLowerCase();
  const origin = new URL(request.url).origin;
  const c = /^[a-z0-9._-]{2,32}$/.test(h) ? await card(h) : null;
  const pub = c && !c.locked && c.handle;
  return new Response(pub ? profile(c, origin) : members(h, origin), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': pub ? 'public, max-age=60' : 'no-store' },
  });
}

const HEAD = (title, desc, img, origin, url) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#11110f">
<link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="manifest" href="/manifest.json">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary">
<style>
@font-face{font-family:"RM Head";src:url("/assets/fonts/anton-400.woff2") format("woff2");font-display:swap}
@font-face{font-family:"RM Rail";src:url("/assets/fonts/oswald-500.woff2") format("woff2");font-weight:500;font-display:swap}
*{box-sizing:border-box}
html,body{margin:0;background:#11110f;color:#f1e7cf;font-family:Arial,sans-serif}
main{max-width:480px;margin:0 auto;padding-bottom:calc(30px + env(safe-area-inset-bottom))}
.cover{height:170px;background:linear-gradient(160deg,#2c2416,#11110f) center/cover}
.av{position:relative;margin:-56px 0 0 16px;width:108px;height:108px;border-radius:50%;padding:4px;background:conic-gradient(from 200deg,#e0bd6a,#c4563c,#e0bd6a)}
.av img,.av span{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #11110f;background:#2a261d}
.av span{display:grid;place-items:center;font:800 36px Arial,sans-serif;color:#e0bd6a}
h1{margin:10px 16px 0;font:400 32px/1.05 "RM Head",Impact,sans-serif;letter-spacing:.02em;word-break:break-all}
.bio{margin:6px 16px 0;color:#ddd2b8;font:600 15px/1.45 Arial,sans-serif;white-space:pre-wrap}
.lab{margin:22px 16px 8px;font:500 13px "RM Rail",Oswald,sans-serif;letter-spacing:.16em;color:#e0bd6a}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin:0 16px}
.grid a{display:block;aspect-ratio:9/16;background:#000 center/cover;border-radius:6px}
.go{display:block;margin:22px 16px 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#11110f;text-align:center;text-decoration:none;font:400 21px/1 "RM Head",Impact,sans-serif;letter-spacing:.03em;text-transform:uppercase}
.sub{margin:9px 16px 0;text-align:center;font:600 13px Arial,sans-serif;color:#ddd2b8}
.alt{display:block;margin:12px 0 0;text-align:center;color:#ddd2b8;font:700 14px Arial,sans-serif}
.gone{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 0;text-align:center}
.gone h1{margin:0 16px 10px;font-size:34px;text-transform:uppercase}
.gone p{margin:0 16px 4px;font:600 16px/1.4 Arial,sans-serif;color:#ddd2b8;max-width:320px}
.gone .go{width:calc(100% - 32px);max-width:340px}
[hidden]{display:none!important}
</style></head><body>`;

const MEMBER_JS = (inApp) => `<script>
try { var a = JSON.parse(localStorage.getItem('rm_account_v1') || 'null');
  if (a && a.name) { var g = document.getElementById('go'); g.href = ${JSON.stringify(inApp)}; g.textContent = 'Open in the app';
    /* signed in here: go straight to this profile in the app (5 Oct 2026). The app shows this same
       address while a profile is open, so a reload has to land back on it, not on this page. */
    try { location.replace(${JSON.stringify(inApp)}); } catch (e2) {}
    var s = document.getElementById('sub'); if (s) s.hidden = true; var t = document.getElementById('alt'); if (t) t.hidden = true; } } catch (e) {}
</script>`;

function profile(c, origin) {
  const url = origin + '/' + c.handle;
  const img = c.avatar_path ? pic(c.avatar_path) : origin + '/icon-512.png';
  const spins = Array.isArray(c.spins) ? c.spins : [];
  return HEAD(`@${c.handle} on Recovery Misfits`, c.bio || 'On the Recovery Misfits Porch. Good people between meetings.', img, origin, url) + `
<main>
  <div class="cover"${c.cover_path ? ` style="background-image:url('${esc(pic(c.cover_path))}')"` : ''}></div>
  <div class="av">${c.avatar_path ? `<img src="${esc(pic(c.avatar_path))}" alt="">` : `<span>${esc(c.handle.slice(0, 2).toUpperCase())}</span>`}</div>
  <h1>@${esc(c.handle)}</h1>
  ${c.bio ? `<p class="bio">${esc(c.bio)}</p>` : ''}
  ${spins.length ? `<div class="lab">SOBER SPINS</div><div class="grid">${spins.map((s) => `<a href="/s/${esc(s.id)}" style="background-image:url('${CDN}/${esc(s.video_guid)}/thumbnail.jpg')" aria-label="Watch a Spin"></a>`).join('')}</div>` : ''}
  <a class="go" id="go" href="/account.html?next=feed">Join free</a>
  <p class="sub" id="sub">Free. Anonymous. Every path welcome.</p>
  <a class="alt" id="alt" href="/account.html?signin=1">I have an account</a>
</main>
${MEMBER_JS('/feed/porch.html?u=' + encodeURIComponent(c.handle))}
</body></html>`;
}

function members(h, origin) {
  return HEAD('A profile on Recovery Misfits', 'On the Recovery Misfits Porch. Members only.', origin + '/icon-512.png', origin, origin + '/' + h) + `
<main class="gone">
  <img src="/icon-192.png" alt="" style="width:76px;height:76px;border-radius:18px;margin-bottom:18px">
  <h1>For members</h1>
  <p>This profile is only for people signed in to Recovery Misfits.</p>
  <a class="go" id="go" href="/account.html?next=feed">Join free</a>
  <a class="alt" id="alt" href="/account.html?signin=1">I have an account</a>
</main>
${MEMBER_JS('/feed/porch.html?u=' + encodeURIComponent(h))}
</body></html>`;
}

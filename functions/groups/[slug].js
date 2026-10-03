/* GROUP ADDRESSES: recoverymisfits.org/groups/<address> (2 Oct 2026, Mike: "I want
 * groups to have their own address set by the user").
 *
 * A Cloudflare Pages Function, like the profile links in functions/u/.
 *   Signed in  -> straight into the group in the app.
 *   Not signed in, group is open -> the group's name and what it's for, and a
 *                                   button to join Recovery Misfits.
 *   No such group / not open     -> a plain "for members" page.
 * It never shows who's in a group or anything shared there. What it can read comes
 * from porch_group_card() (SQL step 26): name, what it's for, who it's for.
 */
const DB = 'https://rlytvfehbglsjfvprtbp.supabase.co';
const KEY = 'sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P';   // the public key the app already ships
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

async function card(slug) {
  try {
    const r = await fetch(DB + '/rest/v1/rpc/porch_group_card', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: slug }),
    });
    return r.ok ? await r.json() : null;
  } catch (_) { return null; }
}

export async function onRequestGet({ params, request }) {
  const slug = String(params.slug || '').toLowerCase();
  const origin = new URL(request.url).origin;
  const ok = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug);
  const g = ok ? await card(slug) : null;
  const title = g ? g.name + ' · a group on Recovery Misfits' : 'A group on Recovery Misfits';
  const desc = g ? (g.about || 'A group on the Recovery Misfits Porch.') : 'On the Recovery Misfits Porch. Members only.';
  const inApp = '/feed/porch.html?' + (ok ? 'g=' + encodeURIComponent(slug) : 'groups=1');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#11110f">
<link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="manifest" href="/manifest.json">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(origin + '/groups/' + slug)}">
<meta property="og:image" content="${esc(origin + '/icon-512.png')}">
<meta name="twitter:card" content="summary">
<script>
/* signed in on this phone: skip this page, go straight to the group */
try { var a = JSON.parse(localStorage.getItem('rm_account_v1') || 'null'); if (a && a.name) location.replace(${JSON.stringify(inApp)}); } catch (e) {}
</script>
<style>
@font-face{font-family:"RM Head";src:url("/assets/fonts/anton-400.woff2") format("woff2");font-display:swap}
@font-face{font-family:"RM Rail";src:url("/assets/fonts/oswald-500.woff2") format("woff2");font-weight:500;font-display:swap}
*{box-sizing:border-box}
html,body{margin:0;background:#11110f;color:#f1e7cf;font-family:Arial,sans-serif}
main{max-width:480px;min-height:100vh;margin:0 auto;padding:24px 16px calc(30px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.ic{width:76px;height:76px;border-radius:18px;margin-bottom:16px}
.k{margin:0 0 8px;font:500 13px "RM Rail",Oswald,sans-serif;letter-spacing:.16em;color:#e0bd6a}
h1{margin:0 0 10px;font:400 34px/1.05 "RM Head",Impact,sans-serif;letter-spacing:.02em;word-break:break-word}
p{margin:0 0 6px;max-width:340px;font:600 16px/1.45 Arial,sans-serif;color:#ddd2b8}
.fine{margin-top:10px;font-size:13.5px;color:#a89f8a}
.go{display:block;width:100%;max-width:340px;margin:22px 0 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f6e3a8,#e0bd6a 55%,#c9922b);color:#11110f;text-align:center;text-decoration:none;font:400 21px/1 "RM Head",Impact,sans-serif;letter-spacing:.04em}
.alt{display:block;margin:14px 0 0;color:#ddd2b8;font:700 14px Arial,sans-serif}
</style></head><body>
<main>
  <img class="ic" src="/icon-192.png" alt="">
  ${g ? `<div class="k">A GROUP ON THE PORCH</div>
  <h1>${esc(g.name)}</h1>
  ${g.about ? `<p>${esc(g.about)}</p>` : ''}
  ${g.who_for ? `<p>For: ${esc(g.who_for)}</p>` : ''}
  <p class="fine">Only members see what's shared in a group.</p>` : `<h1>FOR MEMBERS</h1>
  <p>Groups are for people signed in to Recovery Misfits.</p>`}
  <a class="go" href="/account.html?next=feed">Join free</a>
  <p class="fine">Free. Anonymous. Every path welcome.</p>
  <a class="alt" href="/account.html?signin=1">I have an account</a>
</main>
</body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': g ? 'public, max-age=60' : 'no-store' } });
}

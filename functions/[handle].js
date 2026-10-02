/* PROFILE LINKS AT THE TOP: recoverymisfits.org/<name> (1 Oct 2026, Mike:
 * "recoverymisfits.org/tacomike417").
 *
 * Anything that is a real page or file on the site always wins: /audio, /coins,
 * /tools, /index.html, /meme ... all go straight through untouched. The build
 * (scripts/cf_build.sh) writes /names-taken.json, the list of everything at the top
 * of the site, and this reads it. Everything else is treated as a name and gets the
 * same page as /u/<name> (functions/u/[handle].js), which keeps working too.
 * Members-only and nobody-by-that-name still get the same "for members" page.
 */
import { onRequestGet as profilePage } from './u/[handle].js';

/* never names, even if no page uses them yet (same list as porch.html and account.html) */
const EXTRA = ['beta', 's', 'u', 'api', 'app', 'admin', 'feed', 'porch', 'login', 'signin', 'signup', 'account', 'settings',
  'help', 'about', 'privacy', 'terms', 'support', 'mod', 'mods', 'staff', 'team', 'official', 'recoverymisfits',
  'me', 'home', 'index', 'www', 'static', 'assets', 'images', 'cdn', 'blog', 'news', 'shop', 'store', 'search',
  'explore', 'share-in', 'notifications', 'messages', 'spins', 'spin', 'friends', 'groups', 'group', 'profile', 'user', 'users', 'null', 'undefined'];
const FILE = /\.(html?|js|mjs|css|json|txt|xml|png|jpe?g|gif|webp|avif|svg|ico|mp3|mp4|wav|webm|woff2?|ttf|map|webmanifest|pdf|zip)$/i;

let taken = null;
async function takenNames(env, url) {
  if (taken) return taken;
  let list = [];
  try { const r = await env.ASSETS.fetch(new URL('/names-taken.json', url)); if (r.ok) list = await r.json(); } catch (_) {}
  taken = new Set(list.concat(EXTRA).map((n) => String(n).toLowerCase()));
  return taken;
}

export async function onRequestGet(ctx) {
  const h = String(ctx.params.handle || '');
  if (!/^[a-z0-9._-]{2,32}$/i.test(h) || FILE.test(h) || h.charAt(0) === '.') return ctx.next();
  if ((await takenNames(ctx.env, ctx.request.url)).has(h.toLowerCase())) return ctx.next();
  return profilePage(ctx);
}

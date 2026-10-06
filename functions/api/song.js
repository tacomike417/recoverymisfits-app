/* SONG LOOKUP: recoverymisfits.org/api/song?q=simple+man (6 Oct 2026).
 * The "My song" box asks Apple's free song list straight from the phone first. That does not work
 * everywhere (iPhones get bounced to the Music app, and Apple only allows about 20 lookups a minute
 * from one connection), so the app falls back to this, which asks from the server:
 *   1. Apple's song list   2. if Apple says no, Deezer's song list
 * Answers are kept for a day so the same search isn't sent twice. Only the title, the artist and
 * (from Apple) the link come back: no cover art, no sound. Nothing about who asked is kept or sent on.
 * Add &why=1 to see what each list answered (for fixing things). */
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function fromApple(q, why) {
  try {
    const r = await fetch('https://itunes.apple.com/search?media=music&entity=song&limit=10&country=US&term=' + encodeURIComponent(q), { headers: { Accept: 'application/json', 'User-Agent': UA } });
    why.apple = r.status;
    if (!r.ok) return null;
    const j = await r.json();
    return ((j && j.results) || []).map((x) => ({ title: x.trackName, artist: x.artistName, apple: x.trackViewUrl }));
  } catch (e) { why.apple = 'threw ' + String(e && e.message).slice(0, 60); return null; }
}
async function fromDeezer(q, why) {
  try {
    const r = await fetch('https://api.deezer.com/search?limit=10&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json', 'User-Agent': UA } });
    why.deezer = r.status;
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !Array.isArray(j.data)) { why.deezer = 'no list'; return null; }
    return j.data.map((x) => ({ title: x.title, artist: x.artist && x.artist.name, apple: null }));
  } catch (e) { why.deezer = 'threw ' + String(e && e.message).slice(0, 60); return null; }
}

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
  const showWhy = url.searchParams.get('why') === '1';
  const json = (body, status, age) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': age ? 'public, max-age=' + age : 'no-store' } });
  if (q.length < 2) return json({ results: [] }, 200, 0);
  const key = new Request(url.origin + '/api/song?q=' + encodeURIComponent(q));
  const cache = caches.default;
  if (!showWhy) { const hit = await cache.match(key); if (hit) return hit; }
  const why = {};
  let list = await fromApple(q, why);
  if (!list) list = await fromDeezer(q, why);
  if (!list) return json(showWhy ? { error: 'busy', why } : { error: 'busy' }, 503, 0);
  const seen = {}, results = [];
  for (const x of list) {
    const title = String(x.title || '').slice(0, 120), artist = String(x.artist || '').slice(0, 120), k = (title + '|' + artist).toLowerCase();
    if (!title || seen[k] || results.length >= 6) continue;
    seen[k] = 1;
    results.push({ title, artist, apple: /^https:\/\/(music|itunes)\.apple\.com\//.test(x.apple || '') ? String(x.apple).slice(0, 300) : null });
  }
  if (showWhy) return json({ results, why }, 200, 0);
  const res = json({ results }, 200, 86400);
  waitUntil(cache.put(key, res.clone()));
  return res;
}

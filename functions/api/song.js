/* SONG LOOKUP BACKUP: recoverymisfits.org/api/song?q=simple+man (6 Oct 2026).
 * The "My song" box asks Apple's free song list straight from the phone. If that doesn't answer
 * (Apple only allows about 20 lookups a minute from one connection, and some phones block it),
 * the app asks here instead and this asks Apple from the server. Answers are kept for a day so the
 * same search isn't sent twice. Only the title, the artist and Apple's link come back: no cover art,
 * no sound (Apple's rules). Nothing about who asked is kept or sent on. */
export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
  const json = (body, status, age) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': age ? 'public, max-age=' + age : 'no-store' } });
  if (q.length < 2) return json({ results: [] }, 200, 0);
  const key = new Request(url.origin + '/api/song?q=' + encodeURIComponent(q));
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  let j;
  try {
    const r = await fetch('https://itunes.apple.com/search?media=music&entity=song&limit=10&term=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
    if (!r.ok) return json({ error: 'busy' }, 503, 0);
    j = await r.json();
  } catch (_) { return json({ error: 'down' }, 503, 0); }
  const seen = {}, results = [];
  for (const x of (j && j.results) || []) {
    const title = String(x.trackName || '').slice(0, 120), artist = String(x.artistName || '').slice(0, 120), k = (title + '|' + artist).toLowerCase();
    if (!title || seen[k] || results.length >= 6) continue;
    seen[k] = 1;
    results.push({ title, artist, apple: /^https:\/\/(music|itunes)\.apple\.com\//.test(x.trackViewUrl || '') ? String(x.trackViewUrl).slice(0, 300) : null });
  }
  const res = json({ results }, 200, 86400);
  waitUntil(cache.put(key, res.clone()));
  return res;
}

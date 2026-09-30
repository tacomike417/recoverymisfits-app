/* THE PORCH (30 Sep 2026, Mike). Everything that SAYS something goes through here.
 *
 *   post     { need, body?, photos?: [base64 jpeg], card_style?, sure? }
 *   comment  { post_id, body, parent_id?, sure? }      -- parent_id = replying to a comment
 *   edit     { post_id | comment_id, body, sure? }     -- your own only, same checks
 *   remove   { post_id } | { comment_id }            -- your own only
 *   picture  { slot: "avatar"|"cover", photo }        -- profile pic / header
 *
 * Checks, in order, before anything is saved:
 *   1. Confirmed member, not paused by reports, account older than 3 days.
 *   2. Rate limits: 10 posts and 60 comments an hour.
 *   3. Words. Rated R, not rated X: cussing is fine. Slurs, sexual talk and
 *      threats are refused.
 *   4. Links: adult sites, short links, and Google's scam/malware list.
 *      Can't check = not posted.
 *   5. Photos: Google Vision SafeSearch. No nudity anywhere. Can't check =
 *      not posted.
 *   6. THE PAUSE: if it reads heated, answer { pause: true } instead of
 *      posting. The app asks "Want to talk to a friend about this first?"
 *      and only sends it again with sure: true if they tap Post anyway.
 *   7. If it sounds like someone is thinking about hurting themselves, it
 *      still posts, and the answer carries { care: true } so the app shows
 *      988 and a kind word right then.
 *
 * Secrets: GOOGLE_VISION_KEY (the same Google Cloud key Infinite Pulls uses
 * for photos and the Web Risk link check).
 *
 * Deploy:
 *   npx supabase functions deploy porch --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { decodeBase64 } from "jsr:@std/encoding@1/base64";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } });
const VISION = Deno.env.get("GOOGLE_VISION_KEY") || "";

/* ---------------- words ---------------- */
const LEET: Record<string, string> = { a: "[a@4*]", e: "[e3*]", i: "[i1!|*]", o: "[o0*]", s: "[s$5*]", u: "[uv*]", t: "[t7+]", g: "[g9]" };
const pat = (w: string) => w.split("").map((c) => (c === " " ? "\\s*" : (LEET[c] || c) + "+")).join("[\\W_]*");
const words = (list: string[]) => new RegExp("(?<![a-z])(?:" + list.map(pat).join("|") + ")(?:e?s|z)?(?![a-z])", "i");

// refused everywhere: slurs and sexual talk
const BLOCK = words([
  "nigger", "nigga", "faggot", "fag", "retard", "tranny", "chink", "spic", "kike", "wetback", "raghead", "towelhead", "gook", "beaner", "dyke",
  "nudes", "send pics", "dick pic", "dickpic", "sext", "sexting", "horny", "porn", "porno", "blowjob", "handjob", "onlyfans", "nsfw",
]);
// refused: threats against somebody else
const THREAT = /\b(i('| a)?m|i will|ima|imma|gonna|going to)\s+(kill|hurt|beat|stab|shoot|jump)\s+(you|u|him|her|them|ya)\b|\bwatch your back\b|\byou('| a)?re dead\b|\bi know where you (live|work)\b/i;
// posts, but shows 988 and a kind word
const CARE = /\b(kill(ing)? myself|end (it all|my life)|want to die|wanna die|suicid|don'?t want to (be here|live)|better off without me|no reason to live|hurt(ing)? myself|cut(ting)? myself)\b/i;
// THE PAUSE: two or more of these and we ask first
const HEAT = [
  /\byou know who you are\b/i, /\bsome people\b/i, /\b(fake|snakes?|backstab\w*|two[- ]faced|liars?)\b/i,
  /\beverybody('?s| is)? (gonna|going to) know\b/i, /\bcalling (you |them )?out\b/i, /\bkarma\b/i,
  /\b(f+u+c+k+|screw) (you|u|them|him|her|this|off)\b/i, /\b(sick|tired) of\b/i, /\bi('?m| am) done with\b/i,
  /\bhate (you|them|him|her|this|everyone|everybody)\b/i, /\bpiece of (shit|crap|garbage)\b/i, /!{3,}/,
];
function heated(t: string) {
  let n = HEAT.filter((r) => r.test(t)).length;
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.6) n++;
  return n >= 2;
}

/* ---------------- links ---------------- */
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
const OURS = ["recoverymisfits.org", "www.recoverymisfits.org"];
const SHORT = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rb.gy", "shorturl.at",
  "tiny.cc", "rebrand.ly", "t.ly", "s.id", "v.gd", "bl.ink", "lnkd.in", "shorte.st", "adf.ly"]);
const ADULT_WORDS = ["porn", "xxx", "xvideos", "xnxx", "xhamster", "redtube", "youporn", "onlyfans", "fansly", "chaturbate",
  "hentai", "nsfw", "stripchat", "livejasmin", "bongacams", "camsoda", "erome", "rule34", "spankbang", "motherless", "brazzers", "escort"];
function linksIn(text: string): URL[] {
  const out: URL[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[1].replace(/[.,!?;:)\]}'"]+$/, "");
    try { const u = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw); if (/^https?:$/.test(u.protocol)) out.push(u); } catch { /* text */ }
  }
  return out;
}
function looksAdult(u: URL) {
  const h = u.hostname.toLowerCase();
  if (ADULT_WORDS.some((w) => h.includes(w))) return true;
  if (h.split(/[.-]/).some((t) => ["sex", "sexy", "nude", "adult"].includes(t))) return true;
  return /(^|[^a-z])(porn|xxx|nsfw|hentai|onlyfans|nudes?)([^a-z]|$)/.test(decodeURIComponent(u.pathname + u.search).toLowerCase());
}
async function family(u: URL) {
  try {
    const r = await fetch("https://family.cloudflare-dns.com/dns-query?type=A&name=" + encodeURIComponent(u.hostname), { headers: { accept: "application/dns-json" } });
    if (!r.ok) return "error";
    const a: any[] = (await r.json())?.Answer || [];
    return a.some((x) => x?.type === 1 && x?.data === "0.0.0.0") ? "bad" : "ok";
  } catch { return "error"; }
}
async function webRisk(u: URL) {
  const q = new URLSearchParams();
  ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"].forEach((t) => q.append("threatTypes", t));
  q.set("uri", u.href); q.set("key", VISION);
  try { const r = await fetch("https://webrisk.googleapis.com/v1/uris:search?" + q); if (!r.ok) return "error"; return (await r.json())?.threat ? "bad" : "ok"; }
  catch { return "error"; }
}
async function checkLinks(text: string): Promise<string | null> {
  const links = linksIn(text).filter((u) => !OURS.includes(u.hostname.toLowerCase()));
  if (!links.length) return null;
  if (links.length > 3) return "That's a lot of links. Use 3 or fewer.";
  if (links.some((u) => SHORT.has(u.hostname.toLowerCase().replace(/^www\./, "")))) return "Short links hide where they go. Paste the full link instead.";
  if (links.some((u) => /^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname) || u.hostname.startsWith("["))) return "That link can't be posted.";
  if (links.some(looksAdult)) return "Adult sites aren't allowed on the Porch.";
  if (!VISION) return "Links can't be checked right now, so that wasn't posted.";
  for (const u of links) {
    const f = await family(u);
    if (f !== "ok") return f === "bad" ? "That link goes to a blocked site." : "Links can't be checked right now, so that wasn't posted.";
    const w = await webRisk(u);
    if (w !== "ok") return w === "bad" ? "That link is flagged for scams or malware." : "Links can't be checked right now, so that wasn't posted.";
  }
  return null;
}
function checkWords(text: string): string | null {
  if (BLOCK.test(text)) return "That has words the Porch doesn't allow (slurs or sexual stuff), so it wasn't posted.";
  if (THREAT.test(text)) return "That reads like a threat, so it wasn't posted.";
  return null;
}

/* ---------------- photos ---------------- */
const LEVEL: Record<string, number> = { UNKNOWN: 0, VERY_UNLIKELY: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, VERY_LIKELY: 5 };
async function photoOk(bytes: Uint8Array, b64: string): Promise<string | null> {
  if (!VISION) return "Photos aren't switched on yet.";
  if (bytes.length > 3 * 1024 * 1024) return "That photo is too big.";
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return "That photo couldn't be read.";
  try {
    const r = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(VISION), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { content: b64 }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }] }),
    });
    if (!r.ok) return "Photos can't be checked right now, so that wasn't posted.";
    const s = (await r.json())?.responses?.[0]?.safeSearchAnnotation;
    if (!s) return "Photos can't be checked right now, so that wasn't posted.";
    if ((LEVEL[s.adult] || 0) >= LEVEL.LIKELY || (LEVEL[s.racy] || 0) >= LEVEL.VERY_LIKELY) return "That photo isn't allowed on the Porch.";
    if ((LEVEL[s.violence] || 0) >= LEVEL.VERY_LIKELY) return "That photo is too graphic for the Porch.";
    return null;
  } catch { return "Photos can't be checked right now, so that wasn't posted."; }
}
async function storePhoto(uid: string, bytes: Uint8Array) {
  const path = `${uid}/${crypto.randomUUID()}.jpg`;
  const { error } = await admin.storage.from("porch").upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000" });
  return error ? null : path;
}

async function countSince(table: string, uid: string, minutes: number) {
  const { count } = await admin.from(table).select("id", { count: "exact", head: true })
    .eq("user_id", uid).gt("created_at", new Date(Date.now() - minutes * 60_000).toISOString());
  return count || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who?.user;
  if (!user) return json({ error: "Sign in first." }, 401);
  const { data: me } = await admin.from("porch_members").select("*").eq("user_id", user.id).maybeSingle();
  if (!me?.verified_at) return json({ error: "Confirm who you are to post.", need: "confirm" }, 403);
  if (me.frozen_at) return json({ error: "Your account is paused while someone looks at a report. Hang tight." }, 403);
  if (Date.now() - new Date(user.created_at).getTime() < 3 * 24 * 3600_000) {
    return json({ error: "Brand-new accounts can post after 3 days. Look around in the meantime." }, 403);
  }

  let b: Record<string, any> = {};
  try { b = await req.json(); } catch { /* empty */ }
  const text = String(b.body || "").trim();

  if (b.action === "post" || b.action === "comment") {
    const isPost = b.action === "post";
    if (isPost && (await countSince("porch_posts", user.id, 60)) >= 10) return json({ error: "That's a lot of posts. Take a breather and try again in a bit." }, 429);
    if (!isPost && (await countSince("porch_comments", user.id, 60)) >= 60) return json({ error: "That's a lot of comments. Try again in a bit." }, 429);
    if (text.length > (isPost ? 2000 : 1000)) return json({ error: "That's too long." }, 400);

    const w = checkWords(text); if (w) return json({ error: w }, 400);
    const l = await checkLinks(text); if (l) return json({ error: l }, 400);
    if (!b.sure && heated(text)) return json({ pause: true });
    const care = CARE.test(text);

    if (!isPost) {
      if (!text) return json({ error: "Say something first." }, 400);
      const { data: post } = await admin.from("porch_posts").select("user_id, hidden_at").eq("id", b.post_id).maybeSingle();
      if (!post || post.hidden_at) return json({ error: "That post is gone." }, 404);
      const { data: blocked } = await admin.rpc("porch_blocked", { a: user.id, b: post.user_id });
      if (blocked) return json({ error: "You can't comment there." }, 403);
      // a reply hangs under the first comment in its thread (one level deep, like Facebook)
      let parent: string | null = null;
      if (b.parent_id) {
        const { data: pc } = await admin.from("porch_comments").select("id, post_id, parent_id, user_id, hidden_at").eq("id", b.parent_id).maybeSingle();
        if (!pc || pc.hidden_at || pc.post_id !== b.post_id) return json({ error: "That comment is gone." }, 404);
        const { data: pblocked } = await admin.rpc("porch_blocked", { a: user.id, b: pc.user_id });
        if (pblocked) return json({ error: "You can't reply there." }, 403);
        parent = pc.parent_id || pc.id;
      }
      const { data, error } = await admin.from("porch_comments").insert({ post_id: b.post_id, user_id: user.id, body: text, parent_id: parent }).select("id").single();
      if (error) return json({ error: "That didn't go through. Try again." }, 500);
      return json({ ok: true, id: data.id, parent_id: parent, care });
    }

    const need = String(b.need || "talk");
    if (!["talk", "experience", "strength", "hope", "question", "win", "hard", "moment"].includes(need)) return json({ error: "Pick what you need." }, 400);
    const photos: string[] = Array.isArray(b.photos) ? b.photos.slice(0, 4) : [];
    if (!text && !photos.length) return json({ error: "Say something or add a photo." }, 400);
    const paths: string[] = [];
    for (const p of photos) {
      const b64 = String(p).replace(/^data:image\/\w+;base64,/, "");
      let bytes: Uint8Array;
      try { bytes = decodeBase64(b64); } catch { return json({ error: "That photo couldn't be read." }, 400); }
      const bad = await photoOk(bytes, b64); if (bad) return json({ error: bad }, 400);
      const path = await storePhoto(user.id, bytes); if (!path) return json({ error: "The photo didn't upload. Try again." }, 500);
      paths.push(path);
    }
    const style = Number.isInteger(b.card_style) ? Math.max(0, Math.min(11, b.card_style)) : null;
    const { data, error } = await admin.from("porch_posts")
      .insert({ user_id: user.id, need, body: text || null, photo_paths: paths, card_style: paths.length ? null : style })
      .select("id").single();
    if (error) return json({ error: "That didn't go through. Try again." }, 500);
    return json({ ok: true, id: data.id, care });
  }

  /* EDIT your own share or comment: same checks as a new one, stamped "edited" */
  if (b.action === "edit") {
    const isPost = !!b.post_id;
    const table = isPost ? "porch_posts" : "porch_comments";
    const id = b.post_id || b.comment_id;
    const { data: row } = await admin.from(table).select(isPost ? "user_id, hidden_at, photo_paths, card_style" : "user_id, hidden_at").eq("id", id).maybeSingle();
    if (!row || (row as any).hidden_at) return json({ error: "That's gone." }, 404);
    if ((row as any).user_id !== user.id) return json({ error: "You can only edit your own." }, 403);
    const hasPhotos = isPost && ((row as any).photo_paths || []).length > 0;
    if (!text && !hasPhotos) return json({ error: "Say something first." }, 400);
    if (text.length > (isPost ? 2000 : 1000)) return json({ error: "That's too long." }, 400);
    if (isPost && (row as any).card_style != null && !hasPhotos && text.length > 150) return json({ error: "Sayings are 150 characters or less." }, 400);
    const w = checkWords(text); if (w) return json({ error: w }, 400);
    const l = await checkLinks(text); if (l) return json({ error: l }, 400);
    if (!b.sure && heated(text)) return json({ pause: true });
    const edited_at = new Date().toISOString();
    const change: Record<string, unknown> = { body: text || null, edited_at };
    if (isPost && b.need != null) {
      if (!["talk", "experience", "strength", "hope", "question"].includes(String(b.need))) return json({ error: "Pick what you need." }, 400);
      change.need = String(b.need);
    }
    if (isPost && (row as any).card_style != null && Number.isInteger(b.card_style)) change.card_style = Math.max(0, Math.min(11, b.card_style));
    const { error } = await admin.from(table).update(change).eq("id", id).eq("user_id", user.id);
    if (error) return json({ error: "That didn't save. Try again." }, 500);
    return json({ ok: true, edited_at, care: CARE.test(text) });
  }

  if (b.action === "remove") {
    const table = b.post_id ? "porch_posts" : "porch_comments";
    const id = b.post_id || b.comment_id;
    const { error } = await admin.from(table).update({ hidden_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    return error ? json({ error: "Couldn't remove it." }, 500) : json({ ok: true });
  }

  if (b.action === "picture") {
    const slot = b.slot === "cover" ? "cover_path" : "avatar_path";
    const b64 = String(b.photo || "").replace(/^data:image\/\w+;base64,/, "");
    let bytes: Uint8Array;
    try { bytes = decodeBase64(b64); } catch { return json({ error: "That photo couldn't be read." }, 400); }
    const bad = await photoOk(bytes, b64); if (bad) return json({ error: bad }, 400);
    const path = await storePhoto(user.id, bytes); if (!path) return json({ error: "The photo didn't upload. Try again." }, 500);
    await admin.from("porch_members").update({ [slot]: path }).eq("user_id", user.id);
    return json({ ok: true, path });
  }

  return json({ error: "Unknown action" }, 400);
});

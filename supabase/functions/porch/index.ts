/* THE PORCH (30 Sep 2026, Mike). Everything that SAYS something goes through here.
 *
 *   post     { need, body?, photos?: [base64 jpeg], card_style?, sure? }
 *   comment  { post_id, body, parent_id?, sure? }      -- parent_id = replying to a comment
 *   edit     { post_id | comment_id, body, sure? }     -- your own only, same checks
 *   remove   { post_id } | { comment_id }            -- your own only
 *   picture  { slot: "avatar"|"cover", photo }        -- profile pic / header
 *   leave    {}                                        -- delete everything they put on the Porch
 *   dm_send  { to, body?, photos?, sure? }             -- Messages: friends only, rated R not X
 *   dm_unsend { id }                                   -- take back your own message
 *   mod_list / mod_act { key, what, who? }             -- moderators only: the reports screen
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

/* ---------------- link previews (30 Sep 2026) ----------------
   The first link in a share gets a card: title, a line of description, the site
   and its picture. Only links that already passed the safety checks get here, and
   the picture itself goes through SafeSearch too; if it can't be checked, the card
   just shows without a picture. */
function meta(html: string, names: string[]) {
  for (const n of names) {
    const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + n.replace(":", "\\:") + '["\'][^>]*>', "i");
    const tag = html.match(re)?.[0];
    const c = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (c) return c;
  }
  return "";
}
const unent = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
async function previewFor(text: string) {
  const u = linksIn(text)[0];
  if (!u) return null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(u.href, { signal: ctl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; RecoveryMisfitsBot/1.0; +https://recoverymisfits.org)", Accept: "text/html" } });
    clearTimeout(t);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("text/html")) return null;
    const html = (await r.text()).slice(0, 300_000);
    const title = unent(meta(html, ["og:title", "twitter:title"]) || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "");
    if (!title) return null;
    const desc = unent(meta(html, ["og:description", "twitter:description", "description"]));
    const site = unent(meta(html, ["og:site_name"])) || u.hostname.replace(/^www\./, "");
    let image = meta(html, ["og:image", "og:image:url", "twitter:image"]);
    if (image) {
      try { image = new URL(image, r.url || u.href).href; } catch { image = ""; }
      if (!/^https:\/\//.test(image) || !(await imageOk(image))) image = "";
    }
    return { url: u.href, title: title.slice(0, 140), desc: desc.slice(0, 220), site: site.slice(0, 60), image: image || null };
  } catch { return null; }
}
async function imageOk(url: string) {
  if (!VISION) return false;
  try {
    const r = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(VISION), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { source: { imageUri: url } }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }] }),
    });
    const s = (await r.json())?.responses?.[0]?.safeSearchAnnotation;
    if (!s) return false;
    return (LEVEL[s.adult] || 0) < LEVEL.LIKELY && (LEVEL[s.racy] || 0) < LEVEL.VERY_LIKELY && (LEVEL[s.violence] || 0) < LEVEL.VERY_LIKELY;
  } catch { return false; }
}

/* MESSAGES photos (30 Sep 2026): rated R, not rated X. Spicy comes through blurred;
   full nudity and gore don't come through at all. Can't check = not sent. */
async function dmPhoto(bytes: Uint8Array, b64: string): Promise<{ error?: string; racy?: boolean }> {
  if (!VISION) return { error: "Photos aren't switched on yet." };
  if (bytes.length > 3 * 1024 * 1024) return { error: "That photo is too big." };
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return { error: "That photo couldn't be read." };
  try {
    const r = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(VISION), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { content: b64 }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }] }),
    });
    const s = (await r.json())?.responses?.[0]?.safeSearchAnnotation;
    if (!s) return { error: "Photos can't be checked right now, so that wasn't sent." };
    if ((LEVEL[s.adult] || 0) >= LEVEL.VERY_LIKELY) return { error: "Full nudity can't be sent on Recovery Misfits." };
    if ((LEVEL[s.violence] || 0) >= LEVEL.VERY_LIKELY) return { error: "That photo is too graphic to send." };
    return { racy: (LEVEL[s.adult] || 0) >= LEVEL.POSSIBLE || (LEVEL[s.racy] || 0) >= LEVEL.LIKELY };
  } catch { return { error: "Photos can't be checked right now, so that wasn't sent." }; }
}
// in messages, only slurs and threats are stopped (adults can cuss and flirt in private)
const SLURS = words(["nigger", "nigga", "faggot", "fag", "retard", "tranny", "chink", "spic", "kike", "wetback", "raghead", "towelhead", "gook", "beaner", "dyke"]);

/* photos come off the server when the share (or the person) is gone */
async function dropPhotos(paths: string[]) {
  const mine = paths.filter((p) => p && !p.startsWith("/"));
  if (mine.length) await admin.storage.from("porch").remove(mine);
}
async function dropFolder(uid: string) {
  for (let i = 0; i < 20; i++) {
    const { data } = await admin.storage.from("porch").list(uid, { limit: 100 });
    if (!data?.length) return;
    await admin.storage.from("porch").remove(data.map((f) => uid + "/" + f.name));
  }
}

async function isMod(uid: string) {
  const { data } = await admin.from("porch_moderators").select("user_id").eq("user_id", uid).maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who?.user;
  if (!user) return json({ error: "Sign in first." }, 401);

  let b: Record<string, any> = {};
  try { b = await req.json(); } catch { /* empty */ }

  /* LEAVE THE PORCH: everything they ever put here, gone. Their app account
     (sober date, settings) stays. Works even if they're paused. */
  if (b.action === "leave") {
    const { data: m } = await admin.from("porch_members").select("frozen_at").eq("user_id", user.id).maybeSingle();
    await dropFolder(user.id);
    const { data: myThreads } = await admin.from("porch_threads").select("id").or("a.eq." + user.id + ",b.eq." + user.id);
    for (const t of myThreads || []) {
      for (let i = 0; i < 20; i++) {
        const { data } = await admin.storage.from("porch-dm").list(t.id, { limit: 100 });
        if (!data?.length) break;
        await admin.storage.from("porch-dm").remove(data.map((f) => t.id + "/" + f.name));
      }
    }
    if (myThreads?.length) await admin.from("porch_threads").delete().in("id", myThreads.map((t) => t.id));
    for (const [t, col] of [["porch_notes", "user_id"], ["porch_notes", "actor_id"], ["porch_saves", "user_id"], ["porch_push", "user_id"],
      ["porch_reactions", "user_id"], ["porch_follows", "follower_id"], ["porch_follows", "followed_id"], ["porch_blocks", "blocker_id"],
      ["porch_reports", "reporter_id"], ["porch_comments", "user_id"], ["porch_posts", "user_id"], ["porch_moderators", "user_id"]] as const) {
      await admin.from(t).delete().eq(col, user.id);
    }
    await admin.from("porch_members").delete().eq("user_id", user.id);
    // a paused person's email stays locked, so leaving can't be used to dodge a report
    if (!m?.frozen_at) await admin.from("porch_identity").delete().eq("user_id", user.id);
    return json({ ok: true });
  }

  /* MODERATORS: the reports screen */
  if (b.action === "mod_list" || b.action === "mod_act") {
    if (!(await isMod(user.id))) return json({ error: "Moderators only." }, 403);
    if (b.action === "mod_list") {
      const { data: reps } = await admin.from("porch_reports").select("*").is("handled_at", null).order("created_at", { ascending: true }).limit(200);
      const groups: Record<string, any> = {};
      for (const r of reps || []) {
        const k = r.post_id ? "p:" + r.post_id : r.comment_id ? "c:" + r.comment_id : "m:" + r.member_id;
        (groups[k] ||= { key: k, post_id: r.post_id, comment_id: r.comment_id, member_id: r.member_id, reasons: {}, notes: [], ids: [], first: r.created_at });
        groups[k].reasons[r.reason] = (groups[k].reasons[r.reason] || 0) + 1;
        if (r.note) groups[k].notes.push(r.note);
        groups[k].ids.push(r.id);
      }
      const out = [];
      for (const g of Object.values(groups) as any[]) {
        let who = g.member_id, body = "", photos: string[] = [], post_id = g.post_id, hidden = null;
        if (g.post_id) {
          const { data: p } = await admin.from("porch_posts").select("user_id, body, photo_paths, hidden_at").eq("id", g.post_id).maybeSingle();
          if (p) { who = p.user_id; body = p.body || ""; photos = p.photo_paths || []; hidden = p.hidden_at; }
        } else if (g.comment_id) {
          const { data: c } = await admin.from("porch_comments").select("user_id, body, post_id, hidden_at").eq("id", g.comment_id).maybeSingle();
          if (c) { who = c.user_id; body = c.body; post_id = c.post_id; hidden = c.hidden_at; }
        }
        const { data: m } = await admin.from("porch_members").select("handle, avatar_path, frozen_at").eq("user_id", who).maybeSingle();
        out.push({ ...g, who, handle: m?.handle || "misfit", avatar_path: m?.avatar_path || null, frozen: !!m?.frozen_at, body, photos, post_id, hidden,
          danger: !!g.reasons.self_harm });
      }
      out.sort((a, b) => (b.danger ? 1 : 0) - (a.danger ? 1 : 0) || (a.first < b.first ? -1 : 1));
      return json({ ok: true, reports: out });
    }
    // mod_act { key, what: "down" | "fine" | "unpause" }
    const k = String(b.key || ""), what = String(b.what || "");
    const [kind, id] = [k.slice(0, 1), k.slice(2)];
    const col = kind === "p" ? "post_id" : kind === "c" ? "comment_id" : "member_id";
    if (!id || !["down", "fine", "unpause"].includes(what)) return json({ error: "Bad request." }, 400);
    if (what === "down" && kind !== "m") {
      await admin.from(kind === "p" ? "porch_posts" : "porch_comments").update({ hidden_at: new Date().toISOString() }).eq("id", id);
    }
    if (what === "unpause" && b.who) await admin.from("porch_members").update({ frozen_at: null }).eq("user_id", b.who);
    // handling the reports lifts the pause on its own once nothing is left open about them
    await admin.from("porch_reports").update({ handled_at: new Date().toISOString() }).eq(col, id).is("handled_at", null);
    return json({ ok: true });
  }

  const { data: me } = await admin.from("porch_members").select("*").eq("user_id", user.id).maybeSingle();
  if (!me?.verified_at) return json({ error: "Confirm who you are to post.", need: "confirm" }, 403);
  if (me.frozen_at) return json({ error: "Your account is paused while someone looks at a report. Hang tight." }, 403);
  if (Date.now() - new Date(user.created_at).getTime() < 3 * 24 * 3600_000) {
    return json({ error: "Brand-new accounts can post after 3 days. Look around in the meantime." }, 403);
  }

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
    const link_preview = paths.length ? null : await previewFor(text);
    const { data, error } = await admin.from("porch_posts")
      .insert({ user_id: user.id, need, body: text || null, photo_paths: paths, card_style: paths.length ? null : style, link_preview })
      .select("id").single();
    if (error) return json({ error: "That didn't go through. Try again." }, 500);
    return json({ ok: true, id: data.id, care });
  }

  /* MESSAGES (30 Sep 2026): friends only. dm_send { to, body?, photos?, sure? } / dm_unsend { id } */
  if (b.action === "dm_send") {
    const to = String(b.to || "");
    if (!to || to === user.id) return json({ error: "Pick a friend to message." }, 400);
    const { data: blocked } = await admin.rpc("porch_blocked", { a: user.id, b: to });
    if (blocked) return json({ error: "You can't message them." }, 403);
    const { data: friendsOk } = await admin.rpc("porch_are_friends", { x: user.id, y: to });
    if (!friendsOk) return json({ error: "You can message friends only.", need: "friend" }, 403);
    const { count: sent } = await admin.from("porch_dm").select("id", { count: "exact", head: true })
      .eq("from_id", user.id).gt("created_at", new Date(Date.now() - 3600_000).toISOString());
    if ((sent || 0) >= 200) return json({ error: "That's a lot of messages. Take a breather and try again in a bit." }, 429);
    if (text.length > 2000) return json({ error: "That's too long." }, 400);
    const photos: string[] = Array.isArray(b.photos) ? b.photos.slice(0, 4) : [];
    if (!text && !photos.length) return json({ error: "Say something first." }, 400);
    if (SLURS.test(text)) return json({ error: "That has a slur in it, so it wasn't sent." }, 400);
    if (THREAT.test(text)) return json({ error: "That reads like a threat, so it wasn't sent." }, 400);
    const l = await checkLinks(text); if (l) return json({ error: l }, 400);
    if (!b.sure && heated(text)) return json({ pause: true });
    const [x, y] = user.id < to ? [user.id, to] : [to, user.id];
    let { data: th } = await admin.from("porch_threads").select("id").eq("a", x).eq("b", y).maybeSingle();
    if (!th) {
      const { data: made } = await admin.from("porch_threads").upsert({ a: x, b: y }, { onConflict: "a,b" }).select("id").single();
      th = made;
    }
    if (!th) return json({ error: "That didn't go through. Try again." }, 500);
    const paths: string[] = []; let racy = false;
    for (const p of photos) {
      const b64 = String(p).replace(/^data:image\/\w+;base64,/, "");
      let bytes: Uint8Array;
      try { bytes = decodeBase64(b64); } catch { return json({ error: "That photo couldn't be read." }, 400); }
      const ck = await dmPhoto(bytes, b64); if (ck.error) return json({ error: ck.error }, 400);
      racy = racy || !!ck.racy;
      const path = th.id + "/" + crypto.randomUUID() + ".jpg";
      const { error: upErr } = await admin.storage.from("porch-dm").upload(path, bytes, { contentType: "image/jpeg" });
      if (upErr) return json({ error: "The photo didn't send. Try again." }, 500);
      paths.push(path);
    }
    const { data: msg, error } = await admin.from("porch_dm")
      .insert({ thread_id: th.id, from_id: user.id, body: text || null, photo_paths: paths, racy }).select("*").single();
    if (error) return json({ error: "That didn't go through. Try again." }, 500);
    const preview = text ? text.replace(/\s+/g, " ").slice(0, 90) : paths.length > 1 ? "Sent " + paths.length + " photos" : "Sent a photo";
    const mineRead = user.id === x ? { a_read_at: msg.created_at } : { b_read_at: msg.created_at };
    await admin.from("porch_threads").update({ last_at: msg.created_at, last_from: user.id, last_preview: preview, ...mineRead }).eq("id", th.id);
    return json({ ok: true, message: msg, thread_id: th.id, care: CARE.test(text) });
  }
  if (b.action === "dm_unsend") {
    const { data: m } = await admin.from("porch_dm").select("id, from_id, thread_id, photo_paths, created_at").eq("id", b.id).maybeSingle();
    if (!m || m.from_id !== user.id) return json({ error: "You can only unsend your own." }, 403);
    if (m.photo_paths?.length) await admin.storage.from("porch-dm").remove(m.photo_paths);
    await admin.from("porch_dm").update({ unsent_at: new Date().toISOString(), body: null, photo_paths: [], racy: false }).eq("id", m.id);
    const { data: t } = await admin.from("porch_threads").select("last_at").eq("id", m.thread_id).maybeSingle();
    if (t && t.last_at === m.created_at) await admin.from("porch_threads").update({ last_preview: "Unsent a message" }).eq("id", m.thread_id);
    return json({ ok: true });
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
    if (isPost && !hasPhotos) change.link_preview = await previewFor(text);
    const { error } = await admin.from(table).update(change).eq("id", id).eq("user_id", user.id);
    if (error) return json({ error: "That didn't save. Try again." }, 500);
    return json({ ok: true, edited_at, link_preview: change.link_preview ?? null, care: CARE.test(text) });
  }

  if (b.action === "remove") {
    const table = b.post_id ? "porch_posts" : "porch_comments";
    const id = b.post_id || b.comment_id;
    const { data: gone, error } = await admin.from(table).update({ hidden_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id)
      .select(b.post_id ? "photo_paths" : "id");
    if (error) return json({ error: "Couldn't remove it." }, 500);
    if (b.post_id && gone?.[0]) await dropPhotos((gone[0] as any).photo_paths || []);
    return json({ ok: true });
  }

  if (b.action === "picture") {
    const slot = b.slot === "cover" ? "cover_path" : "avatar_path";
    const b64 = String(b.photo || "").replace(/^data:image\/\w+;base64,/, "");
    let bytes: Uint8Array;
    try { bytes = decodeBase64(b64); } catch { return json({ error: "That photo couldn't be read." }, 400); }
    const bad = await photoOk(bytes, b64); if (bad) return json({ error: bad }, 400);
    const path = await storePhoto(user.id, bytes); if (!path) return json({ error: "The photo didn't upload. Try again." }, 500);
    const old = (me as any)[slot];
    await admin.from("porch_members").update({ [slot]: path }).eq("user_id", user.id);
    if (old) await dropPhotos([old]);
    return json({ ok: true, path });
  }

  return json({ error: "Unknown action" }, 400);
});

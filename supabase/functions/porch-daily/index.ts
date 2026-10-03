/* THE HOUSE ACCOUNT'S DAILY POSTS (2 Oct 2026, Mike).
 *
 * "I want it to post the meme of the day every morning at 6 a.m."
 *
 * Every morning the house account (recoverymisfits) shares the Meme of the Day
 * on the Porch. Today's meme is read from the live site's own schedule
 * (/data/meme-days.json), so the Porch always shows the same meme the Today
 * page does, and new memes need nothing done here.
 *
 * A timer in the database knocks on this at 6am Eastern (supabase/porch_31_daily_meme.sql).
 * It takes nothing in and can only ever do one thing: today's meme, once.
 *   - before 6am Eastern it does nothing
 *   - if today's meme is already up it does nothing
 * So it is safe that anybody can knock: there is no secret to keep and nothing to abuse.
 *
 * THE DAILY PRAYER (2 Oct 2026, Mike). A second house account, spiritualmisfit,
 * posts the day's prayer at 7am Eastern as a saying card, with a mix of the card
 * backgrounds. It is a separate account on purpose: "if it's coming from the house
 * account, it looks like we started a religion here." Anybody can Mute it.
 * The prayers are in the site's /data/prayers.json, one per date.
 *
 * MOMENTS OF QUESTIONABLE SERENITY (2 Oct 2026, Mike). The house account also posts one
 * of Mike's 150 recovery jokes every other day at noon Eastern, as a saying card. They
 * run in order from /data/moments.json and start over at the end. One account can carry
 * as many of these schedules as we like: each is its own little job below.
 *
 * THE REELS (2 Oct 2026, Mike). 100 fifteen-second Spins for spiritualmisfit: "backlog it
 * and post like six of them on that account to start, and then do one every other day
 * until they run out." They are uploaded ONCE from Mike's computer (scripts/
 * upload_house_reels.py) straight to the video host, and wait in porch_house_reels.
 * This job publishes them: six to begin with (dated one a day going back, so the feed
 * isn't flooded), then one every other day at 5pm Eastern. House Spins don't expire.
 * The upload doors below (reel_slot, reel_uploaded, reel_status) need HOUSE_KEY, a
 * password Mike made up; without it they refuse.
 *
 * Deploy:
 *   npx supabase functions deploy porch-daily --no-verify-jwt --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const HOUSE = "recoverymisfits";
const SITE = "https://recoverymisfits.org";
const START_HOUR = 6;                       // the meme: 6am Eastern
const PRAYER_HOUSE = "spiritualmisfit";
const PRAYER_HOUR = 7;                      // the prayer: 7am Eastern
const CARD_STYLES = 19;
const MOMENT_HOUR = 12;                     // the jokes: noon Eastern, every other day
const REEL_HOUR = 17;                       // the reels: 5pm Eastern, every other day
const REEL_BACKLOG = 6;                     // how many go up to start
const HOUSE_KEY = Deno.env.get("HOUSE_KEY") || "";
const BUNNY_KEY = Deno.env.get("BUNNY_STREAM_KEY") || "";
const BUNNY_LIB = Deno.env.get("BUNNY_STREAM_LIBRARY") || "";
const bunny = (path: string, init: RequestInit = {}) =>
  fetch(`https://video.bunnycdn.com/library/${BUNNY_LIB}${path}`, { ...init, headers: { AccessKey: BUNNY_KEY, accept: "application/json", "content-type": "application/json", ...(init.headers || {}) } });
async function sha256Hex(t: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}                     // the saying-card backgrounds in feed/porch.html
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

/* the date and the hour in Ohio, whatever the server's clock says */
function eastern() {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

const since20h = () => new Date(Date.now() - 20 * 3600 * 1000).toISOString();

async function meme(day: string, hour: number) {
  if (hour < START_HOUR) return { posted: false, why: "before 6am Eastern" };
  const r = await fetch(SITE + "/data/meme-days.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: false, error: "could not read the meme schedule (" + r.status + ")" };
  const file = ((await r.json()).days || {})[day];
  if (!file || !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(file)) return { posted: false, why: "no meme on the schedule for " + day };
  const path = "/assets/memes/" + file;
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", HOUSE).maybeSingle();
  if (!m) return { posted: false, error: "the house account is not on the Porch yet" };
  /* once a day: the same picture from the house account in the last 20 hours means it's done */
  const { data: had } = await admin.from("porch_posts").select("id").eq("user_id", m.user_id)
    .contains("photo_paths", [path]).gte("created_at", since20h()).limit(1);
  if (had && had.length) return { posted: false, why: "today's meme is already up", meme: file };
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: "Meme of the Day", photo_paths: [path] }).select("id").single();
  if (error) return { posted: false, error: error.message };
  return { posted: true, meme: file, post_id: post.id };
}

async function prayer(day: string, hour: number) {
  if (hour < PRAYER_HOUR) return { posted: false, why: "before 7am Eastern" };
  const r = await fetch(SITE + "/data/prayers.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: false, error: "could not read the prayers (" + r.status + ")" };
  const days = (await r.json()).days || {};
  const md = day.slice(5);                                   // MM-DD
  const text = String(days[md] || (md === "02-29" ? days["02-28"] : "") || "").trim();
  if (!text) return { posted: false, why: "no prayer for " + md };
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", PRAYER_HOUSE).maybeSingle();
  if (!m) return { posted: false, error: "spiritualmisfit is not on the Porch yet" };
  const { data: had } = await admin.from("porch_posts").select("id").eq("user_id", m.user_id)
    .eq("body", text).gte("created_at", since20h()).limit(1);
  if (had && had.length) return { posted: false, why: "today's prayer is already up" };
  /* a mix of the backgrounds: a different card every day, every one before any repeats */
  const [, mo, dd] = day.split("-").map(Number);
  const dayOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][mo - 1] + dd;
  const style = (dayOfYear * 5 + 3) % CARD_STYLES;
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: text, photo_paths: [], card_style: style }).select("id").single();
  if (error) return { posted: false, error: error.message };
  return { posted: true, card: style, post_id: post.id };
}

/* whole days from one YYYY-MM-DD to another */
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

async function moment(day: string, hour: number) {
  if (hour < MOMENT_HOUR) return { posted: false, why: "before noon Eastern" };
  const r = await fetch(SITE + "/data/moments.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: false, error: "could not read the moments (" + r.status + ")" };
  const j = await r.json();
  const items: string[] = Array.isArray(j.items) ? j.items : [];
  const every = Math.max(1, Number(j.every) || 2);
  const n = daysBetween(String(j.start || day), day);
  if (!items.length || n < 0) return { posted: false, why: "not started yet" };
  if (n % every !== 0) return { posted: false, why: "not today (every " + every + " days)" };
  const idx = Math.floor(n / every) % items.length;
  const text = String(items[idx] || "").trim();
  if (!text) return { posted: false, why: "empty line " + (idx + 1) };
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", HOUSE).maybeSingle();
  if (!m) return { posted: false, error: "the house account is not on the Porch yet" };
  const { data: had } = await admin.from("porch_posts").select("id").eq("user_id", m.user_id)
    .eq("body", text).gte("created_at", since20h()).limit(1);
  if (had && had.length) return { posted: false, why: "today's moment is already up", number: idx + 1 };
  const style = (idx * 7 + 11) % CARD_STYLES;                 // a different card each time
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: text, photo_paths: [], card_style: text.length <= 200 ? style : null }).select("id").single();
  if (error) return { posted: false, error: error.message };
  return { posted: true, number: idx + 1, card: style, post_id: post.id };
}

/* ---- the reels: the upload doors (Mike's computer only, with HOUSE_KEY) ---- */
async function reelDoor(b: Record<string, any>) {
  if (!HOUSE_KEY || String(b.key || "") !== HOUSE_KEY) return json({ ok: false, error: "wrong upload password" }, 403);
  if (!BUNNY_KEY || !BUNNY_LIB) return json({ ok: false, error: "the video host isn't set up on the server" }, 500);
  if (b.action === "reel_status") {
    const { data } = await admin.from("porch_house_reels").select("status");
    const c: Record<string, number> = {}; (data || []).forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
    return json({ ok: true, counts: c });
  }
  const n = Number(b.n);
  if (!Number.isInteger(n) || n < 1 || n > 9999) return json({ ok: false, error: "which reel?" }, 400);
  const { data: row } = await admin.from("porch_house_reels").select("*").eq("n", n).maybeSingle();
  if (b.action === "reel_uploaded") {
    if (!row) return json({ ok: false, error: "no slot for reel " + n }, 404);
    if (row.status === "uploading") await admin.from("porch_house_reels").update({ status: "queued" }).eq("n", n);
    return json({ ok: true, status: row.status === "uploading" ? "queued" : row.status });
  }
  if (b.action === "reel_slot") {
    if (row && row.status !== "uploading") return json({ ok: true, skip: true, status: row.status });
    let guid = row ? String(row.video_guid) : "";
    if (!guid) {
      const made = await bunny("/videos", { method: "POST", body: JSON.stringify({ title: `house reel ${String(n).padStart(3, "0")} ${String(b.title || "").slice(0, 60)}` }) });
      if (!made.ok) return json({ ok: false, error: "the video host said no (" + made.status + ")" }, 502);
      guid = String((await made.json()).guid || "");
      if (!guid) return json({ ok: false, error: "the video host gave no id" }, 502);
      const { error } = await admin.from("porch_house_reels").insert({ n, video_guid: guid, title: String(b.title || "").slice(0, 120) || null, caption: String(b.caption || "").slice(0, 500) || null });
      if (error) { try { await bunny(`/videos/${guid}`, { method: "DELETE" }); } catch { /* fine */ } return json({ ok: false, error: error.message }, 500); }
    }
    const expire = Math.floor(Date.now() / 1000) + 6 * 3600;
    return json({ ok: true, guid, library: BUNNY_LIB, expire, signature: await sha256Hex(`${BUNNY_LIB}${BUNNY_KEY}${expire}${guid}`) });
  }
  return json({ ok: false, error: "unknown" }, 400);
}

/* ---- the reels: publishing ---- */
async function publishReel(row: any, userId: string, when: Date) {
  const r = await bunny(`/videos/${row.video_guid}`);
  if (!r.ok) return "the video host didn't answer";
  const v = await r.json();
  if (Number(v.status) === 5 || Number(v.status) === 6) { await admin.from("porch_house_reels").update({ status: "failed" }).eq("n", row.n); return "failed on the video host"; }
  if (Number(v.status) !== 4) return "still being processed";
  const iso = when.toISOString();
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: userId, need: "moment", body: row.caption || null, created_at: iso }).select("id").single();
  if (error || !post) return error ? error.message : "no share";
  const { data: spin, error: e2 } = await admin.from("porch_spins").insert({
    user_id: userId, post_id: post.id, video_guid: row.video_guid, caption: row.caption || null, status: "ready",
    length_s: Number(v.length) || null, width: Number(v.width) || null, height: Number(v.height) || null,
    resolutions: String(v.availableResolutions || "") || null,
    created_at: iso, expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(),      // house Spins stay
  }).select("id").single();
  if (e2 || !spin) { await admin.from("porch_posts").delete().eq("id", post.id); return e2 ? e2.message : "no spin"; }
  await admin.from("porch_house_reels").update({ status: "posted", spin_id: spin.id, posted_at: new Date().toISOString() }).eq("n", row.n);
  return "";
}
async function reels(hour: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", PRAYER_HOUSE).maybeSingle();
  if (!m) return { posted: 0, error: "spiritualmisfit is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").order("n", { ascending: true });
  if (error) return { posted: 0, why: "no reel list yet" };
  const done = (all || []).filter((r: any) => r.status === "posted");
  const queue = (all || []).filter((r: any) => r.status === "queued");
  if (!queue.length) return { posted: 0, why: done.length ? "they have all run" : "none waiting", total: done.length };
  const out: any = { posted: 0, numbers: [] as number[], waiting: queue.length };
  if (done.length < REEL_BACKLOG) {
    /* the first six: one a day going back, the newest dated now */
    for (const row of queue.slice(0, REEL_BACKLOG - done.length)) {
      const slot = done.length + out.posted;
      const why = await publishReel(row, m.user_id, new Date(Date.now() - (REEL_BACKLOG - 1 - slot) * 86400000));
      if (why) { out.why = "reel " + row.n + ": " + why; break; }
      out.posted++; out.numbers.push(row.n);
    }
  } else {
    if (hour < REEL_HOUR) return { posted: 0, why: "before 5pm Eastern", waiting: queue.length };
    const last = Math.max(...done.map((r: any) => Date.parse(r.posted_at || 0) || 0));
    if (Date.now() - last < 40 * 3600 * 1000) return { posted: 0, why: "not today (every other day)", waiting: queue.length };
    const why = await publishReel(queue[0], m.user_id, new Date());
    if (why) out.why = "reel " + queue[0].n + ": " + why; else { out.posted = 1; out.numbers.push(queue[0].n); }
  }
  out.waiting = queue.length - out.posted;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* the timer sends nothing */ }
  if (typeof body.action === "string" && body.action.indexOf("reel_") === 0) {
    try { return await reelDoor(body); } catch (e) { return json({ ok: false, error: String((e as Error).message || e) }, 500); }
  }
  try {
    const { day, hour } = eastern();
    const out: Record<string, unknown> = { ok: true, day };
    try { out.meme = await meme(day, hour); } catch (e) { out.meme = { posted: false, error: String((e as Error).message || e) }; }
    try { out.prayer = await prayer(day, hour); } catch (e) { out.prayer = { posted: false, error: String((e as Error).message || e) }; }
    try { out.moment = await moment(day, hour); } catch (e) { out.moment = { posted: false, error: String((e as Error).message || e) }; }
    try { out.reels = await reels(hour); } catch (e) { out.reels = { posted: 0, error: String((e as Error).message || e) }; }
    return json(out);
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e) }, 500);
  }
});

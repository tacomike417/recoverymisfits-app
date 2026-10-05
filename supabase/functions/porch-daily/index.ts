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
 * TWO MORE LISTS (2 Oct 2026, Mike).
 *  - shitmysponsorsays: 200 lines on the yellow legal pad card. Ten to start, then two
 *    days on and one day off, 7am Eastern (/data/sponsor.json).
 *  - spiritualmisfit: picture memes. Five to start, then one a day at noon Eastern
 *    (/data/spiritual-memes.json, pictures in /assets/house/spiritualmisfit/).
 * Both run through runList(): it looks at what the account has already shared, so nothing
 * repeats and nothing needs counting. The starting batch is dated one a day going back.
 *
 * ANOTHER DAY SOBER (2 Oct 2026, Mike). The account anotherdaysober posts the question
 * that ends the day's reading, as a picture made to match the reading page, "every single
 * morning at 4 a.m.", with a link to that day's reading under it. "Backlog the last 25
 * days or so": it fills in any of the last 25 days that are missing, each dated its own
 * morning, so a missed morning catches itself up. /data/ads-questions.json has the links;
 * the pictures are /assets/house/anotherdaysober/MM-DD.webp.
 *
 * THE LEDGER (3 Oct 2026, Mike: "the one I edited ... it shot out the original one from
 * yesterday"). The jobs used to decide "did this one go up yet?" by looking for a share with
 * the same words. Edit the words and it looked like it never went up, so it went up again.
 * Now every share a job makes is written down in porch_house_posted (supabase/
 * porch_38_house_ledger.sql), and that list is what the jobs go by. Edit or delete a house
 * share all you like: it never comes back. Until that SQL is run, the old way still works.
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
const MISFIT_SPINS_FROM = 1001;             // recoverymisfits' own Spins are numbered from here up
const MISFIT_SPIN_HOUR = 16, MISFIT_SPIN_MIN = 17;   // 4:17pm Eastern, every other day
const MISFIT_DAILY_FROM = 2001;             // the dated batch (one a morning, each on its own day) is numbered from here
const MISFIT_DAILY_HOUR = 4, MISFIT_DAILY_MIN = 17;  // 4:17am Eastern
const STARK = "starkrecovery";              // the Stark Recovery resources account
const STARK_FROM = 3001;                    // its Spins are numbered from here up
const STARK_BACKLOG = 3;                    // how many go up to start
const MATT = "welcomematt";                 // the greeter robot
const MATT_FROM = 4001;                     // his pinned Spins are numbered from here up
const HYDE = "realmrhyde";                 // the Original Manuscript shorts account (4 Oct 2026)
const HYDE_FROM = 5001;                     // its Spins are numbered from here up
const STARK_HOUR = 7;                       // then one every 3 days, at the first knock after 7am Eastern
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
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: new Date().getUTCMinutes() };   // Eastern is a whole number of hours off, so the minute is the same
}

/* ---- the ledger: what each house account has already put up ---- */
async function ledger(handle: string, list: string): Promise<Map<string, string> | null> {
  const { data, error } = await admin.from("porch_house_posted").select("key, at").eq("handle", handle).eq("list", list).limit(5000);
  if (error) return null;                                     // the table isn't there yet: fall back to the old way
  return new Map((data || []).map((r: any) => [String(r.key), String(r.at)]));
}
async function mark(handle: string, list: string, key: string, at: string) {
  try { await admin.from("porch_house_posted").upsert({ handle, list, key, at }, { onConflict: "handle,list,key", ignoreDuplicates: true }); } catch { /* fine */ }
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
  const led = await ledger(HOUSE, "meme");
  if ((led && led.has(day)) || (had && had.length)) { if (led && !led.has(day)) await mark(HOUSE, "meme", day, new Date().toISOString()); return { posted: false, why: "today's meme is already up", meme: file }; }
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: "Meme of the Day", photo_paths: [path] }).select("id").single();
  if (error) return { posted: false, error: error.message };
  await mark(HOUSE, "meme", day, new Date().toISOString());
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
  const led = await ledger(PRAYER_HOUSE, "prayer");
  if ((led && led.has(day)) || (had && had.length)) { if (led && !led.has(day)) await mark(PRAYER_HOUSE, "prayer", day, new Date().toISOString()); return { posted: false, why: "today's prayer is already up" }; }
  /* a mix of the backgrounds: a different card every day, every one before any repeats */
  const [, mo, dd] = day.split("-").map(Number);
  const dayOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][mo - 1] + dd;
  const style = (dayOfYear * 5 + 3) % CARD_STYLES;
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: text, photo_paths: [], card_style: style }).select("id").single();
  if (error) return { posted: false, error: error.message };
  await mark(PRAYER_HOUSE, "prayer", day, new Date().toISOString());
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
  const led = await ledger(HOUSE, "moment");
  if ((led && led.has(day)) || (had && had.length)) { if (led && !led.has(day)) await mark(HOUSE, "moment", day, new Date().toISOString()); return { posted: false, why: "today's moment is already up", number: idx + 1 }; }
  const style = (idx * 7 + 11) % CARD_STYLES;                 // a different card each time
  const { data: post, error } = await admin.from("porch_posts")
    .insert({ user_id: m.user_id, need: "talk", body: text, photo_paths: [], card_style: text.length <= 200 ? style : null }).select("id").single();
  if (error) return { posted: false, error: error.message };
  await mark(HOUSE, "moment", day, new Date().toISOString());
  return { posted: true, number: idx + 1, card: style, post_id: post.id };
}

/* ---- the reels: the upload doors (Mike's computer only, with HOUSE_KEY) ---- */
async function reelDoor(b: Record<string, any>) {
  if (!HOUSE_KEY || String(b.key || "") !== HOUSE_KEY) return json({ ok: false, error: "wrong upload password" }, 403);
  if (!BUNNY_KEY || !BUNNY_LIB) return json({ ok: false, error: "the video host isn't set up on the server" }, 500);
  if (b.action === "reel_status") {
    const { data } = await admin.from("porch_house_reels").select("status").gte("n", Number(b.from) || 0).lte("n", Number(b.to) || 9999);
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
      const rowIn: Record<string, unknown> = { n, video_guid: guid, title: String(b.title || "").slice(0, 120) || null, caption: String(b.caption || "").slice(0, 500) || null };
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(b.post_on || ""))) rowIn.post_on = String(b.post_on);      // a Spin with its own day (porch_44)
      const { error } = await admin.from("porch_house_reels").insert(rowIn);
      if (error) { try { await bunny(`/videos/${guid}`, { method: "DELETE" }); } catch { /* fine */ } return json({ ok: false, error: error.message }, 500); }
    }
    const expire = Math.floor(Date.now() / 1000) + 6 * 3600;
    return json({ ok: true, guid, library: BUNNY_LIB, expire, signature: await sha256Hex(`${BUNNY_LIB}${BUNNY_KEY}${expire}${guid}`) });
  }
  return json({ ok: false, error: "unknown" }, 400);
}

/* ---- the reels: publishing ---- */
async function publishReel(row: any, userId: string, when: Date, pinned = false) {
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
    ...(pinned ? { pinned: true } : {}),
  }).select("id").single();
  if (e2 || !spin) { await admin.from("porch_posts").delete().eq("id", post.id); return e2 ? e2.message : "no spin"; }
  await admin.from("porch_house_reels").update({ status: "posted", spin_id: spin.id, posted_at: new Date().toISOString() }).eq("n", row.n);
  return "";
}
async function reels(hour: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", PRAYER_HOUSE).maybeSingle();
  if (!m) return { posted: 0, error: "spiritualmisfit is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").lt("n", MISFIT_SPINS_FROM).order("n", { ascending: true });
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

/* ---- a list that runs once through, with a starting batch ---- */
type ListItem = { key: string; row: Record<string, unknown> };
async function runList(list: string, handle: string, items: ListItem[], keyOf: (p: any) => string, backlog: number, due: boolean, notDue: string, hour: number, dueHour: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", handle).maybeSingle();
  if (!m) return { posted: 0, error: handle + " is not on the Porch yet" };
  const { data: mine } = await admin.from("porch_posts").select("body, photo_paths, created_at").eq("user_id", m.user_id)
    .order("created_at", { ascending: false }).limit(1000);
  const keys = new Set(items.map((i) => i.key));
  const had = (mine || []).filter((p: any) => keys.has(keyOf(p)));
  /* what has gone up: the ledger if it's there, else (the old way) whatever still matches word for word */
  let led = await ledger(handle, list);
  if (led && !led.size) {
    /* first time with the ledger: these run in order, so everything up to the furthest one
       still on the Porch has gone up, including any that were edited or deleted since */
    const when = new Map<string, string>(); had.forEach((p: any) => { if (!when.has(keyOf(p))) when.set(keyOf(p), String(p.created_at)); });
    let far = -1; items.forEach((it, n) => { if (when.has(it.key)) far = n; });
    for (let n = 0; n <= far; n++) { const at = when.get(items[n].key) || "2000-01-01T00:00:00Z"; await mark(handle, list, items[n].key, at); led.set(items[n].key, at); }
  }
  const have = led ? new Set(led.keys()) : new Set(had.map(keyOf));
  const times = led ? [...led.values()].map((t) => Date.parse(t)) : had.map((p: any) => Date.parse(p.created_at));
  const left = items.filter((i) => !have.has(i.key));
  const done = items.length - left.length;
  if (!left.length) return { posted: 0, why: "they have all run", total: done };
  const put = async (it: ListItem, when: Date) => {
    const error = (await admin.from("porch_posts").insert({ user_id: m.user_id, need: "talk", photo_paths: [], ...it.row, created_at: when.toISOString() })).error;
    if (!error) await mark(handle, list, it.key, when.toISOString());
    return error;
  };
  let posted = 0;
  if (done < backlog) {
    /* the starting batch: one a day going back, the newest dated now */
    for (const it of left.slice(0, backlog - done)) {
      const err = await put(it, new Date(Date.now() - (backlog - 1 - (done + posted)) * 86400000));
      if (err) return { posted, error: err.message };
      posted++;
    }
    return { posted, waiting: left.length - posted, starting: true };
  }
  if (!due) return { posted: 0, why: notDue, waiting: left.length };
  /* "already up today" means since today's posting hour, so last night's starting batch
     doesn't make the first morning skip */
  const sinceDue = Date.now() - (Math.max(0, hour - dueHour) + 1) * 3600 * 1000;
  if (times.some((t) => t > sinceDue)) return { posted: 0, why: "today's is already up", waiting: left.length };
  const err = await put(left[0], new Date());
  if (err) return { posted: 0, error: err.message };
  return { posted: 1, number: done + 1, waiting: left.length - 1 };
}

async function sponsor(day: string, hour: number) {
  const r = await fetch(SITE + "/data/sponsor.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: 0, error: "could not read the sponsor lines (" + r.status + ")" };
  const j = await r.json();
  const card = Number.isInteger(j.card) ? j.card : 10;                       // the yellow legal pad
  const items: ListItem[] = (Array.isArray(j.items) ? j.items : []).map((t: string) => String(t || "").trim()).filter(Boolean)
    .map((t: string) => ({ key: t, row: { body: t, card_style: t.length <= 200 ? card : null } }));
  const n = daysBetween(String(j.start || day), day);
  const off = ((n % 3) + 3) % 3 === 2;                                        // two days on, one day off
  return await runList("sponsor", "shitmysponsorsays", items, (p) => String(p.body || ""), 10, hour >= 7 && !off, off ? "day off (two on, one off)" : "before 7am Eastern", hour, 7);
}

async function spiritualMemes(hour: number) {
  const r = await fetch(SITE + "/data/spiritual-memes.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: 0, error: "could not read the meme list (" + r.status + ")" };
  const j = await r.json();
  const items: ListItem[] = (Array.isArray(j.items) ? j.items : []).filter((x: any) => /^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(String(x.file || "")))
    .map((x: any) => { const path = "/assets/house/spiritualmisfit/" + x.file; return { key: path, row: { body: null, photo_paths: [path] } }; });
  return await runList("spiritual_memes", PRAYER_HOUSE, items, (p) => String((p.photo_paths || [])[0] || ""), 5, hour >= 12, "before noon Eastern", hour, 12);
}

async function ads(day: string, hour: number) {
  const r = await fetch(SITE + "/data/ads-questions.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: 0, error: "could not read the question list (" + r.status + ")" };
  const j = await r.json();
  const days = j.days || {};
  const H = Number.isInteger(j.hour) ? j.hour : 4;
  const back = Math.min(60, Math.max(1, Number(j.backlog) || 25));
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", "anotherdaysober").maybeSingle();
  if (!m) return { posted: 0, error: "anotherdaysober is not on the Porch yet" };
  const { data: mine } = await admin.from("porch_posts").select("photo_paths").eq("user_id", m.user_id)
    .gte("created_at", new Date(Date.now() - (back + 20) * 86400000).toISOString()).limit(1000);
  const have = new Set((mine || []).map((p: any) => String((p.photo_paths || [])[0] || "")));
  const led = await ledger("anotherdaysober", "ads");          // by date, so a deleted one stays deleted
  const shift = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
  let posted = 0; const put: string[] = [];
  for (let n = back - 1; n >= 0; n--) {
    if (n === 0 && hour < H) break;                                   // today's waits for 4am
    const d = shift(day, -n);
    let md = d.slice(5); if (!days[md] && md === "02-29") md = "02-28";
    const it = days[md]; if (!it || !/^\/another-day-sober\/[\w\/-]+$/.test(String(it.link || ""))) continue;
    const path = "/assets/house/anotherdaysober/" + md + ".webp";
    if (led && led.has(d)) continue;
    if (have.has(path)) { if (led) await mark("anotherdaysober", "ads", d, d + "T08:00:00Z"); continue; }
    const { error } = await admin.from("porch_posts").insert({ user_id: m.user_id, need: "talk",
      body: "The full reading: " + SITE + it.link, photo_paths: [path],
      created_at: n === 0 ? new Date().toISOString() : d + "T08:00:00Z" });      // older days are dated their own morning
    if (error) return { posted, error: error.message };
    await mark("anotherdaysober", "ads", d, new Date().toISOString());
    have.add(path); posted++; put.push(md);
  }
  return posted ? { posted, days: put } : { posted: 0, why: hour < H ? "before 4am Eastern" : "today's is already up" };
}

/* THE RECOVERY MISFITS SPINS (3 Oct 2026, Mike: "25-40 sober spins that belong to the
 * recoverymisfits account ... post one every other day around 4:17pm"). Same waiting list as
 * the reels (porch_house_reels); these are numbered from 1001 up so the two lists can't mix.
 * No starting batch: the first one goes up at the next 4:17pm Eastern, then one every other
 * day until they run out. Uploaded once from Mike's computer by scripts/upload_misfit_spins.py.
 * A timer knocks at :17 for this (supabase/porch_42_spins_417.sql); the hourly knocks after
 * 4:17 catch it up if that one is missed. */
async function misfitSpins(hour: number, minute: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", HOUSE).maybeSingle();
  if (!m) return { posted: 0, error: "recoverymisfits is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").gte("n", MISFIT_SPINS_FROM).lt("n", MISFIT_DAILY_FROM).order("n", { ascending: true });
  if (error) return { posted: 0, why: "no list yet" };
  const done = (all || []).filter((r: any) => r.status === "posted");
  const queue = (all || []).filter((r: any) => r.status === "queued");
  if (!queue.length) return { posted: 0, why: done.length ? "they have all run" : "none waiting", total: done.length };
  if (hour < MISFIT_SPIN_HOUR || (hour === MISFIT_SPIN_HOUR && minute < MISFIT_SPIN_MIN)) return { posted: 0, why: "before 4:17pm Eastern", waiting: queue.length };
  if (done.length) {
    const last = Math.max(...done.map((r: any) => Date.parse(r.posted_at || 0) || 0));
    if (Date.now() - last < 40 * 3600 * 1000) return { posted: 0, why: "not today (every other day)", waiting: queue.length };
  }
  const why = await publishReel(queue[0], m.user_id, new Date());
  if (why) return { posted: 0, why: "spin " + queue[0].n + ": " + why, waiting: queue.length };
  return { posted: 1, numbers: [queue[0].n], waiting: queue.length - 1 };
}

/* THE DATED BATCH (3 Oct 2026, Mike: "I want to post one a day with the date ones on the right
 * date ... this batch is independent of that ... have them post in the morning at 4:17am, I'll
 * catch 'em then"). 19 Spins, 4 Oct to 22 Oct, each with its own day written on its row (post_on):
 * the countdown to the Porch opening lands on the right mornings, and Mike shares each one out
 * to Facebook and Instagram from the Porch. This runs alongside the every-other-day afternoon
 * line and never touches it. A Spin only goes up ON its day, at or after 4:17am Eastern; if a
 * whole day is somehow missed it is left waiting and reported here as "missed", because
 * "Tomorrow. The Porch opens." a day late would be wrong. */
async function misfitDaily(day: string, hour: number, minute: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", HOUSE).maybeSingle();
  if (!m) return { posted: 0, error: "recoverymisfits is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").gte("n", MISFIT_DAILY_FROM).lt("n", STARK_FROM).order("n", { ascending: true });
  if (error) return { posted: 0, why: "no list yet" };
  const queue = (all || []).filter((r: any) => r.status === "queued" && r.post_on);
  if (!queue.length) return { posted: 0, why: (all || []).length ? "they have all run" : "none waiting" };
  const missed = queue.filter((r: any) => String(r.post_on) < day).map((r: any) => r.n);
  const todays = queue.filter((r: any) => String(r.post_on) === day);
  const out: any = { posted: 0, waiting: queue.length };
  if (missed.length) out.missed = missed;
  if (!todays.length) { out.why = "nothing dated today"; return out; }
  if (hour < MISFIT_DAILY_HOUR || (hour === MISFIT_DAILY_HOUR && minute < MISFIT_DAILY_MIN)) { out.why = "before 4:17am Eastern"; return out; }
  const why = await publishReel(todays[0], m.user_id, new Date());
  if (why) { out.why = "spin " + todays[0].n + ": " + why; return out; }
  out.posted = 1; out.numbers = [todays[0].n]; out.waiting = queue.length - 1;
  return out;
}

/* STARK RECOVERY (4 Oct 2026, Mike: "post a spin ... on resources for guys getting sober and back
 * out in the world ... backlog 3 of them, then post one every 3 days"). 18 plain how-to Spins
 * (resume, cover letter, ID, food, the bus, a doctor ...), numbered 3001 and up, posted from the
 * starkrecovery account. The first three go up at once, dated three days apart going back so the
 * profile is not empty; after that, one every 3 days in the morning until they run out. */
async function starkSpins(hour: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", STARK).maybeSingle();
  if (!m) return { posted: 0, error: "starkrecovery is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").gte("n", STARK_FROM).lt("n", STARK_FROM + 1000).order("n", { ascending: true });
  if (error) return { posted: 0, why: "no list yet" };
  const done = (all || []).filter((r: any) => r.status === "posted");
  const queue = (all || []).filter((r: any) => r.status === "queued");
  if (!queue.length) return { posted: 0, why: done.length ? "they have all run" : "none waiting", total: done.length };
  const out: any = { posted: 0, numbers: [] as number[], waiting: queue.length };
  if (done.length < STARK_BACKLOG) {
    for (const row of queue.slice(0, STARK_BACKLOG - done.length)) {
      const slot = done.length + out.posted;
      const why = await publishReel(row, m.user_id, new Date(Date.now() - (STARK_BACKLOG - 1 - slot) * 3 * 86400000));
      if (why) { out.why = "spin " + row.n + ": " + why; break; }
      out.posted++; out.numbers.push(row.n);
    }
    out.waiting = queue.length - out.posted;
    return out;
  }
  if (hour < STARK_HOUR) { out.why = "before 7am Eastern"; return out; }
  const last = Math.max(...done.map((r: any) => Date.parse(r.posted_at || 0) || 0));
  if (Date.now() - last < 68 * 3600 * 1000) { out.why = "not today (every 3 days)"; return out; }
  const why = await publishReel(queue[0], m.user_id, new Date());
  if (why) { out.why = "spin " + queue[0].n + ": " + why; return out; }
  return { posted: 1, numbers: [queue[0].n], waiting: queue.length - 1 };
}

/* REALMRHYDE (4 Oct 2026, Mike: "set up your auto poster for realmrhyde and have them shoot out every morning at
 * 6:13am"). The Original Manuscript shorts: one Spin a day from the realmrhyde account, at the first knock at or
 * after 6:13am Eastern (porch_57 adds a knock at exactly 6:13). Never two in one day. Numbered 5001 and up, posted
 * in order until they run out; new ones are added at the END. No backlog: the first one goes up the next morning. */
async function hydeSpins(day: string, hour: number, minute: number) {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", HYDE).maybeSingle();
  if (!m) return { posted: 0, error: "realmrhyde is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").gte("n", HYDE_FROM).lt("n", HYDE_FROM + 1000).order("n", { ascending: true });
  if (error) return { posted: 0, why: "no list yet" };
  const done = (all || []).filter((r: any) => r.status === "posted");
  const queue = (all || []).filter((r: any) => r.status === "queued");
  if (!queue.length) return { posted: 0, why: done.length ? "they have all run" : "none waiting", total: done.length };
  if (hour < 6 || (hour === 6 && minute < 13)) return { posted: 0, why: "before 6:13am Eastern", waiting: queue.length };
  if (hour >= 12) return { posted: 0, why: "missed this morning, tomorrow then", waiting: queue.length };
  const easternDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  if (done.some((r: any) => r.posted_at && easternDay(r.posted_at) === day)) return { posted: 0, why: "today's is already up", waiting: queue.length };
  const why = await publishReel(queue[0], m.user_id, new Date());
  if (why) return { posted: 0, why: "spin " + queue[0].n + ": " + why, waiting: queue.length };
  return { posted: 1, numbers: [queue[0].n], waiting: queue.length - 1 };
}

/* SOBER RIOT (4 Oct 2026, Mike: "big rock and roll look at me style recovery group with simple
 * powerful memes that post a few times a day"). The soberriot account posts picture memes ON THE
 * PORCH (everybody sees them), each one tagged with the SOBER RIOT group so the button under it
 * leads there. The list is /data/sober-riot.json, the pictures are in /assets/house/soberriot/memes/.
 *   - the first three go up at once, dated a day apart going back
 *   - after that: up to 3 a day, between 7am and 9pm Eastern, at least 4 and a half hours apart
 *   - each runs once, in the order of the list; new ones are added at the END */
const RIOT = "soberriot";
const RIOT_PER_DAY = 3;
async function soberRiot(day: string, hour: number) {
  const r = await fetch(SITE + "/data/sober-riot.json", { headers: { "cache-control": "no-cache" } });
  if (!r.ok) return { posted: 0, error: "could not read the meme list (" + r.status + ")" };
  const j = await r.json();
  const items = (Array.isArray(j.items) ? j.items : []).filter((x: any) => /^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(String(x.file || "")));
  if (!items.length) return { posted: 0, why: "no memes on the list yet" };
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", RIOT).maybeSingle();
  if (!m) return { posted: 0, error: "soberriot is not on the Porch yet" };
  const { data: g } = await admin.from("porch_groups").select("id, status").eq("slug", "sober-riot").eq("status", "open").maybeSingle();
  const led = await ledger(RIOT, "riot");
  if (!led) return { posted: 0, error: "no ledger" };
  const left = items.filter((x: any) => !led.has(String(x.file)));
  if (!left.length) return { posted: 0, why: "they have all run", total: led.size };
  const put = async (it: any, when: Date) => {
    const { error } = await admin.from("porch_posts").insert({
      user_id: m.user_id, need: "talk", body: String(it.words || "").slice(0, 300) || null,
      photo_paths: ["/assets/house/soberriot/memes/" + it.file], created_at: when.toISOString(),
      ...(g ? { tag_group_id: g.id } : {}),
    });
    if (!error) await mark(RIOT, "riot", String(it.file), when.toISOString());
    return error;
  };
  if (!led.size) {
    let posted = 0;
    for (const it of left.slice(0, 3)) {
      const err = await put(it, new Date(Date.now() - (2 - posted) * 86400000));
      if (err) return { posted, error: err.message };
      posted++;
    }
    return { posted, waiting: left.length - posted, starting: true };
  }
  if (hour < 7 || hour > 21) return { posted: 0, why: "quiet hours", waiting: left.length };
  const times = [...led.values()].map((t) => Date.parse(t)).filter((t) => t <= Date.now() + 60000);
  const dayOf = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(t));
  const today = times.filter((t) => dayOf(t) === day).length;
  if (today >= RIOT_PER_DAY) return { posted: 0, why: "today's " + RIOT_PER_DAY + " are up", waiting: left.length };
  const last = Math.max(...times);
  if (Date.now() - last < 4.5 * 3600 * 1000) return { posted: 0, why: "too soon after the last one", waiting: left.length };
  const err = await put(left[0], new Date());
  if (err) return { posted: 0, error: err.message };
  return { posted: 1, file: left[0].file, waiting: left.length - 1 };
}

/* WELCOME MATT'S PINNED SPINS (4 Oct 2026, Mike: "i want to make three spins for welcome matt ...
 * i am going to pin the three up on his profile"). Numbered 4001 and up. Every one that is waiting
 * goes up at the next knock, already pinned, dated a day apart going back so they don't pile up
 * at the top of the Porch. Three is all a profile can pin. */
async function mattSpins() {
  const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", MATT).maybeSingle();
  if (!m) return { posted: 0, error: "welcomematt is not on the Porch yet" };
  const { data: all, error } = await admin.from("porch_house_reels").select("*").gte("n", MATT_FROM).lt("n", MATT_FROM + 1000).order("n", { ascending: true });
  if (error) return { posted: 0, why: "no list yet" };
  const done = (all || []).filter((r: any) => r.status === "posted");
  const queue = (all || []).filter((r: any) => r.status === "queued").slice(0, Math.max(0, 3 - done.length));
  if (!queue.length) return { posted: 0, why: done.length ? "they are all up" : "none waiting", total: done.length };
  const out: any = { posted: 0, numbers: [] as number[] };
  for (const row of queue) {
    const back = queue.length - 1 - queue.indexOf(row);
    const why = await publishReel(row, m.user_id, new Date(Date.now() - back * 86400000), true);
    if (why) { out.why = "spin " + row.n + ": " + why; break; }
    out.posted++; out.numbers.push(row.n);
  }
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
    const { day, hour, minute } = eastern();
    const out: Record<string, unknown> = { ok: true, day };
    try { out.meme = await meme(day, hour); } catch (e) { out.meme = { posted: false, error: String((e as Error).message || e) }; }
    try { out.prayer = await prayer(day, hour); } catch (e) { out.prayer = { posted: false, error: String((e as Error).message || e) }; }
    try { out.moment = await moment(day, hour); } catch (e) { out.moment = { posted: false, error: String((e as Error).message || e) }; }
    try { out.reels = await reels(hour); } catch (e) { out.reels = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.misfit_spins = await misfitSpins(hour, minute); } catch (e) { out.misfit_spins = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.misfit_daily = await misfitDaily(day, hour, minute); } catch (e) { out.misfit_daily = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.stark = await starkSpins(hour); } catch (e) { out.stark = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.sober_riot = await soberRiot(day, hour); } catch (e) { out.sober_riot = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.hyde = await hydeSpins(day, hour, minute); } catch (e) { out.hyde = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.matt = await mattSpins(); } catch (e) { out.matt = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.sponsor = await sponsor(day, hour); } catch (e) { out.sponsor = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.another_day_sober = await ads(day, hour); } catch (e) { out.another_day_sober = { posted: 0, error: String((e as Error).message || e) }; }
    try { out.spiritual_memes = await spiritualMemes(hour); } catch (e) { out.spiritual_memes = { posted: 0, error: String((e as Error).message || e) }; }
    return json(out);
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e) }, 500);
  }
});

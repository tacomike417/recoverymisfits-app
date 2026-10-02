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
 * Deploy:
 *   npx supabase functions deploy porch-daily --no-verify-jwt --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const HOUSE = "recoverymisfits";
const SITE = "https://recoverymisfits.org";
const START_HOUR = 6;                       // the meme: 6am Eastern
const PRAYER_HOUSE = "spiritualmisfit";
const PRAYER_HOUR = 7;                      // the prayer: 7am Eastern
const CARD_STYLES = 19;                     // the saying-card backgrounds in feed/porch.html
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  try {
    const { day, hour } = eastern();
    const out: Record<string, unknown> = { ok: true, day };
    try { out.meme = await meme(day, hour); } catch (e) { out.meme = { posted: false, error: String((e as Error).message || e) }; }
    try { out.prayer = await prayer(day, hour); } catch (e) { out.prayer = { posted: false, error: String((e as Error).message || e) }; }
    return json(out);
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e) }, 500);
  }
});

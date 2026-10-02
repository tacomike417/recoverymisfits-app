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
 * Deploy:
 *   npx supabase functions deploy porch-daily --no-verify-jwt --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const HOUSE = "recoverymisfits";
const SITE = "https://recoverymisfits.org";
const START_HOUR = 6;                       // 6am Eastern
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  try {
    const { day, hour } = eastern();
    if (hour < START_HOUR) return json({ ok: true, posted: false, why: "before 6am Eastern" });

    const r = await fetch(SITE + "/data/meme-days.json", { headers: { "cache-control": "no-cache" } });
    if (!r.ok) return json({ ok: false, error: "could not read the meme schedule (" + r.status + ")" }, 502);
    const file = ((await r.json()).days || {})[day];
    if (!file || !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(file)) return json({ ok: true, posted: false, why: "no meme on the schedule for " + day });
    const path = "/assets/memes/" + file;

    const { data: m } = await admin.from("porch_members").select("user_id, frozen_at").eq("handle", HOUSE).maybeSingle();
    if (!m) return json({ ok: false, error: "the house account is not on the Porch yet" }, 500);

    /* once a day: the same picture from the house account in the last 20 hours means it's done */
    const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
    const { data: had } = await admin.from("porch_posts").select("id").eq("user_id", m.user_id)
      .contains("photo_paths", [path]).gte("created_at", since).limit(1);
    if (had && had.length) return json({ ok: true, posted: false, why: "today's meme is already up", meme: file });

    const { data: post, error } = await admin.from("porch_posts")
      .insert({ user_id: m.user_id, need: "talk", body: "Meme of the Day", photo_paths: [path] }).select("id").single();
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, posted: true, meme: file, day, post_id: post.id });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e) }, 500);
  }
});

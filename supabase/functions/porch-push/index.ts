/* PHONE NOTIFICATIONS FOR THE PORCH (30 Sep 2026, Mike).
 *
 * Two jobs:
 *   GET  (from the app)       -> { key }  the public push key the phone needs to sign up
 *   POST (from the database)  { note_id }  sends that notification to every phone the
 *                                           person turned notifications on for
 *
 * Nothing to set up by hand: the first time it runs it makes its own push keys and
 * keeps them in porch_settings. The database proves it's the one calling with the
 * push_secret that step 7 made. Phones that are gone (uninstalled, turned off) are
 * cleaned out automatically.
 *
 * iPhone: only works when Recovery Misfits is on the Home Screen (iOS 16.4 and up).
 *
 * Deploy (no login check: the database and the app both call it):
 *   npx supabase functions deploy porch-push --no-verify-jwt --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } });

async function setting(key: string) {
  const { data } = await admin.from("porch_settings").select("value").eq("key", key).maybeSingle();
  return data?.value as string | undefined;
}
let keys: { pub: string; priv: string } | null = null;
async function vapid() {
  if (keys) return keys;
  let pub = await setting("vapid_public"), priv = await setting("vapid_private");
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    // first one in wins, so two cold starts can't end up with different keys
    await admin.from("porch_settings").upsert([{ key: "vapid_public", value: k.publicKey }, { key: "vapid_private", value: k.privateKey }],
      { onConflict: "key", ignoreDuplicates: true });
    pub = await setting("vapid_public"); priv = await setting("vapid_private");
  }
  keys = { pub: pub!, priv: priv! };
  webpush.setVapidDetails("https://recoverymisfits.org", keys.pub, keys.priv);
  return keys;
}

const WORDS: Record<string, string> = {
  comment: "commented on your share", reply: "replied to your comment", proud: "is proud of you",
  metoo: "said Me too", mention: "tagged you", follow: "started following you", report: "was reported. Take a look.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") return json({ key: (await vapid()).pub });
  if (req.method !== "POST") return json({ error: "no" }, 405);

  const secret = await setting("push_secret");
  if (!secret || req.headers.get("x-porch-secret") !== secret) return json({ error: "no" }, 403);

  let note_id = "";
  try { note_id = String((await req.json()).note_id || ""); } catch { /* empty */ }
  const { data: n } = await admin.from("porch_notes").select("*").eq("id", note_id).maybeSingle();
  if (!n) return json({ ok: true, sent: 0 });

  const [{ data: actor }, { data: phones }, { count }] = await Promise.all([
    admin.from("porch_members").select("handle").eq("user_id", n.actor_id).maybeSingle(),
    admin.from("porch_push").select("*").eq("user_id", n.user_id),
    admin.from("porch_notes").select("id", { count: "exact", head: true }).eq("user_id", n.user_id).is("read_at", null),
  ]);
  if (!phones?.length) return json({ ok: true, sent: 0 });

  await vapid();
  const payload = JSON.stringify({
    title: "The Porch",
    body: (actor?.handle || "Somebody") + " " + (WORDS[n.kind] || "did something"),
    url: "/feed/porch.html" + (n.post_id ? "?s=" + n.post_id : "?notes=1"),
    tag: "porch-" + n.kind + "-" + (n.post_id || n.actor_id),
    badge: count || 1,
  });
  let sent = 0;
  for (const p of phones) {
    try {
      await webpush.sendNotification({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } }, payload, { TTL: 86400, urgency: "normal" });
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("porch_push").delete().eq("endpoint", p.endpoint);
    }
  }
  return json({ ok: true, sent });
});

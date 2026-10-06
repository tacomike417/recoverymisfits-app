/* PHONE NOTIFICATIONS FOR THE PORCH (30 Sep 2026, Mike).
 *
 * Two jobs:
 *   GET  (from the app)       -> { key }  the public push key the phone needs to sign up
 *   POST (from the database)  { dm_id }    a new message: buzzes the other person's phones
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
  comment: "commented on your share", reply: "replied to your comment", proud: "loved your share",
  metoo: "said Me too", mention: "tagged you", follow: "started following you", report: "was reported. Take a look.",
  friend_request: "sent you a friend request", friend_accept: "accepted your friend request",
  respin: "respun your Spin",
  comment_love: "loved your comment", reshare: "reshared your share",
  // groups (1 Oct 2026)
  group_cokeeper: "asked you to co-keep a group", group_review: "applied to start a group. Take a look.",
  group_ask: "asked to join your group",
};
// group alerts that aren't about a person
const GROUP_SAYS: Record<string, [string, string]> = {
  group_open: ["Your group is open", "Go say hi."],
  group_declined: ["About your group", "It didn't open this time."],
  group_in: ["You're in", "A keeper let you into the group."],
  group_quiet: ["It's been quiet in your group", "Share something or it closes soon."],
  group_closed: ["Your group closed", "Nobody shared for 90 days. A moderator can open it back up."],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") return json({ key: (await vapid()).pub });
  if (req.method !== "POST") return json({ error: "no" }, 405);

  const secret = await setting("push_secret");
  if (!secret || req.headers.get("x-porch-secret") !== secret) return json({ error: "no" }, 403);

  let note_id = "", dm_id = "", gdm_id = "", call_id = "", digest = "", force = false;
  try { const j = await req.json(); note_id = String(j.note_id || ""); dm_id = String(j.dm_id || ""); gdm_id = String(j.gdm_id || ""); call_id = String(j.call_id || ""); digest = String(j.digest || ""); force = j.force === true; } catch { /* empty */ }

  /* YOUR FRIENDS SHARED (4 Oct 2026, Mike: "do we send out phone notifications for new posts by
     people you are friends with? ... a once a day version ... 8:30am"). One alert a day, in the
     morning, to everybody who has a friend that shared since yesterday morning. Nobody gets one
     on a day none of their friends shared. The database knocks at 8:30am Eastern (porch_46).
     Group shares are left out: what's shared in a group stays in the group. */
  if (digest === "friends") {
    const p: Record<string, string> = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
    const day = `${p.year}-${p.month}-${p.day}`;
    if (!force) {
      if (Number(p.hour) !== 8) return json({ ok: true, skipped: "not 8am Eastern" });      // the knock comes twice (summer and winter clocks); only one is 8:30
      if ((await setting("friends_digest_day")) === day) return json({ ok: true, skipped: "already sent today" });
      await admin.from("porch_settings").upsert({ key: "friends_digest_day", value: day }, { onConflict: "key" });
    }
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: posts } = await admin.from("porch_posts").select("id, user_id, need, created_at")
      .gt("created_at", since).is("hidden_at", null).is("group_id", null).order("created_at", { ascending: false }).limit(2000);
    if (!posts?.length) return json({ ok: true, sent: 0, why: "nobody shared" });
    // the house accounts share every day; an alert that comes every day no matter what stops meaning anything
    const { data: house } = await admin.from("porch_members").select("user_id").in("handle", ["recoverymisfits", "spiritualmisfit", "shitmysponsorsays", "anotherdaysober", "welcomematt"]);
    const isHouse = new Set((house || []).map((h: any) => h.user_id));
    const posters = [...new Set(posts.map((x: any) => x.user_id))].filter((u) => !isHouse.has(u as string)) as string[];
    if (!posters.length) return json({ ok: true, sent: 0, why: "only the house shared" });
    const { data: phones } = await admin.from("porch_push").select("*");
    if (!phones?.length) return json({ ok: true, sent: 0, why: "no phones" });
    const [{ data: fa }, { data: fb }, { data: names }] = await Promise.all([
      admin.from("porch_friends").select("a, b").in("a", posters),
      admin.from("porch_friends").select("a, b").in("b", posters),
      admin.from("porch_members").select("user_id, handle").in("user_id", posters),
    ]);
    const handle: Record<string, string> = {};
    (names || []).forEach((m: any) => { handle[m.user_id] = m.handle; });
    // for each person: which of their friends shared (newest first)
    const mine: Record<string, string[]> = {};
    const add = (me: string, friend: string) => { (mine[me] = mine[me] || []); if (!mine[me].includes(friend)) mine[me].push(friend); };
    const isPoster = new Set(posters);
    [...(fa || []), ...(fb || [])].forEach((f: any) => { if (isPoster.has(f.a)) add(f.b, f.a); if (isPoster.has(f.b)) add(f.a, f.b); });
    const order: Record<string, number> = {};
    posts.forEach((x: any, i: number) => { if (order[x.user_id] === undefined) order[x.user_id] = i; });
    await vapid();
    let sent = 0, people = 0;
    const done = new Set<string>();
    for (const ph of phones) {
      const friends = (mine[ph.user_id] || []).filter((f) => handle[f]).sort((x, y) => order[x] - order[y]);
      if (!friends.length) continue;
      if (!done.has(ph.user_id)) { done.add(ph.user_id); people++; }
      const n1 = handle[friends[0]], n2 = friends[1] ? handle[friends[1]] : "";
      const title = friends.length === 1 ? n1 + " shared on the Porch 👋"
        : friends.length + " friends shared on the Porch 👋";
      const body = friends.length === 1 ? "Go see what's new."
        : friends.length === 2 ? n1 + " and " + n2 + "."
        : n1 + ", " + n2 + " and " + (friends.length - 2) + " more.";
      const payload = JSON.stringify({ title, body, url: "/feed/porch.html", tag: "porch-friends" });
      try {
        await webpush.sendNotification({ endpoint: ph.endpoint, keys: { p256dh: ph.p256dh, auth: ph.auth } }, payload, { TTL: 6 * 3600, urgency: "normal" });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("porch_push").delete().eq("endpoint", ph.endpoint);
      }
    }
    return json({ ok: true, sent, people });
  }

  /* A CALL IS RINGING (1 Oct 2026): "grateful_gina is calling" / tap to answer. Only good
     while it's ringing, so it doesn't sit around after the call is gone. */
  if (call_id) {
    const { data: c } = await admin.from("porch_calls").select("id, caller, callee, kind, status, created_at").eq("id", call_id).maybeSingle();
    if (!c || c.status !== "ringing" || Date.now() - new Date(c.created_at).getTime() > 60_000) return json({ ok: true, sent: 0 });
    const [{ data: who }, { data: phones }] = await Promise.all([
      admin.from("porch_members").select("handle").eq("user_id", c.caller).maybeSingle(),
      admin.from("porch_push").select("*").eq("user_id", c.callee),
    ]);
    if (!phones?.length) return json({ ok: true, sent: 0 });
    await vapid();
    const payload = JSON.stringify({
      title: (who?.handle || "A friend") + " is calling",
      body: c.kind === "voice" ? "Voice call. Tap to answer." : "Video call. Tap to answer.",
      url: "/feed/porch.html?call=" + c.id,
      tag: "porch-call",
    });
    let sent = 0;
    for (const p of phones) {
      try {
        await webpush.sendNotification({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } }, payload, { TTL: 45, urgency: "high" });
        sent++;
      } catch (e) {
        const code = (e as any)?.statusCode;
        if (code === 404 || code === 410) await admin.from("porch_push").delete().eq("endpoint", p.endpoint);
      }
    }
    return json({ ok: true, sent });
  }

  /* A NEW MESSAGE IN A GROUP CHAT (1 Oct 2026): "grateful_gina in The Crew" / what she said.
     Everybody else in the chat gets it, except anybody blocked with the sender. */
  if (gdm_id) {
    const { data: m } = await admin.from("porch_gdm").select("*").eq("id", gdm_id).maybeSingle();
    if (!m || Date.now() - new Date(m.created_at).getTime() > 3600_000) return json({ ok: true, sent: 0 });
    const [{ data: c }, { data: mem }, { data: who }] = await Promise.all([
      admin.from("porch_gchats").select("name").eq("id", m.chat_id).maybeSingle(),
      admin.from("porch_gchat_members").select("user_id").eq("chat_id", m.chat_id).neq("user_id", m.from_id),
      admin.from("porch_members").select("handle").eq("user_id", m.from_id).maybeSingle(),
    ]);
    const ids = (mem || []).map((x: any) => x.user_id);
    if (!ids.length) return json({ ok: true, sent: 0 });
    const { data: phones } = await admin.from("porch_push").select("*").in("user_id", ids);
    if (!phones?.length) return json({ ok: true, sent: 0 });
    await vapid();
    let said = String(m.body || "").replace(/\s+/g, " ").trim();
    const sh = said.match(/https?:\/\/(?:www\.)?recoverymisfits\.org\/(?:s\/|feed\/porch\.html\?(?:spin|s)=)\S+/i);
    if (sh) said = said.replace(sh[0], "").trim() || (/\/s\/|spin=/.test(sh[0]) ? "Sent a Spin" : "Sent a share");
    const payload = JSON.stringify({
      title: (who?.handle || "Somebody") + " in " + (c?.name || "your group chat"),
      body: m.racy ? "Sent a photo" : said ? (said.length > 140 ? said.slice(0, 137) + "…" : said) : (m.photo_paths?.length > 1 ? "Sent " + m.photo_paths.length + " photos" : "Sent a photo"),
      url: "/feed/porch.html?gc=" + m.chat_id,
      tag: "porch-gdm-" + m.chat_id,
    });
    let sent = 0;
    for (const p of phones) {
      const { data: blk } = await admin.rpc("porch_blocked", { a: p.user_id, b: m.from_id });
      if (blk) continue;
      try {
        await webpush.sendNotification({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } }, payload, { TTL: 86400, urgency: "normal" });
        sent++;
      } catch (e) {
        const code = (e as any)?.statusCode;
        if (code === 404 || code === 410) await admin.from("porch_push").delete().eq("endpoint", p.endpoint);
      }
    }
    return json({ ok: true, sent });
  }

  /* A NEW MESSAGE (30 Sep 2026): "grateful_gina" / what she said. One alert per chat
     on the lock screen (each new one replaces the last), tap opens that chat. */
  if (dm_id) {
    const { data: m } = await admin.from("porch_dm").select("*").eq("id", dm_id).maybeSingle();
    if (!m || Date.now() - new Date(m.created_at).getTime() > 3600_000) return json({ ok: true, sent: 0 });
    const { data: t } = await admin.from("porch_threads").select("a, b").eq("id", m.thread_id).maybeSingle();
    if (!t) return json({ ok: true, sent: 0 });
    const them = t.a === m.from_id ? t.b : t.a;
    const [{ data: who }, { data: phones }] = await Promise.all([
      admin.from("porch_members").select("handle").eq("user_id", m.from_id).maybeSingle(),
      admin.from("porch_push").select("*").eq("user_id", them),
    ]);
    if (!phones?.length) return json({ ok: true, sent: 0 });
    await vapid();
    let said = String(m.body || "").replace(/\s+/g, " ").trim();
    /* a Spin or post sent in a chat: say so, not the link (1 Oct 2026) */
    const sh = said.match(/https?:\/\/(?:www\.)?recoverymisfits\.org\/(?:s\/|feed\/porch\.html\?(?:spin|s)=)\S+/i);
    if (sh) said = said.replace(sh[0], "").trim() || (/\/s\/|spin=/.test(sh[0]) ? "Sent you a Spin" : "Sent you a share");
    const payload = JSON.stringify({
      title: who?.handle || "New message",
      body: m.racy ? "Sent a photo" : said ? (said.length > 140 ? said.slice(0, 137) + "…" : said) : (m.photo_paths?.length > 1 ? "Sent " + m.photo_paths.length + " photos" : "Sent a photo"),
      url: "/feed/porch.html?dm=" + m.from_id,
      tag: "porch-dm-" + m.thread_id,
    });
    let sent = 0;
    for (const p of phones) {
      try { await webpush.sendNotification({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } }, payload, { TTL: 86400, urgency: "high" }); sent++; }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("porch_push").delete().eq("endpoint", p.endpoint); }
    }
    return json({ ok: true, sent });
  }
  // claim it: each notification buzzes once, and only while it's under an hour old
  const { data: claimed } = await admin.rpc("porch_claim_push", { p_id: note_id });
  const n = (claimed as any[])?.[0];
  if (!n) return json({ ok: true, sent: 0 });

  const [{ data: actor }, { data: phones }, { count }, { data: said }] = await Promise.all([
    admin.from("porch_members").select("handle").eq("user_id", n.actor_id).maybeSingle(),
    admin.from("porch_push").select("*").eq("user_id", n.user_id),
    admin.from("porch_notes").select("id", { count: "exact", head: true }).eq("user_id", n.user_id).is("read_at", null),
    n.comment_id ? admin.from("porch_comments").select("body").eq("id", n.comment_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!phones?.length) return json({ ok: true, sent: 0 });

  await vapid();
  // like Jeff's: the title says who did what, the body is what they said
  const who = actor?.handle || "Somebody";
  let words = n.kind === "mention" ? (n.comment_id ? "tagged you in a comment" : "tagged you in a share") : (WORDS[n.kind] || "did something");
  let text = String((said as any)?.body || "").replace(/\s+/g, " ").trim();
  /* ASK ME ABOUT (6 Oct 2026): a friend request that carries a note says so, shows the note, and a tap
     lands on Alerts, where the note and "Be Friends and Reply" are. (Mike got "sent you a friend request",
     landed on a profile, and went looking in Messages.) */
  let isAsk = false;
  if (n.kind === "friend_request") {
    try {
      const { data: rq } = await admin.from("porch_friend_requests").select("note, about").eq("from_id", n.actor_id).eq("to_id", n.user_id).maybeSingle();
      if (rq?.note) { isAsk = true; words = "wants to ask you about " + (String(rq.about || "").trim() || "something"); text = String(rq.note).replace(/\s+/g, " ").trim(); }
    } catch { /* plain friend request wording */ }
  }
  const q = new URLSearchParams();
  if (n.post_id) { q.set("s", n.post_id); if (n.comment_id) q.set("c", n.comment_id); q.set("k", n.kind); q.set("a", n.actor_id); }
  else if (n.kind === "group_review" || n.kind === "group_cokeeper" || n.kind === "group_declined") q.set("groups", "1");
  else if (n.group_id) q.set("g", n.group_id);
  else if (n.kind === "report") q.set("mod", "1");
  else if (isAsk) q.set("notes", "1");
  else if (n.kind === "friend_request" || n.kind === "friend_accept" || n.kind === "follow") q.set("who", n.actor_id);
  else q.set("notes", "1");
  /* ONE BUZZ, NOT A BUNCH (3 Oct 2026, Mike: "I don't want to bug the shit out of them on their
     own phone ... like Temu does ... it buzzes and then all the notifications kind of go under
     that one"). Every alert lands on ONE card on the phone (one tag), and the card counts up.
     The phone only makes a sound if it hasn't buzzed for this person in the last hour, and no
     more than 5 times in a day. Everything in between piles onto the card without a sound.
     Messages and calls are not part of this; those are a person talking to you. */
  const BUZZ_GAP_MIN = 60, BUZZ_DAY_MAX = 5;
  let quiet = false;
  try {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: buzzes, error: be } = await admin.from("porch_notes").select("buzzed_at")
      .eq("user_id", n.user_id).gt("buzzed_at", dayAgo).order("buzzed_at", { ascending: false }).limit(BUZZ_DAY_MAX);
    if (!be && buzzes?.length) {
      const last = new Date((buzzes[0] as any).buzzed_at).getTime();
      quiet = Date.now() - last < BUZZ_GAP_MIN * 60000 || buzzes.length >= BUZZ_DAY_MAX;
    }
    if (!be && !quiet) await admin.from("porch_notes").update({ buzzed_at: new Date().toISOString() }).eq("id", n.id);
  } catch { /* before porch_41 is run there is no buzzed_at: every alert buzzes, like it used to */ }

  const one = GROUP_SAYS[n.kind] ? GROUP_SAYS[n.kind][0] : who + " " + words;
  const more = (count || 1) - 1;
  const payload = JSON.stringify(more > 0 ? {
    title: (more + 1) + " new on the Porch 👋",
    body: one + ", and " + more + " more.",
    url: "/feed/porch.html?notes=1",
    tag: "porch-notes",
    badge: count || 1,
    quiet,
  } : {
    title: one,
    body: GROUP_SAYS[n.kind] ? GROUP_SAYS[n.kind][1] : text ? (text.length > 140 ? text.slice(0, 137) + "…" : text) : "Tap to see it.",
    url: "/feed/porch.html?" + q.toString(),
    tag: "porch-notes",
    badge: count || 1,
    quiet,
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

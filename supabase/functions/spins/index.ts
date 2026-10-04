/* SOBER SPINS -- the server half (30 Sep 2026, Mike). Built exactly like
 * Jeff's Infinite Loops, plus Respin (done in the database) and free music.
 *
 * The Bunny Stream key never leaves here.
 *   Secrets: BUNNY_STREAM_KEY, BUNNY_STREAM_LIBRARY (the library id),
 *            BUNNY_STREAM_CDN (e.g. vz-xxxxxxxx-xxx.b-cdn.net), FREESOUND_KEY,
 *            GOOGLE_VISION_KEY (already set, for the safety check).
 *
 *   start   { caption?, muted?, bytes, music? }  -> { id, guid, library, expire, signature }
 *           makes an empty video on Bunny and signs a short-lived upload, so the
 *           phone uploads straight to Bunny (the video never passes through here)
 *   done    { id }      is it ready? When it is: a safety check on its picture,
 *                       then the Porch share behind it is made and it goes live
 *   delete  { id }      the owner (or a moderator) removes a Spin, video and all
 *   pin     { id, on }  keep it past 30 days (3 at most)
 *   caption { id, caption }   same word checks as a share
 *   music_search { q }  free tracks nobody owns (Freesound, CC0 only)
 *   music_file   { id } the track itself, so the phone can mix it in
 *
 * Every start also sweeps a little: Spins 3 days past their 30 (unpinned) and
 * uploads that never finished are deleted from Bunny and the table.
 *
 * Deploy: npx supabase functions deploy spins --project-ref rlytvfehbglsjfvprtbp
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const API = "https://video.bunnycdn.com";
const PER_DAY = 10;
const MAX_BYTES = 200 * 1024 * 1024;
const MAX_SECONDS = 16;          /* everybody */
const MAX_SECONDS_LONG = 61;     /* accounts on porch_spin_long (2 Oct 2026): 60-second Spins */
const KEY = Deno.env.get("BUNNY_STREAM_KEY") || "";
const LIB = Deno.env.get("BUNNY_STREAM_LIBRARY") || "";
const CDN = (Deno.env.get("BUNNY_STREAM_CDN") || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
const VISION = Deno.env.get("GOOGLE_VISION_KEY") || "";
const FREESOUND = Deno.env.get("FREESOUND_KEY") || "";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const bunny = (path: string, init: RequestInit = {}) =>
  fetch(`${API}/library/${LIB}${path}`, { ...init, headers: { AccessKey: KEY, accept: "application/json", "content-type": "application/json", ...(init.headers || {}) } });
const dropVideo = async (guid: string) => { try { await bunny(`/videos/${guid}`, { method: "DELETE" }); } catch { /* gone is fine */ } };

/* the same word checks as a share: slurs, sexual talk and threats don't post */
const LEET: Record<string, string> = { a: "[a@4*]", e: "[e3*]", i: "[i1!|*]", o: "[o0*]", s: "[s$5*]", u: "[uv*]", t: "[t7+]", g: "[g9]" };
const pat = (w: string) => w.split("").map((c) => (c === " " ? "\\s*" : (LEET[c] || c) + "+")).join("[\\W_]*");
const words = (list: string[]) => new RegExp("(?<![a-z])(?:" + list.map(pat).join("|") + ")(?:e?s|z)?(?![a-z])", "i");
const BLOCK = words(["nigger", "nigga", "faggot", "fag", "retard", "tranny", "chink", "spic", "kike", "wetback", "raghead", "towelhead", "gook", "beaner", "dyke",
  "nudes", "send pics", "dick pic", "dickpic", "sext", "sexting", "horny", "porn", "porno", "blowjob", "handjob", "onlyfans", "nsfw"]);
const THREAT = /\b(i('| a)?m|i will|ima|imma|gonna|going to)\s+(kill|hurt|beat|stab|shoot|jump)\s+(you|u|him|her|them|ya)\b|\bwatch your back\b|\byou('| a)?re dead\b|\bi know where you (live|work)\b/i;
function checkWords(t: string) {
  if (BLOCK.test(t)) return "That has words the Porch doesn't allow (slurs or sexual stuff).";
  if (THREAT.test(t)) return "That reads like a threat.";
  if (/\b(https?:\/\/|www\.)/i.test(t)) return "Links can't go in a Spin's caption. Share them in a regular post.";
  return null;
}

/* THE SAFETY CHECK: Bunny's picture of the video goes through Google SafeSearch.
   No nudity, nothing graphic, on any Spin. */
const LEVEL: Record<string, number> = { UNKNOWN: 0, VERY_UNLIKELY: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, VERY_LIKELY: 5 };
/* OTHER PEOPLE NEED TO SAY OK (1 Oct 2026, Mike): if the Spin's picture shows more than
   one face, it only goes up when the maker ticked "Everyone in this Spin said OK"
   (faces_ok). Only counts faces, never who. */
async function thumbOk(guid: string, facesOk = false): Promise<boolean | null | "faces"> {
  if (!VISION || !CDN) return null;
  try {
    const r = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(VISION), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { source: { imageUri: `https://${CDN}/${guid}/thumbnail.jpg` } }, features: [{ type: "SAFE_SEARCH_DETECTION" }, { type: "FACE_DETECTION", maxResults: 6 }] }] }),
    });
    const res = (await r.json())?.responses?.[0], s = res?.safeSearchAnnotation;
    if (!s) return null;
    const safe = (LEVEL[s.adult] || 0) < LEVEL.LIKELY && (LEVEL[s.racy] || 0) < LEVEL.VERY_LIKELY && (LEVEL[s.violence] || 0) < LEVEL.VERY_LIKELY;
    if (!safe) return false;
    if (!facesOk && (res?.faceAnnotations || []).filter((f: any) => (Number(f.detectionConfidence) || 0) >= 0.7).length > 1) return "faces";
    return true;
  } catch { return null; }
}

/* FREESOUND, CC0 ONLY: music nobody owns, safe to share anywhere */
const MOODS: Record<string, string> = {
  chill: "chill ambient music", upbeat: "upbeat happy music", hopeful: "uplifting inspiring music",
  acoustic: "acoustic guitar music", lofi: "lofi beat", piano: "piano music", cinematic: "cinematic music", drums: "drum beat loop",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who?.user;
  if (!user) return json({ error: "Sign in first." }, 401);

  let b: Record<string, any> = {};
  try { b = await req.json(); } catch { /* empty */ }
  const action = String(b.action || "");

  /* ---------------- music (any signed-in person) ---------------- */
  if (action === "music_search") {
    if (!FREESOUND) return json({ error: "Music isn't switched on yet." }, 500);
    const q = String(b.q || "").trim().slice(0, 60);
    const query = MOODS[q] || q || MOODS.chill;
    const u = new URL("https://freesound.org/apiv2/search/text/");
    u.searchParams.set("query", query);
    u.searchParams.set("filter", 'license:"Creative Commons 0" duration:[12 TO 400]');
    u.searchParams.set("fields", "id,name,username,duration,previews");
    u.searchParams.set("sort", "rating_desc");
    u.searchParams.set("page_size", "20");
    u.searchParams.set("token", FREESOUND);
    try {
      const r = await fetch(u.toString());
      if (!r.ok) return json({ error: "Music didn't load. Try again." }, 502);
      const d = await r.json();
      /* the preview link goes to the phone too, so tapping ▶ plays straight from
         Freesound, streaming, in a second instead of after the whole song downloads */
      const tracks = (d.results || []).map((x: any) => ({
        id: x.id, name: String(x.name || "Track").replace(/\.(mp3|wav|ogg|flac|aif+)$/i, "").slice(0, 60),
        by: x.username, secs: Math.round(x.duration || 0),
        preview: /^https:\/\/[a-z0-9.-]*freesound\.org\//i.test(String(x.previews?.["preview-lq-mp3"] || "")) ? x.previews["preview-lq-mp3"] : null,
      }));
      return json({ ok: true, tracks });
    } catch { return json({ error: "Music didn't load. Try again." }, 502); }
  }
  if (action === "music_file") {
    if (!FREESOUND) return json({ error: "Music isn't switched on yet." }, 500);
    const id = parseInt(String(b.id), 10);
    if (!id) return json({ error: "Which track?" }, 400);
    try {
      const r = await fetch(`https://freesound.org/apiv2/sounds/${id}/?fields=id,license,previews&token=${FREESOUND}`);
      const s = await r.json();
      if (!/publicdomain\/zero/.test(String(s.license || ""))) return json({ error: "That track can't be used." }, 403);
      const url = s.previews?.["preview-hq-mp3"];
      if (!url) return json({ error: "That track didn't load." }, 502);
      /* A SPIN IS 15 SECONDS (1 Oct 2026, Mike: "it takes about a minute"): only the
         first ~40 seconds of the song come down, not the whole thing. MP3 is made of
         small frames, so a cut-off file still plays from the top. */
      const a = await fetch(url, { headers: { Range: "bytes=0-655359" } });
      if (!a.ok || !a.body) return json({ error: "That track didn't load." }, 502);
      const reader = a.body.getReader(), parts: Uint8Array[] = []; let got = 0;
      while (got < 655360) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value); got += value.length;
      }
      try { await reader.cancel(); } catch { /* done already */ }
      const out = new Uint8Array(Math.min(got, 655360)); let o = 0;
      for (const p of parts) { const n = Math.min(p.length, out.length - o); if (n <= 0) break; out.set(p.subarray(0, n), o); o += n; }
      return new Response(out, { headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" } });
    } catch { return json({ error: "That track didn't load." }, 502); }
  }

  if (!KEY || !LIB || !CDN) return json({ error: "Spins aren't set up on the server yet." }, 500);

  /* ---------------- who can post (same rules as a share) ---------------- */
  const { data: me } = await admin.from("porch_members").select("*").eq("user_id", user.id).maybeSingle();
  const { data: modRow } = await admin.from("porch_moderators").select("user_id").eq("user_id", user.id).maybeSingle();
  const isMod = !!modRow;

  /* ---------------- start ---------------- */
  if (action === "start") {
    if (!me?.verified_at) return json({ error: "Confirm who you are to post.", need: "confirm" }, 403);
    if (me.frozen_at) return json({ error: "Your account is paused while someone looks at a report. Hang tight." }, 403);
    const { data: tester } = await admin.from("porch_testers").select("handle").eq("handle", me.handle).maybeSingle();
    if (!tester && !isMod && Date.now() - new Date(user.created_at).getTime() < 3 * 24 * 3600_000) {
      return json({ error: "Brand-new accounts can post after 3 days. Look around in the meantime." }, 403);
    }
    const bytes = Number(b.bytes) || 0;
    if (bytes > MAX_BYTES) return json({ error: "That video is too big. Try a shorter clip." }, 400);
    const caption = String(b.caption || "").trim().slice(0, 500);
    const w = caption ? checkWords(caption) : null; if (w) return json({ error: w }, 400);
    /* TAG A GROUP (4 Oct 2026): one open, anybody-can-join group the person is in */
    let tagGroup: string | null = null;
    if (typeof b.tag_group === "string" && /^[0-9a-f-]{36}$/i.test(b.tag_group)) {
      const { data: grp } = await admin.from("porch_groups").select("id, status, kind").eq("id", b.tag_group).maybeSingle();
      const { data: inIt } = grp ? await admin.rpc("porch_in_group", { g: b.tag_group, u: user.id }) : { data: false };
      if (!grp || grp.status !== "open" || grp.kind !== "open" || !inIt) return json({ error: "You can only tag an open group you're in." }, 400);
      tagGroup = String(grp.id);
    }
    const muted = !!b.muted;
    const music = b.music && b.music.id ? { id: /^\d+$/.test(String(b.music.id)) ? Number(b.music.id) : String(b.music.id).replace(/[^a-z0-9-]/g, "").slice(0, 40), name: String(b.music.name || "").slice(0, 60), by: String(b.music.by || "").slice(0, 40) } : null;

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from("porch_spins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
    if ((count || 0) >= PER_DAY) return json({ error: `That's ${PER_DAY} Spins today. Try again tomorrow.` }, 429);

    const made = await bunny("/videos", { method: "POST", body: JSON.stringify({ title: `spin ${user.id.slice(0, 8)} ${Date.now()}` }) });
    if (!made.ok) return json({ error: "Couldn't start the upload. Try again in a minute." }, 502);
    const guid = String((await made.json()).guid || "");
    if (!guid) return json({ error: "Couldn't start the upload." }, 502);
    const { data: row, error } = await admin.from("porch_spins")
      .insert({ user_id: user.id, video_guid: guid, caption: caption || null, muted, music, status: "uploading", ...(tagGroup ? { tag_group_id: tagGroup } : {}) }).select("id").single();
    if (error || !row) { await dropVideo(guid); return json({ error: "Couldn't save the Spin." }, 500); }

    const expire = Math.floor(Date.now() / 1000) + 6 * 3600;
    const signature = await sha256Hex(`${LIB}${KEY}${expire}${guid}`);

    const sweep = (async () => {
      const cut = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
      const stale = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [old, stuck] = await Promise.all([
        admin.from("porch_spins").select("id, video_guid, post_id").eq("pinned", false).lt("expires_at", cut).limit(20),
        admin.from("porch_spins").select("id, video_guid, post_id").neq("status", "ready").lt("created_at", stale).limit(20),
      ]);
      for (const g of [...(old.data || []), ...(stuck.data || [])]) {
        await dropVideo(g.video_guid);
        await admin.from("porch_spins").delete().eq("id", g.id);
        if (g.post_id) await admin.from("porch_posts").delete().eq("id", g.post_id);
      }
    })().catch(() => {});
    // @ts-ignore EdgeRuntime exists on Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(sweep); else await sweep;

    return json({ id: row.id, guid, library: LIB, expire, signature });
  }

  /* the rest act on one Spin */
  const id = String(b.id || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Which Spin?" }, 400);
  const { data: spin } = await admin.from("porch_spins").select("*").eq("id", id).maybeSingle();
  if (!spin) return json({ error: "That Spin is gone." }, 404);
  const mine = spin.user_id === user.id;

  /* ---------------- done ---------------- */
  if (action === "done") {
    if (!mine) return json({ error: "Not your Spin." }, 403);
    if (spin.status === "ready") return json({ status: "ready", post_id: spin.post_id });
    const r = await bunny(`/videos/${spin.video_guid}`);
    if (!r.ok) return json({ status: spin.status });
    const v = await r.json();
    const st = Number(v.status);
    if (st === 5 || st === 6) {
      await admin.from("porch_spins").update({ status: "failed" }).eq("id", id);
      return json({ status: "failed", error: "Bunny couldn't read that video. Try another one." });
    }
    const len = Number(v.length) || 0;
    /* 15 seconds for everybody; 60 for an account a moderator upgraded. If the list
       can't be read (porch_27 not run yet) it stays 15. */
    const { data: lng } = await admin.from("porch_spin_long").select("user_id").eq("user_id", spin.user_id).maybeSingle();
    const maxS = lng ? MAX_SECONDS_LONG : MAX_SECONDS;
    if (len > maxS) {
      await dropVideo(spin.video_guid);
      await admin.from("porch_spins").delete().eq("id", id);
      return json({ status: "failed", error: `Spins are ${maxS - 1} seconds max. Trim it and try again.` });
    }
    if (st === 4) {
      const ok = await thumbOk(spin.video_guid, !!b.faces_ok);
      if (ok === false || ok === "faces") {
        await dropVideo(spin.video_guid);
        await admin.from("porch_spins").delete().eq("id", id);
        return json({ status: "failed", error: ok === "faces" ? "There's more than one person in this Spin. Post it again and tick \"Everyone in it said OK\"." : "That video isn't allowed on the Porch." });
      }
      const { data: post, error } = await admin.from("porch_posts")
        .insert({ user_id: spin.user_id, need: "moment", body: spin.caption || null, ...(spin.tag_group_id ? { tag_group_id: spin.tag_group_id } : {}) }).select("id").single();
      if (error || !post) return json({ status: "uploading", progress: 99 });
      await admin.from("porch_spins").update({
        status: "ready", post_id: post.id,
        length_s: len || null, width: Number(v.width) || null, height: Number(v.height) || null,
        resolutions: String(v.availableResolutions || "") || null,
        created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      }).eq("id", id);
      return json({ status: "ready", post_id: post.id });
    }
    return json({ status: "uploading", progress: Number(v.encodeProgress) || 0 });
  }

  /* ---------------- delete ---------------- */
  if (action === "delete") {
    if (!mine && !isMod) return json({ error: "Not your Spin." }, 403);
    await dropVideo(spin.video_guid);
    await admin.from("porch_spins").delete().eq("id", id);
    if (spin.post_id) await admin.from("porch_posts").delete().eq("id", spin.post_id);
    return json({ ok: true });
  }

  /* ---------------- pin ---------------- */
  if (action === "pin") {
    if (!mine) return json({ error: "Not your Spin." }, 403);
    const on = !!b.on;
    if (on && !spin.pinned) {
      const { count } = await admin.from("porch_spins").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("pinned", true);
      if ((count || 0) >= 3) return json({ error: "You can keep 3 pinned. Unpin one first." }, 400);
    }
    await admin.from("porch_spins").update({ pinned: on }).eq("id", id);
    return json({ ok: true, pinned: on });
  }

  /* ---------------- caption ---------------- */
  if (action === "caption") {
    if (!mine) return json({ error: "Not your Spin." }, 403);
    const caption = String(b.caption || "").trim().slice(0, 500);
    const w = caption ? checkWords(caption) : null; if (w) return json({ error: w }, 400);
    await admin.from("porch_spins").update({ caption: caption || null }).eq("id", id);
    if (spin.post_id) await admin.from("porch_posts").update({ body: caption || null, edited_at: new Date().toISOString() }).eq("id", spin.post_id);
    return json({ ok: true, caption: caption || null });
  }

  return json({ error: "Unknown action" }, 400);
});

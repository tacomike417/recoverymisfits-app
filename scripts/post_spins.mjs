#!/usr/bin/env node
/* POST SPINS FROM THIS COMPUTER (1 Oct 2026, Mike).
 *
 * Puts finished videos on the Porch as Spins under YOUR account, exactly the way
 * the app does it: signs in, asks the spins function to start one, sends the
 * video straight to Bunny, then waits until it's checked and live.
 *
 * Run it through the one-liner Claude gives you; it asks for your password
 * (nothing is saved anywhere). Videos have to be 15 seconds or less.
 *
 *   RM_USER=tacomike417 RM_PASS=... node scripts/post_spins.mjs list.json
 *
 * list.json: [{ "file": "/path/video.mp4", "caption": "words", "muted": true }, ...]
 * They go up in that order, so the LAST one ends up newest (first in the row).
 */
import fs from "node:fs";

const DB = "https://rlytvfehbglsjfvprtbp.supabase.co";
const KEY = "sb_publishable_5r-l8Bj8PjXhq5qpp1b26g_QQ7xPQ7P";   // the app's public key, same as the website
const TUS = "https://video.bunnycdn.com/tusupload";

const user = String(process.env.RM_USER || "").trim().toLowerCase();
const pass = String(process.env.RM_PASS || "");
const list = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (!user || !pass) { console.error("Missing username or password."); process.exit(1); }

const b64 = (s) => Buffer.from(s).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signIn() {
  const r = await fetch(`${DB}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user + "@rm.invalid", password: pass }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Sign-in didn't work. Check the password.");
  return j.access_token;
}
async function spins(tok, body) {
  const r = await fetch(`${DB}/functions/v1/spins`, {
    method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !j.status) throw new Error(j.error || `spins said ${r.status}`);
  return j;
}
async function upload(start, buf) {
  const head = {
    "Tus-Resumable": "1.0.0", AuthorizationSignature: start.signature, AuthorizationExpire: String(start.expire),
    VideoId: start.guid, LibraryId: String(start.library),
  };
  const c = await fetch(TUS, { method: "POST", headers: { ...head, "Upload-Length": String(buf.length), "Upload-Metadata": `filetype ${b64("video/mp4")},title ${b64("spin")}` } });
  if (c.status !== 201) throw new Error(`Bunny wouldn't start the upload (${c.status}).`);
  const loc = new URL(c.headers.get("location"), TUS).href;
  const p = await fetch(loc, { method: "PATCH", headers: { ...head, "Upload-Offset": "0", "Content-Type": "application/offset+octet-stream" }, body: buf });
  if (p.status !== 204) throw new Error(`The upload didn't finish (${p.status}).`);
}

const tok = await signIn();
console.log(`Signed in as ${user}. Posting ${list.length} Spin(s)…\n`);
let ok = 0;
for (const [n, it] of list.entries()) {
  const name = it.file.split("/").pop();
  try {
    const buf = fs.readFileSync(it.file);
    const start = await spins(tok, { action: "start", caption: it.caption || "", muted: !!it.muted, bytes: buf.length });
    if (!start.guid) throw new Error(start.error || "Couldn't start.");
    process.stdout.write(`${n + 1}. ${name}: uploading… `);
    await upload(start, buf);
    process.stdout.write("getting it ready… ");
    let st = {};
    for (let t = 0; t < 75; t++) {
      await sleep(4000);
      st = await spins(tok, { action: "done", id: start.id });
      if (st.status === "ready" || st.status === "failed") break;
    }
    if (st.status !== "ready") throw new Error(st.error || "Bunny is still working on it. It'll finish on its own.");
    console.log("LIVE ✓");
    ok++;
  } catch (e) {
    console.log(`\n${n + 1}. ${name}: ✗ ${e.message}`);
  }
}
console.log(`\nDone: ${ok} of ${list.length} posted. Open the Porch and tap SPINS.`);

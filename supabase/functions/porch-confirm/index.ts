/* CONFIRM WHO YOU ARE, FOR THE PORCH (30 Sep 2026, Mike).
 *
 * Browsing the Porch is anonymous. Posting, commenting, reacting, messaging
 * and reporting need a confirmed email. This is the only thing that confirms.
 *
 *   send   { email }  -> emails a 6-digit code
 *   verify { code }   -> { ok: true, handle }   the member row is created/stamped
 *
 * The email is never stored. Only a peppered SHA-256 fingerprint, so one
 * email can confirm one account, and nothing here can be read back into an
 * address. The Porch name is the username they already have.
 *
 * FORGOT PASSWORD (1 Oct 2026, Mike, from the big list). Only for people who
 * confirmed an email here, because that's the only way to prove it's them:
 *   reset_send   { handle, email }           -> always { ok: true } (never says
 *                                                whether the name or email matched,
 *                                                so it can't confirm who's here)
 *   reset_verify { handle, code, password }  -> { ok: true } and the password is changed
 * The email is checked against the scrambled fingerprint and never stored.
 *
 * Limits: 5 codes an hour per account; 5 wrong tries kills a code; codes
 * last 15 minutes.
 *
 * Secrets (set once):
 *   RESEND_API_KEY   from resend.com
 *   PORCH_PEPPER     any long random string, never changed after launch
 *
 * Deploy:
 *   npx supabase functions deploy porch-confirm --no-verify-jwt --project-ref rlytvfehbglsjfvprtbp
 *   (--no-verify-jwt so somebody who can't sign in can still reset; every other
 *    action checks who you are itself, below)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } });
const PEPPER = Deno.env.get("PORCH_PEPPER") || "";
const RESEND = Deno.env.get("RESEND_API_KEY") || "";
const FROM = "Recovery Misfits <hello@recoverymisfits.org>";

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(PEPPER + "|" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const cleanEmail = (e: unknown) => String(e || "").trim().toLowerCase();
const looksLikeEmail = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e);

async function sendCode(to: string, code: string, reset = false) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [to],
      subject: `${code} is your Recovery Misfits code`,
      text: `Your code is ${code}\n\n` + (reset ? `Type it into the app to set a new password. It works for 15 minutes.\n\n`
            : `Type it into the app to confirm it's you. It works for 15 minutes.\n\n`) +
            `We don't keep your email and nobody on the Porch will ever see it.\n` +
            `If you didn't ask for this, you can ignore it.\n\n— Recovery Misfits`,
    }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!PEPPER || !RESEND) return json({ error: "Confirming isn't switched on yet." }, 503);

  let body: Record<string, unknown> = {};
  try { body = await req.clone().json(); } catch { /* empty */ }

  /* ---- forgot password: no sign-in needed ---- */
  if (body.action === "reset_send" || body.action === "reset_verify") {
    const h = String(body.handle || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(h)) return json(body.action === "reset_send" ? { ok: true } : { error: "That code isn't right." }, body.action === "reset_send" ? 200 : 400);
    const { data: m } = await admin.from("porch_members").select("user_id").eq("handle", h).maybeSingle();
    const { data: idr } = m ? await admin.from("porch_identity").select("*").eq("user_id", m.user_id).maybeSingle() : { data: null };

    if (body.action === "reset_send") {
      const email = cleanEmail(body.email);
      if (!looksLikeEmail(email)) return json({ error: "That doesn't look like an email." }, 400);
      /* same answer whether it matched or not */
      if (!m || !idr || !idr.email_hash || idr.email_hash !== (await sha("email:" + email))) return json({ ok: true });
      const fresh = Date.now() - new Date(idr.sends_since || 0).getTime() > 3_600_000;
      const sends = fresh ? 0 : idr.sends;
      if (sends >= 5) return json({ ok: true });
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      await admin.from("porch_identity").update({
        code_hash: await sha("reset:" + m.user_id + ":" + code),
        code_expires: new Date(Date.now() + 15 * 60_000).toISOString(),
        tries: 0, sends: sends + 1, sends_since: fresh ? new Date().toISOString() : idr.sends_since,
      }).eq("user_id", m.user_id);
      await sendCode(email, code, true);
      return json({ ok: true });
    }

    const code = String(body.code || "").replace(/\D/g, "");
    const pw = String(body.password || "");
    if (pw.length < 8) return json({ error: "Your new password needs at least 8 characters." }, 400);
    if (!m || !idr || !idr.code_hash || !idr.code_expires) return json({ error: "That code isn't right." }, 400);
    if (new Date(idr.code_expires).getTime() < Date.now()) return json({ error: "That code ran out. Ask for a new one." }, 400);
    if (idr.tries >= 5) return json({ error: "Too many tries. Ask for a new code." }, 429);
    if ((await sha("reset:" + m.user_id + ":" + code)) !== idr.code_hash) {
      await admin.from("porch_identity").update({ tries: idr.tries + 1 }).eq("user_id", m.user_id);
      return json({ error: "That code isn't right." }, 400);
    }
    const up = await admin.auth.admin.updateUserById(m.user_id, { password: pw });
    if (up.error) return json({ error: "That didn't work. Try again." }, 500);
    await admin.from("porch_identity").update({ code_hash: null, code_expires: null, tries: 0 }).eq("user_id", m.user_id);
    return json({ ok: true });
  }

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who?.user;
  if (!user) return json({ error: "Sign in to your account first." }, 401);
  const handle = String(user.email || "").split("@")[0];
  if (!/^[a-z0-9._-]{3,32}$/.test(handle)) return json({ error: "This account can't join the Porch." }, 400);

  const { data: row } = await admin.from("porch_identity").select("*").eq("user_id", user.id).maybeSingle();

  if (body.action === "send") {
    const email = cleanEmail(body.email);
    if (!looksLikeEmail(email)) return json({ error: "That doesn't look like an email." }, 400);
    const hash = await sha("email:" + email);

    const { data: taken } = await admin.from("porch_identity").select("user_id")
      .eq("email_hash", hash).neq("user_id", user.id).maybeSingle();
    if (taken) return json({ error: "That email already confirmed a different account." }, 409);

    const fresh = !row || Date.now() - new Date(row.sends_since).getTime() > 3_600_000;
    const sends = fresh ? 0 : row.sends;
    if (sends >= 5) return json({ error: "Too many codes. Try again in an hour." }, 429);

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const up = await admin.from("porch_identity").upsert({
      user_id: user.id,
      email_hash: row?.email_hash ?? null,
      pending_hash: hash,
      code_hash: await sha("code:" + user.id + ":" + code),
      code_expires: new Date(Date.now() + 15 * 60_000).toISOString(),
      tries: 0,
      sends: sends + 1,
      sends_since: fresh ? new Date().toISOString() : row.sends_since,
    });
    if (up.error) return json({ error: "Something went wrong. Try again." }, 500);
    if (!(await sendCode(email, code))) return json({ error: "The email didn't send. Check the address and try again." }, 502);
    return json({ ok: true });
  }

  if (body.action === "verify") {
    const code = String(body.code || "").replace(/\D/g, "");
    if (!row || !row.code_hash || !row.pending_hash) return json({ error: "Ask for a code first." }, 400);
    if (new Date(row.code_expires).getTime() < Date.now()) return json({ error: "That code ran out. Ask for a new one." }, 400);
    if (row.tries >= 5) return json({ error: "Too many tries. Ask for a new code." }, 429);
    if ((await sha("code:" + user.id + ":" + code)) !== row.code_hash) {
      await admin.from("porch_identity").update({ tries: row.tries + 1 }).eq("user_id", user.id);
      return json({ error: "That code isn't right." }, 400);
    }
    const { data: taken } = await admin.from("porch_identity").select("user_id")
      .eq("email_hash", row.pending_hash).neq("user_id", user.id).maybeSingle();
    if (taken) return json({ error: "That email already confirmed a different account." }, 409);

    const a = await admin.from("porch_identity").update({
      email_hash: row.pending_hash, pending_hash: null, code_hash: null, code_expires: null, tries: 0,
    }).eq("user_id", user.id);
    const b = await admin.from("porch_members").upsert(
      { user_id: user.id, handle, verified_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (a.error || b.error) return json({ error: "Something went wrong. Try again." }, 500);
    return json({ ok: true, handle });
  }

  return json({ error: "Unknown action" }, 400);
});

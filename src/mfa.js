/*
 * App-level MFA for Evidenta: TOTP (RFC 6238, SHA-1, 6 digits, 30 s) on top of the Cloudflare Access login.
 * After a correct code the browser gets a signed, HttpOnly session cookie valid for 12 hours.
 */
const now = () => new Date().toISOString();
const COOKIE = "ev_mfa", TTL = 12 * 3600;
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const enc = new TextEncoder();

function b32encode(bytes) { let bits = 0, val = 0, out = ""; for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; }
function b32decode(s) { s = s.replace(/=+$/, "").toUpperCase(); let bits = 0, val = 0; const out = []; for (const c of s) { const i = B32.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); }
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hotp(secret, counter) {
  const key = await crypto.subtle.importKey("raw", b32decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new ArrayBuffer(8), dv = new DataView(msg); dv.setUint32(0, Math.floor(counter / 2 ** 32)); dv.setUint32(4, counter >>> 0);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg)), o = h[19] & 15;
  const n = ((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6;
  return String(n).padStart(6, "0");
}
/* returns the matching time step or null; accepts one step of clock drift */
async function checkCode(secret, code, lastStep) {
  code = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const t = Math.floor(Date.now() / 30000);
  for (const s of [t, t - 1, t + 1]) if ((lastStep == null || s > lastStep) && await hotp(secret, s) === code) return s;
  return null;
}

async function sessionKey(env) {
  let r = await env.DB.prepare("SELECT v FROM app_secrets WHERE k='mfa_session'").first();
  if (!r) {
    const v = b64u(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare("INSERT OR IGNORE INTO app_secrets (k,v) VALUES ('mfa_session',?)").bind(v).run();
    r = await env.DB.prepare("SELECT v FROM app_secrets WHERE k='mfa_session'").first();
  }
  return crypto.subtle.importKey("raw", enc.encode(r.v), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeCookie(env, u) {
  const exp = Math.floor(Date.now() / 1000) + TTL, body = `${u.email}|${exp}|${u.mfa_enabled_at || ""}`;
  const sig = b64u(await crypto.subtle.sign("HMAC", await sessionKey(env), enc.encode(body)));
  return `${COOKIE}=${b64u(enc.encode(body))}.${sig}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Strict`;
}
export async function mfaOk(req, env, u) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(COOKIE + "=([^;]+)"));
  if (!m) return false;
  const [b, sig] = m[1].split(".");
  if (!b || !sig) return false;
  let body; try { body = new TextDecoder().decode(Uint8Array.from(atob(b.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))); } catch { return false; }
  const expect = b64u(await crypto.subtle.sign("HMAC", await sessionKey(env), enc.encode(body)));
  if (expect !== sig) return false;
  const [email, exp, enabled] = body.split("|");
  return email === u.email && +exp > Date.now() / 1000 && enabled === (u.mfa_enabled_at || "");
}
export const mfaNeeded = u => !!(u.mfa_required || u.mfa_enabled_at);

const J = (data, status = 200, cookie) => { const h = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }; if (cookie) h["set-cookie"] = cookie; return new Response(JSON.stringify(data), { status, headers: h }); };
async function body(req) { try { return await req.json(); } catch { return {}; } }

export async function mfaApi(req, env, u, p, log) {
  const m = req.method;
  if (p[1] === "status") return J({ required: !!u.mfa_required, enabled: !!u.mfa_enabled_at, ok: await mfaOk(req, env, u) });
  if (u.mfa_lock_until && new Date(u.mfa_lock_until) > new Date()) return J({ error: "locked", until: u.mfa_lock_until }, 429);
  const fail = async () => {
    const n = (u.mfa_fails || 0) + 1, lock = n >= 5 ? new Date(Date.now() + 15 * 60e3).toISOString() : null;
    await env.DB.prepare("UPDATE users SET mfa_fails=?, mfa_lock_until=? WHERE email=?").bind(lock ? 0 : n, lock, u.email).run();
    return J({ error: lock ? "locked" : "code", left: lock ? 0 : 5 - n }, lock ? 429 : 400);
  };
  if (p[1] === "setup" && m === "POST") {
    if (u.mfa_enabled_at) return J({ error: "enabled" }, 400);
    const secret = b32encode(crypto.getRandomValues(new Uint8Array(20)));
    await env.DB.prepare("UPDATE users SET mfa_secret=? WHERE email=?").bind(secret, u.email).run();
    const label = encodeURIComponent("Evidenta:" + u.email);
    return J({ secret, uri: `otpauth://totp/${label}?secret=${secret}&issuer=Evidenta&algorithm=SHA1&digits=6&period=30` });
  }
  if (p[1] === "enable" && m === "POST") {
    if (u.mfa_enabled_at || !u.mfa_secret) return J({ error: "state" }, 400);
    const step = await checkCode(u.mfa_secret, (await body(req)).code, null);
    if (step == null) return fail();
    const at = now();
    await env.DB.prepare("UPDATE users SET mfa_enabled_at=?, mfa_last_step=?, mfa_fails=0, mfa_lock_until=NULL WHERE email=?").bind(at, step, u.email).run();
    await log(env, u.email, "update", "mfa", u.email, null, { title: "MFA uključen" });
    return J({ ok: true }, 200, await makeCookie(env, { ...u, mfa_enabled_at: at }));
  }
  if (p[1] === "verify" && m === "POST") {
    if (!u.mfa_enabled_at) return J({ error: "state" }, 400);
    const step = await checkCode(u.mfa_secret, (await body(req)).code, u.mfa_last_step);
    if (step == null) return fail();
    await env.DB.prepare("UPDATE users SET mfa_last_step=?, mfa_fails=0, mfa_lock_until=NULL WHERE email=?").bind(step, u.email).run();
    return J({ ok: true }, 200, await makeCookie(env, u));
  }
  if (p[1] === "logout" && m === "POST") return J({ ok: true }, 200, `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return J({ error: "not_found" }, 404);
}

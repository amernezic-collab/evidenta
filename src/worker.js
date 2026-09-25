/**
 * Evidenta: internal ISMS / ISO project workspace for SCE Assurance.
 *
 * Bindings (wrangler.toml): DB (D1), FILES (R2, EU jurisdiction), ASSETS (static UI)
 * Variables:
 *   ACCESS_TEAM_DOMAIN  e.g. old-hat-7f0d.cloudflareaccess.com
 *   ACCESS_AUD          Application Audience (AUD) tag of the Cloudflare Access app
 *   ALLOWED_DOMAINS     optional, comma list of e-mail domains or addresses allowed in addition to Access policy
 *   DEV_USER            local development only (wrangler dev); never set in production
 */
import { STANDARDS, GROUPS } from "./catalog.js";
import { risksApi, auditsApi, findingsApi, projectCounters, dashboard, search, report } from "./extra.js";

const MAX_UPLOAD = 25 * 1024 * 1024;
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const S = (v, n = 500) => (v == null ? null : String(v).replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n) || null);

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
});
const err = (status, error) => json({ error }, status);

/* ---------- authentication: Cloudflare Access JWT ---------- */
let certCache = { at: 0, keys: null };
function b64url(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function accessKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("certs " + r.status);
  const { keys } = await r.json();
  certCache = { at: Date.now(), keys };
  return keys;
}
async function verifyAccess(req, env) {
  if (env.DEV_USER) return env.DEV_USER.toLowerCase();
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null; // fail closed
  let token = req.headers.get("cf-access-jwt-assertion");
  if (!token) { const m = (req.headers.get("cookie") || "").match(/CF_Authorization=([^;]+)/); token = m && m[1]; }
  if (!token) return null;
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  let header, payload;
  try { header = JSON.parse(new TextDecoder().decode(b64url(h))); payload = JSON.parse(new TextDecoder().decode(b64url(p))); } catch { return null; }
  if (header.alg !== "RS256") return null;
  const keys = await accessKeys(env.ACCESS_TEAM_DOMAIN);
  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(h + "." + p));
  if (!ok) return null;
  const t = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD) || !payload.exp || payload.exp < t) return null;
  if (payload.iss && payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  const email = String(payload.email || "").toLowerCase();
  if (!email) return null;
  if (env.ALLOWED_DOMAINS) {
    const allow = env.ALLOWED_DOMAINS.toLowerCase().split(",").map(x => x.trim()).filter(Boolean);
    if (!allow.some(a => a.includes("@") ? email === a : email.endsWith("@" + a))) return null;
  }
  return email;
}

/* ---------- helpers ---------- */
async function log(env, user, action, entity, entityId, projectId, detail) {
  await env.DB.prepare("INSERT INTO audit (at,user,action,entity,entity_id,project_id,detail) VALUES (?,?,?,?,?,?,?)")
    .bind(now(), user, action, entity, entityId || null, projectId || null, detail ? JSON.stringify(detail).slice(0, 2000) : null).run();
}
async function body(req) { try { return await req.json(); } catch { return {}; } }
const WEIGHT = { 0: 0, 1: 0.34, 2: 0.67, 3: 1 };

async function projectItems(env, project) {
  const std = STANDARDS[project.standard];
  if (!std) return [];
  const [as, ev, tk] = await Promise.all([
    env.DB.prepare("SELECT * FROM assessments WHERE project_id=?").bind(project.id).all(),
    env.DB.prepare("SELECT item_id, COUNT(*) n FROM evidence WHERE project_id=? AND deleted_at IS NULL AND item_id IS NOT NULL GROUP BY item_id").bind(project.id).all(),
    env.DB.prepare("SELECT item_id, SUM(status!='done') open, COUNT(*) n FROM tasks WHERE project_id=? AND item_id IS NOT NULL GROUP BY item_id").bind(project.id).all()
  ]);
  const A = Object.fromEntries(as.results.map(r => [r.item_id, r]));
  const E = Object.fromEntries(ev.results.map(r => [r.item_id, r.n]));
  const T = Object.fromEntries(tk.results.map(r => [r.item_id, { open: r.open, n: r.n }]));
  return std.items.map(it => {
    const a = A[it.id] || {};
    return { ...it, status: a.status ?? null, applicable: a.applicable ?? 1, justification: a.justification || "", note: a.note || "",
      owner: a.owner || "", updated_at: a.updated_at || null, updated_by: a.updated_by || null, evidence: E[it.id] || 0, tasks: T[it.id] || { open: 0, n: 0 } };
  });
}
function summarize(items) {
  const groups = {};
  let sum = 0, cnt = 0, assessed = 0, applicable = 0;
  for (const it of items) {
    const g = groups[it.kind + ":" + it.group] ||= { kind: it.kind, group: it.group, name: GROUPS[it.kind][it.group], sum: 0, cnt: 0 };
    if (!it.applicable) continue;
    applicable++;
    const w = it.status == null ? 0 : WEIGHT[it.status];
    if (it.status != null) assessed++;
    g.sum += w; g.cnt++; sum += w; cnt++;
  }
  return {
    readiness: cnt ? Math.round((sum / cnt) * 100) : 0,
    assessed, applicable, total: items.length,
    groups: Object.values(groups).map(g => ({ kind: g.kind, group: g.group, name: g.name, pct: g.cnt ? Math.round(g.sum / g.cnt * 100) : 0, n: g.cnt }))
  };
}
function csv(rows) {
  const esc = v => { v = v == null ? "" : String(v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return "﻿" + rows.map(r => r.map(esc).join(";")).join("\r\n");
}
const STATUS_TXT = { null: "Nije ocijenjeno", 0: "Ne postoji", 1: "Djelimično", 2: "Uvedeno", 3: "Dokazano" };

async function listProjects(env, rows) {
  return Promise.all(rows.map(async r => {
    const s = summarize(await projectItems(env, r)), c = await projectCounters(env, r.id);
    return { ...r, readiness: s.readiness, assessed: s.assessed, applicable: s.applicable, total: s.total, ...c };
  }));
}
async function getProject(env, id) {
  return env.DB.prepare("SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.id=?").bind(id).first();
}

/* ---------- API ---------- */
async function api(req, env, url, user) {
  const p = url.pathname.replace(/^\/api/, "").split("/").filter(Boolean);
  const m = req.method;

  if (p[0] === "me") return json({ email: user, standards: Object.fromEntries(Object.entries(STANDARDS).map(([k, v]) => [k, v.name])), groups: GROUPS });

  if (p[0] === "dashboard" && m === "GET") {
    const rows = (await env.DB.prepare("SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.status='active' ORDER BY p.deadline IS NULL, p.deadline").all()).results;
    return json(await dashboard(env, user, await listProjects(env, rows)));
  }
  if (p[0] === "search" && m === "GET") return json(await search(env, url.searchParams.get("q")));

  /* clients */
  if (p[0] === "clients" && !p[1]) {
    if (m === "GET") return json((await env.DB.prepare("SELECT c.*, (SELECT COUNT(*) FROM projects WHERE client_id=c.id) projects FROM clients c ORDER BY name").all()).results);
    if (m === "POST") {
      const b = await body(req); const name = S(b.name, 160); if (!name) return err(400, "name");
      const id = uid();
      await env.DB.prepare("INSERT INTO clients (id,name,country,industry,contact_name,contact_email,notes,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?)")
        .bind(id, name, S(b.country, 60), S(b.industry, 120), S(b.contact_name, 120), S(b.contact_email, 160), S(b.notes, 4000), now(), user).run();
      await log(env, user, "create", "client", id, null, { name });
      return json({ id }, 201);
    }
  }
  if (p[0] === "clients" && p[1] && m === "PUT") {
    const b = await body(req); const name = S(b.name, 160); if (!name) return err(400, "name");
    await env.DB.prepare("UPDATE clients SET name=?,country=?,industry=?,contact_name=?,contact_email=?,notes=? WHERE id=?")
      .bind(name, S(b.country, 60), S(b.industry, 120), S(b.contact_name, 120), S(b.contact_email, 160), S(b.notes, 4000), p[1]).run();
    await log(env, user, "update", "client", p[1], null, { name });
    return json({ ok: true });
  }

  /* projects */
  if (p[0] === "projects" && !p[1]) {
    if (m === "GET") {
      const rows = (await env.DB.prepare("SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id ORDER BY p.status, p.deadline IS NULL, p.deadline").all()).results;
      return json(await listProjects(env, rows));
    }
    if (m === "POST") {
      const b = await body(req);
      const name = S(b.name, 160), client = S(b.client_id, 64), std = STANDARDS[b.standard] ? b.standard : null;
      if (!name || !client || !std) return err(400, "missing");
      if (!(await env.DB.prepare("SELECT 1 FROM clients WHERE id=?").bind(client).first())) return err(400, "client");
      const id = uid();
      await env.DB.prepare("INSERT INTO projects (id,client_id,standard,name,scope,requester,deadline,phase,lead,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, client, std, name, S(b.scope, 4000), S(b.requester, 200), S(b.deadline, 10), S(b.phase, 20) || "gap", S(b.lead, 160) || user, now(), user, now()).run();
      await log(env, user, "create", "project", id, id, { name });
      return json({ id }, 201);
    }
  }

  if (p[0] === "projects" && p[1]) {
    const pr = await getProject(env, p[1]);
    if (!pr) return err(404, "project");
    const sub = p[2];

    if (!sub && m === "GET") { const items = await projectItems(env, pr); return json({ ...pr, summary: summarize(items), counters: await projectCounters(env, pr.id) }); }
    if (sub === "risks") return risksApi(req, env, user, pr, p);
    if (sub === "audits") return auditsApi(req, env, user, pr, p);
    if (sub === "findings") return findingsApi(req, env, user, pr, p);
    if (sub === "report" && m === "GET" && p[3]) {
      const kind = p[3].replace(/\.docx$/, ""), items = await projectItems(env, pr);
      const bytes = await report(env, user, pr, kind, items, summarize(items), url.searchParams.get("audit"));
      if (!bytes) return err(404, "report");
      const names = { gap: "Gap_analiza", soa: "Izjava_o_primjenjivosti", risks: "Registar_rizika", tasks: "Plan_mjera", audit: "Izvjestaj_o_auditu" };
      const safe = (pr.client_name + "_" + pr.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\-]+/g, "_").slice(0, 60);
      await log(env, user, "export", "project", pr.id, pr.id, { file: kind + ".docx" });
      return new Response(bytes, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${names[kind]}_${safe}.docx"`, "cache-control": "no-store" } });
    }
    if (!sub && m === "PUT") {
      const b = await body(req);
      await env.DB.prepare("UPDATE projects SET name=?,scope=?,requester=?,deadline=?,phase=?,status=?,lead=?,updated_at=? WHERE id=?")
        .bind(S(b.name, 160) || pr.name, S(b.scope, 4000), S(b.requester, 200), S(b.deadline, 10), S(b.phase, 20) || pr.phase,
          ["active", "closed"].includes(b.status) ? b.status : pr.status, S(b.lead, 160), now(), pr.id).run();
      await log(env, user, "update", "project", pr.id, pr.id, { name: b.name, phase: b.phase, status: b.status });
      return json({ ok: true });
    }

    if (sub === "items" && !p[3] && m === "GET") return json(await projectItems(env, pr));
    if (sub === "items" && p[3] && m === "PUT") {
      const item = STANDARDS[pr.standard].items.find(i => i.id === p[3]);
      if (!item) return err(404, "item");
      const b = await body(req);
      const status = b.status === null || b.status === "" ? null : [0, 1, 2, 3].includes(+b.status) ? +b.status : null;
      const applicable = b.applicable === 0 || b.applicable === false ? 0 : 1;
      if (item.kind === "clause" && applicable === 0) return err(400, "clauses are mandatory");
      await env.DB.prepare(`INSERT INTO assessments (project_id,item_id,status,applicable,justification,note,owner,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?)
        ON CONFLICT(project_id,item_id) DO UPDATE SET status=excluded.status, applicable=excluded.applicable, justification=excluded.justification,
        note=excluded.note, owner=excluded.owner, updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
        .bind(pr.id, item.id, status, applicable, S(b.justification, 2000), S(b.note, 8000), S(b.owner, 160), now(), user).run();
      await log(env, user, "assess", "item", item.code, pr.id, { status: STATUS_TXT[status], applicable });
      return json({ ok: true });
    }

    if (sub === "tasks" && m === "GET") return json((await env.DB.prepare("SELECT * FROM tasks WHERE project_id=? ORDER BY status='done', due IS NULL, due, created_at").bind(pr.id).all()).results);
    if (sub === "tasks" && m === "POST") {
      const b = await body(req); const title = S(b.title, 300); if (!title) return err(400, "title");
      const id = uid();
      await env.DB.prepare("INSERT INTO tasks (id,project_id,item_id,risk_id,finding_id,title,owner,due,status,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, pr.id, S(b.item_id, 20), S(b.risk_id, 64), S(b.finding_id, 64), title, S(b.owner, 160), S(b.due, 10), "open", now(), user, now()).run();
      await log(env, user, "create", "task", id, pr.id, { title });
      return json({ id }, 201);
    }

    if (sub === "evidence" && m === "GET") return json((await env.DB.prepare("SELECT id,item_id,name,size,content_type,note,uploaded_at,uploaded_by FROM evidence WHERE project_id=? AND deleted_at IS NULL ORDER BY uploaded_at DESC").bind(pr.id).all()).results);
    if (sub === "evidence" && m === "POST") {
      const len = +(req.headers.get("content-length") || 0);
      if (len > MAX_UPLOAD + 100000) return err(413, "too_large");
      const fd = await req.formData();
      const f = fd.get("file");
      if (!f || typeof f === "string") return err(400, "file");
      if (f.size > MAX_UPLOAD) return err(413, "too_large");
      const id = uid(), key = `projects/${pr.id}/${id}`;
      const name = S(f.name, 200) || "dokument";
      await env.FILES.put(key, f.stream(), { httpMetadata: { contentType: f.type || "application/octet-stream" }, customMetadata: { name, project: pr.id, by: user } });
      const itemId = S(fd.get("item_id"), 20);
      await env.DB.prepare("INSERT INTO evidence (id,project_id,item_id,name,r2_key,size,content_type,note,uploaded_at,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .bind(id, pr.id, itemId, name, key, f.size, f.type || null, S(fd.get("note"), 1000), now(), user).run();
      await log(env, user, "upload", "evidence", id, pr.id, { name, item: itemId });
      return json({ id }, 201);
    }

    if (sub === "audit" && m === "GET") return json((await env.DB.prepare("SELECT * FROM audit WHERE project_id=? ORDER BY id DESC LIMIT 300").bind(pr.id).all()).results);

    if (sub === "export" && m === "GET") {
      const items = await projectItems(env, pr);
      const safe = (pr.client_name + "_" + pr.name).replace(/[^\w\-]+/g, "_").slice(0, 60);
      let rows, fname;
      if (p[3] === "soa.csv") {
        rows = [["Kontrola", "Naziv", "Primjenjiva", "Obrazloženje", "Status", "Odgovorni", "Broj dokaza"]]
          .concat(items.filter(i => i.kind === "control").map(i => [i.code, i.title, i.applicable ? "Da" : "Ne", i.justification, STATUS_TXT[i.status], i.owner, i.evidence]));
        fname = `SoA_${safe}.csv`;
      } else if (p[3] === "gap.csv") {
        rows = [["Oznaka", "Vrsta", "Naziv", "Primjenjivo", "Status", "Napomena", "Odgovorni", "Dokazi", "Otvorene mjere"]]
          .concat(items.map(i => [i.code, i.kind === "clause" ? "Zahtjev" : "Kontrola", i.title, i.applicable ? "Da" : "Ne", STATUS_TXT[i.status], i.note, i.owner, i.evidence, i.tasks.open]));
        fname = `Gap_analiza_${safe}.csv`;
      } else if (p[3] === "tasks.csv") {
        const t = (await env.DB.prepare("SELECT * FROM tasks WHERE project_id=? ORDER BY due").bind(pr.id).all()).results;
        const code = Object.fromEntries(items.map(i => [i.id, i.code]));
        rows = [["Mjera", "Veza", "Odgovorni", "Rok", "Status"]].concat(t.map(x => [x.title, code[x.item_id] || "", x.owner, x.due, { open: "Otvoreno", doing: "U toku", done: "Završeno" }[x.status]]));
        fname = `Plan_mjera_${safe}.csv`;
      } else return err(404, "export");
      await log(env, user, "export", "project", pr.id, pr.id, { file: p[3] });
      return new Response(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${fname}"`, "cache-control": "no-store" } });
    }
    return err(404, "not_found");
  }

  /* tasks by id */
  if (p[0] === "tasks" && p[1]) {
    const t = await env.DB.prepare("SELECT * FROM tasks WHERE id=?").bind(p[1]).first();
    if (!t) return err(404, "task");
    if (m === "PUT") {
      const b = await body(req);
      await env.DB.prepare("UPDATE tasks SET title=?,owner=?,due=?,status=?,item_id=?,updated_at=? WHERE id=?")
        .bind(S(b.title, 300) || t.title, S(b.owner, 160), S(b.due, 10), ["open", "doing", "done"].includes(b.status) ? b.status : t.status,
          b.item_id === undefined ? t.item_id : S(b.item_id, 20), now(), t.id).run();
      await log(env, user, "update", "task", t.id, t.project_id, { title: b.title || t.title, status: b.status });
      return json({ ok: true });
    }
    if (m === "DELETE") {
      await env.DB.prepare("DELETE FROM tasks WHERE id=?").bind(t.id).run();
      await log(env, user, "delete", "task", t.id, t.project_id, { title: t.title });
      return json({ ok: true });
    }
  }

  /* evidence by id */
  if (p[0] === "evidence" && p[1]) {
    const e = await env.DB.prepare("SELECT * FROM evidence WHERE id=? AND deleted_at IS NULL").bind(p[1]).first();
    if (!e) return err(404, "evidence");
    if (m === "GET" && p[2] === "download") {
      const obj = await env.FILES.get(e.r2_key);
      if (!obj) return err(404, "file");
      await log(env, user, "download", "evidence", e.id, e.project_id, { name: e.name });
      const fn = encodeURIComponent(e.name);
      return new Response(obj.body, { headers: {
        "content-type": "application/octet-stream", "content-disposition": `attachment; filename*=UTF-8''${fn}`,
        "x-content-type-options": "nosniff", "cache-control": "no-store" } });
    }
    if (m === "PUT") {
      const b = await body(req);
      await env.DB.prepare("UPDATE evidence SET item_id=?, note=? WHERE id=?").bind(S(b.item_id, 20), S(b.note, 1000), e.id).run();
      await log(env, user, "update", "evidence", e.id, e.project_id, { name: e.name, item: b.item_id });
      return json({ ok: true });
    }
    if (m === "DELETE") {
      // soft delete in the register, the file is removed from storage
      await env.FILES.delete(e.r2_key);
      await env.DB.prepare("UPDATE evidence SET deleted_at=? WHERE id=?").bind(now(), e.id).run();
      await log(env, user, "delete", "evidence", e.id, e.project_id, { name: e.name });
      return json({ ok: true });
    }
  }

  return err(404, "not_found");
}

const SEC = {
  "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  "x-robots-tag": "noindex, nofollow"
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const user = await verifyAccess(req, env).catch(() => null);
    if (!user) return new Response("Pristup odbijen. Prijavite se preko Cloudflare Access.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8", ...SEC } });
    let res;
    if (url.pathname.startsWith("/api/")) {
      if (!["GET", "HEAD"].includes(req.method)) {
        const o = req.headers.get("origin");
        if (o && new URL(o).host !== url.host) return err(403, "origin");
      }
      try { res = await api(req, env, url, user); }
      catch (e) { console.error(e); res = err(500, "server"); }
    } else {
      res = await env.ASSETS.fetch(req);
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SEC)) out.headers.set(k, v);
    return out;
  }
};

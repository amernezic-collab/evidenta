/*
 * Evidenta: generic registers, management reviews, Excel register export,
 * readiness history and the management summary / review minutes in Word.
 */
import { REGISTERS, registersFor, OPEN_STATUS } from "./registers.js";
import { STANDARDS } from "./catalog.js";
import { buildXlsx } from "./xlsx.js";
import { buildDocx, DOCX_W as W } from "./docx.js";
import { fmtD, stCell, lvCell, R, N, STATUS_TXT, LEVEL_TXT, RISK_LEVEL, TREAT_TXT, RSTAT_TXT, FKIND_TXT, FSTAT_TXT, AKIND_TXT, TSTAT_TXT, PHASES, log, nextRef } from "./extra.js";

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const S = (v, n = 500) => (v == null ? null : String(v).replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n) || null);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (status, error) => json({ error }, status);
async function body(req) { try { return await req.json(); } catch { return {}; } }
const parse = s => { try { return JSON.parse(s || "{}"); } catch (e) { return {}; } };

/* ---------- registers (records) ---------- */
function clean(def, d) {
  const out = {};
  for (const f of def.fields) {
    let v = d[f.k];
    if (v == null || v === "") continue;
    if (f.t === "num") { v = Number(v); if (!isFinite(v)) continue; }
    else if (f.t === "date") { v = String(v).slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) continue; }
    else if (f.t === "sel") { if (!f.o.includes(v)) continue; }
    else if (f.t === "yn") { if (!["Da", "Ne"].includes(v)) continue; }
    else v = S(v, f.t === "area" ? 4000 : 300);
    if (v != null) out[f.k] = v;
  }
  return out;
}
const recTitle = (type, d) => (REGISTERS[type] && d[REGISTERS[type].title]) || "";
export const recRef = (type, ref) => `${REGISTERS[type].prefix}-${String(ref).padStart(3, "0")}`;

export async function recordsApi(req, env, user, pr, p, url, canEdit) {
  const m = req.method;
  if (!p[3] && m === "GET") {
    const type = url.searchParams.get("type");
    if (!type) {
      const rows = (await env.DB.prepare("SELECT type, data FROM records WHERE project_id=?").bind(pr.id).all()).results;
      const counts = {};
      for (const r of rows) { const c = counts[r.type] ||= { n: 0, open: 0 }; c.n++; const st = parse(r.data).status; if (OPEN_STATUS[r.type] && OPEN_STATUS[r.type].includes(st)) c.open++; }
      return json({ counts, recommended: registersFor(pr.standard) });
    }
    if (!REGISTERS[type]) return err(400, "type");
    const rows = (await env.DB.prepare("SELECT * FROM records WHERE project_id=? AND type=? ORDER BY ref").bind(pr.id, type).all()).results;
    return json(rows.map(r => ({ ...r, data: parse(r.data) })));
  }
  if (!canEdit) return err(403, "read_only");
  if (!p[3] && m === "POST") {
    const b = await body(req), def = REGISTERS[b.type];
    if (!def) return err(400, "type");
    const d = clean(def, b.data || {});
    if (!d[def.title]) return err(400, "title");
    const id = uid(), ref = (await env.DB.prepare("SELECT COALESCE(MAX(ref),0)+1 n FROM records WHERE project_id=? AND type=?").bind(pr.id, b.type).first()).n;
    await env.DB.prepare("INSERT INTO records (id,project_id,type,ref,data,created_at,created_by,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(id, pr.id, b.type, ref, JSON.stringify(d), now(), user, now(), user).run();
    await log(env, user, "create", "record", id, pr.id, { title: `${recRef(b.type, ref)} ${recTitle(b.type, d)}` });
    return json({ id, ref }, 201);
  }
  if (p[3]) {
    const r = await env.DB.prepare("SELECT * FROM records WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!r) return err(404, "record");
    if (m === "PUT") {
      const b = await body(req), d = clean(REGISTERS[r.type], b.data || {});
      if (!d[REGISTERS[r.type].title]) return err(400, "title");
      await env.DB.prepare("UPDATE records SET data=?, updated_at=?, updated_by=? WHERE id=?").bind(JSON.stringify(d), now(), user, r.id).run();
      await log(env, user, "update", "record", r.id, pr.id, { title: `${recRef(r.type, r.ref)} ${recTitle(r.type, d)}` });
      return json({ ok: true });
    }
    if (m === "DELETE") {
      await env.DB.batch([env.DB.prepare("DELETE FROM records WHERE id=?").bind(r.id), env.DB.prepare("UPDATE tasks SET record_id=NULL WHERE record_id=?").bind(r.id)]);
      await log(env, user, "delete", "record", r.id, pr.id, { title: `${recRef(r.type, r.ref)} ${recTitle(r.type, parse(r.data))}` });
      return json({ ok: true });
    }
  }
  return err(404, "not_found");
}

/* ---------- management reviews ---------- */
export const REVIEW_IN = [
  ["prev", "Status mjera s prethodnih preispitivanja"], ["issues", "Promjene unutrašnjih i vanjskih pitanja"],
  ["parties", "Promjene potreba i očekivanja zainteresovanih strana"], ["nc", "Nesukladnosti i korektivne mjere"],
  ["monitoring", "Rezultati praćenja i mjerenja"], ["audits", "Rezultati audita"], ["objectives", "Ispunjenost ciljeva"],
  ["customers", "Povratne informacije kupaca i zainteresovanih strana"], ["suppliers", "Performanse dobavljača"],
  ["risks", "Rizici i prilike, status plana tretmana"], ["incidents", "Incidenti i kontinuitet"], ["resources", "Adekvatnost resursa"],
  ["ofi", "Prilike za poboljšanje"]];
export const REVIEW_OUT = [
  ["conclusion", "Zaključak o pogodnosti, adekvatnosti i efikasnosti sistema"], ["decisions", "Odluke o poboljšanjima"],
  ["changes", "Potrebne promjene sistema"], ["needs", "Potrebe za resursima"]];
const RSTAT = { planned: "Planirano", held: "Održano", approved: "Zapisnik odobren" };

export async function reviewsApi(req, env, user, pr, p, canEdit) {
  const m = req.method;
  if (p[3] === "autofill" && m === "GET") return json(await autofill(env, pr, new URL(req.url).searchParams.get("exclude")));
  if (!p[3] && m === "GET") return json((await env.DB.prepare("SELECT * FROM reviews WHERE project_id=? ORDER BY date DESC, created_at DESC").bind(pr.id).all()).results.map(r => ({ ...r, data: parse(r.data) })));
  if (!canEdit) return err(403, "read_only");
  const keys = [...REVIEW_IN, ...REVIEW_OUT].map(x => x[0]);
  const pack = b => { const d = {}; for (const k of keys) { const v = S((b.data || {})[k], 8000); if (v) d[k] = v; } return JSON.stringify(d); };
  if (!p[3] && m === "POST") {
    const b = await body(req); const title = S(b.title, 200) || "Preispitivanje od strane uprave";
    const id = uid();
    await env.DB.prepare("INSERT INTO reviews (id,project_id,date,title,participants,status,data,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(id, pr.id, S(b.date, 10), title, S(b.participants, 1000), RSTAT[b.status] ? b.status : "planned", pack(b), now(), user, now()).run();
    await log(env, user, "create", "review", id, pr.id, { title });
    return json({ id }, 201);
  }
  if (p[3]) {
    const r = await env.DB.prepare("SELECT * FROM reviews WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!r) return err(404, "review");
    if (m === "PUT") {
      const b = await body(req); const title = S(b.title, 200) || r.title;
      await env.DB.prepare("UPDATE reviews SET date=?,title=?,participants=?,status=?,data=?,updated_at=? WHERE id=?")
        .bind(S(b.date, 10), title, S(b.participants, 1000), RSTAT[b.status] ? b.status : r.status, pack(b), now(), r.id).run();
      await log(env, user, "update", "review", r.id, pr.id, { title });
      return json({ ok: true });
    }
    if (m === "DELETE") {
      await env.DB.batch([env.DB.prepare("DELETE FROM reviews WHERE id=?").bind(r.id), env.DB.prepare("UPDATE tasks SET review_id=NULL WHERE review_id=?").bind(r.id)]);
      await log(env, user, "delete", "review", r.id, pr.id, { title: r.title });
      return json({ ok: true });
    }
  }
  return err(404, "not_found");
}

async function loadAll(env, pr) {
  const q = sql => env.DB.prepare(sql).bind(pr.id).all().then(r => r.results);
  const [tasks, risks, findings, audits, records, reviews, evidence, history] = await Promise.all([
    q("SELECT * FROM tasks WHERE project_id=? ORDER BY status='done', due IS NULL, due"), q("SELECT * FROM risks WHERE project_id=? ORDER BY ref"),
    q("SELECT * FROM findings WHERE project_id=? ORDER BY ref"), q("SELECT * FROM audits WHERE project_id=? ORDER BY date"),
    q("SELECT * FROM records WHERE project_id=? ORDER BY type, ref"), q("SELECT * FROM reviews WHERE project_id=? ORDER BY date"),
    q("SELECT id,item_id,name,size,uploaded_at,uploaded_by FROM evidence WHERE project_id=? AND deleted_at IS NULL ORDER BY uploaded_at"),
    q("SELECT * FROM snapshots WHERE project_id=? ORDER BY day")]);
  const rec = t => records.filter(r => r.type === t).map(r => ({ ...r, data: parse(r.data) }));
  return { tasks, risks, findings, audits, records, reviews: reviews.map(r => ({ ...r, data: parse(r.data) })), evidence, history, rec };
}

/* suggested review inputs from data already in Evidenta */
async function autofill(env, pr, exclude) {
  const D = await loadAll(env, pr), out = {};
  const cur = D.reviews.find(r => r.id === exclude);
  const last = D.reviews.filter(r => r.id !== exclude && r.status !== "planned" && (!cur || !cur.date || !r.date || r.date <= cur.date)).slice(-1)[0];
  if (last) { const t = D.tasks.filter(x => x.review_id === last.id); out.prev = `Preispitivanje od ${fmtD(last.date).replace(/\.$/, "")}: ${t.length} mjera, završeno ${t.filter(x => x.status === "done").length}, otvoreno ${t.filter(x => x.status !== "done").length}.`; }
  const ctx = D.rec("context"), par = D.rec("parties");
  if (ctx.length) out.issues = `Registar sadrži ${ctx.length} unutrašnjih i vanjskih pitanja. Zadnja izmjena: ${ctx.map(r => r.updated_at).sort().slice(-1).map(fmtD)[0]}.`;
  if (par.length) out.parties = `Evidentirano ${par.length} zainteresovanih strana, od toga ${par.filter(r => r.data.relevant === "Da").length} s zahtjevima koji ulaze u sistem.`;
  const f = D.findings;
  if (f.length) out.nc = `Ukupno ${f.length} nalaza: ${Object.keys(FKIND_TXT).map(k => `${FKIND_TXT[k].toLowerCase()} ${f.filter(x => x.kind === k).length}`).join(", ")}. Otvoreno ${f.filter(x => x.status !== "closed").length}, zatvoreno ${f.filter(x => x.status === "closed").length}.`;
  const h = D.history;
  if (h.length) { const a = h[Math.max(0, h.length - 31)], b = h[h.length - 1], dd = Math.round((new Date(b.day) - new Date(a.day)) / 864e5); out.monitoring = `Spremnost ${b.readiness} %${dd > 0 ? ` (prije ${dd} dana ${a.readiness} %)` : ""}. Otvorenih mjera ${b.open_tasks}, otvorenih nalaza ${b.open_findings}.`; }
  if (D.audits.length) out.audits = D.audits.map(a => `${AKIND_TXT[a.kind]} "${a.title}" ${fmtD(a.date)}: ${f.filter(x => x.audit_id === a.id).length} nalaza.`).join("\n");
  const obj = D.rec("objectives");
  if (obj.length) out.objectives = `${obj.length} ciljeva: ${["Ostvaren", "Na putu", "Rizik", "Nije ostvaren"].map(s => `${s.toLowerCase()} ${obj.filter(o => o.data.status === s).length}`).join(", ")}.`;
  const cm = D.rec("complaints");
  if (cm.length) out.customers = `${cm.length} evidentiranih povratnih informacija, od toga ${cm.filter(c => c.data.kind === "Reklamacija").length} reklamacija; otvoreno ${cm.filter(c => c.data.status !== "Zatvoreno").length}.`;
  const sp = D.rec("suppliers");
  if (sp.length) out.suppliers = `${sp.length} dobavljača u registru, kritičnih ${sp.filter(s => s.data.critical === "Visok").length}, neodobrenih ${sp.filter(s => s.data.score === "Nije odobren").length}, bez ocjene ${sp.filter(s => !s.data.evaluated).length}.`;
  const rk = D.risks.filter(r => r.status !== "closed");
  if (D.risks.length) out.risks = `${D.risks.length} rizika u registru. Aktivni po nivou: ${["critical", "high", "medium", "low"].map(l => `${LEVEL_TXT[l].toLowerCase()} ${rk.filter(r => RISK_LEVEL(r.likelihood * r.impact) === l).length}`).join(", ")}. U tretmanu ${rk.filter(r => r.status === "treating").length}, prihvaćeno ${rk.filter(r => r.status === "accepted").length}.`;
  const inc = D.rec("incidents");
  if (inc.length) out.incidents = `${inc.length} incidenata, značajnih ${inc.filter(i => i.data.significant === "Da").length}, otvorenih ${inc.filter(i => i.data.status !== "Zatvoren").length}.`;
  const imp = D.rec("improvements"), ofiF = f.filter(x => x.kind === "ofi" && x.status !== "closed");
  if (imp.length || ofiF.length) out.ofi = [...imp.filter(i => OPEN_STATUS.improvements.includes(i.data.status)).map(i => `${recRef("improvements", i.ref)} ${i.data.title} (${i.data.status})`), ...ofiF.map(x => `${N(x.ref)} ${x.title}`)].join("\n");
  return out;
}

/* ---------- readiness history ---------- */
export async function snapshot(env, pr, summary, counters) {
  const day = now().slice(0, 10);
  await env.DB.prepare("INSERT INTO snapshots (project_id,day,readiness,assessed,open_tasks,open_findings) VALUES (?,?,?,?,?,?) ON CONFLICT(project_id,day) DO UPDATE SET readiness=excluded.readiness, assessed=excluded.assessed, open_tasks=excluded.open_tasks, open_findings=excluded.open_findings")
    .bind(pr.id, day, summary.readiness, summary.assessed, counters.open_tasks, counters.open_findings).run();
}
export async function history(env, pr) {
  return (await env.DB.prepare("SELECT day, readiness, assessed, open_tasks, open_findings FROM snapshots WHERE project_id=? ORDER BY day DESC LIMIT 365").bind(pr.id).all()).results.reverse();
}

/* ---------- Excel registers ---------- */
export async function registersXlsx(env, pr, items, summary, type, user) {
  const D = await loadAll(env, pr), CAT = STANDARDS[pr.standard];
  const code = Object.fromEntries(items.map(i => [i.id, i.code]));
  const sub = `${pr.client_name} · ${pr.name} · ${CAT.name} · stanje na dan ${fmtD(now())} · Povjerljivo`;
  const link = t => code[t.item_id] || (t.risk_id ? R((D.risks.find(r => r.id === t.risk_id) || {}).ref || 0) : t.finding_id ? N((D.findings.find(r => r.id === t.finding_id) || {}).ref || 0) : t.review_id ? "Preispitivanje" : "");
  const sheets = {
    summary: () => ({ name: "Sažetak", title: "Sažetak projekta", columns: [{ label: "Pokazatelj", width: 36 }, { label: "Vrijednost", width: 50 }],
      rows: [["Klijent", pr.client_name], ["Projekat", pr.name], ["Standard", CAT.name], ["Faza", PHASES[pr.phase] || pr.phase], ["Rok za audit", fmtD(pr.deadline)],
        ["Spremnost (%)", summary.readiness], ["Ocijenjeno stavki", `${summary.assessed} od ${summary.applicable}`], ["Otvorene mjere", D.tasks.filter(t => t.status !== "done").length],
        ["Otvoreni nalazi", D.findings.filter(f => f.status !== "closed").length], ["Rizika u registru", D.risks.length], ["Priloženih dokaza", D.evidence.length],
        ...summary.groups.map(g => [`${CAT.kinds[g.kind].gp}${g.group} ${g.name} (%)`, g.pct])] }),
    items: () => ({ name: "Status zahtjeva", title: `Status zahtjeva: ${CAT.name}`, columns: [{ label: "Oznaka", width: 12 }, { label: "Naziv", width: 38 }, { label: "Oblast", width: 24 }, { label: "Primjenjivo", width: 11 }, { label: "Status", width: 15 }, { label: "Nalaz i napomena", width: 44 }, { label: "Odgovorni", width: 18 }, { label: "Dokazi", width: 8 }, { label: "Otvorene mjere", width: 10 }],
      rows: items.map(i => [i.code, i.title, i.gname, i.applicable ? "Da" : "Ne", STATUS_TXT[i.status], i.note || i.justification || "", i.owner, i.evidence, i.tasks.open]) }),
    soa: () => CAT.soa ? ({ name: "SoA", title: "Izjava o primjenjivosti", columns: [{ label: "Kontrola", width: 10 }, { label: "Naziv", width: 38 }, { label: "Primjenjiva", width: 11 }, { label: "Obrazloženje", width: 50 }, { label: "Status", width: 15 }, { label: "Odgovorni", width: 18 }],
      rows: items.filter(i => i.kind === "control").map(i => [i.code, i.title, i.applicable ? "Da" : "Ne", i.justification, i.applicable ? STATUS_TXT[i.status] : "", i.owner]) }) : null,
    risks: () => ({ name: "Registar rizika", title: "Registar rizika", columns: [{ label: "Oznaka", width: 9 }, { label: "Imovina ili proces", width: 28 }, { label: "Prijetnja", width: 24 }, { label: "Ranjivost", width: 24 }, { label: "Vlasnik", width: 16 }, { label: "V", width: 5 }, { label: "U", width: 5 }, { label: "Nivo", width: 10 }, { label: "Tretman", width: 11 }, { label: "Kontrole", width: 20 }, { label: "Plan tretmana", width: 36 }, { label: "Rez. V", width: 7 }, { label: "Rez. U", width: 7 }, { label: "Rez. nivo", width: 10 }, { label: "Status", width: 12 }, { label: "Pregled", width: 12 }],
      rows: D.risks.map(r => [R(r.ref), r.asset, r.threat, r.vulnerability, r.owner, r.likelihood, r.impact, r.likelihood && r.impact ? `${r.likelihood * r.impact} ${LEVEL_TXT[RISK_LEVEL(r.likelihood * r.impact)]}` : "", TREAT_TXT[r.treatment], (r.controls || "").split(",").filter(Boolean).map(c => code[c]).join(", "), r.plan, r.res_likelihood, r.res_impact, r.res_likelihood && r.res_impact ? `${r.res_likelihood * r.res_impact} ${LEVEL_TXT[RISK_LEVEL(r.res_likelihood * r.res_impact)]}` : "", RSTAT_TXT[r.status], fmtD(r.review_date)]) }),
    tasks: () => ({ name: "Plan mjera", title: "Plan mjera", columns: [{ label: "Mjera", width: 44 }, { label: "Veza", width: 14 }, { label: "Odgovorni", width: 18 }, { label: "Rok", width: 12 }, { label: "Status", width: 12 }],
      rows: D.tasks.map(t => [t.title, link(t), t.owner, fmtD(t.due), TSTAT_TXT[t.status]]) }),
    findings: () => ({ name: "Nalazi i korektivne mjere", title: "Registar nalaza, nesukladnosti i korektivnih mjera", columns: [{ label: "Oznaka", width: 9 }, { label: "Vrsta", width: 18 }, { label: "Nalaz", width: 32 }, { label: "Zahtjev", width: 10 }, { label: "Audit", width: 20 }, { label: "Opis i dokaz", width: 36 }, { label: "Uzrok", width: 28 }, { label: "Korekcija i korektivna mjera", width: 32 }, { label: "Odgovorni", width: 16 }, { label: "Rok", width: 12 }, { label: "Status", width: 16 }, { label: "Zatvoren", width: 12 }],
      rows: D.findings.map(f => [N(f.ref), FKIND_TXT[f.kind], f.title, code[f.item_id] || "", (D.audits.find(a => a.id === f.audit_id) || {}).title || "", f.description, f.cause, f.correction, f.owner, fmtD(f.due), FSTAT_TXT[f.status], f.closed_at ? fmtD(f.closed_at) : ""]) }),
    audits: () => ({ name: "Program audita", title: "Program i zapisi audita", columns: [{ label: "Audit", width: 32 }, { label: "Vrsta", width: 18 }, { label: "Datum", width: 12 }, { label: "Auditor", width: 18 }, { label: "Obim", width: 36 }, { label: "Status", width: 11 }, { label: "Nalaza", width: 8 }, { label: "Sažetak", width: 50 }],
      rows: D.audits.map(a => [a.title, AKIND_TXT[a.kind], fmtD(a.date), a.auditor, a.scope, a.status === "done" ? "Završen" : "Planiran", D.findings.filter(f => f.audit_id === a.id).length, a.summary]) }),
    reviews: () => ({ name: "Preispitivanja uprave", title: "Preispitivanja od strane uprave", columns: [{ label: "Datum", width: 12 }, { label: "Naziv", width: 28 }, { label: "Učesnici", width: 28 }, { label: "Status", width: 16 }, { label: "Zaključak", width: 44 }, { label: "Odluke", width: 44 }, { label: "Mjere", width: 8 }],
      rows: D.reviews.map(r => [fmtD(r.date), r.title, r.participants, RSTAT[r.status], r.data.conclusion, r.data.decisions, D.tasks.filter(t => t.review_id === r.id).length]) }),
    evidence: () => ({ name: "Dokazi", title: "Registar dokaza", columns: [{ label: "Dokument", width: 44 }, { label: "Veza", width: 12 }, { label: "Veličina (KB)", width: 12 }, { label: "Dodao", width: 24 }, { label: "Datum", width: 12 }],
      rows: D.evidence.map(e => [e.name, code[e.item_id] || "", Math.max(1, Math.round(e.size / 1024)), e.uploaded_by, fmtD(e.uploaded_at)]) })
  };
  for (const [k, def] of Object.entries(REGISTERS)) {
    sheets["r:" + k] = () => ({ name: def.name, title: def.name, columns: [{ label: "Oznaka", width: 10 }, ...def.fields.map(f => ({ label: f.l, width: f.w }))],
      rows: D.rec(k).map(r => [recRef(k, r.ref), ...def.fields.map(f => f.t === "date" ? (r.data[f.k] ? fmtD(r.data[f.k]) : "") : r.data[f.k] ?? "")]) });
  }
  let keys;
  if (type === "all") {
    const used = new Set(D.records.map(r => r.type));
    keys = ["summary", "items", "soa", "risks", "tasks", "findings", "audits", "reviews", "evidence", ...Object.keys(REGISTERS).filter(k => registersFor(pr.standard).includes(k) || used.has(k)).map(k => "r:" + k)];
  } else keys = [type];
  const out = keys.map(k => sheets[k] && sheets[k]()).filter(Boolean).map(s => ({ ...s, subtitle: sub }));
  if (!out.length) return null;
  return { bytes: buildXlsx(out), name: type === "all" ? "Registri" : out[0].name.replace(/\s+/g, "_") };
}

/* ---------- Word: management summary and review minutes ---------- */
const STC = { 3: "1F9E7F", 2: "2F7DE1", 1: "E37222", 0: "C2410C" };
export async function mgmtDocx(env, user, pr, items, summary, meta, note) {
  const D = await loadAll(env, pr), CAT = STANDARDS[pr.standard], K = CAT.kinds;
  const app = items.filter(i => i.applicable), openT = D.tasks.filter(t => t.status !== "done"), late = openT.filter(t => t.due && t.due < now().slice(0, 10));
  const openF = D.findings.filter(f => f.status !== "closed"), major = openF.filter(f => f.kind === "major");
  const activeR = D.risks.filter(r => r.status !== "closed"), highR = activeR.filter(r => r.likelihood * r.impact >= 10).sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact);
  const h = D.history, prev = h.length > 1 ? h[Math.max(0, h.length - 31)] : null, days = pr.deadline ? Math.ceil((new Date(pr.deadline) - new Date()) / 864e5) : null;
  const trend = prev ? `${summary.readiness - prev.readiness >= 0 ? "+" : ""}${summary.readiness - prev.readiness} procentnih poena od ${fmtD(prev.day)}` : "prvo mjerenje";
  const dist = [3, 2, 1, 0, null].map(s => ({ s, n: app.filter(i => (i.status ?? null) === s).length }));
  const docs = D.rec("documents").filter(d => d.data.status === "U odobravanju");
  const decide = [
    ...(major.length ? [`Zatvoriti ${major.length} glavnih nesukladnosti prije certifikacijskog audita.`] : []),
    ...(late.length ? [`${late.length} mjera kasni; potrebna odluka o resursima ili novim rokovima.`] : []),
    ...(highR.filter(r => r.treatment === "accept" && r.status !== "accepted").length ? ["Formalno prihvatiti rizike visokog nivoa koji su označeni za prihvatanje."] : []),
    ...(highR.filter(r => !r.plan && r.treatment !== "accept").length ? [`${highR.filter(r => !r.plan && r.treatment !== "accept").length} visokih rizika nema plan tretmana.`] : []),
    ...(docs.length ? [`Odobriti ${docs.length} dokumenata koji čekaju odobrenje.`] : []),
    ...(days != null && days < 60 && summary.readiness < 75 ? [`Do audita je ${days} dana, a spremnost je ${summary.readiness} %; preporučujemo ubrzati ključne mjere ili pomjeriti termin.`] : [])];
  const barRows = k => summary.groups.filter(g => g.kind === k).map(g => [K[k].gp + g.group, g.name, { bar: g.pct, color: g.pct >= 75 ? "1F9E7F" : g.pct >= 40 ? "2F7DE1" : "E37222" }, { t: g.pct + " %", bold: true, align: "right" }]);
  const tiles = k => { const list = items.filter(i => i.kind === k), rows = []; for (let i = 0; i < list.length; i += 8) rows.push(list.slice(i, i + 8)); return rows.map(r => [...r.map(i => ({ t: i.code, size: 15, bold: true, fill: !i.applicable ? "F1F4F8" : i.status == null ? "FFFFFF" : ["FDECE4", "FDF0E6", "E8F1FD", "E4F5F0"][i.status], color: !i.applicable ? "B5C0CC" : i.status == null ? "8A97A6" : STC[i.status], align: "center" })), ...Array(8 - r.length).fill("")]); };
  const blocks = [
    { h1: "1. Ključni pokazatelji" },
    { kv: [["Spremnost", `${summary.readiness} % (${trend})`], ["Ocijenjeno", `${summary.assessed} od ${summary.applicable} primjenjivih stavki`], ["Mjere", `${openT.length} otvorenih, od toga ${late.length} kasni; ${D.tasks.length - openT.length} završenih`],
      ["Nalazi", `${openF.length} otvorenih, od toga ${major.length} glavnih nesukladnosti`], ["Rizici", `${activeR.length} aktivnih, ${highR.length} visokih ili kritičnih`], ["Dokazi", `${D.evidence.length} priloženih dokumenata`],
      ["Rok za audit", pr.deadline ? `${fmtD(pr.deadline)} (${days} dana)` : "nije određen"]] },
    { h1: "2. Odluke i podrška koje se traže od uprave" },
    decide.length ? { bullets: decide } : { p: "Trenutno nema otvorenih pitanja koja traže odluku uprave." },
    { h1: "3. Spremnost po oblastima" },
    ...Object.keys(K).flatMap(k => [{ h2: K[k].title }, { table: { widths: [1000, 3900, 3500, W - 8400], head: ["Oznaka", "Oblast", "Spremnost", "%"], rows: barRows(k) } }]),
    { h2: "Raspodjela statusa" },
    { table: { widths: [2600, 5000, W - 7600], head: ["Status", "", "Stavki"], rows: dist.map(d => [stCell(d.s), { bar: app.length ? d.n / app.length * 100 : 0, color: d.s == null ? "B5C0CC" : STC[d.s] }, { t: String(d.n), bold: true, align: "right" }]) } },
    ...(h.length > 1 ? [{ h2: "Kretanje spremnosti" }, { table: { widths: [1800, 5800, W - 7600], head: ["Datum", "Spremnost", "%"], rows: h.filter((x, i) => i === h.length - 1 || i % Math.max(1, Math.ceil(h.length / 10)) === 0).map(x => [fmtD(x.day), { bar: x.readiness, color: "0B2A4A" }, { t: x.readiness + " %", align: "right" }]) } }] : []),
    { h1: "4. Pregled svih zahtjeva i kontrola" },
    { p: "Svako polje je jedna stavka. Zeleno dokazano, plavo uvedeno, narandžasto djelimično, crveno ne postoji, bijelo nije ocijenjeno, sivo ne primjenjuje se.", muted: true, size: 17 },
    ...Object.keys(K).flatMap(k => [{ h2: K[k].title }, { table: { widths: Array(8).fill(Math.floor(W / 8)), rows: tiles(k) } }]),
    { h1: "5. Najveći rizici" },
    highR.length ? { table: { widths: [800, 3400, 1500, 1400, W - 7100], head: ["Oznaka", "Rizik", "Nivo", "Tretman", "Plan"], rows: highR.slice(0, 10).map(r => [R(r.ref), [r.asset, r.threat].filter(Boolean).join(": "), lvCell(r.likelihood, r.impact), TREAT_TXT[r.treatment], r.plan || "–"]) } } : { p: "Nema aktivnih visokih ili kritičnih rizika." },
    { h1: "6. Otvoreni nalazi i mjere koje kasne" },
    openF.length ? { table: { widths: [800, 2000, 4200, W - 7000 - 1300, 1300], head: ["Oznaka", "Vrsta", "Nalaz", "Status", "Rok"], rows: openF.map(f => [N(f.ref), { t: FKIND_TXT[f.kind], bold: f.kind === "major", color: f.kind === "major" ? "C2410C" : null }, f.title, FSTAT_TXT[f.status], fmtD(f.due)]) } } : { p: "Nema otvorenih nalaza." },
    late.length ? { table: { widths: [4800, 2000, 1400, W - 8200], head: ["Mjera koja kasni", "Odgovorni", "Rok", "Status"], rows: late.map(t => [t.title, t.owner || "–", fmtD(t.due), TSTAT_TXT[t.status]]) } } : { p: "Nijedna mjera ne kasni." }
  ];
  return buildDocx({ title: "Izvještaj za upravu", subtitle: `${pr.client_name} · ${CAT.name}`, meta, note, blocks, footer: `SCE Assurance · ${pr.client_name} · Povjerljivo`, author: user });
}

export async function reviewDocx(env, user, pr, id, note) {
  const r = await env.DB.prepare("SELECT * FROM reviews WHERE id=? AND project_id=?").bind(id, pr.id).first();
  if (!r) return null;
  const d = parse(r.data), tasks = (await env.DB.prepare("SELECT * FROM tasks WHERE review_id=? ORDER BY due").bind(r.id).all()).results;
  const std = STANDARDS[pr.standard].name;
  const blocks = [
    { h1: "1. Ulazi u preispitivanje" },
    ...REVIEW_IN.filter(([k]) => d[k]).flatMap(([k, l]) => [{ h2: l }, { p: d[k] }]),
    { h1: "2. Izlazi iz preispitivanja" },
    ...REVIEW_OUT.filter(([k]) => d[k]).flatMap(([k, l]) => [{ h2: l }, { p: d[k] }]),
    { h1: "3. Mjere" },
    tasks.length ? { table: { widths: [4600, 2200, 1400, W - 8200], head: ["Mjera", "Odgovorni", "Rok", "Status"], rows: tasks.map(t => [t.title, t.owner || "–", fmtD(t.due), TSTAT_TXT[t.status]]) } } : { p: "Nisu definisane mjere." },
    { h2: "Potpisi" },
    { table: { widths: [3200, 3200, W - 6400], head: ["Uloga", "Ime i prezime", "Datum i potpis"], rows: [["Direktor", "", ""], ["Predstavnik uprave za sistem", "", ""]] } }];
  return buildDocx({ title: "Zapisnik s preispitivanja od strane uprave", subtitle: `${pr.client_name} · ${std}`, note,
    meta: [["Klijent", pr.client_name], ["Standard", std], ["Sastanak", r.title], ["Datum", fmtD(r.date)], ["Učesnici", r.participants || "–"], ["Status", RSTAT[r.status]]],
    blocks, footer: `SCE Assurance · ${pr.client_name} · Povjerljivo`, author: user });
}

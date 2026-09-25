/*
 * Evidenta: risk register, internal audits and findings, dashboard, search and Word reports.
 */
import { buildDocx, DOCX_W as W } from "./docx.js";
import { STANDARDS } from "./catalog.js";

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const S = (v, n = 500) => (v == null ? null : String(v).replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n) || null);
const I5 = v => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? n : null; };
const oneOf = (v, list, def) => list.includes(v) ? v : def;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (status, error) => json({ error }, status);
async function body(req) { try { return await req.json(); } catch { return {}; } }

export const RISK_LEVEL = s => s == null ? null : s <= 4 ? "low" : s <= 9 ? "medium" : s <= 16 ? "high" : "critical";
const LEVEL_TXT = { low: "Nizak", medium: "Srednji", high: "Visok", critical: "Kritičan" };
const LEVEL_FILL = { low: "E4F5F0", medium: "FFF4DB", high: "FDE7D6", critical: "FBD5D5" };
const TREAT_TXT = { reduce: "Smanjiti", accept: "Prihvatiti", avoid: "Izbjeći", transfer: "Prenijeti" };
const RSTAT_TXT = { open: "Otvoren", treating: "U tretmanu", accepted: "Prihvaćen", closed: "Zatvoren" };
const FKIND_TXT = { major: "Glavna nesukladnost", minor: "Manja nesukladnost", obs: "Zapažanje", ofi: "Prilika za poboljšanje" };
const FSTAT_TXT = { open: "Otvoren", action: "Korektivna mjera u toku", verify: "Čeka verifikaciju", closed: "Zatvoren" };
const AKIND_TXT = { internal: "Interni audit", customer: "Audit kupca", certification: "Certifikacijski audit" };
const TSTAT_TXT = { open: "Otvoreno", doing: "U toku", done: "Završeno" };
const STATUS_TXT = { null: "Nije ocijenjeno", 0: "Ne postoji", 1: "Djelimično", 2: "Uvedeno", 3: "Dokazano" };
const STATUS_FILL = { 0: ["FDECE4", "C2410C"], 1: ["FDF0E6", "B45309"], 2: ["E8F1FD", "1D5FB8"], 3: ["E4F5F0", "157A62"] };
const PHASES = { gap: "Gap analiza", impl: "Uvođenje", audit: "Interni audit", cert: "Certifikacija", care: "Održavanje" };

async function log(env, user, action, entity, entityId, projectId, detail) {
  await env.DB.prepare("INSERT INTO audit (at,user,action,entity,entity_id,project_id,detail) VALUES (?,?,?,?,?,?,?)")
    .bind(now(), user, action, entity, entityId || null, projectId || null, detail ? JSON.stringify(detail).slice(0, 2000) : null).run();
}
async function nextRef(env, table, projectId) {
  const r = await env.DB.prepare(`SELECT COALESCE(MAX(ref),0)+1 n FROM ${table} WHERE project_id=?`).bind(projectId).first();
  return r.n;
}
const validControls = (std, v) => {
  const ids = new Set((STANDARDS[std] || { items: [] }).items.map(i => i.id));
  return String(v || "").split(/[,\s]+/).filter(x => ids.has(x)).slice(0, 40).join(",") || null;
};

/* ---------- risks ---------- */
export async function risksApi(req, env, user, pr, p) {
  const m = req.method;
  if (!p[3] && m === "GET") return json((await env.DB.prepare("SELECT * FROM risks WHERE project_id=? ORDER BY ref").bind(pr.id).all()).results);
  if (!p[3] && m === "POST" || p[3] && m === "PUT") {
    const b = await body(req); const asset = S(b.asset, 200); if (!asset) return err(400, "asset");
    const v = [asset, S(b.threat, 400), S(b.vulnerability, 400), S(b.owner, 160), I5(b.likelihood), I5(b.impact), oneOf(b.treatment, Object.keys(TREAT_TXT), "reduce"),
      validControls(pr.standard, b.controls), S(b.plan, 4000), I5(b.res_likelihood), I5(b.res_impact), oneOf(b.status, Object.keys(RSTAT_TXT), "open"), S(b.review_date, 10)];
    if (!p[3]) {
      const id = uid(), ref = await nextRef(env, "risks", pr.id);
      await env.DB.prepare("INSERT INTO risks (id,project_id,ref,asset,threat,vulnerability,owner,likelihood,impact,treatment,controls,plan,res_likelihood,res_impact,status,review_date,created_at,created_by,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, pr.id, ref, ...v, now(), user, now(), user).run();
      await log(env, user, "create", "risk", id, pr.id, { title: "R-" + String(ref).padStart(3, "0") + " " + asset });
      return json({ id, ref }, 201);
    }
    const r = await env.DB.prepare("SELECT * FROM risks WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!r) return err(404, "risk");
    await env.DB.prepare("UPDATE risks SET asset=?,threat=?,vulnerability=?,owner=?,likelihood=?,impact=?,treatment=?,controls=?,plan=?,res_likelihood=?,res_impact=?,status=?,review_date=?,updated_at=?,updated_by=? WHERE id=?")
      .bind(...v, now(), user, r.id).run();
    await log(env, user, "update", "risk", r.id, pr.id, { title: "R-" + String(r.ref).padStart(3, "0") + " " + asset, status: b.status });
    return json({ ok: true });
  }
  if (p[3] && m === "DELETE") {
    const r = await env.DB.prepare("SELECT * FROM risks WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!r) return err(404, "risk");
    await env.DB.batch([env.DB.prepare("DELETE FROM risks WHERE id=?").bind(r.id), env.DB.prepare("UPDATE tasks SET risk_id=NULL WHERE risk_id=?").bind(r.id)]);
    await log(env, user, "delete", "risk", r.id, pr.id, { title: "R-" + String(r.ref).padStart(3, "0") + " " + r.asset });
    return json({ ok: true });
  }
  return err(404, "not_found");
}

/* ---------- audits and findings ---------- */
export async function auditsApi(req, env, user, pr, p) {
  const m = req.method;
  if (!p[3] && m === "GET") return json((await env.DB.prepare("SELECT a.*, (SELECT COUNT(*) FROM findings f WHERE f.audit_id=a.id) findings, (SELECT COUNT(*) FROM findings f WHERE f.audit_id=a.id AND f.status!='closed') open FROM audits a WHERE project_id=? ORDER BY date DESC, created_at DESC").bind(pr.id).all()).results);
  if (!p[3] && m === "POST" || p[3] && m === "PUT") {
    const b = await body(req); const title = S(b.title, 200); if (!title) return err(400, "title");
    const v = [title, oneOf(b.kind, Object.keys(AKIND_TXT), "internal"), S(b.date, 10), S(b.auditor, 160), S(b.scope, 4000), oneOf(b.status, ["planned", "done"], "planned"), S(b.summary, 8000)];
    if (!p[3]) {
      const id = uid();
      await env.DB.prepare("INSERT INTO audits (id,project_id,title,kind,date,auditor,scope,status,summary,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, pr.id, ...v, now(), user, now()).run();
      await log(env, user, "create", "audit", id, pr.id, { title });
      return json({ id }, 201);
    }
    const a = await env.DB.prepare("SELECT * FROM audits WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!a) return err(404, "audit");
    await env.DB.prepare("UPDATE audits SET title=?,kind=?,date=?,auditor=?,scope=?,status=?,summary=?,updated_at=? WHERE id=?").bind(...v, now(), a.id).run();
    await log(env, user, "update", "audit", a.id, pr.id, { title });
    return json({ ok: true });
  }
  if (p[3] && m === "DELETE") {
    const a = await env.DB.prepare("SELECT * FROM audits WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!a) return err(404, "audit");
    await env.DB.batch([env.DB.prepare("UPDATE findings SET audit_id=NULL WHERE audit_id=?").bind(a.id), env.DB.prepare("DELETE FROM audits WHERE id=?").bind(a.id)]);
    await log(env, user, "delete", "audit", a.id, pr.id, { title: a.title });
    return json({ ok: true });
  }
  return err(404, "not_found");
}

export async function findingsApi(req, env, user, pr, p) {
  const m = req.method;
  if (!p[3] && m === "GET") return json((await env.DB.prepare("SELECT * FROM findings WHERE project_id=? ORDER BY status='closed', ref").bind(pr.id).all()).results);
  if (!p[3] && m === "POST" || p[3] && m === "PUT") {
    const b = await body(req); const title = S(b.title, 300); if (!title) return err(400, "title");
    const items = new Set((STANDARDS[pr.standard] || { items: [] }).items.map(i => i.id));
    let audit = S(b.audit_id, 64);
    if (audit && !(await env.DB.prepare("SELECT 1 FROM audits WHERE id=? AND project_id=?").bind(audit, pr.id).first())) audit = null;
    const status = oneOf(b.status, Object.keys(FSTAT_TXT), "open");
    const v = [audit, items.has(b.item_id) ? b.item_id : null, oneOf(b.kind, Object.keys(FKIND_TXT), "minor"), title, S(b.description, 8000), S(b.cause, 4000), S(b.correction, 4000), S(b.owner, 160), S(b.due, 10), status];
    if (!p[3]) {
      const id = uid(), ref = await nextRef(env, "findings", pr.id);
      await env.DB.prepare("INSERT INTO findings (id,project_id,audit_id,item_id,kind,title,description,cause,correction,owner,due,status,closed_at,ref,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, pr.id, ...v, status === "closed" ? now() : null, ref, now(), user, now()).run();
      await log(env, user, "create", "finding", id, pr.id, { title: "N-" + String(ref).padStart(3, "0") + " " + title });
      return json({ id, ref }, 201);
    }
    const f = await env.DB.prepare("SELECT * FROM findings WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!f) return err(404, "finding");
    const closed = status === "closed" ? (f.closed_at || now()) : null;
    await env.DB.prepare("UPDATE findings SET audit_id=?,item_id=?,kind=?,title=?,description=?,cause=?,correction=?,owner=?,due=?,status=?,closed_at=?,updated_at=? WHERE id=?").bind(...v, closed, now(), f.id).run();
    await log(env, user, "update", "finding", f.id, pr.id, { title: "N-" + String(f.ref).padStart(3, "0") + " " + title, status: FSTAT_TXT[status] });
    return json({ ok: true });
  }
  if (p[3] && m === "DELETE") {
    const f = await env.DB.prepare("SELECT * FROM findings WHERE id=? AND project_id=?").bind(p[3], pr.id).first();
    if (!f) return err(404, "finding");
    await env.DB.batch([env.DB.prepare("DELETE FROM findings WHERE id=?").bind(f.id), env.DB.prepare("UPDATE tasks SET finding_id=NULL WHERE finding_id=?").bind(f.id)]);
    await log(env, user, "delete", "finding", f.id, pr.id, { title: f.title });
    return json({ ok: true });
  }
  return err(404, "not_found");
}

/* ---------- counters used on project cards and the dashboard ---------- */
export async function projectCounters(env, id) {
  const r = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM tasks WHERE project_id=?1 AND status!='done') open_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id=?1 AND status!='done' AND due IS NOT NULL AND due < date('now')) late_tasks,
    (SELECT COUNT(*) FROM findings WHERE project_id=?1 AND status!='closed') open_findings,
    (SELECT COUNT(*) FROM findings WHERE project_id=?1 AND status!='closed' AND kind='major') major_findings,
    (SELECT COUNT(*) FROM risks WHERE project_id=?1) risks,
    (SELECT COUNT(*) FROM risks WHERE project_id=?1 AND status!='closed' AND likelihood*impact>=10) high_risks,
    (SELECT COUNT(*) FROM evidence WHERE project_id=?1 AND deleted_at IS NULL) evidence`).bind(id).first();
  return r;
}

export async function dashboard(env, user, projects) {
  const soon = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const [tasks, findings, activity] = await Promise.all([
    env.DB.prepare(`SELECT t.*, p.name project_name, c.name client_name FROM tasks t JOIN projects p ON p.id=t.project_id JOIN clients c ON c.id=p.client_id
      WHERE p.status='active' AND t.status!='done' AND t.due IS NOT NULL AND t.due <= ? ORDER BY t.due LIMIT 40`).bind(soon).all(),
    env.DB.prepare(`SELECT f.*, p.name project_name, c.name client_name FROM findings f JOIN projects p ON p.id=f.project_id JOIN clients c ON c.id=p.client_id
      WHERE p.status='active' AND f.status!='closed' ORDER BY f.kind='major' DESC, f.due IS NULL, f.due LIMIT 20`).all(),
    env.DB.prepare(`SELECT a.*, p.name project_name FROM audit a LEFT JOIN projects p ON p.id=a.project_id ORDER BY a.id DESC LIMIT 14`).all()
  ]);
  const me = user.toLowerCase(), local = me.split("@")[0];
  const mine = tasks.results.filter(t => { const o = (t.owner || "").toLowerCase(); return o && (o === me || o.includes(local)); });
  return { projects, tasks: tasks.results, mine, findings: findings.results, activity: activity.results };
}

export async function search(env, q) {
  q = String(q || "").trim().slice(0, 80);
  if (q.length < 2) return [];
  const like = "%" + q.replace(/[%_]/g, "") + "%";
  const rs = await env.DB.batch([
    env.DB.prepare("SELECT 'client' t, id, name title, country sub, NULL project_id FROM clients WHERE name LIKE ?1 LIMIT 8").bind(like),
    env.DB.prepare("SELECT 'project' t, p.id, p.name title, c.name sub, p.id project_id FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.name LIKE ?1 OR c.name LIKE ?1 LIMIT 8").bind(like),
    env.DB.prepare("SELECT 'task' t, t.id, t.title, p.name sub, t.project_id FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.title LIKE ?1 OR t.owner LIKE ?1 LIMIT 8").bind(like),
    env.DB.prepare("SELECT 'risk' t, r.id, 'R-' || printf('%03d', r.ref) || ' ' || r.asset title, p.name sub, r.project_id FROM risks r JOIN projects p ON p.id=r.project_id WHERE r.asset LIKE ?1 OR r.threat LIKE ?1 LIMIT 8").bind(like),
    env.DB.prepare("SELECT 'finding' t, f.id, 'N-' || printf('%03d', f.ref) || ' ' || f.title title, p.name sub, f.project_id FROM findings f JOIN projects p ON p.id=f.project_id WHERE f.title LIKE ?1 OR f.description LIKE ?1 LIMIT 8").bind(like),
    env.DB.prepare("SELECT 'evidence' t, e.id, e.name title, p.name sub, e.project_id FROM evidence e JOIN projects p ON p.id=e.project_id WHERE e.deleted_at IS NULL AND e.name LIKE ?1 LIMIT 8").bind(like)
  ]);
  return rs.flatMap(r => r.results);
}

/* ---------- Word reports ---------- */
const fmtD = d => { if (!d) return "–"; const x = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T00:00:00Z" : d); return `${String(x.getUTCDate()).padStart(2, "0")}.${String(x.getUTCMonth() + 1).padStart(2, "0")}.${x.getUTCFullYear()}.`; };
const stCell = s => s == null ? { t: STATUS_TXT.null, color: "8A97A6" } : { t: STATUS_TXT[s], fill: STATUS_FILL[s][0], color: STATUS_FILL[s][1], bold: true };
const lvCell = (l, i) => { const s = l && i ? l * i : null, lv = RISK_LEVEL(s); return s ? { t: `${s} · ${LEVEL_TXT[lv]}`, fill: LEVEL_FILL[lv], bold: true } : "–"; };
const R = n => "R-" + String(n).padStart(3, "0"), N = n => "N-" + String(n).padStart(3, "0");

export async function report(env, user, pr, kind, items, summary, auditId) {
  const code = Object.fromEntries(items.map(i => [i.id, i.code]));
  const title = Object.fromEntries(items.map(i => [i.id, i.title]));
  const [tasks, risks, findings] = await Promise.all([
    env.DB.prepare("SELECT * FROM tasks WHERE project_id=? ORDER BY status='done', due IS NULL, due").bind(pr.id).all(),
    env.DB.prepare("SELECT * FROM risks WHERE project_id=? ORDER BY ref").bind(pr.id).all(),
    env.DB.prepare("SELECT * FROM findings WHERE project_id=? ORDER BY ref").bind(pr.id).all()
  ]).then(r => r.map(x => x.results));
  const CAT = STANDARDS[pr.standard], std = CAT.name;
  const meta = [["Klijent", pr.client_name], ["Projekat", pr.name], ["Standard", std], ["Obim", pr.scope || "–"], ["Faza", PHASES[pr.phase] || pr.phase],
    ["Rok za audit", fmtD(pr.deadline)], ["Voditelj projekta", pr.lead || "–"], ["Datum izvještaja", fmtD(now())], ["Pripremio", user]];
  const note = "Povjerljivo. Dokument je pripremljen za klijenta i ne smije se dijeliti s trećim stranama bez saglasnosti. Status zahtjeva prikazuje stanje na dan izvještaja.";
  const taskRows = list => list.map(t => [t.title, code[t.item_id] || (t.risk_id ? "Rizik" : t.finding_id ? "Nalaz" : "–"), t.owner || "–", fmtD(t.due), TSTAT_TXT[t.status]]);
  const taskTable = list => ({ table: { widths: [3900, 1100, 1900, 1300, W - 8200], head: ["Mjera", "Veza", "Odgovorni", "Rok", "Status"], rows: taskRows(list) } });
  let r;

  if (kind === "gap") {
    const app = items.filter(i => i.applicable), dist = [3, 2, 1, 0, null].map(s => [s, app.filter(i => (i.status ?? null) === s).length]);
    const openT = tasks.filter(t => t.status !== "done");
    const K = CAT.kinds, kinds = Object.keys(K);
    const group = k => summary.groups.filter(g => g.kind === k).map(g => [K[k].gp + g.group, g.name, g.n, { t: g.pct + " %", bold: true }]);
    const weak = app.filter(i => i.status == null || i.status <= 1);
    const detailKind = kinds.includes("clause") ? "clause" : "control";
    let n = 1;
    r = { title: "Izvještaj o gap analizi", subtitle: `${pr.client_name} · ${std}`, meta, note, blocks: [
      { h1: `${n++}. Sažetak` },
      { p: `Spremnost iznosi ${summary.readiness} %. Ocijenjeno je ${summary.assessed} od ${summary.applicable} primjenjivih stavki. Otvoreno je ${openT.length} mjera, ${findings.filter(f => f.status !== "closed").length} nalaza i evidentirano ${risks.length} rizika.` },
      { table: { widths: [4200, 1800, W - 6000], head: ["Status", "Broj stavki", "Udio"], rows: dist.map(([s, n]) => [stCell(s), String(n), app.length ? Math.round(n / app.length * 100) + " %" : "–"]) } },
      { p: "Skala: Ne postoji (0) · Djelimično (1/3) · Uvedeno (2/3) · Dokazano (pun doprinos). Spremnost je prosjek svih primjenjivih stavki.", muted: true, size: 17 },
      ...kinds.flatMap(k => [{ h1: `${n++}. Rezultati: ${K[k].title}` }, { table: { widths: [1300, 5200, 1400, W - 7900], head: ["Oznaka", "Oblast", "Stavki", "Spremnost"], rows: group(k) } }]),
      { h1: `${n++}. Stavke koje traže pažnju` },
      { p: weak.length ? `${weak.length} primjenjivih stavki nije uvedeno ili nije ocijenjeno. Navedene su s nalazom i odgovornom osobom.` : "Sve primjenjive stavke su uvedene ili dokazane." },
      ...(weak.length ? [{ table: { widths: [1100, 2700, 1600, W - 5400 - 1500, 1500], head: ["Oznaka", "Zahtjev / kontrola", "Status", "Nalaz", "Odgovorni"],
        rows: weak.map(i => [i.code, i.title, stCell(i.status), i.note || "–", i.owner || "–"]) } }] : []),
      { h1: `${n++}. Detaljni pregled: ${K[detailKind].title}` },
      { table: { widths: [1100, 2800, 1600, W - 5500], head: ["Oznaka", K[detailKind].one, "Status", "Nalaz i napomena"],
        rows: items.filter(i => i.kind === detailKind).map(i => [i.code, i.title, i.applicable ? stCell(i.status) : { t: "Ne primjenjuje se", color: "8A97A6" }, i.note || i.justification || ""]) } },
      { h1: `${n++}. Plan mjera` },
      openT.length ? taskTable(openT) : { p: "Nema otvorenih mjera." }
    ] };
  } else if (kind === "soa" && CAT.soa) {
    const ctr = items.filter(i => i.kind === "control");
    r = { title: "Izjava o primjenjivosti", subtitle: `${pr.client_name} · ${std} · Aneks A`, meta, note, blocks: [
      { p: `Izjava obuhvata ${ctr.length} kontrola Aneksa A. Primjenjivo: ${ctr.filter(i => i.applicable).length}, isključeno: ${ctr.filter(i => !i.applicable).length}. Za svaku kontrolu navedeno je obrazloženje uključenja ili isključenja i status provedbe.` },
      ...Object.entries(CAT.groups.control).flatMap(([g, name]) => [{ h2: `A.${g} ${name}` }, { table: { widths: [800, 2700, 1100, W - 6200, 1600], head: ["Kontrola", "Naziv", "Primjenjiva", "Obrazloženje", "Status"],
        rows: ctr.filter(i => i.group === g).map(i => [i.code, i.title, i.applicable ? { t: "Da", bold: true } : { t: "Ne", color: "C2410C", bold: true }, i.justification || (i.applicable ? "" : "Obrazloženje nije upisano"), i.applicable ? stCell(i.status) : "–"]) } }]),
      { h2: "Odobrenje" },
      { table: { widths: [3200, 3200, W - 6400], head: ["Uloga", "Ime i prezime", "Datum i potpis"], rows: [["Vlasnik ISMS-a", "", ""], ["Uprava", "", ""]] } }
    ] };
  } else if (kind === "risks") {
    const cellMap = {};
    for (const x of risks) if (x.likelihood && x.impact && x.status !== "closed") (cellMap[x.likelihood + ":" + x.impact] ||= []).push(R(x.ref));
    const heat = [5, 4, 3, 2, 1].map(l => [{ t: String(l), bold: true, fill: "F1F4F8" }, ...[1, 2, 3, 4, 5].map(i => ({ t: (cellMap[l + ":" + i] || []).join(", ") || " ", fill: LEVEL_FILL[RISK_LEVEL(l * i)] }))]);
    const byLevel = ["critical", "high", "medium", "low"].map(l => [LEVEL_TXT[l], String(risks.filter(x => RISK_LEVEL(x.likelihood * x.impact) === l && x.status !== "closed").length)]);
    r = { title: "Registar rizika i plan tretmana", subtitle: `${pr.client_name} · ${std}${pr.standard === "iso27001" ? " · 6.1.2 i 6.1.3" : ""}`, meta, note, blocks: [
      { h1: "1. Metodologija" },
      { p: "Rizik se ocjenjuje kao umnožak vjerovatnoće (1 do 5) i uticaja (1 do 5). Nivoi: 1 do 4 nizak, 5 do 9 srednji, 10 do 16 visok, 20 do 25 kritičan. Rizici od nivoa visok naviše se tretiraju planom mjera ili ih vlasnik rizika formalno prihvata. Rezidualni rizik je procjena nakon provedbe planiranih kontrola." },
      { h1: "2. Mapa rizika" },
      { p: "Otvoreni rizici po vjerovatnoći (redovi) i uticaju (kolone), prije tretmana.", muted: true, size: 17 },
      { table: { widths: [1100, ...Array(5).fill(Math.floor((W - 1100) / 5))], head: ["V \\ U", "1", "2", "3", "4", "5"], rows: heat } },
      { table: { widths: [3000, 1500], head: ["Nivo", "Otvorenih"], rows: byLevel } },
      { h1: "3. Registar rizika" },
      risks.length ? { table: { widths: [850, 2450, 1300, 1200, 1100, 1500, W - 8400], head: ["Oznaka", "Imovina, prijetnja i ranjivost", "Vlasnik", "Inherentni", "Tretman", "Kontrole", "Rezidualni"],
        rows: risks.map(x => [R(x.ref), [x.asset, x.threat && "Prijetnja: " + x.threat, x.vulnerability && "Ranjivost: " + x.vulnerability].filter(Boolean).join("\n"), x.owner || "–",
          lvCell(x.likelihood, x.impact), TREAT_TXT[x.treatment], (x.controls || "").split(",").filter(Boolean).map(c => code[c]).join(", ") || "–", lvCell(x.res_likelihood, x.res_impact)]) } } : { p: "Registar još nema rizika." },
      { h1: "4. Plan tretmana" },
      ...(risks.filter(x => x.treatment !== "accept" || x.plan).length ? [{ table: { widths: [850, 2450, W - 850 - 2450 - 1700 - 1300, 1700, 1300], head: ["Oznaka", "Rizik", "Plan tretmana", "Status", "Pregled"],
        rows: risks.map(x => [R(x.ref), x.asset, x.plan || (x.treatment === "accept" ? "Rizik prihvaćen" : "–"), RSTAT_TXT[x.status], fmtD(x.review_date)]) } }] : [{ p: "Nema planiranog tretmana." }]),
      ...(tasks.some(t => t.risk_id) ? [{ h2: "Mjere povezane s rizicima" }, taskTable(tasks.filter(t => t.risk_id))] : []),
      { h2: "Odobrenje vlasnika rizika" },
      { table: { widths: [3200, 3200, W - 6400], head: ["Uloga", "Ime i prezime", "Datum i potpis"], rows: [["Vlasnik rizika", "", ""], ["Uprava", "", ""]] } }
    ] };
  } else if (kind === "tasks") {
    const open = tasks.filter(t => t.status !== "done"), done = tasks.filter(t => t.status === "done");
    r = { title: "Plan mjera", subtitle: `${pr.client_name} · ${std}`, meta, note, blocks: [
      { p: `Ukupno ${tasks.length} mjera: ${open.length} otvorenih, od toga ${open.filter(t => t.due && t.due < now().slice(0, 10)).length} s prekoračenim rokom, i ${done.length} završenih.` },
      { h1: "Otvorene mjere" }, open.length ? taskTable(open) : { p: "Nema otvorenih mjera." },
      { h1: "Završene mjere" }, done.length ? taskTable(done) : { p: "Još nema završenih mjera." }
    ] };
  } else if (kind === "audit") {
    const a = await env.DB.prepare("SELECT * FROM audits WHERE id=? AND project_id=?").bind(auditId, pr.id).first();
    if (!a) return null;
    const fs = findings.filter(f => f.audit_id === a.id);
    const cnt = Object.keys(FKIND_TXT).map(k => [FKIND_TXT[k], String(fs.filter(f => f.kind === k).length)]);
    r = { title: "Izvještaj o auditu", subtitle: `${a.title} · ${pr.client_name}`, note,
      meta: [["Klijent", pr.client_name], ["Projekat", pr.name], ["Standard", std], ["Vrsta audita", AKIND_TXT[a.kind]], ["Datum audita", fmtD(a.date)], ["Auditor", a.auditor || "–"], ["Obim audita", a.scope || pr.scope || "–"], ["Datum izvještaja", fmtD(now())]],
      blocks: [
        { h1: "1. Sažetak" }, { p: a.summary || "Sažetak nije upisan." },
        { table: { widths: [4200, 1600], head: ["Vrsta nalaza", "Broj"], rows: cnt } },
        { h1: "2. Nalazi" },
        fs.length ? { table: { widths: [850, 1750, 3300, 1200, 1300, W - 8400], head: ["Oznaka", "Vrsta", "Nalaz", "Zahtjev", "Rok", "Status"],
          rows: fs.map(f => [N(f.ref), { t: FKIND_TXT[f.kind], bold: f.kind === "major", color: f.kind === "major" ? "C2410C" : null }, f.title, code[f.item_id] || "–", fmtD(f.due), FSTAT_TXT[f.status]]) } } : { p: "Audit nije utvrdio nalaze." },
        ...fs.flatMap(f => [{ h2: `${N(f.ref)} · ${f.title}` }, { kv: [["Vrsta", FKIND_TXT[f.kind]], ["Zahtjev", f.item_id ? `${code[f.item_id]} ${title[f.item_id]}` : "–"], ["Opis i dokaz", f.description || "–"],
          ["Uzrok", f.cause || "–"], ["Korekcija i korektivna mjera", f.correction || "–"], ["Odgovorni", f.owner || "–"], ["Rok", fmtD(f.due)], ["Status", FSTAT_TXT[f.status] + (f.closed_at ? ", zatvoren " + fmtD(f.closed_at) : "")]] }]),
        { h2: "Potpisi" },
        { table: { widths: [3200, 3200, W - 6400], head: ["Uloga", "Ime i prezime", "Datum i potpis"], rows: [["Auditor", a.auditor || "", ""], ["Predstavnik auditirane strane", "", ""]] } }
      ] };
  } else return null;
  r.footer = `SCE Assurance · ${pr.client_name} · Povjerljivo`;
  r.author = user;
  return buildDocx(r);
}

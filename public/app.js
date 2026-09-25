/* Evidenta UI (vanilla JS, no external dependencies) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const app = $("#app");
  const ST = [
    { v: "", t: "Nije ocijenjeno", c: "var(--sn)" }, { v: 0, t: "Ne postoji", c: "var(--s0)" }, { v: 1, t: "Djelimično", c: "var(--s1)" },
    { v: 2, t: "Uvedeno", c: "var(--s2)" }, { v: 3, t: "Dokazano", c: "var(--s3)" }];
  const stOf = s => ST.find(x => x.v === (s == null ? "" : s));
  const PHASES = { gap: "Gap analiza", impl: "Uvođenje", audit: "Interni audit", cert: "Certifikacija", care: "Održavanje" };
  const TSTAT = { open: "Otvoreno", doing: "U toku", done: "Završeno" };
  const ICON = {
    file: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/></svg>',
    task: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="3"/><path d="M5 8.2l2 2L11 6"/></svg>',
    x: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
  };
  let ME = null;

  /* ---------- api ---------- */
  async function api(path, opt = {}) {
    const o = { method: opt.method || "GET", headers: {} };
    if (opt.body instanceof FormData) o.body = opt.body;
    else if (opt.body !== undefined) { o.body = JSON.stringify(opt.body); o.headers["content-type"] = "application/json"; }
    const r = await fetch("/api" + path, o);
    if (r.status === 403) { toast("Sesija je istekla. Osvježite stranicu."); throw new Error("403"); }
    if (!r.ok) { let e = {}; try { e = await r.json(); } catch (x) {} toast("Greška: " + (e.error || r.status)); throw new Error(e.error || r.status); }
    return r.json();
  }
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2600); }
  const pad = n => String(n).padStart(2, "0");
  const fmtDate = d => { if (!d) return ""; const x = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d); return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}.`; };
  const fmtDT = d => { if (!d) return ""; const x = new Date(d); return `${fmtDate(d)} ${pad(x.getHours())}:${pad(x.getMinutes())}`; };
  const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const daysTo = d => d ? Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 864e5) : null;
  function ring(p, cls = "") {
    const r = 30, c = 2 * Math.PI * r, col = p >= 75 ? "var(--s3)" : p >= 40 ? "var(--s2)" : p > 0 ? "var(--s1)" : "var(--sn)";
    return `<div class="ring ${cls}"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--card2)" stroke-width="8"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * p / 100} ${c}"/></svg><b>${p}%</b></div>`;
  }
  function deadlineTag(d) {
    const n = daysTo(d); if (n === null) return "";
    const cls = n < 0 ? "red" : n <= 30 ? "orange" : n <= 90 ? "blue" : "";
    return `<span class="tag ${cls}">${n < 0 ? "Rok prošao" : n === 0 ? "Rok danas" : "Rok za " + n + " d"}</span>`;
  }

  /* ---------- drawer ---------- */
  const drawer = $("#drawer");
  function openDrawer(html, onClose) {
    $("#dbody").innerHTML = html; drawer.hidden = false; drawer._onClose = onClose;
    setTimeout(() => { const f = $("#dbody input, #dbody textarea, #dbody select"); f && f.focus(); }, 30);
  }
  function closeDrawer() { if (drawer.hidden) return; drawer.hidden = true; const f = drawer._onClose; drawer._onClose = null; f && f(); }
  drawer.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  const val = id => ($("#" + id) || {}).value || "";

  /* ---------- router ---------- */
  async function route() {
    closeDrawer();
    const h = location.hash.replace(/^#\/?/, "").split("/");
    $$(".top nav a").forEach(a => a.classList.toggle("on", a.dataset.nav === (h[0] === "clients" ? "clients" : "home")));
    try {
      if (!ME) { ME = await api("/me"); $("#me").textContent = ME.email; }
      if (h[0] === "clients") return clientsView();
      if (h[0] === "p" && h[1]) return projectView(h[1], h[2] || "pregled");
      return homeView();
    } catch (e) { if (e.message !== "403") app.innerHTML = `<div class="empty"><h2>Nešto nije u redu</h2><p>${esc(e.message)}</p></div>`; }
  }
  window.addEventListener("hashchange", route);

  /* ---------- home: projects ---------- */
  async function homeView() {
    const ps = await api("/projects");
    const active = ps.filter(p => p.status === "active"), closed = ps.filter(p => p.status !== "active");
    const card = p => `<a class="card pcard" href="#/p/${p.id}">${ring(p.readiness)}<div><div class="faint" style="font-size:12.5px;font-weight:650">${esc(p.client_name)}</div><h3>${esc(p.name)}</h3>
      <div class="meta"><span class="tag">${esc(ME.standards[p.standard] || p.standard)}</span><span class="tag blue">${esc(PHASES[p.phase] || p.phase)}</span>${deadlineTag(p.deadline)}</div>
      <div class="meta"><span>${p.assessed}/${p.applicable} ocijenjeno</span><span>${p.open_tasks} otvorenih mjera</span></div></div></a>`;
    app.innerHTML = `<div class="head"><div><h1>Projekti</h1><p>Aktivni projekti i spremnost za audit.</p></div><button class="btn primary" id="np">+ Novi projekat</button></div>
      ${active.length ? `<div class="grid pgrid">${active.map(card).join("")}</div>` : `<div class="card empty"><h2>Još nema projekata</h2><p>Dodajte klijenta i prvi projekat za ISO/IEC 27001.</p><p style="margin-top:14px"><button class="btn primary" id="np2">+ Novi projekat</button></p></div>`}
      ${closed.length ? `<h2 style="margin:28px 0 12px">Završeni</h2><div class="grid pgrid">${closed.map(card).join("")}</div>` : ""}`;
    $$("#np,#np2").forEach(b => b.addEventListener("click", newProject));
  }

  async function newProject() {
    const cs = await api("/clients");
    openDrawer(`<div class="dhead"><div><h2 id="dtitle">Novi projekat</h2><p class="muted">Katalog zahtjeva se automatski učitava prema standardu.</p></div><button class="btn ghost x" data-close aria-label="Zatvori">${ICON.x}</button></div>
      <form class="form" id="pf">
        <label class="f">Klijent<select id="p-client" required><option value="">Izaberite…</option>${cs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}<option value="__new">+ Novi klijent…</option></select></label>
        <div id="newc" hidden class="form card" style="padding:12px"><label class="f">Naziv klijenta<input id="c-name"></label><div class="two"><label class="f">Država<input id="c-country" placeholder="BiH"></label><label class="f">Djelatnost<input id="c-industry"></label></div></div>
        <label class="f">Naziv projekta<input id="p-name" required placeholder="npr. ISO 27001 certifikacija 2027"></label>
        <label class="f">Standard<select id="p-std">${Object.entries(ME.standards).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></label>
        <div class="two"><label class="f">Rok (audit)<input id="p-deadline" type="date"></label><label class="f">Ko traži<input id="p-req" placeholder="npr. kupac iz Njemačke"></label></div>
        <label class="f">Obim (scope)<textarea id="p-scope" placeholder="Lokacije, procesi, sistemi…"></textarea></label>
        <div class="inline"><button class="btn primary" type="submit">Kreiraj projekat</button><button class="btn" type="button" data-close>Odustani</button></div>
      </form>`);
    $("#p-client").addEventListener("change", e => { $("#newc").hidden = e.target.value !== "__new"; if (e.target.value === "__new") $("#c-name").focus(); });
    $("#pf").addEventListener("submit", async e => {
      e.preventDefault();
      let client = val("p-client");
      if (!client || !val("p-name").trim()) return toast("Izaberite klijenta i upišite naziv.");
      if (client === "__new") {
        if (!val("c-name").trim()) return toast("Upišite naziv klijenta.");
        client = (await api("/clients", { method: "POST", body: { name: val("c-name"), country: val("c-country"), industry: val("c-industry") } })).id;
      }
      const r = await api("/projects", { method: "POST", body: { client_id: client, name: val("p-name"), standard: val("p-std"), deadline: val("p-deadline"), requester: val("p-req"), scope: val("p-scope") } });
      closeDrawer(); location.hash = "#/p/" + r.id;
    });
  }

  /* ---------- clients ---------- */
  async function clientsView() {
    const cs = await api("/clients");
    app.innerHTML = `<div class="head"><div><h1>Klijenti</h1><p>${cs.length} klijenata</p></div><button class="btn primary" id="nc">+ Novi klijent</button></div>
      ${cs.length ? `<table class="tbl"><thead><tr><th>Naziv</th><th class="hide-m">Država</th><th class="hide-m">Djelatnost</th><th>Kontakt</th><th>Projekti</th></tr></thead><tbody>
      ${cs.map(c => `<tr class="row" data-id="${c.id}"><td><b>${esc(c.name)}</b></td><td class="hide-m">${esc(c.country)}</td><td class="hide-m">${esc(c.industry)}</td><td>${esc(c.contact_name)}<br><small class="faint">${esc(c.contact_email)}</small></td><td>${c.projects}</td></tr>`).join("")}
      </tbody></table>` : `<div class="card empty"><h2>Još nema klijenata</h2></div>`}`;
    $("#nc").addEventListener("click", () => clientForm());
    $$("tr.row").forEach(tr => tr.addEventListener("click", () => clientForm(cs.find(c => c.id === tr.dataset.id))));
  }
  function clientForm(c = {}) {
    openDrawer(`<div class="dhead"><h2 id="dtitle">${c.id ? "Uredi klijenta" : "Novi klijent"}</h2><button class="btn ghost x" data-close aria-label="Zatvori">${ICON.x}</button></div>
      <form class="form" id="cf"><label class="f">Naziv<input id="c-name" value="${esc(c.name)}" required></label>
      <div class="two"><label class="f">Država<input id="c-country" value="${esc(c.country)}"></label><label class="f">Djelatnost<input id="c-industry" value="${esc(c.industry)}"></label></div>
      <div class="two"><label class="f">Kontakt osoba<input id="c-cn" value="${esc(c.contact_name)}"></label><label class="f">E-mail kontakta<input id="c-ce" type="email" value="${esc(c.contact_email)}"></label></div>
      <label class="f">Napomene<textarea id="c-notes">${esc(c.notes)}</textarea></label>
      <div class="inline"><button class="btn primary" type="submit">Sačuvaj</button><button class="btn" type="button" data-close>Odustani</button></div></form>`);
    $("#cf").addEventListener("submit", async e => {
      e.preventDefault();
      const b = { name: val("c-name"), country: val("c-country"), industry: val("c-industry"), contact_name: val("c-cn"), contact_email: val("c-ce"), notes: val("c-notes") };
      if (!b.name.trim()) return;
      await api(c.id ? "/clients/" + c.id : "/clients", { method: c.id ? "PUT" : "POST", body: b });
      toast("Sačuvano"); closeDrawer(); clientsView();
    });
  }

  /* ---------- project ---------- */
  let P = null, ITEMS = [], TASKS = [], EVID = [];
  async function loadProject(id) {
    [P, ITEMS, TASKS, EVID] = await Promise.all([api("/projects/" + id), api("/projects/" + id + "/items"), api("/projects/" + id + "/tasks"), api("/projects/" + id + "/evidence")]);
  }
  async function projectView(id, tab) {
    await loadProject(id);
    const open = TASKS.filter(t => t.status !== "done").length;
    const tabs = [["pregled", "Pregled"], ["zahtjevi", "Zahtjevi 4–10"], ["kontrole", "Aneks A · SoA"], ["mjere", "Mjere", open], ["dokazi", "Dokazi", EVID.length], ["aktivnost", "Aktivnost"]];
    app.innerHTML = `<div class="phead"><div><div class="crumb"><a href="#/">Projekti</a> / ${esc(P.client_name)}</div><h1>${esc(P.name)}</h1>
      <div class="facts"><span>${esc(ME.standards[P.standard])}</span><span>Faza: <b>${esc(PHASES[P.phase] || P.phase)}</b></span>${P.deadline ? `<span>Rok: <b>${fmtDate(P.deadline)}</b></span>` : ""}${P.requester ? `<span>Traži: <b>${esc(P.requester)}</b></span>` : ""}${deadlineTag(P.deadline)}${P.status !== "active" ? '<span class="tag">Završen</span>' : ""}</div></div>
      <div class="inline"><button class="btn" id="pedit">Uredi projekat</button></div></div>
      <nav class="tabs">${tabs.map(([k, t, n]) => `<a href="#/p/${P.id}/${k}" class="${k === tab ? "on" : ""}">${t}${n ? `<small>${n}</small>` : ""}</a>`).join("")}</nav>
      <section id="tab"></section>`;
    $("#pedit").addEventListener("click", projectForm);
    ({ pregled: tabOverview, zahtjevi: () => tabItems("clause"), kontrole: () => tabItems("control"), mjere: tabTasks, dokazi: tabEvidence, aktivnost: tabAudit }[tab] || tabOverview)();
  }
  const refresh = () => projectView(P.id, (location.hash.split("/")[3] || "pregled"));

  function projectForm() {
    openDrawer(`<div class="dhead"><h2 id="dtitle">Uredi projekat</h2><button class="btn ghost x" data-close aria-label="Zatvori">${ICON.x}</button></div>
      <form class="form" id="pf"><label class="f">Naziv<input id="p-name" value="${esc(P.name)}"></label>
      <div class="two"><label class="f">Faza<select id="p-phase">${Object.entries(PHASES).map(([k, v]) => `<option value="${k}" ${k === P.phase ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f">Status<select id="p-status"><option value="active" ${P.status === "active" ? "selected" : ""}>Aktivan</option><option value="closed" ${P.status !== "active" ? "selected" : ""}>Završen</option></select></label></div>
      <div class="two"><label class="f">Rok (audit)<input id="p-deadline" type="date" value="${esc(P.deadline)}"></label><label class="f">Ko traži<input id="p-req" value="${esc(P.requester)}"></label></div>
      <label class="f">Voditelj projekta<input id="p-lead" value="${esc(P.lead)}"></label>
      <label class="f">Obim (scope)<textarea id="p-scope">${esc(P.scope)}</textarea></label>
      <div class="inline"><button class="btn primary" type="submit">Sačuvaj</button><button class="btn" type="button" data-close>Odustani</button></div></form>`);
    $("#pf").addEventListener("submit", async e => {
      e.preventDefault();
      await api("/projects/" + P.id, { method: "PUT", body: { name: val("p-name"), phase: val("p-phase"), status: val("p-status"), deadline: val("p-deadline"), requester: val("p-req"), lead: val("p-lead"), scope: val("p-scope") } });
      toast("Sačuvano"); closeDrawer(); refresh();
    });
  }

  /* overview */
  function tabOverview() {
    const s = P.summary;
    const bars = kind => s.groups.filter(g => g.kind === kind).map(g => `<div class="bar" style="--c:${kind === "clause" ? "var(--blue)" : "var(--teal)"}"><span class="n">${kind === "clause" ? g.group : "A." + g.group}</span><span>${esc(g.name)}</span><span class="t"><i style="width:${g.pct}%"></i></span><span class="p">${g.pct}%</span></div>`).join("");
    const app_ = ITEMS.filter(i => i.applicable);
    const dist = ST.map(x => ({ ...x, n: app_.filter(i => (i.status == null ? "" : i.status) === x.v).length }));
    const openT = TASKS.filter(t => t.status !== "done").sort((a, b) => (a.due || "9") < (b.due || "9") ? -1 : 1).slice(0, 6);
    const code = Object.fromEntries(ITEMS.map(i => [i.id, i.code]));
    $("#tab").innerHTML = `<div class="ov">
      <div class="card big">${ring(s.readiness, "lg")}<p>Spremnost za audit<br><b>${s.assessed} od ${s.applicable}</b> stavki ocijenjeno</p>
        <div style="width:100%"><div class="dist">${dist.map(d => d.n ? `<i style="width:${d.n / app_.length * 100}%;background:${d.c}" title="${d.t}: ${d.n}"></i>` : "").join("")}</div>
        <div class="legend">${dist.map(d => `<span><i style="background:${d.c}"></i>${d.t} ${d.n}</span>`).join("")}</div></div></div>
      <div class="card bars"><h3>Zahtjevi, poglavlja 4–10</h3>${bars("clause")}</div>
      <div class="card bars"><h3>Aneks A, teme kontrola</h3>${bars("control")}
        <p class="faint" style="font-size:12.5px;margin-top:10px">${ITEMS.filter(i => i.kind === "control" && !i.applicable).length} kontrola označeno kao neprimjenjivo.</p></div></div>
      <div class="kpis"><div class="card kpi"><b>${EVID.length}</b><span>dokaza priloženo</span></div><div class="card kpi"><b>${TASKS.filter(t => t.status !== "done").length}</b><span>otvorenih mjera</span></div>
      <div class="card kpi"><b>${TASKS.filter(t => t.status !== "done" && t.due && daysTo(t.due) < 0).length}</b><span>mjera kasni</span></div><div class="card kpi"><b>${P.deadline ? daysTo(P.deadline) : "–"}</b><span>dana do audita</span></div></div>
      <div class="card" style="margin-top:14px"><div class="head" style="margin-bottom:10px"><h3>Sljedeće mjere</h3><a href="#/p/${P.id}/mjere">Sve mjere</a></div>
      ${openT.length ? `<div class="list">${openT.map(t => `<div class="li"><span class="grow"><b>${esc(t.title)}</b><small>${t.item_id ? code[t.item_id] + " · " : ""}${esc(t.owner || "bez odgovornog")}</small></span>${t.due ? `<small>${fmtDate(t.due)}</small>` : ""}</div>`).join("")}</div>` : '<p class="muted">Nema otvorenih mjera.</p>'}</div>
      <div class="inline" style="margin-top:14px;flex-wrap:wrap"><a class="btn" href="/api/projects/${P.id}/export/gap.csv">Izvoz: gap analiza</a><a class="btn" href="/api/projects/${P.id}/export/soa.csv">Izvoz: SoA</a><a class="btn" href="/api/projects/${P.id}/export/tasks.csv">Izvoz: plan mjera</a></div>`;
  }

  /* items (clauses or Annex A) */
  let FILT = { q: "", s: "all", g: "all" };
  function tabItems(kind) {
    const groups = ME.groups[kind];
    $("#tab").innerHTML = `<div class="tools"><input id="fq" type="search" placeholder="Pretraži oznaku ili naziv…" value="${esc(FILT.q)}">
      <select id="fs"><option value="all">Svi statusi</option>${ST.map(x => `<option value="${x.v === "" ? "none" : x.v}">${x.t}</option>`).join("")}${kind === "control" ? '<option value="na">Neprimjenjivo</option>' : ""}</select>
      <select id="fg"><option value="all">${kind === "control" ? "Sve teme" : "Sva poglavlja"}</option>${Object.entries(groups).map(([k, v]) => `<option value="${k}">${kind === "control" ? "A." : ""}${k} ${esc(v)}</option>`).join("")}</select>
      <span class="sp"></span>${kind === "control" ? `<a class="btn" href="/api/projects/${P.id}/export/soa.csv">Izvoz SoA</a>` : ""}</div><div id="itbl"></div>`;
    $("#fs").value = FILT.s; if ($("#fs").value !== FILT.s) $("#fs").value = "all";
    $("#fg").value = groups[FILT.g] ? FILT.g : "all";
    const draw = () => {
      const q = FILT.q.toLowerCase();
      const rows = ITEMS.filter(i => i.kind === kind && (FILT.g === "all" || !groups[FILT.g] || i.group === FILT.g)
        && (!q || (i.code + " " + i.title + " " + i.note).toLowerCase().includes(q))
        && (FILT.s === "all" || (FILT.s === "na" ? !i.applicable : FILT.s === "none" ? i.status == null && i.applicable : String(i.status) === FILT.s && i.applicable)));
      let last = null, html = "";
      for (const i of rows) {
        if (i.group !== last) { last = i.group; html += `<tr class="grp"><td colspan="${kind === "control" ? 6 : 5}">${kind === "control" ? "A." : ""}${i.group} · ${esc(groups[i.group])}</td></tr>`; }
        const st = stOf(i.status);
        html += `<tr class="row ${i.applicable ? "" : "na"}" data-id="${i.id}"><td class="code">${esc(i.code)}</td><td class="ttl"><b>${esc(i.title)}</b><small>${esc(i.note ? i.note.slice(0, 110) : i.hint)}</small></td>
          ${kind === "control" ? `<td class="hide-m">${i.applicable ? '<span class="tag teal">Primjenjiva</span>' : '<span class="tag">Ne</span>'}</td>` : ""}
          <td><span class="st" data-s="${i.status == null ? "" : i.status}"><i></i>${i.applicable ? st.t : "Neprimjenjivo"}</span></td>
          <td class="hide-m">${esc(i.owner)}</td><td><span class="cnt"><span title="Dokazi">${ICON.file}${i.evidence}</span><span title="Otvorene mjere">${ICON.task}${i.tasks.open}</span></span></td></tr>`;
      }
      $("#itbl").innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Oznaka</th><th>Naziv</th>${kind === "control" ? '<th class="hide-m">SoA</th>' : ""}<th>Status</th><th class="hide-m">Odgovorni</th><th></th></tr></thead><tbody>${html}</tbody></table>` : '<div class="card empty">Nema stavki za ovaj filter.</div>';
      $$("#itbl tr.row").forEach(tr => tr.addEventListener("click", () => itemDrawer(tr.dataset.id)));
    };
    $("#fq").addEventListener("input", e => { FILT.q = e.target.value; draw(); });
    $("#fs").addEventListener("change", e => { FILT.s = e.target.value; draw(); });
    $("#fg").addEventListener("change", e => { FILT.g = e.target.value; draw(); });
    draw();
  }

  function itemDrawer(id) {
    const i = ITEMS.find(x => x.id === id);
    const ev = EVID.filter(e => e.item_id === id), tk = TASKS.filter(t => t.item_id === id);
    let status = i.status == null ? "" : i.status;
    openDrawer(`<div class="dhead"><div><span class="code">${esc(i.code)} · ${i.kind === "clause" ? "Zahtjev" : "Kontrola Aneksa A"}</span><h2 id="dtitle">${esc(i.title)}</h2></div><button class="btn ghost x" data-close aria-label="Zatvori">${ICON.x}</button></div>
      <p class="hint">${esc(i.hint)}</p>
      ${i.kind === "control" ? `<label class="switch"><input type="checkbox" id="i-app" ${i.applicable ? "checked" : ""}> Primjenjiva kontrola (SoA)</label>
        <label class="f">Obrazloženje za SoA<textarea id="i-just" placeholder="Zašto je kontrola uključena ili isključena…">${esc(i.justification)}</textarea></label>` : ""}
      <div class="f"><span style="font-size:12.5px;font-weight:650;color:var(--muted)">Status</span><div class="seg" id="i-st">${ST.map(x => `<button type="button" data-s="${x.v}" class="${String(x.v) === String(status) ? "on" : ""}"><i></i>${x.t}</button>`).join("")}</div></div>
      <label class="f">Odgovorna osoba<input id="i-owner" value="${esc(i.owner)}" placeholder="npr. IT menadžer klijenta"></label>
      <label class="f">Nalaz i napomena<textarea id="i-note" placeholder="Šta smo zatekli, šta nedostaje, gdje je dokumentovano…">${esc(i.note)}</textarea></label>
      <div class="inline"><button class="btn primary" id="i-save">Sačuvaj</button>${i.updated_at ? `<small class="faint" style="align-self:center">Zadnja izmjena ${fmtDT(i.updated_at)} · ${esc(i.updated_by)}</small>` : ""}</div>
      <div class="sec"><h3>${ICON.task.replace("<svg", '<svg width="15" height="15"')} Mjere</h3><div class="list" id="i-tasks">${tk.map(taskLi).join("") || '<p class="muted" style="font-size:13px">Nema mjera.</p>'}</div>
        <form class="inline" id="i-tf" style="margin-top:8px"><input id="i-tt" placeholder="Nova mjera, npr. Izraditi politiku backupa"><input id="i-td" type="date" style="flex:0 0 150px"><button class="btn sm" type="submit">Dodaj</button></form></div>
      <div class="sec"><h3>${ICON.file.replace("<svg", '<svg width="15" height="15"')} Dokazi</h3><div class="list">${ev.map(evLi).join("") || '<p class="muted" style="font-size:13px">Nema dokaza.</p>'}</div>
        <label class="drop" id="i-drop" style="display:block;margin-top:8px">Prevucite fajl ovdje ili kliknite za upload (do 25 MB)<input type="file" id="i-file" hidden multiple></label></div>`, () => refresh());
    $$("#i-st button").forEach(b => b.addEventListener("click", () => { status = b.dataset.s; $$("#i-st button").forEach(x => x.classList.toggle("on", x === b)); }));
    $("#i-save").addEventListener("click", async () => {
      await api(`/projects/${P.id}/items/${i.id}`, { method: "PUT", body: { status: status === "" ? null : +status, applicable: $("#i-app") ? ($("#i-app").checked ? 1 : 0) : 1, justification: val("i-just"), note: val("i-note"), owner: val("i-owner") } });
      toast("Sačuvano"); closeDrawer();
    });
    $("#i-tf").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("i-tt").trim()) return;
      await api(`/projects/${P.id}/tasks`, { method: "POST", body: { title: val("i-tt"), due: val("i-td"), item_id: i.id } });
      await loadProject(P.id); itemDrawerRefresh(id);
    });
    bindLists(() => itemDrawerRefresh(id));
    bindUpload($("#i-drop"), $("#i-file"), i.id, () => itemDrawerRefresh(id));
  }
  async function itemDrawerRefresh(id) { await loadProject(P.id); const cb = drawer._onClose; drawer._onClose = null; itemDrawer(id); drawer._onClose = cb; }

  const taskLi = t => `<div class="li ${t.status === "done" ? "done" : ""}" data-task="${t.id}"><span class="grow"><b>${esc(t.title)}</b><small>${esc(t.owner || "bez odgovornog")}${t.due ? " · rok " + fmtDate(t.due) : ""}</small></span>
    <select class="stsel" data-tstat>${Object.entries(TSTAT).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select><button class="btn sm ghost danger" data-tdel title="Obriši">${ICON.x}</button></div>`;
  const evLi = e => `<div class="li" data-ev="${e.id}"><span class="grow"><b>${esc(e.name)}</b><small>${fmtSize(e.size)} · ${fmtDate(e.uploaded_at)} · ${esc(e.uploaded_by)}</small></span>
    <a class="btn sm" href="/api/evidence/${e.id}/download">Preuzmi</a><button class="btn sm ghost danger" data-edel title="Obriši">${ICON.x}</button></div>`;
  function bindLists(after) {
    $$("[data-task]").forEach(li => {
      const id = li.dataset.task;
      $("[data-tstat]", li).addEventListener("change", async e => { await api("/tasks/" + id, { method: "PUT", body: { status: e.target.value } }); toast("Status ažuriran"); after(); });
      $("[data-tdel]", li).addEventListener("click", async () => { if (!confirm("Obrisati mjeru?")) return; await api("/tasks/" + id, { method: "DELETE" }); after(); });
    });
    $$("[data-ev]").forEach(li => $("[data-edel]", li).addEventListener("click", async () => {
      if (!confirm("Obrisati dokaz? Fajl se trajno briše.")) return; await api("/evidence/" + li.dataset.ev, { method: "DELETE" }); after();
    }));
  }
  function bindUpload(drop, input, itemId, after) {
    const send = async files => {
      for (const f of files) {
        if (f.size > 25 * 1048576) { toast(f.name + ": veće od 25 MB"); continue; }
        const fd = new FormData(); fd.append("file", f); if (itemId) fd.append("item_id", itemId);
        drop.textContent = "Šaljem " + f.name + "…";
        await api(`/projects/${P.id}/evidence`, { method: "POST", body: fd });
      }
      toast("Dokaz dodan"); after();
    };
    input.addEventListener("change", () => send([...input.files]));
    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); send([...e.dataTransfer.files]); });
  }

  /* tasks tab */
  function tabTasks() {
    const code = Object.fromEntries(ITEMS.map(i => [i.id, i.code]));
    const opts = ITEMS.map(i => `<option value="${i.id}">${esc(i.code)} ${esc(i.title)}</option>`).join("");
    $("#tab").innerHTML = `<form class="card form" id="tf" style="margin-bottom:14px"><h3>Nova mjera</h3><div class="inline" style="flex-wrap:wrap"><input id="t-title" placeholder="Opis mjere" style="flex:2 1 260px">
      <input id="t-owner" placeholder="Odgovorni" style="flex:1 1 140px"><input id="t-due" type="date" style="flex:0 0 150px"><select id="t-item" style="flex:1 1 200px;border:1px solid var(--line2);border-radius:9px;background:var(--bg);padding:7px"><option value="">Bez veze sa zahtjevom</option>${opts}</select><button class="btn primary" type="submit">Dodaj</button></div></form>
      <div class="tools"><span class="sp"></span><a class="btn" href="/api/projects/${P.id}/export/tasks.csv">Izvoz plana mjera</a></div>
      ${TASKS.length ? `<table class="tbl"><thead><tr><th>Mjera</th><th>Veza</th><th class="hide-m">Odgovorni</th><th>Rok</th><th>Status</th><th></th></tr></thead><tbody>
      ${TASKS.map(t => { const n = daysTo(t.due); return `<tr data-task="${t.id}" class="${t.status === "done" ? "na" : ""}"><td><b>${esc(t.title)}</b></td><td class="code">${esc(code[t.item_id] || "")}</td><td class="hide-m">${esc(t.owner)}</td>
        <td>${t.due ? fmtDate(t.due) : ""} ${t.status !== "done" && n !== null && n < 0 ? '<span class="tag red">kasni</span>' : ""}</td>
        <td><select class="stsel" data-tstat>${Object.entries(TSTAT).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select></td><td><button class="btn sm ghost danger" data-tdel title="Obriši">${ICON.x}</button></td></tr>`; }).join("")}
      </tbody></table>` : '<div class="card empty">Još nema mjera.</div>'}`;
    $("#tf").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("t-title").trim()) return;
      await api(`/projects/${P.id}/tasks`, { method: "POST", body: { title: val("t-title"), owner: val("t-owner"), due: val("t-due"), item_id: val("t-item") || null } });
      toast("Mjera dodana"); refresh();
    });
    bindLists(refresh);
  }

  /* evidence tab */
  function tabEvidence() {
    const code = Object.fromEntries(ITEMS.map(i => [i.id, i.code]));
    $("#tab").innerHTML = `<label class="drop" id="e-drop" style="display:block;margin-bottom:14px">Prevucite dokumente ovdje ili kliknite za upload (do 25 MB po fajlu). Dokaz povežite sa zahtjevom u detaljima zahtjeva.<input type="file" id="e-file" hidden multiple></label>
      ${EVID.length ? `<table class="tbl"><thead><tr><th>Dokument</th><th>Veza</th><th class="hide-m">Veličina</th><th class="hide-m">Dodao</th><th>Datum</th><th></th></tr></thead><tbody>
      ${EVID.map(e => `<tr data-ev="${e.id}"><td><b>${esc(e.name)}</b></td><td class="code">${esc(code[e.item_id] || "–")}</td><td class="hide-m">${fmtSize(e.size)}</td><td class="hide-m">${esc(e.uploaded_by)}</td><td>${fmtDate(e.uploaded_at)}</td>
        <td style="white-space:nowrap"><a class="btn sm" href="/api/evidence/${e.id}/download">Preuzmi</a> <button class="btn sm ghost danger" data-edel title="Obriši">${ICON.x}</button></td></tr>`).join("")}
      </tbody></table>` : '<div class="card empty">Još nema dokaza.</div>'}`;
    bindUpload($("#e-drop"), $("#e-file"), null, refresh);
    bindLists(refresh);
  }

  /* audit tab */
  async function tabAudit() {
    const rows = await api(`/projects/${P.id}/audit`);
    const A = { create: "kreirao", update: "izmijenio", assess: "ocijenio", upload: "dodao dokaz", download: "preuzeo dokaz", delete: "obrisao", export: "izvezao" };
    $("#tab").innerHTML = `<p class="muted" style="margin-bottom:12px">Zapis svih promjena i preuzimanja dokaza na projektu (zadnjih 300).</p><div class="list log">${rows.map(r => {
      let d = {}; try { d = JSON.parse(r.detail || "{}"); } catch (x) {}
      const what = d.name || d.title || (r.entity === "item" ? r.entity_id + (d.status ? " → " + d.status : "") + (d.applicable === 0 ? " (neprimjenjivo)" : "") : "") || d.file || "";
      return `<div class="li"><span class="grow"><b>${esc(r.user)} ${esc(A[r.action] || r.action)} ${esc(what)}</b><small>${fmtDT(r.at)} · ${esc(r.entity)}</small></span></div>`;
    }).join("") || '<p class="muted">Nema zapisa.</p>'}</div>`;
  }

  route();
})();

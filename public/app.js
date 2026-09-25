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
  const LIK = ["", "Rijetko", "Malo vjerovatno", "Moguće", "Vjerovatno", "Skoro sigurno"];
  const IMP = ["", "Zanemariv", "Mali", "Umjeren", "Veliki", "Kritičan"];
  const LEVEL = s => !s ? null : s <= 4 ? "low" : s <= 9 ? "medium" : s <= 16 ? "high" : "critical";
  const LEVEL_T = { low: "Nizak", medium: "Srednji", high: "Visok", critical: "Kritičan" };
  const TREAT = { reduce: "Smanjiti", accept: "Prihvatiti", avoid: "Izbjeći", transfer: "Prenijeti" };
  const RSTAT = { open: "Otvoren", treating: "U tretmanu", accepted: "Prihvaćen", closed: "Zatvoren" };
  const FKIND = { major: "Glavna nesukladnost", minor: "Manja nesukladnost", obs: "Zapažanje", ofi: "Prilika za poboljšanje" };
  const FKIND_S = { major: "Glavna", minor: "Manja", obs: "Zapažanje", ofi: "Poboljšanje" };
  const FSTAT = { open: "Otvoren", action: "Korektivna mjera u toku", verify: "Čeka verifikaciju", closed: "Zatvoren" };
  const AKIND = { internal: "Interni audit", customer: "Audit kupca", certification: "Certifikacijski audit" };
  const svg = (p, w = 16) => `<svg viewBox="0 0 16 16" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    file: svg('<path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/>'),
    task: svg('<rect x="2" y="2" width="12" height="12" rx="3"/><path d="M5 8.2l2 2L11 6"/>'),
    x: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
    risk: svg('<path d="M8 1.8l6.5 11.4h-13z"/><path d="M8 6.5v3M8 11.6h.01"/>'),
    flag: svg('<path d="M3 14.5V2M3 2.5h8.5l-1.5 3 1.5 3H3"/>'),
    word: svg('<rect x="2" y="1.5" width="12" height="13" rx="2"/><path d="M4.5 5.5l1.2 5 1.3-3.5 1.3 3.5 1.2-5"/><path d="M11 5.5h1.5"/>'),
    csv: svg('<rect x="2" y="1.5" width="12" height="13" rx="2"/><path d="M2 6h12M2 10h12M6.5 1.5v13"/>'),
    search: svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>'),
    sun: svg('<circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1"/>'),
    moon: svg('<path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"/>'),
    auto: svg('<circle cx="8" cy="8" r="6"/><path d="M8 2v12" /><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/>'),
    cal: svg('<rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/>')
  };
  let ME = null;

  /* ---------- theme ---------- */
  const THEMES = ["auto", "light", "dark"];
  const getTheme = () => { try { return localStorage.getItem("ev-theme") || "auto"; } catch (e) { return "auto"; } };
  function applyTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    const b = $("#theme"); if (b) { b.innerHTML = ICON[t === "auto" ? "auto" : t === "dark" ? "moon" : "sun"]; b.title = "Tema: " + ({ auto: "prema sistemu", light: "svijetla", dark: "tamna" })[t]; }
  }
  applyTheme(getTheme());
  $("#theme").addEventListener("click", () => { const t = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3]; try { localStorage.setItem("ev-theme", t); } catch (e) {} applyTheme(t); toast($("#theme").title); });

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
  const ago = d => { const s = (Date.now() - new Date(d)) / 1000; return s < 60 ? "upravo" : s < 3600 ? `prije ${Math.floor(s / 60)} min` : s < 86400 ? `prije ${Math.floor(s / 3600)} h` : fmtDate(d); };
  const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const daysTo = d => d ? Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 864e5) : null;
  const R = n => "R-" + String(n).padStart(3, "0"), N = n => "N-" + String(n).padStart(3, "0");
  function ring(p, cls = "") {
    const r = 30, c = 2 * Math.PI * r, col = p >= 75 ? "var(--s3)" : p >= 40 ? "var(--s2)" : p > 0 ? "var(--s1)" : "var(--sn)";
    return `<div class="ring ${cls}"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--card2)" stroke-width="8"/><circle class="arc" cx="38" cy="38" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * p / 100} ${c}"/></svg><b>${p}%</b></div>`;
  }
  function deadlineTag(d) {
    const n = daysTo(d); if (n === null) return "";
    const cls = n < 0 ? "red" : n <= 30 ? "orange" : n <= 90 ? "blue" : "";
    return `<span class="tag ${cls}">${n < 0 ? "Rok prošao" : n === 0 ? "Rok danas" : "Rok za " + n + " d"}</span>`;
  }
  const dueTag = d => { const n = daysTo(d); if (n === null) return ""; return n < 0 ? `<span class="tag red">kasni ${-n} d</span>` : n === 0 ? '<span class="tag orange">danas</span>' : n <= 7 ? `<span class="tag orange">za ${n} d</span>` : `<span class="tag">${fmtDate(d)}</span>`; };
  const lvTag = (l, i) => { const s = l && i ? l * i : 0, lv = LEVEL(s); return lv ? `<span class="lv ${lv}">${s}<small>${LEVEL_T[lv]}</small></span>` : '<span class="faint">–</span>'; };
  const fkTag = k => `<span class="fk ${k}">${FKIND_S[k]}</span>`;

  /* ---------- drawer ---------- */
  const drawer = $("#drawer");
  function openDrawer(html, onClose) {
    $("#dbody").innerHTML = html; drawer.hidden = false; drawer._onClose = onClose;
    requestAnimationFrame(() => drawer.classList.add("in"));
    setTimeout(() => { const f = $("#dbody input:not([type=checkbox]), #dbody textarea, #dbody select"); f && f.focus(); }, 60);
  }
  function closeDrawer() { if (drawer.hidden) return; drawer.classList.remove("in"); drawer.hidden = true; const f = drawer._onClose; drawer._onClose = null; f && f(); }
  drawer.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeDrawer(); closeSearch(); }
    if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("#q").focus(); }
  });
  const val = id => ($("#" + id) || {}).value || "";
  const dhead = (t, sub) => `<div class="dhead"><div>${sub ? `<span class="code">${sub}</span>` : ""}<h2 id="dtitle">${t}</h2></div><button class="btn ghost x" data-close aria-label="Zatvori">${ICON.x}</button></div>`;
  const actions = (del) => `<div class="inline dact"><button class="btn primary" type="submit">Sačuvaj</button><button class="btn" type="button" data-close>Odustani</button>${del ? `<span class="sp"></span><button class="btn ghost danger" type="button" id="del">Obriši</button>` : ""}</div>`;

  /* ---------- search ---------- */
  const TYPES = { client: "Klijent", project: "Projekat", task: "Mjera", risk: "Rizik", finding: "Nalaz", evidence: "Dokaz" };
  const searchLink = r => r.t === "client" ? "#/clients" : r.t === "project" ? `#/p/${r.id}` : `#/p/${r.project_id}/${{ task: "mjere", risk: "rizici", finding: "audit", evidence: "dokazi" }[r.t]}`;
  let sT = null;
  function closeSearch() { $("#sres").hidden = true; }
  $("#q").addEventListener("input", e => {
    clearTimeout(sT); const q = e.target.value.trim();
    if (q.length < 2) return closeSearch();
    sT = setTimeout(async () => {
      const rs = await api("/search?q=" + encodeURIComponent(q));
      $("#sres").innerHTML = rs.length ? rs.map(r => `<a href="${searchLink(r)}"><span class="st-t">${TYPES[r.t]}</span><b>${esc(r.title)}</b><small>${esc(r.sub || "")}</small></a>`).join("") : '<p class="muted">Nema rezultata.</p>';
      $("#sres").hidden = false;
    }, 180);
  });
  $("#sres").addEventListener("click", e => { if (e.target.closest("a")) { closeSearch(); $("#q").value = ""; } });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) closeSearch(); });

  /* ---------- router ---------- */
  async function route() {
    closeDrawer(); closeSearch();
    const h = location.hash.replace(/^#\/?/, "").split("/");
    const nav = h[0] === "clients" ? "clients" : h[0] === "projects" || h[0] === "p" ? "projects" : "home";
    $$(".top nav a").forEach(a => a.classList.toggle("on", a.dataset.nav === nav));
    try {
      if (!ME) { ME = await api("/me"); $("#me").textContent = ME.email; $("#me").title = ME.email; }
      app.classList.remove("fade"); void app.offsetWidth; app.classList.add("fade");
      if (h[0] === "clients") return clientsView();
      if (h[0] === "projects") return projectsView();
      if (h[0] === "p" && h[1]) return projectView(h[1], h[2] || "pregled");
      return homeView();
    } catch (e) { if (e.message !== "403") app.innerHTML = `<div class="empty"><h2>Nešto nije u redu</h2><p>${esc(e.message)}</p></div>`; }
  }
  window.addEventListener("hashchange", route);

  /* ---------- home: dashboard ---------- */
  const pcard = p => `<a class="card pcard" href="#/p/${p.id}">${ring(p.readiness)}<div><div class="faint" style="font-size:12.5px;font-weight:650">${esc(p.client_name)}</div><h3>${esc(p.name)}</h3>
      <div class="meta"><span class="tag">${esc(ME.standards[p.standard] || p.standard)}</span><span class="tag blue">${esc(PHASES[p.phase] || p.phase)}</span>${deadlineTag(p.deadline)}</div>
      <div class="meta"><span>${p.assessed}/${p.applicable} ocijenjeno</span><span>${p.open_tasks} mjera${p.late_tasks ? ` <b class="red">(${p.late_tasks} kasni)</b>` : ""}</span>${p.open_findings ? `<span>${p.open_findings} nalaza</span>` : ""}${p.high_risks ? `<span>${p.high_risks} visokih rizika</span>` : ""}</div></div></a>`;
  async function homeView() {
    const d = await api("/dashboard"), ps = d.projects;
    const avg = ps.length ? Math.round(ps.reduce((a, p) => a + p.readiness, 0) / ps.length) : 0;
    const late = d.tasks.filter(t => daysTo(t.due) < 0).length;
    const soon = ps.filter(p => p.deadline && daysTo(p.deadline) >= 0 && daysTo(p.deadline) <= 60).length;
    const hour = new Date().getHours(), name = (ME.email.split("@")[0] || "").replace(/^\w/, c => c.toUpperCase());
    const A = { create: "kreirao", update: "izmijenio", assess: "ocijenio", upload: "dodao dokaz", download: "preuzeo", delete: "obrisao", export: "izvezao" };
    const tli = t => `<a class="li" href="#/p/${t.project_id}/mjere"><span class="grow"><b>${esc(t.title)}</b><small>${esc(t.client_name)} · ${esc(t.project_name)}${t.owner ? " · " + esc(t.owner) : ""}</small></span>${dueTag(t.due)}</a>`;
    app.innerHTML = `<div class="head"><div><h1>${hour < 11 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobro veče"}, ${esc(name)}.</h1><p>Pregled aktivnih projekata na dan ${fmtDate(new Date().toISOString())}</p></div><button class="btn primary" id="np">+ Novi projekat</button></div>
      <div class="kpis k6">
        <div class="card kpi"><b>${ps.length}</b><span>aktivnih projekata</span></div>
        <div class="card kpi"><b>${avg}%</b><span>prosječna spremnost</span></div>
        <div class="card kpi ${late ? "warn" : ""}"><b>${late}</b><span>mjera kasni</span></div>
        <div class="card kpi"><b>${d.tasks.length - late}</b><span>mjera dospijeva za 14 dana</span></div>
        <div class="card kpi ${d.findings.some(f => f.kind === "major") ? "warn" : ""}"><b>${d.findings.length}</b><span>otvorenih nalaza</span></div>
        <div class="card kpi"><b>${soon}</b><span>audita u 60 dana</span></div></div>
      <div class="dash">
        <div class="dmain">
          <div class="head sm"><h2>Aktivni projekti</h2><a href="#/projects">Svi projekti</a></div>
          ${ps.length ? `<div class="grid pgrid">${ps.map(pcard).join("")}</div>` : `<div class="card empty"><h2>Još nema projekata</h2><p>Dodajte klijenta i prvi projekat za ISO/IEC 27001.</p><p style="margin-top:14px"><button class="btn primary" id="np2">+ Novi projekat</button></p></div>`}
          <div class="head sm" style="margin-top:22px"><h2>Rokovi u naredne dvije sedmice</h2></div>
          <div class="card flush">${d.tasks.length ? `<div class="list plain">${d.tasks.map(tli).join("")}</div>` : '<p class="muted pad-s">Nema mjera s rokom u naredne dvije sedmice.</p>'}</div>
        </div>
        <aside class="dside">
          <div class="card"><h3>${ICON.task} Moje mjere</h3>${d.mine.length ? `<div class="list plain">${d.mine.slice(0, 8).map(tli).join("")}</div>` : '<p class="muted small">Nema mjera s vašim imenom i rokom u dvije sedmice. Mjere se dodjeljuju upisom imena ili e-maila u polje Odgovorni.</p>'}</div>
          <div class="card"><h3>${ICON.flag} Otvoreni nalazi</h3>${d.findings.length ? `<div class="list plain">${d.findings.slice(0, 8).map(f => `<a class="li" href="#/p/${f.project_id}/audit"><span class="grow"><b>${N(f.ref)} ${esc(f.title)}</b><small>${esc(f.client_name)}${f.due ? " · rok " + fmtDate(f.due) : ""}</small></span>${fkTag(f.kind)}</a>`).join("")}</div>` : '<p class="muted small">Nema otvorenih nalaza.</p>'}</div>
          <div class="card"><h3>Nedavna aktivnost</h3><div class="feed">${d.activity.map(r => { let x = {}; try { x = JSON.parse(r.detail || "{}"); } catch (e) {}
            return `<div><i></i><p><b>${esc(r.user.split("@")[0])}</b> ${esc(A[r.action] || r.action)} ${esc(x.title || x.name || x.file || r.entity_id || "")}<small>${r.project_name ? esc(r.project_name) + " · " : ""}${ago(r.at)}</small></p></div>`; }).join("") || '<p class="muted small">Još nema aktivnosti.</p>'}</div></div>
        </aside>
      </div>`;
    $$("#np,#np2").forEach(b => b.addEventListener("click", newProject));
  }

  async function projectsView() {
    const ps = await api("/projects");
    const active = ps.filter(p => p.status === "active"), closed = ps.filter(p => p.status !== "active");
    app.innerHTML = `<div class="head"><div><h1>Projekti</h1><p>${active.length} aktivnih, ${closed.length} završenih.</p></div><button class="btn primary" id="np">+ Novi projekat</button></div>
      ${active.length ? `<div class="grid pgrid">${active.map(pcard).join("")}</div>` : `<div class="card empty"><h2>Još nema projekata</h2><p>Dodajte klijenta i prvi projekat za ISO/IEC 27001.</p></div>`}
      ${closed.length ? `<h2 style="margin:28px 0 12px">Završeni</h2><div class="grid pgrid">${closed.map(pcard).join("")}</div>` : ""}`;
    $("#np").addEventListener("click", newProject);
  }

  async function newProject() {
    const cs = await api("/clients");
    openDrawer(`${dhead("Novi projekat")}<p class="muted" style="margin-top:-8px">Katalog zahtjeva se automatski učitava prema standardu.</p>
      <form class="form" id="pf">
        <label class="f">Klijent<select id="p-client" required><option value="">Izaberite…</option>${cs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}<option value="__new">+ Novi klijent…</option></select></label>
        <div id="newc" hidden class="form card" style="padding:12px"><label class="f">Naziv klijenta<input id="c-name"></label><div class="two"><label class="f">Država<input id="c-country" placeholder="BiH"></label><label class="f">Djelatnost<input id="c-industry"></label></div></div>
        <label class="f">Naziv projekta<input id="p-name" required placeholder="npr. ISO 27001 certifikacija 2027"></label>
        <label class="f">Standard<select id="p-std">${Object.entries(ME.standards).map(([k, v]) => `<option value="${k}">${esc(v)} · ${ME.catalogs[k].count} stavki</option>`).join("")}</select></label>
        <div class="two"><label class="f">Rok (audit)<input id="p-deadline" type="date"></label><label class="f">Ko traži<input id="p-req" placeholder="npr. kupac iz Njemačke"></label></div>
        <label class="f">Obim (scope)<textarea id="p-scope" placeholder="Lokacije, procesi, sistemi…"></textarea></label>
        <div class="inline dact"><button class="btn primary" type="submit">Kreiraj projekat</button><button class="btn" type="button" data-close>Odustani</button></div>
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
    openDrawer(`${dhead(c.id ? "Uredi klijenta" : "Novi klijent")}
      <form class="form" id="cf"><label class="f">Naziv<input id="c-name" value="${esc(c.name)}" required></label>
      <div class="two"><label class="f">Država<input id="c-country" value="${esc(c.country)}"></label><label class="f">Djelatnost<input id="c-industry" value="${esc(c.industry)}"></label></div>
      <div class="two"><label class="f">Kontakt osoba<input id="c-cn" value="${esc(c.contact_name)}"></label><label class="f">E-mail kontakta<input id="c-ce" type="email" value="${esc(c.contact_email)}"></label></div>
      <label class="f">Napomene<textarea id="c-notes">${esc(c.notes)}</textarea></label>${actions(false)}</form>`);
    $("#cf").addEventListener("submit", async e => {
      e.preventDefault();
      const b = { name: val("c-name"), country: val("c-country"), industry: val("c-industry"), contact_name: val("c-cn"), contact_email: val("c-ce"), notes: val("c-notes") };
      if (!b.name.trim()) return;
      await api(c.id ? "/clients/" + c.id : "/clients", { method: c.id ? "PUT" : "POST", body: b });
      toast("Sačuvano"); closeDrawer(); clientsView();
    });
  }

  /* ---------- project ---------- */
  let P = null, ITEMS = [], TASKS = [], EVID = [], RISKS = [], FINDS = [], AUDITS = [];
  const CODE = () => Object.fromEntries(ITEMS.map(i => [i.id, i.code]));
  const CAT = () => ME.catalogs[P.standard];
  async function loadProject(id) {
    [P, ITEMS, TASKS, EVID, RISKS, FINDS, AUDITS] = await Promise.all(["", "/items", "/tasks", "/evidence", "/risks", "/findings", "/audits"].map(s => api("/projects/" + id + s)));
  }
  async function projectView(id, tab) {
    await loadProject(id);
    const open = TASKS.filter(t => t.status !== "done").length, openF = FINDS.filter(f => f.status !== "closed").length;
    const K = CAT().kinds;
    if ((tab === "zahtjevi" && !K.clause) || (tab === "kontrole" && !K.control)) tab = "pregled";
    const tabs = [["pregled", "Pregled"], ...(K.clause ? [["zahtjevi", K.clause.tab]] : []), ...(K.control ? [["kontrole", K.control.tab]] : []), ["rizici", "Rizici", RISKS.length], ["mjere", "Mjere", open], ["dokazi", "Dokazi", EVID.length], ["audit", "Audit i nalazi", openF], ["izvjestaji", "Izvještaji"], ["aktivnost", "Aktivnost"]];
    app.innerHTML = `<div class="phead"><div><div class="crumb"><a href="#/projects">Projekti</a> / ${esc(P.client_name)}</div><h1>${esc(P.name)}</h1>
      <div class="facts"><span>${esc(ME.standards[P.standard])}</span><span>Faza: <b>${esc(PHASES[P.phase] || P.phase)}</b></span>${P.deadline ? `<span>Rok: <b>${fmtDate(P.deadline)}</b></span>` : ""}${P.requester ? `<span>Traži: <b>${esc(P.requester)}</b></span>` : ""}${P.lead ? `<span>Voditelj: <b>${esc(P.lead)}</b></span>` : ""}${deadlineTag(P.deadline)}${P.status !== "active" ? '<span class="tag">Završen</span>' : ""}</div></div>
      <div class="inline"><a class="btn" href="#/p/${P.id}/izvjestaji">${ICON.word} Izvještaji</a><button class="btn" id="pedit">Uredi projekat</button></div></div>
      <nav class="tabs">${tabs.map(([k, t, n]) => `<a href="#/p/${P.id}/${k}" class="${k === tab ? "on" : ""}">${t}${n ? `<small>${n}</small>` : ""}</a>`).join("")}</nav>
      <section id="tab"></section>`;
    $("#pedit").addEventListener("click", projectForm);
    ({ pregled: tabOverview, zahtjevi: () => tabItems("clause"), kontrole: () => tabItems("control"), rizici: tabRisks, mjere: tabTasks, dokazi: tabEvidence, audit: tabAudits, izvjestaji: tabReports, aktivnost: tabAudit }[tab] || tabOverview)();
  }
  const refresh = () => projectView(P.id, (location.hash.split("/")[3] || "pregled"));

  function projectForm() {
    openDrawer(`${dhead("Uredi projekat")}
      <form class="form" id="pf"><label class="f">Naziv<input id="p-name" value="${esc(P.name)}"></label>
      <div class="two"><label class="f">Faza<select id="p-phase">${Object.entries(PHASES).map(([k, v]) => `<option value="${k}" ${k === P.phase ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f">Status<select id="p-status"><option value="active" ${P.status === "active" ? "selected" : ""}>Aktivan</option><option value="closed" ${P.status !== "active" ? "selected" : ""}>Završen</option></select></label></div>
      <div class="two"><label class="f">Rok (audit)<input id="p-deadline" type="date" value="${esc(P.deadline)}"></label><label class="f">Ko traži<input id="p-req" value="${esc(P.requester)}"></label></div>
      <label class="f">Voditelj projekta<input id="p-lead" value="${esc(P.lead)}"></label>
      <label class="f">Obim (scope)<textarea id="p-scope">${esc(P.scope)}</textarea></label>${actions(false)}</form>`);
    $("#pf").addEventListener("submit", async e => {
      e.preventDefault();
      await api("/projects/" + P.id, { method: "PUT", body: { name: val("p-name"), phase: val("p-phase"), status: val("p-status"), deadline: val("p-deadline"), requester: val("p-req"), lead: val("p-lead"), scope: val("p-scope") } });
      toast("Sačuvano"); closeDrawer(); refresh();
    });
  }

  /* heat map (likelihood rows 5..1, impact columns 1..5) */
  function heatmap(list, residual, onPick) {
    const k = residual ? ["res_likelihood", "res_impact"] : ["likelihood", "impact"];
    const cnt = {}; list.filter(r => r.status !== "closed").forEach(r => { if (r[k[0]] && r[k[1]]) { const key = r[k[0]] + ":" + r[k[1]]; cnt[key] = (cnt[key] || 0) + 1; } });
    let h = `<div class="heat${onPick ? " pick" : ""}"><span class="ax y">Vjerovatnoća</span>`;
    for (let l = 5; l >= 1; l--) { h += `<span class="lb" title="${LIK[l]}">${l}</span>`; for (let i = 1; i <= 5; i++) { const n = cnt[l + ":" + i] || 0; h += `<button type="button" class="hc ${LEVEL(l * i)}${n ? " has" : ""}" data-l="${l}" data-i="${i}" title="${LIK[l]} × ${IMP[i]} = ${l * i}">${n || ""}</button>`; } }
    h += `<span></span>${[1, 2, 3, 4, 5].map(i => `<span class="lb" title="${IMP[i]}">${i}</span>`).join("")}<span class="ax x">Uticaj</span></div>`;
    return h;
  }

  /* overview */
  function tabOverview() {
    const s = P.summary, c = P.counters;
    const K = CAT().kinds;
    const bars = kind => s.groups.filter(g => g.kind === kind).map(g => `<div class="bar" style="--c:${kind === "clause" ? "var(--blue)" : "var(--teal)"}"><span class="n">${K[kind].gp.replace("Čl. ", "")}${g.group}</span><span>${esc(g.name)}</span><span class="t"><i style="width:${g.pct}%"></i></span><span class="p">${g.pct}%</span></div>`).join("");
    const app_ = ITEMS.filter(i => i.applicable);
    const dist = ST.map(x => ({ ...x, n: app_.filter(i => (i.status == null ? "" : i.status) === x.v).length }));
    const openT = TASKS.filter(t => t.status !== "done").sort((a, b) => (a.due || "9") < (b.due || "9") ? -1 : 1).slice(0, 6);
    const code = CODE();
    const high = RISKS.filter(r => r.status !== "closed" && r.likelihood * r.impact >= 10).sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact).slice(0, 5);
    $("#tab").innerHTML = `<div class="ov">
      <div class="card big">${ring(s.readiness, "lg")}<p>Spremnost za audit<br><b>${s.assessed} od ${s.applicable}</b> stavki ocijenjeno</p>
        <div style="width:100%"><div class="dist">${dist.map(d => d.n ? `<i style="width:${d.n / app_.length * 100}%;background:${d.c}" title="${d.t}: ${d.n}"></i>` : "").join("")}</div>
        <div class="legend">${dist.map(d => `<span><i style="background:${d.c}"></i>${d.t} ${d.n}</span>`).join("")}</div></div></div>
      ${Object.keys(K).map(k => `<div class="card bars${Object.keys(K).length === 1 ? " span2" : ""}"><h3>${esc(K[k].title)}</h3>${bars(k)}
        ${k === "control" ? `<p class="faint" style="font-size:12.5px;margin-top:10px">${ITEMS.filter(i => i.kind === "control" && !i.applicable).length} kontrola označeno kao neprimjenjivo.</p>` : ""}</div>`).join("")}</div>
      <div class="kpis k6"><div class="card kpi"><b>${EVID.length}</b><span>dokaza priloženo</span></div><div class="card kpi"><b>${c.open_tasks}</b><span>otvorenih mjera</span></div>
      <div class="card kpi ${c.late_tasks ? "warn" : ""}"><b>${c.late_tasks}</b><span>mjera kasni</span></div><div class="card kpi"><b>${RISKS.length}</b><span>rizika u registru</span></div>
      <div class="card kpi ${c.major_findings ? "warn" : ""}"><b>${c.open_findings}</b><span>otvorenih nalaza</span></div><div class="card kpi"><b>${P.deadline ? daysTo(P.deadline) : "–"}</b><span>dana do audita</span></div></div>
      <div class="ov2">
        <div class="card"><div class="head sm"><h3>Sljedeće mjere</h3><a href="#/p/${P.id}/mjere">Sve mjere</a></div>
        ${openT.length ? `<div class="list plain">${openT.map(t => `<div class="li"><span class="grow"><b>${esc(t.title)}</b><small>${t.item_id ? code[t.item_id] + " · " : ""}${esc(t.owner || "bez odgovornog")}</small></span>${dueTag(t.due)}</div>`).join("")}</div>` : '<p class="muted">Nema otvorenih mjera.</p>'}</div>
        <div class="card"><div class="head sm"><h3>Mapa rizika</h3><a href="#/p/${P.id}/rizici">Registar rizika</a></div>
          ${RISKS.length ? `<div class="hwrap">${heatmap(RISKS, false)}<div class="list plain grow">${high.map(r => `<div class="li"><span class="grow"><b>${R(r.ref)} ${esc(r.asset)}</b><small>${esc(r.threat || "")}</small></span>${lvTag(r.likelihood, r.impact)}</div>`).join("") || '<p class="muted small">Nema visokih rizika.</p>'}</div></div>` : `<p class="muted">Registar rizika je prazan. <a href="#/p/${P.id}/rizici">Dodajte prvi rizik</a>.</p>`}</div>
      </div>`;
  }

  /* items (clauses or Annex A) */
  let FILT = { q: "", s: "all", g: "all" };
  function tabItems(kind) {
    const C = CAT(), groups = C.groups[kind], gp = C.kinds[kind].gp;
    $("#tab").innerHTML = `<div class="tools"><input id="fq" type="search" placeholder="Pretraži oznaku ili naziv…" value="${esc(FILT.q)}">
      <select id="fs"><option value="all">Svi statusi</option>${ST.map(x => `<option value="${x.v === "" ? "none" : x.v}">${x.t}</option>`).join("")}${kind === "control" ? '<option value="na">Neprimjenjivo</option>' : ""}</select>
      <select id="fg"><option value="all">Sve oblasti</option>${Object.entries(groups).map(([k, v]) => `<option value="${k}">${gp}${k} ${esc(v)}</option>`).join("")}</select>
      <span class="sp"></span>${kind === "control" && C.soa ? `<a class="btn" href="/api/projects/${P.id}/report/soa.docx">${ICON.word} SoA (Word)</a>` : `<a class="btn" href="/api/projects/${P.id}/report/gap.docx">${ICON.word} Gap izvještaj</a>`}</div><div id="itbl"></div>`;
    $("#fs").value = FILT.s; if ($("#fs").value !== FILT.s) $("#fs").value = "all";
    $("#fg").value = groups[FILT.g] ? FILT.g : "all";
    const draw = () => {
      const q = FILT.q.toLowerCase();
      const rows = ITEMS.filter(i => i.kind === kind && (FILT.g === "all" || !groups[FILT.g] || i.group === FILT.g)
        && (!q || (i.code + " " + i.title + " " + i.note).toLowerCase().includes(q))
        && (FILT.s === "all" || (FILT.s === "na" ? !i.applicable : FILT.s === "none" ? i.status == null && i.applicable : String(i.status) === FILT.s && i.applicable)));
      let last = null, html = "";
      for (const i of rows) {
        if (i.group !== last) { last = i.group; html += `<tr class="grp"><td colspan="${kind === "control" ? 6 : 5}">${gp}${i.group} · ${esc(groups[i.group])}</td></tr>`; }
        const st = stOf(i.status);
        const nr = RISKS.filter(r => (r.controls || "").split(",").includes(i.id)).length, nf = FINDS.filter(f => f.item_id === i.id && f.status !== "closed").length;
        html += `<tr class="row ${i.applicable ? "" : "na"}" data-id="${i.id}"><td class="code">${esc(i.code)}</td><td class="ttl"><b>${esc(i.title)}</b><small>${esc(i.note ? i.note.slice(0, 110) : i.hint)}</small></td>
          ${kind === "control" ? `<td class="hide-m">${i.applicable ? '<span class="tag teal">Primjenjiva</span>' : '<span class="tag">Ne</span>'}</td>` : ""}
          <td><span class="st" data-s="${i.status == null ? "" : i.status}"><i></i>${i.applicable ? st.t : "Neprimjenjivo"}</span></td>
          <td class="hide-m">${esc(i.owner)}</td><td><span class="cnt"><span title="Dokazi">${ICON.file}${i.evidence}</span><span title="Otvorene mjere">${ICON.task}${i.tasks.open}</span>${nr ? `<span title="Povezani rizici">${ICON.risk}${nr}</span>` : ""}${nf ? `<span class="red" title="Otvoreni nalazi">${ICON.flag}${nf}</span>` : ""}</span></td></tr>`;
      }
      $("#itbl").innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Oznaka</th><th>Naziv</th>${kind === "control" ? `<th class="hide-m">${C.soa ? "SoA" : "Primjena"}</th>` : ""}<th>Status</th><th class="hide-m">Odgovorni</th><th></th></tr></thead><tbody>${html}</tbody></table>` : '<div class="card empty">Nema stavki za ovaj filter.</div>';
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
    const rk = RISKS.filter(r => (r.controls || "").split(",").includes(id)), fd = FINDS.filter(f => f.item_id === id);
    let status = i.status == null ? "" : i.status;
    openDrawer(`${dhead(esc(i.title), `${esc(i.code)} · ${esc(CAT().kinds[i.kind].one)}`)}
      <p class="hint">${esc(i.hint)}</p>
      ${i.kind === "control" ? `<label class="switch"><input type="checkbox" id="i-app" ${i.applicable ? "checked" : ""}> Primjenjiva kontrola${CAT().soa ? " (SoA)" : ""}</label>
        <label class="f">Obrazloženje${CAT().soa ? " za SoA" : ""}<textarea id="i-just" placeholder="Zašto je kontrola uključena ili isključena…">${esc(i.justification)}</textarea></label>` : ""}
      <div class="f"><span class="fl">Status</span><div class="seg" id="i-st">${ST.map(x => `<button type="button" data-s="${x.v}" class="${String(x.v) === String(status) ? "on" : ""}"><i></i>${x.t}</button>`).join("")}</div></div>
      <label class="f">Odgovorna osoba<input id="i-owner" value="${esc(i.owner)}" placeholder="npr. IT menadžer klijenta"></label>
      <label class="f">Nalaz i napomena<textarea id="i-note" placeholder="Šta smo zatekli, šta nedostaje, gdje je dokumentovano…">${esc(i.note)}</textarea></label>
      <div class="inline"><button class="btn primary" id="i-save">Sačuvaj</button>${i.updated_at ? `<small class="faint" style="align-self:center">Zadnja izmjena ${fmtDT(i.updated_at)} · ${esc(i.updated_by)}</small>` : ""}</div>
      <div class="sec"><h3>${ICON.task} Mjere</h3><div class="list" id="i-tasks">${tk.map(taskLi).join("") || '<p class="muted small">Nema mjera.</p>'}</div>
        <form class="inline" id="i-tf" style="margin-top:8px"><input id="i-tt" placeholder="Nova mjera, npr. Izraditi politiku backupa"><input id="i-td" type="date" style="flex:0 0 150px"><button class="btn sm" type="submit">Dodaj</button></form></div>
      <div class="sec"><h3>${ICON.file} Dokazi</h3><div class="list">${ev.map(evLi).join("") || '<p class="muted small">Nema dokaza.</p>'}</div>
        <label class="drop" id="i-drop" style="display:block;margin-top:8px">Prevucite fajl ovdje ili kliknite za upload (do 25 MB)<input type="file" id="i-file" hidden multiple></label></div>
      ${rk.length || i.kind === "control" ? `<div class="sec"><h3>${ICON.risk} Povezani rizici</h3><div class="list">${rk.map(r => `<a class="li" href="#/p/${P.id}/rizici" data-r="${r.id}"><span class="grow"><b>${R(r.ref)} ${esc(r.asset)}</b><small>${esc(r.threat || "")}</small></span>${lvTag(r.likelihood, r.impact)}</a>`).join("") || '<p class="muted small">Kontrola nije povezana ni s jednim rizikom.</p>'}</div></div>` : ""}
      ${fd.length ? `<div class="sec"><h3>${ICON.flag} Nalazi audita</h3><div class="list">${fd.map(f => `<a class="li" href="#/p/${P.id}/audit"><span class="grow"><b>${N(f.ref)} ${esc(f.title)}</b><small>${FSTAT[f.status]}</small></span>${fkTag(f.kind)}</a>`).join("")}</div></div>` : ""}`, () => refresh());
    $$("#i-st button").forEach(b => b.addEventListener("click", () => { status = b.dataset.s; $$("#i-st button").forEach(x => x.classList.toggle("on", x === b)); }));
    $("#i-save").addEventListener("click", async () => {
      await api(`/projects/${P.id}/items/${i.id}`, { method: "PUT", body: { status: status === "" ? null : +status, applicable: $("#i-app") ? ($("#i-app").checked ? 1 : 0) : 1, justification: val("i-just"), note: val("i-note"), owner: val("i-owner") } });
      toast("Sačuvano"); closeDrawer();
    });
    $("#i-tf").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("i-tt").trim()) return;
      await api(`/projects/${P.id}/tasks`, { method: "POST", body: { title: val("i-tt"), due: val("i-td"), item_id: i.id } });
      reopen(() => itemDrawer(id));
    });
    bindLists(() => reopen(() => itemDrawer(id)));
    bindUpload($("#i-drop"), $("#i-file"), i.id, () => reopen(() => itemDrawer(id)));
  }
  async function reopen(fn) { await loadProject(P.id); const cb = drawer._onClose; drawer._onClose = null; fn(); drawer._onClose = cb; }

  const taskLi = t => `<div class="li ${t.status === "done" ? "done" : ""}" data-task="${t.id}"><span class="grow"><b>${esc(t.title)}</b><small>${esc(t.owner || "bez odgovornog")}${t.due ? " · rok " + fmtDate(t.due) : ""}</small></span>
    <select class="stsel" data-tstat>${Object.entries(TSTAT).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select><button class="btn sm ghost danger" data-tdel title="Obriši" type="button">${ICON.x}</button></div>`;
  const evLi = e => `<div class="li" data-ev="${e.id}"><span class="grow"><b>${esc(e.name)}</b><small>${fmtSize(e.size)} · ${fmtDate(e.uploaded_at)} · ${esc(e.uploaded_by)}</small></span>
    <a class="btn sm" href="/api/evidence/${e.id}/download">Preuzmi</a><button class="btn sm ghost danger" data-edel title="Obriši" type="button">${ICON.x}</button></div>`;
  function bindLists(after) {
    $$("[data-task]").forEach(li => {
      const id = li.dataset.task, sel = $("[data-tstat]", li), del = $("[data-tdel]", li);
      sel && sel.addEventListener("change", async e => { await api("/tasks/" + id, { method: "PUT", body: { status: e.target.value } }); toast("Status ažuriran"); after(); });
      del && del.addEventListener("click", async e => { e.stopPropagation(); if (!confirm("Obrisati mjeru?")) return; await api("/tasks/" + id, { method: "DELETE" }); after(); });
    });
    $$("[data-ev]").forEach(li => { const b = $("[data-edel]", li); b && b.addEventListener("click", async () => {
      if (!confirm("Obrisati dokaz? Fajl se trajno briše.")) return; await api("/evidence/" + li.dataset.ev, { method: "DELETE" }); after();
    }); });
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
  /* linked task list with quick add (risks and findings) */
  const linkedTasks = (key, id) => `<div class="sec"><h3>${ICON.task} ${key === "finding_id" ? "Korektivne mjere" : "Mjere tretmana"}</h3><div class="list">${TASKS.filter(t => t[key] === id).map(taskLi).join("") || '<p class="muted small">Nema mjera.</p>'}</div>
    <div class="inline" style="margin-top:8px"><input id="lt-t" placeholder="Nova mjera"><input id="lt-o" placeholder="Odgovorni" style="flex:0 0 130px"><input id="lt-d" type="date" style="flex:0 0 140px"><button class="btn sm" type="button" id="lt-add">Dodaj</button></div></div>`;
  function bindLinked(key, id, again) {
    $("#lt-add").addEventListener("click", async () => {
      if (!val("lt-t").trim()) return;
      await api(`/projects/${P.id}/tasks`, { method: "POST", body: { title: val("lt-t"), owner: val("lt-o"), due: val("lt-d"), [key]: id } });
      toast("Mjera dodana"); reopen(again);
    });
    bindLists(() => reopen(again));
  }

  /* ---------- risks ---------- */
  let RF = { s: "active", cell: null, res: false };
  function tabRisks() {
    const code = CODE();
    $("#tab").innerHTML = `<div class="rgrid">
      <div class="card"><div class="head sm"><h3>Mapa rizika</h3><div class="seg sm" id="rres"><button type="button" data-v="0" class="${RF.res ? "" : "on"}">Inherentni</button><button type="button" data-v="1" class="${RF.res ? "on" : ""}">Rezidualni</button></div></div>
        <div id="hm"></div><p class="faint small" style="margin-top:8px">Kliknite polje za filter. Nivoi: 1–4 nizak, 5–9 srednji, 10–16 visok, 20–25 kritičan.</p></div>
      <div><div class="tools"><select id="rs"><option value="active">Aktivni rizici</option><option value="all">Svi rizici</option>${Object.entries(RSTAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
        <span id="rcell"></span><span class="sp"></span><a class="btn" href="/api/projects/${P.id}/report/risks.docx">${ICON.word} Registar (Word)</a><button class="btn primary" id="nr">+ Novi rizik</button></div><div id="rtbl"></div></div></div>`;
    $("#rs").value = RF.s;
    const draw = () => {
      $("#hm").innerHTML = heatmap(RISKS, RF.res, true);
      $$("#hm .hc").forEach(b => { if (RF.cell && RF.cell === b.dataset.l + ":" + b.dataset.i) b.classList.add("sel"); b.addEventListener("click", () => { const k = b.dataset.l + ":" + b.dataset.i; RF.cell = RF.cell === k ? null : k; draw(); }); });
      $("#rcell").innerHTML = RF.cell ? `<button class="tag blue" id="rclr">V×U ${RF.cell.replace(":", "×")} ✕</button>` : "";
      $("#rclr") && $("#rclr").addEventListener("click", () => { RF.cell = null; draw(); });
      const kL = RF.res ? "res_likelihood" : "likelihood", kI = RF.res ? "res_impact" : "impact";
      const rows = RISKS.filter(r => (RF.s === "all" || (RF.s === "active" ? r.status !== "closed" : r.status === RF.s)) && (!RF.cell || RF.cell === r[kL] + ":" + r[kI]))
        .sort((a, b) => (b.likelihood * b.impact || 0) - (a.likelihood * a.impact || 0) || a.ref - b.ref);
      $("#rtbl").innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Oznaka</th><th>Imovina i prijetnja</th><th>Inherentni</th><th class="hide-m">Tretman</th><th class="hide-m">Kontrole</th><th>Rezidualni</th><th class="hide-m">Status</th></tr></thead><tbody>
        ${rows.map(r => `<tr class="row" data-id="${r.id}"><td class="code">${R(r.ref)}</td><td class="ttl"><b>${esc(r.asset)}</b><small>${esc(r.threat || "")}${r.owner ? " · vlasnik: " + esc(r.owner) : ""}</small></td><td>${lvTag(r.likelihood, r.impact)}</td>
          <td class="hide-m">${TREAT[r.treatment]}</td><td class="hide-m code small">${(r.controls || "").split(",").filter(Boolean).map(c => code[c]).slice(0, 4).join(", ")}${(r.controls || "").split(",").filter(Boolean).length > 4 ? " …" : ""}</td>
          <td>${lvTag(r.res_likelihood, r.res_impact)}</td><td class="hide-m"><span class="tag ${r.status === "closed" ? "teal" : r.status === "treating" ? "blue" : ""}">${RSTAT[r.status]}</span></td></tr>`).join("")}</tbody></table>`
        : `<div class="card empty"><h2>${RISKS.length ? "Nema rizika za ovaj filter" : "Registar rizika je prazan"}</h2><p>Rizik opisuje imovinu, prijetnju i ranjivost, s vjerovatnoćom i uticajem od 1 do 5.</p></div>`;
      $$("#rtbl tr.row").forEach(tr => tr.addEventListener("click", () => riskDrawer(RISKS.find(r => r.id === tr.dataset.id))));
    };
    $("#rs").addEventListener("change", e => { RF.s = e.target.value; draw(); });
    $$("#rres button").forEach(b => b.addEventListener("click", () => { RF.res = b.dataset.v === "1"; RF.cell = null; $$("#rres button").forEach(x => x.classList.toggle("on", x === b)); draw(); }));
    $("#nr").addEventListener("click", () => riskDrawer({}));
    draw();
  }
  const scale = (id, labels, v) => `<div class="seg sc" id="${id}">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-v="${n}" class="${+v === n ? "on" : ""}" title="${labels[n]}"><b>${n}</b><small>${labels[n]}</small></button>`).join("")}</div>`;
  function riskDrawer(r) {
    const sel = new Set((r.controls || "").split(",").filter(Boolean));
    const ctr = ITEMS.filter(i => !CAT().kinds.control || i.kind === "control").sort((a, b) => sel.has(b.id) - sel.has(a.id));
    openDrawer(`${dhead(r.id ? esc(r.asset) : "Novi rizik", r.id ? R(r.ref) + " · Registar rizika" : "Registar rizika")}
      <form class="form" id="rf">
        <label class="f">Imovina ili proces<input id="r-asset" value="${esc(r.asset)}" required placeholder="npr. ERP sistem, podaci o kupcima, server sala"></label>
        <div class="two"><label class="f">Prijetnja<input id="r-threat" value="${esc(r.threat)}" placeholder="npr. ransomware"></label><label class="f">Ranjivost<input id="r-vuln" value="${esc(r.vulnerability)}" placeholder="npr. nema offline backupa"></label></div>
        <label class="f">Vlasnik rizika<input id="r-owner" value="${esc(r.owner)}" placeholder="npr. direktor IT-a"></label>
        <div class="rbox"><div class="rhead"><b>Procjena prije tretmana</b><span id="r-sc"></span></div>
          <div class="f"><span class="fl">Vjerovatnoća</span>${scale("r-l", LIK, r.likelihood)}</div><div class="f"><span class="fl">Uticaj</span>${scale("r-i", IMP, r.impact)}</div></div>
        <div class="two"><label class="f">Tretman<select id="r-tr">${Object.entries(TREAT).map(([k, v]) => `<option value="${k}" ${k === (r.treatment || "reduce") ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="f">Status<select id="r-st">${Object.entries(RSTAT).map(([k, v]) => `<option value="${k}" ${k === (r.status || "open") ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
        <div class="f"><span class="fl">${CAT().kinds.control ? "Kontrole" : "Zahtjevi"} ${esc(ME.standards[P.standard].split(" (")[0])} <small class="faint" id="r-cn"></small></span><input id="r-cq" type="search" placeholder="Pretraži po oznaci ili nazivu, npr. backup" class="cq">
          <div class="clist" id="r-cl">${ctr.map(i => `<label data-t="${esc((i.code + " " + i.title).toLowerCase())}"><input type="checkbox" value="${i.id}" ${sel.has(i.id) ? "checked" : ""}><span class="code">${esc(i.code)}</span>${esc(i.title)}</label>`).join("")}</div></div>
        <label class="f">Plan tretmana<textarea id="r-plan" placeholder="Šta se radi, do kada, s kojim resursima…">${esc(r.plan)}</textarea></label>
        <div class="rbox"><div class="rhead"><b>Rezidualni rizik nakon tretmana</b><span id="r-rsc"></span></div>
          <div class="f"><span class="fl">Vjerovatnoća</span>${scale("r-rl", LIK, r.res_likelihood)}</div><div class="f"><span class="fl">Uticaj</span>${scale("r-ri", IMP, r.res_impact)}</div></div>
        <label class="f">Datum sljedećeg pregleda<input id="r-rev" type="date" value="${esc(r.review_date)}" style="max-width:200px"></label>
        ${actions(!!r.id)}
      </form>
      ${r.id ? linkedTasks("risk_id", r.id) : ""}`, () => refresh());
    const pick = id => { const b = $(`#${id} button.on`); return b ? +b.dataset.v : null; };
    const upd = () => { $("#r-sc").innerHTML = lvTag(pick("r-l"), pick("r-i")); $("#r-rsc").innerHTML = lvTag(pick("r-rl"), pick("r-ri")); $("#r-cn").textContent = $$("#r-cl input:checked").length + " izabrano"; };
    $$(".sc").forEach(g => $$("button", g).forEach(b => b.addEventListener("click", () => { const on = b.classList.contains("on"); $$("button", g).forEach(x => x.classList.remove("on")); if (!on) b.classList.add("on"); upd(); })));
    $("#r-cl").addEventListener("change", upd);
    $("#r-cq").addEventListener("input", e => { const q = e.target.value.toLowerCase(); $$("#r-cl label").forEach(l => l.hidden = q && !l.dataset.t.includes(q)); });
    upd();
    $("#rf").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("r-asset").trim()) return toast("Upišite imovinu ili proces.");
      const b = { asset: val("r-asset"), threat: val("r-threat"), vulnerability: val("r-vuln"), owner: val("r-owner"), likelihood: pick("r-l"), impact: pick("r-i"), treatment: val("r-tr"), status: val("r-st"),
        controls: $$("#r-cl input:checked").map(x => x.value).join(","), plan: val("r-plan"), res_likelihood: pick("r-rl"), res_impact: pick("r-ri"), review_date: val("r-rev") };
      await api(`/projects/${P.id}/risks${r.id ? "/" + r.id : ""}`, { method: r.id ? "PUT" : "POST", body: b });
      toast("Rizik sačuvan"); closeDrawer();
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati rizik " + R(r.ref) + "?")) return; await api(`/projects/${P.id}/risks/${r.id}`, { method: "DELETE" }); toast("Rizik obrisan"); closeDrawer(); });
    if (r.id) bindLinked("risk_id", r.id, () => riskDrawer(RISKS.find(x => x.id === r.id)));
  }

  /* ---------- tasks tab ---------- */
  function tabTasks() {
    const code = CODE(), rref = Object.fromEntries(RISKS.map(r => [r.id, R(r.ref)])), fref = Object.fromEntries(FINDS.map(f => [f.id, N(f.ref)]));
    const link = t => t.item_id ? code[t.item_id] : t.risk_id ? rref[t.risk_id] || "Rizik" : t.finding_id ? fref[t.finding_id] || "Nalaz" : "";
    const opts = ITEMS.map(i => `<option value="${i.id}">${esc(i.code)} ${esc(i.title)}</option>`).join("");
    $("#tab").innerHTML = `<form class="card form" id="tf" style="margin-bottom:14px"><h3>Nova mjera</h3><div class="inline" style="flex-wrap:wrap"><input id="t-title" placeholder="Opis mjere" style="flex:2 1 260px">
      <input id="t-owner" placeholder="Odgovorni" style="flex:1 1 140px"><input id="t-due" type="date" style="flex:0 0 150px"><select id="t-item" class="isel"><option value="">Bez veze sa zahtjevom</option>${opts}</select><button class="btn primary" type="submit">Dodaj</button></div></form>
      <div class="tools"><select id="tfs"><option value="open">Otvorene</option><option value="late">Kasne</option><option value="all">Sve</option><option value="done">Završene</option></select><span class="sp"></span><a class="btn" href="/api/projects/${P.id}/report/tasks.docx">${ICON.word} Plan mjera (Word)</a><a class="btn" href="/api/projects/${P.id}/export/tasks.csv">${ICON.csv} CSV</a></div><div id="ttbl"></div>`;
    const draw = () => {
      const f = $("#tfs").value;
      const rows = TASKS.filter(t => f === "all" || (f === "done" ? t.status === "done" : t.status !== "done" && (f !== "late" || (t.due && daysTo(t.due) < 0))));
      $("#ttbl").innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Mjera</th><th>Veza</th><th class="hide-m">Odgovorni</th><th>Rok</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(t => `<tr data-task="${t.id}" class="row ${t.status === "done" ? "na" : ""}"><td><b>${esc(t.title)}</b></td><td class="code">${esc(link(t))}</td><td class="hide-m">${esc(t.owner)}</td>
        <td>${t.status !== "done" ? dueTag(t.due) : fmtDate(t.due)}</td>
        <td><select class="stsel" data-tstat>${Object.entries(TSTAT).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select></td><td><button class="btn sm ghost danger" data-tdel title="Obriši" type="button">${ICON.x}</button></td></tr>`).join("")}
      </tbody></table>` : '<div class="card empty">Nema mjera za ovaj filter.</div>';
      bindLists(refresh);
      $$("#ttbl tr.row").forEach(tr => tr.addEventListener("click", e => { if (e.target.closest("select,button")) return; taskDrawer(TASKS.find(t => t.id === tr.dataset.task)); }));
    };
    $("#tfs").addEventListener("change", draw);
    $("#tf").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("t-title").trim()) return;
      await api(`/projects/${P.id}/tasks`, { method: "POST", body: { title: val("t-title"), owner: val("t-owner"), due: val("t-due"), item_id: val("t-item") || null } });
      toast("Mjera dodana"); refresh();
    });
    draw();
  }
  function taskDrawer(t) {
    openDrawer(`${dhead("Uredi mjeru", "Plan mjera")}<form class="form" id="tdf"><label class="f">Opis mjere<textarea id="td-t" style="min-height:60px">${esc(t.title)}</textarea></label>
      <div class="two"><label class="f">Odgovorni<input id="td-o" value="${esc(t.owner)}"></label><label class="f">Rok<input id="td-d" type="date" value="${esc(t.due)}"></label></div>
      <div class="two"><label class="f">Status<select id="td-s">${Object.entries(TSTAT).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f">Veza sa zahtjevom<select id="td-i"><option value="">Bez veze</option>${ITEMS.map(i => `<option value="${i.id}" ${i.id === t.item_id ? "selected" : ""}>${esc(i.code)} ${esc(i.title)}</option>`).join("")}</select></label></div>
      ${actions(true)}</form>`, () => refresh());
    $("#tdf").addEventListener("submit", async e => {
      e.preventDefault();
      await api("/tasks/" + t.id, { method: "PUT", body: { title: val("td-t"), owner: val("td-o"), due: val("td-d"), status: val("td-s"), item_id: val("td-i") || null } });
      toast("Sačuvano"); closeDrawer();
    });
    $("#del").addEventListener("click", async () => { if (!confirm("Obrisati mjeru?")) return; await api("/tasks/" + t.id, { method: "DELETE" }); closeDrawer(); });
  }

  /* ---------- evidence tab ---------- */
  function tabEvidence() {
    const code = CODE();
    $("#tab").innerHTML = `<label class="drop" id="e-drop" style="display:block;margin-bottom:14px">Prevucite dokumente ovdje ili kliknite za upload (do 25 MB po fajlu). Dokaz povežite sa zahtjevom u detaljima zahtjeva.<input type="file" id="e-file" hidden multiple></label>
      ${EVID.length ? `<table class="tbl"><thead><tr><th>Dokument</th><th>Veza</th><th class="hide-m">Veličina</th><th class="hide-m">Dodao</th><th>Datum</th><th></th></tr></thead><tbody>
      ${EVID.map(e => `<tr data-ev="${e.id}"><td><b>${esc(e.name)}</b></td><td class="code">${esc(code[e.item_id] || "–")}</td><td class="hide-m">${fmtSize(e.size)}</td><td class="hide-m">${esc(e.uploaded_by)}</td><td>${fmtDate(e.uploaded_at)}</td>
        <td style="white-space:nowrap"><a class="btn sm" href="/api/evidence/${e.id}/download">Preuzmi</a> <button class="btn sm ghost danger" data-edel title="Obriši" type="button">${ICON.x}</button></td></tr>`).join("")}
      </tbody></table>` : '<div class="card empty">Još nema dokaza.</div>'}`;
    bindUpload($("#e-drop"), $("#e-file"), null, refresh);
    bindLists(refresh);
  }

  /* ---------- audits and findings ---------- */
  let FF = "open";
  function tabAudits() {
    const code = CODE(), atitle = Object.fromEntries(AUDITS.map(a => [a.id, a.title]));
    const byKind = k => FINDS.filter(f => f.kind === k && f.status !== "closed").length;
    $("#tab").innerHTML = `<div class="head sm"><h2>Auditi</h2><button class="btn" id="na">+ Novi audit</button></div>
      ${AUDITS.length ? `<div class="grid agrid">${AUDITS.map(a => `<div class="card acard" data-a="${a.id}"><div class="ahead"><span class="tag ${a.status === "done" ? "teal" : "blue"}">${a.status === "done" ? "Završen" : "Planiran"}</span><small class="faint">${AKIND[a.kind]}</small></div>
        <h3>${esc(a.title)}</h3><p class="muted small">${ICON.cal} ${a.date ? fmtDate(a.date) : "Datum nije određen"}${a.auditor ? " · " + esc(a.auditor) : ""}</p>
        <div class="afoot"><span class="small">${a.findings} nalaza${a.open ? `, <b>${a.open} otvoreno</b>` : ""}</span><a class="btn sm" href="/api/projects/${P.id}/report/audit.docx?audit=${a.id}">${ICON.word} Izvještaj</a></div></div>`).join("")}</div>`
        : `<div class="card empty small"><p>Još nema audita. Planirajte interni audit prije certifikacije (zahtjev 9.2).</p></div>`}
      <div class="head sm" style="margin-top:24px"><h2>Nalazi</h2><div class="inline"><select id="ffs" class="tsel"><option value="open">Otvoreni</option><option value="all">Svi</option><option value="closed">Zatvoreni</option></select><button class="btn primary" id="nf">+ Novi nalaz</button></div></div>
      <div class="fsum">${Object.keys(FKIND).map(k => `<div class="card kpi"><b>${byKind(k)}</b><span>${fkTag(k)} otvoreno</span></div>`).join("")}</div>
      <div id="ftbl"></div>`;
    $("#ffs").value = FF;
    const draw = () => {
      const rows = FINDS.filter(f => FF === "all" || (FF === "closed" ? f.status === "closed" : f.status !== "closed"));
      $("#ftbl").innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Oznaka</th><th>Nalaz</th><th>Vrsta</th><th class="hide-m">Zahtjev</th><th class="hide-m">Audit</th><th>Rok</th><th>Status</th></tr></thead><tbody>
        ${rows.map(f => `<tr class="row ${f.status === "closed" ? "na" : ""}" data-id="${f.id}"><td class="code">${N(f.ref)}</td><td class="ttl"><b>${esc(f.title)}</b><small>${esc(f.owner || "")}</small></td><td>${fkTag(f.kind)}</td>
          <td class="hide-m code">${esc(code[f.item_id] || "–")}</td><td class="hide-m small">${esc(atitle[f.audit_id] || "–")}</td><td>${f.status !== "closed" ? dueTag(f.due) : fmtDate(f.closed_at)}</td>
          <td><span class="fs ${f.status}">${FSTAT[f.status]}</span></td></tr>`).join("")}</tbody></table>` : `<div class="card empty small">Nema nalaza za ovaj filter.</div>`;
      $$("#ftbl tr.row").forEach(tr => tr.addEventListener("click", () => findingDrawer(FINDS.find(f => f.id === tr.dataset.id))));
    };
    $("#ffs").addEventListener("change", e => { FF = e.target.value; draw(); });
    $("#na").addEventListener("click", () => auditDrawer({}));
    $("#nf").addEventListener("click", () => findingDrawer({}));
    $$(".acard").forEach(c => c.addEventListener("click", e => { if (e.target.closest("a")) return; auditDrawer(AUDITS.find(a => a.id === c.dataset.a)); }));
    draw();
  }
  function auditDrawer(a) {
    openDrawer(`${dhead(a.id ? esc(a.title) : "Novi audit", "Audit")}
      <form class="form" id="af"><label class="f">Naziv<input id="a-t" value="${esc(a.title || (a.id ? "" : "Interni audit ISMS " + new Date().getFullYear()))}" required></label>
      <div class="two"><label class="f">Vrsta<select id="a-k">${Object.entries(AKIND).map(([k, v]) => `<option value="${k}" ${k === (a.kind || "internal") ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f">Status<select id="a-s"><option value="planned" ${a.status !== "done" ? "selected" : ""}>Planiran</option><option value="done" ${a.status === "done" ? "selected" : ""}>Završen</option></select></label></div>
      <div class="two"><label class="f">Datum<input id="a-d" type="date" value="${esc(a.date)}"></label><label class="f">Auditor<input id="a-a" value="${esc(a.auditor)}"></label></div>
      <label class="f">Obim audita<textarea id="a-sc" placeholder="Procesi, lokacije, zahtjevi i kontrole koje se provjeravaju">${esc(a.scope)}</textarea></label>
      <label class="f">Sažetak i zaključak<textarea id="a-su" style="min-height:120px" placeholder="Opšti utisak, jake strane, glavni rizici, preporuka za certifikaciju">${esc(a.summary)}</textarea></label>
      ${actions(!!a.id)}</form>
      ${a.id ? `<div class="sec"><h3>${ICON.flag} Nalazi ovog audita</h3><div class="list">${FINDS.filter(f => f.audit_id === a.id).map(f => `<div class="li"><span class="grow"><b>${N(f.ref)} ${esc(f.title)}</b><small>${FSTAT[f.status]}</small></span>${fkTag(f.kind)}</div>`).join("") || '<p class="muted small">Nema nalaza.</p>'}</div>
        <div class="inline" style="margin-top:10px"><button class="btn sm" type="button" id="a-nf">+ Dodaj nalaz</button><a class="btn sm" href="/api/projects/${P.id}/report/audit.docx?audit=${a.id}">${ICON.word} Izvještaj o auditu</a></div></div>` : ""}`, () => refresh());
    $("#af").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("a-t").trim()) return;
      await api(`/projects/${P.id}/audits${a.id ? "/" + a.id : ""}`, { method: a.id ? "PUT" : "POST", body: { title: val("a-t"), kind: val("a-k"), status: val("a-s"), date: val("a-d"), auditor: val("a-a"), scope: val("a-sc"), summary: val("a-su") } });
      toast("Audit sačuvan"); closeDrawer();
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati audit? Nalazi ostaju, bez veze s auditom.")) return; await api(`/projects/${P.id}/audits/${a.id}`, { method: "DELETE" }); closeDrawer(); });
    $("#a-nf") && $("#a-nf").addEventListener("click", () => { const cb = drawer._onClose; drawer._onClose = null; findingDrawer({ audit_id: a.id }); drawer._onClose = cb; });
  }
  function findingDrawer(f) {
    openDrawer(`${dhead(f.id ? esc(f.title) : "Novi nalaz", f.id ? N(f.ref) + " · " + FKIND[f.kind] : "Nalaz audita")}
      <form class="form" id="ff">
        <div class="f"><span class="fl">Vrsta nalaza</span><div class="seg fk-seg" id="f-k">${Object.entries(FKIND).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === (f.kind || "minor") ? "on" : ""}"><span class="fk ${k}">${FKIND_S[k]}</span></button>`).join("")}</div></div>
        <label class="f">Nalaz (kratko)<input id="f-t" value="${esc(f.title)}" required placeholder="npr. Backup se ne testira"></label>
        <div class="two"><label class="f">Audit<select id="f-a"><option value="">Bez audita</option>${AUDITS.map(a => `<option value="${a.id}" ${a.id === f.audit_id ? "selected" : ""}>${esc(a.title)}</option>`).join("")}</select></label>
        <label class="f">Zahtjev ili kontrola<select id="f-i"><option value="">–</option>${ITEMS.map(i => `<option value="${i.id}" ${i.id === f.item_id ? "selected" : ""}>${esc(i.code)} ${esc(i.title)}</option>`).join("")}</select></label></div>
        <label class="f">Opis i objektivni dokaz<textarea id="f-d" placeholder="Šta je utvrđeno, gdje i na osnovu kojeg dokaza">${esc(f.description)}</textarea></label>
        <label class="f">Uzrok<textarea id="f-c" style="min-height:60px" placeholder="Analiza uzroka, npr. 5 zašto">${esc(f.cause)}</textarea></label>
        <label class="f">Korekcija i korektivna mjera<textarea id="f-x" style="min-height:60px">${esc(f.correction)}</textarea></label>
        <div class="two"><label class="f">Odgovorni<input id="f-o" value="${esc(f.owner)}"></label><label class="f">Rok<input id="f-du" type="date" value="${esc(f.due)}"></label></div>
        <label class="f">Status<select id="f-s">${Object.entries(FSTAT).map(([k, v]) => `<option value="${k}" ${k === (f.status || "open") ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        ${actions(!!f.id)}
      </form>${f.id ? linkedTasks("finding_id", f.id) : ""}`, () => refresh());
    $$("#f-k button").forEach(b => b.addEventListener("click", () => $$("#f-k button").forEach(x => x.classList.toggle("on", x === b))));
    $("#ff").addEventListener("submit", async e => {
      e.preventDefault(); if (!val("f-t").trim()) return toast("Upišite nalaz.");
      const b = { kind: $("#f-k button.on").dataset.v, title: val("f-t"), audit_id: val("f-a") || null, item_id: val("f-i") || null, description: val("f-d"), cause: val("f-c"), correction: val("f-x"), owner: val("f-o"), due: val("f-du"), status: val("f-s") };
      await api(`/projects/${P.id}/findings${f.id ? "/" + f.id : ""}`, { method: f.id ? "PUT" : "POST", body: b });
      toast("Nalaz sačuvan"); closeDrawer();
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati nalaz " + N(f.ref) + "?")) return; await api(`/projects/${P.id}/findings/${f.id}`, { method: "DELETE" }); closeDrawer(); });
    if (f.id) bindLinked("finding_id", f.id, () => findingDrawer(FINDS.find(x => x.id === f.id)));
  }

  /* ---------- reports ---------- */
  function tabReports() {
    const base = `/api/projects/${P.id}`;
    const card = (t, d, word, csv, extra = "") => `<div class="card rep"><div class="ric">${ICON.word}</div><div><h3>${t}</h3><p class="muted small">${d}</p>
      <div class="inline" style="margin-top:12px;flex-wrap:wrap">${word ? `<a class="btn primary sm" href="${base}/report/${word}">${ICON.word} Word</a>` : ""}${csv ? `<a class="btn sm" href="${base}/export/${csv}">${ICON.csv} Excel (CSV)</a>` : ""}${extra}</div></div></div>`;
    $("#tab").innerHTML = `<p class="muted" style="margin-bottom:14px">Izvještaji se generišu iz trenutnog stanja projekta, s naslovnom stranom, brojevima stranica i oznakom povjerljivosti. Svako preuzimanje se bilježi u aktivnosti.</p>
      <div class="grid repgrid">
      ${card("Izvještaj o gap analizi", `${esc(ME.standards[P.standard])}: sažetak spremnosti, rezultati po oblastima, stavke koje traže pažnju, detaljni pregled i plan mjera. Trenutno ${P.summary.readiness}% spremnosti.`, "gap.docx", "gap.csv")}
      ${CAT().soa ? card("Izjava o primjenjivosti (SoA)", `Svih 93 kontrole Aneksa A s obrazloženjem i statusom, po temama, s poljima za odobrenje.`, "soa.docx", "soa.csv") : ""}
      ${card("Registar rizika i plan tretmana", `Metodologija, mapa rizika, registar s inherentnim i rezidualnim nivoom, plan tretmana. ${RISKS.length} rizika u registru.`, "risks.docx", "")}
      ${card("Plan mjera", `Otvorene i završene mjere s odgovornima i rokovima. ${TASKS.filter(t => t.status !== "done").length} otvorenih.`, "tasks.docx", "tasks.csv")}
      ${card("Izvještaj o auditu", AUDITS.length ? "Sažetak, nalazi po vrsti, detalji svakog nalaza s uzrokom i korektivnom mjerom, potpisi." : "Prvo dodajte audit u kartici Audit i nalazi.", "", "",
        AUDITS.map(a => `<a class="btn sm" href="${base}/report/audit.docx?audit=${a.id}">${ICON.word} ${esc(a.title)}</a>`).join(""))}
      </div>`;
  }

  /* ---------- activity tab ---------- */
  async function tabAudit() {
    const rows = await api(`/projects/${P.id}/audit`);
    const A = { create: "kreirao", update: "izmijenio", assess: "ocijenio", upload: "dodao dokaz", download: "preuzeo dokaz", delete: "obrisao", export: "izvezao" };
    $("#tab").innerHTML = `<p class="muted" style="margin-bottom:12px">Zapis svih promjena i preuzimanja na projektu (zadnjih 300).</p><div class="card"><div class="feed big">${rows.map(r => {
      let d = {}; try { d = JSON.parse(r.detail || "{}"); } catch (x) {}
      const what = d.name || d.title || (r.entity === "item" ? r.entity_id + (d.status ? " → " + d.status : "") + (d.applicable === 0 ? " (neprimjenjivo)" : "") : "") || d.file || "";
      return `<div><i></i><p><b>${esc(r.user)}</b> ${esc(A[r.action] || r.action)} ${esc(what)}<small>${fmtDT(r.at)} · ${esc(r.entity)}</small></p></div>`;
    }).join("") || '<p class="muted">Nema zapisa.</p>'}</div></div>`;
  }

  route();
})();

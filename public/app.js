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
    home: svg('<path d="M2.5 7.5L8 3l5.5 4.5V13.5h-4v-3.5h-3v3.5h-4z"/>'),
    users: svg('<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13.5c.5-2.5 2.3-3.8 4.5-3.8s4 1.3 4.5 3.8"/><path d="M10.5 3.2a2.4 2.4 0 0 1 0 4.6M12 9.9c1.4.5 2.2 1.7 2.5 3.6"/>'),
    chev: svg('<path d="M6 4l4 4-4 4"/>', 12),
    xls: svg('<rect x="2" y="1.5" width="12" height="13" rx="2"/><path d="M5 5l6 6M11 5l-6 6"/>'),
    lock: svg('<rect x="3" y="7" width="10" height="7.5" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>'),
    chart: svg('<path d="M2 14h12M4 11V8M7 11V4M10 11V6.5M13 11V9"/>'),
    org: svg('<rect x="2.5" y="2" width="7" height="12" rx="1.5"/><path d="M9.5 6h4v8h-4M5 5h2M5 8h2M5 11h2"/>'),
    shield: svg('<path d="M8 1.5l5.5 2v4.2c0 3.3-2.3 5.8-5.5 6.8-3.2-1-5.5-3.5-5.5-6.8V3.5z"/><path d="M5.6 8l1.7 1.7L10.6 6.4"/>'),
    dl: svg('<path d="M8 2v8M4.8 7L8 10.2 11.2 7M2.5 13.5h11"/>'),
    invoice: svg('<path d="M3.5 1.5h9v13l-2-1.2-2.5 1.2-2.5-1.2-2 1.2z"/><path d="M6 5h4M6 8h4M6 11h2"/>'),
    gear: svg('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>'),
    check: svg('<path d="M3 8.5l3 3 7-7"/>'),
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
    if (!r.ok) {
      let e = {}; try { e = await r.json(); } catch (x) {}
      if (r.status === 401 && e.error === "mfa") { if (ME) ME.mfa.ok = false; mfaView(); throw new Error("mfa"); }
      if (r.status === 403 && !e.error) { toast("Sesija je istekla. Osvježite stranicu."); throw new Error("403"); }
      if (!opt.quiet) toast(ERR[e.error] || "Greška: " + (e.error || r.status));
      throw Object.assign(new Error(e.error || r.status), { data: e });
    }
    return r.json();
  }
  const ERR = { download_not_approved: "Preuzimanje još nije odobreno. Zatražite odobrenje od administratora.", read_only: "Imate pristup samo za pregled.", admin_only: "Samo administrator.", other_client: "Korisnik klijenta može biti dodan samo na projekte svoje firme.", code: "Kod nije ispravan.", locked: "Previše pogrešnih pokušaja. Pokušajte ponovo za 15 minuta.", user_not_active: "Korisnik nije aktivan.", invalid: "Provjerite označena polja.",
    issuer_incomplete: "Prvo popunite podatke SCE Assurance u Postavkama.", client_incomplete: "Klijentu nedostaju podaci za fakturu.", no_items: "Faktura nema nijednu stavku.",
    zero_total: "Iznos fakture mora biti veći od nule.", not_pdf: "Datoteka nije PDF.", no_signature: "U PDF-u nije pronađen digitalni potpis. Potpišite PDF certifikatom pa ga učitajte.",
    too_large: "Datoteka je prevelika.", vies_unavailable: "VIES servis EU trenutno nije dostupan.", vies_input: "Za VIES provjeru unesite EU PDV broj.", not_draft: "Izdana faktura se ne može mijenjati.", numbering: "Broj fakture nije dodijeljen, pokušajte ponovo.", pdf_failed: "PDF nije napravljen. Faktura je ostala nacrt." };
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
    $("#dbody").innerHTML = html; drawer.hidden = false; drawer._onClose = onClose; $(".dpanel").classList.remove("wide");
    if (document.body.classList.contains("ro")) $$("#dbody input, #dbody textarea, #dbody select").forEach(x => { if (x.type !== "search") x.disabled = true; });
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

  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="/api/"]');
    if (a && document.body.classList.contains("nodl")) { e.preventDefault(); toast(ERR.download_not_approved); }
  }, true);

  /* ---------- search ---------- */
  const TYPES = { client: "Klijent", project: "Projekat", task: "Mjera", risk: "Rizik", finding: "Nalaz", evidence: "Dokaz", record: "Registar" };
  const searchLink = r => r.t === "client" ? `#/c/${r.id}` : r.t === "project" ? `#/p/${r.id}` : r.t === "record" ? `#/p/${r.project_id}/registri/${r.type}` : `#/p/${r.project_id}/${{ task: "mjere", risk: "rizici", finding: "audit", evidence: "dokazi" }[r.t]}`;
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

  /* ---------- router and navigation ---------- */
  let NAV = null, CUR = { client: null, project: null, sec: null };
  const KIND_T = { admin: "Administrator", consultant: "Konsultant", client: "Klijent", pending: "Čeka odobrenje", disabled: "Isključen" };
  const SECS = [
    [null, [["pregled", "Pregled"], ["sazetak", "Sažetak za upravu"]]],
    ["Procjena", [["zahtjevi", null], ["kontrole", null]]],
    ["Upravljanje", [["rizici", "Rizici"], ["mjere", "Mjere"], ["audit", "Audit i nalazi"], ["preispitivanje", "Preispitivanje uprave"], ["poboljsanja", "Poboljšanja"]]],
    ["Dokumentacija", [["registri", "Registri"], ["dokazi", "Dokazi"], ["izvjestaji", "Izvještaji"]]],
    ["Projekat", [["pristup", "Pristup"], ["aktivnost", "Aktivnost"]]]];
  const secLabel = (k, std) => { const K = ME.catalogs[std].kinds; return k === "zahtjevi" ? K.clause && K.clause.tab : k === "kontrole" ? K.control && K.control.tab : null; };
  const SC = k => `var(--std-${k || "iso27001"})`;
  const stdTag = k => `<span class="tag std" style="--sc:${SC(k)}">${esc(ME.standards[k] || k)}</span>`;
  const staff = () => ["admin", "consultant"].includes(ME.user.kind);
  async function loadNav(force) {
    if (!NAV || force) {
      const admin = ME.user.kind === "admin";
      const client = ME.user.kind === "client";
      const [cs, ps, reqs, us, iss, invs] = await Promise.all([api("/clients"), api("/projects"), admin ? api("/download-requests") : [], admin ? api("/users") : [],
        admin ? api("/settings/issuer") : null, client ? api("/invoices").catch(() => []) : []]);
      NAV = { cs, ps, reqs, us, pending: us.filter(u => u.kind === "pending").length, issuerMissing: iss ? iss.missing.length : 0,
        invNew: client ? invs.filter(i => i.status === "shared").length : 0 };
    }
    return NAV;
  }
  function renderNav() {
    const { cs, ps } = NAV, open = CUR.client;
    const hideC = ME.user.kind === "client" ? ["pristup", "aktivnost"] : [];
    const secs = p => SECS.map(([h, list]) => { const items = list.map(([k, t]) => [k, t || secLabel(k, p.standard)]).filter(x => x[1] && !hideC.includes(x[0])); if (!items.length) return "";
      return `${h ? `<span class="sh">${h}</span>` : ""}${items.map(([k, t]) => `<a href="#/p/${p.id}/${k}" class="sn${CUR.sec === k ? " on" : ""}">${esc(t)}</a>`).join("")}`; }).join("");
    const admin = ME.user.kind === "admin", nreq = (NAV.reqs || []).length, npend = (NAV.pending || 0);
    $("#snav").innerHTML = `<a href="#/" class="top1${!CUR.client && !CUR.view ? " on" : ""}">${ICON.home}Pregled</a>
      ${staff() ? `<a href="#/clients" class="top1${CUR.view === "clients" ? " on" : ""}">${ICON.org}Klijenti<small>${cs.length}</small></a>` : ""}
      ${admin ? `<a href="#/users" class="top1${CUR.view === "users" ? " on" : ""}">${ICON.users}Korisnici${nreq + npend ? `<em class="badge">${nreq + npend}</em>` : ""}</a>` : ""}
      ${admin || ME.user.kind === "client" ? `<a href="#/invoices" class="top1${CUR.view === "invoices" ? " on" : ""}">${ICON.invoice}Fakture${NAV.invNew ? `<em class="badge">${NAV.invNew}</em>` : ""}</a>` : ""}
      ${admin ? `<a href="#/settings" class="top1${CUR.view === "settings" ? " on" : ""}">${ICON.gear}Postavke${NAV.issuerMissing ? '<em class="dot" title="Podaci za fakture nisu popunjeni"></em>' : ""}</a>` : ""}
      <a href="#/account" class="top1${CUR.view === "account" ? " on" : ""}">${ICON.shield}Moj nalog${ME.mfa.enabled ? "" : ME.user.kind === "client" ? "" : '<em class="dot" title="MFA nije uključen"></em>'}</a>
      <div class="sgrp"><span>${staff() ? "Projekti po klijentu" : "Moji projekti"}</span></div>
      ${cs.map(c => { const cp = ps.filter(p => p.client_id === c.id), isOpen = open === c.id;
        return `<div class="cl${isOpen ? " open" : ""}"><a href="#/c/${c.id}" class="cn${CUR.view === "client" && open === c.id ? " on" : ""}">${ICON.chev}<span>${esc(c.name)}</span><small>${cp.length}</small></a>
        ${isOpen ? cp.map(p => `<div class="pj${CUR.project === p.id ? " open" : ""}"><a href="#/p/${p.id}" class="pn${CUR.project === p.id && CUR.sec === "pregled" ? " on" : ""}" style="--sc:${SC(p.standard)}"><i style="--p:${p.readiness}"></i><span>${esc(p.name)}</span></a>
          ${CUR.project === p.id ? `<div class="secs">${secs(p)}</div>` : ""}</div>`).join("") : ""}</div>`; }).join("") || '<p class="faint small pad-s">Još nema klijenata.</p>'}`;
    const u = ME.user;
    $("#who").innerHTML = `<a href="#/account"><span class="av">${esc(initials(u.name || u.email))}</span><span><b>${esc(u.name || u.email)}</b><small>${esc(KIND_T[u.kind])}${ME.mfa.enabled ? " · MFA" : ""}</small></span></a>`;
  }
  const initials = s => String(s).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("");
  function setCrumb(parts) { $("#crumb").innerHTML = parts.map(([t, h], i) => h && i < parts.length - 1 ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join('<i>›</i>'); document.title = parts.map(p => p[0]).reverse().join(" · ") + " · Evidenta"; }
  async function route() {
    closeDrawer(); closeSearch(); document.body.classList.remove("navopen"); app.style.removeProperty("--sc");
    const h = location.hash.replace(/^#\/?/, "").split("/");
    try {
      if (!ME) { ME = await api("/me"); }
      if (!["admin", "consultant", "client"].includes(ME.user.kind)) return pendingView();
      if ((ME.mfa.required || ME.mfa.enabled) && !ME.mfa.ok) return mfaView();
      await loadNav();
      CUR = { client: null, project: null, sec: null, view: null };
      document.body.classList.remove("ro", "nodl");
      document.body.classList.toggle("isclient", ME.user.kind === "client");
      if (h[0] === "p" && h[1]) { const p = NAV.ps.find(x => x.id === h[1]); CUR = { client: p && p.client_id, project: h[1], sec: h[2] || "pregled" }; }
      else if (h[0] === "c" && h[1]) CUR = { client: h[1], view: "client" };
      else if (h[0]) CUR.view = h[0];
      renderNav();
      app.classList.remove("fade"); void app.offsetWidth; app.classList.add("fade");
      window.scrollTo(0, 0);
      if (h[0] === "clients") return clientsView();
      if (h[0] === "projects") return projectsView();
      if (h[0] === "users") return usersView(h[1]);
      if (h[0] === "account") return accountView();
      if (h[0] === "invoices") return h[1] ? invoicesView(h[1]) : invoicesView();
      if (h[0] === "settings") return settingsView();
      if (h[0] === "c" && h[1]) return clientView(h[1]);
      if (h[0] === "p" && h[1]) return projectView(h[1], h[2] || "pregled", h[3]);
      return homeView();
    } catch (e) { if (!["403", "mfa"].includes(e.message)) app.innerHTML = `<div class="empty"><h2>Nešto nije u redu</h2><p>${esc(e.message)}</p></div>`; }
  }
  window.addEventListener("hashchange", route);
  $("#burger").addEventListener("click", () => document.body.classList.toggle("navopen"));
  $("#sback").addEventListener("click", () => document.body.classList.remove("navopen"));
  function pendingView() {
    $("#snav").innerHTML = ""; $("#who").innerHTML = `<b>${esc(ME.email)}</b><small>${KIND_T[ME.user.kind]}</small>`; setCrumb([["Evidenta"]]);
    app.innerHTML = `<div class="card empty" style="max-width:560px;margin:40px auto"><h2>${ME.user.kind === "disabled" ? "Pristup je isključen" : "Čekate odobrenje"}</h2>
      <p>Prijavljeni ste kao <b>${esc(ME.email)}</b>. ${ME.user.kind === "disabled" ? "Obratite se administratoru." : "Administrator SCE Assurance treba odobriti pristup i dodijeliti vam projekte. Nakon toga osvježite stranicu."}</p></div>`;
  }

  /* ---------- MFA ---------- */
  const codeInput = id => `<input id="${id}" class="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" placeholder="000000" required>`;
  async function mfaView() {
    closeDrawer(); $("#snav").innerHTML = ""; setCrumb([["Dvostruka provjera"]]);
    $("#who").innerHTML = `<span><b>${esc(ME.email)}</b><small>${esc(KIND_T[ME.user.kind])}</small></span>`;
    document.body.classList.add("gate");
    const enabled = ME.mfa.enabled;
    app.innerHTML = `<div class="gatebox card"><span class="gic">${ICON.shield}</span><span class="eyebrow">Zaštita naloga</span>
      <h1>${enabled ? "Unesite kod iz aplikacije" : "Uključite dvostruku provjeru"}</h1>
      <p class="muted">${enabled ? "Otvorite aplikaciju za autentifikaciju (npr. Microsoft Authenticator, Google Authenticator ili 1Password) i unesite trenutni šestocifreni kod za Evidentu." : "Za pristup podacima projekta potrebna je dvostruka provjera. Skenirajte QR kod aplikacijom za autentifikaciju, pa unesite kod koji se prikaže."}</p>
      <div id="mfabody">${enabled ? "" : '<p class="muted small">Pripremam…</p>'}</div></div>`;
    if (enabled) return mfaForm("verify", () => { ME.mfa.ok = true; document.body.classList.remove("gate"); route(); });
    await mfaSetup($("#mfabody"), () => { ME.mfa.ok = true; ME.mfa.enabled = true; document.body.classList.remove("gate"); toast("Dvostruka provjera je uključena"); route(); });
  }
  function mfaForm(kind, done, host = $("#mfabody")) {
    host.innerHTML = `<form class="form mfaf" id="mff"><label class="f">Šestocifreni kod${codeInput("mf-c")}</label><button class="btn primary w" type="submit">${kind === "verify" ? "Potvrdi" : "Uključi dvostruku provjeru"}</button><p class="mferr" id="mferr" role="alert"></p></form>`;
    const f = $("#mff", host); setTimeout(() => $("#mf-c", host).focus(), 50);
    f.addEventListener("submit", async e => {
      e.preventDefault(); const btn = $("button", f); btn.disabled = true;
      const r = await fetch("/api/mfa/" + kind, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: $("#mf-c", host).value }) });
      const j = await r.json().catch(() => ({})); btn.disabled = false;
      if (r.ok) return done();
      $("#mferr", host).textContent = j.error === "locked" ? ERR.locked : j.error === "code" ? `Kod nije ispravan${j.left ? ` (još ${j.left} ${j.left === 1 ? "pokušaj" : "pokušaja"})` : ""}.` : "Greška: " + (j.error || r.status);
      $("#mf-c", host).select();
    });
  }
  async function mfaSetup(host, done) {
    const r = await fetch("/api/mfa/setup", { method: "POST" }), j = await r.json().catch(() => ({}));
    if (!r.ok) { host.innerHTML = `<p class="mferr">${esc(ERR[j.error] || "Greška: " + (j.error || r.status))}</p>`; return; }
    let qr = ""; try { const q = qrcode(0, "M"); q.addData(j.uri); q.make(); qr = q.createSvgTag({ cellSize: 5, margin: 3, scalable: true }); } catch (x) {}
    host.innerHTML = `<div class="mfasetup"><ol class="steps"><li>Instalirajte aplikaciju za autentifikaciju na telefon.</li><li>Skenirajte QR kod ili ručno upišite ključ.</li><li>Unesite kod koji aplikacija prikaže.</li></ol>
      <div class="qrwrap"><div class="qr">${qr}</div><div><span class="faint small">Ključ za ručni unos</span><code class="secret">${esc(j.secret.replace(/(.{4})/g, "$1 ").trim())}</code><p class="faint small">Ključ ne dijelite ni s kim. Administrator SCE Assurance ga nikada neće tražiti.</p></div></div>
      <div id="mfaf2"></div></div>`;
    mfaForm("enable", done, $("#mfaf2", host));
  }
  async function accountView() {
    setCrumb([["Moj nalog"]]);
    const u = ME.user, m = ME.mfa;
    app.innerHTML = `<div class="hero sm"><div><span class="eyebrow">Moj nalog</span><h1>${esc(u.name || u.email)}</h1><p>${esc(u.email)} · ${esc(KIND_T[u.kind])}</p></div></div>
      <div class="acc">
        <div class="card"><h3>${ICON.shield} Dvostruka provjera (MFA)</h3>
          <p class="state ${m.enabled ? "ok" : "off"}"><i></i>${m.enabled ? "Uključena" : m.required ? "Obavezna, nije podešena" : "Nije uključena"}</p>
          <p class="muted small">${m.enabled ? "Nakon prijave preko Cloudflare Accessa tražimo i kod iz aplikacije. Potvrda važi 12 sati na ovom uređaju. Ako izgubite telefon, administrator može resetovati MFA." : "Preporučujemo uključivanje: nakon prijave tražimo i šestocifreni kod iz aplikacije za autentifikaciju."}</p>
          <div id="accmfa" class="inline" style="margin-top:12px">${m.enabled ? '<button class="btn" id="mfout">Odjavi potvrdu na ovom uređaju</button>' : '<button class="btn primary" id="mfon">Uključi dvostruku provjeru</button>'}</div></div>
        <div class="card"><h3>${ICON.lock} Šta vidite</h3><p class="muted small">${u.kind === "admin" ? "Kao administrator vidite sve klijente i projekte i upravljate korisnicima." : u.kind === "consultant" ? "Vidite samo projekte na koje vas je administrator dodao." : "Vidite samo projekte svoje firme na koje vas je administrator dodao. Preuzimanje izvještaja i dokaza odobrava administrator."}</p>
          <div class="list plain" style="margin-top:10px">${NAV.ps.map(p => `<a class="li" href="#/p/${p.id}"><span class="grow"><b>${esc(p.name)}</b><small>${esc(p.client_name)}</small></span>${stdTag(p.standard)}</a>`).join("") || '<p class="muted small">Nema projekata.</p>'}</div></div>
      </div>`;
    $("#mfon") && $("#mfon").addEventListener("click", () => {
      openDrawer(`${dhead("Uključi dvostruku provjeru", "MFA")}<div id="dmfa"><p class="muted small">Pripremam…</p></div>`);
      mfaSetup($("#dmfa"), () => { ME.mfa.enabled = ME.mfa.ok = true; closeDrawer(); toast("Dvostruka provjera je uključena"); route(); });
    });
    $("#mfout") && $("#mfout").addEventListener("click", async () => { await api("/mfa/logout", { method: "POST" }); ME.mfa.ok = false; mfaView(); });
  }

  /* ---------- home: dashboard ---------- */
  const pcard = p => `<a class="card pcard" href="#/p/${p.id}" style="--sc:${SC(p.standard)}">${ring(p.readiness)}<div><div class="faint" style="font-size:12.5px;font-weight:650">${esc(p.client_name)}</div><h3>${esc(p.name)}</h3>
      <div class="meta">${stdTag(p.standard)}<span class="tag">${esc(PHASES[p.phase] || p.phase)}</span>${deadlineTag(p.deadline)}</div>
      <div class="meta"><span>${p.assessed}/${p.applicable} ocijenjeno</span><span>${p.open_tasks} mjera${p.late_tasks ? ` <b class="red">(${p.late_tasks} kasni)</b>` : ""}</span>${p.open_findings ? `<span>${p.open_findings} nalaza</span>` : ""}${p.high_risks ? `<span>${p.high_risks} visokih rizika</span>` : ""}</div></div></a>`;
  async function homeView() {
    setCrumb([["Pregled"]]);
    const d = await api("/dashboard"), ps = d.projects;
    const avg = ps.length ? Math.round(ps.reduce((a, p) => a + p.readiness, 0) / ps.length) : 0;
    const late = d.tasks.filter(t => daysTo(t.due) < 0).length;
    const soon = ps.filter(p => p.deadline && daysTo(p.deadline) >= 0 && daysTo(p.deadline) <= 60).length;
    const hour = new Date().getHours(), name = (ME.user.name || ME.email.split("@")[0] || "").split(" ")[0].replace(/^\w/, c => c.toUpperCase());
    const A = { create: "kreirao", update: "izmijenio", assess: "ocijenio", upload: "dodao dokaz", download: "preuzeo", delete: "obrisao", export: "izvezao" };
    const tli = t => `<a class="li" href="#/p/${t.project_id}/mjere"><span class="grow"><b>${esc(t.title)}</b><small>${esc(t.client_name)} · ${esc(t.project_name)}${t.owner ? " · " + esc(t.owner) : ""}</small></span>${dueTag(t.due)}</a>`;
    app.innerHTML = `<div class="hero"><div><span class="eyebrow">${ME.user.kind === "client" ? "Klijentski portal" : "Pregled"} · ${fmtDate(new Date().toISOString())}</span><h1>${hour < 11 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobro veče"}, ${esc(name)}.</h1><p>${ME.user.kind === "client" ? "Ovdje pratite napredak svojih projekata: spremnost, mjere, rizike i nalaze." : "Stanje aktivnih projekata, rokovi i otvoreni nalazi na jednom mjestu."}</p></div>${staff() ? '<button class="btn accent" id="np">+ Novi projekat</button>' : ""}</div>
      <div class="kpis k6">
        <div class="card kpi"><b>${ps.length}</b><span>aktivnih projekata</span></div>
        <div class="card kpi"><b>${avg}%</b><span>prosječna spremnost</span></div>
        <div class="card kpi ${late ? "warn" : ""}"><b>${late}</b><span>mjera kasni</span></div>
        <div class="card kpi"><b>${d.tasks.length - late}</b><span>mjera dospijeva za 14 dana</span></div>
        <div class="card kpi ${d.findings.some(f => f.kind === "major") ? "warn" : ""}"><b>${d.findings.length}</b><span>otvorenih nalaza</span></div>
        <div class="card kpi"><b>${soon}</b><span>audita u 60 dana</span></div></div>
      <div class="dash">
        <div class="dmain">
          <div class="head sm"><h2>Aktivni projekti</h2></div>
          ${ps.length ? `<div class="grid pgrid">${ps.map(pcard).join("")}</div>` : `<div class="card empty"><h2>Još nema projekata</h2><p>${staff() ? "Dodajte klijenta i prvi projekat." : "Još vam nije dodijeljen nijedan projekat."}</p></div>`}
          <div class="head sm" style="margin-top:22px"><h2>Rokovi u naredne dvije sedmice</h2></div>
          <div class="card flush">${d.tasks.length ? `<div class="list plain">${d.tasks.map(tli).join("")}</div>` : '<p class="muted pad-s">Nema mjera s rokom u naredne dvije sedmice.</p>'}</div>
        </div>
        <aside class="dside">
          <div class="card"><h3>${ICON.task} Moje mjere</h3>${d.mine.length ? `<div class="list plain">${d.mine.slice(0, 8).map(tli).join("")}</div>` : '<p class="muted small">Nema mjera s vašim imenom i rokom u dvije sedmice. Mjere se dodjeljuju upisom imena ili e-maila u polje Odgovorni.</p>'}</div>
          <div class="card"><h3>${ICON.flag} Otvoreni nalazi</h3>${d.findings.length ? `<div class="list plain">${d.findings.slice(0, 8).map(f => `<a class="li" href="#/p/${f.project_id}/audit"><span class="grow"><b>${N(f.ref)} ${esc(f.title)}</b><small>${esc(f.client_name)}${f.due ? " · rok " + fmtDate(f.due) : ""}</small></span>${fkTag(f.kind)}</a>`).join("")}</div>` : '<p class="muted small">Nema otvorenih nalaza.</p>'}</div>
        </aside>
      </div>`;
    $("#np") && $("#np").addEventListener("click", () => newProject());
  }

  async function projectsView() { location.hash = "#/clients"; }

  async function newProject(clientId) {
    const cs = await api("/clients");
    openDrawer(`${dhead("Novi projekat")}<p class="muted" style="margin-top:-8px">Katalog zahtjeva se automatski učitava prema standardu. Vi dobijate pravo uređivanja, a ostale članove dodaje administrator.</p>
      <form class="form" id="pf">
        <label class="f">Klijent<select id="p-client" required><option value="">Izaberite…</option>${cs.map(c => `<option value="${c.id}" ${c.id === clientId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__new">+ Novi klijent…</option></select></label>
        <div id="newc" hidden class="form card" style="padding:12px"><label class="f">Naziv klijenta<input id="c-name"></label><div class="two"><label class="f">Država<select id="c-country">${countryOpts("BA")}</select></label><label class="f">Djelatnost<input id="c-industry"></label></div><p class="faint small">Pravne podatke za fakturu (ID, PDV, adresa) dopunite kasnije na stranici klijenta.</p></div>
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
        client = (await api("/clients", { method: "POST", body: { name: val("c-name"), country_code: val("c-country"), industry: val("c-industry") } })).id;
      }
      const r = await api("/projects", { method: "POST", body: { client_id: client, name: val("p-name"), standard: val("p-std"), deadline: val("p-deadline"), requester: val("p-req"), scope: val("p-scope") } });
      NAV = null; closeDrawer(); location.hash = "#/p/" + r.id;
    });
  }

  /* ---------- clients ---------- */
  const mfaTag = u => u.kind === "admin" || u.kind === "consultant" || u.kind === "client" ? (u.mfa_enabled ? '<span class="tag teal">MFA uključen</span>' : u.mfa_required ? '<span class="tag orange">MFA nije podešen</span>' : '<span class="tag">Bez MFA</span>') : "";
  const urow = u => `<div class="li urow" data-e="${esc(u.email)}"><span class="av">${esc(initials(u.name || u.email))}</span><span class="grow"><b>${esc(u.name || u.email)}</b><small>${esc(u.name ? u.email : "")}${u.last_seen ? " · " + ago(u.last_seen) : " · još se nije prijavio"}</small></span>${mfaTag(u)}<span class="tag">${u.projects} ${u.projects === 1 ? "projekat" : "projekata"}</span>${u.dl_requests ? `<span class="tag orange">${ICON.dl} zahtjev</span>` : ""}</div>`;
  async function clientsView() {
    setCrumb([["Klijenti"]]);
    const { cs, ps } = await loadNav(true); renderNav();
    const admin = ME.user.kind === "admin", us = admin ? NAV.us : [];
    const cu = id => us.filter(u => u.kind === "client" && u.client_id === id);
    app.innerHTML = `<div class="hero"><div><span class="eyebrow">Klijenti</span><h1>Klijenti i njihovi projekti</h1><p>${cs.length} ${cs.length === 1 ? "klijent" : "klijenata"} · ${ps.length} projekata${admin ? ` · ${us.filter(u => u.kind === "client").length} korisnika na strani klijenata` : ""}</p></div>
      ${staff() ? '<div class="inline"><button class="btn light" id="nc">+ Novi klijent</button><button class="btn accent" id="np">+ Novi projekat</button></div>' : ""}</div>
      ${cs.length ? cs.map(c => { const cp = ps.filter(p => p.client_id === c.id), cus = cu(c.id), avg = cp.length ? Math.round(cp.reduce((a, p) => a + p.readiness, 0) / cp.length) : 0;
        return `<section class="cbox card"><header><span class="cav">${esc(initials(c.name))}</span><div class="grow"><h2><a href="#/c/${c.id}">${esc(c.name)}</a></h2><small class="muted">${esc([c.country, c.industry].filter(Boolean).join(" · ")) || "&nbsp;"}</small></div>
          <div class="cstats"><span><b>${cp.length}</b>projekata</span><span><b>${avg}%</b>spremnost</span>${admin ? `<span><b>${cus.length}</b>korisnika</span>` : ""}</div></header>
        <div class="cgrid${admin ? "" : " one"}"><div>${cp.length ? `<div class="grid pgrid">${cp.map(pcard).join("")}</div>` : '<p class="muted small">Nema projekata.</p>'}</div>
        ${admin ? `<aside class="cusers"><div class="ch"><h3>${ICON.users} Korisnici klijenta</h3><button class="btn sm" data-addu="${c.id}">+ Dodaj</button></div>
          <div class="list plain">${cus.map(urow).join("") || '<p class="muted small">Još nema korisnika iz ove firme. Dodajte osobu i dodijelite joj projekte u sekciji Pristup.</p>'}</div></aside>` : ""}</div></section>`; }).join("") : `<div class="card empty"><h2>Još nema klijenata</h2></div>`}`;
    $("#nc") && $("#nc").addEventListener("click", () => clientForm());
    $("#np") && $("#np").addEventListener("click", () => newProject());
    $$("[data-addu]").forEach(b => b.addEventListener("click", () => userForm({ kind: "client", client_id: b.dataset.addu }, cs, clientsView)));
    $$(".urow").forEach(r => r.addEventListener("click", () => userForm(us.find(u => u.email === r.dataset.e), cs, clientsView)));
  }
  async function clientView(id) {
    const c = await api("/clients/" + id);
    setCrumb([["Klijenti", "#/clients"], [c.name]]);
    const ps = c.projectList, admin = ME.user.kind === "admin";
    const cus = admin ? (await api("/users")).filter(u => u.kind === "client" && u.client_id === id) : [];
    app.innerHTML = `<div class="hero"><div><span class="eyebrow">Klijent</span><h1>${esc(c.name)}</h1><p>${esc([c.country, c.industry].filter(Boolean).join(" · ")) || "&nbsp;"}</p></div>
      ${staff() ? '<div class="inline"><button class="btn light" id="ce">Uredi klijenta</button><button class="btn accent" id="np">+ Novi projekat</button></div>' : ""}</div>
      <div class="cinfo">
        <div class="card"><h3>Kontakt osoba</h3><p>${esc(c.contact_name || "–")}<br><span class="muted">${esc([c.contact_email, c.contact_phone].filter(Boolean).join(" · "))}</span></p></div>
        <div class="card"><h3>Projekti</h3><p><b>${ps.length}</b> <span class="muted">ukupno, ${ps.filter(p => p.status === "active").length} aktivnih</span></p></div>
        <div class="card"><h3>Prosječna spremnost</h3><p><b>${ps.length ? Math.round(ps.reduce((a, p) => a + p.readiness, 0) / ps.length) : 0}%</b></p></div>
        ${c.notes ? `<div class="card span2"><h3>Napomene</h3><p class="muted">${esc(c.notes)}</p></div>` : ""}</div>
      ${staff() ? `<div style="margin-top:14px">${legalCard(c)}</div>` : ""}
      <div class="head sm" style="margin-top:22px"><h2>Projekti</h2></div>
      ${ps.length ? `<div class="grid pgrid">${ps.map(pcard).join("")}</div>` : '<div class="card empty small">Još nema projekata za ovog klijenta.</div>'}
      ${admin ? `<div class="head sm" style="margin-top:22px"><h2>Fakture</h2><button class="btn sm" id="ninv">+ Nova faktura</button></div><div id="cinv"><p class="muted small">Učitavam…</p></div>` : ""}
      ${admin ? `<div class="head sm" style="margin-top:22px"><h2>Korisnici klijenta</h2><button class="btn sm" id="addu">+ Dodaj korisnika klijenta</button></div>
        <div class="card flush"><div class="list plain">${cus.map(urow).join("") || '<p class="muted small pad-s">Još nema korisnika iz ove firme.</p>'}</div></div>
        <p class="faint small" style="margin-top:8px">Korisnici klijenta vide samo projekte na koje su dodani, uvijek uz dvostruku provjeru. Preuzimanje odobravate po projektu, u sekciji Pristup.</p>` : ""}`;
    $("#ce") && $("#ce").addEventListener("click", () => clientForm(c));
    $("#np") && $("#np").addEventListener("click", () => newProject(c.id));
    const cs = admin ? await api("/clients") : [];
    if (admin) {
      $("#ninv").addEventListener("click", () => invoiceEditor({ client_id: id }));
      api("/invoices").then(list => { const mine = list.filter(i => i.client_id === id); $("#cinv").innerHTML = mine.length ? invTable(mine, false) : '<div class="card empty small">Još nema faktura za ovog klijenta.</div>'; bindInvRows(); });
    }
    $("#addu") && $("#addu").addEventListener("click", () => userForm({ kind: "client", client_id: id }, cs, () => clientView(id)));
    $$(".urow").forEach(r => r.addEventListener("click", () => userForm(cus.find(u => u.email === r.dataset.e), cs, () => clientView(id))));
  }
  /* ---------- client form with legal-entity data and validation ---------- */
  const EVV = window.EVV;
  const countryOpts = sel => EVV.COUNTRIES.map(([k, n]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${esc(n)}</option>`).join("");
  function fld(k, label, o = {}) {
    const f = EVV.FIELDS[k] || {}, req = o.required ?? f.required, inv = o.invoice ?? f.invoice;
    const input = o.textarea ? `<textarea id="cf-${k}" name="${k}" ${req ? "required" : ""} maxlength="${f.max || 200}">${esc(o.value)}</textarea>`
      : `<input id="cf-${k}" name="${k}" value="${esc(o.value)}" type="${o.type || "text"}" ${o.inputmode ? `inputmode="${o.inputmode}"` : ""} ${o.auto ? `autocomplete="${o.auto}"` : ""} ${req ? "required" : ""} maxlength="${f.max || 200}" placeholder="${esc(o.ph || "")}" spellcheck="false">`;
    return `<label class="f vf${o.cls ? " " + o.cls : ""}" data-k="${k}"><span class="fl">${esc(label || f.label)}${req ? '<b class="req" title="Obavezno">*</b>' : ""}${inv ? '<i class="forinv" title="Potrebno za izdavanje fakture">za fakturu</i>' : ""}</span>${input}<small class="hint" id="h-${k}">${esc(o.hint || "")}</small><small class="ferr" id="e-${k}"></small></label>`;
  }
  function clientForm(c = {}, after) {
    const cc = c.country_code || "BA", R = EVV.rules(cc);
    openDrawer(`${dhead(c.id ? "Uredi klijenta" : "Novi klijent", "Klijent")}
      <p class="legend2"><span><b class="req">*</b> obavezno za spremanje</span><span><i class="forinv">za fakturu</i> potrebno prije izdavanja fakture</span></p>
      <form class="form vform" id="cf" novalidate>
        <div class="fsec"><h3>Osnovno</h3>
          <div class="two">${fld("name", "Kratki naziv (u aplikaciji)", { value: c.name, ph: "npr. Primjer" })}<label class="f vf" data-k="country_code"><span class="fl">Država<b class="req">*</b></span><select id="cf-country_code" required>${countryOpts(cc)}</select><small class="hint"></small><small class="ferr" id="e-country_code"></small></label></div>
          ${fld("legal_name", "Puni pravni naziv (kao u sudskom registru)", { value: c.legal_name, ph: "npr. Primjer d.o.o. Sarajevo" })}
          ${fld("industry", null, { value: c.industry, ph: "npr. proizvodnja, IT usluge" })}</div>
        <div class="fsec"><h3>Pravni podaci <span class="vies" id="vies-w" hidden><button class="btn sm" type="button" id="vies">Provjeri PDV broj u VIES (EU)</button></span></h3>
          <div class="two">${fld("id_number", R.idLabel, { value: c.id_number, hint: R.id[1], inputmode: cc === "BA" || cc === "HR" || cc === "RS" ? "numeric" : "text" })}${fld("vat_number", R.vatLabel, { value: c.vat_number, hint: R.vat[1] + ", ako je u sistemu PDV-a" })}</div>
          ${fld("court_reg", "Registracija (sud i broj upisa)", { value: c.court_reg, ph: cc === "BA" ? "npr. Općinski sud u Sarajevu, MBS 65-01-0000-00" : "npr. Handelsgericht Wien, FN 123456 a" })}</div>
        <div class="fsec"><h3>Adresa sjedišta</h3>
          ${fld("address", null, { value: c.address, ph: "npr. Zmaja od Bosne 7", auto: "street-address" })}
          <div class="two">${fld("postal_code", null, { value: c.postal_code, hint: R.zip[1], inputmode: "numeric", auto: "postal-code" })}${fld("city", null, { value: c.city, auto: "address-level2" })}</div></div>
        <div class="fsec"><h3>Kontakt firme</h3>
          <div class="two">${fld("email", null, { value: c.email, type: "email", ph: "info@firma.ba", auto: "email" })}${fld("invoice_email", null, { value: c.invoice_email, type: "email", ph: "racunovodstvo@firma.ba", hint: "Ako je prazno, koristi se e-mail firme." })}</div>
          <div class="two">${fld("phone", null, { value: c.phone, type: "tel", ph: "+387 33 123 456", inputmode: "tel", auto: "tel" })}${fld("website", null, { value: c.website, ph: "www.firma.ba", type: "text", inputmode: "url" })}</div>
          ${fld("iban", "IBAN (za povrat ili kompenzaciju)", { value: c.iban, ph: "BA39 1290 0794 0102 8494", hint: "Provjerava se kontrolni broj." })}</div>
        <div class="fsec"><h3>Kontakt osoba</h3>
          ${fld("contact_name", null, { value: c.contact_name, auto: "name" })}
          <div class="two">${fld("contact_email", null, { value: c.contact_email, type: "email", auto: "email" })}${fld("contact_phone", null, { value: c.contact_phone, type: "tel", ph: "+387 61 123 456", inputmode: "tel" })}</div></div>
        <div class="fsec">${fld("notes", null, { value: c.notes, textarea: true })}</div>
        <div class="completeness" id="compl"></div>
        ${actions(false)}</form>`);
    $(".dpanel").classList.add("wide");
    const form = $("#cf"), touched = new Set();
    const read = () => Object.fromEntries([...Object.keys(EVV.FIELDS)].map(k => [k, ($("#cf-" + k) || {}).value || ""]));
    function render(all, extra = {}) {
      const r = EVV.checkClient(read()), errs = { ...r.errors, ...extra };
      $$(".vf", form).forEach(l => { const k = l.dataset.k, e = (all || touched.has(k)) && errs[k]; l.classList.toggle("bad", !!e); l.classList.toggle("ok", !e && touched.has(k) && !!(($("#cf-" + k) || {}).value)); const el = $("#e-" + k); if (el) el.textContent = e || ""; });
      const need = Object.entries(EVV.FIELDS).filter(([, f]) => f.invoice), done = need.length - r.missingForInvoice.length;
      $("#compl").innerHTML = `<div class="cbar"><i style="width:${Math.round(done / need.length * 100)}%"></i></div><span>${done === need.length ? `${ICON.check} Svi podaci za fakturu su popunjeni.` : `Za fakturu nedostaje: <b>${esc(r.missingForInvoice.join(", "))}</b>`}</span>`;
      return r;
    }
    function relabel() {
      const cc = $("#cf-country_code").value, R = EVV.rules(cc);
      $('[data-k="id_number"] .fl').firstChild.textContent = R.idLabel; $("#h-id_number").textContent = R.id[1];
      $('[data-k="vat_number"] .fl').firstChild.textContent = R.vatLabel; $("#h-vat_number").textContent = R.vat[1] + ", ako je u sistemu PDV-a";
      $("#h-postal_code").textContent = R.zip[1];
      $("#vies-w").hidden = !EVV.EU.includes(cc);
    }
    form.addEventListener("input", e => { const k = e.target.name || (e.target.id || "").replace("cf-", ""); if (touched.has(k)) render(false); });
    form.addEventListener("focusout", e => {
      const k = (e.target.id || "").replace("cf-", ""); if (!k || !EVV.FIELDS[k]) return;
      touched.add(k); const r = render(false);
      if (!r.errors[k] && e.target.value && ["phone", "contact_phone", "iban", "website", "id_number", "vat_number", "email", "invoice_email", "contact_email"].includes(k)) e.target.value = r.value[k];
    });
    $("#cf-country_code").addEventListener("change", () => { relabel(); render(false); });
    relabel(); if (c.id) { Object.keys(EVV.FIELDS).forEach(k => c[k] && touched.add(k)); render(false); } else render(false);
    $("#vies").addEventListener("click", async () => {
      const cc = $("#cf-country_code").value, n = $("#cf-vat_number").value;
      const btn = $("#vies"); btn.disabled = true; btn.textContent = "Provjeravam…";
      try {
        const r = await api(`/vies?cc=${cc}&n=${encodeURIComponent(n)}`);
        if (!r.valid) toast("VIES: PDV broj nije aktivan ili ne postoji.");
        else { if (r.name && !$("#cf-legal_name").value) $("#cf-legal_name").value = r.name; if (r.address && !$("#cf-address").value) $("#cf-address").value = r.address.split("\n")[0]; toast("VIES: PDV broj je važeći" + (r.name ? " · " + r.name : "")); render(false); }
      } catch (e) {} finally { btn.disabled = false; btn.textContent = "Provjeri PDV broj u VIES (EU)"; }
    });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const r = render(true);
      if (Object.keys(r.errors).length) { const f = $(".vf.bad input, .vf.bad select", form); f && f.focus(); return toast("Provjerite označena polja."); }
      try {
        const res = await api(c.id ? "/clients/" + c.id : "/clients", { method: c.id ? "PUT" : "POST", body: r.value, quiet: true });
        toast(r.missingForInvoice.length ? "Sačuvano. Za fakturu još nedostaju neki podaci." : "Sačuvano"); NAV = null; closeDrawer();
        if (after) return after(c.id || res.id);
        location.hash = "#/c/" + (c.id || res.id); if (c.id) route();
      } catch (x) { if (x.data && x.data.fields) { render(true, x.data.fields); toast("Provjerite označena polja."); } else toast(ERR[x.message] || "Greška: " + x.message); }
    });
  }
  const legalCard = c => {
    const chk = EVV.checkClient(c), R = EVV.rules(c.country_code), cn = (EVV.COUNTRIES.find(x => x[0] === c.country_code) || [])[1] || c.country || "";
    const row = (k, v) => v ? `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>` : "";
    return `<div class="card legal"><div class="lh"><h3>${ICON.org} Pravni podaci</h3>${chk.missingForInvoice.length ? `<span class="tag orange">Za fakturu nedostaje ${chk.missingForInvoice.length}</span>` : `<span class="tag teal">${ICON.check} Spremno za fakturu</span>`}</div>
      <dl>${row("Puni naziv", c.legal_name)}${row("Adresa", [c.address, [c.postal_code, c.city].filter(Boolean).join(" "), cn].filter(Boolean).join(", "))}${row(R.idLabel, c.id_number)}${row(R.vatLabel, c.vat_number)}${row("Registracija", c.court_reg)}
      ${row("E-mail", c.email)}${row("E-mail za fakture", c.invoice_email)}${row("Telefon", c.phone)}${row("Web", c.website)}${row("IBAN", c.iban)}</dl>
      ${chk.missingForInvoice.length ? `<p class="small muted" style="margin-top:8px">Nedostaje: ${esc(chk.missingForInvoice.join(", "))}.</p>` : ""}</div>`;
  };

  /* ---------- users and access (admin) ---------- */
  const UTABS = [["tim", "Tim"], ["klijenti", "Korisnici klijenata"], ["cekanje", "Na čekanju"], ["zahtjevi", "Zahtjevi za preuzimanje"]];
  async function usersView(tab) {
    tab = UTABS.some(t => t[0] === tab) ? tab : "tim";
    setCrumb([["Korisnici", "#/users"], [UTABS.find(t => t[0] === tab)[1]]]);
    const [us, cs, reqs] = await Promise.all([api("/users"), api("/clients"), api("/download-requests")]);
    NAV.us = us; NAV.reqs = reqs; NAV.pending = us.filter(u => u.kind === "pending").length; renderNav();
    const groups = { tim: us.filter(u => ["admin", "consultant"].includes(u.kind)), klijenti: us.filter(u => u.kind === "client"), cekanje: us.filter(u => ["pending", "disabled"].includes(u.kind)) };
    const cnt = { ...Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), zahtjevi: reqs.length };
    const table = list => `<table class="tbl"><thead><tr><th>Korisnik</th><th>Uloga</th><th class="hide-m">${tab === "klijenti" ? "Klijent" : "Organizacija"}</th><th>MFA</th><th>Projekti</th><th class="hide-m">Zadnja prijava</th></tr></thead><tbody>
      ${list.map(u => `<tr class="row" data-e="${esc(u.email)}"><td class="ttl"><b>${esc(u.name || u.email)}</b><small>${esc(u.name ? u.email : "")}</small></td><td><span class="role ${u.kind}">${KIND_T[u.kind]}</span></td>
        <td class="hide-m">${esc(u.kind === "client" ? u.client_name : u.org || "")}</td><td>${mfaTag(u)}</td><td>${u.kind === "admin" ? "svi" : u.projects}${u.dl_requests ? ` <span class="tag orange" title="Zahtjev za preuzimanje">${ICON.dl}</span>` : ""}</td><td class="hide-m small">${u.last_seen ? ago(u.last_seen) : "nikad"}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Nema korisnika u ovoj grupi.</td></tr>`}</tbody></table>`;
    const intro = {
      tim: "Administratori i konsultanti SCE Assurance. Konsultant vidi samo projekte na koje je dodan.",
      klijenti: "Osobe iz firmi klijenata. Vide samo projekte svoje firme na koje su dodane, uz obaveznu dvostruku provjeru. Preuzimanje odobrava administrator.",
      cekanje: "Osobe koje su se prijavile preko Cloudflare Accessa, ali im još nije dodijeljena uloga, te isključeni nalozi.",
      zahtjevi: "Korisnici klijenta koji su zatražili pravo preuzimanja izvještaja, registara i dokaza." }[tab];
    app.innerHTML = `<div class="hero"><div><span class="eyebrow">Administracija</span><h1>Korisnici i pristup</h1><p>Cloudflare Access određuje ko se može prijaviti. Ovdje određujete ulogu, dvostruku provjeru i šta svaka osoba vidi.</p></div>
      <div class="inline"><button class="btn light" id="nuc">+ Korisnik klijenta</button><button class="btn accent" id="nu">+ Član tima</button></div></div>
      <nav class="tabs">${UTABS.map(([k, t]) => `<a href="#/users/${k}" class="${k === tab ? "on" : ""}">${t}<small class="${k === "zahtjevi" && cnt[k] || k === "cekanje" && groups.cekanje.some(u => u.kind === "pending") ? "hot" : ""}">${cnt[k]}</small></a>`).join("")}</nav>
      <p class="muted" style="margin-bottom:14px;max-width:52rem">${intro}</p>
      ${tab === "zahtjevi" ? `<div class="card flush">${reqs.length ? `<div class="list plain">${reqs.map(r => `<div class="li"><span class="av">${esc(initials(r.name || r.email))}</span><span class="grow"><b>${esc(r.name || r.email)}</b><small>${esc(r.client_name)} · <a href="#/p/${r.project_id}/pristup">${esc(r.project_name)}</a> · ${ago(r.download_requested_at)}</small></span>
          <button class="btn sm primary" data-ok="${esc(r.project_id)}|${esc(r.email)}|${esc(r.access)}">Odobri preuzimanje</button><button class="btn sm ghost" data-no="${esc(r.project_id)}|${esc(r.email)}|${esc(r.access)}">Odbij</button></div>`).join("")}</div>` : '<p class="muted pad-s">Nema otvorenih zahtjeva.</p>'}</div>` : table(groups[tab])}
      <p class="faint small" style="margin-top:12px">Za novu osobu: dodajte njen e-mail u Cloudflare Zero Trust, u Access politiku aplikacije app.evidenta.io, a ovdje joj dodijelite ulogu i projekte.</p>`;
    $("#nu").addEventListener("click", () => userForm({ kind: "consultant" }, cs));
    $("#nuc").addEventListener("click", () => userForm({ kind: "client" }, cs));
    $$("tr.row").forEach(tr => tr.addEventListener("click", () => userForm(us.find(u => u.email === tr.dataset.e), cs)));
    const decide = (ok) => async e => { const [pid, email, access] = e.currentTarget.dataset[ok ? "ok" : "no"].split("|");
      if (ok) await api(`/projects/${pid}/members`, { method: "POST", body: { email, access, can_download: 1 } });
      else await api(`/projects/${pid}/download-request`, { method: "DELETE", body: { email } });
      toast(ok ? "Preuzimanje odobreno" : "Zahtjev odbijen"); usersView("zahtjevi"); };
    $$("[data-ok]").forEach(b => b.addEventListener("click", decide(true)));
    $$("[data-no]").forEach(b => b.addEventListener("click", decide(false)));
  }
  async function userForm(u, cs, after) {
    const ps = NAV.ps, isNew = !u.email;
    let mem = [];
    if (u.email && u.kind !== "admin") mem = (await Promise.all(ps.filter(p => p.client_id === u.client_id || u.kind !== "client").map(p => api(`/projects/${p.id}/members`).then(ms => { const m = ms.find(x => x.email === u.email); return m ? { ...m, p } : null; })))).filter(Boolean);
    const mreq = u.mfa_required === undefined ? u.kind === "client" : !!u.mfa_required;
    openDrawer(`${dhead(u.email ? esc(u.name || u.email) : u.kind === "client" ? "Novi korisnik klijenta" : "Novi član tima", "Korisnik")}
      <form class="form" id="uf"><label class="f">E-mail<input id="u-e" type="email" value="${esc(u.email)}" ${u.email ? "readonly" : ""} required></label>
      <div class="two"><label class="f">Ime i prezime<input id="u-n" value="${esc(u.name)}"></label><label class="f">Firma ili organizacija<input id="u-o" value="${esc(u.org)}"></label></div>
      <div class="two"><label class="f">Uloga<select id="u-k">${["consultant", "client", "admin", "pending", "disabled"].map(k => `<option value="${k}" ${k === (u.kind || "consultant") ? "selected" : ""}>${KIND_T[k]}</option>`).join("")}</select></label>
      <label class="f" id="u-cw">Klijent (za ulogu Klijent)<select id="u-c"><option value="">–</option>${cs.map(c => `<option value="${c.id}" ${c.id === u.client_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label></div>
      <label class="chk"><input type="checkbox" id="u-m" ${mreq ? "checked" : ""}><span><b>Obavezna dvostruka provjera (MFA)</b><small>Za korisnike klijenta uvijek preporučeno. Osoba pri prvoj prijavi podešava aplikaciju za autentifikaciju.</small></span></label>
      ${actions(false)}</form>
      ${u.email ? `<div class="sec"><h3>${ICON.shield} Dvostruka provjera</h3><p class="small">${mfaTag(u)}</p>
        ${u.mfa_enabled ? `<p class="muted small" style="margin-top:6px">Ako je osoba izgubila telefon, resetujte MFA. Pri sljedećoj prijavi ponovo skenira QR kod.</p><button class="btn sm danger" type="button" id="mreset" style="margin-top:8px">Resetuj MFA</button>` : ""}</div>` : ""}
      ${u.email && u.kind !== "admin" ? `<div class="sec"><h3>${ICON.lock} Projekti ove osobe</h3><div class="list">${mem.map(m => `<a class="li" href="#/p/${m.p.id}/pristup"><span class="grow"><b>${esc(m.p.name)}</b><small>${esc(m.p.client_name)}</small></span><span class="tag ${m.access === "edit" ? "blue" : ""}">${m.access === "edit" ? "Uređivanje" : "Pregled"}</span>${u.kind === "client" ? (m.can_download ? `<span class="tag teal">${ICON.dl} dozvoljeno</span>` : m.download_requested_at ? `<span class="tag orange">${ICON.dl} traži</span>` : `<span class="tag">${ICON.dl} ne</span>`) : ""}</a>`).join("") || '<p class="muted small">Nije dodana ni na jedan projekat.</p>'}</div>
        <p class="faint small" style="margin-top:8px">Projekte i preuzimanje dodjeljujete u projektu, u sekciji Pristup.</p></div>` : ""}`);
    let touched = false; $("#u-m").addEventListener("change", () => touched = true);
    const sync = () => { const k = val("u-k"); $("#u-cw").style.visibility = k === "client" ? "visible" : "hidden"; if (!touched && isNew) $("#u-m").checked = k === "client"; }; sync(); $("#u-k").addEventListener("change", sync);
    $("#mreset") && $("#mreset").addEventListener("click", async () => { if (!confirm("Resetovati MFA za " + u.email + "?")) return; await api(`/users/${encodeURIComponent(u.email)}/mfa-reset`, { method: "POST" }); toast("MFA resetovan"); closeDrawer(); (after || (() => usersView(location.hash.split("/")[2])))(); });
    $("#uf").addEventListener("submit", async e => {
      e.preventDefault();
      await api("/users" + (u.email ? "/" + encodeURIComponent(u.email) : ""), { method: u.email ? "PUT" : "POST", body: { email: val("u-e"), name: val("u-n"), org: val("u-o"), kind: val("u-k"), client_id: val("u-c"), mfa_required: $("#u-m").checked } });
      toast("Sačuvano"); closeDrawer(); NAV = null; await loadNav(); (after || (() => usersView(location.hash.split("/")[2])))();
    });
  }

  /* ---------- settings: issuer data for invoices (admin) ---------- */
  async function settingsView() {
    setCrumb([["Postavke"]]);
    const s = await api("/settings/issuer"), I = EVV.ISSUER;
    const f = (k, o = {}) => `<label class="f vf" data-k="${k}"><span class="fl">${esc(o.label || I[k].label)}${I[k].required ? '<b class="req">*</b>' : ""}</span>${o.select ? `<select id="is-${k}">${o.select}</select>` : `<input id="is-${k}" value="${esc(s[k])}" type="${o.type || "text"}" placeholder="${esc(o.ph || "")}" ${o.inputmode ? `inputmode="${o.inputmode}"` : ""} spellcheck="false">`}<small class="hint">${esc(o.hint || "")}</small><small class="ferr" id="ie-${k}"></small></label>`;
    app.innerHTML = `<div class="hero sm"><div><span class="eyebrow">Postavke</span><h1>Podaci SCE Assurance za fakture</h1><p>Ovi podaci se ispisuju u zaglavlju (memorandumu), podnožju i podacima za plaćanje na svakoj fakturi. Izdane fakture čuvaju podatke kakvi su bili u trenutku izdavanja.</p></div></div>
      ${s.missing.length ? `<div class="dlbar">${ICON.lock}<div class="grow"><b>Fakture se ne mogu izdati dok ne popunite obavezne podatke</b><small>Nedostaje: ${esc(s.missing.join(", "))}. Nacrte i pregled PDF-a možete raditi i prije toga.</small></div></div>` : ""}
      <form class="form vform setform" id="sf" novalidate>
        <div class="card fsec"><h3>Firma</h3>
          <div class="three">${f("name", { ph: "SCE Assurance" })}${f("legal_form", { ph: "d.o.o." })}${f("country_code", { select: countryOpts(s.country_code) })}</div>
          <div class="three">${f("address")}${f("postal_code", { inputmode: "numeric" })}${f("city")}</div>
          <div class="three">${f("id_number", { hint: "13 cifara za BiH", inputmode: "numeric" })}${f("vat_number", { hint: "12 cifara, ako je firma u sistemu PDV-a", inputmode: "numeric" })}${f("court_reg", { ph: "Općinski sud u Sarajevu, MBS …" })}</div>
          <label class="chk"><input type="checkbox" id="is-vat_payer" ${s.vat_payer ? "checked" : ""}><span><b>Firma je u sistemu PDV-a</b><small>Ako nije, na fakturi se ne obračunava PDV i ispisuje se napomena da izdavalac nije u sistemu PDV-a.</small></span></label></div>
        <div class="card fsec"><h3>Kontakt</h3><div class="three">${f("email", { type: "email" })}${f("phone", { type: "tel", ph: "+387 …" })}${f("website", { ph: "sceassurance.com" })}</div></div>
        <div class="card fsec"><h3>Banka</h3><div class="three">${f("bank")}${f("iban", { hint: "Provjerava se kontrolni broj." })}${f("swift", { ph: "8 ili 11 znakova" })}</div></div>
        <div class="card fsec"><h3>Fakture</h3>
          <div class="three">${f("prefix", { hint: "Broj: PREFIKS-GODINA-0001" })}${f("place")}${f("currency", { select: ["BAM", "EUR"].map(c => `<option ${c === s.currency ? "selected" : ""}>${c}</option>`).join("") })}</div>
          <div class="three">${f("due_days", { type: "number", inputmode: "numeric" })}${f("vat_rate", { type: "number", hint: "Za BiH 17%, ako je firma u sistemu PDV-a" })}<span></span></div>
          <div class="two">${f("signer_name")}${f("signer_title", { ph: "npr. Direktor" })}</div>
          ${f("footer", { ph: "npr. Hvala na povjerenju." })}</div>
        <div class="inline"><button class="btn primary" type="submit">Sačuvaj postavke</button></div>
      </form>`;
    const read = () => ({ ...Object.fromEntries(Object.keys(I).map(k => [k, ($("#is-" + k) || {}).value || ""])), vat_payer: $("#is-vat_payer").checked });
    const show = errs => $$("#sf .vf").forEach(l => { const k = l.dataset.k, e = errs[k]; l.classList.toggle("bad", !!e); $("#ie-" + k).textContent = e || ""; });
    $("#sf").addEventListener("focusout", () => show(EVV.checkIssuer(read()).errors));
    $("#sf").addEventListener("submit", async e => {
      e.preventDefault(); const c = EVV.checkIssuer(read()); show(c.errors);
      if (Object.keys(c.errors).length) return toast("Provjerite označena polja.");
      try { const r = await api("/settings/issuer", { method: "PUT", body: read(), quiet: true }); toast(r.missing.length ? "Sačuvano. Još nedostaje: " + r.missing.join(", ") : "Sačuvano. Fakture se mogu izdavati."); NAV = null; route(); }
      catch (x) { if (x.data && x.data.fields) { show(x.data.fields); toast("Provjerite označena polja."); } }
    });
  }

  /* ---------- invoices ---------- */
  const INV_ST = { draft: ["Nacrt", ""], issued: ["Izdana", "blue"], shared: ["Poslana klijentu", "orange"], paid: ["Plaćena", "teal"], cancelled: ["Stornirana", "red"] };
  const CURS = { BAM: "KM", EUR: "EUR" };
  const num2 = n => { const neg = n < 0, a = Math.round(Math.abs(n) * 100), i = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (neg ? "-" : "") + i + "," + String(a % 100).padStart(2, "0"); };
  const money = (minor, cur) => num2(minor / 100) + (cur ? " " + (CURS[cur] || cur) : "");
  const invStatus = i => { const [t, c] = INV_ST[i.status] || [i.status, ""]; const late = ["issued", "shared"].includes(i.status) && daysTo(i.due_date) < 0; return `<span class="tag ${late ? "red" : c}">${late ? "Dospjela" : t}</span>`; };
  const parseAmount = s => { s = String(s || "").replace(/\s|KM|EUR/gi, ""); if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""); else s = s.replace(",", "."); const n = parseFloat(s); return isFinite(n) ? n : 0; };
  const invTable = (list, withClient = true) => `<table class="tbl invt"><thead><tr><th>Broj</th>${withClient ? "<th>Klijent</th>" : ""}<th class="hide-m">Datum</th><th class="hide-m">Rok</th><th class="num">Iznos</th><th>Status</th></tr></thead><tbody>
    ${list.map(i => `<tr class="row" data-inv="${i.id}"><td class="ttl"><b>${esc(i.number || "Nacrt")}</b>${i.signed_at ? `<small>${ICON.shield} kvalifikovano potpisana</small>` : ""}</td>${withClient ? `<td>${esc(i.client_name)}</td>` : ""}
      <td class="hide-m">${fmtDate(i.issue_date)}</td><td class="hide-m">${i.due_date ? fmtDate(i.due_date) : ""}</td><td class="num"><b>${money(i.total, i.currency)}</b></td><td>${invStatus(i)}${i.client_viewed_at && i.status === "shared" ? ' <span class="tag" title="Klijent je otvorio fakturu">otvorena</span>' : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Nema faktura.</td></tr>`}</tbody></table>`;
  const bindInvRows = () => $$("tr[data-inv]").forEach(tr => tr.addEventListener("click", () => openInvoice(tr.dataset.inv)));
  let INV_F = "all";
  async function invoicesView(openId) {
    const client = ME.user.kind === "client";
    setCrumb([["Fakture"]]);
    const list = await api("/invoices");
    if (client) {
      app.innerHTML = `<div class="hero sm"><div><span class="eyebrow">Fakture</span><h1>Fakture SCE Assurance</h1><p>Fakture koje vam je SCE Assurance izdao. PDF možete preuzeti i provjeriti da nije mijenjan.</p></div></div>
        <div id="ilist">${invTable(list, false)}</div>`;
    } else {
      const y = new Date().getFullYear(), yr = list.filter(i => i.number && String(i.issue_date).startsWith(y) && i.status !== "cancelled");
      const open = list.filter(i => ["issued", "shared"].includes(i.status)), late = open.filter(i => daysTo(i.due_date) < 0);
      const sum = (arr, cur) => arr.filter(i => i.currency === cur).reduce((a, i) => a + i.total, 0);
      const both = arr => ["BAM", "EUR"].map(c => sum(arr, c) ? money(sum(arr, c), c) : "").filter(Boolean).join(" + ") || money(0, "BAM");
      const F = { all: "Sve", draft: "Nacrti", open: "Neplaćene", late: "Dospjele", paid: "Plaćene", cancelled: "Stornirane" };
      const flt = { all: () => true, draft: i => i.status === "draft", open: i => ["issued", "shared"].includes(i.status), late: i => ["issued", "shared"].includes(i.status) && daysTo(i.due_date) < 0, paid: i => i.status === "paid", cancelled: i => i.status === "cancelled" };
      app.innerHTML = `<div class="hero"><div><span class="eyebrow">Fakture</span><h1>Fakturisanje</h1><p>Fakture na memorandumu SCE Assurance s podacima klijenta iz Evidente, elektronskim odobrenjem i dijeljenjem u klijentskom portalu.</p></div>
        <div class="inline"><a class="btn light" href="#/settings">Podaci za fakture</a><button class="btn accent" id="ninv">+ Nova faktura</button></div></div>
        ${NAV.issuerMissing ? `<div class="dlbar">${ICON.lock}<div class="grow"><b>Podaci SCE Assurance nisu potpuni</b><small>Nacrte možete praviti, ali izdavanje je moguće tek kad u Postavkama popunite obavezne podatke.</small></div><a class="btn sm primary" href="#/settings">Postavke</a></div>` : ""}
        <div class="kpis k4">
          <div class="card kpi"><b>${yr.length}</b><span>izdanih faktura u ${y}.</span></div>
          <div class="card kpi"><b class="sm">${both(yr)}</b><span>fakturisano u ${y}.</span></div>
          <div class="card kpi"><b class="sm">${both(open)}</b><span>${open.length} neplaćenih</span></div>
          <div class="card kpi ${late.length ? "warn" : ""}"><b class="sm">${both(late)}</b><span>${late.length} dospjelih</span></div></div>
        <div class="chips" id="ifl">${Object.entries(F).map(([k, t]) => `<button class="chip${INV_F === k ? " on" : ""}" data-f="${k}" type="button">${t}<small>${list.filter(flt[k]).length}</small></button>`).join("")}</div>
        <div id="ilist">${invTable(list.filter(flt[INV_F]))}</div>`;
      $("#ninv").addEventListener("click", () => invoiceEditor({}));
      $$("#ifl [data-f]").forEach(b => b.addEventListener("click", () => { INV_F = b.dataset.f; invoicesView(); }));
    }
    bindInvRows();
    if (openId) openInvoice(openId);
  }
  const UNITS = ["sat", "dan", "mj", "kom", "paušal"];
  const PRESETS = [["Konsultantski dan", "dan"], ["Gap analiza prema standardu", "dan"], ["Interni audit", "dan"], ["Obuka zaposlenih", "dan"], ["Priprema za certifikacijski audit", "dan"], ["Pristup platformi Evidenta", "mj"], ["Paušalna naknada za održavanje sistema", "mj"]];
  async function invoiceEditor(inv) {
    const [cs, full] = await Promise.all([api("/clients"), inv.id ? api("/invoices/" + inv.id) : null]);
    const I = full || { client_id: inv.client_id || "", items: [], lang: "", currency: "", issue_date: new Date().toISOString().slice(0, 10) };
    let clientData = null, defVat = full ? full.issuer_vat_rate : null;
    const iss = full ? null : await api("/settings/issuer");
    if (defVat == null) defVat = iss && iss.vat_payer ? +iss.vat_rate : 0;
    const rows = (I.items.length ? I.items : [{ description: "", qty: 1, unit: "dan", unit_price: 0, vat_rate: defVat }]).map(x => ({ ...x, price: x.unit_price / 100 }));
    openDrawer(`${dhead(full ? "Nacrt fakture" : "Nova faktura", "Faktura")}
      <form class="form" id="ivf" novalidate>
        <div class="two"><label class="f"><span class="fl">Klijent<b class="req">*</b></span><select id="iv-c" required><option value="">Izaberite…</option>${cs.map(c => `<option value="${c.id}" ${c.id === I.client_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
          <label class="f">Projekat (neobavezno)<select id="iv-p"><option value="">–</option></select></label></div>
        <div id="iv-cc"></div>
        <div class="three"><label class="f"><span class="fl">Datum izdavanja<b class="req">*</b></span><input id="iv-d" type="date" value="${esc(I.issue_date)}" required></label><label class="f">Rok plaćanja<input id="iv-due" type="date" value="${esc(I.due_date || "")}"></label><label class="f">Datum isporuke / period<input id="iv-sd" value="${esc(I.service_date || "")}" placeholder="npr. septembar 2026"></label></div>
        <div class="three"><label class="f">Jezik fakture<select id="iv-l"><option value="">Automatski prema državi</option>${[["bs", "Bosanski"], ["en", "Engleski"], ["de", "Njemački"]].map(([k, t]) => `<option value="${k}" ${I.lang === k && full ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label class="f">Valuta<select id="iv-cur"><option value="">Automatski</option>${["BAM", "EUR"].map(c => `<option ${I.currency === c && full ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="f">Mjesto izdavanja<input id="iv-pl" value="${esc(I.place || "")}" placeholder="${esc((iss && iss.place) || "Sarajevo")}"></label></div>
        <div class="fsec"><h3>Stavke</h3><div class="items" id="iv-items"></div>
          <div class="inline" style="flex-wrap:wrap"><button class="btn sm" type="button" id="iv-add">+ Stavka</button><select id="iv-preset" class="btn sm"><option value="">Brzo dodaj uslugu…</option>${PRESETS.map((p, i) => `<option value="${i}">${esc(p[0])}</option>`).join("")}</select></div>
          <datalist id="units">${UNITS.map(u => `<option value="${u}">`).join("")}</datalist>
          <div class="ivtot" id="iv-tot"></div></div>
        <label class="f">Napomena o PDV-u<input id="iv-vn" value="${esc(I.vat_note || "")}" placeholder="npr. osnov za oslobođenje od PDV-a, ako postoji (provjerite s računovođom)"></label>
        <label class="f">Napomena na fakturi<textarea id="iv-n" placeholder="npr. Usluge prema ponudi br. …">${esc(I.notes || "")}</textarea></label>
        <div class="inline dact" style="flex-wrap:wrap"><button class="btn" type="submit">Sačuvaj nacrt</button><button class="btn" type="button" id="iv-prev">${ICON.file} Pregled PDF</button><button class="btn primary" type="button" id="iv-issue">${ICON.shield} Izdaj i potpiši</button>${full ? '<span class="sp"></span><button class="btn ghost danger" type="button" id="del">Obriši nacrt</button>' : ""}</div>
      </form>`);
    $(".dpanel").classList.add("wide");
    const draw = () => {
      $("#iv-items").innerHTML = `<div class="ih"><span>Opis</span><span>Kol.</span><span>JM</span><span>Cijena</span><span>PDV %</span><span class="r">Iznos</span><span></span></div>` + rows.map((r, i) => `<div class="irow" data-i="${i}">
        <textarea data-f="description" rows="1" placeholder="Opis usluge" aria-label="Opis">${esc(r.description)}</textarea>
        <input data-f="qty" inputmode="decimal" value="${esc(String(r.qty).replace(".", ","))}" aria-label="Količina">
        <input data-f="unit" list="units" value="${esc(r.unit || "")}" aria-label="Jedinica mjere">
        <input data-f="price" inputmode="decimal" value="${esc(r.price ? num2(r.price) : "")}" placeholder="0,00" aria-label="Cijena">
        <input data-f="vat_rate" inputmode="decimal" value="${esc(String(r.vat_rate).replace(".", ","))}" aria-label="PDV %">
        <b class="r" data-amt>${money(Math.round(parseAmount(r.qty) * r.price * 100))}</b>
        <button class="btn ghost sm x" type="button" data-rm="${i}" title="Ukloni stavku">${ICON.x}</button></div>`).join("");
      $$("#iv-items textarea").forEach(auto);
      totalsDraw();
    };
    const auto = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; };
    const totalsDraw = () => {
      const cur = $("#iv-cur").value || (clientData && clientData.country_code && clientData.country_code !== "BA" ? "EUR" : "BAM");
      let net = 0; const vat = {};
      rows.forEach(r => { const n = Math.round(parseAmount(r.qty) * r.price * 100); net += n; const vr = parseAmount(r.vat_rate); if (vr > 0) vat[vr] = (vat[vr] || 0) + n; });
      const vats = Object.entries(vat).map(([r, b]) => [r, Math.round(b * r / 100)]), vt = vats.reduce((a, v) => a + v[1], 0);
      $("#iv-tot").innerHTML = `<div><span>Osnovica</span><b>${money(net, cur)}</b></div>${vats.map(([r, v]) => `<div><span>PDV ${String(r).replace(".", ",")}%</span><b>${money(v, cur)}</b></div>`).join("")}<div class="grand"><span>Ukupno za plaćanje</span><b>${money(net + vt, cur)}</b></div>`;
    };
    $("#iv-items").addEventListener("input", e => {
      const row = e.target.closest(".irow"); if (!row) return; const r = rows[+row.dataset.i], f = e.target.dataset.f;
      if (f === "price") r.price = parseAmount(e.target.value); else if (f === "description" || f === "unit") r[f] = e.target.value; else r[f] = e.target.value;
      if (e.target.tagName === "TEXTAREA") auto(e.target);
      $("[data-amt]", row).textContent = money(Math.round(parseAmount(r.qty) * r.price * 100)); totalsDraw();
    });
    $("#iv-items").addEventListener("focusout", e => { if (e.target.dataset.f === "price") { const r = rows[+e.target.closest(".irow").dataset.i]; e.target.value = r.price ? num2(r.price) : ""; } });
    $("#iv-items").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (!b) return; rows.splice(+b.dataset.rm, 1); if (!rows.length) rows.push({ description: "", qty: 1, unit: "dan", price: 0, vat_rate: curVat() }); draw(); });
    const curVat = () => clientData && clientData.country_code && clientData.country_code !== "BA" ? 0 : defVat;
    $("#iv-add").addEventListener("click", () => { rows.push({ description: "", qty: 1, unit: "dan", price: 0, vat_rate: curVat() }); draw(); $$("#iv-items textarea").pop().focus(); });
    $("#iv-preset").addEventListener("change", e => { const p = PRESETS[e.target.value]; if (!p) return; const empty = rows.findIndex(r => !r.description); const r = { description: p[0], qty: 1, unit: p[1], price: 0, vat_rate: curVat() }; if (empty >= 0) rows[empty] = r; else rows.push(r); e.target.value = ""; draw(); });
    $("#iv-cur").addEventListener("change", totalsDraw);
    const showClient = async () => {
      const id = val("iv-c"); $("#iv-p").innerHTML = '<option value="">–</option>' + NAV.ps.filter(p => p.client_id === id).map(p => `<option value="${p.id}" ${p.id === I.project_id ? "selected" : ""}>${esc(p.name)}</option>`).join("");
      if (!id) { $("#iv-cc").innerHTML = ""; clientData = null; return; }
      clientData = await api("/clients/" + id); const chk = EVV.checkClient(clientData);
      const cn = (EVV.COUNTRIES.find(x => x[0] === clientData.country_code) || [])[1] || "";
      $("#iv-cc").innerHTML = `<div class="ccard ${chk.missingForInvoice.length ? "warn" : ""}"><div class="grow"><span class="faint small">Kupac, podaci se povlače iz Evidente</span><b>${esc(clientData.legal_name || clientData.name)}</b>
        <small>${esc([clientData.address, [clientData.postal_code, clientData.city].filter(Boolean).join(" "), cn].filter(Boolean).join(", "))}</small>
        <small>${esc([clientData.id_number && "ID " + clientData.id_number, clientData.vat_number && "PDV " + clientData.vat_number].filter(Boolean).join(" · "))}</small>
        ${chk.missingForInvoice.length ? `<small class="orange">Za izdavanje nedostaje: ${esc(chk.missingForInvoice.join(", "))}</small>` : ""}</div><button class="btn sm" type="button" id="iv-ce">Uredi podatke</button></div>`;
      $("#iv-ce").addEventListener("click", async () => { const keep = collect(); if (full) await api("/invoices/" + full.id, { method: "PUT", body: keep }); clientForm(clientData, () => invoiceEditor(full ? { id: full.id } : { ...keep, client_id: id })); });
      totalsDraw();
    };
    $("#iv-c").addEventListener("change", showClient); showClient();
    draw();
    const collect = () => ({ client_id: val("iv-c"), project_id: val("iv-p"), issue_date: val("iv-d"), due_date: val("iv-due"), service_date: val("iv-sd"), lang: val("iv-l"), currency: val("iv-cur"), place: val("iv-pl"), vat_note: val("iv-vn"), notes: val("iv-n"),
      items: rows.filter(r => String(r.description).trim()).map(r => ({ description: r.description, qty: parseAmount(r.qty), unit: r.unit, unit_price: r.price, vat_rate: parseAmount(r.vat_rate) })) });
    let savedId = full && full.id;
    async function save() {
      const b = collect(); if (!b.client_id) { toast("Izaberite klijenta."); $("#iv-c").focus(); return null; }
      if (savedId) await api("/invoices/" + savedId, { method: "PUT", body: b }); else savedId = (await api("/invoices", { method: "POST", body: b })).id;
      return savedId;
    }
    $("#ivf").addEventListener("submit", async e => { e.preventDefault(); if (await save()) { toast("Nacrt sačuvan"); closeDrawer(); if (CUR.view === "invoices") invoicesView(); else route(); } });
    $("#iv-prev").addEventListener("click", async () => { const w = window.open("about:blank"); const id = await save(); if (id) w.location = `/api/invoices/${id}/pdf?inline=1`; else w.close(); });
    $("#iv-issue").addEventListener("click", async () => {
      const id = await save(); if (!id) return;
      const d = await api("/invoices/" + id);
      if (d.issuer_missing.length) return toast("Prvo popunite podatke SCE Assurance: " + d.issuer_missing.join(", "));
      if (d.client_missing.length) return toast("Klijentu nedostaje: " + d.client_missing.join(", "));
      if (!d.items.length) return toast(ERR.no_items);
      if (!confirm(`Izdati fakturu za ${d.client.legal_name || d.client.name} na ${money(d.totals.total, d.currency)}?\n\nFaktura dobija broj, elektronski je odobrena vašim imenom i više se ne može mijenjati (samo stornirati).`)) return;
      try { const r = await api(`/invoices/${id}/issue`, { method: "POST" }); toast(`Faktura ${r.number} je izdana`); closeDrawer(); location.hash = "#/invoices/" + id; if (CUR.view === "invoices") route(); }
      catch (x) { if (x.data && x.data.missing) toast((ERR[x.message] || x.message) + " " + x.data.missing.join(", ")); }
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati nacrt fakture?")) return; await api("/invoices/" + full.id, { method: "DELETE" }); closeDrawer(); invoicesView(); });
  }
  async function sha256File(file) { const b = await crypto.subtle.digest("SHA-256", await file.arrayBuffer()); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  async function openInvoice(id) {
    const d = await api("/invoices/" + id), admin = ME.user.kind === "admin";
    if (admin && d.status === "draft") return invoiceEditor({ id });
    const step = (on, t, sub) => `<li class="${on ? "on" : ""}"><i>${on ? ICON.check : ""}</i><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ""}</div></li>`;
    const base = `/api/invoices/${d.id}/pdf`;
    openDrawer(`${dhead(esc(d.number), "Faktura")}
      <div class="invhead"><div><span class="faint small">${esc(d.client_name)}</span><b class="amt">${money(d.total, d.currency)}</b><small class="muted">izdana ${fmtDate(d.issue_date)} · rok ${fmtDate(d.due_date)}</small></div>${invStatus(d)}</div>
      <div class="inline" style="flex-wrap:wrap"><a class="btn primary" href="${base}">${ICON.dl} Preuzmi PDF${d.signed_at || d.signed ? " (potpisan)" : ""}</a><a class="btn" href="${base}?inline=1" target="_blank" rel="noopener">${ICON.file} Otvori</a>${admin && d.signed_key ? `<a class="btn ghost" href="${base}?v=original">Original bez potpisa</a>` : ""}</div>
      ${admin ? `<div class="sec"><h3>${ICON.task} Tok fakture</h3><ol class="flow">
        ${step(true, "Izdana i elektronski odobrena", `${esc(d.approved_name || d.approved_by)} · ${fmtDT(d.approved_at)} · kod ${esc(d.verify_code)}`)}
        ${step(!!d.signed_at, "Kvalifikovani digitalni potpis", d.signed_at ? `učitan ${fmtDT(d.signed_at)}` : "neobavezno: potpišite PDF certifikatom i učitajte ga")}
        ${step(!!d.shared_at, "Podijeljena s klijentom", d.shared_at ? fmtDT(d.shared_at) + (d.client_viewed_at ? ` · klijent otvorio ${fmtDT(d.client_viewed_at)}` : " · klijent još nije otvorio") : "vidljiva korisnicima klijenta u portalu")}
        ${step(!!d.paid_at, "Plaćena", d.paid_at ? fmtDate(d.paid_at) : "")}</ol>
        ${d.status === "cancelled" ? '<p class="tag red">Stornirana</p>' : `<div class="inline" style="flex-wrap:wrap;margin-top:12px">
          ${["issued", "shared", "paid"].includes(d.status) ? `<label class="btn" for="sgf">${ICON.shield} ${d.signed_at ? "Zamijeni potpisani PDF" : "Učitaj potpisani PDF"}</label><input type="file" id="sgf" accept="application/pdf" hidden>` : ""}
          ${d.status === "issued" ? `<button class="btn accent" id="shr" type="button">Podijeli s klijentom</button>` : ""}
          ${["issued", "shared"].includes(d.status) ? `<button class="btn" id="pd" type="button">${ICON.check} Označi plaćeno</button><span class="sp"></span><button class="btn ghost danger" id="cn" type="button">Storniraj</button>` : ""}</div>`}
        <details class="howsign"><summary>Kako dodati kvalifikovani digitalni potpis?</summary><ol><li>Preuzmite PDF (original bez potpisa).</li><li>Otvorite ga u Adobe Acrobat Readeru ili alatu vašeg certifikacionog tijela i potpišite ga kvalifikovanim certifikatom (kartica, USB token ili udaljeni potpis).</li><li>Sačuvajte potpisani PDF i učitajte ga ovdje. Klijent tada dobija potpisanu verziju.</li></ol><p class="faint small">Evidenta ne čuva vaš privatni ključ; potpis nastaje na vašem uređaju.</p></details></div>` : ""}
      <div class="sec"><h3>${ICON.lock} Provjera autentičnosti</h3><p class="muted small">Odaberite PDF koji imate, a Evidenta provjerava da je identičan izdanoj fakturi (SHA-256). Provjera se radi u vašem pregledniku, datoteka se ne šalje.</p>
        <label class="btn sm" for="vf" style="margin-top:8px">Provjeri PDF</label><input type="file" id="vf" accept="application/pdf" hidden><p id="vres" class="small" style="margin-top:8px"></p>
        <p class="faint small hash">Original: <code>${esc(d.pdf_sha256 || "")}</code>${d.signed_sha256 ? `<br>Potpisani: <code>${esc(d.signed_sha256)}</code>` : ""}${d.verify_code ? `<br>Kod za provjeru na fakturi: <b>${esc(d.verify_code)}</b>` : ""}</p></div>`, () => { if (location.hash === "#/invoices/" + id) history.replaceState(null, "", "#/invoices"); });
    $(".dpanel").classList.add("wide");
    $("#vf").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; const h = await sha256File(f); const ok = h === d.pdf_sha256 || h === d.signed_sha256;
      $("#vres").innerHTML = ok ? `<span class="tag teal">${ICON.check} Datoteka je identična ${h === d.signed_sha256 ? "potpisanoj" : "izdanoj"} fakturi ${esc(d.number)}.</span>` : `<span class="tag red">Datoteka se razlikuje od izdane fakture. Ne koristite je bez provjere s SCE Assurance.</span>`; });
    const reload = () => { openInvoice(id); if (CUR.view === "invoices") api("/invoices").then(() => invoicesView()); };
    $("#sgf") && $("#sgf").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append("file", f);
      try { await api(`/invoices/${id}/signed`, { method: "POST", body: fd }); toast("Potpisani PDF je učitan"); reload(); } catch (x) {} });
    $("#shr") && $("#shr").addEventListener("click", async () => { if (!confirm(`Podijeliti fakturu ${d.number} s korisnicima klijenta ${d.client_name}? Vidjet će je u klijentskom portalu.`)) return; await api(`/invoices/${id}/share`, { method: "POST" }); toast("Faktura je podijeljena s klijentom"); reload(); });
    $("#pd") && $("#pd").addEventListener("click", async () => { const dt = prompt("Datum uplate (GGGG-MM-DD):", new Date().toISOString().slice(0, 10)); if (!dt) return; await api(`/invoices/${id}/paid`, { method: "POST", body: { paid_at: dt } }); toast("Označeno kao plaćeno"); reload(); });
    $("#cn") && $("#cn").addEventListener("click", async () => { if (!confirm(`Stornirati fakturu ${d.number}? Broj ostaje zauzet, a faktura se označava kao stornirana.`)) return; await api(`/invoices/${id}/cancel`, { method: "POST" }); toast("Faktura je stornirana"); reload(); });
  }

  /* ---------- project ---------- */
  let P = null, ITEMS = [], TASKS = [], EVID = [], RISKS = [], FINDS = [], AUDITS = [], RO = false;
  const CODE = () => Object.fromEntries(ITEMS.map(i => [i.id, i.code]));
  const CAT = () => ME.catalogs[P.standard];
  async function loadProject(id) {
    [P, ITEMS, TASKS, EVID, RISKS, FINDS, AUDITS] = await Promise.all(["", "/items", "/tasks", "/evidence", "/risks", "/findings", "/audits"].map(s => api("/projects/" + id + s)));
    RO = P.access !== "edit"; document.body.classList.toggle("ro", RO); document.body.classList.toggle("nodl", !P.can_download);
  }
  const SEC_T = { pregled: "Pregled", sazetak: "Sažetak za upravu", rizici: "Registar rizika", mjere: "Mjere", audit: "Audit i nalazi", preispitivanje: "Preispitivanje od strane uprave", poboljsanja: "Poboljšanja", registri: "Registri", dokazi: "Dokazi", izvjestaji: "Izvještaji", pristup: "Pristup projektu", aktivnost: "Aktivnost" };
  let SUB = null;
  async function projectView(id, sec, sub) {
    await loadProject(id);
    const K = CAT().kinds;
    if (P.is_client && ["pristup", "aktivnost"].includes(sec)) sec = "pregled";
    if ((sec === "zahtjevi" && !K.clause) || (sec === "kontrole" && !K.control) || !(SEC_T[sec] || sec === "zahtjevi" || sec === "kontrole")) sec = "pregled";
    SUB = sub || null;
    const title = sec === "zahtjevi" ? K.clause.tab : sec === "kontrole" ? K.control.tab : SEC_T[sec];
    setCrumb([[P.client_name, "#/c/" + P.client_id], [P.name, "#/p/" + P.id], ...(sec !== "pregled" ? [[title]] : [])]);
    app.style.setProperty("--sc", SC(P.standard));
    app.innerHTML = `<div class="phead"><div><span class="pclient">${esc(P.client_name)}</span><h1>${esc(P.name)}</h1>
      <div class="facts">${stdTag(P.standard)}<span>Faza: <b>${esc(PHASES[P.phase] || P.phase)}</b></span>${P.deadline ? `<span>Rok: <b>${fmtDate(P.deadline)}</b></span>` : ""}${P.requester ? `<span>Traži: <b>${esc(P.requester)}</b></span>` : ""}${deadlineTag(P.deadline)}${P.status !== "active" ? '<span class="tag">Završen</span>' : ""}${RO ? `<span class="tag">${ICON.lock} Samo pregled</span>` : ""}</div></div>
      <div class="inline"><a class="btn" href="/api/projects/${P.id}/report/mgmt.docx">${ICON.word} Izvještaj za upravu</a>${RO ? "" : '<button class="btn" id="pedit">Uredi projekat</button>'}</div></div>
      ${P.can_download ? "" : `<div class="dlbar">${ICON.lock}<div class="grow"><b>Preuzimanje dokumenata nije odobreno</b><small>Sve podatke možete pregledati ovdje. Izvještaje, registre i dokaze možete preuzeti kada administrator SCE Assurance odobri preuzimanje.</small></div>${P.download_requested ? '<span class="tag orange">Zahtjev poslan</span>' : '<button class="btn sm primary" id="dlreq">Zatraži preuzimanje</button>'}</div>`}
      ${sec !== "pregled" ? `<h2 class="stitle">${esc(title)}</h2>` : ""}
      <section id="tab"></section>`;
    $("#dlreq") && $("#dlreq").addEventListener("click", async () => { await api(`/projects/${P.id}/download-request`, { method: "POST" }); toast("Zahtjev je poslan administratoru"); refresh(); });
    $("#pedit") && $("#pedit").addEventListener("click", projectForm);
    ({ pregled: tabOverview, sazetak: tabSummary, zahtjevi: () => tabItems("clause"), kontrole: () => tabItems("control"), rizici: tabRisks, mjere: tabTasks, dokazi: tabEvidence, audit: tabAudits,
      preispitivanje: tabReviews, poboljsanja: tabImprovements, registri: () => SUB ? tabRegister(SUB) : tabRegisters(), izvjestaji: tabReports, pristup: tabAccess, aktivnost: tabAudit }[sec] || tabOverview)();
  }
  const refresh = () => { const h = location.hash.replace(/^#\/?/, "").split("/"); return projectView(P.id, h[2] || "pregled", h[3]); };

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
      toast("Sačuvano"); NAV = null; closeDrawer(); route();
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
    const bars = kind => s.groups.filter(g => g.kind === kind).map(g => `<div class="bar" style="--c:${kind === "clause" || !K.clause ? "var(--sc)" : "color-mix(in srgb,var(--sc) 55%,var(--ink))"}"><span class="n">${K[kind].gp.replace("Čl. ", "")}${g.group}</span><span>${esc(g.name)}</span><span class="t"><i style="width:${g.pct}%"></i></span><span class="p">${g.pct}%</span></div>`).join("");
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
  const linkedTasks = (key, id, label) => `<div class="sec"><h3>${ICON.task} ${label || (key === "finding_id" ? "Korektivne mjere" : "Mjere tretmana")}</h3><div class="list">${TASKS.filter(t => t[key] === id).map(taskLi).join("") || '<p class="muted small">Nema mjera.</p>'}</div>
    <div class="inline w" style="margin-top:8px"><input id="lt-t" placeholder="Nova mjera"><input id="lt-o" placeholder="Odgovorni" style="flex:0 0 130px"><input id="lt-d" type="date" style="flex:0 0 140px"><button class="btn sm" type="button" id="lt-add">Dodaj</button></div></div>`;
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
    const XL = { "gap.csv": "items", "soa.csv": "soa", "tasks.csv": "tasks", risks: "risks" };
    const card = (t, d, word, csv, extra = "") => `<div class="card rep"><div class="ric">${ICON.word}</div><div><h3>${t}</h3><p class="muted small">${d}</p>
      <div class="inline" style="margin-top:12px;flex-wrap:wrap">${word ? `<a class="btn primary sm" href="${base}/report/${word}">${ICON.word} Word</a>` : ""}${csv ? `<a class="btn sm" href="${base}/registers.xlsx?type=${XL[csv]}">${ICON.csv} Excel</a>` : ""}${extra}</div></div></div>`;
    $("#tab").innerHTML = `<p class="muted" style="margin-bottom:14px">Izvještaji se generišu iz trenutnog stanja projekta, s naslovnom stranom, brojevima stranica i oznakom povjerljivosti. Svako preuzimanje se bilježi u aktivnosti.</p>
      <div class="grid repgrid">
      ${card("Izvještaj za upravu", `Ključni pokazatelji, odluke koje se traže od uprave, spremnost po oblastima s grafikonima, pregled svih stavki, najveći rizici i otvoreni nalazi.`, "mgmt.docx", "")}
      ${card("Izvještaj o gap analizi", `${esc(ME.standards[P.standard])}: sažetak spremnosti, rezultati po oblastima, stavke koje traže pažnju, detaljni pregled i plan mjera. Trenutno ${P.summary.readiness}% spremnosti.`, "gap.docx", "gap.csv")}
      ${CAT().soa ? card("Izjava o primjenjivosti (SoA)", `Svih 93 kontrole Aneksa A s obrazloženjem i statusom, po temama, s poljima za odobrenje.`, "soa.docx", "soa.csv") : ""}
      ${card("Registar rizika i plan tretmana", `Metodologija, mapa rizika, registar s inherentnim i rezidualnim nivoom, plan tretmana. ${RISKS.length} rizika u registru.`, "risks.docx", "risks")}
      ${card("Plan mjera", `Otvorene i završene mjere s odgovornima i rokovima. ${TASKS.filter(t => t.status !== "done").length} otvorenih.`, "tasks.docx", "tasks.csv")}
      ${card("Izvještaj o auditu", AUDITS.length ? "Sažetak, nalazi po vrsti, detalji svakog nalaza s uzrokom i korektivnom mjerom, potpisi." : "Prvo dodajte audit u kartici Audit i nalazi.", "", "",
        AUDITS.map(a => `<a class="btn sm" href="${base}/report/audit.docx?audit=${a.id}">${ICON.word} ${esc(a.title)}</a>`).join(""))}
      ${card("Zapisnik s preispitivanja uprave", "Ulazi, izlazi, odluke i mjere uprave, s poljima za potpis. Zapisnici se prave u sekciji Preispitivanje uprave.", "", "", `<a class="btn sm" href="#/p/${P.id}/preispitivanje">Preispitivanja</a>`)}
      ${card("Svi registri", "Jedna Excel radna sveska: sažetak, status zahtjeva, rizici, mjere, nalazi, auditi, preispitivanja, dokazi i svi registri standarda.", "", "", `<a class="btn primary sm" href="${base}/registers.xlsx?type=all">${ICON.csv} Excel</a><a class="btn sm" href="#/p/${P.id}/registri">Registri</a>`)}
      </div>`;
  }

  /* ---------- charts (SVG, no libraries) ---------- */
  const STC = { 3: "var(--s3)", 2: "var(--s2)", 1: "var(--s1)", 0: "var(--s0)", "": "var(--sn)" };
  function donut(segs, center, sub) {
    const tot = segs.reduce((a, s) => a + s.v, 0) || 1, r = 52, c = 2 * Math.PI * r; let off = 0;
    const arcs = segs.filter(s => s.v).map(s => { const len = s.v / tot * c, gap = segs.filter(x => x.v).length > 1 ? 2 : 0;
      const el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${s.c}" stroke-width="16" stroke-dasharray="${Math.max(0, len - gap)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(s.l)}: ${s.v} (${Math.round(s.v / tot * 100)}%)</title></circle>`; off += len; return el; }).join("");
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(center)}"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--card2)" stroke-width="16"/>${arcs}<text x="70" y="70" text-anchor="middle" class="dv">${esc(center)}</text><text x="70" y="88" text-anchor="middle" class="ds">${esc(sub)}</text></svg>
      <ul class="lg">${segs.map(s => `<li><i style="background:${s.c}"></i>${esc(s.l)}<b>${s.v}</b></li>`).join("")}</ul></div>`;
  }
  const hbars = rows => `<div class="hb">${rows.map(r => `<div class="hbr" title="${esc(r.label)}: ${r.pct}%"><span class="n">${esc(r.code)}</span><span class="l">${esc(r.label)}</span><span class="t"><i style="width:${r.pct}%;background:${r.pct >= 75 ? "var(--s3)" : r.pct >= 40 ? "var(--s2)" : r.pct > 0 ? "var(--s1)" : "var(--sn)"}"></i></span><b>${r.pct}%</b></div>`).join("")}</div>`;
  function lineChart(h) {
    if (h.length < 2) return `<p class="muted small">Kretanje spremnosti se bilježi svaki dan kada se projekat otvori. Graf se pojavljuje od drugog dana mjerenja.</p>${h.length ? `<p><b>${h[0].readiness}%</b> <span class="muted small">na dan ${fmtDate(h[0].day)}</span></p>` : ""}`;
    const W = 560, H = 190, L = 34, B = 24, T = 10, t0 = new Date(h[0].day), t1 = new Date(h[h.length - 1].day), span = Math.max(1, t1 - t0);
    const x = d => L + (new Date(d) - t0) / span * (W - L - 10), y = v => T + (100 - v) / 100 * (H - T - B);
    const pts = h.map(p => `${x(p.day).toFixed(1)},${y(p.readiness).toFixed(1)}`).join(" ");
    return `<svg class="line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kretanje spremnosti">
      ${[0, 25, 50, 75, 100].map(v => `<line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${v}</text>`).join("")}
      <text x="${L}" y="${H - 6}" class="ax">${fmtDate(h[0].day)}</text><text x="${W - 10}" y="${H - 6}" text-anchor="end" class="ax">${fmtDate(h[h.length - 1].day)}</text>
      <polyline points="${L},${y(0)} ${pts} ${x(h[h.length - 1].day)},${y(0)}" class="area"/><polyline points="${pts}" class="ln"/>
      ${h.map(p => `<g class="pt"><circle cx="${x(p.day)}" cy="${y(p.readiness)}" r="10" class="hit"/><circle cx="${x(p.day)}" cy="${y(p.readiness)}" r="3.5" class="dot"/><title>${fmtDate(p.day)}: ${p.readiness}% spremnosti, ${p.open_tasks} otvorenih mjera</title></g>`).join("")}</svg>`;
  }
  function tiles(kind) {
    const C = CAT(), groups = C.groups[kind], gp = C.kinds[kind].gp;
    return `<div class="tiles">${Object.entries(groups).map(([g, name]) => `<div class="trow"><span class="tg">${gp}${g} <small>${esc(name)}</small></span><div class="tset">${ITEMS.filter(i => i.kind === kind && i.group === g).map(i => {
      const st = stOf(i.status); return `<button type="button" class="tile${i.applicable ? "" : " na"}" data-id="${i.id}" style="--c:${i.applicable ? STC[i.status == null ? "" : i.status] : "var(--card2)"}" title="${esc(i.code)} ${esc(i.title)}: ${i.applicable ? st.t : "Ne primjenjuje se"}">${esc(i.code.replace(/^Čl\. /, ""))}</button>`; }).join("")}</div></div>`).join("")}</div>`;
  }

  /* ---------- management summary ---------- */
  async function tabSummary() {
    const s = P.summary, c = P.counters, K = CAT().kinds, h = await api(`/projects/${P.id}/history`);
    const app_ = ITEMS.filter(i => i.applicable);
    const dist = [3, 2, 1, 0, ""].map(v => ({ v: app_.filter(i => (i.status == null ? "" : i.status) === v).length, c: STC[v], l: stOf(v).t }));
    const prev = h.length > 1 ? h[Math.max(0, h.length - 31)] : null, delta = prev ? s.readiness - prev.readiness : null;
    const lv = ["critical", "high", "medium", "low"].map(l => ({ l, n: RISKS.filter(r => r.status !== "closed" && LEVEL(r.likelihood * r.impact) === l).length }));
    const maxLv = Math.max(1, ...lv.map(x => x.n));
    const openT = TASKS.filter(t => t.status !== "done"), late = openT.filter(t => t.due && daysTo(t.due) < 0), done = TASKS.length - openT.length;
    const fk = Object.keys(FKIND).map(k => ({ k, n: FINDS.filter(f => f.kind === k && f.status !== "closed").length }));
    $("#tab").innerHTML = `<p class="muted" style="margin:-4px 0 16px">Pregled za upravu klijenta: gdje je sistem danas, šta se promijenilo i gdje je potrebna odluka. Isti sadržaj je u Word izvještaju za upravu.</p>
      <div class="kpis k6">
        <div class="card kpi"><b>${s.readiness}%</b><span>spremnost${delta != null ? ` · <span class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : ""}${delta} p.p.</span>` : ""}</span></div>
        <div class="card kpi"><b>${s.assessed}/${s.applicable}</b><span>stavki ocijenjeno</span></div>
        <div class="card kpi ${late.length ? "warn" : ""}"><b>${late.length}</b><span>mjera kasni od ${openT.length} otvorenih</span></div>
        <div class="card kpi ${c.major_findings ? "warn" : ""}"><b>${c.open_findings}</b><span>otvorenih nalaza, ${c.major_findings} glavnih</span></div>
        <div class="card kpi"><b>${c.high_risks}</b><span>visokih i kritičnih rizika</span></div>
        <div class="card kpi"><b>${P.deadline ? daysTo(P.deadline) : "–"}</b><span>dana do audita</span></div></div>
      <div class="sgrid">
        <div class="card"><h3>Status svih stavki</h3>${donut(dist, s.readiness + "%", "spremnost")}</div>
        <div class="card span2"><h3>Kretanje spremnosti</h3>${lineChart(h)}</div>
        ${Object.keys(K).map(k => `<div class="card span${Object.keys(K).length === 1 ? 3 : "15"}"><h3>${esc(K[k].title)}</h3>${hbars(s.groups.filter(g => g.kind === k).map(g => ({ code: K[k].gp.replace("Čl. ", "") + g.group, label: g.name, pct: g.pct })))}</div>`).join("")}
        <div class="card span3"><div class="head sm"><h3>Sve stavke na jednom mjestu</h3><div class="lg inline-lg">${[3, 2, 1, 0, ""].map(v => `<span><i style="background:${STC[v]}"></i>${stOf(v).t}</span>`).join("")}<span><i style="background:var(--card2);border:1px solid var(--line2)"></i>Ne primjenjuje se</span></div></div>
          ${Object.keys(K).map(k => `<h4 class="th4">${esc(K[k].title)}</h4>${tiles(k)}`).join("")}</div>
        <div class="card"><h3>Aktivni rizici po nivou</h3><div class="vb">${lv.map(x => `<div title="${LEVEL_T[x.l]}: ${x.n}"><b>${x.n}</b><span class="bar"><i class="${x.l}" style="height:${x.n / maxLv * 100}%"></i></span><small>${LEVEL_T[x.l]}</small></div>`).join("")}</div></div>
        <div class="card"><h3>Mjere</h3>${donut([{ v: done, c: "var(--s3)", l: "Završeno" }, { v: openT.length - late.length, c: "var(--s2)", l: "Otvoreno u roku" }, { v: late.length, c: "var(--s0)", l: "Kasni" }], String(TASKS.length), "mjera")}</div>
        <div class="card"><h3>Otvoreni nalazi</h3><div class="hb">${fk.map(x => `<div class="hbr"><span class="l">${fkTag(x.k)}</span><span class="t"><i style="width:${x.n / Math.max(1, ...fk.map(y => y.n)) * 100}%;background:var(--ink2)"></i></span><b>${x.n}</b></div>`).join("")}</div></div>
      </div>
      <div class="inline" style="margin-top:16px;flex-wrap:wrap"><a class="btn primary" href="/api/projects/${P.id}/report/mgmt.docx">${ICON.word} Izvještaj za upravu (Word)</a><a class="btn" href="/api/projects/${P.id}/registers.xlsx?type=all">${ICON.csv} Svi registri (Excel)</a></div>`;
    $$("#tab .tile").forEach(t => t.addEventListener("click", () => itemDrawer(t.dataset.id)));
  }

  /* ---------- registers ---------- */
  const REG = () => ME.registers;
  const recRef = (type, ref) => `${REG()[type].prefix}-${String(ref).padStart(3, "0")}`;
  async function tabRegisters() {
    const { counts, recommended } = await api(`/projects/${P.id}/records`);
    const std = P.standard, base = `/api/projects/${P.id}/registers.xlsx?type=`;
    const builtin = [["items", "Status zahtjeva i kontrola", "Svi zahtjevi sa statusom, nalazom i odgovornim", ITEMS.length, CAT().kinds.clause ? "zahtjevi" : "kontrole"],
      ...(CAT().soa ? [["soa", "Izjava o primjenjivosti (SoA)", "Kontrole Aneksa A s obrazloženjem", ITEMS.filter(i => i.kind === "control").length, "kontrole"]] : []),
      ["risks", "Registar rizika", "Procjena i tretman rizika", RISKS.length, "rizici"], ["tasks", "Plan mjera", "Sve mjere s rokovima i odgovornima", TASKS.length, "mjere"],
      ["findings", "Nalazi i korektivne mjere", "Nesukladnosti, zapažanja, korektivne mjere", FINDS.length, "audit"], ["audits", "Program audita", "Planirani i održani auditi", AUDITS.length, "audit"],
      ["reviews", "Preispitivanja uprave", "Zapisnici i odluke uprave", null, "preispitivanje"], ["evidence", "Registar dokaza", "Priloženi dokumenti", EVID.length, "dokazi"]];
    const card = (t, d, n, href, x, ref, open) => `<div class="card reg"><div class="rtop"><h3>${esc(t)}</h3>${n != null ? `<span class="cnt2">${n}</span>` : ""}</div><p class="muted small">${esc(d)}</p>${ref ? `<p class="faint small">Zahtjev: ${esc(ref)}</p>` : ""}${open ? `<p class="small red">${open} otvoreno</p>` : ""}
      <div class="inline" style="margin-top:auto;padding-top:10px"><a class="btn sm" href="${href}">Otvori</a><a class="btn sm" href="${base}${x}">${ICON.csv} Excel</a></div></div>`;
    const regCard = k => { const r = REG()[k], c = counts[k] || { n: 0, open: 0 }; return card(r.name, `${r.fields.slice(0, 4).map(f => f.l).join(", ")}…`, c.n, `#/p/${P.id}/registri/${k}`, "r:" + k, r.ref[std], c.open); };
    const others = Object.keys(REG()).filter(k => !recommended.includes(k));
    $("#tab").innerHTML = `<div class="head sm"><p class="muted" style="max-width:52rem">Registri koje standard traži ili koje auditor očekuje. Svaki se može preuzeti u Excelu, a svi zajedno u jednoj radnoj svesci s listom za svaki registar.</p><a class="btn primary" href="${base}all">${ICON.csv} Svi registri (Excel)</a></div>
      <h3 class="gh">Registri za ${esc(ME.standards[std])}</h3><div class="grid rgrid3">${recommended.map(regCard).join("")}</div>
      <h3 class="gh">Evidencije projekta</h3><div class="grid rgrid3">${builtin.map(([x, t, d, n, s]) => card(t, d, n, `#/p/${P.id}/${s}`, x)).join("")}</div>
      ${others.length ? `<details class="more"><summary>Dodatni registri (${others.length})</summary><div class="grid rgrid3">${others.map(regCard).join("")}</div></details>` : ""}`;
  }
  async function tabRegister(type, opts = {}) {
    const def = REG()[type]; if (!def) return tabRegisters();
    const rows = await api(`/projects/${P.id}/records?type=${type}`), cols = def.fields.filter(f => f.list);
    $("#tab").innerHTML = `${opts.noBack ? "" : `<a class="back" href="#/p/${P.id}/registri">‹ Svi registri</a>`}
      <div class="head sm"><div><h3 style="font-size:1.2rem">${esc(def.name)}</h3><p class="faint small">${def.ref[P.standard] ? "Zahtjev: " + esc(def.ref[P.standard]) : "Dodatni registar"} · ${rows.length} zapisa</p></div>
      <div class="inline"><a class="btn" href="/api/projects/${P.id}/registers.xlsx?type=r:${type}">${ICON.csv} Excel</a><button class="btn primary w" id="nrec">+ ${esc(def.one)}</button></div></div>
      <div class="tools"><input id="rq" type="search" placeholder="Pretraži registar…"></div><div id="rtb" class="tblw"></div>${opts.extra || ""}`;
    const cell = (f, v) => v == null || v === "" ? '<span class="faint">–</span>' : f.t === "date" ? (f.k === "next" || f.k === "review" || f.k === "due" ? dueTag(v) : fmtDate(v)) : f.t === "sel" && ["status", "score", "result"].includes(f.k) ? `<span class="tag">${esc(v)}</span>` : esc(String(v).slice(0, 120));
    const draw = () => { const q = val("rq").toLowerCase(), list = rows.filter(r => !q || JSON.stringify(r.data).toLowerCase().includes(q));
      $("#rtb").innerHTML = list.length ? `<table class="tbl"><thead><tr><th>Oznaka</th>${cols.map((f, i) => `<th class="${i > 3 ? "hide-m" : ""}">${esc(f.l)}</th>`).join("")}</tr></thead><tbody>
        ${list.map(r => `<tr class="row" data-id="${r.id}"><td class="code">${recRef(type, r.ref)}</td>${cols.map((f, i) => `<td class="${i > 3 ? "hide-m" : ""}${i === 0 ? " ttl" : ""}">${i === 0 ? `<b>${cell(f, r.data[f.k])}</b>` : cell(f, r.data[f.k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`
        : `<div class="card empty small">${rows.length ? "Nema zapisa za ovu pretragu." : "Registar je prazan."}</div>`;
      $$("#rtb tr.row").forEach(tr => tr.addEventListener("click", () => recordDrawer(type, rows.find(r => r.id === tr.dataset.id)))); };
    $("#rq").addEventListener("input", draw);
    $("#nrec") && $("#nrec").addEventListener("click", () => recordDrawer(type, null));
    draw();
  }
  function recordDrawer(type, r) {
    const def = REG()[type], d = (r && r.data) || {};
    const input = f => { const v = d[f.k] == null ? "" : d[f.k], id = "rf-" + f.k;
      if (f.t === "area") return `<label class="f">${esc(f.l)}<textarea id="${id}">${esc(v)}</textarea></label>`;
      if (f.t === "sel" || f.t === "yn") return `<label class="f">${esc(f.l)}<select id="${id}"><option value="">–</option>${(f.t === "yn" ? ["Da", "Ne"] : f.o).map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
      return `<label class="f">${esc(f.l)}<input id="${id}" type="${f.t === "date" ? "date" : f.t === "num" ? "number" : "text"}" value="${esc(v)}"></label>`; };
    const fs = def.fields, html = []; for (let i = 0; i < fs.length; i++) { const f = fs[i], g = fs[i + 1];
      if (f.t !== "area" && g && g.t !== "area" && i > 0) { html.push(`<div class="two">${input(f)}${input(g)}</div>`); i++; } else html.push(input(f)); }
    openDrawer(`${dhead(r ? esc(d[def.title] || def.one) : "Novi zapis: " + esc(def.one), r ? recRef(type, r.ref) + " · " + esc(def.name) : esc(def.name))}
      <form class="form" id="recf">${html.join("")}${actions(!!r)}</form>
      ${r && ["improvements", "incidents", "complaints", "suppliers"].includes(type) ? linkedTasks("record_id", r.id, "Mjere") : ""}`, () => refresh());
    $("#recf").addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(fs.map(f => [f.k, val("rf-" + f.k)]));
      if (!data[def.title]) return toast("Upišite: " + fs.find(f => f.k === def.title).l);
      await api(`/projects/${P.id}/records${r ? "/" + r.id : ""}`, { method: r ? "PUT" : "POST", body: { type, data } });
      toast("Sačuvano"); closeDrawer();
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati zapis?")) return; await api(`/projects/${P.id}/records/${r.id}`, { method: "DELETE" }); closeDrawer(); });
    if (r && $("#lt-add")) bindLinked("record_id", r.id, async () => { const rows = await api(`/projects/${P.id}/records?type=${type}`); recordDrawer(type, rows.find(x => x.id === r.id)); });
  }
  async function tabImprovements() {
    const ofi = FINDS.filter(f => f.kind === "ofi");
    await tabRegister("improvements", { noBack: true, extra: ofi.length ? `<h3 class="gh">Prilike za poboljšanje iz audita</h3><div class="card flush"><div class="list plain">${ofi.map(f => `<a class="li" href="#/p/${P.id}/audit"><span class="grow"><b>${N(f.ref)} ${esc(f.title)}</b><small>${FSTAT[f.status]}${f.owner ? " · " + esc(f.owner) : ""}</small></span>${fkTag("ofi")}</a>`).join("")}</div></div>` : "" });
  }

  /* ---------- management reviews ---------- */
  const RVS = { planned: "Planirano", held: "Održano", approved: "Zapisnik odobren" };
  async function tabReviews() {
    const rs = await api(`/projects/${P.id}/reviews`);
    $("#tab").innerHTML = `<div class="head sm"><p class="muted" style="max-width:52rem">Uprava najmanje jednom godišnje preispituje sistem: ulazi (nalazi, audit, rizici, ciljevi, dobavljači, prilike za poboljšanje) i izlazi (odluke, promjene, resursi). Evidenta predlaže ulaze iz podataka projekta.</p><button class="btn primary w" id="nrv">+ Novo preispitivanje</button></div>
      ${rs.length ? `<div class="grid agrid">${rs.map(r => `<div class="card acard" data-r="${r.id}"><div class="ahead"><span class="tag ${r.status === "approved" ? "teal" : r.status === "held" ? "blue" : ""}">${RVS[r.status]}</span><small class="faint">${r.date ? fmtDate(r.date) : "bez datuma"}</small></div>
        <h3>${esc(r.title)}</h3><p class="muted small">${esc(r.participants || "Učesnici nisu upisani")}</p>
        <div class="afoot"><span class="small">${TASKS.filter(t => t.review_id === r.id).length} mjera</span><a class="btn sm" href="/api/projects/${P.id}/report/review.docx?review=${r.id}">${ICON.word} Zapisnik</a></div></div>`).join("")}</div>`
        : `<div class="card empty"><h2>Još nema preispitivanja</h2><p>Zahtjev 9.3 u ISO 27001 i ISO 9001; za NIS2 uprava odobrava i nadzire mjere (član 20).</p></div>`}`;
    $("#nrv") && $("#nrv").addEventListener("click", () => reviewDrawer({ data: {} }));
    $$(".acard[data-r]").forEach(c => c.addEventListener("click", e => { if (e.target.closest("a")) return; reviewDrawer(rs.find(r => r.id === c.dataset.r)); }));
  }
  function reviewDrawer(r) {
    const d = r.data || {};
    openDrawer(`${dhead(r.id ? esc(r.title) : "Novo preispitivanje", "Preispitivanje od strane uprave")}
      <form class="form" id="rvf">
        <div class="two"><label class="f">Naziv<input id="rv-t" value="${esc(r.title || "Preispitivanje od strane uprave " + new Date().getFullYear())}"></label><label class="f">Datum<input id="rv-d" type="date" value="${esc(r.date)}"></label></div>
        <div class="two"><label class="f">Učesnici<input id="rv-p" value="${esc(r.participants)}" placeholder="Direktor, vlasnik sistema, …"></label><label class="f">Status<select id="rv-s">${Object.entries(RVS).map(([k, v]) => `<option value="${k}" ${k === (r.status || "planned") ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
        <div class="rvh"><h3>Ulazi</h3><button class="btn sm w" type="button" id="rv-auto">Popuni iz podataka projekta</button></div>
        ${ME.reviewIn.map(([k, l]) => `<label class="f">${esc(l)}<textarea id="rv-${k}" rows="2">${esc(d[k])}</textarea></label>`).join("")}
        <div class="rvh"><h3>Izlazi</h3></div>
        ${ME.reviewOut.map(([k, l]) => `<label class="f">${esc(l)}<textarea id="rv-${k}" rows="3">${esc(d[k])}</textarea></label>`).join("")}
        ${actions(!!r.id)}
      </form>
      ${r.id ? linkedTasks("review_id", r.id, "Mjere iz preispitivanja") + `<a class="btn" href="/api/projects/${P.id}/report/review.docx?review=${r.id}">${ICON.word} Zapisnik (Word)</a>` : ""}`, () => refresh());
    $(".dpanel").classList.add("wide");
    $("#rv-auto") && $("#rv-auto").addEventListener("click", async () => {
      const a = await api(`/projects/${P.id}/reviews/autofill${r.id ? "?exclude=" + r.id : ""}`); let n = 0;
      for (const [k, v] of Object.entries(a)) { const el = $("#rv-" + k); if (el && !el.value.trim()) { el.value = v; n++; el.classList.add("filled"); } }
      toast(n ? `Popunjeno ${n} polja. Provjerite i dopunite tekst.` : "Nema novih podataka za popunjavanje.");
    });
    $("#rvf").addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries([...ME.reviewIn, ...ME.reviewOut].map(([k]) => [k, val("rv-" + k)]));
      await api(`/projects/${P.id}/reviews${r.id ? "/" + r.id : ""}`, { method: r.id ? "PUT" : "POST", body: { title: val("rv-t"), date: val("rv-d"), participants: val("rv-p"), status: val("rv-s"), data } });
      toast("Sačuvano"); closeDrawer();
    });
    $("#del") && $("#del").addEventListener("click", async () => { if (!confirm("Obrisati preispitivanje?")) return; await api(`/projects/${P.id}/reviews/${r.id}`, { method: "DELETE" }); closeDrawer(); });
    if (r.id) bindLinked("review_id", r.id, async () => { const rs = await api(`/projects/${P.id}/reviews`); reviewDrawer(rs.find(x => x.id === r.id)); });
  }

  /* ---------- project access ---------- */
  async function tabAccess() {
    if (RO) { $("#tab").innerHTML = `<div class="card empty small"><p>Imate pristup samo za pregled. Članove projekta vidi i mijenja administrator.</p></div>`; return; }
    const admin = ME.user.kind === "admin";
    const [ms, us] = await Promise.all([api(`/projects/${P.id}/members`), admin ? api("/users") : Promise.resolve([])]);
    const cand = us.filter(u => ["consultant", "client"].includes(u.kind) && (u.kind !== "client" || u.client_id === P.client_id) && !ms.some(m => m.email === u.email));
    $("#tab").innerHTML = `<p class="muted" style="max-width:52rem;margin-bottom:14px">Administratori vide sve projekte. Svi ostali vide ovaj projekat samo ako su ovdje dodani. Korisnici s ulogom Klijent mogu biti dodani samo na projekte svoje firme i ne mogu preuzimati dokumente dok to ovdje ne odobrite.</p>
      ${admin ? `<form class="card form inline-form" id="mf"><select id="m-e">${cand.length ? cand.map(u => `<option value="${esc(u.email)}">${esc(u.name || u.email)} · ${KIND_T[u.kind]}${u.org ? " · " + esc(u.org) : ""}</option>`).join("") : '<option value="">Nema korisnika za dodavanje</option>'}</select>
        <select id="m-a"><option value="view">Pregled</option><option value="edit">Uređivanje</option></select><button class="btn primary" type="submit" ${cand.length ? "" : "disabled"}>Dodaj na projekat</button><a class="btn ghost" href="#/users">Korisnici</a></form>` : ""}
      <table class="tbl" style="margin-top:14px"><thead><tr><th>Osoba</th><th>Uloga</th><th>Pristup</th><th>Preuzimanje</th><th></th></tr></thead><tbody>
      ${ms.map(m => `<tr><td class="ttl"><b>${esc(m.name || m.email)}</b><small>${esc(m.name ? m.email : "")}</small></td><td><span class="role ${m.kind}">${KIND_T[m.kind] || "–"}</span></td>
        <td>${admin ? `<select class="stsel" data-m="${esc(m.email)}"><option value="view" ${m.access === "view" ? "selected" : ""}>Pregled</option><option value="edit" ${m.access === "edit" ? "selected" : ""}>Uređivanje</option></select>` : (m.access === "edit" ? "Uređivanje" : "Pregled")}</td>
        <td>${admin ? `<label class="sw"><input type="checkbox" data-dl="${esc(m.email)}" data-acc="${m.access}" ${m.can_download ? "checked" : ""}><i></i><span>${m.can_download ? "Dozvoljeno" : "Nije dozvoljeno"}</span></label>${!m.can_download && m.download_requested_at ? ` <button class="btn sm primary" type="button" data-appr="${esc(m.email)}" data-acc="${m.access}">Odobri zahtjev</button>` : ""}` : (m.can_download ? "Dozvoljeno" : "Ne")}</td>
        <td>${admin ? `<button class="btn sm ghost danger" data-rm="${esc(m.email)}" type="button">Ukloni</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="5" class="muted">Nema članova.</td></tr>'}</tbody></table>`;
    $("#mf") && $("#mf").addEventListener("submit", async e => { e.preventDefault(); if (!val("m-e")) return; await api(`/projects/${P.id}/members`, { method: "POST", body: { email: val("m-e"), access: val("m-a") } }); toast("Dodano"); tabAccess(); });
    $$("[data-m]").forEach(s => s.addEventListener("change", async () => { await api(`/projects/${P.id}/members`, { method: "POST", body: { email: s.dataset.m, access: s.value } }); toast("Pristup ažuriran"); tabAccess(); }));
    $$("[data-dl]").forEach(c => c.addEventListener("change", async () => { await api(`/projects/${P.id}/members`, { method: "POST", body: { email: c.dataset.dl, access: c.dataset.acc, can_download: c.checked } }); toast(c.checked ? "Preuzimanje dozvoljeno" : "Preuzimanje isključeno"); NAV = null; await loadNav(); renderNav(); tabAccess(); }));
    $$("[data-appr]").forEach(b => b.addEventListener("click", async () => { await api(`/projects/${P.id}/members`, { method: "POST", body: { email: b.dataset.appr, access: b.dataset.acc, can_download: 1 } }); toast("Preuzimanje odobreno"); NAV = null; await loadNav(); renderNav(); tabAccess(); }));
    $$("[data-rm]").forEach(b => b.addEventListener("click", async () => { if (!confirm("Ukloniti pristup za " + b.dataset.rm + "?")) return; await api(`/projects/${P.id}/members/${encodeURIComponent(b.dataset.rm)}`, { method: "DELETE" }); tabAccess(); }));
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

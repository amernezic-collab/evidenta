/* Evidenta coming-soon page: language switch, no tracking, no cookies */
(function () {
  "use strict";
  var I = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var IC = [I + '<path d="M9 11l2 2 4-4"/><rect x="4" y="3.5" width="16" height="17" rx="3"/></svg>', I + '<path d="M12 3.5l8.5 15h-17z"/><path d="M12 10v3.5M12 16.5h.01"/></svg>',
    I + '<path d="M5 20.5V4M5 4.5h11l-2 4 2 4H5"/></svg>', I + '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M14 14.8c2.8-.6 5.9.6 7 4.2"/></svg>',
    I + '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M4 9h16M4 14.5h16M10 3.5v17"/></svg>', I + '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>'];
  var T = {
    bs: { soon: "U RAZVOJU", h1: "Projekti usklađenosti na jednom mjestu.", lead: "Evidenta vodi projekte za ISO 27001, ISO 9001, NIS2 i TISAX: od gap analize i procjene rizika do audita, izvještaja za upravu i registara koje traži auditor.",
      cta: "Javite nam se", note: "Evidenta je u razvoju. Javite se ako želite rani pristup kad bude spremna.", cap: "Prikaz verzije u razvoju, s primjer podacima.", alt: "Evidenta: sažetak za upravu", fh: "Šta Evidenta radi", by: "Razvija SCE Assurance, Sarajevo", title: "Evidenta · u razvoju",
      f: [["Gap analiza i Izjava o primjenjivosti", "Svaki zahtjev i kontrola sa statusom, nalazom, odgovornom osobom i dokazima."], ["Registar rizika i mapa rizika", "Procjena, tretman i rezidualni rizik, povezani s kontrolama i mjerama."], ["Auditi, nalazi i korektivne mjere", "Interni auditi, nesukladnosti i praćenje do zatvaranja."], ["Preispitivanje od strane uprave", "Ulazi se predlažu iz podataka projekta, a zapisnik je spreman u Wordu."], ["Registri i izvještaji", "Registri za svaki standard u Excelu, izvještaji za upravu u Wordu."], ["Pristup po projektu", "Tim, vanjski saradnici i klijenti vide samo ono što im treba."]] },
    en: { soon: "IN DEVELOPMENT", h1: "Compliance projects in one place.", lead: "Evidenta runs projects for ISO 27001, ISO 9001, NIS2 and TISAX: from gap analysis and risk assessment to audits, management reports and the registers your auditor asks for.",
      cta: "Get in touch", note: "Evidenta is in development. Get in touch if you would like early access when it is ready.", cap: "Preview of the version in development, with sample data.", alt: "Evidenta: management summary", fh: "What Evidenta does", by: "Built by SCE Assurance, Sarajevo", title: "Evidenta · in development",
      f: [["Gap analysis and Statement of Applicability", "Every requirement and control with status, finding, owner and evidence."], ["Risk register and heat map", "Assessment, treatment and residual risk, linked to controls and actions."], ["Audits, findings and corrective actions", "Internal audits, nonconformities and tracking until closure."], ["Management review", "Inputs are suggested from project data and the minutes are ready in Word."], ["Registers and reports", "Registers for each standard in Excel, management reports in Word."], ["Access per project", "Your team, external partners and clients see only what they need."]] },
    de: { soon: "IN ENTWICKLUNG", h1: "Compliance-Projekte an einem Ort.", lead: "Evidenta steuert Projekte für ISO 27001, ISO 9001, NIS2 und TISAX: von der Gap-Analyse und Risikobeurteilung bis zu Audits, Managementberichten und den Registern, die der Auditor verlangt.",
      cta: "Kontakt aufnehmen", note: "Evidenta ist in Entwicklung. Melden Sie sich, wenn Sie frühen Zugang möchten, sobald sie bereit ist.", cap: "Vorschau der Version in Entwicklung, mit Beispieldaten.", alt: "Evidenta: Managementübersicht", fh: "Was Evidenta kann", by: "Entwickelt von SCE Assurance, Sarajevo", title: "Evidenta · in Entwicklung",
      f: [["Gap-Analyse und Erklärung zur Anwendbarkeit", "Jede Anforderung und Maßnahme mit Status, Feststellung, Verantwortlichen und Nachweisen."], ["Risikoregister und Risikomatrix", "Beurteilung, Behandlung und Restrisiko, verknüpft mit Maßnahmen."], ["Audits, Feststellungen und Korrekturmaßnahmen", "Interne Audits, Abweichungen und Verfolgung bis zum Abschluss."], ["Managementbewertung", "Eingaben werden aus Projektdaten vorgeschlagen, das Protokoll liegt in Word vor."], ["Register und Berichte", "Register für jede Norm in Excel, Managementberichte in Word."], ["Zugriff pro Projekt", "Team, externe Partner und Kunden sehen nur, was sie brauchen."]] }
  };
  function pick() {
    try { var s = localStorage.getItem("ev-lang"); if (T[s]) return s; } catch (e) {}
    var n = (navigator.language || "bs").slice(0, 2).toLowerCase();
    return n === "de" ? "de" : n === "en" ? "en" : "bs";
  }
  function apply(l) {
    var t = T[l]; document.documentElement.lang = l; document.title = t.title;
    document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = t[el.getAttribute("data-t")]; });
    document.querySelectorAll("[data-t-alt]").forEach(function (el) { el.alt = t.alt; });
    document.getElementById("feats").innerHTML = t.f.map(function (x, i) { return '<div class="fc"><span class="fi">' + IC[i] + '</span><h3></h3><p></p></div>'; }).join("");
    document.querySelectorAll("#feats .fc").forEach(function (el, i) { el.querySelector("h3").textContent = t.f[i][0]; el.querySelector("p").textContent = t.f[i][1]; });
    document.querySelectorAll(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-l") === l ? "true" : "false"); });
  }
  document.querySelectorAll(".lang button").forEach(function (b) { b.addEventListener("click", function () { var l = b.getAttribute("data-l"); try { localStorage.setItem("ev-lang", l); } catch (e) {} apply(l); }); });
  apply(pick());
})();

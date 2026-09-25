/*
 * Register definitions for Evidenta. Each register is stored as JSON in the "records" table.
 * Field types: text, area, date, num, sel (options), yn (Da/Ne).
 * list: shown as a column in the table view. w: column width in Excel (characters).
 * ref: where the register is required or expected, per standard.
 */
const LVL3 = ["Nizak", "Srednji", "Visok"];
export const REGISTERS = {
  documents: { name: "Lista dokumenata", one: "Dokument", prefix: "D", title: "name",
    ref: { iso27001: "7.5", iso9001: "7.5", nis2: "Čl. 21(2)(a)", tisax: "1.1.1" },
    fields: [
      { k: "code", l: "Oznaka", t: "text", list: 1, w: 12 }, { k: "name", l: "Naziv dokumenta", t: "text", list: 1, w: 36 },
      { k: "kind", l: "Vrsta", t: "sel", o: ["Politika", "Procedura", "Uputstvo", "Obrazac", "Plan", "Zapis", "Ostalo"], list: 1, w: 14 },
      { k: "version", l: "Verzija", t: "text", list: 1, w: 9 }, { k: "owner", l: "Vlasnik", t: "text", list: 1, w: 18 },
      { k: "approved_by", l: "Odobrio", t: "text", w: 18 }, { k: "approved", l: "Datum odobrenja", t: "date", list: 1, w: 14 },
      { k: "review", l: "Sljedeće preispitivanje", t: "date", list: 1, w: 16 },
      { k: "status", l: "Status", t: "sel", o: ["Nacrt", "U odobravanju", "Važeći", "Povučen"], list: 1, w: 13 },
      { k: "location", l: "Lokacija", t: "text", w: 28 }, { k: "note", l: "Napomena", t: "area", w: 30 }] },

  context: { name: "Unutrašnja i vanjska pitanja", one: "Pitanje", prefix: "K", title: "issue",
    ref: { iso27001: "4.1", iso9001: "4.1" },
    fields: [
      { k: "issue", l: "Pitanje", t: "text", list: 1, w: 36 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Unutrašnje", "Vanjsko"], list: 1, w: 12 },
      { k: "area", l: "Oblast", t: "sel", o: ["Politička", "Ekonomska", "Društvena", "Tehnološka", "Pravna", "Okolišna i klimatska", "Organizacija", "Ljudi", "Procesi", "Infrastruktura"], list: 1, w: 16 },
      { k: "impact", l: "Uticaj na sistem", t: "area", list: 1, w: 40 }, { k: "action", l: "Kako se prati ili tretira", t: "area", w: 36 },
      { k: "review", l: "Zadnja provjera", t: "date", list: 1, w: 14 }] },

  parties: { name: "Zainteresovane strane", one: "Zainteresovana strana", prefix: "Z", title: "party",
    ref: { iso27001: "4.2", iso9001: "4.2" },
    fields: [
      { k: "party", l: "Zainteresovana strana", t: "text", list: 1, w: 26 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Unutrašnja", "Vanjska"], list: 1, w: 12 },
      { k: "needs", l: "Potrebe i očekivanja", t: "area", list: 1, w: 42 }, { k: "relevant", l: "Ulazi u sistem", t: "yn", list: 1, w: 12 },
      { k: "how", l: "Kako se ispunjava", t: "area", w: 36 }, { k: "owner", l: "Odgovorni", t: "text", list: 1, w: 16 }] },

  legal: { name: "Zakonski i ugovorni zahtjevi", one: "Zahtjev", prefix: "L", title: "source",
    ref: { iso27001: "A.5.31", iso9001: "4.2, 5.1.2", nis2: "Čl. 21", tisax: "7.1.1" },
    fields: [
      { k: "source", l: "Propis ili ugovor", t: "text", list: 1, w: 30 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Zakon", "Podzakonski akt", "Ugovor s kupcem", "Standard kupca", "Licenca", "Ostalo"], list: 1, w: 16 },
      { k: "requirement", l: "Zahtjev", t: "area", list: 1, w: 42 }, { k: "applies", l: "Kako se primjenjuje", t: "area", w: 36 },
      { k: "owner", l: "Odgovorni", t: "text", list: 1, w: 16 }, { k: "checked", l: "Zadnja provjera", t: "date", list: 1, w: 14 },
      { k: "status", l: "Usklađenost", t: "sel", o: ["Usklađeno", "Djelimično", "Nije usklađeno", "Nije provjereno"], list: 1, w: 14 }] },

  assets: { name: "Registar imovine", one: "Imovina", prefix: "I", title: "name",
    ref: { iso27001: "A.5.9", nis2: "Čl. 21(2)(i)", tisax: "1.3.1" },
    fields: [
      { k: "name", l: "Naziv", t: "text", list: 1, w: 30 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Informacija", "Softver", "Hardver", "Cloud usluga", "Mreža", "Lokacija", "Ljudi", "Ostalo"], list: 1, w: 14 },
      { k: "owner", l: "Vlasnik", t: "text", list: 1, w: 18 }, { k: "location", l: "Lokacija", t: "text", w: 18 },
      { k: "class", l: "Klasifikacija", t: "sel", o: ["Javno", "Interno", "Povjerljivo", "Strogo povjerljivo"], list: 1, w: 16 },
      { k: "c", l: "Povjerljivost", t: "sel", o: LVL3, list: 1, w: 12 }, { k: "i", l: "Integritet", t: "sel", o: LVL3, list: 1, w: 12 }, { k: "a", l: "Dostupnost", t: "sel", o: LVL3, list: 1, w: 12 },
      { k: "note", l: "Napomena", t: "area", w: 30 }] },

  suppliers: { name: "Registar dobavljača", one: "Dobavljač", prefix: "S", title: "name",
    ref: { iso27001: "A.5.19–A.5.22", iso9001: "8.4", nis2: "Čl. 21(2)(d)", tisax: "6.1.1" },
    fields: [
      { k: "name", l: "Dobavljač", t: "text", list: 1, w: 26 }, { k: "service", l: "Proizvod ili usluga", t: "text", list: 1, w: 28 },
      { k: "critical", l: "Kritičnost", t: "sel", o: LVL3, list: 1, w: 12 }, { k: "data", l: "Pristup podacima", t: "yn", list: 1, w: 12 },
      { k: "contract", l: "Ugovor i NDA", t: "sel", o: ["Ugovor i NDA", "Samo ugovor", "Nema"], list: 1, w: 14 },
      { k: "evaluated", l: "Zadnja ocjena", t: "date", list: 1, w: 14 }, { k: "score", l: "Ocjena", t: "sel", o: ["Odobren", "Odobren uz uslove", "Nije odobren"], list: 1, w: 16 },
      { k: "next", l: "Sljedeća ocjena", t: "date", w: 14 }, { k: "note", l: "Napomena", t: "area", w: 30 }] },

  incidents: { name: "Registar incidenata", one: "Incident", prefix: "INC", title: "title",
    ref: { iso27001: "A.5.24–A.5.28", nis2: "Čl. 23", tisax: "1.6.1, 1.6.2" },
    fields: [
      { k: "title", l: "Incident", t: "text", list: 1, w: 30 }, { k: "detected", l: "Otkriven", t: "date", list: 1, w: 13 },
      { k: "kind", l: "Vrsta", t: "sel", o: ["Malver ili ransomware", "Phishing", "Neovlašten pristup", "Curenje podataka", "Gubitak uređaja", "Prekid usluge", "Greška zaposlenog", "Ostalo"], list: 1, w: 18 },
      { k: "severity", l: "Ozbiljnost", t: "sel", o: ["Niska", "Srednja", "Visoka", "Kritična"], list: 1, w: 12 },
      { k: "significant", l: "Značajan (NIS2)", t: "yn", list: 1, w: 12 },
      { k: "warn24", l: "Rano upozorenje 24 h", t: "date", w: 16 }, { k: "notif72", l: "Obavijest 72 h", t: "date", w: 14 }, { k: "final", l: "Završni izvještaj", t: "date", w: 14 },
      { k: "description", l: "Opis i uticaj", t: "area", w: 40 }, { k: "cause", l: "Uzrok", t: "area", w: 30 }, { k: "actions", l: "Mjere", t: "area", w: 30 },
      { k: "status", l: "Status", t: "sel", o: ["Otvoren", "U obradi", "Zatvoren"], list: 1, w: 12 }] },

  continuity: { name: "Kritični procesi i kontinuitet", one: "Proces", prefix: "BC", title: "process",
    ref: { iso27001: "A.5.29, A.5.30", nis2: "Čl. 21(2)(c)", tisax: "1.6.3, 5.2.8" },
    fields: [
      { k: "process", l: "Proces ili usluga", t: "text", list: 1, w: 28 }, { k: "owner", l: "Vlasnik", t: "text", list: 1, w: 16 },
      { k: "rto", l: "RTO (max. prekid)", t: "text", list: 1, w: 14 }, { k: "rpo", l: "RPO (max. gubitak podataka)", t: "text", list: 1, w: 16 },
      { k: "depends", l: "Zavisi od", t: "area", w: 30 }, { k: "plan", l: "Plan oporavka", t: "text", w: 24 },
      { k: "tested", l: "Zadnji test", t: "date", list: 1, w: 13 }, { k: "result", l: "Rezultat testa", t: "sel", o: ["Uspješan", "Djelimično", "Neuspješan", "Nije testirano"], list: 1, w: 14 }] },

  trainings: { name: "Obuke i kompetencije", one: "Obuka", prefix: "O", title: "topic",
    ref: { iso27001: "7.2, 7.3, A.6.3", iso9001: "7.2, 7.3", nis2: "Čl. 20(2), 21(2)(g)", tisax: "2.1.3" },
    fields: [
      { k: "topic", l: "Tema", t: "text", list: 1, w: 30 }, { k: "date", l: "Datum", t: "date", list: 1, w: 12 },
      { k: "audience", l: "Učesnici", t: "area", list: 1, w: 30 }, { k: "count", l: "Broj učesnika", t: "num", list: 1, w: 10 },
      { k: "trainer", l: "Predavač", t: "text", w: 18 }, { k: "effect", l: "Provjera efikasnosti", t: "sel", o: ["Test", "Praktična provjera", "Anketa", "Nije provjereno"], list: 1, w: 16 },
      { k: "evidence", l: "Dokaz", t: "text", w: 22 }] },

  objectives: { name: "Ciljevi i pokazatelji", one: "Cilj", prefix: "C", title: "goal",
    ref: { iso27001: "6.2", iso9001: "6.2" },
    fields: [
      { k: "goal", l: "Cilj", t: "text", list: 1, w: 32 }, { k: "kpi", l: "Pokazatelj", t: "text", list: 1, w: 24 },
      { k: "target", l: "Ciljna vrijednost", t: "text", list: 1, w: 14 }, { k: "actual", l: "Trenutna vrijednost", t: "text", list: 1, w: 14 },
      { k: "owner", l: "Odgovorni", t: "text", list: 1, w: 16 }, { k: "due", l: "Rok", t: "date", list: 1, w: 12 },
      { k: "status", l: "Status", t: "sel", o: ["Na putu", "Rizik", "Ostvaren", "Nije ostvaren"], list: 1, w: 12 }] },

  changes: { name: "Registar promjena", one: "Promjena", prefix: "P", title: "change",
    ref: { iso27001: "6.3, A.8.32", iso9001: "6.3, 8.5.6", tisax: "5.2.1" },
    fields: [
      { k: "change", l: "Promjena", t: "text", list: 1, w: 32 }, { k: "reason", l: "Razlog", t: "area", w: 30 },
      { k: "risk", l: "Procjena uticaja", t: "area", w: 30 }, { k: "approved_by", l: "Odobrio", t: "text", list: 1, w: 16 },
      { k: "date", l: "Datum", t: "date", list: 1, w: 12 }, { k: "status", l: "Status", t: "sel", o: ["Predložena", "Odobrena", "Provedena", "Odbijena"], list: 1, w: 12 }] },

  software: { name: "Odobreni softver i IT usluge", one: "Softver ili usluga", prefix: "SW", title: "name",
    ref: { iso27001: "A.5.23, A.8.19", tisax: "1.3.3, 1.3.4" },
    fields: [
      { k: "name", l: "Naziv", t: "text", list: 1, w: 26 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Instalirani softver", "Cloud usluga", "Mobilna aplikacija", "Razvojni alat"], list: 1, w: 18 },
      { k: "vendor", l: "Proizvođač", t: "text", list: 1, w: 18 }, { k: "purpose", l: "Namjena", t: "text", w: 26 },
      { k: "data", l: "Klasifikacija podataka", t: "sel", o: ["Javno", "Interno", "Povjerljivo", "Strogo povjerljivo"], list: 1, w: 16 },
      { k: "approved", l: "Odobren", t: "yn", list: 1, w: 10 }, { k: "reviewed", l: "Zadnja provjera", t: "date", list: 1, w: 14 }] },

  complaints: { name: "Reklamacije i povratne informacije", one: "Reklamacija", prefix: "R", title: "subject",
    ref: { iso9001: "8.2.1, 9.1.2, 10.2" },
    fields: [
      { k: "subject", l: "Predmet", t: "text", list: 1, w: 30 }, { k: "customer", l: "Kupac", t: "text", list: 1, w: 20 },
      { k: "received", l: "Primljeno", t: "date", list: 1, w: 12 }, { k: "kind", l: "Vrsta", t: "sel", o: ["Reklamacija", "Pohvala", "Prijedlog", "Upit"], list: 1, w: 12 },
      { k: "description", l: "Opis", t: "area", w: 36 }, { k: "action", l: "Mjera", t: "area", w: 30 },
      { k: "closed", l: "Zatvoreno", t: "date", list: 1, w: 12 }, { k: "status", l: "Status", t: "sel", o: ["Otvoreno", "U obradi", "Zatvoreno"], list: 1, w: 12 }] },

  equipment: { name: "Mjerna oprema i kalibracija", one: "Mjerni uređaj", prefix: "M", title: "name",
    ref: { iso9001: "7.1.5" },
    fields: [
      { k: "name", l: "Uređaj", t: "text", list: 1, w: 26 }, { k: "serial", l: "Serijski broj", t: "text", list: 1, w: 16 },
      { k: "location", l: "Lokacija", t: "text", w: 16 }, { k: "calibrated", l: "Zadnja kalibracija", t: "date", list: 1, w: 14 },
      { k: "next", l: "Sljedeća kalibracija", t: "date", list: 1, w: 14 }, { k: "lab", l: "Laboratorija", t: "text", w: 20 },
      { k: "status", l: "Status", t: "sel", o: ["Ispravan", "Van upotrebe", "Na kalibraciji"], list: 1, w: 14 }] },

  improvements: { name: "Registar poboljšanja", one: "Poboljšanje", prefix: "POB", title: "title",
    ref: { iso27001: "10.1", iso9001: "6.1.3, 10.1, 10.3", nis2: "Čl. 21(2)(f)", tisax: "1.5.1" },
    fields: [
      { k: "title", l: "Prilika za poboljšanje", t: "text", list: 1, w: 34 },
      { k: "source", l: "Izvor", t: "sel", o: ["Interni audit", "Eksterni audit", "Preispitivanje uprave", "Zaposleni", "Kupac", "Analiza rizika", "Incident", "Ostalo"], list: 1, w: 18 },
      { k: "benefit", l: "Očekivana korist", t: "area", w: 32 }, { k: "priority", l: "Prioritet", t: "sel", o: ["Nizak", "Srednji", "Visok"], list: 1, w: 11 },
      { k: "owner", l: "Odgovorni", t: "text", list: 1, w: 16 }, { k: "due", l: "Rok", t: "date", list: 1, w: 12 },
      { k: "status", l: "Status", t: "sel", o: ["Prijedlog", "Odobreno", "U provedbi", "Provedeno", "Odbijeno"], list: 1, w: 13 },
      { k: "result", l: "Rezultat", t: "area", w: 30 }] }
};
export const OPEN_STATUS = { improvements: ["Prijedlog", "Odobreno", "U provedbi"], incidents: ["Otvoren", "U obradi"], complaints: ["Otvoreno", "U obradi"] };
export const registersFor = std => Object.entries(REGISTERS).filter(([, r]) => r.ref[std]).map(([k]) => k);

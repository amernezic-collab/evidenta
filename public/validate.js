/* Evidenta: shared validation rules for legal-entity data (used by the browser and by the Worker). */
(function (root) {
  "use strict";
  const COUNTRIES = [
    ["BA", "Bosna i Hercegovina", "+387"], ["HR", "Hrvatska", "+385"], ["RS", "Srbija", "+381"], ["ME", "Crna Gora", "+382"], ["SI", "Slovenija", "+386"],
    ["MK", "Sjeverna Makedonija", "+389"], ["AT", "Austrija", "+43"], ["DE", "Njemačka", "+49"], ["IT", "Italija", "+39"], ["CH", "Švicarska", "+41"],
    ["NL", "Nizozemska", "+31"], ["FR", "Francuska", "+33"], ["SE", "Švedska", "+46"], ["GB", "Ujedinjeno Kraljevstvo", "+44"], ["US", "SAD", "+1"], ["XX", "Druga država", ""]];
  const EU = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
  /* company id, VAT and postal formats per country; "hint" is shown under the field */
  const RULES = {
    BA: { id: [/^4\d{12}$/, "13 cifara, za pravna lica počinje s 4 (JIB/IDB)"], vat: [/^\d{12}$/, "12 cifara (PDV broj)"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "Identifikacioni broj (JIB/IDB)", vatLabel: "PDV broj" },
    HR: { id: [/^\d{11}$/, "OIB, 11 cifara"], vat: [/^HR\d{11}$/, "HR i 11 cifara"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "OIB", vatLabel: "PDV ID (VAT)" },
    RS: { id: [/^\d{8}$/, "matični broj, 8 cifara"], vat: [/^\d{9}$/, "PIB, 9 cifara"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "Matični broj", vatLabel: "PIB" },
    ME: { id: [/^\d{8}$/, "PIB, 8 cifara"], vat: [/^\d{2}\/\d{2}-\d{5}-\d$|^\d{8,9}$/, "PDV broj"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "PIB", vatLabel: "PDV broj" },
    SI: { id: [/^\d{10}$/, "matična številka, 10 cifara"], vat: [/^SI\d{8}$/, "SI i 8 cifara"], zip: [/^\d{4}$/, "4 cifre"], idLabel: "Matična številka", vatLabel: "ID za DDV (VAT)" },
    AT: { id: [/^FN\s?\d{1,6}\s?[a-z]$/i, "Firmenbuchnummer, npr. FN 123456 a"], vat: [/^ATU\d{8}$/, "ATU i 8 cifara"], zip: [/^\d{4}$/, "4 cifre"], idLabel: "Firmenbuchnummer", vatLabel: "UID (VAT)" },
    DE: { id: [/^HR[AB]\s?\d{1,6}\s?[A-Z]?$/i, "npr. HRB 12345"], vat: [/^DE\d{9}$/, "DE i 9 cifara"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "Handelsregister (HRB/HRA)", vatLabel: "USt-IdNr. (VAT)" },
    IT: { id: [/^\d{11}$|^[A-Z]{2}\s?-?\s?\d{4,7}$/i, "Codice fiscale (11 cifara) ili REA"], vat: [/^IT\d{11}$/, "IT i 11 cifara"], zip: [/^\d{5}$/, "5 cifara"], idLabel: "Codice fiscale / REA", vatLabel: "Partita IVA (VAT)" },
    CH: { id: [/^CHE-?\d{3}\.?\d{3}\.?\d{3}$/, "UID, npr. CHE-123.456.789"], vat: [/^CHE-?\d{3}\.?\d{3}\.?\d{3}\s?(MWST|TVA|IVA)?$/, "CHE-123.456.789 MWST"], zip: [/^\d{4}$/, "4 cifre"], idLabel: "UID", vatLabel: "MWST (VAT)" }
  };
  const GENERIC = { id: [/^[A-Z0-9 .\/-]{4,30}$/i, "registarski broj firme"], vat: [/^[A-Z]{2}[A-Z0-9+*.]{2,13}$/, "oznaka države i broj, npr. NL123456789B01"], zip: [/^[A-Z0-9 -]{3,10}$/i, "poštanski broj"], idLabel: "Registarski broj", vatLabel: "VAT broj" };
  const rules = cc => Object.assign({}, GENERIC, RULES[cc] || {});
  const clean = s => String(s == null ? "" : s).trim();
  const compact = s => clean(s).replace(/[\s.\-\/]/g, "").toUpperCase();

  function ibanOk(v) {
    const s = compact(v); if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
    let m = 0; for (const d of r) m = (m * 10 + +d) % 97; return m === 1;
  }
  const IBAN_LEN = { BA: 20, HR: 21, RS: 22, ME: 22, SI: 19, AT: 20, DE: 22, IT: 27, CH: 21, NL: 18, FR: 27, SE: 24, GB: 22, MK: 19 };
  function phoneNorm(v, cc) {
    let s = clean(v).replace(/[^\d+]/g, ""); if (!s) return "";
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (!s.startsWith("+")) { const c = COUNTRIES.find(x => x[0] === cc); if (c && c[2] && s.startsWith("0")) s = c[2] + s.slice(1); }
    return s;
  }
  function phoneFmt(v, cc) {
    const s = phoneNorm(v, cc); if (!s.startsWith("+")) return s;
    const c = COUNTRIES.find(x => x[2] && s.startsWith(x[2])); if (!c) return s;
    const rest = s.slice(c[2].length), g = (rest.slice(2).match(/.{1,3}/g) || []);
    if (g.length > 1 && g[g.length - 1].length === 1) g[g.length - 2] += g.pop();
    return (c[2] + " " + rest.slice(0, 2) + " " + g.join(" ")).trim();
  }
  const EMAIL = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const URLRE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

  /* field spec: required = must be filled to save; invoice = must be filled before an invoice can be issued */
  const FIELDS = {
    name: { label: "Kratki naziv", required: true, max: 160 },
    legal_name: { label: "Puni pravni naziv", invoice: true, max: 200 },
    country_code: { label: "Država", required: true },
    address: { label: "Ulica i broj", invoice: true, max: 200 },
    postal_code: { label: "Poštanski broj", invoice: true, max: 12 },
    city: { label: "Grad", invoice: true, max: 100 },
    id_number: { label: "Identifikacioni broj", invoice: true, max: 40 },
    vat_number: { label: "PDV broj", max: 40 },
    court_reg: { label: "Registracija (sud, broj)", max: 200 },
    industry: { label: "Djelatnost", max: 120 },
    phone: { label: "Telefon firme", max: 30 },
    email: { label: "E-mail firme", max: 160 },
    invoice_email: { label: "E-mail za fakture", max: 160 },
    website: { label: "Web", max: 200 },
    iban: { label: "IBAN", max: 40 },
    contact_name: { label: "Kontakt osoba", max: 120 },
    contact_email: { label: "E-mail kontakt osobe", max: 160 },
    contact_phone: { label: "Telefon kontakt osobe", max: 30 },
    notes: { label: "Napomene", max: 4000 }
  };

  /* returns { value: normalised object, errors: {field: message}, missingForInvoice: [labels] } */
  function checkClient(input) {
    const v = {}, e = {}, cc = clean(input.country_code).toUpperCase(), R = rules(cc);
    for (const k of Object.keys(FIELDS)) { const x = clean(input[k]); v[k] = x.slice(0, FIELDS[k].max || 200); }
    v.country_code = cc;
    if (!v.name) e.name = "Obavezno polje.";
    if (!COUNTRIES.some(c => c[0] === cc)) e.country_code = "Izaberite državu.";
    if (v.id_number) { v.id_number = cc === "AT" || cc === "DE" || cc === "CH" ? clean(v.id_number).toUpperCase() : compact(v.id_number); if (!R.id[0].test(v.id_number)) e.id_number = "Neispravan format: " + R.id[1] + "."; }
    if (v.vat_number) { v.vat_number = compact(v.vat_number); if (cc === "CH") v.vat_number = clean(input.vat_number).toUpperCase(); if (!R.vat[0].test(v.vat_number)) e.vat_number = "Neispravan format: " + R.vat[1] + "."; }
    if (cc === "BA" && v.id_number && v.vat_number && !e.id_number && !e.vat_number && v.vat_number !== v.id_number.slice(1)) e.vat_number = "PDV broj u BiH je JIB bez prve cifre (" + v.id_number.slice(1) + ").";
    if (v.postal_code && !R.zip[0].test(v.postal_code)) e.postal_code = "Neispravan poštanski broj: " + R.zip[1] + ".";
    for (const k of ["email", "invoice_email", "contact_email"]) if (v[k]) { v[k] = v[k].toLowerCase(); if (!EMAIL.test(v[k])) e[k] = "Neispravna e-mail adresa, npr. ime@firma.ba."; }
    for (const k of ["phone", "contact_phone"]) if (v[k]) { const n = phoneNorm(v[k], cc); if (!/^\+\d{8,15}$/.test(n)) e[k] = "Unesite broj s pozivnim brojem države, npr. +387 61 123 456."; else v[k] = phoneFmt(n, cc); }
    if (v.website) { if (!URLRE.test(v.website)) e.website = "Neispravna web adresa, npr. www.firma.ba."; else v.website = v.website.replace(/^https?:\/\//i, "").replace(/\/$/, ""); }
    if (v.iban) { const s = compact(v.iban); const L = IBAN_LEN[s.slice(0, 2)]; if (!ibanOk(s) || (L && s.length !== L)) e.iban = "IBAN nije ispravan (provjera kontrolnog broja nije prošla)."; else v.iban = s.replace(/(.{4})/g, "$1 ").trim(); }
    const missingForInvoice = Object.entries(FIELDS).filter(([k, f]) => f.invoice && !v[k]).map(([k, f]) => k === "id_number" ? R.idLabel : f.label);
    return { value: v, errors: e, missingForInvoice };
  }

  /* issuer (SCE Assurance) settings */
  const ISSUER = {
    name: { label: "Naziv firme", required: true }, legal_form: { label: "Pravni oblik" }, address: { label: "Ulica i broj", required: true }, postal_code: { label: "Poštanski broj", required: true },
    city: { label: "Grad", required: true }, country_code: { label: "Država", required: true }, id_number: { label: "Identifikacioni broj (JIB/IDB)", required: true }, vat_payer: { label: "U sistemu PDV-a" },
    vat_number: { label: "PDV broj" }, court_reg: { label: "Registracija (sud, broj)" }, phone: { label: "Telefon" }, email: { label: "E-mail", required: true }, website: { label: "Web" },
    bank: { label: "Banka", required: true }, iban: { label: "IBAN", required: true }, swift: { label: "SWIFT/BIC" }, place: { label: "Mjesto izdavanja", required: true },
    prefix: { label: "Prefiks broja fakture" }, due_days: { label: "Rok plaćanja (dana)" }, vat_rate: { label: "Stopa PDV-a (%)" }, currency: { label: "Valuta" },
    signer_name: { label: "Potpisnik (ime i prezime)", required: true }, signer_title: { label: "Funkcija potpisnika" }, footer: { label: "Napomena u podnožju" }
  };
  function checkIssuer(input) {
    const c = checkClient({ ...input, name: input.name, legal_name: input.name }), v = {}, e = {};
    for (const k of Object.keys(ISSUER)) v[k] = clean(input[k]).slice(0, 300);
    Object.assign(v, { id_number: c.value.id_number, vat_number: c.value.vat_number, postal_code: c.value.postal_code, phone: c.value.phone, email: c.value.email, website: c.value.website, iban: c.value.iban, country_code: c.value.country_code });
    for (const k of ["id_number", "vat_number", "postal_code", "phone", "email", "website", "iban", "country_code"]) if (c.errors[k]) e[k] = c.errors[k];
    v.vat_payer = input.vat_payer === true || input.vat_payer === "1" || input.vat_payer === 1 ? 1 : 0;
    if (v.vat_payer && !v.vat_number) e.vat_number = "Obavezno ako je firma u sistemu PDV-a.";
    if (v.swift && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v.swift.toUpperCase())) e.swift = "SWIFT/BIC ima 8 ili 11 znakova."; else v.swift = v.swift.toUpperCase();
    v.prefix = (v.prefix || "SCE").replace(/[^A-Za-z0-9-]/g, "").slice(0, 10) || "SCE";
    v.due_days = String(Math.min(120, Math.max(0, parseInt(v.due_days, 10) || 15)));
    v.vat_rate = String(Math.min(50, Math.max(0, parseFloat(String(v.vat_rate).replace(",", ".")) || (v.vat_payer ? 17 : 0))));
    v.currency = ["BAM", "EUR"].includes(v.currency) ? v.currency : "BAM";
    const missing = Object.entries(ISSUER).filter(([k, f]) => f.required && !v[k]).map(([, f]) => f.label);
    return { value: v, errors: e, missing };
  }

  root.EVV = { COUNTRIES, EU, RULES, rules, FIELDS, ISSUER, checkClient, checkIssuer, ibanOk, phoneFmt, phoneNorm, EMAIL };
})(typeof globalThis !== "undefined" ? globalThis : window);

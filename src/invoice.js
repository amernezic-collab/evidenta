/*
 * Evidenta invoices: issuer settings, invoice drafts, issuing with electronic approval,
 * PDF on the SCE Assurance letterhead (pdf-lib), optional qualified-signed PDF upload, sharing with the client.
 */
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import FONT_400 from "./assets/archivo-400.ttf";
import FONT_600 from "./assets/archivo-600.ttf";
import FONT_700 from "./assets/archivo-700.ttf";
import LOGO from "./assets/shield.png";
import qrcode from "./qrcode.cjs";
import "../public/validate.js";
import { compose, sendInvoiceMail } from "./mailer.js";
const V = globalThis.EVV;

const MAX_PDF = 15 * 1024 * 1024;
let logoB64 = null;
const LOGO_B64 = () => logoB64 || (logoB64 = (() => { const u = new Uint8Array(LOGO); let x = ""; for (const c of u) x += String.fromCharCode(c); return btoa(x); })());
const STATUSES = ["draft", "issued", "shared", "paid", "cancelled"];

/* ---------- labels ---------- */
const L = {
  bs: { title: "FAKTURA", no: "Broj", issue: "Datum izdavanja", service: "Datum isporuke / period", due: "Rok plaćanja", place: "Mjesto izdavanja", currency: "Valuta",
    buyer: "KUPAC", pay: "PODACI ZA PLAĆANJE", bank: "Banka", iban: "IBAN", swift: "SWIFT/BIC", ref: "Poziv na broj", amount: "Iznos za uplatu",
    rb: "Rb.", desc: "Opis usluge", qty: "Kol.", unit: "JM", price: "Cijena", vat: "PDV", line: "Iznos",
    net: "Osnovica", vatof: "PDV", total: "UKUPNO ZA PLAĆANJE", issuedBy: "Fakturisao", approved: "ELEKTRONSKI ODOBRENO", code: "Kod za provjeru",
    draft: "NACRT", draftNote: "Nacrt, faktura još nije izdana ni odobrena.", id: "ID broj", vatno: "PDV broj", reg: "Registracija", page: "Stranica",
    cont: "nastavak", producedBy: "Izdano u sistemu Evidenta", vatNote: "Napomena o PDV-u", notes: "Napomena", phone: "Tel.", email: "E-mail", noVat: "Izdavalac nije u sistemu PDV-a." },
  en: { title: "INVOICE", no: "No.", issue: "Issue date", service: "Date of supply / period", due: "Due date", place: "Place of issue", currency: "Currency",
    buyer: "BILL TO", pay: "PAYMENT DETAILS", bank: "Bank", iban: "IBAN", swift: "SWIFT/BIC", ref: "Payment reference", amount: "Amount due",
    rb: "No.", desc: "Description", qty: "Qty", unit: "Unit", price: "Unit price", vat: "VAT", line: "Amount",
    net: "Net amount", vatof: "VAT", total: "TOTAL DUE", issuedBy: "Issued by", approved: "ELECTRONICALLY APPROVED", code: "Verification code",
    draft: "DRAFT", draftNote: "Draft, this invoice has not been issued or approved.", id: "Company ID", vatno: "VAT No.", reg: "Registration", page: "Page",
    cont: "continued", producedBy: "Issued with Evidenta", vatNote: "VAT note", notes: "Note", phone: "Phone", email: "E-mail", noVat: "The issuer is not registered for VAT." },
  de: { title: "RECHNUNG", no: "Nr.", issue: "Rechnungsdatum", service: "Leistungsdatum / -zeitraum", due: "Zahlbar bis", place: "Ausstellungsort", currency: "Währung",
    buyer: "RECHNUNGSEMPFÄNGER", pay: "ZAHLUNGSINFORMATIONEN", bank: "Bank", iban: "IBAN", swift: "SWIFT/BIC", ref: "Verwendungszweck", amount: "Zahlbetrag",
    rb: "Pos.", desc: "Leistung", qty: "Menge", unit: "Einh.", price: "Einzelpreis", vat: "USt.", line: "Betrag",
    net: "Nettobetrag", vatof: "USt.", total: "GESAMTBETRAG", issuedBy: "Ausgestellt von", approved: "ELEKTRONISCH FREIGEGEBEN", code: "Prüfcode",
    draft: "ENTWURF", draftNote: "Entwurf, die Rechnung wurde noch nicht ausgestellt.", id: "Firmen-ID", vatno: "USt-IdNr.", reg: "Register", page: "Seite",
    cont: "Fortsetzung", producedBy: "Ausgestellt mit Evidenta", vatNote: "Hinweis zur USt.", notes: "Hinweis", phone: "Tel.", email: "E-Mail", noVat: "Der Aussteller ist nicht umsatzsteuerpflichtig." }
};
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function fmtDate(d, lang) {
  if (!d) return "";
  const [y, m, dd] = d.slice(0, 10).split("-");
  return lang === "en" ? `${+dd} ${MONTHS_EN[+m - 1]} ${y}` : `${dd}.${m}.${y}${lang === "bs" ? "." : ""}`;
}
function fmtMoney(minor, lang) {
  const neg = minor < 0, a = Math.abs(Math.round(minor)), s = String(Math.floor(a / 100)), c = String(a % 100).padStart(2, "0");
  const [th, dec] = lang === "en" ? [",", "."] : [".", ","];
  return (neg ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, th) + dec + c;
}
const fmtQty = (q, lang) => { const s = (Math.round(q * 100) / 100).toString(); return lang === "en" ? s : s.replace(".", ","); };
const CUR = { BAM: "KM", EUR: "EUR" };
const countryName = cc => (V.COUNTRIES.find(c => c[0] === cc) || [])[1] || "";
const COUNTRY_EN = { BA: "Bosnia and Herzegovina", HR: "Croatia", RS: "Serbia", ME: "Montenegro", SI: "Slovenia", MK: "North Macedonia", AT: "Austria", DE: "Germany", IT: "Italy", CH: "Switzerland", NL: "Netherlands", FR: "France", SE: "Sweden", GB: "United Kingdom", US: "USA" };
const COUNTRY_DE = { BA: "Bosnien und Herzegowina", HR: "Kroatien", RS: "Serbien", ME: "Montenegro", SI: "Slowenien", MK: "Nordmazedonien", AT: "Österreich", DE: "Deutschland", IT: "Italien", CH: "Schweiz", NL: "Niederlande", FR: "Frankreich", SE: "Schweden", GB: "Vereinigtes Königreich", US: "USA" };
const countryIn = (cc, lang) => (lang === "en" ? COUNTRY_EN[cc] : lang === "de" ? COUNTRY_DE[cc] : null) || countryName(cc);

/* date and time of approval in Sarajevo time, e.g. "26.09.2026. 10:34 (CEST)" */
function localStamp(iso, lang) {
  const d = new Date(iso), p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sarajevo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" }).formatToParts(d).map(x => [x.type, x.value]));
  const tz = /^GMT\+2$/.test(p.timeZoneName) ? "CEST" : /^GMT\+1$/.test(p.timeZoneName) ? "CET" : p.timeZoneName;
  return `${fmtDate(`${p.year}-${p.month}-${p.day}`, lang)} ${p.hour}:${p.minute} (${tz})`;
}

/* ---------- totals ---------- */
export function totals(items) {
  const byRate = {};
  let subtotal = 0;
  for (const it of items) { const net = Math.round(it.qty * it.unit_price); subtotal += net; byRate[it.vat_rate] = (byRate[it.vat_rate] || 0) + net; }
  const vats = Object.entries(byRate).filter(([r]) => +r > 0).map(([r, base]) => ({ rate: +r, base, vat: Math.round(base * +r / 100) }));
  const vat_total = vats.reduce((a, v) => a + v.vat, 0);
  return { subtotal, vat_total, total: subtotal + vat_total, vats };
}

/* ---------- PDF ---------- */
const C = { navy: rgb(11 / 255, 42 / 255, 74 / 255), navy2: rgb(18 / 255, 60 / 255, 102 / 255), steel: rgb(61 / 255, 95 / 255, 140 / 255), orange: rgb(227 / 255, 114 / 255, 34 / 255),
  ink: rgb(27 / 255, 52 / 255, 82 / 255), muted: rgb(90 / 255, 104 / 255, 117 / 255), faint: rgb(138 / 255, 151 / 255, 166 / 255), line: rgb(213 / 255, 220 / 255, 228 / 255),
  soft: rgb(243 / 255, 246 / 255, 250 / 255), zebra: rgb(248 / 255, 250 / 255, 252 / 255), white: rgb(1, 1, 1) };

function wrap(text, font, size, width) {
  const out = [];
  for (const para of String(text || "").split(/\r?\n/)) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const t = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(t, size) <= width) { line = t; continue; }
      if (line) out.push(line);
      if (font.widthOfTextAtSize(w, size) <= width) { line = w; continue; }
      let part = ""; for (const ch of w) { if (font.widthOfTextAtSize(part + ch, size) > width) { out.push(part); part = ch; } else part += ch; } line = part;
    }
    out.push(line);
  }
  return out;
}
const rr = (w, h, r) => `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;

export async function buildPdf(inv, items, issuer, client, opt = {}) {
  const lang = L[inv.lang] ? inv.lang : "bs", T = L[lang], draft = inv.status === "draft";
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [R, M, B] = await Promise.all([FONT_400, FONT_600, FONT_700].map(f => doc.embedFont(f, { subset: true })));
  const logo = await doc.embedPng(LOGO);
  const W = 595.28, H = 841.89, X = 48, RX = W - 48, CW = RX - X, BOTTOM = 70;
  const cur = CUR[inv.currency] || inv.currency, tt = totals(items);
  const num = inv.number || T.draft;
  doc.setTitle(`${T.title} ${num}`); doc.setAuthor(issuer.name || "SCE Assurance"); doc.setSubject(`${T.title} ${num} · ${client.legal_name || client.name}`);
  doc.setCreator("Evidenta"); doc.setProducer("Evidenta (SCE Assurance)"); doc.setLanguage(lang === "bs" ? "bs-BA" : lang === "de" ? "de-DE" : "en-GB");
  if (inv.approved_at) doc.setCreationDate(new Date(inv.approved_at));

  const pages = [];
  let pg, y;
  const text = (s, x, yy, size, font = R, color = C.ink, o = {}) => { s = String(s ?? ""); if (o.right) x -= font.widthOfTextAtSize(s, size); if (o.center) x -= font.widthOfTextAtSize(s, size) / 2; pg.drawText(s, { x, y: yy, size, font, color, opacity: o.opacity }); };
  const spaced = (s, x, yy, size, font, color, sp) => { for (const ch of s) { pg.drawText(ch, { x, y: yy, size, font, color }); x += font.widthOfTextAtSize(ch, size) + sp; } return x; };
  const hline = (yy, x1 = X, x2 = RX, c = C.line, t = 0.6) => pg.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: t, color: c });

  function letterhead(first) {
    pg = doc.addPage([W, H]); pages.push(pg);
    pg.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.navy });
    pg.drawRectangle({ x: 0, y: H - 6, width: 120, height: 6, color: C.orange });
    const top = H - 44;
    pg.drawImage(logo, { x: X, y: top - 26, width: 36, height: 35.4 });
    text("SCE", X + 44, top - 8, 19, B, C.navy);
    spaced("ASSURANCE", X + 45, top - 21, 7.2, M, C.steel, 1.9);
    const lines = [
      [issuer.name + (issuer.legal_form ? " " + issuer.legal_form : ""), B, 9, C.navy],
      [[issuer.address, [issuer.postal_code, issuer.city].filter(Boolean).join(" "), countryIn(issuer.country_code, lang)].filter(Boolean).join(", "), R, 7.8, C.muted],
      [[issuer.id_number && `${T.id}: ${issuer.id_number}`, issuer.vat_payer && issuer.vat_number && `${T.vatno}: ${issuer.vat_number}`].filter(Boolean).join("  ·  "), R, 7.8, C.muted],
      [[issuer.email, issuer.website, issuer.phone].filter(Boolean).join("  ·  "), R, 7.8, C.muted]].filter(l => l[0]);
    let ly = top + 4;
    for (const [s, f, sz, c] of lines) { text(s, RX, ly, sz, f, c, { right: true }); ly -= sz + 4; }
    y = top - 44;
    hline(y, X, RX, C.line, 0.8); pg.drawLine({ start: { x: X, y }, end: { x: X + 56, y }, thickness: 2, color: C.orange });
    y -= 20;
    if (!first) { text(`${T.title} ${num} · ${T.cont}`, X, y, 9, M, C.muted); y -= 18; }
    if (draft) {
      pg.drawText(T.draft, { x: 120, y: 260, size: 120, font: B, color: C.navy, opacity: 0.05, rotate: degrees(35) });
    }
  }
  function ensure(h, tableHead) { if (y - h < BOTTOM) { letterhead(false); if (tableHead) tableHead(); } }

  letterhead(true);
  /* title and dates */
  text(T.title, X, y - 20, 26, B, C.navy);
  text(`${T.no} ${num}`, X, y - 40, 11.5, M, draft ? C.orange : C.steel);
  const meta = [[T.issue, fmtDate(inv.issue_date, lang)], [T.service, inv.service_date || ""], [T.due, fmtDate(inv.due_date, lang)], [T.place, inv.place || issuer.place || ""], [T.currency, inv.currency === "BAM" ? "BAM (KM)" : inv.currency]].filter(r => r[1]);
  let my = y - 6; const mx = RX - 230;
  for (const [k, v] of meta) { text(k, mx, my, 8, R, C.muted); text(v, RX, my, 8.8, M, C.ink, { right: true }); my -= 14; }
  y = Math.min(y - 60, my - 6);

  /* parties */
  const bw = (CW - 14) / 2, cc = client.country_code;
  const buyer = [
    [client.legal_name || client.name, B, 10.5, C.navy],
    [client.address, R, 8.8], [[client.postal_code, client.city].filter(Boolean).join(" "), R, 8.8], [countryIn(cc, lang), R, 8.8],
    [client.id_number && `${lang === "bs" ? (V.rules(cc).idLabel || T.id) : T.id}: ${client.id_number}`, R, 8.2, C.muted],
    [client.vat_number && `${T.vatno}: ${client.vat_number}`, R, 8.2, C.muted],
    [client.court_reg && `${T.reg}: ${client.court_reg}`, R, 8.2, C.muted],
    [(client.invoice_email || client.email) && `${T.email}: ${client.invoice_email || client.email}`, R, 8.2, C.muted]].filter(l => l[0]);
  const pay = [[T.bank, issuer.bank], [T.iban, issuer.iban], [T.swift, issuer.swift], [T.ref, inv.number || "–"], [T.amount, `${fmtMoney(tt.total, lang)} ${cur}`]].filter(r => r[1]);
  const bLines = buyer.flatMap(([s, f, sz, c]) => wrap(s, f, sz, bw - 28).map(l => [l, f, sz, c]));
  const bh = Math.max(28 + bLines.reduce((a, l) => a + l[2] + 4.2, 0), 28 + pay.length * 15) + 8;
  for (const [i, bx] of [[0, X], [1, X + bw + 14]].map((v, i) => [i, v[1]])) {
    pg.drawSvgPath(rr(bw, bh, 8), { x: bx, y, color: i ? C.white : C.soft, borderColor: i ? C.line : undefined, borderWidth: i ? 0.8 : 0 });
  }
  spaced(T.buyer, X + 14, y - 18, 7, B, C.orange, 1.1);
  let by = y - 34;
  for (const [s, f, sz, c] of bLines) { text(s, X + 14, by, sz, f, c || C.ink); by -= sz + 4.2; }
  const px = X + bw + 14;
  spaced(T.pay, px + 14, y - 18, 7, B, C.orange, 1.1);
  let py = y - 34;
  for (const [k, v] of pay) { text(k, px + 14, py, 8, R, C.muted); const last = k === T.amount; text(v, px + bw - 14, py, last ? 9.5 : 8.6, last ? B : M, last ? C.navy : C.ink, { right: true }); py -= 15; }
  y -= bh + 22;

  /* items table */
  const cols = [{ k: "rb", w: 24 }, { k: "desc", w: 0 }, { k: "qty", w: 40, r: 1 }, { k: "unit", w: 38 }, { k: "price", w: 72, r: 1 }, { k: "vat", w: 38, r: 1 }, { k: "line", w: 80, r: 1 }];
  cols[1].w = CW - cols.reduce((a, c) => a + c.w, 0);
  let cx = X; for (const c of cols) { c.x = cx; cx += c.w; }
  const pad = 7;
  const head = () => {
    pg.drawSvgPath(rr(CW, 22, 5), { x: X, y, color: C.navy });
    for (const c of cols) { const lab = T[c.k] + (c.k === "price" || c.k === "line" ? ` (${cur})` : ""); text(lab, c.r ? c.x + c.w - pad : c.x + pad, y - 14.5, 7.6, M, C.white, { right: !!c.r }); }
    y -= 22;
  };
  ensure(60); head();
  items.forEach((it, i) => {
    const d = wrap(it.description, R, 8.8, cols[1].w - pad * 2), rh = Math.max(20, d.length * 11.5 + 9);
    ensure(rh, head);
    if (i % 2) pg.drawRectangle({ x: X, y: y - rh, width: CW, height: rh, color: C.zebra });
    const ty = y - 13.5;
    text(String(i + 1), cols[0].x + pad, ty, 8.5, R, C.muted);
    d.forEach((l, j) => text(l, cols[1].x + pad, ty - j * 11.5, 8.8, j ? R : M, C.ink));
    text(fmtQty(it.qty, lang), cols[2].x + cols[2].w - pad, ty, 8.8, R, C.ink, { right: true });
    text(it.unit || "", cols[3].x + pad, ty, 8.5, R, C.muted);
    text(fmtMoney(it.unit_price, lang), cols[4].x + cols[4].w - pad, ty, 8.8, R, C.ink, { right: true });
    text(it.vat_rate ? `${fmtQty(it.vat_rate, lang)}%` : "–", cols[5].x + cols[5].w - pad, ty, 8.5, R, C.muted, { right: true });
    text(fmtMoney(Math.round(it.qty * it.unit_price), lang), cols[6].x + cols[6].w - pad, ty, 8.8, M, C.ink, { right: true });
    y -= rh;
    hline(y, X, RX, C.line, 0.4);
  });
  y -= 14;

  /* totals + notes */
  const tw = 236, tx = RX - tw;
  const trows = [[T.net, fmtMoney(tt.subtotal, lang)], ...tt.vats.map(v => [`${T.vatof} ${fmtQty(v.rate, lang)}% (${fmtMoney(v.base, lang)})`, fmtMoney(v.vat, lang)])];
  const vatNote = inv.vat_note || (!issuer.vat_payer ? T.noVat : "");
  const noteLines = [...(vatNote ? [[T.vatNote, wrap(vatNote, R, 8, tx - X - 20)]] : []), ...(inv.notes ? [[T.notes, wrap(inv.notes, R, 8, tx - X - 20)]] : [])];
  const nh = noteLines.reduce((a, [, ls]) => a + 14 + ls.length * 10.5 + 6, 0);
  const th = trows.length * 17 + 40;
  ensure(Math.max(th, nh) + 10);
  let ty2 = y;
  for (const [k, v] of trows) { text(k, tx + 10, ty2 - 12, 8.6, R, C.muted); text(`${v} ${cur}`, RX - 10, ty2 - 12, 9, M, C.ink, { right: true }); ty2 -= 17; }
  pg.drawSvgPath(rr(tw, 32, 6), { x: tx, y: ty2 - 4, color: C.navy });
  text(T.total, tx + 12, ty2 - 23.5, 8, B, rgb(0.95, 0.63, 0.37));
  text(`${fmtMoney(tt.total, lang)} ${cur}`, RX - 12, ty2 - 24.5, 13.5, B, C.white, { right: true });
  let ny = y - 4;
  for (const [h, ls] of noteLines) { spaced(h.toUpperCase(), X, ny - 8, 6.8, B, C.steel, 0.9); ny -= 20; for (const l of ls) { text(l, X, ny, 8, R, C.ink); ny -= 10.5; } ny -= 6; }
  y = Math.min(ty2 - 36, ny) - 26;

  /* issued by + electronic approval */
  ensure(92);
  text(T.issuedBy.toUpperCase(), X, y, 7, B, C.steel);
  text(issuer.signer_name || "", X, y - 16, 10, M, C.navy);
  if (issuer.signer_title) text(issuer.signer_title, X, y - 29, 8.4, R, C.muted);
  text(issuer.name || "", X, y - (issuer.signer_title ? 41 : 29), 8.4, R, C.muted);
  const ax = X + CW / 2 + 6, aw = RX - ax, ah = 78;
  pg.drawSvgPath(rr(aw, ah, 8), { x: ax, y: y + 10, color: C.soft });
  pg.drawRectangle({ x: ax + 7, y: y + 10 - ah + 14, width: 2.4, height: ah - 28, color: draft ? C.faint : C.orange });
  if (draft) {
    text(T.draft, ax + 16, y - 8, 9, B, C.faint);
    wrap(T.draftNote, R, 8, aw - 30).forEach((l, i) => text(l, ax + 16, y - 24 - i * 11, 8, R, C.muted));
  } else {
    const qs = 58, qx = RX - qs - 10, qy = y + 10 - 10 - qs;
    try {
      const q = qrcode(0, "M"); q.addData(`EVIDENTA|${inv.number}|${inv.issue_date}|${fmtMoney(tt.total, "en")} ${inv.currency}|${inv.verify_code}`); q.make();
      const n = q.getModuleCount(), s = qs / n;
      pg.drawRectangle({ x: qx - 3, y: qy - 3, width: qs + 6, height: qs + 6, color: C.white });
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) pg.drawRectangle({ x: qx + c * s, y: qy + qs - (r + 1) * s, width: s + 0.05, height: s + 0.05, color: C.navy });
    } catch (e) { /* QR is decorative; approval text below is authoritative */ }
    spaced(T.approved, ax + 16, y - 6, 6.8, B, C.orange, 0.8);
    text(inv.approved_name || inv.approved_by || "", ax + 16, y - 22, 9.6, M, C.navy);
    text(localStamp(inv.approved_at, lang), ax + 16, y - 35, 8, R, C.muted);
    text(`${T.code}:`, ax + 16, y - 50, 7.4, R, C.muted);
    text(inv.verify_code || "", ax + 16, y - 61, 9, B, C.ink);
  }
  y -= 96;

  /* footer on every page */
  pages.forEach((p, i) => {
    pg = p;
    hline(46, X, RX, C.line, 0.6);
    const foot = [issuer.name + (issuer.legal_form ? " " + issuer.legal_form : ""), issuer.court_reg, issuer.id_number && `${T.id} ${issuer.id_number}`].filter(Boolean).join("  ·  ");
    text(foot, X, 34, 7, R, C.faint);
    if (issuer.footer && lang === "bs") wrap(issuer.footer, R, 7, CW - 90).slice(0, 1).forEach(l => text(l, X, 24, 7, R, C.faint));
    text(`${T.page} ${i + 1}/${pages.length}`, RX, 34, 7, M, C.muted, { right: true });
    text(T.producedBy, RX, 24, 6.6, R, C.faint, { right: true });
  });
  return doc.save({ useObjectStreams: true });
}

/* ---------- helpers ---------- */
async function sha256hex(buf) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map(b => b.toString(16).padStart(2, "0")).join(""); }
function verifyCode() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = crypto.getRandomValues(new Uint8Array(12)); const s = [...b].map(x => A[x % 32]).join(""); return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`; }
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const clip = (v, n) => { const s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n); return s || null; };

export async function getIssuer(env) {
  const r = await env.DB.prepare("SELECT v FROM app_settings WHERE k='issuer'").first();
  let v = {}; try { v = r ? JSON.parse(r.v) : {}; } catch {}
  const c = V.checkIssuer({ name: "SCE Assurance", country_code: "BA", prefix: "SCE", due_days: 15, currency: "BAM", place: "Sarajevo", mail_name: "SCE Assurance", ...v });
  return { ...c.value, missing: c.missing };
}

export async function settingsApi(req, env, u, p, H) {
  const { json, err, body, log, now } = H;
  if (u.kind !== "admin") return err(403, "admin_only");
  if (p[1] !== "issuer") return err(404, "not_found");
  if (req.method === "GET") return json(await getIssuer(env));
  if (req.method === "PUT") {
    const c = V.checkIssuer(await body(req));
    if (Object.keys(c.errors).length) return json({ error: "invalid", fields: c.errors }, 400);
    await env.DB.prepare("INSERT INTO app_settings (k,v,updated_at,updated_by) VALUES ('issuer',?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at, updated_by=excluded.updated_by")
      .bind(JSON.stringify(c.value), now(), u.email).run();
    await log(env, u.email, "update", "settings", "issuer", null, { title: "Podaci izdavaoca faktura" });
    return json({ ok: true, missing: c.missing });
  }
  return err(405, "method");
}

function readItems(list, defRate) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 100).map(x => ({
    description: clip(x.description, 1000),
    qty: Math.round(Math.max(0, Math.min(1e6, parseFloat(String(x.qty ?? 1).replace(",", ".")) || 0)) * 100) / 100,
    unit: clip(x.unit, 12),
    unit_price: Math.round(Math.max(-1e9, Math.min(1e9, parseFloat(String(x.unit_price ?? 0).replace(/\s/g, "").replace(",", ".")) || 0)) * 100),
    vat_rate: Math.max(0, Math.min(50, parseFloat(String(x.vat_rate ?? defRate).replace(",", ".")) || 0))
  })).filter(x => x.description);
}
async function loadInvoice(env, id) {
  const inv = await env.DB.prepare("SELECT i.*, c.name client_name FROM invoices i JOIN clients c ON c.id=i.client_id WHERE i.id=?").bind(id).first();
  if (!inv) return null;
  inv.items = (await env.DB.prepare("SELECT description, qty, unit, unit_price, vat_rate FROM invoice_items WHERE invoice_id=? ORDER BY pos").bind(id).all()).results;
  return inv;
}
async function saveItems(env, id, items) {
  const st = [env.DB.prepare("DELETE FROM invoice_items WHERE invoice_id=?").bind(id),
    ...items.map((it, i) => env.DB.prepare("INSERT INTO invoice_items (invoice_id,pos,description,qty,unit,unit_price,vat_rate) VALUES (?,?,?,?,?,?,?)").bind(id, i + 1, it.description, it.qty, it.unit, it.unit_price, it.vat_rate))];
  const t = totals(items);
  st.push(env.DB.prepare("UPDATE invoices SET subtotal=?, vat_total=?, total=? WHERE id=?").bind(t.subtotal, t.vat_total, t.total, id));
  await env.DB.batch(st);
}
const clientRow = (env, id) => env.DB.prepare("SELECT * FROM clients WHERE id=?").bind(id).first();
const pdfName = inv => `${(inv.number || "nacrt-" + inv.id.slice(0, 8))}_${(inv.client_name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "_").slice(0, 40)}.pdf`;
const pdfResp = (bytes, name, inline) => new Response(bytes, { headers: { "content-type": "application/pdf", "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`, "cache-control": "no-store", "x-content-type-options": "nosniff" } });

export async function invoicesApi(req, env, u, p, url, H) {
  const { json, err, body, log, now, uid } = H;
  const m = req.method, admin = u.kind === "admin", client = u.kind === "client";
  if (!admin && !client) return err(403, "admin_only");

  /* list */
  if (!p[1] && m === "GET") {
    const q = admin ? env.DB.prepare(`SELECT i.id, i.number, i.status, i.client_id, i.project_id, i.lang, i.currency, i.issue_date, i.due_date, i.total, i.subtotal, i.vat_total, i.shared_at, i.client_viewed_at, i.paid_at, i.signed_at, i.created_at, c.name client_name
        FROM invoices i JOIN clients c ON c.id=i.client_id ORDER BY i.status='draft' DESC, i.year DESC, i.seq DESC, i.created_at DESC`)
      : env.DB.prepare(`SELECT i.id, i.number, i.status, i.currency, i.issue_date, i.due_date, i.total, i.paid_at, i.signed_at, i.shared_at, c.name client_name FROM invoices i JOIN clients c ON c.id=i.client_id
        WHERE i.client_id=? AND i.shared_at IS NOT NULL ORDER BY i.year DESC, i.seq DESC`).bind(u.client_id || "-");
    return json((await q.all()).results);
  }
  /* create draft */
  if (!p[1] && m === "POST") {
    if (!admin) return err(403, "admin_only");
    const b = await body(req), iss = await getIssuer(env);
    const c = await clientRow(env, String(b.client_id || "")); if (!c) return err(400, "client");
    const id = uid(), issue = isDate(b.issue_date) ? b.issue_date : today();
    const defRate = c.country_code && c.country_code !== "BA" ? 0 : (iss.vat_payer ? +iss.vat_rate : 0);
    await env.DB.prepare(`INSERT INTO invoices (id,client_id,project_id,status,lang,currency,issue_date,service_date,due_date,place,vat_note,notes,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id, c.id, clip(b.project_id, 64), "draft", L[b.lang] ? b.lang : (c.country_code === "AT" || c.country_code === "DE" || c.country_code === "CH" ? "de" : c.country_code && c.country_code !== "BA" && c.country_code !== "HR" && c.country_code !== "RS" && c.country_code !== "ME" ? "en" : "bs"),
        ["BAM", "EUR"].includes(b.currency) ? b.currency : (c.country_code && c.country_code !== "BA" ? "EUR" : iss.currency), issue, clip(b.service_date, 60),
        isDate(b.due_date) ? b.due_date : addDays(issue, +iss.due_days || 15), clip(b.place, 60) || iss.place, clip(b.vat_note, 600), clip(b.notes, 2000), now(), u.email, now()).run();
    const items = readItems(b.items, defRate);
    if (items.length) await saveItems(env, id, items);
    await log(env, u.email, "create", "invoice", id, null, { title: "Nacrt fakture · " + c.name });
    return json({ id, default_vat: defRate }, 201);
  }
  if (!p[1]) return err(405, "method");

  const inv = await loadInvoice(env, p[1]);
  if (!inv) return err(404, "invoice");
  if (client && (inv.client_id !== u.client_id || !inv.shared_at)) return err(404, "invoice");
  const act = p[2];

  if (!act && m === "GET") {
    if (client) {
      const { client_snapshot, issuer_snapshot, created_by, approved_by, pdf_key, signed_key, ...pub } = inv;
      return json({ ...pub, signed: !!signed_key });
    }
    const c = await clientRow(env, inv.client_id), iss = await getIssuer(env), cc = V.checkClient(c || {});
    return json({ ...inv, client: c, client_missing: cc.missingForInvoice, issuer_missing: iss.missing, issuer_vat_payer: !!iss.vat_payer, issuer_vat_rate: +iss.vat_rate, totals: totals(inv.items) });
  }

  if (act === "pdf" && m === "GET") {
    const inline = url.searchParams.get("inline") === "1";
    if (inv.status === "draft") {
      if (!admin) return err(404, "invoice");
      const bytes = await buildPdf(inv, inv.items, await getIssuer(env), await clientRow(env, inv.client_id) || {});
      return pdfResp(bytes, pdfName(inv), inline);
    }
    const want = url.searchParams.get("v");
    const key = want === "original" || !inv.signed_key ? inv.pdf_key : inv.signed_key;
    const obj = await env.FILES.get(key);
    if (!obj) return err(404, "file");
    if (client) {
      if (!inv.client_viewed_at) await env.DB.prepare("UPDATE invoices SET client_viewed_at=? WHERE id=?").bind(now(), inv.id).run();
      await log(env, u.email, "download", "invoice", inv.id, null, { title: inv.number });
    }
    return pdfResp(obj.body, pdfName(inv).replace(/\.pdf$/, key === inv.signed_key ? "_potpisano.pdf" : ".pdf"), inline);
  }

  if (!admin) return err(403, "admin_only");

  if (!act && m === "PUT") {
    if (inv.status !== "draft") return err(400, "not_draft");
    const b = await body(req);
    const c = b.client_id ? await clientRow(env, String(b.client_id)) : null;
    if (b.client_id && !c) return err(400, "client");
    await env.DB.prepare(`UPDATE invoices SET client_id=?, project_id=?, lang=?, currency=?, issue_date=?, service_date=?, due_date=?, place=?, vat_note=?, notes=?, updated_at=? WHERE id=?`)
      .bind(c ? c.id : inv.client_id, clip(b.project_id, 64), L[b.lang] ? b.lang : inv.lang, ["BAM", "EUR"].includes(b.currency) ? b.currency : inv.currency,
        isDate(b.issue_date) ? b.issue_date : inv.issue_date, clip(b.service_date, 60), isDate(b.due_date) ? b.due_date : inv.due_date, clip(b.place, 60), clip(b.vat_note, 600), clip(b.notes, 2000), now(), inv.id).run();
    if (b.items) await saveItems(env, inv.id, readItems(b.items, 0));
    return json({ ok: true });
  }
  if (!act && m === "DELETE") {
    if (inv.status !== "draft") return err(400, "not_draft");
    await env.DB.batch([env.DB.prepare("DELETE FROM invoice_items WHERE invoice_id=?").bind(inv.id), env.DB.prepare("DELETE FROM invoices WHERE id=?").bind(inv.id)]);
    await log(env, u.email, "delete", "invoice", inv.id, null, { title: "Nacrt fakture" });
    return json({ ok: true });
  }

  /* issue: number, snapshot, electronic approval, immutable PDF in R2 */
  if (act === "issue" && m === "POST") {
    if (inv.status !== "draft") return err(400, "not_draft");
    const iss = await getIssuer(env), c = await clientRow(env, inv.client_id), cc = V.checkClient(c || {});
    if (iss.missing.length) return json({ error: "issuer_incomplete", missing: iss.missing }, 400);
    if (cc.missingForInvoice.length) return json({ error: "client_incomplete", missing: cc.missingForInvoice }, 400);
    if (!inv.items.length) return err(400, "no_items");
    const t = totals(inv.items); if (t.total <= 0) return err(400, "zero_total");
    const year = +String(inv.issue_date || today()).slice(0, 4);
    const me = await env.DB.prepare("SELECT name FROM users WHERE email=?").bind(u.email).first();
    let number, seq;
    for (let attempt = 0; attempt < 5; attempt++) {
      seq = ((await env.DB.prepare("SELECT MAX(seq) s FROM invoices WHERE year=?").bind(year).first()) || {}).s + 1 || 1;
      number = `${iss.prefix}-${year}-${String(seq).padStart(4, "0")}`;
      const r = await env.DB.prepare("UPDATE invoices SET number=?, year=?, seq=?, status='issuing' WHERE id=? AND status='draft' AND NOT EXISTS (SELECT 1 FROM invoices WHERE year=? AND seq=?)").bind(number, year, seq, inv.id, year, seq).run().catch(() => ({ meta: { changes: 0 } }));
      if (r.meta.changes) break;
      number = null;
    }
    if (!number) return err(409, "numbering");
    const code = verifyCode(), at = now();
    const snapC = { ...cc.value }, snapI = { ...iss }; delete snapI.missing;
    const full = { ...inv, number, year, seq, status: "issued", approved_by: u.email, approved_name: (me && me.name) || iss.signer_name || u.email, approved_at: at, verify_code: code, place: inv.place || iss.place };
    try {
      const bytes = await buildPdf(full, inv.items, snapI, snapC);
      const hash = await sha256hex(bytes), key = `invoices/${year}/${number}_${inv.id.slice(0, 8)}.pdf`;
      await env.FILES.put(key, bytes, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { invoice: inv.id, number, sha256: hash, by: u.email } });
      await env.DB.prepare(`UPDATE invoices SET status='issued', client_snapshot=?, issuer_snapshot=?, pdf_key=?, pdf_sha256=?, approved_by=?, approved_name=?, approved_at=?, verify_code=?, place=?, subtotal=?, vat_total=?, total=?, updated_at=? WHERE id=?`)
        .bind(JSON.stringify(snapC), JSON.stringify(snapI), key, hash, u.email, full.approved_name, at, code, full.place, t.subtotal, t.vat_total, t.total, at, inv.id).run();
      await log(env, u.email, "create", "invoice", inv.id, inv.project_id, { title: `Faktura ${number} izdana i elektronski odobrena` });
      return json({ ok: true, number, sha256: hash });
    } catch (e) {
      await env.DB.prepare("UPDATE invoices SET number=NULL, year=NULL, seq=NULL, status='draft' WHERE id=?").bind(inv.id).run();
      return err(500, "pdf_failed");
    }
  }

  /* qualified signature: upload the PDF signed locally (e.g. in Adobe Acrobat with a qualified certificate) */
  if (act === "signed" && m === "POST") {
    if (!["issued", "shared", "paid"].includes(inv.status)) return err(400, "not_issued");
    const f = (await req.formData()).get("file");
    if (!f || typeof f === "string") return err(400, "file");
    if (f.size > MAX_PDF) return err(413, "too_large");
    const buf = await f.arrayBuffer(), head = new TextDecoder().decode(buf.slice(0, 5));
    if (head !== "%PDF-") return err(400, "not_pdf");
    const txt = new TextDecoder("latin1").decode(buf);
    if (!/\/ByteRange\s*\[/.test(txt) || !/\/(adbe\.pkcs7\.detached|ETSI\.CAdES\.detached|adbe\.pkcs7\.sha1)/.test(txt)) return err(400, "no_signature");
    const hash = await sha256hex(buf), key = inv.pdf_key.replace(/\.pdf$/, "_signed.pdf");
    await env.FILES.put(key, buf, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { invoice: inv.id, sha256: hash, by: u.email } });
    await env.DB.prepare("UPDATE invoices SET signed_key=?, signed_sha256=?, signed_at=?, signed_by=?, updated_at=? WHERE id=?").bind(key, hash, now(), u.email, now(), inv.id).run();
    await log(env, u.email, "upload", "invoice", inv.id, null, { title: `Faktura ${inv.number}: učitan kvalifikovano potpisan PDF` });
    return json({ ok: true, sha256: hash });
  }
  if (act === "signed" && m === "DELETE") {
    if (!inv.signed_key) return json({ ok: true });
    await env.FILES.delete(inv.signed_key);
    await env.DB.prepare("UPDATE invoices SET signed_key=NULL, signed_sha256=NULL, signed_at=NULL, signed_by=NULL WHERE id=?").bind(inv.id).run();
    await log(env, u.email, "delete", "invoice", inv.id, null, { title: `Faktura ${inv.number}: uklonjen potpisani PDF` });
    return json({ ok: true });
  }
  if (act === "share" && m === "POST") {
    if (inv.status !== "issued") return err(400, "not_issued");
    await env.DB.prepare("UPDATE invoices SET status='shared', shared_at=?, shared_by=?, updated_at=? WHERE id=?").bind(now(), u.email, now(), inv.id).run();
    await log(env, u.email, "update", "invoice", inv.id, null, { title: `Faktura ${inv.number} podijeljena s klijentom` });
    return json({ ok: true });
  }
  if (act === "paid" && m === "POST") {
    if (!["issued", "shared"].includes(inv.status)) return err(400, "state");
    const b = await body(req);
    await env.DB.prepare("UPDATE invoices SET status='paid', paid_at=?, updated_at=? WHERE id=?").bind(isDate(b.paid_at) ? b.paid_at : today(), now(), inv.id).run();
    await log(env, u.email, "update", "invoice", inv.id, null, { title: `Faktura ${inv.number} plaćena` });
    return json({ ok: true });
  }
  /* e-mail with the PDF attached (Cloudflare Email Service) */
  if (act === "email" && m === "GET") {
    const iss = await getIssuer(env), c = await clientRow(env, inv.client_id) || {};
    const portal = (await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE kind='client' AND client_id=?").bind(inv.client_id).first()).n;
    const log2 = (await env.DB.prepare("SELECT kind, recipients, subject, status, error, sent_at, sent_by FROM invoice_emails WHERE invoice_id=? ORDER BY sent_at DESC").bind(inv.id).all()).results;
    const pv = { invoice: compose(inv, iss, { kind: "invoice", portalUrl: portal ? "#" : null }), reminder: compose(inv, iss, { kind: "reminder", portalUrl: portal ? "#" : null }) };
    return json({ to: [c.invoice_email || c.email].filter(Boolean), cc: [c.contact_email].filter(e => e && e !== (c.invoice_email || c.email)), from: iss.mail_from, from_name: iss.mail_name,
      reply_to: iss.mail_reply || iss.email, copy_to: iss.mail_copy ? iss.email : null, portal_users: portal, configured: !!(env.EMAIL && iss.mail_from),
      subjects: { invoice: pv.invoice.subject, reminder: pv.reminder.subject }, history: log2 });
  }
  if (act === "email" && p[3] === "preview" && m === "POST") {
    const b = await body(req), iss = await getIssuer(env);
    const snapI = inv.issuer_snapshot ? { ...iss, ...JSON.parse(inv.issuer_snapshot) } : iss;
    const mail = compose(inv, snapI, { kind: b.kind === "reminder" ? "reminder" : "invoice", message: b.message, subject: b.subject, portalUrl: b.portal ? "https://app.evidenta.io/#/invoices/" + inv.id : null, signed: !!inv.signed_key });
    return new Response(mail.html.replace('src="cid:sce-logo"', 'src="data:image/png;base64,' + LOGO_B64() + '"'), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'" } });
  }
  if (act === "email" && m === "POST" && !p[3]) {
    if (!["issued", "shared", "paid"].includes(inv.status)) return err(400, "not_issued");
    const b = await body(req), kind = b.kind === "reminder" ? "reminder" : "invoice";
    if (kind === "reminder" && inv.status === "paid") return err(400, "state");
    const list = x => [...new Set((Array.isArray(x) ? x : String(x || "").split(/[,;\s]+/)).map(e => String(e).trim().toLowerCase()).filter(Boolean))];
    const to = list(b.to), cc = list(b.cc);
    if (!to.length) return json({ error: "invalid", fields: { to: "Unesite barem jednu adresu." } }, 400);
    const bad = [...to, ...cc].filter(e => !V.EMAIL.test(e));
    if (bad.length) return json({ error: "invalid", fields: { to: "Neispravna adresa: " + bad.join(", ") } }, 400);
    if (to.length + cc.length > 10) return json({ error: "invalid", fields: { to: "Najviše 10 primalaca." } }, 400);
    const iss = await getIssuer(env);
    if (!iss.mail_from) return err(400, "mail_from_missing");
    const portal = (await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE kind='client' AND client_id=?").bind(inv.client_id).first()).n;
    const portalUrl = portal && b.portal !== false ? `https://app.evidenta.io/#/invoices/${inv.id}` : null;
    const snapI = inv.issuer_snapshot ? { ...iss, ...JSON.parse(inv.issuer_snapshot), mail_from: iss.mail_from, mail_name: iss.mail_name } : iss;
    const mail = compose(inv, snapI, { kind, message: b.message, subject: b.subject, portalUrl, signed: !!inv.signed_key });
    const obj = await env.FILES.get(inv.signed_key || inv.pdf_key);
    if (!obj) return err(404, "file");
    const pdf = await obj.arrayBuffer();
    const filename = `${inv.number}${inv.signed_key ? "_potpisano" : ""}.pdf`;
    const bcc = iss.mail_copy && iss.email && !to.includes(iss.email) && !cc.includes(iss.email) ? [iss.email] : [];
    const id = uid(), at = now(), rec = JSON.stringify({ to, cc, bcc });
    try {
      const r = await sendInvoiceMail(env, { from: iss.mail_from, fromName: iss.mail_name, replyTo: iss.mail_reply || iss.email || undefined, to, cc, bcc, subject: mail.subject, html: mail.html, text: mail.text, pdf, filename });
      await env.DB.prepare("INSERT INTO invoice_emails (id,invoice_id,kind,recipients,subject,status,message_id,sent_at,sent_by) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, inv.id, kind, rec, mail.subject, "sent", (r && r.messageId) || null, at, u.email).run();
      if (inv.status === "issued" && b.share !== false) await env.DB.prepare("UPDATE invoices SET status='shared', shared_at=?, shared_by=?, updated_at=? WHERE id=?").bind(at, u.email, at, inv.id).run();
      await log(env, u.email, "export", "invoice", inv.id, null, { title: `Faktura ${inv.number}: ${kind === "reminder" ? "podsjetnik" : "e-mail"} poslan na ${[...to, ...cc].join(", ")}` });
      return json({ ok: true, message_id: r && r.messageId });
    } catch (e) {
      const code = String(e.code || e.message || "send_failed").slice(0, 120);
      await env.DB.prepare("INSERT INTO invoice_emails (id,invoice_id,kind,recipients,subject,status,error,sent_at,sent_by) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, inv.id, kind, rec, mail.subject, "failed", String(e.message || code).slice(0, 500), at, u.email).run();
      return json({ error: code === "email_not_configured" ? code : "send_failed", detail: String(e.message || "").slice(0, 300) }, 502);
    }
  }
  if (act === "cancel" && m === "POST") {
    if (!["issued", "shared"].includes(inv.status)) return err(400, "state");
    await env.DB.prepare("UPDATE invoices SET status='cancelled', cancelled_at=?, updated_at=? WHERE id=?").bind(now(), now(), inv.id).run();
    await log(env, u.email, "update", "invoice", inv.id, null, { title: `Faktura ${inv.number} stornirana` });
    return json({ ok: true });
  }
  return err(404, "not_found");
}
export { STATUSES };

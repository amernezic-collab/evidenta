/*
 * Invoice e-mails: branded HTML + plain text, PDF attached, sent with the Cloudflare Email Service binding (env.EMAIL).
 */
import LOGO from "./assets/shield.png";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const b64 = buf => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const CUR = { BAM: "KM", EUR: "EUR" };
function money(minor, cur, lang) {
  const a = Math.abs(Math.round(minor)), i = String(Math.floor(a / 100)), c = String(a % 100).padStart(2, "0");
  const [th, dec] = lang === "en" ? [",", "."] : [".", ","];
  return (minor < 0 ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, th) + dec + c + " " + (CUR[cur] || cur);
}
function date(d, lang) { if (!d) return ""; const [y, m, dd] = d.slice(0, 10).split("-"); return lang === "en" ? `${dd}/${m}/${y}` : `${dd}.${m}.${y}${lang === "bs" ? "." : ""}`; }

const T = {
  bs: {
    subject: (n, co) => `Faktura ${n} · ${co}`, subjectR: (n, co) => `Podsjetnik: faktura ${n} · ${co}`,
    hello: "Poštovani,", intro: (n, co) => `u prilogu vam dostavljamo fakturu ${n} za usluge ${co}.`,
    introR: (n, d) => `ljubazno vas podsjećamo da je faktura ${n} dospjela ${d} i da uplatu još nismo evidentirali. Ako ste već platili, zanemarite ovu poruku.`,
    no: "Broj fakture", issued: "Datum izdavanja", due: "Rok plaćanja", total: "Iznos za uplatu", iban: "IBAN", bank: "Banka", ref: "Poziv na broj",
    portal: "Otvori u klijentskom portalu", portalNote: "Fakturu i sve ranije fakture možete vidjeti i u klijentskom portalu Evidenta.",
    attached: "PDF fakture je u prilogu.", signed: "PDF je digitalno potpisan kvalifikovanim potpisom.", verify: "Kod za provjeru na fakturi",
    regards: "Srdačan pozdrav,", auto: "Ova poruka je poslana iz sistema Evidenta. Za pitanja odgovorite na ovaj e-mail." },
  en: {
    subject: (n, co) => `Invoice ${n} · ${co}`, subjectR: (n, co) => `Reminder: invoice ${n} · ${co}`,
    hello: "Dear Sir or Madam,", intro: (n, co) => `please find attached invoice ${n} for services provided by ${co}.`,
    introR: (n, d) => `this is a friendly reminder that invoice ${n} was due on ${d} and we have not yet received the payment. If you have already paid, please disregard this message.`,
    no: "Invoice number", issued: "Issue date", due: "Due date", total: "Amount due", iban: "IBAN", bank: "Bank", ref: "Payment reference",
    portal: "Open in client portal", portalNote: "You can also view this and earlier invoices in the Evidenta client portal.",
    attached: "The invoice PDF is attached.", signed: "The PDF carries a qualified electronic signature.", verify: "Verification code on the invoice",
    regards: "Kind regards,", auto: "This message was sent from Evidenta. Reply to this e-mail with any questions." },
  de: {
    subject: (n, co) => `Rechnung ${n} · ${co}`, subjectR: (n, co) => `Zahlungserinnerung: Rechnung ${n} · ${co}`,
    hello: "Sehr geehrte Damen und Herren,", intro: (n, co) => `anbei erhalten Sie die Rechnung ${n} für die Leistungen von ${co}.`,
    introR: (n, d) => `wir möchten Sie freundlich daran erinnern, dass die Rechnung ${n} am ${d} fällig war und wir noch keinen Zahlungseingang verzeichnen. Sollten Sie bereits bezahlt haben, betrachten Sie diese Nachricht bitte als gegenstandslos.`,
    no: "Rechnungsnummer", issued: "Rechnungsdatum", due: "Zahlbar bis", total: "Zahlbetrag", iban: "IBAN", bank: "Bank", ref: "Verwendungszweck",
    portal: "Im Kundenportal öffnen", portalNote: "Diese und frühere Rechnungen finden Sie auch im Evidenta Kundenportal.",
    attached: "Die Rechnung liegt als PDF bei.", signed: "Das PDF ist mit einer qualifizierten elektronischen Signatur versehen.", verify: "Prüfcode auf der Rechnung",
    regards: "Mit freundlichen Grüßen,", auto: "Diese Nachricht wurde aus Evidenta versendet. Bei Fragen antworten Sie bitte auf diese E-Mail." }
};

export function compose(inv, issuer, o) {
  const lang = T[inv.lang] ? inv.lang : "bs", L = T[lang], co = issuer.name + (issuer.legal_form ? " " + issuer.legal_form : "");
  const reminder = o.kind === "reminder";
  const subject = (o.subject || (reminder ? L.subjectR : L.subject)(inv.number, issuer.name)).replace(/[\r\n]+/g, " ").slice(0, 200);
  const intro = reminder ? L.introR(inv.number, date(inv.due_date, lang)) : L.intro(inv.number, co).replace(/\.\.$/, ".");
  const rows = [[L.no, inv.number], [L.issued, date(inv.issue_date, lang)], [L.due, date(inv.due_date, lang)], [L.total, money(inv.total, inv.currency, lang)],
    [L.bank, issuer.bank], [L.iban, issuer.iban], [L.ref, inv.number]].filter(r => r[1]);
  const msg = String(o.message || "").trim().slice(0, 3000);
  const sign = [issuer.signer_name, issuer.signer_title, co].filter(Boolean);
  const text = [L.hello, "", intro, "", ...(msg ? [msg, ""] : []), ...rows.map(([k, v]) => `${k}: ${v}`), "", L.attached + (o.signed ? " " + L.signed : ""),
    inv.verify_code ? `${L.verify}: ${inv.verify_code}` : "", ...(o.portalUrl ? ["", `${L.portalNote} ${o.portalUrl}`] : []), "", L.regards, ...sign,
    [issuer.email, issuer.website, issuer.phone].filter(Boolean).join(" · "), "", L.auto].join("\n");
  const td = "padding:7px 0;border-bottom:1px solid #e4e9f0;font:14px/1.4 Arial,Helvetica,sans-serif";
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f6fa">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e9f0">
<tr><td style="background:#0b2a4a;padding:0"><div style="height:5px;background:#e37222;width:120px"></div></td></tr>
<tr><td style="background:#0b2a4a;padding:18px 28px 20px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:12px"><img src="cid:sce-logo" width="34" height="33" alt="" style="display:block"></td>
  <td style="font:800 20px/1 Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:.02em">SCE<div style="font:700 9px/1.6 Arial,Helvetica,sans-serif;letter-spacing:.28em;color:#8fb0d8">ASSURANCE</div></td></tr></table></td></tr>
<tr><td style="padding:26px 28px 6px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#1b3452">
  <p style="margin:0 0 12px">${esc(L.hello)}</p><p style="margin:0 0 14px">${esc(intro)}</p>
  ${msg ? `<p style="margin:0 0 14px;white-space:pre-line">${esc(msg)}</p>` : ""}</td></tr>
<tr><td style="padding:4px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:10px;padding:6px 16px">
  ${rows.map(([k, v], i) => `<tr><td style="${td};color:#5a6875${i === rows.length - 1 ? ";border-bottom:0" : ""}">${esc(k)}</td><td align="right" style="${td};color:#0b2a4a;font-weight:${k === L.total ? "800;font-size:17px" : "700"}${i === rows.length - 1 ? ";border-bottom:0" : ""}">${esc(v)}</td></tr>`).join("")}
</table></td></tr>
<tr><td style="padding:10px 28px 4px;font:13px/1.55 Arial,Helvetica,sans-serif;color:#5a6875">${esc(L.attached)}${o.signed ? " " + esc(L.signed) : ""}${inv.verify_code ? `<br>${esc(L.verify)}: <b style="color:#1b3452">${esc(inv.verify_code)}</b>` : ""}</td></tr>
${o.portalUrl ? `<tr><td style="padding:16px 28px 6px"><a href="${esc(o.portalUrl)}" style="display:inline-block;background:#e37222;color:#ffffff;text-decoration:none;font:700 14px/1 Arial,Helvetica,sans-serif;padding:13px 20px;border-radius:9px">${esc(L.portal)}</a>
  <div style="font:12.5px/1.5 Arial,Helvetica,sans-serif;color:#8a97a6;margin-top:8px">${esc(L.portalNote)}</div></td></tr>` : ""}
<tr><td style="padding:18px 28px 24px;font:14px/1.6 Arial,Helvetica,sans-serif;color:#1b3452">${esc(L.regards)}<br>${sign.map((s, i) => i ? `<span style="color:#5a6875">${esc(s)}</span>` : `<b>${esc(s)}</b>`).join("<br>")}</td></tr>
<tr><td style="background:#f6f8fb;border-top:1px solid #e4e9f0;padding:14px 28px;font:12px/1.6 Arial,Helvetica,sans-serif;color:#8a97a6">
  ${esc([co, [issuer.address, [issuer.postal_code, issuer.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(" · "))}<br>
  ${esc([issuer.email, issuer.website, issuer.phone].filter(Boolean).join(" · "))}<br><span style="color:#a3b0bf">${esc(L.auto)}</span></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function sendInvoiceMail(env, { from, fromName, replyTo, to, cc, bcc, subject, html, text, pdf, filename }) {
  if (!env.EMAIL) { const e = new Error("email_not_configured"); e.code = "email_not_configured"; throw e; }
  const msg = {
    from: { email: from, name: fromName || undefined }, to, subject, html, text,
    attachments: [
      { content: b64(pdf), filename, type: "application/pdf", disposition: "attachment" },
      { content: b64(LOGO), filename: "sce-logo.png", type: "image/png", disposition: "inline", contentId: "sce-logo" }]
  };
  if (cc && cc.length) msg.cc = cc;
  if (bcc && bcc.length) msg.bcc = bcc;
  if (replyTo) msg.replyTo = replyTo;
  return env.EMAIL.send(msg);
}

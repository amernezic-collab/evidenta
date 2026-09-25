/*
 * Minimal .docx writer for Evidenta reports (no dependencies).
 * Builds WordprocessingML parts and packs them in a stored (uncompressed) ZIP.
 *
 * blocks:
 *   { h1: "text" } { h2: "text" } { p: "text", muted?, bold?, size? }
 *   { bullets: ["a", "b"] }
 *   { kv: [["Label", "Value"], ...] }
 *   { table: { widths: [twips...], head: ["A", "B"], rows: [[cell, ...]] } }
 *       cell = "text" | { t: "text", fill: "RRGGBB", color: "RRGGBB", bold: true }
 *   { pb: true }  page break
 */

const X = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const NAVY = "0B2A4A", ORANGE = "E37222", MUTED = "5A6875", LINE = "D5DCE4";
const W = 9638; // A4 portrait, 2 cm margins

function run(text, o = {}) {
  const pr = [o.bold ? "<w:b/>" : "", o.color ? `<w:color w:val="${o.color}"/>` : "", o.size ? `<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>` : "",
    o.caps ? "<w:caps/>" : "", o.spacing ? `<w:spacing w:val="${o.spacing}"/>` : ""].join("");
  // keep line breaks inside a cell or paragraph
  const parts = String(text == null ? "" : text).split(/\r?\n/);
  return parts.map((t, i) => `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`).join("");
}
function para(text, o = {}) {
  const ppr = [o.style ? `<w:pStyle w:val="${o.style}"/>` : "", o.keep ? "<w:keepNext/>" : "", o.after != null ? `<w:spacing w:after="${o.after}" w:before="${o.before || 0}"/>` : "",
    o.align ? `<w:jc w:val="${o.align}"/>` : "", o.num ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>` : ""].join("");
  return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${run(text, o)}</w:p>`;
}
function cell(c, w, head, zebra, keep) {
  const o = typeof c === "object" && c !== null ? c : { t: c };
  const fill = head ? NAVY : o.fill || (zebra ? "F6F8FB" : null);
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ""}<w:vAlign w:val="top"/></w:tcPr>`
    + `<w:p><w:pPr>${keep ? "<w:keepNext/>" : ""}<w:spacing w:after="0"/></w:pPr>${run(o.t, { bold: head || o.bold, color: head ? "FFFFFF" : o.color, size: head ? 17 : 18 })}</w:p></w:tc>`;
}
function table(t) {
  const widths = t.widths || t.head.map(() => Math.floor(W / t.head.length));
  const border = `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="${LINE}"/>`).join("")}</w:tblBorders>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>`
    + `<w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`
    + (t.head ? `<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>${t.head.map((h, i) => cell(h, widths[i], true, false, true)).join("")}</w:tr>` : "")
    + t.rows.map((r, ri) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((c, i) => cell(c, widths[i], false, ri % 2 === 1, (t.keep || ri < 1) && ri < t.rows.length - 1)).join("")}</w:tr>`).join("")
    + `</w:tbl>` + para("", { after: 120 });
}
function block(b) {
  if (b.h1) return para(b.h1, { style: "Heading1", keep: true });
  if (b.h2) return para(b.h2, { style: "Heading2", keep: true });
  if (b.pb) return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  if (b.bullets) return b.bullets.map(x => para(x, { num: true, after: 60 })).join("");
  if (b.kv) return table({ keep: true, widths: [2800, W - 2800], rows: b.kv.map(([k, v]) => [{ t: k, bold: true, color: MUTED, fill: "F1F4F8" }, v]) });
  if (b.table) return table(b.table);
  if (b.p != null) return para(b.p, { color: b.muted ? MUTED : null, bold: b.bold, size: b.size, after: b.after != null ? b.after : 140 });
  return "";
}

function documentXml(r) {
  const cover = [
    para("SCE ASSURANCE", { bold: true, color: ORANGE, size: 18, spacing: 40, after: 80 }),
    para(r.title, { style: "Title" }),
    r.subtitle ? para(r.subtitle, { color: MUTED, size: 26, after: 320 }) : "",
    r.meta ? block({ kv: r.meta }) : "",
    r.note ? para(r.note, { color: MUTED, size: 17, after: 240 }) : ""
  ].join("");
  const body = (r.blocks || []).map(block).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${cover}${body}
<w:sectPr><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:color w:val="1B3452"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="bs-Latn-BA"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="${LINE}"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="8A97A6"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
</w:styles>`;
const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr><w:rPr><w:color w:val="${ORANGE}"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
const fld = code => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${code} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
const footer = text => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/><w:tabs><w:tab w:val="right" w:pos="${W}"/></w:tabs></w:pPr>${run(text)}<w:r><w:tab/></w:r>${run("Stranica ")}${fld("PAGE")}${run(" od ")}${fld("NUMPAGES")}</w:p></w:ftr>`;

const CT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
const DOCRELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`;
const core = (title, author) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(title)}</dc:title><dc:creator>${X(author)}</dc:creator><cp:lastModifiedBy>Evidenta</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;

/* ---------- ZIP (stored) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  const d = new Date(), dt = ((d.getFullYear() - 1980) << 25) | ((d.getMonth() + 1) << 21) | (d.getDate() << 16) | (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  for (const [name, content] of files) {
    const nb = enc.encode(name), data = typeof content === "string" ? enc.encode(content) : content, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(10, dt, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nb, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint32(12, dt, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nb);
    off += 30 + nb.length + data.length;
  }
  const csize = central.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  const all = [...parts, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
  let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

export function buildDocx(report) {
  return zip([
    ["[Content_Types].xml", CT], ["_rels/.rels", RELS], ["docProps/core.xml", core(report.title, report.author || "SCE Assurance")],
    ["word/document.xml", documentXml(report)], ["word/styles.xml", STYLES], ["word/numbering.xml", NUMBERING],
    ["word/footer1.xml", footer(report.footer || "SCE Assurance · Povjerljivo")], ["word/_rels/document.xml.rels", DOCRELS]
  ]);
}
export const DOCX_W = W;

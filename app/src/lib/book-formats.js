// book-formats.js — render an assembled Book (book-engine.js) to real,
// downloadable formats, dependency-free:
//   - toMarkdown(book)        printable / portable / re-editable source
//   - bookToReaderHtml(book)  a single self-contained .html (opens anywhere,
//                             prints to PDF from any browser)
//   - bookToEpubBytes(book)   a VALID .epub (zip of XHTML), built with a tiny
//                             store-only ZIP writer + CRC32 below — no library.
//
// All pure + deterministic: timestamps come in via book.createdIso / nowIso, so
// the same book always produces byte-identical output (testable).
//
// Why HTML+EPUB now and PDF via print: EPUB is just a zip of XHTML, which we can
// emit honestly with no dependency. A real PDF library is heavy; the reader HTML
// prints to PDF natively. (Research-review documents the format decision.)

import { escapeXml } from './creation-workspace.js';

const asArr = (v) => (Array.isArray(v) ? v : []);
const esc = (s) => escapeXml(typeof s === 'string' ? s : '');

// ---------------------------------------------------------------------------
// MARKDOWN
// ---------------------------------------------------------------------------

function blockToMd(b) {
  if (b.kind === 'heading') return `### ${b.text}\n`;
  if (b.kind === 'list') return b.items.map((i) => `- ${i}`).join('\n') + '\n';
  if (b.kind === 'note') return `> **${b.label}.** ${b.text}\n`;
  if (b.kind === 'scripture') {
    if (!b.text) return `> *(${b.ref} — see Scripture library)*\n`;
    return `> **${b.version || 'KJV'} — ${b.ref}:** *"${b.text}"*\n`;
  }
  return `${b.text}\n`;
}

export function toMarkdown(book) {
  if (!book) return '';
  const out = [];
  out.push(`# ${book.title}`);
  if (book.subtitle) out.push(`### ${book.subtitle}`);
  out.push('');
  out.push(`*${book.author}* — ${book.edition}`);
  if (book.createdIso) out.push(`*Assembled ${book.createdIso.slice(0, 10)}*`);
  out.push('');
  if (book.frontMatter) { out.push(book.frontMatter, ''); }

  out.push('## Contents', '');
  asArr(book.chapters).forEach((c) => out.push(`${c.number}. ${c.title}`));
  out.push('');

  asArr(book.chapters).forEach((c) => {
    out.push(`## ${c.number}. ${c.title}`);
    const by = [c.author, c.date ? c.date.slice(0, 10) : ''].filter(Boolean).join(' · ');
    if (by) out.push(`*${by}*`, '');
    else out.push('');
    if (c.intro) out.push(c.intro, '');
    c.blocks.forEach((b) => out.push(blockToMd(b)));
    out.push('');
  });

  out.push('---', '', '## Sources & attribution', '');
  out.push(book.attribution.note, '');
  out.push(book.attribution.scripture, '');
  asArr(book.sourceManifest).forEach((m) => {
    const bits = [m.author, m.provenance?.date ? m.provenance.date.slice(0, 10) : '', m.provenance?.url].filter(Boolean).join(' · ');
    out.push(`${m.chapter}. **${m.title}** (${m.kind})${bits ? ` — ${bits}` : ''}`);
  });
  out.push('');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// READER HTML (self-contained, printable)
// ---------------------------------------------------------------------------

const READER_CSS = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#F4F1EA;color:#1A1815;font-family:Georgia,'Times New Roman',serif;line-height:1.65}
.book{max-width:42rem;margin:0 auto;padding:3rem 1.5rem 5rem}
.title{font-size:2.2rem;line-height:1.15;margin:0 0 .25rem;font-family:'Fraunces',Georgia,serif}
.subtitle{font-size:1.2rem;color:#5A5751;margin:0 0 1rem;font-style:italic}
.byline{color:#5A5751;font-size:.95rem;margin:0 0 2.5rem}
.toc{border:1px solid #E0DBD0;background:#fff;padding:1rem 1.25rem;margin:0 0 2.5rem}
.toc h2{font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:#5A5751;margin:0 0 .5rem}
.toc ol{margin:0;padding-left:1.25rem}
.toc a{color:#1A1815;text-decoration:none}
.toc a:hover{color:#B85838}
.chapter{margin:0 0 3rem;padding-top:1rem}
.chapter h2{font-size:1.6rem;font-family:'Fraunces',Georgia,serif;margin:0 0 .25rem;border-bottom:2px solid #B85838;padding-bottom:.4rem}
.chapter .by{color:#5A5751;font-size:.9rem;margin:.25rem 0 1.25rem}
.chapter p{margin:0 0 1rem}
.scripture{border-left:3px solid #B85838;background:#fff;padding:.75rem 1rem;margin:0 0 1.25rem;font-style:italic}
.scripture .ref{display:block;font-style:normal;font-weight:600;color:#B85838;font-size:.85rem;margin-bottom:.25rem}
.note{background:#EFEAE0;border:1px solid #E0DBD0;padding:.75rem 1rem;margin:0 0 1.25rem;font-size:.95rem}
.note b{color:#1A1815}
.colophon{border-top:1px solid #E0DBD0;margin-top:3rem;padding-top:1.5rem;font-size:.85rem;color:#5A5751}
@media print{body{background:#fff}.book{max-width:none;padding:0}.chapter{page-break-inside:auto}.chapter h2{page-break-after:avoid}}
`;

function blockToHtml(b) {
  if (b.kind === 'heading') return `<h3>${esc(b.text)}</h3>`;
  if (b.kind === 'list') return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (b.kind === 'note') return `<div class="note"><b>${esc(b.label)}.</b> ${esc(b.text)}</div>`;
  if (b.kind === 'scripture') {
    if (!b.text) return `<div class="scripture"><span class="ref">${esc(b.ref)}</span><em>See the Scripture library.</em></div>`;
    return `<div class="scripture"><span class="ref">${esc(b.version || 'KJV')} — ${esc(b.ref)}</span>"${esc(b.text)}"</div>`;
  }
  return `<p>${esc(b.text)}</p>`;
}

export function bookToReaderHtml(book) {
  if (!book) return '';
  const chapters = asArr(book.chapters);
  const toc = chapters.map((c) => `<li><a href="#ch-${esc(c.id)}">${esc(c.title)}</a></li>`).join('');
  const body = chapters.map((c) => {
    const by = [c.author, c.date ? c.date.slice(0, 10) : ''].filter(Boolean).join(' · ');
    return `<section class="chapter" id="ch-${esc(c.id)}">
<h2>${c.number}. ${esc(c.title)}</h2>
${by ? `<div class="by">${esc(by)}</div>` : ''}
${c.intro ? `<p>${esc(c.intro)}</p>` : ''}
${c.blocks.map(blockToHtml).join('\n')}
</section>`;
  }).join('\n');

  const dated = book.createdIso ? ` · assembled ${esc(book.createdIso.slice(0, 10))}` : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(book.title)}</title>
<style>${READER_CSS}</style></head>
<body><article class="book">
<h1 class="title">${esc(book.title)}</h1>
${book.subtitle ? `<p class="subtitle">${esc(book.subtitle)}</p>` : ''}
<p class="byline">${esc(book.author)} — ${esc(book.edition)}${dated}</p>
${book.frontMatter ? `<p>${esc(book.frontMatter)}</p>` : ''}
<nav class="toc"><h2>Contents</h2><ol>${toc}</ol></nav>
${body}
<div class="colophon"><p>${esc(book.attribution.note)}</p><p>${esc(book.attribution.scripture)}</p></div>
</article></body></html>`;
}

// ---------------------------------------------------------------------------
// EPUB — built on a tiny store-only ZIP writer (no dependency)
// ---------------------------------------------------------------------------

// CRC32 (IEEE 802.3) with a lazily-built table.
let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}
export function crc32(bytes) {
  const t = crcTable();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function utf8(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  // Minimal fallback for environments without TextEncoder.
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
    else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
  }
  return Uint8Array.from(out);
}

// DOS date/time from an ISO string (deterministic; defaults to 1980-01-01).
function dosDateTime(iso) {
  let y = 1980, mo = 1, d = 1, h = 0, mi = 0, s = 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/.exec(typeof iso === 'string' ? iso : '');
  if (m) {
    y = +m[1]; mo = +m[2]; d = +m[3];
    if (m[4]) { h = +m[4]; mi = +m[5]; s = +m[6]; }
  }
  if (y < 1980) y = 1980;
  const time = ((h & 0x1F) << 11) | ((mi & 0x3F) << 5) | ((Math.floor(s / 2)) & 0x1F);
  const date = (((y - 1980) & 0x7F) << 9) | ((mo & 0x0F) << 5) | (d & 0x1F);
  return { time: time & 0xFFFF, date: date & 0xFFFF };
}

function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

// Build a valid store-only (method 0, no compression) ZIP from ordered entries.
// entries: [{ name, data:(string|Uint8Array) }]. The first entry should be the
// EPUB "mimetype" file (stored, uncompressed) per the OCF spec — which is
// exactly what store-only gives us.
export function zipStore(entries, { nowIso } = {}) {
  const { time, date } = dosDateTime(nowIso);
  const parts = [];
  const central = [];
  let offset = 0;

  entries.forEach((e) => {
    const nameBytes = utf8(e.name);
    const data = e.data instanceof Uint8Array ? e.data : utf8(String(e.data));
    const crc = crc32(data);
    const local = [
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), // sig, ver, flags, method=0
      ...u16(time), ...u16(date),
      ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0),
      ...nameBytes,
    ];
    const localBytes = Uint8Array.from(local);
    parts.push(localBytes, data);

    central.push(...[
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(time), ...u16(date),
      ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset),
      ...nameBytes,
    ]);
    offset += localBytes.length + data.length;
  });

  const centralBytes = Uint8Array.from(central);
  const eocd = Uint8Array.from([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralBytes.length), ...u32(offset),
    ...u16(0),
  ]);

  // Concatenate everything.
  let total = centralBytes.length + eocd.length;
  parts.forEach((p) => { total += p.length; });
  const out = new Uint8Array(total);
  let p = 0;
  parts.forEach((part) => { out.set(part, p); p += part.length; });
  out.set(centralBytes, p); p += centralBytes.length;
  out.set(eocd, p);
  return out;
}

const EPUB_CSS = `body{font-family:Georgia,serif;line-height:1.6;margin:1em}
h1,h2{font-family:'Fraunces',Georgia,serif}
h2{border-bottom:2px solid #B85838;padding-bottom:.2em}
.scripture{border-left:3px solid #B85838;padding:.5em .75em;margin:1em 0;font-style:italic}
.scripture .ref{display:block;font-style:normal;font-weight:bold;color:#B85838;font-size:.85em}
.note{background:#EFEAE0;padding:.5em .75em;margin:1em 0}
.by{color:#5A5751;font-size:.9em;margin-bottom:1em}`;

function chapterXhtml(c) {
  const by = [c.author, c.date ? c.date.slice(0, 10) : ''].filter(Boolean).join(' · ');
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"/>
<title>${esc(c.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h2>${c.number}. ${esc(c.title)}</h2>
${by ? `<p class="by">${esc(by)}</p>` : ''}
${c.intro ? `<p>${esc(c.intro)}</p>` : ''}
${c.blocks.map(blockToHtml).join('\n')}
</body></html>`;
}

// The full set of files inside the .epub, in spec order (mimetype first).
export function epubFiles(book) {
  const chapters = asArr(book.chapters);
  const bookId = esc(book.id);
  const manifestItems = chapters.map((c, i) =>
    `<item id="ch${i + 1}" href="chapter-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
  const spine = chapters.map((c, i) => `<itemref idref="ch${i + 1}"/>`).join('\n');
  const navList = chapters.map((c, i) => `<li><a href="chapter-${i + 1}.xhtml">${esc(c.title)}</a></li>`).join('\n');

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">urn:poetech:${bookId}</dc:identifier>
<dc:title>${esc(book.title)}</dc:title>
<dc:creator>${esc(book.author)}</dc:creator>
<dc:language>en</dc:language>
<dc:rights>${esc(book.attribution.scripture)}</dc:rights>
<meta property="dcterms:modified">${esc((book.createdIso || '1980-01-01T00:00:00').slice(0, 19))}Z</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>
<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
${manifestItems}
</manifest>
<spine>
<itemref idref="title"/>
${spine}
</spine>
</package>`;

  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><meta charset="utf-8"/><title>Contents</title></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navList}</ol></nav></body></html>`;

  const titlePage = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"/><title>${esc(book.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>${esc(book.title)}</h1>${book.subtitle ? `<p><em>${esc(book.subtitle)}</em></p>` : ''}
<p class="by">${esc(book.author)} — ${esc(book.edition)}</p>
${book.frontMatter ? `<p>${esc(book.frontMatter)}</p>` : ''}
<p class="note">${esc(book.attribution.note)}</p></body></html>`;

  const container = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;

  const files = [
    { name: 'mimetype', data: 'application/epub+zip' },          // MUST be first, stored
    { name: 'META-INF/container.xml', data: container },
    { name: 'OEBPS/content.opf', data: opf },
    { name: 'OEBPS/nav.xhtml', data: nav },
    { name: 'OEBPS/style.css', data: EPUB_CSS },
    { name: 'OEBPS/title.xhtml', data: titlePage },
  ];
  chapters.forEach((c, i) => files.push({ name: `OEBPS/chapter-${i + 1}.xhtml`, data: chapterXhtml(c) }));
  return files;
}

export function bookToEpubBytes(book) {
  if (!book) return new Uint8Array(0);
  return zipStore(epubFiles(book), { nowIso: book.createdIso });
}

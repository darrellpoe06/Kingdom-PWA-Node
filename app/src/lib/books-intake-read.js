// =============================================================================
// books-intake-read — read ANY file into text (and rows when it is a table)
// (DR-0707, the one Books upload)
// =============================================================================
// One reader for every file, routed by what the file is:
//   CSV / TSV / TXT / Excel / OFX / QFX -> the proven statement readers
//     (statementFileToCsv, parseStatementText) — rows with signs and dates
//   PDF -> its text layer via pdf.js, LAZY-loaded (only when a PDF arrives, so
//     the main bundle does not grow); a PDF with no text layer is a scan and
//     goes to OCR page by page
//   image (photo, scan) -> OCR
//
// OCR IS SOVEREIGN-FIRST. The family's financial papers never go to a
// third-party cloud AI. The route is:
//   1. the family's own NAS (same-origin /books/ocr, the bridge bearer) when it
//      answers;
//   2. otherwise the device itself (tesseract.js in the browser — the picture
//      never leaves the phone; only the reading engine is downloaded).
// Both are injectable, so the routing is proven in tests at the boundary.
// =============================================================================
import { statementFileToCsv, parseStatementText, isSpreadsheetFile, isOfxFile, findStatementHeader, parseCsvLine } from './statement-import.js';

export const NAS_OCR_PATH = 'books/ocr';
export const NAS_OCR_TIMEOUT_MS = 20000;
// Pinned so the engine the browser downloads is the one we tested, and served
// from unpkg, which the site's Content-Security-Policy already allows.
export const TESSERACT_URL = 'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.esm.min.js';

export function kindOf(file) {
  const name = String((file && file.name) || '').toLowerCase();
  const type = String((file && file.type) || '').toLowerCase();
  if (/\.pdf$/.test(name) || type === 'application/pdf') return 'pdf';
  if (type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/.test(name)) return 'image';
  if (isOfxFile(file)) return 'ofx';
  if (isSpreadsheetFile(file)) return 'spreadsheet';
  if (/\.(csv|tsv|txt)$/.test(name) || type.includes('csv') || type.startsWith('text/')) return 'text';
  return 'other';
}

function baseHref() {
  try { if (typeof document !== 'undefined' && document.baseURI) return new URL('.', document.baseURI).href; } catch { /* fall through */ }
  return '/';
}

/** Try the family's NAS for OCR. Returns { ok, text } or { ok:false, reason }. */
export async function nasOcr(blob, { fetcher = (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null), token = null, name = 'page.png' } = {}) {
  if (!fetcher || typeof FormData === 'undefined') return { ok: false, reason: 'no-fetch' };
  const fd = new FormData();
  fd.append('file', blob, name);
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), NAS_OCR_TIMEOUT_MS) : null;
  try {
    const res = await fetcher(`${baseHref()}${NAS_OCR_PATH}`, { method: 'POST', headers, body: fd, ...(ctl ? { signal: ctl.signal } : {}) });
    if (!res || !res.ok) return { ok: false, reason: `nas-${res ? res.status : 0}` };
    const data = await res.json().catch(() => ({}));
    const text = data && typeof data.text === 'string' ? data.text : '';
    return text.trim() ? { ok: true, text } : { ok: false, reason: 'nas-empty' };
  } catch {
    return { ok: false, reason: 'nas-unreachable' };
  } finally { if (timer) clearTimeout(timer); }
}

/** OCR on the device itself. The image stays in this browser. */
export async function browserOcr(blob) {
  const mod = await import(/* @vite-ignore */ TESSERACT_URL);
  const Tesseract = mod.default || mod;
  const worker = await Tesseract.createWorker('eng', 1, {
    workerPath: 'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js',
    corePath: 'https://unpkg.com/tesseract.js-core@5.1.1',
  });
  try {
    const { data } = await worker.recognize(blob);
    return { ok: true, text: (data && data.text) || '' };
  } finally { await worker.terminate(); }
}

/**
 * The OCR route: the NAS first, the device second. NEVER a cloud AI.
 * Returns { ok, text, via: 'nas'|'device'|null, tried: [...] }.
 */
export async function ocrRoute(blob, { nas = nasOcr, device = browserOcr, token = null, name } = {}) {
  const tried = [];
  const first = await nas(blob, { token, name }).catch(() => ({ ok: false, reason: 'nas-error' }));
  tried.push({ via: 'nas', ok: !!first.ok, reason: first.reason || null });
  if (first.ok) return { ok: true, text: first.text, via: 'nas', tried };
  try {
    const second = await device(blob);
    tried.push({ via: 'device', ok: !!(second && second.ok) });
    if (second && second.ok) return { ok: true, text: second.text, via: 'device', tried };
  } catch (e) {
    tried.push({ via: 'device', ok: false, reason: (e && e.message) || 'device-error' });
  }
  return { ok: false, text: '', via: null, tried };
}

// pdf.js, lazy. The worker is bundled as a same-origin asset (worker-src 'self').
let pdfjsPromise = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/build/pdf.min.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  }
  return pdfjsPromise;
}

// Rebuild lines from pdf.js text items: items sharing a baseline are one line.
export function itemsToLines(items = []) {
  const rows = new Map();
  for (const it of items) {
    if (!it || typeof it.str !== 'string') continue;
    const y = Math.round(((it.transform && it.transform[5]) || 0) / 2) * 2;
    const x = (it.transform && it.transform[4]) || 0;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push({ x, s: it.str });
  }
  return [...rows.entries()].sort((a, b) => b[0] - a[0])
    .map(([, cells]) => cells.sort((a, b) => a.x - b.x).map((c) => c.s).join(' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean).join('\n');
}

/** A PDF's text layer, page by page; scanned pages are OCR'd. */
export async function readPdf(file, { pdfjs = null, ocr = ocrRoute, token = null, maxPages = 30 } = {}) {
  const lib = pdfjs || await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data, isEvalSupported: false }).promise;
  const pages = [];
  let ocrVia = null;
  const n = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= n; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = itemsToLines(content.items || []);
    if (text.replace(/\s/g, '').length < 20 && typeof document !== 'undefined') {
      // A scanned page: render it and read the picture.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const res = blob ? await ocr(blob, { token, name: `page-${i}.png` }) : { ok: false };
      if (res.ok) { text = res.text; ocrVia = res.via; }
    }
    pages.push(text);
  }
  return { text: pages.join('\n\n'), pages: pdf.numPages, method: ocrVia ? `pdf+ocr:${ocrVia}` : 'pdf-text', truncated: pdf.numPages > n };
}

/**
 * Read any file. Returns { text, rows?, headerSignature?, rowReconciliation?, method }.
 * Throws only when the file truly cannot be read; the caller keeps it stored.
 */
export async function readAnyFile(file, deps = {}) {
  const kind = kindOf(file);
  if (kind === 'pdf') return (deps.readPdf || readPdf)(file, deps);
  if (kind === 'image') {
    const res = await (deps.ocr || ocrRoute)(file, { token: deps.token, name: file.name });
    if (!res.ok) throw new Error('no reader could see words in this picture');
    return { text: res.text, method: `ocr:${res.via}` };
  }
  if (kind === 'text' || kind === 'spreadsheet' || kind === 'ofx' || kind === 'other') {
    const text = await statementFileToCsv(file);
    const parsed = parseStatementText(text);
    const lines = String(text).split(/\r?\n/).filter((l) => l.trim());
    const isOfx = /<OFX>|<STMTTRN>/i.test(text);
    const h = !isOfx && lines.length ? findStatementHeader(lines) : null;
    const headerSignature = isOfx ? 'ofx'
      : (h && h.headerRow != null ? parseCsvLine(lines[h.headerRow]) : []).map((c) => c.toLowerCase()).join('|');
    const rows = (parsed.rows || []).filter((r) => r.ok !== false);
    const rec = parsed.reconciliation || null;
    return {
      text, rows,
      rejected: parsed.rejected || [],
      headerSignature,
      rowReconciliation: rec ? { total: rec.sourceTotal, ingested: rec.ingested, rejected: rec.rejected } : null,
      method: kind === 'spreadsheet' ? 'spreadsheet' : (headerSignature === 'ofx' ? 'ofx' : 'text'),
    };
  }
  throw new Error('unrecognised file');
}

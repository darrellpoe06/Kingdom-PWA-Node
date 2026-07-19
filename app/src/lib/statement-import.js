// =============================================================================
// statement-import — turn an uploaded bank/card statement FILE into CSV text
// =============================================================================
// The Books CSV importer (BooksTransactions.importCsv) already PERSISTS every
// mapped row to the ledger via addTransaction -> data.transactions, which drives
// the DERIVED balance (deriveAccountBalances) + the Forecast. The gap that broke
// Christina's import: that path only read the file as TEXT, so an Excel (.xlsx)
// workbook came through as binary garbage -> "No Date column" -> ZERO rows, and
// the file picker didn't even accept .xlsx.
//
// This module makes the SAME proven path accept Excel: a spreadsheet is parsed
// to CSV text (first non-empty sheet) and handed to the existing mapper. Excel
// parsing uses SheetJS, LAZY-loaded (dynamic import) so it never bloats the main
// bundle — pulled only when a spreadsheet is actually imported. Fully in-app +
// deterministic: NO dependency on n8n / workflow 18 (which is what froze the
// imported pipeline when the NAS was unreachable).
// =============================================================================

import { reconcile } from './ingest-reconcile.js';

const SPREADSHEET_RE = /\.(xlsx|xlsm|xlsb|xls)$/i;

// True when the file looks like an Excel workbook (by name or MIME).
export function isSpreadsheetFile(file) {
  if (!file) return false;
  if (SPREADSHEET_RE.test(file.name || '')) return true;
  const t = (file.type || '').toLowerCase();
  return t.includes('spreadsheetml') || t === 'application/vnd.ms-excel';
}

// True when the file is something this importer can read AT ALL. 2026-07-03:
// a tablet's file picker happily hands over a .jpg photo, which then falls
// through to the CSV text path and produces three baffling "No … column found"
// errors. Name the real problem instead (honest error, DR-0076).
export function looksImportableFile(file) {
  if (!file) return false;
  if (isSpreadsheetFile(file)) return true;
  if (/\.(csv|tsv|txt)$/i.test(file.name || '')) return true;
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/') || t.startsWith('video/') || t.startsWith('audio/') || t === 'application/pdf') return false;
  return t.includes('csv') || t.startsWith('text/') || t === '';
}

// ---------------------------------------------------------------------------
// Header detection — find the REAL header row, wherever it is.
// ---------------------------------------------------------------------------
// 2026-07-03 (Christina's "how do I upload?"): her CSV failed with "No
// Description column found" because detection only ever read LINE 1 — but
// real exports (including this app's own Download primitive) often start with
// a title or preamble line. Scan the first rows for the line that best matches
// Date / Description / Amount (word-boundary synonyms, so "Posting Date" or
// "Merchant" count too) and start the data AFTER it.
const HEADER_MATCHERS = {
  date: /\b(transaction date|posted date|post date|posting date|date)\b/,
  desc: /\b(description|details|memo|name|payee|merchant)\b/,
  amount: /\b(amount|debit|transaction amount)\b/,
  credit: /\bcredit\b/,
  category: /\b(category|type)\b/,
  // The running account balance AFTER the transaction (Chase checking exports it).
  // It is the deterministic disambiguator that lets us tell a TRUE re-import (same
  // balance) from a GENUINE repeat purchase (same date+amount+desc but a DIFFERENT
  // running balance) — so no legitimate second identical charge is dropped as a
  // "duplicate" (Christina's books, 2026-07-18). Optional: absent on many exports.
  balance: /\b(running balance|balance)\b/,
};
// A REAL payee column, preferred over the generic "Details"/type column. Chase
// CHECKING exports carry BOTH ("Details" = DEBIT/CREDIT/CHECK, "Description" =
// the merchant), and a first-match scan would otherwise grab "Details" — so every
// row's description came through as "DEBIT" (Christina's books, 2026-07-19). When a
// payee column exists it wins; otherwise the broad `desc` match still applies.
const DESC_PRIMARY = /\b(description|payee|merchant)\b/;
const HEADER_SCAN_LINES = 10;

// lines: the file's non-empty lines. Returns { headerRow, headers, idx, errors }
// — errors non-empty when no usable header exists in the scanned window.
export function findStatementHeader(lines) {
  let best = null;
  const limit = Math.min(lines.length, HEADER_SCAN_LINES);
  for (let row = 0; row < limit; row += 1) {
    const cells = parseCsvLine(lines[row]).map((h) => String(h || '').toLowerCase());
    const idx = {};
    for (const [kind, re] of Object.entries(HEADER_MATCHERS)) {
      idx[kind] = cells.findIndex((c) => re.test(c));
    }
    // Prefer a real payee column over the generic "Details"/type column when both
    // exist, so a Chase-checking export maps the merchant, not "DEBIT/CREDIT".
    const descPrimary = cells.findIndex((c) => DESC_PRIMARY.test(c));
    if (descPrimary !== -1) idx.desc = descPrimary;
    const score = (idx.date !== -1 ? 1 : 0) + (idx.desc !== -1 ? 1 : 0)
      + ((idx.amount !== -1 || idx.credit !== -1) ? 1 : 0);
    if (!best || score > best.score) best = { headerRow: row, headers: cells, idx, score };
    if (score === 3) break; // earliest full match wins
  }
  if (!best) {
    return { headerRow: 0, headers: [], idx: { date: -1, desc: -1, amount: -1, credit: -1, category: -1 }, errors: ['File is empty.'] };
  }
  const errors = [];
  if (best.idx.date === -1) errors.push('No Date column found.');
  if (best.idx.desc === -1) errors.push('No Description column found.');
  if (best.idx.amount === -1 && best.idx.credit === -1) errors.push('No Amount column found.');
  return { headerRow: best.headerRow, headers: best.headers, idx: best.idx, errors };
}

// Convert a parsed SheetJS workbook to CSV text using its FIRST non-empty sheet.
// Pure (takes the XLSX module + workbook) so it is unit-testable without a File
// or a dynamic import. Returns '' when no sheet has content.
export function workbookToCsv(XLSX, workbook) {
  const names = (workbook && workbook.SheetNames) || [];
  for (const name of names) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv && csv.trim()) return csv;
  }
  return '';
}

// Read an Excel File -> CSV text (lazy-loads SheetJS so it stays out of the main
// bundle). Throws on an unreadable workbook so the caller can surface an error.
export async function spreadsheetFileToCsv(file) {
  const buf = await file.arrayBuffer();
  const mod = await import('xlsx');
  const XLSX = mod.default || mod; // SheetJS ships CJS — normalize interop
  const wb = XLSX.read(buf, { type: 'array' });
  const csv = workbookToCsv(XLSX, wb);
  if (!csv) throw new Error('The spreadsheet has no readable rows.');
  return csv;
}

// Read ANY supported statement file -> CSV text. CSV / TSV / plain text passes
// straight through (unchanged behavior); Excel workbooks are converted. The
// returned string is what the Books CSV mapper consumes.
export async function statementFileToCsv(file) {
  if (isSpreadsheetFile(file)) return spreadsheetFileToCsv(file);
  return await file.text();
}

// -----------------------------------------------------------------------------
// parseDelimitedToRows — CSV text -> normalized transaction rows. The column
// mapping + date normalization the Books importer uses, exported here so the
// bulk importer (many files at once) can reuse the SAME proven mapping per file.
// Returns { rows: [{date, description, amount, category, ok}], headers, errors }.
// -----------------------------------------------------------------------------
export function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// parseAmount — a money cell -> a number, honoring the negative formats that
// spreadsheets and banks actually use (Christina's Excel, 2026-07-13). The old
// path did `parseFloat(cell.replace(/[$,]/g,'')) || 0`, so an accounting negative
// like "(1,234.56)" or a trailing-minus "1,234.56-" became NaN -> 0 — every
// parenthesized negative silently zeroed out and the imported total drifted off
// the real one. This honors: parentheses = negative, a leading OR trailing minus
// = negative, and strips stray currency symbols / thousands separators / spaces.
// Blank or truly non-numeric -> 0 (unchanged, so blank cells still import as 0).
// Pure.
export function parseAmount(raw) {
  let s = String(raw == null ? '' : raw).trim();
  if (!s) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); } // accounting ()
  if (/-\s*$/.test(s)) { negative = true; s = s.replace(/-\s*$/, ''); } // trailing -
  if (/^\s*-/.test(s)) { negative = true; s = s.replace(/^\s*-/, ''); } // leading -
  s = s.replace(/[^0-9.]/g, ''); // drop $, commas, currency codes, spaces
  if (!s || s === '.') return 0;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

export function normalizeDate(s) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { let [, mo, da, yr] = m; if (yr.length === 2) yr = (parseInt(yr, 10) > 50 ? '19' : '20') + yr; return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`; }
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) { let [, mo, da, yr] = m; if (yr.length === 2) yr = (parseInt(yr, 10) > 50 ? '19' : '20') + yr; return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`; }
  return s;
}

// -----------------------------------------------------------------------------
// parseOfx — OFX/QFX statement text -> the SAME normalized rows shape as the
// delimited parser, fully in-browser (the "we read it in your browser, nothing
// saves" promise on the landing upload was contradicted by the old path POSTing
// the raw file to an n8n webhook). OFX/QFX are SGML/XML: each transaction is a
// <STMTTRN> block with <DTPOSTED>, <TRNAMT>, and <NAME>/<MEMO>. Tolerant of both
// tag styles (SGML `<TAG>value` with no close, and XML `<TAG>value</TAG>`), which
// is why a generic XML parser is the wrong tool here. Reconciliation gate applies:
// every <STMTTRN> block is ingested or rejected-with-a-reason, never dropped.
// -----------------------------------------------------------------------------
export function isOfxFile(file) {
  if (!file) return false;
  if (/\.(ofx|qfx)$/i.test(file.name || '')) return true;
  const t = (file.type || '').toLowerCase();
  return t.includes('ofx') || t.includes('quicken') || t.includes('money');
}

// Read one OFX field value whether it is SGML (`<TAG>val`, ended by the next `<`
// or newline) or XML (`<TAG>val</TAG>`). Returns '' when absent.
function ofxField(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i'));
  return m ? m[1].trim() : '';
}

// OFX dates are YYYYMMDD (optionally with HHMMSS and a [tz] suffix). Normalize the
// leading 8 digits to YYYY-MM-DD; anything else falls through to normalizeDate.
function normalizeOfxDate(s) {
  const m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return normalizeDate(s);
}

export function parseOfx(text, { flipSign = false } = {}) {
  if (!text || !text.trim()) return { rows: [], rejected: [], reconciliation: reconcile(0, 0, 0), headers: [], errors: ['File is empty.'] };
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi)
    // Some exporters omit the closing tag; split on the opening tag as a fallback.
    || text.split(/<STMTTRN>/i).slice(1).map((b) => `<STMTTRN>${b}`);
  if (!blocks.length) {
    return { rows: [], rejected: [], reconciliation: reconcile(0, 0, 0), headers: [], errors: ['No transactions found. This does not look like an OFX/QFX statement.'] };
  }
  const rows = [];
  const rejected = [];
  blocks.forEach((block, i) => {
    const date = normalizeOfxDate(ofxField(block, 'DTPOSTED'));
    const rawAmt = ofxField(block, 'TRNAMT');
    const desc = ofxField(block, 'NAME') || ofxField(block, 'MEMO') || ofxField(block, 'PAYEE');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { rejected.push({ line: i + 1, reason: 'unreadable-date', raw: rawAmt, value: ofxField(block, 'DTPOSTED') }); return; }
    const num = parseFloat(String(rawAmt).replace(/[$,]/g, ''));
    if (!Number.isFinite(num)) { rejected.push({ line: i + 1, reason: 'unparseable-amount', raw: rawAmt }); return; }
    let amount = num;
    if (flipSign) amount = -amount;
    rows.push({ date, description: desc || '(no description)', amount, category: 'other', ok: true });
  });
  return { rows, rejected, reconciliation: reconcile(blocks.length, rows.length, rejected.length), headers: ['date', 'description', 'amount'], errors: [] };
}

// parseStatementText — one entry point: OFX/QFX -> parseOfx, else delimited/CSV.
// (Excel is converted to CSV upstream by statementFileToCsv before this is called.)
export function parseStatementText(text, { format = 'auto', flipSign = false } = {}) {
  const looksOfx = format === 'ofx' || format === 'qfx' || /<OFX>|<STMTTRN>/i.test(text || '');
  return looksOfx ? parseOfx(text, { flipSign }) : parseDelimitedToRows(text, { flipSign });
}

export function parseDelimitedToRows(text, { flipSign = false } = {}) {
  if (!text || !text.trim()) return { rows: [], headers: [], errors: ['File is empty.'] };
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], headers: [], errors: ['File is empty.'] };
  const { headerRow, headers, idx } = findStatementHeader(lines);
  const dataLines = lines.slice(headerRow + 1);
  const errors = [];
  if (idx.date === -1) errors.push('No Date column found.');
  if (idx.desc === -1) errors.push('No Description column found.');
  if (idx.amount === -1 && idx.credit === -1) errors.push('No Amount column found.');
  // RECONCILIATION GATE: never silently drop a row. Every source data row is
  // either ingested or rejected-with-a-reason, and ingested + rejected must
  // equal the source total. A missing column doesn't return an empty file — it
  // rejects EVERY row loudly with the schema reason, so the loss is visible.
  if (errors.length) {
    const reason = errors.join(' ');
    const rejected = dataLines.map((line, i) => ({ line: i + 2, reason, raw: line }));
    return { rows: [], rejected, reconciliation: reconcile(dataLines.length, 0, rejected.length), headers, errors };
  }
  const rows = [];
  const rejected = [];
  dataLines.forEach((line, i) => {
    const cells = parseCsvLine(line);
    const date = normalizeDate(cells[idx.date] || '');
    const desc = cells[idx.desc] || '';
    let amt = 0;
    if (idx.amount !== -1 && cells[idx.amount]) amt = parseAmount(cells[idx.amount]);
    else if (idx.credit !== -1 && cells[idx.credit]) amt = parseAmount(cells[idx.credit]);
    if (flipSign) amt = -amt;
    const category = idx.category !== -1 ? (cells[idx.category] || 'other').toLowerCase() : 'other';
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      rejected.push({ line: i + 2, reason: 'unreadable-date', raw: line, value: cells[idx.date] || '' });
      return;
    }
    if (!desc) { rejected.push({ line: i + 2, reason: 'missing-description', raw: line }); return; }
    // Carry the running balance through when the export has it (Chase does). It is
    // the dedupe disambiguator (see HEADER_MATCHERS.balance) AND the input to the
    // balance-continuity audit. Only attached when the cell is actually present +
    // numeric, so exports without a balance column are unchanged.
    const row = { date, description: desc, amount: amt, category, ok: true };
    if (idx.balance !== -1 && cells[idx.balance] != null && String(cells[idx.balance]).trim() !== '') {
      row.balance = parseAmount(cells[idx.balance]);
    }
    rows.push(row);
  });
  return { rows, rejected, reconciliation: reconcile(dataLines.length, rows.length, rejected.length), headers, errors: [] };
}

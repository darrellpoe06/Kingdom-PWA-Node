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
};
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

export function normalizeDate(s) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { let [, mo, da, yr] = m; if (yr.length === 2) yr = (parseInt(yr, 10) > 50 ? '19' : '20') + yr; return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`; }
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) { let [, mo, da, yr] = m; if (yr.length === 2) yr = (parseInt(yr, 10) > 50 ? '19' : '20') + yr; return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`; }
  return s;
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
    if (idx.amount !== -1 && cells[idx.amount]) amt = parseFloat(cells[idx.amount].replace(/[$,]/g, '')) || 0;
    else if (idx.credit !== -1 && cells[idx.credit]) amt = parseFloat(cells[idx.credit].replace(/[$,]/g, '')) || 0;
    if (flipSign) amt = -amt;
    const category = idx.category !== -1 ? (cells[idx.category] || 'other').toLowerCase() : 'other';
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      rejected.push({ line: i + 2, reason: 'unreadable-date', raw: line, value: cells[idx.date] || '' });
      return;
    }
    if (!desc) { rejected.push({ line: i + 2, reason: 'missing-description', raw: line }); return; }
    rows.push({ date, description: desc, amount: amt, category, ok: true });
  });
  return { rows, rejected, reconciliation: reconcile(dataLines.length, rows.length, rejected.length), headers, errors: [] };
}

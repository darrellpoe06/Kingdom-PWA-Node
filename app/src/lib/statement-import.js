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

const SPREADSHEET_RE = /\.(xlsx|xlsm|xlsb|xls)$/i;

// True when the file looks like an Excel workbook (by name or MIME).
export function isSpreadsheetFile(file) {
  if (!file) return false;
  if (SPREADSHEET_RE.test(file.name || '')) return true;
  const t = (file.type || '').toLowerCase();
  return t.includes('spreadsheetml') || t === 'application/vnd.ms-excel';
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
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const findCol = (...names) => { for (const n of names) { const i = headers.indexOf(n); if (i !== -1) return i; } return -1; };
  const idx = {
    date: findCol('transaction date', 'date', 'posted date', 'post date'),
    desc: findCol('description', 'details', 'memo', 'name', 'payee'),
    amount: findCol('amount', 'debit', 'transaction amount'),
    credit: findCol('credit'),
    category: findCol('category', 'type'),
  };
  const errors = [];
  if (idx.date === -1) errors.push('No Date column found.');
  if (idx.desc === -1) errors.push('No Description column found.');
  if (idx.amount === -1 && idx.credit === -1) errors.push('No Amount column found.');
  if (errors.length) return { rows: [], headers, errors };
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const date = normalizeDate(cells[idx.date] || '');
    const desc = cells[idx.desc] || '';
    let amt = 0;
    if (idx.amount !== -1 && cells[idx.amount]) amt = parseFloat(cells[idx.amount].replace(/[$,]/g, '')) || 0;
    else if (idx.credit !== -1 && cells[idx.credit]) amt = parseFloat(cells[idx.credit].replace(/[$,]/g, '')) || 0;
    if (flipSign) amt = -amt;
    const category = idx.category !== -1 ? (cells[idx.category] || 'other').toLowerCase() : 'other';
    const ok = !!date && !!desc && /^\d{4}-\d{2}-\d{2}$/.test(date);
    return { date, description: desc, amount: amt, category, ok };
  }).filter((r) => r.ok);
  return { rows, headers, errors: [] };
}

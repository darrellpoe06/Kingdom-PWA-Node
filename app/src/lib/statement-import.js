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

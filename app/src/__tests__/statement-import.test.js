// @vitest-environment node
//
// Proven-to-catch for the Excel-import fix (DR-0076). The bug: an uploaded .xlsx
// was read as plain text -> binary garbage -> "No Date column" -> ZERO rows
// imported (Christina's June/6-month upload silently produced nothing). These
// tests pin that an Excel workbook with the real Date/Description/Amount columns
// converts to CSV text the Books importer maps — so the rows reach the ledger
// and drive the derived balance. workbookToCsv is exercised against a REAL
// SheetJS workbook, not a mock.
import { describe, it, expect } from 'vitest';
import * as XLSXns from 'xlsx';
import { isSpreadsheetFile, workbookToCsv, parseDelimitedToRows } from '../lib/statement-import.js';

const XLSX = XLSXns.default || XLSXns;

function workbook(aoa, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  return wb;
}

describe('isSpreadsheetFile', () => {
  it('detects Excel by extension', () => {
    expect(isSpreadsheetFile({ name: 'June.xlsx' })).toBe(true);
    expect(isSpreadsheetFile({ name: 'Q2-2026.XLS' })).toBe(true);
    expect(isSpreadsheetFile({ name: 'macro.xlsm' })).toBe(true);
  });
  it('is false for CSV / text / null', () => {
    expect(isSpreadsheetFile({ name: 'statement.csv' })).toBe(false);
    expect(isSpreadsheetFile({ name: 'notes.txt' })).toBe(false);
    expect(isSpreadsheetFile(null)).toBe(false);
  });
  it('detects by MIME when the name is missing', () => {
    expect(isSpreadsheetFile({ name: '', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).toBe(true);
    expect(isSpreadsheetFile({ name: '', type: 'application/vnd.ms-excel' })).toBe(true);
  });
});

describe('workbookToCsv — Excel becomes the CSV the Books mapper consumes', () => {
  it('converts the first sheet to CSV with the Date/Description/Amount header + rows', () => {
    const wb = workbook([
      ['Date', 'Description', 'Amount'],
      ['06/02/2026', 'Payroll deposit', 2500],
      ['06/12/2026', 'Figure loan payment', -400],
      ['06/20/2026', 'Electric bill', -180],
    ]);
    const csv = workbookToCsv(XLSX, wb);
    const header = csv.split(/\r?\n/)[0].toLowerCase();
    // The Books importer keys on these exact column names.
    expect(header).toContain('date');
    expect(header).toContain('description');
    expect(header).toContain('amount');
    expect(csv).toContain('Payroll deposit');
    expect(csv).toContain('Figure loan payment');
    expect(csv).toContain('-400');
    expect(csv).toContain('-180');
  });
  it('skips a leading empty sheet and uses the first sheet with content', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), 'Empty');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Date', 'Description', 'Amount'], ['2026-06-01', 'Rent', -1100]]), 'June');
    expect(workbookToCsv(XLSX, wb)).toContain('Rent');
  });
  it('returns empty string when no sheet has content (caller surfaces an error)', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), 'Empty');
    expect(workbookToCsv(XLSX, wb)).toBe('');
  });
});

describe('parseDelimitedToRows — reconciliation gate (no silent drops)', () => {
  const CSV = [
    'Date,Description,Amount',
    '2026-05-01,County Market,-50',   // ok
    'not-a-date,Bad date row,-9',      // rejected: unreadable-date
    '2026-05-03,,-12',                 // rejected: missing-description
    '2026-05-05,Payroll,1200',         // ok (last row survives — no early stop)
  ].join('\n');

  it('accepts good rows, rejects the rest WITH reasons, and balances', () => {
    const r = parseDelimitedToRows(CSV);
    expect(r.rows.map((x) => x.description)).toEqual(['County Market', 'Payroll']);
    expect(r.rejected.map((x) => x.reason)).toEqual(['unreadable-date', 'missing-description']);
    expect(r.reconciliation.sourceTotal).toBe(4);
    expect(r.reconciliation.ingested).toBe(2);
    expect(r.reconciliation.rejected).toBe(2);
    expect(r.reconciliation.balanced).toBe(true);
    expect(r.reconciliation.unaccounted).toBe(0);
  });

  it('a missing column rejects EVERY row loudly (not an empty, silent result)', () => {
    const r = parseDelimitedToRows('Foo,Bar\n1,2\n3,4');
    expect(r.rows).toHaveLength(0);
    expect(r.rejected).toHaveLength(2); // both data rows accounted for
    expect(r.reconciliation.balanced).toBe(true); // 0 ingested + 2 rejected == 2 source
    expect(r.errors.join(' ')).toMatch(/No Date column/);
  });
});

// ---------------------------------------------------------------------------
// Header detection + file-type honesty (Darrell + Christina, 2026-07-03).
// Christina's CSV died with "No Description column found" because detection
// only ever read LINE 1 — exports often start with a title row. And a .jpg
// from the tablet's picker fell through to the CSV parser and produced three
// baffling column errors instead of naming the real problem.
// ---------------------------------------------------------------------------
import { findStatementHeader, looksImportableFile } from '../lib/statement-import.js';

describe('findStatementHeader — the header row is found wherever it is', () => {
  it('classic bank export: header on line 1', () => {
    const h = findStatementHeader(['Transaction Date,Description,Amount', '06/01/2026,WENDYS,-21.00']);
    expect(h.headerRow).toBe(0);
    expect(h.errors).toEqual([]);
  });
  it("Christina's case: a title/preamble line before the header no longer kills the import", () => {
    const h = findStatementHeader([
      'Imported transactions — June 2026',
      'Date,Payee,Amount,Category',
      '06/01/2026,WENDYS,-21.00,dining',
    ]);
    expect(h.headerRow).toBe(1);
    expect(h.errors).toEqual([]);
    expect(h.idx.desc).toBe(1); // Payee counts as the description column
  });
  it('synonym headers match by word: Posting Date / Merchant / Debit', () => {
    const h = findStatementHeader(['Posting Date,Merchant,Debit', '06/01/2026,KROGER,12.34']);
    expect(h.errors).toEqual([]);
    expect(h.idx.date).toBe(0);
    expect(h.idx.desc).toBe(1);
    expect(h.idx.amount).toBe(2);
  });
  it('Chase checking (Details BEFORE Description): maps the PAYEE column, not "DEBIT/CREDIT" (Christina 2026-07-19)', () => {
    const h = findStatementHeader([
      'Details,Posting Date,Description,Amount,Type,Balance',
      'DEBIT,07/16/2026,MCDONALD\'S F15879 CHAMPAIGN IL,-30.60,ACH_DEBIT,1234.56',
    ]);
    expect(h.errors).toEqual([]);
    expect(h.idx.desc).toBe(2);   // "Description" (payee) — NOT column 0 ("Details" = DEBIT/CREDIT)
    expect(h.idx.date).toBe(1);
    expect(h.idx.amount).toBe(3);
    expect(h.idx.balance).toBe(5);
    // And the row parses the real merchant, not the transaction type.
    const p = parseDelimitedToRows(
      'Details,Posting Date,Description,Amount,Type,Balance\nDEBIT,07/16/2026,MCDONALD\'S F15879 CHAMPAIGN IL,-30.60,ACH_DEBIT,1234.56'
    );
    expect(p.rows[0].description).toContain("MCDONALD'S");
    expect(p.rows[0].description).not.toBe('DEBIT');
  });
  it('falls back to Details/Memo when there is NO Description/Payee column', () => {
    const h = findStatementHeader(['Date,Details,Amount', '07/16/2026,SOME MEMO,-5.00']);
    expect(h.idx.desc).toBe(1); // Details is still accepted when it's the only description-ish column
  });
  it('a file with no usable header anywhere still fails loudly with the column errors', () => {
    const h = findStatementHeader(['just,some,garbage', 'more,random,cells']);
    expect(h.errors.join(' ')).toMatch(/No Date column/);
    expect(h.errors.join(' ')).toMatch(/No Description column/);
    expect(h.errors.join(' ')).toMatch(/No Amount column/);
  });
});

describe('parseDelimitedToRows rides the header finder (bulk path fixed too)', () => {
  it('imports rows from a file whose header sits under a title line', () => {
    const r = parseDelimitedToRows('My Export\nDate,Description,Amount\n06/01/2026,WENDYS,-21.00');
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].description).toBe('WENDYS');
    expect(r.reconciliation.balanced).toBe(true);
  });
});

describe('looksImportableFile — photos and PDFs are named, not parsed', () => {
  it('rejects a photo and a PDF', () => {
    expect(looksImportableFile({ name: '20260702_135507.jpg', type: 'image/jpeg' })).toBe(false);
    expect(looksImportableFile({ name: 'statement.pdf', type: 'application/pdf' })).toBe(false);
  });
  it('accepts csv / excel / text exports (by name or MIME)', () => {
    expect(looksImportableFile({ name: 'imported-transactions.csv', type: 'text/csv' })).toBe(true);
    expect(looksImportableFile({ name: 'June.xlsx', type: '' })).toBe(true);
    expect(looksImportableFile({ name: 'export', type: 'text/plain' })).toBe(true);
  });
});

import { parseAmount } from '../lib/statement-import.js';

describe('parseAmount — accounting negatives stop importing as 0 (Christina 2026-07-13)', () => {
  it('parses plain, currency, and thousands-separated positives', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
    expect(parseAmount('$1,234.56')).toBe(1234.56);
    expect(parseAmount('1,234.56')).toBe(1234.56);
  });
  it('reads parenthesized accounting negatives as negative, NOT 0 (the bug)', () => {
    expect(parseAmount('(1,234.56)')).toBe(-1234.56);
    expect(parseAmount('($50.00)')).toBe(-50);
  });
  it('reads leading and trailing minus as negative', () => {
    expect(parseAmount('-1,234.56')).toBe(-1234.56);
    expect(parseAmount('1,234.56-')).toBe(-1234.56);
  });
  it('blank / non-numeric -> 0 (unchanged), so blank cells still import as 0', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount('N/A')).toBe(0);
  });
  it('a parenthesized negative reaches the ledger through the delimited parser', () => {
    // The end-to-end proof: before the fix this row imported as 0.
    const r = parseDelimitedToRows('Date,Description,Amount\n06/01/2026,REFUND,(21.00)');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].amount).toBe(-21);
  });
});

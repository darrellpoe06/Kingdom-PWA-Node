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
import { isSpreadsheetFile, workbookToCsv } from '../lib/statement-import.js';

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

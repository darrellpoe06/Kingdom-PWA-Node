// @vitest-environment node
//
// report-export — the shared Download + Print primitive. Proves the exported CSV
// and print-HTML are DETERMINISTIC and reconcile to the on-screen numbers: the
// CSV is clean raw data whose Amount column sums to the grand total, and the
// print page carries every group subtotal + the grand total (Darrell 2026-07-01:
// a downloaded/printed report must show TRUE numbers that match the view).
import { describe, it, expect } from 'vitest';
import { reportToCSV, csvNetTotal, reportToPrintHTML, fmtMoney2 } from '../lib/report-export.js';

const MODEL = {
  title: 'Imported transactions',
  meta: [{ label: 'Period', value: 'June 2026' }],
  columns: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'payee', label: 'Payee', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'money', align: 'right' },
  ],
  groups: [
    { label: 'University of IL Payroll', subtotal: { in: 4199.86, out: 0, net: 4199.86, count: 2 }, rows: [
      { date: 'Jun 15, 2026', payee: 'University of IL Payroll', amount: 2099.93 },
      { date: 'Jun 30, 2026', payee: 'University of IL Payroll', amount: 2099.93 },
    ] },
    { label: 'TLC Therapy', subtotal: { in: 1500, out: 0, net: 1500, count: 1 }, rows: [
      { date: 'Jun 28, 2026', payee: 'TLC Therapy', amount: 1500 },
    ] },
  ],
  total: { in: 5699.86, out: 0, net: 5699.86, count: 3 },
};

describe('reportToCSV — clean raw data that sums to the on-screen total', () => {
  it('has a Group column + header, one row per line item, no subtotal/total rows', () => {
    const csv = reportToCSV(MODEL);
    const rows = csv.trim().split('\r\n');
    expect(rows[0]).toBe('Group,Date,Payee,Amount');
    expect(rows).toHaveLength(4); // header + 3 line items (no subtotal/total rows pollute the sum)
    expect(rows.some((r) => /^Subtotal/.test(r) || /^TOTAL/.test(r))).toBe(false);
  });
  it('quotes cells containing commas (dates) and writes money as plain 2dp numbers', () => {
    const csv = reportToCSV(MODEL);
    expect(csv).toContain('University of IL Payroll,"Jun 15, 2026",University of IL Payroll,2099.93');
  });
  it('the Amount column sums EXACTLY to the grand total (report == view)', () => {
    expect(csvNetTotal(MODEL)).toBe(5699.86);
    expect(csvNetTotal(MODEL)).toBe(MODEL.total.net);
  });
});

describe('reportToPrintHTML — print-friendly, carries subtotals + grand total', () => {
  const html = reportToPrintHTML(MODEL);
  it('is a full printable document with the title + meta', () => {
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('Imported transactions');
    expect(html).toContain('June 2026');
    expect(html).toContain('@media print');           // print CSS present
    expect(html).toContain('page-break-inside: avoid'); // clean page breaks
  });
  it('shows each group with its subtotal and a grand total that ties out', () => {
    expect(html).toContain('University of IL Payroll');
    expect(html).toContain('net ' + fmtMoney2(4199.86)); // group subtotal
    expect(html).toContain('TLC Therapy');
    expect(html).toContain('net ' + fmtMoney2(1500));
    expect(html).toContain('net ' + fmtMoney2(5699.86)); // grand total
  });
  it('escapes HTML in data (no injection from a payee name)', () => {
    const evil = { ...MODEL, groups: [{ label: '<script>x</script>', rows: [{ date: '', payee: '<b>hi</b>', amount: 1 }], subtotal: { in: 1, out: 0, net: 1, count: 1 } }], total: { in: 1, out: 0, net: 1, count: 1 } };
    const out = reportToPrintHTML(evil);
    expect(out).not.toContain('<script>x</script>');
    expect(out).toContain('&lt;script&gt;');
  });
});

describe('fmtMoney2', () => {
  it('formats with sign, $ and 2dp', () => {
    expect(fmtMoney2(5699.86)).toBe('$5,699.86');
    expect(fmtMoney2(-80)).toBe('-$80.00');
    expect(fmtMoney2(0)).toBe('$0.00');
  });
});

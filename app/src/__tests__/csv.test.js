// @vitest-environment node
// Pins the dependency-free CSV encoder/parser that backs Referral DB export/import.
// Proven-to-catch (DR-0076): the tricky cases (quoted comma, quoted newline,
// escaped quote) are exactly what a naive split(',') corrupts into a bad record.
import { describe, it, expect } from 'vitest';
import { toCsv, parseCsv } from '../lib/csv.js';

describe('toCsv', () => {
  it('writes a header line + rows, quoting only when needed', () => {
    const out = toCsv(['A', 'B'], [{ A: 'x', B: 'y' }, { A: 'has,comma', B: 'plain' }]);
    expect(out).toBe('A,B\r\nx,y\r\n"has,comma",plain');
  });
  it('escapes inner quotes and quotes fields with newlines', () => {
    const out = toCsv(['N'], [{ N: 'say "hi"' }, { N: 'line1\nline2' }]);
    expect(out).toContain('"say ""hi"""');
    expect(out).toContain('"line1\nline2"');
  });
  it('fills missing keys with empty and tolerates junk', () => {
    expect(toCsv(['A', 'B'], [{ A: 'only' }])).toBe('A,B\r\nonly,');
    expect(toCsv([], [])).toBe('');
  });
});

describe('parseCsv', () => {
  it('round-trips a value with a comma, a quote, and a newline', () => {
    const rows = [{ Name: 'Smith, Co', Note: 'said "yes"\nfollow up' }];
    const parsed = parseCsv(toCsv(['Name', 'Note'], rows));
    expect(parsed.headers).toEqual(['Name', 'Note']);
    expect(parsed.rows).toEqual(rows);
  });
  it('handles CRLF and a trailing blank line', () => {
    const { rows } = parseCsv('A,B\r\n1,2\r\n3,4\r\n');
    expect(rows).toEqual([{ A: '1', B: '2' }, { A: '3', B: '4' }]);
  });
  it('fills short rows and strips a BOM', () => {
    const { headers, rows } = parseCsv('﻿A,B,C\r\nx');
    expect(headers).toEqual(['A', 'B', 'C']);
    expect(rows).toEqual([{ A: 'x', B: '', C: '' }]);
  });
  it('returns empty structure for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });
});

// The only reason his document has an order is that Christina types the date.
//
// Darrell, 2026-09-22, over a screenshot of his own working page:
//
//   "Make sure each entry automatically adds a date and time stamp to the
//    document... like Christina is already doing at times... that why it reads
//    chronological... make sense?"
//
// It makes sense and his own page proves it. The document carries hand-typed
// lines — 9.22.26, 8.24.26, 8.25.26 — and beneath each one the entries are
// anchored. Where nobody typed one, a block floats: "Go to DMV for BG" sits
// between two dated groups and belongs to neither, so there is no way to know
// when it was written or which day it was for.
//
// THE FORMAT IS HERS, EXACTLY: M.D.YY, no leading zeros. Not ISO, not
// "September 22". A stamp in a different shape would split one document into
// two chronologies and make the ordering problem worse rather than better —
// which is why the format is a tested property here and not a preference.
//
// ONE STAMP PER DAY, and the rule is "does today appear AT ALL", not "is the
// last stamp today". His page is written newest-first at the top; a rule keyed
// to the last stamp would re-stamp every time he typed under an older group.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  formatEntryStamp, findEntryStamps, needsEntryStamp, entryStampHtml,
} from '../lib/entry-stamp.js';

const WORKSPACE = readFileSync(resolve(__dirname, '../components/CreationWorkspace.jsx'), 'utf8');

// His actual page, as the screenshot shows it.
const HIS_PAGE = `<p>9.22.26</p><p>Make a sign for the table that says meet our team.</p>`
  + `<p>Go to DMV for BG ✔</p>`
  + `<p>8.24.26</p><p>Pay sanitary bill for 709✔</p><p>Get Sheronda paperwork✔</p>`
  + `<p>8.25.26</p><p>Order shower head✔</p><p>Get bike chain✔</p>`;

describe('the stamp is in Christina’s format, because that is what is on the page', () => {
  it('writes M.D.YY with no leading zeros', () => {
    expect(formatEntryStamp(new Date(2026, 8, 22))).toBe('9.22.26');
    expect(formatEntryStamp(new Date(2026, 7, 24))).toBe('8.24.26');
  });

  it('single-digit days and months stay single-digit', () => {
    expect(formatEntryStamp(new Date(2025, 11, 7))).toBe('12.7.25');
    expect(formatEntryStamp(new Date(2026, 0, 1))).toBe('1.1.26');
  });

  it('is NOT ISO — a second format would split the document into two chronologies', () => {
    const s = formatEntryStamp(new Date(2026, 8, 22));
    expect(s).not.toMatch(/2026-09-22/);
    expect(s).not.toMatch(/September/);
  });

  it('the time is optional and separate, because her convention has none', () => {
    expect(formatEntryStamp(new Date(2026, 8, 22, 18, 8))).toBe('9.22.26');
    expect(formatEntryStamp(new Date(2026, 8, 22, 18, 8), { withTime: true })).toBe('9.22.26 · 6:08 PM');
  });

  it('renders 12-hour time the way the app already does elsewhere', () => {
    expect(formatEntryStamp(new Date(2026, 8, 22, 0, 5), { withTime: true })).toBe('9.22.26 · 12:05 AM');
    expect(formatEntryStamp(new Date(2026, 8, 22, 12, 0), { withTime: true })).toBe('9.22.26 · 12:00 PM');
  });

  it('a bad date does not produce a bad stamp', () => {
    expect(formatEntryStamp(new Date('nonsense'))).toMatch(/^\d{1,2}\.\d{1,2}\.\d{2}$/);
  });
});

describe('it reads the stamps already in HIS document', () => {
  it('finds all three of Christina’s hand-typed dates, in order', () => {
    expect(findEntryStamps(HIS_PAGE).map((s) => s.raw)).toEqual(['9.22.26', '8.24.26', '8.25.26']);
  });

  it('does not mistake a version number or a decimal for a date', () => {
    expect(findEntryStamps('<p>v28.1.26 build</p><p>cost 1.50</p>')).toHaveLength(0);
  });

  it('an empty document has none', () => {
    expect(findEntryStamps('')).toHaveLength(0);
    expect(findEntryStamps(undefined)).toHaveLength(0);
  });
});

describe('one stamp a day — and the rule is "does today appear at all"', () => {
  it('a document that already carries today needs none', () => {
    expect(needsEntryStamp(HIS_PAGE, new Date(2026, 8, 22))).toBe(false);
  });

  it('REPRODUCES THE ORDERING BUG: a new day is unstamped and needs one', () => {
    expect(needsEntryStamp(HIS_PAGE, new Date(2026, 8, 23))).toBe(true);
  });

  it('typing under an OLDER group does not re-stamp — the newest-first layout is safe', () => {
    // A rule keyed to "the last stamp is not today" would return true here,
    // because his page ends on 8.25.26, and would stamp the document again
    // every time he added a line to an old group.
    expect(needsEntryStamp(HIS_PAGE, new Date(2026, 8, 22))).toBe(false);
  });

  it('an empty document needs one — that is the first entry of the day', () => {
    expect(needsEntryStamp('', new Date(2026, 8, 22))).toBe(true);
  });

  it('the same day in a different YEAR still needs its own stamp', () => {
    expect(needsEntryStamp('<p>9.22.25</p><p>last year</p>', new Date(2026, 8, 22))).toBe(true);
  });
});

describe('the stamp goes in as its own line', () => {
  it('is a paragraph, marked so it can be found later', () => {
    expect(entryStampHtml(new Date(2026, 8, 22))).toBe('<p data-entry-stamp="1">9.22.26</p>');
  });

  it('carries the time when asked', () => {
    expect(entryStampHtml(new Date(2026, 8, 22, 18, 8), { withTime: true })).toContain('9.22.26 · 6:08 PM');
  });
});

describe('the editor actually uses it', () => {
  it('stamps on the first input of the day, not on open', () => {
    // Stamping on mount would date entries he never wrote.
    expect(WORKSPACE).toMatch(/onInput=\{\(\) => \{ autoStamp\(\); setDirty\(true\); \}\}/);
    expect(WORKSPACE).toMatch(/if \(!needsEntryStamp\(html\)\) \{ stampedRef\.current = true; return; \}/);
  });

  it('fires once per mount, so one day gets one stamp', () => {
    expect(WORKSPACE).toMatch(/if \(stampedRef\.current \|\| typeof document === 'undefined'\) return;/);
  });

  it('and he can still place one by hand, with or without the time', () => {
    expect(WORKSPACE).toMatch(/data-testid="insert-date-stamp"/);
    expect(WORKSPACE).toMatch(/data-testid="insert-date-time-stamp"/);
  });

  it('the button shows the real date rather than the word "Date"', () => {
    expect(WORKSPACE).toMatch(/\{formatEntryStamp\(new Date\(\)\)\}<\/button>/);
  });
});

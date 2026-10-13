// @vitest-environment node
// =============================================================================
// Proving our ways — the report cannot claim what it has not measured
// =============================================================================
// Darrell 2026-10-08: "Are there metrics for my family for their use of the
// PoeTech App... to see if they are testing and using evaluating the functions
// based on the use" and "Where inside the PoeTech App is the reports and
// historical information and framework for our culturally responsive
// evaluation and assessments to make sure we are producing His Will with our
// ways and tools? Comprehensive module/s"
//
// The hazard this file exists for is the one the module itself is about: a
// measurement that reports a number it did not measure. Three ways that could
// happen here, and a test for each:
//   1. a registry row with no wiring, so the app can never record it and the
//      report prints "not tried" about a function it is blind to;
//   2. an unreadable snapshot rendered as "nothing has been tried";
//   3. a day with no snapshot written into the history as a zero.
//
// And the standard is held to the same rule every lesson is: each verse in it
// is pinned verbatim against the in-repo KJV corpus.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROVING_DIMENSIONS, SHIPPED_FUNCTIONS, shippedByEvent, daysBetween,
  tryStatus, provingSummary, provingLine, assessmentHistory, assessmentDirection,
} from '../lib/proving-our-ways.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const APP = join(ROOT, 'app', 'src');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const flow = (name, ch) => {
  const c = chapters[String(name).replace(/\s+/g, '').toLowerCase()];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

/** Every .js/.jsx under app/src, so "is it wired" is asked of the real app. */
function sources(dir = APP, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') sources(p, out); continue; }
    if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const ALL_SRC = sources().map((p) => readFileSync(p, 'utf8')).join('\n');

describe('the registry cannot claim a function the app never records', () => {
  it('every registered function is actually wired to noteUse somewhere in the app', () => {
    const unwired = SHIPPED_FUNCTIONS
      .filter((f) => !ALL_SRC.includes(`noteUse('${f.event}')`))
      .map((f) => f.event);
    expect(unwired, `registered but never recorded: ${unwired.join(', ')}`).toEqual([]);
  });

  it('every registered function is whole: an event, a label, a place, a DR and a day', () => {
    for (const f of SHIPPED_FUNCTIONS) {
      expect(f.event, 'event').toMatch(/^[a-z]+\.[a-zA-Z]+$/);
      expect(f.label.length, `${f.event} label`).toBeGreaterThan(8);
      expect(f.where.length, `${f.event} where`).toBeGreaterThan(2);
      expect(f.dr, `${f.event} dr`).toMatch(/^DR-\d{4}$/);
      expect(f.shipped, `${f.event} shipped`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(shippedByEvent().size).toBe(SHIPPED_FUNCTIONS.length);
  });

  it('PROVEN TO CATCH: an unwired row is found', () => {
    const planted = [...SHIPPED_FUNCTIONS, { event: 'ghost.feature', label: 'Never wired', where: 'Nowhere', dr: 'DR-0000', shipped: '2026-01-01' }];
    const unwired = planted.filter((f) => !ALL_SRC.includes(`noteUse('${f.event}')`)).map((f) => f.event);
    expect(unwired).toEqual(['ghost.feature']);
  });
});

describe('tried or not tried, read from real rows', () => {
  const NOW = Date.parse('2026-10-08T12:00:00Z');
  const rows = [
    { name: 'camera.window', count: 7, people: 2, last_at: '2026-10-08T10:00:00Z' },
    { name: 'reader.read', count: 1, people: 1, last_at: '2026-10-01T09:00:00Z' },
  ];

  it('a function with rows is tried; one without is NOT TRIED, not a zero count dressed as a finding', () => {
    const st = tryStatus(rows, NOW);
    const win = st.find((s) => s.event === 'camera.window');
    expect(win).toMatchObject({ tried: true, uses: 7, people: 2 });
    const pointer = st.find((s) => s.event === 'reader.pointer');
    expect(pointer.tried).toBe(false);
    expect(pointer.uses).toBe(0);
    expect(pointer.lastAt).toBe('');
  });

  it('counts the days since a thing shipped, so the longest wait can be named', () => {
    expect(daysBetween('2026-10-06', Date.parse('2026-10-08T12:00:00Z'))).toBe(2);
    expect(daysBetween('nonsense', NOW)).toBe(null);
    expect(daysBetween('2026-10-06', NaN)).toBe(null);
  });

  it('the summary counts what is there and names the longest untried', () => {
    const s = provingSummary(tryStatus(rows, NOW));
    expect(s.shipped).toBe(SHIPPED_FUNCTIONS.length);
    expect(s.tried).toBe(2);
    expect(s.untried).toBe(SHIPPED_FUNCTIONS.length - 2);
    expect(s.people).toBe(2);
    expect(s.longestUntried.event).toBe('textsize.change'); // shipped 2026-07-10, the oldest untried
  });

  it('an UNREADABLE snapshot never reads as "nothing has been tried"', () => {
    const s = provingSummary(tryStatus([], NOW));
    expect(provingLine(s, false)).toMatch(/could not|No usage snapshot/i);
    expect(provingLine(s, false)).not.toMatch(/0 of|have been tried\./);
    // And a readable snapshot with nothing in it says the true thing instead.
    expect(provingLine(s, true)).toMatch(/^0 of \d+ registered functions have been tried\./);
  });

  it('says so plainly when everything has been tried', () => {
    const all = SHIPPED_FUNCTIONS.map((f) => ({ name: f.event, count: 1, people: 1, last_at: '2026-10-08T00:00:00Z' }));
    const s = provingSummary(tryStatus(all, NOW));
    expect(provingLine(s, true)).toBe(`All ${SHIPPED_FUNCTIONS.length} registered functions have been tried.`);
  });
});

describe('the record over time', () => {
  const H = [
    { at: '2026-10-06', tried: 2, shipped: 8 },
    { at: '2026-10-08', tried: 5, shipped: 8 },
    { at: '2026-10-07', tried: 4, shipped: 8 },
  ];
  it('is newest first with a share per day', () => {
    const rows = assessmentHistory(H);
    expect(rows.map((r) => r.at)).toEqual(['2026-10-08', '2026-10-07', '2026-10-06']);
    expect(rows[0].share).toBe(63);
    expect(rows[2].share).toBe(25);
  });
  it('says which way it is going, and says when it cannot', () => {
    expect(assessmentDirection(assessmentHistory(H)).word).toMatch(/^Up 13 points/);
    expect(assessmentDirection([]).known).toBe(false);
    expect(assessmentDirection(assessmentHistory([{ at: '2026-10-08', tried: 5, shipped: 8 }])).known).toBe(false);
  });
  it('a malformed or empty row is dropped rather than counted as a zero day', () => {
    expect(assessmentHistory([null, { at: 5 }, { tried: 'x' }, { at: '2026-10-08', tried: 1, shipped: 4 }]))
      .toEqual([{ at: '2026-10-08', tried: 1, shipped: 4, share: 25 }]);
  });
});

describe('the standard itself', () => {
  it('has a question and a verse for every dimension', () => {
    expect(PROVING_DIMENSIONS.length).toBeGreaterThanOrEqual(8);
    for (const d of PROVING_DIMENSIONS) {
      expect(d.key).toMatch(/^[a-z-]+$/);
      expect(d.title.length).toBeGreaterThan(20);
      expect(d.asks).toMatch(/\?$/);
      expect(d.verse).toMatch(/^[1-3]?\s?[A-Za-z]+ \d+:\d+$/);
    }
    expect(new Set(PROVING_DIMENSIONS.map((d) => d.key)).size).toBe(PROVING_DIMENSIONS.length);
  });

  it('every verse in the standard is verbatim in the KJV corpus', () => {
    const bad = [];
    for (const d of PROVING_DIMENSIONS) {
      const [, book, ch] = d.verse.match(/^([1-3]?\s?[A-Za-z]+) (\d+):\d+$/);
      const f = flow(book, ch);
      if (!f) { bad.push(`${d.key}: no such book ${book}`); continue; }
      if (!f.includes(norm(d.text))) bad.push(`${d.key}: ${d.verse}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word in a standard verse is found', () => {
    const [, book, ch] = 'Proverbs 20:10'.match(/^([1-3]?\s?[A-Za-z]+) (\d+):\d+$/);
    const f = flow(book, ch);
    expect(f.includes('Divers weights, and divers measures, both of them are alike abomination to the LORD.')).toBe(true);
    expect(f.includes('Divers weights, and divers measures, both of them are alike an abomination to the LORD.')).toBe(false);
  });

  it('names what it does NOT measure, on the surface, not only in a comment', () => {
    const jsx = readFileSync(join(APP, 'components', 'ProvingOurWays.jsx'), 'utf8');
    expect(jsx).toContain('What this does not yet measure');
    expect(jsx).toContain('not whether it served the');
    expect(jsx).toContain('data-testid="proving-unreadable"');
  });
});

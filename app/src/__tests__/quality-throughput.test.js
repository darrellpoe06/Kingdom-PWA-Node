// Quality & Throughput board (DR-0089) — the pure core + the cross-seam guards.
//
// Proven-to-catch (DR-0076): the census counter is exercised against fixtures
// with a KNOWN census (a miscount fails), the lessons parser against a fixture
// with KNOWN principles (a drift in the doc format fails loudly instead of
// silently dropping principles), and the WHY registry is verified against the
// REAL decision ledger + the REAL LESSONS-LEARNED doc — a DR or principle id
// that stops resolving fails this suite, so the number-to-why pairing can never
// silently rot. The wiring guards keep the board mounted in the steward seat
// and its defines declared in the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { censusFromSources, buildTestCensus } from '../../../scripts/test-census.mjs';
import { parseLessons, buildLessonsManifest } from '../../../scripts/lessons-manifest.mjs';
import {
  normalizeCensus, normalizeLessons, drIndex, resolveWhy, WHY,
  opsThroughput, commandDurationMs, fmtMs, auditTile, harvestTile,
} from '../lib/quality-throughput.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// --- test census (the measured suite size) -----------------------------------

describe('censusFromSources counts exactly (proven-to-catch)', () => {
  it('counts it/test call sites, modifiers included, look-alikes excluded', () => {
    const text = [
      "it('a', () => {})",
      "test('b', () => {})",
      "it.skip('c', () => {})",
      "test.only('d', () => {})",
      "visit('not a test')",
      "unit('not a test either')",
      "profit('nope')",
    ].join('\n');
    expect(censusFromSources([{ path: 'x.test.js', text }])).toEqual({ files: 1, callSites: 4, eachSuites: 0 });
  });
  it('counts .each suites separately (they expand at runtime)', () => {
    const text = "it.each([[1],[2]])('n %i', () => {})\ntest.each`a`('t', () => {})";
    const c = censusFromSources([{ path: 'y.test.js', text }]);
    expect(c.eachSuites).toBe(2);
  });
  it('the real tree censuses non-trivially (files and call sites both present)', () => {
    const real = buildTestCensus();
    expect(real.ok).toBe(true);
    expect(real.files).toBeGreaterThan(100);
    expect(real.callSites).toBeGreaterThan(real.files); // more tests than files, always
  });
});

// --- lessons parser -----------------------------------------------------------

const LESSONS_FIXTURE = `
## Principles Extracted (running index)

intro line.

- **P1 — First rule stated in bold.** Elaboration text here. (Extracted: 2026-06-03 fixture incident.)
- **P3 — Third rule.** More detail
  wrapping onto a second line. (Extracted: 2026-06-05 other incident.)
- **P2 — Second rule out of order.** Detail. (Extracted: 2026-06-04.)

## Incident Log (chronological — newest first)

### 2026-06-05 — Second incident title
body

### 2026-06-03 (evening) — First incident title
body
`;

describe('parseLessons parses the real format (proven-to-catch)', () => {
  it('extracts principles with id, rule, detail, and extraction source, sorted by number', () => {
    const m = parseLessons(LESSONS_FIXTURE);
    expect(m.ok).toBe(true);
    expect(m.principles.map((p) => p.id)).toEqual(['P1', 'P2', 'P3']);
    expect(m.principles[0].rule).toBe('First rule stated in bold.');
    expect(m.principles[0].extracted).toContain('2026-06-03');
    expect(m.principles[2].detail).toContain('wrapping onto a second line');
  });
  it('extracts dated incidents, keeping the (when) qualifier', () => {
    const m = parseLessons(LESSONS_FIXTURE);
    expect(m.incidents).toEqual([
      { date: '2026-06-05', when: '', title: 'Second incident title' },
      { date: '2026-06-03', when: 'evening', title: 'First incident title' },
    ]);
  });
  it('degrades honestly on a doc with no principles section', () => {
    const m = parseLessons('# nothing here');
    expect(m.ok).toBe(false);
    expect(m.principles).toEqual([]);
  });
  it('parses the REAL foundation doc (P1 exists; every id is unique)', () => {
    const real = buildLessonsManifest();
    expect(real.ok).toBe(true);
    const ids = real.principles.map((p) => p.id);
    expect(ids).toContain('P1');
    expect(new Set(ids).size).toBe(ids.length);
    expect(real.incidents.length).toBeGreaterThan(0);
  });
});

// --- normalizers degrade honestly ----------------------------------------------

describe('define normalizers', () => {
  it('normalizeCensus treats a missing/failed define as unavailable, never zero-as-fact', () => {
    expect(normalizeCensus(null).ok).toBe(false);
    expect(normalizeCensus({ ok: false }).ok).toBe(false);
    const n = normalizeCensus({ ok: true, files: '3', callSites: 10, eachSuites: 1, source: 's' });
    expect(n).toEqual({ ok: true, files: 3, callSites: 10, eachSuites: 1, source: 's' });
  });
  it('normalizeLessons guards shape', () => {
    expect(normalizeLessons(undefined).principles).toEqual([]);
    expect(normalizeLessons({ ok: true, principles: [{ id: 'P1' }], incidents: [] }).principles).toHaveLength(1);
  });
  it('drIndex indexes by id and survives a missing ledger', () => {
    expect(drIndex(null)).toEqual({});
    const idx = drIndex({ items: [{ id: 'DR-0001', title: 't' }] });
    expect(idx['DR-0001'].title).toBe('t');
  });
});

// --- ops throughput math --------------------------------------------------------

describe('opsThroughput measures, never invents', () => {
  const cmd = (status, startedAt, finishedAt) => ({ status, startedAt, finishedAt, createdAt: startedAt });
  it('computes counts and average duration over rows with real timestamps only', () => {
    const rows = [
      cmd('done', '2026-07-03T01:00:00Z', '2026-07-03T01:00:10Z'), // 10s
      cmd('done', '2026-07-03T01:01:00Z', '2026-07-03T01:01:30Z'), // 30s
      cmd('done', null, null), // no timestamps -> contributes nothing
      cmd('skipped', null, null),
    ];
    const t = opsThroughput(rows);
    expect(t.done).toBe(3);
    expect(t.skipped).toBe(1);
    expect(t.avgMs).toBe(20000);
    expect(t.status).toBe('good');
  });
  it('an error in the window is a problem; in-flight is attention; empty is idle', () => {
    expect(opsThroughput([cmd('error', null, null)]).status).toBe('problem');
    expect(opsThroughput([cmd('queued', null, null)]).status).toBe('attention');
    expect(opsThroughput([]).status).toBe('idle');
    expect(opsThroughput(null).status).toBe('idle');
  });
  it('commandDurationMs rejects reversed or missing timestamps', () => {
    expect(commandDurationMs({ startedAt: '2026-07-03T01:00:10Z', finishedAt: '2026-07-03T01:00:00Z' })).toBe(null);
    expect(commandDurationMs({})).toBe(null);
    expect(commandDurationMs({ startedAt: '2026-07-03T01:00:00Z', finishedAt: '2026-07-03T01:00:01Z' })).toBe(1000);
  });
  it('fmtMs renders honest units and an em-dash for no measurement', () => {
    expect(fmtMs(null)).toBe('—');
    expect(fmtMs(900)).toBe('900ms');
    expect(fmtMs(42000)).toBe('42s');
    expect(fmtMs(190000)).toBe('3m 10s');
  });
});

// --- audit + harvest tiles -------------------------------------------------------

describe('auditTile / harvestTile', () => {
  it('audit: critical is red, open is amber, clean is green', () => {
    expect(auditTile({ summary: { total: 2, critical: 1 } }).status).toBe('problem');
    expect(auditTile({ summary: { total: 4, critical: 0 }, resolvedSinceLast: 2 })).toMatchObject({ status: 'attention', open: 4, resolved: 2 });
    expect(auditTile({ summary: { total: 0, critical: 0 } }).status).toBe('good');
    expect(auditTile(null).status).toBe('good'); // zero findings is honestly clean
  });
  it('harvest: orphans are red, an unloaded ledger is idle-not-zero', () => {
    expect(harvestTile(null).ok).toBe(false);
    expect(harvestTile({ videos: 0, transcribedVideos: 0, avgPct: 0 }).status).toBe('idle');
    expect(harvestTile({ videos: 10, orphans: 2, avgPct: 40 }).status).toBe('problem');
    expect(harvestTile({ videos: 10, orphans: 0, avgPct: 37, transcribedVideos: 4, fullyHarvested: 1 })).toMatchObject({ status: 'attention', avgPct: 37 });
  });
});

// --- the WHY resolver + the pairing can never rot --------------------------------

describe('resolveWhy pairs numbers with the real record', () => {
  const drs = drIndex({ items: [{ id: 'DR-0076', title: 'Verification Doctrine', status: 'accepted', date: '2026-06-15' }] });
  const lessons = { principles: [{ id: 'P4', rule: 'Test in the failure mode.', detail: 'd' }] };
  it('resolves found refs with their real titles', () => {
    const w = resolveWhy('tests', drs, lessons);
    const dr = w.refs.find((r) => r.id === 'DR-0076');
    expect(dr).toMatchObject({ found: true, title: 'Verification Doctrine' });
    const p4 = w.refs.find((r) => r.id === 'P4');
    expect(p4).toMatchObject({ found: true, title: 'Test in the failure mode.' });
  });
  it('surfaces a missing ref as missing, never fabricated', () => {
    const w = resolveWhy('tests', {}, { principles: [] });
    expect(w.refs.every((r) => r.found === false)).toBe(true);
    expect(w.refs.map((r) => r.id)).toContain('DR-0076');
  });
  it('an unknown metric resolves to an empty why', () => {
    expect(resolveWhy('nope', drs, lessons)).toEqual({ note: '', refs: [] });
  });
});

describe('cross-seam guards — the pairing and the mount stay wired', () => {
  it('every WHY decision-record id resolves in the REAL ledger (docs/decisions/INDEX.md)', () => {
    const index = readFileSync(join(REPO_ROOT, 'docs/decisions/INDEX.md'), 'utf8');
    for (const key of Object.keys(WHY)) {
      for (const id of WHY[key].drs) {
        expect(index, `${key} cites ${id}, which is not in the decision ledger`).toContain(id);
      }
    }
  });
  it('every WHY principle id resolves in the REAL LESSONS-LEARNED doc', () => {
    const real = buildLessonsManifest();
    const ids = new Set(real.principles.map((p) => p.id));
    for (const key of Object.keys(WHY)) {
      for (const id of WHY[key].principles) {
        expect(ids.has(id), `${key} cites ${id}, which is not an extracted principle`).toBe(true);
      }
    }
  });
  it('the build declares the census + lessons defines (vite.config)', () => {
    const cfg = readFileSync(join(REPO_ROOT, 'app/vite.config.js'), 'utf8');
    expect(cfg).toContain('__TEST_CENSUS__');
    expect(cfg).toContain('__LESSONS_PRINCIPLES__');
    expect(cfg).toContain('buildTestCensus');
    expect(cfg).toContain('buildLessonsManifest');
  });
  it('the board is mounted in the steward seat (C2S See faculty)', () => {
    const center = readFileSync(join(REPO_ROOT, 'app/src/components/CommandServeCenter.jsx'), 'utf8');
    expect(center).toContain("import QualityThroughput from './QualityThroughput.jsx'");
    expect(center).toContain('<QualityThroughput />');
  });
  it('the board reads its live sources (the interconnect loop tokens hold)', () => {
    const src = readFileSync(join(REPO_ROOT, 'app/src/components/QualityThroughput.jsx'), 'utf8');
    for (const token of ['legibilitySummaryLine', 'audit-findings.json', 'subscribeOpsCommands', 'fetchSchemaHealth', 'fetchLedger']) {
      expect(src, `QualityThroughput lost its live source: ${token}`).toContain(token);
    }
  });
});

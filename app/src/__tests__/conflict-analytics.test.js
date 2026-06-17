// Locks the CONFLICT-EVALUATION LEARNING LOOP engine (Darrell, 2026-06-17:
// "fewer conflicts as we move forward because of the fixes as we grow").
// These pure analyzers turn the conflict-events spine into hot files, a
// conflict-rate trend, contended areas, a ranked decomposition plan, and a
// pre-spawn contention warning. PROVEN-TO-CATCH (DR-0076): each block feeds a
// known-colliding input and asserts the loop FLAGS it, and a disjoint input and
// asserts it CLEARS — so a green here means the loop actually detects collisions.
import { describe, it, expect } from 'vitest';
import {
  parseEvents,
  validateEvent,
  hotFiles,
  contendedAreas,
  conflictRate,
  decompositionPlan,
  wouldContend,
  nextFreeMigration,
  scanEvents,
  buildConflictManifest,
  MONOLITH_PATH,
  MIGRATIONS_DIR,
} from '../../../scripts/orchestration/conflict-analytics.mjs';

// A small synthetic spine: the monolith collides 3×, main.jsx once, a migration
// twice — the same shape as the real 06-17 pileup but fixed for the test.
const SAMPLE = [
  { ts: '2026-06-15T02:00:00Z', file: MIGRATIONS_DIR, cause: 'migration', lane: 'migration', resolution: 'grandfathered', branches: [] },
  { ts: '2026-06-15T03:00:00Z', file: MIGRATIONS_DIR, cause: 'migration', lane: 'migration', resolution: 'manual', branches: ['feat/a', 'feat/b'] },
  { ts: '2026-06-17T01:00:00Z', file: MONOLITH_PATH, cause: 'shared-file', lane: 'monolith', resolution: 'rebase', branches: ['feat/x'] },
  { ts: '2026-06-17T02:00:00Z', file: MONOLITH_PATH, cause: 'shared-file', lane: 'monolith', resolution: 'pending', branches: ['feat/y'] },
  { ts: '2026-06-17T03:00:00Z', file: MONOLITH_PATH, cause: 'shared-file', lane: 'monolith', resolution: 'close-superseded', branches: ['feat/z'] },
  { ts: '2026-06-17T04:00:00Z', file: 'app/src/main.jsx', cause: 'shared-file', lane: 'mount', resolution: 'rebase', branches: ['feat/x', 'feat/m'] },
];

describe('validateEvent — the spine schema is binding', () => {
  it('accepts a well-formed event', () => {
    expect(validateEvent(SAMPLE[0]).ok).toBe(true);
  });
  it('CATCHES a missing/invalid timestamp', () => {
    expect(validateEvent({ file: 'x', cause: 'shared-file' }).ok).toBe(false);
  });
  it('CATCHES an out-of-taxonomy cause', () => {
    const v = validateEvent({ ts: '2026-06-17T00:00:00Z', file: 'x', cause: 'whatever' });
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/cause/);
  });
});

describe('parseEvents — tolerant reader, loud on corruption', () => {
  it('skips blank lines, parses the rest', () => {
    const { events } = parseEvents('\n' + JSON.stringify(SAMPLE[0]) + '\n\n' + JSON.stringify(SAMPLE[2]) + '\n');
    expect(events.length).toBe(2);
  });
  it('CATCHES a malformed JSON line (never silently drops)', () => {
    const { problems } = parseEvents(JSON.stringify(SAMPLE[0]) + '\n{not json}\n');
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(' ')).toMatch(/line 2/);
  });
});

describe('hotFiles — the monolith rises to #1 by collision frequency', () => {
  const hot = hotFiles(SAMPLE);
  it('ranks the monolith first (3 incidents, 3 branches)', () => {
    expect(hot[0].file).toBe(MONOLITH_PATH);
    expect(hot[0].incidents).toBe(3);
    expect(hot[0].contendingBranches).toBe(3);
    expect(hot[0].isMonolith).toBe(true);
  });
  it('a once-touched file is not ranked above a thrice-collided one', () => {
    const main = hot.find((h) => h.file === 'app/src/main.jsx');
    expect(main.incidents).toBe(1);
    expect(hot.indexOf(main)).toBeGreaterThan(0);
  });
});

describe('conflictRate — trend over time, target DOWN', () => {
  it('buckets by day and reports a direction', () => {
    const r = conflictRate(SAMPLE);
    expect(r.bucketCount).toBe(2);
    expect(r.total).toBe(6);
    // 06-15 had 2, 06-17 had 4 -> latest is UP vs prior (the pileup we want to fix)
    expect(r.trend).toBe('up');
  });
  it('a single bucket reads as baseline, not a fake direction', () => {
    const r = conflictRate([SAMPLE[2]]);
    expect(r.trend).toBe('baseline');
  });
  it('CONFIRMS it can read DOWN when later buckets shrink', () => {
    const shrinking = [
      { ts: '2026-06-10T00:00:00Z', file: MONOLITH_PATH, cause: 'shared-file' },
      { ts: '2026-06-10T01:00:00Z', file: MONOLITH_PATH, cause: 'shared-file' },
      { ts: '2026-06-11T00:00:00Z', file: MONOLITH_PATH, cause: 'shared-file' },
      { ts: '2026-06-12T00:00:00Z', file: 'app/src/main.jsx', cause: 'shared-file' },
    ];
    expect(conflictRate(shrinking).trend).toBe('down');
  });
});

describe('contendedAreas — lanes that chronically overlap', () => {
  it('surfaces migration + monolith as the top lanes', () => {
    const areas = contendedAreas(SAMPLE);
    const lanes = areas.map((a) => a.lane);
    expect(lanes).toContain('migration');
    expect(lanes).toContain('monolith');
  });
});

describe('decompositionPlan — ranked prevention output', () => {
  const plan = decompositionPlan(SAMPLE);
  it('recommends decomposing the monolith first (P1)', () => {
    expect(plan[0].target).toBe(MONOLITH_PATH);
    expect(plan[0].priority).toBe(1);
    expect(plan[0].collisions).toBe(3);
    expect(plan[0].recommendation).toMatch(/registry/i);
    expect(plan[0].rankedExtractions.length).toBeGreaterThan(0);
  });
  it('does NOT recommend decomposing a file touched only once', () => {
    expect(plan.some((d) => d.target === 'app/src/main.jsx')).toBe(false);
  });
});

describe('wouldContend — the PRE-SPAWN warning', () => {
  it('FLAGS work that would touch the monolith and offers the module path', () => {
    const r = wouldContend([MONOLITH_PATH, 'app/src/components/NewThing.jsx'], SAMPLE);
    expect(r.contends).toBe(true);
    expect(r.hits[0].why).toBe('monolith');
    expect(r.hits[0].suggestion).toMatch(/NEW MODULE/i);
  });
  it('FLAGS a new migration (the serialized sequence)', () => {
    const r = wouldContend([`${MIGRATIONS_DIR}/0099-x.sql`], SAMPLE);
    expect(r.contends).toBe(true);
    expect(r.hits[0].why).toBe('migration');
  });
  it('CLEARS disjoint module work (parallel-safe)', () => {
    const r = wouldContend(['app/src/components/Foo.jsx', 'app/src/lib/foo.js'], SAMPLE);
    expect(r.contends).toBe(false);
  });
});

describe('nextFreeMigration — allocator against existing numbers', () => {
  it('returns highest + 1, zero-padded to 4', () => {
    expect(nextFreeMigration(['0028-a.sql', '0030-b.sql', '0019-c.sql'])).toBe('0031');
    expect(nextFreeMigration([])).toBe('0001');
  });
});

describe('the REAL spine — the loop returns real data, not a fixture', () => {
  it('parses with no schema problems', () => {
    const { problems } = scanEvents();
    expect(problems).toEqual([]);
  });
  it('builds a manifest with the monolith as the #1 hot file (the 06-17 pileup)', () => {
    const m = buildConflictManifest();
    expect(m.ok).toBe(true);
    expect(m.eventCount).toBeGreaterThanOrEqual(8);
    expect(m.hotFiles[0].file).toBe(MONOLITH_PATH);
    expect(m.hotFiles[0].incidents).toBeGreaterThanOrEqual(3);
    expect(m.decomposition[0].target).toBe(MONOLITH_PATH);
  });
});

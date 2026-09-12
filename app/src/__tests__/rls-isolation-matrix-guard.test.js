// rls-isolation-matrix-guard — proven-to-catch (DR-0076 Section 3): a matrix
// leg naming a file that does not exist must be CAUGHT; the real workflow (every
// referenced migration + smoke on disk) must pass. Also pins the small
// dependency-free leg parser.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLegs, checkMatrix } from '../../../scripts/rls-isolation-matrix-guard.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const WORKFLOW = readFileSync(join(REPO, '.github/workflows/rls-isolation.yml'), 'utf8');

// A minimal well-formed matrix fragment the parser accepts.
const MATRIX = `
jobs:
  isolate:
    strategy:
      matrix:
        include:
          - feature: books-role-wall
            migrations: "0082-successor-role-and-books-rls.sql 0100-assistant-role-and-books-rls.sql"
            smokes: "0082-successor-books-smoke.sql 0100-assistant-books-smoke.sql"
`;

describe('rls-isolation-matrix-guard — every referenced file exists (DR-0239 gate-the-class)', () => {
  it('parses each leg into its migrations + smokes (space-separated, quoted)', () => {
    const legs = parseLegs(MATRIX);
    expect(legs.length).toBe(1);
    expect(legs[0].feature).toBe('books-role-wall');
    expect(legs[0].migrations).toEqual([
      '0082-successor-role-and-books-rls.sql',
      '0100-assistant-role-and-books-rls.sql',
    ]);
    expect(legs[0].smokes).toEqual([
      '0082-successor-books-smoke.sql',
      '0100-assistant-books-smoke.sql',
    ]);
  });

  it('CATCHES a leg that names a smoke file which does not exist', () => {
    const problems = checkMatrix(MATRIX, {
      migExists: () => true,
      smokeExists: (f) => f !== '0100-assistant-books-smoke.sql', // this one is "missing"
    });
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(/0100-assistant-books-smoke\.sql/);
  });

  it('CATCHES a leg that names a migration file which does not exist', () => {
    const problems = checkMatrix(MATRIX, {
      migExists: (f) => f !== '0082-successor-role-and-books-rls.sql',
      smokeExists: () => true,
    });
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(/0082-successor-role-and-books-rls\.sql/);
  });

  it('PASSES the crafted matrix when every named file "exists"', () => {
    expect(checkMatrix(MATRIX, { migExists: () => true, smokeExists: () => true, smokesOnDisk: [] })).toEqual([]);
  });

  it('the REAL rls-isolation.yml has every referenced migration + smoke on disk', () => {
    expect(checkMatrix(WORKFLOW)).toEqual([]);
  });

  // ── THE INVERSE (LESSONS P53, 2026-09-12) ─────────────────────────────────
  // The checks above ask whether every file a leg NAMES exists. This asks the
  // question that actually went wrong: does every smoke that EXISTS get run?
  // An orphan smoke is indistinguishable, from the repo, from a thorough one —
  // it sits there with a header full of assertions that never execute.
  describe('an orphan smoke is no proof at all', () => {
    it('CATCHES a smoke on disk that no leg runs', () => {
      const problems = checkMatrix(MATRIX, {
        migExists: () => true,
        smokeExists: () => true,
        smokesOnDisk: ['0082-successor-books-smoke.sql', '9999-nobody-runs-me-smoke.sql'],
      });
      expect(problems.length).toBe(1);
      expect(problems[0]).toMatch(/ORPHAN SMOKE/);
      expect(problems[0]).toMatch(/9999-nobody-runs-me-smoke\.sql/);
      expect(problems[0]).toMatch(/proves nothing/);
    });

    it('does NOT flag a smoke that some leg names', () => {
      const named = parseLegs(MATRIX).flatMap((l) => l.smokes);
      expect(named.length).toBeGreaterThan(0);
      expect(checkMatrix(MATRIX, { migExists: () => true, smokeExists: () => true, smokesOnDisk: named }))
        .toEqual([]);
    });

    it('the REAL repo has ZERO orphan smokes, and is locked there', () => {
      // Locked at zero on the day there were zero — the cheapest possible
      // moment to make a standard permanent (the icon-label precedent).
      expect(checkMatrix(WORKFLOW).filter((p) => /ORPHAN SMOKE/.test(p))).toEqual([]);
    });
  });

  it('the REAL workflow includes the books-role-wall leg (0082/0100 live proof discharged)', () => {
    const legs = parseLegs(WORKFLOW);
    const leg = legs.find((l) => l.feature === 'books-role-wall');
    expect(leg).toBeTruthy();
    expect(leg.smokes).toContain('0082-successor-books-smoke.sql');
    expect(leg.smokes).toContain('0100-assistant-books-smoke.sql');
  });
});

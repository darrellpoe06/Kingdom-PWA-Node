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
    expect(checkMatrix(MATRIX, { migExists: () => true, smokeExists: () => true })).toEqual([]);
  });

  it('the REAL rls-isolation.yml has every referenced migration + smoke on disk', () => {
    expect(checkMatrix(WORKFLOW)).toEqual([]);
  });

  it('the REAL workflow includes the books-role-wall leg (0082/0100 live proof discharged)', () => {
    const legs = parseLegs(WORKFLOW);
    const leg = legs.find((l) => l.feature === 'books-role-wall');
    expect(leg).toBeTruthy();
    expect(leg.smokes).toContain('0082-successor-books-smoke.sql');
    expect(leg.smokes).toContain('0100-assistant-books-smoke.sql');
  });
});

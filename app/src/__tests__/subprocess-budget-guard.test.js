// =============================================================================
// subprocess-budget-guard -- the gate for the tie that bit three times (DR-1269)
// =============================================================================
// A guard that always passes is itself a lie (DR-0076 §3). So this feeds the
// guard the three ORIGINAL tied shapes measured in the tree and REQUIRES a
// finding for each, then feeds it the corrected shapes and requires silence.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBudgetTies, declaredBudgetsMs, isOwnProofSuite, DEFAULT_CEILING_MS } from '../../../scripts/subprocess-budget-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

describe('subprocess-budget-guard reads budgets in their own units', () => {
  it('a child_process option is already milliseconds; a CLI flag and an env var are seconds', () => {
    expect(declaredBudgetsMs("execFileSync('p', a, { timeout: 60000 });").map((b) => b.ms)).toEqual([60000]);
    expect(declaredBudgetsMs("spawn('p', [S, '--timeout', '5']);").map((b) => b.ms)).toEqual([5000]);
    expect(declaredBudgetsMs("spawnSync('sh', [I], { env: { SOVEREIGN_REPLAY_TIMEOUT: '5' } });").map((b) => b.ms)).toEqual([5000]);
  });
  it('resolves a budget held in a named constant, and declines to guess a computed one', () => {
    expect(declaredBudgetsMs("const B = 3;\nspawn('p', [S, '--timeout', String(B)]);").map((b) => b.ms)).toEqual([3000]);
    expect(declaredBudgetsMs("spawn('p', [S, '--timeout', String(n * 2)]);")).toEqual([]);
  });
});

describe('PROVEN TO CATCH: each tie that actually shipped', () => {
  // 1. the shape that failed CI run 42081880950 at 5009ms: inner 5s == the
  //    vitest default, with no explicit ceiling on the case at all.
  const SELECTOR_TIED = `
    function runSelector(shell) {
      return new Promise((resolve) => {
        const child = spawn('python3', [SELECTOR, '--shell', shell, '--timeout', '5']);
        child.on('close', (code) => resolve({ code }));
      });
    }
    const select = (srv) => runSelector(shellOf(srv));
    describe('d', () => {
      it('finds the one anon key', async () => {
        const r = await select(s);
        expect(r.code).toBe(0);
      });
    });`;

  // 2. the replay shape in the same file: an env budget in seconds, again
  //    against the default ceiling.
  const REPLAY_TIED = `
    const run = (env = {}) => spawnSync('sh', [INSTALLER], {
      env: { ...process.env, SOVEREIGN_REPLAY_TIMEOUT: '5', ...env },
    });
    describe('d', () => {
      it('applies', () => { expect(run().status).toBe(0); });
    });`;

  // 3. the backup shape: an explicit ceiling that EQUALS the inner budget.
  const BACKUP_TIED = `
    function run(job) {
      return execFileSync('python3', ['-c', py], { encoding: 'utf8', timeout: 60000 });
    }
    describe('d', () => {
      it('a request starts the backup', () => { expect(run('db-backup')).toBeTruthy(); }, 60000);
    });`;

  it('flags inner 5s against the vitest default, through a two-hop helper', () => {
    const f = findBudgetTies(SELECTOR_TIED, 't.js');
    expect(f).toHaveLength(1);
    expect(f[0].budgetMs).toBe(5000);
    expect(f[0].ceilingMs).toBe(DEFAULT_CEILING_MS);
    expect(f[0].ceilingSource).toBe('vitest default');
  });
  it('flags an env budget in seconds against the vitest default', () => {
    expect(findBudgetTies(REPLAY_TIED, 't.js')).toHaveLength(1);
  });
  it('flags an explicit ceiling that merely EQUALS the budget -- strictly-below is the rule', () => {
    const f = findBudgetTies(BACKUP_TIED, 't.js');
    expect(f).toHaveLength(1);
    expect(f[0].budgetMs).toBe(60000);
    expect(f[0].ceilingMs).toBe(60000);
  });
  it('clears each one once the budget is strictly below the ceiling', () => {
    expect(findBudgetTies(SELECTOR_TIED.replace("'--timeout', '5'", "'--timeout', '3'").replace('});\n    });', '}, 20000);\n    });'), 't.js')).toEqual([]);
    expect(findBudgetTies(REPLAY_TIED.replace("'5'", "'3'").replace('); });', '); }, 20000);'), 't.js')).toEqual([]);
    expect(findBudgetTies(BACKUP_TIED.replace('timeout: 60000', 'timeout: 30000'), 't.js')).toEqual([]);
  });
});

describe('it does not cry wolf', () => {
  it('a case that never reaches a spawn is not flagged, even in a spawning file', () => {
    const src = `
      const run = () => spawnSync('sh', [I], { env: { X_TIMEOUT: '5' } });
      describe('d', () => {
        it('reads a manifest only', () => { expect(JSON.parse(read('x.json'))).toBeTruthy(); });
      });`;
    expect(findBudgetTies(src, 't.js')).toEqual([]);
  });
  it('a file with no subprocess at all is not inspected', () => {
    expect(findBudgetTies("describe('d', () => { it('x', () => { const timeout: 1; }); });", 't.js')).toEqual([]);
  });
  it('a budget in a COMMENT is not a budget the file grants', () => {
    const src = [
      '// historical note: this once passed { timeout: 60000 } and was tied',
      "const run = () => spawnSync('sh', [I], { env: { X_TIMEOUT: '1' } });",
      "describe('d', () => { it('x', () => { run(); }); });",
    ].join('\n');
    expect(declaredBudgetsMs(src).map((b) => b.ms)).toEqual([1000]);
    expect(findBudgetTies(src, 't.js')).toEqual([]);
  });
  it('a tied shape held in a TEMPLATE LITERAL as fixture data is neither a budget nor a spawn', () => {
    const src = [
      'const FIXTURE = `',
      "  const r = spawnSync('sh', [I], { timeout: 60000 });",
      "  it('tied', () => { r(); });",
      '`;',
      "describe('d', () => { it('checks the fixture', () => { expect(FIXTURE).toBeTruthy(); }); });",
    ].join('\n');
    expect(declaredBudgetsMs(src)).toEqual([]);
    expect(findBudgetTies(src, 't.js')).toEqual([]);
  });
  it('this very suite is exempt, because its fixtures are tied on purpose', () => {
    expect(isOwnProofSuite(read('app/src/__tests__/subprocess-budget-guard.test.js'))).toBe(true);
  });
  // The exemption must be an IMPORT, not a mention. Both files below name the
  // guard in a comment; neither may buy its way out of the gate that way, or
  // documenting the rule would be how you escape it.
  it('merely NAMING the guard in a comment does not exempt a file', () => {
    for (const p of ['app/src/__tests__/a-backup-on-request.test.js', 'app/src/__tests__/the-deploy-has-more-than-one-road.test.js']) {
      expect(isOwnProofSuite(read(p)), p).toBe(false);
    }
    expect(isOwnProofSuite('// see scripts/subprocess-budget-guard.mjs\nconst x = 1;')).toBe(false);
  });
});

describe('the tree itself is clean', () => {
  it('the two files that caused this gate now pass it', () => {
    for (const p of ['app/src/__tests__/the-deploy-has-more-than-one-road.test.js', 'app/src/__tests__/a-backup-on-request.test.js']) {
      expect(findBudgetTies(read(p), p), p).toEqual([]);
    }
  });
  it('the guard is wired into the merge gate, not merely present on disk', () => {
    expect(read('app/package.json')).toMatch(/subprocess-budget-guard\.mjs/);
  });
});

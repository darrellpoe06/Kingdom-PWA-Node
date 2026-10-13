// `npm run verify` must actually verify what CI verifies (2026-09-11).
//
// THE FALSE GREEN. Building DR-0361 I ran the whole vitest suite locally -- 910
// files, 13388 tests, green -- and pushed. CI went red in 45 seconds on
// `lessons-gate-coverage`, a gate that had never been part of my local run at
// all: CI executes 13 guard SCRIPTS as separate job steps between lint and
// vitest, and `npm run verify` was `npm run lint && vitest run`. So the
// command the repo documents as the sanctioned lane check (DR-0077 section 2,
// "the real gate", quoted in REVIEWS.md, the resume contract and the
// orchestrator handoff) omitted 13 of the checks that decide whether a push
// goes red.
//
// That is the P52 shape again, one level up: two definitions of "verified"
// living in two files, each self-consistent, never compared. A local green
// that does not predict CI is worse than no local check, because it is
// trusted -- the same reason a gate that always passes is itself a lie
// (DR-0076 section 3).
//
// So the contract is now a test: every guard step CI runs in that job must be
// reachable from `npm run verify`. Adding a step to ci.yml without adding it
// here fails the build, which is the only way this stays true.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/** The guard scripts ci.yml runs between `npm run lint` and `npx vitest run`. */
export function ciGuardSteps(ciYml) {
  const afterLint = ciYml.split('- run: npm run lint')[1] || '';
  const job = afterLint.split('- run: npx vitest run')[0] || '';
  return [...job.matchAll(/- run: node \.\.\/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1]);
}

/** The guard scripts `npm run verify` reaches, through any script it chains. */
export function verifyGuardSteps(pkg) {
  const scripts = pkg.scripts || {};
  const seen = new Set();
  const out = [];
  const walk = (name, depth = 0) => {
    if (depth > 5 || seen.has(name)) return;
    seen.add(name);
    const body = scripts[name] || '';
    for (const m of body.matchAll(/node \.\.\/scripts\/([a-z0-9-]+)\.mjs/g)) out.push(m[1]);
    for (const m of body.matchAll(/npm run ([a-z0-9:_-]+)/g)) walk(m[1], depth + 1);
  };
  walk('verify');
  return out;
}

describe('npm run verify covers the gates CI runs', () => {
  const ci = () => read('.github/workflows/ci.yml');
  const pkg = () => JSON.parse(read('app/package.json'));

  it('the scanner actually finds CI guard steps (not vacuously empty)', () => {
    // A green run must not be able to mean "scanned nothing" -- the exact
    // failure mode this whole file exists to close.
    expect(ciGuardSteps(ci()).length, 'found no guard steps in ci.yml - re-anchor this gate').toBeGreaterThan(5);
  });

  it('EVERY guard CI runs in that job is reachable from verify', () => {
    const inCi = ciGuardSteps(ci());
    const inVerify = new Set(verifyGuardSteps(pkg()));
    const missing = inCi.filter((g) => !inVerify.has(g));
    expect(missing, `CI runs these guards and \`npm run verify\` does not: ${missing.join(', ')}`).toEqual([]);
  });

  it('verify still runs lint and the test suite, not only the guards', () => {
    const v = pkg().scripts.verify;
    expect(v).toMatch(/lint/);
    expect(v).toMatch(/vitest run/);
  });

  // PROVEN TO CATCH (DR-0076 section 3): the pre-fix definition of verify must
  // FAIL this gate, and a CI job that grows a new step must fail it too.
  it('PROVEN TO CATCH: the 2026-09-11 verify script (lint + vitest only) fails', () => {
    const preFix = { scripts: { lint: 'eslint src', verify: 'npm run lint && vitest run' } };
    const inCi = ciGuardSteps(ci());
    const inVerify = new Set(verifyGuardSteps(preFix));
    const missing = inCi.filter((g) => !inVerify.has(g));
    expect(missing.length, 'the pre-fix verify must be caught as incomplete').toBe(inCi.length);
    expect(missing).toContain('lessons-gate-coverage'); // the one that actually went red
  });

  it('PROVEN TO CATCH: a guard added to CI but not to verify fails', () => {
    // Injected BEFORE the job's vitest step, which is where a new guard would
    // really be added -- appending after it lands outside the scanned span.
    const fakeCi = ci().replace('- run: npx vitest run',
      '- run: node ../scripts/brand-new-guard.mjs\n      - run: npx vitest run');
    const inCi = ciGuardSteps(fakeCi);
    const inVerify = new Set(verifyGuardSteps(pkg()));
    expect(inCi).toContain('brand-new-guard');
    expect(inCi.filter((g) => !inVerify.has(g))).toEqual(['brand-new-guard']);
  });
});

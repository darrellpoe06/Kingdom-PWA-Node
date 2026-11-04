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

/**
 * The guard scripts ci.yml runs between `npm run lint` and `npx vitest run`.
 *
 * @param {string} ciYml
 * @param {object} [pkg] package.json, so a `- run: npm run x` step is followed
 *   into the script it names, the way `verifyGuardSteps` already follows them.
 */
export function ciGuardSteps(ciYml, pkg) {
  const afterLint = ciYml.split('- run: npm run lint')[1] || '';
  const job = afterLint.split('- run: npx vitest run')[0] || '';
  // BOTH RUNNERS. `node ../scripts/x.mjs` and `npx vite-node ../scripts/x.mjs`
  // are the same obligation; only one of them needs Vite to import the course
  // modules. Matching `node` alone made `one-teaching-one-lesson-guard`
  // invisible to this scanner in both directions (2026-11-04, DR-1308).
  const out = [...job.matchAll(/- run: (?:node|npx vite-node) \.\.\/scripts\/([a-z0-9-]+)\.mjs/g)]
    .map((m) => m[1]);
  // AND THROUGH AN NPM SCRIPT. The first draft of the reverse direction below
  // reported `derive-lesson-dates` as a guard CI never runs, and that was the
  // SCANNER's fault, not a gap: ci.yml line 93 runs `npm run lesson-dates:check`,
  // which is `vite-node ../scripts/derive-lesson-dates.mjs --check`. The verify
  // side already walked npm scripts; this side did not, so the two sides were
  // asking different questions and the asymmetry read as a finding. A gate that
  // cries wolf is deleted within a day (P46), so it is fixed rather than
  // suppressed.
  if (pkg) {
    const scripts = pkg.scripts || {};
    const seen = new Set();
    const walk = (name, depth = 0) => {
      if (depth > 5 || seen.has(name)) return;
      seen.add(name);
      const body = scripts[name] || '';
      for (const m of body.matchAll(/(?:^|\s)(?:npx )?vite-node \.\.\/scripts\/([a-z0-9-]+)\.mjs/g)) out.push(m[1]);
      for (const m of body.matchAll(/node \.\.\/scripts\/([a-z0-9-]+)\.mjs/g)) out.push(m[1]);
      for (const m of body.matchAll(/npm run ([a-z0-9:_-]+)/g)) walk(m[1], depth + 1);
    };
    for (const m of job.matchAll(/- run: npm run ([a-z0-9:_-]+)/g)) walk(m[1]);
  }
  return out;
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
    // `npx vite-node ../scripts/x.mjs` also matches, because `vite-node` ends
    // in `node`; kept deliberate rather than accidental.
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
    expect(ciGuardSteps(ci(), pkg()).length, 'found no guard steps in ci.yml - re-anchor this gate').toBeGreaterThan(5);
  });

  it('EVERY guard CI runs in that job is reachable from verify', () => {
    const inCi = ciGuardSteps(ci(), pkg());
    const inVerify = new Set(verifyGuardSteps(pkg()));
    const missing = inCi.filter((g) => !inVerify.has(g));
    expect(missing, `CI runs these guards and \`npm run verify\` does not: ${missing.join(', ')}`).toEqual([]);
  });

  // ===========================================================================
  // THE OTHER DIRECTION (2026-11-04, DR-1308) — and it had been open the whole
  // time this file existed.
  // ===========================================================================
  // Everything above asserts CI ⊆ verify: a guard CI runs must be reachable
  // locally, so a local green predicts CI. That is half the contract, and the
  // half that was never written is the one that bit: a guard could sit in
  // `verify:gates` for ever while CI never called it, and nothing said a word.
  //
  // MEASURED on `main` at 729b40f18: 26 guards in `verify:gates`, 15 named in
  // ci.yml, ELEVEN that CI had never run. Among them
  // `one-thread-one-record-guard` — the instrument that caught DR-1305's
  // citation bug, which had two of Darrell's 2026-10-08 sends invisible to the
  // Gmail lane for 27 days — and `one-teaching-one-lesson-guard`, the
  // duplicate-lesson check. Both ran only if a person typed `npm run verify`.
  //
  // A guard CI never runs is not a guard (DR-0076 §3). The eleven are now in
  // ci.yml; this case is what keeps the twelfth from happening.
  it('EVERY guard reachable from verify is also run by CI', () => {
    const inCi = new Set(ciGuardSteps(ci(), pkg()));
    const inVerify = verifyGuardSteps(pkg());
    expect(inVerify.length, 'found no guards in verify — re-anchor this gate').toBeGreaterThan(5);
    const missing = [...new Set(inVerify.filter((g) => !inCi.has(g)))];
    expect(
      missing,
      'these guards are in `verify:gates` and CI never runs them, so a push can go green '
      + `without them: ${missing.join(', ')}. Add each to the "app — lint + guards" job, or `
      + 'remove it from verify:gates and say why.',
    ).toEqual([]);
  });

  it('PROVEN TO CATCH: a guard in verify but absent from CI fails', () => {
    const fakePkg = JSON.parse(JSON.stringify(pkg()));
    fakePkg.scripts['verify:gates'] += ' && node ../scripts/never-in-ci-guard.mjs';
    const inCi = new Set(ciGuardSteps(ci(), pkg()));
    const inVerify = verifyGuardSteps(fakePkg);
    expect(inVerify).toContain('never-in-ci-guard');
    expect(inVerify.filter((g) => !inCi.has(g))).toEqual(['never-in-ci-guard']);
  });

  it('PROVEN TO CATCH: the pre-fix ci.yml, missing the eleven, fails this direction', () => {
    // Reconstructed rather than remembered: strip the eleven lines this record
    // added and the gap comes straight back.
    const ELEVEN = [
      'workflow-list-order', 'unknown-is-not-a-no', 'stamp-carries-its-year', 'surface-hollow',
      'constraint-allow-list', 'inline-constraint-replay', 'newest-definition-replay',
      'measurement-carries-no-identity', 'migration-prose', 'one-thread-one-record',
      'one-teaching-one-lesson',
    ];
    let stripped = ci();
    for (const g of ELEVEN) {
      stripped = stripped.replace(new RegExp(`^ *- run: (?:node|npx vite-node) \\.\\./scripts/${g}-guard\\.mjs\n`, 'm'), '');
    }
    const inCi = new Set(ciGuardSteps(stripped, pkg()));
    const missing = [...new Set(verifyGuardSteps(pkg()).filter((g) => !inCi.has(g)))].sort();
    expect(missing, 'the pre-fix ci.yml must be caught as missing exactly these eleven')
      .toEqual(ELEVEN.map((g) => `${g}-guard`).sort());
  });

  it('the scanner sees a vite-node guard, which it could not before', () => {
    const seen = ciGuardSteps(ci(), pkg());
    expect(
      seen,
      'one-teaching-one-lesson-guard runs under vite-node; a node-only scanner cannot see it '
      + 'in either direction, which is how it stayed invisible',
    ).toContain('one-teaching-one-lesson-guard');
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
    const inCi = ciGuardSteps(ci(), pkg());
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
    const inCi = ciGuardSteps(fakeCi, pkg());
    const inVerify = new Set(verifyGuardSteps(pkg()));
    expect(inCi).toContain('brand-new-guard');
    expect(inCi.filter((g) => !inVerify.has(g))).toEqual(['brand-new-guard']);
  });
});

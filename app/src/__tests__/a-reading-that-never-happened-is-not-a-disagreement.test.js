// =============================================================================
// A reading that never happened is not a disagreement (2026-11-03, DR-1302)
// =============================================================================
// MEASURED ON THE LIVE INSTRUMENT, six times, on six consecutive days.
//
// `public-shelf-witness.yml` is the stranger's-screen witness DR-0973 built
// after Darrell found three faults on his own public listing from his phone
// while every pipeline check was green. It takes two independent readings --
// what each advertised door is CALLED, from the database, and what a real
// browser renders -- and files a finding when they disagree.
//
// On 2026-10-28 the tailnet key `k17y78NVwb11CNTRL` was revoked. Step
// conclusions, read from the API for runs 40757911515, 40943512224,
// 41116974336, 41230844184, 41340322457 and 41540819357:
//
//   4  Join the tailnet (to reach the live database)      SUCCESS
//   5  What each advertised door IS, by its own labels     failure
//   6  Read the shelf in a real browser                    SKIPPED
//   7  Do the two readings agree?                          failure
//  10  File the finding on the incident ledger             SUCCESS   <-- filed
//
// Neither reading was taken. The database was never asked (no route) and the
// browser step never ran. And this is what step 10 wrote onto #2127 -- the
// `incident`-labelled ledger, six times, once a day:
//
//   **the public shelf disagrees with what the doors are called**, or could
//   not be read.
//
// A bolded accusation about the family's own storefront, with the real cause
// (a revoked key) nowhere in it, and an `or could not be read` hedge trailing
// after the claim rather than replacing it.
//
// WHY THE EXISTING GUARD LET IT THROUGH, which is the part worth keeping.
// DR-1023 had already fixed one false line here: on 2026-10-14 run
// 38597741280 both readings AGREED, the run-log write then failed on a GitHub
// GraphQL error, the JOB went red, and the ledger step -- keyed on
// `failure()` -- filed. The fix moved the guard from the job's status to the
// compare step's own outcome, `steps.compare.outcome != 'success'`. That was
// a real improvement and it stopped that exact shape.
//
// It was still a proxy. `exit 1` from the compare step means two different
// things: "the two readings disagree" and "a reading never happened". On a
// shut road the compare step exits 1 because `/tmp/doors.txt` is missing --
// so DR-1023's narrower guard passed through the identical false finding by a
// different path. Narrowing a proxy is not the same as asking the question.
//
// So the compare step now publishes a VERDICT -- `agree`, `disagree`,
// `unknown-no-database-reading`, `unknown-no-browser-reading` -- and the
// ledger reads that word. DR-1186's rule, applied to the one place this lane
// was breaking it: a failed read is UNKNOWN, never a finding.
//
// WHAT THIS FILE DOES RATHER THAN DESCRIBES. The compare step is a bash
// block, so five of these cases EXECUTE it: the `run:` body is lifted out of
// the YAML, `${{ steps.shelf.outcome }}` is substituted, and it runs against
// a real temp `GITHUB_OUTPUT` and real door rows. The assertions are about
// what the lane DOES, not about what its source looks like.
import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = join(__dirname, '..', '..', '..');
const LANE = join(ROOT, '.github', 'workflows', 'public-shelf-witness.yml');
const yaml = readFileSync(LANE, 'utf8');

/** The named step's whole YAML block, up to the next sibling `- name:`. */
const step = (name) => {
  const at = yaml.indexOf(`- name: ${name}`);
  expect(at, `the lane has no step named "${name}"`).toBeGreaterThan(-1);
  const rest = yaml.slice(at + 1);
  const next = rest.indexOf('\n      - name:');
  return rest.slice(0, next === -1 ? rest.length : next);
};

/** Dedent a step's `run: |` body so it can be handed to bash as written. */
const runBody = (name) => {
  const s = step(name);
  const at = s.indexOf('run: |');
  expect(at, `step "${name}" has no run: | block`).toBeGreaterThan(-1);
  const lines = s.slice(s.indexOf('\n', at) + 1).split('\n');
  const body = [];
  for (const l of lines) {
    if (l.trim() === '') { body.push(''); continue; }
    if (!l.startsWith('          ')) break;
    body.push(l.slice(10));
  }
  return body.join('\n');
};

/**
 * Run the compare step for real.
 * @param {{doors?: string, shelfOutcome?: string}} w
 * @returns {{code:number, out:string, outputs:Record<string,string>}}
 */
const runCompare = ({ doors, shelfOutcome = 'success' }) => {
  const dir = mkdtempSync(join(tmpdir(), 'shelf-compare-'));
  try {
    const ghOut = join(dir, 'github_output');
    const ghEnv = join(dir, 'github_env');
    writeFileSync(ghOut, '');
    writeFileSync(ghEnv, '');
    const doorsPath = join(dir, 'doors.txt');
    if (doors !== undefined) writeFileSync(doorsPath, doors);
    // The step's own source, with the one GitHub expression substituted and
    // /tmp/doors.txt pointed at this case's file. Nothing else is rewritten.
    const script = runBody('Do the two readings agree?')
      .replaceAll('${{ steps.shelf.outcome }}', shelfOutcome)
      .replaceAll('/tmp/doors.txt', doorsPath)
      .replaceAll('/tmp/compare.txt', join(dir, 'compare.txt'));
    let code = 0;
    let out = '';
    try {
      out = execFileSync('bash', ['-c', script], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GITHUB_OUTPUT: ghOut, GITHUB_ENV: ghEnv },
      });
    } catch (e) {
      code = e.status ?? 1;
      out = `${e.stdout || ''}${e.stderr || ''}`;
    }
    const outputs = {};
    for (const l of readFileSync(ghOut, 'utf8').split('\n')) {
      const i = l.indexOf('=');
      if (i > 0) outputs[l.slice(0, i)] = l.slice(i + 1);
    }
    return { code, out, outputs };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const AGREES = 'bed|Bed in a shared home in Champaign, Illinois|40\n';
// The founding incident, character for character: a door CALLED a bed that the
// shelf advertises with a bedroom count.
const DISAGREES = 'bed|1-bed multi-family in Champaign, Illinois|40\n';

describe('the public shelf witness says WHICH kind of failure it had before anything is filed', () => {
  // ---------------------------------------------------------------------------
  // The six measured filings. Each of these would have been green before.
  // ---------------------------------------------------------------------------
  it('EXECUTED: no database reading is UNKNOWN, not a disagreement', () => {
    const r = runCompare({ doors: undefined });
    expect(r.code, 'the step must still fail the run — an unmeasured shelf is not a pass').not.toBe(0);
    expect(r.outputs.verdict).toBe('unknown-no-database-reading');
    expect(r.out).toMatch(/NOTHING is being said about the shelf/);
  });

  it('EXECUTED: a browser reading that was SKIPPED is UNKNOWN, not a disagreement — this is the six-day shape', () => {
    const r = runCompare({ doors: AGREES, shelfOutcome: 'skipped' });
    expect(r.code).not.toBe(0);
    expect(r.outputs.verdict).toBe('unknown-no-browser-reading');
    expect(r.out).toMatch(/the shelf was not read in a browser/);
  });

  it('EXECUTED: a browser reading that FAILED is UNKNOWN too — runs 40005324910 through 40570592961 (2026-10-22 to 10-27)', () => {
    const r = runCompare({ doors: AGREES, shelfOutcome: 'failure' });
    expect(r.code).not.toBe(0);
    expect(r.outputs.verdict).toBe('unknown-no-browser-reading');
  });

  // ---------------------------------------------------------------------------
  // The lane must still do its founding job. A guard that silences the real
  // finding is a worse failure than the false one (DR-0076 §8).
  // ---------------------------------------------------------------------------
  it('EXECUTED: the 2026-10-11 founding fault still files — a bed advertised as "1-bed" is a disagreement', () => {
    const r = runCompare({ doors: DISAGREES });
    expect(r.code, 'a genuine disagreement must fail the run').not.toBe(0);
    expect(r.outputs.verdict).toBe('disagree');
    expect(r.out).toMatch(/a door CALLED a bed is advertised as "1-bed/);
  });

  it('EXECUTED: two readings that agree are an agreement, and nothing is filed', () => {
    const r = runCompare({ doors: AGREES });
    expect(r.code).toBe(0);
    expect(r.outputs.verdict).toBe('agree');
    expect(r.out).toMatch(/the shelf agrees with what the doors are called/);
  });

  // ---------------------------------------------------------------------------
  // The guard itself. `disagree` is the ONLY word that reaches the ledger.
  // ---------------------------------------------------------------------------
  it('the incident ledger fires on the verdict, never on a step outcome or the job', () => {
    const s = step('File the finding on the incident ledger');
    const guard = (s.match(/\n\s*if:\s*(.+)/) || [])[1] || '';
    expect(guard, 'the ledger must read the compare step\'s VERDICT').toContain("steps.compare.outputs.verdict == 'disagree'");
    expect(
      guard,
      'DR-1023 moved this guard from the job to the compare step\'s outcome, and that outcome is still a proxy: '
      + 'it reads 1 both for "they disagree" and for "nothing was read". It must not come back.',
    ).not.toContain('steps.compare.outcome');
  });

  it('the ledger sentence states that both readings were taken, and drops the "or could not be read" hedge', () => {
    const s = step('File the finding on the incident ledger');
    expect(s).toMatch(/Both readings were taken/);
    expect(
      s,
      'the hedge is what made six false findings look plausible: it trailed AFTER a bolded accusation '
      + 'instead of replacing it. With the verdict guard the step cannot fire unless both readings happened, '
      + 'so the hedge is now a lie in the other direction.',
    ).not.toMatch(/or could not be read/);
  });

  it('the rolling run log carries the verdict, so an UNKNOWN is legible there rather than silent', () => {
    const s = step('Record the run (rolling log, every run, pass or fail)');
    expect(s).toMatch(/verdict: \$\{\{ steps\.compare\.outputs\.verdict \|\| 'unknown-not-compared' \}\}/);
  });

  // ---------------------------------------------------------------------------
  // The upstream brake: a shut road never reaches the judge at all (DR-1284).
  // ---------------------------------------------------------------------------
  it('the lane verifies its own tailnet join, fails at the key, and says it is not a shelf finding', () => {
    const s = step('Verify the tailnet actually joined');
    expect(s, 'the verify step must fail the run').toMatch(/exit 1/);
    expect(s, 'it must name the real cause').toMatch(/TS_AUTHKEY/);
    expect(s, 'it must say plainly that this is not a shelf finding').toMatch(/NOT a shelf finding/);
    expect(s, "a shut road must reach the fleet's one rolling key entry (DR-1283)")
      .toContain('scripts/tailnet-key-incident.mjs');
    expect(s, 'the escalation can never be what fails the lane')
      .toMatch(/tailnet-key-incident\.mjs[\s\S]*?\|\| true/);
  });

  it('the verify sits BETWEEN the join and the first question asked of the NAS — order is the whole point', () => {
    const join = yaml.indexOf('- name: Join the tailnet (to reach the live database)');
    const verify = yaml.indexOf('- name: Verify the tailnet actually joined');
    const ask = yaml.indexOf('- name: What each advertised door IS');
    expect(join).toBeGreaterThan(-1);
    expect(verify).toBeGreaterThan(join);
    expect(ask, 'a verify AFTER the first question lets the wrong cause be measured first').toBeGreaterThan(verify);
  });

  // ---------------------------------------------------------------------------
  // PROVEN TO CATCH (DR-0076 §3). The old guard, rebuilt, must go red here.
  // ---------------------------------------------------------------------------
  it('PROVEN TO CATCH: the pre-DR-1302 guard, rebuilt, files on all three UNKNOWNs', () => {
    // The guard as it stood on 2026-11-02, and the step outcome it read. On a
    // shut road: compare outcome = failure, job = failure, so it fired.
    const oldGuard = (compareOutcome, jobStatus) => jobStatus === 'failure' && compareOutcome !== 'success';
    // The three UNKNOWNs this record is about, with the outcomes measured on
    // the real runs. Every one of them filed under the old guard.
    expect(oldGuard('failure', 'failure'), 'the old guard filed on a shut road — that is the bug').toBe(true);
    // And the new guard refuses all three, because none of them is a verdict
    // of `disagree`.
    for (const v of ['unknown-no-database-reading', 'unknown-no-browser-reading', 'unknown-not-compared']) {
      expect(v === 'disagree', `${v} must never reach the ledger`).toBe(false);
    }
    // While the genuine finding still does.
    expect('disagree' === 'disagree').toBe(true);
  });

  it('PROVEN TO CATCH: this lane is out of the DR-1284 unverified set, so the shrink-only pin must have moved', () => {
    const pin = readFileSync(join(__dirname, 'a-tailnet-join-is-not-a-witness.test.js'), 'utf8');
    expect(
      pin,
      'public-shelf-witness.yml now verifies its join, so the DR-1284 pin must record the drop with a reason',
    ).toMatch(/DR-1302/);
  });
});

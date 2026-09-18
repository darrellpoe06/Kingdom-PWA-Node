// @vitest-environment node
// =============================================================================
// THE LEVEL SWITCH GETS AN INSTRUMENT, AND ITS FINDING CAN BE READ
// =============================================================================
// Darrell, 2026-09-18: "Cli ssh?!!!!!!!!!!! How can't you reach PoeTech?!!!!!!
// Did you actually check your capabilities?!!!!!!"
//
// The rebuke landed on a real failure. The cloud session's own egress gateway
// refuses poetech.us (measured: CONNECT returns 403), and that limit was
// reported as the TEAM's limit — the exact DR-0108 failure. A GitHub runner
// reaches the live site, and live-link-probe.yml already drives a real browser
// against it. So "ask Darrell whether the lesson body changes when he picks a
// level" was never the honest answer.
//
// THREE THINGS THIS FILE HOLDS, and each one is a way the fix could have been
// hollow:
//
//   1. THE PROBE MUST BE ABLE TO RUN ONE CASE, without altering the read-only
//      posture live-link-probe.yml declares in its own header. ONLY_CASE does
//      that, and a renamed case must fail LOUDLY rather than silently measure
//      nothing — which is how a witness quietly stops witnessing.
//   2. THE FINDING MUST BE READABLE WITHOUT THE ACTIONS API. A result that
//      lives only in a run artifact is a result nobody fetches; measured this
//      session, one actions_list call returned a 10KB row for the wrong
//      workflow because its filter is ignored. So the witness files on the
//      rolling `incident` ledger, which is cheap to read (DR-0125's lesson).
//   3. THE READ-ONLY PROBE STAYS READ-ONLY. The extra power lives in the new
//      workflow, not in the old one; changing a recorded posture because
//      something else would be convenient is drift (DR-0319).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const probe = readFileSync(join(ROOT, 'scripts', 'live-link-probe.mjs'), 'utf8');
const witness = readFileSync(join(ROOT, '.github', 'workflows', 'level-witness.yml'), 'utf8');
const linkProbe = readFileSync(join(ROOT, '.github', 'workflows', 'live-link-probe.yml'), 'utf8');

describe('the probe can walk the levels on the live site', () => {
  it('carries the level-switch case, pinned to the lesson from his screenshot', () => {
    expect(probe).toContain("name: '4-level-switch'");
    expect(probe).toContain('course=made-in-time&lesson=mit5-those-who-know-their-god');
    expect(probe).toContain("levelBands: ['Child', 'Adult']");
  });

  it('reads the body with the CONTROL row stripped out', () => {
    // Otherwise a change in the level chips would read as a change in the
    // lesson, which is precisely the confusion the report needs settled.
    expect(probe).toContain('[data-read-skip="true"]');
    expect(probe).toMatch(/clone\.querySelectorAll\('\[data-read-skip="true"\]'\)\.forEach\(\(n\) => n\.remove\(\)\)/);
  });

  it('selects a band through the real control the app renders', () => {
    expect(probe).toContain('[data-testid="lesson-level-control"]');
    expect(probe).toContain('button[role="radio"]');
  });

  it('names the defect as REAL only when the bodies are BYTE-IDENTICAL', () => {
    // THE FIRST VERSION OF THIS CHECK CRIED WOLF ON ITS FIRST LIVE RUN. It
    // compared the first 240 characters, and against poetech.us Child rendered
    // 787 characters while Adult rendered 1968 — plainly different bodies —
    // that happened to share an opening, because the lesson card renders its
    // title, anchor and big idea above the band text. A witness that fires
    // falsely is worse than none, so the failure rests on the whole body.
    expect(probe).toContain('THE REPORTED DEFECT IS REAL');
    expect(probe).toContain('BYTE-IDENTICAL');
    expect(probe).toMatch(/new Set\(seen\.map\(\(b\) => b\.body\)\)/);
    expect(probe, 'comparing the 240-character head is the false-alarm bug')
      .not.toMatch(/new Set\(seen\.map\(\(b\) => b\.head\)\)/);
  });

  it('reports where the bodies diverge, so a shared opening is visibly the header', () => {
    expect(probe).toMatch(/divergeAt/);
    expect(probe).toContain("a shared opening is the card's own heading, not the lesson");
  });

  it('fails loudly when a named case no longer exists', () => {
    // A witness pointed at a renamed case would pass while measuring nothing.
    expect(probe).toMatch(/RUN\.length !== ONLY\.length/);
    expect(probe).toContain('must fail loudly rather than measure nothing');
    expect(probe).toMatch(/process\.exit\(2\)/);
  });

  it('reads the BUILD the browser actually ran, and whether a worker served it', () => {
    // When a reader reports behaviour the live site does not reproduce, the
    // first question is whether his device is executing the build we think it
    // is — an installed service worker updates on its own schedule, and this
    // app has that history. vite injects globalThis.__PT_BUILD__, so the page
    // can be ASKED instead of assumed.
    // ASSERT THE ASSIGNMENT, NOT THE IDENTIFIER. The first version of this
    // check said toContain('globalThis.__PT_BUILD__') — and the probe's own
    // header comment contains that string, so gutting the code to
    // `out.build = null` left the check passing. A gate that survives a gutted
    // implementation is exactly what DR-0076 §3 forbids, and this one was
    // caught by running the break rather than by reading it.
    expect(probe).toMatch(/out\.build = globalThis\.__PT_BUILD__ \|\| null/);
    expect(probe).toMatch(/navigator\.serviceWorker && navigator\.serviceWorker\.controller/);
    expect(probe).toMatch(/out\.controlled = !!c/);
    expect(probe).toMatch(/servedBuild = await page\.evaluate/);
    expect(probe, 'a throwing accessor must not break the probe')
      .toMatch(/catch \(e\) \{ \/\* not injected \*\/ \}/);
  });

  it('carries the served build into both records, so it can be compared later', () => {
    // And assert it per STEP. The first version checked the whole file, so
    // deleting the build from the RUN LOG line still passed because the
    // incident step carried the same words. Both records are checked
    // separately now — the same defect class, found the same way.
    expect(probe).toMatch(/served_build=\$\{builds\}/);
    expect(probe).toMatch(/sw_controlled=\$\{controlled\}/);
    const logStep = witness.slice(witness.indexOf('Record the run (rolling log'), witness.indexOf('Record the finding'));
    expect(logStep, 'the run log must carry the served build').toContain('Build served: ${BUILD:-unknown}');
    expect(logStep, 'the run log must say whether a worker served the page').toContain('${SW:-unknown}');
    const findingStep = witness.slice(witness.indexOf('Record the finding'));
    expect(findingStep, 'the incident entry must carry the served build too').toContain('Build served: ${BUILD:-unknown}');
  });

  it('emits machine-readable outputs for the witness step', () => {
    expect(probe).toContain('fail_reasons=');
    expect(probe).toContain('level_summary=');
    expect(probe, 'newlines in a reason would break the GITHUB_OUTPUT format')
      .toMatch(/replace\(\/\[\\r\\n\]\+\/g, ' '\)/);
  });
});

describe('the finding reaches a place that can be read cheaply', () => {
  it('files on the rolling incident ledger rather than only an artifact', () => {
    expect(witness).toContain('--label incident');
    expect(witness).toContain('in:title level-witness');
    expect(witness).toMatch(/gh issue comment/);
    expect(witness).toMatch(/gh issue create/);
  });

  it('records EVERY run, pass or fail, so silence means it did not run', () => {
    // THE FIRST CLEAN RUN TAUGHT THIS. The witness filed only on failure, so a
    // passing run left nothing behind — and then "no issue filed" means either
    // "the reader is fine" or "the witness never ran", which are different
    // answers that cannot be told apart. DR-0125's rule exactly: unknown
    // freshness must never read as fresh. A run log fixes it, because silence
    // on the log is now itself the finding.
    expect(witness).toMatch(/name: Record the run \(rolling log, pass or fail\)/);
    expect(witness).toMatch(/if: always\(\)/);
    expect(witness).toContain('in:title level-witness run log');
    expect(witness).toContain('PASS - each band rendered its own lesson body');
    expect(witness).toContain('FAIL - ${REASONS:-the probe crashed before reporting}');
    expect(witness, 'silence on the log must be documented as meaning NOT RUN')
      .toMatch(/SILENCE on this log means the witness did not run/);
  });

  it('keeps the run log separate from the incident ledger', () => {
    // A passing run must never open an `incident` issue, and a failing one must
    // still reach the ledger. Two records, two meanings.
    const logStep = witness.slice(witness.indexOf('Record the run (rolling log'), witness.indexOf('Record the finding'));
    expect(logStep, 'the run log must not label anything as an incident').not.toContain('--label incident');
    const findingStep = witness.slice(witness.indexOf('Record the finding'));
    expect(findingStep).toContain('--label incident');
  });

  it('only closes a finding on a probe that actually RAN clean', () => {
    // A crashed probe proves nothing and must never close an open finding.
    expect(witness).toMatch(/steps\.probe\.outcome == 'success' && steps\.probe\.outputs\.fail_reasons == ''/);
  });

  it('still fails the run, after the ledger is written', () => {
    expect(witness).toContain('continue-on-error: true');
    expect(witness).toMatch(/name: Fail the run if the probe failed/);
    expect(witness).toMatch(/if: \$\{\{ steps\.probe\.outcome == 'failure' \}\}/);
  });

  it('carries the brakes this class requires', () => {
    expect(witness).toMatch(/timeout-minutes: 12/);            // budget
    expect(witness).toMatch(/group: level-witness/);           // lock
    expect(witness).toContain("vars.LEVEL_WITNESS_ENABLED != 'false'"); // deterministic stop
    expect(witness).toContain('ONLY_CASE');
  });

  it('asks for exactly one power beyond reading', () => {
    expect(witness).toMatch(/contents: read/);
    expect(witness).toMatch(/issues: write/);
    expect(witness, 'a witness that can push or deploy is not a witness').not.toMatch(/contents: write/);
  });
});

describe('the read-only probe stayed read-only', () => {
  it('live-link-probe.yml still asks for nothing but contents: read', () => {
    expect(linkProbe).toMatch(/permissions:\s*\n\s*contents: read/);
    expect(linkProbe).not.toMatch(/issues: write/);
    expect(linkProbe).toContain('READ-ONLY BY CONSTRUCTION');
  });

  it('and the new power lives in the new workflow instead', () => {
    expect(witness).toContain('the one extra power');
  });
});

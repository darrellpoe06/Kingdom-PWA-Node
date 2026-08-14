// =============================================================================
// site-health watches the BACKEND, not only the HTML — DR-0303 / P40
// =============================================================================
// On 2026-08-14 every account across all four apps was locked out for ~20 hours
// and not one instrument moved, because every check in the lane measures HTML
// and the HTML was perfect the whole time. Supabase was answering HTTP 402
// `exceed_egress_quota` behind it.
//
// These pins keep step 7 in place. They are source-level on purpose: a
// workflow's real behaviour was proven by RUNNING the step against a local
// server returning 402 / 500 / 000 / 200 / 401 (that run found a genuine bug —
// curl prints `000` on connection failure AND the `|| echo 000` fallback fired,
// concatenating to `000000`, so the retry never triggered). What a unit test
// can hold is that the step still exists and still classifies correctly.
//
// PROVEN-TO-CATCH (DR-0076 §3): deleting step 7 fails 'probes the backend at
// all'; moving 402 into the healthy arm fails 'treats a quota restriction as an
// outage'; letting an unset secret fall through silently fails 'never reads
// unmeasured as healthy'; and dropping the retry fails 'retries before calling
// it unreachable'.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WF = readFileSync(join(HERE, '../../../.github/workflows/site-health.yml'), 'utf8');

/** Shell code with `#` comments removed — prose must never be measured as code. */
function codeOnly(text) {
  return text.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
}

/** Just the backend step, so a match elsewhere in the file cannot stand in. */
function backendStep() {
  const start = WF.indexOf('# 7. USABLE');
  expect(start, 'step 7 (the backend probe) is missing from site-health.yml').toBeGreaterThan(-1);
  const end = WF.indexOf('echo "backend_code=', start);
  return WF.slice(start, end);
}

describe('site-health step 7 — the backend witness', () => {
  it('probes the backend at all', () => {
    const step = backendStep();
    expect(step).toMatch(/auth\/v1\/health/);
  });

  it('walks the path the app walks — with the anon key, not keyless', () => {
    // A keyless probe proves only that the host resolves. The app sends the
    // anon key on every request, so the witness must too.
    const step = backendStep();
    expect(step).toMatch(/apikey: \$SB_ANON/);
    expect(WF).toMatch(/SB_ANON: \$\{\{ secrets\.VITE_SUPABASE_ANON_KEY \}\}/);
    expect(WF).toMatch(/SB_URL: \$\{\{ secrets\.VITE_SUPABASE_URL \}\}/);
  });

  it('treats a quota restriction as an outage, on the incident ledger', () => {
    const step = backendStep();
    // 402 must reach add_fail — that is what puts it on the rolling `incident`
    // issue and fails the run, rather than a warning nobody reads.
    expect(step).toMatch(/402\)\s*add_fail/);
    expect(step).toMatch(/BACKEND RESTRICTED/);
  });

  it('names the violation, so the record says WHY', () => {
    expect(backendStep()).toMatch(/exceed_\[a-z_\]\+|restricted due to/);
  });

  it('counts an answering-but-gated backend as alive', () => {
    // 401 means auth is up and doing its job. Calling that an outage would
    // make the probe cry wolf every run.
    expect(backendStep()).toMatch(/200\|401\)/);
  });

  it('retries once before calling the backend unreachable', () => {
    const step = backendStep();
    expect(step).toMatch(/if \[ "\$CODE" = "000" \]; then sleep \d+; sb_fetch/);
  });

  it('does not re-introduce the 000000 concatenation bug', () => {
    // `curl -w '%{http_code}'` already prints 000 on a connection failure, so
    // an `|| echo "000"` fallback appends a SECOND 000; the resulting "000000"
    // matches neither the retry test nor the `000` case arm.
    //
    // `|| CODE=""` is the form that satisfies BOTH this and `bash -e`: it
    // keeps the assignment list at exit 0 (curl returns 7 when it cannot
    // connect, which would otherwise kill the step) while leaving exactly one
    // clean value for the `if` below to normalise.
    const code = codeOnly(backendStep());
    expect(code).not.toMatch(/\|\| echo "000"/);
    expect(code).toMatch(/\) \|\| CODE=""/);
  });

  it('never reads an unmeasured backend as healthy', () => {
    const step = backendStep();
    expect(step).toMatch(/NOT MEASURED/);
    // And the default must not be a passing-looking value.
    expect(step).toMatch(/BACKEND_CODE="unknown"/);
  });

  it('surfaces the backend status on the incident record', () => {
    expect(WF).toMatch(/BACKEND_CODE: \$\{\{ steps\.probe\.outputs\.backend_code \}\}/);
    expect(WF).toMatch(/backend auth: HTTP \$\{BACKEND_CODE\}/);
  });
});

// LIVE-RUN REGRESSIONS. Both of these were found by DISPATCHING the workflow
// against the real outage (run 31807695303), not by reading it — the probe
// detected the 402 and then failed to file it, which is the one thing this
// workflow exists to do.
describe('the probe cannot abort itself', () => {
  it('never ends a helper function on a bare `[ ... ] && assignment`', () => {
    // This step runs under GitHub's default `bash -e`. A trailing
    // `[ -z "$CODE" ] && CODE="000"` makes the FUNCTION return 1 when the test
    // is false, and the caller `sb_fetch "$url"` is a plain command, so `-e`
    // kills the step before it prints anything.
    // CODE ONLY. The fix's own comment quotes the bad pattern to explain it,
    // and the first version of this check matched that comment and failed —
    // measuring prose as if it were code, for the second time today.
    const code = codeOnly(backendStep());
    expect(code).not.toMatch(/\[ -z "\$CODE" \] && CODE="000"/);
    expect(code).toMatch(/if \[ -z "\$CODE" \]; then CODE="000"; fi/);
  });
});

describe('a crash in the probe cannot silence the ledger', () => {
  it('records an incident even when the probe step itself died', () => {
    // Without always(), a non-zero exit in the probe skips every later step —
    // so the outage report is the FIRST casualty of any bug in the prober.
    expect(WF).toMatch(
      /Record the incident[\s\S]*?if: \$\{\{ always\(\) && \(steps\.probe\.outputs\.fail_reasons != '' \|\| steps\.probe\.outcome == 'failure'\)/,
    );
  });

  it('never CLOSES an incident on a probe that did not complete', () => {
    // A crashed probe proves nothing; closing on it would erase a real outage
    // from the ledger (DR-0076 — unknown never reads as healthy).
    expect(WF).toMatch(
      /Close a recovered incident[\s\S]*?steps\.probe\.outcome == 'success' && steps\.probe\.outputs\.fail_reasons == ''/,
    );
  });

  it('never dispatches the stale-build heal off a crashed probe', () => {
    expect(WF).toMatch(
      /Heal a stale build[\s\S]*?if: \$\{\{ steps\.probe\.outcome == 'success' &&/,
    );
  });

  it('says so plainly when there is no reason string to report', () => {
    expect(WF).toMatch(/\$\{REASONS:-probe step crashed before reporting/);
  });
});

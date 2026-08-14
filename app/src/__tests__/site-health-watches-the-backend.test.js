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
    // `curl -w '%{http_code}'` already prints 000 on a connection failure; an
    // `|| echo "000"` fallback appends a SECOND 000, and the resulting
    // "000000" matches neither the retry test nor the `000` case arm.
    const step = backendStep();
    expect(step).not.toMatch(/curl[\s\S]*?\|\| echo "000"/);
    expect(step).toMatch(/\[ -z "\$CODE" \] && CODE="000"/);
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

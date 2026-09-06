// @vitest-environment node
//
// funnel-actuation-guard — PROVEN-TO-CATCH (DR-0076 §3) for the 2026-09-06
// tax-upload defect (DR-0330).
//
// The failure this guards: a same-origin route whose every visible layer is
// green — the client calls it, the Pages Function exists and forwards it
// correctly — while the Funnel has nothing mounted at the other end, so the
// call falls through to n8n and the app serves its authored fallback in
// silence. client-path-parity.test.js watches the first hop and passed
// throughout; this watches the hop after it.
//
// The blocks below feed the guard the exact breaking shapes and REQUIRE the
// finding. A guard that only asserted the repo is currently green would be
// theatre — it would have been just as green on 2026-09-05, with the upload
// already broken.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  actuationFindings,
  proxiedPrefixes,
  mountedPrefixes,
  recordedPrefixes,
  declaredUnactuated,
} from '../../../scripts/funnel-actuation-guard.mjs';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));

describe('funnel actuation guard', () => {
  it('the REAL repo is fully actuated or explicitly declared', () => {
    expect(actuationFindings()).toEqual([]);
  });

  // ---- proven-to-catch: the three shapes that were true on 2026-09-05 -------

  it('CATCHES a route that is neither recorded nor mounted (the /taxes defect)', () => {
    const findings = actuationFindings({
      functionsDir: repo('app/functions'),
      infraDir: repo('app/src/lib'),          // no installers here -> nothing mounted
      recordedStateFile: repo('app/package.json'), // no table, no ledger -> nothing declared
    });
    const taxes = findings.find((f) => f.prefix === '/taxes');
    expect(taxes).toBeTruthy();
    expect(taxes.mounted).toBe(false);
    expect(taxes.recorded).toBe(false);
    expect(taxes.detail).toMatch(/reaches nothing/);
  });

  it('CATCHES a mounted route missing from the baseline (the /sb rule-2 gap)', () => {
    const recorded = recordedPrefixes('| `/mcp` | x | y | z |\n');
    expect(recorded.has('/sb')).toBe(false);
    // A mount with no row is the rule-2 violation the guard reports distinctly.
    expect(mountedPrefixes([repo('infra/nas-supabase/install.sh')]).has('/sb')).toBe(true);
  });

  it('REFUSES an undated entry in the unactuated ledger', () => {
    // A dated gap is a promise with a deadline; an undated one is a parking
    // space. Only the dated form is honored (DR-0075).
    expect(declaredUnactuated('- `/llm` — no provider. re-review: 2026-09-20\n').has('/llm')).toBe(true);
    expect(declaredUnactuated('- `/llm` — no provider, we will get to it\n').has('/llm')).toBe(false);
  });

  // ---- non-vacuous pins: a green run can never mean "scanned nothing" -------

  it('actually finds the routes it claims to scan', () => {
    const proxied = proxiedPrefixes([repo('app/functions/poetech-app/taxes/[[path]].js')]);
    expect(proxied.has('/taxes')).toBe(true);
    expect(mountedPrefixes([repo('infra/nas-tax-ingest/install.sh')]).has('/taxes')).toBe(true);
    const state = readFileSync(repo('infra/nas-transport/RECORDED-STATE.md'), 'utf8');
    expect(recordedPrefixes(state).has('/taxes')).toBe(true);
  });
});

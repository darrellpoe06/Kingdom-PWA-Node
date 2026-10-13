// @vitest-environment node
// =============================================================================
// door_capture_selfcheck — the live order-path witness (DR-0398)
// =============================================================================
// crm-pipeline-parity.test.js catches a JS<->SQL allowlist drift at BUILD time
// (the DR-0374 cause). It cannot see a LIVE/deploy regression — the sovereign
// backend missing the migration, a grant/RLS change, the RPC unreachable. This
// migration adds the outside-in witness (DR-0125): site-health calls a
// self-cleaning round-trip against the real backend and knows the moment a real
// Moore order would be refused again.
//
// The FUNCTION BEHAVIOR is proven live (hosted DB, 2026-09-14): moore-orders ->
// {ok:true}; a bad pipeline -> {ok:false, stage:capture, "unknown pipeline"};
// and crm_leads went 0 -> 0 across three round-trips (self-cleaning). This file
// is the SOURCE-GATE that keeps the migration faithful — it must route through
// the REAL crm_capture_lead (never a second allowlist, the DR-0374 trap), self-
// delete, and be anon-callable — and that site-health actually wires it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const mig = readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto', '0218-the-order-path-has-a-live-witness-self-cleaning-capture-selfcheck.sql'), 'utf8');
const yml = readFileSync(join(ROOT, '.github', 'workflows', 'site-health.yml'), 'utf8');

describe('door_capture_selfcheck migration', () => {
  it('routes through the REAL crm_capture_lead, never a copied allowlist (DR-0374 lesson)', () => {
    expect(mig).toMatch(/v_id\s*:=\s*crm_capture_lead\s*\(/);
    // a second copy of the pipeline allowlist is exactly what cost Sterling
    expect(mig).not.toMatch(/WHEN 'moore-orders'/);
  });
  it('self-cleans: it deletes the row it created, and checks the delete landed', () => {
    expect(mig).toMatch(/DELETE FROM crm_leads WHERE id = v_id/);
    expect(mig).toMatch(/GET DIAGNOSTICS v_deleted = ROW_COUNT/);
  });
  it('catches the Sterling refusal as ok:false, never an unhandled throw', () => {
    expect(mig).toMatch(/EXCEPTION WHEN OTHERS THEN/);
    expect(mig).toMatch(/'ok',\s*false/);
  });
  it('is anon-callable but revoked from PUBLIC first', () => {
    expect(mig).toMatch(/REVOKE ALL ON FUNCTION public\.door_capture_selfcheck/);
    expect(mig).toMatch(/GRANT EXECUTE ON FUNCTION public\.door_capture_selfcheck\(text, text\) TO anon/);
  });
});

describe('site-health wires the order-path witness', () => {
  it('calls the selfcheck and fails LOUD only on a clean refusal', () => {
    expect(yml).toMatch(/door_capture_selfcheck/);
    expect(yml).toMatch(/ORDER PATH REFUSED/);
  });
  it('never cries wolf: an unmeasured/auth/down answer is NOT MEASURED, not an incident', () => {
    expect(yml).toMatch(/order path: \*\*NOT MEASURED\*\*/);
  });
});

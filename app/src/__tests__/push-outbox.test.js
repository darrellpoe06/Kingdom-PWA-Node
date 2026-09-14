// @vitest-environment node
// =============================================================================
// A new door fault enqueues an office push; the drain ships inactive (DR-0400)
// =============================================================================
// DR-0378 left the office push deliberately unbuilt. This is it: door_fault_report
// (migration 0220) enqueues ONE push_outbox row on a genuinely NEW fault
// (owner/admin, deduped, who/what not customer content); a drain delivers it via
// the existing push-send `fault` path. The drain is the timer/compute class and
// its live delivery rides the DR-0334 phone-proof, so it SHIPS INACTIVE.
//
// The ENQUEUE BEHAVIOR is proven live on the hosted DB (2026-09-14, rolled back):
// two identical faults -> exactly ONE push_outbox row (target owner_admin, kind
// door_fault, the system's sentence as body); the fold did not re-alert. This
// file source-gates the STRUCTURE so it cannot silently drift.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const mig = readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto', '0220-a-new-door-fault-enqueues-an-office-push-the-outbox.sql'), 'utf8');
const wf = readFileSync(join(ROOT, '.github', 'workflows', 'push-outbox-drain.yml'), 'utf8');
const drain = readFileSync(join(ROOT, 'scripts', 'push-outbox-drain-over-tailnet.sh'), 'utf8');

describe('migration 0220 — the enqueue', () => {
  it('the outbox table is office-only-read and revoked from anon/public', () => {
    expect(mig).toMatch(/CREATE TABLE IF NOT EXISTS public\.push_outbox/);
    expect(mig).toMatch(/REVOKE ALL ON public\.push_outbox FROM PUBLIC, anon/);
    expect(mig).toMatch(/user_role_in_instance\(instance_id\), ''\) IN \('owner','admin'\)/);
    // no write policy — writes are SECURITY DEFINER only
    expect(mig).not.toMatch(/CREATE POLICY[^\n]*push_outbox[^\n]*FOR (INSERT|ALL|UPDATE)/i);
  });
  it('enqueues on the NEW-fault path, AFTER the fold returns (a repeat never re-alerts)', () => {
    const foldReturn = mig.indexOf('IF v_id IS NOT NULL THEN');
    const enqueue = mig.indexOf('INSERT INTO public.push_outbox');
    expect(foldReturn).toBeGreaterThan(-1);
    expect(enqueue).toBeGreaterThan(foldReturn); // enqueue is past the fold's early return
    expect(mig).toMatch(/target_role[\s\S]*'owner_admin'/);
  });
  it('the enqueue is best-effort — it never turns a recorded fault into a failed call', () => {
    const enqueue = mig.indexOf('INSERT INTO public.push_outbox');
    const after = mig.slice(enqueue);
    expect(after).toMatch(/EXCEPTION WHEN OTHERS THEN\s*\n\s*NULL/);
  });
  it('re-runs the standing overlays (a new instance-scoped table)', () => {
    expect(mig).toMatch(/apply_viewer_readonly_overlay\(\)/);
    expect(mig).toMatch(/apply_assistant_scope_overlay\(\)/);
  });
});

describe('the drain ships INACTIVE with the three brakes', () => {
  it('KILL: the job runs only when PUSH_OUTBOX_DRAIN_ENABLED is exactly true', () => {
    expect(wf).toMatch(/if:\s*\$\{\{\s*vars\.PUSH_OUTBOX_DRAIN_ENABLED == 'true'\s*\}\}/);
  });
  it('LOCK: single-instance concurrency group', () => {
    expect(wf).toMatch(/group:\s*push-outbox-drain/);
  });
  it('BUDGET: a per-run row cap and a step timeout', () => {
    expect(wf).toMatch(/MAX_DRAIN:/);
    expect(wf).toMatch(/timeout-minutes:/);
  });
});

describe('the drain calls the known fault path, never broadcasts', () => {
  it('sends topic:fault with an explicit office audience', () => {
    expect(drain).toMatch(/topic:"fault"/);
    expect(drain).toMatch(/userIds:\.user_ids/);
    // owner/admin only — never a whole-instance broadcast
    expect(drain).toMatch(/role IN \('owner','admin'\)/);
  });
  it('marks sent only on a 2xx; a failure stays pending for retry', () => {
    expect(drain).toMatch(/2\*\)\s*remote_psql "UPDATE public\.push_outbox SET sent_at=now\(\)/);
    expect(drain).toMatch(/left pending for retry/);
  });
});

// @vitest-environment node
// A chain halfway through is not a revert, and a real revert still fails
// (DR-0944; db-migrate run 38093330311 read the product-forms leg mid-chain).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle, EVERY_MS, BUDGET_MS } from '../../../scripts/live-definition-witness-settle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

// A clock that advances only when the settle loop waits.
function harness(reads, busyLooks) {
  let t = 0;
  let r = 0;
  let b = 0;
  const seen = { reads: 0, looks: 0, waits: 0 };
  return {
    seen,
    opts: {
      now: () => t,
      wait: async (ms) => { seen.waits++; t += ms; await new Promise((ok) => setImmediate(ok)); },
      read: async () => { seen.reads++; return reads[Math.min(r++, reads.length - 1)]; },
      busy: async () => { seen.looks++; return busyLooks[Math.min(b++, busyLooks.length - 1)]; },
    },
  };
}
const CLEAN = { code: 0, report: 'clean' };
const OLDER = { code: 1, report: 'document_route — live definition is older than 0204' };
const FAULT = { code: 2, report: 'nothing arrived on stdin' };

describe('live-definition-witness-settle', () => {
  it('a clean read passes on the first look, never asking about isolation', async () => {
    const h = harness([CLEAN], [true]);
    const r = await settle(h.opts);
    expect(r.code).toBe(0);
    expect(h.seen).toEqual({ reads: 1, looks: 0, waits: 0 });
  });

  it('THE INCIDENT: older while the isolation run is mid-chain, clean once it moves on', async () => {
    const h = harness([OLDER, OLDER, CLEAN], [true, true]);
    const r = await settle(h.opts);
    expect(r.code).toBe(0);
    expect(r.reads).toBe(3);
    expect(r.waitedMs).toBe(2 * EVERY_MS);
  });

  it('PROVEN-TO-CATCH: older with no isolation run in motion fails at once, as before', async () => {
    const h = harness([OLDER, CLEAN], [false]);
    const r = await settle(h.opts);
    expect(r.code).toBe(1);
    expect(h.seen.reads).toBe(1);
    expect(h.seen.waits).toBe(0);
  });

  it('PROVEN-TO-CATCH: still older after the isolation run ends fails after one last read', async () => {
    const h = harness([OLDER], [true, false, false]);
    const r = await settle(h.opts);
    expect(r.code).toBe(1);
    expect(r.reads).toBe(3);
    expect(r.timedOut).toBe(false);
  });

  it('the run ending between a read and the look still earns one more read', async () => {
    const h = harness([OLDER, OLDER, CLEAN], [true, false]);
    const r = await settle(h.opts);
    expect(r.code).toBe(0);
    expect(r.reads).toBe(3);
  });

  it('PROVEN-TO-CATCH: an isolation run that never ends cannot hold the witness past its budget', async () => {
    const h = harness([OLDER], [true]);
    const r = await settle(h.opts);
    expect(r.code).toBe(1);
    expect(r.timedOut).toBe(true);
    expect(r.waitedMs).toBeGreaterThanOrEqual(BUDGET_MS);
    expect(r.waitedMs).toBeLessThan(BUDGET_MS + EVERY_MS);
  });

  it('a plumbing fault never retries, even with an isolation run in motion', async () => {
    const h = harness([FAULT, CLEAN], [true]);
    const r = await settle(h.opts);
    expect(r.code).toBe(2);
    expect(h.seen).toEqual({ reads: 1, looks: 0, waits: 0 });
  });

  it('db-migrate witnesses through the settle script with a token to see the isolation run', () => {
    const wf = readFileSync(join(ROOT, '.github/workflows/db-migrate.yml'), 'utf8');
    const step = wf.slice(wf.indexOf('- name: Witness the LIVE definitions'), wf.indexOf('- name: Land the same migrations'));
    expect(step).toContain('node scripts/live-definition-witness-settle.mjs');
    expect(step).toContain('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(step).not.toMatch(/live-definition-witness\.mjs --check/);
  });
});

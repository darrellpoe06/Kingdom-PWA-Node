// @vitest-environment node
// =============================================================================
// Moore Divahs' door data lives in her own instance — the cf re-point (DR-0399)
// =============================================================================
// The door READ and WROTE its class/order data under the FAMILY instance
// (poe-family) while the business is moore-divahs. Migration 0219 re-parents any
// stranded rows and the registry now names her own instance. Measured first on
// the backend the app reads (sovereign-read 34871114927): 0 orders, 0 messages,
// a handful of class rows, showcase already on moore-divahs — so the move is
// tiny and the migration exists mostly to PROVE nothing is left behind.
//
// PROVEN-TO-CATCH: the migration must MOVE (never delete) the four door-data
// tables and self-assert exhaustion; the registry must name moore-divahs for
// BOTH the read home and the capture lane. Revert either and a test here fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBusiness } from '../lib/business-registry.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const mig = readFileSync(join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0219-moore-door-data-moves-to-its-own-instance-the-cf-repoint.sql'), 'utf8');

describe('the registry names her own instance now', () => {
  const row = getBusiness('moore-divahs');
  it('reads and captures under moore-divahs, not the family instance', () => {
    expect(row.doorDataInstanceSlug).toBe('moore-divahs');
    expect(row.captureInstanceSlug).toBe('moore-divahs');
    expect(row.doorDataInstanceSlug).not.toBe('poe-family');
  });
});

describe('migration 0219 — moves, never deletes, and proves exhaustion', () => {
  it('re-parents the four door-data tables poe-family -> moore-divahs', () => {
    for (const t of ['custom_orders', 'class_sessions', 'class_signups', 'business_messages']) {
      expect(mig, `${t} must be moved`).toMatch(new RegExp(`UPDATE ${t}\\s+SET instance_id = v_moore WHERE instance_id = v_poe`));
    }
    // moving, not deleting — nothing is lost
    expect(mig).not.toMatch(/DELETE\s+FROM/i);
  });
  it('self-asserts EXHAUSTION — zero door-data may remain under poe-family', () => {
    expect(mig).toMatch(/re-point incomplete: % door-data rows still under poe-family/);
    expect(mig).toMatch(/RAISE EXCEPTION/);
  });
  it('refuses to re-point onto a missing target instance', () => {
    expect(mig).toMatch(/the moore-divahs instance is missing/);
  });
});

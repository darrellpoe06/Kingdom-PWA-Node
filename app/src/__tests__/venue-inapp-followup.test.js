// =============================================================================
// 0147 — follow up in the app: a booking remembers its member requester
// =============================================================================
// Darrell 2026-08-24: "we can follow up in the app through message as well...
// we don't need email... however it can be an option." These pins keep the
// stamp honest: the SERVER (the 0030 trigger, replaced in 0147) decides the
// requester account — signed-in self-submissions only, never a staff proxy,
// never a client-supplied value — and the staff card says the app is a
// follow-up channel only when the stamp is real.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toBookingShape } from '../lib/venue-rental.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0147-booking-follow-up-in-the-app.sql');
const sql = readFileSync(MIG, 'utf8');
const code = sql.replace(/--.*$/gm, '');

describe('0147 — the migration stamps in the trigger, never trusts the client', () => {
  it('adds requester_user referencing auth.users, idempotently', () => {
    expect(code).toMatch(/ADD COLUMN IF NOT EXISTS requester_user uuid REFERENCES auth\.users\(id\)/);
  });
  it('the trigger stamps auth.uid() only for signed-in NON-staff submissions', () => {
    expect(code).toMatch(/IF auth\.uid\(\) IS NOT NULL AND coalesce\(NEW\.source, ''\) <> 'staff' THEN/);
    expect(code).toMatch(/NEW\.requester_user := auth\.uid\(\)/);
    // ...and clears it otherwise, so a forged client value never survives.
    expect(code).toMatch(/NEW\.requester_user := NULL/);
  });
  it('the 0030 anon safe-shape survives the function replacement', () => {
    expect(code).toMatch(/NEW\.status\s+:= 'requested'/);
    expect(code).toMatch(/NEW\.quoted_price\s+:= NULL/);
    expect(code).toMatch(/NEW\.responsibilities := '\{\}'::jsonb/);
    expect(code).toMatch(/NEW\.source\s+:= 'public-request'/);
    expect(code).toMatch(/slug = 'colg'/);
  });
  it('touches NO policy and NO grant — read stays owner/admin (0030)', () => {
    expect(code).not.toMatch(/CREATE POLICY|DROP POLICY|GRANT /);
  });
});

describe('the surface speaks the stamp truthfully', () => {
  it('toBookingShape carries requesterUser (null when absent)', () => {
    expect(toBookingShape({ id: 'a', requester_user: 'u-1' }).requesterUser).toBe('u-1');
    expect(toBookingShape({ id: 'b' }).requesterUser).toBeNull();
  });
  it('the staff card offers Messages follow-up ONLY behind the real stamp', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'EventManagement.jsx'), 'utf8');
    expect(src).toMatch(/booking\.requesterUser && \(/);
    expect(src).toMatch(/follow up in Messages; email\/phone stay optional/);
  });
});

// =============================================================================
// 0148 — booking correspondence the team can carry (nobody-out-nobody-lost)
// =============================================================================
// Darrell 2026-08-24: "the media team should be able to see the historical
// texts between the potential congregations we will serve... so if someone is
// out we still have what we need and can contact the parties." DMs are E2E by
// design, so the team-visible history lives ON the booking. These pins hold
// the shape: append-only (no UPDATE/DELETE path granted or policied), both
// reader classes and no third, server-stamped identity, the requester RPC
// never leaks pricing, and both surfaces actually mount the thread.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0148-booking-correspondence-the-team-can-carry.sql');
const sql = readFileSync(MIG, 'utf8');
const code = sql.replace(/--.*$/gm, '');

describe('0148 — the record is append-only and identity is server-stamped', () => {
  it('grants only SELECT + INSERT; no UPDATE/DELETE grant or policy exists', () => {
    expect(code).toMatch(/GRANT SELECT, INSERT ON venue_booking_messages TO authenticated/);
    expect(code).not.toMatch(/FOR UPDATE|FOR DELETE/);
    expect(code).not.toMatch(/GRANT[^;]*(UPDATE|DELETE)[^;]*ON venue_booking_messages/);
  });
  it('the trigger stamps author, email, and from_staff from auth — never the client', () => {
    expect(code).toMatch(/NEW\.author\s+:= auth\.uid\(\)/);
    expect(code).toMatch(/NEW\.author_email := auth\.jwt\(\) ->> 'email'/);
    expect(code).toMatch(/NEW\.from_staff\s+:= EXISTS/);
  });
  it('read and write allow exactly two classes: instance staff, or the stamped requester', () => {
    const policies = code.match(/CREATE POLICY venue_booking_messages_(read|write)[\s\S]*?;/g) || [];
    expect(policies.length).toBe(2);
    for (const p of policies) {
      expect(p).toMatch(/coalesce\(user_role_in_instance\(b\.instance_id\), ''\) IN \('owner','admin'\)/);
      expect(p).toMatch(/b\.requester_user = auth\.uid\(\)/);
      expect(p).toMatch(/TO authenticated/);
    }
  });
  it('the body is bounded (1–4000) and the thread dies with its booking', () => {
    expect(code).toMatch(/CHECK \(char_length\(body\) BETWEEN 1 AND 4000\)/);
    expect(code).toMatch(/REFERENCES venue_bookings\(id\) ON DELETE CASCADE/);
  });
});

describe('my_venue_requests keeps the 0030 pricing posture', () => {
  it('the safe shape carries NO quoted_price, NO responsibilities, NO internal notes', () => {
    const fn = code.slice(code.indexOf('my_venue_requests'));
    expect(fn).not.toMatch(/quoted_price/);
    expect(fn).not.toMatch(/responsibilities/);
    expect(fn).toMatch(/b\.requester_user = auth\.uid\(\)/);
  });
  it('PUBLIC execute is revoked; authenticated only', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.my_venue_requests\(\) FROM PUBLIC/);
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.my_venue_requests\(\) TO authenticated/);
  });
});

describe('both surfaces mount the thread', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'EventManagement.jsx'), 'utf8');
  it('the staff card carries the correspondence thread', () => {
    expect(src).toMatch(/<CorrespondenceThread bookingId=\{booking\.id\} viewerIsStaff=\{true\} \/>/);
  });
  it('the requester gets My requests with their own threads', () => {
    expect(src).toMatch(/function MyVenueRequests/);
    expect(src).toMatch(/<CorrespondenceThread bookingId=\{r\.id\} viewerIsStaff=\{false\} \/>/);
  });
  it('the thread says plainly that it is shared with the team', () => {
    expect(src).toMatch(/Shared with the church’s event and media team/);
  });
  it('a failed send says so — never a silent drop', () => {
    expect(src).toMatch(/That message did NOT send/);
  });
});

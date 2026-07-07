// @vitest-environment node
// moore-classes-sync — pin the session + signup round-trips (DR-0076). The
// binding rule rides the shape: paid_at NULL = the seat holds NOTHING; the cap
// survives the loop; no payment data beyond the that/how/when record.
import { vi, describe, it, expect } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { toSessionRow, fromSessionRow, toSignupRow, fromSignupRow } from '../lib/moore-classes-sync.js';
import { newClassSession, seatsLeft } from '../lib/moore-divahs.js';

const NOW = '2026-07-07T12:00:00.000Z';
const CTX = { tenantId: 'inst-moore', userId: 'user-shay' };

describe('session round-trip', () => {
  it('a group session survives whole — price, cap, date, location', () => {
    const s = newClassSession({ format: 'group', project: 'Tote bag', dateIso: '2026-08-08T17:00:00.000Z', location: 'Moline library', priceCents: 4500 }, { now: NOW, id: 'mc-1' });
    const back = fromSessionRow({ ...toSessionRow(s, CTX), id: 'uuid-s1', created_at: s.createdAt });
    expect(back.id).toBe('mc-1');
    expect(back.format).toBe('group');
    expect(back.project).toBe('Tote bag');
    expect(back.seatCap).toBe(10);
    expect(back.priceCents).toBe(4500);
    expect(back.dateIso).toBe('2026-08-08T17:00:00.000Z');
    expect(back.remoteUuid).toBe('uuid-s1');
  });
  it('a hydrated row can never exceed the structural cap', () => {
    const back = fromSessionRow({ id: 'u', slug: 'mc-2', format: 'group', seat_cap: 40, price_cents: 4500 });
    expect(back.seatCap).toBe(10); // "so I can control the classroom"
  });
});

describe('signup round-trip — paid seats only', () => {
  it('a paid seat survives and still holds; an unpaid row still holds nothing', () => {
    const paid = fromSignupRow({ ...toSignupRow({ id: 'ms-1', sessionId: 'mc-1', studentName: 'Dana', paidAt: NOW, payMethod: 'venmo' }, CTX), id: 'uuid-p' });
    const unpaid = fromSignupRow({ ...toSignupRow({ id: 'ms-2', sessionId: 'mc-1', studentName: 'Maybe', paidAt: null }, CTX), id: 'uuid-u' });
    expect(paid.paidAt).toBe(NOW);
    expect(paid.payMethod).toBe('venmo');
    expect(unpaid.paidAt).toBeNull();
    const session = newClassSession({ format: 'group' }, { now: NOW, id: 'mc-1' });
    expect(seatsLeft(session, [paid, unpaid])).toBe(9); // only the PAID seat counts
  });
});

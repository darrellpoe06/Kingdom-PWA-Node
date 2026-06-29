// tenant-portal.test.js — the landlord<->tenant workflows. Pins: builders honor
// the relationship model, money is never moved in-app, the state machines reject
// illegal transitions, and each side's view is the no-leak slice.
import { describe, it, expect } from 'vitest';
import {
  MAINTENANCE_STATUS,
  RENT_STATUS,
  canTransition,
  buildMaintenanceRequest,
  buildRentRecord,
  buildNotice,
  buildMessage,
  tenantView,
  landlordView,
  rentSafetyNote,
} from '../lib/tenant-portal.js';

const CLOCK = '2026-06-29T12:00:00.000Z';

describe('maintenance request builder', () => {
  it('builds a submitted request from the tenant side', () => {
    const r = buildMaintenanceRequest({ tenancyId: 't1', title: 'Leaky faucet', detail: 'drips', area: 'kitchen', priority: 'high' }, CLOCK);
    expect(r.status).toBe('submitted');
    expect(r.created_by_role).toBe('tenant');
    expect(r.priority).toBe('high');
    expect(r.tenancy_id).toBe('t1');
    expect(r.created_at).toBe(CLOCK);
  });
  it('requires a title and clamps an unknown priority to normal', () => {
    expect(() => buildMaintenanceRequest({ title: '' })).toThrow(/title/);
    expect(buildMaintenanceRequest({ title: 'x', priority: 'bogus' }).priority).toBe('normal');
  });
});

describe('rent record builder — NO money moves', () => {
  it('records a reported payment and asserts money_moved_in_app is false', () => {
    const r = buildRentRecord({ tenancyId: 't1', amount: 1200, forPeriod: '2026-07', method: 'owner-processor' }, CLOCK);
    expect(r.status).toBe('reported');
    expect(r.money_moved_in_app).toBe(false);
    expect(r.amount).toBe(1200);
    expect(r.reported_at).toBe(CLOCK);
  });
  it('rejects a non-positive amount', () => {
    expect(() => buildRentRecord({ amount: 0 })).toThrow(/positive/);
    expect(() => buildRentRecord({ amount: -5 })).toThrow(/positive/);
    expect(() => buildRentRecord({ amount: 'abc' })).toThrow(/positive/);
  });
  it('the safety note states plainly that no money moves', () => {
    expect(rentSafetyNote()).toMatch(/never moves money/i);
  });
});

describe('notice + message builders honor the relationship', () => {
  it('only the landlord posts notices', () => {
    const n = buildNotice({ tenancyId: 't1', title: 'Inspection Tuesday', kind: 'inspection' }, CLOCK);
    expect(n.created_by_role).toBe('landlord');
    expect(n.kind).toBe('inspection');
    expect(() => buildNotice({ title: '' })).toThrow(/title/);
  });
  it('messages carry the sender role and require a body', () => {
    expect(buildMessage({ tenancyId: 't1', fromRole: 'tenant', body: 'hi' }, CLOCK).from_role).toBe('tenant');
    expect(buildMessage({ tenancyId: 't1', fromRole: 'landlord', body: 'hi' }, CLOCK).from_role).toBe('landlord');
    expect(() => buildMessage({ fromRole: 'tenant', body: '' })).toThrow(/body/);
  });
});

describe('state machines', () => {
  it('maintenance: legal vs illegal transitions', () => {
    expect(canTransition('maintenance', 'submitted', 'received')).toBe(true);
    expect(canTransition('maintenance', 'received', 'resolved')).toBe(true);
    expect(canTransition('maintenance', 'resolved', 'submitted')).toBe(false);
    expect(canTransition('maintenance', 'submitted', 'resolved')).toBe(false); // must be received first
    expect(MAINTENANCE_STATUS).toContain('declined');
  });
  it('rent: reported -> confirmed/disputed legal; confirmed -> reported illegal', () => {
    expect(canTransition('rent', 'reported', 'confirmed')).toBe(true);
    expect(canTransition('rent', 'reported', 'disputed')).toBe(true);
    expect(canTransition('rent', 'confirmed', 'reported')).toBe(false);
    expect(RENT_STATUS).toContain('void');
  });
});

describe('no-leak views', () => {
  const rows = {
    tenancy: { id: 't1', unit_label: 'Apt 2', property_label: 'Maple St' },
    maintenance: [
      { tenancy_id: 't1', status: 'submitted' },
      { tenancy_id: 't2', status: 'submitted' }, // another tenant's — must NOT appear
    ],
    rent: [
      { tenancy_id: 't1', status: 'reported', reported_at: '2026-06-01' },
      { tenancy_id: 't2', status: 'reported', reported_at: '2026-06-01' },
    ],
    notices: [{ tenancy_id: 't1', title: 'n1' }, { tenancy_id: 't2', title: 'n2' }],
    messages: [{ tenancy_id: 't1', body: 'm1' }, { tenancy_id: 't2', body: 'm2' }],
  };

  it('tenantView returns ONLY the tenant own-tenancy rows, never others', () => {
    const v = tenantView('t1', rows);
    expect(v.tenancy.id).toBe('t1');
    expect(v.maintenance.every((m) => m.tenancy_id === 't1')).toBe(true);
    expect(v.rent.every((r) => r.tenancy_id === 't1')).toBe(true);
    expect(v.notices.every((n) => n.tenancy_id === 't1')).toBe(true);
    expect(v.messages.every((m) => m.tenancy_id === 't1')).toBe(true);
    // none of t2 leaked in
    expect(JSON.stringify(v)).not.toMatch(/t2/);
    // and the portfolio is structurally off-limits
    expect(v.canSeePortfolio).toBe(false);
  });

  it('landlordView builds a rent roll across the landlord tenancies', () => {
    const v = landlordView({
      tenancies: [{ id: 't1', unit_label: 'Apt 2' }, { id: 't2', unit_label: 'Apt 3' }],
      maintenance: rows.maintenance,
      rent: rows.rent,
      notices: rows.notices,
    });
    expect(v.doorCount).toBe(2);
    expect(v.rentRoll).toHaveLength(2);
    expect(v.reportedUnconfirmed.length).toBe(2); // both reported, none confirmed
    expect(v.openRequests.length).toBe(2);
  });
});

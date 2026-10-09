// =============================================================================
// Every seat a person holds, and every seat they have walked (DR-0842)
// =============================================================================
// Darrell 2026-10-09: "I want my kids to see how to manage these systems from
// all positions so they can learn how to navigate life and experience running
// our businesses... Before they need to..."
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SEATS, seatsHeld, seatsWalked, seatsToWalk, apprenticeshipLine } from '../lib/apprenticeship.js';
import { loadSeatRows } from '../lib/person-record-sync.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ spaces: [], members: {}, invites: { ok: true, invites: [] }, usage: null }));
vi.mock('../lib/member-roles.js', async (orig) => ({ ...(await orig()), listMyAdminInstances: async () => H.spaces, listInstanceMembersStrict: async (id) => H.members[id] || [] }));
vi.mock('../modules/properties/cloud.js', () => ({ loadInvites: async () => H.invites }));
vi.mock('../lib/usage-events.js', () => ({ fetchUserUsage: async () => H.usage, recordView: async () => true }));
vi.mock('../lib/supabase.js', () => ({
  default: { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }), auth: { getSession: async () => ({ data: { session: null } }) } },
  supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));
vi.mock('../lib/person-record-sync.js', async (orig) => ({ ...(await orig()), loadPersonRows: async () => ({ dm: { ok: true, rows: [] }, presence: { ok: true, rows: [] }, lan: { ok: true, rows: [] } }) }));

import PersonRecord from '../components/PersonRecord.jsx';

const FAM = { instanceId: 'i-fam', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family', role: 'owner' };
const PROPS = { instanceId: 'i-pp', slug: 'poe-properties', displayName: 'Poe Properties', instanceType: 'business', role: 'owner' };
const CHURCH = { instanceId: 'i-ch', slug: 'colg', displayName: 'The Church', instanceType: 'church', role: 'admin' };

describe('seats held, walked and not yet (pure)', () => {
  it('reads the seats from memberships and from Poe Properties invites, one per seat and place', () => {
    const held = seatsHeld({ userId: 'u-kid', email: 'kid@example.org' }, {
      memberships: [
        { ...FAM, userId: 'u-kid', role: 'member', joinedAt: '2026-10-01' },
        { ...PROPS, userId: 'u-kid', role: 'member' },
        { ...CHURCH, userId: 'u-kid', role: 'member' },
        { ...FAM, userId: 'u-other', role: 'member' },
      ],
      propertyInvites: [
        { role_label: 'tenant', email: 'kid@example.org', claimed_by: null, claimed_at: null, created_at: '2026-10-02', scope_ref: '*' },
        { role_label: 'field_worker', email: '15550100123@phone.poetech.us', claimed_by: 'u-kid', claimed_at: '2026-10-03', scope_ref: 'r-1003koehn' },
        { role_label: 'manager', email: 'kid@example.org', revoked: true },
        { role_label: 'tenant', email: 'someone@else.org' },
      ],
    });
    expect(held.map((s) => [s.key, s.where, s.claimed])).toEqual([
      ['family', 'Poe Family', true], ['manager', 'Poe Properties', true], ['church', 'The Church', true],
      ['tenant', 'every door', false], ['field_worker', 'r-1003koehn', true],
    ]);
    expect(seatsHeld({ userId: 'u-x' }, { memberships: [{ ...PROPS, userId: 'u-x', role: 'owner' }] })[0].key).toBe('landlord');
  });
  it('walked is the opens of the views the seat lives in; not yet lists the rest with the way to grant each', () => {
    const held = seatsHeld({ userId: 'u-kid' }, { memberships: [{ ...FAM, userId: 'u-kid', role: 'member' }, { ...PROPS, userId: 'u-kid', role: 'member' }] });
    const walked = seatsWalked(held, [{ name: 'properties', views: 7, last_at: '2026-10-08T00:00:00Z' }, { name: 'books', views: 2 }]);
    expect(walked.map((s) => [s.key, s.opens, s.walked])).toEqual([['family', 0, false], ['manager', 7, true]]);
    const next = seatsToWalk(held);
    expect(next.map((s) => s.key)).toEqual(['tenant', 'household', 'field_worker', 'landlord', 'church', 'business']);
    expect(next[0].how).toContain('People you know');
    expect(SEATS.every((s) => s.does.length >= 2 && s.views.length >= 1)).toBe(true);
    expect(apprenticeshipLine(held, walked, [])).toBe('Holds 2 seats · 1 of 2 walked in the last 30 days · 6 not yet.');
    expect(apprenticeshipLine(held, walked, null)).toContain('theirs alone until they are in a space you steward');
    expect(apprenticeshipLine([], [], [])).toBe('Holds no seat yet; every seat below is one placement away.');
  });
  it('loadSeatRows reads each space the steward administers and keeps only this person, with the invites and the usage', async () => {
    const r = await loadSeatRows('u-kid', 'kid@example.org', {
      listMyAdminInstances: async () => [FAM, PROPS],
      listInstanceMembersStrict: async (id) => (id === 'i-fam' ? [{ userId: 'u-kid', role: 'member' }, { userId: 'u-x', role: 'owner' }] : [{ userId: 'u-kid', role: 'member' }]),
      loadInvites: async () => ({ ok: true, invites: [{ role_label: 'tenant', email: 'kid@example.org' }] }),
      fetchUserUsage: async () => [{ name: 'properties', views: 3 }],
    });
    expect(r.memberships.map((m) => [m.slug, m.role])).toEqual([['poe-family', 'member'], ['poe-properties', 'member']]);
    expect(r.propertyInvites.length).toBe(1);
    expect(r.invitesOk).toBe(true);
    expect(r.usage).toEqual([{ name: 'properties', views: 3 }]);
    const refused = await loadSeatRows('u-kid', '', { listMyAdminInstances: async () => { throw new Error('x'); }, loadInvites: async () => { throw new Error('y'); }, fetchUserUsage: async () => null });
    expect(refused).toEqual({ memberships: [], propertyInvites: [], invitesOk: false, usage: null });
  });
});

describe('the Known fold shows the seats', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; Object.assign(H, { spaces: [], members: {}, invites: { ok: true, invites: [] }, usage: null }); });
  async function mount() {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(PersonRecord, { instanceId: 'i-fam', member: { userId: 'u-kid', email: 'kid@example.org', displayName: 'Christiana' } })); });
    for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
  }
  it('names what she holds and has walked, and what is not yet hers with the way to grant it', async () => {
    H.spaces = [FAM, PROPS];
    H.members = { 'i-fam': [{ userId: 'u-kid', role: 'member' }], 'i-pp': [] };
    H.invites = { ok: true, invites: [{ role_label: 'tenant', email: 'kid@example.org', claimed_by: 'u-kid', claimed_at: '2026-10-03', scope_ref: '*' }] };
    H.usage = [{ name: 'properties', views: 4, last_at: '2026-10-08T00:00:00Z' }];
    await mount();
    const line = container.querySelector('[data-testid="person-record-seats-line"]').textContent;
    expect(line).toBe('Holds 2 seats · 1 of 2 walked in the last 30 days · 6 not yet.');
    const seats = Array.from(container.querySelectorAll('[data-testid="person-record-seat"]'));
    expect(seats.map((s) => s.getAttribute('data-walked'))).toEqual(['false', 'true']);
    expect(seats[1].textContent).toContain('Tenant · every door');
    expect(seats[1].textContent).toContain('walked: 4 opens in 30 days');
    expect(seats[0].textContent).toContain('what this seat does: the big picture');
    expect(container.querySelectorAll('[data-testid="person-record-seat-next"]').length).toBe(6);
    expect(container.textContent).toContain('People you know → Poe Properties → 1099 worker');
  });
});

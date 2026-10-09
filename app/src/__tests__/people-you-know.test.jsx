// =============================================================================
// People you know, placed where they belong (DR-0839)
// =============================================================================
// Darrell 2026-10-09: "Also my daughter Christiana! In my contacts... how do I
// add all my contacts at once? Then choosing who are tenants... church
// members... etc... all who we want in whatever space."
// Pure cases over the merge, the account match, the placements and the
// record each placement writes; then the section rendered over a keeper and
// a device list, placing one person and many, each write seen.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { peopleFromContacts, accountFor, matchAccounts, placementsFor, isPropertiesSpace, inviteIdentityFor, placePerson, placeMany, placementSummary } from '../lib/people-placement.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ table: { ok: true, rows: [], reason: '' }, device: [], signups: [], spaces: [], adds: [], invites: [], propInvites: [] }));
vi.mock('../lib/contacts-store.js', () => ({
  loadMyContacts: async () => H.table,
  cachedContacts: () => H.device,
}));
vi.mock('../lib/signup-metrics.js', async (orig) => ({ ...(await orig()), fetchSignupMetrics: async () => ({ status: 'ready', data: { summary: {}, signups: H.signups } }) }));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => H.spaces,
  addUserToSpace: async (instanceId, userId, role, name) => { H.adds.push({ instanceId, userId, role, name }); return { ok: true, status: 'added', role }; },
  inviteToSpace: async (instanceType, email, role, instanceId) => { H.invites.push({ instanceType, email, role, instanceId }); return instanceType === 'church' ? { ok: true, kind: 'church' } : { ok: true, kind: 'instance', link: 'https://poetech.us/claim/abc' }; },
}));
vi.mock('../modules/properties/cloud.js', () => ({
  inviteToProperties: async (args) => { H.propInvites.push(args); return { ok: true, invite: { id: 'inv' } }; },
}));
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: (p) => { const d = String(p || '').replace(/\D+/g, ''); return d ? `${d.length === 10 ? '1' + d : d}@phone.poetech.us` : ''; },
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import PeopleYouKnow from '../components/PeopleYouKnow.jsx';

const FAMILY = { instanceId: 'i-fam', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family', role: 'owner' };
const CHURCH = { instanceId: 'i-ch', slug: 'a-church', displayName: 'A Church', instanceType: 'church', role: 'admin' };
const PROPS = { instanceId: 'i-pp', slug: 'poe-properties', displayName: 'Poe Properties', instanceType: 'business', role: 'owner' };
const toPhoneEmail = (p) => `1${String(p).replace(/\D+/g, '')}@phone.poetech.us`;

describe('the people, matched and placed (pure)', () => {
  it('merges the keeper and the device by identifier, names only, phones as national digits', () => {
    const people = peopleFromContacts(
      [{ name: 'Christiana Poe', phones: ['(555) 010-0123'], emails: [] }, { name: 'Bro Reed', phones: [], emails: ['Reed@Example.org'] }, { name: '', phones: ['5550109999'], emails: [] }],
      [{ name: 'Christiana Poe', phone: '+1 555-010-0123', email: 'chris@example.org' }, { name: 'Ana', phone: '5550100777', email: '' }],
    );
    expect(people.map((p) => p.name)).toEqual(['Ana', 'Bro Reed', 'Christiana Poe']);
    expect(people.find((p) => p.name === 'Christiana Poe')).toMatchObject({ phones: ['5550100123'], emails: ['chris@example.org'] });
    expect(people.find((p) => p.name === 'Bro Reed').emails).toEqual(['reed@example.org']);
  });
  it('finds the account by a real email or by the phone a phone-door account signs in with', () => {
    const rows = [{ user_id: 'u-c', email: '15550100123@phone.poetech.us', category: 'self-serve' }, { user_id: 'u-r', email: 'reed@example.org', category: 'church' }];
    expect(accountFor({ emails: [], phones: ['5550100123'] }, rows)).toMatchObject({ userId: 'u-c', by: 'phone', category: 'self-serve' });
    expect(accountFor({ emails: ['reed@example.org'], phones: [] }, rows)).toMatchObject({ userId: 'u-r', by: 'email' });
    expect(accountFor({ emails: ['nobody@example.org'], phones: ['5550100000'] }, rows)).toBeNull();
    expect(matchAccounts([{ name: 'x', emails: [], phones: ['5550100123'] }], rows)[0].account.userId).toBe('u-c');
  });
  it('offers the Poe Properties roles on that space and member/viewer (admin for an owner) elsewhere', () => {
    expect(isPropertiesSpace(PROPS)).toBe(true);
    expect(isPropertiesSpace(FAMILY)).toBe(false);
    expect(placementsFor(PROPS).map((p) => p.key)).toEqual(['tenant', 'household', 'field_worker', 'manager']);
    expect(placementsFor(FAMILY).map((p) => p.key)).toEqual(['member', 'viewer', 'admin']);
    expect(placementsFor(CHURCH).map((p) => p.key)).toEqual(['member', 'viewer']);
  });
  it('invites by a real email first, else by the phone they will sign in with', () => {
    expect(inviteIdentityFor({ emails: ['a@x.org'], phones: ['5550100123'] }, toPhoneEmail)).toEqual({ email: 'a@x.org', phone: '' });
    expect(inviteIdentityFor({ emails: [], phones: ['5550100123'] }, toPhoneEmail)).toEqual({ email: '15550100123@phone.poetech.us', phone: '5550100123' });
    expect(inviteIdentityFor({ emails: [], phones: [] }, toPhoneEmail)).toEqual({ email: '', phone: '' });
  });
  it('an account that exists is added; a person without one is invited; a tenant goes to the Poe Properties invites; a closed door is said', async () => {
    const adds = []; const invites = []; const props = [];
    const deps = {
      toPhoneEmail,
      addUserToSpace: async (i, u, r, n) => { adds.push([i, u, r, n]); return { ok: true, status: 'added', role: r }; },
      inviteToSpace: async (t, e, r, i) => { invites.push([t, e, r, i]); return { ok: true, kind: t === 'church' ? 'church' : 'instance', link: t === 'church' ? undefined : 'L' }; },
      inviteToProperties: async (a) => { props.push(a); return { ok: true }; },
    };
    const withAccount = { name: 'Christyn Poe', emails: [], phones: ['4472209779'], account: { userId: 'u-x' } };
    expect(await placePerson({ ...deps, person: withAccount, space: FAMILY, placement: 'member' })).toMatchObject({ outcome: 'added', detail: 'member of Poe Family' });
    expect(adds).toEqual([['i-fam', 'u-x', 'member', 'Christyn Poe']]);
    const noAccount = { name: 'Christiana Poe', emails: [], phones: ['5550100123'], account: null };
    const r2 = await placePerson({ ...deps, person: noAccount, space: FAMILY, placement: 'member' });
    expect(r2).toMatchObject({ outcome: 'link', link: 'L' });
    expect(invites).toEqual([['family', '15550100123@phone.poetech.us', 'member', 'i-fam']]);
    expect(await placePerson({ ...deps, person: noAccount, space: CHURCH, placement: 'member' })).toMatchObject({ outcome: 'invited' });
    const r4 = await placePerson({ ...deps, person: noAccount, space: PROPS, placement: 'tenant' });
    expect(r4).toMatchObject({ outcome: 'invited' });
    expect(r4.detail).toContain('Tenant (the lease signer) on Poe Properties');
    expect(props).toEqual([{ instanceId: 'i-pp', email: '', phone: '5550100123', roleLabel: 'tenant', tenancyId: null, scopeRef: '*', capabilities: [], displayName: 'Christiana Poe' }]);
    const r5 = await placePerson({ ...deps, person: noAccount, space: PROPS, placement: 'field_worker' });
    expect(props[1].capabilities).toEqual(['property.history', 'docs.add']);
    expect(r5.outcome).toBe('invited');
    expect(await placePerson({ ...deps, person: { name: 'Nobody', emails: [], phones: [] }, space: FAMILY, placement: 'member' })).toMatchObject({ outcome: 'error', detail: 'no email or phone to invite' });
    expect(await placePerson({ ...deps, person: noAccount, space: null, placement: 'member' })).toMatchObject({ outcome: 'error' });
    const many = await placeMany([withAccount, noAccount, { name: 'Nobody', emails: [], phones: [] }], { ...deps, space: FAMILY, placement: 'viewer' });
    expect(many.map((r) => r.outcome)).toEqual(['added', 'link', 'error']);
    expect(placementSummary(many)).toBe('1 added · 1 with a claim link to send · 1 not placed');
    expect(placementSummary([])).toBe('Nothing placed.');
  });
});

describe('the section, rendered', () => {
  let container; let root;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (container) container.remove();
    root = container = null;
    Object.assign(H, { table: { ok: true, rows: [], reason: '' }, device: [], signups: [], spaces: [], adds: [], invites: [], propInvites: [] });
  });
  async function mount() {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(PeopleYouKnow)); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  }
  const text = () => container.textContent || '';

  it('with nothing brought in it says so and names the door', async () => {
    await mount();
    expect(container.querySelector('[data-testid="people-empty"]').textContent).toContain('Bring them in under Messages > Add a contact');
  });

  it('lists the people with their account where one exists, and places one person by the chosen space and placement', async () => {
    H.table = { ok: true, rows: [{ name: 'Christiana Poe', phones: ['(555) 010-0123'], emails: [] }, { name: 'Christyn Poe', phones: ['(555) 010-0498'], emails: [] }], reason: '' };
    H.signups = [{ user_id: 'u-christyn', email: '15550100498@phone.poetech.us', category: 'family' }];
    H.spaces = [FAMILY, PROPS];
    await mount();
    const rows = Array.from(container.querySelectorAll('[data-testid="people-row"]'));
    expect(rows.map((r) => r.querySelector('[data-testid="people-row-name"]').textContent)).toEqual(['Christiana Poe', 'Christyn Poe']);
    expect(rows.map((r) => r.querySelector('[data-testid="people-row-account"]').textContent)).toEqual(['no account yet', 'Family']);
    expect(text()).toContain('2 of 2 people · 1 with an account');
    // Christiana, no account: Invite to Poe Family as member -> the phone-door invite
    await act(async () => { rows[0].querySelector('[data-testid="people-place-one"]').click(); });
    for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.invites).toEqual([{ instanceType: 'family', email: '15550100123@phone.poetech.us', role: 'member', instanceId: 'i-fam' }]);
    expect(container.querySelector('[data-testid="people-results"]').textContent).toContain('Christiana Poe');
    expect(container.querySelector('[data-testid="people-results"]').textContent).toContain('claim link');
  });

  it('places everyone ticked as tenants on Poe Properties, each write seen', async () => {
    H.table = { ok: true, rows: [{ name: 'Tenant One', phones: ['(555) 010-0201'], emails: [] }, { name: 'Tenant Two', phones: [], emails: ['two@example.org'] }], reason: '' };
    H.spaces = [FAMILY, PROPS];
    await mount();
    const space = container.querySelector('select[aria-label="Space"]');
    await act(async () => { space.value = 'i-pp'; space.dispatchEvent(new Event('change', { bubbles: true })); });
    const as = container.querySelector('select[aria-label="As"]');
    expect(Array.from(as.options).map((o) => o.value)).toEqual(['tenant', 'household', 'field_worker', 'manager']);
    await act(async () => { container.querySelector('[data-testid="people-pick-all"]').click(); });
    const go = container.querySelector('[data-testid="people-place-picked"]');
    expect(go.textContent).toBe('Place 2 ticked');
    await act(async () => { go.click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.propInvites.map((a) => [a.roleLabel, a.phone, a.email, a.displayName])).toEqual([['tenant', '5550100201', '', 'Tenant One'], ['tenant', '', 'two@example.org', 'Tenant Two']]);
    expect(container.querySelector('[data-testid="people-results"]').textContent).toContain('2 invited');
  });
});

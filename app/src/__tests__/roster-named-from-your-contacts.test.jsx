// @vitest-environment jsdom
// =============================================================================
// The Admin roster names a member from the steward's own contacts (DR-0825)
// =============================================================================
// A roster row with no display name used to read as its sign-in address; now
// it reads as the person the steward's contacts know, labelled "from your
// contacts", and a row with its own name keeps it with the contact name beside
// it. The reach line (member-contact.js) is unchanged. Fixtures are made up.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../components/OpsBoard.jsx', () => ({ default: () => <div data-stub="ops" /> }));
vi.mock('../components/DbHealth.jsx', () => ({ default: () => <div data-stub="db" /> }));
vi.mock('../components/LlmHealth.jsx', () => ({ default: () => <div data-stub="llm" /> }));
vi.mock('../components/WorkflowStatus.jsx', () => ({ default: () => <div data-stub="workflow" /> }));
vi.mock('../components/NetworkStatus.jsx', () => ({ default: () => <div data-stub="network" /> }));
vi.mock('../components/AccessUsageMetrics.jsx', () => ({ default: () => <div data-stub="access" /> }));
vi.mock('../components/LoopHealth.jsx', () => ({ default: () => <div data-stub="loop" /> }));

vi.mock('../lib/supabase.js', () => {
  const stub = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) },
    rpc: async () => ({ data: 'owner', error: null }),
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
  };
  return { default: stub, supabase: stub, onAuthChange: () => () => {} };
});
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => [{ instanceType: 'family', instanceId: 'f1', role: 'owner', displayName: 'Family' }],
  listInstanceMembersStrict: async () => [
    { userId: 'me', displayName: 'Darrell', email: 'darrellpoe06@gmail.com', role: 'owner' },
    { userId: 'u-door', displayName: '', email: '15550100498@phone.poetech.us', role: 'member' },
    { userId: 'u-named', displayName: 'S. Reed', email: 'reed@example.org', role: 'member' },
  ],
  listMemberCapabilities: async () => [],
}));
vi.mock('../lib/family-invite.js', async (orig) => ({
  ...(await orig()),
  listPendingClaims: async () => ({ ok: true, claims: [] }),
}));
const store = { device: [], table: { ok: true, rows: [], reason: '' } };
vi.mock('../lib/contacts-store.js', () => ({
  cachedContacts: () => store.device,
  loadMyContacts: async () => store.table,
}));
// The Known fold's reads (DR-0828): a message device for the door member, and
// presence that the server refuses, so both the row and the reason render.
vi.mock('../lib/person-record-sync.js', () => ({
  loadPersonRows: async (instanceId, userId) => ({
    dm: { ok: true, rows: userId === 'u-door' ? [{ device_id: 'd1', label: 'Android device', last_seen_at: new Date().toISOString() }] : [], reason: '' },
    presence: { ok: false, rows: [], reason: 'permission denied for table member_presence' },
    lan: { ok: true, rows: userId === 'u-door' ? [{ id: 'r1', name: 'Her tablet', device_type: 'iot', location: 'Fellowship hall', specs: { mac: 'AA-BB-CC-DD-EE-FF' }, updated_at: '2026-10-01T00:00:00Z' }] : [], reason: '' },
  }),
}));

import AdminConsole from '../components/AdminConsole.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
const settle = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });

async function mountAndLoadRoster() {
  await act(async () => {
    root.render(<AdminConsole isGovernor email="darrellpoe06@gmail.com" instanceId="f1" data={{ transactions: [], loopDecisions: {} }} />);
  });
  await settle();
  // The roster lives under the Role & stewards section; open it first.
  const tab = Array.from(host.querySelectorAll('[role="tab"]')).find((b) => /Role & stewards/.test(b.textContent || ''));
  expect(tab, 'Admin has a Role & stewards section tab').toBeTruthy();
  await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle();
  const load = Array.from(host.querySelectorAll('button')).find((b) => /^Load members$/.test((b.textContent || '').trim()));
  expect(load, 'the Manage access roles load control exists').toBeTruthy();
  await act(async () => { load.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle();
  return Array.from(host.querySelectorAll('[data-testid="roster-row-who"]')).map((n) => n.parentElement.textContent);
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.clearAllMocks();
});

describe('Admin roster, named from your contacts', () => {
  it('a phone-door member with no display name reads as the person the steward knows', async () => {
    store.table = { ok: true, rows: [
      { name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [] },
      { name: 'Brother Reed', phones: [], emails: ['reed@example.org'] },
    ], reason: '' };
    const rows = await mountAndLoadRoster();
    const door = rows.find((t) => /010-0498/.test(t));
    expect(door).toContain('Sister Lamb');
    expect(door).toContain('from your contacts');
    expect(door).toContain('(555) 010-0498 · signs in by phone');   // the reach line, unchanged
    const named = rows.find((t) => /reed@example.org/.test(t));
    expect(named).toContain('S. Reed');
    expect(named).toContain('in your contacts as Brother Reed');
  });

  it('with no contacts brought in, the row reads exactly as before', async () => {
    store.table = { ok: true, rows: [], reason: '' };
    const rows = await mountAndLoadRoster();
    const door = rows.find((t) => /010-0498/.test(t));
    expect(door).toContain('15550100498@phone.poetech.us');
    expect(door).not.toContain('from your contacts');
    expect(host.querySelectorAll('[data-testid="roster-contact-note"]').length).toBe(0);
  });

  it('Known opens everything on record: the contact name, the phone door, text and call, the device, the refused read, and what is not held', async () => {
    store.table = { ok: true, rows: [{ name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [] }], reason: '' };
    await mountAndLoadRoster();
    const row = Array.from(host.querySelectorAll('li')).find((li) => /010-0498/.test(li.textContent || ''));
    const known = row.querySelector('[data-testid="roster-known-toggle"]');
    expect(known.textContent).toBe('Known');
    await act(async () => { known.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle();
    const rec = row.querySelector('[data-testid="person-record"]');
    expect(rec, 'the record fold opens').toBeTruthy();
    const text = rec.textContent;
    expect(text).toContain('Everything on record for Sister Lamb');
    expect(text).toContain('from your contacts');
    expect(rec.querySelector('[data-testid="person-record-door"]').textContent).toContain('Phone · (555) 010-0498 (the phone they sign in with)');
    expect(rec.querySelector('[data-testid="person-record-reach-text"]').getAttribute('href')).toBe('sms:15550100498');
    expect(rec.querySelector('[data-testid="person-record-reach-call"]').getAttribute('href')).toBe('tel:15550100498');
    expect(rec.querySelector('[data-testid="person-record-reach-email"]')).toBeNull();
    const devices = Array.from(rec.querySelectorAll('[data-testid="person-record-device"]')).map((n) => n.textContent);
    expect(devices.some((t) => /Android device/.test(t))).toBe(true);
    expect(devices.some((t) => /Her tablet/.test(t) && /MAC AA-BB-CC-DD-EE-FF/.test(t) && /Fellowship hall/.test(t))).toBe(true);
    expect(rec.querySelector('[data-testid="person-record-presence-reason"]').textContent).toContain('permission denied');
    const notHeld = Array.from(rec.querySelectorAll('[data-testid="person-record-not-held"]')).map((n) => n.textContent);
    expect(notHeld.some((t) => /Full SSN or EIN/.test(t))).toBe(true);
    expect(notHeld.some((t) => /MAC address/.test(t) && /browser cannot read/.test(t))).toBe(true);
    expect(known.textContent).toBe('Close');
  });
});

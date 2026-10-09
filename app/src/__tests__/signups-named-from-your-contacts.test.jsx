// @vitest-environment jsdom
// =============================================================================
// Platform Signups names a phone-door account from the viewer's own contacts
// (DR-0825), in the real component, in jsdom.
// =============================================================================
// Darrell 2026-10-09: the list showed `1<digits>@phone.poetech.us` and nothing
// else while his phone knew the person. With his contacts brought in (DR-0736)
// the row reads as the name his contacts give it, labelled "from your
// contacts"; an account with its own name keeps it and the contact name stands
// beside it; the phone-door address reads as a phone, not a mailbox; and the
// note under the list says how many were named and where to bring more in.
// Fixtures are made up (the repo is public).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/access-metrics-sync.js', () => ({
  fetchAccessSnapshot: async () => ({
    signedIn: true, instances: [], members: [], presence: [], invites: [], subscriptions: [], domains: [], errors: {},
  }),
  currentBuild: () => ({ sha: 'test', time: null }),
  restRpc: async () => ({ data: null, error: null }),
  readSnapshotToken: () => 'tok',
}));
vi.mock('../lib/usage-events.js', () => ({ fetchUsageFlow: async () => null, topViews: () => [], viewShare: () => 0 }));

const signups = { status: 'ready', data: { summary: { total_accounts: 3 }, signups: [] } };
vi.mock('../lib/signup-metrics.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, fetchSignupMetrics: async () => signups };
});

const store = { device: [], table: { ok: true, rows: [], reason: '' } };
vi.mock('../lib/contacts-store.js', () => ({
  cachedContacts: () => store.device,
  loadMyContacts: async () => store.table,
}));

import AccessUsageMetrics from '../components/AccessUsageMetrics.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(AccessUsageMetrics)); });
  await act(async () => { await Promise.resolve(); });
  return container;
}
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
  vi.clearAllMocks();
});

const now = new Date().toISOString();
const ROWS = [
  { user_id: 'u-door', display_name: null, email: '15550100498@phone.poetech.us', category: 'church', created_at: now },
  { user_id: 'u-named', display_name: 'S. Reed', email: 'reed@example.org', category: 'family', created_at: now },
  { user_id: 'u-stranger', display_name: null, email: '15550109999@phone.poetech.us', category: 'self-serve', created_at: now },
];

describe('Platform Signups, named from your contacts', () => {
  it('a phone-door account with no name reads as the person the viewer\'s contacts know', async () => {
    signups.data.signups = ROWS;
    store.table = { ok: true, rows: [
      { name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [] },
      { name: 'Brother Reed', phones: [], emails: ['reed@example.org'] },
    ], reason: '' };
    store.device = [];
    const el = await mount();
    const who = Array.from(el.querySelectorAll('[data-testid="signup-row-who"]')).map((n) => n.textContent);
    expect(who[0]).toContain('Sister Lamb');
    expect(who[0]).toContain('from your contacts');
    // The phone-door address is shown as the phone it is, not as a mailbox.
    expect(who[0]).toContain('(555) 010-0498 · signs in by phone');
    expect(who[0]).not.toContain('@phone.poetech.us');
    // An account with its own name keeps it; the contact name stands beside it.
    expect(who[1]).toContain('S. Reed');
    expect(who[1]).toContain('in your contacts as Brother Reed');
    // A stranger stays the phone, honestly, with no name invented.
    expect(who[2]).toContain('(555) 010-9999 · signs in by phone');
    expect(who[2]).not.toContain('from your contacts');
    const note = el.querySelector('[data-testid="signup-contacts-note"]').textContent;
    expect(note).toContain('2 of these accounts are named from your contacts (2 on your own server)');
    expect(note).toContain('Messages > Add a contact');
  });

  it('with nothing brought in, every row reads exactly as before and the door is named', async () => {
    signups.data.signups = ROWS;
    store.table = { ok: true, rows: [], reason: '' };
    store.device = [];
    const el = await mount();
    const who = Array.from(el.querySelectorAll('[data-testid="signup-row-who"]')).map((n) => n.textContent);
    expect(who[0]).toBe('(555) 010-0498 · signs in by phone');
    expect(who[1]).toContain('S. Reed');
    expect(el.querySelectorAll('[data-testid="signup-contact-note"]').length).toBe(0);
    const note = el.querySelector('[data-testid="signup-contacts-note"]').textContent;
    expect(note).toContain('None of these are named from your contacts yet');
    expect(note).toContain('Messages > Add a contact');
  });

  it('when the server does not answer, the device names still show and the note says so', async () => {
    signups.data.signups = ROWS;
    store.table = { ok: false, rows: [], reason: 'relation "contacts" does not exist' };
    store.device = [{ id: 'p:5550100498', name: 'Sister Lamb', phone: '5550100498', email: '' }];
    const el = await mount();
    const who = el.querySelector('[data-testid="signup-row-who"]').textContent;
    expect(who).toContain('Sister Lamb');
    const note = el.querySelector('[data-testid="signup-contacts-note"]').textContent;
    expect(note).toContain('1 of these accounts are named from your contacts (1 on this device)');
    expect(note).toContain('Your server did not answer this time');
    expect(note).toContain('does not exist');
  });

  it('masked, a phone-door row shows only the last four digits', async () => {
    signups.data.signups = [ROWS[0]];
    store.table = { ok: true, rows: [], reason: '' };
    store.device = [];
    const el = await mount();
    const btn = Array.from(el.querySelectorAll('button')).find((b) => /mask emails/i.test(b.textContent));
    expect(btn).toBeTruthy();
    await act(async () => { btn.click(); });
    const who = el.querySelector('[data-testid="signup-row-who"]').textContent;
    expect(who).toBe('phone ending 0498 · signs in by phone');
  });
});

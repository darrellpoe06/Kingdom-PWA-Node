// @vitest-environment jsdom
// =============================================================================
// Messages shows the contacts kept on your own server, on every device (DR-0826)
// =============================================================================
// The real Messages surface in jsdom: on open it pulls the keeper's rows into
// this device's list and the Saved contacts list shows them, with a line that
// says where they came from; when the server does not answer, the device list
// still shows and the line says so. Darrell 2026-10-09: "Names and cellphone
// numbers are not being synchronized!" Fixtures are made up.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => {
  const stub = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) },
    rpc: async () => ({ data: [], error: null }),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  };
  return { default: stub, supabase: stub, onAuthChange: (cb) => { cb({ user: { id: 'me' } }); return () => {}; } };
});
vi.mock('../lib/direct-messages-sync.js', () => ({
  publishDmPublicKey: async () => {},
  loadDmContacts: async () => [],
  loadDmInvited: async () => [],
  subscribeDirectMessages: (cb) => { cb([]); const off = () => {}; off.refresh = () => {}; return off; },
  loadMyDmDevices: async () => [],
  forgetDmDevice: async () => ({ forgotten: true }),
  sendDirectMessage: async () => ({ sent: true, encrypted: false, push: Promise.resolve({ ok: true }) }),
  markThreadRead: async () => {},
  markThreadReadLocal: (rows) => rows,
  groupDmThreads: () => [],
  threadMessages: () => [],
  isSendableBody: (b) => !!(b && b.trim()),
  isEncryptedBody: () => false,
  LOCKED_PLACEHOLDER: '',
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'inst-fam' }));
vi.mock('../lib/group-messages.js', () => ({
  GROUP_ROSTERS: [{ key: 'members', label: 'Everyone' }],
  loadGroupMessages: async () => ({ ok: true, rows: [] }),
  sendGroupMessage: async () => ({ ok: true }),
  threadsByRoster: () => ({ members: [] }),
}));
vi.mock('../components/Inbound.jsx', () => ({ default: () => createElement('div', null, 'inbound') }));
vi.mock('../lib/member-roles.js', () => ({
  listMyAdminInstances: async () => [{ instanceId: 'i-fam', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family', role: 'owner' }],
  inviteToSpace: async () => ({ ok: true }),
  isInviteEmail: () => true,
}));
vi.mock('../lib/family-invite.js', () => ({ listPendingClaims: async () => ({ ok: true, claims: [] }), confirmInvite: async () => ({ ok: true }) }));
vi.mock('../lib/voice-dictation.js', () => ({ useVoiceDictation: () => ({ supported: false, listening: false, toggle: () => {}, start: () => {}, stop: () => {} }) }));
vi.mock('../lib/push-key.js', () => ({ useVapidPublicKey: () => '' }));
vi.mock('../lib/push-subscribe.js', () => ({ pushSupported: () => false, pushStatus: async () => ({ supported: false, subscribed: false, permission: 'default' }), subscribeToPush: async () => ({ ok: false }), unsubscribeFromPush: async () => ({ ok: false }) }));
vi.mock('../lib/dm-notify.js', () => ({ requestDmNotificationPermission: async () => 'default' }));
vi.mock('../lib/profiles-sync.js', async (orig) => ({
  ...(await orig()),
  loadProfile: async () => null,
  loadMyProfile: async () => null,
  saveMyProfile: async () => ({ saved: true }),
}));

// The real saved-contacts store over jsdom's localStorage (the list reads it
// through its own default), and the keeper's answer swapped per case.
// pullMyContacts is the REAL function: it writes the rows through the same
// store the list reads.
const KEY = 'poetech.savedContacts.v1';
const keeper = { answer: { ok: true, rows: [], reason: '' } };
vi.mock('../lib/contacts-store.js', async (orig) => {
  const real = await orig();
  const client = { from: () => ({ select: () => ({ order: async () => (keeper.answer.ok ? { data: keeper.answer.rows, error: null } : { data: null, error: { message: keeper.answer.reason } }) }) }) };
  return { ...real, pullMyContacts: (opts = {}) => real.pullMyContacts({ ...opts, client }) };
});

import Messages from '../components/Messages.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Messages)); });
  await act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });
  return container;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  window.localStorage.removeItem(KEY);
  vi.restoreAllMocks();
});

describe('Messages: the contacts kept on your own server show on this device', () => {
  it('pulls the keeper\'s rows into the list and says where they came from', async () => {
    keeper.answer = { ok: true, reason: '', rows: [
      { contact_key: 'p:5550100498', name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [], created_at: '2026-10-01T00:00:00Z' },
      { contact_key: 'e:reed@example.org', name: 'Brother Reed', phones: [], emails: ['reed@example.org'], created_at: '2026-10-02T00:00:00Z' },
    ] };
    const el = await mount();
    const text = el.textContent || '';
    expect(text).toContain('Saved contacts');
    expect(text).toContain('Sister Lamb');
    expect(text).toContain('(555) 010-0498');
    expect(text).toContain('Brother Reed');
    expect(el.querySelector('[data-testid="contacts-keeper-note"]').textContent).toContain('2 from your own server');
  });

  it('when the server does not answer, this device\'s list still shows and the line says so', async () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ id: 'p:5550100222', name: 'Only Here', phone: '555-010-0222', email: '', status: 'saved', addedAt: '2026-09-01' }]));
    keeper.answer = { ok: false, rows: [], reason: 'relation "contacts" does not exist' };
    const el = await mount();
    const text = el.textContent || '';
    expect(text).toContain('Only Here');
    const note = el.querySelector('[data-testid="contacts-keeper-note"]').textContent;
    expect(note).toContain("Showing this device's list");
    expect(note).toContain('does not exist');
  });
});

// =============================================================================
// The space picker names the door, so the Love Corner is findable (DR-0447)
// =============================================================================
// Darrell 2026-09-16, with Messages -> Add contact open: "Messages don't give
// an option for the Love Corner." Measured against the live database the same
// day, the option was there — he OWNS that space — under the name the row
// carries, "The Church of the Living God." He opens that house through a door
// called The Love Corner, so the option he looked for did not read as itself.
// This renders the real picker with the real measured set and asserts the door
// is named (DR-0076 section 6: observed on the surface, not reasoned about).
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const PEER = '11111111-2222-3333-4444-555555555555';

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
  loadDmContacts: async () => [{ userId: PEER, displayName: 'Sister Ann', role: 'member', instanceId: 'inst-church' }],
  loadDmInvited: async () => [],
  subscribeDirectMessages: (cb) => { cb([]); const off = () => {}; off.refresh = () => {}; return off; },
  sendDirectMessage: async () => ({ sent: true, encrypted: false, push: Promise.resolve({ ok: true }) }),
  markThreadRead: async () => {},
  markThreadReadLocal: (rows) => rows,
  groupDmThreads: () => [{ otherUserId: PEER, otherName: 'Sister Ann', unread: 0, lastAtIso: null, lastBody: '' }],
  threadMessages: () => [{ id: 'm1', otherUserId: PEER, mine: false, body: 'are you getting this', atIso: '2026-09-16T13:43:00Z' }],
  isSendableBody: (b) => !!(b && b.trim()),
  isEncryptedBody: () => false,
  LOCKED_PLACEHOLDER: '',
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'inst-church' }));
vi.mock('../lib/group-messages.js', () => ({
  GROUP_ROSTERS: [{ key: 'members', label: 'Everyone' }],
  loadGroupMessages: async () => ({ ok: true, rows: [] }),
  sendGroupMessage: async () => ({ ok: true }),
  threadsByRoster: () => ({ members: [] }),
}));
vi.mock('../components/Inbound.jsx', () => ({ default: () => createElement('div', null, 'inbound') }));
vi.mock("../lib/member-roles.js", () => ({
  // The real set, measured against the live database 2026-09-16 for
  // darrellpoe06@gmail.com: owner of the church, the family and the properties
  // space, admin of two businesses. The church row carries its registry name.
  listMyAdminInstances: async () => [
    { instanceId: "i-colg", slug: "colg", displayName: "The Church of the Living God", instanceType: "church", role: "owner" },
    { instanceId: "i-moore", slug: "moore-divahs", displayName: "Moore Divahs", instanceType: "business", role: "admin" },
    { instanceId: "i-fam", slug: "poe-family", displayName: "Poe Family", instanceType: "family", role: "owner" },
    { instanceId: "i-prop", slug: "poe-properties", displayName: "Poe Properties", instanceType: "landlord", role: "owner" },
    { instanceId: "i-tlc", slug: "tlc-therapy-solutions", displayName: "TLC Therapy Solutions", instanceType: "therapy-practice", role: "admin" },
  ],
  inviteToSpace: async () => ({ ok: true }),
  isInviteEmail: () => true,
}));
vi.mock('../lib/family-invite.js', () => ({ listPendingClaims: async () => [], confirmInvite: async () => ({ ok: true }) }));
vi.mock('../lib/saved-contacts.js', () => ({ readContacts: () => [], upsertContact: () => {}, removeContact: () => {} }));
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

import Messages from '../components/Messages.jsx';
import { resetDeepLinkForTests } from '../lib/app-doors.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;

async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Messages, props)); });
  return container;
}

beforeEach(() => resetDeepLinkForTests());
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  vi.restoreAllMocks();
});

describe('the picker says which door a space is', () => {
  it('names The Love Corner beside the church record', async () => {
    const el = await mount();
    const picker = el.querySelector('select');
    expect(picker, 'no space picker rendered').toBeTruthy();
    const options = [...picker.options].map((o) => o.textContent.trim());
    expect(options.some((o) => o.includes('The Love Corner')), `no Love Corner option in ${JSON.stringify(options)}`).toBe(true);
    // The record's own name is kept — the door is added, never substituted.
    expect(options).toContain('The Love Corner \u00b7 The Church of the Living God');
  });

  it('offers every space the person may add into', async () => {
    const el = await mount();
    const options = [...el.querySelector('select').options].map((o) => o.textContent.trim());
    expect(options).toHaveLength(5);
    expect(options).toContain('Moore Divahs');
    expect(options).toContain('Poe Properties');
    expect(options).toContain('TLC Therapy Solutions');
  });

  it('says a space that is its own door once', async () => {
    const el = await mount();
    const options = [...el.querySelector('select').options].map((o) => o.textContent.trim());
    expect(options.filter((o) => o.startsWith('TLC Therapy Solutions'))).toEqual(['TLC Therapy Solutions']);
  });
});

// =============================================================================
// A notification tap opens the MESSAGE, on the real Messages surface
// =============================================================================
// Darrell, 2026-09-16, with the screenshot: "The messages notifications don't
// work fully... the open the app to the welcome instead of the text message."
//
// The landing URL was the first half of that (app-doors.test.js pins it). This
// is the second half, observed on the REAL surface (DR-0076 §6): arriving with
// a `dm=` deep link must open that person's thread, not the contact list. The
// two failure modes this catches are (1) the thread never opens, and (2) the
// deep link is re-applied later and yanks the reader out of a thread they
// chose themselves.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
vi.mock('../lib/member-roles.js', () => ({ listMyAdminInstances: async () => [], inviteToSpace: async () => ({ ok: true }), isInviteEmail: () => true }));
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
import { captureDeepLink, resetDeepLinkForTests } from '../lib/app-doors.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
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

describe('a notification tap lands on the message itself', () => {
  it('opens the named thread, with the message in it', async () => {
    // Exactly what the shell does at boot, from the notification's URL.
    captureDeepLink(`?view=messages&dm=${PEER}`);
    const el = await mount();
    const text = el.textContent || '';
    expect(text, 'the thread did not open').toContain('are you getting this');
    expect(text).toContain('Message Sister Ann');
  });

  it('shows the contact list when there is no deep link (unchanged default)', async () => {
    const el = await mount();
    const text = el.textContent || '';
    expect(text).not.toContain('are you getting this');
    expect(text).toContain('Sister Ann');
  });

  it('is consumed once, so a later visit does not reopen it by itself', async () => {
    captureDeepLink(`?view=messages&dm=${PEER}`);
    const first = await mount();
    expect(first.textContent).toContain('are you getting this');
    await act(async () => root.unmount());
    container.remove();
    root = null;
    const second = await mount();
    expect(second.textContent, 'the deep link fired a second time').not.toContain('are you getting this');
  });

  it('the entry snapshots the link at boot, before anything renders', () => {
    // main.jsx, not the shell: the read must happen before the first render,
    // and the shell is frozen (DR-0078). The entry is also the honest home for
    // a boot-time read.
    const main = readFileSync(join(HERE, '..', 'main.jsx'), 'utf8');
    expect(main).toContain("import { captureDeepLink } from './lib/app-doors.js'");
    expect(main).toMatch(/^captureDeepLink\(\);$/m);
    const main_i = main.indexOf('captureDeepLink();');
    expect(main_i, 'the snapshot must precede the first render').toBeLessThan(main.indexOf('createRoot'));
  });
});

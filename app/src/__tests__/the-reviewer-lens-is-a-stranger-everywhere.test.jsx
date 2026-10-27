// =============================================================================
// The reviewer lens is a stranger in Vault, Research and Messages too (DR-1240)
// =============================================================================
// The same leak Properties had, three more times: the shell mounts each of
// these with the real session and each reads the signed-in person's OWN rows
// through RLS as him. Under the lens each boots as a person with nothing yet,
// says so, and never asks the database for his rows. Vault's create is OFF
// under the lens because it is an upsert on his real header.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ calls: [] }));
const seen = (name) => H.calls.filter((c) => c === name).length;

// --- Vault: his header + rows + this device's cache ------------------------
vi.mock('../lib/vault-store.js', () => ({
  TIMEOUT_MS: 1000,
  currentUserId: async () => 'u-darrell',
  readCache: () => { H.calls.push('vault.readCache'); return { header: { kdf: 'PBKDF2', iterations: 1, salt: 'x', verifier_iv: 'y', verifier_ct: 'z', version: 1, createdAt: '2026-10-06T00:00:00Z' }, items: [{ id: 'c1', iv: 'a', ct: 'b', version: 1 }] }; },
  writeCache: () => true,
  clearCache: () => {},
  loadHeader: async () => { H.calls.push('vault.loadHeader'); return { ok: true, header: { kdf: 'PBKDF2', iterations: 1, salt: 'x', verifier_iv: 'y', verifier_ct: 'z', version: 1, createdAt: '2026-10-06T00:00:00Z' } }; },
  saveHeader: async () => { H.calls.push('vault.saveHeader'); return { ok: true }; },
  listItems: async () => { H.calls.push('vault.listItems'); return { ok: true, rows: [{ id: 'r1', iv: 'a', ct: 'b', version: 1 }, { id: 'r2', iv: 'a', ct: 'b', version: 1 }] }; },
  upsertItem: async () => ({ ok: true }),
  deleteItem: async () => ({ ok: true }),
  mergeRows: (a, b) => { const by = new Map(); for (const r of [...(a || []), ...(b || [])]) by.set(r.id, r); return [...by.values()]; },
}));

// --- Research: his agent_inbox rows -------------------------------------------
const SESSION = { user: { id: 'u-darrell', email: 'darrell@example.com' } };
vi.mock('../lib/supabase.js', () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: SESSION } }), getUser: async () => ({ data: { user: SESSION.user } }) },
    from: (table) => { H.calls.push(`from.${table}`); return { select: () => ({ or: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'q1', body: 'Why does the Amarna letter say Habiru?', tags: ['research'], state: 'answered', created_at: '2026-10-20T00:00:00Z' }], error: null }) }) }) }), eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }; },
    rpc: async () => ({ data: [], error: null }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  };
  return { supabase: client, default: client, phoneLoginEmail: () => '', onAuthChange: (cb) => { cb(SESSION); return () => {}; } };
});
vi.mock('../lib/agent-inbox-sync.js', () => ({ relayThought: async () => ({ ok: true, reason: '', id: 'new-row' }), withBuildTag: (t) => t }));
vi.mock('../components/ResearchTry.jsx', () => ({ default: () => createElement('div', null, 'ask box') }));
vi.mock('../lib/research-health.js', async (orig) => ({ ...(await orig()), researchHealth: async () => ({ state: 'ok' }) }));

// --- Messages: his contacts, invites, spaces, claims, keeper, group threads ----
vi.mock('../lib/direct-messages-sync.js', () => ({
  publishDmPublicKey: async () => { H.calls.push('dm.publish'); },
  loadDmContacts: async () => { H.calls.push('dm.contacts'); return [{ userId: 'u-christina', name: 'Christina' }]; },
  loadDmInvited: async () => { H.calls.push('dm.invited'); return []; },
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
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => { H.calls.push('instance'); return 'inst-fam'; } }));
vi.mock('../lib/group-messages.js', () => ({
  GROUP_ROSTERS: [{ key: 'members', label: 'Everyone' }],
  loadGroupMessages: async () => { H.calls.push('groups.load'); return { ok: true, rows: [] }; },
  sendGroupMessage: async () => ({ ok: true }),
  threadsByRoster: () => ({ members: [] }),
}));
vi.mock('../components/Inbound.jsx', () => ({ default: () => createElement('div', null, 'inbound') }));
vi.mock('../lib/member-roles.js', () => ({
  listMyAdminInstances: async () => { H.calls.push('spaces'); return [{ instanceId: 'i-fam', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family', role: 'owner' }]; },
  inviteToSpace: async () => ({ ok: true }),
  isInviteEmail: () => true,
}));
vi.mock('../lib/family-invite.js', () => ({ listPendingClaims: async () => { H.calls.push('claims'); return { ok: true, claims: [] }; }, confirmInvite: async () => ({ ok: true }) }));
vi.mock('../lib/contacts-store.js', () => ({ pullMyContacts: async () => { H.calls.push('keeper'); return { ok: true, pulled: 0, reason: '' }; }, keepContactOnServer: async () => ({ ok: true }), forgetContactEverywhere: async () => ({ ok: true }) }));
vi.mock('../lib/voice-dictation.js', () => ({ useVoiceDictation: () => ({ supported: false, listening: false, toggle: () => {}, start: () => {}, stop: () => {} }) }));
vi.mock('../lib/push-key.js', () => ({ useVapidPublicKey: () => '' }));
vi.mock('../lib/push-subscribe.js', () => ({ pushSupported: () => false, pushStatus: async () => ({ supported: false, subscribed: false, permission: 'default' }), subscribeToPush: async () => ({ ok: false }), unsubscribeFromPush: async () => ({ ok: false }) }));
vi.mock('../lib/dm-notify.js', () => ({ requestDmNotificationPermission: async () => 'default' }));
vi.mock('../lib/profiles-sync.js', async (orig) => ({ ...(await orig()), loadProfile: async () => null, loadMyProfile: async () => null, saveMyProfile: async () => ({ saved: true }) }));

import Vault from '../components/Vault.jsx';
import ResearchSection from '../components/ResearchSection.jsx';
import Messages from '../components/Messages.jsx';

let container; let root;
beforeEach(() => { H.calls.length = 0; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const flush = async (n = 4) => { for (let i = 0; i < n; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const mount = async (C, props) => { await act(async () => { root.render(createElement(C, props)); }); await flush(); };

describe('Vault', () => {
  it('PROVEN-TO-CATCH: stranger OFF (lens off or SELF mode) reads his header, his rows and the cache — the Locked face with a record count', async () => {
    await mount(Vault, { stranger: false });
    expect(seen('vault.readCache')).toBe(1);
    expect(seen('vault.loadHeader')).toBe(1);
    expect(seen('vault.listItems')).toBe(1);
    expect(container.textContent).toMatch(/Locked · \d+ record/);
    expect(container.querySelector('[data-testid="vault-reviewer-lens"]')).toBeNull();
  });
  it('STRANGER mode: nothing of his is read, the no-vault face shows with the honest line, and create is off', async () => {
    await mount(Vault, { stranger: true });
    for (const c of ['vault.readCache', 'vault.loadHeader', 'vault.listItems']) expect(seen(c), `${c} ran under the lens`).toBe(0);
    expect(container.textContent).toContain('No vault yet');
    expect(container.textContent).not.toMatch(/Locked · \d+ record/);
    const line = container.querySelector('[data-testid="vault-reviewer-lens"]');
    expect(line).toBeTruthy();
    expect(line.textContent).toMatch(/Reviewer lens: your own vault and its records are hidden here; a person with no invite sees this/);
    const create = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Create my vault');
    expect(create).toBeTruthy();
    expect(create.disabled).toBe(true);
    expect(seen('vault.saveHeader')).toBe(0);
  });
});

describe('Research', () => {
  it('PROVEN-TO-CATCH: stranger OFF (lens off or SELF mode) reads his agent_inbox rows and lists them', async () => {
    await mount(ResearchSection, { stranger: false });
    expect(seen('from.agent_inbox')).toBe(1);
    expect(container.textContent).toContain('Amarna');
    expect(container.querySelector('[data-testid="research-reviewer-lens"]')).toBeNull();
  });
  it('STRANGER mode: his rows are never asked for; the nothing-sent face and the honest line', async () => {
    await mount(ResearchSection, { stranger: true });
    expect(seen('from.agent_inbox')).toBe(0);
    expect(container.textContent).not.toContain('Amarna');
    expect(container.textContent).toContain('You have not sent anything to look into yet.');
    expect(container.querySelector('[data-testid="research-reviewer-lens"]').textContent).toMatch(/Reviewer lens: your own research items are hidden here/);
  });
});

describe('Messages', () => {
  it('PROVEN-TO-CATCH: stranger OFF (lens off or SELF mode) publishes his key and reads his contacts, spaces, claims and keeper', async () => {
    await mount(Messages, { stranger: false });
    for (const c of ['dm.publish', 'dm.contacts', 'dm.invited', 'spaces', 'claims', 'keeper']) expect(seen(c), `${c} did not run`).toBeGreaterThan(0);
    // His roster has someone on it, so the stranger's "no one yet" line is absent.
    expect(container.textContent).not.toContain('No one to message yet');
    expect(container.querySelector('[data-testid="messages-reviewer-lens"]')).toBeNull();
  });
  it('STRANGER mode: nothing of his is published or read on Direct, the no-one-yet face and the honest line', async () => {
    await mount(Messages, { stranger: true });
    for (const c of ['dm.publish', 'dm.contacts', 'dm.invited', 'spaces', 'claims', 'keeper']) expect(seen(c), `${c} ran under the lens`).toBe(0);
    expect(container.textContent).toContain('No one to message yet');
    expect(container.querySelector('[data-testid="messages-reviewer-lens"]').textContent).toMatch(/Reviewer lens: your own contacts, spaces and threads are hidden here/);
  });
  it('STRANGER mode: Groups never asks for his space, so his family threads are never read', async () => {
    await mount(Messages, { stranger: true });
    const groups = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Groups');
    await act(async () => { groups.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await flush();
    expect(seen('instance')).toBe(0);
    expect(seen('groups.load')).toBe(0);
  });
  it('PROVEN-TO-CATCH: stranger OFF (lens off or SELF mode), Groups reads his space and its threads', async () => {
    await mount(Messages, { stranger: false });
    const groups = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Groups');
    await act(async () => { groups.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await flush();
    expect(seen('instance')).toBe(1);
    expect(seen('groups.load')).toBeGreaterThan(0);
  });
});

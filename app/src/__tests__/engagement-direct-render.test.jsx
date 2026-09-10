// =============================================================================
// Engagement — "Message a member" (1:1) on the church door. DR-0076: observe
// the REAL surface. Darrell, 2026-09-09, from Church → Engagement on his phone:
// "why can't I send a message to a user?!" — the tab carried only the family
// thread (a broadcast); the app's 1:1 (DR-0181) lived in the bus ministry, the
// choir and the app-wide Messages view, never here. This mounts the real
// Engagement with a signed-in session and the server's contact list stubbed at
// the sync seam, and proves: the tab exists; the panel names the member the
// server says I may message; tapping the name opens a private thread with its
// composer. A source pin keeps the roster the server's word (list_dm_contacts),
// never a list the surface invents.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../lib/supabase.js', () => ({
  onAuthChange: (cb) => { cb({ user: { id: 'me' } }); return () => {}; },
  supabase: { rpc: async () => ({ data: [], error: null }), from: () => ({ select: () => ({ data: [], error: null }) }) },
}));
vi.mock('../lib/engagement-sync.js', () => ({
  uploadTriviaAnswer: async () => ({ skipped: 'test' }),
  sendMessage: async () => ({ skipped: 'test' }),
  subscribeMessages: () => () => {},
  getActiveQuestion: async () => null,
  getRecentQuestions: async () => [],
  chooseTriviaSource: () => ({ source: 'anchor' }),
}));
vi.mock('../lib/direct-messages-sync.js', () => ({
  publishDmPublicKey: async () => {},
  loadDmContacts: async () => [{ userId: 'u-ann', displayName: 'Sister Ann', role: 'member', instanceId: 'inst-church' }],
  loadDmInvited: async () => [],
  subscribeDirectMessages: (cb) => { cb([]); const off = () => {}; off.refresh = () => {}; return off; },
  sendDirectMessage: async () => ({ sent: true, encrypted: false, push: Promise.resolve({ ok: true, attempted: 0, succeeded: 0 }) }),
  markThreadRead: async () => {},
  markThreadReadLocal: (rows) => rows,
  groupDmThreads: () => [],
  threadMessages: () => [],
  isSendableBody: (b) => !!(b && b.trim()),
  isEncryptedBody: () => false,
  LOCKED_PLACEHOLDER: '',
}));
vi.mock('../lib/push-key.js', () => ({ useVapidPublicKey: () => '' }));
vi.mock('../lib/push-subscribe.js', () => ({ pushSupported: () => false, pushStatus: async () => ({ supported: false, subscribed: false, permission: 'default' }), subscribeToPush: async () => ({ ok: false }), unsubscribeFromPush: async () => ({ ok: false }) }));
vi.mock('../lib/dm-notify.js', () => ({ requestDmNotificationPermission: async () => 'default' }));
vi.mock('../lib/profiles-sync.js', async (orig) => ({ ...(await orig()), loadProfile: async () => ({ userId: 'u-ann', displayName: 'Sister Ann', photoThumb: 'data:image/jpeg;base64,/9j/4AAQ', house: 'the Ann house', ministries: ['Choir'], favoriteVerse: '', testimony: 'He kept me.', visibility: 'members', fullView: true }), loadMyProfile: async () => null, saveMyProfile: async () => ({ saved: true }) }));
vi.mock('../lib/voice-dictation.js', () => ({ useVoiceDictation: () => ({ supported: false, listening: false, start: () => {}, stop: () => {} }) }));

import Engagement from '../components/Engagement.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Engagement)); });
}
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; });
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
const clickTab = async (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  await act(async () => { tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
};
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });

describe('Engagement — Message a member (1:1) on the church door', () => {
  it('has the tab, names the member the server says I may message, and opens a private thread on tap', async () => {
    await mount();
    const tabs = [...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent || '');
    expect(tabs.join(' | ')).toMatch(/Family thread/);
    expect(tabs.join(' | ')).toMatch(/Message a member/);

    await clickTab('Message a member');
    await settle();
    expect(container.textContent).toMatch(/Message a member 1:1/);
    expect(container.textContent).toMatch(/between thee and him alone/);
    // The server's roster, not ours.
    const ann = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Sister Ann');
    expect(ann, 'the contact the server returned is startable').toBeTruthy();
    await click(ann);
    await settle();
    // A private thread opened, with its composer, addressed to her.
    expect(container.textContent).toMatch(/No messages yet — say hello/);
    expect(container.querySelector('textarea')).toBeTruthy();
    expect(container.textContent).toMatch(/Sister Ann/);
    // Her name in the thread header opens her full profile, in place (DR-0342).
    const nameBtn = container.querySelector('button[aria-label$="profile"]');
    expect(nameBtn).toBeTruthy();
    await click(nameBtn);
    await settle();
    expect(container.querySelector('section[aria-label="Profile — Sister Ann"]')).toBeTruthy();
    expect(container.textContent).toMatch(/the Ann house/);
    expect(container.textContent).toMatch(/He kept me/);
  });

  it('My profile opens on the same tab, with the editor', async () => {
    await mount();
    await clickTab('Message a member');
    await settle();
    const btn = [...container.querySelectorAll('button')].find((b) => /My profile/.test(b.textContent || ''));
    expect(btn).toBeTruthy();
    await click(btn);
    await settle();
    expect(container.querySelector('form[aria-label="My profile"]')).toBeTruthy();
  });

  it('the family thread tells the reader where the private door is', async () => {
    await mount();
    await clickTab('Family thread');
    expect(container.textContent).toMatch(/To reach one person privately, use the Message a member tab/);
  });

  it('source pin: the roster is the server’s word (list_dm_contacts via loadDmContacts), never invented', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'Engagement.jsx'), 'utf8');
    expect(src).toMatch(/loadDmContacts\(\)/);
    expect(src).toMatch(/loadDmInvited\(\)/);
    expect(src).toMatch(/<DirectMessages roster=\{contacts\} invited=\{invited\}/);
    expect(src).not.toMatch(/roster=\{\[\s*\{/); // no hand-typed roster
  });
});

// Darrell 2026-09-09, his saved profile beside a thread list of bare usernames:
// "Make sure the picture is visible on the apps... users like to see their
// picture" — and "move messages to the first tab spot... then family then trivia."
describe('Engagement — faces and order', () => {
  it('the tabs run Message a member, Family thread, Trivia, and the page opens on the first', async () => {
    await mount();
    const order = [...container.querySelectorAll('[role="tab"]')].map((b) => (b.textContent || '').trim());
    expect(order).toEqual(['Message a member', 'Family thread', 'Trivia']);
    expect(container.textContent).toMatch(/Message a member 1:1/);
  });

  it('a person I may message carries their picture and their chosen name on the start chip', async () => {
    await mount();
    await settle(); await settle();
    const chip = [...container.querySelectorAll('button')].find((b) => /Sister Ann/.test(b.textContent || ''));
    expect(chip, 'the start chip names the person by their chosen profile name').toBeTruthy();
    const img = chip.querySelector('img');
    expect(img, 'the chip carries the picture the person saved').toBeTruthy();
    expect(img.getAttribute('src')).toMatch(/^data:image\/jpeg/);
  });
});

describe('Engagement — the sender is told what the push did', () => {
  it('after a send, the thread shows the measured report (here: no phone set up for them yet)', async () => {
    await mount();
    await settle(); await settle();
    const chip = [...container.querySelectorAll('button')].find((b) => /Sister Ann/.test(b.textContent || ''));
    await click(chip);
    const ta = container.querySelector('textarea');
    expect(ta).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, 'Hello');
      ta.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const send = [...container.querySelectorAll('button')].find((b) => /^Send$/.test((b.textContent || '').trim()));
    await click(send);
    await settle(); await settle();
    const note = container.querySelector('[data-push-report]');
    expect(note, 'the report line renders').toBeTruthy();
    expect(note.textContent).toBe('Sent · no phone is set to be notified for them yet.');
  });
});

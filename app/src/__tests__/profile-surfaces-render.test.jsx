// =============================================================================
// Profile surfaces (DR-0342): the card from a name in the thread; the editor
// on Engagement. DR-0076: the REAL components, the sync seam stubbed.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const saved = [];
vi.mock('../lib/profiles-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    loadProfile: async (id) => (id === 'u-ann'
      ? { userId: 'u-ann', displayName: 'Sister Ann', photoThumb: null, house: 'the Ann house', ministries: ['Choir'], favoriteVerse: 'Psalms 23:1', testimony: 'He kept me through it.', visibility: 'members', fullView: true }
      : id === 'u-quiet' ? { userId: 'u-quiet', displayName: 'Brother Quiet', photoThumb: null, house: '', ministries: [], favoriteVerse: '', testimony: '', visibility: 'private', fullView: false } : null),
    loadMyProfile: async () => ({ userId: 'me', displayName: 'Darrell Poe', photoThumb: null, house: 'Poe', ministries: ['Tech'], favoriteVerse: '', testimony: '', visibility: 'members', fullView: true }),
    saveMyProfile: async (f) => { saved.push(f); return { saved: true, profile: { displayName: f.displayName } }; },
  };
});
vi.mock('../lib/bible-kjv.js', async (orig) => ({ ...(await orig()), verseText: async () => 'The LORD is my shepherd; I shall not want.' }));

import ProfileCard from '../components/ProfileCard.jsx';
import MyProfile from '../components/MyProfile.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount(el) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(el); }); }
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; saved.length = 0; });
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });

describe('ProfileCard', () => {
  it('shows the full card when the owner allows it, with the verse openable in place', async () => {
    await mount(createElement(ProfileCard, { userId: 'u-ann', fallbackName: 'Ann' }));
    await settle();
    expect(container.textContent).toMatch(/Sister Ann/);
    expect(container.textContent).toMatch(/the Ann house/);
    expect(container.textContent).toMatch(/Choir/);
    expect(container.textContent).toMatch(/He kept me through it/);
    expect(container.querySelector('button[aria-label^="Open Psalms 23:1"]')).toBeTruthy();
  });
  it('shows the honest partial card when the owner keeps it private — never a blank', async () => {
    await mount(createElement(ProfileCard, { userId: 'u-quiet' }));
    await settle();
    expect(container.textContent).toMatch(/Brother Quiet/);
    expect(container.textContent).toMatch(/keeps the rest of their profile private/);
    expect(container.textContent).not.toMatch(/Testimony/);
  });
  it('a person with no profile yet still shows their name', async () => {
    await mount(createElement(ProfileCard, { userId: 'u-none', fallbackName: 'New Member' }));
    await settle();
    expect(container.textContent).toMatch(/New Member/);
    expect(container.textContent).toMatch(/No profile yet/);
  });
});

describe('MyProfile', () => {
  it('loads mine, edits, and saves through the one write with validated fields', async () => {
    await mount(createElement(MyProfile));
    await settle();
    const name = container.querySelector('input[maxlength="80"][required]');
    expect(name.value).toBe('Darrell Poe');
    const testimony = container.querySelector('textarea');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(testimony, 'He is faithful.');
      testimony.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const leaders = [...container.querySelectorAll('button')].find((b) => /Church leaders only/.test(b.textContent));
    await act(async () => { leaders.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    const form = container.querySelector('form');
    await act(async () => { form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
    await settle();
    expect(saved.length).toBe(1);
    expect(saved[0]).toMatchObject({ displayName: 'Darrell Poe', testimony: 'He is faithful.', visibility: 'leaders' });
    expect(container.textContent).toMatch(/Saved/);
  });
});

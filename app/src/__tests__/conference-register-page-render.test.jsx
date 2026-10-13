// =============================================================================
// ConferenceRegister page — outward-face render proof (Verification Doctrine:
// observe the real surface). Mounts the ACTUAL ?register=1 page in jsdom and proves
// it presents as marketing + support + services: value-forward hero, the open form
// RIGHT THERE (no gate), a value strip, and the deeper PoeTech identity ONE CLICK
// IN (progressive disclosure) — never a barrier. Network-free (supabase mocked).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => {
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    rpc: () => Promise.resolve({ data: null, error: null }),
    from: () => ({ insert: () => Promise.resolve({ error: null }), select() { return this; }, order: () => Promise.resolve({ data: [], error: null }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  return {
    default: supabase, supabase,
    signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
    signUpWithPassword: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    validateCredentials: (email) => (email && email.includes('@') ? { email } : { error: { message: 'bad' } }),
  };
});

import ConferenceRegister from '../components/ConferenceRegister.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ConferenceRegister));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ConferenceRegister presents as PoeTech’s branded outward face', () => {
  it('leads with VALUE (the invitation), not the word "Register" as the eyebrow', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toMatch(/You’re invited|You're invited/i);
    expect(text).toMatch(/77th National Assembly/);          // the experience they feel
    expect(text).toMatch(/Positioned for Purpose/);          // the announced theme carries
    expect(text).toMatch(/no account needed/i);              // the easy path is promised
  });

  it('puts the open registration form RIGHT THERE (instant, no gate)', async () => {
    await mount();
    expect(container.querySelector('#cr-name')).toBeTruthy(); // the name field is on the page
    // ...and a submit, not a "sign in first" wall.
    const submit = [...container.querySelectorAll('button')].find((b) => /Register/i.test(b.textContent));
    expect(submit).toBeTruthy();
  });

  it('makes the first service tangible (a value strip)', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toMatch(/seat is saved/i);
    expect(text).toMatch(/Meals around you/i);
    expect(text).toMatch(/Stay in the loop/i);
  });

  it('keeps the deeper PoeTech identity ONE CLICK IN (progressive disclosure)', async () => {
    await mount();
    const toggle = [...container.querySelectorAll('button')].find((b) => /About PoeTech/i.test(b.textContent));
    expect(toggle).toBeTruthy();
    // collapsed by default — it is not the front door
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const region = container.querySelector('#about-poetech');
    expect(region.hasAttribute('hidden')).toBe(true);
    // one click reveals the serve-not-extract identity
    await act(async () => { toggle.click(); });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('#about-poetech').hasAttribute('hidden')).toBe(false);
    expect(container.textContent).toMatch(/serve the community, not to extract/i);
  });

  it('carries the brand: from PoeTech to the community', async () => {
    await mount();
    expect(container.textContent).toMatch(/from PoeTech to our community/i);
  });
});

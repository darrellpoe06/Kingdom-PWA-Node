// =============================================================================
// ConferenceAccountOnRamp — live render proof (Verification Doctrine: observe the
// real surface, not just the pure logic). Mounts the ACTUAL on-ramp in jsdom, lets
// its session-check effect run, and reads the DOM it produces. Network-free: the
// supabase client is mocked, so no real auth/cloud call happens.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({ state: { uid: null } }));

vi.mock('../lib/supabase.js', () => {
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: h.state.uid ? { user: { id: h.state.uid } } : null } }) },
    rpc: () => Promise.resolve({ data: true, error: null }),
  };
  return {
    default: supabase,
    supabase,
    signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
    signUpWithPassword: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    validateCredentials: (email) => (email && email.includes('@') ? { email } : { error: { message: 'bad' } }),
  };
});

import ConferenceAccountOnRamp from '../components/ConferenceAccountOnRamp.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ConferenceAccountOnRamp, props));
  });
}

beforeEach(() => { h.state.uid = null; try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ConferenceAccountOnRamp renders the OPTIONAL account on-ramp', () => {
  it('signed-out: shows Google (primary), email fallback, and a real skip — never a lockout', async () => {
    await mount({ regId: 'reg-1', name: 'Naomi', email: 'naomi@example.com' });
    const text = container.textContent;
    expect(text).toMatch(/Optional/i);
    expect(text).toMatch(/Continue with Google/i);
    expect(text).toMatch(/email & password/i);
    expect(text).toMatch(/No thanks/i);
  });

  it('the skip truly dismisses (registrant stays registered, nothing forced)', async () => {
    await mount({ regId: 'reg-1' });
    const skip = [...container.querySelectorAll('button')].find((b) => /No thanks/i.test(b.textContent));
    expect(skip).toBeTruthy();
    await act(async () => { skip.click(); });
    expect(container.textContent.trim()).toBe(''); // dismissed -> renders nothing
  });

  it('already signed in (in-app front door): auto-links and confirms in place', async () => {
    h.state.uid = 'user-naomi';
    await mount({ regId: 'reg-1', name: 'Naomi' });
    expect(container.textContent).toMatch(/Added to your PoeTech account/i);
  });
});

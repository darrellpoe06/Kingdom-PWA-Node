// =============================================================================
// THE PROPERTIES TAB RESOLVES — it can never sit on "Opening your properties…"
// =============================================================================
// Darrell, 2026-09-01, screenshot of poetech.us/poetech-app/?view=properties on
// build 3e929cf: the tab sat on "Opening your properties…" forever, across a
// reload, with ~9 tabs open. Nothing rendered to tap, so nothing in the app
// could recover it — the only way out was closing the tab.
//
// ROOT CAUSE: PropertiesApp's boot() awaited the properties reads with no
// ceiling. cloud.js promised "never throws" and kept that promise, but a call
// that never SETTLES strands the caller just as badly and cannot be caught:
// supabase-js routes every PostgREST call through auth.getSession(), which takes
// the cross-tab Navigator lock, so ONE frozen poetech.us tab holding that lock
// suspended boot() with setLoading(false) unreachable. The identical multi-tab
// auth-lock hang was already bounded in lib/access-metrics-sync.js (Admin, 8
// tabs open, 2026-07-22) and lib/pin.js. Properties never got the bound.
//
// These tests are the proof, and they FAIL on the code that shipped: test 1 hung
// on the loading text forever, and test 2 showed a landlord the renter's
// storefront because a failed read and an empty portfolio are both [].
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ mode: 'hang' }));

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

// Only the boot reads are replaced. lib/bounded-read.js is left REAL — it is the
// thing under test, and a mocked copy of it would prove nothing.
vi.mock('../modules/properties/cloud.js', async (importOriginal) => {
  const actual = await importOriginal();
  const answer = () => (H.mode === 'hang'
    ? new Promise(() => {})                      // never settles — the frozen-tab lock
    : Promise.resolve({ ok: false, reason: 'read-failed' }));
  return {
    ...actual,
    claimPropertyAccess: answer,
    loadMyDoors: answer,
    loadMyGrants: answer,
    loadMyHousehold: answer,
    loadMyRentals: answer,
    loadAllPhotos: answer,
    loadPublicVacancies: answer,
  };
});

import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  vi.useRealTimers();
  H.mode = 'hang';
});

// Ride past the shared boot deadline in steps, letting each stage's promise
// continuation run in between.
async function settle() {
  for (let i = 0; i < 8; i++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
}

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PropertiesApp, { surface: 'poetech' }));
  });
}

describe('the Properties tab always resolves', () => {
  it('does not sit on "Opening your properties…" when the reads never come back', async () => {
    H.mode = 'hang';
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await mount();

    // The honest intermediate state: it IS still opening.
    expect(container.textContent).toContain('Opening your properties');

    // Ride past the read ceiling. Nothing below this line ever settles on its own.
    await settle();

    expect(container.textContent).not.toContain('Opening your properties');
    expect(container.textContent).toContain('could not be reached');
  });

  it('offers a way back rather than a dead end', async () => {
    H.mode = 'hang';
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await mount();
    await settle();

    const retry = [...container.querySelectorAll('button')]
      .find((b) => /try again/i.test(b.textContent || ''));
    expect(retry).toBeTruthy();
  });

  it('never draws an unreachable portfolio as the renter storefront', async () => {
    // The lie underneath the hang: a failed read and an empty portfolio are both
    // [], so the landlord fell through to "Places to Live" — his own properties
    // offered to him as somewhere he might like to move.
    H.mode = 'fail';
    await mount();
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });

    expect(container.textContent).not.toContain('Places to Live');
    expect(container.textContent).toContain('could not be reached');
  });
});

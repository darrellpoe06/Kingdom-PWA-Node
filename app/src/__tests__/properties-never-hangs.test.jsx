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
    ? new Promise(() => {})                      // never settles
    : Promise.resolve({
      ok: false,
      reason: 'read-failed',
      error: 'relation "public.rental_tenancies" does not exist',
    }));
  // 'starve': the claim never answers, while the real reads answer after 4s —
  // inside a read's OWN ceiling, hopeless inside the leftovers of a shared one.
  const slow = (v) => () => (H.mode === 'starve'
    ? new Promise((res) => setTimeout(() => res(v), 4000))
    : answer());
  const doorsRow = {
    id: 'd1', rental_ref: 'r-1003koehn', property_label: '1003 Koehn Dr',
    unit_label: '', status: 'active', tenant_name: 'Tenant', monthly_rent: 900,
  };
  return {
    ...actual,
    claimPropertyAccess: () => (H.mode === 'starve' ? new Promise(() => {}) : answer()),
    loadMyDoors: slow({ ok: true, doors: [doorsRow] }),
    loadMyGrants: slow({ ok: true, grants: [], byScope: {}, roleLabel: null }),
    loadMyHousehold: slow({ ok: true, memberships: [] }),
    loadMyRentals: slow({ ok: true, rentals: [] }),
    loadAllPhotos: slow({ ok: true, photos: [] }),
    loadPublicVacancies: slow({ ok: true, vacancies: [] }),
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

// Ride past every stage's ceiling in steps, letting each stage's promise
// continuation run in between. Each stage now holds its OWN deadline (the
// starvation fix), so the worst case is the sum of them, not one shared budget.
async function settle() {
  for (let i = 0; i < 20; i++) {
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

  it('a slow claim never starves the reads into a false "not-reached"', async () => {
    // THE BOUND BECAME THE BUG. boot() first spent ONE 6s budget across all
    // three stages. claimPropertyAccess() runs first, so when it stalled ~5s on
    // supabase-js's auth-lock acquire (lockAcquireTimeout is 5000ms in 2.106),
    // the four spine reads inherited ~1s and every one reported 'not-reached' —
    // reads that would have answered fine. That is precisely the card Darrell
    // saw on 2026-09-01 while site-health measured poetech.us/sb/auth/v1/health
    // at 200 from the public internet in the same window.
    //
    // Here the claim hangs forever and the reads answer after 4s — comfortably
    // inside a read's own ceiling, hopeless inside the leftovers of a shared one.
    H.mode = 'starve';
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await mount();
    await settle();

    // The doors arrived, so no error card and no renter storefront.
    expect(container.textContent).not.toContain('could not be reached');
    expect(container.textContent).not.toContain('Places to Live');
    expect(container.textContent).toContain('Koehn');
  });

  it('names what the database actually said, and never invents a cause', async () => {
    // The first version of this card asserted a cause in its copy — "closing
    // your other poetech.us tabs is the fastest fix, a frozen tab can hold the
    // sign-in lock". That guess was WRONG (the real cause was 28 migrations
    // never replayed to the sovereign database), and because it read as
    // confident advice it sent Darrell chasing browser tabs for 90 minutes
    // while the true reason sat unread in the error the read already returned.
    // A surface may say it does not know; it may not make something up.
    H.mode = 'fail';
    await mount();
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });

    // The real reason is shown, attributed to the read it came from.
    expect(container.textContent).toContain('rental_tenancies');
    expect(container.textContent).toContain('read-failed');
    expect(container.textContent).toContain('properties');

    // ...and the invented cause is gone for good.
    expect(container.textContent).not.toMatch(/frozen tab/i);
    expect(container.textContent).not.toMatch(/closing your other/i);
  });
});

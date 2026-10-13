// =============================================================================
// A landlord chooses their own app at the door (DR-1007) — the real surface
// =============================================================================
// "I own properties" used to end at the tenant face. Now: the card says what
// the sign-in leads to and writes the intent into the address; after the
// sign-in, a person with NO landlord seat is offered the two paths, a pick
// calls claim_landlord_space with that path and lands on that path's door;
// a person WITH a seat gets the app and the intent is taken out of the
// address; a seat read that FAILED is said as a failure, never as "no seat"
// (proven to catch: the chooser must not render on a failed read).
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = { session: null, seat: { data: null, error: null }, claims: [], gone: [] };

vi.mock('../lib/supabase.js', () => {
  function queryStub() {
    const q = {};
    const self = () => q;
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
    q.maybeSingle = async () => ({ data: null, error: null });
    q.single = async () => ({ data: null, error: null });
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  }
  const rpc = async (name, args) => {
    if (name === 'my_properties_instance_role') return H.seat;
    if (name === 'claim_landlord_space') { H.claims.push(args); return { data: { status: 'created', path: args.path_in }, error: null }; }
    if (name === 'public_vacancies') return { data: [], error: null };
    return { data: null, error: null };
  };
  const auth = {
    getSession: async () => ({ data: { session: H.session } }),
    getUser: async () => ({ data: { user: H.session?.user || null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({}),
  };
  // ONE client object under both names: cloud.js reads the default export,
  // the door reads the named one, and a test that swaps rpc must reach both.
  const client = { auth, from: () => queryStub(), rpc };
  return {
    supabase: client,
    default: client,
    onAuthChange: (cb) => { cb(H.session); return () => {}; },
    phoneLoginEmail: () => '',
    normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
    readPersistedSession: () => H.session,
    resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); Promise.resolve(io.getSession()).then((r) => { const sx = r && r.data ? r.data.session : undefined; if (sx !== undefined) emit(sx ?? null); }).catch(() => {}); },
    signOut: async () => ({}),
  };
});

// The app behind the seat is not what this suite proves; a stub says it rendered.
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'properties-app' }, 'the app') }));
vi.mock('../components/Cameras.jsx', () => ({ default: () => null }));
vi.mock('../modules/properties/own-space.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, navigate: (url) => { H.gone.push(url); } };
});

const { default: PropertiesDoor } = await import('../components/PropertiesDoor.jsx');

let container; let root;
beforeEach(() => { H.session = null; H.seat = { data: null, error: null }; H.claims = []; H.gone = []; });
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

async function mount(search = '?properties=1') {
  window.history.replaceState(null, '', `/properties/app/${search}`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}
const click = async (el) => {
  expect(el).toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
};
const signedIn = () => ({ access_token: 't', user: { id: 'u-new', email: 'alice@example.com' } });

describe('signed out, "I own properties"', () => {
  it('says what the sign-in leads to and writes the intent into the address when the sign-in is asked for', async () => {
    await mount();
    await click(container.querySelector('.pp-card[data-portal="landlord"]'));
    const note = container.querySelector('[data-testid="landlord-note"]');
    expect(note.textContent).toMatch(/Poe Properties by itself/);
    expect(note.textContent).toMatch(/the full PoeTech app/);
    expect(window.location.search).not.toMatch(/who=/);
    await click([...container.querySelectorAll('button')].find((b) => /Sign in \/ create a profile/.test(b.textContent)));
    expect(window.location.search).toBe('?properties=1&who=landlord');
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('any other portal leaves the address alone', async () => {
    await mount();
    await click(container.querySelector('.pp-card[data-portal="tenant"]'));
    await click([...container.querySelectorAll('button')].find((b) => /Sign in \/ create a profile/.test(b.textContent)));
    expect(window.location.search).toBe('?properties=1');
  });
});

describe('signed in with the intent', () => {
  it('no seat: the two paths; a pick claims that path and lands on its door', async () => {
    H.session = signedIn();
    await mount('?properties=1&who=landlord');
    const chooser = container.querySelector('[data-testid="own-space-chooser"]');
    expect(chooser, 'the chooser did not render').toBeTruthy();
    expect(container.querySelector('[data-testid="properties-app"]')).toBeNull();
    expect([...chooser.querySelectorAll('button')].map((b) => b.getAttribute('data-path'))).toEqual(['properties', 'poetech']);
    await click(chooser.querySelector('button[data-path="poetech"]'));
    expect(H.claims).toEqual([{ display_name_in: 'alice', path_in: 'poetech' }]);
    expect(H.gone).toEqual(['/?view=properties']);
    expect(window.location.search).toBe('?properties=1');
  });

  it('no seat, the properties path lands on the properties door', async () => {
    H.session = signedIn();
    await mount('?properties=1&who=landlord');
    await click(container.querySelector('[data-testid="own-space-chooser"] button[data-path="properties"]'));
    expect(H.claims[0].path_in).toBe('properties');
    expect(H.gone).toEqual(['/properties/app/?properties=1']);
  });

  it('a seat of any role: the app, and the intent comes out of the address', async () => {
    H.session = signedIn();
    H.seat = { data: { instance_id: 'i-d', instance_slug: 'props-d', instance_type: 'landlord', role: 'member' }, error: null };
    await mount('?properties=1&who=landlord');
    expect(container.querySelector('[data-testid="own-space-chooser"]')).toBeNull();
    expect(container.querySelector('[data-testid="properties-app"]')).toBeTruthy();
    expect(H.claims).toEqual([]);
    expect(window.location.search).toBe('?properties=1');
  });

  it('PROVEN-TO-CATCH: a seat read that failed is said, and the chooser does NOT render', async () => {
    H.session = signedIn();
    H.seat = { data: null, error: { message: 'relation does not exist' } };
    await mount('?properties=1&who=landlord');
    expect(container.querySelector('[data-testid="own-space-chooser"]')).toBeNull();
    expect(container.querySelector('[data-testid="properties-app"]')).toBeNull();
    const un = container.querySelector('[data-testid="own-space-unreached"]');
    expect(un.textContent).toMatch(/Could not check your account \(read-failed\)/);
    expect(un.textContent).toMatch(/Nothing was made/);
    // the read heals: Try again reads the seat afresh
    H.seat = { data: null, error: null };
    await click(un.querySelector('button'));
    expect(container.querySelector('[data-testid="own-space-chooser"]')).toBeTruthy();
  });

  it('a claim that fails says so and makes nothing happen', async () => {
    H.session = signedIn();
    await mount('?properties=1&who=landlord');
    const { supabase } = await import('../lib/supabase.js');
    const real = supabase.rpc;
    supabase.rpc = async (name, args) => (name === 'claim_landlord_space' ? { data: null, error: { message: 'down' } } : real(name, args));
    await click(container.querySelector('[data-testid="own-space-chooser"] button[data-path="properties"]'));
    supabase.rpc = real;
    expect(H.gone).toEqual([]);
    expect(container.querySelector('[data-testid="own-space-said"]').textContent).toMatch(/Not done: rpc-error\. Nothing was made/);
    expect(window.location.search).toBe('?properties=1&who=landlord');
  });
});

describe('signed in without the intent', () => {
  it('is the app, straight away, as it always was', async () => {
    H.session = signedIn();
    await mount('?properties=1');
    expect(container.querySelector('[data-testid="properties-app"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="own-space"]')).toBeNull();
  });
});

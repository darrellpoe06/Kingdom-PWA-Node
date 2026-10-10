// =============================================================================
// A scanned guest card opens the report form on the real Poe Properties door
// (DR-0898), signed out, and the report goes to guest_report_problem with the
// card's key. Without a key, the door is the ordinary signed-out door.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const R = vi.hoisted(() => ({ calls: [], token: 'd'.repeat(64) }));

vi.mock('../lib/supabase.js', () => {
// A query stub that answers any chain (select/eq/order/limit/maybeSingle...)
// with an empty, error-free result: the chrome's libs (voices, readers) ask
// the client on mount and none of them is what this test is about.
function queryStub() {
  const q = {};
  const self = () => q;
  for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
  q.maybeSingle = async () => ({ data: null, error: null });
  q.single = async () => ({ data: null, error: null });
  q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
  return q;
}
return {
  // The door now carries PoeTech's chrome (DR-0827); read-aloud and the voice
  // libs import the named client and the auth listener too.
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: () => queryStub(),
    rpc: async () => ({ data: null, error: null }),
  },
  onAuthChange: (cb) => { cb(null); return () => {}; },
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    // The signed-out door asks for listed vacancies; two listed, so the
    // "nothing available" copy and the listing copy are both exercised.
    rpc: async (name, args) => {
      R.calls.push([name, args]);
      if (name === 'guest_report_door') return { data: args.p_token === R.token ? [{ label: 'The Short Stay', unit: 'Apt 2' }] : [], error: null };
      if (name === 'guest_report_problem') return { data: true, error: null };
      return { data: null, error: null };
    },
  },
  phoneLoginEmail: (p) => (String(p || '').replace(/\D+/g, '').length >= 10 ? `1${String(p).replace(/\D+/g, '')}@phone.poetech.us` : ''),
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
  // The door now resolves its first session through the shared primitive
  // instead of racing getSession() against a deadline (2026-08-28). The mock
  // mirrors the real contract: emit the stored session at once, then reconcile.
  readPersistedSession: () => null,
  resolveInitialSession: (emit, io) => {
    emit(io.readStored ? io.readStored() : null);
    Promise.resolve(io.getSession())
      .then((r) => { const sx = r && r.data ? r.data.session : undefined; if (sx !== undefined) emit(sx ?? null); })
      .catch(() => {});
  },
  signOut: async () => ({}),
}; });

import PropertiesDoor from '../components/PropertiesDoor.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  R.calls = [];
  window.history.replaceState(null, '', '/properties/');
});
async function mount(search) {
  window.history.replaceState(null, '', `/properties/${search}`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}

describe('the guest card on the door', () => {
  it('opens the report form for that door, and sends with the card\'s key', async () => {
    await mount(`?report=${R.token}`);
    expect(container.querySelector('[data-testid="guest-report-page"]')).not.toBeNull();
    expect(container.textContent).toContain('The Short Stay · Apt 2');
    expect(container.textContent).not.toContain('Who are you?');
    const input = container.querySelector('#gr-title');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(input, 'No towels'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    const send = [...container.querySelectorAll('button')].find((b) => /Send it to the host/.test(b.textContent));
    await act(async () => { send.click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    const filed = R.calls.find(([n]) => n === 'guest_report_problem');
    expect(filed && filed[1]).toMatchObject({ p_token: R.token, p_title: 'No towels', p_urgent: false });
    expect(container.textContent).toContain('Thank you, it is sent');
  });
  it('without a key, the door is the ordinary signed-out door', async () => {
    await mount('');
    expect(container.querySelector('[data-testid="guest-report-page"]')).toBeNull();
    expect(container.textContent).toContain('Who are you?');
  });
});

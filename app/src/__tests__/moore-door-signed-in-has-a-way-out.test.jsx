// =============================================================================
// A signed-in person on the Moore door ALWAYS has a way out
// =============================================================================
// Darrell 2026-09-07, on his own tablet at poetech.us/moore/app/: "where is
// the logout button?" The header under the comfort controls was BLANK — no
// name, no sign-out, no login. Traced to DoorAuth's signed-in-non-steward
// branch: `if (role !== 'signed-out') return null;`. His tablet holds the
// phone+PIN door's session; my_business_role (0090) read instance_members by
// auth.uid() alone, his Moore seat is on the gmail identity, so the door
// called a governor 'none' and drew what a customer got — nothing.
//
// Two facts pinned here, by RENDER, because the defect was what the screen
// did not contain:
//   1. role 'none' (signed in, not a steward): the identity is shown and a
//      Sign out control exists. A door with no handle on the inside is a
//      lockout wearing a blank header — the shop owner whose session is a
//      different account than her seat could never reach the seat.
//   2. the role RPC ERRORING is told apart from 'none': the reader is told
//      the role could not be read, and still gets Sign out. Collapsing the
//      two hid a backend fault behind a customer's view.
//
// Proven-to-catch: written against the shipped branch first and observed
// failing (no "Sign out" in the header for role 'none').
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The signed-in identity: a phone+PIN door (the exact session on his tablet).
const SESSION = { user: { id: 'door-uuid', email: '15636502416@phone.poetech.us', user_metadata: { phone: '15636502416', login_method: 'phone-pin' } } };
// What my_business_role answers — set per test.
const rpc = { role: 'none', error: null };

vi.mock('../lib/showcase.js', () => ({
  fetchShowcase: async () => ({ ok: true, pieces: [] }),
  showcaseImageUrl: (p) => `https://cdn.example/${p}`,
  sortPieces: (p) => [...(p || [])],
}));
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: SESSION } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    rpc: async (name) => (name === 'my_business_role'
      ? { data: rpc.error ? null : rpc.role, error: rpc.error }
      : { data: [], error: null }),
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) }),
  },
  readPersistedSession: () => SESSION,
  signOut: async () => ({}),
  // The real helper's contract: a phone door is named by its formatted number,
  // never the synthetic address (supabase.js identityLabel).
  identityLabel: (s) => (s?.user?.email?.endsWith('@phone.poetech.us') ? '(563) 650-2416' : (s?.user?.email || '')),
}));
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: async () => ({ data: [], error: null }) }));
vi.mock('../lib/business-messages.js', () => ({
  fetchMessages: async () => ({ ok: true, rows: [] }),
  sendMessage: async () => ({ ok: true }),
}));
vi.mock('../lib/crm-sync.js', () => ({ captureLead: async () => ({ ok: true }) }));

import MooreDoor from '../components/MooreDoor.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  rpc.role = 'none'; rpc.error = null;
});

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(MooreDoor)); });
  for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); });
}

const header = () => container.querySelector('header');
const signOutBtn = () => [...header().querySelectorAll('button')].find((b) => /sign out/i.test(b.textContent || ''));

describe('a signed-in person on the Moore door always has a way out', () => {
  it("role 'none' (signed in, not a steward): shows who is signed in and a Sign out", async () => {
    rpc.role = 'none';
    await mount();
    expect(header().textContent).toContain('Signed in as');
    expect(header().textContent).toContain('(563) 650-2416');
    expect(header().textContent, 'the synthetic phone address must never render').not.toContain('@phone.poetech.us');
    expect(signOutBtn(), 'no Sign out for a signed-in non-steward — the blank-header lockout').toBeTruthy();
  });

  it('the role RPC erroring is told apart from "none" — and still has Sign out', async () => {
    rpc.error = { message: 'function my_business_role does not exist' };
    await mount();
    expect(header().textContent).toMatch(/couldn.t read your role/i);
    expect(signOutBtn()).toBeTruthy();
  });

  it('a steward still gets the shop line and its Sign out (unchanged)', async () => {
    rpc.role = 'admin';
    await mount();
    expect(header().textContent).toContain('Signed in as the shop');
    expect(signOutBtn()).toBeTruthy();
  });
});

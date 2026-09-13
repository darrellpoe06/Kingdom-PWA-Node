// =============================================================================
// When her order form fails, it says so -- and hands the customer a door
// =============================================================================
// 2026-09-13, from Shay, about a real customer: "had Ster create an account on
// the site and he went to send info through email and it won't let him send."
//
// The root cause was server-side (0215: crm_capture_lead's allowlist never
// carried 'moore-orders', so every order inquiry this door ever took was
// refused -- crm_leads has zero rows, ever). That is fixed in the migration.
// This file pins the OTHER half of the failure, the half a customer actually
// meets: the screen told Sterling to "please try again in a moment" for a cause
// that could not improve in any moment, and pointed him nowhere else -- while a
// working channel, her message thread, sat further down the same page.
//
// Three properties, all of which a unit test cannot see and only a mount can:
//   1. A refused capture renders a FAILURE, not a success.
//   2. The failure says the words that matter -- it did not reach her.
//   3. The failure offers the channel that does work, and it moves the
//      customer there.
//
// Proven-to-catch: run against the pre-fix component (setState('ok') on any
// response, "please try again in a moment") and all three fail.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PIECES = Array.from({ length: 4 }, (_, i) => ({
  slug: `sp-${i + 1}`, title: `Piece ${i + 1}`, image_path: `moore-divahs/sp-${i + 1}.jpeg`,
  price_cents: null, pinned: false, created_at: `2026-08-0${i + 1}`,
}));

// The capture result is swapped per-test: the real refusal shape from
// crm-sync.js (`{ skipped, error }`) and the real success shape
// (`{ captured: true, id }`). Nothing invented.
const capture = { result: { skipped: 'capture-error', error: { message: 'unknown pipeline: moore-orders' } } };

vi.mock('../lib/showcase.js', () => ({
  fetchShowcase: async () => ({ ok: true, pieces: PIECES }),
  showcaseImageUrl: (p) => `https://cdn.example/${p}`,
  sortPieces: (p) => [...(p || [])],
}));
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    rpc: async () => ({ data: [], error: null }),
  },
  readPersistedSession: () => null,
  signOut: async () => ({}),
}));
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: async () => ({ data: [], error: null }) }));
vi.mock('../lib/business-messages.js', () => ({
  fetchMessages: async () => ({ ok: true, rows: [] }),
  sendMessage: async () => ({ ok: true }),
}));
vi.mock('../lib/crm-sync.js', () => ({ captureLead: async () => capture.result }));

import MooreDoor from '../components/MooreDoor.jsx';

let container, root, warned, realScrollIntoView;
beforeEach(() => {
  warned = [];
  realScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
  vi.spyOn(console, 'warn').mockImplementation((...a) => warned.push(a.join(' ')));
});
afterEach(() => {
  window.HTMLElement.prototype.scrollIntoView = realScrollIntoView;
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  vi.restoreAllMocks();
  capture.result = { skipped: 'capture-error', error: { message: 'unknown pipeline: moore-orders' } };
});

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(MooreDoor)); });
  await act(async () => { await Promise.resolve(); });
}

// Fill and submit her order form exactly as a customer does.
async function sendOrder() {
  const name = container.querySelector('input[aria-label="Your name"]');
  const contact = container.querySelector('input[aria-label="Your email or handle"]');
  expect(name, 'her order form is not on the page').toBeTruthy();
  const setVal = (el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  await act(async () => { setVal(name, 'Sterling'); });
  await act(async () => { setVal(contact, 'ster@example.com'); });
  const form = name.closest('form');
  await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await act(async () => { await Promise.resolve(); });
  return form;
}

describe('a refused order inquiry does not pretend it was sent', () => {
  it('renders a failure, not a checkmark', async () => {
    await mount();
    await sendOrder();
    const alert = container.querySelector('[role="alert"]');
    expect(alert, 'a refused capture rendered no failure at all').toBeTruthy();
    expect(container.textContent).not.toContain('Shay will reach out to talk through your piece');
  });

  it('says the one thing that matters: she has not received it', async () => {
    await mount();
    await sendOrder();
    const alert = container.querySelector('[role="alert"]');
    expect(alert.textContent).toMatch(/did not send/i);
    expect(alert.textContent).toMatch(/has not received it/i);
    // The lie this replaces. "In a moment" was never true for this failure.
    expect(alert.textContent).not.toMatch(/try again in a moment/i);
  });

  it('keeps what the customer typed, so nothing has to be retyped', async () => {
    await mount();
    await sendOrder();
    expect(container.querySelector('input[aria-label="Your name"]').value).toBe('Sterling');
    expect(container.querySelector('input[aria-label="Your email or handle"]').value).toBe('ster@example.com');
  });

  it('puts the real reason where a screenshot can carry it, not on the customer', async () => {
    await mount();
    await sendOrder();
    expect(warned.join('\n')).toMatch(/inquiry not sent/);
    // ...and never in front of the customer.
    expect(container.textContent).not.toContain('unknown pipeline');
  });
});

describe('the failure hands the customer the channel that works', () => {
  it('offers her message thread as the way through', async () => {
    await mount();
    await sendOrder();
    const alert = container.querySelector('[role="alert"]');
    const out = [...alert.querySelectorAll('button')].find((b) => /Message Shay directly/i.test(b.textContent));
    expect(out, 'the failure offered no other way to reach her').toBeTruthy();
  });

  it('the thread it points at is really on this page', async () => {
    await mount();
    await sendOrder();
    const headings = [...container.querySelectorAll('h3')].map((h) => h.textContent.trim());
    expect(headings, 'nothing to walk the customer to').toContain('Messages');
  });

  it('tapping it moves the customer to that thread', async () => {
    await mount();
    // jsdom has no scrollIntoView; record the call on the node it is asked of.
    const moved = [];
    window.HTMLElement.prototype.scrollIntoView = function () { moved.push(this); };
    await sendOrder();
    const alert = container.querySelector('[role="alert"]');
    const out = [...alert.querySelectorAll('button')].find((b) => /Message Shay directly/i.test(b.textContent));
    await act(async () => { out.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(moved.length, 'the button went nowhere').toBeGreaterThan(0);
    expect(moved[moved.length - 1].textContent).toContain('Messages');
  });

  it('is reachable by keyboard with a visible focus ring', async () => {
    await mount();
    await sendOrder();
    const out = [...container.querySelectorAll('[role="alert"] button')]
      .find((b) => /Message Shay directly/i.test(b.textContent));
    expect(out.getAttribute('type')).toBe('button'); // never a stray form submit
    expect(out.className).toMatch(/focus-visible:ring/);
  });
});

describe('a successful inquiry is still a successful inquiry', () => {
  it('the real success shape from crm-sync.js still reads as sent', async () => {
    capture.result = { captured: true, id: 'lead-1' };
    await mount();
    await sendOrder();
    expect(container.textContent).toContain('Shay will reach out to talk through your piece');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

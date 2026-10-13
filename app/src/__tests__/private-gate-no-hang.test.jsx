// @vitest-environment jsdom
//
// PrivateGate + pin.js NO-BLANK guarantee (Darrell 2026-07-19: "Books Tab is
// still broken"). Root cause: the shared supabase client awaits getSession(),
// which waits on a CROSS-TAB navigator lock; a wedged PoeTech tab holds it, so
// hasUserPin() never settles, PrivateGate stays on its "loading" state — which
// renders NULL — and the WHOLE private area (all of Books) is blank forever.
//
// This is the render-level, proven-to-catch proof (DR-0076 / DR-0125): mount the
// REAL PrivateGate with a PIN check that never resolves and assert the private
// area still renders (no-lockout) instead of a permanent blank. Plus the pin.js
// unit: a hung RPC degrades to backendAvailable:false within the deadline.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A PIN check that NEVER settles — the wedged cross-tab lock hang.
const neverResolves = () => new Promise(() => {});
const hasUserPin = vi.fn(neverResolves);
vi.mock('../lib/pin.js', () => ({
  hasUserPin: (...a) => hasUserPin(...a),
  verifyUserPin: vi.fn(async () => ({ ok: true })),
}));
// PinGate is heavy (inputs, focus) and never renders in the no-lockout path;
// stub it so the test isolates PrivateGate's own gating.
vi.mock('../components/PinGate.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'pin-gate' }, 'PIN') }));

import PrivateGate from '../components/PrivateGate.jsx';
import { lockPrivate } from '../lib/private-lock.js';

describe('PrivateGate — a hung PIN check must NOT blank the private area', () => {
  let container;
  beforeEach(() => {
    vi.useFakeTimers();
    hasUserPin.mockReset().mockImplementation(neverResolves);
    lockPrivate(); // start locked so the gate is actually exercised
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('renders the children (no-lockout) after the deadline instead of null forever', async () => {
    await act(async () => {
      createRoot(container).render(
        createElement(PrivateGate, { area: 'Financial' }, createElement('div', { 'data-testid': 'books' }, 'BOOKS CONTENT')),
      );
    });
    // While the PIN check hangs, the gate is on its "loading" state -> null.
    expect(container.querySelector('[data-testid="books"]')).toBeNull();
    expect(container.textContent).not.toContain('BOOKS CONTENT');

    // The deadline fires; the gate must degrade to no-lockout and show Books.
    await act(async () => { vi.advanceTimersByTime(6001); });
    expect(container.querySelector('[data-testid="books"]')).not.toBeNull();
    expect(container.textContent).toContain('BOOKS CONTENT');
    // It opened the area, not shown the PIN prompt (owner is never blocked).
    expect(container.querySelector('[data-testid="pin-gate"]')).toBeNull();
  });
});

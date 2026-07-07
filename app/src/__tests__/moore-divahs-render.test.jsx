// MooreDivahs — the Order Board surface mounts and tells the truth when empty
// (no painted numbers, DR-0076). Supabase is mocked; the store starts empty.
// Mount pattern mirrors board-handoff-render.test.jsx (react-dom/client + act).
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import MooreDivahs from '../components/MooreDivahs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* no storage */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('MooreDivahs surface', () => {
  it('renders the brand header and an honest empty state', async () => {
    await act(async () => { root.render(createElement(MooreDivahs)); });
    const text = container.textContent || '';
    expect(text).toContain('Moore Divahs');
    expect(text).toContain('mooredivahs1@yahoo.com');
    // honest empty world — an explicit no-orders card, no fake revenue
    expect(text).toContain('No orders yet');
    expect(text).toContain('Paid orders');
  });

  it('opens the add-order form with the real intake fields', async () => {
    await act(async () => { root.render(createElement(MooreDivahs)); });
    const btn = [...container.querySelectorAll('button')].find((b) => /New order/.test(b.textContent || ''));
    expect(btn).toBeTruthy();
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    // the intake that kills the DM-digging: name, channel, product, quote, delivery
    expect(container.querySelector('input[aria-label="Customer name"]')).toBeTruthy();
    expect(container.querySelector('select[aria-label="Channel"]')).toBeTruthy();
    expect(container.querySelector('select[aria-label="Product"]')).toBeTruthy();
    expect(container.querySelector('input[aria-label="Quote dollars"]')).toBeTruthy();
    expect(container.querySelector('select[aria-label="Delivery"]')).toBeTruthy();
  });
});

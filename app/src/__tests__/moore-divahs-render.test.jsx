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

  it('bulk-apparel shows the line editor and a submitted order carries the pick-list', async () => {
    await act(async () => { root.render(createElement(MooreDivahs)); });
    const open = [...container.querySelectorAll('button')].find((b) => /New order/.test(b.textContent || ''));
    await act(async () => { open.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });

    const type = (el, value) => act(async () => {
      const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    });

    await type(container.querySelector('input[aria-label="Customer name"]'), 'Team Mom');
    await type(container.querySelector('select[aria-label="Product"]'), 'bulk-apparel');
    // the structured line editor appears — the Google-Doc killer at the source
    expect(container.querySelector('input[aria-label="Line quantity"]')).toBeTruthy();
    await type(container.querySelector('input[aria-label="Line quantity"]'), '6');
    await type(container.querySelector('input[aria-label="Line size"]'), 'M');
    await type(container.querySelector('input[aria-label="Line color"]'), 'blue');
    await type(container.querySelector('input[aria-label="Line names"]'), 'Alicia, Dawn');
    const addLine = [...container.querySelectorAll('button')].find((b) => /Add line/.test(b.textContent || ''));
    await act(async () => { addLine.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    expect(container.textContent).toContain('6 pieces across 1 lines');

    const submit = [...container.querySelectorAll('button')].find((b) => /^Add order$/.test((b.textContent || '').trim()));
    await act(async () => { submit.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    // the created order renders the production pick-list line, structured
    expect(container.textContent).toContain('6 × adult M · blue — Alicia, Dawn (+4 unnamed)');
  });
});

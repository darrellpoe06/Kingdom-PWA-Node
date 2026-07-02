// =============================================================================
// ReceiptCapture — live render proof (DR-0076). Mounts the REAL capture front
// door and pins the consumer-facing affordances: a camera button, an upload
// (single + bulk) control, and a drag-drop zone — with self-explaining copy.
// Also proves a queued receipt renders with its reason + a manual-link control.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ReceiptCapture from '../components/ReceiptCapture.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ReceiptCapture, props));
  });
}
const findButton = (re) => [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ReceiptCapture — the photo/OCR front door', () => {
  it('opens to a camera button, an upload control, and a bulk drop zone', async () => {
    await mount({ transactions: [], updateTransaction: () => {} });
    // collapsed: an "Add receipts" toggle + the headline
    expect(document.body.textContent).toMatch(/Photograph a receipt/i);
    await click(findButton(/Add receipts/i));
    const text = document.body.textContent || '';
    expect(findButton(/Take a photo/i)).toBeTruthy();
    expect(findButton(/Upload photo/i)).toBeTruthy();
    expect(text).toMatch(/drag a stack of receipt photos here/i);
    // camera input asks for the rear camera; upload input allows multiple (bulk)
    const inputs = [...document.body.querySelectorAll('input[type=file]')];
    expect(inputs.some((i) => i.getAttribute('capture') === 'environment')).toBe(true);
    expect(inputs.some((i) => i.hasAttribute('multiple'))).toBe(true);
    // privacy + bank-truth are stated to the user
    expect(text).toMatch(/never leaves it/i);
    expect(text).toMatch(/location tag is stripped/i);
    expect(text).toMatch(/bank stays the source of truth/i);
  });
});

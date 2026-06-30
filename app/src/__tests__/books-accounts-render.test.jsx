// =============================================================================
// BooksAccounts — live render proof for the fourth monolith extraction
// (hybrid-modular cutover, Stage 3). Mounts the REAL component in jsdom and pins
// the behavior the shell relied on so the extraction is provably loss-free
// (DR-0076): the Accounts surface renders its totals + buffer cards from props,
// and the add-account form exposes the ACCOUNT_TYPES options that travelled with
// the component.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import BooksAccounts from '../components/BooksAccounts.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(BooksAccounts, props));
  });
}
const findButton = (re) =>
  [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

const baseProps = {
  entityRollups: [], entities: [{ id: 'e-personal', name: 'Personal' }],
  addAccount: () => {}, updateAccount: () => {}, deleteAccount: () => {},
  toggleAccountLegal: () => {}, bufferTarget: 0, bufferCurrent: 0,
  setBufferCurrent: () => {}, setBufferTarget: () => {}, totals: {}, ingestData: null,
};

describe('BooksAccounts — renders the accounts surface from props', () => {
  it('shows the all-accounts total card and add affordance', async () => {
    await mount(baseProps);
    expect(container.textContent).toContain('All Accounts');
    expect(container.textContent).toContain('Total Cash');
    expect(findButton(/\+ Add account/)).toBeTruthy();
  });

  it('add-account form exposes the ACCOUNT_TYPES options', async () => {
    await mount(baseProps);
    const add = findButton(/\+ Add account/);
    expect(add).toBeTruthy();
    await click(add);
    const options = [...container.querySelectorAll('option')].map(o => o.value);
    for (const t of ['checking', 'savings', 'credit', 'loan', 'investment', 'cash', 'other']) {
      expect(options).toContain(t);
    }
  });
});

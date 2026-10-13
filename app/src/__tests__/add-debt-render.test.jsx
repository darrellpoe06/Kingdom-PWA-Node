// @vitest-environment jsdom
//
// AddDebt — live render proof for the Debts-tab add form and list importer
// (Christina 2026-08-10). Mounts the REAL component in jsdom and drives it the
// way a person does, because the request was specifically that she be able to
// add debts HERSELF: a form that never reaches addAccount, or an importer whose
// preview disagrees with what it adds, would satisfy the code review and fail
// the actual ask (DR-0061 — observe the surface, don't assume it).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import AddDebt from '../components/AddDebt.jsx';

const ENTITIES = [{ id: 'e-personal', name: 'Personal (Darrell + Christina)', type: 'personal' }];

let container, root;
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(AddDebt, { entities: ENTITIES, existingDebts: [], ...props }));
  });
  return container;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  container = root = null;
});

const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const type = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('AddDebt — one debt by hand', () => {
  it('adds a card the app has never seen, with the terms the person typed', async () => {
    const addAccount = vi.fn();
    await mount({ addAccount });
    await click(byText(/add one/i));
    await type(container.querySelector('#debt-name'), 'Circle K Gas Card');
    await type(container.querySelector('#debt-balance'), '1347');
    await type(container.querySelector('#debt-rate'), '34.99');
    await type(container.querySelector('#debt-min'), '100');
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(addAccount).toHaveBeenCalledTimes(1);
    expect(addAccount.mock.calls[0][0]).toMatchObject({
      name: 'Circle K Gas Card', type: 'credit', treatAsDebt: true,
      balance: 1347, rate: 34.99, rateKnown: true, minPayment: 100, entityId: 'e-personal',
    });
  });

  it('a blank monthly payment is left UNSET, never stored as $0', async () => {
    // The heart of "I don't have all the rates or payments yet" — a blank must
    // stay blank so the tab can show what still needs filling in (DR-0076).
    const addAccount = vi.fn();
    await mount({ addAccount });
    await click(byText(/add one/i));
    await type(container.querySelector('#debt-name'), 'UIECU Visa Rewards');
    await type(container.querySelector('#debt-balance'), '12766.95');
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    const sent = addAccount.mock.calls[0][0];
    expect(sent.balance).toBe(12766.95);
    expect('minPayment' in sent).toBe(false);
    expect('rate' in sent).toBe(false);
    expect('rateKnown' in sent).toBe(false);
  });

  it('a typed 0 IS a confirmed 0% rate', async () => {
    const addAccount = vi.fn();
    await mount({ addAccount });
    await click(byText(/add one/i));
    await type(container.querySelector('#debt-name'), 'Chase Slate Edge');
    await type(container.querySelector('#debt-rate'), '0');
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(addAccount.mock.calls[0][0]).toMatchObject({ rate: 0, rateKnown: true });
  });

  it('refuses to add a nameless debt', async () => {
    const addAccount = vi.fn();
    await mount({ addAccount });
    await click(byText(/add one/i));
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(addAccount).not.toHaveBeenCalled();
  });
});

describe('AddDebt — pasting a whole list', () => {
  const PASTE = `1. Discover it
Balance: $9,667.64
Interest: 0%
Credit usage: 107%
Available credit: $0
Monthly payment:

2. ABC Warehouse Credit Card
Balance: $1,347
Interest: 34.99%
Available credit: $653
Monthly payment: $100

Christina's total credit card balances: $11,014.64`;

  it('previews every card, then adds exactly what the preview showed', async () => {
    const addAccounts = vi.fn();
    await mount({ addAccount: vi.fn(), addAccounts });
    await click(byText(/paste a list/i));
    await type(container.querySelector('#debt-paste'), PASTE);

    // The preview is the promise; adding must honour it.
    expect(container.textContent).toMatch(/Discover it/);
    expect(container.textContent).toMatch(/ABC Warehouse Credit Card/);
    expect(container.textContent).toMatch(/over limit 107%/);

    await click(byText(/add 2 debts/i));
    expect(addAccounts).toHaveBeenCalledTimes(1);
    const sent = addAccounts.mock.calls[0][0];
    expect(sent).toHaveLength(2);                       // the total line is not a card
    expect(sent[0]).toMatchObject({ name: 'Discover it', balance: 9667.64, rate: 0, rateKnown: true });
    expect('minPayment' in sent[0]).toBe(false);        // blank stays blank
    expect(sent[1]).toMatchObject({ name: 'ABC Warehouse Credit Card', minPayment: 100, creditLimit: 2000 });
  });

  it('pre-unchecks a card already on the tab so a re-paste cannot double-add it', async () => {
    const addAccounts = vi.fn();
    await mount({
      addAccount: vi.fn(), addAccounts,
      existingDebts: [{ id: 'd1', name: 'Discover it' }],
    });
    await click(byText(/paste a list/i));
    await type(container.querySelector('#debt-paste'), PASTE);
    expect(container.textContent).toMatch(/already listed/);
    await click(byText(/add 1 debt/i));
    const sent = addAccounts.mock.calls[0][0];
    expect(sent).toHaveLength(1);
    expect(sent[0].name).toBe('ABC Warehouse Credit Card');
  });

  it('says plainly how much of the paste is still missing, and totals only what is known', async () => {
    // Both cards in this paste state a rate (0% and 34.99%), so only the
    // payment is outstanding — the summary must count what is ACTUALLY missing
    // rather than treating every blank-looking field as a gap.
    await mount({ addAccount: vi.fn(), addAccounts: vi.fn() });
    await click(byText(/paste a list/i));
    await type(container.querySelector('#debt-paste'), PASTE);
    expect(container.textContent).toMatch(/1 still need a monthly payment/);
    expect(container.textContent).not.toMatch(/still need an interest rate/);
    expect(container.textContent).toMatch(/\$11,014\.64 owed/);
    expect(container.textContent).toMatch(/Known monthly payments so far: \$100\/mo/);
  });

  it('shows an unknown rate as a dash rather than a claimed 0%', async () => {
    await mount({ addAccount: vi.fn(), addAccounts: vi.fn() });
    await click(byText(/paste a list/i));
    await type(container.querySelector('#debt-paste'), '1. Shell Gas Card\nCredit limit shown: $2,000\nInterest:\nMonthly payment:');
    expect(container.textContent).toMatch(/1 still need an interest rate/);
    expect(container.textContent).toMatch(/not given/); // balance, stated honestly
  });

  it('falls back to one-at-a-time adds when no bulk handler is wired', async () => {
    const addAccount = vi.fn();
    await mount({ addAccount, addAccounts: null });
    await click(byText(/paste a list/i));
    await type(container.querySelector('#debt-paste'), PASTE);
    await click(byText(/add 2 debts/i));
    expect(addAccount).toHaveBeenCalledTimes(2);
  });
});

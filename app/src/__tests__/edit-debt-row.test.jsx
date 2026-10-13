// @vitest-environment jsdom
//
// EditDebtRow — every field on a debt row is editable by hand (Christina
// 2026-08-10: "I need to be able to edit each line that is input or each line
// that is there in general, manually").
//
// Mounts the REAL editor and drives it as a person does. The cases that matter
// are the ones where "editable" could quietly become "lying": a cleared field
// must remove a claim rather than assert zero, opening the editor must not
// disturb a ledgered balance, and correcting a statement-derived rate must be
// recorded as a deliberate, revertible override rather than silently replacing
// what the data says.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import EditDebtRow from '../components/EditDebtRow.jsx';

const ENTITIES = [
  { id: 'e-personal', name: 'Personal (Darrell + Christina)', type: 'personal' },
  { id: 'e-biz', name: 'PoeTech Business', type: 'business' },
];

const CARD = {
  id: 'debt-acct-a1', accountId: 'a1', source: 'account', name: 'Capital One Platinum',
  entityId: 'e-personal', balance: 1550, rate: 28.99, rateKnown: true, rateSource: 'manual',
  dataRate: null, minPayment: 0, creditLimit: 2000, highestBalance: 2001,
  leaveAlone: false, manual: true, hasPayments: false,
};

let container, root;
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    // A <tr> must live inside a table to render.
    root.render(createElement('table', null, createElement('tbody', null,
      createElement(EditDebtRow, {
        debt: CARD, entities: ENTITIES, onClose: () => {}, ...props,
      }),
    )));
  });
  return container;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  container = root = null;
});

const field = (id) => container.querySelector(`#${id}`);
const type = async (el, value) => {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
};
const submit = async () => act(async () => {
  container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
});
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('EditDebtRow — the fields the old inline editors could not reach', () => {
  it('edits the name and the entity, which were not editable at all before', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount });
    await type(field('e-name-debt-acct-a1'), 'Capital One Platinum 4471');
    await type(field('e-ent-debt-acct-a1'), 'e-biz');
    await submit();
    expect(updateAccount).toHaveBeenCalledWith('a1', expect.objectContaining({
      name: 'Capital One Platinum 4471', entityId: 'e-biz',
    }));
  });

  it('edits the credit limit and highest balance', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount });
    await type(field('e-lim-debt-acct-a1'), '2500');
    await type(field('e-high-debt-acct-a1'), '3100');
    await submit();
    expect(updateAccount).toHaveBeenCalledWith('a1', expect.objectContaining({
      creditLimit: 2500, highestBalance: 3100,
    }));
  });

  it('CLEARING a field removes the claim instead of asserting zero', async () => {
    // Proven-to-catch: `parseFloat('') || 0` would write a $0 credit limit the
    // family never entered. An emptied field means unknown (DR-0076).
    const updateAccount = vi.fn();
    await mount({ updateAccount });
    await type(field('e-lim-debt-acct-a1'), '');
    await type(field('e-rate-debt-acct-a1'), '');
    await submit();
    const sent = updateAccount.mock.calls[0][1];
    expect(sent.creditLimit).toBeNull();
    expect(sent.rateKnown).toBe(false);
  });

  it('parks a debt with leave-alone, keeping it listed but out of the plan', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount });
    const box = container.querySelector('input[type="checkbox"]');
    expect(box.checked).toBe(false);
    await click(box);            // jsdom toggles it; React sees the change
    expect(box.checked).toBe(true);
    await submit();
    expect(updateAccount.mock.calls[0][1].leaveAlone).toBe(true);
  });

  it('removes a debt only after a confirming second tap', async () => {
    const deleteAccount = vi.fn();
    await mount({ updateAccount: vi.fn(), deleteAccount });
    await click(btn(/remove debt/i));
    expect(deleteAccount).not.toHaveBeenCalled();   // first tap only arms it
    await click(btn(/tap again to remove/i));
    expect(deleteAccount).toHaveBeenCalledWith('a1');
  });
});

describe('EditDebtRow — the ledger keeps its authority', () => {
  it('does NOT send a balance when the amount was not changed', async () => {
    // Proven-to-catch: sending the unchanged balance through updateAccount on a
    // ledgered account posts a spurious balance-adjustment transaction just for
    // opening the editor and pressing Save.
    const updateAccount = vi.fn();
    await mount({ updateAccount, debt: { ...CARD, hasPayments: true } });
    await type(field('e-name-debt-acct-a1'), 'Renamed');
    await submit();
    expect('balance' in updateAccount.mock.calls[0][1]).toBe(false);
  });

  it('sends the balance when it actually changed', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount });
    await type(field('e-bal-debt-acct-a1'), '1400');
    await submit();
    expect(updateAccount.mock.calls[0][1].balance).toBe(1400);
  });

  it('warns that a ledgered account records a dated adjustment', async () => {
    await mount({ updateAccount: vi.fn(), debt: { ...CARD, hasPayments: true } });
    expect(container.textContent).toMatch(/recorded as a dated adjustment/i);
  });
});

describe('EditDebtRow — a statement-derived rate stays visible and revertible', () => {
  const DERIVED = { ...CARD, name: 'Chase Line of Credit', rate: 17.44, rateSource: 'derived', dataRate: 17.44, manual: false };

  it('shows what the statements say', async () => {
    await mount({ updateAccount: vi.fn(), debt: DERIVED });
    expect(container.textContent).toMatch(/Statements say/);
    expect(container.textContent).toMatch(/17\.44%/);
  });

  it('records a correction as a deliberate OVERRIDE, not a silent replacement', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount, debt: DERIVED });
    await type(field('e-rate-debt-acct-a1'), '24.99');
    await submit();
    expect(updateAccount.mock.calls[0][1]).toMatchObject({ rate: 24.99, rateKnown: true, rateOverridden: true });
  });

  it('typing back the derived figure clears the override flag', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount, debt: DERIVED });
    await type(field('e-rate-debt-acct-a1'), '17.44');
    await submit();
    expect(updateAccount.mock.calls[0][1].rateOverridden).toBe(false);
  });

  it('offers a one-tap revert once a rate has been overridden', async () => {
    const updateAccount = vi.fn();
    await mount({ updateAccount, debt: { ...DERIVED, rate: 24.99, rateSource: 'override' } });
    await click(btn(/revert to data/i));
    expect(updateAccount).toHaveBeenCalledWith('a1', { rateOverridden: false });
  });
});

describe('EditDebtRow — a mortgage line is editable too', () => {
  const MORTGAGE = {
    id: 'debt-rental-r1', source: 'rental', rentalId: 'r1', name: 'Maple St mortgage',
    balance: 148000, rate: 6.25, rateKnown: true, minPayment: 1120, dataRate: null,
    creditLimit: null, highestBalance: null, leaveAlone: false,
  };

  it('writes the money terms back onto the property record', async () => {
    const updateRental = vi.fn();
    await mount({ debt: MORTGAGE, updateRental, updateAccount: vi.fn() });
    await type(field('e-bal-debt-rental-r1'), '145000');
    await type(field('e-min-debt-rental-r1'), '1150');
    await submit();
    expect(updateRental).toHaveBeenCalledWith('r1', {
      mortgage: { balance: 145000, rate: 6.25, monthlyPI: 1150 },
    });
  });

  it('does not offer name, entity, limit, or removal on a property mortgage', async () => {
    // Those belong to Real Estate; showing them here would imply this tab owns
    // the property record, and "Remove debt" would read as deleting a house.
    await mount({ debt: MORTGAGE, updateRental: vi.fn(), deleteAccount: vi.fn() });
    expect(field('e-name-debt-rental-r1')).toBeNull();
    expect(field('e-lim-debt-rental-r1')).toBeNull();
    expect(btn(/remove debt/i)).toBeUndefined();
    expect(container.textContent).toMatch(/live on the Real Estate tab/);
  });
});

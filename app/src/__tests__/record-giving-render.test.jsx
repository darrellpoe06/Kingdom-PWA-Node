// =============================================================================
// RecordGiving — the steward surface adds a gift and shows a real YTD (DR-0179)
// =============================================================================
// DP 2026-07-12: "easy add cash money to a user's records." PROVEN-TO-CATCH:
// a clean cash gift is recorded via addRecord; a bad amount is rejected (never
// committed); and the year-to-date total reflects REAL passed rows, never a
// painted number.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import RecordGiving from '../components/RecordGiving.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(RecordGiving, props)); });
}
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
const setInput = (sel, value) => {
  const el = container.querySelector(sel);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('RecordGiving — add a gift', () => {
  it('records a clean cash gift through addRecord with a normalized amount', async () => {
    const addRecord = vi.fn();
    await mount({ records: [], addRecord });
    await act(async () => { setInput('#g-member', 'DP'); setInput('#g-amount', '$40'); setInput('#g-date', '2026-07-05'); });
    await act(async () => { btn(/record gift/i).click(); });
    expect(addRecord).toHaveBeenCalledTimes(1);
    expect(addRecord.mock.calls[0][0]).toMatchObject({ member: 'DP', amount: 40, date: '2026-07-05', method: 'cash' });
  });

  it('REJECTS a bad amount — nothing is committed, an error shows', async () => {
    const addRecord = vi.fn();
    await mount({ records: [], addRecord });
    await act(async () => { setInput('#g-member', 'X'); setInput('#g-amount', 'abc'); setInput('#g-date', '2026-07-05'); });
    await act(async () => { btn(/record gift/i).click(); });
    expect(addRecord).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });
});

describe('RecordGiving — year-to-date is real, not painted', () => {
  it('sums only this year\'s passed rows', async () => {
    const y = new Date().getFullYear();
    const records = [
      { id: 'a', member: 'DP', amount: 100, date: `${y}-01-01`, method: 'cash', fund: 'Tithe', taxYear: y },
      { id: 'b', member: 'Mary', amount: 50, date: `${y}-02-01`, method: 'online', fund: 'General', taxYear: y },
      { id: 'c', member: 'Old', amount: 999, date: `${y - 1}-01-01`, method: 'cash', fund: 'General', taxYear: y - 1 }, // prior year, excluded
    ];
    await mount({ records, addRecord: vi.fn() });
    expect(container.textContent).toContain('$150.00');   // 100 + 50, not 1149
    expect(container.textContent).not.toContain('$1,149');
  });

  it('shows an honest empty state with no rows (no painted total)', async () => {
    await mount({ records: [], addRecord: vi.fn() });
    expect(container.textContent).toMatch(/No gifts recorded yet/i);
  });
});

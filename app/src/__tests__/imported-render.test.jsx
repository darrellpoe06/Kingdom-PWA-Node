// @vitest-environment jsdom
//
// imported-render — mount the REAL Books → Imported component and prove the
// bank-convention behavior end-to-end (Verification Doctrine DR-0076 §7: observe
// the running surface, not just the pure logic). Proves: it opens on the newest
// month with newest row first (the original "2026 isn't on top" complaint), the
// PII gate hides real rows without a profile, and selecting a single account
// reveals a truthful running Balance column.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import Imported from '../components/Imported.jsx';

const DATA = {
  accounts: [
    { id: 'a1', name: 'Chase 7206', openingBalance: 1000 },
    { id: 'a2', name: 'Chase 3322', openingBalance: 500 },
  ],
  transactions: [
    { id: 't_jun30', accountId: 'a1', date: '2026-06-30', amount: -80, description: 'Late June charge', category: 'utilities' },
    { id: 't_jun10', accountId: 'a1', date: '2026-06-10', amount: 500, description: 'June payroll', category: 'income' },
    { id: 't_may', accountId: 'a2', date: '2026-05-01', amount: -1200, description: 'May rent', category: 'housing' },
  ],
};

async function mount(data) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(Imported, { data })); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const byText = (t) => [...container.querySelectorAll('button')].find(b => b.textContent.trim() === t);
  return { container, click, byText };
}

describe('Imported — bank-convention view (real mount)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('poe-current-profile', 'p1'); // pass the PII gate on localhost
  });

  it('opens on the newest month (June 2026) with the newest row first', async () => {
    const { container } = await mount(DATA);
    const html = container.innerHTML;
    expect(html).toContain('June 2026');    // sticky month header
    expect(html).toContain('June payroll'); // June rows render
    expect(html).not.toContain('May 2026'); // default lands on the latest month only
    // newest-first within the month: Jun 30 row appears before Jun 10 row
    expect(html.indexOf('Late June charge')).toBeLessThan(html.indexOf('June payroll'));
  });

  it('category is editable on Imported + offers auto-categorize from the data', async () => {
    vi.stubGlobal('alert', vi.fn());
    const recat = vi.fn(() => 1);
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        { id: 't1', accountId: 'a1', date: '2026-06-10', amount: -40, description: 'SHELL OIL 123', category: 'other' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, recategorizePayee: recat })); });
    // the category cell is now a real editable select
    const select = container.querySelector('select[aria-label^="Category for"]');
    expect(select).toBeTruthy();
    expect(select.querySelector('option[value="__new__"]')).toBeTruthy(); // "+ New category" -> add more
    // the system offers to categorize what it can determine (SHELL -> fuel)
    const autoBtn = [...container.querySelectorAll('button')].find((b) => /Auto-categorize/.test(b.textContent));
    expect(autoBtn).toBeTruthy();
    await act(async () => { autoBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(recat).toHaveBeenCalledWith('SHELL OIL 123', 'fuel');
    vi.unstubAllGlobals();
  });

  it('lets the family select duplicates and combine them into one (no app update needed)', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        // Two REAL same-day/same-amount rows with no balance anchor — the auto-remover
        // leaves them alone by design; the family combines them by hand.
        { id: 'd1', accountId: 'a1', date: '2026-07-12', amount: -1.12, description: "AUNTIE ANNE'S IL131" },
        { id: 'd2', accountId: 'a1', date: '2026-07-12', amount: -1.12, description: "AUNTIE ANNE'S IL131 CHAMPAIGN IL 07/12" },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    const boxes = [...container.querySelectorAll('input[type="checkbox"][aria-label^="Select"]')];
    expect(boxes).toHaveLength(2);
    await click(boxes[0]);
    await click(boxes[1]);
    const combineBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Combine 2');
    expect(combineBtn).toBeTruthy();
    await click(combineBtn);
    // Keeps the most-complete row (d2, longer description), removes the other.
    expect(del).toHaveBeenCalledWith(['d1']);
    vi.unstubAllGlobals();
  });

  it('bulk clean-up: AI sweeps exact duplicates in one tap; unchecking a group keeps it', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        // exact dup: FIRST MID $250 minted twice on Jun 17 (identical rows)
        { id: 'fm1', accountId: 'a1', date: '2026-06-17', amount: -250, description: 'Online Payment 29483446956 To FIRST MID-ILLINOIS BANK & TRUST 06/17' },
        { id: 'fm2', accountId: 'a1', date: '2026-06-17', amount: -250, description: 'Online Payment 29483446956 To FIRST MID-ILLINOIS BANK & TRUST 06/17' },
        // exact dup: two $200 ATM withdrawals same day — the "almost ever" real case we can KEEP
        { id: 'atm1', accountId: 'a1', date: '2026-06-18', amount: -200, description: 'ATM WITHDRAWAL 007999 301 S MAT' },
        { id: 'atm2', accountId: 'a1', date: '2026-06-18', amount: -200, description: 'ATM WITHDRAWAL 007999 301 S MAT' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    // the bulk panel renders with both exact-duplicate groups
    expect(container.textContent).toContain('Clean up duplicates');
    // uncheck the ATM group (a real second withdrawal) so it is KEPT
    const atmBox = container.querySelector('input[aria-label^="Remove 1 duplicate copies of ATM WITHDRAWAL"]');
    expect(atmBox, 'each group has a keep/remove checkbox').toBeTruthy();
    expect(atmBox.checked).toBe(true); // pre-checked to remove
    await click(atmBox);               // uncheck -> keep this group
    expect(atmBox.checked).toBe(false);
    // Remove button now targets only the FIRST MID copy (1), not the kept ATM
    const removeBtn = [...container.querySelectorAll('button')].find((b) => /Remove 1 duplicate\b/.test(b.textContent));
    expect(removeBtn, 'the count reflects only the still-checked groups').toBeTruthy();
    await click(removeBtn);
    // only the still-checked (FIRST MID) copy is removed; the kept ATM copy is untouched
    expect(del).toHaveBeenCalledWith(['fm2']);
    vi.unstubAllGlobals();
  });

  it('date guard: combining rows on DIFFERENT dates warns (two paychecks a month) and does not merge when declined', async () => {
    // Two University-of-IL payroll rows, same amount, DIFFERENT dates — a salary
    // that posts twice a month. These are NOT duplicates and must not silently merge.
    const confirmSpy = vi.fn(() => false); // family reads the warning and cancels
    vi.stubGlobal('confirm', confirmSpy);
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        { id: 'p_jul01', accountId: 'a1', date: '2026-07-01', amount: 2271.97, description: 'UNIVERSITY OF IL PAYROLL' },
        { id: 'p_jul15', accountId: 'a1', date: '2026-07-15', amount: 2271.97, description: 'UNIVERSITY OF IL PAYROLL' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    const boxes = [...container.querySelectorAll('input[type="checkbox"][aria-label^="Select"]')];
    await click(boxes[0]);
    await click(boxes[1]);
    await click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Combine 2'));
    // it warned about the different dates...
    expect(confirmSpy).toHaveBeenCalled();
    expect(confirmSpy.mock.calls[0][0]).toMatch(/DIFFERENT dates/);
    expect(confirmSpy.mock.calls[0][0]).toContain('2026-07-01');
    expect(confirmSpy.mock.calls[0][0]).toContain('2026-07-15');
    // ...and because the family declined, nothing was merged
    expect(del).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('clean-up duplicates: Inspect expands INLINE to show each candidate row date + account before removing', async () => {
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        { id: 'z1', accountId: 'a1', date: '2026-07-15', amount: 50, description: 'Zelle payment from Marcus Warren' },
        { id: 'z2', accountId: 'a1', date: '2026-07-15', amount: 50, description: 'Zelle payment from Marcus Warren' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    // the consolidated bulk panel + its per-row Inspect affordance render
    expect(container.textContent).toContain('Clean up duplicates');
    const inspectBtn = [...container.querySelectorAll('button')].find((b) => /Inspect/.test(b.textContent));
    expect(inspectBtn, 'each duplicate group has an Inspect toggle').toBeTruthy();
    expect(inspectBtn.getAttribute('aria-expanded')).toBe('false');
    await click(inspectBtn);
    // expanded INLINE (DR-0201): candidate rows show their date, account, and the
    // same-date/same-amount confirmation — no jump elsewhere
    expect(inspectBtn.getAttribute('aria-expanded')).toBe('true');
    const html = container.innerHTML;
    expect(html).toContain('Chase 7206');
    expect(html).toContain('same date, amount, and account');
    vi.unstubAllGlobals();
  });

  it('top month stepper: Prev/Next re-render the same view for the adjacent month, in place', async () => {
    const { container, click } = await mount(DATA); // DATA newest month = June 2026
    // the top quick-compare stepper renders above the tiles
    const stepper = container.querySelector('[aria-label="Compare month"]');
    expect(stepper, 'a top Compare-month control renders').toBeTruthy();
    expect(container.innerHTML).toContain('In · June 2026'); // tiles labelled with the active month
    // Next -> the SAME tiles now read the next month, no navigation elsewhere
    const nextBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Next ›');
    expect(nextBtn).toBeTruthy();
    await click(nextBtn);
    expect(container.innerHTML).toContain('In · July 2026');
    expect(container.innerHTML).not.toContain('In · June 2026');
    // Prev twice -> back to May 2026
    const prevBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === '‹ Prev');
    await click(prevBtn);
    await click(prevBtn);
    expect(container.innerHTML).toContain('In · May 2026');
  });

  it('PII gate: without a profile it shows the private notice, never real rows', async () => {
    localStorage.clear();
    const { container } = await mount(DATA);
    expect(container.textContent).toContain('private to each family');
    expect(container.innerHTML).not.toContain('June payroll');
  });

  it('selecting a single account reveals a truthful running Balance column', async () => {
    const { container, click, byText } = await mount(DATA);
    await click(byText('All'));           // widen to all months
    await click(byText('Chase 7206'));    // pick one account -> Balance column
    const html = container.innerHTML;
    expect(html).toContain('Balance');
    // a1 opening 1000; oldest->newest: +500 => 1,500.00 (Jun 10), -80 => 1,420.00 (Jun 30)
    expect(html).toContain('1,500.00');
    expect(html).toContain('1,420.00');
  });

  // Darrell's Salary view: repeated payees roll up to a combined subtotal.
  const SALARY_DATA = {
    accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 0 }],
    transactions: [
      { id: 'p1', accountId: 'a1', date: '2026-06-15', amount: 2099.93, description: 'University of IL Payroll', category: 'salary' },
      { id: 'p2', accountId: 'a1', date: '2026-06-30', amount: 2099.93, description: 'University of IL Payroll', category: 'salary' },
      { id: 'p3', accountId: 'a1', date: '2026-06-28', amount: 1500, description: 'TLC Therapy', category: 'salary' },
    ],
  };

  it('Group by Payee rolls repeated payees into ONE subtotaled group, line items still visible', async () => {
    const { container, click, byText } = await mount(SALARY_DATA);
    await click(byText('Payee'));
    const html = container.innerHTML;
    expect(html).toContain('University of IL Payroll');   // the group header
    expect(html).toContain('TLC Therapy');
    expect(html).toContain('in $4,200');                  // subtotal: 2 × 2099.93 = 4199.86 -> $4,200
    expect(html).toContain('in $1,500');                  // TLC group subtotal
    expect(html).toContain('2,099.93');                   // itemized line still visible under the group
    // overall period total up top ties out (2099.93×2 + 1500 = 5699.86 -> $5,700)
    expect(html).toContain('in $5,700');
  });

  it('a group header collapses to hide its line items (subtotal stays)', async () => {
    const { container, click, byText } = await mount(SALARY_DATA);
    await click(byText('Payee'));
    const header = [...container.querySelectorAll('button')].find((b) => /University of IL Payroll/.test(b.textContent));
    await click(header);
    const html = container.innerHTML;
    expect(html).toContain('University of IL Payroll'); // header + subtotal still shown
    expect(html).toContain('in $4,200');
    expect(html).not.toContain('2,099.93');             // itemized rows hidden while collapsed
  });

  it('KPIs · Standard reports: collapsed by default, expands on tap (reclaims the top)', async () => {
    // 3 monthly same-payee outflows → a recurring pattern → the KPI panel exists.
    const RECUR = {
      accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 5000 }],
      transactions: [
        { id: 'r1', accountId: 'a1', date: '2026-05-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
        { id: 'r2', accountId: 'a1', date: '2026-06-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
        { id: 'r3', accountId: 'a1', date: '2026-07-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
      ],
    };
    localStorage.removeItem('poe.imported.reportUsage.v1'); // start with no learned usage
    const { container, click } = await mount(RECUR);
    const toggle = [...container.querySelectorAll('button')].find((b) => /Standard reports/.test(b.textContent));
    expect(toggle, 'the KPI’s · Standard reports header renders').toBeTruthy();
    // collapsed by default — the panel bodies are hidden, so they do NOT eat the top
    expect(container.innerHTML).not.toContain('your subscription audit');
    expect(container.innerHTML).not.toContain('All outputs · every expense out');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // one tap expands; with no learned usage the first standard report shows — the
    // standard income/outputs pair leads (here only outputs exist), so All outputs shows
    await click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.innerHTML).toContain('All outputs · every expense out');
    expect(container.innerHTML).toContain('key performance indicator'); // teaches the CONCEPT for learners
    // selecting the Recurring tab swaps the shown report (and records the use)
    const recurTab = [...container.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim() === 'Recurring payments');
    expect(recurTab).toBeTruthy();
    await click(recurTab);
    expect(container.innerHTML).toContain('your subscription audit');
    // the usage was learned (persisted), so Recurring now outranks Material
    const usage = JSON.parse(localStorage.getItem('poe.imported.reportUsage.v1') || '{}');
    expect(usage.recurring).toBeGreaterThanOrEqual(1);
  });

  it('KPI reports include Top categories + Top payees, computed from real spend', async () => {
    const SPEND = {
      accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 5000 }],
      transactions: [
        { id: 't1', accountId: 'a1', date: '2026-07-10', amount: -300, description: 'KROGER', category: 'groceries' },
        { id: 't2', accountId: 'a1', date: '2026-07-12', amount: -100, description: 'KROGER', category: 'groceries' },
        { id: 't3', accountId: 'a1', date: '2026-07-15', amount: -200, description: 'SHELL OIL', category: 'transportation' },
      ],
    };
    localStorage.removeItem('poe.imported.reportUsage.v1');
    const { container, click } = await mount(SPEND);
    const toggle = [...container.querySelectorAll('button')].find((b) => /Standard reports/.test(b.textContent));
    await click(toggle);
    const tabLabels = () => [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim());
    expect(tabLabels()).toContain('Top categories');
    expect(tabLabels()).toContain('Top payees');
    // Top categories — groceries is the biggest bucket ($400 of $600 spend)
    await click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === 'Top categories'));
    expect(container.innerHTML).toContain('where the money goes');
    expect(container.innerHTML).toContain('$400');
    // Top payees — KROGER paid 2× for $400
    await click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === 'Top payees'));
    expect(container.innerHTML).toContain('who you pay most');
    expect(container.innerHTML).toContain('KROGER');
    expect(container.innerHTML).toContain('2×');
  });

  it('Standard reports include All income + All outputs, each on one report with its grand total', async () => {
    // Darrell 2026-07-21: "all income on one report and all outputs etc... standard reports."
    const FLOW = {
      accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 5000 }],
      transactions: [
        { id: 'i1', accountId: 'a1', date: '2026-07-05', amount: 2000, description: 'UNIVERSITY PAYROLL', category: 'salary' },
        { id: 'i2', accountId: 'a1', date: '2026-07-20', amount: 500, description: 'TLC THERAPY', category: 'salary' },
        { id: 'e1', accountId: 'a1', date: '2026-07-10', amount: -300, description: 'KROGER', category: 'groceries' },
        { id: 'e2', accountId: 'a1', date: '2026-07-15', amount: -200, description: 'SHELL OIL', category: 'transportation' },
      ],
    };
    localStorage.removeItem('poe.imported.reportUsage.v1');
    const { container, click } = await mount(FLOW);
    const toggle = [...container.querySelectorAll('button')].find((b) => /Standard reports/.test(b.textContent));
    await click(toggle);
    const tabLabels = () => [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim());
    expect(tabLabels()).toContain('All income');
    expect(tabLabels()).toContain('All outputs');
    // All income — $2,500 in, with the grand total line
    await click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === 'All income'));
    expect(container.innerHTML).toContain('every source in');
    expect(container.innerHTML).toContain('Total income');
    expect(container.innerHTML).toContain('$2,500');
    // All outputs — $500 out ($300 + $200), with the grand total line
    await click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === 'All outputs'));
    expect(container.innerHTML).toContain('every expense out');
    expect(container.innerHTML).toContain('Total outputs');
    expect(container.innerHTML).toContain('$500');
  });

  it('Recurring payments IS the subscription audit — Cancel flags the pattern + totals savings, persisted', async () => {
    const RECUR = {
      accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 5000 }],
      transactions: [
        { id: 'r1', accountId: 'a1', date: '2026-05-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
        { id: 'r2', accountId: 'a1', date: '2026-06-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
        { id: 'r3', accountId: 'a1', date: '2026-07-15', amount: -2623, description: 'WF HOME MTG AUTO PAY 0511', category: 'housing' },
      ],
    };
    localStorage.removeItem('poe.imported.reportUsage.v1');
    localStorage.removeItem('poe.imported.recurringDecisions.v1');
    const { container, click } = await mount(RECUR);
    await click([...container.querySelectorAll('button')].find((b) => /Standard reports/.test(b.textContent)));
    await click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === 'Recurring payments'));
    expect(container.innerHTML).toContain('your subscription audit');
    // before any decision: no "flagged" savings line
    expect(container.innerHTML).not.toContain('to review/cut');
    // Cancel the pattern → it's flagged and its amount totals the potential savings
    const cancelBtn = [...container.querySelectorAll('button')].find((b) => /^Cancel /.test(b.getAttribute('aria-label') || ''));
    expect(cancelBtn, 'each pattern has a Cancel control (the audit)').toBeTruthy();
    await click(cancelBtn);
    expect(container.innerHTML).toContain('1 flagged');
    expect(container.innerHTML).toContain('to review/cut');
    // persisted device-local, so it survives a reload
    const saved = JSON.parse(localStorage.getItem('poe.imported.recurringDecisions.v1') || '{}');
    expect(Object.values(saved)).toContain('cancel');
  });

  it('merge UX: the Combine bar floats into view (not stuck at top) + selected rows show full text', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        { id: 'p1', accountId: 'a1', date: '2026-07-01', amount: -2271.97, description: 'UNIVERSITY OF IL PAYROLL PPD ID: 137600051' },
        { id: 'p2', accountId: 'a1', date: '2026-07-01', amount: -2271.97, description: 'UNIVERSITY OF IL PAYROLL PPD ID: 137600051 CHAMPAIGN IL 07/01' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    const boxes = [...container.querySelectorAll('input[type="checkbox"][aria-label^="Select"]')];
    await click(boxes[0]);
    // one selected → its description cell is un-truncated (full PPD text visible to verify)
    const cellClass = [...container.querySelectorAll('td')].find((td) => /PPD ID: 137600051/.test(td.textContent))?.className || '';
    expect(cellClass).toContain('whitespace-normal'); // full text, not truncate
    expect(cellClass).not.toContain('truncate');
    await click(boxes[1]);
    // the combine action bar floats (fixed) into view rather than sitting at the top of the page
    const bar = container.querySelector('[aria-label="Combine selected transactions"]');
    expect(bar, 'the floating Combine bar renders when 2+ selected').toBeTruthy();
    expect(bar.className).toContain('fixed');
    await click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Combine 2'));
    expect(del).toHaveBeenCalledWith(['p1']); // keeps the fullest, removes the other
    vi.unstubAllGlobals();
  });
});

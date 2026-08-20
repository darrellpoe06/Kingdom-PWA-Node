// @vitest-environment jsdom
//
// FamilyPlan — live render proof for the Books → Plan tab (Christina
// 2026-08-19: "I want Darrell to clearly see everything I showed in these
// spreadsheets"). Mounts the REAL component with the supabase client mocked at
// the module seam, in the three states the surface can be in: a plan row
// (narrative + tables render with the workbook's own numbers), no row (honest
// empty state), and a fetch error (named, not blank). DR-0061 — observe the
// surface, don't assume it.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The chainable stub: from().select().order().limit() resolving to whatever the
// test arms. Mocked BEFORE the component import so its module-level client is
// this one.
const armed = { data: [], error: null };
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: armed.data, error: armed.error }),
        }),
      }),
    }),
  },
}));

import FamilyPlan from '../components/FamilyPlan.jsx';

const PLAN_ROW = {
  title: 'Poe Family Financial Plan - August 2026',
  updated_at: '2026-08-19T05:01:22Z',
  plan: {
    version: 1,
    preparedBy: 'Christina',
    sources: ['Poe Master Budget workbook (7 sheets)'],
    narrative: {
      title: 'POE FAMILY FINANCIAL PLAN',
      subtitle: 'Current Reconciled Recurring Bills and Family Financial Strategy - August 2026',
      whatIsGoingOn: 'We currently have $25,000 in cash that came from money Christy received from her accident.',
      monthlyPicture: [{ item: 'Cash being held for family stewardship', amount: '$25,000' }],
      goals: ['Keep the $25,000 from disappearing into ordinary spending.'],
      bottomLine: 'BOTTOM LINE: The $25,000 gives us breathing room.',
      oneMonthAhead: ['Part of the plan is to intentionally use enough of the available cash.'],
    },
    dashboard: { metrics: [{ metric: 'Operating cash', amount: 25000 }], reconciled: [], system: '' },
    debtTracker: [
      { debt: 'Christina Capital One', balance: 1550, apr: 28.99, payment: 79, priority: 'High interest', payoff: 'Apr 2028', note: '' },
      { debt: 'Elan business card', balance: null, apr: null, payment: 227, priority: 'Business card', payoff: null, note: 'Balance not yet supplied' },
    ],
    monthlyBudget: {
      income: [{ item: 'Rental income', amount: 11700, priority: 'Core', note: '' }],
      housing: [], debtPayments: [], reconciledNotDoubleCounted: [],
      totals: { incomeLow: 26628.72, knownMonthlyOutflow: 20279.14, cashLeftLow: 6349.58 },
    },
    cashPlan: [{ item: 'Danville Sanitary', amount: 819, timing: 'ASAP', strategy: 'Catch up', note: 'Corrected to $819' }],
    payoffSchedule: [{ month: 'Sep 2026', bgPayment: 1500, bgPriorityBalance: 26500, chasePayment: 900, chaseBalance: 29700 }],
    billCalendar: {
      dated: [{ day: 16, payee: 'Wells Fargo Mortgage', amount: 2622.83, note: 'Personal mortgage' }],
      dailyTotals: [{ day: 16, total: 3435.49 }],
      datedBillsTotal: 11360.19,
      stillToPlace: [{ item: 'Tithe', amount: 1100, treatment: 'Monthly' }],
      pastDue: [{ item: 'Danville Sanitary', amount: 819, status: 'Past due' }],
      mortgageTreatment: [],
      workingMonthlyOutflow: 21110.19,
    },
  },
};

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(FamilyPlan));
  });
  return container;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  container = root = null;
  armed.data = []; armed.error = null;
});

describe('FamilyPlan (Books → Plan)', () => {
  it('renders the narrative wording AND the worksheet numbers from the plan row', async () => {
    armed.data = [PLAN_ROW];
    const c = await mount();
    const t = c.textContent;
    // Her wording leads
    expect(t).toContain('POE FAMILY FINANCIAL PLAN');
    expect(t).toContain('money Christy received from her accident');
    expect(t).toContain('BOTTOM LINE');
    // The worksheets are on screen with their real numbers
    expect(t).toContain('Christina Capital One');
    expect(t).toContain('28.99%');
    expect(t).toContain('$2,622.83');           // Wells Fargo dated bill
    expect(t).toContain('$21,110.19');          // working monthly outflow
    expect(t).toContain('$26,628.72');          // income low total
    // A blank in the workbook stays a dash, never a painted zero (DR-0076)
    const elanRow = [...c.querySelectorAll('tr')].find((r) => /Elan business card/.test(r.textContent));
    expect(elanRow.textContent).toContain('—');
    expect(elanRow.textContent).not.toContain('$0');
  });

  // Darrell 2026-08-20, reading the live tracker: "where are the total amount
  // of money and timelines for each debt?!" The totals were nowhere and the
  // payoff column sat off the right edge of a narrow screen with no cue.
  it('sums the debt tracker into a Total row — numeric rows only, never a painted $0', async () => {
    armed.data = [PLAN_ROW];
    const c = await mount();
    const debtTable = [...c.querySelectorAll('table')].find((t) => /Christina Capital One/.test(t.textContent));
    const totalRow = debtTable.querySelector('tfoot tr');
    expect(totalRow.textContent).toContain('Total');
    // Balance: 1550 + null → only the numeric row sums
    expect(totalRow.textContent).toContain('$1,550');
    // Planned/mo: 79 + 227
    expect(totalRow.textContent).toContain('$306');
    // APR is a rate — never summed into a fake number
    expect(totalRow.textContent).not.toContain('%');
  });

  it('puts each debt timeline beside its balance, ahead of the APR', async () => {
    armed.data = [PLAN_ROW];
    const c = await mount();
    const debtTable = [...c.querySelectorAll('table')].find((t) => /Christina Capital One/.test(t.textContent));
    expect(debtTable.textContent).toContain('Apr 2028');
    const headers = [...debtTable.querySelectorAll('th')].map((th) => th.textContent);
    expect(headers.findIndex((h) => /Payoff/i.test(h))).toBeLessThan(headers.findIndex((h) => /APR/i.test(h)));
  });

  it('a wide table names that it scrolls sideways on a narrow screen', async () => {
    armed.data = [PLAN_ROW];
    const c = await mount();
    expect(c.textContent).toContain('swipe the table sideways');
  });

  it('shows the honest empty state when no plan row exists', async () => {
    armed.data = [];
    const c = await mount();
    expect(c.textContent).toContain('No plan has been published');
  });

  it('names a load failure instead of rendering blank', async () => {
    armed.error = { message: 'network sad' };
    const c = await mount();
    expect(c.textContent).toContain('could not be loaded');
    expect(c.textContent).toContain('network sad');
  });
});

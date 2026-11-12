// =============================================================================
// PaymentsLedgerPanel + fromTableRow — brick three proven (DR-0230, DR-0076):
// the read path is the exact inverse of the write path, and every one of the
// panel's three honest states renders as itself — nothing painted.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { fromTableRow, normalizePayment, yearSummary } from '../lib/payments-ledger.js';
import { toTableRow } from '../../functions/api/stripe-webhook.js';
import PaymentsLedgerPanel from '../components/PaymentsLedgerPanel.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => ({ supabase: {} }));

const engineRow = () => normalizePayment({
  id: 'evt_1', created: 1784592000,
  data: { object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid', amount_total: 12500, currency: 'usd', metadata: { product: 'moore-order' }, customer_details: { email: 'a@b.c' } } },
}, { feeCents: 393 });

describe('fromTableRow — the read path inverts the write path exactly', () => {
  it('round-trips engine -> table -> engine losslessly', () => {
    const row = engineRow();
    expect(fromTableRow(toTableRow(row, {}))).toEqual(row);
  });

  it('degrades an empty DB row to the same honest defaults', () => {
    const r = fromTableRow({});
    expect(r.status).toBe('pending');
    expect(r.entityId).toBe('unassigned');
    expect(r.amountCents).toBe(0);
    expect(r.occurredAtIso).toBeNull();
  });
});

const ENTITIES = [{ id: 'e-moore', name: 'Moore Divahs' }];

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(PaymentsLedgerPanel, props)); });
  await act(async () => {}); // let the fetchRows promise settle
  return { container, cleanup: () => { act(() => root.unmount()); container.remove(); } };
}

describe('PaymentsLedgerPanel — three honest states', () => {
  it('says the table is not reachable when the ledger is unavailable', async () => {
    const { container, cleanup } = await mount({ entities: ENTITIES, fetchRows: async () => ({ state: 'unavailable', rows: [] }) });
    expect(container.textContent).toContain("isn't reachable yet");
    expect(container.textContent).toContain("Governor's hand");
    cleanup();
  });

  it('says no payments yet when the table is empty', async () => {
    const { container, cleanup } = await mount({ entities: ENTITIES, fetchRows: async () => ({ state: 'ok', rows: [] }) });
    expect(container.textContent).toContain('No payments recorded yet');
    cleanup();
  });

  it('renders the per-entity year summary + rows from real ledger rows', async () => {
    const rows = [engineRow()];
    const { container, cleanup } = await mount({ entities: ENTITIES, year: 2026, fetchRows: async () => ({ state: 'ok', rows }) });
    expect(container.textContent).toContain('Moore Divahs · 2026');
    const s = yearSummary(rows, 2026)['e-moore'];
    expect(s.netCents).toBe(12107);
    expect(container.textContent).toContain('$121.07'); // net — the same truth yearSummary computes
    expect(container.textContent).toContain('$125.00'); // gross
    expect(container.textContent).toContain('$3.93');   // fee
    cleanup();
  });
});

// =============================================================================
// AND A FOURTH STATE: QUIET (2026-11-12)
// =============================================================================
// Found by generalising the defect Darrell caught on the work-order board the
// same day -- "I can see all this as a new person with no record?!" -- and
// asking where else a surface read his own rows while claiming otherwise.
//
// BooksTaxes gets `demo = isAnyDemoMode || reviewerMode || isIsolatedPreview()`
// (poe-financial-mvp-v28.jsx), honours it for its own archive read, and renders
// a notice that names "tax returns and PAYMENTS" -- then mounted this panel
// with no `demo`, so it read the live `payments` table underneath that notice.
// The Money tab is ungated in nav-items.jsx, so Money -> Taxes was reachable,
// with real money on it, in sample mode, in the isolated preview and under
// BOTH reviewer lenses.
//
// Nothing was exposed: RLS scopes `payments` to the steward, and under the lens
// he is still signed in as himself, so the rows were his. The defect is that
// the SURFACE was wrong about what it was showing -- and a reviewer lens that
// under-hides is worse than none, because it is the one instrument he has for
// the question "what am I exposing?" and it answers wrongly with confidence.
//
// Three properties, one per case: it does not SHOW, it does not even ASK, and
// it SAYS which quiet it is in -- the lens line names his own rows being
// withheld from him, not a database refusal that is not happening.
describe('quiet where its parent is quiet — it never reads the live ledger under a sample notice', () => {
  it('shows no payment rows when the parent surface is in sample mode', async () => {
    const { container, cleanup } = await mount({
      entities: ENTITIES, year: 2026, demo: true, stranger: false,
      fetchRows: async () => ({ state: 'ok', rows: [engineRow()] }),
    });
    expect(container.textContent, 'a real payment reached a sample surface').not.toContain('$125.00');
    expect(container.textContent).not.toContain('Moore Divahs · 2026');
    expect(container.querySelector('[data-testid="payments-ledger-sample"]')).toBeTruthy();
    cleanup();
  });

  it('shows no payment rows under the stranger lens, and says whose they are', async () => {
    const { container, cleanup } = await mount({
      entities: ENTITIES, year: 2026, stranger: true,
      fetchRows: async () => ({ state: 'ok', rows: [engineRow()] }),
    });
    expect(container.textContent, 'a real payment reached a lens promising a stranger').not.toContain('$125.00');
    const line = container.querySelector('[data-testid="payments-reviewer-lens"]');
    expect(line, 'the ledger went quiet without saying why (DR-0381)').toBeTruthy();
    expect(line.textContent).toMatch(/your own payments are hidden here/i);
    expect(line.textContent).toMatch(/no invite/i);
    // It must NOT blame the database: under this lens he IS the steward and
    // RLS would hand him these rows. Saying otherwise would teach him to trust
    // a wall that is not there.
    expect(line.textContent).not.toMatch(/database refuses/i);
    cleanup();
  });

  it('does not even ASK for the rows in either quiet state', async () => {
    let asked = 0;
    const counting = async () => { asked += 1; return { state: 'ok', rows: [engineRow()] }; };
    const a = await mount({ entities: ENTITIES, demo: true, stranger: false, fetchRows: counting });
    a.cleanup();
    const b = await mount({ entities: ENTITIES, stranger: true, fetchRows: counting });
    b.cleanup();
    expect(asked, 'the quiet ledger still pulled real payments from the database').toBe(0);
    // ANTI-VACUITY: the same mount with neither quiet DOES ask, so the case
    // above cannot pass on a panel that simply never reads.
    const c = await mount({ entities: ENTITIES, demo: false, stranger: false, fetchRows: counting });
    c.cleanup();
    expect(asked, 'the panel stopped reading the ledger for everyone').toBe(1);
  });
});

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

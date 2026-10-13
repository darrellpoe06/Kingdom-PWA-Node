// @vitest-environment jsdom
//
// ReportActions render — mount the shared export toolbar and prove the buttons
// actually export: CSV downloads a .csv of the current view, Print opens a window
// (falling back to an .html download when the popup is blocked), and a preset in
// the Reports menu builds + downloads its own report. Deterministic wiring, no LLM.
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ReportActions from '../components/ReportActions.jsx';

const MODEL = {
  title: 'T', meta: [], columns: [{ key: 'amount', label: 'Amount', type: 'money' }],
  groups: [{ label: 'G', rows: [{ amount: 10 }], subtotal: { in: 10, out: 0, net: 10, count: 1 } }],
  total: { in: 10, out: 0, net: 10, count: 1 },
};

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(ReportActions, props)); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const byText = (t) => [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === t);
  const byAria = (a) => [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === a);
  return { container, click, byText, byAria };
}

let downloads;
beforeEach(() => {
  downloads = [];
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  window.open = () => null; // simulate a blocked popup -> printReport falls back to .html download
});

describe('ReportActions — shared export toolbar (real mount)', () => {
  it('renders CSV + Print for the current view', async () => {
    const { byText } = await mount({ buildModel: () => MODEL, filenameBase: 'imported-transactions' });
    expect(byText('↓ CSV')).toBeTruthy();
    expect(byText('Print / PDF')).toBeTruthy();
  });

  it('CSV downloads a .csv of the current view', async () => {
    const { click, byText } = await mount({ buildModel: () => MODEL, filenameBase: 'imported-transactions' });
    await click(byText('↓ CSV'));
    expect(downloads).toContain('imported-transactions.csv');
  });

  it('Print falls back to an .html download when the popup is blocked (report never lost)', async () => {
    const { click, byText } = await mount({ buildModel: () => MODEL, filenameBase: 'imported-transactions' });
    await click(byText('Print / PDF'));
    expect(downloads).toContain('imported-transactions.html');
  });

  it('a preset in the Reports menu builds + downloads its own report', async () => {
    const presets = [{ key: '1099', label: '1099 summary', filenameBase: '1099-summary', buildModel: () => MODEL }];
    const { click, byText, byAria } = await mount({ buildModel: () => MODEL, presets });
    await click(byText('Reports ▾'));
    await click(byAria('Download 1099 summary as CSV'));
    expect(downloads).toContain('1099-summary.csv');
  });

  it('a KPI preset offers VIEW (see it on screen, no download) alongside CSV/PRINT', async () => {
    const viewed = [];
    const presets = [{ key: 'kpi-material', kpi: true, label: 'Material changes', hint: 'movers', buildModel: () => MODEL }];
    const { click, byText, byAria } = await mount({ buildModel: () => MODEL, presets, onView: (k) => viewed.push(k) });
    await click(byText('Reports ▾'));
    const viewBtn = byAria('View Material changes on screen');
    expect(viewBtn, 'KPI presets get a View action').toBeTruthy();
    expect(byAria('Download Material changes as CSV'), 'CSV stays as the option').toBeTruthy(); // download still offered
    await click(viewBtn);
    expect(viewed).toEqual(['kpi-material']);      // View opens it on screen; nothing downloaded
    expect(downloads).toEqual([]);
  });

  it('a non-KPI (standard export) preset has no View action — download only', async () => {
    const presets = [{ key: 'monthly', label: 'Monthly summary', filenameBase: 'monthly', buildModel: () => MODEL }];
    const { click, byText, byAria } = await mount({ buildModel: () => MODEL, presets, onView: () => {} });
    await click(byText('Reports ▾'));
    expect(byAria('View Monthly summary on screen')).toBeFalsy();
  });
});

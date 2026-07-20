// @vitest-environment jsdom
//
// DataIntegrityReport — mount the real report and prove it renders the ledger's
// real numbers (coverage, clean, open findings) and never crashes on the empty
// ledger. Observe the surface, not just the lib (Verification Doctrine §7).
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import DataIntegrityReport from '../components/DataIntegrityReport.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(DataIntegrityReport, props)); });
  return container;
}

describe('DataIntegrityReport (real mount)', () => {
  it('renders coverage, clean, and open-findings from a supplied ledger', async () => {
    const audit = {
      updatedAt: '2026-07-20',
      areas: [
        { id: 'a', label: 'Alpha area', files: ['A.jsx'], verdict: 'clean', high: 0, med: 0, low: 0 },
        { id: 'b', label: 'Bravo area', files: ['B.jsx'], verdict: 'findings', high: 1, med: 0, low: 2, note: 'a real seam' },
        { id: 'c', label: 'Charlie area', files: ['C.jsx'], verdict: 'pending', high: 0, med: 0, low: 0 },
      ],
      history: [{ date: '2026-07-20', areasAudited: 2, areasClean: 1, openHigh: 1, openMed: 0, openLow: 2 }],
    };
    const html = (await mount({ audit })).innerHTML;
    expect(html).toContain('Data integrity');
    expect(html).toContain('2/3');           // coverage: 2 audited of 3
    expect(html).toContain('Alpha area');
    expect(html).toContain('Bravo area');
    expect(html).toContain('a real seam');   // the finding note surfaces
    expect(html).toContain('Baseline');      // single history point → baseline trend
  });

  it('does not crash on an empty ledger (honest zero state)', async () => {
    const html = (await mount({ audit: { areas: [], history: [] } })).innerHTML;
    expect(html).toContain('Data integrity');
    expect(html).toContain('0/0');
  });
});

// @vitest-environment jsdom
//
// BooksTaxes — render proof for Books → Taxes (Reality-Trace / DR-0076 §7:
// observe the real surface). Proves: the empty state teaches the sovereign
// how-to (no painted data); a real archive renders per-year documents with a
// printable link to the ORIGINAL; the year-over-year strategy table shows
// verified figures and marks a figureless year `pending`, never invented.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { __setTaxFetcher } from '../lib/tax-archive.js';
import BooksTaxes from '../components/BooksTaxes.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); __setTaxFetcher(null); });

const archive = (documents) => { __setTaxFetcher(async () => ({ ok: true, json: async () => ({ documents }) })); };
const mount = async (props = {}) => { await act(async () => { root.render(createElement(BooksTaxes, props)); }); await act(async () => {}); };

describe('BooksTaxes', () => {
  it('empty archive → teaches the sovereign how-to, no painted numbers', async () => {
    archive([]);
    await mount();
    expect(container.textContent).toMatch(/No returns indexed yet/i);
    expect(container.textContent).toMatch(/tax_ingest\.py/);
    expect(container.textContent).not.toMatch(/\$\d/); // nothing invented
  });

  it('renders per-year documents with an Open/print link to the original', async () => {
    archive([
      { id: 't1', year: 2024, entityId: 'e1', kind: 'return', filename: '2024-1040.pdf', storageRef: '/taxes/files/e1/2024/2024-1040.pdf', figures: { agi: 98000, totalTax: 13500 } },
      { id: 't2', year: 2023, entityId: 'e1', kind: 'w2', filename: '2023-w2.pdf', storageRef: '/taxes/files/e1/2023/2023-w2.pdf' },
    ]);
    await mount({ entities: [{ id: 'e1', name: 'Poe Family' }] });
    expect(container.textContent).toMatch(/2024/);
    expect(container.textContent).toMatch(/2024-1040\.pdf/);
    expect(container.textContent).toMatch(/Poe Family/);
    const link = [...container.querySelectorAll('a')].find((a) => /open\s*\/\s*print/i.test(a.textContent || ''));
    expect(link, 'the original is printable via a link').toBeTruthy();
    expect(link.getAttribute('href')).toBe('/taxes/files/e1/2024/2024-1040.pdf');
  });

  it('offers an in-app upload form (Christina never touches Synology), disabled until valid', async () => {
    archive([]);
    await mount({ entities: [{ id: 'e1', name: 'Poe Family' }] });
    expect(container.textContent).toMatch(/Upload a return/i);
    expect(container.querySelector('#tax-file')).toBeTruthy();      // PDF picker
    expect(container.querySelector('#tax-entity')).toBeTruthy();    // entity select
    expect(container.querySelector('#tax-year')).toBeTruthy();      // year
    const btn = [...container.querySelectorAll('button')].find((b) => /upload to my nas/i.test(b.textContent || ''));
    expect(btn, 'the upload button renders').toBeTruthy();
    expect(btn.disabled).toBe(true);                                // nothing chosen yet
  });

  it('strategy table shows verified figures and marks a figureless year pending', async () => {
    archive([
      { id: 't1', year: 2023, entityId: 'e1', kind: 'return', filename: 'a.pdf', figures: { agi: 90000 } },
      { id: 't2', year: 2024, entityId: 'e1', kind: 'return', filename: 'b.pdf' }, // no figures
    ]);
    await mount();
    expect(container.textContent).toMatch(/the strategy view/i);
    expect(container.textContent).toMatch(/\$90,000/);
    expect(container.textContent).toMatch(/pending/i); // 2024 has no verified figures
  });
});

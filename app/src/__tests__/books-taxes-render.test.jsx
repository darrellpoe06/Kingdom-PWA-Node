// @vitest-environment jsdom
//
// BooksTaxes — render proof for Books → Taxes (Reality-Trace / DR-0076 §7:
// observe the real surface). Proves: the empty state teaches the sovereign
// how-to (no painted data); a real archive renders per-year documents with a
// printable link to the ORIGINAL; the year-over-year strategy table shows
// verified figures and marks a figureless year `pending`, never invented.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The device's family key: provisioning is mocked so the test decides whether
// this device holds the key, asks and receives it, or asks and is refused.
let keyHeld = false;
let provisionAnswer = 'none';
const provisionCalls = [];
let tokenCleared = 0;
vi.mock('../lib/nas-photos.js', () => ({ hasBridgeToken: () => keyHeld, setBridgeToken: (v) => { if (!v) { keyHeld = false; tokenCleared += 1; } } }));
vi.mock('../lib/bridge-provision.js', () => ({
  provisionBridgeToken: async (client) => { provisionCalls.push(client); if (provisionAnswer === 'provisioned') keyHeld = true; return provisionAnswer; },
}));
vi.mock('../lib/supabase.js', () => ({ supabase: { rpc: async () => ({ data: null, error: null }) } }));
vi.mock('../lib/bridge-auth.js', () => ({ resolveBridgeBearer: () => (keyHeld ? 'tok-family' : null) }));
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { __setTaxFetcher } from '../lib/tax-archive.js';
import { __setUploadFetcher } from '../lib/tax-upload.js';
import BooksTaxes from '../components/BooksTaxes.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); __setTaxFetcher(null); __setUploadFetcher(null); });

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

  it('offers an in-app upload form (Christina never touches Synology), marked not-ready until valid', async () => {
    archive([]);
    await mount({ entities: [{ id: 'e1', name: 'Poe Family' }] });
    expect(container.textContent).toMatch(/Upload a return/i);
    expect(container.querySelector('#tax-file')).toBeTruthy();      // PDF picker
    expect(container.querySelector('#tax-entity')).toBeTruthy();    // entity select
    expect(container.querySelector('#tax-year')).toBeTruthy();      // year
    const btn = [...container.querySelectorAll('button')].find((b) => /upload to my nas/i.test(b.textContent || ''));
    expect(btn, 'the upload button renders').toBeTruthy();
    // Not ready, but never silently disabled (DR-0708): pressing it must be
    // able to say why.
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.disabled).toBe(false);
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

  // ── THE DEVICE ASKS FOR ITS OWN KEY (2026-09-23) ─────────────────────────
  it('a device without the family key ASKS for it on mount, and says so when refused', async () => {
    keyHeld = false; provisionAnswer = 'none'; provisionCalls.length = 0;
    archive([]);
    await mount({ entities: [{ id: 'e1', name: 'Poe Family' }] });
    await act(async () => { await Promise.resolve(); });
    expect(provisionCalls.length, 'the device asked the family for its key on mount').toBe(1);
    const line = container.querySelector('[data-testid="tax-device-key"]');
    expect(line.textContent).toMatch(/no family key yet/i);
    expect(line.textContent).toMatch(/Real Estate → Photos/);
  });

  it('a device that holds the key says uploads go straight to the NAS, and does not ask again', async () => {
    keyHeld = true; provisionAnswer = 'none'; provisionCalls.length = 0;
    archive([]);
    await mount();
    await act(async () => { await Promise.resolve(); });
    expect(provisionCalls.length).toBe(0);
    expect(container.querySelector('[data-testid="tax-device-key"]').textContent).toMatch(/holds the family key/i);
  });

  it('a device that asks and RECEIVES the key says so', async () => {
    keyHeld = false; provisionAnswer = 'provisioned'; provisionCalls.length = 0;
    archive([]);
    await mount();
    await act(async () => { await Promise.resolve(); });
    expect(container.querySelector('[data-testid="tax-device-key"]').textContent).toMatch(/just received the family key/i);
  });

  it('the empty state leads with the in-app upload; the by-hand route is folded away, not gone', async () => {
    keyHeld = true; archive([]);
    await mount();
    expect(container.textContent).toMatch(/Upload a return above/i);
    expect(container.querySelector('details summary').textContent).toMatch(/By hand instead/i);
    expect(container.textContent).toMatch(/tax_ingest\.py/);
  });

  it('documents are shelved by entity as well as by year — each business and each person', async () => {
    keyHeld = true;
    archive([
      { id: 't1', year: 2024, entityId: 'e1', kind: 'return', filename: 'a.pdf' },
      { id: 't2', year: 2024, entityId: 'llc', kind: 'k1', filename: 'b.pdf' },
      { id: 't3', year: 2023, entityId: 'llc', kind: 'return', filename: 'c.pdf' },
    ]);
    await mount({ entities: [{ id: 'e1', name: 'Poe Family' }, { id: 'llc', name: 'Poe Holdings LLC' }] });
    const shelf = container.querySelector('[data-testid="tax-by-entity"]');
    expect(shelf.textContent).toMatch(/Poe Holdings LLC · 2 documents/);
    expect(shelf.textContent).toMatch(/Poe Family · 1 document\b/);
  });

  // ── DR-0708: CHRISTINA'S "UPLOAD TO MY NAS" DID NOTHING (2026-09-30) ─────
  const fill = async ({ file, entity = 'e-personal', year = '2024' } = {}) => {
    const sel = container.querySelector('#tax-entity');
    const yr = container.querySelector('#tax-year');
    const inp = container.querySelector('#tax-file');
    const setVal = (el, v) => {
      const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    };
    await act(async () => { setVal(sel, entity); sel.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => { setVal(yr, year); yr.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { Object.defineProperty(inp, 'files', { value: [file], configurable: true }); inp.dispatchEvent(new Event('change', { bubbles: true })); });
  };
  const bigPdf = () => { const f = new File([new Uint8Array(8)], 'Taxes 2024.pdf', { type: 'application/pdf' }); Object.defineProperty(f, 'size', { value: 71.4 * 1024 * 1024 }); return f; };
  const smallPdf = () => new File([new Uint8Array(8)], 'Taxes 2024.pdf', { type: 'application/pdf' });
  const press = async () => {
    const btn = [...container.querySelectorAll('button')].find((b) => /upload to my nas/i.test(b.textContent || ''));
    await act(async () => { btn.click(); });
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });
  };
  const ents = [{ id: 'e-personal', name: 'Personal (Darrell + Christina)' }];

  it('a filled form whose PDF is too large says so in words, before and on pressing (the old button went grey and said nothing)', async () => {
    keyHeld = true; archive([]);
    let posted = 0; __setUploadFetcher(async () => { posted += 1; return { ok: true, json: async () => ({}) }; });
    await mount({ entities: ents });
    await fill({ file: bigPdf() });
    expect(container.querySelector('[data-testid="tax-upload-blockers"]').textContent).toMatch(/71\.4 MB.*up to 60 MB/);
    await press();
    const notice = container.querySelector('[data-testid="tax-upload-notice"]');
    expect(notice, 'pressing the button always answers').toBeTruthy();
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.textContent).toMatch(/71\.4 MB/);
    expect(posted, 'nothing is sent for a file the NAS would refuse').toBe(0);
  });

  it('a key the NAS refuses is fetched again from the family once, and the upload retried and filed', async () => {
    keyHeld = true; provisionAnswer = 'provisioned'; provisionCalls.length = 0; tokenCleared = 0; archive([]);
    const auth = [];
    __setUploadFetcher(async (url, init) => {
      auth.push(init.headers.authorization || '');
      if (auth.length === 1) return { ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) };
      return { ok: true, json: async () => ({ archive: { documents: [{ id: 'd1', year: 2024, entityId: 'e-personal', kind: 'return', filename: 'Taxes-2024.pdf', storageRef: '/taxes/files/e-personal/2024/Taxes-2024.pdf' }] } }) };
    });
    await mount({ entities: ents });
    await fill({ file: smallPdf() });
    await press();
    expect(auth.length, 'posted twice: the refused key, then the fresh one').toBe(2);
    expect(tokenCleared).toBe(1);
    expect(provisionCalls.length).toBeGreaterThanOrEqual(1);
    const notice = container.querySelector('[data-testid="tax-upload-notice"]');
    expect(notice.getAttribute('data-tone')).toBe('ok');
    expect(container.textContent).toMatch(/Taxes-2024\.pdf/);
  });

  it('a refusal after the fresh key names the key mismatch, as an alert, never as success', async () => {
    keyHeld = true; provisionAnswer = 'provisioned'; archive([]);
    __setUploadFetcher(async () => ({ ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) }));
    await mount({ entities: ents });
    await fill({ file: smallPdf() });
    await press();
    const notice = container.querySelector('[data-testid="tax-upload-notice"]');
    expect(notice.getAttribute('data-tone')).toBe('error');
    expect(notice.textContent).toMatch(/key the family publishes and the key on the NAS differ/);
  });
});

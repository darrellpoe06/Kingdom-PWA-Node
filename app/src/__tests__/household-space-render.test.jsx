// =============================================================================
// HouseholdSpace (DR-0357): the REAL component, the seams stubbed. The record
// opens and starts itself, a cell saves as a patch, the covenant signs through
// the household's own writer and turns into a green check, the shelf refuses a
// document that is nowhere and files one that is somewhere, and the findings
// say nothing honest-ly when there are no rows. DR-0076: the stubs record what
// was sent.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const sent = { patches: [], acks: [], saved: [], shared: [], removed: [] };
let record = {};
let myRole = 'owner';
let documents = [];

vi.mock('../lib/household-sync.js', async (orig) => {
  const real = await orig();
  const view = () => ({ recordId: 'hr1', instanceId: 'i-fam', householdName: 'The Poe household', record, myRole, updatedAt: '2026-09-11T00:00:00Z' });
  return {
    ...real,
    readHousehold: async () => ({ ok: true, view: view() }),
    patchHousehold: async (patch, note) => { sent.patches.push({ patch, note }); record = { ...record, ...patch }; return { ok: true, view: view() }; },
    acknowledgeHouseholdDocument: async (key, args) => {
      sent.acks.push({ key, ...args });
      record = { ...record, acknowledgments: { ...(record.acknowledgments || {}), [key]: { agreed: true, signature: args.signature, signedOn: '2026-09-11', docVersion: args.docVersion, attestation: args.attestation, agreedAt: args.agreedAt, signedAtServer: '2026-09-11T12:00:02.000Z' } } };
      return { ok: true, view: view() };
    },
  };
});
vi.mock('../lib/family-vault-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    listDocuments: async () => ({ ok: true, rows: documents }),
    saveDocument: async (doc) => { sent.saved.push(doc); const row = { ...doc, id: `d${sent.saved.length}`, instanceId: 'i-fam', sharedWithHousehold: doc.sharedWithHousehold === true }; documents = [...documents, row]; return { ok: true, row }; },
    shareDocument: async (id, shared) => { sent.shared.push({ id, shared }); return { ok: true, row: { id } }; },
    removeDocument: async (row) => { sent.removed.push(row.id); documents = documents.filter((d) => d.id !== row.id); return { ok: true, removed: true }; },
    uploadDocumentFile: async ({ slug }) => ({ ok: true, pointer: { storagePath: `u1/${slug}.pdf`, fileName: 'deed.pdf', fileSize: 2048 } }),
    signedDocumentUrl: async () => 'https://signed.example/x',
  };
});
vi.mock('../lib/product-forms-sync.js', async (orig) => {
  const real = await orig();
  const { originalProduct } = await import('../lib/product-forms.js');
  return { ...real, readProductForms: async (product) => ({ ok: true, resolved: originalProduct(product), instanceId: 'i-fam' }) };
});

import HouseholdSpace from '../components/HouseholdSpace.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount(el) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(el); }); }
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const byText = (re, tag = 'button') => Array.from(container.querySelectorAll(tag)).find((b) => re.test(b.textContent));
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (el, value) => act(async () => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const area = async (re) => { const t = Array.from(container.querySelectorAll('[role="tablist"][aria-label="Household areas"] [role="tab"]')).find((x) => re.test(x.textContent)); expect(t, String(re)).toBeTruthy(); await click(t); await settle(); };

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = container = null;
  sent.patches.length = 0; sent.acks.length = 0; sent.saved.length = 0; sent.shared.length = 0; sent.removed.length = 0;
  record = {}; myRole = 'owner'; documents = [];
});

describe('the household record', () => {
  it('opens on the record, counts honestly, and offers the export', async () => {
    await mount(createElement(HouseholdSpace));
    await settle();
    expect(container.textContent).toContain('The Poe household');
    expect(container.textContent).toMatch(/0 of \d+ questions answered/);
    expect(container.textContent).toMatch(/no account number, no password, no medical record/);
    await click(byText(/Export this record/));
    await settle();
    expect(container.querySelector('pre').textContent).toMatch(/"household": "The Poe household"/);
  });
  it('a cell travels as a patch with its note; a member may read but not fill', async () => {
    await mount(createElement(HouseholdSpace));
    await settle();
    await click(byText(/^The household/));
    await type(container.querySelector('#c-householdName'), 'The Poe household');
    await type(container.querySelector('#cells-note'), 'first pass');
    await click(byText(/^Save 1 cell$/));
    await settle();
    expect(sent.patches).toEqual([{ patch: { householdName: 'The Poe household' }, note: 'first pass' }]);

    await act(async () => root.unmount());
    myRole = 'member'; record = {};
    await mount(createElement(HouseholdSpace));
    await settle();
    expect(container.textContent).toMatch(/filling it is an owner or admin/);
    expect(byText(/^Save cells$/)).toBeFalsy();
  });
  it('the covenant is readable in place, signs through the household writer, and becomes a green check', async () => {
    await mount(createElement(HouseholdSpace));
    await settle();
    expect(container.textContent).toContain('Household Covenant');
    expect(container.textContent).toMatch(/private shelf, not a safe deposit box/);
    expect(container.querySelector('[role="img"][aria-label="acknowledged"]')).toBeNull();
    await click(container.querySelector('#ack-householdCovenant-box'));
    await type(container.querySelector('#ack-householdCovenant-name'), 'Darrell Poe');
    await click(byText(/Acknowledge and sign/));
    await settle();
    expect(sent.acks).toHaveLength(1);
    expect(sent.acks[0]).toMatchObject({ key: 'householdCovenant', signature: 'Darrell Poe', docVersion: 'v0' });
    expect(sent.acks[0].attestation).toMatch(/By checking this box, I acknowledge/);
    expect(container.querySelector('[role="img"][aria-label="acknowledged"]')).toBeTruthy();
    expect(container.textContent).toMatch(/received by the office 2026-09-11 12:00 UTC/);
  });
});

describe('the shelf', () => {
  it('refuses a document that is nowhere, then files one with a file and one with a place', async () => {
    await mount(createElement(HouseholdSpace));
    await settle();
    await area(/Documents/);
    expect(container.textContent).toMatch(/A private shelf, not a safe deposit box/);
    await type(container.querySelector('input[placeholder="e.g. The deed on Maple"]'), 'The deed');
    await click(byText(/^File it$/));
    await settle();
    expect(container.querySelector('[role="alert"]').textContent).toMatch(/either upload the file or say where the paper is/);
    expect(sent.saved).toHaveLength(0);

    await type(container.querySelector('input[placeholder="e.g. the fire safe, top shelf"]'), 'the fire safe, top shelf');
    await click(byText(/^File it$/));
    await settle();
    expect(sent.saved).toHaveLength(1);
    expect(sent.saved[0]).toMatchObject({ label: 'The deed', category: 'home', whereFiled: 'the fire safe, top shelf', slug: 'the-deed' });
    expect(container.textContent).toMatch(/Filed “The deed” under The home/);
    expect(container.textContent).toMatch(/kept at: the fire safe, top shelf/);
  });
  it('a filed document is mine alone until I share it', async () => {
    documents = [{ id: 'd1', category: 'home', label: 'The deed', storagePath: 'u1/the-deed.pdf', fileName: 'deed.pdf', fileSize: 2048, sharedWithHousehold: false, whereFiled: '' }];
    await mount(createElement(HouseholdSpace));
    await settle();
    await area(/Documents/);
    const toggle = byText(/^Only me$/);
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await click(toggle);
    await settle();
    expect(sent.shared).toEqual([{ id: 'd1', shared: true }]);
  });
});

describe('the findings', () => {
  it('with no rows it says so, and never paints a dashboard', async () => {
    await mount(createElement(HouseholdSpace));
    await settle();
    await area(/Findings/);
    expect(container.textContent).toMatch(/Nothing has been written down yet/);
    expect(container.querySelectorAll('details').length).toBe(0);
    expect(container.textContent).toMatch(/How a friction becomes a system/);
    expect(container.textContent).toMatch(/Noticed/);
    expect(container.textContent).toMatch(/Hardened/);
  });
  it('with rows, every finding shows what it read and what to do next', async () => {
    record = { householdName: 'The Poe household', helpWith: ['rhythms'], sabbathDay: 'Sunday', biggestFriction: 'Paperwork piles up' };
    await mount(createElement(HouseholdSpace));
    await settle();
    await area(/Findings/);
    expect(container.textContent).not.toMatch(/Nothing has been written down yet/);
    const opens = container.querySelectorAll('details summary');
    expect(opens.length).toBeGreaterThan(2);
    expect(Array.from(opens).every((s) => /What this read/.test(s.textContent))).toBe(true);
    expect(container.textContent).toMatch(/household_records\.record/);
    expect(container.textContent).toMatch(/Next:/);
    expect(container.textContent).toMatch(/Paperwork piles up/);
  });
});

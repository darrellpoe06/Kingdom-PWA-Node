// =============================================================================
// Legal shelves — live render proof (DR-0329)
// =============================================================================
// Mounts the REAL Legal surface in jsdom. The point of this file is the
// reality-trace made checkable: before 2026-09-06 those four category boxes
// were hardcoded <ul> lists, and a test that only asserted "the words Personal
// / family appear" would have passed against the painted version. So every
// assertion here is about REAL behavior the placeholder could not have had —
// a working picker, a refusal the user can read, a count that moves.
//
// Supabase is stubbed at the module boundary: this proves the SURFACE, and the
// data isolation behind it is Postgres RLS's job (migration 0169), never a
// jsdom assertion's.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/legal-documents-sync.js', () => ({
  BUCKET: 'legal-documents',
  SIGNED_URL_TTL_SECONDS: 300,
  legalDocumentsSync: { subscribe: () => () => {}, upload: () => {}, deleteRow: () => {} },
  mergeRemoteLegalDocuments: (cur) => cur,
  uploadLegalFile: async () => ({ ok: false, reason: 'signed-out', message: 'Sign in to store the file itself' }),
  signedLegalUrl: async () => null,
  deleteLegalFile: async () => ({ ok: true }),
}));

import { LegalPlaceholder } from '../components/Legal.jsx';
import { DOCS_KEY } from '../lib/legal-documents-store.js';

let container, root;
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(LegalPlaceholder, { tier: 'family', setView: () => {}, ...props }));
  });
}
const buttons = (re) => [...document.body.querySelectorAll('button')].filter((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
async function setInput(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('Legal document shelves', () => {
  it('renders one ADD control per category — the boxes are interactive, not copy', async () => {
    await mount();
    expect(buttons(/Add a document/i)).toHaveLength(4);
  });

  it('offers that category OWN document types in a real picker', async () => {
    await mount();
    await click(buttons(/Add a document/i)[0]); // Personal / family
    const options = [...document.body.querySelectorAll('select option')].map((o) => o.textContent);
    expect(options).toContain('Will');
    expect(options).toContain('Power of attorney — healthcare');
    // The picker is scoped to its own shelf: a real-estate type is not offered here.
    expect(options).not.toContain('Eviction filing');
  });

  it('REFUSES to file a document whose privilege was never decided, and says why', async () => {
    await mount();
    await click(buttons(/Add a document/i)[0]);
    const label = document.body.querySelector('input[type="text"]');
    await setInput(label, 'Will — 2024');
    const whereFiled = [...document.body.querySelectorAll('input[type="text"]')][1];
    await setInput(whereFiled, 'the fire safe');
    await click(buttons(/^File it$/i)[0]);

    const alert = document.body.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toMatch(/privileged or not privileged/i);
    // And nothing was filed.
    expect(document.body.textContent).toMatch(/0 filed/);
  });

  it('files a POINTER record with no file and no session, and the count moves', async () => {
    await mount();
    await click(buttons(/Add a document/i)[0]);
    await setInput(document.body.querySelector('input[type="text"]'), 'Trust instrument');
    await setInput([...document.body.querySelectorAll('input[type="text"]')][1], "counsel's office");
    await click([...document.body.querySelectorAll('input[type="radio"]')][0]); // Privileged
    await click(buttons(/^File it$/i)[0]);

    expect(document.body.textContent).toMatch(/Trust instrument/);
    expect(document.body.textContent).toMatch(/1 filed/);
    // It persisted as a real record, not just React state.
    expect(JSON.parse(localStorage.getItem(DOCS_KEY))).toHaveLength(1);
  });

  it('does NOT claim encryption it does not have', async () => {
    await mount();
    const text = document.body.textContent;
    expect(text).toMatch(/not.{0,5} yet encrypted with your own key/i);
  });

  it('still shows the accounts-in-legal surface it already had (no regression)', async () => {
    await mount({ accounts: [{ id: 'a1', name: 'Frozen checking', inLegal: true, balance: 10, type: 'checking', institution: 'Bank' }] });
    expect(document.body.textContent).toMatch(/Frozen checking/);
  });
});

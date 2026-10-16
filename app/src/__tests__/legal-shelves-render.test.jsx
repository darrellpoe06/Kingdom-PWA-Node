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

// Household sharing (0299) is driven from here per test: what the household
// "shared", and a record of every share call the surface made.
const household = vi.hoisted(() => ({ items: [], calls: [] }));

vi.mock('../lib/legal-documents-sync.js', () => ({
  BUCKET: 'legal-documents',
  SIGNED_URL_TTL_SECONDS: 300,
  legalDocumentsSync: { subscribe: () => () => {}, upload: () => {}, deleteRow: () => {} },
  mergeRemoteLegalDocuments: (cur) => cur,
  uploadLegalFile: async () => ({ ok: false, reason: 'signed-out', message: 'Sign in to store the file itself' }),
  signedLegalUrl: async () => null,
  deleteLegalFile: async () => ({ ok: true }),
  fetchHouseholdLegalDocuments: async () => ({ ok: true, items: household.items }),
  setLegalDocumentShared: async (uuid, shared) => { household.calls.push([uuid, shared]); return { ok: true, shared }; },
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

beforeEach(() => { localStorage.clear(); household.items = []; household.calls = []; });
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

describe('household sharing (0299, DR-1077) — off unless the filer turns it on', () => {
  const mine = (over = {}) => ({
    id: 'ld-mine-1', category: 'business', docType: 'Operating agreement', label: 'Our operating agreement',
    privileged: true, whereFiled: 'fire safe', createdAt: '2026-10-16T12:00:00Z', ...over,
  });
  const theirs = (over = {}) => ({
    id: 'ld-household-1', remoteUuid: 'u-1', category: 'business', docType: 'Reinstatement filing',
    label: 'Filed reinstatement', privileged: true, whereFiled: 'agent portal', dateOf: '2026-10-20',
    createdAt: '2026-10-20T12:00:00Z', fromHousehold: true, sharedWithHousehold: true, sharedBy: 'Christina', ...over,
  });

  it('a synced document starts PRIVATE, and sharing it is one explicit tap by its filer', async () => {
    localStorage.setItem(DOCS_KEY, JSON.stringify([mine({ remoteUuid: 'r-1' })]));
    await mount();
    expect(document.body.textContent).toMatch(/Private to you\./);
    const toggle = buttons(/^Share with household$/i)[0];
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await click(toggle);
    expect(household.calls).toEqual([['r-1', true]]);
    expect(buttons(/Stop sharing with household/i)[0].getAttribute('aria-pressed')).toBe('true');
    expect(document.body.textContent).toMatch(/only you can change or remove it/i);
  });

  it('a document that has not synced cannot be shared, and says why', async () => {
    localStorage.setItem(DOCS_KEY, JSON.stringify([mine()]));
    await mount();
    expect(buttons(/Share with household/i)).toHaveLength(0);
    expect(document.body.textContent).toMatch(/Sign in and let it sync to be able to share it/i);
  });

  it('paper the household shared reads as theirs: named, openable, never removable or re-sharable here', async () => {
    household.items = [theirs({ storagePath: 'u-x/ld.pdf', whereFiled: '' })];
    await mount();
    expect(document.body.textContent).toMatch(/Shared by Christina/);
    expect(document.body.textContent).toMatch(/Filed reinstatement/);
    expect(buttons(/^Open$/)).toHaveLength(1);
    expect(buttons(/^Remove$/)).toHaveLength(0);
    expect(buttons(/share with household/i)).toHaveLength(0);
    // Never written into this person's own shelf.
    expect(localStorage.getItem(DOCS_KEY) || '[]').not.toMatch(/Filed reinstatement/);
  });

  it('a step done on another account moves this checklist once its paper is shared', async () => {
    await mount();
    expect(document.body.textContent).toMatch(/0 of 10 steps have their paper on the shelf/);
    root.unmount(); container.remove(); root = container = null;
    household.items = [theirs({ docType: 'Entity status check (Secretary of State)', label: 'Standing read' })];
    await mount();
    expect(document.body.textContent).toMatch(/1 of 10 steps have their paper on the shelf/);
  });

  it('the headline no longer claims at-rest encryption is built', async () => {
    await mount();
    expect(document.body.textContent).not.toMatch(/Confidentiality is built in/i);
    expect(document.body.textContent).toMatch(/designed and not built yet/i);
  });
});

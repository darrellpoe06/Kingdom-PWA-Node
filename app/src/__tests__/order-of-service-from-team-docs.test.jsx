// @vitest-environment jsdom
// =============================================================================
// An Order of Service in Team Docs opens in the Order of Service tab as an
// editable starting point (DR-1088). Darrell, 2026-10-17: "Open Order of
// Service documents inside the space/tab/fields as an editable starting
// point... as options for users with those privileges."
//
// PROVEN-TO-CATCH (DR-0076 §3): the document's OWN words must land in the
// editable box and the preview, a steward must be the only one offered it, a
// file that cannot be read must say why and leave the box alone.
// =============================================================================
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { blocksToText, orderDocuments, orderReadFailure } from '../lib/order-from-document.js';
import { docxXmlToBlocks } from '../lib/document-viewer.js';

const TEAM_DOCS = [
  { id: 't1', docType: 'calendar', title: '06 JUNE 2026 CALENDAR', docDate: '2026-06-01', documentUrl: 'c/cal.pdf' },
  { id: 't2', docType: 'order-of-service', title: 'Order of Service 10-12-2026', docDate: '2026-10-12', documentUrl: 'c/m1/order.docx' },
  { id: 't3', docType: 'order-of-service', title: 'Order of Service 10-19-2026', docDate: '2026-10-19', documentUrl: 'c/m2/order.docx' },
  { id: 't4', docType: 'order-of-service', title: 'No file', docDate: '2026-10-05', documentUrl: '' },
];
const ORDER_TEXT = 'Call to Worship\nPraise & Worship (20 min)\nWelcome & Announcements\nOffering\nSermon — Pastor McCray · 2 Kings 9:30-37\nBenediction';
const reads = vi.hoisted(() => ({ result: null, calls: [] }));
vi.mock('../lib/order-from-document.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, readOrderText: async (doc) => { reads.calls.push(doc.id); return reads.result; } };
});

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  onAuthChange: vi.fn(() => () => {}),
}));

const PROGRAM = {
  id: 'p1', serviceDate: '2026-07-12', serviceType: 'sunday', serviceSlot: '',
  title: 'Order of Worship', theme: '', scriptureRef: '', startTime: '11:00',
  targetMinutes: 90, status: 'published', notes: '',
};

let access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
let programsFixture = null; // null = [PROGRAM]

vi.mock('../lib/service-program.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    getServiceProgramAccess: vi.fn(async () => access),
    subscribePrograms: (cb) => { cb(programsFixture || [PROGRAM]); return () => {}; },
    subscribeSegments: (cb) => { cb([]); return () => {}; },
    subscribeChanges: (cb) => { cb([{ id: 'c1', programId: 'p1', actorName: 'Darrell', summary: 'added Call to Worship', createdAt: '2026-07-07T10:00:00Z' }]); return () => {}; },
    subscribeFinalizerMembers: (cb) => { cb([]); return () => {}; },
  };
});
vi.mock('../lib/choir-sync.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    subscribeSongs: (cb) => { cb([]); return () => {}; },
    subscribeSermons: (cb) => { cb([]); return () => {}; },
    subscribeTeamDocuments: (cb) => { cb(TEAM_DOCS); return () => {}; },
  };
});
vi.mock('../lib/service-actuals.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    subscribeActuals: (cb) => { cb([]); return () => {}; },
  };
});


import ServiceProgram from '../components/ServiceProgram.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  reads.calls = []; reads.result = { ok: true, text: ORDER_TEXT };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

const mount = () => act(async () => { root.render(createElement(ServiceProgram)); });
const button = (label) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(label));
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
const choose = (sel, value) => act(async () => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, value);
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
});

describe('a steward starts the order from a filed Order of Service', () => {
  it('offers only the filed orders that carry a file, newest first', async () => {
    access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
    await mount();
    await click(button('From Team Docs or email'));
    const options = [...container.querySelectorAll('#sp-order-doc option')].map((o) => o.textContent);
    expect(options).toEqual(['Choose a filed order…', '2026-10-19 · Order of Service 10-19-2026', '2026-10-12 · Order of Service 10-12-2026']);
  });

  it('the document\'s own words land in the editable box and the preview', async () => {
    access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
    await mount();
    await click(button('From Team Docs or email'));
    await choose(container.querySelector('#sp-order-doc'), 't3');
    await click(button('Load it here'));
    expect(reads.calls).toEqual(['t3']);
    expect(container.querySelector('#sp-email-paste').value).toBe(ORDER_TEXT);
    expect(container.textContent).toContain('Loaded from \u201cOrder of Service 10-19-2026\u201d, dated 2026-10-19');
    expect(container.textContent).toContain('Recognized 6 segments');
    expect(container.textContent).toContain('2 Kings 9:30-37');
  });

  it('a file that is not on the server says so and leaves the box empty', async () => {
    access = { signedIn: true, canSee: true, canEdit: true, isFinalizer: true, role: 'owner', sector: 'worship' };
    reads.result = { ok: false, reason: 'not-on-server' };
    await mount();
    await click(button('From Team Docs or email'));
    await choose(container.querySelector('#sp-order-doc'), 't2');
    await click(button('Load it here'));
    expect(container.querySelector('[role=alert]').textContent).toContain('its file is not on the church server');
    expect(container.querySelector('#sp-email-paste').value).toBe('');
  });

  it('PROVEN-TO-CATCH: a member who cannot edit is never offered it', async () => {
    access = { signedIn: true, canSee: true, canEdit: false, isFinalizer: false, role: 'member', sector: 'ushers' };
    await mount();
    expect(button('From Team Docs or email')).toBeUndefined();
    expect(container.querySelector('#sp-order-doc')).toBeNull();
  });
});

describe('reading a filed order', async () => {
  // The real reader (the surface tests above stand in for it).
  const { readOrderText } = await vi.importActual('../lib/order-from-document.js');
  const blob = (s) => ({ arrayBuffer: async () => new TextEncoder().encode(s).buffer, text: async () => s });
  it('signs, fetches and reads a Word file into one line per paragraph or row', async () => {
    const res = await readOrderText({ documentUrl: 'c/m2/order.docx' }, {
      sign: async (p) => ({ ok: true, url: `signed:${p}` }),
      fetchBytes: async (u) => ({ ok: true, blob: blob(u), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      docx: async () => [{ kind: 'h', text: 'ORDER OF SERVICE' }, { kind: 'row', text: '11:00  |  Call to Worship' }, { kind: 'p', text: 'Offering\tUshers' }],
    });
    expect(res).toEqual({ ok: true, text: 'ORDER OF SERVICE\n11:00 — Call to Worship\nOffering Ushers' });
  });
  it('a PDF reads through the same text layer the Books intake uses', async () => {
    const res = await readOrderText({ documentUrl: 'c/order.pdf' }, {
      sign: async () => ({ ok: true, url: 'u' }),
      fetchBytes: async () => ({ ok: true, blob: blob(''), contentType: 'application/pdf' }),
      pdf: async () => ({ text: 'Call to Worship\nBenediction' }),
    });
    expect(res).toEqual({ ok: true, text: 'Call to Worship\nBenediction' });
  });
  it('a refused signature or a missing file passes the viewer\'s reason through', async () => {
    expect(await readOrderText({ documentUrl: 'x' }, { sign: async () => ({ ok: false, reason: 'no-access' }) })).toEqual({ ok: false, reason: 'no-access' });
    expect(await readOrderText({ documentUrl: 'x' }, { sign: async () => ({ ok: true, url: 'u' }), fetchBytes: async () => ({ ok: false, reason: 'not-on-server' }) })).toEqual({ ok: false, reason: 'not-on-server' });
    expect(await readOrderText({ documentUrl: '' })).toEqual({ ok: false, reason: 'no-file' });
  });
  it('a file with no readable words is never filled in', async () => {
    const res = await readOrderText({ documentUrl: 'c/scan.jpg' }, {
      sign: async () => ({ ok: true, url: 'u' }), fetchBytes: async () => ({ ok: true, blob: blob('x'), contentType: 'image/jpeg' }),
    });
    expect(res).toEqual({ ok: false, reason: 'unreadable', kind: 'image' });
    expect(orderReadFailure('unreadable', 'image')).toContain('paste the order instead');
  });
  it('a real Word body reads to its lines', () => {
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const xml = `<w:document xmlns:w="${W}"><w:body><w:p><w:r><w:t>Call to Worship</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Offering</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Ushers</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>`;
    expect(blocksToText(docxXmlToBlocks(xml))).toBe('Call to Worship\nOffering — Ushers');
  });
  it('orderDocuments keeps orders with a file, newest first', () => {
    expect(orderDocuments(TEAM_DOCS).map((d) => d.id)).toEqual(['t3', 't2']);
  });
});

// =============================================================================
// Contacts from the phone — the real panel, in jsdom (DR-0736)
// =============================================================================
// A .vcf goes through the file door and the preview appears with its summary
// and rows; Keep writes the upsert keyed on (owner_id, contact_key) and says
// where the contacts were kept; a CSV is refused with its reason; the pick
// button exists only where the phone has a Contact Picker.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const upserts = [];
let session = { user: { id: 'me' } };
vi.mock('../lib/supabase.js', () => {
  const stub = {
    auth: { getSession: async () => ({ data: { session } }) },
    from: (t) => ({ upsert: async (rows, opts) => { upserts.push({ t, rows, opts }); return { error: null }; } }),
  };
  return { default: stub, supabase: stub };
});

import ContactsImport from '../components/ContactsImport.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(ContactsImport, props)); });
  return container;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  upserts.length = 0;
  session = { user: { id: 'me' } };
  try { localStorage.clear(); } catch { /* ignore */ }
});

const settle = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function upload(el, text, name = 'contacts.vcf') {
  const input = el.querySelector('[data-testid="contacts-upload-vcf"]');
  const file = new File([text], name, { type: 'text/vcard' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  for (let i = 0; i < 80 && !el.querySelector('[data-testid="contacts-import-preview"]') && !el.querySelector('[role="status"]'); i++) await settle(25);
}

const VCF = [
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Sister Ann', 'TEL;TYPE=CELL:217-555-0101', 'EMAIL:ann@example.test', 'END:VCARD',
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Shay Poe', 'TEL;TYPE=CELL:(563) 505-9393', 'END:VCARD',
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Shay again', 'TEL:5635059393', 'END:VCARD',
].join('\r\n');

describe('the panel inside Messages > Add a contact', () => {
  it('shows the plan before anything is kept: summary, rows, and the reason for a match', async () => {
    const el = await mount({ roster: [{ userId: 'u-ann', displayName: 'Sister Ann', email: 'ann@example.test' }] });
    expect(el.querySelector('[data-testid="contacts-pick-from-phone"]'), 'no picker in jsdom, so no pick button').toBeNull();
    await upload(el, VCF);
    const preview = el.querySelector('[data-testid="contacts-import-preview"]');
    expect(preview, 'the preview did not render').toBeTruthy();
    expect(el.querySelector('[data-testid="contacts-import-summary"]').textContent).toBe('1 new · 1 already on PoeTech · 1 repeated in the file');
    const rows = [...preview.querySelectorAll('li')];
    expect(rows.map((r) => r.getAttribute('data-status'))).toEqual(['on-poetech', 'new']);
    expect(rows[0].textContent).toContain('on PoeTech as Sister Ann (same email)');
    expect(rows[1].textContent).toContain('(563) 505-9393');
    expect(upserts, 'nothing is kept before Keep').toHaveLength(0);
  });

  it('Keep writes the upsert on (owner_id, contact_key), mirrors the device list, and says where they went', async () => {
    const saved = [];
    const el = await mount({ roster: [], onSaved: (r) => saved.push(r) });
    await upload(el, VCF);
    const keep = el.querySelector('[data-testid="contacts-import-save"]');
    expect(keep.textContent).toBe('Keep 2 contacts');
    await act(async () => { keep.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle();
    expect(upserts).toHaveLength(1);
    expect(upserts[0].t).toBe('contacts');
    expect(upserts[0].opts).toEqual({ onConflict: 'owner_id,contact_key' });
    expect(upserts[0].rows.map((r) => r.contact_key)).toEqual(['e:ann@example.test', 'p:5635059393']);
    expect(upserts[0].rows[0]).toMatchObject({ owner_id: 'me', name: 'Sister Ann', phones: ['217-555-0101'], emails: ['ann@example.test'], source: 'file' });
    expect(el.querySelector('[role="status"]').textContent).toMatch(/^Kept 2 contacts\. Kept on your own server and on this device\./);
    expect(saved).toHaveLength(1);
    expect(saved[0].where).toBe('nas+device');
    expect(JSON.parse(localStorage.getItem('poetech.savedContacts.v1'))).toHaveLength(2);
    expect(el.querySelector('[data-testid="contacts-import-preview"]'), 'the preview clears after Keep').toBeNull();
  });

  it('signed out: Keep goes to the device only and the reason is on the screen', async () => {
    session = null;
    const el = await mount({ roster: [] });
    await upload(el, VCF);
    await act(async () => { el.querySelector('[data-testid="contacts-import-save"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle();
    expect(upserts).toHaveLength(0);
    expect(el.querySelector('[role="status"]').textContent).toMatch(/Not signed in, so they are kept on this device only/);
    expect(JSON.parse(localStorage.getItem('poetech.savedContacts.v1'))).toHaveLength(2);
  });

  it('a CSV is refused by name, not read as zero contacts', async () => {
    const el = await mount({ roster: [] });
    await upload(el, 'name,phone\nShay,5635059393\n', 'contacts.csv');
    expect(el.querySelector('[data-testid="contacts-import-preview"]')).toBeNull();
    expect(el.querySelector('[role="status"]').textContent).toMatch(/not a contacts \(\.vcf\) file/);
  });

  it('Not now clears the preview without keeping anything', async () => {
    const el = await mount({ roster: [] });
    await upload(el, VCF);
    await act(async () => { el.querySelector('[data-testid="contacts-import-clear"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(el.querySelector('[data-testid="contacts-import-preview"]')).toBeNull();
    expect(upserts).toHaveLength(0);
  });

  it('the pick button is on screen when the phone has a Contact Picker, and the pick lands in the preview', async () => {
    const nav = { contacts: { getProperties: async () => ['name', 'tel', 'email', 'address'], select: async (props) => { expect(props).toEqual(['name', 'tel', 'email', 'address']); return [{ name: ['Janelle'], tel: ['217-555-0199'], email: [], address: [] }]; } } };
    const el = await mount({ roster: [], nav });
    const pick = el.querySelector('[data-testid="contacts-pick-from-phone"]');
    expect(pick).toBeTruthy();
    await act(async () => { pick.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle();
    expect(el.querySelector('[data-testid="contacts-import-summary"]').textContent).toBe('1 new');
    expect(el.querySelector('[data-testid="contacts-import-save"]').textContent).toBe('Keep 1 contact');
  });
});

// =============================================================================
// Papers are signed in the app, filed where they belong, and tenants share
// their own (DR-0913, 0263)
// =============================================================================
// Darrell, 2026-10-10: "Documents should be able to work integrated with the
// options to digitally sign... so all necessary documents are populated into
// their respective places... also have paper documents we can upload to keep
// as records for tenants", "Make sure tenants can upload receipts etc to share
// with us... pictures for documentation", "For workorders... etc...".
//
// Pure: the fingerprint is the SHA-256 the database computes; a state reads in
// words; a generated draft files as text. Mounted: a tenant signs what waits
// for them with the fingerprint of what was shown, and files a receipt; the
// family sends a paper for signature, and a generated draft cannot be sent
// without counsel's review being recorded. The database walls:
// infra/supabase/tests/0263-document-signing-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { sha256Hex, signingState, canSign, dataUrlText, textDataUrl, kindForGenerated } from '../modules/properties/doc-signing.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ docs: [], sigs: [], signed: [], requested: [], added: [] }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadDoorPapers: async () => ({ ok: true, documents: H.docs }),
  loadSignatures: async () => ({ ok: true, signatures: H.sigs }),
  requestSignatures: async (id, signers, counsel) => { H.requested.push({ id, signers, counsel }); return { ok: true, version: 'v' }; },
  signDocument: async (row) => { H.signed.push(row); return { ok: true, state: 'awaiting' }; },
  addDocument: async (row) => { H.added.push(row); return { ok: true, document: { id: 'new', ...row } }; },
}));
import { PapersPanel } from '../modules/properties/DocSigning.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { docs: [], sigs: [], signed: [], requested: [], added: [] });
});
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}
const text = () => container.textContent || '';
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));
async function click(re) {
  const b = btn(re);
  if (!b) throw new Error(`no button ${re}; saw ${[...container.querySelectorAll('button')].map((x) => x.textContent).join(' | ')}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}
async function check(label) {
  const el = container.querySelector(`input[aria-label="${label}"]`);
  await act(async () => { el.click(); });
}
async function type(label, value) {
  const el = container.querySelector(`input[aria-label="${label}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}

const LEASE_BODY = 'data:text/plain;charset=utf-8,RESIDENTIAL%20LEASE%20Door%20A';
const LEASE = { id: 'd1', title: 'Lease, Door A', kind: 'lease', tenancy_id: 't1', source: 'upload', storage_path: LEASE_BODY, sign_status: 'awaiting', signers_required: ['landlord', 'tenant'], uploaded_at: '2026-10-10T12:00:00Z', sign_requested_at: '2026-10-10T12:01:00Z' };

describe('the fingerprint and the words (pure)', () => {
  it('the fingerprint is the SHA-256 the database computes over the stored bytes', async () => {
    // Measured on PostgreSQL 16: encode(sha256(convert_to(<this>,'UTF8')),'hex').
    expect(await sha256Hex(LEASE_BODY)).toBe('63134db4f89ebe9ea2d1b0806e895588f1eb4562b8508884d4a13ac3a7ff27bf');
  });
  it('a state reads in words, and says whose signature is still owed', () => {
    const s = signingState(LEASE, [{ document_id: 'd1', signer_role: 'tenant', signature: 'Ana Tenant', signed_at: '2026-10-10T12:05:00Z' }]);
    expect(s.line).toBe('Waiting for the landlord to sign');
    expect(canSign(LEASE, [], 'tenant')).toBe(true);
    expect(canSign(LEASE, [{ document_id: 'd1', signer_role: 'tenant' }], 'tenant')).toBe(false);
    expect(canSign({ ...LEASE, sign_status: 'none' }, [], 'tenant')).toBe(false);
  });
  it('a generated draft files as UTF-8 text and reads back exactly', () => {
    const url = textDataUrl(['RESIDENTIAL LEASE', 'Rent — $680, due the first']);
    expect(dataUrlText(url)).toBe('RESIDENTIAL LEASE\nRent — $680, due the first');
    expect(kindForGenerated('lease-whole-unit')).toBe('lease');
    expect(kindForGenerated('notice-entry')).toBe('notice');
  });
});

describe('the tenant\'s papers', () => {
  it('signs what waits for them with the fingerprint of what the screen showed, after both agreements and a name', async () => {
    H.docs = [LEASE];
    await mount(createElement(PapersPanel, { seat: 'tenant', tenancyId: 't1', instanceId: 'i1' }));
    expect(text()).toContain('1 waiting for you to sign');
    await click(/^Sign it$/);
    expect(container.querySelector('[data-testid="doc-text"]').textContent).toBe('RESIDENTIAL LEASE Door A');
    expect(btn(/^Sign as tenant$/).disabled).toBe(true);
    await check('I have read it');
    await check('I agree to sign electronically');
    await type('Your full legal name', 'Ana Maria Tenant');
    await click(/^Sign as tenant$/);
    // Signing first fingerprints the text (crypto.subtle, async): wait for the
    // signature itself, never a fixed number of ticks (CI shard 2, dd4bf8ae5).
    await act(async () => { await vi.waitFor(() => expect(H.signed).toHaveLength(1), { timeout: 5000 }); });
    expect(H.signed[0]).toMatchObject({
      documentId: 'd1', role: 'tenant', signature: 'Ana Maria Tenant',
      version: '63134db4f89ebe9ea2d1b0806e895588f1eb4562b8508884d4a13ac3a7ff27bf',
      attestation: 'By checking this box, I acknowledge that I have read the Lease, Door A in full and I agree to be bound by it.',
    });
    expect(H.signed[0].consent).toMatch(/sign this document electronically/);
    expect(H.signed[0].deviceAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('files a receipt of their own to their tenancy, marked as theirs', async () => {
    await mount(createElement(PapersPanel, { seat: 'tenant', tenancyId: 't1', instanceId: 'i1' }));
    expect(text()).toContain('Share a receipt, a picture for the record');
    const input = container.querySelector('input[aria-label="Choose a file"]');
    const file = new File([new Uint8Array([1, 2, 3])], 'hardware-store.png', { type: 'image/png' });
    await act(async () => { Object.defineProperty(input, 'files', { value: [file] }); input.dispatchEvent(new Event('change', { bubbles: true })); });
    for (let i = 0; i < 20 && !btn(/^File it with my papers$/); i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
    await click(/^File it with my papers$/);
    expect(H.added[0]).toMatchObject({ instance_id: 'i1', tenancy_id: 't1', kind: 'receipt', title: 'hardware-store', mime_type: 'image/png', source: 'upload', author_label: 'tenant' });
    expect(H.added[0].storage_path).toMatch(/^data:image\/png;base64,/);
  });
});

describe('the family\'s papers', () => {
  it('sends an uploaded paper for the tenant and the landlord to sign', async () => {
    H.docs = [{ ...LEASE, sign_status: 'none', signers_required: [], sign_requested_at: null }];
    await mount(createElement(PapersPanel, { seat: 'landlord', rentalId: 'r1', tenancyIds: ['t1'], instanceId: 'i1' }));
    await click(/^Send for signature$/);
    const send = [...container.querySelectorAll('[data-testid="request-form"] button')].find((b) => /Send for signature/.test(b.textContent));
    await act(async () => { send.click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.requested).toEqual([{ id: 'd1', signers: ['tenant', 'landlord'], counsel: false }]);
  });
  it('PROVEN-TO-CATCH: a generated draft cannot be sent until counsel\'s review is recorded', async () => {
    H.docs = [{ ...LEASE, source: 'generated', sign_status: 'none', signers_required: [] }];
    await mount(createElement(PapersPanel, { seat: 'landlord', rentalId: 'r1', tenancyIds: ['t1'], instanceId: 'i1' }));
    await click(/^Send for signature$/);
    const send = [...container.querySelectorAll('[data-testid="request-form"] button')].find((b) => /Send for signature/.test(b.textContent));
    expect(send.disabled).toBe(true);
    await check('Counsel has reviewed this document');
    await act(async () => { send.click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.requested).toEqual([{ id: 'd1', signers: ['tenant', 'landlord'], counsel: true }]);
  });
});

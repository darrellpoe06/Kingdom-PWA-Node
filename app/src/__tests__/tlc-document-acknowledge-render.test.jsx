// =============================================================================
// The check at the bottom of every document (DR-0356): the REAL control, the
// write stubbed. No packet → nothing; unsigned → the sentence, the name, one
// button, and the write carries the version and the checked moment; signed →
// a green check with who, when (device), when (office), which version; a
// revised document → the green check for the old version AND the box again.
// On Team the three documents each carry it. DR-0076: proven-to-catch.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TlcDocumentAcknowledge, { acknowledgmentState } from '../components/TlcDocumentAcknowledge.jsx';
import { documentVersion, acknowledgmentAttestation } from '../lib/tlc-signing.js';

const sent = { acks: [] };
const signedRecord = (over = {}) => ({ agreed: true, signature: 'Cora Lane', signedOn: '2026-09-10', signedAt: '2026-09-10T20:30:00.000Z', docVersion: documentVersion('policies'), attestation: acknowledgmentAttestation('Independent Contractor Handbook'), agreedAt: '2026-09-10T20:30:00.000Z', signedAtServer: '2026-09-10T20:30:02.000Z', ...over });

vi.mock('../lib/tlc-onboarding-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    myPacketStatus: async () => ({ ok: true, packetId: 'p1', status: 'approved' }),
    readPacket: async () => ({ ok: true, view: { packet_id: 'p1', status: 'approved', packet: { firstName: 'Cora', acknowledgments: { policies: signedRecord() } } } }),
    acknowledgeDocument: async (packetId, key, rec) => { sent.acks.push({ packetId, key, ...rec }); return { ok: true, view: { packet_id: packetId, status: 'approved', packet: { acknowledgments: { [key]: signedRecord({ signature: rec.signature, docVersion: rec.docVersion, agreedAt: rec.agreedAt }) } } } }; },
  };
});
vi.mock('../lib/tlc-office-forms-sync.js', async (orig) => ({ ...(await orig()), readOfficeDocuments: async () => ({ ok: true, resolved: (await import('../lib/tlc-office-forms.js')).resolveOfficeDocuments(null) }) }));
vi.mock('../lib/tlc-launch-sync.js', async (orig) => ({ ...(await orig()), loadLaunchStatuses: async () => ({ ok: true, statuses: {} }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount(el) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(el); }); }
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const byText = (re, tag = 'button') => Array.from(container.querySelectorAll(tag)).find((b) => re.test(b.textContent));
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (el, value) => act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = container = null; sent.acks.length = 0; });

describe('the record, read plainly', () => {
  it('signed needs agreed + a name; current needs the version now shown', () => {
    expect(acknowledgmentState(null, 'v1')).toEqual({ signed: false, current: false, record: null });
    expect(acknowledgmentState({ agreed: true, signature: '  ' }, 'v1').signed).toBe(false);
    expect(acknowledgmentState(signedRecord({ docVersion: 'v1' }), 'v1')).toMatchObject({ signed: true, current: true });
    expect(acknowledgmentState(signedRecord({ docVersion: 'v1' }), 'v2')).toMatchObject({ signed: true, current: false });
  });
});

describe('the control', () => {
  it('renders nothing without a packet', async () => {
    await mount(createElement(TlcDocumentAcknowledge, { docKey: 'policies', docName: 'Independent Contractor Handbook', packetId: null }));
    expect(container.textContent).toBe('');
  });
  it('unsigned: the sentence, the typed name and one button; the write carries the version, the sentence and the checked moment; then the green check', async () => {
    await mount(createElement(TlcDocumentAcknowledge, { docKey: 'policies', docName: 'Independent Contractor Handbook', packetId: 'p1', record: null }));
    expect(container.textContent).toContain('By checking this box, I acknowledge that I have read the Independent Contractor Handbook in full');
    expect(container.querySelector('[role="img"][aria-label="acknowledged"]')).toBeNull();
    const btn = byText(/Acknowledge and sign/);
    expect(btn.disabled).toBe(true);
    await click(container.querySelector('#ack-policies-box'));
    expect(btn.disabled).toBe(true); // a name is still needed
    await type(container.querySelector('#ack-policies-name'), 'Cora Lane');
    expect(btn.disabled).toBe(false);
    await click(btn);
    await settle();
    expect(sent.acks).toHaveLength(1);
    expect(sent.acks[0]).toMatchObject({ packetId: 'p1', key: 'policies', signature: 'Cora Lane', docVersion: documentVersion('policies'), attestation: acknowledgmentAttestation('Independent Contractor Handbook') });
    expect(sent.acks[0].agreedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('signed: the green check says who, the device moment, the office moment and the version; no box', async () => {
    await mount(createElement(TlcDocumentAcknowledge, { docKey: 'policies', docName: 'Independent Contractor Handbook', packetId: 'p1', record: signedRecord() }));
    expect(container.querySelector('[role="img"][aria-label="acknowledged"]')).toBeTruthy();
    const text = container.textContent;
    expect(text).toContain('Acknowledged');
    expect(text).toContain('Cora Lane');
    expect(text).toContain('checked 2026-09-10 20:30 on your device');
    expect(text).toContain('received by the office 2026-09-10 20:30 UTC');
    expect(text).toContain(`document version ${documentVersion('policies')}`);
    expect(container.querySelector('#ack-policies-box')).toBeNull();
  });
  it('a revised document keeps the green check for the version signed and brings the box back for the new one', async () => {
    await mount(createElement(TlcDocumentAcknowledge, { docKey: 'policies', docName: 'Independent Contractor Handbook', packetId: 'p1', record: signedRecord({ docVersion: 'v00000000' }) }));
    expect(container.querySelector('[role="img"][aria-label="acknowledged"]')).toBeTruthy();
    expect(container.textContent).toContain('an earlier version');
    expect(container.textContent).toContain('revised since');
    expect(container.querySelector('#ack-policies-box')).toBeTruthy();
  });
});

describe('on Team, under each document', () => {
  it('a colleague with a packet sees the green check under the signed handbook and the box under the two unsigned agreements', async () => {
    const { default: TlcTeamResources } = await import('../components/TlcTeamResources.jsx');
    await mount(createElement(TlcTeamResources, { staff: true }));
    await settle(); await settle();
    // open the three folds
    for (const re of [/Independent Contractor Handbook/, /Independent Contractor Agreement/, /Confidentiality Agreement/]) {
      const b = Array.from(container.querySelectorAll('button')).find((x) => re.test(x.textContent) && x.getAttribute('aria-expanded') !== null);
      expect(b, String(re)).toBeTruthy();
      if (b.getAttribute('aria-expanded') !== 'true') await click(b);
    }
    await settle();
    expect(container.querySelectorAll('[role="img"][aria-label="acknowledged"]').length).toBe(1);
    expect(container.querySelector('#ack-policies-box')).toBeNull();
    expect(container.querySelector('#ack-contractorAgreement-box')).toBeTruthy();
    expect(container.querySelector('#ack-confidentiality-box')).toBeTruthy();
    await click(container.querySelector('#ack-confidentiality-box'));
    await type(container.querySelector('#ack-confidentiality-name'), 'Cora Lane');
    await click(Array.from(container.querySelectorAll('button')).filter((b) => /Acknowledge and sign/.test(b.textContent)).find((b) => !b.disabled));
    await settle();
    expect(sent.acks[0]).toMatchObject({ packetId: 'p1', key: 'confidentiality', signature: 'Cora Lane' });
    expect(container.querySelectorAll('[role="img"][aria-label="acknowledged"]').length).toBe(1); // the view returned holds only the new signing in this stub
    expect(container.querySelector('#ack-confidentiality-box')).toBeNull();
  });
});

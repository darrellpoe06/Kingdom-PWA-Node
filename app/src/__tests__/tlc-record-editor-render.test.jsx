// =============================================================================
// TlcRecordEditor (DR-0354): the REAL component, the write stubbed. Every
// section of the live form is a fold of cells; only the cells that changed
// travel, with the note; a refused kind is never an input here; a colleague's
// "My record" on Team opens the same editor on their own packet.
// DR-0076: proven-to-catch — the stub records what was sent.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TlcRecordEditor from '../components/TlcRecordEditor.jsx';
import { liveSections } from '../lib/tlc-office-forms.js';
import { SECTIONS, emptyPacket } from '../lib/tlc-onboarding.js';

const sent = { patches: [] };
vi.mock('../lib/tlc-onboarding-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    myPacketStatus: async () => ({ ok: true, packetId: 'p1', status: 'approved' }),
    readPacket: async () => ({ ok: true, view: { packet_id: 'p1', status: 'approved', packet: { ...emptyPacket(), firstName: 'Ann', lastName: 'Lee', phone: '217' } } }),
    patchPacket: async (id, patch, note) => { sent.patches.push({ id, patch, note }); return { ok: true, view: { packet_id: 'p1', status: 'approved', packet: { ...emptyPacket(), firstName: 'Ann', lastName: 'Lee', ...patch } } }; },
  };
});
vi.mock('../lib/tlc-office-forms-sync.js', async (orig) => {
  const real = await orig();
  return { ...real, readOfficeDocuments: async () => ({ ok: true, resolved: real.resolveOfficeDocuments ? (await import('../lib/tlc-office-forms.js')).resolveOfficeDocuments(null) : null }) };
});
vi.mock('../lib/tlc-launch-sync.js', async (orig) => ({ ...(await orig()), loadLaunchStatuses: async () => ({ ok: true, statuses: {} }) }));

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
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = container = null; sent.patches.length = 0; });

const live = liveSections(null);
const record = { ...emptyPacket(), firstName: 'Ann', lastName: 'Lee', phone: '217-555-0100', licenseType: 'LCSW' };

describe('the record editor', () => {
  it('every editable section is a fold; files, signatures and banking are named, not inputs; the count is honest', async () => {
    const onSave = vi.fn(async () => ({ ok: true }));
    await mount(createElement(TlcRecordEditor, { sections: live, record, onSave, who: 'office', title: 'Fill or correct the cells' }));
    const folds = Array.from(container.querySelectorAll('button[aria-expanded]')).map((b) => b.textContent);
    for (const s of SECTIONS) {
      if (s.id === 'banking' || s.id === 'agreements') expect(folds.some((t) => t.startsWith(s.title))).toBe(false);
      else expect(folds.some((t) => t.startsWith(s.title))).toBe(true);
    }
    expect(container.textContent).toMatch(/4 of \d+ cells hold an answer/);
    expect(container.textContent).toMatch(/Not filled here: .*Resume\/CV/);
    expect(container.textContent).toMatch(/direct deposit stays behind the wall/);
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(container.querySelector('#c-routingNumber')).toBeNull();
    expect(byText(/^Save cells$/).disabled).toBe(true);
  });
  it('sends only the cells that changed, with the note; the baseline moves to what was saved', async () => {
    const onSave = vi.fn(async (patch, note) => ({ ok: true, view: { packet: { ...record, ...patch } } }));
    await mount(createElement(TlcRecordEditor, { sections: live, record, onSave, who: 'office' }));
    await click(byText(/^About you/));
    await type(container.querySelector('#c-phone'), '309-555-0199');
    await type(container.querySelector('#c-preferredName'), 'Annie');
    await type(container.querySelector('#c-preferredName'), 'Ann'); // changed back and forth is still a change from base ('')
    expect(container.textContent).toContain('2 unsaved');
    await type(container.querySelector('#cells-note'), 'from her voicemail');
    await click(byText(/^Save 2 cells$/));
    await settle();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual({ phone: '309-555-0199', preferredName: 'Ann' });
    expect(onSave.mock.calls[0][1]).toBe('from her voicemail');
    expect(container.textContent).toContain('Saved 2 cells.');
    expect(container.textContent).toContain('nothing unsaved');
    expect(byText(/^Save cells$/).disabled).toBe(true);
  });
  it('a yes/no, a choose-any and the week are cells too; discard restores the baseline; a refused save is said plainly', async () => {
    const onSave = vi.fn(async () => ({ ok: false, message: 'that packet is not yours to change' }));
    await mount(createElement(TlcRecordEditor, { sections: live, record, onSave, who: 'self' }));
    await click(byText(/^Credentialing/));
    await click(Array.from(container.querySelectorAll('label')).find((l) => /^Yes$/.test(l.textContent)).querySelector('input'));
    expect(container.textContent).toContain('1 unsaved');
    await click(byText(/^Discard changes$/));
    expect(container.textContent).toContain('nothing unsaved');
    await click(byText(/^Weekly availability/));
    await click(byText(/^7 am - 8 am$/));
    await click(byText(/^Clinical profile/));
    await click(Array.from(container.querySelectorAll('input[type="checkbox"]'))[0]);
    expect(container.textContent).toContain('2 unsaved');
    await click(byText(/^Save 2 cells$/));
    await settle();
    const patch = onSave.mock.calls[0][0];
    expect(patch.availability.Monday).toEqual(['7 am - 8 am']);
    expect(Object.keys(patch).sort()).toEqual(['availability', 'populationsServed']);
    expect(container.querySelector('[role="alert"]').textContent).toContain('not yours to change');
    expect(container.textContent).toContain('2 unsaved'); // nothing lost on a refusal
  });
});

describe('My record on Team (a colleague fills or corrects their own cells)', () => {
  it('a colleague with a packet opens their record and a save goes through patchPacket on their own packet id', async () => {
    const { default: TlcTeamResources } = await import('../components/TlcTeamResources.jsx');
    await mount(createElement(TlcTeamResources, { staff: true }));
    await settle();
    expect(container.textContent).toContain('My intake packet');
    await click(byText(/My record · fill or correct any cell/));
    await settle();
    expect(container.textContent).toMatch(/cells hold an answer/);
    await click(byText(/^About you/));
    await type(container.querySelector('#c-phone'), '309');
    await click(byText(/^Save 1 cell$/));
    await settle();
    expect(sent.patches).toEqual([{ id: 'p1', patch: { phone: '309' }, note: '' }]);
    expect(container.textContent).toContain('Saved 1 cell.');
    await click(byText(/Close my record/));
    expect(container.textContent).not.toMatch(/cells hold an answer/);
  });
});

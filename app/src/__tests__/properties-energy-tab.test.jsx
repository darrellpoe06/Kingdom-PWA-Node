// =============================================================================
// THE ENERGY TAB SHOWS WHAT THE METER SAID, AND NOTHING IT DID NOT (DR-1098)
// =============================================================================
// Pins, each against the real component with a fake data layer:
//   * an empty door says how to get the utility's file, never a zero;
//   * stored hours become counted figures (used, per day, always-on, peak);
//   * a figure that cannot be counted says WHY (no cost in the file);
//   * a picked file is parsed and shown BEFORE anything is saved, and a file
//     with no unit is refused with the reason;
//   * filing sends the import and its readings for THIS door, and a partial
//     save says how many landed and that re-filing doubles nothing;
//   * the tab is registered on the owner's face and is reportable.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { EnergyTab } from '../modules/properties/EnergyTab.jsx';
import { MANAGER_TABS, TENANT_TABS, WORKER_TABS } from '../modules/properties/model.js';
import { FEEDBACK_AREAS } from '../components/FeedbackCenter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DOOR = { id: '11111111-2222-3333-4444-555555555555', instance_id: '99999999-0000-0000-0000-000000000000' };
const TZ = 'America/Chicago';

// Eight whole days of hours: 0.3 kWh overnight (00-05 local), 1.2 kWh otherwise.
function hours({ cost = false } = {}) {
  const out = [];
  const t0 = Date.UTC(2026, 8, 1, 5);
  for (let d = 0; d < 8; d += 1) for (let h = 0; h < 24; h += 1) {
    const wh = h < 6 ? 300 : 1200;
    out.push({ commodity: 'electricity', direction: 'delivered', start_at: new Date(t0 + (d * 24 + h) * 3600000).toISOString(), seconds: 3600, amount: String(wh), cost_cents: cost ? String(wh * 0.015) : null, quality: 'measured' });
  }
  return out;
}

function fakeApi(over = {}) {
  return {
    loadImports: vi.fn(async () => ({ ok: true, imports: [] })),
    loadHours: vi.fn(async () => ({ ok: true, hours: [], truncated: false })),
    save: vi.fn(async ({ buildRows }) => { const rows = buildRows('imp-1'); return { ok: true, importId: 'imp-1', saved: rows.length, total: rows.length }; }),
    remove: vi.fn(async () => ({ ok: true })),
    ...over,
  };
}

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

async function mount(props) {
  await act(async () => { root.render(createElement(EnergyTab, { door: DOOR, timeZone: TZ, ...props })); });
  await act(async () => { await Promise.resolve(); });
}
const text = () => host.textContent.replace(/\s+/g, ' ');

async function pickFile(name, content) {
  const input = host.querySelector('input[type="file"]');
  const file = new File([content], name, { type: 'text/csv' });
  if (typeof file.text !== 'function') file.text = async () => content;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe('the Energy tab', () => {
  it('an empty door says how to get the file, never a zero', async () => {
    const api = fakeApi();
    await mount({ api, canManage: true });
    expect(text()).toMatch(/No meter readings yet/);
    expect(text()).toMatch(/Green Button/);
    expect(text()).not.toMatch(/0 kWh/);
    expect(api.loadHours).toHaveBeenCalledWith(DOOR.id, expect.objectContaining({ since: expect.any(String) }));
  });

  it('counts the stored hours into figures, and says why the rate is missing', async () => {
    await mount({ api: fakeApi({ loadHours: vi.fn(async () => ({ ok: true, hours: hours(), truncated: false })) }) });
    const t = text();
    expect(t).toMatch(/Used/);
    expect(t).toMatch(/187 kWh/);               // 8 x (6 x 0.3 + 18 x 1.2) = 187.2, shown whole above 100
    expect(t).toMatch(/23\.4 kWh/);             // per day
    expect(t).toMatch(/300 W/);                 // the quietest hour, median
    expect(t).toMatch(/The file carried no cost/);
    expect(t).toMatch(/September 2026/);
  });

  it('shows a rate only when every reading carried a cost', async () => {
    await mount({ api: fakeApi({ loadHours: vi.fn(async () => ({ ok: true, hours: hours({ cost: true }), truncated: false })) }) });
    expect(text()).toMatch(/15¢/);
  });

  it('parses a picked file on the device and shows it before saving; files it for this door', async () => {
    const api = fakeApi();
    await mount({ api, canManage: true });
    await pickFile('ameren.csv', 'TYPE,DATE,START TIME,END TIME,USAGE (kWh),COST\nElectric usage,2026-09-01,00:00,00:59,0.5,$0.07\nElectric usage,2026-09-01,01:00,01:59,0.5,$0.07');
    expect(text()).toMatch(/ameren\.csv: 2 readings/);
    expect(text()).toMatch(/Nothing is saved until you file it/);
    expect(api.save).not.toHaveBeenCalled();
    const fileBtn = [...host.querySelectorAll('button')].find((b) => /File on this door/.test(b.textContent));
    await act(async () => { fileBtn.click(); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(api.save).toHaveBeenCalledTimes(1);
    const { importRow, buildRows } = api.save.mock.calls[0][0];
    expect(importRow).toMatchObject({ rental_ref: DOOR.id, instance_id: DOOR.instance_id, file_name: 'ameren.csv', source_format: 'csv', reading_count: 2 });
    expect(importRow.file_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(buildRows('x').every((r) => r.rental_ref === DOOR.id && r.import_id === 'x' && r.unit === 'Wh')).toBe(true);
    expect(text()).toMatch(/Filed 2 readings on this door/);
  });

  it('refuses a file with no unit, with the reason, and saves nothing', async () => {
    const api = fakeApi();
    await mount({ api, canManage: true });
    await pickFile('mystery.csv', 'DATE,START TIME,END TIME,USAGE\n2026-09-01,00:00,00:59,0.5');
    expect(text()).toMatch(/does not say whether its numbers are kWh or therms/);
    expect(host.querySelector('button')?.textContent || '').not.toMatch(/File on this door/);
    expect(api.save).not.toHaveBeenCalled();
  });

  it('a partial save says how many landed and that re-filing doubles nothing', async () => {
    const api = fakeApi({ save: vi.fn(async () => ({ ok: false, reason: 'readings-failed', saved: 500, total: 1200, importId: 'i' })) });
    await mount({ api, canManage: true });
    await pickFile('a.csv', 'DATE,START TIME,END TIME,USAGE (kWh)\n2026-09-01,00:00,00:59,0.5');
    const fileBtn = [...host.querySelectorAll('button')].find((b) => /File on this door/.test(b.textContent));
    await act(async () => { fileBtn.click(); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(text()).toMatch(/500 of 1,200 were saved/);
    expect(text()).toMatch(/nothing will be doubled/);
  });

  it('a reader without the manage right sees no file picker', async () => {
    await mount({ api: fakeApi(), canManage: false });
    expect(host.querySelector('input[type="file"]')).toBeNull();
  });

  it('says the reason when the store is not on the database yet', async () => {
    await mount({ api: fakeApi({ loadHours: vi.fn(async () => ({ ok: false, reason: 'not-enabled-yet' })) }) });
    expect(text()).toMatch(/not on this database yet/);
  });
});

describe('the tab has a place and an address', () => {
  it('is on the owner’s face, after Systems, and never on a tenant’s or worker’s', () => {
    const ids = MANAGER_TABS.map((t) => t.id);
    expect(ids).toContain('energy');
    expect(ids.indexOf('energy')).toBe(ids.indexOf('systems') + 1);
    expect(TENANT_TABS.map((t) => t.id)).not.toContain('energy');
    expect(WORKER_TABS.map((t) => t.id)).not.toContain('energy');
  });
  it('can be reported against by name', () => {
    const keys = FEEDBACK_AREAS.flatMap((g) => g.items.map(([k]) => k));
    expect(keys.some((k) => /energy/.test(k))).toBe(true);
  });
});

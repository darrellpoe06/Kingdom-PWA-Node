// =============================================================================
// The Create station: every panel on every device, ordered for the device
// (DR-0678). Darrell 2026-09-29: "Laptop for creating... we need to be able to
// use the devices appropriately"
// =============================================================================
// The children are the existing components (imported, never rewritten); they
// are stubbed here so this proves the STATION: its order, its layout, its
// gates, and that no class loses a panel. The measured layouts are the layout
// probe's job (scripts/chrome-layout-probe.mjs, the device pass).
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../components/OneVoiceInput.jsx', () => ({ default: (p) => createElement('div', { 'data-testid': 'stub-voice', 'data-route': p.surfaceConfig && p.surfaceConfig.defaultRoute }) }));
vi.mock('../components/LessonInbox.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-inbox' }) }));
vi.mock('../components/MemberLessonQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-member-queue' }) }));
vi.mock('../components/GovernanceQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-governance' }) }));

const { default: CreatingStation, PINNED_OPTIONAL } = await import('../components/CreatingStation.jsx');
const { PANEL_KEYS, orderPanels, CLIENT_CLASSES } = await import('../lib/device-roles.js');

const HERE = dirname(fileURLToPath(import.meta.url));
let host = null; let root = null;
function mount(props) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(createElement(CreatingStation, props)); });
  return host;
}
afterEach(() => { act(() => root && root.unmount()); host && host.remove(); host = null; root = null; });
const panels = (el) => [...el.querySelectorAll('[data-panel]')].map((s) => s.getAttribute('data-panel'));

describe('the Create station', () => {
  for (const cls of CLIENT_CLASSES) {
    it(`${cls}: every panel, in the ${cls}'s order`, () => {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      expect(el.querySelector('[data-testid="creating-station"]').getAttribute('data-device-class')).toBe(cls);
      expect(panels(el)).toEqual(orderPanels(cls));
      expect([...panels(el)].sort()).toEqual([...PANEL_KEYS].sort());
    });
  }

  it('laptop: two columns across the width, the long work full width, the keys shown', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    const grid = el.querySelector('[data-testid="station-grid"]');
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(el.querySelector('#station-your-lessons').style.gridColumn).toBe('1 / -1');
    expect(el.querySelector('#station-governor').style.gridColumn).toBe('1 / -1');
    expect(el.querySelector('[data-testid="station-shortcuts"]').textContent).toMatch(/Alt\+1 Your lessons/);
  });

  it('phone: one column, the recorder first with the Lesson chip chosen, the laptop handoff offered', () => {
    const el = mount({ deviceClass: 'phone', signedIn: true, isGovernor: true });
    expect(el.querySelector('[data-testid="station-grid"]').style.gridTemplateColumns).toBe('minmax(0, 1fr)');
    expect(panels(el)[0]).toBe('record');
    expect(el.querySelector('[data-testid="stub-voice"]').getAttribute('data-route')).toBe('lesson');
    expect(el.querySelector('[data-testid="station-handoff"]').textContent).toMatch(/laptop/);
    expect(el.querySelector('[data-testid="station-handoff-url"]').textContent).toMatch(/\?view=create&panel=your-lessons$/);
    expect(el.querySelector('[data-testid="station-shortcuts"]')).toBe(null);
  });

  it('TV: reading and listening first', () => {
    const el = mount({ deviceClass: 'tv', signedIn: true });
    expect(panels(el)[0]).toBe('read-listen');
    expect(el.querySelector('[data-testid="station-read-listen"]')).not.toBe(null);
  });

  it('the laptop hands off to the phone with a QR to scan', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true });
    expect(el.querySelector('[data-testid="station-handoff-qr"] svg')).not.toBe(null);
    expect(el.querySelector('[data-testid="station-handoff-url"]').textContent).toMatch(/panel=record$/);
  });

  it('role gates are unchanged by device: a non-Governor is told, on every class', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: false });
      expect(el.querySelectorAll('[data-testid="station-governor-only"]').length).toBe(2);
      expect(el.querySelector('[data-testid="stub-governance"]')).toBe(null);
      act(() => root.unmount()); host.remove(); root = null; host = null;
    }
  });

  it('the Governor gets his queues on every class', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      expect(el.querySelector('[data-testid="stub-governance"]')).not.toBe(null);
      expect(el.querySelector('[data-testid="stub-member-queue"]')).not.toBe(null);
      act(() => root.unmount()); host.remove(); root = null; host = null;
    }
  });

  it('Alt+2 jumps to the second panel on the laptop', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    const second = orderPanels('laptop')[1];
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'Digit2', key: '2' })); });
    expect(document.activeElement).toBe(el.querySelector(`#station-${second}-h`));
  });
});

describe('the components from work not yet on main are pinned', () => {
  it('each optional panel names its file and its source', () => {
    expect(PINNED_OPTIONAL.decide.pattern).toBe('./LessonReviewQueue.jsx');
    expect(PINNED_OPTIONAL.decide.from).toMatch(/#1841/);
    expect(PINNED_OPTIONAL.towers.pattern).toBe('./TowerParity');
  });

  it('when #1841 lands, LessonReviewQueue is a default export the station can mount', () => {
    const f = join(HERE, '../components/LessonReviewQueue.jsx');
    if (!existsSync(f)) {
      // Not merged yet: the station says so plainly instead of rendering nothing.
      const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
      expect(el.querySelector('[data-testid="station-decide-pending"]').textContent).toMatch(/#1841/);
      return;
    }
    expect(readFileSync(f, 'utf8')).toMatch(/export default function LessonReviewQueue\(/);
  });

  it('until the tower parity panel lands, the towers panel says where the towers are', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    const pending = el.querySelector('[data-testid="station-towers-pending"]');
    if (pending) expect(pending.textContent).toMatch(/operations board/);
  });
});

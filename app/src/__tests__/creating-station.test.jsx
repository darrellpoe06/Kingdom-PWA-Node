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
vi.mock('../components/LessonReviewQueue.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'stub-review-queue' }) }));
vi.mock('../components/TowerParity.jsx', () => ({ default: (p) => createElement('div', { 'data-testid': 'stub-tower-parity', 'data-signed-in': String(!!p.signedIn) }) }));

const { default: CreatingStation, PINNED_FROM } = await import('../components/CreatingStation.jsx');
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

describe('the components from parallel work are on main and mounted for real', () => {
  it('each names its file and its source, and the file exists with a default export', () => {
    expect(PINNED_FROM.decide.file).toBe('./LessonReviewQueue.jsx');
    expect(PINNED_FROM.decide.from).toMatch(/#1841/);
    expect(PINNED_FROM.towers.file).toBe('./TowerParity.jsx');
    expect(PINNED_FROM.towers.from).toMatch(/#1845/);
    const q = join(HERE, '../components/LessonReviewQueue.jsx');
    const t = join(HERE, '../components/TowerParity.jsx');
    expect(existsSync(q)).toBe(true);
    expect(existsSync(t)).toBe(true);
    expect(readFileSync(q, 'utf8')).toMatch(/export default function LessonReviewQueue\(/);
    expect(readFileSync(t, 'utf8')).toMatch(/export default function TowerParity\(/);
  });

  it('the Governor gets the real LessonReviewQueue beside the members\' queue, on every class; no placeholder remains', () => {
    for (const cls of CLIENT_CLASSES) {
      const el = mount({ deviceClass: cls, signedIn: true, isGovernor: true });
      const decide = el.querySelector('#station-decide');
      expect(decide.querySelector('[data-testid="stub-review-queue"]')).not.toBe(null);
      expect(decide.querySelector('[data-testid="stub-member-queue"]')).not.toBe(null);
      expect(el.querySelector('[data-testid="station-decide-pending"]')).toBe(null);
      act(() => root.unmount()); host.remove(); root = null; host = null;
    }
  });

  it('a non-Governor never mounts the review queue (the gate is unchanged)', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: false });
    expect(el.querySelector('[data-testid="stub-review-queue"]')).toBe(null);
  });

  it('the Towers panel mounts the real TowerParity when signed in, and asks to sign in otherwise', () => {
    const el = mount({ deviceClass: 'laptop', signedIn: true, isGovernor: true });
    const tp = el.querySelector('#station-towers [data-testid="stub-tower-parity"]');
    expect(tp).not.toBe(null);
    expect(tp.getAttribute('data-signed-in')).toBe('true');
    expect(el.querySelector('[data-testid="station-towers-pending"]')).toBe(null);
    act(() => root.unmount()); host.remove(); root = null; host = null;
    const out = mount({ deviceClass: 'laptop', signedIn: false });
    expect(out.querySelector('[data-testid="stub-tower-parity"]')).toBe(null);
    expect(out.querySelector('#station-towers').textContent).toMatch(/Sign in/);
  });
});

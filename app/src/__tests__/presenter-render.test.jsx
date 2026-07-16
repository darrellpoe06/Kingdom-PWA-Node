// =============================================================================
// Presenter — time-adaptive render smoke + persistence proof
// =============================================================================
// Mounts the REAL <Presenter> (the generalized two-screen primitive) with a small
// presentable and proves the time-adaptive surface works end-to-end at the React
// layer, not just in the pure helpers:
//   • "I have ___ minutes" reflows the curriculum and surfaces a skip suggestion;
//   • adding a section persists the living-curriculum overlay to injected storage.
// Render harness matches the repo convention (createRoot + act, no testing-library).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import Presenter from '../components/Presenter.jsx';
import { overlayKey } from '../lib/presentable.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A two-scene curriculum: one CORE (10 min) + one SUPPLEMENTARY (10 min) = 20 full.
const PRESENTABLE = {
  id: 'test:deck',
  title: 'Test deck',
  targetMin: 20,
  scenes: [
    { id: 'core', indexLabel: '1 of 2', estimatedMin: 10, minMin: 6, priority: 'core', audience: { title: 'Core idea' }, notes: [] },
    { id: 'supp', indexLabel: '2 of 2', estimatedMin: 10, minMin: 6, priority: 'supplementary', audience: { title: 'Bonus idea' }, notes: [] },
  ],
};

function memStorage(seed = {}) {
  const m = { ...seed };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, _store: m };
}

let container, root, store;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  store = memStorage();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

function fireInput(node, value) {
  // React listens on the native 'input' event; set value then dispatch it.
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(node, value);
  node.dispatchEvent(new window.Event('input', { bubbles: true }));
}

describe('Presenter — time-adaptive render', () => {
  it('mounts and shows the budget input + weight framing', () => {
    act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, storage: store })));
    expect(container.querySelector('input[aria-label="Minutes available"]')).toBeTruthy();
    expect(container.textContent).toMatch(/full = 20 min/);
    expect(container.textContent).toMatch(/own weight/i);     // each section runs to its weight
  });

  it('reflows PROPORTIONALLY at a budget that fits the floors (no skip)', () => {
    act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, storage: store })));
    const input = container.querySelector('input[aria-label="Minutes available"]');
    act(() => fireInput(input, '16')); // 16 < 20 full, but > floors (6+6) -> shrink both to 8, no skip
    expect(container.textContent).toMatch(/keeps its share/i);
    expect(container.textContent).toMatch(/8 min/);            // live computed minutes
    expect(container.textContent).not.toMatch(/skipping/i);
  });

  it('falls back to a skip suggestion when the floors no longer fit (core protected)', () => {
    act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, storage: store })));
    const input = container.querySelector('input[aria-label="Minutes available"]');
    act(() => fireInput(input, '10')); // 10 < floors (6+6=12) -> must skip the supplementary
    expect(container.textContent).toMatch(/skipping 1 supplementary/i);
    expect(container.textContent).toMatch(/core still lands/i);
  });

  it('RESCALES the run-of-show segments live and shows original → adjusted', () => {
    // A scene carrying a real run-of-show (segments sum to 30): Prayer 5 / Teach 10 / Hands-on 15.
    const withRos = {
      id: 'ros:deck', title: 'ROS', targetMin: 30,
      scenes: [{
        id: 's1', indexLabel: 'Week 1', estimatedMin: 30, audience: { title: 'Session' }, notes: [],
        runOfShow: [
          { id: 'a', name: 'Prayer', estimatedMin: 5, priority: 'core' },
          { id: 'b', name: 'Teach', estimatedMin: 10, priority: 'core' },
          { id: 'c', name: 'Hands-on', estimatedMin: 15, priority: 'core' },
        ],
      }],
    };
    act(() => root.render(createElement(Presenter, { presentable: withRos, storage: store })));
    // at full budget (none set), the run-of-show shows its authored total, not "rescaled"
    expect(container.textContent).toMatch(/Run of show/i);
    expect(container.textContent).toMatch(/30 min total/);
    expect(container.textContent).not.toMatch(/rescaled to/i);
    // lower the clock to 15 -> proportional halving, shown as original → adjusted
    const input = container.querySelector('input[aria-label="Minutes available"]');
    act(() => fireInput(input, '15'));
    expect(container.textContent).toMatch(/rescaled to 15 min/i);
    expect(container.textContent).toMatch(/15 → 7\.5/);  // Hands-on 15 -> 7.5, the heaviest stays heaviest
    expect(container.textContent).toMatch(/5 → 2\.5/);   // Prayer 5 -> 2.5
  });

  it('adds a section and persists the overlay to the injected storage', () => {
    act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, storage: store })));
    // open the add form
    const addBtn = [...container.querySelectorAll('button')].find((b) => /add a section/i.test(b.textContent));
    expect(addBtn).toBeTruthy();
    act(() => addBtn.click());
    // fill the title and submit
    const titleInput = container.querySelector('input[placeholder="e.g. Closing prayer"]');
    expect(titleInput).toBeTruthy();
    act(() => fireInput(titleInput, 'Closing prayer'));
    const saveBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add section');
    act(() => saveBtn.click());
    // persisted under the per-presentable overlay key, carrying the new section
    const raw = store.getItem(overlayKey('test:deck'));
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw);
    expect(saved.added[0].audience.title).toBe('Closing prayer');
  });

  it('hides the add/edit controls when canEdit is false (respects permissions)', () => {
    act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, storage: store, canEdit: false })));
    const addBtn = [...container.querySelectorAll('button')].find((b) => /add a section/i.test(b.textContent));
    expect(addBtn).toBeFalsy();
  });

  it('presents on THIS screen (no popup) with the age toggle reachable, and re-pitches live', () => {
    // A slide that carries per-band wording so switching the band changes the room's text.
    const aged = {
      id: 'aged:deck', title: 'Aged deck', targetMin: 10,
      scenes: [{
        id: 's1', indexLabel: 'Part 1 of 1', estimatedMin: 10,
        audience: { title: 'The big idea', lead: 'grown-up wording', leadByAge: { child: 'kid wording', teen: 'teen wording', adult: 'grown-up wording' } },
        notes: [],
      }],
    };
    act(() => root.render(createElement(Presenter, { presentable: aged, storage: store, initialAge: 'adult' })));
    // enter present-on-this-screen (no window.open needed)
    const onScreenBtn = [...container.querySelectorAll('button')].find((b) => /present on this screen/i.test(b.textContent));
    expect(onScreenBtn).toBeTruthy();
    act(() => onScreenBtn.click());
    // the room sees the adult wording, and the age toggle is right there on the bar
    expect(container.textContent).toMatch(/grown-up wording/);
    const childChip = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Children');
    expect(childChip).toBeTruthy();
    // switch the room to Children mid-slide -> the wording re-pitches instantly, no navigation
    act(() => childChip.click());
    expect(container.textContent).toMatch(/kid wording/);
    expect(container.textContent).not.toMatch(/grown-up wording/);
    // and back out to the speaker console without losing the place
    const exitBtn = [...container.querySelectorAll('button')].find((b) => /speaker view/i.test(b.textContent));
    act(() => exitBtn.click());
    expect(container.querySelector('input[aria-label="Minutes available"]')).toBeTruthy();
  });
});

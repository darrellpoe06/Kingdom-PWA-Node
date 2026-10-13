// =============================================================================
// games-spinner.test.jsx — the ACTUAL spinner (Christyn, 2026-07-07)
// =============================================================================
// The game's spin used to resolve as invisible text. These tests pin the whole
// chain per DR-0076: the engine records the REAL spun value on the log (the
// wheel is presentation over authoritative state, never a second random), the
// rotation math deterministically lands that value's wedge under the pointer
// with real forward turns, and the mounted wheel renders statically for a
// reloaded game but animates a NEW spin.
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createGame, choosePath, takeTurn, lastSpin, spinWheel,
} from '../lib/games/engine.js';
import SpinnerWheel, {
  spinTargetRotation, wedgeAngle, WEDGE_COLORS, WHEEL_MIN, WHEEL_MAX,
} from '../components/games/SpinnerWheel.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { document.body.innerHTML = ''; });

// A long plain trunk so a spin's landing never pauses on a decision and the
// position delta equals the spun value exactly.
const DEF = {
  id: 'spin-test',
  categories: [{ key: 'a', label: 'A', weight: 1 }],
  paths: [{ id: 'p1', label: 'One', opening: [{ id: 'o1', type: 'word', title: 'O1', effects: { a: 1 } }] }],
  trunk: [
    ...Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, type: 'word', title: `T${i}`, effects: { a: 1 } })),
    { id: 'fin', type: 'finish', title: 'End' },
  ],
  decks: {},
  legacy: () => ({ tier: 'done' }),
};

describe('engine — the spin log carries the real value the wheel lands on', () => {
  it('takeTurn records value: the exact seeded spin, matching the movement', () => {
    const opened = choosePath(DEF, createGame(DEF, { seed: 11 }), 'p1');
    const [expected] = spinWheel(opened.seed);
    const after = takeTurn(DEF, opened);
    const entry = after.log.find((e) => e.type === 'spin');
    expect(entry.value).toBe(expected);
    expect(entry.value).toBeGreaterThanOrEqual(WHEEL_MIN);
    expect(entry.value).toBeLessThanOrEqual(WHEEL_MAX);
    expect(after.position - opened.position).toBe(entry.value);
  });

  it('lastSpin: null before any spin; then the LATEST value with a growing index', () => {
    const opened = choosePath(DEF, createGame(DEF, { seed: 7 }), 'p1');
    expect(lastSpin(opened)).toBeNull();
    const one = takeTurn(DEF, opened);
    const s1 = lastSpin(one);
    const two = takeTurn(DEF, one);
    const s2 = lastSpin(two);
    expect(s1.value).toBeGreaterThanOrEqual(WHEEL_MIN);
    expect(s2.index).toBeGreaterThan(s1.index);
    expect(s2.value).toBe(two.log[s2.index].value);
  });

  it('lastSpin falls back to parsing the title for saves recorded before `value` existed', () => {
    expect(lastSpin({ log: [{ type: 'spin', title: 'Spin: 4', body: '' }] })).toEqual({ value: 4, index: 0 });
  });
});

describe('rotation math — deterministic landings, real forward turns', () => {
  it('lands every value\'s wedge under the pointer from any starting rotation', () => {
    for (const start of [0, 123, 987, 3600]) {
      for (let v = WHEEL_MIN; v <= WHEEL_MAX; v++) {
        const t = spinTargetRotation(start, v);
        expect((t + wedgeAngle(v)) % 360).toBe(0);
      }
    }
  });

  it('always spins forward at least three full turns, never more than four', () => {
    for (let v = WHEEL_MIN; v <= WHEEL_MAX; v++) {
      const d = spinTargetRotation(1234, v) - 1234;
      expect(d).toBeGreaterThanOrEqual(3 * 360);
      expect(d).toBeLessThan(4 * 360);
    }
  });

  it('accumulates across consecutive spins (the wheel never twitches backwards)', () => {
    let r = 0;
    for (const v of [4, 4, 1, 6]) {
      const next = spinTargetRotation(r, v);
      expect(next).toBeGreaterThan(r);
      r = next;
    }
  });
});

describe('the wheel itself — six wedges, no true red (DR-0099)', () => {
  it('has one color per value and none of them is true red', () => {
    expect(WEDGE_COLORS.length).toBe(WHEEL_MAX - WHEEL_MIN + 1);
    for (const hex of WEDGE_COLORS) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      // "true red" = high red with LOW green and blue. Orange/coral (high red,
      // substantial green) is explicitly NOT red per DR-0099 and is allowed.
      expect(r > 180 && g < 100 && b < 100).toBe(false);
    }
  });
});

function mount(props) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(SpinnerWheel, props)); });
  return {
    host, root,
    rerender: (next) => act(() => { root.render(createElement(SpinnerWheel, next)); }),
    wheel: () => host.querySelector('[role="img"]'),
    rotator: () => host.querySelector('[role="img"]').firstElementChild,
  };
}

describe('SpinnerWheel mounted — static on reload, animated on a new spin', () => {
  it('renders all six numbers and announces its value to assistive tech', () => {
    const m = mount({ value: 4, spinSeq: 0 });
    expect(m.wheel().getAttribute('aria-label')).toBe('Spinner wheel showing 4');
    const texts = [...m.host.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(texts).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('shows the FIRST value at rest (a reloaded game never replays a spin)', () => {
    const m = mount({ value: 4, spinSeq: 3 });
    // wedge 4 sits 180deg clockwise from the pointer -> rest rotation 180.
    expect(m.rotator().style.transform).toBe('rotate(180deg)');
  });

  it('animates a NEW spin forward onto the exact target (deterministic)', () => {
    const m = mount({ value: 4, spinSeq: 0 });
    m.rerender({ value: 2, spinSeq: 1 });
    // from 180: three turns + 120 to bring wedge 2's rest angle (300) under the pointer.
    expect(m.rotator().style.transform).toBe('rotate(1380deg)');
  });

  it('animateFirst spins even the first value seen (the phone overlay case)', () => {
    const m = mount({ value: 3, spinSeq: 5, animateFirst: true });
    expect(m.rotator().style.transform).toBe(`rotate(${spinTargetRotation(0, 3)}deg)`);
  });

  it('unspun wheel says so instead of faking a number', () => {
    const m = mount({ value: null });
    expect(m.wheel().getAttribute('aria-label')).toBe('Spinner wheel, not yet spun');
  });
});

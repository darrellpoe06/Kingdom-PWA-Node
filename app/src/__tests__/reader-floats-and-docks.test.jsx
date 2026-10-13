// @vitest-environment jsdom
// =============================================================================
// The reader floats and docks (DR-0641; Darrell 2026-09-24: "Maybe be a popout
// reader that floating around? Then can be reset back to normal?")
// =============================================================================
// Mounts the ACTUAL reader and drives: Pop out → a floating window with the
// paragraph and the controls, the corner reader out of the way; its buttons
// drive the same engine; dragging it off screen is clamped back; a double-tap
// resets it; Dock returns the normal reader; floating is remembered across a
// reload. Proven-to-catch: each fails against the behavior it pins (no float,
// an unclamped drag, a reset that does nothing, a dock that does not dock,
// state that is forgotten).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const spy = { read: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(), setRate: vi.fn() };
const state = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: (...a) => spy.read(...a), pause: (...a) => spy.pause(...a), resume: (...a) => spy.resume(...a), stop: (...a) => spy.stop(...a),
    claimAudio: () => {}, setRate: (...a) => spy.setRate(...a), segmentIndex: 0, deviceRead: true, setBoundaryHandler: null, cloudProgress: 0,
    audioVoice: 'audio', setSkipHandlers: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');
const { FLOAT_KEY, EDGE } = await import('../lib/float-geometry.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'lesson-float-test';
const PARAS = ['The first paragraph opens it. It has two sentences.', 'The second paragraph follows. It has its own words.'];
let container, root, lessonEl;

beforeEach(() => {
  Object.values(spy).forEach((f) => f.mockClear());
  state.isReading = false; state.isPaused = false;
  try { localStorage.clear(); } catch { /* ignore */ }
  window.innerWidth = 390; window.innerHeight = 844;
  lessonEl = document.createElement('main');
  lessonEl.innerHTML = `<div id="lesson-float">${PARAS.map((p) => `<p>${p}</p>`).join('')}</div>`;
  document.body.appendChild(lessonEl);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove(); lessonEl.remove();
  try { clearReadTarget(OWNER); } catch { /* ignore */ }
});

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 400)); });
const q = (id) => document.querySelector(`[data-testid="${id}"]`);
const pointer = (el, type, x, y) => act(() => { el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })); });

async function readThenPopOut() {
  render();
  act(() => { setReadTarget(OWNER, { label: 'this lesson', title: 'Lesson Seven', text: PARAS.join(' '), elementId: 'lesson-float' }); });
  act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
  const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
  act(() => { readBtn.click(); });
  await settle();
  state.isReading = true;
  render();
  // Reading collapses the panel to the pill; the full panel carries Pop out.
  const expand = container.querySelector('button[aria-label="Expand reading controls"]');
  if (expand) act(() => { expand.click(); });
  act(() => { container.querySelector('[data-testid="reader-pop-out"]').click(); });
}

describe('Pop out', () => {
  it('opens a floating window with the paragraph being read, and moves the corner reader out of the way', async () => {
    await readThenPopOut();
    expect(q('floating-reader'), 'no float after Pop out').toBeTruthy();
    expect(q('float-title').textContent).toBe('Lesson Seven');
    expect(q('float-words').textContent).toMatch(/The first paragraph opens it\./);
    expect(q('float-words').querySelector('[data-current="true"]').textContent).toMatch(/The first paragraph opens it\./);
    expect(container.querySelector('[data-testid="reader-mini-bar"]')).toBeNull();
  });

  it('its buttons drive the same engine', async () => {
    await readThenPopOut();
    act(() => { q('float-playpause').click(); });
    expect(spy.pause).toHaveBeenCalledTimes(1);
    spy.read.mockClear();
    act(() => { q('float-forward').click(); });
    expect(String(spy.read.mock.calls.at(-1)[0])).toMatch(/^The second paragraph/);
    const speed = q('float-speed');
    act(() => { speed.value = speed.querySelectorAll('option')[3].value; speed.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(spy.setRate).toHaveBeenCalled();
  });
});

describe('move, reset, dock', () => {
  it('a drag far off screen is clamped back on screen', async () => {
    await readThenPopOut();
    const bar = q('float-titlebar');
    pointer(bar, 'pointerdown', 100, 100);
    pointer(bar, 'pointermove', -3000, -3000);
    pointer(bar, 'pointerup', -3000, -3000);
    const box = q('floating-reader');
    expect(parseInt(box.style.left, 10)).toBeGreaterThanOrEqual(EDGE);
    expect(parseInt(box.style.top, 10)).toBeGreaterThanOrEqual(EDGE);
    pointer(bar, 'pointerdown', 100, 100);
    pointer(bar, 'pointermove', 5000, 5000);
    pointer(bar, 'pointerup', 5000, 5000);
    expect(parseInt(box.style.left, 10) + parseInt(box.style.width, 10)).toBeLessThanOrEqual(390 - EDGE);
    expect(parseInt(box.style.top, 10) + parseInt(box.style.height, 10)).toBeLessThanOrEqual(844 - EDGE);
  });

  it('a double-tap on the title bar puts it back to its starting place', async () => {
    await readThenPopOut();
    const start = { left: q('floating-reader').style.left, top: q('floating-reader').style.top };
    const bar = q('float-titlebar');
    pointer(bar, 'pointerdown', 200, 700); pointer(bar, 'pointermove', 20, 20); pointer(bar, 'pointerup', 20, 20);
    expect(q('floating-reader').style.top).not.toBe(start.top);
    act(() => { bar.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); });
    expect(q('floating-reader').style.left).toBe(start.left);
    expect(q('floating-reader').style.top).toBe(start.top);
  });

  it('Dock returns the normal reader, and the choice is remembered', async () => {
    await readThenPopOut();
    expect(JSON.parse(localStorage.getItem(FLOAT_KEY)).floating).toBe(true);
    act(() => { q('float-dock').click(); });
    expect(q('floating-reader')).toBeNull();
    expect(container.querySelector('[data-testid="reader-mini-bar"]')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(FLOAT_KEY)).floating).toBe(false);
  });

  it('floating survives a reload (a fresh mount reads it back)', async () => {
    await readThenPopOut();
    act(() => root.unmount());
    root = createRoot(container);
    render();
    expect(q('floating-reader'), 'the float was forgotten across a reload').toBeTruthy();
  });
});

// @vitest-environment jsdom
// =============================================================================
// Follow the voice — the listener's own choices, said in words (DR-0659)
// =============================================================================
// Darrell 2026-09-24: "Still need the reader to keep up with the sentence when
// users want to... do we have all options?" And from his phone: "text orange
// means follow!!!!!" — he had read the focus ring as the state.
//
// Pinned here, each proven by breaking it:
//   • Follow ON scrolls to the playing piece's sentence at the chosen place;
//     OFF never scrolls, and the sentence is still lit.
//   • Highlight OFF lights nothing.
//   • The mini-bar button SAYS "Following" / "Follow" (aria-pressed), and it
//     and the panel's "Follow the voice" are one stored choice.
//   • The choices are remembered on this device.
//   • The sentence lands at the top (under what is pinned there) or the centre.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readingScrollDelta } from '../lib/read-follow.js';
import { loadFollowPrefs, saveFollowPrefs, FOLLOW_DEFAULTS, FOLLOW_PREFS_KEY } from '../lib/reader-follow-prefs.js';

const calls = { lit: [], scrolled: [] };
vi.mock('../lib/read-follow.js', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    highlightSegment: (r) => { calls.lit.push(r ? r.toString().trim() : null); },
    followRange: (r, o) => { calls.scrolled.push({ text: r ? r.toString().trim() : null, place: o && o.place }); },
  };
});
const state = { isReading: false, cloudPiece: -1, save: null };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    usesNasVoice: true, liteVoice: 'male', offline: null,
    saveForListening: (...a) => state.save(...a),
    supported: true, isReading: state.isReading, isPaused: false, rate: 1.5,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: 0, deviceRead: false, setBoundaryHandler: null,
    cloudProgress: 0, cloudPiece: state.cloudPiece, audioVoice: 'audio',
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

describe('where the sentence lands', () => {
  // A 915 px phone: 180 px pinned at the top (header + the lesson's title
  // block), 110 px of text-size bar at the bottom, 36 px lines (A+++).
  const base = { topInset: 180, bottomInset: 110, viewportHeight: 915, margin: 20, lineHeight: 36 };
  it('top (the default): every next sentence sits just under the pinned top, one line of context above it', () => {
    for (const at of [420, 610, 700, 250]) {
      const d = readingScrollDelta({ ...base, rangeTop: at, rangeBottom: at + 72, place: 'top' });
      expect(at - d).toBe(180 + 14 + 36);
    }
  });
  it('top: within 120 px of the pinned top as the reading advances — the old rule left it near the bottom', () => {
    // The reading advances: each next sentence starts where the last ended.
    const walk = (place) => {
      let top = 250; const tops = [];
      for (let i = 0; i < 8; i++) {
        const d = readingScrollDelta({ ...base, rangeTop: top, rangeBottom: top + 72, ...(place ? { place } : {}) });
        top -= d; tops.push(top);
        top += 72 + 8;
      }
      return tops;
    };
    for (const t of walk('top')) expect(t - 180).toBeLessThanOrEqual(120);
    // The old rule, measured: each sentence lower than the last (250, 330 ...
    // 713) until it sits on the bottom edge of the band, 533 px below the top.
    const old = walk(undefined);
    expect(old.slice(0, 6).every((t, i, a) => i === 0 || t > a[i - 1])).toBe(true);
    expect(old.at(-1) + 72).toBe(915 - 110 - 20);
    expect(old.at(-1) - 180).toBeGreaterThan(500);
  });
  it('top: no line of context when the sentence would not fit under it', () => {
    const d = readingScrollDelta({ ...base, rangeTop: 600, rangeBottom: 600 + 600, place: 'top' });
    expect(600 - d).toBe(180 + 14);
  });
  it('centre: the sentence’s middle on the band’s middle', () => {
    const d = readingScrollDelta({ topInset: 100, bottomInset: 100, viewportHeight: 1000, margin: 20, rangeTop: 150, rangeBottom: 210, place: 'centre' });
    expect(150 - d + 30).toBeCloseTo(500, 0);
  });
  it('already on its line: the page does not nudge', () => {
    expect(readingScrollDelta({ ...base, rangeTop: 180 + 14 + 36 + 6, rangeBottom: 300, place: 'top' })).toBe(0);
  });
});

describe('the choices are kept on this device', () => {
  it('defaults: follow on, sentence highlighted, at the top', () => {
    const mem = new Map();
    const s = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    expect(loadFollowPrefs(s)).toEqual(FOLLOW_DEFAULTS);
    saveFollowPrefs({ follow: false, highlight: 'off', place: 'centre' }, s);
    expect(loadFollowPrefs(s)).toEqual({ follow: false, highlight: 'off', place: 'centre' });
    mem.set(FOLLOW_PREFS_KEY, '{"follow":"yes","highlight":"word","place":"bottom"}');
    expect(loadFollowPrefs(s)).toEqual(FOLLOW_DEFAULTS);
    mem.set(FOLLOW_PREFS_KEY, 'not json');
    expect(loadFollowPrefs(s)).toEqual(FOLLOW_DEFAULTS);
  });
});

describe('on the real reader', () => {
  let container, root, el;
  const SENTS = ['The first sentence is short.', 'The second sentence follows it.', 'The third sentence closes the thought.', 'The fourth sentence ends the reading.'];
  beforeEach(() => {
    calls.lit.length = 0; calls.scrolled.length = 0;
    state.isReading = false; state.cloudPiece = -1;
    try { localStorage.clear(); } catch { /* ignore */ }
    el = document.createElement('main');
    el.innerHTML = `<div id="l191-lesson"><p>${SENTS.join(' ')}</p></div>`;
    document.body.appendChild(el);
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    const { clearReadTarget } = await import('../lib/read-target.js');
    clearReadTarget('l191');
    act(() => root.unmount()); container.remove(); el.remove();
  });

  const startReading = async () => {
    const { default: TTSControl } = await import('../components/TTSControl.jsx');
    const { setReadTarget } = await import('../lib/read-target.js');
    const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
    render();
    act(() => { setReadTarget('l191', { label: 'this lesson', text: SENTS.join(' '), elementId: 'l191-lesson' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    state.isReading = true;
    return render;
  };
  const play = (render, i) => { state.cloudPiece = i; render(); };
  const byTest = (id) => container.querySelector(`[data-testid="${id}"]`);
  const openPanel = (render) => {
    const expand = container.querySelector('button[aria-label="Expand reading controls"]');
    if (expand) act(() => { expand.click(); });
    render();
  };
  const toMiniBar = (render) => {
    const hide = [...container.querySelectorAll('button')].find((b) => /Hide reading controls|Close/.test(b.getAttribute('aria-label') || ''));
    if (hide) act(() => { hide.click(); });
    render();
  };

  it('follow on: each piece’s sentence is lit AND scrolled to, at the top by default', async () => {
    const render = await startReading();
    for (let i = 0; i < SENTS.length; i++) play(render, i);
    expect(calls.lit.slice(-4)).toEqual(SENTS);
    const scrolled = calls.scrolled.slice(-4);
    expect(scrolled.map((s) => s.text)).toEqual(SENTS);
    expect(scrolled.every((s) => s.place === 'top')).toBe(true);
  });

  it('follow off (the panel toggle): the sentence is still lit, the page never moves, and it is remembered', async () => {
    const render = await startReading();
    play(render, 0);
    openPanel(render);
    act(() => { byTest('reader-follow-toggle').click(); });
    expect(byTest('reader-follow-toggle').getAttribute('aria-pressed')).toBe('false');
    expect(JSON.parse(localStorage.getItem(FOLLOW_PREFS_KEY)).follow).toBe(false);
    const before = calls.scrolled.length;
    for (let i = 1; i < SENTS.length; i++) play(render, i);
    expect(calls.lit.slice(-3)).toEqual(SENTS.slice(1));
    expect(calls.scrolled.length).toBe(before);
  });

  it('highlight off: nothing is lit (and the voice is still followed)', async () => {
    const render = await startReading();
    play(render, 0);
    openPanel(render);
    act(() => { byTest('reader-highlight-off').click(); });
    const scrolledBefore = calls.scrolled.length;
    for (let i = 1; i < SENTS.length; i++) play(render, i);
    expect(calls.lit.slice(-3)).toEqual([null, null, null]);
    expect(calls.scrolled.length).toBe(scrolledBefore + 3);
  });

  it('centre: the next sentence is placed in the centre', async () => {
    const render = await startReading();
    play(render, 0);
    openPanel(render);
    act(() => { byTest('reader-place-centre').click(); });
    play(render, 1);
    expect(calls.scrolled.at(-1)).toEqual({ text: SENTS[1], place: 'centre' });
  });

  it('the mini-bar button says the state in words, and it is the same choice as the panel toggle', async () => {
    const render = await startReading();
    play(render, 0);
    toMiniBar(render);
    const btn = () => byTest('reader-show-text');
    expect(btn()).not.toBe(null);
    expect(btn().getAttribute('data-state')).toBe('following');
    expect(btn().getAttribute('aria-pressed')).toBe('true');
    expect(btn().textContent).toMatch(/Following/);
    act(() => { btn().click(); });
    render();
    expect(btn().getAttribute('data-state')).toBe('not-following');
    expect(btn().getAttribute('aria-pressed')).toBe('false');
    expect(btn().textContent).toMatch(/Follow$/);
    expect(JSON.parse(localStorage.getItem(FOLLOW_PREFS_KEY)).follow).toBe(false);
    const before = calls.scrolled.length;
    play(render, 1);
    expect(calls.scrolled.length).toBe(before);
    act(() => { btn().click(); });
    render();
    expect(btn().getAttribute('data-state')).toBe('following');
    play(render, 2);
    expect(calls.scrolled.at(-1).text).toBe(SENTS[2]);
  });

  it('the panel says truthfully how much of the lesson is on this device, and saves it', async () => {
    const { createClipCache, memoryBackend, _setDeviceClipCacheForTests } = await import('../lib/clip-cache.js');
    const backend = memoryBackend();
    const cache = createClipCache({ backend, capBytes: () => 1e9 });
    _setDeviceClipCacheForTests(cache);
    const keys = ['p0', 'p1', 'p2', 'p3'];
    const spoken = [];
    state.save = async (text, { onProgress }) => {
      spoken.push(text);
      onProgress({ saved: 2, total: 4, bytes: 2 * 1024 * 1024 });
      for (const k of keys) await cache.put(k, { size: 1024 * 1024 });
      return { saved: 4, total: 4, bytes: 4 * 1024 * 1024, failed: 0, keys, voice: 'male' };
    };
    const { default: TTSControl } = await import('../components/TTSControl.jsx');
    const { setReadTarget } = await import('../lib/read-target.js');
    const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
    render();
    act(() => { setReadTarget('l191', { label: 'this lesson', text: SENTS.join(' '), elementId: 'l191-lesson' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(byTest('reader-offline-status').textContent).toMatch(/Not saved on this device yet/);
    await act(async () => { byTest('reader-offline-save').click(); await new Promise((r) => setTimeout(r, 600)); });
    // The words saved are the words a read speaks: the mapped lesson.
    expect(spoken[0]).toBe(SENTS.join(' '));
    expect(byTest('reader-offline-status').textContent).toMatch(/The whole lesson is on this device \(4 of 4 pieces · 4\.0 MB\) — it plays without the NAS/);
    expect(byTest('reader-offline-save')).toBe(null);
    // Close and reopen after one piece was cleared: the count is read from
    // the device, not remembered as a claim.
    await backend.del('p3'); // cleared, the way the cap clears a piece
    act(() => { root.unmount(); });
    root = createRoot(container);
    render();
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(byTest('reader-offline-status').textContent).toMatch(/On this device: 3 of 4 pieces · 3\.0 MB — the rest still needs the NAS/);
    expect(byTest('reader-offline-save')).not.toBe(null);
    _setDeviceClipCacheForTests(null);
  });
});

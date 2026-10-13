// @vitest-environment jsdom
// =============================================================================
// Back / Next keep the screen still (2026-10-07, DR-0790)
// =============================================================================
// Darrell, reading L214 on his tablet with the Read Aloud panel open: "Reader
// screen jumps and moves everytime a user selected the prev/next buttons...
// it makes it difficult to refind your place and is annoying.... fix it!!!!!"
//
// A jump restarts the voice at the paragraph before or after, and the follow
// then PLACED that sentence at the top of the band — the page lurched under
// a reader who had just looked at where the voice was. Now a manual jump puts
// the follow into 'reveal': the page moves only when the sentence is hidden
// or off the fold, and then by the least that shows it; the first move that
// was genuinely needed hands the chosen place back. The pure math is pinned
// on real numbers; followRange is driven with a real rect and a counted
// scrollBy; the reader's wiring is read from its source.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readingScrollDelta, followRange, FOLLOW_MODES, PLACE_SLACK } from '../lib/read-follow.js';

const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');
// A phone: 800px tall, 60px of sticky chrome at the top, 44px dock at the bottom.
const band = { topInset: 60, bottomInset: 44, viewportHeight: 800, margin: 24, lineHeight: 28 };

describe('the math', () => {
  it('place: a sentence in the middle of the band is pulled to the top — the follow as it was', () => {
    const d = readingScrollDelta({ ...band, rangeTop: 400, rangeBottom: 440, place: 'top' });
    expect(d).toBeGreaterThan(PLACE_SLACK);
  });

  it('reveal: the same sentence, on screen, moves NOTHING', () => {
    expect(readingScrollDelta({ ...band, rangeTop: 400, rangeBottom: 440, place: 'top', mode: 'reveal' })).toBe(0);
    expect(readingScrollDelta({ ...band, rangeTop: 400, rangeBottom: 440, place: 'centre', mode: 'reveal' })).toBe(0);
    // Anywhere inside the readable band stays put.
    expect(readingScrollDelta({ ...band, rangeTop: 90, rangeBottom: 130, place: 'top', mode: 'reveal' })).toBe(0);
    expect(readingScrollDelta({ ...band, rangeTop: 700, rangeBottom: 730, place: 'top', mode: 'reveal' })).toBe(0);
  });

  it('reveal: a sentence under the chrome or below the fold moves by the least that shows it', () => {
    // Hidden under the sticky header: brought down to just under it (negative = scroll up).
    expect(readingScrollDelta({ ...band, rangeTop: 30, rangeBottom: 60, place: 'top', mode: 'reveal' })).toBe(30 - 84);
    // Below the fold: lifted until its bottom edge is inside, not to the top.
    const d = readingScrollDelta({ ...band, rangeTop: 760, rangeBottom: 800, place: 'top', mode: 'reveal' });
    expect(d).toBe(800 - (800 - 44 - 24));
    expect(d).toBeLessThan(readingScrollDelta({ ...band, rangeTop: 760, rangeBottom: 800, place: 'top' }));
  });

  it('the default mode is place, so every existing caller is unchanged', () => {
    expect(FOLLOW_MODES).toEqual(['place', 'reveal']);
    expect(readingScrollDelta({ ...band, rangeTop: 400, rangeBottom: 440, place: 'top' }))
      .toBe(readingScrollDelta({ ...band, rangeTop: 400, rangeBottom: 440, place: 'top', mode: 'place' }));
  });
});

describe('followRange on a real rect', () => {
  let orig;
  afterEach(() => { if (orig) window.scrollBy = orig; });
  const rangeAt = (top, bottom) => ({
    getBoundingClientRect: () => ({ top, bottom, height: bottom - top, width: 300, left: 0, right: 300 }),
    startContainer: document.body,
  });

  it('reveal keeps a visible sentence where it is and reports no move; place scrolls it to the top and reports the move', () => {
    orig = window.scrollBy;
    const calls = [];
    window.scrollBy = (o) => calls.push(o);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const moved = followRange(rangeAt(400, 440), { place: 'top', mode: 'reveal' });
    expect(moved).toBe(0);
    expect(calls).toEqual([]);
    const placed = followRange(rangeAt(400, 440), { place: 'top' });
    expect(placed).not.toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].top).toBe(placed);
  });

  it('reveal still brings a sentence below the fold into view, by the least', () => {
    orig = window.scrollBy;
    const calls = [];
    window.scrollBy = (o) => calls.push(o);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const moved = followRange(rangeAt(900, 940), { place: 'top', mode: 'reveal' });
    expect(moved).toBeGreaterThan(0);
    expect(calls).toHaveLength(1);
    // Less than placing it at the top would have moved.
    expect(moved).toBeLessThan(followRange(rangeAt(900, 940), { place: 'top' }));
  });
});

describe('the reader is wired to it', () => {
  const src = SRC('components/TTSControl.jsx');
  it('a jump puts the follow into reveal, the first needed move hands place back, and a finished reading clears it', () => {
    expect(src).toMatch(/settleRef\.current = true;\s*\n\s*setJumpLive\(true\);/);
    expect(src).toMatch(/const mode = settleRef\.current \? 'reveal' : 'place';\s*\n\s*const moved = followRange\(r, \{ place: prefsRef\.current\.place, mode \}\);\s*\n\s*if \(settleRef\.current && moved\) settleRef\.current = false;/);
    expect(src).toMatch(/if \(!jumpingRef\.current\) settleRef\.current = false;/);
    // Top is still Top: an explicit scroll home, not a reveal.
    expect(src).toMatch(/const jumpTop = \(\) => \{[\s\S]{0,200}window\.scrollTo\(\{ top: 0/);
  });
});

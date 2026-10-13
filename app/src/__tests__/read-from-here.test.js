// @vitest-environment jsdom
//
// read-from-here — the tap becomes the reading start (DR-0144). Pins: the
// normalized text matches the collapse-whitespace shape the page reader speaks;
// a mark mid-word snaps to the word's start; a tap in stripped chrome or an
// unsupported engine yields null (fall back to the top — never a wrong start).
import { describe, it, expect } from 'vitest';
import {
  readableTextWithMark, snapToWordStart, caretFromPoint, readFromPoint,
} from '../lib/read-from-here.js';

function page(html) {
  document.body.innerHTML = html;
  return document.body;
}

describe('readableTextWithMark', () => {
  it('collapses whitespace and reads block boundaries as one space', () => {
    const root = page('<main><p>Rob not\n  the poor</p><p>for the LORD</p></main>');
    const { text } = readableTextWithMark(root);
    expect(text).toBe('Rob not the poor for the LORD');
  });
  it('skips the floating chrome the page reader strips', () => {
    const root = page('<main><p>Keep this</p><div class="tts-controls">never spoken</div><span aria-hidden="true">nor this</span></main>');
    expect(readableTextWithMark(root).text).toBe('Keep this');
  });
  it('marks a DOM position at its exact normalized index', () => {
    const root = page('<main><p id="a">Rob not</p><p id="b">the   poor</p></main>');
    const bText = document.getElementById('b').firstChild;
    // offset 6 in "the   poor" = the 'p' of poor (after the collapsed gap)
    const { text, index } = readableTextWithMark(root, { node: bText, offset: 6 });
    expect(text).toBe('Rob not the poor');
    expect(text.slice(index)).toBe('poor');
  });
  it('returns index null for a mark that never appears (caller falls back)', () => {
    const root = page('<main><p>words</p></main>');
    const stray = document.createTextNode('elsewhere');
    expect(readableTextWithMark(root, { node: stray, offset: 0 }).index).toBeNull();
  });
});

describe('snapToWordStart', () => {
  const t = 'Rob not the poor';
  it('mid-word snaps back to the word start', () => {
    expect(t.slice(snapToWordStart(t, 13))).toBe('poor'); // tapped inside "poor"
  });
  it('a tap on the gap starts the NEXT word; word starts stay put; ends clamp', () => {
    expect(t.slice(snapToWordStart(t, 3))).toBe('not the poor'); // the space
    expect(t.slice(snapToWordStart(t, 4))).toBe('not the poor'); // word start
    expect(snapToWordStart(t, 0)).toBe(0);
    expect(snapToWordStart(t, 99)).toBe(t.length);
  });
});

describe('caretFromPoint / readFromPoint', () => {
  it('returns null where neither caret API exists (jsdom) — top-of-page fallback', () => {
    expect(caretFromPoint(document, 10, 10)).toBeNull();
    const root = page('<main><p>words here</p></main>');
    expect(readFromPoint(root, 10, 10)).toBeNull();
  });
  it('maps a tap to the tail of the page from the tapped word (stubbed caret)', () => {
    const root = page('<main><p id="a">Rob not the poor</p><div class="tts-controls">chrome</div></main>');
    const textNode = document.getElementById('a').firstChild;
    const doc = {
      caretRangeFromPoint: () => ({ startContainer: textNode, startOffset: 13 }),
    };
    const got = readFromPoint(root, 5, 5, { doc });
    expect(got).toMatchObject({ text: 'poor' });
    expect(got.startedAt).toBe(12);
  });
  it('a tap landing in stripped chrome is refused, not misread', () => {
    const root = page('<main><p>Keep</p><div class="tts-controls" id="c">chrome text</div></main>');
    const chromeText = document.getElementById('c').firstChild;
    const doc = { caretRangeFromPoint: () => ({ startContainer: chromeText, startOffset: 2 }) };
    expect(readFromPoint(root, 5, 5, { doc })).toBeNull();
  });
  it('respects the reader cap so behavior matches the page reader', () => {
    const root = page(`<main><p>${'word '.repeat(50)}</p></main>`);
    const textNode = root.querySelector('p').firstChild;
    const doc = { caretRangeFromPoint: () => ({ startContainer: textNode, startOffset: 0 }) };
    const got = readFromPoint(root, 1, 1, { doc, maxChars: 9 });
    expect(got.text).toBe('word word');
  });
});

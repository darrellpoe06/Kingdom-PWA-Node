// @vitest-environment jsdom
// THE ANCHOR IS SAID ONCE; ITS OUTLINE WAITS AT THE END, UNREAD.
// =============================================================================
// Darrell 2026-11-24, with the reader running on L339's Anchor block (eight
// numbered points, twenty-two references): "This section should not be read...
// just go from the anchor to 1st point... Saying scripture referenced on the
// screen 25 times in a row makes you forget what users were about to listen
// to... For each lesson." Then: "can they be at the end of the lessons, not
// read... however there for their reference."
//
// What is pinned here:
//   1. the reference block renders the outline and its chips (still there);
//   2. the reader's own map (buildFollowMap — the text that is SPOKEN) holds
//      none of it, while the lesson's words beside it are all still heard;
//   3. PROVEN-TO-CATCH: the same outline without the skip IS heard;
//   4. the Open stage draws only the anchor's reference, and the block is
//      drawn in the Send-off stage, for every lesson (one render path).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import LessonAnchorReference from '../components/LessonAnchorReference.jsx';
import { buildFollowMap } from '../lib/read-follow.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const L339 = LIVING_LESSONS_MODULES.find((m) => /^ll339-/.test(m.id));
const FIRST_POINT = 'A technology newsletter was sent in to be made a teaching.';

let host, root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const draw = (el) => act(() => root.render(el));

describe('the anchor outline is kept for reference and never read aloud', () => {
  it('L339 is the lesson he was reading: its anchor carries the numbered outline', () => {
    expect(L339).toBeTruthy();
    expect(L339.anchor.ref).toBe('Ecclesiastes 5:9');
    expect(L339.anchor.theme).toMatch(/^ONE: /);
  });
  it('the block shows the outline and opens its references, at the end', () => {
    draw(createElement(LessonAnchorReference, { anchor: L339.anchor }));
    const block = host.querySelector('[data-testid="lesson-anchor-reference"]');
    expect(block.getAttribute('data-read-skip')).toBe('true');
    expect(block.textContent).toContain('for your reference');
    expect(block.textContent).toContain('EIGHT: the rich One who became poor');
    expect(block.querySelectorAll('[data-testid="section-refs"] button').length).toBeGreaterThan(10);
  });
  it('the reader hears the lesson and none of the outline', () => {
    draw(
      createElement(
        'main',
        null,
        createElement('p', null, createElement('strong', null, `Anchor — ${L339.anchor.ref}.`)),
        createElement('p', null, FIRST_POINT),
        createElement(LessonAnchorReference, { anchor: L339.anchor })
      )
    );
    const spoken = buildFollowMap(host.querySelector('main')).text;
    expect(spoken).toContain('Anchor — Ecclesiastes 5:9.');
    expect(spoken).toContain(FIRST_POINT);
    expect(spoken).not.toContain('ONE: the field under every fortune');
    expect(spoken).not.toContain('Proverbs 18:17');
    expect(spoken).not.toContain('for your reference');
  });
  it('PROVEN-TO-CATCH: the same outline without the skip is heard', () => {
    draw(createElement('main', null, createElement('p', null, FIRST_POINT), createElement('p', null, L339.anchor.theme)));
    expect(buildFollowMap(host.querySelector('main')).text).toContain('ONE: the field under every fortune');
  });
  it('nothing to show, nothing drawn', () => {
    draw(createElement(LessonAnchorReference, { anchor: null }));
    expect(host.querySelector('[data-testid="lesson-anchor-reference"]')).toBeNull();
  });
  it('the Open stage draws the anchor reference only; the Send-off stage draws the block (the one path every lesson renders through)', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../components/ChurchLearn.jsx'), 'utf8');
    const open = src.slice(src.indexOf("      case 'open':"), src.indexOf("      case 'teach':"));
    expect(open).toContain('lesson-anchor-line');
    expect(open).not.toContain('{seg.audience.anchorTheme}');
    expect(open).not.toContain('VerseChips');
    // Pattern 2h: the one reference that IS named there still opens in place.
    expect(open).toContain('<WordInline text={`Anchor — ${seg.audience.anchorRef}.`}');
    const send = src.slice(src.indexOf("      case 'send':"), src.indexOf('      default:', src.indexOf("      case 'send':")));
    expect(send).toContain('<LessonAnchorReference anchor={module.anchor} />');
  });
});

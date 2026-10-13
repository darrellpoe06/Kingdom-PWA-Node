// @vitest-environment jsdom
// =============================================================================
// THE HIGHLIGHT MUST LAST THE WHOLE LESSON, NOT ONLY START
// =============================================================================
// Darrell 2026-09-18, from the church door with a screenshot: "Reader does not
// read the full story... with highlights... it keeps reading and stops
// highlighting the whole lesson... it starts with the highlighting though."
//
// WHAT THE HOUSE ALREADY PROVED, AND WHAT IT NEVER DID. reader-learn-follow
// .test.jsx proves every spoken sentence HAS a range at the moment the map is
// built. Nothing anywhere proved a range still PAINTS later in the same read.
// A Range is a live pointer into DOM nodes: if React replaces the text node it
// points at, CSS.highlights keeps the entry, the entry paints nothing, and the
// engine — which holds the text, not the DOM — keeps speaking. That is exactly
// the reported shape: highlighting at the start, none afterwards, reading
// unaffected. Whether this repo's reader actually suffers it was never
// measured, so this file measures it.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';
import { buildFollowMap, segmentRange } from '../lib/read-follow.js';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let box, root;
beforeEach(() => {
  window.localStorage.clear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  box = document.createElement('main');
  document.body.appendChild(box);
  root = createRoot(box);
});
afterEach(() => {
  act(() => { root.unmount(); });
  box.remove();
  window.localStorage.clear();
});

const mount = () => act(() => root.render(createElement(ChurchLearn, {
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
})));
const button = (text) => [...box.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
const openLesson = () => { mount(); act(() => { button('Start this week →').click(); }); return getReadTarget(); };
const prepared = () => {
  const t = openLesson();
  act(() => { t.prepare(true); });
  return { t, el: () => document.getElementById(t.elementId) };
};
/** Does this range still point at text that is IN the document? */
const paintable = (r) => !!(r && r.startContainer && r.startContainer.isConnected
  && r.endContainer && r.endContainer.isConnected && String(r.toString() || '').length > 0);

describe('every sentence of a real lesson can be painted, first to last', () => {
  it('resolves a live, non-empty range for EVERY segment — not just the opening ones', () => {
    const { el } = prepared();
    const follow = buildFollowMap(el());
    expect(follow.segments.length, 'the lesson is too short to prove anything').toBeGreaterThan(20);
    const dead = [];
    follow.segments.forEach((s, i) => {
      const r = segmentRange(follow, i);
      if (!paintable(r)) dead.push(`${i}: ${(s && s.text ? s.text : '(null segment)').slice(0, 50)}`);
    });
    expect(dead, `segments that could never be highlighted:\n${dead.slice(0, 10).join('\n')}`).toEqual([]);
  });

  it('the LAST sentence is as paintable as the first (the reported symptom, as a check)', () => {
    const { el } = prepared();
    const follow = buildFollowMap(el());
    const last = follow.segments.length - 1;
    expect(paintable(segmentRange(follow, 0)), 'the first sentence cannot be painted').toBe(true);
    expect(paintable(segmentRange(follow, last)), 'the last sentence cannot be painted').toBe(true);
  });

  it('and each range carries the words of its OWN segment, so the paint lands where it is spoken', () => {
    // MEASURED, and it found one real gap worth naming rather than hiding. At a
    // BLOCK BOUNDARY the map inserts a synthetic sentence-end so a heading is
    // not welded onto the paragraph below it (read-follow.js). That character
    // is not in the DOM — it is anchored to the previous block's last real
    // character — so a segment that ends on one paints its words minus that
    // one synthetic stop ("Engage · Discuss" for "Engage · Discuss."). The
    // WORDS are right and the highlight lands on them; only the invented
    // punctuation cannot be lit, which is correct and unfixable by design.
    // Anything beyond that is drift, and drift is the defect.
    const { el } = prepared();
    const follow = buildFollowMap(el());
    const wrong = [];
    const trim = (x) => String(x || '').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < follow.segments.length; i += Math.max(1, Math.floor(follow.segments.length / 25))) {
      const s = follow.segments[i];
      const got = trim(segmentRange(follow, i));
      const want = trim(s.text);
      if (got === want) continue;
      if (want.endsWith('.') && got === want.slice(0, -1)) continue; // the synthetic block stop
      wrong.push(`${i}: painted ${JSON.stringify(got.slice(0, 40))} for ${JSON.stringify(want.slice(0, 40))}`);
    }
    expect(wrong, `ranges landing on the wrong words:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('the checks can SEE a range that has stopped carrying its words (proven-to-catch)', () => {
    // THE FACT THIS CHECK TAUGHT ME, and it matters for the whole diagnosis: a
    // Range does NOT die when its node is removed. The DOM spec MOVES the
    // boundary points to the parent, so `isConnected` stays true and a
    // liveness probe reads healthy while the paint is wrong. The honest probe
    // is therefore the WORDS, never the connectedness — which is why the check
    // above compares text rather than asking whether the nodes are still
    // there.
    const { el } = prepared();
    const follow = buildFollowMap(el());
    const r = segmentRange(follow, 0);
    const want = String(r.toString()).trim();
    expect(want.length).toBeGreaterThan(0);
    const node = r.startContainer;
    node.textContent = 'something else entirely';
    expect(String(r.toString()).trim(), 'the words changed under the range and nothing noticed').not.toBe(want);
  });
});

describe('the ranges survive what happens DURING a read', () => {
  it('a host re-render does not kill the ranges captured when the read began', () => {
    // THE DECISIVE EXPERIMENT for the reported defect. TTSControl captures
    // every range ONCE, at the moment Play is pressed (pageFollowState), and
    // holds them in a ref for the rest of the lesson. Anything that re-renders
    // the lesson body mid-read — a place write, a step report, a sticky bar
    // update — replaces text nodes if React cannot reuse them, and every held
    // range dies silently.
    const { el } = prepared();
    const follow = buildFollowMap(el());
    const held = follow.segments.map((s, i) => segmentRange(follow, i));
    expect(held.every(paintable)).toBe(true);
    // Re-render the same tree, exactly as a state update during a read does.
    mount();
    const dead = held.filter((r) => !paintable(r)).length;
    expect(dead, `${dead} of ${held.length} held ranges died on a re-render — the held-range design is the defect`).toBe(0);
  });
});

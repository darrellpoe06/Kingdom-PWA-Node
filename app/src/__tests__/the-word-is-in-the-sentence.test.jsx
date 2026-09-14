// @vitest-environment jsdom
// THE WORD BELONGS IN THE SENTENCE, NOT IN THE MARGIN.
// =============================================================================
// Darrell 2026-09-14, on lesson 151, with the lesson body on his screen and the
// phone's own text-selection menu offering "Ask Gemini" over a verse OUR app
// should have opened:
//   "Show the Word in the sentences not in the margins!!!!!!!!! Obviously in
//    context of the discussions!!!!!!!!"
// and, on the reference wall above it:
//   "not any lists inside at the beginning of the lessons without context
//    anyways doesn't help us humans anyway... one or two with points and the
//    full scripture they are discussing in context"
//
// Two defects, one principle. The lesson BODY named "Lamentations 3:22-23" in
// running prose and rendered it as dead type, because LessonProse printed
// {it.text} raw while every other prose surface in the app had gone through
// WordInline since DR-0340. The OPENER printed anchor.ref verbatim — forty-one
// references for L151 — which is a bibliography occupying a teaching slot.
//
// Proven-to-catch (DR-0076 §3): both assertions were run against the previous
// render and both FAILED — no chip existed in the body, and the opener printed
// all forty-one. A gate that could not fail on the broken version is theatre.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonProse } from '../components/ChurchLearn.jsx';
import { anchorIsRun, ANCHOR_RUN_MIN, referencesIn } from '../lib/verse-refs.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const L151 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll152-crying'));

let host; let root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const draw = (text) => { act(() => root.render(createElement(LessonProse, { text }))); return host; };
const buttons = () => Array.from(host.querySelectorAll('button'));
const labelled = (re) => buttons().find((b) => re.test(b.getAttribute('aria-label') || ''));

describe('the lesson body opens the Word where the sentence names it', () => {
  it('turns a reference in running prose into a control, in place', () => {
    draw('Present: Lamentations 3:22-23, written over a destroyed city, grounds the mercy in our not being consumed.');
    const chip = labelled(/Open Lamentations 3:22-23/i);
    expect(chip, 'the reference in the sentence must be a control').toBeTruthy();
    // The author's own words, not a normalized rewrite.
    expect(chip.textContent).toBe('Lamentations 3:22-23');
  });

  it('leaves every other word of the prose exactly as written', () => {
    const text = 'Where the scale exceeds sight, Ezekiel 37:3 models the only honest reply.';
    expect(draw(text).textContent).toContain(text);
  });

  it('keeps the landmarks the speaker index and stepper jump to', () => {
    const el = draw('A POINT WITH A REFERENCE, Psalms 73:26 supplies the hinge. And a second paragraph follows here.');
    expect(el.querySelector('[data-point-index]')).toBeTruthy();
    expect(el.querySelector('[data-point-n]')).toBeTruthy();
  });

  it('does not chip prose that names nothing', () => {
    draw('The resolution is grammatical before it is theological.');
    expect(buttons().length).toBe(0);
  });

  it('the real lesson 151 body carries openable Word, not dead type', () => {
    draw(L151.levels.senior);
    const chips = buttons();
    expect(chips.length).toBeGreaterThan(10);
    expect(chips.some((b) => /Lamentations 3:22/.test(b.textContent))).toBe(true);
  });
});

describe('a run of references is a list, and a list is not an opener', () => {
  it('one or two is a citation and stays', () => {
    expect(anchorIsRun('Isaiah 40:8')).toBe(false);
    expect(anchorIsRun('Isaiah 40:8; Matthew 24:35')).toBe(false);
  });

  it('three or more is a run', () => {
    expect(anchorIsRun('Isaiah 40:8; Matthew 24:35; John 1:1')).toBe(true);
  });

  it('uses the same threshold the reader uses, so page and voice agree', () => {
    expect(ANCHOR_RUN_MIN).toBe(3);
  });

  it('is total on junk', () => {
    expect(anchorIsRun('')).toBe(false);
    expect(anchorIsRun(null)).toBe(false);
    expect(anchorIsRun(undefined)).toBe(false);
  });

  it("L151's forty-one-reference anchor is a run, so the opener will not print it", () => {
    expect(referencesIn(L151.anchor.ref).length).toBeGreaterThan(20);
    expect(anchorIsRun(L151.anchor.ref)).toBe(true);
  });
});

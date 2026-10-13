// @vitest-environment jsdom
// THE LESSON WORDS ARE NOT BLOCKED; THE WORD WAITS, GREEN, AT THE FOOT OF ITS
// SECTION; AND THE LESSON TAKES THE FULL WIDTH OF THE PAGE.
// =============================================================================
// Darrell 2026-09-14, on the living lessons, building for elderly church
// founders:
//   "Don't block the lesson words... just have them below each section they
//    refer to like in the storyline section... sometimes there would be up to
//    4 scriptures and again the green button on top to open all at once... so
//    I or users don't have to click each one separately... however they can
//    if they want to... scripture stays green goes to the bottom of that
//    section that it was referring to."
//   "The width of the pages need the full width of the page to be used!!!!
//    Old required procedures!!!"
//   "No tabs, none ever — it's not good, undermines readers."
//
// DR-0402 had routed every lesson paragraph through WordInline, which boxes
// each reference as an inline BUTTON mid-sentence — the "tabs". This file
// pins the restored flow (DR-0406):
//   1. no control inside a prose paragraph — the reference stays in the
//      sentence as plain words, exactly as the author wrote them;
//   2. the references a section named are a green chip strip at the foot of
//      THAT section, each openable in place (verbatim KJV beneath, same card);
//   3. the page-top switch (Show the Word) still opens every one at once;
//   4. the speaker-index / stepper landmarks DR-0402 D2 protected survive;
//   5. in the lesson's own space the reading column drops the nested side
//      walls that had eaten a third of a phone's width.
//
// Proven-to-catch (DR-0076 §3): run against main@3311b3f (before this change)
// the "no control inside a paragraph" cases FAIL (4 buttons sat inside L1's
// paragraphs), the "strip at the foot" cases FAIL (no strip existed), the
// blurb case FAILS, and the flush cases FAIL (the boxes carried `p-3`/`p-4`).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Namespace import on purpose: run against the pre-change tree (no
// lessonSections export yet) the file still loads and the cases FAIL one by
// one, which is the proof; a named import would refuse to link and prove nothing.
import * as ChurchLearn from '../components/ChurchLearn.jsx';
import { LessonFlowAudience } from '../components/LessonFlow.jsx';

const { LessonProse, AgePacedLesson, lessonSections } = ChurchLearn;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import WordInline from '../components/WordInline.jsx';
import { __setBibleFetcher } from '../lib/bible-kjv.js';
import { setShowTheWord, __resetShowTheWord } from '../lib/show-the-word.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const L1 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll1-the-perfect-yahweh-expects');
const read = (rel) => readFileSync(resolve(import.meta.dirname, rel), 'utf8');

// A tiny KJV: Genesis 17:1 and Matthew 5:48 answer; anything else is missing.
const KJV = {
  Genesis: { 17: { 1: 'And when Abram was ninety years old and nine, the LORD appeared to Abram, and said unto him, I am the Almighty God; walk before me, and be thou perfect.' } },
  Matthew: { 5: { 48: 'Be ye therefore perfect, even as your Father which is in heaven is perfect.' } },
};
function fetcherFor(book) {
  const b = KJV[book];
  if (!b) return { ok: false };
  const chapters = [];
  for (const [c, verses] of Object.entries(b)) {
    chapters[Number(c) - 1] = [];
    for (const [v, t] of Object.entries(verses)) chapters[Number(c) - 1][Number(v) - 1] = t;
  }
  return { ok: true, json: async () => ({ chapters }) };
}

let host; let root;
beforeEach(() => {
  __resetShowTheWord();
  __setBibleFetcher(async (url) => fetcherFor(decodeURIComponent(String(url).split('/').pop().replace(/\.json$/, ''))));
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); __resetShowTheWord(); });

const draw = (el) => { act(() => root.render(el)); return host; };
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); await new Promise((r) => setTimeout(r, 0)); });
const paras = () => Array.from(host.querySelectorAll('[data-point-index], [data-para-index]'));
const strips = () => Array.from(host.querySelectorAll('[data-testid="section-refs"]'));
const stripChips = (s) => Array.from(s.querySelectorAll('button')).map((b) => b.textContent);
const regions = () => Array.from(host.querySelectorAll('[role="region"][aria-label]')).map((r) => r.getAttribute('aria-label'));

describe('1. the lesson words are not blocked', () => {
  it('a reference inside a sentence is plain text, not a boxed control', () => {
    const text = 'The Hebrew behind Genesis 17:1 is tamim: complete, whole, sound.';
    draw(createElement(LessonProse, { text }));
    const p = host.querySelector('[data-para-index]');
    expect(p, 'the paragraph landmark').toBeTruthy();
    expect(p.querySelectorAll('button').length, 'no control inside the sentence').toBe(0);
    expect(p.textContent).toBe(text); // the author's own words, untouched
  });

  it('the real Lesson 1 senior body carries no control inside any paragraph', () => {
    draw(createElement(LessonProse, { text: L1.levels.senior }));
    expect(paras().length).toBeGreaterThan(3);
    const inside = paras().reduce((n, p) => n + p.querySelectorAll('button').length, 0);
    expect(inside, 'boxed chips mid-sentence are the "tabs"').toBe(0);
  });

  it('a stage blurb in the lesson flow reads clean too (the whole-lesson mode he photographed)', () => {
    const arc = { audienceSegments: [
      { kind: 'open', icon: '', title: 'Open', subtitle: 'x', blurb: 'Stand on Matthew 5:48 as we begin.', minutes: 0, cue: '' },
      { kind: 'teach', icon: '', title: 'Teach', subtitle: 'y', blurb: 'The core.', minutes: 0, cue: '' },
    ] };
    draw(createElement(LessonFlowAudience, { arc, renderStage: () => null, showAll: true }));
    const blurb = Array.from(host.querySelectorAll('p')).find((p) => /Stand on Matthew 5:48/.test(p.textContent));
    expect(blurb).toBeTruthy();
    expect(blurb.querySelectorAll('button').length).toBe(0);
    expect(strips().length).toBe(1);
    expect(stripChips(strips()[0])).toEqual(['Matthew 5:48']);
  });
});

describe('2. the Word waits, green, at the foot of the section it belongs to', () => {
  it('a section that names up to four references gets one strip under its last line, in Scripture order', () => {
    const text = 'FIRST, the standard is wholeness. Genesis 17:1 says walk before me. And Matthew 5:48 says be ye perfect. SECOND, the rest. Nothing named here.';
    const { items } = formatLessonText(text);
    const sections = lessonSections(items);
    expect(sections.length).toBe(2);
    expect(sections[0].refs).toEqual(['Genesis 17:1', 'Matthew 5:48']);
    expect(sections[1].refs).toEqual([]);
    draw(createElement(LessonProse, { text }));
    expect(strips().length).toBe(1);
    // The strip sits AFTER the section's last line and BEFORE the next heading.
    const strip = strips()[0];
    const secondHeading = host.querySelector('[data-point-n="2"]');
    expect(strip.compareDocumentPosition(secondHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const lastLineOfFirst = paras().filter((p) => p.compareDocumentPosition(secondHeading) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
    expect(lastLineOfFirst.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stripChips(strip)).toEqual(['Genesis 17:1', 'Matthew 5:48']);
    // Green, with the storyline's dash ahead of it.
    for (const b of strip.querySelectorAll('button')) expect(b.className).toMatch(/#5A6E3D/);
    expect(strip.textContent.trim().startsWith('—')).toBe(true);
  });

  it('a lesson with no headings keeps the strip beside the paragraphs that named it — never a list at the end', () => {
    // Lesson 127 is the standard (DR-0410): a strip waits at the foot of a
    // block of at most SECTION_RHYTHM.maxLines lines, and every chip in it was
    // named in THAT block — so a reference is never further than a few lines
    // from its sentence, and the last strip is never a list of everything.
    draw(createElement(LessonProse, { text: L1.levels.senior }));
    const s = strips();
    expect(s.length).toBeGreaterThan(0);
    const allChips = s.flatMap(stripChips);
    expect(allChips).toContain('Genesis 17:1');
    const nodes = Array.from(host.querySelectorAll('[data-para-index], [data-point-index], [data-testid="section-refs"]'));
    let block = [];
    for (const n of nodes) {
      if (n.getAttribute('data-testid') === 'section-refs') {
        expect(block.length, 'lines waiting for one strip').toBeLessThanOrEqual(6);
        const named = block.map((p) => p.textContent).join(' ');
        for (const ref of stripChips(n)) expect(named, `${ref} was named in the block above its strip`).toContain(ref);
        block = [];
      } else block.push(n);
    }
  });

  it('one chip opens the verbatim KJV beneath its section, and closes it again', async () => {
    draw(createElement(LessonProse, { text: 'The Hebrew behind Genesis 17:1 is tamim.' }));
    const chip = host.querySelector('[data-testid="section-refs"] button[aria-label="Open Genesis 17:1"]');
    expect(chip).toBeTruthy();
    expect(regions()).toEqual([]);
    act(() => chip.click());
    await settle();
    expect(regions()).toEqual(['Genesis 17:1']);
    expect(host.querySelector('[role="region"]').textContent).toContain('walk before me, and be thou perfect');
    act(() => host.querySelector('[data-testid="section-refs"] button[aria-label="Close Genesis 17:1"]').click());
    await settle();
    expect(regions()).toEqual([]);
  });
});

describe('3. the green button on top still opens every one at once', () => {
  it('Show the Word opens all the section chips together; a chip still closes on its own on top of it', async () => {
    draw(createElement(LessonProse, { text: 'FIRST. Genesis 17:1 says walk. SECOND. Matthew 5:48 says be perfect.' }));
    expect(regions()).toEqual([]);
    act(() => setShowTheWord(true));
    await settle();
    expect(regions().sort()).toEqual(['Genesis 17:1', 'Matthew 5:48']);
    act(() => host.querySelector('button[aria-label="Close Matthew 5:48"]').click());
    await settle();
    expect(regions()).toEqual(['Genesis 17:1']);
    act(() => setShowTheWord(false));
    await settle();
    expect(regions()).toEqual([]);
  });
});

describe('4. the landmarks DR-0402 D2 protected survive the move', () => {
  it('heading: data-point-index / data-point-n / tabIndex -1 and the number badge; line: data-para-index', () => {
    draw(createElement(LessonProse, { text: 'FIRST, a point with Psalms 73:26 in it. A second line follows here with more.' }));
    const h = host.querySelector('[data-point-index]');
    expect(h).toBeTruthy();
    expect(h.getAttribute('data-point-n')).toBe('1');
    expect(h.getAttribute('tabindex')).toBe('-1');
    expect(h.querySelector('span[aria-hidden="true"]').textContent).toBe('1');
    expect(host.querySelector('[data-para-index]')).toBeTruthy();
  });
});

describe('5. the lesson takes the full width of the page in its own space', () => {
  it('the card sheds its box and hands flush down to the guide when a lesson is open alone', () => {
    const src = read('../components/ChurchLearn.jsx');
    expect(src).toMatch(/className=\{focusModule \? 'scroll-mt-28' : 'border border-\[#E8E4DC\] p-4 scroll-mt-28'\}/);
    expect(src).toMatch(/<TutorPanel\s+module=\{m\}\s+flush=\{!!focusModule\}/);
    expect(src).toMatch(/<LessonFlowAudience[\s\S]*?flush=\{flush\}/);
    expect(src).toMatch(/<AgePacedLesson[\s\S]*?flush=\{flush\}/);
  });

  it('flush boxes keep only their top and bottom rules — no side padding, no side border', () => {
    const arc = { audienceSegments: [{ kind: 'teach', icon: '', title: 'Teach', subtitle: 'y', blurb: 'The core.', minutes: 0, cue: '' }] };
    draw(createElement(LessonFlowAudience, { arc, renderStage: () => null, flush: true }));
    const box = host.querySelector('[aria-live="polite"]');
    expect(box.className).toMatch(/\bborder-y\b/);
    expect(box.className).toMatch(/\bpy-3\b/);
    expect(box.className).not.toMatch(/(^|\s)p-3(\s|$)/);
    expect(box.className).not.toMatch(/(^|\s)border(\s|$)/); // the all-sides box is gone

    const plan = { segments: ['One. Two.', 'Three.'], totalSegments: 2, segmentMinutes: 5, breakAfterSegments: 0, checkAfterSegments: 99, band: { label: 'Adult' } };
    draw(createElement(AgePacedLesson, { plan, flush: true }));
    const paced = host.querySelector('[role="progressbar"]').closest('div.mb-2');
    expect(paced.className).toMatch(/\bborder-y\b/);
    expect(paced.className).not.toMatch(/\bp-2\b/);
  });

  it('outside the space the stacked list keeps its cards (the default is unchanged)', () => {
    const arc = { audienceSegments: [{ kind: 'teach', icon: '', title: 'Teach', subtitle: 'y', blurb: 'The core.', minutes: 0, cue: '' }] };
    draw(createElement(LessonFlowAudience, { arc, renderStage: () => null }));
    expect(host.querySelector('[aria-live="polite"]').className).toMatch(/\bp-3\b/);
  });
});

describe('the primitive itself: WordInline refsBelow', () => {
  it('renders the prose plain and the strip beneath, merging alsoRefs without duplicates', () => {
    draw(createElement(WordInline, { text: 'She stood on Matthew 5:48 that morning.', refsBelow: true, alsoRefs: ['Matthew 5:48', 'Genesis 17:1'] }));
    const p = host.querySelector('p');
    expect(p.querySelectorAll('button').length).toBe(0);
    expect(p.textContent).toBe('She stood on Matthew 5:48 that morning.');
    expect(stripChips(strips()[0])).toEqual(['Genesis 17:1', 'Matthew 5:48']);
  });

  it('with nothing named it is just the paragraph — no empty strip', () => {
    draw(createElement(WordInline, { text: 'No reference here.', refsBelow: true }));
    expect(strips().length).toBe(0);
  });
});

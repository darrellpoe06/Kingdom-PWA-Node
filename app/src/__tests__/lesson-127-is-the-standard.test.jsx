// @vitest-environment jsdom
// =============================================================================
// LESSON 127 IS THE STANDARD — the strip rhythm, and the frame that stays a
// frame at Big Print (DR-0410)
// =============================================================================
// Darrell 2026-09-15, listening to Lesson 127 at Big Print 44: "No I don't like
// the buttons fix nor the other one with the green... use lesson 127 that
// flows correctly... as the standard." And, with the screenshot: "I don't
// like the the buttons get way bigger on the bigger font choices!! Can we fix
// it!"
//
// MEASURED through the real LessonProse before building (2026-09-15):
//   L127  10 headings · 60 lines · 8 strips · 2-9 chips each   ← flows
//   L1     0 headings · 25 lines · 12 strips (one after almost every line)
//   L128   5 headings · 212 lines · ONE strip of 141 chips
//   L126  18 headings · 189 lines · a strip of 51 chips
// 44 of 151 lessons have no headings at all. The difference between 127 and
// the rest was never the prose — it was the RHYTHM of the green: L127's
// sections are five-to-six lines with a modest strip at each foot. That is the
// rhythm now applied to every lesson (SECTION_RHYTHM), pinned here on the real
// catalog, and measured in a real browser by scripts/chrome-layout-probe.mjs.
//
// The chrome half: the lesson bar (ALL LESSONS / PREV / NEXT), the read-along
// pill and panel, and the text-size chips rode the 2.75x root because their
// boxes were rem — the same escape the TTS panel's LABELS had already been
// cured of (Pattern 2b). Source pins here; pixels in the probe.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lessonSections, LessonProse, SECTION_RHYTHM } from '../components/ChurchLearn.jsx';
import TextSizeControl from '../components/TextSizeControl.jsx';
import { formatLessonText } from '../lib/lesson-format.js';
import { referencesIn } from '../lib/verse-refs.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = resolve(import.meta.dirname);
const src = (rel) => readFileSync(resolve(HERE, rel), 'utf8');
const pick = (prefix) => LIVING_LESSONS_MODULES.find((m) => m.id.startsWith(prefix));

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const draw = (el) => act(() => { root.render(el); });
const strips = () => Array.from(host.querySelectorAll('[data-testid="section-refs"]'));
const chips = (s) => s.querySelectorAll('button').length;

describe('the rhythm is a stated value, taken from lesson 127', () => {
  it('SECTION_RHYTHM is at most 6 lines per block and 9 chips per strip — and the probe carries the same numbers', () => {
    expect(SECTION_RHYTHM).toEqual({ maxLines: 6, maxRefs: 9 });
    const probe = src('../../../scripts/chrome-layout-probe.mjs');
    expect(probe).toMatch(/const RHYTHM = \{ maxLines: 6, maxRefs: 9 \}/);
    expect(probe).toMatch(/data-block-lines/);
  });

  it('lesson 127 itself renders within its own rhythm (the standard passes the standard)', () => {
    const m = pick('ll127-');
    draw(createElement(LessonProse, { text: m.lesson }));
    const s = strips();
    expect(s.length).toBeGreaterThan(5);
    expect(Math.max(...s.map(chips))).toBeLessThanOrEqual(SECTION_RHYTHM.maxRefs);
    expect(Math.max(...s.map((x) => Number(x.getAttribute('data-block-lines'))))).toBeLessThanOrEqual(SECTION_RHYTHM.maxLines);
  });

  it('PROVEN-TO-CATCH — lesson 128 no longer puts 141 chips in one strip', () => {
    const m = pick('ll128-');
    // Before: the old rule kept a heading's whole span as one section.
    const { items } = formatLessonText(m.lesson);
    const oldWay = (() => {
      const secs = [];
      items.forEach((it, i) => { const last = secs[secs.length - 1]; if (it.kind === 'heading' || !last) secs.push({ items: [{ ...it, i }] }); else last.items.push({ ...it, i }); });
      return secs.map((s) => referencesIn(s.items.map((it) => it.text).join(' ')).length);
    })();
    expect(Math.max(...oldWay), 'the wall this rule removes').toBeGreaterThan(100);
    // After: every strip is within the rhythm.
    const now = lessonSections(items);
    expect(Math.max(...now.map((s) => s.refs.length))).toBeLessThanOrEqual(SECTION_RHYTHM.maxRefs);
    expect(Math.max(...now.map((s) => s.items.filter((it) => it.kind !== 'heading').length))).toBeLessThanOrEqual(SECTION_RHYTHM.maxLines);
  });

  it('PROVEN-TO-CATCH — lesson 1 (no headings) no longer gets a strip after almost every line', () => {
    const m = pick('ll1-');
    const { items } = formatLessonText(m.lesson);
    const lines = items.filter((it) => it.kind !== 'heading').length;
    draw(createElement(LessonProse, { text: m.lesson }));
    const s = strips();
    // Old: 12 strips on 25 lines. Now: at most one strip per rhythm-block.
    expect(s.length).toBeLessThanOrEqual(Math.ceil(lines / SECTION_RHYTHM.maxLines) + 1);
    expect(s.length).toBeGreaterThan(1); // still beside the prose, never a list at the end (DR-0392 finding 5)
    for (const x of s) expect(Number(x.getAttribute('data-block-lines'))).toBeLessThanOrEqual(SECTION_RHYTHM.maxLines);
  });

  it('every lesson in the catalog renders within the rhythm — measured on all of them, not sampled', () => {
    let worstChips = 0; let worstLines = 0;
    for (const m of LIVING_LESSONS_MODULES) {
      const { items } = formatLessonText(m.lesson || '');
      for (const s of lessonSections(items)) {
        worstChips = Math.max(worstChips, s.refs.length);
        worstLines = Math.max(worstLines, s.items.filter((it) => it.kind !== 'heading').length);
      }
    }
    expect(worstChips).toBeLessThanOrEqual(SECTION_RHYTHM.maxRefs);
    expect(worstLines).toBeLessThanOrEqual(SECTION_RHYTHM.maxLines);
  });

  it('not one word moves: the blocks reproduce the lesson exactly, in order', () => {
    const m = pick('ll128-');
    const { items } = formatLessonText(m.lesson);
    const rebuilt = lessonSections(items).flatMap((s) => s.items.map((it) => it.i));
    expect(rebuilt).toEqual(items.map((_, i) => i));
  });

  it('a heading always opens a new block, and a single line with many references is its own block', () => {
    const text = 'FIRST, the point. Genesis 1:1; Genesis 1:2; Genesis 1:3; Genesis 1:4; Genesis 1:5; Genesis 1:6; Genesis 1:7; Genesis 1:8; Genesis 1:9; Genesis 1:10 and Genesis 1:11 name eleven. Then a plain line. SECOND, the rest. Nothing named here.';
    const { items } = formatLessonText(text);
    const secs = lessonSections(items);
    expect(secs[0].items[0].kind).toBe('heading');
    expect(secs.find((s) => s.items.some((it) => it.kind === 'heading' && it.n === 2))).toBeTruthy();
    // An eleven-reference line cannot be split (not one word moves), so it carries its own strip.
    expect(Math.max(...secs.map((s) => s.refs.length))).toBeGreaterThanOrEqual(11);
  });
});

describe('the frame stays a frame at Big Print — source pins (pixels are the probe\'s)', () => {
  it('both lesson landmark bars carry the one chrome cap every nav row shares', () => {
    const cl = src('../components/ChurchLearn.jsx');
    const bar = cl.match(/className="([^"]*)" data-testid="lesson-space-bar"/);
    expect(bar, 'the lesson-space bar').toBeTruthy();
    expect(bar[1].split(' ')).toContain('ts-chrome-region');
    const catalog = cl.match(/className="([^"]*)"\s+data-testid="lessons-bar"/);
    expect(catalog, 'the catalog lessons bar').toBeTruthy();
    expect(catalog[1].split(' ')).toContain('ts-chrome-region');
  });

  it('the read-along pill and panel size their buttons in em — no rem floor escapes the cap', () => {
    const tts = src('../components/TTSControl.jsx');
    expect(tts).not.toMatch(/min-h-\[2\.75rem\]/);
    expect((tts.match(/min-h-\[2\.75em\]/g) || []).length).toBeGreaterThanOrEqual(8);
  });

  it('the text-size PANEL chips are fixed px in box as well as label', () => {
    draw(createElement(TextSizeControl, { variant: 'panel' }));
    const buttons = Array.from(host.querySelectorAll('button[aria-label*="text size"]'));
    expect(buttons.length).toBe(5);
    for (const b of buttons) {
      expect(b.className).toMatch(/min-h-\[48px\]/);
      expect(b.className).not.toMatch(/min-h-\[3rem\]|min-w-\[3\.25rem\]/);
      expect(b.style.fontSize).toMatch(/px$/);
    }
  });
});

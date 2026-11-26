// The classic Learn tools wear the new look, with their pictures (Darrell
// 2026-11-26: "what happened to the green section or the things that is like the
// full all the courses looking like the old system? When is that update coming?"
// and "We have pictures. Why are we showing words all the time?").
//
// Two parts, both gated:
//   1. THE SKIN GATE. Every classic color class any classic Learn source carries
//      (ChurchLearn.jsx and every component it reaches) has a rule in
//      learn-classic-skin.css, which is exactly what the generator writes from the
//      one mapping. Proven to catch: an unmapped class and an unknown color fail.
//   2. EVERY FUNCTION, IN PICTURES. Courses, Latest, Continue and Browse inside
//      the new look (the StudioToolsContext) carry covers and still do what they
//      did -- choose, open, Play, Continue, Refresh, Start fresh, drill down --
//      and on the classic page (no context) render no picture at all.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skinCss, skinTokens, uncoveredTokens, unknownColors, skinRule, roleOf } from '../lib/learn-classic-skin.js';
import { classicLearnSources, CSS_PATH } from '../../../scripts/learn-classic-skin.mjs';
import { StudioToolsContext, studioToolsFor } from '../components/learn-studio/StudioTools.jsx';
import { CourseChoiceList } from '../components/CourseChoiceList.jsx';
import LatestLessons from '../components/LatestLessons.jsx';
import LearnSquares from '../components/LearnSquares.jsx';
import { ContinueOffer } from '../components/LessonContinue.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { presentationIndex } from '../lib/learn-presentation/presentation.js';
import RECORDS from '../lib/learn-presentation/presentation-records.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(f, 'utf8');
const FILES = classicLearnSources();
const SOURCES = FILES.map(read);
const CSS = read(CSS_PATH);

describe('the skin gate: no classic tool arrives in the new look still in cream and green', () => {
  it('reaches the classic Learn sources (ChurchLearn and the tools it renders)', () => {
    const names = FILES.map((f) => f.split('/').pop());
    for (const n of ['ChurchLearn.jsx', 'LatestLessons.jsx', 'LessonContinue.jsx', 'CourseChoiceList.jsx', 'LearnSquares.jsx', 'LearnersPanel.jsx', 'SectionTabs.jsx']) expect(names).toContain(n);
    expect(names.some((n) => FILES.find((f) => f.endsWith(n)).includes('/learn-studio/'))).toBe(false);
  });
  it('every color has a role and every color class has a rule', () => {
    expect(unknownColors(SOURCES)).toEqual([]);
    expect(uncoveredTokens(SOURCES, CSS)).toEqual([]);
  });
  it('the stylesheet is exactly what the generator writes (never hand-edited)', () => {
    expect(CSS).toBe(skinCss(SOURCES.flatMap(skinTokens)));
  });
  it('PROVEN TO CATCH: a new classic class with no rule, and a color with no role, both fail', () => {
    const tool = '<div className="bg-[#FAF8F4] text-[#1A1815] hover:bg-[#5A6E3D]/30 border-x-[#E8E4DC]" />';
    expect(uncoveredTokens([tool], CSS)).toEqual(['hover:bg-[#5A6E3D]/30', 'border-x-[#E8E4DC]']);
    expect(unknownColors(['<p className="text-[#123456]" />'])).toEqual(['#123456']);
    expect(() => skinRule('text-[#123456]')).toThrow(/no role/);
    // ...and a stylesheet with the rule removed is caught too.
    expect(uncoveredTokens(SOURCES, CSS.replace(/^.*\[class~="bg-\[#FAF8F4\]"\].*$/gm, ''))).toContain('bg-[#FAF8F4]');
  });
  it('only the new look carries the skin: scoped to .ls-classic-skin, which no classic source sets', () => {
    for (const line of CSS.split('\n').filter((l) => l.includes('{'))) expect(line.startsWith('.ls-root .ls-classic-skin')).toBe(true);
    for (const src of SOURCES) expect(src.includes('ls-classic-skin')).toBe(false);
    expect(read(join(HERE, '..', 'components', 'learn-studio', 'LearnStudio.jsx'))).toMatch(/className="ls-tools-body ls-classic-skin"/);
  });
  it('outranks every app theme override and stops at a light surface that paints itself', () => {
    expect(skinRule('bg-white')).toMatch(/^\.ls-root \.ls-classic-skin \[class~="bg-white"\]:not\(\[data-classic-paper\] \*\)\{background-color:var\(--sk-panel\)!important/);
    // Words on a gold fill flip dark, more specific than a text-* class on the same element.
    expect(skinRule('bg-[#5A6E3D]')).toContain('[class]{color:var(--sk-on-fill)!important}');
    for (const f of ['Presenter.jsx', 'AudienceSlide.jsx']) expect(read(join(HERE, '..', 'components', f))).toContain('data-classic-paper');
  });
  it('red stays the Blood (DR-0099): the classic terracotta becomes coral, and no rule paints true red', () => {
    expect(roleOf('#B85838')).toBe('warm');
    expect(roleOf('#A3141C')).toBe('keep');
    expect(skinRule('bg-[#A3141C]')).toBe('');
    expect(CSS).not.toMatch(/#(?:ff0000|d7261e|a3141c)/i);
  });
});

const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const INDEX = presentationIndex(RECORDS.records || []);
const TOOLS = studioToolsFor(INDEX, {}, () => null);
const LIVING = COURSES.find((c) => c.key === 'living-lessons');
const covered = LIVING.schedule.find((m) => TOOLS.lessonCover('living-lessons', m.id));

let container, root;
beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* no storage */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const inLook = (el) => <StudioToolsContext.Provider value={TOOLS}>{el}</StudioToolsContext.Provider>;
const $$ = (sel) => [...container.querySelectorAll(sel)];

describe('the picture lookups read the real presentation records', () => {
  it('a lesson with an approved cover has it; a course has its first lesson cover', () => {
    expect(covered).toBeTruthy();
    expect(TOOLS.lessonCover('living-lessons', covered.id).src).toBeTruthy();
    expect(TOOLS.courseCover('living-lessons')).toBeTruthy();
    expect(TOOLS.lessonCover('living-lessons', 'no-such-lesson')).toBe(null);
  });
});

describe('Courses: picture cards in the new look, rows on the classic page, the same choice', () => {
  it('cards with covers; a tap still chooses the course', () => {
    const onChoose = vi.fn();
    act(() => root.render(inLook(<CourseChoiceList courses={COURSES} onChoose={onChoose} />)));
    expect(container.querySelector('[data-testid="course-choice-list"]').dataset.look).toBe('cards');
    const covers = $$('[data-testid="ls-course-cover"]');
    expect(covers.length).toBe(COURSES.length);
    expect(covers.filter((c) => c.dataset.hasCover === 'true').length).toBeGreaterThan(COURSES.length / 2);
    for (const c of covers) expect(c.textContent.trim() || c.querySelector('img')).toBeTruthy(); // never blank
    click(container.querySelector('[data-course="living-lessons"]'));
    expect(onChoose).toHaveBeenCalledWith('living-lessons');
  });
  it('the classic page is unchanged: rows, no picture', () => {
    act(() => root.render(<CourseChoiceList courses={COURSES} onChoose={() => {}} />));
    expect(container.querySelector('[data-testid="course-choice-list"]').dataset.look).toBe('rows');
    expect($$('[data-testid="ls-course-cover"]').length).toBe(0);
  });
});

describe('Latest: every row leads with its cover; open, Play and Continue still work', () => {
  it('in the new look', () => {
    const onOpen = vi.fn(), onPlay = vi.fn(), onContinue = vi.fn();
    act(() => root.render(inLook(<LatestLessons courses={[LIVING]} onOpen={onOpen} onPlay={onPlay} onContinue={onContinue} />)));
    const row = container.querySelector(`li[data-lesson-id="${covered.id}"]`);
    expect(row.classList.contains('ls-tool-row')).toBe(true);
    expect(row.querySelector('[data-testid="ls-tool-thumb"] img')).toBeTruthy();
    click(row.querySelector('button'));
    expect(onOpen).toHaveBeenCalledWith('living-lessons', covered.id);
    click(row.querySelector('[data-testid="latest-play"]'));
    expect(onPlay).toHaveBeenCalledWith('living-lessons', covered.id);
    const rows = $$('li[data-lesson-id]');
    expect($$('[data-testid="ls-tool-thumb"]').length).toBe(rows.length);
  });
  it('on the classic page: no thumbnails', () => {
    act(() => root.render(<LatestLessons courses={[LIVING]} onOpen={() => {}} onPlay={() => {}} />));
    expect($$('[data-testid="ls-tool-thumb"]').length).toBe(0);
    expect($$('li[data-lesson-id]').length).toBeGreaterThan(0);
  });
});

describe('Continue: the lessons begun carry their covers; Continue, Refresh, Start fresh still work', () => {
  const items = LIVING.schedule.slice(0, 3).map((lesson, i) => ({ place: { courseKey: 'living-lessons', lessonId: lesson.id, stage: 1, step: 2, at: 1 + i }, course: LIVING, lesson }));
  it('in the new look', () => {
    const onContinue = vi.fn(), onRefresh = vi.fn(), onForget = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    act(() => root.render(inLook(<ContinueOffer items={items} onContinue={onContinue} onRefresh={onRefresh} onForget={onForget} />)));
    expect($$('[data-testid="ls-tool-thumb"]').length).toBe(3);
    click(container.querySelector('[data-testid="continue-latest"]'));
    expect(onContinue).toHaveBeenCalledWith(items[0].place);
    click($$('button').find((b) => b.textContent === 'Refresh first'));
    expect(onRefresh).toHaveBeenCalled();
    click($$('button').find((b) => b.textContent === 'Start fresh'));
    expect(onForget).toHaveBeenCalled();
    click(container.querySelector('[data-testid="continue-others"] button'));
    expect(onContinue).toHaveBeenCalledWith(items[1].place);
  });
  it('on the classic page: no thumbnails', () => {
    act(() => root.render(<ContinueOffer items={items} onContinue={() => {}} onRefresh={() => {}} onForget={() => {}} />));
    expect($$('[data-testid="ls-tool-thumb"]').length).toBe(0);
  });
});

describe('Browse: area, course and lesson squares are pictures; every tap still drills down and opens', () => {
  it('in the new look', () => {
    const onOpenLesson = vi.fn();
    const tools = studioToolsFor(INDEX, { 'living-lessons': { image: { src: 'topic.webp' } } }, () => 'living-lessons');
    act(() => root.render(<StudioToolsContext.Provider value={tools}><LearnSquares courses={[LIVING]} onOpenLesson={onOpenLesson} /></StudioToolsContext.Provider>));
    const area = container.querySelector('[data-testid^="square-area-"]');
    expect(area.querySelector('[data-testid="ls-tile-cover"]')).toBeTruthy();
    click(area);
    const course = container.querySelector('[data-testid="square-course-living-lessons"]');
    expect(course.querySelector('[data-testid="ls-tile-cover"]')).toBeTruthy();
    click(course);
    const lesson = container.querySelector(`[data-testid="square-lesson-${LIVING.schedule[0].id}"]`);
    expect(lesson.classList.contains('ls-tile')).toBe(true);
    click(lesson);
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', LIVING.schedule[0].id);
  });
  it('on the classic page: no picture', () => {
    act(() => root.render(<LearnSquares courses={[LIVING]} onOpenLesson={() => {}} />));
    expect($$('[data-testid="ls-tile-cover"]').length).toBe(0);
  });
});

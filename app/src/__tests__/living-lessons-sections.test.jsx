// =============================================================================
// A long course is shelved by where in the Word each lesson stands (DR-0596)
// =============================================================================
// Darrell 2026-09-23, from the picker on his Fold reading "Living Lessons from
// the Word · 189 lessons": "Living Lessons may need their own Sections...".
// Pinned here: the helper places a lesson by its FIRST anchor's book into the
// Word's own divisions in canonical order; every lesson lands exactly once and
// the counts add up; and on the REAL component tree the Living Lessons picker
// renders ONE flat list with a shelf select (DR-0603 — the long list is the
// default; a division is a lens the reader picks), while a short course keeps
// the flat list with no select.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { BUSINESS_RESEARCH_MODULES } from '../lib/business-research-course.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { firstAnchorBook, divisionOf, sectionLessons, wantsSections, sectionHolding, SECTION_MIN_LESSONS, LESSON_DIVISIONS } from '../lib/lesson-sections.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the helper reads the lesson’s own anchor, never a typed theme', () => {
  it('takes the FIRST reference’s book, with numbered and multi-word books read whole', () => {
    expect(firstAnchorBook('Matthew 5:48; Genesis 17:1')).toBe('Matthew');
    expect(firstAnchorBook('1 Corinthians 12:12,27; Romans 12:4-5')).toBe('1 Corinthians');
    expect(firstAnchorBook('Song of Solomon 2:4')).toBe('Song of Solomon');
    expect(firstAnchorBook('')).toBe('');
    expect(firstAnchorBook(null)).toBe('');
  });

  it('places every book of the Word in one of eight divisions, in canonical order', () => {
    expect(LESSON_DIVISIONS.map((d) => d.key)).toEqual(['law', 'history', 'wisdom', 'prophets', 'gospels', 'acts', 'letters', 'revelation']);
    expect(divisionOf({ anchor: { ref: 'Deuteronomy 19:15' } }).key).toBe('law');
    expect(divisionOf({ anchor: { ref: 'Nehemiah 4:6' } }).key).toBe('history');
    expect(divisionOf({ anchor: { ref: 'Psalm 23:1' } }).key).toBe('wisdom');
    expect(divisionOf({ anchor: { ref: 'Habakkuk 2:2' } }).key).toBe('prophets');
    expect(divisionOf({ anchor: { ref: 'John 3:16' } }).key).toBe('gospels');
    expect(divisionOf({ anchor: { ref: 'Acts 17:11' } }).key).toBe('acts');
    expect(divisionOf({ anchor: { ref: '3 John 1:2' } }).key).toBe('letters');
    expect(divisionOf({ anchor: { ref: 'Revelation 22:20' } }).key).toBe('revelation');
  });

  it('PROVEN-TO-CATCH: an unreadable anchor is shelved as Unplaced, never dropped', () => {
    const sections = sectionLessons([{ id: 'a', anchor: { ref: 'John 1:1' } }, { id: 'b', anchor: { ref: 'not a reference' } }, { id: 'c' }]);
    expect(sections.map((s) => s.key)).toEqual(['gospels', 'unplaced']);
    expect(sections[1].lessons.map((m) => m.id)).toEqual(['b', 'c']);
    expect(sections.reduce((n, s) => n + s.lessons.length, 0)).toBe(3);
  });

  it('keeps course order inside a section and canonical order across sections', () => {
    const sections = sectionLessons([
      { id: 'r', anchor: { ref: 'Revelation 1:1' } }, { id: 'g1', anchor: { ref: 'Genesis 1:1' } },
      { id: 'j', anchor: { ref: 'John 1:1' } }, { id: 'g2', anchor: { ref: 'Exodus 3:14' } },
    ]);
    expect(sections.map((s) => s.key)).toEqual(['law', 'gospels', 'revelation']);
    expect(sections[0].lessons.map((m) => m.id)).toEqual(['g1', 'g2']);
    expect(sectionHolding(sections, 'j')).toBe('gospels');
    expect(sectionHolding(sections, 'nope')).toBe('law');
    expect(sectionHolding([], 'j')).toBe('');
  });

  it('the threshold: 189 lessons want sections, eight do not', () => {
    expect(SECTION_MIN_LESSONS).toBe(30);
    expect(wantsSections(LIVING_LESSONS_MODULES)).toBe(true);
    expect(wantsSections(LIVING_LESSONS_MODULES.slice(0, 8))).toBe(false);
    expect(wantsSections(null)).toBe(false);
  });

  it('MEASURED on the real Living Lessons: every lesson lands once, no Unplaced, and the Gospels and the Letters carry the most', () => {
    const sections = sectionLessons(LIVING_LESSONS_MODULES);
    expect(sections.reduce((n, s) => n + s.lessons.length, 0)).toBe(LIVING_LESSONS_MODULES.length);
    expect(sections.find((s) => s.key === 'unplaced')).toBeUndefined();
    const ids = sections.flatMap((s) => s.lessons.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
    const by = Object.fromEntries(sections.map((s) => [s.key, s.lessons.length]));
    expect(by.gospels).toBeGreaterThanOrEqual(40);
    expect(by.letters).toBeGreaterThanOrEqual(50);
    expect(sections.length).toBeGreaterThanOrEqual(7);
  });
});

describe('on the real Learn tree', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });
  const extraCourses = buildCatalogCourseDescriptors();
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const pick = (titleRe) => {
    const sel = container.querySelector('#learn-course-pick');
    const opt = [...sel.querySelectorAll('option')].find((o) => titleRe.test(o.textContent || ''));
    if (!opt) throw new Error(`no option for ${titleRe}`);
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, opt.value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  // THE LONG LIST IS THE DEFAULT (Darrell 2026-09-24, shown the collapsed
  // sections on Living Lessons: "I would rather have the long list than this!
  // ... This is just totally different feel and process!!!!!!"). DR-0603: the
  // flat list renders for every course the same way; a long course adds a
  // "Show" select whose first option is the whole course and whose others are
  // the Word's divisions with their counts. No <details> folds anything away.
  const shelfSelect = () => container.querySelector('#learn-lesson-shelf');
  const rows = (nav) => nav.querySelectorAll('[data-testid="course-lesson-list"] > li[data-lesson-id]');
  const headings = (nav) => [...nav.querySelectorAll('[data-testid="course-lesson-list"] > li[data-shelf-heading]')];
  const choose = (sel, value) => act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });

  it('Living Lessons renders the whole course as ONE flat list by default — nothing folded, no <details>', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const nav = container.querySelector('[data-testid="course-lessons-first"]');
    expect(nav, 'the by-title index must render').toBeTruthy();
    expect(nav.querySelector('details'), 'PROVEN-TO-CATCH: a collapsed section must never return').toBe(null);
    expect(nav.querySelector('[data-testid="course-lesson-sections"]')).toBe(null);
    expect(rows(nav).length).toBe(LIVING_LESSONS_MODULES.length);
    expect(nav.querySelector('[data-testid="course-lesson-list"]').getAttribute('data-shelf')).toBe('all');
    // THE DIVISION NAMES STAY, AS INLINE HEADINGS IN THE ONE LIST (Darrell
    // 2026-09-24: "I do like the the lessons sections say what they should be
    // associated with... just felt locked out of the flow"). A heading row per
    // division, in canonical order, counts beside it, and every lesson row
    // sits under its own division; none of it folds.
    const heads = headings(nav);
    expect(heads.length).toBe(sectionLessons(LIVING_LESSONS_MODULES).length);
    expect(heads[0].textContent).toMatch(/^The Law/);
    expect(heads.map((h) => h.getAttribute('data-shelf-heading'))).toEqual(sectionLessons(LIVING_LESSONS_MODULES).map((s) => s.key));
    const all = [...nav.querySelectorAll('[data-testid="course-lesson-list"] > li')];
    const firstLaw = all.indexOf(heads[0]);
    const firstHistory = all.indexOf(heads[1]);
    expect(all.slice(firstLaw + 1, firstHistory).every((li) => li.hasAttribute('data-lesson-id'))).toBe(true);
    expect(all.slice(firstLaw + 1, firstHistory).length).toBe(sectionLessons(LIVING_LESSONS_MODULES)[0].lessons.length);
    // The stated count on the heading still matches the course.
    expect((nav.textContent || '')).toMatch(new RegExp(`by title · ${LIVING_LESSONS_MODULES.length}`));
  });

  it('the shelf select offers the whole course first, then the Word’s divisions with counts that add up to the course', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const sel = shelfSelect();
    expect(sel, 'a long course must offer the shelf select').toBeTruthy();
    const opts = [...sel.querySelectorAll('option')];
    expect(opts[0].value).toBe('all');
    expect(opts[0].textContent).toMatch(new RegExp(`· ${LIVING_LESSONS_MODULES.length}$`));
    const divisions = opts.slice(1);
    expect(divisions.length).toBeGreaterThanOrEqual(7);
    expect(divisions[0].textContent).toMatch(/^The Law · \d+$/);
    const counted = divisions.reduce((n, o) => n + Number((o.textContent.match(/· (\d+)$/) || [])[1] || 0), 0);
    expect(counted).toBe(LIVING_LESSONS_MODULES.length);
    // The select sits ABOVE the list, inside the by-title index.
    const nav = container.querySelector('[data-testid="course-lessons-first"]');
    const list = nav.querySelector('[data-testid="course-lesson-list"]');
    expect(nav.contains(sel)).toBe(true);
    expect(!!(sel.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it('picking a division narrows the SAME flat list to that shelf, and "all" brings the whole course back', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const nav = container.querySelector('[data-testid="course-lessons-first"]');
    const expected = sectionLessons(LIVING_LESSONS_MODULES);
    const law = expected.find((s) => s.key === 'law');
    choose(shelfSelect(), 'law');
    expect(nav.querySelector('[data-testid="course-lesson-list"]').getAttribute('data-shelf')).toBe('law');
    expect(rows(nav).length).toBe(law.lessons.length);
    expect(headings(nav).length, 'a narrowed shelf needs no headings').toBe(0);
    expect(nav.querySelector('details')).toBe(null);
    expect([...rows(nav)].map((li) => li.textContent)).toEqual(expect.arrayContaining([expect.stringContaining(law.lessons[0].title)]));
    choose(shelfSelect(), 'all');
    expect(rows(nav).length).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('the shelf choice belongs to the course: leaving Living Lessons and coming back shows the whole course again', () => {
    mount();
    pick(/Living Lessons from the Word/);
    choose(shelfSelect(), 'gospels');
    const nav = () => container.querySelector('[data-testid="course-lessons-first"]');
    expect(rows(nav()).length).toBeLessThan(LIVING_LESSONS_MODULES.length);
    pick(/Business Research, Level 1/);
    expect(shelfSelect(), 'a short course offers no shelf select').toBe(null);
    pick(/Living Lessons from the Word/);
    expect(rows(nav()).length).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('PROVEN-TO-CATCH: a short course keeps the flat list and gets no shelf select', () => {
    mount();
    pick(/Business Research, Level 1/);
    const nav = container.querySelector('[data-testid="course-lessons-first"]');
    expect(nav).toBeTruthy();
    expect(nav.querySelector('[data-testid="course-lesson-sections"]')).toBe(null);
    expect(shelfSelect()).toBe(null);
    expect(headings(nav).length).toBe(0);
    // Eight lessons when this was written; nine since the oil lesson (DR-0602) —
    // the count is read from the course so the pin proves the flat list, not the number.
    expect(rows(nav).length).toBe(BUSINESS_RESEARCH_MODULES.length);
    expect(BUSINESS_RESEARCH_MODULES.length).toBe(9);
  });
});

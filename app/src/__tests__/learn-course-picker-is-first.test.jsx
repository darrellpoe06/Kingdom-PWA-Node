// =============================================================================
// The course picker is the FIRST control on the Learn tab — asserted by ORDER
// =============================================================================
// Darrell, 2026-09-06, having said it repeatedly: "the course drop down is still
// not above the lessons scroll... we need the scroll and the lookup to be below
// the course picking drop downs... its hard to find!!! I've said this already
// too many times!!! Give me the reason it's not moved". Then, with a screenshot
// of the live Learn tab: "even above where you left off" and "Share course is at
// the top not the course drop down to pick".
//
// WHY IT KEPT NOT MOVING — the thing this gate exists to prevent. Two earlier
// passes at "hard to find" each answered with a NEW control rather than moving
// the one he named: the sticky "All lessons" landmark bar
// (data-testid="lessons-bar") and the lesson finder. Both are good, and neither
// is the course picker. Meanwhile the picker itself stayed BELOW the course
// title, the Share button, the derived catalog line and the resume banner — so
// on a phone it was a finger-flick below the fold and effectively invisible.
//
// PRESENCE WAS NEVER THE PROBLEM, so presence is not what this file tests.
// Existing suites already prove the picker renders and switches courses
// (learn-catalog-render, learn-lesson-space). This one asserts its POSITION in
// the DOM, because position is the entire complaint and the only thing that can
// silently regress while every other test stays green.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ROOM TO BREATHE ON A STARVED RUNNER (2026-10-01). These tests mount the whole
// Learn surface with the full catalog (206 lessons) and then walk the DOM. On
// a quiet machine each takes well under a second; in CI shard 4/4, with the
// runners starved (a 280 to 320 s shard), the same test crossed vitest's 5 s
// default twice in one afternoon (#1935 at 13:55 UTC, #1938 at 14:29 UTC),
// failing PRs that never touched the Learn tab. The work is real, not a hang,
// so the limit is raised for this file; a true hang still fails at 20 s.
vi.setConfig({ testTimeout: 20000 });
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import React from 'react';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { courseCrossListedCount } from '../lib/learn-crosslist.js';

let container; let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const CATALOG = buildCatalogCourseDescriptors();

const mount = (props = {}) => act(() => root.render(React.createElement(ChurchLearn, {
  progress: {},
  recordProgress: () => {},
  quizState: {},
  recordQuiz: () => {},
  learnLevel: 'auto',
  setLearnLevel: () => {},
  ageBand: 'adult',
  setAgeBand: () => {},
  ...props,
})));

// Document order of two nodes: true when a comes before b.
const isBefore = (a, b) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const picker = () => container.querySelector('#learn-course-pick');

// THE AREAS ARE SUB-TABS (DR-1186): what used to sit under the picker now lives
// one tap away in its area (Continue, Latest, Find, Record, Downloads). These
// helpers make the tap a reader makes before the lookup, so each case still
// pins what it always pinned, reached the way it is reached.
const openArea = (id) => {
  const tab = container.querySelector(`#learn-area-tab-${id}`);
  if (tab && tab.getAttribute('aria-selected') !== 'true') act(() => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};

// LEARN OPENS ON THE ONE LIST NOW (DR-1183): no course is open until one is
// chosen, so a test about a control that belongs to an open course opens one
// first -- the same tap a reader makes.
const openCourse = (match = null) => {
  const rows = [...container.querySelectorAll('[data-testid="course-choice-list"] button[data-course]')];
  if (!rows.length) throw new Error('the one list offered no course to open');
  const row = match ? rows.find((b) => (b.textContent || '').includes(match)) : rows[0];
  if (!row) throw new Error(`course not offered: ${match}`);
  act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};
// The department tabs are role="tab" nodes, not plain buttons -- selecting them
// by tagName finds nothing and the assertion passes vacuously, which is how a
// gate becomes theatre. Same selector the crosslisted-in-the-picker suite uses.
const deptTabs = () => [...container.querySelectorAll('#learn-dept-panel-all, [id^="learn-dept-tab-"]')]
  .filter((el) => el.getAttribute('role') === 'tab');
const mountWithCatalog = (props = {}) => mount({ extraCourses: CATALOG, ...props });

describe('the course picker comes FIRST on the Learn tab', () => {
  it('the picker is on screen at all', () => {
    mount();
    expect(picker(), 'the course dropdown must render').toBeTruthy();
  });

  it('comes before the course TITLE — you pick the course, then it names itself', () => {
    mount();
    const h2 = container.querySelector('#learn-h');
    expect(h2, 'the Learn heading must exist').toBeTruthy();
    expect(isBefore(picker(), h2), 'the picker must precede the course title').toBe(true);
  });

  it('comes before SHARE THIS COURSE (Darrell: "Share course is at the top not the course drop down")', () => {
    mount();
    // Share this course belongs to an OPEN course, and nothing is open until
    // one is chosen (DR-1183), so this opens one first -- the order it pins is
    // between the picker and that control, not whether the control exists on
    // arrival.
    openCourse();
    const share = [...container.querySelectorAll('button')]
      .find((b) => /share this course/i.test(b.textContent || ''));
    expect(share, 'the share-course control must exist').toBeTruthy();
    expect(isBefore(picker(), share), 'the picker must precede Share this course').toBe(true);
  });

  it('comes before the derived catalog line', () => {
    mount();
    openArea('downloads'); // the catalog line is the Downloads area's (DR-1186)
    const line = [...container.querySelectorAll('p')]
      .find((p) => /every finished lesson in the PoeTech App/i.test(p.textContent || ''));
    expect(line, 'the catalog line must exist').toBeTruthy();
    expect(isBefore(picker(), line), 'the picker must precede the catalog line').toBe(true);
  });

  it('comes before RESUME — Darrell: "even above where you left off"', () => {
    // The resume offer only renders when a saved place resolves against the
    // mounted catalog. This used to mount with NO place and return early —
    // a check that could never fail (DR-0631 found it vacuous). A real place
    // is seeded now, so the order is actually asserted.
    window.localStorage.setItem('poe-learn-place', JSON.stringify({ courseKey: 'living-lessons', lessonId: 'll3-bodybuilding-christ', stage: 1, step: 2, at: 1 }));
    mountWithCatalog();
    openArea('continue'); // the offer is the Continue area's (DR-1186); its chip stays on the bar
    const resume = container.querySelector('[data-testid="continue-offer"]');
    expect(resume, 'a seeded place must render the offer').toBeTruthy();
    expect(resume.textContent).toMatch(/pick up where you left off/i);
    expect(isBefore(picker(), resume), 'the picker must precede the resume banner').toBe(true);
    window.localStorage.removeItem('poe-learn-place');
    window.localStorage.removeItem('poe-learn-places');
  });

  it('comes before the sticky lessons bar and the lesson finder — the scroll and the lookup sit BELOW it', () => {
    mount();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(bar, 'the landmark bar must exist').toBeTruthy();
    expect(isBefore(picker(), bar), 'the picker must precede the lessons bar').toBe(true);

    const find = container.querySelector('#learn-lesson-find');
    if (find) expect(isBefore(picker(), find), 'the picker must precede the finder').toBe(true);
  });

  it('the SORT control travels with it, so the pair is not split across the fold', () => {
    mount();
    const sort = container.querySelector('#learn-course-sort');
    expect(sort, 'the sort control must exist').toBeTruthy();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(isBefore(sort, bar), 'sort must also sit above the lessons bar').toBe(true);
  });

  it('the picker is a real 44px touch target', () => {
    mount();
    const minH = Number((picker().className.match(/min-h-\[(\d+)px\]/) || [])[1]);
    expect(minH, 'the picker must declare a touch-target height').toBeGreaterThanOrEqual(44);
  });
});

describe('the obvious progression: pick one of N courses, or search by name, then scroll', () => {
  // Darrell, 2026-09-06: "Pick one of 23 courses... or below search by name...
  // then scroll to see if one sticks out to the user by title.... obvious
  // progression". Three steps, in that order, before anything else on the page.
  it('STEP 1 — the picker names the live course count rather than a vague label', () => {
    mount();
    const label = container.querySelector('label[for="learn-course-pick"]');
    expect(label, 'the picker must be labelled').toBeTruthy();
    const n = Number((label.textContent.match(/select one of (\d+)/i) || [])[1]);
    expect(Number.isFinite(n), `label must state a count, got: ${label.textContent}`).toBe(true);
    // The number is DERIVED from the mounted catalog, never typed (DR-0121):
    // it must equal the options actually in the dropdown.
    // the prompt option ("Select a course · N to choose from") is not a course
    expect(picker().querySelectorAll('option:not([value=""])').length).toBe(n);
  });

  it('STEP 2 — the search box sits directly BELOW the picker, before anything else', () => {
    mount();
    openArea('find'); // the finder is the Find area's (DR-1186): one tap under the picker
    const find = container.querySelector('#learn-lesson-find');
    expect(find, 'the lesson finder must render').toBeTruthy();
    expect(isBefore(picker(), find), 'picker first').toBe(true);
    // and nothing from the old ordering may come between them
    const h2 = container.querySelector('#learn-h');
    const share = [...container.querySelectorAll('button')]
      .find((b) => /share this course/i.test(b.textContent || ''));
    expect(isBefore(find, h2), 'the finder must precede the course title').toBe(true);
    if (share) expect(isBefore(find, share), 'the finder must precede Share').toBe(true);
  });

  it('STEP 3 — the scroll (the lessons bar and the schedule) comes after both', () => {
    mount();
    openArea('find');
    const find = container.querySelector('#learn-lesson-find');
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(isBefore(find, bar), 'search must precede the lessons bar').toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Darrell, 2026-09-19, with a screenshot of the Business tab, which has one
  // course of its own and fourteen that serve it: "Not good!!!! Where is the
  // drop-down?!!!!!!!!!! For all tabs..."
  //
  // The cross-list blocks were rendering INSIDE the department block, which put
  // a wall of rows between the tabs and the picker. Everything above already
  // passed -- the picker was before the title, Share, the catalog line and
  // Resume -- because every one of those lives further down the page. Nothing
  // in this file looked at what a DEPARTMENT tab inserts ABOVE it. That blind
  // spot is why the same complaint came back thirteen days later, so it is
  // closed here rather than in a comment.
  // ---------------------------------------------------------------------------
  it('on every DEPARTMENT tab the picker precedes the course index, and no other course\'s lessons are inserted at all (DR-1182)', async () => {
    mountWithCatalog();
    const tabs = deptTabs().filter((t) => (t.textContent || '').trim() !== 'Courses');
    expect(tabs.length, 'no department tabs rendered').toBeGreaterThan(0);
    let checked = 0;
    for (const tab of tabs) {
      await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      const label = tab.textContent.trim();
      // The gathered-lessons block (DR-0448 / DR-0598) left every department
      // tab on 2026-10-21: "Do not put any other lessons out there other than
      // that, period." So does the every-course shelf.
      expect(container.querySelector('[data-testid="learn-crosslisted"]'), `other courses' lessons on ${label}`).toBe(null);
      expect(container.querySelector('[data-testid="lesson-browse-all"]'), `the every-course shelf on ${label}`).toBe(null);
      const index = container.querySelector('[data-testid="course-lessons-first"]');
      if (!picker()) {
        // A department with ONE course of its own and none that serve it has
        // no picker BY DESIGN (nothing else to offer). Asserted, not assumed.
        const own = CATALOG.filter((c) => (c.meta.category || 'General Studies') === label).length;
        expect(own + courseCrossListedCount(label), `no course dropdown on ${label}`).toBe(1);
        continue;
      }
      checked += 1;
      if (index) expect(isBefore(picker(), index), `on ${label} the picker must precede the course's lesson index`).toBe(true);
    }
    expect(checked, 'no department rendered a picker — this check proved nothing').toBeGreaterThan(0);
  }, 120000); // every department tab on the whole catalog, each a full re-render

  it('comes before the Eternal Algorithms study panel on its own tab', async () => {
    mountWithCatalog();
    const tab = deptTabs().find((b) => /eternal algorithms/i.test((b.textContent || '').trim()));
    if (!tab) return;
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const study = container.querySelector('[data-testid="eternal-study-in-learn"]');
    expect(picker(), 'the course dropdown must still render').toBeTruthy();
    if (study) {
      expect(isBefore(picker(), study),
        'the picker must precede the study panel, never follow it').toBe(true);
    }
  });
});

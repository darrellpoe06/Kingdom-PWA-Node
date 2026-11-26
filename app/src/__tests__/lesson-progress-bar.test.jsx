// @vitest-environment jsdom
// =============================================================================
// HOW FAR, ON EVERY LESSON CARD — and never a painted number (DR-1684)
// =============================================================================
// Darrell 2026-11-26, on the new-look Learn grid: "Possibly a indicator bar
// that shows how far a lesson has been listened to or read so we can pick the
// ones we are closest to finishing etc... make sense?" Then: "For all lessons
// not just these."
//
// What these pin, copy and behavior together (DR-0691):
//   1. THE FRACTION is the lesson's own measured place (seen/heard words), on
//      fixtures: no record -> no bar; a step/sentence index alone -> no bar; a
//      re-paced age band keeps the same fraction; finished -> full.
//   2. THE CARD draws the bar only from a real record, with the words
//      "About 40% read" for a screen reader.
//   3. CLOSEST TO FINISHED: begun, measured, unfinished, furthest first.
//   4. END TO END: a lesson read in the new-look Experience writes its place
//      (before DR-1684 that path's witnesses were no-ops and wrote nothing).
//   5. THE GATE: no surface may draw a progress fill whose width is not the
//      measured fraction. PROVEN TO CATCH on a painted fixture.
//   6. CONTRAST, measured per theme: the fill against its track >= 3:1
//      (WCAG 1.4.11, non-text).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';
import { lessonProgress, closestToFinished, isUnfinished, placeLookup, studioWitness } from '../lib/lesson-progress.js';
import { recordPlace, getPlaceFor, listPlaces } from '../lib/learn-resume.js';
import LessonProgressBar from '../components/LessonProgressBar.jsx';
import LearnStudio from '../components/learn-studio/LearnStudio.jsx';
import { RowContinue, ContinueOffer, orderClosest } from '../components/LessonContinue.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { presentationIndex, studioHome } from '../lib/learn-presentation/presentation.js';
import { THEME_CSS } from '../lib/theme-css.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function memory() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const place = (over = {}) => ({
  courseKey: 'living-lessons',
  lessonId: 'll338-not-with-eyeservice',
  stage: 0,
  step: 0,
  sentence: 0,
  sentenceKey: '',
  done: false,
  started: true,
  finishes: 0,
  version: '',
  versions: {},
  seen: 0,
  heard: 0,
  at: 1000,
  ...over,
});

let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = (el) => act(() => root.render(el));
const all = (sel) => [...container.querySelectorAll(sel)];

describe('1. the fraction is the measured place, never a guess', () => {
  it('no record, or a record with nothing measured, shows no progress at all', () => {
    expect(lessonProgress(null)).toBeNull();
    expect(lessonProgress(undefined)).toBeNull();
    expect(lessonProgress(place())).toBeNull(); // Start pressed and left: unknown, not 0%
    // An old step-only record: step 5 of an unknown number of steps is NOT a percentage.
    expect(lessonProgress(place({ stage: 2, step: 5, sentence: 14, sentenceKey: 'abc' }))).toBeNull();
  });

  it('reads the furthest witness, in words: About 40% read', () => {
    expect(lessonProgress(place({ seen: 0.4 }))).toMatchObject({ fraction: 0.4, percent: 40, finished: false, label: 'About 40% read' });
    expect(lessonProgress(place({ seen: 0.2, heard: 0.65 }))).toMatchObject({ fraction: 0.65, label: 'About 65% read' });
    expect(lessonProgress(place({ seen: 0.004 })).label).toBe('Under 1% read');
    expect(lessonProgress(place({ heard: 1 }))).toMatchObject({ fraction: 1, finished: false, label: 'All read' });
    expect(lessonProgress(place({ seen: 0.4, version: 'teen' })).label).toBe('About 40% read, Teen version');
  });

  it('a re-paced age band keeps the same fraction: the sentence index is never the measure', () => {
    // The same reading, recorded under two renderings: index 14 of one is not index 14 of the other.
    const adult = lessonProgress(place({ seen: 0.4, step: 3, sentence: 14, sentenceKey: 'k1', version: 'adult' }));
    const child = lessonProgress(place({ seen: 0.4, step: 9, sentence: 41, sentenceKey: 'k2', version: 'child' }));
    expect(adult.fraction).toBe(child.fraction);
    expect(adult.percent).toBe(40);
  });

  it('a finished reading is full; reading it again starts a new bar from the new reading', () => {
    const store = memory();
    const opts = { storage: store, now: 5000 };
    const k = { courseKey: 'living-lessons', lessonId: 'll1' };
    recordPlace({ ...k, seen: 0.95, done: true }, opts);
    expect(lessonProgress(getPlaceFor(k.courseKey, k.lessonId, opts))).toMatchObject({ fraction: 1, finished: true, label: 'Read to the end' });
    // Back to the top, reading again: the old 95% never stands in for this reading.
    recordPlace({ ...k, stage: 0, step: 0, sentence: 0 }, opts);
    recordPlace({ ...k, step: 2, seen: 0.3 }, opts);
    expect(lessonProgress(getPlaceFor(k.courseKey, k.lessonId, opts))).toMatchObject({ fraction: 0.3, finished: false });
  });
});

describe('2. the bar draws only from a real record', () => {
  it('nothing measured: no bar, no empty track', () => {
    render(<LessonProgressBar place={place({ step: 4 })} />);
    expect(all('[data-testid="lesson-progress"]')).toHaveLength(0);
  });

  it('a real record: the fill is the fraction, and the words are there for a screen reader', () => {
    render(<LessonProgressBar place={place({ seen: 0.4 })} look="studio" />);
    const bar = container.querySelector('[data-testid="lesson-progress"]');
    expect(bar.getAttribute('data-progress')).toBe('0.4');
    expect(container.querySelector('[data-testid="lesson-progress-fill"]').style.width).toBe('40%');
    expect(bar.querySelector('.sr-only').textContent).toBe('About 40% read');
  });

  const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
  const LL338 = COURSES.find((c) => c.key === 'living-lessons').schedule.find((l) => l.id === 'll338-not-with-eyeservice');
  const REC = {
    lessonId: LL338.id,
    courseKey: 'living-lessons',
    originalTitleAtApproval: LL338.title,
    displayTitle: 'Who Is Watching When You Work Alone?',
    thumbHeadline: 'WORK WHEN UNSEEN',
    promoDescription: 'A test description.',
    visual: { alt: 'A woman works at a desk in daylight.' },
    image: { src: '/x.webp' },
    status: 'review',
    featured: true,
    featuredOrder: 1,
  };

  it('the new-look grid: a card with a record carries the bar; with none, no card does', () => {
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview initialCourse="living-lessons" allPlaces={[]} />);
    expect(container.textContent).toContain('Who Is Watching When You Work Alone?');
    expect(all('[data-testid="lesson-progress"]')).toHaveLength(0);
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview initialCourse="living-lessons" allPlaces={[place({ seen: 0.4 })]} />);
    const bars = all('.ls-card [data-testid="lesson-progress"]');
    expect(bars.length).toBeGreaterThan(0);
    for (const b of bars) {
      expect(b.closest('.ls-card').textContent).toContain('Who Is Watching When You Work Alone?');
      expect(b.textContent).toBe('About 40% read');
    }
  });

  it('the classic row: Continue carries the bar, and a reading measured in the Experience (no step) still shows', () => {
    render(<RowContinue place={place({ step: 2, seen: 0.38 })} title="T" onContinue={() => {}} />);
    expect(container.querySelector('[data-testid="row-continue"] [data-testid="lesson-progress-fill"]').style.width).toBe('38%');
    expect(container.querySelector('[data-testid="row-continue"]').textContent).toBe('Continue · 38% read'); // the number said once
    // A reading measured in the new-look Experience (no step) counts as begun past 2% (DR-1674, reconciled with
    // DR-1684 on merge): it is offered as Continue, carrying its own bar, so what he was reading is found.
    render(<RowContinue place={place({ seen: 0.5 })} title="T" onContinue={() => {}} />);
    expect(container.querySelector('[data-testid="row-continue"]').textContent).toBe('Continue · 50% read');
    expect(container.querySelector('[data-testid="row-continue"] [data-testid="lesson-progress-fill"]').style.width).toBe('50%');
    render(<RowContinue place={place()} title="T" onContinue={() => {}} />);
    expect(all('[data-testid="lesson-progress"]')).toHaveLength(0);
  });
});

describe('3. closest to finished', () => {
  const places = [
    place({ lessonId: 'a', seen: 0.3, at: 10 }),
    place({ lessonId: 'b', heard: 0.8, at: 5 }),
    place({ lessonId: 'c', seen: 0.95, done: true, at: 20 }), // finished: not "closest"
    place({ lessonId: 'd', step: 6, at: 30 }), // nothing measured: never ranked on a guess
    place({ lessonId: 'e', seen: 1, at: 40 }), // every word read: nothing left to finish
    place({ lessonId: 'f', seen: 0.3, at: 50 }), // ties 'a': the more recent first
  ];
  it('begun, measured, unfinished; furthest first, then most recent', () => {
    expect(closestToFinished(places).map((x) => x.place.lessonId)).toEqual(['b', 'f', 'a']);
    expect(closestToFinished(places, { limit: 1 }).map((x) => x.place.lessonId)).toEqual(['b']);
    expect(isUnfinished(lessonProgress(places[2]))).toBe(false);
  });

  it('the new-look home builds the shelf from every saved place across the catalog', () => {
    const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
    const two = COURSES.filter((c) => c.schedule.length).slice(0, 2);
    const ps = [
      place({ courseKey: two[0].key, lessonId: two[0].schedule[0].id, seen: 0.2 }),
      place({ courseKey: two[1].key, lessonId: two[1].schedule[0].id, heard: 0.7 }),
    ];
    const home = studioHome(COURSES, presentationIndex([]), { places: [], allPlaces: ps, preview: true });
    expect(home.closestToFinished.map((x) => x.p.lessonId)).toEqual([two[1].schedule[0].id, two[0].schedule[0].id]);
    expect(home.closestToFinished.map((x) => x.reached)).toEqual([0.7, 0.2]);
  });

  it('the classic Continue offer can be ordered closest to finished', () => {
    const items = [
      { place: place({ lessonId: 'x', step: 1, seen: 0.2 }), course: { key: 'k', meta: { title: 'K' }, schedule: [] }, lesson: { id: 'x', title: 'Lesson X' } },
      { place: place({ lessonId: 'y', step: 1 }), course: { key: 'k', meta: { title: 'K' }, schedule: [] }, lesson: { id: 'y', title: 'Lesson Y' } },
      {
        place: place({ lessonId: 'z', step: 1, heard: 0.9 }),
        course: { key: 'k', meta: { title: 'K' }, schedule: [] },
        lesson: { id: 'z', title: 'Lesson Z' },
      },
    ];
    expect(orderClosest(items).map((x) => x.lesson.id)).toEqual(['z', 'x', 'y']);
    render(<ContinueOffer items={items} onContinue={() => {}} onRefresh={() => {}} onForget={() => {}} />);
    const latest = () => container.querySelector('[data-testid="continue-latest"]').getAttribute('aria-label');
    expect(latest()).toMatch(/^Continue Lesson X/);
    act(() => container.querySelector('[data-testid="continue-order-closest"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(latest()).toBe('Continue Lesson Z, part 1, step 2, about 90% read');
  });
});

describe('4. end to end: a reading in the new-look Experience writes its place', () => {
  it('seen and heard land on the lesson, the bar follows, and the read is credited only past the evidence floor', () => {
    const store = memory();
    const w = studioWitness('living-lessons', 'll338-not-with-eyeservice', { storage: store, now: 100 });
    expect(w.place()).toBeNull();
    w.onSeen(0.4, 'adult');
    const p1 = getPlaceFor('living-lessons', 'll338-not-with-eyeservice', { storage: store });
    expect(p1).toMatchObject({ seen: 0.4, started: true, version: 'adult', done: false });
    expect(lessonProgress(p1).label).toBe('About 40% read, Adult version');
    w.onHeard(0.5, 'adult');
    expect(getPlaceFor('living-lessons', 'll338-not-with-eyeservice', { storage: store }).done).toBe(false);
    w.onHeard(0.95, 'adult'); // past READ_FLOOR (0.9): credited, as the classic finishRead does
    const p2 = getPlaceFor('living-lessons', 'll338-not-with-eyeservice', { storage: store });
    expect(p2.done).toBe(true);
    expect(p2.finishes).toBe(1);
    expect(listPlaces({ storage: store })).toHaveLength(1);
  });

  it('PROVEN TO CATCH: the old no-op witnesses recorded nothing, so no bar could ever appear', () => {
    const store = memory();
    const noop = { onSeen() {}, onHeard() {} };
    noop.onSeen(0.4, 'adult');
    expect(listPlaces({ storage: store })).toHaveLength(0);
    expect(lessonProgress(getPlaceFor('living-lessons', 'll338-not-with-eyeservice', { storage: store }))).toBeNull();
  });

  it('the grid lookup finds a lesson by course, and by lesson id when its course key differs', () => {
    const find = placeLookup([place({ courseKey: 'a', lessonId: 'L', seen: 0.1, at: 1 }), place({ courseKey: 'b', lessonId: 'L', seen: 0.6, at: 9 })]);
    expect(find('a', 'L').seen).toBe(0.1);
    expect(find('zz', 'L').seen).toBe(0.6);
    expect(find('a', 'none')).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 5. THE GATE: a progress fill is drawn in ONE place, from the measured fraction
// -----------------------------------------------------------------------------
const SRC = path.resolve(__dirname, '..');
const FILL = /(ls-progress-fill|lpb-oncolor-fill|data-testid=["']lesson-progress(-fill)?["'])/;

/** Every painted-progress violation in one file's source. */
function paintedProgress(file, text) {
  const out = [];
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (rel === 'components/LessonProgressBar.jsx') {
    // The one drawer: its width must be computed from the fraction, never a literal.
    if (!/const width = `\$\{Math\.max\(0, Math\.min\(100, pr\.fraction \* 100\)\)\}%`/.test(text))
      out.push(`${rel}: the fill width is not the measured fraction`);
    if (/width:\s*['"`]\d/.test(text)) out.push(`${rel}: a literal width`);
    if (!/lessonProgress\(place\)/.test(text)) out.push(`${rel}: the bar does not read lessonProgress`);
    return out;
  }
  if (/\.test\.|__tests__/.test(rel)) return out;
  if (/\.(jsx?|tsx?)$/.test(rel) && FILL.test(text)) out.push(`${rel}: draws a lesson-progress fill itself; use <LessonProgressBar>`);
  return out;
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(f, files);
    } else if (/\.(jsx?|tsx?)$/.test(e.name)) files.push(f);
  }
  return files;
}

describe('5. the gate: no painted progress', () => {
  it('every lesson-progress fill in the app is drawn by LessonProgressBar from lessonProgress', () => {
    const bad = walk(SRC).flatMap((f) => paintedProgress(f, fs.readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });

  it('PROVEN TO CATCH: a card that paints its own 60% bar, and a drawer with a literal width', () => {
    const card = path.join(SRC, 'components/learn-studio/FakeCard.jsx');
    expect(paintedProgress(card, '<span className="ls-progress-fill" style={{ width: "60%" }} />')).toHaveLength(1);
    const real = fs.readFileSync(path.join(SRC, 'components/LessonProgressBar.jsx'), 'utf8');
    const painted = real.replace('const width = `${Math.max(0, Math.min(100, pr.fraction * 100))}%`', "const width = '60%'");
    expect(painted).not.toBe(real);
    expect(paintedProgress(path.join(SRC, 'components/LessonProgressBar.jsx'), painted).length).toBeGreaterThan(0);
    expect(paintedProgress(path.join(SRC, 'components/LessonProgressBar.jsx'), real.replace('lessonProgress(place)', 'fake(place)')).length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// 6. CONTRAST, MEASURED: fill against track, every theme
// -----------------------------------------------------------------------------
function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Alpha-composite a color over a background (both #rrggbb). */
function over(hex, alpha, bg) {
  const p = (s) => [0, 2, 4].map((i) => parseInt(s.replace('#', '').slice(i, i + 2), 16));
  const [f, b] = [p(hex), p(bg)];
  return `#${f
    .map((c, i) =>
      Math.round(c * alpha + b[i] * (1 - alpha))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}
function themed(theme, cls, base) {
  const esc = cls.replace(/[[\]#]/g, (c) => `\\\\\\${c}`);
  const re = new RegExp(`\\[data-theme="${theme}"\\] \\.${esc}\\{background-color:(#[0-9A-Fa-f]{6})!important\\}`);
  const m = THEME_CSS.match(re);
  return m ? m[1] : base;
}

describe('6. contrast, measured on the real colors', () => {
  const themes = [...new Set([...THEME_CSS.matchAll(/\[data-theme="([a-z]+)"\]/g)].map((m) => m[1]))].filter((t) => t !== 'x');

  it('reads the real theme list (the guard is not vacuous)', () => {
    expect(themes.length).toBeGreaterThanOrEqual(10);
    expect(themed('midnight', 'bg-[#E8E4DC]', '#E8E4DC')).toBe('#1A1A1A');
  });

  it('classic: the fill stands >= 3:1 against its track in the default theme and every [data-theme]', () => {
    const rows = [['default', '#5A6E3D', '#E8E4DC'], ...themes.map((t) => [t, themed(t, 'bg-[#5A6E3D]', '#5A6E3D'), themed(t, 'bg-[#E8E4DC]', '#E8E4DC')])];
    for (const [t, fill, track] of rows) expect([t, ratio(fill, track) >= 3]).toEqual([t, true]);
  });

  it('new look: gold on the dark strip stands >= 3:1 even over a pure-white photograph', () => {
    const gold = '#f2bf2e';
    const stripOverWhite = over('#000000', 0.82, '#ffffff');
    expect(ratio(gold, stripOverWhite)).toBeGreaterThanOrEqual(3);
    expect(ratio(gold, '#2c2326')).toBeGreaterThanOrEqual(3); // the inline track (--ls-line) in a list row
    // Gold, never red: true red is reserved for the Blood (DR-0099).
    const css = fs.readFileSync(path.join(SRC, 'components/learn-studio/learn-studio.css'), 'utf8');
    const fillRule = css.match(/\.ls-progress-fill \{[^}]*\}/)[0];
    expect(fillRule).toContain('var(--ls-gold)');
    expect(fillRule).not.toMatch(/--ls-red|#d7261e|\bred\b/);
  });
});

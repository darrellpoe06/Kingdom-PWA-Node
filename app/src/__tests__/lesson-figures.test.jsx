// =============================================================================
// Lesson figures — the picture a lesson talks about is shown, and is true
// =============================================================================
// The family, 2026-10-29, with two phone screenshots of L270: "We need to see
// images in the lessons if we need a diagram or workflows timelines etc..."
// L270 asked "what changed when you saw the chart?" and showed no chart.
//
// THREE THINGS THIS GATE HOLDS (DR-1289):
//   1. Every lesson the sweep found pointing at a picture the reader could not
//      see now carries one, and a figure that would not render cannot pass.
//   2. Nothing on a figure is invented. L270's sixty-six rows are derived from
//      the transcribed chart (progress-of-revelation.js) and must equal it row
//      for row; the blank author lines stay blank; the lesson's own disclosure
//      is carried word for word. Every date and every reference a sequence or
//      quadrant prints must already stand in its own lesson.
//   3. It renders: real text for every row, no bar where the chart gives no
//      date, and the disclosure on screen.
//
// PROVEN-TO-CATCH (DR-0076 §3): figureProblems is fed one broken figure of
// each class (no source, wrong kind, backwards span, an image outside the
// app's own folder, an image without alt, a three-cell quadrant) and must
// name each; figuresFor must drop them rather than render them.
import React, { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  LESSON_FIGURES, FIGURE_KINDS, figuresFor, figureProblems, figureAsText, spanScale, spanTicks,
} from '../lib/lesson-figures.js';
import { PROGRESS_OF_REVELATION, chartDateOf, chartAuthorOf } from '../lib/progress-of-revelation.js';
import LessonFigures from '../components/LessonFigures.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L270 = 'll270-the-progress-of-revelation-the-word-came-in-order-and-stands-forever';
const byId = Object.fromEntries(LIVING_LESSONS_MODULES.map((m) => [m.id, m]));

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const lessonText = (m) => [...strings({ ...m, figures: undefined })].join('\n');

// The sweep (2026-10-29) over all Living Lessons for a chart, map, diagram,
// timeline or workflow the reader is pointed at but cannot see. Story props
// ("a chart on the fridge") and metaphors ("speed without a map") were not
// counted; these five were, and each now carries its figure. L201 already
// renders its own dated `timeline` block, so it is not here.
const SWEEP = {
  [L270]: 'progress-of-revelation',
  'll140-the-people-of-judah-and-the-people-of-the-way-who-they-are-where-they-are-and-whom-to-listen-to': 'judah-timeline-the-word-carries',
  'll47-navigating-the-age-faith-critical-thinking-identity': 'the-map-in-five-movements',
  'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them': 'the-wiring-diagram',
  'll15-seasoned-with-salt': 'conversational-compass',
};

let root; let host;
function render(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(el));
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); root = null; });

describe('every lesson the sweep found now shows its picture', () => {
  for (const [id, figId] of Object.entries(SWEEP)) {
    it(`${id.slice(0, 48)} carries ${figId}`, () => {
      expect(byId[id], `lesson ${id} exists`).toBeTruthy();
      expect(figuresFor(byId[id]).map((f) => f.id)).toContain(figId);
    });
  }
  it('every registry key is a real Living Lesson, and every registered figure renders', () => {
    for (const [id, figs] of Object.entries(LESSON_FIGURES)) {
      expect(byId[id], id).toBeTruthy();
      for (const f of figs) expect(figureProblems(f), `${id} / ${f.id}`).toEqual([]);
    }
  });
});

describe('L270: the chart is the chart, row for row', () => {
  const fig = figuresFor(byId[L270]).find((f) => f.id === 'progress-of-revelation');
  const rows = fig.groups.flatMap((g) => g.rows);

  it('sixty-six books, thirty-nine and twenty-seven, in the chart’s writing order', () => {
    expect(rows).toHaveLength(66);
    expect(fig.groups.map((g) => g.rows.length)).toEqual([39, 27]);
    expect(rows.map((r) => r.label)).toEqual(PROGRESS_OF_REVELATION.map((r) => r.book));
    expect(fig.groups[0].rows[0].label).toBe('Job');
    expect(fig.groups[0].rows.at(-1).label).toBe('Nehemiah');
    expect(fig.groups[1].rows[0].label).toBe('James');
    expect(fig.groups[1].rows.at(-1).label).toBe('Revelation');
  });

  it('every date and author is the chart’s own, derived, never retyped', () => {
    for (const r of rows) {
      expect(r.dateText, r.label).toBe(chartDateOf(r.label));
      expect(r.detail, r.label).toBe(chartAuthorOf(r.label));
    }
    expect(rows.find((r) => r.label === 'James').dateText).toBe('AD 44 to 49');
    expect(rows.find((r) => r.label === 'Genesis').dateText).toBe('1445 to 1405 BC');
    expect(rows.find((r) => r.label === 'Nehemiah').dateText).toBe('424 to 400 BC');
    expect(rows.find((r) => r.label === 'Revelation').dateText).toBe('AD 94 to 96');
  });

  it('the blanks stay blank: Job undated, Unknown / Anonymous / (?) kept exactly', () => {
    const job = rows.find((r) => r.label === 'Job');
    expect(job.from).toBeNull();
    expect(job.dateText).toBe('Unknown');
    expect(rows.find((r) => r.label === 'Hebrews').detail).toBe('Unknown');
    for (const b of ['1 Samuel', '2 Samuel', '1 Kings', '2 Kings', 'Esther']) expect(rows.find((r) => r.label === b).detail).toBe('Anonymous');
    expect(rows.find((r) => r.label === 'Ruth').detail).toBe('Samuel (?)');
    expect(rows.find((r) => r.label === '1 Chronicles').detail).toBe('Ezra (?)');
  });

  it('carries the lesson’s own disclosure word for word, and names its source', () => {
    expect(fig.disclosure).toBe('We did not check the chart against any other chart.');
    // The lesson's sentence runs on after a comma; the figure ends it there.
    expect(byId[L270].lesson).toContain(fig.disclosure.replace(/\.$/, ','));
    expect(fig.source).toMatch(/photographed pages/);
  });

  it('the scale runs in time order: BC counts down, AD counts up', () => {
    const ot = spanScale(fig.groups[0]);
    expect(ot.start).toBe(1445);
    // Esther's range (450 to 331 BC) reaches lowest, not Nehemiah's.
    expect(ot.end).toBe(331);
    expect(ot.at(1445)).toBe(0);
    expect(ot.at(331)).toBe(1);
    const nt = spanScale(fig.groups[1]);
    expect([nt.start, nt.end]).toEqual([44, 96]);
    const ticks = spanTicks(nt, 'AD');
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.every((t) => t.at >= 0 && t.at <= 1)).toBe(true);
    expect(ticks[0].label).toMatch(/^AD \d+$/);
  });
});

describe('nothing on a sequence or quadrant is invented', () => {
  const others = Object.entries(LESSON_FIGURES).flatMap(([id, figs]) => figs.filter((f) => f.kind !== 'span-chart').map((f) => [id, f]));
  it('measures what it checks (four figures outside L270)', () => expect(others.length).toBe(4));
  for (const [id, f] of others) {
    it(`${f.id}: every reference and every date stands in its own lesson`, () => {
      const text = lessonText(byId[id]);
      const items = f.kind === 'sequence' ? f.steps : f.cells;
      for (const it of items) {
        for (const ref of String(it.refs || '').split(';').map((s) => s.trim()).filter(Boolean)) {
          // "2 Kings 17:18" may appear as "17:18" after "2 Kings 17:6, " in the lesson; accept the chapter:verse
          const cv = ref.replace(/^.*?(\d+:\d+(?:-\d+)?)$/, '$1');
          expect(text.includes(ref) || text.includes(cv), `${f.id}: ${ref}`).toBe(true);
        }
        if (it.date) {
          const year = it.date.replace(/^About /, '');
          expect(text, `${f.id}: ${it.date}`).toContain(year);
        }
      }
    });
  }
});

describe('the gate catches a broken figure (proven-to-catch)', () => {
  const good = { id: 'g', kind: 'sequence', title: 't', source: 's', steps: [{ label: 'a' }, { label: 'b' }] };
  const cases = [
    [{ ...good, source: '' }, /no source/],
    [{ ...good, kind: 'carousel' }, /unknown kind/],
    [{ ...good, steps: [{ label: 'a' }] }, /two or more steps/],
    [{ id: 'x', kind: 'span-chart', title: 't', source: 's', groups: [{ id: 'g', era: 'BC', rows: [{ label: 'X', from: 400, to: 1445 }] }] }, /backwards/],
    [{ id: 'i', kind: 'image', title: 't', source: 's', src: 'https://cdn.example.com/x.png', alt: 'a', depictsPeople: false }, /lesson-figures/],
    [{ id: 'i', kind: 'image', title: 't', source: 's', src: '/lesson-figures/x.webp', alt: '', depictsPeople: false }, /alt text/],
    // DR-1287: an image silent on who it shows, or showing people drawn otherwise, is refused.
    [{ id: 'i', kind: 'image', title: 't', source: 's', src: '/lesson-figures/x.webp', alt: 'a' }, /depictsPeople/],
    [{ id: 'i', kind: 'image', title: 't', source: 's', src: '/lesson-figures/x.webp', alt: 'a', depictsPeople: true }, /African American/],
    [{ id: 'q', kind: 'quadrant', title: 't', source: 's', axes: { x: { label: 'x' }, y: { label: 'y' } }, cells: [{ x: 'low', y: 'low' }, { x: 'high', y: 'low' }, { x: 'low', y: 'high' }] }, /four distinct cells/],
  ];
  for (const [f, re] of cases) {
    it(`names ${re}`, () => {
      expect(figureProblems(f).join('; ')).toMatch(re);
      expect(figuresFor({ id: 'none', figures: [f] })).toEqual([]);
    });
  }
  it('a picture of people drawn as the requirement says passes (DR-1287)', () => {
    const img = { id: 'i', kind: 'image', title: 't', source: 's', src: '/lesson-figures/x.webp', alt: 'a', depictsPeople: true, peopleShown: 'African American' };
    expect(figureProblems(img)).toEqual([]);
  });
  it('a sound figure passes and is shown', () => {
    expect(figureProblems(good)).toEqual([]);
    expect(figuresFor({ id: 'none', figures: [good] })).toHaveLength(1);
  });
  it('every kind the renderer knows is a kind the gate knows', () => {
    expect(FIGURE_KINDS).toEqual(['span-chart', 'sequence', 'quadrant', 'image']);
  });
});

describe('it renders as real text', () => {
  it('L270: sixty-six rows of text, Job with no bar, the disclosure on screen', () => {
    const el = render(<LessonFigures module={byId[L270]} />);
    const rows = el.querySelectorAll('[data-testid="lesson-figure-rows"] li');
    expect(rows).toHaveLength(66);
    const job = el.querySelector('li[data-row="Job"]');
    expect(job.dataset.dated).toBe('false');
    expect(job.textContent).toContain('Unknown');
    expect(job.querySelector('[aria-hidden="true"] span')).toBeNull();
    expect(el.querySelector('li[data-row="James"]').textContent).toContain('AD 44 to 49');
    expect(el.querySelector('[data-testid="lesson-figure-disclosure"]').textContent).toBe('We did not check the chart against any other chart.');
    expect(el.querySelector('figure').getAttribute('aria-labelledby')).toBeTruthy();
  });
  it('a quadrant draws four cells, each saying its own place on both axes', () => {
    const el = render(<LessonFigures module={byId['ll15-seasoned-with-salt']} />);
    const cells = el.querySelectorAll('[data-testid="lesson-figure-cells"] li');
    expect(cells).toHaveLength(4);
    expect(cells[0].textContent).toContain('Savoring');
    expect(cells[0].textContent).toContain('low information, high relationship');
  });
  it('a lesson without a figure renders nothing at all', () => {
    const el = render(<LessonFigures module={LIVING_LESSONS_MODULES[0]} />);
    expect(el.innerHTML).toBe('');
  });
  it('the share text carries every row and the disclosure', () => {
    const t = figureAsText(figuresFor(byId[L270])[0]);
    expect(t).toContain('1. Job — Unknown — Anonymous');
    expect(t).toContain('27. Revelation — AD 94 to 96 — John');
    expect(t).toContain('We did not check the chart against any other chart.');
  });
});

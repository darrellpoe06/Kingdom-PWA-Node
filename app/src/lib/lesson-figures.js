// =============================================================================
// lesson-figures — the pictures a lesson talks about, as data (DR-1280)
// =============================================================================
// The family, 2026-10-29, with two phone screenshots of L270: "We need to see
// images in the lessons if we need a diagram or workflows timelines etc..."
// L270 asks "what changed when you saw the chart?" and showed no chart. Before
// this file no lesson could carry a picture at all: a `figure` field anywhere
// in lesson code meant a number or a person, never an image.
//
// A FIGURE IS DATA FIRST. Four kinds, and the first three render in-app from
// the data below, so every date, label and reference stays checkable in the
// repo and themes, Big Print and screen readers all work on real text:
//
//   span-chart  rows on a time scale, each with its own dated span (a writing
//               order, a reign list). A row with no date keeps no bar.
//   sequence    steps in order with an arrow between each: a workflow, a
//               "wiring", or an undated/dated run of events.
//   quadrant    two axes, four cells.
//   image       a file served from the app's own public folder (/lesson-
//               figures/...), with alt text, a caption and its source named.
//               For illustrations only (a Canva export, a drawing), committed
//               into the repo so nothing depends on a third-party cloud when
//               the lesson is read.
//
// THE PEOPLE IN A LESSON PICTURE (DR-1281, Darrell 2026-10-29, a requirement,
// not a question): "We want people of color actually African Americans as the
// main character in these lessons and as the biblical Israelites so the
// community can see their ancestors in the Word from His Perspectives." And:
// "Character is most important and the Word explains it." So an image figure
// must say whether it shows people, and when it does, they are drawn as
// African American (`peopleShown`). The gate refuses an image that is silent
// on it, so a stock picture cannot slip in unexamined.
//
// Every figure names its `source`. A figure built from a lesson's own words
// says so; a figure built from an outside record says which, and carries the
// lesson's own disclosure about it word for word (DR-0076 §8). Nothing here is
// invented: the gate (lesson-figures.test.js) pins each figure to the lesson
// text or repo data it was drawn from.
//
// A lesson may carry `figures` itself; the registry below is for lessons whose
// figure is built from data that lives in its own module (L270's chart), so the
// 27,000-line course file does not grow an import for every chart.
// =============================================================================

import { PROGRESS_OF_REVELATION, PROGRESS_OF_REVELATION_SOURCE, chartDateOf, chartAuthorOf } from './progress-of-revelation.js';

export const FIGURE_KINDS = ['span-chart', 'sequence', 'quadrant', 'image'];

/** Where an image figure's file must live: the app's own public folder. */
export const FIGURE_IMAGE_ROOT = '/lesson-figures/';

/** How the people in a lesson picture are drawn (DR-1281). */
export const LESSON_PEOPLE_SHOWN = 'African American';

const L270 = 'll270-the-progress-of-revelation-the-word-came-in-order-and-stands-forever';
const L15 = 'll15-seasoned-with-salt';
const L47 = 'll47-navigating-the-age-faith-critical-thinking-identity';
const L131 = 'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them';
const L140 = 'll140-the-people-of-judah-and-the-people-of-the-way-who-they-are-where-they-are-and-whom-to-listen-to';

function writingOrderRows(testament) {
  return PROGRESS_OF_REVELATION.filter((r) => r.testament === testament).map((r) => ({
    n: r.order,
    label: r.book,
    from: r.from,
    to: r.to,
    era: r.era,
    dateText: chartDateOf(r.book),
    detail: chartAuthorOf(r.book),
  }));
}

export const LESSON_FIGURES = {
  [L270]: [
    {
      id: 'progress-of-revelation',
      kind: 'span-chart',
      title: 'The Progress of Revelation — the sixty-six books in the order they were written',
      caption: 'Each line is one book, in the chart’s writing order, with its approximate date and its author as the chart prints them. The bar shows where the date falls. Job has no bar because the chart gives it no date. Where the chart writes Unknown or Anonymous, or puts a (?) after a name, so does this one.',
      source: PROGRESS_OF_REVELATION_SOURCE,
      disclosure: 'We did not check the chart against any other chart.',
      groups: [
        { id: 'ot', label: 'Old Testament — 39 books', era: 'BC', rows: writingOrderRows('OT') },
        { id: 'nt', label: 'New Testament — 27 books', era: 'AD', rows: writingOrderRows('NT') },
      ],
    },
  ],
  [L140]: [
    {
      id: 'judah-timeline-the-word-carries',
      kind: 'sequence',
      title: 'The timeline the Word carries — Judah, from the split to Rome',
      caption: 'The events are the Word’s; the years are the ones this lesson states as settled history. The Word records no year for the King’s birth in this lesson, so none is printed.',
      source: 'This lesson’s own text, part ONE.',
      steps: [
        { date: 'About 931 BC', label: 'The kingdom splits after Solomon', detail: 'Only the tribe of Judah follows the house of David.', refs: '1 Kings 12:20' },
        { date: '722 BC', label: 'Assyria takes the northern kingdom', detail: 'None left but the tribe of Judah only.', refs: '2 Kings 17:6; 2 Kings 17:18' },
        { date: '586 BC', label: 'Babylon takes Judah', detail: 'Judah carried away out of their land.', refs: '2 Kings 25:21' },
        { date: '538 BC', label: 'Yahweh brings Judah back under Cyrus', detail: 'From that return the people are called by Judah’s name: Jews.', refs: 'Ezra 1:1; Ezra 1:5; Esther 8:17' },
        { date: '', label: 'The King comes out of Judah', detail: 'Salvation is of the Jews.', refs: 'John 4:22' },
        { date: 'AD 70', label: 'Rome’s siege, foretold by Jesus', detail: 'Jerusalem compassed with armies; not one stone upon another.', refs: 'Luke 21:6; Luke 21:20; Luke 21:24' },
      ],
    },
  ],
  [L47]: [
    {
      id: 'the-map-in-five-movements',
      kind: 'sequence',
      title: 'The map in five movements',
      caption: 'The lesson’s own map for navigating the age, one movement after another.',
      source: 'This lesson’s own text (the facilitator’s map in five movements).',
      steps: [
        { label: 'MADE', detail: 'Identity received.', refs: 'Genesis 1:27; Psalms 139:14' },
        { label: 'THINK', detail: 'Own the why.', refs: '1 Peter 3:15; Proverbs 27:17' },
        { label: 'TESTED, not tempted', detail: 'The “rigged” outcome.', refs: 'James 1:13-14; Romans 8:28; 1 Corinthians 10:13' },
        { label: 'BEYOND', detail: 'Yahweh outside our dimension, seen in the Son.', refs: 'Colossians 1:16-17; John 14:9' },
        { label: 'SENT', detail: 'Strengthen the brethren.', refs: 'Luke 22:32' },
      ],
    },
  ],
  [L131]: [
    {
      id: 'the-wiring-diagram',
      kind: 'sequence',
      title: 'The wiring diagram, in one verse',
      caption: 'Three boxes, two wires. Strength is attached to joy, and joy is attached to the LORD. The day is not on the diagram.',
      source: 'This lesson’s own text (Nehemiah 8:10, and the facilitator’s whiteboard drawing).',
      steps: [
        { label: 'The LORD', detail: 'Joy is attached here, not to the day.' },
        { label: 'Joy', detail: 'The joy of the LORD.', refs: 'Nehemiah 8:10' },
        { label: 'Strength', detail: 'Strength is attached to joy.' },
      ],
      note: 'Not on the diagram: the day.',
    },
  ],
  [L15]: [
    {
      id: 'conversational-compass',
      kind: 'quadrant',
      title: 'The Conversational Compass — Ecclesiastes 3 drawn as a diagram',
      caption: 'Every conversation plotted on two axes. We live in all four; most frustration is a quadrant mismatch. Name which time this is.',
      source: 'This lesson’s own text (the Conversational Compass).',
      axes: {
        x: { label: 'Information', low: 'low information', high: 'high information' },
        y: { label: 'Relationship', low: 'low relationship', high: 'high relationship' },
      },
      cells: [
        { x: 'low', y: 'high', label: 'Savoring', detail: 'Being together is the point.', refs: 'Ecclesiastes 3:4; Acts 2:46' },
        { x: 'high', y: 'high', label: 'Connection', detail: 'The deep exchange that builds a bond.', refs: 'Proverbs 27:17' },
        { x: 'low', y: 'low', label: 'Protection', detail: 'The boundary quadrant.', refs: 'Proverbs 13:3; Matthew 7:6; Nehemiah 6:3' },
        { x: 'high', y: 'low', label: 'Task / Persuasion', detail: 'The decision to be made, the matter to be reasoned.', refs: 'Isaiah 1:18' },
      ],
    },
  ],
};

/** Every figure a lesson shows: its own `figures`, then the registry's. */
export function figuresFor(module) {
  if (!module) return [];
  const own = Array.isArray(module.figures) ? module.figures : [];
  const registered = LESSON_FIGURES[module.id] || [];
  return [...own, ...registered].filter((f) => figureProblems(f).length === 0);
}

/** What is wrong with a figure, as plain sentences; empty when it can render. */
export function figureProblems(f) {
  const out = [];
  if (!f || typeof f !== 'object') return ['not an object'];
  if (!FIGURE_KINDS.includes(f.kind)) out.push(`unknown kind ${f.kind}`);
  if (!f.title) out.push('no title');
  if (!f.source) out.push('no source named');
  if (f.kind === 'span-chart') {
    if (!Array.isArray(f.groups) || !f.groups.length) out.push('span-chart without groups');
    for (const g of f.groups || []) {
      if (g.era !== 'BC' && g.era !== 'AD') out.push(`group ${g.id} era must be BC or AD`);
      for (const r of g.rows || []) {
        if (!r.label) out.push(`group ${g.id} has a row without a label`);
        if (r.from != null && (r.to == null || (g.era === 'BC' ? r.to > r.from : r.to < r.from))) out.push(`${r.label}: span runs backwards`);
      }
    }
  }
  if (f.kind === 'sequence' && (!Array.isArray(f.steps) || f.steps.length < 2)) out.push('sequence needs two or more steps');
  if (f.kind === 'quadrant') {
    if (!f.axes?.x?.label || !f.axes?.y?.label) out.push('quadrant without both axes');
    const cells = f.cells || [];
    const seen = new Set(cells.map((c) => `${c.x}/${c.y}`));
    if (cells.length !== 4 || seen.size !== 4) out.push('quadrant needs four distinct cells');
  }
  if (f.kind === 'image') {
    if (typeof f.src !== 'string' || !f.src.startsWith(FIGURE_IMAGE_ROOT)) out.push(`image src must live under ${FIGURE_IMAGE_ROOT}`);
    if (!f.alt) out.push('image without alt text');
    if (typeof f.depictsPeople !== 'boolean') out.push('image must say whether it shows people (depictsPeople)');
    if (f.depictsPeople === true && f.peopleShown !== LESSON_PEOPLE_SHOWN) out.push(`the people in a lesson picture are drawn as ${LESSON_PEOPLE_SHOWN} (DR-1281)`);
  }
  return out;
}

/**
 * Where a year falls on a group's scale, 0..1, left to right in time order.
 * BC years run down toward the birth of Christ, AD years run up from it.
 */
export function spanScale(group) {
  const dated = (group.rows || []).filter((r) => r.from != null);
  if (!dated.length) return null;
  const bc = group.era === 'BC';
  const years = dated.flatMap((r) => [r.from, r.to]);
  const start = bc ? Math.max(...years) : Math.min(...years);
  const end = bc ? Math.min(...years) : Math.max(...years);
  const width = Math.abs(end - start) || 1;
  const at = (y) => (bc ? (start - y) : (y - start)) / width;
  return { start, end, at };
}

/** Round, evenly spaced labels for a scale: about four of them. */
export function spanTicks(scale, era) {
  if (!scale) return [];
  const span = Math.abs(scale.end - scale.start);
  const step = [10, 20, 25, 50, 100, 200, 250, 500].find((s) => span / s <= 6) || 500;
  const ticks = [];
  const lo = Math.min(scale.start, scale.end);
  const hi = Math.max(scale.start, scale.end);
  for (let y = Math.ceil(lo / step) * step; y <= hi; y += step) ticks.push(y);
  return ticks.map((y) => ({ year: y, at: scale.at(y), label: era === 'AD' ? `AD ${y}` : `${y} BC` }))
    .sort((a, b) => a.at - b.at);
}

/** A figure as plain text — the share text, and the alternative for anything drawn. */
export function figureAsText(f) {
  const lines = [f.title];
  if (f.kind === 'span-chart') {
    for (const g of f.groups) {
      lines.push(g.label);
      for (const r of g.rows) lines.push(`${r.n ? `${r.n}. ` : ''}${r.label} — ${r.dateText || 'no date'}${r.detail ? ` — ${r.detail}` : ''}`);
    }
  } else if (f.kind === 'sequence') {
    f.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.date ? `${s.date}: ` : ''}${s.label}${s.detail ? ` — ${s.detail}` : ''}${s.refs ? ` (${s.refs})` : ''}`));
    if (f.note) lines.push(f.note);
  } else if (f.kind === 'quadrant') {
    for (const c of f.cells) lines.push(`${c.label} (${c.x === 'high' ? f.axes.x.high : f.axes.x.low}, ${c.y === 'high' ? f.axes.y.high : f.axes.y.low}) — ${c.detail}${c.refs ? ` (${c.refs})` : ''}`);
  } else if (f.kind === 'image') {
    lines.push(f.alt);
  }
  if (f.caption) lines.push(f.caption);
  lines.push(`Source: ${f.source}`);
  if (f.disclosure) lines.push(f.disclosure);
  return lines.join('\n');
}

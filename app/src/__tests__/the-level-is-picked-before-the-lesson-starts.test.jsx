// @vitest-environment jsdom
// THE LEVEL IS PICKED BEFORE THE LESSON STARTS, ON EVERY PATH IN (DR-0717).
// =============================================================================
// Darrell 2026-10-01, on the live site, in L202 ("Prepared Before the
// Position", Living Lessons) reached from Learn -> Latest lessons, with the
// READ ALOUD panel open: "Didn't get the options to choose the lesson
// level?!!! Why not?" And, placing it: "In the reader.... at the beginning
// before the lesson starts".
//
// ROOT CAUSE (measured on origin/main by this file): a lesson opened by its
// title (Latest lessons, the course's lesson index, a shared link, Continue)
// lands in the one-lesson space with its guide CLOSED. The reader's target in
// that state is the lesson's DOOR (DR-0702), and the door carried no level /
// levels / setLevel, so the panel's "Who is learning?" row never rendered; the
// in-lesson row lived only under the open guide's stage headers, so nothing
// above the lesson's first words offered the level either.
//
// Proven-to-catch: on origin/main without the fix, every "row exists"
// assertion below fails (no [data-testid="lesson-level-first"], and no
// [data-testid="reader-level-control"] for the door).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
    segmentIndex: 0, setBoundaryHandler: () => {}, deviceRead: true, cloudProgress: 0,
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

// Counted here, from the data, so this file needs nothing new from the code
// it judges: the authored age levels plus the top-level (adult) lesson.
const lessonVersionCount = (m) => Object.values((m && m.levels) || {}).filter((v) => typeof v === 'string' && v.trim()).length
  + (m && typeof m.lesson === 'string' && m.lesson.trim() ? 1 : 0);
const extraCourses = buildCatalogCourseDescriptors();
const LL = extraCourses.find((c) => (c.key || c.meta?.key) === 'living-lessons');
const L202 = LL.schedule.find((m) => /^ll202-/.test(m.id));
// A lesson in ANOTHER course with more than one written version.
const OTHER = extraCourses
  .filter((c) => (c.key || c.meta?.key) !== 'living-lessons')
  .map((c) => ({ key: c.key || c.meta.key, m: c.schedule.find((x) => lessonVersionCount(x) > 1) }))
  .find((x) => x.m);

let host; let root; let bands;
beforeEach(() => {
  window.localStorage.clear();
  host = document.createElement('main'); document.body.appendChild(host); root = createRoot(host);
  bands = [];
});
afterEach(() => {
  act(() => root.unmount()); host.remove();
  const t = getReadTarget(); if (t) clearReadTarget(t.owner);
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

// The real host keeps the band in remembered state; this does the same, so a
// pick really re-renders the lesson in the new words.
function Host() {
  const [ageBand, setAgeBand] = useState('adult');
  const set = (id) => { bands.push(id); setAgeBand(id); };
  return createElement('div', null,
    createElement(ChurchLearn, {
      extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
      learnLevel: 'auto', setLearnLevel: () => {}, ageBand, setAgeBand: set,
    }),
    createElement(TTSControl, {}));
}
const mount = () => act(() => { root.render(createElement(Host)); });
const choose = (sel, value) => act(() => {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
const button = (text) => [...host.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
const CSS_ID = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

// Both rows, where the reader first meets the lesson.
function assertLevelFirst(m) {
  const lessonId = m.id;
  const card = document.getElementById(`learn-lesson-${lessonId}`);
  expect(card).toBeTruthy();
  // A shared link opens the lesson with its guide already open (the Resume
  // path); every other path opens it by title, guide closed.
  const guide = card.querySelector(`#tutor-panel-${CSS_ID(lessonId)}`);
  const top = guide
    ? guide.querySelector('[data-testid="lesson-level-control"]')
    : card.querySelector('[data-testid="lesson-level-first"]');
  expect(top).not.toBeNull();
  // Never two rows on one screen.
  expect(card.querySelectorAll('[data-testid="lesson-level-control"]').length).toBe(1);
  const radios = [...top.querySelectorAll('[role="radio"]')].map((r) => r.textContent);
  expect(radios.some((t) => t.startsWith('Child'))).toBe(true);
  expect(radios.some((t) => t.startsWith('Senior'))).toBe(true);
  // Before the lesson starts: above the first paragraph of the lesson's words.
  // The lesson's own words: a paragraph drawn from one of its written
  // versions or its big idea (a stage's one-line instruction is chrome).
  const sources = [m.lesson, m.bigIdea, ...Object.values(m.levels || {})].filter(Boolean).map((t) => t.replace(/\s+/g, ' '));
  const isLessonWords = (p) => {
    const t = (p.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 40 && sources.some((src) => src.includes(t.slice(0, 40)));
  };
  const firstPara = [...(guide || card).querySelectorAll('p')].find((p) => !top.contains(p) && isLessonWords(p));
  expect(firstPara).toBeTruthy();
  expect(before(top, firstPara)).toBe(true);
  if (!guide) {
    // ...and above Start, so the level is picked and THEN the lesson starts.
    const start = [...card.querySelectorAll('button')].find((b) => /Start this|Continue this/.test(b.textContent));
    expect(before(top, start)).toBe(true);
  }

  // The READ ALOUD panel: the same choice, near the top.
  act(() => { host.querySelector('button[aria-label*="read-aloud controls"]').click(); });
  const panelRow = host.querySelector('[data-testid="reader-level-control"]');
  expect(panelRow).not.toBeNull();
  const awake = host.querySelector('[data-testid="screen-awake-row"]');
  const readBtn = host.querySelector('[data-testid="reader-read-target"]');
  expect(readBtn).not.toBeNull();
  const textSize = host.querySelector('[data-testid="reader-text-size"]');
  expect(before(panelRow, awake)).toBe(true);
  expect(before(panelRow, readBtn)).toBe(true);
  if (textSize) expect(before(panelRow, textSize)).toBe(true);
  return { top, panelRow };
}

describe('every path into a lesson with more than one version offers the level first', () => {
  it('the data: L202 carries four age versions plus the adult lesson', () => {
    expect(L202).toBeTruthy();
    expect(Object.keys(L202.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    expect(lessonVersionCount(L202)).toBe(5);
    expect(OTHER).toBeTruthy();
  });

  it('Latest lessons -> L202 (Darrell\'s exact path): the lesson and the reader both show "Who is learning?"', () => {
    mount();
    choose(host.querySelector('#learn-course-sort'), 'latest');
    const row = host.querySelector(`[data-testid="learn-latest-lessons"] li[data-lesson-id="${L202.id}"]`);
    expect(row).toBeTruthy();
    act(() => { row.querySelector('button').click(); });
    assertLevelFirst(L202);
  });

  it('a course\'s own lesson index -> a lesson in another course', () => {
    mount();
    choose(host.querySelector('#learn-course-pick'), OTHER.key);
    const idx = host.querySelector('[data-testid="course-lessons-first"]');
    expect(idx).toBeTruthy();
    const open = [...idx.querySelectorAll('button')].find((b) => (b.textContent || '').includes(OTHER.m.title));
    expect(open).toBeTruthy();
    act(() => { open.click(); });
    assertLevelFirst(OTHER.m);
  });

  it('a shared link straight to L202', () => {
    window.history.replaceState(null, '', `/?view=church&sub=learn&course=living-lessons&lesson=${encodeURIComponent(L202.id)}`);
    mount();
    assertLevelFirst(L202);
  });
});

describe('a pick changes the words, is remembered, and the reading starts in that version', () => {
  // A phrase that is in the child version and in no other version of L202.
  const childOnly = (() => {
    const others = [L202.lesson, L202.levels.youth, L202.levels.teen, L202.levels.senior];
    const sentences = L202.levels.child.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
    return sentences.find((s) => others.every((o) => !o.includes(s)));
  })();

  it('picking Child at the top, then Start, opens the guide in the child words', () => {
    expect(childOnly).toBeTruthy();
    mount();
    choose(host.querySelector('#learn-course-sort'), 'latest');
    act(() => { host.querySelector(`[data-testid="learn-latest-lessons"] li[data-lesson-id="${L202.id}"] button`).click(); });
    const top = host.querySelector('[data-testid="lesson-level-first"]');
    const child = [...top.querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith('Child'));
    act(() => { child.click(); });
    expect(bands).toEqual(['child']);
    // The row reflects the remembered pick.
    const on = host.querySelector('[data-testid="lesson-level-first"] [role="radio"][aria-checked="true"]');
    expect(on.textContent).toMatch(/^Child/);
    // The door hands the reader the same level.
    expect(getReadTarget().level).toBe('child');
    act(() => { button('Start this lesson →').click(); });
    // The guide is open now: the top row steps aside (never shown twice) and
    // the full reading is the child version.
    expect(host.querySelector('[data-testid="lesson-level-first"]')).toBeNull();
    expect(host.querySelectorAll('[data-testid="lesson-level-control"]').length).toBeGreaterThan(0);
    expect(getReadTarget().text).toContain(childOnly.slice(0, 60));
  });

  it('picking Child at the top changes the card\'s FIRST WORDS to the child opening, before Start (DR-0745)', () => {
    mount();
    choose(host.querySelector('#learn-course-sort'), 'latest');
    act(() => { host.querySelector(`[data-testid="learn-latest-lessons"] li[data-lesson-id="${L202.id}"] button`).click(); });
    // Adult first: the big idea, no band caption.
    const opening = () => host.querySelector('[data-testid="lesson-opening"]');
    expect(opening().getAttribute('data-band')).toBe('big-idea');
    expect(opening().querySelector('p').textContent).toBe(L202.bigIdea);
    expect(host.querySelector('[data-testid="lesson-opening-band"]')).toBeNull();
    const top = host.querySelector('[data-testid="lesson-level-first"]');
    const child = [...top.querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith('Child'));
    act(() => { child.click(); });
    // Now the child's own first words, said as such, with Start still below.
    expect(opening().getAttribute('data-band')).toBe('child');
    const words = opening().querySelector('p').textContent;
    expect(L202.levels.child.startsWith(words)).toBe(true);
    expect(words).not.toBe(L202.bigIdea);
    expect(host.querySelector('[data-testid="lesson-opening-band"]').textContent).toMatch(/Child 6–10/);
    // The level row stays above the opening: pick first, then read.
    expect(before(host.querySelector('[data-testid="lesson-level-first"]'), opening())).toBe(true);
    // Senior next: different words again.
    const senior = [...host.querySelectorAll('[data-testid="lesson-level-first"] [role="radio"]')].find((b) => b.textContent.startsWith('Senior'));
    act(() => { senior.click(); });
    expect(opening().getAttribute('data-band')).toBe('senior');
    expect(L202.levels.senior.startsWith(opening().querySelector('p').textContent)).toBe(true);
    expect(opening().querySelector('p').textContent).not.toBe(words);
  });

  it('a pick in the READ ALOUD panel before reading reaches the same remembered band', () => {
    mount();
    choose(host.querySelector('#learn-course-sort'), 'latest');
    act(() => { host.querySelector(`[data-testid="learn-latest-lessons"] li[data-lesson-id="${L202.id}"] button`).click(); });
    act(() => { host.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const panelRow = host.querySelector('[data-testid="reader-level-control"]');
    const senior = [...panelRow.querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith('Senior'));
    act(() => { senior.click(); });
    expect(bands).toEqual(['senior']);
    const on = host.querySelector('[data-testid="lesson-level-first"] [role="radio"][aria-checked="true"]');
    expect(on.textContent).toMatch(/^Senior/);
  });
});

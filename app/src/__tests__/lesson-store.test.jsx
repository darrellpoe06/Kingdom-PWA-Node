// =============================================================================
// The app reads the NAS copy with the bundle as the floor, and a preview is
// shown only as a preview (DR-0677)
// =============================================================================
// Pinned here:
//   * BUNDLE-FIRST by default; the flag flips per device or per build;
//   * a NAS that is down leaves every lesson exactly as bundled (DR-0107);
//   * in 'bundle' mode a public NAS copy changes nothing; in 'nas' mode it
//     replaces the bundled content in the bundled place;
//   * a preview (what RLS hands only to Darrell and the Governor) is overlaid
//     and marked, and the reader shows "Preview — going public after review"
//     with a link to its pull request;
//   * nothing is awaited before the bundle renders (DR-0652's open-fast path).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  overlayCourses, lessonSourceMode, flattenEmbedded, lessonsFromRows, useCurriculumOverlay,
  SOURCE_KEY, PREVIEW_LABEL,
} from '../lib/lesson-store.js';
import { lessonToRows } from '../lib/curriculum-rows.js';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { rememberCourseKey } from '../lib/learn-organize.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L = (id, title, extra = {}) => ({ id, title, bigIdea: `${title} idea`, inApp: 'do it', anchor: { ref: 'John 11:35' }, levels: { child: 'c', teen: 't' }, week: 1, ...extra });
const course = (key, schedule) => ({ key, meta: { key, title: key }, schedule });

describe('the flag', () => {
  afterEach(() => { try { window.localStorage.removeItem(SOURCE_KEY); } catch { /* none */ } });
  it('is bundle-first unless told otherwise', () => {
    expect(lessonSourceMode({})).toBe('bundle');
    expect(lessonSourceMode({ VITE_LESSON_SOURCE: 'nas' })).toBe('nas');
    window.localStorage.setItem(SOURCE_KEY, 'nas');
    expect(lessonSourceMode({})).toBe('nas');
    window.localStorage.setItem(SOURCE_KEY, 'something-else');
    expect(lessonSourceMode({})).toBe('bundle');
  });
});

describe('the overlay', () => {
  const bundled = [course('living-lessons', [L('ll1-a', 'One'), L('ll2-b', 'Two')]), course('stocks', [L('st1', 'S')])];

  it('with nothing from the NAS, every course is the SAME object (nothing re-renders for nothing)', () => {
    const out = overlayCourses(bundled, { mode: 'nas' });
    out.forEach((c, i) => expect(c).toBe(bundled[i]));
  });

  it('bundle mode ignores a public NAS copy', () => {
    const out = overlayCourses(bundled, { mode: 'bundle', nasCourses: { 'living-lessons': [L('ll1-a', 'One, edited')] } });
    expect(out[0]).toBe(bundled[0]);
  });

  it('nas mode takes the NAS content, in the bundled place, keeping the row\'s schedule fields', () => {
    const out = overlayCourses(bundled, { mode: 'nas', nasCourses: { 'living-lessons': [{ ...L('ll1-a', 'One, edited'), week: undefined }] } });
    expect(out[0].schedule.map((m) => m.title)).toEqual(['One, edited', 'Two']);
    expect(out[0].schedule[0].week).toBeUndefined();
    expect(out[1]).toBe(bundled[1]);
  });

  it('a preview is added at the end of its course, marked, in either mode', () => {
    const pre = { ...L('ll3-new', 'Three'), nasPreview: { prUrl: 'https://github.com/o/r/pull/9' } };
    for (const mode of ['bundle', 'nas']) {
      const out = overlayCourses(bundled, { mode, previews: { 'living-lessons': [pre] } });
      expect(out[0].schedule.map((m) => m.id)).toEqual(['ll1-a', 'll2-b', 'll3-new']);
      expect(out[0].schedule[2].nasPreview.prUrl).toBe('https://github.com/o/r/pull/9');
    }
  });
});

describe('rows from the transport become lessons, previews marked', () => {
  it('flattens PostgREST embedding and marks status = preview', () => {
    const r = lessonToRows('living-lessons', L('ll3-new', 'Three'), 0);
    const row = {
      ...r.lesson, status: 'preview', pr_url: 'https://github.com/o/r/pull/9',
      curriculum_lesson_bands: r.bands, curriculum_lesson_quiz: r.quiz,
      curriculum_lesson_movements: [], curriculum_lesson_provenance: [],
    };
    const got = lessonsFromRows(flattenEmbedded([row]))['living-lessons'][0];
    expect(got.title).toBe('Three');
    expect(got.levels).toEqual({ child: 'c', teen: 't' });
    expect(got.nasPreview).toEqual({ prUrl: 'https://github.com/o/r/pull/9' });
  });
});

// A stand-in for the supabase client: the same chain the store calls.
function fakeClient(result) {
  const q = {
    select() { return q; }, eq() { return q; }, order() { return q; },
    then(res, rej) { return Promise.resolve(typeof result === 'function' ? result() : result).then(res, rej); },
  };
  return { from: () => q };
}

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

function Probe({ courses, client, mode, onRender }) {
  onRender(useCurriculumOverlay(courses, { client, mode }));
  return null;
}
const settle = () => act(async () => { for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0)); });

describe('the hook never blanks the page', () => {
  const bundled = [course('living-lessons', [L('ll1-a', 'One')])];

  it('renders the bundle on the FIRST render, before any network answer', () => {
    const seen = [];
    const never = { from: () => ({ select() { return this; }, eq() { return this; }, order() { return this; }, then() { /* never resolves */ } }) };
    act(() => root.render(createElement(Probe, { courses: bundled, client: never, mode: 'nas', onRender: (c) => seen.push(c) })));
    expect(seen[0][0].schedule.map((m) => m.title)).toEqual(['One']);
  });

  it('PROVEN (DR-0107): a NAS that errors leaves the bundled lessons exactly as they were', async () => {
    const seen = [];
    const down = fakeClient(() => ({ data: null, error: new Error('NAS unreachable') }));
    act(() => root.render(createElement(Probe, { courses: bundled, client: down, mode: 'nas', onRender: (c) => seen.push(c) })));
    await settle();
    expect(seen.at(-1)[0].schedule.map((m) => m.title)).toEqual(['One']);
  });

  it('a preview arriving from the NAS is overlaid once it answers', async () => {
    const r = lessonToRows('living-lessons', L('ll2-new', 'Two, previewed'), 0);
    const row = { ...r.lesson, status: 'preview', pr_url: 'https://github.com/o/r/pull/7', curriculum_lesson_bands: r.bands };
    const seen = [];
    act(() => root.render(createElement(Probe, { courses: bundled, client: fakeClient({ data: [row], error: null }), mode: 'bundle', onRender: (c) => seen.push(c) })));
    await settle();
    const last = seen.at(-1)[0].schedule;
    expect(last.map((m) => m.id)).toEqual(['ll1-a', 'll2-new']);
    expect(last[1].nasPreview.prUrl).toBe('https://github.com/o/r/pull/7');
  });
});

describe('the reader says what a preview is, and where its review is', () => {
  it('shows the badge and the PR link on a preview lesson, and nothing on the rest', async () => {
    const preview = { ...L('ll900-preview-lesson', 'A Previewed Lesson'), lesson: 'Words.', nasPreview: { prUrl: 'https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/1837' } };
    const extra = {
      meta: { key: 'preview-course', title: 'Preview course', tagline: '', audience: '', format: '', unit: { noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true } },
      sessionFlow: [], schedule: [L('ll1-plain', 'A Plain Lesson', { lesson: 'Words.' }), preview],
      cohortStart: null, cohortConfirmed: false, progressSummary: () => ({ done: 0, total: 2 }),
      exportMarkdown: () => '', downloadName: 'x.md', submitInterest: null, roster: null, interestCopy: null, tutorCourseMeta: null,
    };
    rememberCourseKey('preview-course');
    await act(async () => { root.render(createElement(ChurchLearn, { extraCourses: [extra] })); });
    await settle();
    const badges = host.querySelectorAll('[data-lesson-preview]');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toContain(PREVIEW_LABEL);
    expect(badges[0].querySelector('a').getAttribute('href')).toBe('https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/1837');
  });
});

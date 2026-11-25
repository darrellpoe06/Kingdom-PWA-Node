// The four-mode Lesson Experience goes public ONLY for lessons with their own
// completed cover, and it carries the classic lesson space's own features
// (Darrell, 2026-11-25: "Restore the five missing features: Lesson downloads.
// Accurate progress credit based on actual reading or listening. Reading-level
// selection before starting a lesson. Resume functionality. Keep-screen-on
// hint." ... "I authorize the public launch of the 150 lessons that already
// have completed custom artwork").
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LessonExperience from '../components/learn-studio/LessonExperience.jsx';
import { lessonQuery } from '../lib/lesson-links.js';
import { buildSelfPacedDescriptors } from '../lib/learn-catalog.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { getPlaceFor, recordPlace, clearAllPlaces, placeIsFinished } from '../lib/learn-resume.js';
import { segmentText } from '../lib/tts.js';
import { isExperienceLesson, experienceRecord } from '../components/learn-studio/LessonExperienceDoor.jsx';
import RECORDS from '../lib/learn-presentation/presentation-records.json';
import REAL_LESSON from '../lib/living-lessons/ll338-not-with-eyeservice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const inventory = learnInventory();
const all = inventory.flatMap((c) => c.lessons.map((l) => ({ course: c, lesson: l })));
const live = all.filter(({ course, lesson }) => isExperienceLesson(lesson, course));
// The launched 150 plus every passing cover the publish lane lands later (own image, no needsReview).
const ownCover = new Set(RECORDS.records.filter((r) => r.image && r.image.src && !(r.needsReview && r.needsReview.length)).map((r) => r.lessonId));
const LL = 'living-lessons';
const ID = REAL_LESSON.id;

describe('which lessons are live in the new look', () => {
  it('exactly the lessons with their own finished cover (the 150 launched, and any passing cover since), every one of them', () => {
    expect(ownCover.size).toBeGreaterThanOrEqual(150);
    expect(live.length).toBe(ownCover.size);
    expect(live.every(({ lesson }) => ownCover.has(lesson.id))).toBe(true);
  });

  it('every live lesson shows its OWN cover, never department art', () => {
    for (const { course, lesson } of live) {
      expect(experienceRecord(lesson, course).image.src, lesson.id).toContain(`learn-thumbs/${course.key}/${lesson.id}/`);
    }
  });

  it('a lesson without its own cover stays in its existing format', () => {
    const waiting = all.filter(({ lesson }) => !ownCover.has(lesson.id));
    expect(waiting.length).toBe(all.length - ownCover.size);
    expect(waiting.some(({ course, lesson }) => isExperienceLesson(lesson, course))).toBe(false);
  });
});

describe('in classic Learn, for everyone: the new look with every lesson feature', () => {
  let container, root;
  const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);
  const saveMatch = window.matchMedia;
  beforeEach(() => {
    window.localStorage.clear();
    clearAllPlaces();
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
    clearAllPlaces();
    setSearch('');
    window.matchMedia = saveMatch;
    vi.restoreAllMocks();
  });
  const mount = (ageBand = 'adult') =>
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          progress: {},
          toggleModule: () => {},
          quizState: {},
          recordQuiz: () => {},
          learnLevel: 'auto',
          setLearnLevel: () => {},
          ageBand,
          setAgeBand: () => {},
          extraCourses: buildSelfPacedDescriptors({}),
          userTier: 'poetech-plus',
        })
      )
    );
  const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent.trim()));
  // The classic lesson page opens unchanged; its header offers the new look.
  const openLive = () => {
    setSearch(lessonQuery({ courseKey: LL, lessonId: ID }));
    mount();
    expect(document.getElementById(`learn-lesson-${ID}`)).toBeTruthy();
    click(container.querySelector('[data-testid="open-lesson-experience"]'));
  };
  const start = () => click(button(/^Start this lesson$/));
  const tab = (name) => click([...container.querySelectorAll('button[role="tab"]')].find((b) => b.textContent.trim() === name));

  it('LEVEL FIRST: the reading level is picked before the lesson starts, with the classic level control', () => {
    openLive();
    const first = container.querySelector('[data-testid="lesson-experience-start"]');
    expect(first).toBeTruthy();
    expect(first.querySelector('[data-testid="lesson-level-first"]')).toBeTruthy();
    expect(first.querySelector('[data-testid="lesson-level-control"]')).toBeTruthy();
    expect(container.querySelector('.le-modes')).toBeNull();
    start();
    expect(container.querySelector('.le-modes')).toBeTruthy();
    expect(container.textContent).not.toContain('PROTOTYPE');
  });

  it('DOWNLOADS: Study carries the classic download and copy doors, closed by the switch until Darrell opens it', () => {
    openLive();
    start();
    tab('Study');
    const box = container.querySelector('[data-testid="lesson-experience-downloads"]');
    expect(box).toBeTruthy();
    expect(box.textContent).toMatch(/Copy lesson/);
    expect(box.textContent).toMatch(/Download/);
    // DR-1655: downloads ship closed; the classic gate says so and offers a copy request.
    expect(box.querySelector('[data-testid="downloads-closed"]')).toBeTruthy();
  });

  it('PROGRESS ON EVIDENCE: reading to the end over real time credits the read with its version; a flick credits nothing', () => {
    openLive();
    start();
    tab('Read');
    const ps = () => [...container.querySelectorAll('.le-book-p')];
    const scrollTo = (k) => {
      ps().forEach((p, i) => {
        p.getBoundingClientRect = () => ({ top: (i - k) * 300, bottom: (i - k) * 300 + 290 });
      });
      act(() => window.dispatchEvent(new Event('scroll')));
    };
    const saveRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    try {
      // A flick to the end, at once: paced to almost nothing, not read.
      scrollTo(ps().length - 1);
      const flick = getPlaceFor(LL, ID);
      expect(flick && flick.seen).toBeLessThan(0.1);
      expect(placeIsFinished(flick)).toBe(false);
      // Real reading time later, the end of the article: credited, with the version.
      const t0 = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(t0 + 30 * 60 * 1000);
      scrollTo(ps().length - 2);
      scrollTo(ps().length - 1);
      const p = getPlaceFor(LL, ID);
      expect(p.seen).toBeGreaterThanOrEqual(0.9);
      expect(p.version).toBe('adult');
      expect(placeIsFinished(p)).toBe(true);
    } finally {
      window.requestAnimationFrame = saveRaf;
    }
  });

  it('RESUME: a lesson read part way offers "Pick up where you left off" and lands in the article there', () => {
    recordPlace({ courseKey: LL, lessonId: ID, seen: 0.5, version: 'adult' });
    openLive();
    start();
    const banner = container.querySelector('[data-testid="lesson-experience-resume"]');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toMatch(/Pick up where you left off/);
    click(banner.querySelector('button'));
    expect(container.querySelector('.le-book-text')).toBeTruthy();
    expect(container.querySelector('[data-testid="lesson-experience-resume"]')).toBeNull();
  });

  it('KEEP THE SCREEN ON: a touch device without a wake lock sees the classic hint', () => {
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: undefined });
    window.matchMedia = vi.fn((q) => ({
      matches: /pointer: coarse/.test(q),
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    openLive();
    const hint = container.querySelector('[data-testid="screen-timeout-hint"]');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toMatch(/Screen timeout/);
    expect(hint.className).toContain('ts-chrome-region');
  });

  it('the full classic page is one tap away, and a lesson still waiting for its cover has no new-look button', () => {
    openLive();
    start();
    tab('Read');
    click(button(/open the full lesson page/));
    expect(container.querySelector('.le-root')).toBeNull();
    expect(document.getElementById(`learn-lesson-${ID}`)).toBeTruthy();
    act(() => root.unmount());
    root = createRoot(container);
    const c = inventory.find((x) => x.key === LL);
    const waiting = c.lessons.find((l) => !ownCover.has(l.id));
    setSearch(lessonQuery({ courseKey: LL, lessonId: waiting.id }));
    mount();
    expect(container.querySelector('.le-root')).toBeNull();
    expect(document.getElementById(`learn-lesson-${waiting.id}`)).toBeTruthy();
    expect(container.querySelector('[data-testid="open-lesson-experience"]')).toBeNull();
  });
});

describe('heard is credited from the voice itself', () => {
  it('each sentence reached is reported as heard, and the end as the whole', () => {
    const heard = [];
    const tools = { place: () => null, onSeen() {}, onHeard: (f, v) => heard.push([f, v]), onLevel() {}, levelFirst: null, downloads: null, screenHint: null };
    let opts;
    const createNarrator = (o) => {
      opts = o;
      return { onBoundary() {}, load() {}, play() {}, pause() {}, resume() {}, stop() {}, setRate() {} };
    };
    const el = document.createElement('div');
    document.body.appendChild(el);
    const r = createRoot(el);
    act(() =>
      r.render(
        <LessonExperience lesson={REAL_LESSON} record={null} onExit={() => {}} initialMode="listen" createNarrator={createNarrator} lessonTools={tools} />
      )
    );
    const n = segmentText(REAL_LESSON.lesson).length;
    act(() => opts.onState({ status: 'playing', segmentIndex: 0 }));
    act(() => opts.onState({ status: 'playing', segmentIndex: n - 1 }));
    act(() => opts.onState({ status: 'idle', segmentIndex: 0 }));
    expect(heard[0][0]).toBeCloseTo(1 / n);
    expect(heard.at(-1)).toEqual([1, 'adult']);
    act(() => r.unmount());
    el.remove();
  });
});

// DR-1662: every classic Learn function lives in the new look, vibrant, with
// the smallest thumbnails and their titles, and Sort · Show · View on each list.
// Darrell 2026-11-26: "We need all these functions to be in the new view
// without loosing the functions" / "Don't want to loose any functional tools".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import LearnDashboard, { LEARN_TOOLS } from '../components/learn-studio/LearnDashboard.jsx';
import { libraryStanding, lowHangingFruit } from '../lib/learn-organize.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const LIVING = COURSES.find((c) => c.key === 'living-lessons');
// A real record: the first three Living Lessons read, the fourth begun.
const PROGRESS = Object.fromEntries(LIVING.schedule.slice(0, 3).map((m) => [m.id, true]));
const PLACES = [{ courseKey: 'living-lessons', lessonId: LIVING.schedule[3].id, stage: 1, step: 0, at: 1 }];
const CTX = { places: PLACES, progress: PROGRESS };
const SRC = (f) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', f), 'utf8');

let container, root;
beforeEach(() => {
  window.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} };
  window.SpeechSynthesisUtterance = class {};
  try {
    window.localStorage.clear();
  } catch {
    /* no storage */
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const pick = (sel, v) =>
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, v);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
const $ = (id) => container.querySelector(`[data-testid="${id}"]`);
const pressed = (group, label) => [...$(group).querySelectorAll('button')].find((b) => b.textContent === label);

describe('Your Learning: the same numbers the classic page reads', () => {
  it('not started / begun / finished / lessons read come from libraryStanding over the same record', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    const all = libraryStanding(COURSES, CTX);
    const text = $('ls-standing').textContent;
    expect(text).toContain(`${all.notStarted}not started`);
    expect(text).toContain(`${all.inProgress}begun`);
    expect(text).toContain(`${all.lessonsRead}of ${all.lessons} lessons read`);
    expect($('ls-standing').querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe(String(all.pct));
  });

  it('Closest to finished and Not started, and short are the classic picks, each one tap into its course', () => {
    const onOpenCourse = vi.fn();
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={onOpenCourse} />));
    const fruit = lowHangingFruit(COURSES, CTX);
    expect($('ls-fruit').textContent).toContain('Closest to finished');
    expect($('ls-fruit').textContent).toContain('Not started, and short');
    click($('ls-fruit').querySelector(`[data-testid="ls-course-${fruit.nearest.course.key}"]`));
    expect(onOpenCourse).toHaveBeenCalledWith(fruit.nearest.course.key);
  });

  it('every classic area is a tool here: Continue, Latest, Browse, Find, Record, Downloads', () => {
    const onTool = vi.fn();
    act(() =>
      root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} onTool={onTool} continueCount={19} recordCount={153} />)
    );
    expect(LEARN_TOOLS).toEqual(['continue', 'latest', 'browse', 'find', 'record', 'downloads']);
    expect($('ls-tool-continue').textContent).toBe('Continue · 19');
    expect($('ls-tool-record').textContent).toBe('Record · 153');
    for (const id of LEARN_TOOLS) click($(`ls-tool-${id}`));
    expect(onTool.mock.calls.map((c) => c[0])).toEqual(LEARN_TOOLS);
  });
});

describe('Courses: compact thumbnail rows with Sort · Show · View', () => {
  it('lists the first twelve, then every course; departments narrow the list', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBe(Math.min(12, COURSES.length));
    click($('ls-courses-all'));
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBe(COURSES.length);
    const deptBtn = [...$('ls-courses').querySelectorAll('[data-testid^="ls-dept-"]')].find((b) => b.getAttribute('data-testid') !== 'ls-dept-all');
    click(deptBtn);
    expect(deptBtn.getAttribute('aria-pressed')).toBe('true');
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBeLessThan(COURSES.length);
  });

  it('Show: Begun keeps only begun courses; Finished with none says so (never blank)', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    click(pressed('ls-course-show', 'Begun'));
    const rows = [...$('ls-courses').querySelectorAll('button.ls-mini')];
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual(['ls-course-living-lessons']);
    click(pressed('ls-course-show', 'Finished'));
    expect($('ls-courses-none')).toBeTruthy();
  });

  it('Sort A to Z orders by title; courses open as a picture shelf and List is one tap, remembered', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    expect($('ls-courses').querySelector('.ls-mini-list--pictures.ls-mini-list--shelf')).toBeTruthy(); // condensed by default
    pick($('ls-course-sort'), 'title');
    click($('ls-courses-all'));
    const titles = [...$('ls-courses').querySelectorAll('.ls-mini-title')].map((n) => n.textContent);
    expect(titles.length).toBe(COURSES.length);
    click(pressed('ls-course-view', 'List'));
    expect($('ls-courses').querySelector('.ls-mini-list--list')).toBeTruthy();
    expect(window.localStorage.getItem('ls-view:course-view')).toBe('list');
  });
});

describe('the first view is condensed: pictures and titles first (Darrell 2026-11-26)', () => {
  it('the home lessons open as full-image cards with their titles; List is one tap', () => {
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice ctx={CTX} />));
    const pics = $('inorder-pictures');
    expect(pics).toBeTruthy();
    const cards = pics.querySelectorAll('button.ls-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].querySelector('.ls-card-title').textContent.length).toBeGreaterThan(0);
    expect(container.querySelector('.ls-inorder-row')).toBeNull();
    click(pressed('inorder-view', 'List'));
    expect(container.querySelectorAll('.ls-inorder-row').length).toBeGreaterThan(0);
  });
});

describe('Lessons: thumbnails, read marks, ages, Show and View', () => {
  it('a read lesson carries its classic read mark; age chips open that age; Show: Read narrows', () => {
    const markFor = (lesson) => (PROGRESS[lesson.id] ? '✓ READ ×3 · Adult' : '');
    act(() =>
      root.render(
        <LearnStudioPreview
          courses={COURSES}
          onOpenLesson={vi.fn()}
          onExit={vi.fn()}
          ownerDevice
          initialCourseKey="living-lessons"
          ctx={CTX}
          done={new Set(Object.keys(PROGRESS))}
          markFor={markFor}
        />
      )
    );
    // The course page opens on Pictures (CourseLessonsView); List is the compact-thumbnail list.
    click($('course-view-list'));
    const first = $(`inorder-${LIVING.schedule[0].id}`);
    expect(first.textContent).toContain('✓ READ ×3 · Adult');
    expect(first.querySelector('.ls-mini-thumb')).toBeTruthy();
    click(pressed('inorder-show', 'Read'));
    expect(container.querySelectorAll('button.ls-inorder-row').length).toBe(3);
    // Every Living Lesson carries a Child version (DR-1657): its chip opens the lesson in the Experience.
    const chip = $(`inorder-age-${LIVING.schedule[0].id}-child`);
    expect(chip).toBeTruthy();
    click(chip);
    expect(container.querySelector('.ls-inorder-list')).toBeNull();
  });
});

describe('the classic tools render inside the new look, and their lessons open there', () => {
  it('the tools node is on the home and on a course page; nothing is replaced', () => {
    const tools = <div data-testid="learn-areas">classic tools</div>;
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice tools={tools} ctx={CTX} />));
    expect($('ls-full-tools')).toBeTruthy();
    expect($('ls-full-tools').open).toBe(false); // condensed by default; one tap opens it
    expect($('ls-full-tools').querySelector('[data-testid="learn-areas"]')).toBeTruthy();
    expect($('learn-dashboard')).toBeTruthy();
    click($(`ls-course-${COURSES[0].key}`));
    expect($('ls-full-tools').querySelector('[data-testid="learn-areas"]')).toBeTruthy();
  });

  it('a lesson chosen in the classic tools opens the Experience through the registered opener', () => {
    let opener = null;
    act(() =>
      root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice registerOpener={(fn) => (opener = fn)} ctx={CTX} />)
    );
    expect(typeof opener).toBe('function');
    let took;
    act(() => {
      took = opener('living-lessons', LIVING.schedule[0].id, { mode: 'read' });
    });
    expect(took).toBe(true);
    expect($('learn-dashboard')).toBeNull(); // the Experience replaced the home
    expect(opener('no-such-course', 'nope', {})).toBe(false); // unknown: the classic path runs
  });

  it('off the owner device the opener declines, so the classic reader opens exactly as before', () => {
    let opener = null;
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} registerOpener={(fn) => (opener = fn)} ctx={CTX} />));
    expect(opener('living-lessons', LIVING.schedule[0].id, { mode: 'read' })).toBe(false);
  });

  it('ChurchLearn hands its whole classic page in as the tools and routes every lesson-open through the opener first', () => {
    const src = SRC('ChurchLearn.jsx');
    expect(src).toMatch(/tools=\{classicLearn\}/);
    for (const fn of ['openLessonFromList', 'playLesson', 'continueAndRead', 'readVersion']) {
      const at = src.indexOf(`const ${fn} = `);
      expect(at, fn).toBeGreaterThan(-1);
      expect(src.slice(at, at + 400), fn).toMatch(/viaStudio\(/);
    }
    // Leaving the new look clears the opener, so the classic view never routes away.
    expect(SRC('learn-studio/LearnStudioPreview.jsx')).toMatch(/return \(\) => registerOpener\(null\)/);
  });
});

// Darrell 2026-11-26, on his phone: "Swiping there pictures of lessons should move it".
describe('the featured picture turns on a swipe', () => {
  const touch = (node, type, x, y) =>
    act(() => {
      const e = new Event(type, { bubbles: true });
      Object.defineProperty(e, type === 'touchend' ? 'changedTouches' : 'touches', { value: [{ clientX: x, clientY: y }] });
      node.dispatchEvent(e);
    });

  it('swipeStep: left is forward, right is back, a short or mostly-vertical move is nothing', async () => {
    const { swipeStep } = await import('../components/learn-studio/LearnStudio.jsx');
    expect(swipeStep(300, 100, 200, 110)).toBe(1);
    expect(swipeStep(200, 100, 300, 105)).toBe(-1);
    expect(swipeStep(200, 100, 220, 100)).toBe(0); // too short
    expect(swipeStep(200, 100, 150, 220)).toBe(0); // a scroll, not a swipe
  });

  it('a left swipe on the hero shows the next slide, a right swipe the one before', () => {
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice ctx={CTX} />));
    const hero = $('ls-hero');
    expect(hero).toBeTruthy();
    const dots = hero.querySelectorAll('.ls-dots button').length;
    expect(dots).toBeGreaterThan(1);
    expect(hero.getAttribute('data-slide')).toBe('0');
    touch(hero, 'touchstart', 300, 200);
    touch(hero, 'touchend', 150, 210);
    expect($('ls-hero').getAttribute('data-slide')).toBe('1');
    touch($('ls-hero'), 'touchstart', 150, 200);
    touch($('ls-hero'), 'touchend', 320, 205);
    expect($('ls-hero').getAttribute('data-slide')).toBe('0');
    touch($('ls-hero'), 'touchstart', 150, 200);
    touch($('ls-hero'), 'touchend', 320, 205);
    expect($('ls-hero').getAttribute('data-slide')).toBe(String(dots - 1)); // wraps to the last
  });
});

// Darrell 2026-11-26, sent the classic page from his phone: "How is this still a view?... we
// should be able to keep the functions and make it look better" (DR-1663).
describe('the new look never hands the reader back to the classic page', () => {
  it('All Courses and a department chip stay in the new look (onExit is never called)', async () => {
    const onExit = vi.fn();
    const tools = <div data-testid="learn-areas">classic tools</div>;
    act(() =>
      root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={onExit} ownerDevice tools={tools} ctx={CTX} onDepartment={() => true} />)
    );
    click($('ls-all-courses'));
    expect(onExit).not.toHaveBeenCalled();
    expect($('ls-courses')).toBeTruthy();
    const dept = container.querySelector('.ls-depts .ls-chip--dept:not([data-testid])');
    click(dept);
    expect(onExit).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5)); // the tools open after React paints
    });
    expect($('ls-full-tools').open).toBe(true); // the department opened the tools on this page
  });

  it('inside the new look the tools leave out the classic controls the new look already gives', () => {
    const src = SRC('ChurchLearn.jsx');
    expect(src).toMatch(/courses\.length > 1 && !lessonFocus && !studio[^\n]*\n\s*<div className="mt-1 mb-4" data-testid="learn-departments">/);
    expect(src).toMatch(/visibleCourses\.length >= 1 && !lessonFocus && !studio && \(/);
  });
});

// Darrell 2026-11-26: "Why don't the new look show on others phones?!" -- it was gated to
// two personas. The shell now turns the new Learn and the new Institute on for every member.
describe('the new look is for every member, not two accounts (DR-1664)', () => {
  it('the shell passes the new-look defaults with no persona condition', () => {
    const shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/<ChurchLearn[\s\S]*?learnStudioDefaultOn \/\*/);
    expect(shell).toMatch(/<ChurchInstitute [^\n]*studioDefaultOn \/\*/);
    expect(shell).not.toMatch(/(learnStudioDefaultOn|studioDefaultOn)=\{\['darrell', 'christina'\]/);
  });
});

// Darrell 2026-11-26: "We need the relationships lessons in one place... my wife says ladies will
// want those most."
describe('Relationships, in one place', () => {
  it('every listed lesson is a real mounted lesson (a removed or renamed one fails the build)', async () => {
    const { RELATIONSHIP_LESSONS, relationshipShelf } = await import('../lib/learn-presentation/presentation.js');
    const ids = new Set(COURSES.flatMap((c) => c.schedule.map((l) => l.id)));
    const missing = RELATIONSHIP_LESSONS.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
    expect(new Set(RELATIONSHIP_LESSONS).size).toBe(RELATIONSHIP_LESSONS.length);
    expect(relationshipShelf(COURSES, new Map()).map((x) => x.lesson.id)).toEqual([...RELATIONSHIP_LESSONS]);
  });

  it('the shelf sits high on the Learn home, before the hero, and See All opens every lesson on it', async () => {
    const { RELATIONSHIP_LESSONS } = await import('../lib/learn-presentation/presentation.js');
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice ctx={CTX} />));
    const shelf = $('ls-relationships');
    expect(shelf).toBeTruthy();
    expect(shelf.textContent).toContain('Relationships');
    const hero = $('ls-hero');
    expect(shelf.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    click([...shelf.querySelectorAll('button')].find((b) => b.textContent.includes('See All')));
    expect(container.querySelectorAll('.ls-grid button.ls-card').length).toBe(RELATIONSHIP_LESSONS.length);
    // A section of its own, in four parts (DR-1675), with every way to view a list: Pictures | List.
    const sections = $('ls-relationship-sections');
    expect(sections.textContent).toMatch(new RegExp(`Relationships · ${RELATIONSHIP_LESSONS.length} lessons`));
    for (const part of ['Marriage & Love', 'Family & Children', 'Friends, Neighbors & the Church', 'Hard Conversations, Offense & Forgiveness']) expect(sections.textContent).toContain(part);
    click([...$('ls-relationship-view').querySelectorAll('button')].find((b) => b.textContent.includes('List')));
    expect(sections.querySelectorAll('button.ls-inorder-row').length).toBe(RELATIONSHIP_LESSONS.length);
    expect(sections.querySelectorAll('button.ls-card').length).toBe(0);
  });

  it('Explore by Topic offers Relationships first, and it opens the section', () => {
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice ctx={CTX} />));
    const tiles = [...container.querySelectorAll('button.ls-topic')];
    expect(tiles[0].textContent).toMatch(/Relationships/);
    click(tiles[0]);
    expect($('ls-relationship-sections')).toBeTruthy();
  });
});

// Darrell 2026-11-26, sending the classic Living Lessons page: "All options?!!!"
describe('the course page has every option the classic page has (DR-1667)', () => {
  const openLiving = () => {
    act(() =>
      root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice initialCourseKey="living-lessons" ctx={CTX} />)
    );
  };
  it("the parts of the course by the Word's divisions are one-tap chips that narrow both looks", async () => {
    const { sectionLessons } = await import('../lib/lesson-sections.js');
    const secs = sectionLessons(LIVING.schedule);
    openLiving();
    const parts = $('course-view-parts');
    expect(parts).toBeTruthy();
    expect(parts.querySelectorAll('button').length).toBe(secs.length + 1);
    const law = secs[0];
    click($(`course-part-${law.key}`));
    expect(container.querySelectorAll('.ls-grid button.ls-card').length).toBe(law.lessons.length);
    click($('course-view-list'));
    expect(container.querySelectorAll('button.ls-inorder-row').length).toBe(law.lessons.length);
  });
  it("every order is offered, the Word's divisions included, and it groups the list under foldable headings", () => {
    openLiving();
    const sel = $('course-view-order');
    expect([...sel.options].map((o) => o.value)).toEqual(['order', 'newest', 'az', 'za', 'divisions']);
    click($('course-view-list'));
    pick(sel, 'divisions');
    const heads = container.querySelectorAll('[data-testid="inorder-group"]');
    expect(heads.length).toBeGreaterThan(1);
    const before = container.querySelectorAll('button.ls-inorder-row').length;
    click(heads[0]);
    expect(container.querySelectorAll('button.ls-inorder-row').length).toBeLessThan(before);
    click($('inorder-fold-all'));
    expect(container.querySelectorAll('button.ls-inorder-row').length).toBe(0);
  });
  it('every row carries ▶ Play, and a lesson opened in the new look shows under Recently opened', () => {
    openLiving();
    click($('course-view-list'));
    const first = LIVING.schedule[0].id;
    expect($(`inorder-play-${first}`)).toBeTruthy();
    click($(`inorder-${first}`)); // opens it in the Lesson Experience, recording the use
    act(() => root.unmount());
    root = createRoot(container);
    openLiving();
    expect($('course-view-recent')).toBeTruthy();
    const recent = $('course-view-recent').querySelectorAll('button');
    expect(recent.length).toBe(1);
    click(recent[0]); // one tap back into that lesson
    expect(container.querySelector('.le-root')).toBeTruthy();
  });
});

// Darrell 2026-11-26, on "Scattered, Never Lost" (ll140): "Big pictures are not coming through."
// 826 of 976 records list w320 and w1920, which are not shipped; a big cover picked w1920 and broke.
describe('every picture offers only the sizes that ship', () => {
  it('the lesson cover lists w640 and w1280 only, and both exist on disk', async () => {
    const { existsSync } = await import('node:fs');
    const id = 'll140-the-people-of-judah-and-the-people-of-the-way-who-they-are-where-they-are-and-whom-to-listen-to';
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice initialLessonId={id} ctx={CTX} />));
    const src = container.querySelector('.ls-cover source[type="image/webp"]');
    expect(src).toBeTruthy();
    const files = src
      .getAttribute('srcset')
      .split(',')
      .map((x) => x.trim().split(' ')[0]);
    expect(files.length).toBe(2);
    for (const f of files) {
      expect(f).toMatch(/\/w(640|1280)\.webp$/);
      expect(existsSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', f.replace(/^.*?learn-thumbs\//, 'learn-thumbs/'))), f).toBe(true);
    }
  });
});

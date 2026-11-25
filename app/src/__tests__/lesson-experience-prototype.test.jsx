// @vitest-environment jsdom
// =============================================================================
// Lesson Experience — PRIVATE PROTOTYPE (Darrell, 2026-11-25): "build ONE
// complete lesson as a private prototype for my approval before expanding
// across all 994 lessons." Pins the two bright lines he set:
//   1. PRIVATE: only the owner device's LearnStudioPreview ever shows the
//      entry button -- no one else's app gets it.
//   2. PRESERVED: the lesson's own words render verbatim in Read mode (no
//      summarizing/rewriting), and Study mode's quiz is the REAL quiz with
//      its REAL explanations, not a rebuilt one.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import LessonExperience, { PROTOTYPE_LESSON_ID } from '../components/learn-studio/LessonExperience.jsx';
import REAL_LESSON from '../lib/living-lessons/ll338-not-with-eyeservice.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

class FakeUtterance {
  constructor(t) {
    this.text = t;
  }
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  window.speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    speak() {},
    cancel() {},
    pause() {},
    resume() {},
    getVoices() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    onvoiceschanged: null,
  };
  window.SpeechSynthesisUtterance = FakeUtterance;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = (el) => act(() => root.render(el));
const click = (node) => act(() => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const byText = (text, tag = 'button') => [...container.querySelectorAll(tag)].filter((n) => n.textContent.trim().includes(text));

const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));

describe('the prototype entry is private to the owner device', () => {
  it('shows nothing extra when ownerDevice is false', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice={false} />);
    expect(container.textContent).not.toContain('Try the new lesson experience');
  });

  it('shows the entry card only when ownerDevice is true', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice />);
    expect(container.textContent).toContain('Try the new lesson experience');
  });

  it('opens the prototype overlay on tap, with all four modes', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice />);
    click(byText('Try the new lesson experience')[0]);
    expect(container.textContent).toContain('PROTOTYPE');
    for (const label of ['Watch', 'Read', 'Listen', 'Study']) {
      expect(byText(label).length).toBeGreaterThan(0);
    }
  });
});

describe('the lesson is preserved verbatim, not summarized or rewritten', () => {
  it('Read mode renders the real lesson text, character for character', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Read')[0]);
    // A real, specific sentence from the lesson's own prose -- present in full.
    expect(container.textContent).toContain('Jesus told a story about work done out of sight.');
    expect(container.textContent).toContain(
      '"For the kingdom of heaven is as a man travelling into a far country, who called his own servants, and delivered unto them his goods." (Matthew 25:14)'
    );
  });

  it("switching reading level shows that level's own real text, not a rewrite of the adult version", () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Read')[0]);
    click(byText('Child')[0]);
    expect(container.textContent).toContain('Someone sent us a chart.');
    expect(REAL_LESSON.levels.child).toContain('Someone sent us a chart.');
  });

  it('Study mode is the REAL quiz: picking an option reveals the real explanation, verbatim', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Study')[0]);
    expect(container.textContent).toContain(REAL_LESSON.quiz.questions[0].q);
    const firstOption = REAL_LESSON.quiz.questions[0].options[0];
    click(byText(firstOption)[0]);
    expect(container.textContent).toContain(REAL_LESSON.quiz.questions[0].explain);
  });

  it('Study mode shows the real discussion prompts, verbatim', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Study')[0]);
    expect(container.textContent).toContain(REAL_LESSON.facilitator.discussionPrompts[0]);
  });

  it('original title renders beside the new title, never replaced', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={{ displayTitle: 'Who Is Watching When You Work Alone?' }} onExit={vi.fn()} />);
    expect(container.textContent).toContain('Who Is Watching When You Work Alone?');
    expect(container.textContent).toContain(REAL_LESSON.title);
  });
});

describe('no new paid assets -- the prototype reuses the existing approved image', () => {
  it('Watch mode renders the SAME image src as the presentation record, nothing generated', () => {
    const record = { displayTitle: 'Who Is Watching When You Work Alone?', image: { src: 'learn-thumbs/living-lessons/ll338-not-with-eyeservice/w1280.webp' } };
    render(<LessonExperience lesson={REAL_LESSON} record={record} onExit={vi.fn()} />);
    const img = container.querySelector('.le-stage-img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('ll338-not-with-eyeservice/w1280.webp');
  });
});

describe('the prototype is scoped to exactly one lesson id', () => {
  it('PROTOTYPE_LESSON_ID matches the real lesson this file ships', () => {
    expect(PROTOTYPE_LESSON_ID).toBe(REAL_LESSON.id);
  });
});

// Darrell, 2026-11-25: "I like the new look until a user chooses the play or
// read button -- they should keep the new look of the system." The lesson's
// OWN cover buttons (reached by normal navigation, not the shortcut card)
// must carry into the new Experience for the prototype lesson -- never drop
// to the classic reader -- while every other lesson is untouched.
const type = (input, value) =>
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

function openCoverByCard(container, searchTerm) {
  type(container.querySelector('input[type=search]'), searchTerm);
  const card = [...container.querySelectorAll('button.ls-card')][0];
  if (card) click(card);
  return card;
}

describe("the lesson's own Read/Listen/age-chip buttons stay in the new look (not the classic hand-off)", () => {
  it('Read Lesson on the real cover opens the Experience in Read mode, not onOpenLesson', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    expect(openCoverByCard(container, 'Eyeservice')).toBeTruthy();
    const readBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Read Lesson');
    expect(readBtn).toBeTruthy();
    click(readBtn);
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(container.textContent).toContain('PROTOTYPE');
    expect(byText('Read').some((b) => b.getAttribute('aria-selected') === 'true')).toBe(true);
  });

  it('an age chip on the real cover opens Read mode at that level', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    expect(openCoverByCard(container, 'Eyeservice')).toBeTruthy();
    const chip = [...container.querySelectorAll('button.ls-chip')].find((b) => b.textContent.trim() === 'Child');
    expect(chip).toBeTruthy();
    click(chip);
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Someone sent us a chart.');
  });

  it('▶ Listen on the real cover opens Listen mode', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    expect(openCoverByCard(container, 'Eyeservice')).toBeTruthy();
    const listenBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === '▶ Listen');
    expect(listenBtn).toBeTruthy();
    click(listenBtn);
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(byText('Listen').some((b) => b.getAttribute('aria-selected') === 'true')).toBe(true);
  });

  it('a DIFFERENT lesson still hands off to the classic reader, unchanged', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    const card = openCoverByCard(container, 'A Sound Mind');
    if (card) {
      const readBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Read Lesson');
      click(readBtn);
      expect(onOpenLesson).toHaveBeenCalledTimes(1);
      expect(container.textContent).not.toContain('PROTOTYPE');
    }
  });
});

// Darrell, 2026-11-25: "the all listed should populate like YouTube... so all
// available can be seen in a list of options."
describe('More Lessons — a YouTube-style queue of all available lessons (same course)', () => {
  it('Watch mode lists other real lessons (never the prototype lesson itself), each with its real image', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    click(byText('Try the new lesson experience')[0]);
    expect(container.textContent).toContain('More Lessons');
    const rows = [...container.querySelectorAll('.le-more-card')];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.textContent.includes('Not with Eyeservice'))).toBe(false);
    expect(container.querySelector('.le-more-thumb')).toBeTruthy();
  });

  it('tapping a More Lessons row exits the overlay and opens that lesson the normal way', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    click(byText('Try the new lesson experience')[0]);
    const row = container.querySelector('.le-more-card');
    expect(row).toBeTruthy();
    click(row);
    expect(onOpenLesson).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('PROTOTYPE');
  });
});

// Darrell, 2026-11-25: "our share links do/should go to each lesson... the
// new look needs to do that also... currently it doesn't... fix it too."
import { lessonQuery } from '../lib/lesson-links.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);

describe('a shared lesson link lands on the SAME lesson in the new look (owner device)', () => {
  afterEach(() => setSearch(''));

  it('ChurchLearn threads a parsed deep link into LearnStudioPreview as initialLessonId', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/initialLessonId=\{deepLink && deepLink\.lessonId\}/);
  });

  it('LearnStudioPreview opens the real cover for a lessonId OUTSIDE the home screen picks (the regression) via initialLessonId', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice initialLessonId={PROTOTYPE_LESSON_ID} />);
    expect(container.textContent).toContain('Who Is Watching When You Work Alone?');
    expect(container.querySelector('.ls-cover')).toBeTruthy();
  });
});

describe("the new look's own Share button builds a real lesson link, not the bare page URL", () => {
  it('shares a URL carrying this exact course and lesson, not window.location.href', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    const card = openCoverByCard(container, 'Eyeservice');
    expect(card).toBeTruthy();
    const shareBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Share');
    expect(shareBtn).toBeTruthy();
    const written = [];
    navigator.clipboard = {
      writeText: (s) => {
        written.push(s);
        return Promise.resolve();
      },
    };
    const realShare = navigator.share;
    delete navigator.share;
    click(shareBtn);
    navigator.share = realShare;
    expect(written[0]).toContain(lessonQuery({ courseKey: 'living-lessons', lessonId: PROTOTYPE_LESSON_ID }));
    expect(written[0]).not.toBe(window.location.href);
  });
});

import { findPresentedLesson } from '../lib/learn-presentation/presentation.js';

describe("findPresentedLesson: a deep link reaches ANY lesson, not only the home screen's curated picks", () => {
  it('finds the lesson by scanning the full catalog, even with an EMPTY presentation index (the home screen would show nothing here)', () => {
    const hit = findPresentedLesson(COURSES, new Map(), PROTOTYPE_LESSON_ID, { preview: true });
    expect(hit).toBeTruthy();
    expect(hit.lesson.id).toBe(PROTOTYPE_LESSON_ID);
    expect(hit.p.lessonId).toBe(PROTOTYPE_LESSON_ID);
  });

  it('returns null for a lesson id that does not exist, never throwing', () => {
    expect(findPresentedLesson(COURSES, new Map(), 'no-such-lesson-id')).toBeNull();
    expect(findPresentedLesson(null, null, null)).toBeNull();
  });
});

// The four-mode redesign to the approved reference (2026-11-25): every new
// section is filled from the lesson's own fields, never a painted value.
describe('four-mode reference layout -- real data only', () => {
  it('Watch > Key Points shows the real big idea and benefits, verbatim', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Key Points')[0]);
    expect(container.textContent).toContain(REAL_LESSON.bigIdea);
    for (const b of REAL_LESSON.benefits) expect(container.textContent).toContain(b);
  });

  it('Watch > Scriptures lists the anchor and the exact verse quotations from the lesson', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Scriptures')[0]);
    expect(container.textContent).toContain(REAL_LESSON.anchor.ref);
    expect(container.textContent).toContain('(Matthew 25:14)');
  });

  it('every time shown is marked as an estimate (~), never an exact painted clock', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    const stamps = [...container.querySelectorAll('.le-tstamp')].map((n) => n.textContent);
    expect(stamps.length).toBeGreaterThan(0);
    expect(stamps.every((t) => t.startsWith('~'))).toBe(true);
    expect(container.querySelector('.le-time').textContent).toMatch(/^~\d+:\d\d \/ ~\d+:\d\d$/);
  });

  it("Read has the book pager over the lesson's own paragraphs and the Key Teaching is the real big idea", () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Read')[0]);
    const paras = REAL_LESSON.lesson.split(/\n\n+/).filter(Boolean).length;
    expect(container.querySelector('.le-bb-count').textContent).toBe(`1 of ${paras}`);
    expect(container.querySelector('.le-keyteach').textContent).toContain(REAL_LESSON.bigIdea);
    expect(container.querySelectorAll('.le-book-p').length).toBe(paras);
  });

  it('Study is the reference accordion: Reflection open, the real practice text, notes saved on the device', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Study')[0]);
    const titles = [...container.querySelectorAll('.le-acc-title')].map((n) => n.textContent);
    expect(titles).toEqual(['Scripture Focus', 'Key Takeaways', 'Reflection Questions', 'Practice / Exercise', 'Check Your Understanding', 'My Notes']);
    const reflect = [...container.querySelectorAll('.le-acc')].find((d) => d.textContent.includes('Reflection Questions'));
    expect(reflect.open).toBe(true);
    expect(container.textContent).toContain(REAL_LESSON.inApp);
    expect(container.textContent).not.toContain('Download');
  });
});

// Darrell, 2026-11-25, on ?course=healthy-living: "Fix it."
describe('a course link opens that course in the new look, every lesson as a grid', () => {
  const LIVING = COURSES.find((c) => c.key === 'living-lessons');

  it('initialCourseKey opens a course page listing EVERY lesson in the course, not the home screen', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice initialCourseKey="living-lessons" />);
    const grid = container.querySelector('.ls-grid');
    expect(grid).toBeTruthy();
    expect(grid.querySelectorAll('button.ls-card').length).toBe(LIVING.schedule.length);
    expect(container.textContent).toContain(`${LIVING.schedule.length} lessons`);
  });

  it('ChurchLearn threads the course from the link too', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/initialCourseKey=\{deepLink && deepLink\.courseKey\}/);
  });

  it("a lesson link opens the cover first, and Back lands on that lesson's course page", () => {
    render(
      <LearnStudioPreview
        courses={COURSES}
        onOpenLesson={vi.fn()}
        onExit={vi.fn()}
        ownerDevice
        initialCourseKey="living-lessons"
        initialLessonId={PROTOTYPE_LESSON_ID}
      />
    );
    expect(container.querySelector('.ls-cover')).toBeTruthy();
    click(container.querySelector('.ls-cover .ls-back'));
    expect(container.querySelector('.ls-grid')).toBeTruthy();
  });

  it('an unknown course in a link opens the normal home screen, never a dead page', () => {
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice initialCourseKey="no-such-course" />);
    expect(container.querySelector('.ls-grid')).toBeNull();
    expect(container.textContent).toContain('Discover Something New');
  });
});

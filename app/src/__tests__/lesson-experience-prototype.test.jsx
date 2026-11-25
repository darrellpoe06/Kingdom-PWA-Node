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
import LessonExperience, {
  PROTOTYPE_LESSON_ID,
  PAGE_LIGHT_KEY,
  mapSegmentsToParagraphs,
  readingTextFor,
  storiesTextFor,
} from '../components/learn-studio/LessonExperience.jsx';
import { segmentText } from '../lib/tts.js';
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

  // Approved 2026-11-25 ("Update them to our new look?!!!!!! Yet?!!!!"):
  // every lesson opens in the new look, not only the prototype.
  it('a DIFFERENT lesson opens in the new look too, with its own title', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    const card = openCoverByCard(container, 'A Sound Mind');
    expect(card).toBeTruthy();
    const readBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Read Lesson');
    click(readBtn);
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(byText('Read').some((b) => b.getAttribute('aria-selected') === 'true')).toBe(true);
  });

  it('off the owner device, every lesson still hands off to the classic reader', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice={false} />);
    const card = openCoverByCard(container, 'A Sound Mind');
    expect(card).toBeTruthy();
    click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Read Lesson'));
    expect(onOpenLesson).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('PROTOTYPE');
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

  it('tapping a More Lessons row stays in the new look and opens THAT lesson', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    click(byText('Try the new lesson experience')[0]);
    const row = container.querySelector('.le-more-card');
    expect(row).toBeTruthy();
    const picked = row.textContent;
    click(row);
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(container.textContent).toContain('PROTOTYPE');
    expect(container.textContent).not.toContain('Not with Eyeservice');
    expect(picked.length).toBeGreaterThan(0);
  });
});

// The 37 lessons that carry only age versions (measured 2026-11-25) open with
// their own words, never empty.
import { textFor } from '../components/learn-studio/LessonExperience.jsx';
describe('every one of the 994 lessons has words to open with', () => {
  it('textFor finds text for every lesson in the catalog', () => {
    const empty = COURSES.flatMap((c) => c.schedule)
      .filter((l) => l && l.id && !textFor(l, 'adult').trim())
      .map((l) => l.id);
    expect(empty).toEqual([]);
  });
  it('an age-only lesson reads its oldest age version as the full reading', () => {
    expect(textFor({ levels: { child: 'c', senior: 'S' } }, 'adult')).toBe('S');
    expect(textFor({ lesson: 'A', levels: { senior: 'S' } }, 'adult')).toBe('A');
    expect(textFor({ lesson: 'A', levels: { child: 'c' } }, 'child')).toBe('c');
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

  it('Read is one continuous scroll of every paragraph (no pager) and the big idea is read exactly once', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Read')[0]);
    // The reading is the teaching AND the lesson's stories (Darrell 2026-11-25).
    const paras = readingTextFor(REAL_LESSON, 'adult').split(/\n\n+/).filter(Boolean).length;
    expect(container.querySelectorAll('.le-book-p').length).toBe(paras);
    expect(container.querySelector('.le-bb-count')).toBeNull();
    expect(container.querySelector('button[aria-label="Next paragraph"]')).toBeNull();
    // The Key Teaching box shows the big idea only when the text does not
    // already say it (ll338's text does), so it is never read twice.
    const sq = (t) => t.replace(/\s+/g, ' ');
    const page = sq(container.querySelector('.le-book').textContent);
    expect(page.split(sq(REAL_LESSON.bigIdea).slice(0, 60)).length - 1).toBe(1);
  });

  it('Study is the reference accordion: Reflection open, the real practice text, notes saved on the device', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Study')[0]);
    const titles = [...container.querySelectorAll('.le-acc-title')].map((n) => n.textContent);
    expect(titles).toEqual([
      'Scripture Focus',
      'Key Takeaways',
      'Reflection Questions',
      'Practice / Exercise',
      'Check Your Understanding',
      'My Notes',
      'Stories & Perspectives',
    ]);
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

// Darrell, 2026-11-25: Read Aloud inside Read -- "listen while reading the
// beautifully illustrated book without leaving Read mode" -- and "No turning
// pages just scrolling down." A fake narrator is injected through the same
// `createNarrator` seam a future recorded voice would use, so these tests
// also prove that contract.
describe('Read Aloud inside Read mode (one continuous scroll)', () => {
  const lessonText = readingTextFor(REAL_LESSON, 'adult');
  const segments = segmentText(lessonText);
  const paragraphs = lessonText.split(/\n\n+/).filter(Boolean);
  const { segPara, firstSeg } = mapSegmentsToParagraphs(paragraphs, segments);

  let made, scrolled, saveRaf, saveScrollBy;
  const createNarrator = (opts) => {
    const e = {
      calls: [],
      text: '',
      status: 'idle',
      at: 0,
      onBoundary() {},
      load(t) {
        this.text = t;
        this.calls.push('load');
      },
      play() {
        this.status = 'playing';
        this.at = 0;
        this.calls.push('play');
        opts.onState({ status: 'playing', segmentIndex: 0 });
      },
      pause() {
        this.status = 'paused';
        this.calls.push('pause');
        opts.onState({ status: 'paused', segmentIndex: this.at });
      },
      resume() {
        this.status = 'playing';
        this.calls.push('resume');
        opts.onState({ status: 'playing', segmentIndex: this.at });
      },
      stop() {
        this.calls.push('stop');
        if (this.status !== 'idle') {
          this.status = 'idle';
          opts.onState({ status: 'idle', segmentIndex: 0 });
        }
      },
      setRate(r) {
        this.calls.push(['rate', r]);
      },
      // test-only: the engine reports reaching segment i of what it loaded
      reach(i) {
        this.at = i;
        act(() => opts.onState({ status: this.status, segmentIndex: i }));
      },
    };
    made.push(e);
    return e;
  };
  const narrator = () => made[made.length - 1];
  const byLabel = (label) => container.querySelector(`button[aria-label="${label}"]`);
  const paras = () => [...container.querySelectorAll('.le-book-p')];
  const paraNarrating = () => paras().findIndex((p) => p.classList.contains('narrating'));
  const openRead = () => render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} initialMode="read" createNarrator={createNarrator} />);
  // Pretend the reader has scrolled so paragraph `k` sits at the reading line.
  const scrollTo = (k) => {
    paras().forEach((p, i) => {
      p.getBoundingClientRect = () => ({ top: (i - k) * 300, bottom: (i - k) * 300 + 290 });
    });
    act(() => window.dispatchEvent(new Event('scroll')));
  };

  beforeEach(() => {
    made = [];
    scrolled = [];
    window.localStorage.clear();
    saveRaf = window.requestAnimationFrame;
    saveScrollBy = window.scrollBy;
    window.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    window.scrollBy = vi.fn();
    Element.prototype.scrollIntoView = function () {
      scrolled.push(this);
    };
  });
  afterEach(() => {
    window.requestAnimationFrame = saveRaf;
    window.scrollBy = saveScrollBy;
    delete Element.prototype.scrollIntoView;
  });

  it('every spoken segment maps to the paragraph that really contains it', () => {
    expect(segPara.length).toBe(segments.length);
    for (let i = 1; i < segPara.length; i += 1) expect(segPara[i]).toBeGreaterThanOrEqual(segPara[i - 1]);
    paragraphs.forEach((p, pi) => {
      expect(p.replace(/\s+/g, ' ')).toContain(segments[firstSeg[pi]]);
    });
  });

  it('shows a prominent Read Aloud button and keeps the reading controls, with no page turning', () => {
    openRead();
    expect(container.querySelector('.le-aloud-cta').textContent).toContain('Read Aloud');
    for (const label of ['Smaller text', 'Larger text', 'Bookmark this paragraph', 'Read Aloud from this page']) {
      expect(byLabel(label)).toBeTruthy();
    }
    expect(byLabel('Next paragraph')).toBeNull();
    expect(paras().length).toBe(paragraphs.length);
  });

  it('starts reading where you have scrolled to, with the right place counted', () => {
    openRead();
    scrollTo(2);
    click(container.querySelector('.le-aloud-cta'));
    expect(narrator().text.startsWith(segments[firstSeg[2]])).toBe(true);
    // The engine counts the loaded remainder from 0; the place must not reset.
    expect(paraNarrating()).toBe(2);
    expect(container.querySelector('.le-narrate')).toBeTruthy();
  });

  it('highlights the paragraph being read and scrolls down with the voice', () => {
    openRead();
    click(container.querySelector('.le-aloud-cta'));
    const target = firstSeg[5] + 1;
    const before = scrolled.length + window.scrollBy.mock.calls.length;
    narrator().reach(target);
    expect(paraNarrating()).toBe(segPara[target]);
    expect(scrolled.length + window.scrollBy.mock.calls.length).toBeGreaterThan(before);
  });

  it('Auto-scroll off: the voice keeps reading but the screen stays where you put it', () => {
    openRead();
    click(container.querySelector('.le-aloud-cta'));
    click(byText('Auto-scroll')[0]);
    const before = scrolled.length + window.scrollBy.mock.calls.length;
    narrator().reach(firstSeg[4]);
    expect(paraNarrating()).toBe(4);
    expect(scrolled.length + window.scrollBy.mock.calls.length).toBe(before);
  });

  it('pause, resume, rewind and speed go to the narrator', () => {
    openRead();
    click(container.querySelector('.le-aloud-cta'));
    narrator().reach(4);
    click(byLabel('Pause'));
    expect(narrator().calls).toContain('pause');
    click(byLabel('Resume'));
    expect(narrator().calls).toContain('resume');
    click(byLabel('Rewind one sentence'));
    expect(narrator().text.startsWith(segments[3])).toBe(true);
    click(byLabel('Speed 1×'));
    expect(made.some((e) => e.calls.some((c) => Array.isArray(c) && c[0] === 'rate' && c[1] === 1.5))).toBe(true);
  });

  it('keeps the narration place across Read -> Listen -> Watch -> Read', () => {
    openRead();
    click(container.querySelector('.le-aloud-cta'));
    const target = firstSeg[6] + 1;
    narrator().reach(target);
    click(byLabel('Pause'));
    click(byText('Listen')[0]);
    expect(container.querySelector('.le-listen-now').textContent).toBe(segments[target]);
    click(byText('Watch')[0]);
    expect(container.querySelector('.le-tline.on .le-ttext').textContent).toBe(segments[target]);
    scrolled = [];
    click(byText('Read')[0]);
    expect(paraNarrating()).toBe(6);
    expect(scrolled).toContain(paras()[6]);
  });

  it('keeps the scroll place across a trip to Study when nothing is being read', () => {
    openRead();
    scrollTo(3);
    click(byText('Study')[0]);
    scrolled = [];
    click(byText('Read')[0]);
    expect(scrolled).toContain(paras()[3]);
  });

  it('reading aloud never changes a character of the lesson', () => {
    openRead();
    const before = container.querySelector('.le-book-text').textContent;
    click(container.querySelector('.le-aloud-cta'));
    narrator().reach(firstSeg[3]);
    expect(container.querySelector('.le-book-text').textContent).toBe(before);
    expect(before).toContain(
      '"For the kingdom of heaven is as a man travelling into a far country, who called his own servants, and delivered unto them his goods." (Matthew 25:14)'
    );
  });
});

// Darrell, 2026-11-25, after reviewing on his phone: in Watch, narration
// "scrolls the screen away from the video player." The player stays pinned,
// captions ride the video, and only the transcript box scrolls.
describe('Watch keeps the player in view while it plays', () => {
  const segments = segmentText(REAL_LESSON.lesson);
  let made, pageScrolls, boxScrolls, saveScrollBy;
  const createNarrator = (opts) => {
    const e = {
      calls: [],
      status: 'idle',
      at: 0,
      onBoundary() {},
      load() {},
      play() {
        this.status = 'playing';
        this.calls.push('play');
        opts.onState({ status: 'playing', segmentIndex: 0 });
      },
      pause() {
        this.status = 'paused';
        this.calls.push('pause');
        opts.onState({ status: 'paused', segmentIndex: this.at });
      },
      resume() {
        this.status = 'playing';
        opts.onState({ status: 'playing', segmentIndex: this.at });
      },
      stop() {
        if (this.status !== 'idle') {
          this.status = 'idle';
          opts.onState({ status: 'idle', segmentIndex: 0 });
        }
      },
      setRate() {},
      reach(i) {
        this.at = i;
        act(() => opts.onState({ status: this.status, segmentIndex: i }));
      },
    };
    made.push(e);
    return e;
  };
  const narrator = () => made[made.length - 1];
  const box = () => container.querySelector('.le-transcript');
  const openWatch = () => render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} createNarrator={createNarrator} />);
  const startPlaying = () => click(container.querySelector('.le-playerbar button[aria-label="Play"]'));

  beforeEach(() => {
    made = [];
    pageScrolls = 0;
    boxScrolls = [];
    window.localStorage.clear();
    saveScrollBy = window.scrollBy;
    window.scrollBy = () => (pageScrolls += 1);
    Element.prototype.scrollIntoView = () => (pageScrolls += 1);
    Element.prototype.scrollTo = function (o) {
      boxScrolls.push(this);
      this.scrollTop = o && o.top;
    };
  });
  afterEach(() => {
    window.scrollBy = saveScrollBy;
    delete Element.prototype.scrollIntoView;
    delete Element.prototype.scrollTo;
  });

  it('narration moves only the transcript box, never the page', () => {
    openWatch();
    startPlaying();
    narrator().reach(5);
    narrator().reach(12);
    expect(pageScrolls).toBe(0);
    expect(boxScrolls.length).toBeGreaterThan(0);
    expect(boxScrolls.every((el) => el === box())).toBe(true);
  });

  it('the player is pinned: stage, progress and controls sit in one sticky block above the transcript', () => {
    openWatch();
    const player = container.querySelector('.le-player');
    expect(player.querySelector('.le-stage')).toBeTruthy();
    expect(player.querySelector('.le-progress')).toBeTruthy();
    expect(player.querySelector('.le-playerbar')).toBeTruthy();
    expect(player.contains(box())).toBe(false);
  });

  it('captions show the spoken words directly on the video', () => {
    openWatch();
    startPlaying();
    narrator().reach(7);
    const caption = container.querySelector('.le-stage .le-caption');
    expect(caption).toBeTruthy();
    expect(caption.textContent).toBe(segments[7]);
  });

  it('browsing the transcript stops the auto-follow but never the voice, and Back to the current line resumes it', () => {
    openWatch();
    startPlaying();
    narrator().reach(3);
    act(() => box().dispatchEvent(new WheelEvent('wheel', { bubbles: true })));
    boxScrolls = [];
    narrator().reach(9);
    expect(boxScrolls.length).toBe(0);
    expect(narrator().calls).not.toContain('pause');
    expect(narrator().status).toBe('playing');
    expect(container.querySelector('.le-tline.on .le-ttext').textContent).toBe(segments[9]);
    click(byText('Back to the current line')[0]);
    expect(boxScrolls).toContain(box());
  });

  it('full screen shows the cinematic stage with live captions, and exits', () => {
    openWatch();
    startPlaying();
    narrator().reach(4);
    click(container.querySelector('button[aria-label="Full screen"]'));
    const stage = container.querySelector('.le-stage');
    expect(stage.classList.contains('le-stage--full')).toBe(true);
    expect(stage.querySelector('.le-stage-img, .le-img--empty')).toBeTruthy();
    expect(stage.querySelector('.le-caption').textContent).toBe(segments[4]);
    narrator().reach(5);
    expect(stage.querySelector('.le-caption').textContent).toBe(segments[5]);
    click(container.querySelector('button[aria-label="Exit full screen"]'));
    expect(container.querySelector('.le-stage').classList.contains('le-stage--full')).toBe(false);
  });
});

describe('Watch: the Back to the current line button never shifts the transcript', () => {
  it('renders after the list inside a positioned wrapper, not above it', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../components/learn-studio/lesson-experience.css'), 'utf8');
    const rule = css.slice(css.indexOf('.le-follow {'), css.indexOf('}', css.indexOf('.le-follow {')));
    expect(rule).toContain('position: absolute');
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../components/learn-studio/LessonExperience.jsx'), 'utf8');
    const wrap = src.indexOf('le-transcript-wrap');
    expect(wrap).toBeGreaterThan(-1);
    expect(src.indexOf('le-follow', wrap)).toBeGreaterThan(src.indexOf('</ol>', wrap));
  });
});

// "We don't like losing features ever!!!" (Darrell, 2026-11-25): the classic
// page's stories, perspectives, add-yours and charts ride the new look, and the
// rest of its tools are one tap away for THIS lesson.
describe('the new look keeps every classic lesson feature', () => {
  it('Read ends with Stories & Perspectives, the add-yours entry, and the full-page tools', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />);
    click(byText('Try the new lesson experience')[0]);
    click(byText('Read').find((b) => b.getAttribute('role') === 'tab' || b.getAttribute('aria-selected') != null));
    expect(container.querySelector('[data-testid="lesson-stories"]')).toBeTruthy();
    expect(container.textContent).toContain('Stories & Perspectives');
    const full = byText('open the full lesson page')[0];
    expect(full).toBeTruthy();
    click(full);
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', PROTOTYPE_LESSON_ID);
  });
});

// Darrell 2026-11-25: both views for kids and adults; the Kids Zone promise
// ("no profile, no chat") travels with a child into the new look.
import { LessonConversation, YOUNG_LEVELS, kidsZoneHref } from '../components/learn-studio/LessonExperience.jsx';
describe('kids in the new look; grown-ups into the Kids Zone', () => {
  const LESSON = { id: 'll1-x', title: 'T', lesson: 'Body.', stories: [{ title: 'A taught story', body: 'Once.', kind: 'parable' }] };
  it('at Child, Youth and Teen: the taught stories stay, no one else’s posts and no posting', () => {
    for (const level of YOUNG_LEVELS) {
      render(React.createElement(LessonConversation, { lesson: LESSON, level }));
      expect(container.querySelector('[data-young="true"]')).toBeTruthy();
      expect(container.textContent).toContain('A taught story');
      expect(container.textContent).not.toContain('Stories & Perspectives');
      expect(container.querySelector('[data-testid="add-perspective"], [data-testid="add-perspective-open"]')).toBeNull();
    }
  });
  it('at Adult and Senior: Stories & Perspectives with the add-yours entry', () => {
    for (const level of ['adult', 'senior']) {
      render(React.createElement(LessonConversation, { lesson: LESSON, level }));
      expect(container.querySelector('[data-young="true"]')).toBeNull();
      expect(container.textContent).toContain('Stories & Perspectives');
      expect(container.querySelector('[data-testid="add-perspective"]')).toBeTruthy();
    }
  });
  it('the Kids Zone link goes to the youth door on this same app', () => {
    expect(kidsZoneHref({ pathname: '/lovecorner/app/' })).toBe('/lovecorner/app/?view=church&sub=youth');
  });
});

// Darrell 2026-11-25, from the live build: "What happened to the stories, both of them being
// read?" and "Also displayed... they may end up being the most looked forward to." Every story a
// lesson carries follows its teaching in the one reading that Watch, Read and Listen show and speak.
describe("the lesson's stories are shown and read with the lesson", () => {
  const stories = (REAL_LESSON.stories || []).filter((s) => s && s.body);
  it('the real lesson carries stories, and each one is in the reading, word for word, under a lead that says what it is', () => {
    expect(stories.length).toBeGreaterThanOrEqual(2);
    const text = storiesTextFor(REAL_LESSON);
    for (const st of stories) {
      expect(text).toContain(st.body.trim());
      expect(text).toMatch(st.kind === 'testimony' ? /A TRUE STORY/ : /A PARABLE|MORE ON THIS LESSON/);
    }
    expect(readingTextFor(REAL_LESSON, 'adult').startsWith(REAL_LESSON.lesson)).toBe(true);
    expect(readingTextFor(REAL_LESSON, 'adult').endsWith(text)).toBe(true);
  });
  it('a parable is never read as a record: its truth line follows it (DR-0811)', () => {
    const text = storiesTextFor({ stories: [{ kind: 'parable', title: 'The Lamp', body: 'A lamp was lit.' }] });
    expect(text).toBe(`A PARABLE: THE LAMP. A lamp was lit.\n\n${text.split('\n\n')[1]}`);
    expect(text.split('\n\n')[1]).toMatch(/^A parable, not a record/);
  });
  it('a lesson with no stories reads exactly its teaching', () => {
    expect(readingTextFor({ lesson: 'A' }, 'adult')).toBe('A');
    expect(storiesTextFor({ stories: [{ kind: 'parable', title: 'x', body: ' ' }] })).toBe('');
  });
  it('Read shows every story on the page, and the voice is given them too', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    click(byText('Read')[0]);
    const page = container.querySelector('.le-book-text').textContent;
    for (const st of stories) expect(page).toContain(st.body.trim().slice(0, 60));
    // The voice speaks the same text the page shows: every story is in the spoken segments.
    const spoken = segmentText(readingTextFor(REAL_LESSON, 'adult')).join(' ');
    for (const st of stories) expect(spoken).toContain(st.body.trim().slice(0, 40));
  });
});

// Darrell 2026-11-25: "dark mode needs to respect the wishes of the dark mode... why so much
// white?" and "the screen's brightness is what some people really want... at least an option."
describe('the page has its own light: bright stays, dark is one press away', () => {
  const root = () => container.querySelector('.le-root');
  const sw = () => container.querySelector('[data-testid="le-page-light"]');
  afterEach(() => {
    window.localStorage.removeItem(PAGE_LIGHT_KEY);
    document.body.removeAttribute('data-theme');
  });
  it('opens bright by default, and one press turns the page dark and is remembered', () => {
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    expect(root().className).not.toContain('le-root--darkpage');
    expect(sw().textContent).toBe('Dark page');
    click(sw());
    expect(root().className).toContain('le-root--darkpage');
    expect(sw().textContent).toBe('Bright page');
    expect(sw().getAttribute('aria-pressed')).toBe('true');
    expect(window.localStorage.getItem(PAGE_LIGHT_KEY)).toBe('dark');
    click(sw());
    expect(root().className).not.toContain('le-root--darkpage');
    expect(window.localStorage.getItem(PAGE_LIGHT_KEY)).toBe('bright');
  });
  it('the darkest theme (midnight) opens dark with no choice made; a saved Bright choice wins over it', () => {
    document.body.setAttribute('data-theme', 'midnight');
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    expect(root().className).toContain('le-root--darkpage');
    click(sw());
    expect(window.localStorage.getItem(PAGE_LIGHT_KEY)).toBe('bright');
  });
  it('every other theme still opens on the bright page it always had', () => {
    document.body.setAttribute('data-theme', 'night');
    render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={vi.fn()} />);
    expect(root().className).not.toContain('le-root--darkpage');
  });
});

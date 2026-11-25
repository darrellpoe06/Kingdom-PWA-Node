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

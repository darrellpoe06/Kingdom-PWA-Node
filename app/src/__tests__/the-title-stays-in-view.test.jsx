// =============================================================================
// The lesson's TITLE stays where the reader can see it — both surfaces, rendered
// =============================================================================
// Darrell 2026-09-17: "The title to these lessons should stay at the top of the
// presentations and as well as in the actual narrative so that people can
// remember what we're talking about... just make sure it's intuitive and it
// works well."
//
// THE MEASURED DEFECT, on both surfaces, traced before anything was written:
//
//   • THE PRESENTATION (AudienceSlide, the big full-screen reader and the
//     projected view). Each slide rendered the PART's title as its h1
//     (scene.audience.title) with the position as the eyebrow ("Part 3 of 9").
//     The LESSON's title was never passed into the slide at all — it lived on
//     the presentable and stopped there. A reader nine movements into L90 was
//     shown "THE ANCIENT LANDMARK · Part 4 of 9" and nothing naming the lesson.
//
//   • THE IN-APP READER (ChurchLearn's lesson space). There WAS already a
//     sticky bar holding position through a long read — and it named the
//     POSITION, "Lesson 90 of 163", never the lesson. The reader was told where
//     he was and not what he was in.
//
// Both are fixed at the data layer rather than by painting a string: the slide
// carries the module's own `title` through buildSlideForScene, and the in-app
// heading reads focusModule.title. Nothing here displays a value that cannot be
// traced to a real record (DR-0076 / the reality-trace rule).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AudienceSlide from '../components/AudienceSlide.jsx';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildSlideForScene, lessonPresentable } from '../lib/presentable.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const presenterSrc = readFileSync(join(HERE, '..', 'components', 'Presenter.jsx'), 'utf8');

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

// -----------------------------------------------------------------------------
// The data layer: the title reaches the slide, from the real module.
// -----------------------------------------------------------------------------
describe('the lesson title reaches every slide, from the real record', () => {
  const lesson = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll90-no-respecter'));

  it('the module this test leans on exists and has a real title', () => {
    expect(lesson, 'L90 must exist for this test to mean anything').toBeTruthy();
    expect(typeof lesson.title).toBe('string');
    expect(lesson.title.length).toBeGreaterThan(8);
  });

  it('EVERY slide of a real lesson carries the lesson title — not just the first', () => {
    const presentable = lessonPresentable(lesson, {});
    const scenes = presentable.scenes || [];
    expect(scenes.length, 'the lesson should build several scenes').toBeGreaterThan(2);
    for (let i = 0; i < scenes.length; i += 1) {
      const slide = buildSlideForScene(scenes, i, { lessonTitle: presentable.title });
      expect(slide.lessonTitle, `slide ${i + 1} lost the lesson title`).toBe(presentable.title);
      // And the slide's own h1 is still the PART's title, not overwritten.
      expect(slide.title, `slide ${i + 1} should keep its own part title`).not.toBe(undefined);
    }
  });

  it('the part title and the lesson title are DIFFERENT things on the same slide', () => {
    // The whole point: if these collapsed into one field the reader would lose
    // one of the two orientations, which is the defect in the other direction.
    const presentable = lessonPresentable(lesson, {});
    const slide = buildSlideForScene(presentable.scenes, 3, { lessonTitle: presentable.title });
    expect(slide.lessonTitle).toBe(presentable.title);
    expect(slide.title).not.toBe(slide.lessonTitle);
  });

  it('a caller that passes no title gets null, so an un-upgraded surface is unaffected', () => {
    const presentable = lessonPresentable(lesson, {});
    const slide = buildSlideForScene(presentable.scenes, 0, {});
    expect(slide.lessonTitle).toBeNull();
  });

  it('PRESENTER PASSES IT AT EVERY CALL SITE — a missed one would blank the title mid-message', () => {
    // A source check on purpose. Presenter builds a slide in five places (the
    // broadcast, the resume, the follow publish, the preview, and the on-screen
    // render); one of them omitting lessonTitle would drop the title on exactly
    // one surface, which is the kind of gap a single rendered test never sees.
    const calls = presenterSrc.match(/buildSlideForScene\([^)]*\)/g) || [];
    expect(calls.length, 'Presenter should build slides in several places').toBeGreaterThanOrEqual(4);
    const missing = calls.filter((c) => !c.includes('lessonTitle'));
    expect(missing, `buildSlideForScene call sites without lessonTitle:\n${missing.join('\n')}`).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The presentation surface: it actually renders.
// -----------------------------------------------------------------------------
describe('the presentation shows the lesson title above the part', () => {
  const render = (slide) => act(() => root.render(createElement(AudienceSlide, { slide })));

  it('renders the lesson title on the slide', () => {
    render({ title: 'THE ANCIENT LANDMARK', indexLabel: 'Part 4 of 9', lessonTitle: 'No Respecter of Persons' });
    const el = container.querySelector('[data-testid="slide-lesson-title"]');
    expect(el, 'the slide must carry a lesson-title line').toBeTruthy();
    expect(el.textContent).toBe('No Respecter of Persons');
  });

  it('the lesson title sits ABOVE the part heading, so the part is still the slide\'s point', () => {
    render({ title: 'THE ANCIENT LANDMARK', indexLabel: 'Part 4 of 9', lessonTitle: 'No Respecter of Persons' });
    const el = container.querySelector('[data-testid="slide-lesson-title"]');
    const h1 = container.querySelector('h1');
    expect(h1.textContent).toBe('THE ANCIENT LANDMARK');
    // DOCUMENT_POSITION_FOLLOWING (4) — the h1 comes after the title line.
    expect(el.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('it GROWS WITH THE ROOM like everything else on the slide (DR-0451)', () => {
    // Every size on this slide rides --slide-scale so the presenter's room-size
    // control moves it. A hardcoded px here would be the one line that refused
    // to grow for a hall, which is exactly the defect DR-0451 fixed.
    render({ title: 'A PART', lessonTitle: 'A Lesson' });
    const el = container.querySelector('[data-testid="slide-lesson-title"]');
    expect(el.style.fontSize).toContain('--slide-scale');
  });

  it('a slide with no lesson title renders nothing extra — no empty box', () => {
    render({ title: 'THE ANCIENT LANDMARK', indexLabel: 'Part 4 of 9' });
    expect(container.querySelector('[data-testid="slide-lesson-title"]')).toBeNull();
    expect(container.querySelector('h1').textContent).toBe('THE ANCIENT LANDMARK');
  });
});

// -----------------------------------------------------------------------------
// The in-app reader: the title rides the sticky block.
// -----------------------------------------------------------------------------
describe('the in-app reader keeps the title at the top while you read', () => {
  const extraCourses = buildCatalogCourseDescriptors();
  const mount = (props = {}) =>
    act(() => root.render(createElement(ChurchLearn, {
      extraCourses,
      progress: {},
      toggleModule: () => {},
      quizState: {},
      recordQuiz: () => {},
      learnLevel: 'auto',
      setLearnLevel: () => {},
      ageBand: 'adult',
      setAgeBand: () => {},
      ...props,
    })));
  const buttonByText = (text) =>
    [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
  const openLivingLessons = () => {
    const sel = container.querySelector('#learn-course-pick');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'living-lessons');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  it('opening a lesson shows its TITLE in the sticky block, not only its position', () => {
    mount();
    openLivingLessons();
    act(() => { buttonByText('Bodybuilding Christ').click(); });
    const title = container.querySelector('[data-testid="lesson-space-title"]');
    expect(title, 'the lesson space must carry a title line').toBeTruthy();
    expect(title.textContent).toContain('Bodybuilding Christ');
  });

  it('the title is INSIDE the sticky block, so it holds position through a long read', () => {
    // This is the whole ask. A title that scrolls away is the defect; being in
    // the DOM somewhere is not enough.
    mount();
    openLivingLessons();
    act(() => { buttonByText('Bodybuilding Christ').click(); });
    const sticky = container.querySelector('[data-testid="lesson-space-sticky"]');
    const title = container.querySelector('[data-testid="lesson-space-title"]');
    expect(sticky, 'the sticky block must exist').toBeTruthy();
    expect(sticky.className).toContain('sticky');
    expect(sticky.className).toContain('top-0');
    expect(sticky.contains(title), 'the title must ride the sticky block, not scroll away').toBe(true);
  });

  it('the controls row still exists and is still capped as chrome (DR-0410)', () => {
    // The title was added beside the controls, not instead of them, and it must
    // not have dragged the controls out of their cap.
    mount();
    openLivingLessons();
    act(() => { buttonByText('Bodybuilding Christ').click(); });
    const bar = container.querySelector('[data-testid="lesson-space-bar"]');
    expect(bar, 'the way out and prev/next must survive').toBeTruthy();
    expect(bar.className).toContain('ts-chrome-region');
    expect([...bar.querySelectorAll('button')].length).toBeGreaterThanOrEqual(3);
  });

  it('the TITLE is not capped as chrome — it is text the reader reads, so Big Print grows it', () => {
    // Darrell 2026-09-15: "All text grows at Big Print, including the small
    // labels". The controls stay capped (2026-09-16: controls never grow); the
    // title is not a control.
    mount();
    openLivingLessons();
    act(() => { buttonByText('Bodybuilding Christ').click(); });
    const title = container.querySelector('[data-testid="lesson-space-title"]');
    expect(title.className).not.toContain('ts-chrome-region');
    expect(title.closest('.ts-chrome-region'), 'the title must not sit inside the chrome cap').toBeNull();
  });

  it('the title line names the lesson the reader actually opened, from the real record', () => {
    mount();
    openLivingLessons();
    act(() => { buttonByText('Bodybuilding Christ').click(); });
    const opened = container.querySelector('li[id^="learn-lesson-"]');
    const id = opened.id.replace('learn-lesson-', '');
    const real = LIVING_LESSONS_MODULES.find((m) => m.id === id);
    expect(real, 'the opened card must map to a real module').toBeTruthy();
    const title = container.querySelector('[data-testid="lesson-space-title"]');
    expect(title.textContent.trim()).toBe(real.title);
  });
});

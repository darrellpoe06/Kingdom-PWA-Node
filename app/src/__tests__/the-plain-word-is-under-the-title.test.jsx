// =============================================================================
// The plain word renders UNDER the title, on the real component tree (DR-0519)
// =============================================================================
// course-plain-words.test.js proves the declarations are everyday words and
// that they reach their course through the live search. This is the other half
// (DR-0076 §6): on the REAL tree, a reader who opens Kingdom Economics sees
// "money · debt · giving · saving" under a title that contains none of those
// words — which is the whole of what Darrell asked for, and the title he said
// pulls him in is still sitting above it, unchanged.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { plainWordLine } from '../lib/learn-plain-words.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const extraCourses = buildCatalogCourseDescriptors();
const mount = () =>
  act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
const pick = (key) => {
  const sel = container.querySelector('#learn-course-pick');
  expect(sel, 'no course picker on the page').toBeTruthy();
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, key);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
const line = () => container.querySelector('[data-testid="course-plain-words"]');

describe('the plain word sits under the title the title keeps', () => {
  it('renders the everyday words for the course Darrell named', () => {
    mount();
    pick('kingdom-economics');
    const el = line();
    expect(el, 'no plain-word line under the open course').toBeTruthy();
    expect(el.textContent).toContain(plainWordLine('kingdom-economics'));
    expect(el.textContent).toContain('money');
  });

  it('leaves the title itself exactly as it was — this is additive', () => {
    mount();
    pick('kingdom-economics');
    const h2 = container.querySelector('#learn-h');
    expect(h2.textContent).toContain('Kingdom Economics');
    expect(h2.textContent.toLowerCase()).not.toContain('money');
  });

  it('follows the reader to another course rather than sticking', () => {
    mount();
    pick('healthy-living');
    expect(line().textContent).toContain('sleep');
    pick('mathematics');
    expect(line().textContent).toContain('counting');
    expect(line().textContent).not.toContain('sleep');
  });
});

// =============================================================================
// The speaker's view: how many points, which one, and a target you can hit
// =============================================================================
// DR-0380. Darrell 2026-09-13, describing the problem from behind a pulpit
// rather than behind a screen: "we need the speaker to be able to keep their
// place while looking away from the text to look people in their eyes... we
// also want the number of points to be known and for them to be available in a
// list somehow... we need the forward or backwards player to move back and
// fourth to last paragraph or sometimes a whole section... currently I believe
// we just get section jumps."
//
// MEASURED FIRST, not assumed: of 144 lessons only 31 carried any numbered
// point. A tally of how sentences actually begin found 313 ALL-CAPS lead
// clauses — the house style — going unnumbered. That is the fix, and it took
// coverage to 84.
//
// These MOUNT the reader, because a component that cannot render is invisible
// to any test that only reads source (the lesson of DR-0376's React import).
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonReader, LessonPoints } from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TEXT = 'Here is the opening, which is prose before any point is made. '
  + 'FIRST, the trouble lab: next real trouble, go to Him first. That is precisely the trial David ran. '
  + 'SECOND, the promise lab: take one promise and act on it. Build the choice on the promise. '
  + 'THIRD, the invited test: there is exactly one place where He says prove me. '
  + 'FOURTH, the table lab: the Word itself is food.';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  await act(async () => { await Promise.resolve(); });
}

const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('the count is stated before anything is opened', () => {
  it('says how many points there are, in words, without a tap', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    expect(container.textContent).toMatch(/4 points in this lesson/);
  });

  it('a lesson with no points SAYS so rather than showing an empty list', async () => {
    await mount(createElement(LessonPoints, { text: 'Just flowing narrative. It keeps going. No markers here at all.' }));
    expect(container.textContent).toMatch(/One continuous reading/);
    expect(container.querySelector('ol')).toBeNull();
  });
});

describe('the points are a list, and each row carries its own number', () => {
  it('opens to one row per point, numbered, labelled by the POINT not the marker', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    await click(byText(/points in this lesson/));
    const rows = [...container.querySelectorAll('ol li')];
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('the trouble lab'),
        expect.stringContaining('the promise lab'),
        expect.stringContaining('the invited test'),
        expect.stringContaining('the table lab'),
      ]),
    );
    for (const r of rows) expect(r.textContent).not.toMatch(/^\s*\d+\s*(FIRST|SECOND|THIRD|FOURTH)\s*$/);
  });
});

describe('both strides exist — paragraph AND whole point', () => {
  it('offers a paragraph move in each direction', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    expect(container.querySelector('[aria-label="Back one paragraph"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Forward one paragraph"]')).toBeTruthy();
  });

  it('offers a whole-point move in each direction — the section jump he already had', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    expect(container.querySelector('[aria-label="Back one point"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Forward one point"]')).toBeTruthy();
  });

  it('reads out which point you are on, and it CHANGES as you move', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    expect(container.textContent).toMatch(/Opening/);
    await click(container.querySelector('[aria-label="Forward one point"]'));
    expect(container.textContent).toMatch(/Point 1 of 4/);
    await click(container.querySelector('[aria-label="Forward one point"]'));
    expect(container.textContent).toMatch(/Point 2 of 4/);
    await click(container.querySelector('[aria-label="Back one point"]'));
    expect(container.textContent).toMatch(/Point 1 of 4/);
  });

  it('back is dead at the very top — a speaker is never thrown across the lesson', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    expect(container.querySelector('[aria-label="Back one paragraph"]').disabled).toBe(true);
  });
});

describe('the targets can be hit without looking at them', () => {
  it('every control is at least 44px tall and carries a visible focus ring', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    const controls = [...container.querySelectorAll('[aria-label*="one paragraph"], [aria-label*="one point"]')];
    expect(controls.length).toBe(4);
    for (const c of controls) {
      expect(c.className, 'control is not tall enough to hit blind').toMatch(/min-h-\[44px\]/);
      expect(c.className, 'control has no focus ring').toMatch(/focus-visible:ring/);
    }
  });

  it('the bar stays put while the text scrolls under it', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    const bar = container.querySelector('[aria-label="Back one paragraph"]').parentElement;
    expect(bar.className).toMatch(/sticky/);
  });
});

describe('the body carries the same numbers the list does', () => {
  it('every listed point has a matching anchor in the prose', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    await click(byText(/points in this lesson/));
    const listed = [...container.querySelectorAll('ol li')].length;
    const anchored = [...container.querySelectorAll('[data-point-index]')].length;
    expect(anchored).toBe(listed);
  });

  it('tapping a row moves the read-out to that point', async () => {
    await mount(createElement(LessonReader, { text: TEXT }));
    await click(byText(/points in this lesson/));
    const third = [...container.querySelectorAll('ol li button')][2];
    await click(third);
    expect(container.textContent).toMatch(/Point 3 of 4/);
  });
});

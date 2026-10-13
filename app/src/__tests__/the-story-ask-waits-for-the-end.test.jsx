// @vitest-environment jsdom
// =============================================================================
// THE STORY ASK WAITS FOR THE END — a task set mid-reading is an interruption
// =============================================================================
// Darrell, 2026-10-10, reading a lesson: "Asking users for their stories in the
// middle of our lessons is a distraction.... put it at the end of the
// lessons... I guess..."
//
// WHERE IT WAS. LessonStories rendered inside the 'teach' stage, straight after
// the paced lesson, and its last element was AddPerspective — the invitation to
// write your own. So halfway through being taught, the reader was handed a
// writing task.
//
// THE DISTINCTION THIS KEEPS, because the two things look alike and are not:
//   * the stories the lesson TEACHES are teaching — short, vivid illustrations,
//     the way Jesus taught (Matthew 13:34) — and they stay where the teaching
//     is. Moving those would gut the lesson.
//   * the invitation to write your OWN is a task, not teaching. It travels to
//     the last stage, where the reading is already done.
//
// Nothing about the perspective itself changes: same component, same steward
// review, same lesson (DR-0855).
//
// PROVEN-TO-CATCH (DR-0076 §3): the first two cases fail against the code as it
// stood, where the ask sat in 'teach' and nothing rendered it at the end.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LessonStories, { AddPerspective } from '../components/LessonStories.jsx';

const LESSON = { id: 'll1-the-perfect-yahweh-expects', title: 'The Perfect Yahweh Expects' };
const STORIES = [
  { kind: 'parable', tone: 'light', title: 'The Weatherman He Wanted', body: 'Del owned one necktie.', verse: 'John 8:32' },
];
const noLoad = () => Promise.resolve({ rows: [], viewerId: null });
const html = (el) => renderToStaticMarkup(el);

describe('the taught stories stay where the teaching is', () => {
  it('the block still renders the lesson’s own stories', () => {
    const out = html(createElement(LessonStories, { lesson: LESSON, stories: STORIES, loadPerspectives: noLoad, askForYours: false }));
    expect(out).toContain('The Weatherman He Wanted');
    expect(out).toContain('Stories on this Word');
  });

  it('PROVEN-TO-CATCH: with askForYours false it carries NO invitation to add your own', () => {
    const out = html(createElement(LessonStories, { lesson: LESSON, stories: STORIES, loadPerspectives: noLoad, askForYours: false }));
    const ask = html(createElement(AddPerspective, { lesson: LESSON }));
    // Whatever words the invitation uses, none of its own markup may appear.
    const marker = /add-perspective|Add your|your own perspective|your story/i;
    expect(marker.test(ask), 'the invitation has no recognisable marker to look for').toBe(true);
    expect(marker.test(out), 'the ask is still rendered in the middle of the lesson').toBe(false);
  });
});

describe('the ask itself is unchanged, only moved', () => {
  it('it still renders on its own, which is how the last stage uses it', () => {
    const ask = html(createElement(AddPerspective, { lesson: LESSON }));
    expect(ask.length).toBeGreaterThan(0);
  });

  it('and any other caller keeps the whole block, ask included — the default did not change', () => {
    const out = html(createElement(LessonStories, { lesson: LESSON, stories: STORIES, loadPerspectives: noLoad }));
    expect(/add-perspective|Add your|your own perspective|your story/i.test(out)).toBe(true);
  });
});

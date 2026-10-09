// LessonStories (DR-0855). Darrell 2026-10-09: "What happened to the having two
// stories/parables inside each lesson?!!!!!!" and "As options... a drop down
// like the Word Tabs... so the ability to add another perspective to the same
// Word so all perspectives can see." Pins: every story is its own closed
// dropdown; reviewed perspectives on THIS lesson show to the space, the
// viewer's own waiting one shows only to them, declined and other lessons'
// rows never show; the add form refuses an unlabelled or unconsented true story.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    rpc: async () => ({ data: null, error: null }),
    from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
}));

import LessonStories from '../components/LessonStories.jsx';
import { toggleShowTheWord } from '../lib/show-the-word.js';
import { perspectivesForLesson, perspectiveDraftFor, rowToStory } from '../lib/story-library.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LESSON = { id: 'll999-test-lesson', title: 'Test', anchor: { ref: 'John 4:39; John 4:41' } };
const BODY = 'A woman carried water up the hill every morning for thirty years, and one morning she set the jar down and ran to tell the whole town about the man at the well who told her everything she ever did.';
const STORIES = [
  { kind: 'parable', tone: 'light', title: 'The Jar on the Road', body: BODY, verse: 'John 4:39' },
  { kind: 'parable', tone: 'solemn', title: 'The Last Bucket', body: BODY, verse: 'John 4:41' },
];
const ROWS = [
  { id: 'a', target_lesson_id: LESSON.id, status: 'reviewed', kind: 'testimony', tone: 'solemn', title: 'The Day I Told My Brother', body: BODY, verse: 'John 4:39', source: 'Ruth', submitted_by: 'u2', submitted_name: 'Ruth' },
  { id: 'b', target_lesson_id: LESSON.id, status: 'submitted', kind: 'parable', tone: 'light', title: 'Mine Waiting', body: BODY, verse: 'John 4:41', submitted_by: 'me', submitted_name: 'Me' },
  { id: 'c', target_lesson_id: LESSON.id, status: 'submitted', kind: 'parable', tone: 'light', title: 'Someone Else Waiting', body: BODY, verse: 'John 4:41', submitted_by: 'u3', submitted_name: 'X' },
  { id: 'd', target_lesson_id: LESSON.id, status: 'declined', kind: 'parable', tone: 'light', title: 'Declined One', body: BODY, verse: 'John 4:41', submitted_by: 'u3' },
  { id: 'e', target_lesson_id: 'll1-other', status: 'promoted', kind: 'parable', tone: 'light', title: 'Other Lesson', body: BODY, verse: 'John 4:41', submitted_by: 'u3' },
];

describe('perspectives for one lesson (pure)', () => {
  it('everyone sees reviewed and promoted rows for this lesson; only the writer sees their waiting one', () => {
    const v = perspectivesForLesson(ROWS, { lessonId: LESSON.id, viewerId: 'me' });
    expect(v.shared.map((s) => s.title)).toEqual(['The Day I Told My Brother']);
    expect(v.mine.map((s) => s.title)).toEqual(['Mine Waiting']);
    const other = perspectivesForLesson(ROWS, { lessonId: LESSON.id, viewerId: 'u9' });
    expect(other.mine).toEqual([]);
  });
  it('a true story keeps the name of who lived it; a parable never gains one', () => {
    expect(rowToStory(ROWS[0]).source).toBe('Ruth');
    expect(rowToStory({ ...ROWS[1], source: 'Someone' }).source).toBeUndefined();
  });
  it('a new perspective starts on the lesson with its first anchor verse offered', () => {
    expect(perspectiveDraftFor(LESSON)).toMatchObject({ target_lesson_id: LESSON.id, verse: 'John 4:39', kind: 'testimony' });
  });
});

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = async (props) => { await act(async () => { root.render(createElement(LessonStories, props)); }); await act(async () => {}); };

describe('the lesson renders its stories as options', () => {
  it('each story is its own closed dropdown with its truth label in the summary', async () => {
    await mount({ lesson: LESSON, stories: STORIES, loadPerspectives: async () => ({ rows: [], viewerId: null }) });
    const opts = container.querySelectorAll('[data-testid="lesson-story"]');
    expect(opts.length).toBe(2);
    for (const d of opts) {
      expect(d.tagName).toBe('DETAILS');
      expect(d.open).toBe(false);
      expect(d.querySelector('summary').textContent).toMatch(/Picture this, a parable/);
    }
    expect(opts[0].querySelector('summary').textContent).toContain('The Jar on the Road');
  });
  it('the space sees reviewed perspectives on this lesson, and the viewer sees their own waiting one', async () => {
    await mount({ lesson: LESSON, stories: STORIES, loadPerspectives: async () => ({ rows: ROWS, viewerId: 'me' }) });
    const shared = container.querySelectorAll('[data-testid="shared-perspective"]');
    expect(shared.length).toBe(1);
    expect(shared[0].textContent).toContain('Shared by Ruth');
    expect(shared[0].querySelector('summary').textContent).toMatch(/A true story/);
    const mine = container.querySelectorAll('[data-testid="my-perspective"]');
    expect(mine.length).toBe(1);
    expect(container.textContent).not.toContain('Someone Else Waiting');
    expect(container.textContent).not.toContain('Declined One');
    expect(container.textContent).not.toContain('Other Lesson');
  });
  it('Show the Word opens every story at once, so its verses are actually visible', async () => {
    await mount({ lesson: LESSON, stories: STORIES, loadPerspectives: async () => ({ rows: [], viewerId: null }) });
    await act(async () => { toggleShowTheWord(); });
    const opts = [...container.querySelectorAll('[data-testid="lesson-story"]')];
    expect(opts.every((d) => d.open)).toBe(true);
    await act(async () => { toggleShowTheWord(); });
    expect(opts.every((d) => !d.open)).toBe(true);
  });
  it('a lesson with no stories yet still offers the add-your-perspective dropdown', async () => {
    await mount({ lesson: LESSON, stories: [], loadPerspectives: async () => ({ rows: [], viewerId: null }) });
    expect(container.querySelector('[data-testid="add-perspective"]')).toBeTruthy();
  });
});

describe('adding a perspective is held to the truth-label gate', () => {
  const setInput = (el, value) => act(() => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  it('an empty or unconsented true story is refused with the reasons said in words', async () => {
    await mount({ lesson: LESSON, stories: STORIES, loadPerspectives: async () => ({ rows: [], viewerId: null }) });
    const form = container.querySelector('[data-testid="add-perspective"] form');
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    const errs = container.querySelector('[data-testid="perspective-errors"]').textContent;
    expect(errs).toMatch(/title is required/);
    expect(errs).toMatch(/attributed/);
    expect(errs).toMatch(/consent/);
  });
  it('a complete parable signed out is kept on the device and said so', async () => {
    await mount({ lesson: LESSON, stories: STORIES, loadPerspectives: async () => ({ rows: [], viewerId: null }) });
    const parable = container.querySelector(`input[name="lp-kind-${LESSON.id}"][value="parable"]`);
    await act(async () => { parable.click(); });
    setInput(container.querySelector(`#lp-title-${LESSON.id}`), 'The Jar Left Behind');
    setInput(container.querySelector(`#lp-body-${LESSON.id}`), BODY);
    const form = container.querySelector('[data-testid="add-perspective"] form');
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(container.querySelector('[data-testid="perspective-errors"]')).toBeNull();
    expect(container.querySelector('[data-testid="perspective-notice"]').textContent).toMatch(/Saved on this device/);
  });
});

// @vitest-environment jsdom
// =============================================================================
// The whole Jonah adventure, beginning to end, signed in (DR-1523, J1): a
// child reads the storybook and answers its questions, puts the story in
// order, fills the memory verse, guesses the hero; every stop writes its
// record through the same saver the app uses, the trail lights stop by stop
// with the next one unlocked and the ones after it locked, and the badges
// derive from those rows: Great Fish after the storybook, nothing a tap
// could paint. Signed out, the same journey writes nothing and lights
// nothing (proven to catch).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone from '../components/YouthZone.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { blankWords, weekIndex } from '../lib/youth-zone.js';

vi.mock('../lib/engagement-sync.js', () => ({
  uploadTriviaAnswer: vi.fn(async () => ({})),
  sendMessage: vi.fn(async () => ({})),
  subscribeMessages: vi.fn(() => () => {}),
  getActiveQuestion: vi.fn(async () => null),
  getRecentQuestions: vi.fn(async () => []),
  chooseTriviaSource: vi.fn(() => ({ mode: 'anchor' })),
  checkQuestionFidelity: vi.fn(() => ({ ok: true })),
  retractQuestion: vi.fn(async () => ({})),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const MON = new Date('2026-11-16T15:00:00Z');
const JONAH_2_9 = 'But I will sacrifice unto thee with the voice of thanksgiving; I will pay that that I have vowed. Salvation is of the LORD.';
const VERSES = {
  'Jonah 2:9': JONAH_2_9,
  'Jonah 1:3': 'But Jonah rose up to flee unto Tarshish from the presence of the LORD, and went down to Joppa.',
  'Jonah 3:3': 'So Jonah arose, and went unto Nineveh, according to the word of the LORD.',
  'Jonah 1:17': 'Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights.',
};
const loadVerse = async (ref) => VERSES[ref] || `Words of ${ref} for the test.`;
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  try {
    window.localStorage.clear();
  } catch {
    /* none */
  }
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (sel) => container.querySelector(sel);
const qa = (sel) => [...container.querySelectorAll(sel)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const type = (el, v) =>
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
const states = () => qa('[data-testid^="stop-jonah-"]').map((s) => s.getAttribute('data-state'));

/** The app's own saver and reader, backed by one in-memory table, as a signed-in session sees them. */
function table() {
  const rows = [];
  return {
    rows,
    saveRecord: async (r) => {
      rows.push({ ...r, quizPassed: r.quiz && r.quiz.passed, quizPct: r.quiz && r.quiz.pct });
      return { ok: true };
    },
    fetchRecords: async () => ({ records: rows.slice() }),
  };
}
const mount = (t, signedIn) =>
  act(() =>
    root.render(
      createElement(YouthZone, {
        church: COLG_DEFAULT_CHURCH,
        now: MON,
        loadVerse,
        signedIn,
        fetchRecords: t.fetchRecords,
        saveRecord: t.saveRecord,
        ask: async () => ({ ok: false }),
      })
    )
  );

async function readTheStorybook() {
  click(q('[data-testid="home-trail-next"]'));
  await flush();
  expect(q('[data-testid="storybook"]').getAttribute('data-book')).toBe('jonah');
  for (let i = 0; i < 8; i += 1) click(q('[data-testid="storybook-next"]'));
  click(q('[data-testid="story-q0-o0"]'));
  click(q('[data-testid="story-q1-o0"]'));
  click(q('[data-testid="story-q2-o0"]'));
  click(q('[data-testid="storybook-finish"]'));
  await flush();
}
async function putItInOrder() {
  for (let i = 0; i < 8; i += 1) click(q(`[data-testid="order-card-${i}"]`));
  click(q('[data-testid="order-check"]'));
  await flush();
  expect(q('[data-testid="story-order"]').getAttribute('data-right')).toBe('true');
}
async function learnTheVerse() {
  await flush();
  // The game blanks every fourth word by the week's seed; the answers are the verse's own words.
  const tokens = blankWords(JONAH_2_9, weekIndex(MON)).filter((t) => t.blank);
  const inputs = qa('[data-testid="memory-game"] input');
  expect(inputs.length).toBe(tokens.length);
  inputs.forEach((el, i) => type(el, tokens[i].answer));
  click(q('[data-testid="memory-check"]'));
  await flush();
}
async function guessTheHero() {
  await flush();
  expect(q('[data-testid="who-am-i"]').getAttribute('data-person')).toBe('Jonah');
  click(q('[data-testid="name-Jonah"]'));
  await flush();
  expect(q('[data-testid="who-am-i"]').getAttribute('data-solved')).toBe('true');
}

describe('the Jonah adventure from beginning to end', () => {
  it('signed in: every stop writes its record, the trail unlocks stop by stop, and the badges derive from the rows', async () => {
    const t = table();
    await mount(t, true);
    await flush();
    expect(q('[data-testid="home-trail-next"]').textContent).toContain('Read the story');

    // 1. Read the story and answer the questions.
    await readTheStorybook();
    expect(t.rows.map((r) => r.lessonId)).toEqual(['storybook-jonah']);
    expect(t.rows[0].quiz.passed).toBe(true);
    expect(q('[data-testid="storybook-saved"]').textContent).toContain('lit');
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(states()).toEqual(['lit', 'next', 'locked', 'locked', 'soon']);
    expect(q('[data-testid="badge-great-fish"]').getAttribute('data-earned')).toBe('true');
    expect(q('[data-testid="badge-three-stories"]').getAttribute('data-earned')).toBe('false');
    expect(q('[data-testid="badge-front-row"]').getAttribute('data-earned')).toBe('false');
    // A locked stop does not open; the next one does.
    click(q('[data-testid="stop-jonah-verse"] button'));
    expect(q('[data-testid="memory-section"]')).toBeNull();
    click(q('[data-testid="stop-jonah-order"] button'));

    // 2. Put it in order.
    await putItInOrder();
    expect(t.rows.map((r) => r.lessonId)).toEqual(['storybook-jonah', 'order-jonah']);
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(states()).toEqual(['lit', 'lit', 'next', 'locked', 'soon']);
    click(q('[data-testid="stop-jonah-verse"] button'));

    // 3. Learn the verse.
    expect(q('[data-testid="memory-section"]').getAttribute('data-verse')).toBe('Jonah 2:9');
    await learnTheVerse();
    expect(q('[data-testid="memory-result"]').textContent).toMatch(/Every word right/);
    expect(t.rows.map((r) => r.lessonId)).toEqual(['storybook-jonah', 'order-jonah', 'memory-jonah']);
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(states()).toEqual(['lit', 'lit', 'lit', 'next', 'soon']);
    click(q('[data-testid="stop-jonah-hero"] button'));

    // 4. Who am I? on Jonah himself.
    await guessTheHero();
    expect(t.rows.map((r) => r.lessonId)).toEqual(['storybook-jonah', 'order-jonah', 'memory-jonah', 'whoami-jonah']);
    for (const r of t.rows) {
      expect(r.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(r.ageBand).toBe('child');
    }
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(states()).toEqual(['lit', 'lit', 'lit', 'lit', 'soon']);
    expect(q('[data-testid="trail-jonah"]').getAttribute('data-done')).toBe('true');
    expect(q('[data-testid="trail-jonah-done"]')).toBeTruthy();
    // The home now says the trail is walked: no next stop to name.
    click(q('[data-testid="kids-tab-adventure"]'));
    expect(q('[data-testid="home-trail-next"]')).toBeNull();
    // The reader of record agrees with the writer: a fresh mount from the table shows the same.
    await mount(table(), true);
    await flush();
    await mount(t, true);
    await flush();
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(q('[data-testid="trail-jonah"]').getAttribute('data-lit')).toBe('4');
    // Four rows, each completed at the child band with a passed quiz: First Step, Quiz Star, Three in a Row, Little Reader, Great Fish.
    expect(qa('[data-testid^="badge-"][data-earned="true"]').map((b) => b.getAttribute('data-testid'))).toEqual([
      'badge-first-step',
      'badge-first-quiz',
      'badge-three-quizzes',
      'badge-kids-reader',
      'badge-great-fish',
    ]);
  });
  it('PROVEN-TO-CATCH: signed out, the same journey writes nothing and lights nothing', async () => {
    const t = table();
    await mount(t, false);
    await flush();
    await readTheStorybook();
    expect(t.rows).toEqual([]);
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-order"]'));
    await putItInOrder();
    expect(t.rows).toEqual([]);
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(states()).toEqual(['next', 'locked', 'locked', 'locked', 'soon']);
    expect(q('[data-testid="badge-shelf"]').getAttribute('data-earned')).toBe('0');
  });
});

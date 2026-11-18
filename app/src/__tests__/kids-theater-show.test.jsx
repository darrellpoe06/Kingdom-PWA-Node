// @vitest-environment jsdom
// =============================================================================
// The Theater plays today (Darrell, 2026-11-18, on three COMING SOON rows:
// "Theater?!!!!!"): until an episode is published, every adventure row has
// PLAY, which runs the storybook inside the Theater as a read-aloud show that
// starts reading on its own, turns its own pages, and writes the same record
// the storybook writes. The episode's state is a line under the title, not
// the headline. A published episode keeps WATCH.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import Theater from '../components/kids/Theater.jsx';
import YouthZone from '../components/YouthZone.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { EPISODES } from '../lib/kids/theater.js';

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
const loadVerse = async (ref) => `Words of ${ref} for the test.`;
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
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (sel) => container.querySelector(sel);
const qa = (sel) => [...container.querySelectorAll(sel)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

function fakeTts() {
  const spoken = [];
  let state = { status: 'idle' };
  const subs = new Set();
  const set = (s) => {
    state = s;
    subs.forEach((f) => f());
  };
  return {
    spoken,
    set,
    useTts() {
      const s = useSyncExternalStore(
        (f) => {
          subs.add(f);
          return () => subs.delete(f);
        },
        () => state
      );
      return {
        supported: true,
        isReading: s.status !== 'idle',
        isPaused: false,
        segmentIndex: 0,
        failed: false,
        speak: (t) => {
          spoken.push(t);
          set({ status: 'speaking' });
        },
        stop: () => set({ status: 'idle' }),
        pause: () => {},
        resume: () => {},
      };
    },
  };
}

describe('the Theater plays the adventures today', () => {
  it('every unpublished row has PLAY and says the episode is to come; PLAY opens the storybook as a show that starts reading on its own', async () => {
    const tts = fakeTts();
    await act(() => root.render(createElement(Theater, { church: COLG_DEFAULT_CHURCH, storybook: { loadVerse, useTts: tts.useTts } })));
    expect(qa('[data-testid^="episode-"][data-status]').length).toBe(3);
    expect(qa('[data-testid^="episode-"][data-testid$="-play"]').length).toBe(3);
    expect(q('[data-testid="episode-jonah"]').textContent).toMatch(/read aloud now · episode coming soon/);
    expect(q('[data-testid="theater-shelf"] h3').textContent).toMatch(/read aloud now · episodes to come/);
    expect(q('[data-testid="theater-show"]')).toBeNull();
    click(q('[data-testid="episode-jonah-play"]'));
    await flush();
    const show = q('[data-testid="theater-show"]');
    expect(show.getAttribute('data-book')).toBe('jonah');
    expect(show.textContent).toMatch(/Now playing: Jonah and the Great Fish/);
    expect(show.querySelector('[data-testid="storybook"]').getAttribute('data-book')).toBe('jonah');
    // It started reading by itself: the first page's words went to the reader.
    expect(show.querySelector('[data-testid="storybook"]').getAttribute('data-auto')).toBe('true');
    expect(tts.spoken).toEqual(['Words of Jonah 1:1-3 for the test.']);
    // Back closes the show.
    click(show.querySelector('[data-testid="storybook-back"]'));
    expect(q('[data-testid="theater-show"]')).toBeNull();
  });
  it('a published episode keeps WATCH and no PLAY; the Read buttons still open the storybooks', async () => {
    const opened = [];
    const live = [{ ...EPISODES[0], status: 'published', source: 'https://www.youtube.com/watch?v=abcdefg' }, EPISODES[1], EPISODES[2]];
    await act(() => root.render(createElement(Theater, { church: COLG_DEFAULT_CHURCH, episodes: live, onOpenStorybook: (id) => opened.push(id) })));
    expect(q('[data-testid="episode-jonah-play"]')).toBeNull();
    expect(q('[data-testid="episode-jonah"]').textContent).toMatch(/WATCH/);
    expect(q('[data-testid="episode-noah-play"]')).toBeTruthy();
    click(q('[data-testid="theater-read-noah"]'));
    expect(opened).toEqual(['noah']);
  });
  it('inside the zone, a show finished signed in writes the storybook record and lights the trail', async () => {
    const saves = [];
    await act(() =>
      root.render(
        createElement(YouthZone, {
          church: COLG_DEFAULT_CHURCH,
          now: new Date('2026-11-16T15:00:00Z'),
          loadVerse,
          signedIn: true,
          fetchRecords: async () => ({ records: [] }),
          saveRecord: async (r) => (saves.push(r), { ok: true }),
          ask: async () => ({ ok: false }),
        })
      )
    );
    await flush();
    click(q('[data-testid="kids-tab-theater"]'));
    click(q('[data-testid="episode-jonah-play"]'));
    await flush();
    const show = q('[data-testid="theater-show"]');
    expect(show).toBeTruthy();
    for (let i = 0; i < 8; i += 1) click(show.querySelector('[data-testid="storybook-next"]'));
    click(show.querySelector('[data-testid="story-q0-o0"]'));
    click(show.querySelector('[data-testid="story-q1-o0"]'));
    click(show.querySelector('[data-testid="story-q2-o0"]'));
    click(show.querySelector('[data-testid="storybook-finish"]'));
    await flush();
    expect(saves.map((s) => s.lessonId)).toEqual(['storybook-jonah']);
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(q('[data-testid="stop-jonah-read"]').getAttribute('data-state')).toBe('lit');
  });
});

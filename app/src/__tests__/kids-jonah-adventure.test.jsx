// @vitest-environment jsdom
// =============================================================================
// J1 of the Jonah adventure (DR-1523): the storybook turns its pages (tap,
// swipe, arrow keys), Read to me reads the verse, then the caption, then
// turns the page by itself, and the sentence being read is lit; the last
// page hands the memory verse to the memory verse game; Put the story in
// order is graded from the pages' own order and writes its record; the trail
// lights from rows, the guide waits at the next stop, a locked stop says
// what to finish first; the Theater plays a file of our own with captions and
// tells the zone when a child watched to the end; the Word builder and the
// memory verse game offer the storybooks' verses. Every proof is shown to
// catch: nothing lights without its row.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone from '../components/YouthZone.jsx';
import Storybook, { swipeDirection, sentencesOf } from '../components/kids/Storybook.jsx';
import Theater from '../components/kids/Theater.jsx';
import { MemoryVerseGame } from '../components/kids/MemoryAndBadges.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { EPISODES } from '../lib/kids/theater.js';
import { STORYBOOKS, orderShuffle } from '../lib/kids/storybooks.js';
import { blankWords } from '../lib/youth-zone.js';

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
const VERSES = {
  'Jonah 1:1-3': 'Now the word of the LORD came unto Jonah the son of Amittai, saying, Arise, go to Nineveh, that great city.',
  'Jonah 1:4': 'But the LORD sent out a great wind into the sea, and there was a mighty tempest in the sea, so that the ship was like to be broken.',
  'Jonah 1:17': 'Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights.',
  'Jonah 2:9': 'But I will sacrifice unto thee with the voice of thanksgiving; I will pay that that I have vowed. Salvation is of the LORD.',
  'Psalm 23:1': 'The LORD is my shepherd; I shall not want.',
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
  vi.useRealTimers();
});
const q = (sel) => container.querySelector(sel);
const qa = (sel) => [...container.querySelectorAll(sel)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const key = (el, k) => act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
const touch = (el, type, x, y) =>
  act(() => {
    const e = new Event(type, { bubbles: true });
    const list = [{ clientX: x, clientY: y }];
    Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : list });
    Object.defineProperty(e, 'changedTouches', { value: list });
    el.dispatchEvent(e);
  });
const mount = (props = {}) =>
  act(() =>
    root.render(
      createElement(YouthZone, {
        church: COLG_DEFAULT_CHURCH,
        now: MON,
        loadVerse,
        fetchRecords: async () => ({ records: [] }),
        saveRecord: async () => ({ ok: true }),
        ask: async () => ({ ok: false }),
        ...props,
      })
    )
  );

/** A reader the test drives: speak() records and starts; the test ends a reading by setting idle. */
function fakeTts() {
  let state = { status: 'idle', segmentIndex: 0 };
  const subs = new Set();
  const spoken = [];
  const set = (patch) => {
    state = { ...state, ...patch };
    subs.forEach((f) => f());
  };
  const api = {
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
        isPaused: s.status === 'paused',
        segmentIndex: s.segmentIndex,
        speak: (text) => {
          spoken.push(text);
          set({ status: 'speaking', segmentIndex: 0 });
        },
        stop: () => set({ status: 'idle' }),
        pause: () => set({ status: 'paused' }),
        resume: () => set({ status: 'speaking' }),
      };
    },
  };
  return api;
}
let mounts = 0;
const mountBook = (props = {}) =>
  act(() =>
    root.render(
      createElement(Storybook, { key: `book-${(mounts += 1)}`, bookId: 'jonah', loadVerse, signedIn: false, saveRecord: async () => ({ ok: true }), ...props })
    )
  );

describe('the storybook turns its pages', () => {
  it('a tap, the arrow keys and a swipe turn the page; the book wears the turn for a moment; a short swipe is a tap', async () => {
    vi.useFakeTimers();
    await mountBook();
    await flush();
    const book = () => q('[data-testid="storybook-book"]');
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('0');
    click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('1');
    expect(book().getAttribute('data-turn')).toBe('next');
    act(() => vi.advanceTimersByTime(500));
    expect(book().getAttribute('data-turn')).toBe('');
    key(book(), 'ArrowRight');
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('2');
    key(book(), 'ArrowLeft');
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('1');
    expect(book().getAttribute('data-turn')).toBe('prev');
    touch(book(), 'touchstart', 300, 100);
    touch(book(), 'touchend', 120, 110);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('2');
    touch(book(), 'touchstart', 100, 100);
    touch(book(), 'touchend', 280, 100);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('1');
    touch(book(), 'touchstart', 100, 100);
    touch(book(), 'touchend', 120, 100);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('1');
    // A vertical scroll is not a page turn.
    touch(book(), 'touchstart', 100, 100);
    touch(book(), 'touchend', 40, 400);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('1');
    expect(book().getAttribute('aria-label')).toMatch(/page 2 of 8/);
    expect(q('[data-testid="storybook-pn"]').getAttribute('aria-live')).toBe('polite');
  });
  it("swipeDirection: left is next, right is back, short or mostly vertical is nothing; sentences are the reader's own segments", () => {
    expect(swipeDirection(-80, 5)).toBe('next');
    expect(swipeDirection(80, 5)).toBe('prev');
    expect(swipeDirection(-20, 0)).toBeNull();
    expect(swipeDirection(-80, 90)).toBeNull();
    const parts = sentencesOf(VERSES['Jonah 1:17']);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join(' ')).toBe(VERSES['Jonah 1:17']);
  });
});

describe('Read to me', () => {
  it('reads the verse, then the caption, then turns the page by itself; the sentence being read is lit; Stop stops it', async () => {
    const tts = fakeTts();
    await mountBook({ useTts: tts.useTts });
    await flush();
    const book = STORYBOOKS[0];
    // Page 3 (Jonah 1:17) has two sentences, so the lit sentence can move.
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook-read-to-me"]').getAttribute('aria-pressed')).toBe('false');
    click(q('[data-testid="storybook-read-to-me"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-auto')).toBe('true');
    expect(tts.spoken).toEqual([VERSES['Jonah 1:17']]);
    // The verse is being read: its first sentence is lit, the caption is not.
    expect(q('[data-testid="storybook-verse"] .kz-sent.on').getAttribute('data-sentence')).toBe('0');
    expect(q('[data-testid="storybook-caption"] .kz-sent.on')).toBeNull();
    act(() => tts.set({ segmentIndex: 1 }));
    expect(q('[data-testid="storybook-verse"] .kz-sent.on').getAttribute('data-sentence')).toBe('1');
    expect(q('[data-testid="storybook-verse"]').textContent).toBe(VERSES['Jonah 1:17']);
    // The verse ends: the caption is read, and lit in the bubble.
    act(() => tts.set({ status: 'idle' }));
    expect(tts.spoken[1]).toBe(book.pages[2].caption);
    expect(q('[data-testid="storybook-caption"] .kz-sent.on')).toBeTruthy();
    expect(q('[data-testid="storybook-verse"] .kz-sent.on')).toBeNull();
    // The caption ends: the page turns and the next verse is read.
    act(() => tts.set({ status: 'idle' }));
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('3');
    expect(tts.spoken[2]).toBe('Words of Jonah 2:1 for the test.');
    // Pause and resume live in the reader bar while it reads.
    click(q('[data-testid="storybook-pause"]'));
    expect(q('[data-testid="storybook-pause"]').getAttribute('aria-pressed')).toBe('true');
    click(q('[data-testid="storybook-pause"]'));
    expect(q('[data-testid="storybook-pause"]').getAttribute('aria-pressed')).toBe('false');
    // Stop reading: the reader stops, nothing more is spoken, the page stays.
    click(q('[data-testid="storybook-read-to-me"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-auto')).toBe('false');
    const n = tts.spoken.length;
    act(() => tts.set({ status: 'idle' }));
    expect(tts.spoken.length).toBe(n);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('3');
    expect(q('[data-testid="storybook-reader-bar"]')).toBeNull();
  });
  it('Hear this page reads this page only and does not start the whole book; without a reader both are disabled', async () => {
    const tts = fakeTts();
    await mountBook({ useTts: tts.useTts });
    await flush();
    click(q('[data-testid="storybook-hear"]'));
    expect(tts.spoken).toEqual([VERSES['Jonah 1:1-3']]);
    act(() => tts.set({ status: 'idle' }));
    expect(tts.spoken.length).toBe(1);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('0');
    await mountBook();
    await flush();
    expect(q('[data-testid="storybook-read-to-me"]').disabled).toBe(true);
    expect(q('[data-testid="storybook-hear"]').disabled).toBe(true);
  });
  it('the last page offers the memory verse to the memory verse game; without a home for it, no button', async () => {
    const learned = [];
    await mountBook({ onLearnVerse: (b) => learned.push(b.memory) });
    await flush();
    for (let i = 0; i < 8; i += 1) click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook-questions"]')).toBeTruthy();
    expect(q('[data-testid="storybook-learn-verse"]').textContent).toContain('Jonah 2:9');
    click(q('[data-testid="storybook-learn-verse"]'));
    expect(learned).toEqual(['Jonah 2:9']);
    await mountBook();
    await flush();
    for (let i = 0; i < 8; i += 1) click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook-learn-verse"]')).toBeNull();
  });
});

describe('Put the story in order', () => {
  it('the games grid opens it; the cards come shuffled; the shuffled order is not yet; the right order is, and signed in it writes order-jonah', async () => {
    const saves = [];
    await mount({ signedIn: true, saveRecord: async (r) => (saves.push(r), { ok: true }) });
    await flush();
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-order"]'));
    expect(q('[data-testid="story-order"]').getAttribute('data-book')).toBe('jonah');
    const cards = qa('[data-testid^="order-card-"]');
    expect(cards.length).toBe(8);
    const shown = cards.map((c) => Number(c.getAttribute('data-testid').slice(11)));
    expect(shown.every((v, i) => v === i)).toBe(false);
    expect(q('[data-testid="order-check"]').disabled).toBe(true);
    for (const c of cards) click(c);
    expect(q('[data-testid="story-order"]').getAttribute('data-placed')).toBe('8');
    click(q('[data-testid="order-check"]'));
    await flush();
    expect(q('[data-testid="order-says"]').textContent).toMatch(/not yet/i);
    expect(q('[data-testid="story-order"]').getAttribute('data-right')).toBe('false');
    expect(saves).toEqual([]);
    // The pages from the first slip on come back; place every page in the Word's order.
    for (let i = 0; i < 8; i += 1) {
      const placed = q(`[data-testid="order-placed-${i}"]`);
      if (!placed) click(q(`[data-testid="order-card-${i}"]`));
    }
    click(q('[data-testid="order-check"]'));
    await flush();
    expect(q('[data-testid="story-order"]').getAttribute('data-right')).toBe('true');
    expect(q('[data-testid="order-says"]').textContent).toMatch(/Yes/);
    expect(saves.map((s) => s.lessonId)).toEqual(['order-jonah']);
    expect(saves[0].courseKey).toBe('kids-games');
    expect(q('[data-testid="order-saved"]').textContent).toContain('lit');
    // The trail counted it at once: Jonah's trail shows the stop lit and the next one along.
    click(q('[data-testid="kids-tab-badges"]'));
    expect(q('[data-testid="stop-jonah-order"]').getAttribute('data-state')).toBe('lit');
    // Another story is a tap away.
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-order"]'));
    click(q('[data-testid="order-pick-noah"]'));
    expect(q('[data-testid="story-order"]').getAttribute('data-book')).toBe('noah');
  });
  it('signed out, a right order says sign in and writes nothing', async () => {
    const saves = [];
    await mount({ signedIn: false, saveRecord: async (r) => (saves.push(r), { ok: true }) });
    await flush();
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-order"]'));
    for (let i = 0; i < 8; i += 1) click(q(`[data-testid="order-card-${i}"]`));
    click(q('[data-testid="order-check"]'));
    await flush();
    expect(q('[data-testid="story-order"]').getAttribute('data-right')).toBe('true');
    expect(saves).toEqual([]);
    expect(q('[data-testid="order-saved"]').textContent).toContain('Sign in');
    expect(orderShuffle(STORYBOOKS[0], 0).length).toBe(8);
  });
});

describe('the trail', () => {
  const row = (lessonId, courseKey) => ({ lesson_id: lessonId, course_key: courseKey, completed_at: '2026-11-14T10:00:00Z', age_band: 'child' });
  it('signed out: nothing lit, the first stop is next; the home names it and opens the storybook', async () => {
    await mount();
    await flush();
    expect(q('[data-testid="home-trail-next"]').textContent).toContain('Read the story');
    click(q('[data-testid="home-trail-next"]'));
    await flush();
    expect(q('[data-testid="storybook"]').getAttribute('data-book')).toBe('jonah');
    click(q('[data-testid="kids-tab-badges"]'));
    const trail = q('[data-testid="trail-jonah"]');
    expect(trail.getAttribute('data-lit')).toBe('0');
    expect(qa('[data-testid^="stop-jonah-"]').map((s) => s.getAttribute('data-state'))).toEqual(['next', 'locked', 'locked', 'locked', 'soon']);
    expect(q('[data-testid="trail-noah"]').classList.contains('compact')).toBe(true);
  });
  it('signed in: the rows light exactly their stops; the guide waits at the next; a locked stop says what to finish first; the next opens', async () => {
    await mount({
      signedIn: true,
      fetchRecords: async () => ({ records: [row('storybook-jonah', 'kids-storybooks'), row('storybook-noah', 'kids-storybooks')] }),
    });
    await flush();
    expect(q('[data-testid="home-trail-next"]').textContent).toContain('Put it in order');
    click(q('[data-testid="kids-tab-badges"]'));
    expect(q('[data-testid="trail-jonah"]').getAttribute('data-lit')).toBe('1');
    expect(qa('[data-testid^="stop-jonah-"]').map((s) => s.getAttribute('data-state'))).toEqual(['lit', 'next', 'locked', 'locked', 'soon']);
    expect(q('[data-testid="stop-jonah-order"] img[data-interim="true"]')).toBeTruthy();
    expect(q('[data-testid="trail-noah"]').getAttribute('data-lit')).toBe('1');
    click(q('[data-testid="stop-jonah-verse"] button'));
    expect(q('[data-testid="trail-jonah-says"]').textContent).toMatch(/Finish "Put it in order" first/);
    expect(q('[data-testid="story-order"]')).toBeNull();
    click(q('[data-testid="stop-jonah-watch"] button'));
    expect(q('[data-testid="trail-jonah-says"]').textContent).toMatch(/coming soon/i);
    click(q('[data-testid="stop-jonah-order"] button'));
    expect(q('[data-testid="story-order"]').getAttribute('data-book')).toBe('jonah');
  });
  it('PROVEN-TO-CATCH: a row for a lesson, not the adventure, lights no stop', async () => {
    await mount({ signedIn: true, fetchRecords: async () => ({ records: [row('ll1', 'living-lessons'), row('storybook-david', 'kids-storybooks')] }) });
    await flush();
    click(q('[data-testid="kids-tab-badges"]'));
    await flush();
    expect(q('[data-testid="trail-jonah"]').getAttribute('data-lit')).toBe('0');
  });
});

describe('the Theater plays a file of our own', () => {
  const file = {
    ...EPISODES[0],
    status: 'published',
    source: 'lovecorner/kids/episodes/jonah.mp4',
    poster: 'lovecorner/kids/episodes/jonah-poster.jpg',
    captions: 'lovecorner/kids/episodes/jonah.en.vtt',
  };
  it('a published file episode is Now showing with its poster; play opens a video with captions; the end tells the zone', async () => {
    const watched = [];
    await act(() => root.render(createElement(Theater, { church: COLG_DEFAULT_CHURCH, episodes: [file, EPISODES[1]], onWatched: (e) => watched.push(e.id) })));
    expect(q('[data-testid="theater"]').getAttribute('data-now')).toBe('episode');
    expect(q('[data-testid="theater-now"]').textContent).toContain('Jonah and the Great Fish');
    const poster = q('.kz-poster-art');
    expect(poster.getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah-poster.jpg');
    expect(poster.getAttribute('data-interim')).toBe('false');
    expect(q('[data-testid="episode-jonah"]').getAttribute('data-status')).toBe('published');
    click(q('[data-testid="theater-play"]'));
    const video = q('[data-testid="theater-video"]');
    expect(video).toBeTruthy();
    expect(video.getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah.mp4');
    expect(video.querySelector('track[kind="captions"]').getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah.en.vtt');
    expect(q('[data-testid="theater-player"]')).toBeNull();
    act(() => video.dispatchEvent(new Event('ended')));
    expect(watched).toEqual(['jonah']);
  });
  it('a YouTube episode still plays in the embed, and never claims a watch', async () => {
    const watched = [];
    const yt = { ...EPISODES[0], status: 'published', source: 'https://www.youtube.com/watch?v=abcdefg' };
    await act(() => root.render(createElement(Theater, { church: COLG_DEFAULT_CHURCH, episodes: [yt], onWatched: (e) => watched.push(e.id) })));
    expect(q('.kz-poster-art').getAttribute('data-interim')).toBe('true');
    click(q('[data-testid="theater-play"]'));
    expect(q('[data-testid="theater-player"]').getAttribute('src')).toBe('https://www.youtube.com/embed/abcdefg?rel=0');
    expect(q('[data-testid="theater-video"]')).toBeNull();
    expect(watched).toEqual([]);
  });
});

describe('the memory verse and the Word builder carry the storybooks', () => {
  it("the memory verse game offers this week's verse and each story's verse; Jonah 2:9 is a tap away and the storybook's last page lands on it", async () => {
    await mount();
    await flush();
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-memory"]'));
    expect(q('[data-testid="memory-section"]').getAttribute('data-verse')).toBe('Psalm 23:1');
    click(q('[data-testid="memory-pick-jonah"]'));
    await flush();
    expect(q('[data-testid="memory-section"]').getAttribute('data-verse')).toBe('Jonah 2:9');
    expect(q('[data-testid="memory-game"] .yz-verse').textContent).toContain('Salvation');
    click(q('[data-testid="memory-pick-week"]'));
    await flush();
    expect(q('[data-testid="memory-section"]').getAttribute('data-verse')).toBe('Psalm 23:1');
    click(q('[data-testid="kids-back"]'));
    click(q('[data-testid="tile-story-jonah"]'));
    await flush();
    for (let i = 0; i < 8; i += 1) click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-learn-verse"]'));
    await flush();
    expect(q('[data-testid="memory-section"]').getAttribute('data-verse')).toBe('Jonah 2:9');
  });
  it('every word right tells the zone once; a miss tells nothing', async () => {
    const won = [];
    await act(() => root.render(createElement(MemoryVerseGame, { verseRef: 'Jonah 2:9', seed: 3, load: loadVerse, onSuccess: (r) => won.push(r) })));
    await flush();
    const tokens = blankWords(VERSES['Jonah 2:9'], 3).filter((t) => t.blank);
    const inputs = qa('[data-testid="memory-game"] input');
    expect(inputs.length).toBe(tokens.length);
    const type = (el, v) =>
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    type(inputs[0], 'nope');
    act(() => q('[data-testid="memory-check"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(won).toEqual([]);
    qa('[data-testid="memory-game"] input').forEach((el, i) => type(el, tokens[i].answer));
    act(() => q('[data-testid="memory-check"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(q('[data-testid="memory-result"]').textContent).toMatch(/Every word right/);
    expect(won).toEqual(['Jonah 2:9']);
    act(() => q('[data-testid="memory-check"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(won).toEqual(['Jonah 2:9']);
  });
  it("the Word builder offers this week's verse and each story's key verse, and spells from the one chosen", async () => {
    await mount();
    await flush();
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="tile-builder"]'));
    await flush();
    expect(qa('[data-testid^="builder-verse-"]').map((b) => b.textContent)).toEqual(['This week', 'Jonah', 'Noah', 'David']);
    expect(q('[data-testid="word-builder"] .kz-ref').textContent).toContain('Psalm 23:1');
    click(q('[data-testid="builder-verse-jonah"]'));
    await flush();
    expect(q('[data-testid="builder-verse-jonah"]').getAttribute('aria-selected')).toBe('true');
    expect(q('[data-testid="word-builder"] .kz-ref').textContent).toContain('Jonah 1:17');
    expect(q('[data-testid="spell-round"]')).toBeTruthy();
  });
});

// @vitest-environment jsdom
// =============================================================================
// The Kids Zone renders real things (DR-1508): the doors switch between the
// Kids and Teens worlds; every tile opens a real surface; a storybook page is
// the loaded verse, its questions grade from the Word, and finishing writes
// the record only when signed in; the Theater is honest about what plays;
// the games read the loaded verse; the Grown-ups page carries the lesson's
// own facilitator notes; every character appearance is a landed render, the
// interim reference cutout, or a labeled slot; no profile, chat with anyone
// or scoreboard string exists anywhere. Copy and behavior are tested together.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone from '../components/YouthZone.jsx';
import Storybook from '../components/kids/Storybook.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { SHOT_LIST, landedFile } from '../lib/kids/guides.js';
import { STORYBOOKS } from '../lib/kids/storybooks.js';
import { weeklyLesson } from '../lib/youth-zone.js';
import { moduleFor, leadLines } from '../components/kids/GrownUps.jsx';

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
  'Psalm 23:1': 'The LORD is my shepherd; I shall not want.',
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

describe('the doors and the worlds', () => {
  it('Kids opens the Kids Zone, Teens the Teens Zone, Little Ones the Kids Zone at the little door; the choice is remembered on the device', () => {
    mount();
    expect(q('[data-testid="kids-zone"]').getAttribute('data-door')).toBe('kids');
    click(q('[data-testid="door-teens"]'));
    expect(q('[data-testid="teens-zone"]')).toBeTruthy();
    expect(q('[data-testid="teens-zone"]').getAttribute('data-band')).toBe('youth');
    click(q('[data-testid="door-little"]'));
    expect(q('[data-testid="kids-zone"]').getAttribute('data-door')).toBe('little');
    expect(window.localStorage.getItem('poetech.youth.door')).toBe('little');
  });
  it('has no profile, chat with anyone, leaderboard or scoreboard anywhere, and says so', () => {
    mount();
    expect(q('[data-testid="youth-safety"]').textContent).toContain('no profile, no chat, no scoreboard');
    expect(container.textContent).not.toMatch(/leaderboard|send a message|your profile|high score/i);
  });
  it('every character on the home is the approved reference or a slot that names its render; no guide is named until Darrell names them', () => {
    mount();
    const faces = qa('img[data-interim="true"]');
    expect(faces.length).toBeGreaterThan(0);
    for (const f of faces) expect(f.getAttribute('src')).toMatch(/\/lovecorner\/kids\//);
    const slots = qa('[data-needed="true"]');
    expect(slots.length).toBeGreaterThan(0);
    const ids = new Set(SHOT_LIST.map((s) => s.id));
    for (const s of slots)
      if (s.getAttribute('data-shot') !== 'lesson-scene' && s.getAttribute('data-shot') !== 'teen-guides' && s.getAttribute('data-shot') !== 'teen-summit')
        expect(ids.has(s.getAttribute('data-shot')), s.getAttribute('data-shot')).toBe(true);
    expect(container.querySelector('svg[data-art]')).toBeNull();
  });
  it('a landed render replaces the interim cutout in the same slot (the registry decides)', () => {
    const landed = SHOT_LIST.map((s) => (s.id === 'girl-wave' ? { ...s, status: 'landed' } : s));
    mount({ shotList: landed });
    const img = q('[data-testid="meet-guides"] img[data-shot="girl-wave"]');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('/lovecorner/kids/girl-wave.png');
  });
});

describe('every children\'s lesson, chosen by age (2026-11-24)', () => {
  it('the home keeps this week\'s lesson, names who it is for, and opens the library beside it', () => {
    mount();
    expect(q('[data-testid="weekly-lesson-open"]').textContent).toContain('for Kids 6–10');
    expect(q('[data-testid="home-library"]').textContent).toContain('Little Ones 3–6');
    click(q('[data-testid="home-library"]'));
    expect(q('[data-testid="lesson-library"]').getAttribute('data-age')).toBe('child');
    expect(qa('[data-testid^="library-age-"]').map((b) => b.getAttribute('data-testid').slice(12))).toEqual(['little', 'child', 'youth', 'teen']);
    expect(qa('[data-testid^="library-lesson-"]').length).toBe(24);
    click(q('[data-testid="library-more"]'));
    expect(qa('[data-testid^="library-lesson-"]').length).toBe(48);
  });
  it('picking an age and a lesson opens THAT lesson at THAT age, and back returns to the library', () => {
    mount();
    click(q('[data-testid="home-library"]'));
    click(q('[data-testid="library-age-teen"]'));
    expect(q('[data-testid="library-age-teen"]').getAttribute('aria-selected')).toBe('true');
    const first = q('[data-testid^="library-lesson-"]');
    const id = first.getAttribute('data-testid').slice(15);
    click(first);
    expect(q('[data-testid="kids-adventure"]').getAttribute('data-lesson')).toBe(id);
    expect(q('[data-testid="kids-adventure"]').getAttribute('data-band')).toBe('teen');
  });
  it('the dock carries LESSONS: one tap from anywhere opens the library, and a lesson\'s back returns to it', () => {
    mount();
    click(q('[data-testid="kids-tab-games"]'));
    click(q('[data-testid="kids-tab-lessons"]'));
    expect(q('[data-testid="kids-tab-lessons"]').getAttribute('aria-selected')).toBe('true');
    click(q('[data-testid^="library-lesson-"]'));
    expect(q('[data-testid="kids-adventure"]').getAttribute('data-band')).toBe('child');
    const back = q('[data-testid="adventure-exit"]');
    expect(back.textContent.trim()).toBe('◀ All lessons');
    click(back);
    expect(q('[data-testid="lesson-library"]')).toBeTruthy();
  });
  it('the Little Ones door opens the library on Little Learners, in teaching order', () => {
    mount();
    click(q('[data-testid="door-little"]'));
    click(q('[data-testid="home-library"]'));
    expect(q('[data-testid="lesson-library"]').getAttribute('data-age')).toBe('little');
    expect(q('[data-testid^="library-lesson-"]').getAttribute('data-testid')).toBe('library-lesson-lil1-a-is-for-adam-who-named-the-animals');
  });
});

describe('the tiles open real things', () => {
  it('the dock and the home tiles open the Theater, the games, the storybook and the grown-ups page', async () => {
    mount();
    click(q('[data-testid="tile-theater"]'));
    expect(q('[data-testid="theater"]').getAttribute('data-now')).toBe('channel');
    expect(q('[data-testid="theater-now"]').textContent).toMatch(/the church channel/i);
    expect(q('[data-testid="episode-jonah"]').getAttribute('data-status')).toBe('planned');
    expect(q('[data-testid="theater-channel"]').getAttribute('href')).toBe(COLG_DEFAULT_CHURCH.media.youtube);
    click(q('[data-testid="theater-read-jonah"]'));
    await flush();
    expect(q('[data-testid="storybook"]').getAttribute('data-book')).toBe('jonah');
    click(q('[data-testid="kids-tab-games"]'));
    expect(q('[data-testid="games-grid"]')).toBeTruthy();
    click(q('[data-testid="tile-builder"]'));
    await flush();
    expect(q('[data-testid="word-builder"]')).toBeTruthy();
    expect(q('[data-testid="spell-round"]').getAttribute('data-word')).toBe('lord');
    click(q('[data-testid="kids-back"]'));
    click(q('[data-testid="tile-whoami"]'));
    await flush();
    expect(q('[data-testid="who-am-i"]')).toBeTruthy();
    expect(qa('[data-testid^="name-"]').length).toBe(4);
    click(q('[data-testid="kids-tab-grownups"]'));
    // The week's lesson is the catalog's own pick for MON, chosen only among
    // lessons that carry facilitator notes (DR-1576), so the page ALWAYS leads
    // with them, however many lessons land and wherever the rotation falls.
    const pick = weeklyLesson('kids', MON);
    const how = leadLines(moduleFor(pick)).how;
    const shown = q('[data-testid="grownups-lesson"]').textContent;
    expect(shown).toContain(pick.title);
    expect(how.length).toBeGreaterThan(0);
    expect(shown).toContain('How to lead it');
    expect(shown).toContain(how[0]);
    expect(shown).not.toContain('carries no facilitator notes');
    expect(q('[data-testid="grownups-progress"]').textContent).toContain('Sign in');
    click(q('[data-testid="kids-tab-badges"]'));
    expect(q('[data-testid="badge-shelf"]').getAttribute('data-earned')).toBe('0');
    expect(q('[data-testid="adventure-map"]').getAttribute('data-lit')).toBe('');
  });
});

describe('a storybook', () => {
  it('shows the loaded verse word for word, grades from the Word, says not yet kindly, and signed out does not write a record', async () => {
    const saves = [];
    await act(async () => {
      root.render(
        createElement(Storybook, {
          bookId: 'jonah',
          loadVerse,
          signedIn: false,
          saveRecord: async (r) => {
            saves.push(r);
            return { ok: true };
          },
        })
      );
    });
    await flush();
    const book = STORYBOOKS[0];
    expect(q('[data-testid="storybook-verse"]').textContent).toContain('Words of Jonah 1:1-3');
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook-verse"]').textContent).toContain(VERSES['Jonah 1:17']);
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('2');
    // The page shows the scene the folder holds, or names the render it still needs (the landed manifest decides).
    if (landedFile('jonah-3')) expect(q(`.kz-scene img[data-shot="jonah-3"]`).getAttribute('src')).toContain(`/lovecorner/kids/${landedFile('jonah-3')}`);
    else expect(q('[data-shot="jonah-3"][data-needed="true"]')).toBeTruthy();
    for (let i = 2; i < book.pages.length; i += 1) click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook-questions"]')).toBeTruthy();
    click(q('[data-testid="story-q0-o1"]'));
    expect(q('[data-testid="story-q0-says"]').textContent).toMatch(/not yet/i);
    click(q('[data-testid="story-q0-o0"]'));
    click(q('[data-testid="story-q1-o0"]'));
    click(q('[data-testid="story-q2-o0"]'));
    expect(q('[data-testid="story-q0-says"]').textContent).toMatch(/Yes/);
    click(q('[data-testid="storybook-finish"]'));
    await flush();
    expect(saves).toEqual([]);
    expect(q('[data-testid="storybook-saved"]').textContent).toContain('Sign in');
  });
  it('signed in, finishing writes one record for the book with the quiz result', async () => {
    const saves = [];
    await act(async () => {
      root.render(
        createElement(Storybook, {
          bookId: 'noah',
          loadVerse,
          signedIn: true,
          saveRecord: async (r) => {
            saves.push(r);
            return { ok: true };
          },
        })
      );
    });
    await flush();
    for (let i = 0; i < 8; i += 1) click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="story-q0-o0"]'));
    click(q('[data-testid="story-q1-o0"]'));
    click(q('[data-testid="story-q2-o0"]'));
    click(q('[data-testid="storybook-finish"]'));
    await flush();
    expect(saves.length).toBe(1);
    expect(saves[0].lessonId).toBe('storybook-noah');
    expect(saves[0].courseKey).toBe('kids-storybooks');
    expect(saves[0].quiz.passed).toBe(true);
    expect(q('[data-testid="storybook-saved"]').textContent).toContain('lit');
  });
});

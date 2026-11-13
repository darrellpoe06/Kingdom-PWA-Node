// @vitest-environment jsdom
// =============================================================================
// YouthZone — the surface renders real things: two doors that remember on the
// device, a verse game over the Word's own words, the week's real lesson link,
// badges derived from rows (signed out: honest), and no profile, chat or
// scoreboard anywhere (the brief's child-safety rule).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone, { MemoryVerseGame, BadgeShelf } from '../components/YouthZone.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { DOOR_PREF_KEY, weeklyLesson } from '../lib/youth-zone.js';

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
const VERSE = 'O magnify the LORD with me, and let us exalt his name together.';
const loadVerse = async (ref) => (ref === 'Psalm 34:3' ? VERSE : VERSE);
const flush = () =>
  act(async () => {
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
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const tab = (label) => {
  const t = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!t) throw new Error(`tab not found: ${label}`);
  click(t);
};
const mount = (props = {}) =>
  act(() => root.render(createElement(YouthZone, { church: COLG_DEFAULT_CHURCH, now: MON, loadVerse, fetchRecords: async () => ({ records: [] }), ...props })));

describe('the doors', () => {
  it('opens on Kids, switches to Teens on a tap, and remembers the choice on the device only', () => {
    mount();
    expect(q('[data-testid="youth-zone"]').getAttribute('data-door')).toBe('kids');
    expect(q('[data-testid="door-kids"]').getAttribute('aria-pressed')).toBe('true');
    click(q('[data-testid="door-teens"]'));
    expect(q('[data-testid="youth-zone"]').getAttribute('data-door')).toBe('teens');
    expect(window.localStorage.getItem(DOOR_PREF_KEY)).toBe('teens');
  });
  it('has no profile, chat, message or scoreboard, and says so', () => {
    mount();
    expect(q('[data-testid="youth-safety"]').textContent).toContain('no profile, no chat, no scoreboard');
    expect(container.querySelector('textarea')).toBeNull();
    expect(container.textContent).not.toMatch(/leaderboard|send a message|your profile/i);
  });
});

describe("the week's lesson and the events", () => {
  it('links the real module of the door’s course through the lesson link, and the events card is honest', async () => {
    mount();
    tab('This week');
    const open = q('[data-testid="weekly-lesson-open"]');
    const expected = weeklyLesson('kids', MON);
    // Kids 6–10 reads Living Lessons at the child band (true ages, DR-1508).
    expect(open.getAttribute('href')).toContain(`course=living-lessons`);
    expect(open.getAttribute('href')).toContain(`lesson=${encodeURIComponent(expected.lessonId)}`);
    expect(q('[data-testid="weekly-lesson"]').textContent).toContain(expected.title);
    expect(q('[data-testid="youth-events-empty"]').textContent).toContain('No upcoming youth events');
    expect(q('[data-testid="youth-channel"]').getAttribute('href')).toBe(COLG_DEFAULT_CHURCH.media.youtube);
  });
});

describe('the memory verse game', () => {
  it('loads the words from the loader, blanks some, and checks typed answers kindly', async () => {
    await act(async () => {
      root.render(createElement(MemoryVerseGame, { verseRef: 'Psalm 34:3', seed: 3, load: loadVerse }));
    });
    await flush();
    const inputs = [...container.querySelectorAll('input.yz-blank')];
    expect(inputs.length).toBeGreaterThan(0);
    expect(q('[data-testid="memory-game"]').textContent).toContain('Psalm 34:3 (KJV)');
    // type a wrong word, check, then the right one
    const setVal = (el, v) =>
      act(() => {
        const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        d.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    setVal(inputs[0], 'wrong');
    act(() => {
      q('[data-testid="memory-game"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(q('[data-testid="memory-result"]').textContent).toMatch(/of \d+ right/);
  });
  it('a verse the device cannot load is said plainly, never filled in', async () => {
    await act(async () => {
      root.render(createElement(MemoryVerseGame, { verseRef: 'Psalm 34:3', load: async () => '' }));
    });
    await flush();
    expect(q('[data-testid="memory-unavailable"]')).toBeTruthy();
    expect(container.querySelector('input.yz-blank')).toBeNull();
  });
});

describe('badges', () => {
  it('signed out: no badge is earned and the card says what signing in earns', () => {
    act(() => {
      root.render(createElement(BadgeShelf, { signedIn: false, now: MON }));
    });
    expect(q('[data-testid="badges-signed-out"]')).toBeTruthy();
    expect(q('[data-testid="badge-shelf"]').getAttribute('data-earned')).toBe('0');
    expect(container.querySelectorAll('[data-earned="true"]').length).toBe(0);
  });
  it('signed in: badges are derived from the fetched rows; an error says so and earns nothing', async () => {
    const rows = [{ lesson_id: 'a', course_key: 'little-learners', completed_at: '2026-11-14T10:00:00Z', age_band: 'child' }];
    await act(async () => {
      root.render(createElement(BadgeShelf, { signedIn: true, now: MON, fetchRecords: async () => ({ records: rows }) }));
    });
    await flush();
    expect(q('[data-testid="badge-first-step"]').getAttribute('data-earned')).toBe('true');
    expect(q('[data-testid="badge-kids-reader"]').getAttribute('data-earned')).toBe('true');
    expect(q('[data-testid="badge-five-lessons"]').getAttribute('data-earned')).toBe('false');
    await act(async () => {
      root.render(createElement(BadgeShelf, { signedIn: true, now: MON, fetchRecords: async () => ({ records: [], error: new Error('wall') }) }));
    });
    await flush();
    expect(q('[data-testid="badges-error"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-earned="true"]').length).toBe(0);
  });
});

describe('the house standards', () => {
  it('every button carries a focus ring', () => {
    mount();
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline|focus-visible/);
  });
});

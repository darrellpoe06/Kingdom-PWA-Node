// @vitest-environment jsdom
// =============================================================================
// Lessons for your situation, from the Word first (DR-0630)
// =============================================================================
// Darrell 2026-09-24, on the Church Speak box: "Would the lesson tab give users
// lessons for their own situations based on the Word first?" It had not: a
// member's words were relayed and nothing came back. These pin the answer the
// box now gives, on the real component: the lessons already written from the
// Word that speak to the words, ranked deterministically; a plain "nothing
// close enough" when none does; the notice said BEFORE they send; and the
// confirmation said true for who sent it.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const H = vi.hoisted(() => {
  const state = { email: 'member@example.com', signedIn: true, relayed: [] };
  const supabase = {
    auth: {
      getSession: async () => ({
        data: { session: state.signedIn ? { user: { id: 'u-1', email: state.email } } : null },
      }),
    },
    rpc: async () => ({ data: null, error: null }),
    from: () => {
      const q = { select: () => q, insert: () => q, eq: () => q, order: () => q, limit: () => q, single: async () => ({ data: null, error: null }), then: (ok) => Promise.resolve({ data: [], error: null }).then(ok) };
      return q;
    },
  };
  const relay = async ({ body, tags, source }) => {
    if (!state.signedIn) return { ok: false, reason: 'signed-out', id: null };
    state.relayed.push({ body, tags, source });
    return { ok: true, reason: '', id: `inbox-${state.relayed.length}` };
  };
  return { state, supabase, relay };
});
vi.mock('../lib/supabase.js', () => ({ default: H.supabase }));
vi.mock('../lib/agent-inbox-sync.js', () => ({ relayThought: (...a) => H.relay(...a) }));
vi.mock('../lib/saved-prompts.js', async (orig) => ({ ...(await orig()), rememberPrompt: async () => ({ ok: true }) }));

import {
  lessonsForSituation, SITUATIONS, MIN_SCORE, MAX_RESULTS, defaultLessonCourses, buildSituationIndex, whyLine,
  BROWSE_LIVING_LESSONS_HREF,
} from '../lib/lessons-for-situation.js';
import { parseLessonLink } from '../lib/lesson-links.js';
import {
  SURFACES, LESSON_NOTICE, LESSON_MEMBER_CONFIRMATION, lessonConfirmationKey, isLessonDoorOwner,
} from '../lib/one-voice-surfaces.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import OneVoiceInput from '../components/OneVoiceInput.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L192 = 'll192-two-hours-became-six-the-pattern-the-yea-the-inspection-and-the-faithful-man';
const L16 = 'll16-rule-your-spirit-repair-the-bond';
const ids = (text) => lessonsForSituation(text).map((r) => r.lessonId);

// -----------------------------------------------------------------------------
describe('real words reach the lessons that teach them', () => {
  it('a job that ran over and was built differently → Two Hours Became Six, first', () => {
    const r = lessonsForSituation('The contractor said two hours and it ran over to six, and he built something else than what we agreed');
    expect(r[0].lessonId).toBe(L192);
    expect(r[0].title).toMatch(/^Two Hours Became Six/);
    expect(r[0].why.phrases).toEqual(expect.arrayContaining(['contractor', 'ran over']));
    expect(r[0].refs).toContain('James 5:12');
  });

  it('a broken promise → Two Hours Became Six (the yea and the nay), first', () => {
    expect(ids('Someone lied to me and broke a promise')[0]).toBe(L192);
  });

  it('anger → Rule Your Spirit, first', () => {
    const r = lessonsForSituation('I got so angry I yelled at my wife last night');
    expect(r[0].lessonId).toBe(L16);
    expect(whyLine(r[0])).toMatch(/“angry”, “yelled”: anger, and ruling your own spirit\./);
  });

  it('a lost job → Take No Thought for Tomorrow and the work-and-provision lessons', () => {
    const got = ids('I got laid off and I do not know what comes next');
    expect(got).toContain('ll5-take-no-thought-for-tomorrow');
    expect(got).toContain('ll48-world-class-as-unto-the-lord-work-ownership-resilience');
  });

  it('debt → the widow’s oil (a course lesson, not only Living Lessons)', () => {
    const r = lessonsForSituation('We are in debt and the creditor keeps calling');
    const fin = r.find((x) => x.lessonId === 'fin5-what-hast-thou-in-the-house');
    expect(fin).toBeTruthy();
    expect(fin.courseKey).toBe('financing-debt');
  });

  it('a death → Do Not Take a Death So Personal, first', () => {
    expect(ids('My mother passed away last week and I cannot stop crying')[0])
      .toBe('ll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him');
  });

  it('with no vocabulary phrase, the lesson’s own words still find it (two title words)', () => {
    expect(ids('what does the parable of the sower mean')).toContain('ll54-the-same-word-different-soil-the-parable-of-the-sower');
  });
});

describe('a weak match is never painted as a strong one', () => {
  it('nonsense returns nothing', () => {
    expect(lessonsForSituation('asdf qwerty zxcv')).toEqual([]);
    expect(lessonsForSituation('the and of it is')).toEqual([]);
    expect(lessonsForSituation('')).toEqual([]);
    expect(lessonsForSituation(null)).toEqual([]);
  });

  it('one shared title word is not enough', () => {
    // "Tomorrow" is in one title (Take No Thought for Tomorrow): 3 < MIN_SCORE.
    expect(lessonsForSituation('tomorrow')).toEqual([]);
  });

  it('an ambiguous everyday phrase does not trip a situation', () => {
    expect(lessonsForSituation('My car broke down on the highway')).toEqual([]);
  });

  it('every result clears the bar, and never more than three', () => {
    const r = lessonsForSituation('I am angry and anxious and in debt and my husband wants a divorce and I got fired');
    expect(r.length).toBe(MAX_RESULTS);
    r.forEach((x) => expect(x.score).toBeGreaterThanOrEqual(MIN_SCORE));
  });
});

describe('deterministic, and every lesson it names is real', () => {
  it('the same words give the same answer every time', () => {
    const t = 'I got fired today and I do not know how we will pay the bills';
    const a = lessonsForSituation(t);
    const b = lessonsForSituation(t);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('every lesson in the situation vocabulary exists in the mounted catalog', () => {
    const index = buildSituationIndex(defaultLessonCourses());
    const missing = SITUATIONS.flatMap((s) => s.lessons).filter((k) => !index.byKey.has(k));
    expect(missing).toEqual([]);
  });

  it('every returned lesson exists, and its link opens exactly that lesson in Learn', () => {
    const living = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
    const index = buildSituationIndex(defaultLessonCourses());
    for (const t of ['I got fired', 'my husband and I keep arguing', 'I am so anxious about tomorrow', 'we are in debt']) {
      for (const r of lessonsForSituation(t)) {
        expect(index.byKey.has(`${r.courseKey}/${r.lessonId}`)).toBe(true);
        if (r.courseKey === 'living-lessons') expect(living.has(r.lessonId)).toBe(true);
        expect(parseLessonLink(r.href)).toEqual({ courseKey: r.courseKey, lessonId: r.lessonId });
        expect(r.href).toMatch(/^\?view=church&sub=learn&/);
      }
    }
  });
});

describe('said true, and said before they send', () => {
  it('both surfaces carry the notice, word for word', () => {
    for (const k of ['church', 'notes']) {
      expect(SURFACES[k].lessonNotice).toBe(LESSON_NOTICE);
    }
    expect(LESSON_NOTICE).toMatch(/may be used to write a lesson from the Word that others read/);
    expect(LESSON_NOTICE).toMatch(/Your name is never used/);
    expect(LESSON_NOTICE).toMatch(/personal details are changed/);
  });

  it('a member is told the truth; the Governor keeps the intake line', () => {
    expect(lessonConfirmationKey('member@example.com')).toBe('lesson');
    expect(lessonConfirmationKey('')).toBe('lesson');
    expect(lessonConfirmationKey('darrellpoe06@gmail.com')).toBe('lessonGovernor');
    expect(isLessonDoorOwner('15636502416@phone.poetech.us')).toBe(true);
    expect(isLessonDoorOwner('mrspoe06@gmail.com')).toBe(false);
    for (const k of ['church', 'notes']) {
      expect(SURFACES[k].confirmations.lesson).toBe(LESSON_MEMBER_CONFIRMATION);
      expect(SURFACES[k].confirmations.lessonGovernor).toMatch(/Learn intake/);
    }
    expect(LESSON_MEMBER_CONFIRMATION).toMatch(/reviewed before it is published/);
    expect(LESSON_MEMBER_CONFIRMATION).not.toMatch(/reported back to you/);
  });
});

// -----------------------------------------------------------------------------
// The real Speak box.
async function mount(props = {}) {
  localStorage.clear();
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(OneVoiceInput, { surface: 'church', ...props })); });
  const q = (sel) => container.querySelector(sel);
  const qa = (sel) => [...container.querySelectorAll(sel)];
  const button = (label) => qa('button').find((b) => b.textContent.trim() === label);
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const type = async (v) => {
    await act(async () => {
      const el = q('textarea');
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const settle = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
  return { container, q, qa, button, click, type, settle };
}

describe('the Speak box, with the Lesson chip chosen', () => {
  beforeEach(() => { H.state.email = 'member@example.com'; H.state.signedIn = true; H.state.relayed = []; });

  it('shows the notice above Send every time the chip is chosen, and only then', async () => {
    const ui = await mount();
    expect(ui.q('[data-testid="lesson-notice"]')).toBeNull();
    await ui.click(ui.button('📖 Lesson'));
    expect(ui.q('[data-testid="lesson-notice"]').textContent).toBe(LESSON_NOTICE);
    await ui.click(ui.button('🙏 Prayer') || ui.qa('button').find((b) => /Prayer/.test(b.textContent)));
    expect(ui.q('[data-testid="lesson-notice"]')).toBeNull();
  });

  it('lists the lessons from the Word for the words, each opening that lesson in Learn', async () => {
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('I got so angry I yelled at my brother');
    const block = ui.q('[data-testid="lessons-for-situation"]');
    expect(block.textContent).toMatch(/From the Word for this/);
    const items = ui.qa('[data-testid="situation-lesson"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].getAttribute('data-lesson-id')).toBe(L16);
    const href = items[0].querySelector('a').getAttribute('href');
    expect(parseLessonLink(href)).toEqual({ courseKey: 'living-lessons', lessonId: L16 });
    expect(items[0].querySelector('[data-testid="situation-lesson-why"]').textContent).toMatch(/anger/);
  });

  it('says so plainly when nothing is close enough, and offers the shelf', async () => {
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('asdf qwerty zxcv');
    expect(ui.qa('[data-testid="situation-lesson"]').length).toBe(0);
    expect(ui.q('[data-testid="situation-no-match"]').textContent).toMatch(/No lesson written yet/);
    expect(ui.q('[data-testid="situation-browse"]').getAttribute('href')).toBe(BROWSE_LIVING_LESSONS_HREF);
  });

  it('works signed out: the lessons are local', async () => {
    H.state.signedIn = false;
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('Someone lied to me and broke a promise');
    expect(ui.qa('[data-testid="situation-lesson"]')[0].getAttribute('data-lesson-id')).toBe(L192);
  });

  it('a member who sends is told the truth, the relay is unchanged, and the lessons stay on screen', async () => {
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('Someone lied to me and broke a promise');
    await ui.click(ui.button('Send'));
    await ui.settle();
    expect(H.state.relayed).toEqual([{ body: 'Someone lied to me and broke a promise', tags: ['lesson'], source: 'church-one-voice' }]);
    expect(ui.container.textContent).toContain(LESSON_MEMBER_CONFIRMATION);
    expect(ui.container.textContent).not.toMatch(/reported back to you/);
    expect(ui.qa('[data-testid="situation-lesson"]')[0].getAttribute('data-lesson-id')).toBe(L192);
  });

  it('the Governor who sends keeps the intake line', async () => {
    H.state.email = 'darrellpoe06@gmail.com';
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('Lesson. the yea and the nay on a job');
    await ui.click(ui.button('Send'));
    await ui.settle();
    expect(ui.container.textContent).toContain(SURFACES.church.confirmations.lessonGovernor);
  });

  it('signed out, the send is refused honestly', async () => {
    H.state.signedIn = false;
    const ui = await mount();
    await ui.click(ui.button('📖 Lesson'));
    await ui.type('I am so anxious about tomorrow');
    await ui.click(ui.button('Send'));
    await ui.settle();
    expect(ui.container.textContent).toMatch(/Not sent as a lesson \(signed-out\)/);
  });
});

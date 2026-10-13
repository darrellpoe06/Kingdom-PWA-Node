// @vitest-environment jsdom
// =============================================================================
// The shared link opens the lesson with no account, Play is there, a download
// asks for an account, a share is recorded and an open is recorded (DR-0698)
// =============================================================================
// Darrell 2026-09-30: "they can download it from the app however they would
// need an account no account needed for just reading it ect... also keep
// record of who does what send links etc... so we know they work and don't."
//
// The walk is the recipient's real one (DR-0296): the URL someone texted,
// through the shell's public gate and its routing, to the lesson on screen,
// signed out. The shell's own boot capture (main.jsx → captureShareOpen) is
// driven with the same URL, so the open event is the one the app writes.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ChurchLearn from '../components/ChurchLearn.jsx';
import supabase from '../lib/supabase.js';
import { lessonQuery } from '../lib/lesson-links.js';
import { initialChurchView } from '../lib/nav-history.js';
import { isPublicChurchRoute } from '../lib/access-gate.js';
import { buildHealthyLivingSchedule, HEALTHY_LIVING_META } from '../lib/healthy-living-course.js';
import { buildSelfPacedDescriptors } from '../lib/learn-catalog.js';
import { SHARE_HOW_TO } from '../lib/lesson-share.js';
import {
  captureShareOpen, resetShareOpenForTest, recordLessonShare, recordShareOpen, reportShareLanded,
} from '../lib/lesson-share-record.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetShareOpenForTest();
  setSearch('');
  container = document.createElement('main');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetShareOpenForTest();
  vi.restoreAllMocks();
  setSearch('');
});

const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
  progress: {}, quizState: {}, learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  extraCourses: buildSelfPacedDescriptors({}),
  ...props,
})));

const clickTab = (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

const TOKEN = 'k7Qm2xPa9LtB';

describe('signed out, the shared link opens the lesson for reading and listening', { timeout: 60000 }, () => {
  it('the public gate lets the link through, it routes to Learn, the lesson is on screen with ▶ Play, and the open is recorded ok', async () => {
    const lesson = buildHealthyLivingSchedule()[1];
    const search = `${lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: lesson.id })}&s=${TOKEN}`;
    setSearch(search);

    // The shell's two steps before anything renders: the public door and the route.
    expect(isPublicChurchRoute(search)).toBe(true);
    expect(initialChurchView(search)).toBe('learn');

    // The boot capture main.jsx runs, with a recording sink.
    const sink = vi.fn();
    expect(captureShareOpen(search, { sink, setTimer: () => 0 })).toBe(TOKEN);

    mount({ signedIn: false });
    const card = document.getElementById(`learn-lesson-${lesson.id}`);
    expect(card, 'the lesson is on screen for a signed-out visitor').toBeTruthy();
    expect(card.textContent).toContain(lesson.title);
    const play = [...card.querySelectorAll('button')].find((b) => /▶ Play/.test(b.textContent || ''));
    expect(play, '▶ Play is offered signed out').toBeTruthy();

    await flush(); await flush();
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith(TOKEN, 'ok', '');
  });

  it('copying the lesson’s full text asks a signed-out reader to sign in, and opens the sign-in dialog', () => {
    const lesson = buildHealthyLivingSchedule()[1];
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: lesson.id }));
    mount({ signedIn: false });
    const card = document.getElementById(`learn-lesson-${lesson.id}`);
    const labels = [...card.querySelectorAll('button')].map((b) => (b.textContent || '').trim());
    expect(labels).not.toContain('Copy lesson');
    const gate = card.querySelector('[data-testid="download-needs-account"]');
    expect(gate).toBeTruthy();
    expect(gate.textContent).toMatch(/sign in/i);
    expect(document.getElementById('auth-modal-h')).toBeFalsy();
    act(() => gate.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(document.getElementById('auth-modal-h'), 'the sign-in / create-account dialog opens').toBeTruthy();
  });

  it('Paper & print: signed out, the download asks for an account; signed in, the downloads are there', () => {
    mount({ signedIn: false });
    clickTab('Paper & print');
    expect(container.textContent).toMatch(/Downloading needs a free account/);
    expect(container.textContent).not.toMatch(/Download \.md/);
    expect(container.textContent).not.toMatch(/Copy markdown/);
    act(() => root.unmount());
    root = createRoot(container);
    mount({ signedIn: true });
    clickTab('Paper & print');
    expect(container.textContent).toMatch(/Download \.md/);
    expect(container.textContent).not.toMatch(/Downloading needs a free account/);
  });

  it('a stale shared link records the failure and its reason', async () => {
    const search = `${lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: 'hl-a-lesson-we-removed' })}&s=${TOKEN}`;
    setSearch(search);
    const sink = vi.fn();
    captureShareOpen(search, { sink, setTimer: () => 0 });
    mount({ signedIn: false });
    await flush();
    expect(sink).toHaveBeenCalledWith(TOKEN, 'failed', 'lesson not found: hl-a-lesson-we-removed');
  });

  it('the shell hands Learn the sign-in state (the gate is not a default)', () => {
    const shell = readFileSync(resolve(__dirname, '../poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/<ChurchLearn[\s\S]*?signedIn=\{!!authSession\}/);
    const boot = readFileSync(resolve(__dirname, '../main.jsx'), 'utf8');
    expect(boot).toMatch(/captureShareOpen\(window\.location\.search\)/);
  });
});

describe('a share writes a record', { timeout: 60000 }, () => {
  it('Share on a lesson hands the sheet the note and records who, which lesson, the token, the method', async () => {
    const lesson = buildHealthyLivingSchedule()[2];
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: lesson.id }));
    const rpc = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: 'ok', error: null });
    const shared = [];
    const orig = navigator.share;
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: async (p) => { shared.push(p); } });
    try {
      mount({ signedIn: true });
      const card = document.getElementById(`learn-lesson-${lesson.id}`);
      const btn = [...card.querySelectorAll('button')].find((b) => b.title === 'Share this lesson using your usual apps');
      expect(btn).toBeTruthy();
      await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await flush();

      expect(shared).toHaveLength(1);
      const text = shared[0].text;
      expect(text.startsWith(lesson.title)).toBe(true);
      expect(text.endsWith(SHARE_HOW_TO.church)).toBe(true);
      const body = String(lesson.lesson || '').trim();
      if (body.length > 200) expect(text).not.toContain(body.slice(0, 200));

      const call = rpc.mock.calls.find((c) => c[0] === 'lesson_share_record');
      expect(call, 'the share was recorded').toBeTruthy();
      const { p_token: token, p_payload: payload } = call[1];
      expect(token).toMatch(/^[A-Za-z0-9]{12}$/);
      expect(payload).toMatchObject({ courseKey: HEALTHY_LIVING_META.key, lessonId: lesson.id, method: 'native', door: 'church', kind: 'lesson' });
      expect(payload.url).toContain(`s=${token}`);
      expect(text).toContain(payload.url);
      // The sharer is never sent from the browser: the database takes auth.uid().
      expect(payload).not.toHaveProperty('sharedBy');
    } finally {
      Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: orig });
    }
  });

  it('a copy (no share sheet) records method copy; a dismissed sheet records nothing', async () => {
    const rpc = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: 'ok', error: null });
    const share = { token: TOKEN, courseKey: 'c', lessonId: 'l', url: `https://x/?s=${TOKEN}`, title: 'T' };
    expect((await recordLessonShare(share, 'copied')).ok).toBe(true);
    expect(rpc.mock.calls[0][1].p_payload.method).toBe('copy');
    expect((await recordLessonShare(share, 'dismissed')).ok).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe('an open writes an event, with nothing about the person', () => {
  it('recordShareOpen sends only the token, the outcome and the reason', async () => {
    const rpc = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: true, error: null });
    expect((await recordShareOpen(TOKEN, 'failed', 'lesson not found: x')).ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('lesson_share_open', { p_token: TOKEN, p_outcome: 'failed', p_reason: 'lesson not found: x' });
  });

  it('the watchdog records failed when no surface shows the lesson (the DR-0296 class), and one open is one row', () => {
    const sink = vi.fn();
    let fire = null;
    captureShareOpen(`?s=${TOKEN}`, { sink, timeoutMs: 30000, setTimer: (fn) => { fire = fn; return 1; } });
    fire();
    expect(sink).toHaveBeenCalledWith(TOKEN, 'failed', 'lesson not on screen within 30s');
    expect(reportShareLanded({ ok: true })).toBe(false);
    expect(sink).toHaveBeenCalledTimes(1);
    // The same tab reloading the same link after it reported is not a second open.
    expect(captureShareOpen(`?s=${TOKEN}`, { sink, setTimer: () => 0 })).toBe('');
  });

  it('a page not opened from a share records nothing', () => {
    const sink = vi.fn();
    expect(captureShareOpen('?view=church&sub=learn', { sink, setTimer: () => 0 })).toBe('');
    expect(reportShareLanded({ ok: true })).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });
});

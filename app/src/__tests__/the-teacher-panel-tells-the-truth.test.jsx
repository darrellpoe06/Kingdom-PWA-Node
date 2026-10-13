// @vitest-environment jsdom
// THE TEACHER PANEL TELLS THE TRUTH ABOUT WHAT IT IS (DR-0430).
// It renders only for an enrolled likeness; without one there is no hollow
// panel (DR-0381). With one, and nothing armed on this device, it says
// stand-in / still — never real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

let profiles = [];
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles, error: null }) }));
const { default: LessonTeacher } = await import('../components/LessonTeacher.jsx');

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
// WAIT FOR THE PANEL, DO NOT COUNT TICKS (2026-09-23). Two setTimeout(0)
// ticks were enough locally and one await short on the runner once the
// studio probe started reading its answer's body (CI run 35932607834:
// "expected null not to be null"; the same test was green one commit
// earlier). The panel's mount is a chain of awaits whose length is not the
// test's business; the test waits for the DOM it asserts on, bounded.
const flush = async (selector = null, budgetMs = 3000) => {
  const started = Date.now();
  do {
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    if (!selector || host.querySelector(selector)) break;
  } while (Date.now() - started < budgetMs);
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};
const MODULE = { id: 'x', title: 'Pride Is Not Worth Him', bigIdea: 'PRIDE IS NOT WORTH HIM.', anchor: { theme: 'KJV' } };

describe('LessonTeacher', () => {
  it('no likeness enrolment → renders nothing at all', async () => {
    profiles = [{ personKey: 'darrell', displayName: 'Darrell Poe', consentState: 'granted', meta: {} }];
    act(() => { root.render(createElement(LessonTeacher, { module: MODULE })); });
    await flush();
    expect(host.querySelector('[data-testid="lesson-teacher"]')).toBeNull();
  });
  it('enrolled, nothing armed on this device → the panel, labelled AI-generated stand-in, never "real"', async () => {
    profiles = [{ personKey: 'darrell', displayName: 'Darrell Poe', consentState: 'granted', meta: { likeness_consent_at: '2026-09-15T00:00:00Z' } }];
    act(() => { root.render(createElement(LessonTeacher, { module: MODULE })); });
    await flush('[data-testid="lesson-teacher"]');
    const panel = host.querySelector('[data-testid="lesson-teacher"]');
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('data-read-skip')).not.toBeNull();
    const label = host.querySelector('[data-testid="lesson-teacher-label"]').textContent;
    expect(label.startsWith('AI-generated')).toBe(true);
    expect(label).toMatch(/stand-in device voice/);
    expect(label).not.toMatch(/cloned voice/);
    expect(panel.textContent).toMatch(/Let Darrell teach this/);
  });
});

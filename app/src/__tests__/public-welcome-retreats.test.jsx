// @vitest-environment jsdom
// =============================================================================
// The banner steps aside so the Word is dominant — and comes back on one touch
// =============================================================================
// Darrell 2026-08-13: "can the banner leave after a certain time for the Word
// or lesson to be most dominant?" and "still before for like the first
// paragraph then move unless prompted for like touching the faint hover."
//
// This is DR-0290's own rule finished, not a new one. §4 of that decision says
// neither placement may get "between a reader and what they came for" — the top
// line is deliberately ONE line with no ask, and the full invitation waits for
// the `end` placement, "after the reading, where the person who just got
// something good is the only one who has earned the invitation."
//
// But the top line could only be moved by TAPPING × Hide. A reader who does
// nothing keeps a black bar over the Word for the entire lesson, which is the
// thing DR-0290 says must not happen. Retreat is that rule enforcing itself.
//
// RETREATED IS NOT DISMISSED, and the distinction is the whole design:
// dismissed is the reader's explicit "gone"; retreated is the banner yielding
// the room and staying one touch away.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PublicWelcome, { TOP_BANNER_DWELL_MS } from '../components/PublicWelcome.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const render = (props = {}) => act(() => root.render(createElement(PublicWelcome, props)));
const top = () => container.querySelector('[data-testid="public-welcome-top"]');
const rest = () => container.querySelector('[data-testid="public-welcome-rest"]');
const text = () => container.textContent || '';

describe('the top line is there first, then yields to the Word', () => {
  it('it shows on arrival — the reader is told whose house this is', () => {
    render();
    expect(top()).toBeTruthy();
    expect(text()).toMatch(/free to read, no account/i);
    expect(rest(), 'it must not start retreated — nobody has read anything yet').toBeNull();
  });

  it('it is STILL there through the first paragraph’s worth of reading', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS - 1000); });
    expect(top(), 'it left before the reader could have read the opening').toBeTruthy();
  });

  it('then it steps aside on its own — no tap needed', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    expect(top(), 'the black bar is still over the Word').toBeNull();
    expect(rest(), 'it vanished entirely instead of retreating').toBeTruthy();
  });

  it('what is left still says whose house this is, quietly', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    expect(text()).toMatch(/the love corner/i);
    expect(text(), 'the full line should have gone, not merely faded').not.toMatch(/free to read, no account/i);
  });
});

describe('one touch brings it back — "unless prompted"', () => {
  it('tapping the faint strip restores the full line', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    act(() => { rest().querySelector('button').click(); });
    expect(top()).toBeTruthy();
    expect(text()).toMatch(/free to read, no account/i);
  });

  it('the affordance is a real BUTTON, not hover-only', () => {
    // A finger cannot hover. A hover-only affordance would be unreachable on
    // the exact device Darrell reads on, and invisible to a screen reader.
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    const b = rest().querySelector('button');
    expect(b).toBeTruthy();
    expect(b.getAttribute('aria-label')).toMatch(/free to read/i);
  });

  it('restored, it stays — a reader who asked for it is not overruled by a timer', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    act(() => { rest().querySelector('button').click(); });
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS * 3); });
    expect(top(), 'the timer retreated it again after the reader asked for it').toBeTruthy();
  });
});

describe('retreated is not dismissed', () => {
  it('× Hide removes it completely — the faint strip does not linger', () => {
    render();
    act(() => { top().querySelector('button').click(); });
    expect(top()).toBeNull();
    expect(rest(), 'an explicit dismissal must not leave a stub behind').toBeNull();
    expect(text().trim()).toBe('');
  });

  it('dismissing while retreated is still available and still final', () => {
    render();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    act(() => { rest().querySelector('button').click(); });
    act(() => { top().querySelector('button').click(); });
    expect(container.textContent.trim()).toBe('');
  });
});

describe('the END placement is untouched — the invitation still waits for the reading', () => {
  it('it never retreats, because it comes after the reading, not over it', () => {
    render({ placement: 'end' });
    const end = container.querySelector('[data-testid="public-welcome-end"]');
    expect(end).toBeTruthy();
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS * 5); });
    expect(
      container.querySelector('[data-testid="public-welcome-end"]'),
      'DR-0290 puts the invitation AFTER the reading — a timer must not take it away',
    ).toBeTruthy();
  });
});

describe('the dwell is a judgement, so it is adjustable and disablable', () => {
  it('a caller can lengthen it', () => {
    render({ dwellMs: TOP_BANNER_DWELL_MS * 4 });
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS); });
    expect(top()).toBeTruthy();
  });

  it('0 disables the retreat entirely', () => {
    render({ dwellMs: 0 });
    act(() => { vi.advanceTimersByTime(TOP_BANNER_DWELL_MS * 10); });
    expect(top(), 'a surface that wants the line to stay must be able to keep it').toBeTruthy();
  });
});

// @vitest-environment jsdom
// =============================================================================
// The speaker pushes ONE button and the message reads itself (DR-0289)
// =============================================================================
// Darrell 2026-08-10, from the presenter bar mid-lesson: "I should be able to
// also listen to the full message or lesson/s from here... easygoing...
// easy-to-use" and "speakers are supposed to be able to push play for reading
// whatever... especially Scriptures."
//
// Before this, starting a reading meant leaving the presenter, finding the
// floating reader, opening its panel and choosing an action — three taps and a
// hunt, while a room watches. These pin the one-button path: the presenter
// registers what the ROOM sees as the reading (never the speaker's private
// notes), asks the reader to play, and the reading walks the deck by itself.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';
import { requestRead, subscribeReadRequest, readerAvailable } from '../lib/read-request.js';
import Presenter from '../components/Presenter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PRESENTABLE = {
  id: 'msg-1',
  title: 'A message with three parts',
  kicker: 'Sunday',
  targetMin: 45,
  scenes: [
    { id: 's1', audience: { title: 'Open', lead: 'The one big idea, said plainly.', points: ['John 3:16 is the anchor.'] },
      notes: [{ kind: 'body', heading: 'Speaker note', body: 'SECRET-PRESENTER-NOTE never spoken to the room' }], minutes: 10 },
    { id: 's2', audience: { title: 'Teach', lead: 'The second part of the message.' }, minutes: 15 },
    { id: 's3', audience: { title: 'Send', lead: 'The last part of the message.' }, minutes: 10 },
  ],
};

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});

const mount = () => act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, canEdit: false })));
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));

describe('the presenter offers its message to the reader', () => {
  it('registers what the ROOM sees as the reading', () => {
    mount();
    const t = getReadTarget();
    expect(t).toBeTruthy();
    expect(t.text).toContain('Open');
    expect(t.text).toContain('The one big idea, said plainly.');
    expect(t.text).toContain('John 3:16 is the anchor.');
  });

  it('NEVER offers the speaker’s private notes to the voice (no-leak)', () => {
    mount();
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('carries a next() so one press walks the whole message', () => {
    mount();
    const first = getReadTarget();
    expect(typeof first.next).toBe('function');
    act(() => { expect(first.next()).toBe(true); });
    const second = getReadTarget();
    expect(second.owner).not.toBe(first.owner);
    expect(second.text).toContain('The second part of the message.');
  });

  it('says false at the last part instead of looping', () => {
    mount();
    act(() => { getReadTarget().next(); });
    act(() => { getReadTarget().next(); });
    const last = getReadTarget();
    expect(last.text).toContain('The last part of the message.');
    act(() => { expect(last.next()).toBe(false); });
  });

  it('offers a one-press Read aloud on the speaker’s own screen', () => {
    mount();
    expect(button(/Read it aloud/i)).toBeTruthy();
  });

  it('pressing it asks the reader to play — from the presenter, with no panel', () => {
    const heard = [];
    const off = subscribeReadRequest((d) => heard.push(d));
    mount();
    act(() => { button(/Read it aloud/i).click(); });
    expect(heard.length).toBe(1);
    expect(heard[0].from).toBe('presenter-console');
    off();
  });
});

describe('the request seam tells the truth', () => {
  it('reports FALSE when no reader is listening — never a dead button pretending', () => {
    expect(readerAvailable()).toBe(false);
    expect(requestRead()).toBe(false);
  });

  it('reports true once a reader is listening, and stops on unsubscribe', () => {
    const off = subscribeReadRequest(() => {});
    expect(readerAvailable()).toBe(true);
    expect(requestRead({ from: 'test' })).toBe(true);
    off();
    expect(requestRead()).toBe(false);
  });

  it('one throwing listener never blocks the rest', () => {
    const seen = vi.fn();
    const offBad = subscribeReadRequest(() => { throw new Error('boom'); });
    const offGood = subscribeReadRequest(seen);
    expect(() => requestRead()).not.toThrow();
    expect(seen).toHaveBeenCalled();
    offBad(); offGood();
  });
});

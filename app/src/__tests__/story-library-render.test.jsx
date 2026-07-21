// Locks the Story Library surface (Darrell 2026-07-21): the testimony-first
// capture form gates on the truth-label rule, a testimony demands attribution +
// consent before it can submit, and the steward queue only lets a promotable
// story be promoted. supabase is mocked (no network). Uses the repo's
// react-dom/client + act render pattern (same as church-learn-render.test.jsx).
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    rpc: async () => ({ data: null, error: null }),
    from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
}));

import StoryLibrary from '../components/StoryLibrary.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = (props = {}) => act(() => root.render(createElement(StoryLibrary, props)));
const byId = (id) => container.querySelector('#' + id);
const setInput = (el, value) => act(() => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype
    : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype
    : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
const submitBtn = () =>
  [...container.querySelectorAll('button')].find((b) => /submit to the queue/i.test(b.textContent || ''));

describe('StoryLibrary capture form', () => {
  it('defaults to testimony-first and shows attribution + consent', () => {
    mount();
    expect(container.textContent).toMatch(/Story Library/);
    expect(container.textContent).toMatch(/Testimony-first/);
    expect(byId('sl-source')).toBeTruthy(); // testimony attribution field present by default
    expect(container.textContent).toMatch(/consent to it being shared/i);
  });

  it('keeps Submit disabled for a testimony until attribution + consent + body are present', () => {
    mount();
    expect(submitBtn().disabled).toBe(true);

    setInput(byId('sl-title'), 'The Night I Was Kept');
    setInput(byId('sl-verse'), 'Psalms 34:4');
    setInput(byId('sl-body'), 'A long night of fear ended when a peace I did not manufacture settled over the room and I finally slept, and I have never once doubted since who it was that kept me.');
    expect(submitBtn().disabled).toBe(true); // testimony still needs attribution + consent

    setInput(byId('sl-source'), 'Told by Ada Poe');
    expect(submitBtn().disabled).toBe(true); // still needs consent
    const consent = container.querySelector('input[type="checkbox"]');
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set.call(consent, true);
      consent.dispatchEvent(new Event('click', { bubbles: true }));
      consent.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(submitBtn().disabled).toBe(false);
  });

  it('a parable does not ask for attribution/consent', () => {
    mount();
    setInput(byId('sl-kind'), 'parable');
    expect(byId('sl-source')).toBeNull();
  });
});

describe('StoryLibrary steward queue', () => {
  const promotable = { id: 't1', kind: 'testimony', tone: 'solemn', title: 'Kept', body: 'A real account long enough to clear the floor of twenty-five words so the truth-label gate is satisfied and it may be promoted into a lesson.', verse: 'Psalms 34:4', source: 'Ada Poe', consent: true, status: 'submitted' };
  const notPromotable = { ...promotable, id: 't2', source: '' };

  it('is hidden for non-stewards', () => {
    mount({ isGovernor: false, submissions: [promotable] });
    expect(container.textContent).not.toMatch(/curation queue/i);
  });

  it('lets a steward promote a promotable story and blocks an unattributed one', () => {
    const onPromote = vi.fn();
    mount({ isGovernor: true, submissions: [promotable, notPromotable], onPromote });
    expect(container.textContent).toMatch(/curation queue/i);
    const promoteBtns = [...container.querySelectorAll('button')].filter((b) => /promote to lesson/i.test(b.textContent || ''));
    expect(promoteBtns.length).toBe(2);
    expect(promoteBtns[0].disabled).toBe(false);
    expect(promoteBtns[1].disabled).toBe(true);
    act(() => promoteBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onPromote).toHaveBeenCalledTimes(1);
  });
});

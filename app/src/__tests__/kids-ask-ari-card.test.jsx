// @vitest-environment jsdom
// =============================================================================
// The Ask Ari card asks (Darrell 2026-11-18, on the Kids Zone card that said
// "Ask me inside any lesson" and offered no way to: "How do they ask Ari? No
// options?! We're advertising it!"). A child types the question on the card;
// the week's lesson opens with Ari already answering it; Ari answers only
// about the lesson and a grown-up can read everything.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone from '../components/YouthZone.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

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
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('the Ask Ari card asks', () => {
  it('a question typed on the card opens the lesson with Ari answering it, once', async () => {
    const asked = [];
    const ask = vi.fn(async (module, messages) => {
      asked.push(messages[messages.length - 1].content);
      return { ok: true, reply: `About this lesson: ${messages[messages.length - 1].content}` };
    });
    await act(() =>
      root.render(
        createElement(YouthZone, {
          church: COLG_DEFAULT_CHURCH,
          now: new Date('2026-11-16T15:00:00Z'),
          loadVerse: async (ref) => `Words of ${ref}.`,
          ask,
        })
      )
    );
    await flush();
    const card = q('[data-testid="ask-ari-card"]');
    expect(card).toBeTruthy();
    expect(card.textContent).not.toMatch(/inside any lesson/);
    const input = q('[data-testid="ask-ari-input"]');
    const go = q('[data-testid="ask-ari-go"]');
    expect(go.disabled).toBe(true);
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'What does repent mean?');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(q('[data-testid="ask-ari-go"]').disabled).toBe(false);
    await act(async () => card.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    const chat = q('[data-testid="ari-chat"]');
    expect(chat, 'the lesson opened with Ari').toBeTruthy();
    expect(asked).toEqual(['What does repent mean?']);
    expect(chat.textContent).toMatch(/About this lesson: What does repent mean\?/);
    expect(chat.textContent).toMatch(/What does repent mean\?/);
    // Back to the zone and the card is empty again; the question is not re-asked.
    click(q('[data-testid="kids-back"]') || q('[data-testid="adventure-back"]'));
    await flush();
    expect(ask).toHaveBeenCalledTimes(1);
  });
});

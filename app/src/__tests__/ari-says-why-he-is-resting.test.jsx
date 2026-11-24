// @vitest-environment jsdom
// ARI SAYS WHY HE IS RESTING, AND NEVER THINKS FOR EVER (2026-11-24).
// Darrell, of "Ari is resting right now" on a child's one-word question:
// "What happened?!!!! Kids can't ask simple questions?!!!" The reason was
// swallowed (DR-1053) and the call had no time limit. The child's bubble
// keeps its gentle words; the grown-up beside them gets the reason and code.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { askTutor, tutorTroubleWords, TUTOR_TIMEOUT_MS } from '../lib/class-tutor.js';
import { AriChat } from '../components/kids/KidsAdventure.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const MODULE = { id: 'll1-x', title: 'A lesson', bigIdea: 'An idea' };
const reply = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('askTutor names its failure', () => {
  it('a closed road is http_<code>; no network is unreachable; a real answer is ok', async () => {
    expect((await askTutor(MODULE, [], { fetchImpl: reply(502, null) })).error).toBe('http_502');
    expect((await askTutor(MODULE, [], { fetchImpl: reply(401, null) })).error).toBe('http_401');
    expect(
      (
        await askTutor(MODULE, [], {
          fetchImpl: async () => {
            throw new TypeError('Failed to fetch');
          },
        })
      ).error
    ).toBe('unreachable');
    expect((await askTutor(MODULE, [], { fetchImpl: reply(200, { ok: true, reply: ' Yes. ' }) })).reply).toBe('Yes.');
  });
  it('PROVEN-TO-CATCH: a road that never answers is stopped at the limit and says timeout', async () => {
    const never = (_url, { signal }) => new Promise((_res, rej) => signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))));
    const r = await askTutor(MODULE, [], { fetchImpl: never, timeoutMs: 20 });
    expect(r).toEqual({ ok: false, reply: null, source: null, error: 'timeout' });
    expect(TUTOR_TIMEOUT_MS).toBeGreaterThan(90000); // the NAS's own 90 s answer arrives first
  });
  it('each failure has a plain sentence for a grown-up, with its code kept', () => {
    expect(tutorTroubleWords('http_502')).toBe("The road to the house's own computer, where Ari lives, is closed (http_502).");
    expect(tutorTroubleWords('http_401')).toContain('refused the app’s key'.replace('’', "'"));
    expect(tutorTroubleWords('unreachable')).toContain('could not reach');
    expect(tutorTroubleWords('timeout')).toContain('100 seconds');
    expect(tutorTroubleWords('empty')).toContain('no words');
    expect(tutorTroubleWords(undefined)).toContain('(unavailable)');
  });
});

describe('the Kids chat', () => {
  let host, root;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });
  it('keeps the gentle words for the child, shows the reason for a grown-up, and never sends the resting line back to Ari', async () => {
    const ask = vi.fn().mockResolvedValueOnce({ ok: false, error: 'http_502' }).mockResolvedValueOnce({ ok: true, reply: 'The LORD is the shepherd.' });
    await act(async () => root.render(createElement(AriChat, { module: MODULE, meta: null, ask, firstQuestion: 'Lord' })));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const resting = host.querySelector('.kz-msg.ari');
    expect(resting.textContent).toContain('Ari is resting right now. Ask a grown-up, or try again in a minute.');
    expect(host.querySelector('[data-testid="ari-why"]').textContent).toBe(
      "For a grown-up: The road to the house's own computer, where Ari lives, is closed (http_502)."
    );
    const input = host.querySelector('input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Who is the shepherd?');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
    const sent = ask.mock.calls[1][1];
    expect(sent.map((m) => m.content)).toEqual(['Lord', 'Who is the shepherd?']);
    expect(host.textContent).toContain('The LORD is the shepherd.');
  });
});

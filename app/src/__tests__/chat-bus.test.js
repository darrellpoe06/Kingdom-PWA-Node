// @vitest-environment node
// chat-bus — proven-to-catch (DR-0076 §3). The two rules that must never
// regress: @local is the default, and PRIVATE routes local regardless of
// prefix (DR-0073) — with the reroute NAMED to the user, never silent.
import { describe, it, expect } from 'vitest';
import { parsePrefix, buildTaskRow, paneStateFor, targetAvailable, CHAT_TARGETS } from '../lib/chat-bus.js';

describe('prefix parsing', () => {
  it('defaults to LOCAL with no prefix — sovereign is the resting state', () => {
    expect(parsePrefix('what does DR mean')).toEqual({ target: 'local', message: 'what does DR mean' });
  });
  it('routes @claude and @gemini and strips the prefix', () => {
    expect(parsePrefix('@claude fix this')).toEqual({ target: 'claude', message: 'fix this' });
    expect(parsePrefix('@GEMINI review')).toEqual({ target: 'gemini', message: 'review' });
  });
  it('an unknown @word is PROSE, not a target — never swallowed', () => {
    expect(parsePrefix('@bob hello')).toEqual({ target: 'local', message: '@bob hello' });
  });
  it('a mid-sentence @ is prose too', () => {
    expect(parsePrefix('email @claude about it').target).toBe('local');
  });
  it('never throws on junk', () => {
    for (const bad of [null, undefined, 42, '']) expect(() => parsePrefix(bad)).not.toThrow();
  });
});

describe('the privacy line (the rule the DB CHECK backstops)', () => {
  it('PROVEN-TO-CATCH: private + @claude is FORCED local and NAMED as rerouted', () => {
    const out = buildTaskRow('@claude summarize my session', { isPrivate: true, tenantId: 't', userId: 'u' });
    expect(out.row.target).toBe('local');
    expect(out.row.private).toBe(true);
    expect(out.rerouted).toBe(true); // the UI must SAY it, not silently ignore the prefix
  });
  it('private + @local is not "rerouted" — nothing to explain', () => {
    expect(buildTaskRow('@local x', { isPrivate: true }).rerouted).toBe(false);
  });
  it('empty message yields no row at all', () => {
    expect(buildTaskRow('@claude   ', {})).toBeNull();
  });
  it('the row only ever carries a known target', () => {
    for (const raw of ['x', '@claude x', '@gemini x', '@local x']) {
      expect(CHAT_TARGETS).toContain(buildTaskRow(raw, {}).target);
    }
  });
});

describe('pane states (the async-row UI contract)', () => {
  it('queued/running are pending WITH an honest note (a cold model is named, not a freeze)', () => {
    expect(paneStateFor({ status: 'queued' }).phase).toBe('pending');
    expect(paneStateFor({ status: 'running' }).note).toMatch(/load/i);
  });
  it('failed surfaces the agent error verbatim', () => {
    expect(paneStateFor({ status: 'failed', error: 'HTTP 402' }).note).toBe('HTTP 402');
  });
  it('an unknown status never reads as delivered', () => {
    expect(paneStateFor({ status: 'zzz' }).phase).toBe('unknown');
    expect(paneStateFor(null).phase).toBe('unknown');
  });
});

describe('vendor availability (unknown never reads as available)', () => {
  it('local is always available; vendors only with keys explicitly true', () => {
    expect(targetAvailable('local')).toBe(true);
    expect(targetAvailable('claude')).toBe(false);
    expect(targetAvailable('claude', { claude: true })).toBe(true);
    expect(targetAvailable('gemini', { claude: true })).toBe(false);
  });
});

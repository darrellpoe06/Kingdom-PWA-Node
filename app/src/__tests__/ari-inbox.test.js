import { describe, it, expect } from 'vitest';
import {
  makeThread, makeMessage, validateThread, validateMessage,
  awaitingAri, summarizeInbox, ARI_RESPONSIBILITIES, ROUTE_TARGET_IDS,
} from '../lib/ari-inbox.js';

describe('ari-inbox — Ari honesty gates (proven-to-catch)', () => {
  it('an Ari reply WITHOUT routedTo is INVALID (must name which engine answered)', () => {
    const r = validateMessage(makeMessage({ from: 'ari', body: 'hi' }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/routedTo/);
  });
  it('an Ari reply WITH routedTo is valid and defaults to unverified', () => {
    const m = makeMessage({ from: 'ari', body: 'hi', routedTo: 'local-qwen' });
    expect(validateMessage(m).ok).toBe(true);
    expect(m.unverified).toBe(true);
  });
  it('an Ari reply marked verified needs evidence (Verification Doctrine)', () => {
    expect(validateMessage(makeMessage({ from: 'ari', body: 'x', routedTo: 'claude', unverified: false })).ok).toBe(false);
    expect(validateMessage(makeMessage({ from: 'ari', body: 'x', routedTo: 'claude', unverified: false, evidence: 'ran it' })).ok).toBe(true);
  });
  it('your own message is valid with just a body and is never marked unverified', () => {
    const m = makeMessage({ from: 'you', body: 'question' });
    expect(validateMessage(m).ok).toBe(true);
    expect(m.unverified).toBe(false);
  });
});

describe('ari-inbox — thread model + opportunities/constraints', () => {
  it('a thread needs a subject; an unknown route target falls back to auto', () => {
    expect(validateThread(makeThread({ subject: '' })).ok).toBe(false);
    expect(validateThread(makeThread({ subject: 'x' })).ok).toBe(true);
    expect(makeThread({ subject: 'x', routeTarget: 'nope' }).routeTarget).toBe('auto');
  });
  it('opportunities + constraints are first-class on every thread', () => {
    const t = makeThread({ subject: 's', opportunities: [{ text: 'reach more' }], constraints: [{ text: 'budget' }] });
    expect(t.opportunities).toHaveLength(1);
    expect(t.constraints).toHaveLength(1);
    const s = summarizeInbox([t]);
    expect(s.withOpps).toBe(1);
    expect(s.withConstraints).toBe(1);
  });
  it('awaitingAri = open threads whose last message is from you', () => {
    const t = makeThread({ id: 'thr-x', subject: 's', status: 'open' });
    const waiting = { 'thr-x': [makeMessage({ from: 'you', body: 'q' })] };
    expect(awaitingAri([t], waiting).map((x) => x.id)).toContain('thr-x');
    const answered = { 'thr-x': [makeMessage({ from: 'you', body: 'q' }), makeMessage({ from: 'ari', body: 'a', routedTo: 'local' })] };
    expect(awaitingAri([t], answered)).toHaveLength(0);
  });
  it('Ari has stated responsibilities; the route targets are the real router options', () => {
    expect(ARI_RESPONSIBILITIES.length).toBeGreaterThanOrEqual(4);
    expect(ROUTE_TARGET_IDS).toEqual(['auto', 'local', 'claude']);
  });
});

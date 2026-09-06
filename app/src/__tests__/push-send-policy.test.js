// @vitest-environment node
// =============================================================================
// push-send-policy — the rules that decide who gets buzzed, and why
// =============================================================================
// Three properties here are load-bearing enough to be worth stating plainly,
// because each protects a person rather than a program:
//
//   1. A `live` announcement CANNOT be sent on a schedule guess. The app's
//      existing `liveStatus()` computes "live" from a hardcoded weekly window
//      and never asks whether a stream started (app/src/lib/church-live.js says
//      so in its own header). Buzzing a congregation at 11:00 on a Sunday the
//      stream never started is a fabricated state delivered to a pocket, which
//      is worse than silence. So `isLive:true` is required and is only ever set
//      by a real transition.
//   2. The dedupe key is DETERMINISTIC. The same real event must produce the
//      same key or the double-send lock does not lock.
//   3. A message notification NEVER carries the message text. DMs are E2E
//      encrypted; putting plaintext on a lock screen would undo that for the
//      last three feet, in public, over someone's shoulder.
import { describe, it, expect } from 'vitest';
import {
  validateSendRequest, dedupeKeyFor, liveAnnouncement, messageAnnouncement,
  SENDABLE_TOPICS, MAX_TITLE, MAX_BODY,
} from '../lib/push-send-policy.js';

describe('validateSendRequest — a send must say what it claims', () => {
  const live = {
    topic: 'live', instanceId: 'inst-1', churchId: 'colg', isLive: true,
    title: 'The Love Corner is live', body: 'Sunday Worship has started.',
  };

  it('accepts a well-formed live announcement', () => {
    const r = validateSendRequest(live);
    expect(r.ok).toBe(true);
    expect(r.value.topic).toBe('live');
    expect(r.value.dedupeKey).toMatch(/^live:colg:/);
  });

  it('REFUSES a live announcement without a confirmed transition', () => {
    // This is the guard against announcing a service that never started.
    const r = validateSendRequest({ ...live, isLive: false });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cannot confirm started|isLive/);
  });

  it('REFUSES a live announcement with no church', () => {
    expect(validateSendRequest({ ...live, churchId: '' }).ok).toBe(false);
  });

  it('refuses an unknown topic — no open-ended broadcast channel', () => {
    expect(validateSendRequest({ ...live, topic: 'marketing' }).ok).toBe(false);
    expect(validateSendRequest({ ...live, topic: '' }).ok).toBe(false);
    expect(SENDABLE_TOPICS).toEqual(['live', 'message']);
  });

  it('refuses a send with no title — a push with no claim is just a buzz', () => {
    expect(validateSendRequest({ ...live, title: '   ' }).ok).toBe(false);
  });

  it('refuses a send with no instance', () => {
    expect(validateSendRequest({ ...live, instanceId: '' }).ok).toBe(false);
  });

  it('requires a messageId for a message notification (it IS the dedupe key)', () => {
    const base = { topic: 'message', instanceId: 'i', title: 'Ada sent you a message' };
    expect(validateSendRequest(base).ok).toBe(false);
    const r = validateSendRequest({ ...base, messageId: 'msg-7' });
    expect(r.ok).toBe(true);
    expect(r.value.dedupeKey).toBe('message:msg-7');
  });

  it('truncates a title and body to lock-screen length rather than rejecting', () => {
    const r = validateSendRequest({ ...live, title: 'T'.repeat(500), body: 'B'.repeat(500) });
    expect(r.value.title.length).toBe(MAX_TITLE);
    expect(r.value.body.length).toBe(MAX_BODY);
  });

  it('DROPS an off-origin url — a push must not be able to redirect the app', () => {
    for (const url of ['https://evil.example/x', '//evil.example/x', '/\\evil.example/x', 'javascript:alert(1)']) {
      expect(validateSendRequest({ ...live, url }).value.url, url).toBeNull();
    }
    expect(validateSendRequest({ ...live, url: '/poetech-app/?tab=church' }).value.url)
      .toBe('/poetech-app/?tab=church');
  });

  it('keeps an explicit audience, and drops non-string entries', () => {
    const r = validateSendRequest({
      topic: 'message', instanceId: 'i', title: 't', messageId: 'm1',
      userIds: ['u1', '', null, 'u2', 42],
    });
    expect(r.value.userIds).toEqual(['u1', 'u2']);
  });

  it('a live send with no explicit audience targets everyone opted in', () => {
    expect(validateSendRequest(live).value.userIds).toBeNull();
  });

  it('does not crash on garbage input', () => {
    for (const bad of [null, undefined, 'string', 42, []]) {
      expect(validateSendRequest(bad).ok).toBe(false);
    }
  });
});

describe('dedupeKeyFor — the same event must always key the same', () => {
  it('two clicks in the same minute produce ONE key', () => {
    const a = dedupeKeyFor({ topic: 'live', churchId: 'colg', videoId: 'v1', at: '2026-09-06T16:00:03.000Z' });
    const b = dedupeKeyFor({ topic: 'live', churchId: 'colg', videoId: 'v1', at: '2026-09-06T16:00:47.500Z' });
    expect(a).toBe(b);
  });

  it('a genuinely later service is a DIFFERENT key', () => {
    const morning = dedupeKeyFor({ topic: 'live', churchId: 'colg', videoId: 'v1', at: '2026-09-06T16:00:00Z' });
    const evening = dedupeKeyFor({ topic: 'live', churchId: 'colg', videoId: 'v2', at: '2026-09-06T23:00:00Z' });
    expect(morning).not.toBe(evening);
  });

  it('different churches never collide', () => {
    const at = '2026-09-06T16:00:00Z';
    expect(dedupeKeyFor({ topic: 'live', churchId: 'colg', at }))
      .not.toBe(dedupeKeyFor({ topic: 'live', churchId: 'other', at }));
  });

  it('a message keys on its own id and nothing else', () => {
    expect(dedupeKeyFor({ topic: 'message', messageId: 'm-1', at: '2026-01-01T00:00:00Z' }))
      .toBe(dedupeKeyFor({ topic: 'message', messageId: 'm-1', at: '2026-12-31T23:59:00Z' }));
  });
});

describe('the words people actually see', () => {
  it('a live announcement states what happened, with no hype', () => {
    expect(liveAnnouncement({ churchName: 'The Love Corner', serviceLabel: 'Sunday Worship' }))
      .toEqual({ title: 'The Love Corner is live', body: 'Sunday Worship has started.' });
  });

  it('falls back honestly when the service label is unknown', () => {
    expect(liveAnnouncement({ churchName: 'The Love Corner' }).body).toBe('The service has started.');
  });

  it('PRIVACY: a message notification names the sender but NEVER the message', () => {
    // DMs are end-to-end encrypted. A lock screen is public.
    const n = messageAnnouncement({ senderName: 'Eldress Redding' });
    expect(n.title).toBe('Eldress Redding sent you a message');
    expect(n.body).toBe('Open the app to read it.');
  });

  it('the message notification has no field that could carry the text', () => {
    // Proven-to-catch by construction: if someone later adds the body, this
    // shape assertion fails and they have to justify it.
    expect(Object.keys(messageAnnouncement({ senderName: 'A' })).sort()).toEqual(['body', 'title']);
  });

  it('handles a missing sender name without leaking an empty title', () => {
    expect(messageAnnouncement({}).title).toBe('Someone sent you a message');
  });
});

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
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
import {
  validateSendRequest, dedupeKeyFor, liveAnnouncement, messageAnnouncement,
  SENDABLE_TOPICS, MAX_TITLE, MAX_BODY,
  audienceQuery, expandAudience, faultAnnouncement,
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
    // The list stays CLOSED and enumerated on purpose — this assertion exists
    // so a new broadcast channel cannot be added without someone looking at it.
    // 'fault' was added deliberately (DR-0378) and is NOT a broadcast: it
    // refuses to send without an explicit office audience, asserted below.
    expect(SENDABLE_TOPICS).toEqual(['live', 'message', 'fault']);
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

// ---------------------------------------------------------------------------
// WHO is read for a send (2026-09-09). Darrell's phone said "Notifications on"
// and mrspoe06's "Hello" buzzed nothing: a phone is filed under whichever
// instance was active when its owner tapped ON, and the message's tenant is
// whichever space the two share — filtered by instance, the person was never
// found. A message audience is the PERSON; a live audience is the congregation.
// ---------------------------------------------------------------------------
describe('audienceQuery — a message finds the person, a live announcement finds the church', () => {
  it('a message with a named recipient is read by user_id alone — no instance filter', () => {
    const q = audienceQuery({ topic: 'message', instanceId: 'church-1', userIds: ['u-darrell'] });
    expect(q.get('user_id')).toBe('in.(u-darrell)');
    expect(q.get('instance_id')).toBeNull();
    expect(q.get('topics')).toBe('cs.{message}');
    expect(q.get('disabled_at')).toBe('is.null');
  });
  it('a live announcement is the whole instance that opted in', () => {
    const q = audienceQuery({ topic: 'live', instanceId: 'church-1', userIds: null });
    expect(q.get('instance_id')).toBe('eq.church-1');
    expect(q.get('user_id')).toBeNull();
    expect(q.get('topics')).toBe('cs.{live}');
  });
  it('an empty or junk audience falls back to the instance, never to everyone everywhere', () => {
    expect(audienceQuery({ topic: 'message', instanceId: 'i', userIds: [] }).get('instance_id')).toBe('eq.i');
    expect(audienceQuery({ topic: 'message', instanceId: 'i', userIds: [null, 7, ''] }).get('instance_id')).toBe('eq.i');
  });
  it('opt-in and not-disabled are always part of the read', () => {
    for (const userIds of [['a'], null]) {
      const q = audienceQuery({ topic: 'message', instanceId: 'i', userIds });
      expect(q.get('topics')).toBe('cs.{message}');
      expect(q.get('disabled_at')).toBe('is.null');
    }
  });
  it('source pin: the sender reads its audience through audienceQuery and builds no instance filter of its own', () => {
    const fn = readFileSync(join(HERE, '..', '..', 'functions', 'api', 'push-send.js'), 'utf8');
    expect(fn).toContain('audienceQuery({ topic: req.topic, instanceId: req.instanceId, userIds: audience })');
    expect(fn).not.toMatch(/params\.set\('instance_id'/);
  });
});

// Darrell 2026-09-09: "I text my self and never got it... why?" — signed in as
// his phone account, he messaged his email account (a second user id, linked
// by person_links 0141). His phone opted in under the phone id; the message
// named the email id. The audience is every id that IS the person.
describe('expandAudience — one person, two doors, every phone', () => {
  it('widens a named recipient to every id person_links joins to them, either direction', () => {
    const rows = [{ primary_user: 'email-id', door_user: 'phone-id' }];
    expect(expandAudience(['email-id'], rows).sort()).toEqual(['email-id', 'phone-id']);
    expect(expandAudience(['phone-id'], rows).sort()).toEqual(['email-id', 'phone-id']);
  });
  it('never drops the ids it was given, never adds a stranger\'s link', () => {
    const rows = [{ primary_user: 'x', door_user: 'y' }];
    expect(expandAudience(['a'], rows)).toEqual(['a']);
    expect(expandAudience(['a'], [])).toEqual(['a']);
    expect(expandAudience(['a'], null)).toEqual(['a']);
  });
  it('deduplicates and ignores junk rows', () => {
    const rows = [{ primary_user: 'a', door_user: 'b' }, null, { primary_user: 7 }, { primary_user: 'a', door_user: 'b' }];
    expect(expandAudience(['a', 'a'], rows).sort()).toEqual(['a', 'b']);
  });
  it('source pin: the sender widens the audience through person_links before reading phones', () => {
    const fn = readFileSync(join(HERE, '..', '..', 'functions', 'api', 'push-send.js'), 'utf8');
    expect(fn).toContain("rest(supabaseUrl, 'person_links')");
    expect(fn).toContain('expandAudience(audience, await lr.json())');
    expect(fn).toContain('userIds: audience });');
  });
});

// =============================================================================
// 'fault' — the office hears that its own door is failing
// =============================================================================
// DR-0378, closing the last of DR-0374's chain. 0217 made a breaking door write
// its own row, but a row still waits for somebody to open the board. Sterling's
// order failed for months precisely because nothing reached anyone who could
// act.
//
// The security decision this suite exists to hold: a fault is ADDRESSED to the
// office, never BROADCAST to a tenant. `live` fans out to every opted-in device
// in an instance — correct for a congregation, wrong for "this business's shop
// is broken." Relying on "only the steward screen offers the toggle" would be a
// UI gate pretending to be an access gate.
// =============================================================================
describe("'fault' is addressed, never broadcast", () => {
  const fault = {
    topic: 'fault',
    instanceId: 'inst-1',
    faultId: 'f-1',
    title: 'Moore Divahs is reporting a problem',
    userIds: ['office-1', 'office-2'],
  };

  it('accepts a fault addressed to a named office', () => {
    const r = validateSendRequest(fault);
    expect(r.ok).toBe(true);
    expect(r.value.userIds).toEqual(['office-1', 'office-2']);
  });

  it('REFUSES a fault with no audience — there is no broadcast path', () => {
    expect(validateSendRequest({ ...fault, userIds: [] }).ok).toBe(false);
    expect(validateSendRequest({ ...fault, userIds: undefined }).ok).toBe(false);
    const r = validateSendRequest({ ...fault, userIds: [] });
    expect(r.error).toMatch(/never broadcast/i);
  });

  it('REFUSES a fault with no faultId — the dedupe key is not optional', () => {
    expect(validateSendRequest({ ...fault, faultId: '' }).ok).toBe(false);
  });

  it('routes to the PERSON path, not the instance path', () => {
    const q = audienceQuery({ topic: 'fault', instanceId: 'inst-1', userIds: ['office-1'] });
    expect(q.get('user_id')).toBe('in.(office-1)');
    expect(q.get('instance_id')).toBeNull(); // never fans out to the tenant
    expect(q.get('topics')).toBe('cs.{fault}');
  });
});

describe("a storm buzzes once, because 0217 already folded it", () => {
  it('the fault id IS the key — a fold returns the same id, so the same key', () => {
    expect(dedupeKeyFor({ topic: 'fault', faultId: 'f-1' })).toBe('fault:f-1');
    expect(dedupeKeyFor({ topic: 'fault', faultId: 'f-1', at: '2026-01-01' }))
      .toBe(dedupeKeyFor({ topic: 'fault', faultId: 'f-1', at: '2026-06-01' }));
  });

  it('a genuinely different fault is a different key', () => {
    expect(dedupeKeyFor({ topic: 'fault', faultId: 'f-2' }))
      .not.toBe(dedupeKeyFor({ topic: 'fault', faultId: 'f-1' }));
  });

  it('validate derives the key from the faultId when none is given', () => {
    const r = validateSendRequest({
      topic: 'fault', instanceId: 'i', faultId: 'f-9', title: 't', userIds: ['o'],
    });
    expect(r.value.dedupeKey).toBe('fault:f-9');
  });
});

describe('what the office reads on a lock screen', () => {
  it('names the business and carries the COUNT, which is the severity', () => {
    const a = faultAnnouncement({ brandLabel: 'Moore Divahs', occurrences: 47 });
    expect(a.title).toBe('Moore Divahs is reporting a problem');
    expect(a.body).toMatch(/47 times/);
  });

  it('reads correctly for a single first hit', () => {
    expect(faultAnnouncement({ brandLabel: 'Moore Divahs', occurrences: 1 }).body)
      .toMatch(/just now/);
    expect(faultAnnouncement({ brandLabel: 'Moore Divahs' }).body).not.toMatch(/undefined|NaN/);
  });

  it('carries NO error text and NO customer text — a lock screen is public', () => {
    const a = faultAnnouncement({ brandLabel: 'Moore Divahs', occurrences: 2 });
    const all = `${a.title} ${a.body}`;
    for (const leak of ['unknown pipeline', 'crm_capture_lead', 'SELECT', '@']) {
      expect(all).not.toContain(leak);
    }
    expect(a.body).toMatch(/Open the app/);
  });

  it('stays inside the lock-screen caps', () => {
    const a = faultAnnouncement({ brandLabel: 'x'.repeat(500), occurrences: 999999 });
    expect(a.title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(a.body.length).toBeLessThanOrEqual(MAX_BODY);
  });
});

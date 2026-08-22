// Tests for the 1:1 direct-message + security-report pure logic (2026-07-12).
// The privacy model is server-enforced (RLS); these lock the threading, unread
// tallies, shapes, and the security triage view the surface renders (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  toDmShape, groupDmThreads, unreadDmCount, threadMessages,
  toSecurityReportShape, openSecurityReports, openSecurityCount, securityStatusLabel,
  isSendableBody,
} from '../lib/direct-messages.js';

describe('toDmShape — perspective (who is "the other")', () => {
  it('outgoing: other = recipient, mine = true', () => {
    const s = toDmShape({ id: '1', sender_user_id: 'me', recipient_user_id: 'you', sender_name: 'Me', body: 'hi' }, 'me');
    expect(s).toMatchObject({ mine: true, otherUserId: 'you', body: 'hi' });
  });
  it('incoming: other = sender, mine = false', () => {
    const s = toDmShape({ id: '2', sender_user_id: 'you', recipient_user_id: 'me', sender_name: 'You' }, 'me');
    expect(s).toMatchObject({ mine: false, otherUserId: 'you', senderName: 'You' });
  });
});

describe('groupDmThreads + unread', () => {
  const rows = [
    toDmShape({ id: 'a', sender_user_id: 'you', recipient_user_id: 'me', sender_name: 'Usher', body: 'come to door 3', created_at: '2026-07-12T10:00:00Z', read_at: null }, 'me'),
    toDmShape({ id: 'b', sender_user_id: 'me', recipient_user_id: 'you', sender_name: 'Me', body: 'on my way', created_at: '2026-07-12T10:01:00Z' }, 'me'),
    toDmShape({ id: 'c', sender_user_id: 'sec', recipient_user_id: 'me', sender_name: 'Security', body: 'all clear', created_at: '2026-07-12T09:00:00Z', read_at: null }, 'me'),
  ];
  it('groups by correspondent, newest thread first, sets other name', () => {
    const threads = groupDmThreads(rows, 'me');
    expect(threads.map((t) => t.otherUserId)).toEqual(['you', 'sec']); // 'you' has later activity
    expect(threads[0]).toMatchObject({ otherName: 'Usher' });
    expect(threads[0].last.body).toBe('on my way');
  });
  it('counts only incoming unread', () => {
    expect(unreadDmCount(rows)).toBe(2); // a + c incoming unread; b is mine
    const threads = groupDmThreads(rows, 'me');
    expect(threads.find((t) => t.otherUserId === 'you').unread).toBe(1);
  });
  it('threadMessages returns one conversation oldest-first', () => {
    expect(threadMessages(rows, 'you').map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('security reports — anyone reports, security triages', () => {
  const reports = [
    toSecurityReportShape({ id: 'r1', reporter_user_id: 'u1', reporter_name: 'Sister A', body: 'Fall in the lobby', location: 'Lobby', status: 'new', created_at: '2026-07-12T11:00:00Z' }, 'u1'),
    toSecurityReportShape({ id: 'r2', reporter_user_id: 'u2', reporter_name: 'Usher B', body: 'Door propped open', status: 'resolved', created_at: '2026-07-12T10:00:00Z' }, 'u1'),
    toSecurityReportShape({ id: 'r3', reporter_user_id: 'u3', reporter_name: 'Deacon', body: 'Need help at Van 2', status: 'acknowledged', created_at: '2026-07-12T11:30:00Z' }, 'u1'),
  ];
  it('open reports exclude resolved, newest first', () => {
    expect(openSecurityReports(reports).map((r) => r.id)).toEqual(['r3', 'r1']);
    expect(openSecurityCount(reports)).toBe(2);
  });
  it('maps mine + status label', () => {
    expect(reports[0].mine).toBe(true);
    expect(securityStatusLabel('acknowledged')).toBe('Acknowledged');
  });
});

describe('isSendableBody', () => {
  it('rejects empty / whitespace, accepts real content', () => {
    expect(isSendableBody('')).toBe(false);
    expect(isSendableBody('   ')).toBe(false);
    expect(isSendableBody('come here')).toBe(true);
    expect(isSendableBody(null)).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// The smooth-flow cures (Darrell + Christina, live, 2026-08-22: "I had to go
// out and come back in to see I had new messages" · "once I view the message I
// should not have it look like I didn't view it yet"). The realtime stream is
// the fast path, never the only path; viewed = read instantly.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markThreadReadLocal } from '../lib/direct-messages.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('markThreadReadLocal — viewed means read, instantly', () => {
  const mk = (id, other, mine, readAt = null) => ({ id, otherUserId: other, mine, readAt, body: id, createdAt: '2026-08-22T10:00:00Z' });

  it('marks only the open thread\'s unread INCOMING rows; everything else passes through', () => {
    const rows = [mk('a', 'chris', false), mk('b', 'chris', true), mk('c', 'other', false), mk('d', 'chris', false, '2026-08-22T09:00:00Z')];
    const out = markThreadReadLocal(rows, 'chris', '2026-08-22T10:05:00Z');
    expect(out[0].readAt).toBe('2026-08-22T10:05:00Z'); // incoming unread -> read
    expect(out[1]).toBe(rows[1]);                        // my own row untouched (same reference)
    expect(out[2]).toBe(rows[2]);                        // other thread untouched
    expect(out[3]).toBe(rows[3]);                        // already-read untouched
  });

  it('clears the thread badge and the nav badge together', () => {
    const rows = [mk('a', 'chris', false), mk('b', 'chris', false)];
    expect(unreadDmCount(rows)).toBe(2);
    const out = markThreadReadLocal(rows, 'chris');
    expect(unreadDmCount(out)).toBe(0);
    expect(groupDmThreads(out)[0].unread).toBe(0);
  });

  it('is pure — the input array is never mutated', () => {
    const rows = [mk('a', 'chris', false)];
    markThreadReadLocal(rows, 'chris');
    expect(rows[0].readAt).toBe(null);
  });
});

describe('the stream is never the only path (source gates, proven-to-catch)', () => {
  const sync = readFileSync(join(HERE, '..', 'lib', 'direct-messages-sync.js'), 'utf8');
  const surface = readFileSync(join(HERE, '..', 'components', 'DirectMessages.jsx'), 'utf8');

  it('subscribeDirectMessages carries a heartbeat poll and a visibility refetch', () => {
    expect(sync).toMatch(/DM_HEARTBEAT_MS = 15000/);
    expect(sync).toMatch(/}, DM_HEARTBEAT_MS\)/);
    // Occurrence-first: the heartbeat never ticks off-screen.
    expect(sync).toMatch(/visibilityState === 'hidden'\) return;/);
    expect(sync).toMatch(/visibilitychange/);
    expect(sync).toMatch(/unsubscribe\.refresh = \(\) => refresh\(\)/);
  });

  it('the surface refreshes on the user\'s own actions instead of waiting', () => {
    expect(surface).toMatch(/subRef\.current\?\.refresh\?\.\(\)/);
    expect(surface).toMatch(/markThreadReadLocal\(prev, otherUserId\)/);
  });

  it('a message arriving while its thread is open never shows an unread badge', () => {
    expect(surface).toMatch(/convo\.some\(\(m\) => m && !m\.mine && !m\.readAt\)/);
  });

  it('sending appends optimistically and keeps the composer focused; Enter sends', () => {
    expect(surface).toMatch(/local-\$\{nowIso\}/);
    expect(surface).toMatch(/taRef\.current\?\.focus\(\)/);
    expect(surface).toMatch(/e\.key === 'Enter' && !e\.shiftKey/);
  });
});

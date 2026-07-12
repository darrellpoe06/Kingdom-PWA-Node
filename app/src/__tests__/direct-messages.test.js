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

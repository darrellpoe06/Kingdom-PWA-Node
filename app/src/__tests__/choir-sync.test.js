// Tests for the Choir module's pure mappers + access/derivation helpers
// (Darrell 2026-06-14). Locks the row<->shape mapping, the access gate, the
// YouTube normalization, and the schedule/song selection used by the surface.
// Pairs with RELEASE-LANE.md (tests ship with the feature).
import { describe, it, expect } from 'vitest';
import {
  toSongShape, toScheduleShape, toMemberShape, toChoirMessageShape, toAbsenceShape,
  deriveAccess, youtubeEmbedUrl, sortServices, songsForService,
  weekBucket, isOutOnDate, membersOutOnDate, suggestBackups,
} from '../lib/choir-sync.js';

describe('deriveAccess (visibility/edit gate)', () => {
  it('owner/admin can see AND edit', () => {
    expect(deriveAccess('owner', false)).toEqual({ canEdit: true, canSee: true });
    expect(deriveAccess('admin', false)).toEqual({ canEdit: true, canSee: true });
  });
  it('a roster member can see but not edit', () => {
    expect(deriveAccess('member', true)).toEqual({ canEdit: false, canSee: true });
  });
  it('a non-member non-director can neither see nor edit', () => {
    expect(deriveAccess('member', false)).toEqual({ canEdit: false, canSee: false });
    expect(deriveAccess(null, false)).toEqual({ canEdit: false, canSee: false });
  });
});

describe('youtubeEmbedUrl', () => {
  it('normalizes watch, youtu.be, embed, and bare-id forms', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
  it('handles extra query params on a watch URL', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
  it('returns null for junk / empty', () => {
    expect(youtubeEmbedUrl('')).toBeNull();
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl('https://example.com/song')).toBeNull();
  });
});

describe('row -> shape mappers', () => {
  it('toSongShape maps columns and defaults', () => {
    expect(toSongShape({ id: 's1', title: 'Hymn', youtube_url: 'u', service_date: '2026-06-21', service_type: 'sunday' }))
      .toMatchObject({ id: 's1', title: 'Hymn', youtubeUrl: 'u', serviceDate: '2026-06-21', serviceType: 'sunday', sortOrder: 0, status: 'active' });
  });
  it('toScheduleShape maps a service row', () => {
    expect(toScheduleShape({ id: 'v1', service_date: '2026-06-19', service_type: 'rehearsal', title: 'Weekly' }))
      .toEqual({ id: 'v1', serviceDate: '2026-06-19', serviceType: 'rehearsal', title: 'Weekly', notes: null });
  });
  it('toMemberShape maps a roster row with role default', () => {
    expect(toMemberShape({ id: 'm1', display_name: 'Christina', choir_role: 'director', section: 'soprano' }))
      .toEqual({ id: 'm1', userId: null, displayName: 'Christina', section: 'soprano', choirRole: 'director', createdAt: null });
    expect(toMemberShape({ id: 'm2', display_name: 'Pat' }).choirRole).toBe('member');
  });
  it('toChoirMessageShape flags my own messages', () => {
    expect(toChoirMessageShape({ id: 'x', user_id: 'u1', display_name: 'Me', body: 'hi', created_at: 't' }, 'u1').mine).toBe(true);
    expect(toChoirMessageShape({ id: 'y', user_id: 'u2', display_name: 'You', body: 'yo', created_at: 't' }, 'u1').mine).toBe(false);
  });
});

describe('sortServices', () => {
  const schedule = [
    { id: 'a', serviceDate: '2026-06-10', serviceType: 'sunday' },   // past
    { id: 'b', serviceDate: '2026-06-21', serviceType: 'sunday' },   // future
    { id: 'c', serviceDate: '2026-06-19', serviceType: 'rehearsal' },// future, sooner
    { id: 'd', serviceDate: '2026-06-01', serviceType: 'sunday' },   // older past
  ];
  it('puts upcoming first (soonest first), then past (newest first)', () => {
    expect(sortServices(schedule, '2026-06-14').map((s) => s.id)).toEqual(['c', 'b', 'a', 'd']);
  });
  it('is safe on empty', () => {
    expect(sortServices(null, '2026-06-14')).toEqual([]);
  });
});

describe('songsForService', () => {
  const songs = [
    { id: '1', title: 'B', serviceDate: '2026-06-21', serviceType: 'sunday', sortOrder: 2, status: 'active' },
    { id: '2', title: 'A', serviceDate: '2026-06-21', serviceType: 'sunday', sortOrder: 1, status: 'active' },
    { id: '3', title: 'Both', serviceDate: '2026-06-21', serviceType: 'both', sortOrder: 0, status: 'active' },
    { id: '4', title: 'Other day', serviceDate: '2026-06-19', serviceType: 'rehearsal', sortOrder: 0, status: 'active' },
    { id: '5', title: 'Archived', serviceDate: '2026-06-21', serviceType: 'sunday', sortOrder: 0, status: 'archived' },
  ];
  it('selects active songs for the date+type (incl. both), ordered by sortOrder', () => {
    expect(songsForService(songs, '2026-06-21', 'sunday').map((s) => s.id)).toEqual(['3', '2', '1']);
  });
  it('a "both" song shows on the rehearsal too', () => {
    expect(songsForService(songs, '2026-06-21', 'rehearsal').map((s) => s.id)).toEqual(['3']);
  });
  it('excludes archived and other dates', () => {
    const ids = songsForService(songs, '2026-06-21', 'sunday').map((s) => s.id);
    expect(ids).not.toContain('5');
    expect(ids).not.toContain('4');
  });
});

describe('weekBucket (multi-week planning)', () => {
  const today = '2026-06-14';
  it('buckets dates into this / next / later / past', () => {
    expect(weekBucket('2026-06-14', today)).toBe('this');   // today
    expect(weekBucket('2026-06-21', today)).toBe('this');   // +7
    expect(weekBucket('2026-06-22', today)).toBe('next');   // +8
    expect(weekBucket('2026-06-28', today)).toBe('next');   // +14
    expect(weekBucket('2026-06-29', today)).toBe('later');  // +15
    expect(weekBucket('2026-06-01', today)).toBe('past');
  });
});

describe('absence date logic', () => {
  it('isOutOnDate covers a single day and a range', () => {
    expect(isOutOnDate({ startDate: '2026-06-21' }, '2026-06-21')).toBe(true);
    expect(isOutOnDate({ startDate: '2026-06-21' }, '2026-06-22')).toBe(false);
    expect(isOutOnDate({ startDate: '2026-06-20', endDate: '2026-06-23' }, '2026-06-22')).toBe(true);
    expect(isOutOnDate({ startDate: '2026-06-20', endDate: '2026-06-23' }, '2026-06-24')).toBe(false);
  });
  it('membersOutOnDate returns the member ids out that day', () => {
    const abs = [
      { memberId: 'm1', startDate: '2026-06-21' },
      { memberId: 'm2', startDate: '2026-06-20', endDate: '2026-06-25' },
      { memberId: 'm3', startDate: '2026-06-28' },
    ];
    expect(membersOutOnDate(abs, '2026-06-21').sort()).toEqual(['m1', 'm2']);
  });
});

describe('suggestBackups', () => {
  const members = [
    { id: 'm1', displayName: 'Lead', section: 'soprano', choirRole: 'member' },
    { id: 'm2', displayName: 'Sop2', section: 'soprano', choirRole: 'member' },
    { id: 'm3', displayName: 'Sop3', section: 'soprano', choirRole: 'member' },
    { id: 'm4', displayName: 'Alto', section: 'alto', choirRole: 'member' },
    { id: 'm5', displayName: 'SoundGuy', section: null, choirRole: 'sound' },
  ];
  it('suggests same-section members who are not out and not the absentee', () => {
    const absences = [{ memberId: 'm3', startDate: '2026-06-21' }]; // m3 also out
    const out = suggestBackups(members, absences, '2026-06-21', members[0]); // m1 (soprano) is out
    expect(out.map((m) => m.id)).toEqual(['m2']); // m3 excluded (out), m4 wrong section, m1 self, m5 support
  });
  it('excludes the sound/media/tech support roles from backup suggestions', () => {
    const out = suggestBackups(members, [], '2026-06-21', members[0]);
    expect(out.map((m) => m.id)).not.toContain('m5');
  });
  it('suggests anyone available when the absentee has no section', () => {
    const noSection = { id: 'mX', displayName: 'X', section: null, choirRole: 'member' };
    const out = suggestBackups([...members, noSection], [], '2026-06-21', noSection);
    expect(out.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']); // all singers, not the support role, not self
  });
});

describe('toAbsenceShape', () => {
  it('flags mine + iAmBackup and maps backup fields', () => {
    const row = { id: 'a1', user_id: 'u1', member_name: 'Me', start_date: '2026-06-21', end_date: null, backup_user_id: 'u2', backup_name: 'Backup', backup_status: 'requested', created_by: 'u1' };
    expect(toAbsenceShape(row, 'u1')).toMatchObject({ mine: true, iAmBackup: false, backupName: 'Backup', backupStatus: 'requested' });
    expect(toAbsenceShape(row, 'u2')).toMatchObject({ mine: false, iAmBackup: true });
  });
});

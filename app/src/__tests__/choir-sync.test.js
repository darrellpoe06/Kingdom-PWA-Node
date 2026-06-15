// Tests for the Choir module's pure mappers + access/derivation helpers
// (Darrell 2026-06-14). Locks the row<->shape mapping, the access gate, the
// YouTube normalization, and the schedule/song selection used by the surface.
// Pairs with RELEASE-LANE.md (tests ship with the feature).
import { describe, it, expect } from 'vitest';
import {
  toSongShape, toScheduleShape, toMemberShape, toChoirMessageShape, toAbsenceShape,
  toSermonShape, toResourceShape, toSermonDocShape, toTeamDocShape,
  deriveAccess, youtubeEmbedUrl, sortServices, songsForService,
  weekBucket, isOutOnDate, membersOutOnDate, suggestBackups, buildReusedSong, buildReusedSermon,
  parseTimecode, formatTimecode, youtubeTimedUrl, parseServiceTitle, extractYoutubeId,
  selectNewSermonImports, isValidInviteEmail, isExternalUrl,
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
  it('toScheduleShape maps a service row incl. the service video', () => {
    expect(toScheduleShape({ id: 'v1', service_date: '2026-06-19', service_type: 'rehearsal', title: 'Weekly', youtube_url: 'https://youtu.be/x' }))
      .toEqual({ id: 'v1', serviceDate: '2026-06-19', serviceType: 'rehearsal', title: 'Weekly', youtubeUrl: 'https://youtu.be/x', notes: null });
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

describe('buildReusedSong (reuse a past song on a future date)', () => {
  const past = { id: 'old', title: 'Goodness of God', youtubeUrl: 'https://youtu.be/g', scriptureRef: 'Ps 107', notes: 'soprano lead', serviceDate: '2024-03-10', serviceType: 'sunday', status: 'active' };
  it('carries the content but lands a fresh active row on the new date', () => {
    const out = buildReusedSong(past, '2026-07-05', 'sunday');
    expect(out.id).toBeUndefined();        // a NEW row, not an edit of the old one
    expect(out.title).toBe('Goodness of God');
    expect(out.youtubeUrl).toBe('https://youtu.be/g');
    expect(out.scriptureRef).toBe('Ps 107');
    expect(out.serviceDate).toBe('2026-07-05');
    expect(out.serviceType).toBe('sunday');
    expect(out.status).toBe('active');
    expect(out.sortOrder).toBe(0);
  });
  it('defaults the service type to the original when not given', () => {
    expect(buildReusedSong({ ...past, serviceType: 'rehearsal' }, '2026-07-09').serviceType).toBe('rehearsal');
  });
});

describe('toAbsenceShape', () => {
  it('flags mine + iAmBackup and maps backup fields', () => {
    const row = { id: 'a1', user_id: 'u1', member_name: 'Me', start_date: '2026-06-21', end_date: null, backup_user_id: 'u2', backup_name: 'Backup', backup_status: 'requested', created_by: 'u1' };
    expect(toAbsenceShape(row, 'u1')).toMatchObject({ mine: true, iAmBackup: false, backupName: 'Backup', backupStatus: 'requested' });
    expect(toAbsenceShape(row, 'u2')).toMatchObject({ mine: false, iAmBackup: true });
  });
});

describe('timecodes + timestamp deep-links', () => {
  it('parseTimecode handles mm:ss, h:mm:ss, plain seconds, and junk', () => {
    expect(parseTimecode('12:30')).toBe(750);
    expect(parseTimecode('1:05:00')).toBe(3900);
    expect(parseTimecode('90')).toBe(90);
    expect(parseTimecode('')).toBeNull();
    expect(parseTimecode(null)).toBeNull();
    expect(parseTimecode('abc')).toBeNull();
  });
  it('formatTimecode round-trips', () => {
    expect(formatTimecode(750)).toBe('12:30');
    expect(formatTimecode(3900)).toBe('1:05:00');
    expect(formatTimecode(null)).toBe('');
  });
  it('youtubeTimedUrl appends a start time only when positive', () => {
    expect(youtubeTimedUrl('https://youtu.be/x', 750)).toBe('https://youtu.be/x?t=750s');
    expect(youtubeTimedUrl('https://www.youtube.com/watch?v=x', 30)).toBe('https://www.youtube.com/watch?v=x&t=30s');
    expect(youtubeTimedUrl('https://youtu.be/x', 0)).toBe('https://youtu.be/x');
    expect(youtubeTimedUrl('https://youtu.be/x', null)).toBe('https://youtu.be/x');
  });
});

describe('parseServiceTitle (the YouTube importer core — real channel titles)', () => {
  it('parses a Sunday message', () => {
    expect(parseServiceTitle('6 -10 - 2026 Bishop E. Gwin  " LET GO AND LET GOD HELP YOU"'))
      .toEqual({ serviceDate: '2026-06-10', serviceType: 'sunday', title: 'LET GO AND LET GOD HELP YOU', speaker: 'Bishop E. Gwin' });
  });
  it('parses a Wednesday Bible Study', () => {
    expect(parseServiceTitle('6 -3 - 2026 Bishop Lloyd Gwin Wednesday Bible Study  "THANK YOU FOR THE REMINDER!"'))
      .toMatchObject({ serviceDate: '2026-06-03', serviceType: 'wednesday', title: 'THANK YOU FOR THE REMINDER!' });
  });
  it('expands a 2-digit year', () => {
    expect(parseServiceTitle('5 - 6 - 26 Bishop Lloyd E. Gwin Wednesday Bible Study " NEED ANSWERS"').serviceDate).toBe('2026-05-06');
  });
  it('parses slash-separated and space-separated dates (real channel variants)', () => {
    expect(parseServiceTitle('3/5/2025 Bishop Lloyd Gwin Wednesday Bible Study "SOMEBODY..."').serviceDate).toBe('2025-03-05');
    expect(parseServiceTitle('3 26 25 Bishop Lloyd Gwin Wednesday Bible Study "YOU CAN\'T..."').serviceDate).toBe('2025-03-26');
  });
  it('returns a null date when none is present (caller falls back to raw title)', () => {
    expect(parseServiceTitle('Choir rehearsal clip').serviceDate).toBeNull();
    expect(parseServiceTitle('Black History Month 2025 at The Love Corner').serviceDate).toBeNull();
  });
});

describe('selectNewSermonImports (idempotent channel import)', () => {
  const items = [
    { videoId: 'vNEW1', title: '6 -10 - 2026 Bishop E. Gwin "LET GO"' },          // new, dated, sunday
    { videoId: 'vHAVE', title: '6 -3 - 2026 Bishop Gwin Wednesday Bible Study "X"' }, // already stored
    { videoId: 'vNODATE', title: 'Black History Month at The Love Corner' },        // no date -> skip
    { videoId: 'vNEW2', title: '5/28/2026 Bishop Gwin Wednesday Bible Study "Y"' },  // new, slash date
  ];
  it('keeps only new, dated videos and shapes them for insert', () => {
    const out = selectNewSermonImports(items, ['vHAVE']);
    expect(out.map((r) => r.videoId)).toEqual(['vNEW1', 'vNEW2']);
    expect(out[0]).toMatchObject({ serviceType: 'sunday', serviceDate: '2026-06-10', source: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=vNEW1' });
    expect(out[1].serviceType).toBe('wednesday');
  });
  it('returns nothing when every video is already stored', () => {
    expect(selectNewSermonImports(items, ['vNEW1', 'vHAVE', 'vNEW2'])).toEqual([]);
  });
  it('is safe on empty inputs', () => {
    expect(selectNewSermonImports(null, null)).toEqual([]);
  });
});

describe('isExternalUrl (sermon doc: external link vs storage path)', () => {
  it('is true for http(s) links, false for storage paths', () => {
    expect(isExternalUrl('https://docs.google.com/x')).toBe(true);
    expect(isExternalUrl('http://x.y/z')).toBe(true);
    expect(isExternalUrl('a1b2-uuid/sermon-uuid/06-10 PROCLAIM.docx')).toBe(false);
    expect(isExternalUrl('')).toBe(false);
    expect(isExternalUrl(null)).toBe(false);
  });
});

describe('isValidInviteEmail (church onboarding)', () => {
  it('accepts real-looking emails, rejects junk', () => {
    expect(isValidInviteEmail('singer@example.com')).toBe(true);
    expect(isValidInviteEmail('  a@b.co ')).toBe(true);
    expect(isValidInviteEmail('')).toBe(false);
    expect(isValidInviteEmail('nope')).toBe(false);
    expect(isValidInviteEmail('a@b')).toBe(false);
    expect(isValidInviteEmail(null)).toBe(false);
  });
});

describe('extractYoutubeId', () => {
  it('pulls the id from watch / youtu.be / embed / bare forms', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=_f0sVWTrNgw')).toBe('_f0sVWTrNgw');
    expect(extractYoutubeId('https://youtu.be/_f0sVWTrNgw')).toBe('_f0sVWTrNgw');
    expect(extractYoutubeId('nope')).toBeNull();
  });
});

describe('sermon + resource mappers and reuse', () => {
  it('toSermonShape maps a row with defaults + service slot (documents live in their own admin-only table)', () => {
    const out = toSermonShape({ id: 's1', title: 'Built to Win', service_type: 'wednesday', service_slot: 'evening', youtube_url: 'u', start_seconds: 2100, status: 'active' });
    expect(out).toMatchObject({ id: 's1', title: 'Built to Win', serviceType: 'wednesday', serviceSlot: 'evening', youtubeUrl: 'u', startSeconds: 2100, status: 'active', source: 'manual' });
    expect(out.documentUrl).toBeUndefined(); // not on the choir-readable sermon row
  });
  it('toResourceShape maps a row', () => {
    expect(toResourceShape({ id: 'r1', title: 'Worship chart', url: 'https://x', note: 'weekly' }))
      .toEqual({ id: 'r1', title: 'Worship chart', url: 'https://x', note: 'weekly', createdAt: null });
  });
  it('toSermonDocShape maps the admin-only document row', () => {
    expect(toSermonDocShape({ id: 'd1', sermon_id: 's1', document_url: 'https://doc', document_source: 'email' }))
      .toEqual({ id: 'd1', sermonId: 's1', documentUrl: 'https://doc', documentSource: 'email' });
  });
  it('toTeamDocShape maps the choir-visible team doc', () => {
    expect(toTeamDocShape({ id: 't1', doc_date: '2026-06-14', doc_type: 'order-of-service', title: 'OOS', document_url: 'path/x.docx', document_source: 'email' }))
      .toEqual({ id: 't1', docDate: '2026-06-14', docType: 'order-of-service', title: 'OOS', documentUrl: 'path/x.docx', documentSource: 'email', createdAt: null });
  });
  it('buildReusedSermon makes a future DRAFT that references the original', () => {
    const out = buildReusedSermon({ title: 'Let Go', serviceType: 'sunday', scriptureRef: '1 Pet 5', notes: 'rest in God', youtubeUrl: 'https://youtu.be/x' }, '2026-08-02', 'sunday');
    expect(out.id).toBeUndefined();
    expect(out.status).toBe('draft');
    expect(out.serviceDate).toBe('2026-08-02');
    expect(out.title).toBe('Let Go');
    expect(out.youtubeUrl).toBeNull();          // a fresh message, not the old video
    expect(out.notes).toContain('Drawn from: https://youtu.be/x');
  });
});

describe('toSongShape carries the timestamp + lyrics', () => {
  it('maps start_seconds and lyrics (the choir word space)', () => {
    const out = toSongShape({ id: 's', title: 'x', start_seconds: 740, lyrics: 'Holy, holy, holy' });
    expect(out.startSeconds).toBe(740);
    expect(out.lyrics).toBe('Holy, holy, holy');
  });
});

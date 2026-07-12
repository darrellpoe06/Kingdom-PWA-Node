// Tests for lib/resolve-church.js — the ONE effective-church-home resolver the
// Church tab and the global Live Worship bar share.
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the regressions these guard are (1)
// a signed-out / placeholder user NOT landing on the COLG default home, (2) a
// pre-2026-06-15 COLG record NOT getting its live channel backfilled (Live
// Worship goes dead for COLG members), and (3) the backfill LEAKING COLG's
// channel onto a genuinely different church (someone else's stream on their
// page). Each case below fails if that behavior regresses.
import { describe, it, expect } from 'vitest';
import { resolveChurch, looksLikeColg } from '../lib/resolve-church.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const COLG_CHANNEL_ID = 'UC821pJh7YR5llBNnWUJj-ZA';

describe('resolveChurch — default church home fallback', () => {
  it('falls back to COLG for a null/undefined church', () => {
    expect(resolveChurch(null)).toBe(COLG_DEFAULT_CHURCH);
    expect(resolveChurch(undefined)).toBe(COLG_DEFAULT_CHURCH);
  });
  it('falls back to COLG for the anonymized "Your home church" placeholder', () => {
    expect(resolveChurch({ name: 'Your home church' })).toBe(COLG_DEFAULT_CHURCH);
  });
  it('keeps the COLG channel available on the default', () => {
    expect(resolveChurch(null).youtubeChannelId).toBe(COLG_CHANNEL_ID);
  });
});

describe('resolveChurch — COLG channel backfill (pre-2026-06-15 saved homes)', () => {
  it('backfills the COLG channel + media onto a COLG record missing the field', () => {
    const saved = { name: 'The Church of the Living God', site: 'https://thechurchofthelivinggod.com' };
    const c = resolveChurch(saved);
    expect(c.youtubeChannelId).toBe(COLG_CHANNEL_ID);
    expect(c.media?.youtube).toBe(COLG_DEFAULT_CHURCH.media.youtube);
  });
  it('recognizes COLG by the Love Corner nickname too', () => {
    const saved = { name: 'TCOLG', nickname: 'The Love Corner — Champaign' };
    expect(resolveChurch(saved).youtubeChannelId).toBe(COLG_CHANNEL_ID);
  });
  it('does NOT overwrite a COLG record that already carries its own channel', () => {
    const saved = { name: 'The Church of the Living God', youtubeChannelId: 'UCowNchannel1234567890x' };
    expect(resolveChurch(saved).youtubeChannelId).toBe('UCowNchannel1234567890x');
  });
});

describe('resolveChurch — a genuinely different church is never COLG-fied', () => {
  it('returns a non-COLG church untouched, with no channel leaked in', () => {
    const other = {
      name: 'Grace Fellowship', site: 'https://example.org',
      services: [{ id: 's1', day: 'Sunday', time: '9:00 AM', label: 'Worship', online: false }],
    };
    const c = resolveChurch(other);
    expect(c).toBe(other);
    expect(c.youtubeChannelId).toBeUndefined();
  });
});

describe('looksLikeColg', () => {
  it('matches by name, nickname, or site; rejects others', () => {
    expect(looksLikeColg({ name: 'The Church of the Living God' })).toBe(true);
    expect(looksLikeColg({ nickname: 'The Love Corner' })).toBe(true);
    expect(looksLikeColg({ site: 'https://thechurchofthelivinggod.com/give' })).toBe(true);
    expect(looksLikeColg({ name: 'Grace Fellowship' })).toBe(false);
    expect(looksLikeColg(null)).toBe(false);
  });
});

// The church's REAL contact facts, verified against its own printed documents
// (2026-07-12: the July 2026 calendar + orders of service). These were empty /
// placeholder before; the church home renders phone as click-to-call and shows
// the pastor + office hours, so a regression to blank is a visible, wrong front
// door for the congregation (DR-0076 — real data, sourced, rendered).
describe('COLG_DEFAULT_CHURCH — the real contact record (document-verified)', () => {
  it('carries the church office phone (click-to-call), not a blank', () => {
    expect(COLG_DEFAULT_CHURCH.phone).toBe('217-359-6920');
  });
  it('names the pastor and office hours from the letterhead', () => {
    expect(COLG_DEFAULT_CHURCH.pastor).toMatch(/Lloyd E\. Gwin/);
    expect(COLG_DEFAULT_CHURCH.officeHours).toMatch(/Mon.*Fri/);
  });
  it('the address carries the ZIP', () => {
    expect(COLG_DEFAULT_CHURCH.address).toMatch(/61820/);
  });
  it('the 77th National Assembly dates match the calendar (Jul 14–16, 2026)', () => {
    const a = COLG_DEFAULT_CHURCH.announcedEvents.find((e) => /77th/.test(e.name));
    expect(a.date).toBe('2026-07-14');
    expect(a.endDate).toBe('2026-07-16');
  });
  it('was founded in 1946 (letterhead + Bishop Gwin brief)', () => {
    expect(COLG_DEFAULT_CHURCH.founded).toBe(1946);
  });
  it('Sunday Worship carries its full 11:00 AM–12:15 PM window', () => {
    const sun = COLG_DEFAULT_CHURCH.services.find((s) => s.day === 'Sunday');
    expect(sun.time).toBe('11:00 AM');
    expect(sun.endTime).toBe('12:15 PM');
  });
});

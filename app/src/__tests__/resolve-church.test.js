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

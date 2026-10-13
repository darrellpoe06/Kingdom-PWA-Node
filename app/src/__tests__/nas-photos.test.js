// R15 sovereign photo write-path — client guards. The upload destination is
// user-influenced, so isValidDest is the device-side belt (the workflow is the
// real gate); these lock that no traversal or junk dest leaves the device.
import { describe, it, expect, beforeEach } from 'vitest';
import { isValidDest, isValidAlbum, bigPictureAlbum, setBigPictureAlbum, propertyPhotosUrl, familyPhotosUrl, albumPhotosUrl, NAS_PHOTO_BASE, setBridgeToken, bridgeToken, hasBridgeToken } from '../lib/nas-photos.js';

// 2026-07-01 regression fix: property photos moved OFF the n8n bridge onto the
// sovereign Python image server, reached via the same-origin `/nas-photos`
// rewrite. This pins the cutover so a stray edit can't silently route property
// photos back through /n8n/webhook (which is what broke on 2026-07-01).
describe('propertyPhotosUrl (sovereign Python image server path)', () => {
  it('targets the /nas-photos base, NOT the old /n8n/webhook bridge', () => {
    const url = propertyPhotosUrl('1003Koehn', { limit: 48, offset: 0 });
    expect(NAS_PHOTO_BASE).toBe('/nas-photos');
    expect(url.startsWith('/nas-photos/property-photos')).toBe(true);
    expect(url).not.toContain('/n8n');
    expect(url).not.toContain('webhook');
  });

  it('encodes the channel and carries limit/offset', () => {
    expect(propertyPhotosUrl('805NProspect', { limit: 24, offset: 96 }))
      .toBe('/nas-photos/property-photos?channel=805NProspect&limit=24&offset=96');
    // a channel with URL-significant chars is encoded, never injected raw
    expect(propertyPhotosUrl('a&b', { limit: 1, offset: 0 }))
      .toBe('/nas-photos/property-photos?channel=a%26b&limit=1&offset=0');
  });

  it('defaults limit/offset when omitted', () => {
    expect(propertyPhotosUrl('1003Koehn')).toBe('/nas-photos/property-photos?channel=1003Koehn&limit=24&offset=0');
  });
});

// 2026-07-21 (DR-0218 zero-n8n): family + album reads joined the sovereign
// `/nas-photos` server. This pins that cutover so a stray edit can't route them
// back through /n8n/webhook (the same regression class the property test guards).
describe('familyPhotosUrl / albumPhotosUrl (sovereign server, not n8n)', () => {
  it('family gallery targets /nas-photos/family-photos, never /n8n', () => {
    const url = familyPhotosUrl({ limit: 12 });
    expect(url).toBe('/nas-photos/family-photos?limit=12');
    expect(url).not.toContain('/n8n');
    expect(url).not.toContain('webhook');
  });

  it('curated album targets /nas-photos/album-photos, encodes the album name, never /n8n', () => {
    expect(albumPhotosUrl('Big Picture', { limit: 60 }))
      .toBe('/nas-photos/album-photos?album=Big%20Picture&limit=60');
    const url = albumPhotosUrl("Family & Faith");
    expect(url.startsWith('/nas-photos/album-photos')).toBe(true);
    expect(url).toContain('album=Family%20%26%20Faith');
    expect(url).not.toContain('/n8n');
    expect(url).not.toContain('webhook');
  });
});

describe('isValidDest', () => {
  it('accepts the family root and clean property channels', () => {
    expect(isValidDest('family')).toBe(true);
    expect(isValidDest('805NProspect')).toBe(true);
    expect(isValidDest('1521_Oak-Ave.2')).toBe(true);
  });

  it('rejects traversal, slashes, and junk', () => {
    expect(isValidDest('../etc')).toBe(false);
    expect(isValidDest('a/b')).toBe(false);
    expect(isValidDest('..')).toBe(false);
    expect(isValidDest('')).toBe(false);
    expect(isValidDest('x'.repeat(65))).toBe(false);
    expect(isValidDest(null)).toBe(false);
    expect(isValidDest(undefined)).toBe(false);
  });
});

// Album names are human-named in Synology Photos — they routinely contain
// SPACES. This test pins the bug live-verification caught on 2026-06-24: the
// upload-dest validator rejected spaces, so "Big Picture" silently failed to
// save. isValidAlbum must accept spaces while still blocking traversal/slashes.
describe('isValidAlbum', () => {
  it('accepts human album names with spaces, apostrophes, and ampersands', () => {
    expect(isValidAlbum('Big Picture')).toBe(true);
    expect(isValidAlbum("Darrell's Z Fold7")).toBe(true);
    expect(isValidAlbum('Family & Faith')).toBe(true);
    expect(isValidAlbum('2026 Conference')).toBe(true);
  });

  it('still blocks traversal, slashes, backslashes, and junk', () => {
    expect(isValidAlbum('../etc')).toBe(false);
    expect(isValidAlbum('a/b')).toBe(false);
    expect(isValidAlbum('a\\b')).toBe(false);
    expect(isValidAlbum('..')).toBe(false);
    expect(isValidAlbum('')).toBe(false);
    expect(isValidAlbum('x'.repeat(81))).toBe(false);
    expect(isValidAlbum(null)).toBe(false);
    expect(isValidAlbum(undefined)).toBe(false);
  });
});

describe('bigPictureAlbum get/set', () => {
  beforeEach(() => { try { localStorage.clear(); } catch (_) { /* jsdom */ } });

  it('defaults to empty (camera roll never exposed without a deliberate choice)', () => {
    expect(bigPictureAlbum()).toBe('');
  });

  it('persists a valid album with spaces and round-trips it', () => {
    setBigPictureAlbum('Big Picture');
    expect(bigPictureAlbum()).toBe('Big Picture');
  });

  it('clears with an empty string', () => {
    setBigPictureAlbum('Big Picture');
    setBigPictureAlbum('');
    expect(bigPictureAlbum()).toBe('');
  });

  it('refuses to persist an invalid (traversal) album name', () => {
    setBigPictureAlbum('../secret');
    expect(bigPictureAlbum()).toBe('');
  });
});

describe('setBridgeToken get/set — wiring the NAS photo bridge (Darrell 2026-07-18)', () => {
  beforeEach(() => { try { localStorage.clear(); } catch (_) { /* jsdom */ } });

  it('starts empty, persists a token, and reports hasBridgeToken', () => {
    expect(hasBridgeToken()).toBe(false);
    const now = setBridgeToken('  secret-abc123  ');
    expect(now).toBe('secret-abc123');       // trimmed
    expect(bridgeToken()).toBe('secret-abc123');
    expect(hasBridgeToken()).toBe(true);
  });

  it('clears the token when given a blank value', () => {
    setBridgeToken('secret');
    expect(hasBridgeToken()).toBe(true);
    expect(setBridgeToken('   ')).toBe('');   // blank clears
    expect(hasBridgeToken()).toBe(false);
    expect(bridgeToken()).toBe('');
  });

  it('length-caps a runaway paste', () => {
    const huge = 'x'.repeat(2000);
    expect(setBridgeToken(huge).length).toBe(512);
  });
});

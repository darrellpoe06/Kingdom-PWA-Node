// R15 sovereign photo write-path — client guards. The upload destination is
// user-influenced, so isValidDest is the device-side belt (the workflow is the
// real gate); these lock that no traversal or junk dest leaves the device.
import { describe, it, expect, beforeEach } from 'vitest';
import { isValidDest, isValidAlbum, bigPictureAlbum, setBigPictureAlbum } from '../lib/nas-photos.js';

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

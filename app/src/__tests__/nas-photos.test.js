// R15 sovereign photo write-path — client guards. The upload destination is
// user-influenced, so isValidDest is the device-side belt (the workflow is the
// real gate); these lock that no traversal or junk dest leaves the device.
import { describe, it, expect } from 'vitest';
import { isValidDest } from '../lib/nas-photos.js';

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

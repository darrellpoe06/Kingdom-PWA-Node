// @vitest-environment node
// Tests for the join-code + URL helpers (lib/games/room-code.js). The board and
// the phone must agree on the exact format, so it is pinned here.
import { describe, it, expect } from 'vitest';
import {
  CODE_ALPHABET, CODE_LENGTH, codeFromSeed, seedFromCode, normalizeCode,
  isValidCode, buildJoinUrl, buildBoardUrl, parseRoomParams,
} from '../lib/games/room-code.js';

const LOC = { origin: 'https://poetech.us', pathname: '/poetech-app/' };

describe('code generation', () => {
  it('is deterministic and uses only unambiguous alphabet chars', () => {
    const a = codeFromSeed(42);
    const b = codeFromSeed(42);
    expect(a).toBe(b);
    expect(a).toHaveLength(CODE_LENGTH);
    for (const ch of a) expect(CODE_ALPHABET).toContain(ch);
    expect(a).not.toMatch(/[01OIL]/); // no confusing characters
  });

  it('different seeds usually give different codes', () => {
    const codes = new Set(Array.from({ length: 50 }, (_, i) => codeFromSeed(i + 1)));
    expect(codes.size).toBeGreaterThan(40);
  });

  it('seedFromCode is stable per code', () => {
    expect(seedFromCode('ABCD')).toBe(seedFromCode('abcd'));
    expect(seedFromCode('ABCD')).not.toBe(seedFromCode('ABCE'));
  });
});

describe('normalize + validate', () => {
  it('uppercases, strips junk, and caps length', () => {
    expect(normalizeCode(' a b c d e ')).toBe('ABCD');
    expect(normalizeCode('ab-cd')).toBe('ABCD');
    expect(normalizeCode('')).toBe('');
    expect(normalizeCode(null)).toBe('');
  });
  it('isValidCode requires a full-length code', () => {
    expect(isValidCode('ABCD')).toBe(true);
    expect(isValidCode('ABC')).toBe(false);
    expect(isValidCode('A1!')).toBe(false); // 1 is not in alphabet
  });
});

describe('URLs the QR encodes', () => {
  it('player URL is path-preserving with ?room', () => {
    expect(buildJoinUrl('ABCD', LOC)).toBe('https://poetech.us/poetech-app/?room=ABCD');
  });
  it('board URL adds &board=1', () => {
    expect(buildBoardUrl('ABCD', LOC)).toBe('https://poetech.us/poetech-app/?room=ABCD&board=1');
  });
  it('parseRoomParams round-trips both roles', () => {
    expect(parseRoomParams('?room=ABCD')).toEqual({ code: 'ABCD', isBoard: false });
    expect(parseRoomParams('?room=abcd&board=1')).toEqual({ code: 'ABCD', isBoard: true });
    expect(parseRoomParams('')).toEqual({ code: '', isBoard: false });
  });
});

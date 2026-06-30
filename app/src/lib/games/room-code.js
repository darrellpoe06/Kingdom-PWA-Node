// =============================================================================
// games/room-code.js — short join codes + the URLs the QR encodes (pure)
// =============================================================================
// A "Game Night" room is reached two ways that must agree:
//   • the big screen (the TV / LED wall) opens  …/?room=ABCD&board=1
//   • a phone scans a QR that points to         …/?room=ABCD
// This module owns the code alphabet, validation, and the two URL builders, so
// the board and the controller can never drift on the format. Everything here is
// pure and seed-driven (no Math.random, no Date.now) so the test suite pins the
// exact codes and URLs — the component layer supplies a fresh seed.
// =============================================================================

// Crockford-ish alphabet: no 0/O, 1/I/L — unambiguous read from across a room and
// quick to thumb-type on a phone if the camera won't focus on the QR.
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 4;

// Deterministic code from a numeric seed (the engine's LCG step, so it spreads).
// The board passes a fresh seed once; the same seed always yields the same code,
// which is what makes a board RELOAD land back in the same room.
export function codeFromSeed(seed, len = CODE_LENGTH) {
  let s = (seed >>> 0) || 1;
  let out = '';
  for (let i = 0; i < len; i++) {
    s = (Math.imul(1664525, s >>> 0) + 1013904223) >>> 0;
    out += CODE_ALPHABET[s % CODE_ALPHABET.length];
  }
  return out;
}

// A stable numeric seed DERIVED from a code, so a match's reproducible host-seed
// can be tied to its visible code (reopen the same code -> same game setup).
export function seedFromCode(code) {
  const c = normalizeCode(code);
  let s = 2166136261 >>> 0;            // FNV-1a basis
  for (let i = 0; i < c.length; i++) {
    s ^= c.charCodeAt(i);
    s = Math.imul(s, 16777619) >>> 0;
  }
  return s >>> 0;
}

// Uppercase, trim, and keep only alphabet characters (tolerate a pasted URL or
// spaces). Returns '' for nothing usable.
export function normalizeCode(input) {
  if (!input) return '';
  return String(input)
    .toUpperCase()
    .split('')
    .filter((ch) => CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, CODE_LENGTH);
}

export function isValidCode(input) {
  return normalizeCode(input).length === CODE_LENGTH;
}

// Build the path-preserving query string. We keep the current pathname + base
// (the app is served under /poetech-app/ on the NAS) so the link works on LAN,
// Funnel, or Vercel without hardcoding an origin.
function withParams(loc, params) {
  const origin = loc.origin || '';
  const path = loc.pathname || '/';
  const qs = new URLSearchParams(params).toString();
  return `${origin}${path}?${qs}`;
}

// The URL a PHONE opens (what the QR encodes): join as a player.
export function buildJoinUrl(code, loc = (typeof window !== 'undefined' ? window.location : { origin: '', pathname: '/' })) {
  return withParams(loc, { room: normalizeCode(code) });
}

// The URL the BIG SCREEN opens: host + render the board.
export function buildBoardUrl(code, loc = (typeof window !== 'undefined' ? window.location : { origin: '', pathname: '/' })) {
  return withParams(loc, { room: normalizeCode(code), board: '1' });
}

// Read the room params off a location.search string. `isBoard` decides host vs.
// controller in the standalone boot.
export function parseRoomParams(search) {
  const p = new URLSearchParams(search || '');
  const code = normalizeCode(p.get('room') || '');
  return { code, isBoard: p.get('board') === '1' };
}

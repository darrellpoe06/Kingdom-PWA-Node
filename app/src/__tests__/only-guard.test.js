// =============================================================================
// only-guard — a committed `.only` can never silently collapse the suite
// =============================================================================
// An accidental `it.only(` / `describe.only(` / `test.only(` runs ONLY that one
// test in its file and silently drops every sibling — the whole file's coverage
// vanishes while every CI gate stays green. That is the exact DR-0076
// "looked-fine-but-wasn't" class that is supposed to become a GATE, not a hope.
// The test census (lib/quality-throughput.js) counts `.only` as an ordinary
// call site; nothing fails the build on it. This guard closes that hole.
//
// It scans every real test file and HARD-FAILS on any `.only` test modifier.
// `.skip` / `.todo` / `.skipIf` are reported for visibility but do NOT fail —
// a guarded skip (e.g. describe.skipIf(!DecompressionStream)) is legitimate.
//
// PROVEN-TO-CATCH (DR-0076 §3): the self-test below feeds the detector the exact
// shape of an accidental `it.only(` and requires a hit; it also feeds a QUOTED
// fixture (`"test.only('d')"`, the shape that lives in quality-throughput.test.js)
// and requires NO hit — so the guard catches the real hazard without tripping on
// string fixtures. Break the detector and this suite goes red.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));

// Enumerate every *.test.js / *.test.jsx under __tests__ (recursively).
function testFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...testFiles(full));
    else if (/\.test\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Blank out string literals and comments so a `.only` inside a fixture string
// (e.g. `"test.only('d')"` in quality-throughput.test.js) or a comment can never
// be mistaken for a real modifier. A tiny hand state machine — good enough for
// test files; regex-literal edge cases don't contain `x.only` in practice.
function stripNonCode(src) {
  let out = '';
  let s = 'code'; // code | line | block | sq | dq | tq
  for (let i = 0; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (s === 'code') {
      if (c === '/' && d === '/') { s = 'line'; i++; }
      else if (c === '/' && d === '*') { s = 'block'; i++; }
      else if (c === "'") s = 'sq';
      else if (c === '"') s = 'dq';
      else if (c === '`') s = 'tq';
      else out += c;
    } else if (s === 'line') { if (c === '\n') { s = 'code'; out += '\n'; } }
    else if (s === 'block') { if (c === '*' && d === '/') { s = 'code'; i++; } }
    else if (s === 'sq') { if (c === '\\') i++; else if (c === "'") s = 'code'; }
    else if (s === 'dq') { if (c === '\\') i++; else if (c === '"') s = 'code'; }
    else if (s === 'tq') { if (c === '\\') i++; else if (c === '`') s = 'code'; }
  }
  return out;
}

// Real `.only` test modifiers only (fixtures/comments already stripped out).
function findOnly(text) {
  const re = /\b(it|test|describe|context)\.only\b/g;
  return [...stripNonCode(text).matchAll(re)].map((m) => m[0]);
}

function findSkips(text) {
  const re = /\b(it|test|describe|context)\.(skip|todo|skipIf|failing)\b/g;
  return [...stripNonCode(text).matchAll(re)].map((m) => `${m[1]}.${m[2]}`);
}

describe('only-guard — the detector itself (proven-to-catch)', () => {
  it('flags a real `.only` modifier at a code position', () => {
    expect(findOnly("it.only('x', () => {})")).toEqual(['it.only']);
    expect(findOnly("  describe.only('grp', () => {})")).toEqual(['describe.only']);
    expect(findOnly("test.only.each([[1]])('n', () => {})")).toEqual(['test.only']);
  });

  it('does NOT flag `.only` inside a string fixture (no false positive)', () => {
    // This is the exact shape committed in quality-throughput.test.js.
    expect(findOnly("\"test.only('d', () => {})\"")).toEqual([]);
    expect(findOnly("'it.only(' + rest")).toEqual([]);
  });

  it('does NOT flag look-alikes (monopoly.only-ish identifiers)', () => {
    expect(findOnly('lonely.only')).toEqual([]);   // preceded by a word char → not a modifier
    expect(findOnly('readonly.foo(')).toEqual([]);
  });
});

describe('only-guard — no committed `.only` anywhere in the suite', () => {
  it('every test file is free of `.only` (a `.only` collapses its file silently)', () => {
    const offenders = [];
    for (const file of testFiles(TESTS_DIR)) {
      const hits = findOnly(readFileSync(file, 'utf8'));
      if (hits.length) offenders.push(`${file.split(/[\\/]/).slice(-1)[0]}: ${hits.join(', ')}`);
    }
    expect(offenders, `Remove .only — it silently drops sibling tests:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('reports committed skips for visibility (informational — does not fail)', () => {
    const skips = [];
    for (const file of testFiles(TESTS_DIR)) {
      const hits = findSkips(readFileSync(file, 'utf8'));
      if (hits.length) skips.push(`${file.split(/[\\/]/).slice(-1)[0]}: ${hits.join(', ')}`);
    }
    // No assertion on the count — a guarded skipIf is legitimate. This surfaces
    // the list so a growing pile of parked skips stays visible in test output.
    if (skips.length) console.info(`[only-guard] committed skips (${skips.length} files):\n${skips.join('\n')}`);
    expect(Array.isArray(skips)).toBe(true);
  });
});

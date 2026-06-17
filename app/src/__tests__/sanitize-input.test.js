// =============================================================================
// sanitize-input — the shared public-form cleaner (DR-0076: prove it, don't claim it)
// =============================================================================
// Proves the cleaner ACTUALLY neutralizes each hostile shape (proven-to-catch,
// DR-0060): HTML tags, control / invisible / bidi chars, and over-length payloads.
// If any of these stopped working, the corresponding `expect` here goes red — a green
// run means the neutralization is real, not asserted.
//
// Hostile invisible/control characters are built with String.fromCharCode (NEVER
// literal control bytes in the source, which corrupt in transit and would make the
// test silently lie about what it checks).
import { describe, it, expect } from 'vitest';
import {
  cleanField, stripHtml, stripControlChars, fieldsOverCap, FIELD_CAPS,
  looksLikeBot, MIN_FILL_MS,
} from '../lib/sanitize-input.js';

const NUL = String.fromCharCode(0x00);
const ZWSP = String.fromCharCode(0x200B); // zero-width space
const BOM = String.fromCharCode(0xFEFF);  // byte-order mark
const RLO = String.fromCharCode(0x202E);  // right-to-left override (Trojan-Source)
const LRI = String.fromCharCode(0x2066);  // left-to-right isolate
const PDI = String.fromCharCode(0x2069);  // pop directional isolate

describe('stripHtml — removes tag structure, preserves lone < />', () => {
  it('removes a script tag and its closing tag (the classic XSS payload)', () => {
    expect(stripHtml('<script>alert(1)</script>Naomi')).toBe('alert(1)Naomi');
    expect(stripHtml('<script>alert(1)</script>Naomi')).not.toMatch(/<script/i);
  });
  it('removes an img onerror payload', () => {
    expect(stripHtml('<img src=x onerror=alert(1)>')).toBe('');
  });
  it('removes nested / doubled angle brackets that try to survive one pass', () => {
    expect(stripHtml('<<script>script>alert(1)<</script>/script>')).not.toMatch(/<script|<\/script/i);
  });
  it('strips HTML comments', () => {
    expect(stripHtml('hi<!-- evil -->there')).toBe('hithere');
  });
  it('PRESERVES a lone < or > so legitimate text is not mangled', () => {
    expect(stripHtml('weighs < 200 lbs')).toBe('weighs < 200 lbs');
    expect(stripHtml('a -> b')).toBe('a -> b');
  });
});

describe('stripControlChars — removes control / invisible / bidi', () => {
  it('removes a NUL and other C0 controls', () => {
    expect(stripControlChars('a' + NUL + 'bc')).toBe('abc');
  });
  it('removes zero-width + BOM smuggling characters', () => {
    expect(stripControlChars('Na' + ZWSP + 'o' + BOM + 'mi')).toBe('Naomi');
  });
  it('removes bidi-override (Trojan-Source) characters', () => {
    expect(stripControlChars('admin' + RLO + 'nimda')).toBe('adminnimda');
    expect(stripControlChars('a' + LRI + 'b' + PDI + 'c')).toBe('abc');
  });
  it('keeps ordinary tab/newline (whitespace handling decides their fate later)', () => {
    expect(stripControlChars('a\tb\nc')).toBe('a\tb\nc');
  });
});

describe('cleanField — strip + normalize + cap', () => {
  it('trims and collapses internal whitespace on single-line fields', () => {
    expect(cleanField('  Naomi   Poe  ', 120)).toBe('Naomi Poe');
  });
  it('neutralizes an HTML payload AND caps length together', () => {
    const out = cleanField('<script>alert(1)</script>' + 'x'.repeat(500), 120);
    expect(out).not.toMatch(/<script/i);
    expect(out.length).toBe(120);
  });
  it('hard-caps an oversized field to its max', () => {
    expect(cleanField('y'.repeat(10000), FIELD_CAPS.name).length).toBe(FIELD_CAPS.name);
  });
  it('multiline keeps newlines but caps blank-line floods', () => {
    const out = cleanField('line1\n\n\n\n\nline2', 2000, { multiline: true });
    expect(out).toBe('line1\n\nline2');
  });
  it('returns empty string for nullish / empty', () => {
    expect(cleanField(null, 120)).toBe('');
    expect(cleanField(undefined, 120)).toBe('');
    expect(cleanField('   ', 120)).toBe('');
  });
  it('does NOT truncate when measuring with Infinity (used by fieldsOverCap)', () => {
    expect(cleanField('z'.repeat(1000), Infinity).length).toBe(1000);
  });
});

describe('fieldsOverCap — detects which fields exceed their cap', () => {
  it('flags only the over-cap field, using the CLEANED length', () => {
    const over = fieldsOverCap(
      { name: 'ok', dietary: 'd'.repeat(FIELD_CAPS.dietary + 1) },
      { name: FIELD_CAPS.name, dietary: FIELD_CAPS.dietary },
    );
    expect(over).toEqual(['dietary']);
  });
  it('an exactly-at-cap value is NOT flagged', () => {
    const over = fieldsOverCap({ name: 'n'.repeat(FIELD_CAPS.name) }, { name: FIELD_CAPS.name });
    expect(over).toEqual([]);
  });
  it('ignores empty / missing fields', () => {
    expect(fieldsOverCap({ name: '', email: null }, { name: FIELD_CAPS.name, email: FIELD_CAPS.email })).toEqual([]);
  });
});

describe('looksLikeBot — invisible anti-flood (honeypot + timing), no CAPTCHA', () => {
  it('a filled honeypot is a bot (caught)', () => {
    expect(looksLikeBot({ honeypot: 'anything', elapsedMs: 99999 })).toBe(true);
  });
  it('an impossibly-fast submit is a bot (caught)', () => {
    expect(looksLikeBot({ honeypot: '', elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
    expect(looksLikeBot({ honeypot: '', elapsedMs: 0 })).toBe(true);
  });
  it('a real human (empty honeypot, took their time) is allowed through', () => {
    expect(looksLikeBot({ honeypot: '', elapsedMs: MIN_FILL_MS + 1 })).toBe(false);
    expect(looksLikeBot({ honeypot: '', elapsedMs: 30000 })).toBe(false);
  });
  it('defaults are human-safe (no signals -> not a bot)', () => {
    expect(looksLikeBot()).toBe(false);
    expect(looksLikeBot({})).toBe(false);
  });
});

// @vitest-environment node
// =============================================================================
// The reader SAYS "2nd Timothy", never "two Timothy" (DR-0285)
// =============================================================================
// Darrell 2026-08-10: "the reader should say 2nd Timothy not two Timothy...
// etc." A device voice treats a leading digit as a quantity, so every numbered
// book of the canon was mispronounced aloud, every time. This converts SPOKEN
// FORM ONLY — the written reference on the page, and inside every quotation, is
// never touched (the Typographic Theology bright line: we do not edit the text).
//
// Proven-to-catch: each of these fails against the raw string being handed
// straight to the voice.
import { describe, it, expect } from 'vitest';
import { toSpokenForm } from '../lib/speech-text.js';

describe('numbered books are said as ordinals', () => {
  it('the report itself: 2 Timothy is said 2nd Timothy', () => {
    expect(toSpokenForm('2 Timothy 1:7')).toBe('2nd Timothy 1:7');
  });

  it('first, second and third, across the numbered books', () => {
    expect(toSpokenForm('1 John 1:9')).toBe('1st John 1:9');
    expect(toSpokenForm('3 John 4')).toBe('3rd John 4');
    expect(toSpokenForm('1 Thessalonians 5:21')).toBe('1st Thessalonians 5:21');
    expect(toSpokenForm('2 Corinthians 5:20')).toBe('2nd Corinthians 5:20');
    expect(toSpokenForm('1 Samuel 16:7')).toBe('1st Samuel 16:7');
    expect(toSpokenForm('2 Chronicles 7:14')).toBe('2nd Chronicles 7:14');
    expect(toSpokenForm('1 Peter 1:18')).toBe('1st Peter 1:18');
    expect(toSpokenForm('2 Kings 6:17')).toBe('2nd Kings 6:17');
  });

  it('abbreviated citations too', () => {
    expect(toSpokenForm('1 Cor. 2:16')).toBe('1st Cor. 2:16');
    expect(toSpokenForm('2 Tim 3:16')).toBe('2nd Tim 3:16');
  });

  it('the Roman forms older printings use', () => {
    expect(toSpokenForm('II Timothy 1:7')).toBe('2nd Timothy 1:7');
    expect(toSpokenForm('I John 4:8')).toBe('1st John 4:8');
    expect(toSpokenForm('III John 2')).toBe('3rd John 2');
  });

  it('mid-sentence, and more than once in a line', () => {
    expect(toSpokenForm('Read 1 Peter 5:7 and then 2 Peter 1:4 together.'))
      .toBe('Read 1st Peter 5:7 and then 2nd Peter 1:4 together.');
  });
});

describe('it changes only what it should', () => {
  it('un-numbered books are untouched', () => {
    expect(toSpokenForm('Romans 8:28')).toBe('Romans 8:28');
    expect(toSpokenForm('Philippians 4:8')).toBe('Philippians 4:8');
  });

  it('a plain quantity before an ordinary word is not a citation', () => {
    expect(toSpokenForm('2 loaves and 5 fish')).toBe('2 loaves and 5 fish');
    expect(toSpokenForm('I said it plainly')).toBe('I said it plainly');
  });

  it('numbers past three are left alone — there is no 4th Timothy', () => {
    expect(toSpokenForm('4 Kings 2:1')).toBe('4 Kings 2:1');
  });

  it('never throws on empty or absent input', () => {
    expect(toSpokenForm('')).toBe('');
    expect(toSpokenForm(null)).toBe('');
    expect(toSpokenForm(undefined)).toBe('');
  });
});

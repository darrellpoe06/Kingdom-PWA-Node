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
    expect(toSpokenForm('2 Timothy 1:7')).toBe('2nd Timothy chapter 1 verse 7');
  });

  it('first, second and third, across the numbered books', () => {
    expect(toSpokenForm('1 John 1:9')).toBe('1st John chapter 1 verse 9');
    expect(toSpokenForm('3 John 4')).toBe('3rd John 4');
    expect(toSpokenForm('1 Thessalonians 5:21')).toBe('1st Thessalonians chapter 5 verse 21');
    expect(toSpokenForm('2 Corinthians 5:20')).toBe('2nd Corinthians chapter 5 verse 20');
    expect(toSpokenForm('1 Samuel 16:7')).toBe('1st Samuel chapter 16 verse 7');
    expect(toSpokenForm('2 Chronicles 7:14')).toBe('2nd Chronicles chapter 7 verse 14');
    expect(toSpokenForm('1 Peter 1:18')).toBe('1st Peter chapter 1 verse 18');
    expect(toSpokenForm('2 Kings 6:17')).toBe('2nd Kings chapter 6 verse 17');
  });

  it('abbreviated citations too', () => {
    expect(toSpokenForm('1 Cor. 2:16')).toBe('1st Cor chapter 2 verse 16');
    expect(toSpokenForm('2 Tim 3:16')).toBe('2nd Tim chapter 3 verse 16');
  });

  it('the Roman forms older printings use', () => {
    expect(toSpokenForm('II Timothy 1:7')).toBe('2nd Timothy chapter 1 verse 7');
    expect(toSpokenForm('I John 4:8')).toBe('1st John chapter 4 verse 8');
    expect(toSpokenForm('III John 2')).toBe('3rd John 2');
  });

  it('mid-sentence, and more than once in a line', () => {
    expect(toSpokenForm('Read 1 Peter 5:7 and then 2 Peter 1:4 together.'))
      .toBe('Read 1st Peter chapter 5 verse 7 and then 2nd Peter chapter 1 verse 4 together.');
  });
});

// "not only 2 Timothy all scriptures?" (Darrell, 2026-08-10). A colon between
// two numbers is read by every engine as a clock time or a ratio — "John three
// sixteen" at best, "three minutes sixteen" at worst — so EVERY reference is
// spoken the way the Body says it, not the way it is punctuated.
describe('every reference is SAID, not punctuated', () => {
  it('chapter and verse are spoken in full', () => {
    expect(toSpokenForm('John 3:16')).toBe('John chapter 3 verse 16');
    expect(toSpokenForm('Romans 8:28')).toBe('Romans chapter 8 verse 28');
    expect(toSpokenForm('Revelation 21:4')).toBe('Revelation chapter 21 verse 4');
    expect(toSpokenForm('Genesis 9:3')).toBe('Genesis chapter 9 verse 3');
  });

  it('a verse RANGE is read through, not as a subtraction', () => {
    expect(toSpokenForm('Colossians 1:16-17')).toBe('Colossians chapter 1 verses 16 through 17');
    expect(toSpokenForm('Philippians 4:6–7')).toBe('Philippians chapter 4 verses 6 through 7');
  });

  it('a psalm is numbered, not chaptered — the way it is said aloud', () => {
    expect(toSpokenForm('Psalm 119:105')).toBe('Psalm 119 verse 105');
    expect(toSpokenForm('Psalms 23:1')).toBe('Psalms 23 verse 1');
  });

  it('a multi-word book name is matched whole', () => {
    expect(toSpokenForm('Song of Solomon 2:1')).toBe('Song of Solomon chapter 2 verse 1');
  });

  it('several references in one sentence', () => {
    expect(toSpokenForm('1 Thessalonians 5:21; Proverbs 18:13'))
      .toBe('1st Thessalonians chapter 5 verse 21; Proverbs chapter 18 verse 13');
  });

  it('a chapter with no verse is left exactly as written', () => {
    expect(toSpokenForm('Psalm 23')).toBe('Psalm 23');
    expect(toSpokenForm('Daniel 1')).toBe('Daniel 1');
  });
});

describe('it changes only what it should', () => {
  it('un-numbered books keep their name — only the reference is spoken', () => {
    expect(toSpokenForm('Romans 8:28')).toBe('Romans chapter 8 verse 28');
    expect(toSpokenForm('Philippians 4:8')).toBe('Philippians chapter 4 verse 8');
  });

  it('a plain quantity before an ordinary word is not a citation', () => {
    expect(toSpokenForm('2 loaves and 5 fish')).toBe('2 loaves and 5 fish');
    expect(toSpokenForm('I said it plainly')).toBe('I said it plainly');
  });

  it('numbers past three get no ordinal — there is no 4th Timothy', () => {
    expect(toSpokenForm('4 Kings 2:1')).toBe('4 Kings chapter 2 verse 1');
    expect(toSpokenForm('4 Timothy')).toBe('4 Timothy');
  });

  it('a video timestamp is NOT a reference — no book name in front of it', () => {
    expect(toSpokenForm('at 1:12-2:04')).toBe('at 1:12-2:04');
    expect(toSpokenForm('The meeting is at 6:30')).toBe('The meeting is at 6:30');
  });

  it('never throws on empty or absent input', () => {
    expect(toSpokenForm('')).toBe('');
    expect(toSpokenForm(null)).toBe('');
    expect(toSpokenForm(undefined)).toBe('');
  });
});

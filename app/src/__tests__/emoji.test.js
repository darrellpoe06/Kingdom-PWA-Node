// =============================================================================
// emoji — texting-grade emoji, proven not claimed (DR-0076).
// =============================================================================
// Pins: the segmentation (plain text untouched; emoji units extracted whole,
// including skin tones and ZWJ sequences), the Twemoji filename rule (FE0F
// dropped except inside ZWJ sequences — the rule the real package uses), and
// the ASSET TRUTH: every curated emoji's SVG actually exists in
// app/public/emoji/ — a curated glyph with no shipped image fails HERE, not on
// a user's screen (proven-to-catch).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  segmentEmoji, emojiToName, emojiAssetPath, hasEmoji, CURATED_EMOJI, curatedAssetNames,
} from '../lib/emoji.js';

const EMOJI_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/emoji');

describe('segmentEmoji — text splits into text + whole emoji units', () => {
  it('plain text passes through as one token', () => {
    expect(segmentEmoji('grace and truth')).toEqual([{ type: 'text', value: 'grace and truth' }]);
  });

  it('extracts emoji with surrounding text intact', () => {
    const t = segmentEmoji('so good 🔥 amen');
    expect(t).toEqual([
      { type: 'text', value: 'so good ' },
      { type: 'emoji', value: '🔥' },
      { type: 'text', value: ' amen' },
    ]);
  });

  it('keeps a skin-toned gesture as ONE unit (👍🏽 never splits)', () => {
    const t = segmentEmoji('👍🏽');
    expect(t).toEqual([{ type: 'emoji', value: '👍🏽' }]);
  });

  it('keeps a ZWJ sequence as ONE unit (❤️‍🔥 and the family)', () => {
    expect(segmentEmoji('❤️‍🔥')).toEqual([{ type: 'emoji', value: '❤️‍🔥' }]);
    expect(segmentEmoji('👨‍👩‍👧‍👦')).toEqual([{ type: 'emoji', value: '👨‍👩‍👧‍👦' }]);
  });

  it('handles adjacent emoji as separate units', () => {
    const t = segmentEmoji('🔥🫡');
    expect(t.map((x) => x.value)).toEqual(['🔥', '🫡']);
  });

  it('hasEmoji answers correctly', () => {
    expect(hasEmoji('plain words')).toBe(false);
    expect(hasEmoji('with 📖')).toBe(true);
  });
});

describe('emojiToName — the Twemoji filename rule', () => {
  it('drops FE0F outside ZWJ sequences (❤️ -> 2764)', () => {
    expect(emojiToName('❤️')).toBe('2764');
    expect(emojiToName('✝️')).toBe('271d');
  });

  it('keeps FE0F inside ZWJ sequences (❤️‍🔥)', () => {
    expect(emojiToName('❤️‍🔥')).toBe('2764-fe0f-200d-1f525');
  });

  it('skin tones join with a hyphen (👍🏽)', () => {
    expect(emojiToName('👍🏽')).toBe('1f44d-1f3fd');
  });

  it('asset path serves from the self-hosted /emoji/ root', () => {
    expect(emojiAssetPath('🔥')).toBe('/emoji/1f525.svg');
    expect(emojiAssetPath('')).toBe('');
  });
});

describe('the curated set ships REAL assets (asset truth)', () => {
  it('every curated emoji resolves to an SVG that exists in app/public/emoji/', () => {
    const missing = curatedAssetNames().filter((n) => !existsSync(join(EMOJI_DIR, `${n}.svg`)));
    expect(missing, `curated emoji with NO shipped asset: ${missing.join(', ')} — run node scripts/sync-emoji-assets.mjs`).toEqual([]);
  });

  it("the family's own vocabulary is covered (🔥 🫡 👍🏽 📖 📜 ❤️ 🙏)", () => {
    for (const e of ['🔥', '🫡', '👍🏽', '📖', '📜', '❤️', '🙏']) {
      expect(CURATED_EMOJI.includes(e), `${e} missing from the curated set`).toBe(true);
    }
  });
});

// @vitest-environment node
// record-marks — every picture the learner record awards is the app's own
// artwork on disk, never a device-font glyph, and no component carries one.
// DR-1417.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECORD_MARKS, recordMarkSrc } from '../lib/record-marks.js';
import { CURATED_EMOJI } from '../lib/emoji.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('the record marks', () => {
  it('PROVEN TO CATCH: every mark has its picture in public/emoji and is in the curated set the sync copies', () => {
    for (const [name, ch] of Object.entries(RECORD_MARKS)) {
      const src = recordMarkSrc(name);
      expect(src, name).toMatch(/^\/emoji\/[0-9a-f-]+\.svg$/);
      expect(existsSync(join(APP, 'public', src)), `${name}: ${src} is not on disk`).toBe(true);
      expect(CURATED_EMOJI.includes(ch), `${name} is not in CURATED_EMOJI, so a sync would not carry it`).toBe(true);
    }
    expect(recordMarkSrc('not-a-mark')).toBe('');
  });
  it('the components that draw them carry no device glyph of their own', () => {
    const glyph = /[\u{2600}-\u{26FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}]/u;
    for (const f of ['UnderstoodGoals.jsx', 'RecordMark.jsx']) {
      const code = readFileSync(join(APP, 'src', 'components', f), 'utf8')
        .split('\n')
        .filter((l) => !l.trim().startsWith('//'))
        .join('\n');
      expect(glyph.test(code), f).toBe(false);
    }
  });
});

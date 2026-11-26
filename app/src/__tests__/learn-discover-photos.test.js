// Every photography slot the page names has a file, so a replaced or missing picture is caught before it ships.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORY_NEW_PHOTO, SERIES_NEW_PHOTO, BANNER_PHOTO, WORD_PHOTO, BIBLE_PHOTO, PHOTO_DIR } from '../lib/learn-discover-photos.js';

const dir = join(__dirname, '../../public', PHOTO_DIR);
describe('the photography package', () => {
  it('has a file for every slot', () => {
    const slots = [BANNER_PHOTO, WORD_PHOTO, BIBLE_PHOTO, ...Object.values(CATEGORY_NEW_PHOTO), ...Object.values(SERIES_NEW_PHOTO)];
    for (const s of new Set(slots)) expect(existsSync(join(dir, `${s}.webp`)), s).toBe(true);
  });
});

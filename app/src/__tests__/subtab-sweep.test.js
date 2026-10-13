// =============================================================================
// The sub-tab sweep — no panel is a long read-down (Darrell 2026-09-11:
// "dashboard debt tracker all subtabs!!!!!!!")
// =============================================================================
// The Way was decided 2026-07-04 ("let's use the sliding tabs for all tabs
// instead of a long scroll on any tab") and SectionTabs' own header says a
// second-row panel that is still a multi-screen scroll nests another strip with
// variant="sub". Four panels were still stacking unrelated sections in one
// read-down. This gate pins them so none quietly reverts to a stack.
//
// IMPORTANT distinction this gate encodes: a long LIST is not a long READ. A
// panel that maps over rows (the 12 door cards, a story library, a recipe list)
// is legitimately scrolled — hiding list items behind tabs makes them harder to
// find, not easier. The defect is HETEROGENEOUS STACKED SECTIONS. So this file
// measures section density, not line count.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, '../components/', p), 'utf8');

// The panels swept, and the tabs each was split into.
const SWEPT = [
  ['BigPictureDashboard.jsx', 'now', ['queue', 'capacity']],
  ['ChurchHome.jsx', 'church-worship', ['live', 'sermons', 'connect']],
  ['Rentals.jsx', 'rentals-portfolio', ['doors', 'snowball', 'compare', 'cascade']],
  ['DevOps.jsx', 'devops-options', ['skills', 'options', 'pipeline']],
];

describe('the sub-tab sweep holds', () => {
  for (const [file, idBase, ids] of SWEPT) {
    it(`${file} · ${idBase} is a strip, not a stack`, () => {
      const src = read(file);
      // A nested strip, declared as the third row.
      const strip = new RegExp(`idBase="${idBase}"`);
      expect(src, `${idBase} strip missing`).toMatch(strip);
      // The nested strip is the sub variant — the chip row, not a second
      // identical underline, so the eye reads the hierarchy.
      const near = src.slice(Math.max(0, src.search(strip) - 400), src.search(strip) + 400);
      expect(near, `${idBase} is not variant="sub"`).toMatch(/variant="sub"/);
      // Every panel it was split into is still there.
      for (const id of ids) {
        expect(src, `${idBase} lost its "${id}" panel`).toMatch(new RegExp(`id: '${id}'`));
      }
    });
  }

  it('every swept panel names a default, so the strip opens somewhere honest', () => {
    for (const [file, idBase] of SWEPT) {
      const src = read(file);
      const i = src.search(new RegExp(`idBase="${idBase}"`));
      expect(src.slice(i - 400, i + 400), `${idBase} has no defaultId`).toMatch(/defaultId="/);
    }
  });
});

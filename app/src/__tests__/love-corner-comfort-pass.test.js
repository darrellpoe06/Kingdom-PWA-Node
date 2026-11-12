// =============================================================================
// The comfort pass (DR-1459): what the measurement found is pinned in source so
// it cannot drift back. The measurement itself (scripts/love-corner-comfort-
// probe.mjs) runs on a built page; these pins keep its findings closed.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

describe('the house floor (36px) on the shared primitives the new surfaces ride', () => {
  it('the SectionTabs sub-variant chip carries min-h-[36px] (measured at 30px before)', () => {
    const src = read('components/SectionTabs.jsx');
    const sub = src.split('\n').find((l) => l.includes('rounded-full') && l.includes('uppercase tracking-wider'));
    expect(sub, 'the sub chip class line').toBeTruthy();
    expect(sub).toMatch(/min-h-\[36px\]/);
  });
  it("TabScroll's show-all button carries min-h-[36px] (measured at 33px on phones before)", () => {
    const src = read('components/shared.jsx');
    const i = src.indexOf('data-testid="tabscroll-show-all"');
    expect(i).toBeGreaterThan(0);
    expect(src.slice(i, i + 900)).toMatch(/min-h-\[36px\]/);
  });
  it('the inline Learn link in the Youth Zone is at least 36px wide', () => {
    const css = read('index.css');
    const rule = css.split('\n').find((l) => l.startsWith('.lc-inline-link-ink{'));
    expect(rule).toBeTruthy();
    expect(rule).toMatch(/min-width:36px/);
  });
});

describe('heading order on the Ministries landing', () => {
  it('family titles are h2 under the page title, never h3 (a screen reader hears the skip)', () => {
    const src = read('components/ChurchMinistries.jsx');
    expect(src).toMatch(/<h2 id=\{`fam-\$\{f\.key\}`\}/);
    expect(src).not.toMatch(/<h3 id=\{`fam-\$\{f\.key\}`\}/);
  });
});

describe('PROVEN-TO-CATCH', () => {
  it('a chip line without the floor fails the first check', () => {
    const line = '`px-2.5 py-1.5 whitespace-nowrap text-[0.6875rem] uppercase tracking-wider border rounded-full`';
    expect(line).not.toMatch(/min-h-\[36px\]/);
  });
});

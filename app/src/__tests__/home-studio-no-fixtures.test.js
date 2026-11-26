// Test fixtures never ship: nothing under app/src (tests excepted) may carry the
// probe's fixture labels, and the redesigned homepage holds no mockup text as data.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === '__tests__' || n === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|css)$/.test(n)) out.push(p);
  }
  return out;
}
describe('no fixture or mockup content in the shipped app', () => {
  const studio = walk(join(ROOT, 'components/lovecorner/studio')).concat(join(ROOT, 'lib/home-studio.js'));
  it('the probe fixture labels appear nowhere in app/src', () => {
    for (const f of walk(ROOT)) expect(readFileSync(f, 'utf8'), f).not.toMatch(/FIXTURE (message|VIDEO|FLYER|CALENDAR)|Fixture Event|fixture0000/);
  });
  it("the mockup's sample content is not in the homepage code", () => {
    for (const f of studio) expect(readFileSync(f, 'utf8'), f).not.toMatch(/Bryan Wilson|New Year.s Eve|Get Off the Fence|Jesus Can Fix It|Midweek Bible Study/i);
  });
});

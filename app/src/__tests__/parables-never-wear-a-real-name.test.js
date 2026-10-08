// @vitest-environment node
// =============================================================================
// A parable is never a record, and never wears a real name (DR-0810)
// =============================================================================
// Darrell 2026-10-07, L40 open on a tablet: "This is a story that had my family
// name in it and it's not actually true... however if you didn't know me you
// would believe it... I want this to be explained so my actual life narrative
// or my testimony is what it actually is... not made up... balanced."
//
// The parable "Grandma Ruth's Head Count" opened "Every Poe-family reunion".
// The data called it a parable; the page called it only "Picture this". This
// gate holds both halves: no parable in any course carries a real name, and
// every surface says in words what a story is.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REAL_NAMES, storiesInSource, realNamesInParables, storyHeading, storyFootnote } from '../lib/story-truth.js';

const LIB = join(process.cwd(), 'src', 'lib');
const courseFiles = () => readdirSync(LIB).filter((f) => f.endsWith('.js') && /kind["']?\s*:\s*["'](parable|testimony)["']/.test(readFileSync(join(LIB, f), 'utf8')));

describe('a parable never wears a real name (DR-0810)', () => {
  it('no parable in any course carries the family name or Darrell\'s', () => {
    const files = courseFiles();
    expect(files.length).toBeGreaterThan(5);
    const findings = [];
    for (const f of files) for (const x of realNamesInParables(readFileSync(join(LIB, f), 'utf8'))) findings.push(`${f}: "${x.title}" names ${x.name}`);
    expect(findings).toEqual([]);
  });
  it('the night it was found is the fixture: the gate catches the surname, and the fixed line passes', () => {
    const bad = '{"kind":"parable","tone":"light","title":"Grandma Ruth\'s Head Count","body":"Every Poe-family reunion ended the same way: Grandma Ruth on the porch steps.","verse":"John 10:16"}';
    expect(realNamesInParables(bad)).toEqual([{ title: "Grandma Ruth's Head Count", name: 'Poe' }]);
    const fixed = bad.replace('Every Poe-family reunion', "Every reunion in Ruth's family");
    expect(realNamesInParables(fixed)).toEqual([]);
  });
  it('reads both shapes: the JSON row and the object literal; a testimony may name real people; "poetry" is not "Poe"', () => {
    const literal = "stories: [{\n  kind: 'parable', tone: 'light',\n  title: 'The Ledger',\n  body: 'Darrell said nothing; the poetry of it was lost.',\n  verse: 'Proverbs 22:7',\n}, {\n  kind: 'testimony', tone: 'solemn', title: 'Uncle Russell', body: 'Darrell Poe heard one line from his uncle.', source: 'Darrell Poe',\n}]";
    const all = storiesInSource(literal);
    expect(all.map((s) => [s.kind, s.title])).toEqual([['parable', 'The Ledger'], ['testimony', 'Uncle Russell']]);
    expect(realNamesInParables(literal)).toEqual([{ title: 'The Ledger', name: 'Darrell' }]);
    expect(realNamesInParables("{\"kind\":\"parable\",\"title\":\"x\",\"body\":\"the poetry of Poem Street and a poet\"}")).toEqual([]);
    expect(realNamesInParables("{\"kind\":\"parable\",\"title\":\"x\",\"body\":\"built on PoeTech\"}")).toEqual([{ title: 'x', name: 'PoeTech' }]);
  });
  it('every surface says in words what a story is', () => {
    expect(storyHeading({ kind: 'parable', title: 'The Widened Riverbed' })).toBe('Picture this, a parable — The Widened Riverbed');
    expect(storyHeading({ kind: 'testimony', title: 'One Line', source: 'Darrell Poe' })).toBe('A true story, lived — One Line · Darrell Poe');
    expect(storyFootnote({ kind: 'parable' })).toMatch(/^A parable, not a record/);
    expect(storyFootnote({ kind: 'parable' })).toMatch(/not real/);
    expect(storyFootnote({ kind: 'testimony', source: 'Darrell Poe' })).toBe("A true story: this happened, told with Darrell Poe's consent.");
    for (const f of ['src/components/ChurchLearn.jsx', 'src/lib/lesson-flow.js', 'src/lib/presentable.js']) {
      const text = readFileSync(join(process.cwd(), f), 'utf8');
      expect(text).toMatch(/storyHeading\(/);
      expect(text).toMatch(/storyFootnote\(/);
      expect(text).not.toMatch(/'A true story' : 'Picture this'/);
    }
    expect(REAL_NAMES).toContain('Poe');
  });
});

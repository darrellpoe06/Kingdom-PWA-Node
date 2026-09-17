// @vitest-environment node
// WORDINLINE IS NEVER PLACED AS A FLEX ITEM.
// =============================================================================
// Darrell 2026-09-14, 4:34pm, with lesson 151's card on his phone: the Anchor
// line crushed to one word per line down the left edge, Psalms 73:26 filling
// the rest -- "What is this how can a human do anything with this?"
//
// THE CAUSE IS STRUCTURAL, NOT A STYLE TYPO. WordInline returns TWO siblings:
// the paragraph, then the block of verses a reader has opened beneath it. Put
// that directly inside a `flex` row and the two siblings become two flex
// COLUMNS. It only shows once a verse is open, which is why it survived every
// closed-state look. The fix is a plain block wrapper so the pair is one item.
//
// This gate reads the SOURCE: no `<WordInline` may carry a flex-item class of
// its own (flex-1 / flex-auto / flex-grow / flex-none / basis-*). Proven-to-catch
// (DR-0076 §3): run against ChurchLearn.jsx as it stood at main@0c3c2fb0 this
// fails on line 1832 by name.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIR = resolve(import.meta.dirname, '../components');
const FLEX_ITEM = /\b(flex-1|flex-auto|flex-grow|flex-none|basis-[\w/]+)\b/;

function wordInlineUses(src) {
  const out = [];
  const re = /<WordInline\b([\s\S]*?)\/>/g;
  let m;
  while ((m = re.exec(src))) out.push({ at: src.slice(0, m.index).split('\n').length, props: m[1] });
  return out;
}

describe('WordInline is never itself a flex item', () => {
  it('no component hands WordInline a flex-item class', () => {
    const offenders = [];
    for (const f of readdirSync(DIR).filter((n) => n.endsWith('.jsx'))) {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const u of wordInlineUses(src)) {
        const cls = (u.props.match(/className=\{?["'`]([^"'`]*)["'`]/) || [])[1] || '';
        if (FLEX_ITEM.test(cls)) offenders.push(`${f}:${u.at} className="${cls}"`);
      }
    }
    expect(offenders, 'a WordInline placed as a flex item splits its verses into a side column').toEqual([]);
  });

  it('the detector sees the exact shape that was broken (proven-to-catch)', () => {
    const broken = '<div className="flex"><WordInline\n text={x}\n className="text-xs flex-1"\n /></div>';
    const uses = wordInlineUses(broken);
    expect(uses.length).toBe(1);
    const cls = (uses[0].props.match(/className=\{?["'`]([^"'`]*)["'`]/) || [])[1];
    expect(FLEX_ITEM.test(cls)).toBe(true);
  });

  it('the lesson card wraps its anchor WordInline in one block item', () => {
    const src = readFileSync(join(DIR, 'ChurchLearn.jsx'), 'utf8');
    // The guarantee is the WRAPPER, not its exact spelling: WordInline's two
    // siblings (the paragraph, and the verses opened beneath it) must be one
    // block item so they can never become two flex columns.
    //
    // Re-pinned 2026-09-17 (DR-0452). It used to require `flex-1 min-w-0`,
    // which was right only while the anchor line sat IN a flex row beside its
    // Share control. That row was the defect Darrell reported — the words were
    // squeezed into a column — so the prose now takes the whole width and the
    // control sits beneath it. `flex-1` on a non-flex parent would be a leftover
    // claiming a shape that no longer exists; the block wrapper is what matters
    // and it is still here.
    expect(src).toMatch(/<div className="(?:flex-1 )?min-w-0">\s*<WordInline\s+text=\{`Anchor — /);
    // And it is a BLOCK wrapper — never a flex row that would split the pair.
    const at = src.indexOf('text={`Anchor — ');
    const wrapper = src.lastIndexOf('<div className="', at);
    expect(src.slice(wrapper, at)).not.toMatch(/\bflex\b(?!-1)/);
  });
});

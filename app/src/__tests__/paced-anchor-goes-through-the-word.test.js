// =============================================================================
// The paced step view was the one place a reference stayed inert
// =============================================================================
// Darrell, 2026-09-14, reading a lesson on the live site: "go look at the DRs
// that show how this worked before you destroyed it... we need the reference to
// be inside the lessons as the lessons are going... there was a one hit
// drop-down that allow the reader to read with or without the cited Word
// showing the actual Word to the eyes." And then the correction that settled
// the method: "Why not just get it from the record.... like we get it from the
// Word!!!"
//
// TAKEN FROM THE RECORD, not re-decided:
//   DR-0340 Pattern 1  -- every reference renders through ONE Scripture component.
//   DR-0340 Decision 2 -- WordInline renders each reference as a chip IN ITS
//                         PLACE and opens the verbatim KJV beneath the paragraph.
//   DR-0341 Decision 1 -- one app-wide switch opens them all, in the order they
//                         happened, while each chip still toggles on its own.
//
// WHAT WAS ACTUALLY WRONG. The 2026-09-09 sweep wired the Learn engine's blurbs
// and put ShowTheWordToggle in both its views. The lesson CARD's anchor line
// moved onto WordInline on 2026-09-13 after "Links don't work in last played."
// The PACED STEP VIEW -- the view a reader reads front to back -- was never
// swept, and printed the joined reference string as plain text inside a green
// paragraph. Green because the PARAGRAPH is green, not because anything was
// tappable: eighty inert references on L149 advertising an affordance they did
// not have (the hollow-surface class, DR-0381).
//
// It survived my own check because the paced shape calls the field `anchorRef`
// while the card calls it `anchor.ref`, so a search for the card's field name
// could not see either paced site. There were TWO, in two components, and they
// change together (Darrell: "Both are change together!!!!!!!!!") -- the same
// two-call-sites class that made Play open the deck twice.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, '../components/', f), 'utf8');
const CHURCH = read('ChurchLearn.jsx');
const FLOW = read('LessonFlow.jsx');

// Source-pinned on purpose: both paced views need a whole course, an audience
// rendering and a paced arc to mount, and what regresses here is the WIRING --
// exactly the inert-but-correct class these tests exist for.
const surfaces = [['ChurchLearn.jsx', CHURCH], ['LessonFlow.jsx', FLOW]];

describe('every paced anchor reference goes through the one Scripture component', () => {
  for (const [name, src] of surfaces) {
    it(`${name} renders the paced anchor through WordInline`, () => {
      expect(src).toMatch(/<WordInline[\s\S]{0,200}anchorRef/);
    });

    it(`${name} no longer prints the reference string as plain text`, () => {
      // The exact shape that shipped: a <strong> holding the joined refs inside
      // a coloured <p>. If it comes back, the references are inert again.
      expect(src).not.toMatch(/<strong[^>]*>Anchor — \{s(eg)?\.audience\.anchorRef\}/);
    });

    it(`${name} still carries the one-hit Show the Word switch`, () => {
      // DR-0341's read-with-or-without. A chip in place is half the design;
      // opening them all with one hit is the other half.
      expect(src).toContain('ShowTheWordToggle');
    });
  }
});

describe('PROVEN-TO-CATCH -- the shape that shipped fails these', () => {
  const preFix = `
    {seg.audience.anchorRef && (
      <p className="text-[0.6875rem] text-[#5A6E3D]">
        <strong>Anchor — {seg.audience.anchorRef}:</strong> {seg.audience.anchorTheme}
      </p>
    )}`;

  it('the plain-text anchor line matches the rejected shape and has no WordInline', () => {
    expect(/<strong[^>]*>Anchor — \{seg\.audience\.anchorRef\}/.test(preFix)).toBe(true);
    expect(preFix.includes('WordInline')).toBe(false);
  });

  it('and a coloured paragraph is not an affordance -- colour is not tappability', () => {
    // The defect in one line: the reader sees green and expects to tap.
    const looksTappable = preFix.includes('#5A6E3D');
    const isTappable = preFix.includes('WordInline') || preFix.includes('<button');
    expect(looksTappable && !isTappable).toBe(true);
  });
});

describe('the field name that hid it', () => {
  it('the paced shape uses anchorRef while the card uses anchor.ref', () => {
    // Recorded so the next search covers both spellings. A grep for one name
    // cannot see the other, which is why two live sites read as zero.
    expect(CHURCH).toContain('anchorRef');
    expect(CHURCH).toContain('anchor?.ref');
  });
});

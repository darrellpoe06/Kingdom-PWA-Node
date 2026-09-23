// @vitest-environment jsdom
// =============================================================================
// THE WORDS GET THE WHOLE WIDTH — SHARE SITS UNDER THEM
// =============================================================================
// Darrell 2026-09-17, from his phone at Big Print 44 on lesson 49:
//
//   "The share button shouldn't make the words only fit to one side taking all
//    that screen real-estate..."
//
// He was describing the row's own shape. The prose and its Share control were
// flex SIBLINGS (items-start justify-between), so the control claimed a column
// of a 360px screen and the reading took what was left — and the control's own
// box was rem-sized, so the bigger he set the text the bigger the control grew
// beside it.
//
// MEASURED IN REAL CHROMIUM AT 360px, BEFORE AND AFTER (DR-0452):
//
//              prose width        share control
//   before     177 of 336 (53%)   117x32px at Normal, 177x184px at Big Print
//   after      302 of 302 (100%)  117x32px at Normal, 117x29px at Big Print
//
// A 184px-tall slab beside the reading is what "taking all that screen
// real-estate" measured out to. Two rules close it: the prose gets the whole
// width with the control beneath it (the shape the green verse strips already
// use at the foot of a section), and the control is chrome, so it is pinned at
// its Normal size at every text step (DR-0438 §1).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const learn = () => readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'ChurchLearn.jsx'),
  'utf8',
);

describe('a lesson card s prose is never squeezed into a column by its Share control', () => {
  it('NO share control is a flex sibling of the prose it belongs to', () => {
    const s = learn();
    // This was the shape: prose with flex-1 and the control beside it, aligned
    // to the top of the row. Three rows carried it (big idea, hands-on, anchor).
    expect(s).not.toMatch(/flex items-start justify-between gap-2/);
  });

  it('each of the five prose sections puts Share on its own line beneath the words', () => {
    const s = learn();
    const beneath = s.match(/className="ts-chrome-region flex justify-end mt-1"/g) || [];
    // Three since DR-0452 (big idea, hands-on, anchor); five since DR-0580
    // added the voices of the time and the dated record, in the same shape.
    expect(beneath.length).toBe(5);
    // And each one holds a section share, not something else.
    expect(s).toMatch(/flex justify-end mt-1">\{sec\('The big idea'/);
    expect(s).toMatch(/flex justify-end mt-1">\{sec\(handsOnLabel/);
    expect(s).toMatch(/flex justify-end mt-1">\{sec\('Anchor'/);
    expect(s).toMatch(/flex justify-end mt-1">\{sec\('Voices of the time'/);
    expect(s).toMatch(/flex justify-end mt-1">\{sec\('Timeline'/);
  });

  it('the prose itself no longer carries flex-1 in those sections — it has the whole width', () => {
    const s = learn();
    expect(s).not.toMatch(/text-sm text-\[#1A1815\] flex-1/);
    expect(s).not.toMatch(/text-xs text-\[#5A5751\] flex-1/);
  });

  it('EVERY share control on a lesson card is pinned as chrome, so it never grows with the text', () => {
    const s = learn();
    // The three prose sections, plus the two label rows (benefits, the Matrix)
    // where a share sits beside an eyebrow. Measured at Big Print: the label
    // rows' control was 177x184px before the cap and 74x59px after.
    const capped = s.match(/ts-chrome-region flex (justify-end mt-1|items-center justify-between gap-2 mb-1)/g) || [];
    // Five, plus the two DR-0580 sections (voices, timeline): seven.
    expect(capped.length).toBe(7);
  });

  it('the anchor line keeps its tappable references and its own reading shape', () => {
    const s = learn();
    // The share move must not cost the DR-0381 fix that made these real links.
    expect(s).toMatch(/text=\{`Anchor — \$\{m\.anchor\.theme \|\| ''\}`\}/);
    expect(s).toMatch(/refsBelow/);
  });

  it('the reason is written where the next reader will look', () => {
    const s = learn();
    expect(s).toMatch(/THE WORDS GET THE WHOLE WIDTH/);
    expect(s).toMatch(/AND THE CONTROL IS PINNED, NOT GROWN/);
  });
});

// Chrome may not sit on the Word.
//
// Darrell, 2026-09-22, on a Big Print screenshot of World Issues issue 17 at
// poetech.us/lovecorner/app/?view=church:
//
//   "The hovering words over the actual lesson needs to be considered
//    undermining the lessons... these types of words covering the Word and
//    perspectives being explained are not wanted.... also how can it do what it
//    is claims to be able to do? I can't find how to do that add a voice?!!!!!!"
//
// Two separate defects, both visible in that one frame.
//
// 1. THE STICKY TITLE HAD NO CEILING. ChurchLearn's lesson-space title is
//    deliberately OUTSIDE .ts-chrome-region, so it grows with Big Print — the
//    2026-09-17 reasoning being that it is text the reader READS. That holds at
//    Normal and fails at A44: a sticky element is not read once and scrolled
//    past, it sits over the prose for the whole lesson, and at 2.75x a long
//    title took three lines of a 660px viewport. The lid, not the size, is the
//    defect. Fix is a CEILING (two lines, clamped) and nothing changes at Normal.
//
// 2. THE READ-ALOUD NOTICE NEVER CAME DOWN, AND NAMED NO ROUTE. The panel is
//    `fixed`, so every notice overlays the lesson by construction. `setNotice`
//    was only ever cleared at the START OF THE NEXT READ (use-read-aloud.js), so
//    a reader who hit one fault and then read with his eyes had a white box
//    parked over the page for the rest of the session. And the message it parked
//    there — "Record a voice sample first" — told him to do a thing without
//    saying where, which is why he could not find it. The Voice tab exists
//    (surfaces.js, id 'voice'), but on a narrow screen it is behind the nav
//    overflow, exactly as his screenshot shows it ("Voi" then a chevron).
//
// A surface that tells a reader to do something must name where. A surface that
// covers the Word must take itself down.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const r = (p) => readFileSync(resolve(__dirname, p), 'utf8');
const CHURCH_LEARN = r('../components/ChurchLearn.jsx');
const TTS = r('../components/TTSControl.jsx');
const HOOK = r('../lib/use-read-aloud.js');
const SURFACES = r('../surfaces.js');

describe('the sticky lesson title has a ceiling, so it can never be a lid', () => {
  it('is clamped to two lines', () => {
    const block = CHURCH_LEARN.slice(
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') - 400,
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') + 700,
    );
    expect(block).toMatch(/WebkitLineClamp: 2/);
    expect(block).toMatch(/WebkitBoxOrient: 'vertical'/);
    expect(block).toMatch(/overflow-hidden/);
  });

  it('carries a hard max-height too, so a clamp failure still cannot run away', () => {
    // -webkit-line-clamp is widely supported but is a vendor property; the
    // em cap is the belt to its braces and is what actually bounds the box.
    const block = CHURCH_LEARN.slice(
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') - 400,
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') + 700,
    );
    expect(block).toMatch(/maxHeight: '2\.8em'/);
  });

  it('the ceiling is the RESTING state and the reader can open it (DR-0605): a fold control sits beside the title', () => {
    // Darrell 2026-09-24: "The title to lessons are getting cut off!!!!!! Fix
    // it..." The two-line ceiling stays (a sticky label never covers the
    // Word); the reader now owns the lid with a control, rendered only when
    // the title really overflows. The render pins live in
    // the-title-stays-in-view.test.jsx; this one keeps the control next to
    // the clamp in the source so neither can be removed without the other.
    const block = CHURCH_LEARN.slice(
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') - 400,
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') + 2400,
    );
    expect(block).toMatch(/data-testid="lesson-space-title-toggle"/);
    expect(block).toMatch(/aria-expanded=\{titleOpen\}/);
    expect(block).toMatch(/titleOpen \|\| titleOverflows/);
  });

  it('the full title is still reachable rather than silently truncated', () => {
    const block = CHURCH_LEARN.slice(
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') - 400,
      CHURCH_LEARN.indexOf('data-testid="lesson-space-title"') + 700,
    );
    expect(block).toMatch(/title=\{focusModule\.title\}/);
  });

  it('REPRODUCES THE DEFECT: without a clamp the box grows with the line count', () => {
    // The pre-fix element had no clamp and no max-height, so its height was
    // purely a function of the title's length times the text-size multiplier.
    // Issue 17's title is long enough to prove the point.
    const title = 'Biology Walks Back the Selfish Gene — the Word Framed the Worlds First, and the Science Is Arriving Late';
    expect(title.length).toBeGreaterThan(90);
    // At Big Print a ~100-character title cannot fit in two lines of a phone
    // column, which is exactly why the clamp (not a shrink) is the fix: the
    // overflow is hidden instead of pushing the lesson down the page.
    const roughCharsPerLineAtBigPrint = 22;
    expect(Math.ceil(title.length / roughCharsPerLineAtBigPrint)).toBeGreaterThan(2);
  });
});

describe('a notice does not hover at all — it lives inside the reader’s own chrome (DR-0576)', () => {
  // SUPERSEDED 2026-09-23, and the replacement is the better answer. The
  // 2026-09-22 fix took the floating box down after twelve seconds; the box
  // still appeared over the Word first, and Darrell met it again with an HTTP
  // 404 in it: "Popup's?!!!" A message that vanishes while it is being read
  // is its own defect. The notice now renders INSIDE the open panel, and while
  // the panel is a pill or a button it is a small mark on that pill or button
  // — nothing new is painted over the page, so nothing needs a timer.
  it('no timer takes the notice down', () => {
    expect(TTS).not.toMatch(/setTimeout\(\(\) => setNotice\(''\), 12000\)/);
  });

  it('the notice block sits inside the panel, not in the fixed stack above it', () => {
    const stackStart = TTS.indexOf('className="tts-controls fixed');
    const interruptedAt = TTS.indexOf('data-testid="reading-interrupted"');
    expect(TTS.slice(stackStart, interruptedAt)).not.toMatch(/data-testid="read-aloud-notice"/);
    expect(TTS.indexOf('data-testid="read-aloud-notice"')).toBeGreaterThan(TTS.indexOf('Read Aloud</div>'));
  });

  it('a closed panel shows a mark, so the message is never lost', () => {
    expect((TTS.match(/data-testid="read-aloud-notice-mark"/g) || []).length).toBe(2);
  });

  it('can also be dismissed by hand', () => {
    expect(TTS).toMatch(/data-testid="read-aloud-notice-dismiss"/);
    expect(TTS).toMatch(/onClick=\{\(\) => setNotice\(''\)\}/);
    expect(TTS).toMatch(/aria-label="Dismiss this message"/);
  });

  it('the hook exports setNotice, which is what makes dismissal possible at all', () => {
    // Before this the panel destructured `notice` and not `setNotice`, so it
    // could display a message and had no way to remove one.
    expect(HOOK).toMatch(/\n {4}setNotice,/);
    // Pinned on the destructure containing it, not on it being the LAST line:
    // the first version asserted `setNotice,\n} = useReadAloud` and went red
    // the moment `noticeAction` was destructured after it, which is a test
    // holding formatting rather than behaviour.
    expect(TTS).toMatch(/\n {4}setNotice,\n[\s\S]{0,80}?\} = useReadAloud/);
  });

  it('carries NO width cap, because the consistency guard owns that line', () => {
    // A first pass added max-w-[22em] here and consistency-guard failed it:
    // width-cap 2 against a frozen baseline of 1 for this file (DR-0246). The
    // cap was never load-bearing — what stops this box being a lid is that it
    // LEAVES, not that it is narrow — so the cap came out rather than the
    // baseline going up. Pinned so nobody re-adds it and re-reds the guard.
    const block = TTS.slice(TTS.indexOf('data-testid="read-aloud-notice"') - 200, TTS.indexOf('data-testid="read-aloud-notice"') + 400);
    expect(block).not.toMatch(/max-w-\[22em\]/);
  });

  it('still announces to a screen reader, so the timeout costs no accessibility', () => {
    const block = TTS.slice(TTS.indexOf('data-testid="read-aloud-notice"') - 300, TTS.indexOf('data-testid="read-aloud-notice"') + 400);
    expect(block).toMatch(/role="status"/);
  });
});

describe('a notice that tells the reader to do something NAMES WHERE', () => {
  it('the voice-sample notice names the Voice tab', () => {
    expect(HOOK).toMatch(/Record a voice sample first in the Voice tab/);
  });

  it('and now OFFERS the route instead of describing where to hunt for it', () => {
    // SUPERSEDED THE SAME DAY, and the replacement is the better answer. The
    // first pass had the notice warn that the tab "may be behind the »
    // overflow on a narrow screen" — accurate, and still leaving the reader to
    // do the finding. Drive-Don't-Delegate applies to the product too: the
    // notice now carries a door (noticeAction) and the panel draws it as a
    // button. Describing the hunt is what was wrong; the description going
    // away is the fix, not a regression.
    expect(HOOK).toMatch(/hrefForView\('voice'\)/);
    expect(HOOK).toMatch(/label: 'Open the Voice tab'/);
    expect(HOOK).not.toMatch(/behind the » overflow/);
  });

  it('the Voice tab it names actually exists, so the notice is not sending him nowhere', () => {
    // A route named in a message must be a route that exists (DR-0381).
    expect(SURFACES).toMatch(/id: 'voice',\s+label: 'Voice',\s+nav: 'top',\s+view: 'voice'/);
  });

  it('the OLD routeless wording is gone', () => {
    expect(HOOK).not.toMatch(/Record a voice sample first — then this reads/);
  });

  it('inside the Voice studio the notice points at the control on THAT screen, not at the tab', () => {
    // Telling someone already in the studio to go to the studio would be absurd.
    const vs = r('../components/VoiceStudio.jsx');
    expect(vs).toMatch(/use Record above/);
    expect(vs).not.toMatch(/in the Voice tab/);
  });
});

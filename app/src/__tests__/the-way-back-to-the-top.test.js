// @vitest-environment node
// =============================================================================
// "Sometimes I can't find the back to the Top button... why?"
// =============================================================================
// Darrell, 2026-09-19, with a screenshot of a lesson open at A+++ on the black
// theme, the Read Aloud panel up. He was right, and the cause was structural
// rather than his memory.
//
// THERE WERE TWO WAYS HOME AND THEY WERE MUTUALLY EXCLUSIVE:
//
//   1. The floating ↑ button, gated `showTop && !isOpen`. It lives in a
//      bottom-anchored flex column (`fixed bottom-4 right-4 flex flex-col`)
//      that the panel ALSO lives in, and children stack upward -- so with a
//      tall panel open the ↑ would be pushed off the top of the screen. That
//      is why `!isOpen` is there, and why simply deleting it would not have
//      fixed anything.
//
//   2. `⏮ Top` inside the panel -- but down in the second button row. On a
//      phone that row is below the fold of the panel itself; his own
//      screenshot shows the panel clipped at "VOICE (USED EVERYWHERE)".
//
// So whenever the panel was open, the way back to the top was either hidden by
// design or scrolled out of view. The fix is a Top in the panel HEADER, which
// never scrolls away, beside Close.
//
// AND THE TWO CONTROLS DID DIFFERENT THINGS UNDER ONE NAME, which is its own
// defect: the row button's label claimed it "restarts the reading", while
// jumpTop only re-seeks the voice when a reading is actually running. For a
// reader using their eyes it was always a plain scroll home. The label now
// says what the code does.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'components', 'TTSControl.jsx'), 'utf8');

describe('the panel always carries a way back to the top', () => {
  it('reads the real component, so a pass means something', () => {
    // Anti-theater: if the path broke, every assertion below would be vacuous.
    expect(SRC.length).toBeGreaterThan(20_000);
    expect(SRC).toContain('Read Aloud');
  });

  it('the header carries a Top button', () => {
    expect(SRC, 'the header Top button is gone').toContain('data-testid="tts-header-top"');
  });

  it('and it sits in the HEADER — the row that never scrolls away', () => {
    // Containment, not source order. Source order would be a lying proxy: the
    // reading pill declares its own ⏮ Top EARLIER in the file than the header
    // block, so "appears before" proves nothing. What matters is that the Top
    // and Close are inside the SAME header flex container, because that is the
    // row that stays put when the panel body scrolls.
    const open = SRC.indexOf('data-testid="tts-header-top"');
    expect(open, 'header Top missing').toBeGreaterThan(0);
    const containerStart = SRC.lastIndexOf('<div className="flex items-center gap-', open);
    expect(containerStart, 'header Top is not inside a flex container at all').toBeGreaterThan(0);
    const block = SRC.slice(containerStart, SRC.indexOf('</div>', SRC.indexOf('× Close')));
    expect(block, 'Top and Close must share the header row').toContain('data-testid="tts-header-top"');
    expect(block, 'Top and Close must share the header row').toContain('× Close');
  });

  it('the reading pill keeps its own way home too', () => {
    // There are two ⏮ Top controls -- the collapsed reading pill and the full
    // panel's button row -- and both must survive. Counting them is what would
    // catch a refactor that "tidied up" one of them away.
    expect(SRC.split('⏞ Top').length - 1 + (SRC.split('⏮ Top').length - 1)).toBe(2);
  });

  it('it scrolls home and does not stop a reading that is running', () => {
    // Same handler as the row button. jumpTop re-seeks the voice ONLY when a
    // reading is in progress, so for someone reading with their eyes this is a
    // plain scroll to the top and nothing else moves.
    expect(SRC).toMatch(/onClick=\{jumpTop\}[^>]*data-testid="tts-header-top"/);
    expect(SRC).toMatch(/if \(f && f\.follow && isReading\) jumpToSegment\(0\);/);
  });

  it('the floating ↑ is still hidden while the panel is open, ON PURPOSE', () => {
    // Kept, and pinned, because the header button is what makes it safe to keep.
    // If a future edit drops `!isOpen` without removing the shared flex column,
    // the ↑ gets pushed off-screen by a tall panel and the bug comes back
    // wearing a different shape.
    expect(SRC).toContain('const scrollTopBtn = showTop && !isOpen ?');
    expect(SRC).toContain('fixed bottom-4 right-4 z-[80] print:hidden flex flex-col items-end');
  });

  it('no control claims to do something the code does not do', () => {
    // The row button used to say it "restarts the reading" unconditionally.
    expect(SRC, 'a label is overstating what the button does').not.toContain('scrolls up and restarts the reading');
  });
});

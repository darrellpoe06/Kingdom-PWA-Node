// A tab past the right edge is a tab you have to already know about.
//
// Darrell, 2026-09-22: "All buried tabs need to be able to be seen from the
// beginning of the top tab group... make sense?"
//
// It makes sense, and it is the same defect that cost him a whole day earlier:
// the Voice tab was real, mounted and working, and it rendered as "Voi" plus a
// chevron at the edge of a scrolling row. He could not find it, and the app's
// answer at the time was a notice explaining where to swipe. That is a
// description of a hunt, not a fix.
//
// The scrolling strip alone cannot solve this. It is the right default — one
// clean line, the nav he likes — but its tail is only reachable by somebody who
// already knows what is down there. So when the row ACTUALLY overflows, a
// control appears that unwraps it into as many lines as it needs: nothing
// hidden, nothing to scroll.
//
// IT GOES ON THE ONE PRIMITIVE, not on one screen. Every active-underline tab
// row in this app routes through TabScroll (the tab-overflow guard enforces it),
// so the main nav, the Books and Church sub-navs, the Voice studio's own strip
// and every component sub-strip inherit the same behaviour at once. Putting it
// on the nav alone would leave the Voice studio's five tabs buried on the very
// screen where he was already lost.
//
// THREE PROPERTIES MAKE THAT SAFE, and each is a case below:
//   * It appears only when something is genuinely buried — MEASURED with
//     scrollWidth, not guessed with a breakpoint.
//   * The choice persists per strip. Someone who opens it is telling you their
//     screen is too narrow for the default; re-collapsing on every navigation
//     would be a small daily insult.
//   * Collapsed behaviour is untouched, so the nav he likes does not move.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SHARED = readFileSync(resolve(__dirname, '../components/shared.jsx'), 'utf8');
// THE SLICE ENDS WHERE THE FUNCTION ENDS, not 3,200 characters in (2026-11-12).
// The fixed window was a measurement of the file as it stood: adding a comment
// INSIDE TabScroll pushed its button past the end, and four cases that had
// nothing to do with that change went red while the code they check was still
// right there. A check that fires on correct code teaches you to ignore it, so
// the window is now the function itself -- up to the next top-level
// declaration -- and grows with it.
const block = () => {
  const start = SHARED.indexOf('function TabScroll(');
  const after = SHARED.indexOf('\nfunction ', start + 1);
  return SHARED.slice(start, after > start ? after : undefined);
};

describe('the control exists, and it is on the ONE primitive', () => {
  it('TabScroll renders a show-all button', () => {
    expect(block()).toMatch(/data-testid="tabscroll-show-all"/);
  });

  it('it unwraps the row instead of scrolling it', () => {
    const b = block();
    expect(b).toMatch(/showAll \? 'flex-wrap' : ''/);
    expect(b).toMatch(/showAll \? 'overflow-visible' : 'overflow-x-auto'/);
  });

  // THE WAY BACK MUST SURVIVE THE WAY OUT (Darrell 2026-11-12, from his phone
  // on Learn with a narrow and a wide screenshot: "The less button is hidden on
  // narrow screens"). Expanding is half the control; `Less` is the other half,
  // and it is rendered ONLY while expanded. The scroll box flips to
  // `overflow-visible` in that state, which returns its `min-width: auto` to
  // MIN-CONTENT -- the widest single chip, wider than a phone on Learn -- so
  // without `min-w-0` the box refuses to shrink and shoves `Less` off the right
  // edge. The row then cannot be put back: this primitive's own expanded mode
  // burying the one control that undoes it.
  it('the box keeps its ability to shrink, so Less is never pushed off the edge', () => {
    const b = block();
    const box = b.slice(b.indexOf('ref={boxRef}'), b.indexOf('style={{ WebkitOverflowScrolling'));
    expect(box, 'the scroll box must shrink below its min-content, in BOTH overflow states').toMatch(/min-w-0/);
    // And the control beside it must still refuse to shrink, or the fix would
    // only move the squeeze from the button's position to its width.
    expect(b).toMatch(/data-testid="tabscroll-show-all"[\s\S]*?shrink-0/);
  });

  it('every tab strip in the app routes through this primitive', () => {
    // The guard that enforces it already exists; this records WHY that matters
    // here — the fix reaches every strip precisely because of that rule.
    expect(SHARED).toMatch(/THE ONE tab-strip primitive/);
  });
});

describe('it only appears when something is actually buried', () => {
  it('overflow is MEASURED with scrollWidth, never guessed from a breakpoint', () => {
    const b = block();
    expect(b).toMatch(/el\.scrollWidth > el\.clientWidth/);
    expect(b).toMatch(/ResizeObserver/);
  });

  it('a strip that fits shows no control', () => {
    expect(block()).toMatch(/\{\(overflows \|\| showAll\) && \(/);
  });

  it('it re-measures when the children change, not only on mount', () => {
    // Tabs appear and disappear with role and sign-in state, so a one-time
    // measurement would be wrong for exactly the people with the most tabs.
    expect(block()).toMatch(/\}, \[children\]\);/);
  });

  it('and it survives a browser with no ResizeObserver rather than crashing', () => {
    expect(block()).toMatch(/typeof ResizeObserver === 'undefined'/);
  });
});

describe('the choice persists, per strip', () => {
  it('is keyed by the strip, so opening the nav does not unwrap every sub-strip', () => {
    expect(block()).toMatch(/tabscroll:showall:\$\{label \|\| 'row'\}/);
  });

  it('reads and writes through try/catch, because private mode throws', () => {
    const b = block();
    expect(b).toMatch(/try \{ return localStorage\.getItem\(storeKey\) === '1'; \} catch/);
    expect(b).toMatch(/catch \(_\) \{ \/\* private mode \*\/ \}/);
  });
});

describe('it is reachable and legible to a screen reader', () => {
  it('announces its state', () => {
    expect(block()).toMatch(/aria-expanded=\{showAll\}/);
  });

  it('the label says what it does rather than naming a glyph', () => {
    expect(block()).toMatch(/Show every tab, including the ones past the edge/);
  });

  it('it stays fixed-size while body text scales, like the row it sits beside', () => {
    // Otherwise Big Print grows the control and buries one more tab.
    const b = block();
    const btn = b.slice(b.indexOf('data-testid="tabscroll-show-all"') - 400, b.indexOf('data-testid="tabscroll-show-all"') + 800);
    expect(btn).toMatch(/chrome \? 'ts-chrome-region '/);
  });
});

// @vitest-environment jsdom
// =============================================================================
// remote-navigation — the app, driven by a TV remote
// =============================================================================
// Darrell 2026-09-20, asking how to get PoeTech or Love Corner onto a Firestick.
// The .apk is the wrong shape for a TV, so the route that works is the browser
// — and the browser route is only worth sending anyone to if a D-pad can
// actually drive the pages. This gates that.
//
// THE SIX THINGS THIS COULD MOST EASILY HAVE GOT WRONG:
//
//   1. FOLLOWING DOM ORDER. Tab order is one line through the document; a
//      D-pad is two-dimensional. On a grid, "right" in DOM order walks onto
//      the next ROW at the end of each one. The grid tests below are the whole
//      reason the core is spatial.
//   2. STEALING ARROWS FROM TEXT FIELDS. A remote user typing in a search box
//      still needs left/right for the caret, and has no other way to move it.
//      Hijacking there strands them mid-word.
//   3. WRAPPING AT THE EDGE. Tempting, and wrong on a TV: the viewer is across
//      the room with no pointer, and focus silently teleporting to the far
//      corner is unrecoverable. The edge must be a no-op.
//   4. LANDING ON THINGS THAT ARE NOT THERE. Disabled, hidden, aria-hidden and
//      tabindex="-1" elements all match a naive focusable selector, and each
//      one is a dead stop where the remote appears broken.
//   5. DOING NOTHING ON THE FIRST PRESS. With nothing focused yet, a strict
//      "move from current" implementation no-ops — so the remote reads as dead
//      on every fresh page. The first press must adopt something.
//   6. TESTING AGAINST A LAYOUT ENGINE THAT IS NOT RUNNING. jsdom does no
//      layout, so every getBoundingClientRect() is zeros; a DOM-coupled
//      implementation would "pass" while proving nothing (DR-0076 §3). The
//      geometry is injected here so the assertions are about real coordinates.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  nextInDirection, inDirection, score, editsText, focusableIn, wireRemoteNavigation, consumesArrows,
  handleRemoteKey, DIRECTIONS, CROSS_AXIS_WEIGHT, FOCUSABLE_SELECTOR,
} from '../lib/remote-navigation.js';

const repoRoot = resolve(__dirname, '../../..');

const r = (left, top, width = 100, height = 50) => ({ left, top, width, height });

// A 3x3 grid, 100x50 tiles with 20px gutters. Index = row * 3 + col.
const GRID = [];
for (let row = 0; row < 3; row += 1) {
  for (let col = 0; col < 3; col += 1) GRID.push(r(col * 120, row * 70));
}

describe('the D-pad moves through a grid the way a grid looks', () => {
  it('right goes along the row, never down to the next one', () => {
    expect(nextInDirection(GRID, 0, 'right')).toBe(1);
    expect(nextInDirection(GRID, 1, 'right')).toBe(2);
    expect(nextInDirection(GRID, 3, 'right')).toBe(4);
  });

  it('down goes to the same column one row lower', () => {
    expect(nextInDirection(GRID, 0, 'down')).toBe(3);
    expect(nextInDirection(GRID, 1, 'down')).toBe(4);
    expect(nextInDirection(GRID, 5, 'down')).toBe(8);
  });

  it('left and up are the exact inverses', () => {
    expect(nextInDirection(GRID, 2, 'left')).toBe(1);
    expect(nextInDirection(GRID, 8, 'up')).toBe(5);
  });

  it('PROVEN-TO-CATCH: DOM order would give a different, wrong answer here', () => {
    // Tile 2 is the end of row 0. Sequential order says "next" is tile 3, the
    // start of row 1 — the classic wrong move this module exists to avoid.
    // Spatially there is nothing to the right of tile 2 at all.
    expect(nextInDirection(GRID, 2, 'right')).toBe(-1);
    expect(nextInDirection(GRID, 2, 'right')).not.toBe(3);
  });

  it('the cross-axis weight is what keeps movement in-row', () => {
    // A tile slightly nearer in raw distance but one row down must LOSE to the
    // true in-row neighbour. Without the weighting this picks the wrong tile.
    const rects = [r(0, 0), r(200, 0), r(150, 60)];
    expect(nextInDirection(rects, 0, 'right')).toBe(1);
    expect(CROSS_AXIS_WEIGHT).toBeGreaterThan(1);
    // And the weighting is real: the off-row tile scores worse despite being
    // closer along the axis of travel.
    expect(score(rects[0], rects[2], 'right')).toBeGreaterThan(score(rects[0], rects[1], 'right'));
  });
});

describe('the edge of the screen is a wall, not a wrap', () => {
  it('returns -1 rather than teleporting across the screen', () => {
    expect(nextInDirection(GRID, 0, 'up')).toBe(-1);
    expect(nextInDirection(GRID, 0, 'left')).toBe(-1);
    expect(nextInDirection(GRID, 8, 'down')).toBe(-1);
    expect(nextInDirection(GRID, 8, 'right')).toBe(-1);
  });

  it('a single item has nowhere to go in any direction', () => {
    for (const d of ['up', 'down', 'left', 'right']) {
      expect(nextInDirection([r(0, 0)], 0, d)).toBe(-1);
    }
  });

  it('an unknown direction or a bad index is -1, never a throw', () => {
    expect(nextInDirection(GRID, 0, 'sideways')).toBe(-1);
    expect(nextInDirection(GRID, 99, 'down')).toBe(-1);
  });

  it('level is NOT "in direction" — a neighbour must genuinely be that way', () => {
    expect(inDirection(r(0, 0), r(200, 0), 'down')).toBe(false);
    expect(inDirection(r(0, 0), r(200, 0), 'right')).toBe(true);
  });
});

describe('typing keeps its arrow keys', () => {
  it('a text input, textarea and contenteditable all edit text', () => {
    const input = document.createElement('input');
    expect(editsText(input)).toBe(true);
    const search = document.createElement('input');
    search.setAttribute('type', 'search');
    expect(editsText(search)).toBe(true);
    expect(editsText(document.createElement('textarea'))).toBe(true);
  });

  it('a checkbox, radio or button-typed input does NOT', () => {
    for (const t of ['checkbox', 'radio', 'button', 'submit']) {
      const el = document.createElement('input');
      el.setAttribute('type', t);
      expect(editsText(el), `type=${t} wrongly treated as text entry`).toBe(false);
    }
    expect(editsText(document.createElement('button'))).toBe(false);
    expect(editsText(null)).toBe(false);
  });
});

describe('focusableIn skips everything a remote would stall on', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <a href="/a" id="a">A</a>
      <button id="b">B</button>
      <button id="disabled" disabled>D</button>
      <button id="hidden" hidden>H</button>
      <button id="ariahidden" aria-hidden="true">AH</button>
      <div id="skip" tabindex="-1">S</div>
      <div id="custom" tabindex="0">C</div>
      <span id="plain">plain</span>`;
    document.body.appendChild(root);
  });

  it('keeps links, buttons and explicit tabindex, in document order', () => {
    // jsdom lays nothing out, so the visibility predicate is injected — the
    // alternative is asserting against a layout engine that is not running.
    const ids = focusableIn(root, { isVisible: () => true }).map((el) => el.id);
    expect(ids).toEqual(['a', 'b', 'custom']);
  });

  it('each exclusion is load-bearing, named one by one', () => {
    const ids = focusableIn(root, { isVisible: () => true }).map((el) => el.id);
    for (const gone of ['disabled', 'hidden', 'ariahidden', 'skip', 'plain']) {
      expect(ids, `${gone} is reachable and should not be`).not.toContain(gone);
    }
  });

  it('a root that cannot be queried yields nothing rather than throwing', () => {
    expect(focusableIn(null)).toEqual([]);
    expect(focusableIn({})).toEqual([]);
  });

  it('the selector itself excludes tabindex="-1"', () => {
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });
});

describe('handleRemoteKey — the whole thing, end to end', () => {
  let root;
  let rects;
  const key = (k, over = {}) => {
    let prevented = false;
    return {
      key: k, ...over,
      preventDefault: () => { prevented = true; },
      get defaultPrevented() { return prevented; },
    };
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    // Two rows of two, so both axes are exercised against real coordinates.
    root.innerHTML = `
      <button id="tl">TL</button><button id="tr">TR</button>
      <button id="bl">BL</button><button id="br">BR</button>`;
    document.body.appendChild(root);
    rects = { tl: r(0, 0), tr: r(120, 0), bl: r(0, 70), br: r(120, 70) };
  });
  const measure = (el) => rects[el.id];

  it('a D-pad press moves focus spatially', () => {
    document.getElementById('tl').focus();
    const moved = handleRemoteKey(key('ArrowRight'), root, { rectOf: measure, isVisible: () => true });
    expect(moved && moved.id).toBe('tr');
    expect(document.activeElement.id).toBe('tr');
  });

  it('down moves a row, not to the next sibling', () => {
    document.getElementById('tl').focus();
    const moved = handleRemoteKey(key('ArrowDown'), root, { rectOf: measure, isVisible: () => true });
    expect(moved && moved.id).toBe('bl');
  });

  it('the first press adopts something — the remote is never dead on arrival', () => {
    document.body.focus();
    expect(document.activeElement.id).not.toBe('tl');
    const moved = handleRemoteKey(key('ArrowDown'), root, { rectOf: measure, isVisible: () => true });
    expect(moved && moved.id).toBe('tl');
  });

  it('at the edge nothing moves, and the event is left to the page', () => {
    document.getElementById('tl').focus();
    const ev = key('ArrowUp');
    expect(handleRemoteKey(ev, root, { rectOf: measure, isVisible: () => true })).toBe(null);
    expect(document.activeElement.id).toBe('tl');
    expect(ev.defaultPrevented, 'the page must still be able to scroll').toBe(false);
  });

  it('a handled press IS prevented, so the page does not also scroll', () => {
    document.getElementById('tl').focus();
    const ev = key('ArrowRight');
    handleRemoteKey(ev, root, { rectOf: measure, isVisible: () => true });
    expect(ev.defaultPrevented).toBe(true);
  });

  it('arrows inside a text field are left entirely alone', () => {
    const input = document.createElement('input');
    root.appendChild(input);
    rects.__input = r(0, 140);
    input.focus();
    const ev = key('ArrowRight');
    expect(handleRemoteKey(ev, root, { rectOf: (el) => rects[el.id] || r(0, 140), isVisible: () => true })).toBe(null);
    expect(ev.defaultPrevented, 'the caret must still move').toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('a modifier means the user is doing something else', () => {
    document.getElementById('tl').focus();
    for (const mod of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
      expect(handleRemoteKey(key('ArrowRight', { [mod]: true }), root, { rectOf: measure, isVisible: () => true })).toBe(null);
    }
  });

  it('a non-arrow key is not ours', () => {
    document.getElementById('tl').focus();
    for (const k of ['a', 'Tab', 'Escape', 'PageDown']) {
      expect(handleRemoteKey(key(k), root, { rectOf: measure, isVisible: () => true })).toBe(null);
    }
  });

  it('Enter is left to the browser, which already activates a focused control', () => {
    // Re-implementing activation would double-fire on real buttons and links.
    expect(DIRECTIONS.Enter).toBeUndefined();
  });

  it('an empty root is a no-op rather than a crash', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);
    expect(handleRemoteKey(key('ArrowDown'), empty, { rectOf: measure, isVisible: () => true })).toBe(null);
  });
});

describe('it is actually wired, and the ring is actually visible', () => {
  // A library nothing calls is a library that does nothing. These two gates
  // are the difference between "remote support exists in the repo" and
  // "a remote works on the TV" — the claim that matters.
  const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

  it('boot installs the listener', () => {
    const main = read('app/src/main.jsx');
    expect(main, 'remote navigation is never wired at boot').toMatch(/wireRemoteNavigation\(\)/);
    expect(main).toMatch(/from '\.\/lib\/remote-navigation\.js'/);
  });

  it('the listener BUBBLES, so surfaces owning their arrows keep them', () => {
    // Capture phase would steal arrows from the lightbox, the presenter and
    // the section tabs, all of which handle their own. The absence of a
    // capture flag IS the contract, so it is asserted rather than assumed.
    const lib = read('app/src/lib/remote-navigation.js');
    expect(lib).toMatch(/addEventListener\('keydown', onKeyDown\)/);
    expect(lib, 'a capture-phase listener would hijack other surfaces').not.toMatch(
      /addEventListener\('keydown',[^)]*true\)/,
    );
    expect(lib, 'an already-handled key must be left alone').toMatch(/event\.defaultPrevented/);
  });

  it('wiring returns a working unsubscribe and survives a missing document', () => {
    const off = wireRemoteNavigation(document);
    expect(typeof off).toBe('function');
    off();
    expect(typeof wireRemoteNavigation(null)).toBe('function');
  });

  it('focus is VISIBLE — the only cursor a remote has', () => {
    const css = read('app/src/index.css');
    expect(css, 'no focus-visible styling: focus exists but cannot be seen').toMatch(/:focus-visible/);
    expect(css).toMatch(/outline:\s*3px solid/);
    // :focus, not :focus-visible, would paint a ring on every phone tap.
    expect(css).toMatch(/:focus-visible\s*\{/);
  });

  it('the ring is NOT red — true red is reserved (Color Theology, DR-0099)', () => {
    // Break: set the outline to #FF0000 or #C00 and this fails. The ring is
    // chrome; red belongs to the Blood and marks nothing else.
    const css = read('app/src/index.css');
    const ringBlock = css.slice(css.indexOf(':focus-visible'));
    const colours = ringBlock.match(/#[0-9A-Fa-f]{3,6}/g) || [];
    expect(colours.length, 'the focus ring declares no colour at all').toBeGreaterThan(0);
    for (const hex of colours) {
      const h = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
      const rd = parseInt(h.slice(1, 3), 16);
      const gn = parseInt(h.slice(3, 5), 16);
      const bl = parseInt(h.slice(5, 7), 16);
      const dominantRed = rd > 150 && rd > gn * 1.8 && rd > bl * 1.8;
      expect(dominantRed, `focus ring uses a red-dominant colour ${hex}`).toBe(false);
    }
  });

  it('PROVEN-TO-CATCH: the red check fires on an actual red', () => {
    for (const hex of ['#FF0000', '#C00000', '#e11d48']) {
      const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
      const rd = parseInt(h.slice(1, 3), 16);
      const gn = parseInt(h.slice(3, 5), 16);
      const bl = parseInt(h.slice(5, 7), 16);
      expect(rd > 150 && rd > gn * 1.8 && rd > bl * 1.8, `${hex} should read as red`).toBe(true);
    }
  });

  it('both themes get a ring — a dark theme must not swallow it', () => {
    const css = read('app/src/index.css');
    expect(css).toMatch(/data-theme='dark'\]/);
    expect(css).toMatch(/prefers-color-scheme: dark/);
  });
});

describe('elements that OWN the arrows keep them', () => {
  // Found by checking the real surfaces rather than by reasoning about the
  // design, which is the only way this class of bug ever turns up.
  it('a <video> keeps its arrows — seek and volume are the point on a TV', () => {
    // ChurchLearn.jsx renders `<video controls>`, and watching the service on
    // the big screen is The Love Corner's whole reason to be on a television.
    // Hijacking Left/Right here would break the one thing the viewer came for.
    expect(consumesArrows(document.createElement('video'))).toBe(true);
    expect(consumesArrows(document.createElement('audio'))).toBe(true);
  });

  it('a range slider keeps its arrows — it IS its arrow keys', () => {
    const range = document.createElement('input');
    range.setAttribute('type', 'range');
    expect(consumesArrows(range)).toBe(true);
    // And the narrower question still answers correctly for its own purpose:
    // a range has no caret, so it does not "edit text".
    expect(editsText(range)).toBe(false);
  });

  it('a plain button does NOT own them, or nothing could ever move', () => {
    expect(consumesArrows(document.createElement('button'))).toBe(false);
    expect(consumesArrows(document.createElement('a'))).toBe(false);
    expect(consumesArrows(null)).toBe(false);
  });

  it('END TO END: focus a video, press an arrow, focus does not move', () => {
    document.body.innerHTML = '';
    const root = document.createElement('div');
    root.innerHTML = '<button id="before">B</button><video id="v" controls tabindex="0"></video>';
    document.body.appendChild(root);
    const rects = { before: r(0, 0), v: r(0, 70) };
    const video = document.getElementById('v');
    video.focus();
    let prevented = false;
    const ev = { key: 'ArrowUp', preventDefault: () => { prevented = true; } };
    expect(handleRemoteKey(ev, root, { rectOf: (el) => rects[el.id], isVisible: () => true })).toBe(null);
    expect(document.activeElement.id, 'focus was stolen from the player').toBe('v');
    expect(prevented, 'the player must still receive the key').toBe(false);
  });

  it('PROVEN-TO-CATCH: the same press DOES move focus from a button', () => {
    // The control case — without it the test above would pass on a handler
    // that had simply stopped working.
    document.body.innerHTML = '';
    const root = document.createElement('div');
    root.innerHTML = '<button id="before">B</button><button id="after">A</button>';
    document.body.appendChild(root);
    const rects = { before: r(0, 0), after: r(0, 70) };
    document.getElementById('after').focus();
    const moved = handleRemoteKey(
      { key: 'ArrowUp', preventDefault: () => {} },
      root,
      { rectOf: (el) => rects[el.id], isVisible: () => true },
    );
    expect(moved && moved.id).toBe('before');
  });
});

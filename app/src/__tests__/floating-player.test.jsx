// @vitest-environment jsdom
// =============================================================================
// The popped-out player outlives the tab that opened it
// =============================================================================
// Darrell 2026-09-20, mid-sermon on the TV: "Going away from the tab should not
// close the popout video player... fix it..."
//
// It closed because it was never a floating player in the app's sense — it was
// a CSS position on a div inside ChurchHome, and ChurchHome unmounts the moment
// you leave the Church tab. The component had already solved the NEAR-miss: its
// own comment says the iframe "stays keyed + in the SAME wrapper so toggling
// size/float/drag never remounts it". Nothing inside a component being
// unmounted can survive its own unmount, so the player had to move to the shell.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  openFloating, closeFloating, getFloating, isFloating,
  setFloatingPos, subscribeFloating, resetFloating,
} from '../lib/floating-player.js';
import { clampToViewport, EDGE } from '../components/FloatingPlayer.jsx';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

describe('the store holds the player across everything', () => {
  beforeEach(() => resetFloating());

  it('opens, reports, and docks', () => {
    expect(isFloating()).toBe(false);
    openFloating({ src: 'https://example.com/v', title: 'Sermon' });
    expect(isFloating()).toBe(true);
    expect(getFloating().src).toBe('https://example.com/v');
    closeFloating();
    expect(isFloating()).toBe(false);
  });

  it('re-opening the SAME source keeps the stream — it does not restart it', () => {
    // The whole point is continuous playback. Republishing a fresh object for
    // an identical src would change the iframe's key and restart the sermon,
    // which is the exact failure the in-place version had already learned to
    // avoid when toggling size.
    openFloating({ src: 'https://example.com/v', title: 'A' });
    const first = getFloating();
    setFloatingPos({ x: 40, y: 60 });
    openFloating({ src: 'https://example.com/v', title: 'B' });
    expect(getFloating().src).toBe(first.src);
    expect(getFloating().pos, 'a same-src re-open threw away the drag position').toEqual({ x: 40, y: 60 });
    expect(getFloating().title).toBe('B');
  });

  it('a DIFFERENT source replaces it and forgets the old position', () => {
    openFloating({ src: 'a' });
    setFloatingPos({ x: 10, y: 10 });
    openFloating({ src: 'b' });
    expect(getFloating().src).toBe('b');
    expect(getFloating().pos).toBe(null);
  });

  it('an empty source is ignored rather than opening an empty player', () => {
    openFloating({ src: '' });
    openFloating({});
    expect(isFloating()).toBe(false);
  });

  it('notifies subscribers and unsubscribes cleanly', () => {
    const seen = [];
    const off = subscribeFloating((st) => seen.push(st.src));
    openFloating({ src: 'x' });
    off();
    openFloating({ src: 'y' });
    expect(seen).toEqual(['x']);
  });

  it('one throwing subscriber never stops the others', () => {
    let reached = false;
    subscribeFloating(() => { throw new Error('bad'); });
    subscribeFloating(() => { reached = true; });
    openFloating({ src: 'z' });
    expect(reached).toBe(true);
  });
});

describe('the drag stays reachable', () => {
  // The version this replaces clamped to the viewport. Losing that would have
  // been a worse bug than the one being fixed: a player dragged past the edge
  // cannot be grabbed back, and a television has no window edge or scrollbar
  // to recover it with — only a reload, which loses your place in the sermon.
  const win = { innerWidth: 1000, innerHeight: 600 };
  const size = { width: 300, height: 180 };

  it('cannot be dragged off the right or bottom', () => {
    expect(clampToViewport({ x: 9999, y: 9999 }, size, win))
      .toEqual({ x: 1000 - 300 - EDGE, y: 600 - 180 - EDGE });
  });

  it('cannot be dragged off the left or top', () => {
    expect(clampToViewport({ x: -500, y: -500 }, size, win)).toEqual({ x: EDGE, y: EDGE });
  });

  it('leaves a position inside the viewport alone', () => {
    expect(clampToViewport({ x: 120, y: 90 }, size, win)).toEqual({ x: 120, y: 90 });
  });

  it('a viewport it cannot measure is passed through, never zeroed', () => {
    // Clamping against an unknown viewport would slam the player into the
    // corner on any engine that reports no dimensions.
    expect(clampToViewport({ x: 120, y: 90 }, size, null)).toEqual({ x: 120, y: 90 });
    expect(clampToViewport({ x: 120, y: 90 }, size, { innerWidth: 0, innerHeight: 0 })).toEqual({ x: 120, y: 90 });
  });
});

describe('it is mounted where it can survive, and rendered only once', () => {
  it('lives in the app shell beside TTSControl, not in a tab', () => {
    const shell = read('app/src/poe-financial-mvp-v28.jsx');
    expect(shell).toMatch(/<FloatingPlayer \/>/);
    expect(shell).toMatch(/import FloatingPlayer from '\.\/components\/FloatingPlayer\.jsx'/);
  });

  it('ChurchHome no longer owns a floating branch', () => {
    const ch = read('app/src/components/ChurchHome.jsx');
    expect(ch, 'the tab still positions its own floating player').not.toMatch(/fixed z-\[60\] w-\[46vw\]/);
    expect(ch, 'the tab still owns float state').not.toMatch(/setFloating\(/);
    expect(ch).toMatch(/openFloating\(/);
    expect(ch).toMatch(/closeFloating\(\)/);
  });

  it('the tab suppresses its own iframe while popped out — never two streams', () => {
    // Two live iframes on one source would play the sermon over itself.
    expect(read('app/src/components/ChurchHome.jsx')).toMatch(/\{!floating && <iframe/);
  });

  it('the shell keys the iframe by SOURCE alone, so a drag cannot restart it', () => {
    const fp = read('app/src/components/FloatingPlayer.jsx');
    expect(fp).toMatch(/key=\{player\.src\}/);
    expect(fp, 'keying on position would restart the stream on every drag tick').not.toMatch(/key=\{[^}]*pos/);
  });
});

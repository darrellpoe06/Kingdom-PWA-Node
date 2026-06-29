// header-hideaway — the one-click header collapse preference.
// Locks the contract a regression would silently break: the toggle flips,
// persistence round-trips per device, only the exact '1' string reads as
// collapsed, the safe default is OPEN, and blocked storage degrades to a
// session-only toggle instead of throwing. Also guards that the chevron
// affordances ship as bundled SVG icons (never device emoji — consistency
// standard / UiIcon contract). Proven-to-catch (DR-0076): each assert fails
// if the behavior it guards is broken.
import { describe, it, expect } from 'vitest';
import {
  HEADER_COLLAPSED_KEY, nextCollapsed, readHeaderCollapsed, writeHeaderCollapsed,
} from '../lib/header-hideaway.js';
import { UI_ICON_NAMES } from '../components/UiIcon.jsx';

// A tiny in-memory localStorage stand-in (Node test env has no DOM storage).
function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

// A store whose writes/reads throw — models private mode / blocked storage.
function brokenStore() {
  return {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
  };
}

describe('nextCollapsed', () => {
  it('flips the boolean', () => {
    expect(nextCollapsed(false)).toBe(true);
    expect(nextCollapsed(true)).toBe(false);
  });
});

describe('readHeaderCollapsed', () => {
  it('defaults to OPEN (false) with no saved preference', () => {
    expect(readHeaderCollapsed(makeStore())).toBe(false);
  });

  it('reads collapsed only for the exact "1" string', () => {
    const s = makeStore();
    s.setItem(HEADER_COLLAPSED_KEY, '1');
    expect(readHeaderCollapsed(s)).toBe(true);
  });

  it('treats "0", absent, and garbage as OPEN (safe default)', () => {
    const s = makeStore();
    s.setItem(HEADER_COLLAPSED_KEY, '0');
    expect(readHeaderCollapsed(s)).toBe(false);
    s.setItem(HEADER_COLLAPSED_KEY, 'yes');
    expect(readHeaderCollapsed(s)).toBe(false);
  });

  it('returns false (no throw) when storage throws', () => {
    expect(readHeaderCollapsed(brokenStore())).toBe(false);
  });
});

describe('writeHeaderCollapsed', () => {
  it('round-trips the preference per device', () => {
    const s = makeStore();
    expect(writeHeaderCollapsed(true, s)).toBe(true);
    expect(s.getItem(HEADER_COLLAPSED_KEY)).toBe('1');
    expect(readHeaderCollapsed(s)).toBe(true);

    expect(writeHeaderCollapsed(false, s)).toBe(true);
    expect(s.getItem(HEADER_COLLAPSED_KEY)).toBe('0');
    expect(readHeaderCollapsed(s)).toBe(false);
  });

  it('fails soft (returns false, no throw) when storage throws', () => {
    expect(writeHeaderCollapsed(true, brokenStore())).toBe(false);
  });

  it('full toggle cycle persists and resumes', () => {
    const s = makeStore();
    let collapsed = readHeaderCollapsed(s); // open by default
    collapsed = nextCollapsed(collapsed);
    writeHeaderCollapsed(collapsed, s);
    expect(readHeaderCollapsed(s)).toBe(true); // tucked away — survives reload
    collapsed = nextCollapsed(collapsed);
    writeHeaderCollapsed(collapsed, s);
    expect(readHeaderCollapsed(s)).toBe(false); // brought back
  });
});

describe('chevron affordances are bundled SVG icons (no device emoji)', () => {
  it('UiIcon exposes chevronUp and chevronDown', () => {
    expect(UI_ICON_NAMES).toContain('chevronUp');
    expect(UI_ICON_NAMES).toContain('chevronDown');
  });
});

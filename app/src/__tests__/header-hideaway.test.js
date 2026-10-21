// header-hideaway — the one-click header collapse preference.
// Locks the contract a regression would silently break: the toggle flips,
// persistence round-trips per device, only the exact '1' string reads as
// collapsed, the safe default is OPEN, and blocked storage degrades to a
// session-only toggle instead of throwing. Also guards that the chevron
// affordances ship as bundled SVG icons (never device emoji — consistency
// standard / UiIcon contract). Proven-to-catch (DR-0076): each assert fails
// if the behavior it guards is broken.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HEADER_COLLAPSED_KEY, nextCollapsed, readHeaderCollapsed, writeHeaderCollapsed, DEFAULT_HEADER_COLLAPSED,
} from '../lib/header-hideaway.js';
import { UI_ICON_NAMES } from '../components/UiIcon.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));

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
  it('defaults to TUCKED AWAY (true) with no saved preference — the Heritage first run (DR-1046)', () => {
    expect(readHeaderCollapsed(makeStore())).toBe(true);
    expect(DEFAULT_HEADER_COLLAPSED).toBe(true);
  });

  it('a surface may name what ABSENT means: the business doors open with the header shown, a saved choice still wins', () => {
    expect(readHeaderCollapsed(makeStore(), false)).toBe(false);
    const s = makeStore();
    s.setItem(HEADER_COLLAPSED_KEY, '1');
    expect(readHeaderCollapsed(s, false)).toBe(true);
    const props = readFileSync(join(HERE, '..', 'components', 'PropertiesDoor.jsx'), 'utf8');
    expect(props, 'PropertiesDoor opens with the header shown').toContain('readHeaderCollapsed(undefined, false)');
    // The TLC door (DR-1197): shown on a wide screen, TUCKED on a phone, so
    // the first phone screen is the reference's home and not a control row;
    // a saved choice still wins (the fallback only names what ABSENT means).
    const tlc = readFileSync(join(HERE, '..', 'components', 'TlcPublicDoor.jsx'), 'utf8');
    expect(tlc, 'TlcPublicDoor names its first-run default per screen width').toContain('readHeaderCollapsed(undefined, firstHeaderCollapsed(isPhoneWidth()))');
  });

  it('reads collapsed only for the exact "1" string', () => {
    const s = makeStore();
    s.setItem(HEADER_COLLAPSED_KEY, '1');
    expect(readHeaderCollapsed(s)).toBe(true);
  });

  it('treats "0" and garbage as OPEN — a saved choice is kept, an untrusted value opens', () => {
    const s = makeStore();
    s.setItem(HEADER_COLLAPSED_KEY, '0');
    expect(readHeaderCollapsed(s)).toBe(false);
    s.setItem(HEADER_COLLAPSED_KEY, 'yes');
    expect(readHeaderCollapsed(s)).toBe(false);
  });

  it('returns false (no throw) when storage throws — a device that cannot remember never hides the controls', () => {
    expect(readHeaderCollapsed(brokenStore())).toBe(false);
    expect(readHeaderCollapsed(null)).toBe(typeof localStorage !== 'undefined' ? readHeaderCollapsed(localStorage) : false);
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
    let collapsed = readHeaderCollapsed(s); // tucked away by default (DR-1046)
    expect(collapsed).toBe(true);
    collapsed = nextCollapsed(collapsed);
    writeHeaderCollapsed(collapsed, s);
    expect(readHeaderCollapsed(s)).toBe(false); // brought back — survives reload
    collapsed = nextCollapsed(collapsed);
    writeHeaderCollapsed(collapsed, s);
    expect(readHeaderCollapsed(s)).toBe(true); // tucked away again
  });
});

describe('chevron affordances are bundled SVG icons (no device emoji)', () => {
  it('UiIcon exposes chevronUp and chevronDown', () => {
    expect(UI_ICON_NAMES).toContain('chevronUp');
    expect(UI_ICON_NAMES).toContain('chevronDown');
  });
});

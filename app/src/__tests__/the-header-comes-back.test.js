// The header comes back (DR-0577).
//
// Darrell 2026-09-23, on his Fold with the header tucked away: "It's hard to
// get to the edges of the app anymore?!!!!!!!! What happened to the
// features?!!!!!!" and, minutes later, "Lost the whole header?!!!!!!!!!!!"
//
// Both were one defect. The Show-all control shipped the day before (#1734,
// DR-0565) wrapped TabScroll's scroll box in a `w-full` div. As a flex ITEM of
// the header's nav row that wrapper had min-width:auto -- the width of every
// nowrap tab laid end to end -- so at any width where the tabs did not fit,
// the row grew past the viewport and pushed the hideaway chevron (the one
// control that brings the header back) off the screen. Measured in Chromium
// at 1812px before the fix: nav row 1953px, chevron at x=1912.
//
// The layout itself is proven in the browser by scripts/chrome-layout-probe.mjs
// (the hideaway pass, invariants 12-14, with a self-test that breaks the
// wrapper and must trip). This file pins the SOURCE so the shape cannot drift
// back without the reason being read: the wrapper may shrink, the tucked-away
// row carries the way back in words, and both header mounts wire it.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SHARED = readFileSync(resolve(__dirname, '../components/shared.jsx'), 'utf8');
const HATCH = readFileSync(resolve(__dirname, '../components/TextSizeControl.jsx'), 'utf8');
const SHELL = readFileSync(resolve(__dirname, '../poe-financial-mvp-v28.jsx'), 'utf8');
const TLC = readFileSync(resolve(__dirname, '../components/TlcPublicDoor.jsx'), 'utf8');
const PROBE = readFileSync(resolve(__dirname, '../../../scripts/chrome-layout-probe.mjs'), 'utf8');

describe('the tab-row wrapper is allowed to shrink', () => {
  it('carries min-w-0 flex-1 beside w-full, in that order, on the wrapper that holds .tab-scroll', () => {
    const at = SHARED.indexOf('<div className="min-w-0 flex-1 w-full flex items-start gap-1">');
    expect(at).toBeGreaterThan(0);
    // The very next element is the scroll box — the wrapper is the one that
    // sits in the header's flex row.
    expect(SHARED.slice(at, at + 200)).toMatch(/className=\{`tab-scroll w-full/);
  });

  it('the pre-fix wrapper is gone', () => {
    expect(SHARED).not.toMatch(/<div className="w-full flex items-start gap-1">/);
  });

  it('says why, so nobody removes it for being redundant', () => {
    expect(SHARED).toMatch(/THE WRAPPER MUST BE ALLOWED TO SHRINK/);
    expect(SHARED).toMatch(/min-width was `auto`/);
  });
});

describe('the way back from the hideaway is in words, on the left', () => {
  it('the tucked-away row renders a Show header button when given the toggle', () => {
    // `inline` (DR-0640): on the one-tab door this row rides inside the top row.
    expect(HATCH).toMatch(/export function TextSizeEscapeHatch\(\{ collapsed, onShowHeader = null, siteName = '', siteTagline = '', inline = false \}\)/);
    expect(HATCH).toMatch(/data-testid="show-full-header"/);
    expect(HATCH).toMatch(/onClick=\{onShowHeader\}/);
    expect(HATCH).toMatch(/aria-label="Show the full header \(name, account, voice, font, theme controls\)"/);
  });

  it('sits on the LEFT (mr-auto), the side the tab row never pushes off', () => {
    // The way back and the brand lockup share ONE left-anchored group, so the
    // button stays on the left at every width (measured at 320 px, 2026-09-24:
    // as separate row items the button wrapped alone to the right).
    const g = HATCH.indexOf('data-testid="collapsed-left-group"');
    expect(g).toBeGreaterThan(-1);
    expect(HATCH.slice(g, g + 200)).toMatch(/className="mr-auto /);
    expect(HATCH.indexOf('data-testid="show-full-header"')).toBeGreaterThan(g);
  });

  it('both header mounts wire the toggle into it', () => {
    // The shell also names the door on the row (2026-09-23); the toggle wiring is unchanged.
    expect(SHELL).toMatch(/<TextSizeEscapeHatch collapsed=\{headerCollapsed\} onShowHeader=\{toggleHeaderChrome\} siteName=\{[^}]+\} siteTagline=\{[^}]+\} \/>/);
    expect(TLC).toMatch(/<TextSizeEscapeHatch collapsed=\{headerCollapsed\} onShowHeader=\{toggleHeaderChrome\} \/>/);
  });

  it('is a bundled icon, never a device emoji', () => {
    const block = HATCH.slice(HATCH.indexOf('data-testid="show-full-header"'), HATCH.indexOf('data-testid="show-full-header"') + 600);
    expect(block).toMatch(/<UiIcon name="chevronDown" \/>/);
  });
});

describe('the browser proves it, at every width, and can fail', () => {
  it('the layout probe has a hideaway pass with the three invariants', () => {
    expect(PROBE).toMatch(/THE WAY BACK FROM THE HIDEAWAY pass \(DR-0577\)/);
    expect(PROBE).toMatch(/the collapsed header runs past the screen/);
    expect(PROBE).toMatch(/the hideaway chevron is off-screen/);
    expect(PROBE).toMatch(/the tucked-away row has no "Show header" button/);
    expect(PROBE).toMatch(/offers no Show-all control/);
  });

  it('measures the Fold’s width among the others', () => {
    expect(PROBE).toMatch(/const HIDEAWAY_WIDTHS = SELFTEST \? \[1812\] : \[360, 768, 1440, 1812, 1920\];/);
  });

  it('the self-test breaks the WRAPPER, which is the pre-fix shape, and demands two trips', () => {
    expect(PROBE).toMatch(/header nav div:has\(> \.tab-scroll\) \{ min-width: 2600px !important \}/);
    expect(PROBE).toMatch(/hideawayTripped < 2/);
  });
});

describe('the one-tab door spends no row on a lone tab (DR-0640)', () => {
  // Darrell 2026-09-24: "Why does the Church tab space need that? Can we save
  // even more space if not... can we add another Love Corner etc tag in the
  // space?" and "Both places are good... why not".
  it('the probe has a one-tab pass with its invariants, quoting him', () => {
    expect(PROBE).toMatch(/THE ONE-TAB ROW CARRIES THE BRAND pass \(DR-0640\)/);
    expect(PROBE).toMatch(/Both places are\s*\/\/\s*good\.\.\. why not/);
    expect(PROBE).toMatch(/the top nav draws a lone tab row/);
    expect(PROBE).toMatch(/the brand is not in the top row, on screen/);
    expect(PROBE).toMatch(/two rows where one fits/);
    expect(PROBE).toMatch(/the bottom bar lost the brand/);
  });

  it('measures the door at 320, 390 and the Fold, and at the bottom-bar sizes', () => {
    expect(PROBE).toMatch(/\{ width: 320, size: 'normal' \}, \{ width: 390, size: 'normal' \}, \{ width: 1812, size: 'normal' \}, \{ width: 390, size: 'largest' \}, \{ width: 1812, size: 'bigprint' \}/);
    expect(PROBE).toMatch(/\/\?lovecorner=1&view=church/);
  });

  it('the self-test puts a lone tab strip back and hides the brand, and demands two trips', () => {
    expect(PROBE).toMatch(/strip\.innerHTML = '<button type="button">Church<\/button>'/);
    expect(PROBE).toMatch(/oneTabTripped < 2/);
  });
});

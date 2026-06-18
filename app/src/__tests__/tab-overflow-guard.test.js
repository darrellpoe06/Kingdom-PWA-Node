// @vitest-environment node
//
// Horizontal-overflow / white-void gate (DR-0076). Reported TWICE: the Projects
// sub-tab row overflowed a full-width <main> (#264) — Decisions / Review / Loops
// fell off the right with no scroll, and the un-clipped overflow exposed a white
// band beside the dark theme. This is the "should have been caught" gate. Logic
// in scripts/tab-overflow-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import {
  shellLines, shellsMissingClip, rendersTabButtons, providesHorizontalScroll,
  checkTabStrips, usesSharedTabScroll, checkTabStripPrimitive, scan,
} from '../../../scripts/tab-overflow-guard.mjs';

describe('the real app holds both invariants', () => {
  const result = scan();

  it('sees the themed shell(s) — not vacuously empty', () => {
    expect(result.shellLineCount).toBeGreaterThanOrEqual(1);
  });
  it('every themed app shell clips horizontal overflow (no white void)', () => {
    expect(result.shellViolations, result.shellViolations.join(' | ')).toEqual([]);
  });

  it('sees tab-strip surfaces — not vacuously empty', () => {
    expect(result.tabFileCount).toBeGreaterThan(1);
  });
  it('no tab strip overflows the page (every one scrolls or wraps)', () => {
    const msg = result.tabViolations.map(v => v.label).join(', ');
    expect(result.tabViolations, msg).toEqual([]);
  });
  it('every active-underline tab strip routes through the shared <TabScroll> primitive', () => {
    const msg = result.primitiveViolations.map(v => v.label).join(', ');
    expect(result.primitiveViolations, msg).toEqual([]);
  });
});

describe('invariant 1 — shell clip (proven-to-catch)', () => {
  it('CATCHES a themed shell with no overflow-x-clip (the white-void bug)', () => {
    const src = `<div data-theme={theme} className="min-h-screen bg-[#FAF8F4] text-[#1A1815]">x</div>`;
    expect(shellLines(src).length).toBe(1);
    expect(shellsMissingClip(src).length).toBe(1);
  });
  it('PASSES a themed shell that clips — not just always-failing', () => {
    const src = `<div data-theme={theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4]">x</div>`;
    expect(shellsMissingClip(src)).toEqual([]);
  });
});

describe('invariant 2 — tab strips scroll (proven-to-catch)', () => {
  // The exact shape of the 2026-06-18 regression: a bare flex row of tab buttons
  // with no scroll wrapper.
  const NAKED = [{ label: 'naked', src: `
    <div className="border-b border-[#E8E4DC]">
      <div className="flex gap-1 text-xs">
        {tabs.map(([id, label]) => (
          <button className={\`px-3 py-2 whitespace-nowrap border-b-2 \${active}\`}>{label}</button>
        ))}
      </div>
    </div>
  ` }];

  it('detects the tab-button signature', () => {
    expect(rendersTabButtons(NAKED[0].src)).toBe(true);
  });
  it('CATCHES the naked strip (no scroll / wrap)', () => {
    expect(checkTabStrips(NAKED).length).toBe(1);
  });
  it('PASSES once wrapped in <TabScroll>', () => {
    const fixed = [{ label: 'fixed', src: NAKED[0].src.replace(
      '<div className="border-b border-[#E8E4DC]">\n      <div className="flex gap-1 text-xs">',
      '<TabScroll className="border-b border-[#E8E4DC]">',
    ) }];
    expect(providesHorizontalScroll(fixed[0].src)).toBe(true);
    expect(checkTabStrips(fixed)).toEqual([]);
  });
  it('PASSES an overflow-x-auto wrapper (the header / Books / Church pattern)', () => {
    const ok = [{ label: 'ok', src: `
      <div className="w-full overflow-x-auto">
        <div className="flex gap-1 text-xs">
          {tabs.map(([id,label]) => <button className="whitespace-nowrap border-b-2">{label}</button>)}
        </div>
      </div>
    ` }];
    expect(checkTabStrips(ok)).toEqual([]);
  });
  it('PASSES a flex-wrap strip (Study / BooksEntities pattern)', () => {
    const ok = [{ label: 'wrap', src: `<div className="flex gap-1 flex-wrap text-xs">{tabs.map(t => <button className="whitespace-nowrap border-b-2">{t}</button>)}</div>` }];
    expect(checkTabStrips(ok)).toEqual([]);
  });
});

describe('invariant 3 — tab strips share the ONE primitive (proven-to-catch)', () => {
  // A bare overflow-x-auto underline strip SCROLLS (passes invariant 2) but does
  // NOT inherit the main nav's exact fluid feel — it drifted from the shared
  // primitive. The consistency gate must catch precisely this.
  const DRIFTED = [{ label: 'drift', src: `
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 text-xs">
        {tabs.map(([id,label]) => <button className="whitespace-nowrap border-b-2">{label}</button>)}
      </div>
    </div>
  ` }];

  it('the drifted strip still PASSES the reachability floor (invariant 2)', () => {
    expect(providesHorizontalScroll(DRIFTED[0].src)).toBe(true);
    expect(checkTabStrips(DRIFTED)).toEqual([]);
  });
  it('CATCHES it on the consistency standard (no shared <TabScroll>)', () => {
    expect(usesSharedTabScroll(DRIFTED[0].src)).toBe(false);
    expect(checkTabStripPrimitive(DRIFTED).length).toBe(1);
  });
  it('PASSES once routed through <TabScroll>', () => {
    const fixed = [{ label: 'fixed', src: `
      <TabScroll className="w-full">
        {tabs.map(([id,label]) => <button className="whitespace-nowrap border-b-2">{label}</button>)}
      </TabScroll>
    ` }];
    expect(usesSharedTabScroll(fixed[0].src)).toBe(true);
    expect(checkTabStripPrimitive(fixed)).toEqual([]);
  });
});

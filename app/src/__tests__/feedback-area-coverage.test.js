// @vitest-environment node
//
// Feedback-form coverage gate (DR-0076). The SME-review feedback form's
// "Which area?" list (FEEDBACK_AREAS) silently went stale twice — whole tabs
// (Inbound, Notes) and a pile of Church/Choir sub-tabs were missing, so a
// reviewer could not file feedback against them. This is the "should have been
// caught" gate: the nav is the source of truth for what surfaces exist, and a
// gated surface with no feedback area now FAILS the build. Logic in
// scripts/feedback-area-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import { scan, coverageGaps, pairIds, mappedArraySlice } from '../../../scripts/feedback-area-guard.mjs';

describe('pairIds / mappedArraySlice — the scraper reads nav arrays, not the world', () => {
  it('pulls the id from each [id, label] pair and ignores the outer bracket', () => {
    expect(pairIds("[['a','A'],['b','B']]")).toEqual(['a', 'b']);
    expect(pairIds("[\n  ['x', 'X'],\n  ['__sep__', null],\n]")).toEqual(['x', '__sep__']);
  });
  it('slices exactly the array feeding a .map(...) with the given body marker', () => {
    const src = `const z = [['one','1'],['two','2']].map(([id, label]) => go(id));`;
    expect(pairIds(mappedArraySlice(src, 'go(id)'))).toEqual(['one', 'two']);
  });
  it('sees through a chained .filter(([id]) => ...) between the array and .map()', () => {
    // The church door scopes the top-nav down with a `.filter` whose callback
    // destructures `([id])` — a stray `]` that must NOT fool the slicer into
    // grabbing the destructuring bracket instead of the array's own bracket.
    const src = `const z = [\n  ['one','1'],\n  ['two','2'],\n].filter(([id]) => keep || id === 'two')\n .map(([id, label]) => go(id));`;
    expect(pairIds(mappedArraySlice(src, 'go(id)'))).toEqual(['one', 'two']);
  });
});

describe('the real app — every gated nav surface is selectable in the feedback form', () => {
  const s = scan();

  it('the scanner actually SEES the nav (not vacuously empty)', () => {
    expect(s.topNav.length).toBeGreaterThan(5);
    // Choir holds the worship-team sub-tabs only; BG's sermon study moved to the
    // Pulpit Church sub-tab (2026-06-16), so Sermons is no longer a Choir tab.
    // 8 since the Song Workshop "Songs" sub-tab landed (2026-06-17); 9 since the
    // cross-referenced "Songbook" sub-tab landed (2026-06-24).
    expect(s.choirTabs.length).toBe(9);
    expect(s.keys.length).toBeGreaterThan(40);
    // The two tabs whose absence was the original bug must be scraped from nav.
    expect(s.topNav).toContain('inbound');
    expect(s.topNav).toContain('notes');
    // Church sub-tabs must include the landing + the known sub-views (incl. the
    // staff-gated Pulpit, which the scraper sees inside the conditional spread).
    for (const id of ['home', 'engagement', 'choir', 'learn', 'pulpit']) expect(s.churchSub).toContain(id);
  });

  it('has ZERO coverage gaps', () => {
    expect(s.gaps, s.gaps.join('; ')).toEqual([]);
  });
});

describe('proven-to-catch (anti-theater) — the gate is not vacuously green', () => {
  it('CATCHES a top-level tab with no feedback area (the Inbound/Notes bug)', () => {
    const gaps = coverageGaps({
      topNav: ['overview', 'inbound', '__sep__'],
      churchSub: [],
      choirTabs: [],
      keys: ['overview'], // 'inbound' deliberately missing
    });
    expect(gaps).toEqual(['top-level tab "inbound" has no feedback area']);
  });

  it('CATCHES a Church sub-tab and a Choir sub-tab with no feedback area', () => {
    const gaps = coverageGaps({
      topNav: [],
      churchSub: ['home', 'learn'],
      choirTabs: ['roster'],
      keys: ['church'], // has home(`church`) but not `church-learn` / `choir-roster`
    });
    expect(gaps).toContain('Church sub-tab "learn" has no feedback area (expected key "church-learn")');
    expect(gaps).toContain('Choir sub-tab "roster" has no feedback area (expected key "choir-roster")');
  });

  it('PASSES when every gated surface is covered (no false positives)', () => {
    const gaps = coverageGaps({
      topNav: ['books', '__sep__'],          // matched by the `books-*` prefix rule
      churchSub: ['home', 'engagement'],
      choirTabs: ['week'],
      keys: ['books-accounts', 'church', 'church-engagement', 'choir-week'],
    });
    expect(gaps).toEqual([]);
  });
});

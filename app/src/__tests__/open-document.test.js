// @vitest-environment node
// =============================================================================
// A tap that opens a file actually opens it (DR-1062)
// =============================================================================
// Darrell, 2026-10-16, on Choir → Team Docs: **"Can't open team documents!!!!!
// Fix it please..."**
//
// The defect was ORDER, not logic: window.open was called AFTER awaiting a
// signed url, so the user activation from his tap had already expired and the
// browser refused — every time, silently. Four surfaces carried that order.
//
// The cases below are weighted at the two things that can quietly come back:
// the reserve-before-await ORDER (a later "tidy-up" that moves it is the whole
// bug again), and the never-fail-silently promise.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reserveTab, deliverTo, openFailureMessage, openResolved } from '../lib/open-document.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(HERE, '..', p), 'utf8');

const fakeWin = (impl) => ({ open: impl });
const fakeTab = () => {
  const tab = { closed: false, href: '', opener: {} };
  tab.location = { replace: (u) => { tab.href = u; } };
  tab.close = () => { tab.closed = true; };
  return tab;
};

describe('reserveTab', () => {
  it('opens a blank tab and severs opener, which is what noopener would have done', () => {
    const tab = fakeTab();
    const win = fakeWin(vi.fn(() => tab));
    const got = reserveTab(win);
    expect(got).toBe(tab);
    expect(win.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBe(null);
  });

  it('a refused reservation is survivable, not a crash', () => {
    expect(reserveTab(fakeWin(() => null))).toBe(null);
    expect(reserveTab(fakeWin(() => { throw new Error('blocked'); }))).toBe(null);
    expect(reserveTab(null)).toBe(null);
    expect(reserveTab({})).toBe(null);
  });
});

describe('deliverTo', () => {
  it('sends the reserved tab to the url with replace, so no history entry is left', () => {
    const tab = fakeTab();
    expect(deliverTo(tab, 'https://example.test/doc.pdf')).toEqual({ ok: true, via: 'reserved-tab' });
    expect(tab.href).toBe('https://example.test/doc.pdf');
  });

  it('NO URL closes the reserved tab rather than leaving a blank window open', () => {
    const tab = fakeTab();
    const res = deliverTo(tab, null);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('no-url');
    expect(tab.closed).toBe(true);
  });

  it('a BLOCKED tab hands the url back, because a link the person taps carries its own gesture', () => {
    const res = deliverTo(null, 'https://example.test/doc.pdf');
    expect(res).toEqual({ ok: false, reason: 'blocked', url: 'https://example.test/doc.pdf' });
  });

  it('a tab that throws on navigation is reported as blocked, with the url kept', () => {
    const hostile = { location: { replace: () => { throw new Error('cross-origin'); } } };
    const res = deliverTo(hostile, 'https://example.test/doc.pdf');
    expect(res.reason).toBe('blocked');
    expect(res.url).toBe('https://example.test/doc.pdf');
  });
});

describe('openResolved', () => {
  it('a resolver that returns null is a failure WITH WORDS, never silence', async () => {
    const res = await openResolved(fakeTab(), async () => null);
    expect(res.ok).toBe(false);
    expect(openFailureMessage(res, { what: 'the order of service' })).toMatch(/could not be opened/i);
  });

  it('a resolver that THROWS is caught and reported, not left to the console', async () => {
    const res = await openResolved(fakeTab(), async () => { throw new Error('RLS'); });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('no-url');
  });

  it('every failure produces a sentence; a success produces none', () => {
    expect(openFailureMessage({ ok: true })).toBe('');
    expect(openFailureMessage({ ok: false, reason: 'blocked', url: 'u' })).toMatch(/link below/i);
    expect(openFailureMessage({ ok: false, reason: 'no-url' })).toMatch(/removed|access/i);
  });
});

describe('PROVEN-TO-CATCH: the order is the whole fix', () => {
  // This is the mutation that WAS the bug. If the reservation happens after the
  // await, the browser has no live gesture and refuses. Simulated by a window
  // whose open() only works while `gesture` is true — exactly the real rule.
  const gestureWindow = () => {
    const w = { gesture: true, open: (...a) => (w.gesture ? fakeTab() : null) };
    return w;
  };

  it('reserving FIRST opens; reserving after the await is refused', async () => {
    const win = gestureWindow();
    // The shipped order.
    const tab = reserveTab(win);
    win.gesture = false;                                  // the await ends the gesture
    const good = await openResolved(tab, async () => 'https://example.test/a.pdf');
    expect(good.ok).toBe(true);

    // The order that was shipped before this record.
    const win2 = gestureWindow();
    const url = await (async () => { win2.gesture = false; return 'https://example.test/a.pdf'; })();
    const late = deliverTo(reserveTab(win2), url);
    expect(late.ok, 'the old order somehow succeeded — the model of the bug is wrong').toBe(false);
    expect(late.url).toBe('https://example.test/a.pdf');   // ...and even then, a link survives
  });
});

describe('the shelves moved past the reserved tab (DR-1078)', () => {
  // DR-1062 fixed the lost gesture by reserving a tab before the await. DR-1078
  // (Darrell, 2026-10-16: "No one of the documents can be opened inside the
  // PoeTech App") took the next step: a document opens INSIDE the app, so there
  // is no tab to reserve and no gesture to lose. The pin that every shelf now
  // uses the in-app viewer lives in documents-open-inside-the-app.test.jsx;
  // this one only holds that no shelf drifted back to the broken order.
  const SURFACES = [
    'components/Choir.jsx',
    'components/Pulpit.jsx',
    'components/ChurchMemberSpace.jsx',
    'components/HouseholdSpace.jsx',
  ];

  it.each(SURFACES)('%s never opens a tab after an await', (p) => {
    const text = src(p);
    expect(/await\s+(?:open|signed)[A-Za-z]*Document[^;]*;\s*(?:if\s*\([^)]*\)\s*)?\{?\s*(?:try\s*\{\s*)?window\.open\(/.test(text),
      `${p} still opens a tab after an await`).toBe(false);
    expect(text).toContain('useDocumentViewer()');
  });

  it('ColoringSheet, which always did it right, is unchanged', () => {
    expect(src('components/ColoringSheet.jsx')).toContain("window.open('', '_blank')");
  });
});

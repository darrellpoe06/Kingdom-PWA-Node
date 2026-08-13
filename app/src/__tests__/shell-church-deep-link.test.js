// =============================================================================
// The SHELL routes a shared lesson link to the lesson — not to the live stream
// =============================================================================
// Darrell 2026-08-13, opening a link this app produced:
//   "Sucks... doesnt even take the user to the actual lessons.... Only to the
//    live stream tab with the player open for nothing!!!!!!! Is this tested
//    before?"
//
// It was not. And the reason it was not is the whole lesson of this file.
//
// Every share link the app builds is `?view=church&sub=learn&course=…&lesson=…`.
// ChurchLearn's deep-link reader was correct, and learn-deep-link.test.jsx
// proved it — by MOUNTING ChurchLearn directly. But the shell decides whether
// ChurchLearn mounts at all, and its getInitialChurchView read only `?view=`.
// With view=church (not a sub-tab NAME) it fell to 'home' — the Worship tab,
// live player over nothing. The component under test was never the surface the
// user actually meets (LESSONS P16), so a green suite sat on top of a link that
// went nowhere.
//
// So this file tests the ROUTING DECISION, on the exact URL lessonQuery emits,
// and pins the shell to the one parser. Proven-to-catch: restore the old
// `view`-only body in getInitialChurchView and the delegation test below fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialChurchView, VALID_CHURCH_SUBS, parseNav, navKey } from '../lib/nav-history.js';
import { lessonQuery } from '../lib/lesson-links.js';

const SHELL = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

describe('a shared lesson link boots the Learn tab', () => {
  it('the exact URL lessonQuery emits resolves to learn, not home', () => {
    const q = lessonQuery({ courseKey: 'world-issues', lessonId: 'wi-law-of-assumption' });
    // The link really is the shape that was breaking — asserted, not assumed.
    expect(q).toContain('view=church');
    expect(q).toContain('sub=learn');
    expect(initialChurchView(q)).toBe('learn');
  });

  it('THE BUG, held still: reading `view` alone lands on the Worship tab', () => {
    const q = lessonQuery({ courseKey: 'healthy-living', lessonId: 'hl-sleep' });
    // This is verbatim what the shell used to do. It is kept here as the
    // regression witness: it must keep producing the WRONG answer, so the test
    // above is demonstrably measuring the fix and not a tautology.
    const oldWay = new URLSearchParams(q).get('view');
    expect(oldWay).toBe('church');
    expect(VALID_CHURCH_SUBS.includes(oldWay)).toBe(false); // -> fell through to 'home'
    expect(initialChurchView(q)).toBe('learn');
  });

  it('a whole-course link opens Learn too', () => {
    expect(initialChurchView(lessonQuery({ courseKey: 'healthy-living' }))).toBe('learn');
  });

  it('the course + lesson params survive the boot parse', () => {
    const q = lessonQuery({ courseKey: 'made-in-time', lessonId: 'mit-01' });
    const sp = new URLSearchParams(q);
    expect(sp.get('course')).toBe('made-in-time');
    expect(sp.get('lesson')).toBe('mit-01');
    // parseNav must not choke on the extra params it does not own.
    expect(parseNav(q)).toMatchObject({ view: 'church', churchView: 'learn' });
  });
});

// The second half of the same failure, and the reason it needs no separate fix.
//
// useBrowserHistoryNav seeds one history entry on mount. It keeps the URL it was
// given only when `navKey(parseNav(search)) === navKey(booted)`; otherwise it
// replaces it with urlFor(), which writes view/sub plus the door params and
// NOTHING ELSE — so `course` and `lesson` were stripped from the address bar on
// arrival. That was not a second bug. It was this bug's shadow: the two sides of
// that comparison were the two disagreeing readers. Now that boot resolves
// through parseNav, they agree by construction and the URL is left alone.
//
// Asserted rather than argued, because "it follows from the fix" is exactly the
// kind of claim this repo does not accept on the agent's word (DR-0076).
describe('the seed leaves a deep-link URL alone', () => {
  const bootedFrom = (search) => ({
    view: 'church',
    churchView: initialChurchView(search),
    booksView: 'calendar',
  });

  it('the seed’s own sameUrl comparison holds for a lesson link', () => {
    const q = lessonQuery({ courseKey: 'healthy-living', lessonId: 'hl-sleep' });
    // This IS the expression at nav-history.js's seed effect.
    expect(navKey(parseNav(q))).toBe(navKey(bootedFrom(q)));
  });

  it('and for a whole-course link, and every church sub', () => {
    const course = lessonQuery({ courseKey: 'world-issues' });
    expect(navKey(parseNav(course))).toBe(navKey(bootedFrom(course)));
    for (const sub of VALID_CHURCH_SUBS) {
      const s = `?view=church&sub=${sub}`;
      expect(navKey(parseNav(s)), `seed would rewrite ?sub=${sub}`).toBe(navKey(bootedFrom(s)));
    }
  });

  it('the disagreement that caused the strip is gone', () => {
    // Before: booted 'home' (view-only read) vs parsed 'learn' -> mismatch ->
    // replaceState(urlFor(...)) -> course/lesson dropped. Held here as the
    // witness, so this test measures the fix rather than restating it.
    const q = lessonQuery({ courseKey: 'made-in-time', lessonId: 'mit-01' });
    const oldBooted = { view: 'church', churchView: 'home', booksView: 'calendar' };
    expect(navKey(parseNav(q))).not.toBe(navKey(oldBooted)); // the old mismatch
    expect(navKey(parseNav(q))).toBe(navKey(bootedFrom(q))); // the fix
  });
});

describe('the shell owns no second copy of this decision', () => {
  const body = (SHELL.match(/function getInitialChurchView\(\)[\s\S]*?\n}/) || [''])[0];

  it('getInitialChurchView delegates to lib/nav-history', () => {
    expect(body).toContain('initialChurchView(window.location.search)');
  });

  it('and does NOT re-implement the sub-tab list', () => {
    // The old body carried its own array of names and read only `view`. Either
    // one coming back is the bug coming back.
    expect(body).not.toMatch(/'engagement'\s*,/);
    expect(body).not.toMatch(/sp\.get\('view'\)/);
  });

  it('imports the shared resolver', () => {
    expect(SHELL).toMatch(/import \{[^}]*initialChurchView[^}]*\} from '\.\/lib\/nav-history\.js'/);
  });
});

describe('every Church sub-tab the shell renders is deep-linkable', () => {
  // Derived from the shell's own render branches (DR-0121), so the two lists
  // cannot drift into a link that resolves to a branch that renders nothing —
  // the "blank tab" class this codebase keeps closing.
  const rendered = [...new Set(
    [...SHELL.matchAll(/churchView === '([a-z0-9-]+)'/g)].map((m) => m[1]),
  )];

  it('found the real branches to check against', () => {
    expect(rendered.length).toBeGreaterThan(8);
    expect(rendered).toContain('learn');
    expect(rendered).toContain('home');
  });

  it('each one is in VALID_CHURCH_SUBS and round-trips through the URL', () => {
    for (const sub of rendered) {
      expect(VALID_CHURCH_SUBS, `?sub=${sub} renders a branch but is not routable`).toContain(sub);
      expect(initialChurchView(`?view=church&sub=${sub}`)).toBe(sub);
    }
  });

  it('an unknown sub falls back to home rather than a dead branch', () => {
    expect(initialChurchView('?view=church&sub=not-a-tab')).toBe('home');
    expect(initialChurchView('?view=church')).toBe('home');
    expect(initialChurchView('')).toBe('home');
  });

  it('the pre-history-nav aliases every shared link already used still work', () => {
    for (const legacy of ['learn', 'engagement', 'choir', 'pulpit', 'events', 'scripture', 'bus', 'harvest', 'conference', 'program']) {
      expect(initialChurchView(`?view=${legacy}`), `?view=${legacy} is a link already in the wild`).toBe(legacy);
    }
  });
});

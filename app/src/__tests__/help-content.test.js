// @vitest-environment node
//
// help-content — the contextual-help + user-roadmap registry (lib/help-content.js).
//
// These tests are the "no empty help" GATE (DR-0076, Verification Doctrine):
// every tab/tool the app actually ships MUST carry real help, the help must be
// genuinely written (no empty/TODO placeholders), the context resolver must map
// the live view to the right entry, and every roadmap step must point at a view
// that exists. If someone adds a tab and forgets its help, or a step points
// nowhere, the build fails here — so "self-explaining" is a machine-checked
// promise, not a hope.
import { describe, it, expect } from 'vitest';
import {
  HELP, HELP_KEYS, ROADMAP, SECTION_TITLE,
  helpFor, helpKeyFor, ariHelpLead, HELP_VOICE_NAME,
} from '../lib/help-content.js';
import { ARI } from '../lib/ari.js';

// The REAL nav, mirrored from poe-financial-mvp-v28.jsx so this test breaks the
// build if a shipped surface is added without help. Keep in sync with the nav.
const TOP_LEVEL_VIEWS = [
  'overview', 'books', 'inbound', 'rentals', 'projects', 'practice',
  'opportunities', 'about', 'notes', 'create', 'voice', 'library', 'recipes',
  'study', 'church', 'markets', 'center', 'crm', 'relationships', 'inventory', 'forecast', 'admin',
];
const CHURCH_SUBS = [
  'home', 'engagement', 'choir', 'program', 'learn', 'conference', 'events',
  'pulpit', 'scripture', 'harvest', 'videowall', 'observe',
];
const BOOKS_SUBS = [
  'entities', 'accounts', 'debts', 'transactions', 'imported', 'cart',
  'k1099', 'calendar', 'legal',
];

const PLACEHOLDER = /\b(todo|tbd|fixme|lorem ipsum|coming soon|placeholder|xxx)\b/i;
const ROADMAP_KEYS = ROADMAP.map((s) => s.key);

describe('every shipped tab/tool has help', () => {
  it.each(TOP_LEVEL_VIEWS)('top-level view "%s" has a help entry', (view) => {
    expect(HELP[view], `missing help for view "${view}"`).toBeTruthy();
  });
  it.each(CHURCH_SUBS)('church sub-tab "%s" has a help entry', (sub) => {
    expect(HELP[`church:${sub}`], `missing help for church:${sub}`).toBeTruthy();
  });
  it.each(BOOKS_SUBS)('books sub-tab "%s" has a help entry', (sub) => {
    expect(HELP[`books:${sub}`], `missing help for books:${sub}`).toBeTruthy();
  });
});

describe('help content is real, not a stub', () => {
  it.each(HELP_KEYS)('entry "%s" is fully and genuinely written', (key) => {
    const e = HELP[key];
    // title + tag
    expect(typeof e.title).toBe('string');
    expect(e.title.length).toBeGreaterThan(1);
    expect(typeof e.tag).toBe('string');
    expect(e.tag.length).toBeGreaterThan(8);
    // WHAT — a couple of real sentences
    expect(typeof e.what).toBe('string');
    expect(e.what.length).toBeGreaterThan(60);
    // HOW — at least two concrete steps, each a real instruction
    expect(Array.isArray(e.how)).toBe(true);
    expect(e.how.length).toBeGreaterThanOrEqual(2);
    e.how.forEach((step) => {
      expect(typeof step).toBe('string');
      expect(step.length).toBeGreaterThan(10);
    });
    // WHY — the payoff
    expect(typeof e.why).toBe('string');
    expect(e.why.length).toBeGreaterThan(20);
    // belongs to a real roadmap section
    expect(ROADMAP_KEYS).toContain(e.section);
    // no placeholder text anywhere in the entry
    const blob = [e.title, e.tag, e.what, e.why, e.when || '', e.more || '', ...e.how].join(' ');
    expect(PLACEHOLDER.test(blob), `placeholder text in "${key}"`).toBe(false);
  });
});

describe('the context resolver maps the live view to the right help', () => {
  it('resolves a church sub-tab to its church:<sub> entry', () => {
    expect(helpKeyFor({ view: 'church', churchView: 'choir' })).toBe('church:choir');
    expect(helpFor({ view: 'church', churchView: 'choir' }).title).toBe('Choir');
  });
  it('resolves the church home sub-view', () => {
    expect(helpKeyFor({ view: 'church', churchView: 'home' })).toBe('church:home');
  });
  it('falls back to the church entry when a sub has no specific help', () => {
    expect(helpKeyFor({ view: 'church', churchView: 'made-up-sub' })).toBe('church');
  });
  it('resolves a books sub-tab to its books:<sub> entry', () => {
    expect(helpKeyFor({ view: 'books', booksView: 'transactions' })).toBe('books:transactions');
  });
  it('falls back to the books entry for an unknown books sub', () => {
    expect(helpKeyFor({ view: 'books', booksView: 'made-up' })).toBe('books');
  });
  it('resolves a plain top-level view', () => {
    expect(helpKeyFor({ view: 'forecast' })).toBe('forecast');
    expect(helpFor({ view: 'forecast' }).title).toBe('Forecast');
  });
  it('returns null for a view with no help (no fabricated entry)', () => {
    expect(helpKeyFor({ view: 'does-not-exist' })).toBeNull();
    expect(helpFor({ view: 'does-not-exist' })).toBeNull();
  });
  it('accepts a bare key string too', () => {
    expect(helpFor('forecast')).toBe(HELP.forecast);
    expect(helpFor('nope')).toBeNull();
    expect(helpFor(null)).toBeNull();
  });
});

describe('the user roadmap is whole and points only at real surfaces', () => {
  it('has sections, each with a blurb and steps', () => {
    expect(ROADMAP.length).toBeGreaterThanOrEqual(4);
    ROADMAP.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(2);
      expect(s.blurb.length).toBeGreaterThan(30);
      expect(s.steps.length).toBeGreaterThanOrEqual(2);
    });
  });
  it('every step points at a view that exists, with a reason', () => {
    ROADMAP.forEach((s) => {
      s.steps.forEach((step) => {
        expect(step.label.length).toBeGreaterThan(1);
        expect(step.why.length).toBeGreaterThan(10);
        expect(step.to && typeof step.to.view).toBe('string');
        // the destination view must be a known top-level view
        expect(TOP_LEVEL_VIEWS).toContain(step.to.view);
        // a church/books step must name a real sub-tab
        if (step.to.churchView) expect(CHURCH_SUBS).toContain(step.to.churchView);
        if (step.to.booksView) expect(BOOKS_SUBS).toContain(step.to.booksView);
      });
    });
  });
  it('SECTION_TITLE covers every section key', () => {
    ROADMAP.forEach((s) => expect(SECTION_TITLE[s.key]).toBe(s.title));
  });
});

describe('help speaks as Ari, the one A.I. identity', () => {
  it('attributes help to Ari', () => {
    expect(HELP_VOICE_NAME).toBe(ARI.name);
    expect(ariHelpLead()).toContain(ARI.name);
  });
});

describe('typographic theology holds across all help (binding rule)', () => {
  // The adversary is never honored with a capital. Faith-area help must not
  // slip a capitalized adversary name through (CLAUDE.md, Typographic Theology).
  it('never capitalizes the adversary anywhere in help or roadmap', () => {
    const allText = [
      ...HELP_KEYS.flatMap((k) => {
        const e = HELP[k];
        return [e.title, e.tag, e.what, e.why, e.when || '', e.more || '', ...e.how];
      }),
      ...ROADMAP.flatMap((s) => [s.title, s.blurb, ...s.steps.flatMap((st) => [st.label, st.why])]),
    ].join(' \n ');
    expect(/\b(Satan|Lucifer)\b/.test(allText)).toBe(false);
    expect(/\bThe Devil\b/.test(allText)).toBe(false);
  });
});

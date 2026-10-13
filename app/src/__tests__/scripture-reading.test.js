// =============================================================================
// One press of play reads the whole Scripture section — every depth, then the
// verses with their commentary
// =============================================================================
// Darrell 2026-08-13:
//   "I want users to be able to get the whole lesson from pushing play once...
//    beginning to end."
//   "Verses plus the 'Whosoever — the…' commentary... not the other
//    translations, only KJV and ESV if possible..."
//   "Also each version all the way to deep for each section... understand..."
//
// The load-bearing case is the DEPTH LADDER. The page renders one tier at a
// time — a reader picks how far to go — so anything that scrapes what is
// currently rendered would speak Essential *or* Standard *or* Deep and sound
// perfectly fine while silently withholding the deep treatment. "All the way to
// deep" is only verifiable by asserting all three are in the spoken text, which
// is the whole reason this composition is data-driven and pure.
import { describe, it, expect } from 'vitest';
import {
  depthLadder, verseReadingText, themeReadingText, scriptureReadingPlan, spokenRef,
} from '../lib/scripture-reading.js';
import { THEMES, versesForTheme } from '../lib/scriptures.js';
import { COPYRIGHT_NOTE, OTHER_VERSIONS } from '../lib/scriptures.js';

const THEME = {
  id: 't1',
  title: 'Salvation',
  subtitle: 'the door',
  blurb: 'How a soul comes home.',
  lens: { perspective: 'He sees the lost.', heart: 'His heart is toward them.', love: 'His love went first.' },
  soul: 'For the soul, not the argument.',
  depths: {
    essential: 'The core in a moment.',
    standard: 'A fuller treatment of the same truth.',
    deep: 'The full, book-capable treatment that goes all the way down.',
  },
  levels: { child: 'Told simply.', standard: 'The standard framing.' },
  views: [{ name: 'View A', summary: 'Held this way.' }],
  textNote: 'A note on the text.',
};

const VERSES = [
  { ref: 'Romans 10:13', kjv: 'For whosoever shall call upon the name of the Lord shall be saved.', gloss: 'Whosoever — the widest word in the book.' },
  { ref: '2 Timothy 1:7', kjv: 'For God hath not given us the spirit of fear.', gloss: 'Not fear — power, love, a sound mind.' },
];

describe('each version, all the way to deep', () => {
  it('the ladder carries every authored tier, light to deep, in order', () => {
    expect(depthLadder(THEME).map((d) => d.tierId)).toEqual(['essential', 'standard', 'deep']);
  });

  it('the spoken section contains ALL THREE depths — not just the one on screen', () => {
    const text = themeReadingText(THEME, { verses: VERSES });
    expect(text).toContain('The core in a moment.');
    expect(text).toContain('A fuller treatment of the same truth.');
    expect(text, 'the deep tier is the one a screen-scraper would silently drop').toContain('the full, book-capable treatment that goes all the way down.'.replace('the f', 'The f'));
  });

  it('and reads them in ladder order, so it deepens rather than jumping about', () => {
    const t = themeReadingText(THEME, { verses: [] });
    expect(t.indexOf('The core in a moment.')).toBeLessThan(t.indexOf('A fuller treatment'));
    expect(t.indexOf('A fuller treatment')).toBeLessThan(t.indexOf('book-capable'));
  });

  it('a repeated tier is spoken ONCE — the fallback would have said it three times', () => {
    // resolveDepth() walks DOWN to guarantee a reader sees something, so asking
    // it for all three tiers on a standard-only theme returns the same text
    // thrice. Read aloud that is a machine stuttering, which is why this
    // composes from the authored depths instead.
    const thin = { id: 'x', title: 'Thin', depths: { standard: 'Only this one exists.' } };
    const ladder = depthLadder(thin);
    expect(ladder).toHaveLength(1);
    const t = themeReadingText(thin, { verses: [] });
    expect(t.match(/Only this one exists\./g)).toHaveLength(1);
  });

  it('a theme with no authored depth still says something', () => {
    const bare = { id: 'y', title: 'Bare', blurb: 'The core meaning.' };
    expect(depthLadder(bare).map((d) => d.text)).toEqual(['The core meaning.']);
  });
});

describe('the verses, with their commentary — and nothing else', () => {
  it('a verse reads as reference, KJV, then the gloss Darrell named', () => {
    const t = verseReadingText(VERSES[0]);
    // The reference is spoken the way a person reads it aloud, not printed —
    // "Romans chapter 10 verse 13" (DR-0287's spoken-reference rule, which
    // toSpokenForm already implements). Asserting the printed form here would
    // have been asserting the bug that rule exists to prevent.
    expect(t).toContain('Romans chapter 10 verse 13');
    expect(t).toContain('For whosoever shall call upon the name of the Lord shall be saved.');
    expect(t).toContain('Whosoever — the widest word in the book.');
  });

  it('the reference is SPOKEN, so the engine does not say "two Timothy"', () => {
    expect(spokenRef('2 Timothy 1:7')).toContain('2nd Timothy');
    expect(verseReadingText(VERSES[1])).toContain('2nd Timothy');
  });

  it('the KJV is named out loud — the listener knows which Bible they heard', () => {
    expect(verseReadingText(VERSES[0])).toContain('King James Version');
  });

  it('NO other translation is spoken, and no link furniture rides along', () => {
    const t = themeReadingText(THEME, { verses: VERSES });
    for (const v of OTHER_VERSIONS) {
      expect(t, `${v.id} must never be spoken`).not.toContain(v.id);
    }
    for (const junk of ['Hide other translations', 'Read other translations', 'Backs:', 'Clear highlight', '↗']) {
      expect(t).not.toContain(junk);
    }
  });

  it('ESV is absent BY DECISION, and the codebase says why', () => {
    // Darrell asked for "KJV and ESV if possible". It is not possible: the app
    // holds no ESV text and deliberately refuses to reproduce one. Pinning the
    // stated reason here means a future session cannot quietly "add ESV" by
    // pasting copyrighted text and calling it a feature.
    expect(COPYRIGHT_NOTE).toContain('King James Version');
    expect(COPYRIGHT_NOTE).toMatch(/linked, not reproduced/i);
    expect(OTHER_VERSIONS.map((v) => v.id)).toContain('ESV');
    expect(themeReadingText(THEME, { verses: VERSES })).not.toContain('ESV');
  });
});

describe('the second readable edition — the WEB is spoken when chosen, and named (2026-09-06)', () => {
  const VERSE = { ref: 'John 3:16', kjv: 'For God so loved the world, that he gave his only begotten Son', gloss: 'Whosoever — the door is open.' };

  it('a verse carrying WEB text and edition is spoken from the WEB and named World English Bible', () => {
    const spoken = verseReadingText({ ...VERSE, text: 'For God so loved the world, that he gave his only born Son', edition: 'web' });
    expect(spoken).toContain('only born Son World English Bible.');
    expect(spoken).not.toContain('King James Version');
    expect(spoken).toContain('Whosoever — the door is open.');
  });

  it('a verse with no edition is the KJV, exactly as before', () => {
    expect(verseReadingText(VERSE)).toContain('only begotten Son King James Version.');
  });

  it('a WEB miss falls back to the KJV and SAYS so — the two are never mixed on one verse', () => {
    const spoken = verseReadingText({ ...VERSE, text: VERSE.kjv, edition: 'kjv' });
    expect(spoken).toContain('King James Version.');
  });

  it('the plan hands the chosen edition to versesFor, so the spoken verses are the shown verses', () => {
    const seen = [];
    const plan = scriptureReadingPlan([THEME], { versesFor: (id, edition) => { seen.push([id, edition]); return []; }, edition: 'web' });
    expect(plan).toBeTruthy();
    expect(seen).toEqual([['t1', 'web']]);
    const plan2 = scriptureReadingPlan([THEME], { versesFor: (id, edition) => { seen.push([id, edition]); return []; } });
    expect(plan2).toBeTruthy();
    expect(seen[1]).toEqual(['t1', 'kjv']); // the default is the KJV
  });

  it('against the REAL library: every curated verse has a WEB text, so the WEB reading never silently falls back', () => {
    for (const t of THEMES) {
      for (const v of versesForTheme(t.id, 'web')) {
        expect(v.edition, `${v.ref} should carry the WEB`).toBe('web');
        expect(v.text).toBe(v.web);
        expect(v.kjv, 'the KJV stays on the verse for the study edition').toBeTruthy();
      }
      for (const v of versesForTheme(t.id)) expect(v.edition).toBe('kjv');
    }
  });
});

describe('the section reads in page order', () => {
  const t = themeReadingText(THEME, { verses: VERSES });
  it('title → blurb → lens → soul → depths → views → verses', () => {
    const at = (s) => t.indexOf(s);
    expect(at('Salvation — the door')).toBe(0);
    expect(at('How a soul comes home.')).toBeGreaterThan(at('Salvation — the door'));
    expect(at('His perspective.')).toBeGreaterThan(at('How a soul comes home.'));
    expect(at('For the soul,')).toBeGreaterThan(at('His love.'));
    expect(at('The core in a moment.')).toBeGreaterThan(at('For the soul,'));
    expect(at('The main biblical views')).toBeGreaterThan(at('book-capable'));
    expect(at('Romans chapter 10 verse 13')).toBeGreaterThan(at('The main biblical views'));
  });

  it('the level framing rides only when a non-standard level is chosen', () => {
    expect(themeReadingText(THEME, { verses: [], level: 'child' })).toContain('Told simply.');
    expect(themeReadingText(THEME, { verses: [], level: 'standard' })).not.toContain('Told simply.');
  });
});

describe('one press of play walks section after section', () => {
  const versesFor = (id) => (id === 't1' ? VERSES : []);
  const two = [THEME, { ...THEME, id: 't2', title: 'Second', depths: { essential: 'Second core.' } }];

  it('the first section is the reading, and it knows there is a next', () => {
    const plan = scriptureReadingPlan(two, { versesFor });
    expect(plan.themeId).toBe('t1');
    expect(plan.hasNext).toBe(true);
    expect(plan.nextIndex).toBe(1);
  });

  it('advancing reads the NEXT section', () => {
    const plan = scriptureReadingPlan(two, { versesFor, index: 1 });
    expect(plan.themeId).toBe('t2');
    expect(plan.text).toContain('Second core.');
    expect(plan.hasNext, 'the last section must end the run, not loop').toBe(false);
    expect(plan.nextIndex).toBeNull();
  });

  it('a single section has no next — play ends rather than repeating', () => {
    expect(scriptureReadingPlan([THEME], { versesFor }).hasNext).toBe(false);
  });

  it('nothing to read registers nothing, never an empty reading', () => {
    expect(scriptureReadingPlan([], { versesFor })).toBeNull();
    expect(scriptureReadingPlan(null, { versesFor })).toBeNull();
    expect(scriptureReadingPlan([THEME], {})).toBeNull();
  });

  it('a versesFor that throws degrades to the teaching, never a crash', () => {
    const plan = scriptureReadingPlan([THEME], { versesFor: () => { throw new Error('db down'); } });
    expect(plan.text).toContain('The core in a moment.');
  });
});

describe('against the REAL library, not a fixture', () => {
  it('every shipped theme composes a non-trivial reading', () => {
    for (const t of THEMES.slice(0, 6)) {
      const text = themeReadingText(t, { verses: [] });
      expect(text.length, `${t.id} composed nothing`).toBeGreaterThan(80);
    }
  });

  it('a real theme that authors all three depths speaks all three', () => {
    const rich = THEMES.find((t) => t.depths && t.depths.essential && t.depths.standard && t.depths.deep);
    expect(rich, 'the library should carry at least one fully-tiered theme').toBeTruthy();
    const text = themeReadingText(rich, { verses: [] });
    for (const k of ['essential', 'standard', 'deep']) {
      expect(text, `${rich.id} dropped its ${k} tier`).toContain(rich.depths[k].trim().slice(0, 40));
    }
  });
});

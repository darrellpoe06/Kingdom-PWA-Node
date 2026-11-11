// =============================================================================
// sovereign-ai-sov73-verses — the gate for sov73, "A credential you cannot
// check is not a credential"
// =============================================================================
// WHO TAUGHT THIS: NOBODY. Gmail thread `1a168bfea63e45ea`, a Healthline
// Wellness Wire issue written for Health Literacy Month, forwarded out of
// Darrell's university mailbox on 2026-10-23 at 12:32 UTC with ONE WORD typed
// above the forwarded header: `Lesson`. That word is the whole brief. Eight
// minutes earlier the same mailbox sent the item that became sov72.
//
// THE SEAM WAS CHOSEN BY MEASUREMENT, NOT BY TASTE (DR-0610 / DR-1185). The
// letter offers four tests. TWO OF THEM THIS COURSE HAS ALREADY TAUGHT and
// they are deliberately NOT repeated here: cross-examining whoever profits
// from the cure lands on sov15, and testing what arrives lands on sov44. What
// is left is the one test the letter NAMES AND CANNOT FINISH — confirm the
// credentials — because its own fourth paragraph warns that AI-generated
// videos of fabricated doctors are commonplace, while its guidance tells the
// reader to look the person up. Verify the authority; the authority can be
// manufactured. The letter never reconciles those two sentences, and that gap
// is the lesson.
//
// THE LETTER IS NOT A STRAW MAN. Its good work is named in every band before
// anything is said against it, because manufacturing a disagreement in order
// to have something to preach against is its own dishonesty (DR-0098 / DR-0100).
// Its closing instruction — speak with a professional before changing anything
// — is REPEATED rather than softened.
//
// ITS HEALTH CLAIMS ARE NEITHER VERIFIED NOR REPEATED. No primary source was
// opened: the underlying data is not on this machine, and DR-0076 forbids
// asserting what has not been verified. The lesson therefore asserts none of
// the letter's medical content and says so in its own limits.
//
// THE CORRECTION IS LOAD-BEARING, AND IT IS GATED. A week on discernment that
// ends in suspicion has taught its own opposite, so Proverbs 11:14 (counsel is
// COMMANDED, the safety is a multitude of counsellors) and Job 12:11 (the ear
// TRIES the words rather than refusing to hear them) are required in EVERY
// band below. That is the check most worth having here.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456,
// relearned on ll300 when a retyped Proverbs 21:1 carried an ASCII apostrophe
// where the corpus carries U+2019). The sweep below re-derives that from disk
// instead of trusting the generator, and is proven able to fail.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov73-a-credential-you-cannot-check-is-not-a-credential';
const THREAD = '1a168bfea63e45ea';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

const allStrings = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => allStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => allStrings(v, out));
  return out;
};

// --- the KJV corpus on disk --------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();
const bookOf = (b) => {
  const f = b.replace(/\s+/g, '');
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  return bookCache.get(f);
};
/** Every chapter of every book this lesson touches, verses joined by one space,
 *  so a CONTIGUOUS range is a substring while a reordered or cross-chapter span
 *  is not. */
const CHAPTERS = [
  'Genesis',
  'Job',
  'Proverbs',
  'Matthew',
  'Acts',
  '1 Corinthians',
  '2 Corinthians',
  'Ephesians',
  '1 Thessalonians',
  '1 John',
  '3 John',
].flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov73 exists and is whole', () => {
  it('the module is in the course with all four bands', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it names the thread it was built from, so the repo is a second witness (DR-0076 §8)', () => {
    expect(M.bigIdea).toContain(THREAD);
  });

  it('it says plainly that nobody taught it', () => {
    expect(M.bigIdea).toMatch(/WHO TAUGHT THIS: NOBODY/);
    expect(M.lesson).toMatch(/WHO TAUGHT THIS: NOBODY/);
  });
});

describe('every quoted span is verbatim the KJV on disk', () => {
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(/"([^"]+)"/g)].map((m) => [band, m[1]]));

  it('the sweep looks at a real number of spans, so it cannot pass by checking nothing', () => {
    // ll300's first sweep read the wrong field, examined NOTHING, and printed
    // "0 mismatches". A check that cannot fail is a lie (DR-0076 §3).
    expect(spans().length).toBeGreaterThan(40);
  });

  it('each span is a contiguous span of its own chapter', () => {
    const bad = spans().filter(([, s]) => !CHAPTERS.some((c) => c.includes(s)));
    expect(bad.map(([b, s]) => `${b}: ${s.slice(0, 70)}`)).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, first] = spans()[0];
    const broken = first.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(first);
    expect(CHAPTERS.some((c) => c.includes(broken))).toBe(false);
  });

  it('PROVEN TO CATCH: the DR-0456 apostrophe class — an ASCII apostrophe where the corpus has U+2019', () => {
    const withCurly = spans().filter(([, s]) => s.includes('’'));
    expect(withCurly.length, 'the lesson must quote at least one verse carrying U+2019').toBeGreaterThan(0);
    const retyped = withCurly[0][1].replace(/’/g, "'");
    expect(CHAPTERS.some((c) => c.includes(retyped))).toBe(false);
  });
});

describe('the four bands clear the gate, measured not claimed', () => {
  it('shares, ladder, child ceiling and differentiation all pass', () => {
    expect(fourBandFaults(M)).toEqual([]);
  });

  it('the ladder is monotone and the child band is under the new-lesson ceiling', () => {
    const t = TEXTS();
    expect(fk(t.child)).toBeLessThan(fk(t.youth));
    expect(fk(t.youth)).toBeLessThan(fk(t.teen));
    expect(fk(t.teen)).toBeLessThanOrEqual(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
  });

  it('no band is a truncation of another', () => {
    const t = TEXTS();
    const keys = Object.keys(t);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        expect(overlapOf(t[keys[i]], t[keys[j]]), `${keys[i]} vs ${keys[j]}`).toBeLessThan(0.5);
      }
    }
  });
});

describe('the correction is in every band, because a discernment week must not end in suspicion', () => {
  it('every text carries counsel-is-commanded AND the ear that TRIES rather than refuses', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must carry Proverbs 11:14`).toMatch(/multitude of counsellors/);
      expect(String(t), `${band} must carry Job 12:11`).toMatch(/Doth not the ear try words/);
    }
  });

  it('PROVEN TO CATCH: a band that drops the correction fails by name', () => {
    const stripped = String(M.levels.teen).replace(/multitude of counsellors/g, 'many advisers');
    expect(/multitude of counsellors/.test(stripped)).toBe(false);
  });

  it('no band INSTRUCTS the reader to distrust everyone', () => {
    // The first version of this check matched "it is not a reason to trust no
    // one" -- the lesson's own DENIAL of the error. A check that fires on the
    // correction it is meant to protect is worse than no check: it would have
    // been "fixed" by deleting the safeguard. So it matches an instruction,
    // not the words, and each band is asserted to carry the denial as well.
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).not.toMatch(/\b(you should|always|never)\s+(trust no|distrust)/i);
      expect(String(t), `${band} must deny the error outright`).toMatch(
        /not (a )?(reason|licence|license|warrant|witness)|does not mean trust nobody|no warrant|gives no warrant/i
      );
    }
  });
});

describe('it does not re-teach what this course already taught', () => {
  it('the landing is the unverifiable credential, not the profit motive (sov15) or testing what arrives (sov44)', () => {
    expect(M.bigIdea).toMatch(/sov15/);
    expect(M.bigIdea).toMatch(/sov44/);
    expect(M.bigIdea).toMatch(/NOT repeated|are already taught|ALREADY TAUGHT/i);
    // The landing itself, stated where a reader meets it first.
    expect(M.lesson).toMatch(/costume/);
    expect(M.lesson).toMatch(/by their fruits|BY THEIR FRUITS/i);
  });
});

describe('the source is handled honestly', () => {
  it('the letter’s own good work is named before anything is said against it', () => {
    expect(M.lesson).toMatch(/honest work|serviceable counsel|decent tests|competent advice/i);
  });

  it('its closing instruction is repeated rather than softened', () => {
    for (const band of ['adult', 'child', 'youth', 'teen', 'senior']) {
      const t = band === 'adult' ? M.lesson : M.levels[band];
      expect(String(t), `${band} must keep "see a professional"`).toMatch(/professional|real doctor/i);
    }
  });

  it('the limits are stated: its health claims are neither verified nor asserted', () => {
    expect(M.lesson).toMatch(/does not check the letter's own health claims|not verified|neither verified/i);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    for (const s of allStrings(M)) {
      expect(s, s.slice(0, 60)).not.toMatch(/\bSatan\b|\bLucifer\b|\bThe Devil\b/);
    }
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    // The corpus writes "God" inside quotations; that must never be rewritten
    // (DR-0076 bright line), so the check is only that our prose uses His name.
    expect(M.lesson).toMatch(/Yahweh/);
    const quoted = [...M.lesson.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
    expect(quoted, 'a quotation must never have Yahweh substituted into it').not.toMatch(/Yahweh/);
  });
});

describe('the parables are invented people', () => {
  it('two stories, and neither names a member', () => {
    expect(M.stories).toHaveLength(2);
    for (const s of M.stories) {
      expect(s.kind).toBe('parable');
      expect(s.body.length).toBeGreaterThan(400);
    }
  });
});

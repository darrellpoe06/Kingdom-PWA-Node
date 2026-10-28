// @vitest-environment node
// =============================================================================
// L268 — A Way in the Sea: the witness we do not need to invent
// =============================================================================
// Darrell sent a link into the PoeTech app under one word asking for a lesson,
// with a note asking that maps, timeline, Scripture and historical context be
// joined so that Yahweh and His voice and His evidence could be seen together.
// The link was a narrated video claiming that Pharaoh's drowned chariot corps
// lies on a shallow shelf in the Gulf of Aqaba -- coral-cast wheels of several
// spoke counts, horse and human bone, a gilded commander's wheel -- and that
// the scholarly world has gone silent while the site is quietly cleared.
//
// THIS LESSON'S WHOLE DANGER IS THAT THE CLAIM FLATTERS US. So the gate below
// does not only check that the verses are verbatim; it checks that the three
// unverified claims are attributed to the video rather than asserted as fact,
// that the lesson says out loud what its own source could not establish, and
// that the counter-argument is stated fairly rather than sneered at. A lesson
// that quoted every verse correctly and still smuggled an uncited seabed claim
// in as evidence would be the exact failure Job 13:7 names, and it would pass
// every other gate in this house.
//
// QUOTE PAIRING IS DONE BY SPLITTING, NOT BY REGEX (DR-1258, corrected in
// DR-1259). The obvious pattern, /"([^"]{10,})"\s*\(([^)]+)\)/g, is used by
// several lesson specs in this directory, and it mis-pairs whenever a quotation
// shorter than its own ten-character minimum sits in the prose: the scan fails
// at that quotation's opening mark, resumes at its CLOSING mark, and the next
// match can swallow the ordinary prose lying between two real quotations.
//
// HOW BIG IS IT, ON THE SHIPPED TEXT? Measured rather than assumed, and the
// measurement corrected an earlier overstatement of mine: across this lesson's
// five texts, sov52's five, and ll267's lesson, the naive pattern and the split
// agree everywhere but ONE place -- sov52's child band, 8 spans against 9 --
// and nowhere does the naive pattern return a span that was never inside
// quotation marks. DR-1258's Verification section reports five false alarms and
// 104 against 112; those figures were taken from the DRAFT while the flaw was
// being found, before the senior band was rewritten, and they do not describe
// the module that shipped. DR-1259 records the correction, because a decision
// record is append-only and is not quietly rewritten.
//
// So splitting is used here because it cannot drift -- odd indices of the split
// ARE the insides of quotes -- and the case below demonstrates the mechanism on
// this lesson's own words, while saying plainly that the ingredient which
// triggers it had to be added.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';

const ID = 'll268-a-way-in-the-sea-the-witness-we-do-not-need-to-invent';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

// Every string anywhere in the module, so a verse quoted in a quiz explanation
// is checked exactly like one in the lesson body. DR-0483's defect was a
// verbatim check that read five fields and reported on the whole module.
function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/**
 * The corpus text a reference names, or null when it does not resolve.
 *
 * Handles the three forms this lesson actually uses, which is why it is written
 * out rather than assumed: a plain "Exodus 14:21", a range "Joshua 4:6-7", and
 * a book named once with further chapter:verse parts after a comma, as in
 * "Luke 1:2, 1:4". The first version of this helper omitted the comma form and
 * reported the Luke citation as an unresolved reference three times over -- a
 * gate failing on its own parser rather than on the lesson, which is the sort
 * of red that wastes an hour if the message is believed at face value.
 */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}

/**
 * Every quoted span in a text, with the reference that follows it when there is
 * one. Splitting on the quote character means odd indices are inside quotes, so
 * a short quotation cannot shift the pairing (DR-1258).
 */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}

/** An excerpt may be ellipsis-joined; every piece must appear, in order. */
function spanMatches(inside, verse) {
  let from = 0;
  for (const p of String(inside).split(/\s*\.\.\.\s*|\s*…\s*/).map((s) => s.trim()).filter(Boolean)) {
    const bare = p.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
    const at = verse.indexOf(bare, from);
    if (at < 0) return false;
    from = at + bare.length;
  }
  return true;
}

/** Referenced spans that are not what the corpus holds. */
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!spanMatches(inside, verse)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one of these was fetched from the corpus on disk before it was written.
const SPINE = [
  ['Exodus 14:21', 'the LORD caused the sea to go back by a strong east wind all that night'],
  ['Exodus 14:22', 'the waters were a wall unto them on their right hand, and on their left'],
  ['Exodus 14:28', 'there remained not so much as one of them'],
  ['Exodus 14:30', 'Israel saw the Egyptians dead upon the sea shore'],
  ['Psalms 106:11', 'there was not one of them left'],
  ['Psalms 106:12', 'Then believed they his words; they sang his praise'],
  ['Psalms 106:13', 'They soon forgat his works; they waited not for his counsel'],
  ['Job 13:7', 'Will ye speak wickedly for God? and talk deceitfully for him?'],
  ['Joshua 4:24', 'That all the people of the earth might know the hand of the LORD, that it is mighty'],
  ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
  ['Luke 16:31', 'neither will they be persuaded, though one rose from the dead'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good'],
];

// The claims the video makes that NOTHING in our hands establishes. The lesson
// must carry each one as the video's, never as a finding.
const UNVERIFIED = ['spoke', 'gold', 'drag marks'];

describe('L268 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  // FIXED WHEN ll269 LANDED, and it is worth saying why rather than quietly
  // editing it. This case originally also asserted
  // `expect(Math.max(...numbers)).toBe(268)` -- that ll268 is the HIGHEST
  // Living Lesson. That assertion was true for about an hour and then became a
  // time bomb: the very next lesson makes it false, and it would have reddened
  // ll269's branch and then main. It is precisely the defect DR-1256 was
  // written about, where a check hands a permanent role to whichever lesson
  // happens to be newest, and I committed it again in a lesson spec one day
  // later. A lesson's own gate should assert what is true about that lesson
  // for good -- that it claims its number exactly once -- and leave "which is
  // newest" to living-lessons-order.test.jsx, which owns that question and has
  // a comment moved deliberately each time the answer changes.
  it('claims 268 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 268)).toHaveLength(1);
    expect(numbers.filter((n) => n === 268)).toEqual([268]);
  });

  it('carries its build day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
  });

  it('carries two real stories, so it arrives whole (lesson-completeness)', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(s.verse).toMatch(/\d+:\d+/);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    for (const r of refs) expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    const n = referencedCount(EVERY_STRING);
    expect(n).toBeGreaterThanOrEqual(150);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(150);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'there remained not so much as one of them',
      'there remained not so much as two of them',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: the naive pairing regex mis-reads a short quotation, where splitting does not', () => {
    // MEASURED FIRST, and it corrected me. On this lesson's shipped text the
    // naive pattern and the split agree exactly -- 45 referenced spans each,
    // and not one span it returns is a non-quotation. The same measurement
    // across sov52 and ll267 found a single divergence anywhere: sov52's CHILD
    // band, 8 against 9, an undercount of one with no false alarm. So the
    // hazard is LATENT in this corpus, not live in it, and the sweep above
    // would read the same either way today.
    //
    // That is worth stating plainly because the first version of this case
    // asserted the opposite, failed, and was right to fail. What the case
    // proves instead is the mechanism, on this lesson's own words plus the one
    // ingredient the corpus happens not to supply here: a quotation shorter
    // than the pattern's own ten-character minimum sitting between two real
    // ones. The flaw is in the instrument, so it is demonstrated rather than
    // asserted, and the demonstration is honest about being constructed.
    // WHAT ACTUALLY SAVES THE SWEEP IS THE REFERENCE ANCHOR, and finding that
    // out took two wrong assertions. Requiring a "(Book c:v)" immediately after
    // the closing mark re-anchors the pairing at every citation, so a parity
    // shift upstream heals itself by the next verse. That is why the shipped
    // texts agree and why this is stated rather than hidden.
    const naive = /"([^"]{10,})"\s*\(([^)]+)\)/g;
    const shipped = [...L.lesson.matchAll(naive)].map((m) => m[1]);
    const split = quotedPairs(L.lesson).filter((p) => p.ref).map((p) => p.inside);
    expect(shipped.length, 'with the reference anchor the two agree on the shipped text').toBe(split.length);

    const seam = 'The link was a narrated video';
    expect(L.lesson).toContain(seam);
    const withShort = L.lesson.replace(seam, 'He sent it under one word, "Lesson," and the link was a narrated video');
    expect(quotedPairs(withShort).filter((p) => p.ref).length, 'splitting is unmoved by a short quotation').toBe(split.length);

    // THE CHECK THAT HAS NO ANCHOR IS THE ONE THAT FLIPS -- and a
    // Yahweh-inside-a-quotation check is exactly that shape, because it must
    // look at every quoted span whether a reference follows it or not. One
    // short quotation inverts its whole notion of inside and outside.
    const parityOnly = (t) => [...String(t).matchAll(/"([^"]{10,})"/g)].map((m) => m[1]);
    const trulyInside = new Set(withShort.split('"').filter((_, i) => i % 2 === 1));
    const spans = parityOnly(withShort);
    const bogus = spans.filter((s) => !trulyInside.has(s));
    expect(spans.length, 'it still returns plenty, which is why the failure is invisible').toBeGreaterThan(40);
    expect(bogus.length, 'every span it returns is now prose that was never inside quotation marks').toBe(spans.length);
    expect(
      bogus.filter((s) => /\bYahweh\b/.test(s)).length,
      'and some of that prose names Yahweh, which reads as a bright-line breach that never happened',
    ).toBeGreaterThan(0);

    // Splitting, on the same tampered text, reports no such thing.
    expect(quotedPairs(withShort).filter((p) => /\bYahweh\b/.test(p.inside))).toEqual([]);
  });

  it('Yahweh is never put inside a quotation, in any string of the module', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
      }
    }
    expect(planted).toEqual([]);
  });

  it('PROVEN TO CATCH: a Yahweh planted inside a quotation is both seen and refused', () => {
    const tampered = L.lesson.replace(
      'Prove all things; hold fast that which is good',
      'Prove all things for Yahweh; hold fast that which is good',
    );
    expect(tampered).not.toBe(L.lesson);
    const insides = quotedPairs(tampered).filter((p) => /\bYahweh\b/.test(p.inside));
    expect(insides.length).toBeGreaterThan(0);
    expect(verbatimFaults([tampered]).length).toBeGreaterThan(0);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  // ADDED AFTER THIS LESSON WENT RED IN CI, which is the honest reason it is
  // here. The curriculum gate (scripts/quotation-integrity.mjs, run by the
  // "curriculum NAS copy" job) refused the first push: FRESH quotation, lesson
  // 0 -> 3, levels.youth 0 -> 3, levels.teen 0 -> 2. Eight quoted spans carried
  // an ellipsis across three distinct citations, and that ratchet is shrink-only
  // -- a new offender fails the build.
  //
  // My own prose checker had allowed them, because it was written to ACCEPT an
  // ellipsis-joined excerpt as long as every piece appeared in the verse in
  // order. That is a reasonable thing for a verbatim check to do and the wrong
  // thing for this house, whose rule (DR-0459) is "always a shorter genuinely
  // verbatim span, never an elision" -- reachable, as the module says, "usually
  // by quoting a little MORE of the verse rather than a little less."
  //
  // The repair followed that remedy exactly. Deuteronomy 13:2-3 and Exodus
  // 13:17-18 are contiguous, so each is now quoted whole, which restores the
  // clause the elision had cut out: in Deuteronomy, the reason the sign must be
  // refused. Luke 1:2 and 1:4 are NOT adjacent and no contiguous span covers
  // both, so they became two separately cited quotations, which is what the
  // senior band had already done -- the senior band was the only one of the five
  // with no elisions, and it supplied the replacements for the other three.
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: putting one ellipsis back inside a quotation is seen', () => {
    const whole = 'And the sign or the wonder come to pass, whereof he spake unto thee, saying, Let us go after other gods, which thou hast not known, and let us serve them; Thou shalt not hearken';
    expect(L.lesson).toContain(whole);
    const cut = { ...L, lesson: L.lesson.replace(whole, 'And the sign or the wonder come to pass... Thou shalt not hearken') };
    expect(cut.lesson).not.toBe(L.lesson);
    const found = elidedQuotations(cut);
    expect(found.length).toBe(1);
    expect(found[0].where).toBe('lesson');
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue; // a reference list, not prose
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Will ye speak wickedly for God?');
    expect(inQuotes).toContain('the LORD caused the sea to go back');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('the lesson tells the truth about its own source and its own limits', () => {
  it('names the road it came in on: sent into the app, under one word', () => {
    expect(L.lesson).toMatch(/inside the PoeTech app|into this house/i);
    expect(L.lesson).toMatch(/one word/i);
  });

  it('states the captions limit, and therefore quotes no speaker as his own words', () => {
    expect(L.lesson).toMatch(/auto-generated captions/i);
    expect(L.lesson).toMatch(/machine.s hearing/i);
    expect(L.lesson).toMatch(/no timestamps/i);
  });

  it('says plainly that we do not know whether the wheels are there', () => {
    const child = L.levels.child;
    expect(child).toMatch(/we do not know/i);
    expect(L.bigIdea).toMatch(/we do not know/i);
  });

  it('carries each unverified claim as the video’s, inside the asserted pile, never as a finding', () => {
    for (const claim of UNVERIFIED) {
      expect(L.lesson.toLowerCase(), `the lesson never mentions ${claim}`).toContain(claim);
    }
    // The drag-marks claim is the one doing the heaviest work, so the lesson
    // must say in its own voice that it carries no citation.
    expect(L.lesson).toMatch(/no citation/i);
    expect(L.lesson).toMatch(/NOAA/);
  });

  it('keeps the three tiers apart by name', () => {
    expect(L.lesson).toMatch(/three tiers|three piles|three categories/i);
    for (const b of BANDS) {
      expect(L.levels[b], `${b} band does not sort the claim`).toMatch(/pile|tier|categor/i);
    }
  });

  it('is fair to the argument against it rather than sneering at it', () => {
    expect(L.lesson).toMatch(/argument from absence|absence/i);
    expect(L.lesson).toMatch(/stands as an objection/i);
    // and it refuses the both-sides-for-entertainment posture by name
    expect(L.lesson).toMatch(/co-equal authorities/i);
  });

  it('teaches that evidence was never the foundation, from the Word and not from us', () => {
    expect(L.lesson).toContain('They soon forgat his works');
    expect(L.lesson).toContain('though one rose from the dead');
  });

  it('answers the ask it was given: maps, timeline and context, with the uncertainty declared', () => {
    expect(L.lesson).toContain('Pihahiroth');
    expect(L.lesson).toContain('Baalzephon');
    expect(L.lesson).toMatch(/not been fixed to the ground/i);
    expect(L.lesson).toContain('The secret things belong unto the LORD our God');
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check still reads green', () => {
    const teen = L.levels.teen;
    const friend = /Friends, discuss the three categories with one friend this week[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    // The pooled check cannot see it, which is the whole reason DR-0795 added
    // the per-band one: a reader reads ONE band.
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});

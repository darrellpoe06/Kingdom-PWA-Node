// @vitest-environment node
// =============================================================================
// L183 — Realign My Eyes: Your Type Was Trained
// =============================================================================
// Darrell 2026-09-19, prefixed "Lesson.", across seven messages, from a
// Trackstarz panel working a Pastor Dharius Daniels clip on lust and
// unrealistic expectations. What he named: finding a spouse as a process
// grounded in faith rather than external "preferences" or "types"; unbiblical
// exposure distorting discernment; Instagram learning a user's type from
// viewing habits and feeding it back; "illogical comparisons" against a
// curated, hyper-sexualised standard that cause virtuous people to be
// overlooked; purging the feed; dying to the flesh as a daily casting down of
// recurring images; praying for Yahweh to "realign your eyes" so that someone
// previously not your type becomes the most attractive and suitable partner;
// internal character over external traits; shared destiny; and kindness
// measured against "the loyal friendship of Jonathan in the Bible".
//
// Then, mid-build: "Allow the neuroplasticity of the brain and timelines to
// also explain our hearts mindset and subconscious situational analysis for
// clarity on this topic". That is why every band carries the mechanism, the
// real clock, and the fast pre-verbal read.
//
// THE TRAP, NAMED BEFORE A WORD WAS WRITTEN. A lesson on this subject does
// harm when it over-corrects into "noticing beauty is sin". Scripture states
// flatly that Rachel was beautiful (Genesis 29:17) with no rebuke attached,
// and Song of Solomon 4:7 is canon. DR-0100 tier 3: correct the over-reach,
// keep the true data. The sin located here is RANKING, never noticing --
// and 1 Samuel 16:7 is read as Yahweh teaching Samuel to weigh as HE weighs,
// not as a denial that appearance exists.
//
// MEASURED BEFORE WRITING, against the 181 existing lessons:
//   1 Samuel 16:7   130 hits / 20 lessons  (well worked already)
//   Proverbs 31:30   41 hits /  4 lessons
//   Proverbs 18:22   24 hits /  4 lessons
//   Matthew 5:28     12 hits /  1 lesson
//   Genesis 29:17    ZERO -- Jacob/Leah/Rachel untaught
//   Genesis 24:*     ZERO -- Rebekah and the camels untaught
//   Job 31:1         ZERO -- the covenant with the eyes untaught
//   Ruth 3:11        ZERO -- the town that could confirm her untaught
// So the four passages carrying this lesson's weight were all at zero.
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//   1. THE OVER-CORRECTION above. Guarded in every band, by name.
//   2. CONTEMPT FOR LEAH. The Jacob story is usually told so the plainer
//      sister is the punchline. Yahweh honoured her and ran the line of the
//      Lamb through her; every band says so.
//   3. A FABRICATED TIMELINE. "21 days" is false and traceable; the measured
//      study is carried WITH its limits, because a number without its limits
//      is a claim dressed as evidence (DR-0076 §4).
//   4. PROMISING ERASURE. Telling a reader the images will stop is a lie that
//      makes them quit when the images return. Extinction is not erasure.
//   5. LEAVING THE MARRIED OUT. Most readers already chose. The trained eye
//      turns on the spouse, and that is the quieter damage.
//   6. SCIENCE AS AUTHORITY. Hebrews 5:14 made the training claim first; the
//      measurement is a witness to the Word, never its warrant.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { lessonSectionPlan } from '../lib/lesson-format.js';

const ID = 'll183-realign-my-eyes-your-type-was-trained';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const verse = (book, ch, n) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  const bk = cache.get(k); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  return chap[Number(n) - 1] == null ? null : norm(chap[Number(n) - 1]);
};
let CORPUS = null;
const corpus = () => {
  if (CORPUS === null) {
    let all = '';
    for (const f of readdirSync(KJV)) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      const bk = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
      if (Array.isArray(bk.chapters)) for (const ch of bk.chapters) all += ` ${ch.join(' ')}`;
    }
    CORPUS = norm(all);
  }
  return CORPUS;
};
const walk = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, fn);
};

// Quoted spans that are deliberately NOT Scripture: the phrases the panel used,
// the app's own button text, and the prayer the lesson teaches. Enumerated by
// exact text so the exemption cannot widen into a pattern (DR-0076).
const NOT_SCRIPTURE = new Set([
  // What a person says about their own taste -- the sentence this lesson exists
  // to question. Quoted because it is what the reader actually says, not because
  // anybody in Scripture said it.
  'that is just my type.',
  'this is just what I like',
  'I just like what I like.',
  'this is what I am attracted to,',
  'I just wasn’t feeling it',
  'I just didn’t feel anything for him',
  'I just didn’t like them',
  'See, I never really changed.',
]);

describe('the lesson exists and is wired', () => {
  it('is the newest Living Lesson and sits immediately after L182', () => {
    expect(L, 'L183 is not in the series').toBeTruthy();
    // Invariant, not a literal -- see the note in L179's file. The series
    // length and the declared week count must agree; the NUMBER is not pinned,
    // because pinning it is what made three unrelated files go red on append.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(here, 'L183 is not in the series').toBeGreaterThan(-1);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll182-/);
  });

  it('carries every field, and every band clears its floor and differs from its neighbours', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
    expect(shortBands(measureFullness(L))).toEqual([]);
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });

  it('every authored caps heading actually renders as a numbered point', () => {
    // L180 shipped with ZERO numbered points because the headings were written
    // "1) HEADING" instead of the house style, and a heading over nine words or
    // carrying a comma is invisible to the renderer. This asserts the rendering
    // rather than the intent.
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      const plan = lessonSectionPlan(t);
      expect(plan.total, `${k} renders too few numbered points`).toBeGreaterThanOrEqual(15);
      for (const h of plan.headings) {
        const head = h.text.split(/[.:—]/)[0].trim();
        expect(head.split(/\s+/).length, `${k}: heading too long -- ${head}`).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('EVERY quotation is His words', () => {
  it('every referenced span is letter-for-letter the verse it names', () => {
    const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+)\)/g;
    const faults = []; let checked = 0;
    walk(L, '', (text, path) => {
      SPAN.lastIndex = 0; let m;
      while ((m = SPAN.exec(text))) {
        checked += 1;
        const real = verse(m[2].trim(), m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!real.includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked).toBeGreaterThan(100);
    expect(faults).toEqual([]);
  });

  it('an unreferenced quotation is either declared non-Scripture or verbatim KJV', () => {
    const bad = [];
    walk(L, '', (text, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(text))) {
        if (m[2]) continue;
        const q = m[1];
        if (NOT_SCRIPTURE.has(q)) continue;
        const bare = norm(q).replace(/[.,]+$/, '');
        if (!corpus().includes(bare)) bad.push(`${path}: ${q.slice(0, 60)}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    walk(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${path}: ${m[1].slice(0, 50)}`);
    });
    expect(elided).toEqual([]);
  });
});

describe('the four passages that were at zero before this lesson', () => {
  it('Genesis 29 states Rachel WAS beautiful, with no rebuke — the anti-over-correction anchor', () => {
    expect(verse('Genesis', 29, 17)).toBe('Leah was tender eyed; but Rachel was beautiful and well favoured.');
    // And the canon carries a husband saying it to his wife.
    expect(verse('Song of Solomon', 4, 7)).toBe('Thou art all fair, my love; there is no spot in thee.');
  });

  it('Jacob served seven years and woke to Leah — sincerity does not repair an eye-made choice', () => {
    expect(verse('Genesis', 29, 20)).toContain('and they seemed unto him but a few days, for the love he had to her');
    expect(verse('Genesis', 29, 25)).toContain('in the morning, behold, it was Leah');
  });

  it('the servant’s sign was a WORK OF KINDNESS, and it named the camels', () => {
    expect(verse('Genesis', 24, 14)).toContain('Drink, and I will give thy camels drink also');
    expect(verse('Genesis', 24, 19)).toContain('I will draw water for thy camels also, until they have done drinking');
    expect(verse('Genesis', 24, 20)).toContain('And she hasted, and emptied her pitcher into the trough');
  });

  it('and the love came AFTER the covenant, which is the order the feed reverses', () => {
    expect(verse('Genesis', 24, 67)).toContain('and she became his wife; and he loved her');
  });

  it('Job bound his eyes by covenant, and gave his reason in the same breath', () => {
    expect(verse('Job', 31, 1)).toBe('I made a covenant with mine eyes; why then should I think upon a maid?');
  });

  it('Ruth’s reputation was a whole town’s to confirm, not her own to assert', () => {
    expect(verse('Ruth', 3, 11)).toContain('all the city of my people doth know that thou art a virtuous woman');
  });
});

describe('the mechanism, and the Word that named it first', () => {
  it('Hebrews 5:14 makes the training claim about the SENSES, by reason of use', () => {
    // This is the verse that keeps the science a witness rather than the
    // authority: Scripture said perception is exercised by repetition long
    // before a brain could be imaged.
    expect(verse('Hebrews', 5, 14))
      .toBe('But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil.');
  });

  it('casting down is PRESENT tense, which is why a returning image is not a verdict', () => {
    expect(verse('2 Corinthians', 10, 5)).toContain('Casting down imaginations');
    expect(verse('2 Corinthians', 10, 5)).toContain('bringing into captivity every thought to the obedience of Christ');
  });

  it('the harvest law is the same principle: sowing is the repetition', () => {
    expect(verse('Galatians', 6, 7)).toContain('whatsoever a man soweth, that shall he also reap');
    expect(verse('Galatians', 6, 8)).toContain('he that soweth to his flesh shall of the flesh reap corruption');
  });

  it('and the accumulated result lives in the heart — the deep mind, not the feelings', () => {
    expect(verse('Proverbs', 23, 7)).toContain('For as he thinketh in his heart, so is he');
    expect(verse('Proverbs', 4, 23)).toBe('Keep thy heart with all diligence; for out of it are the issues of life.');
  });

  it('He does not leave the channel empty — Philippians 4:8 names what to run through it', () => {
    expect(verse('Philippians', 4, 8)).toContain('if there be any virtue, and if there be any praise, think on these things');
  });
});

describe('the guards that keep this lesson out of both ditches', () => {
  it('every band refuses the over-correction by name, and none of them calls noticing the sin', () => {
    for (const b of BANDS) {
      const t = L.levels[b];
      expect(t, `${b} never states that ranking is the error`).toMatch(/ranking|putting it first|PUTTING IT FIRST|RANKING/i);
      expect(t, `${b} drops the Rachel anchor`).toContain('beautiful and well favoured');
    }
    expect(L.lesson).toMatch(/RANKING/);
  });

  it('every band honours Leah rather than making her the punchline', () => {
    // Jacob's story becomes contempt for the plainer sister unless this lands.
    for (const [k, t] of [['lesson', L.lesson], ...['youth', 'teen', 'senior'].map((b) => [b, L.levels[b]])]) {
      expect(t, `${k} tells the Jacob story without honouring Leah`).toMatch(/Leah/);
      expect(t, `${k} never says Yahweh honoured her`).toMatch(/honoured Leah|Yahweh honoured|passed over/);
    }
  });

  it('the timeline is carried WITH its limits, never as a bare number', () => {
    // A number without its limits is a claim dressed as evidence. Wherever the
    // measured median appears, the boundary must appear with it.
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      if (!/sixty-six/.test(t)) continue;
      expect(t, `${k} gives the median with no range`).toMatch(/eighteen/);
      expect(t, `${k} gives the number without naming the myth it replaces`).toMatch(/twenty-one|1960|Maltz/);
    }
  });

  it('no band promises the images will stop coming back', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} omits that the old pathway is not erased`)
        .toMatch(/not deleted|not erased|still there|does not disappear|stays on the shelf|not be deleted/i);
    }
  });

  it('the married reader is addressed, not left out', () => {
    expect(L.lesson).toMatch(/ALREADY MARRIED/);
    expect(L.levels.senior).toMatch(/MARRIED TOO/);
  });

  it('the child band teaches the principle without ever teaching lust', () => {
    const c = L.levels.child;
    expect(c).not.toMatch(/lust|adultery|sexual/i);
    expect(c).toContain('kindness');
    expect(c).toContain('Hebrews 5:14');
  });
});

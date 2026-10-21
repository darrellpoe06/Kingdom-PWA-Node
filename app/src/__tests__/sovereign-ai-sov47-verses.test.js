// =============================================================================
// sov47 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// Darrell forwarded IT Brew's "Downtime is money" into the app on 2026-10-21 at
// 16:52 UTC with one word above it: "Lesson." The article offers to teach how to
// turn an outage into a bigger budget; the lesson keeps its measurements, names
// its advertising as advertising, and refuses that trade.
//
// THE SPINE WAS CHOSEN BY MEASUREMENT, and this test pins the reason. The
// obvious lesson from that article is "count the cost", which this course
// already teaches twice — sov34 and sov38, on Luke 14:28 and Matthew 7:24 — and
// the alarm half is sov33's. Writing either would have tripped the duplicate
// rule shipped the same morning (DR-1185: same course, same title opening, ten
// or more shared verses). Measured in sovereign-ai-class.js before a word was
// written: "alert fatigue" 0, "piggy bank" 0, "slothfulness" 0, "droppeth" 0,
// Proverbs 24:30 0, Proverbs 24:31 0, Proverbs 24:34 0, Nehemiah 2:17 0. So the
// free ground is DEFERRED MAINTENANCE and the WILL THAT ONLY PAYS AFTER THE
// LOSS, and the spine is Ecclesiastes 10:18 + Proverbs 24:30-34 + Nehemiah 2:17.
//
// What this pins, beyond the fifteen verses:
//   * the curly apostrophe. Drafting put "watchman's hand" where the corpus has
//     "watchman’s hand" — three times, in three different files, before a
//     checker caught it. A straight apostrophe inside a quoted verse is not a
//     typo here, it is an un-verbatim Scripture quote.
//   * the DR-0210 bright line: "Yahweh" in OUR prose, and "God"/"the LORD"
//     ONLY inside a quotation, where the KJV's own wording is left alone.
//   * the week number, and that no other week claims it — the first splice of
//     this lesson silently created a SECOND sov43 because the number was read
//     with a grep that matched only one of the two quote styles this file uses.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const PINNED = {
  'Ecclesiastes 10:18': 'By much slothfulness the building decayeth; and through idleness of the hands the house droppeth through.',
  'Proverbs 24:30': 'I went by the field of the slothful, and by the vineyard of the man void of understanding;',
  'Proverbs 24:31': 'And, lo, it was all grown over with thorns, and nettles had covered the face thereof, and the stone wall thereof was broken down.',
  'Proverbs 24:32': 'Then I saw, and considered it well: I looked upon it, and received instruction.',
  'Proverbs 24:33': 'Yet a little sleep, a little slumber, a little folding of the hands to sleep:',
  'Proverbs 24:34': 'So shall thy poverty come as one that travelleth; and thy want as an armed man.',
  'Nehemiah 2:17': 'Then said I unto them, Ye see the distress that we are in, how Jerusalem lieth waste, and the gates thereof are burned with fire: come, and let us build up the wall of Jerusalem, that we be no more a reproach.',
  'Nehemiah 4:6': 'So built we the wall; and all the wall was joined together unto the half thereof: for the people had a mind to work.',
  'Ezekiel 33:6': 'But if the watchman see the sword come, and blow not the trumpet, and the people be not warned; if the sword come, and take any person from among them, he is taken away in his iniquity; but his blood will I require at the watchman’s hand.',
  'Habakkuk 2:1': 'I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me, and what I shall answer when I am reproved.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
  'Proverbs 25:28': 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
  'Luke 12:39': 'And this know, that if the goodman of the house had known what hour the thief would come, he would have watched, and not have suffered his house to be broken through.',
  'Proverbs 15:22': 'Without counsel purposes are disappointed: but in the multitude of counsellors they are established.',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov47-'));

/** Every authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('lesson', lesson.lesson);
  for (const k of ['child', 'youth', 'teen', 'senior']) push(k, lesson.levels[k]);
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  ((lesson.facilitator || {}).talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', (lesson.facilitator || {}).howToRun);
  ((lesson.facilitator || {}).discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
  });
  return out;
};

describe('sov47 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      expect(lesson.levels[k].length, k).toBeGreaterThan(1500);
    }
  });

  // What is sov47's to guarantee is its own number, and that nobody else claims
  // it. The first splice of this lesson created a second sov43 because the
  // highest number had been read with a grep matching one quote style only.
  it('is week 47, and no other week claims that number', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(lesson.id)).toBe(47);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (m.id === lesson.id) continue;
      expect(n(m.id), m.id).not.toBe(47);
    }
  });

  it('every verse it declares is the corpus on disk, verbatim', () => {
    const declared = lesson.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(declared.length).toBe(Object.keys(PINNED).length);
    for (const ref of declared) {
      expect(PINNED, ref).toHaveProperty(ref);
      expect(PINNED[ref], ref).toBe(corpusText(ref));
    }
  });

  it('every quoted span, in EVERY authored string, is that verse verbatim', () => {
    const re = /"([^"]{10,900})"\s*\(([1-3]?\s?[A-Z][a-z]+\s+\d+:\d+)\)/g;
    let checked = 0;
    for (const { place, text } of EVERY_TEXT()) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const real = PINNED[m[2]] || corpusText(m[2]);
        expect(real.includes(m[1]), `${place}: ${m[2]} — ${m[1].slice(0, 70)}`).toBe(true);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(60);
  });

  // PROVEN TO CATCH. Drafting put a straight apostrophe inside Ezekiel 33:6
  // three times across three files. A quoted verse carrying one is not a typo,
  // it is an un-verbatim Scripture quote, and no span check above would see it
  // if the whole span were consistently wrong.
  it('PROVEN TO CATCH: no quoted verse carries a straight apostrophe where the corpus has a curly one', () => {
    const offenders = [];
    for (const { place, text } of EVERY_TEXT()) {
      for (const [ref, txt] of Object.entries(PINNED)) {
        if (!txt.includes('’')) continue;
        const words = txt.split(' ');
        for (let i = 0; i + 5 <= words.length; i += 1) {
          const win = words.slice(i, i + 5).join(' ');
          const straight = win.replace(/’/g, "'");
          if (straight !== win && text.includes(straight)) offenders.push(`${place}: ${ref} — ${straight}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // DR-0210 / DR-0076: "Yahweh" is ours to say; "God" and "the LORD" belong to
  // the quotation and are never substituted or introduced into our own prose.
  it('names Yahweh in our prose and leaves God and the LORD inside the quotations', () => {
    const strip = (t) => t.replace(/"[^"]*"/g, ' ');
    let yahweh = 0;
    for (const { place, text } of EVERY_TEXT()) {
      const ours = strip(text);
      expect(/\bGod\b/.test(ours), `${place}: "God" in our own prose`).toBe(false);
      expect(/\bthe LORD\b/.test(ours), `${place}: "the LORD" in our own prose`).toBe(false);
      yahweh += (ours.match(/\bYahweh\b/g) || []).length;
    }
    expect(yahweh).toBeGreaterThan(0);
  });

  it('keeps the provenance honest: the source, its advertising, and what is unverified', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/IT Brew/);
    expect(all).toMatch(/Downtime is money/);
    expect(all).toMatch(/advertis/i);
    // The practitioners are named rather than paraphrased as consensus.
    expect(all).toMatch(/Ben Bernstein/);
    expect(all).toMatch(/Aaron McCray/);
    // The one measured figure is attributed to the body that reported it.
    expect(all).toMatch(/Google Threat Intelligence Group/);
  });

  it('does not re-teach the ground sov34 and sov38 already hold', () => {
    const mine = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    // The two verses that would have made this a duplicate.
    expect(mine.has('Luke 14:28')).toBe(false);
    expect(mine.has('Matthew 7:24')).toBe(false);
    const others = SOVEREIGN_AI_MODULES.filter((m) => m.id !== lesson.id);
    for (const other of others) {
      const theirs = new Set(String((other.anchor || {}).ref || '').split(';').map((s) => s.trim()).filter(Boolean));
      let shared = 0;
      for (const r of mine) if (theirs.has(r)) shared += 1;
      // DR-1185's rule flags a pair at ten or more shared verses in one course.
      expect(shared, `${other.id} shares ${shared} verses with sov47`).toBeLessThan(10);
    }
  });
});

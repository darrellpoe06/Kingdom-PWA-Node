// =============================================================================
// A SIXTH CLASS: the first letter of a quotation of the Word, re-cased to suit
// OUR sentence — and the proof that a single-defect detector cannot see a
// double-defect span
// =============================================================================
// FOUND BY ACCIDENT, WHICH IS THE PART WORTH RECORDING. L94's audit flagged
//
//     "the thoughts of the wicked are an abomination to the LORD,"
//
// and my first reading was the familiar one: a fabricated comma, the class the
// terminal sweep had already fixed 222 of. But moving the comma did NOT make it
// verbatim. Proverbs 15:26 reads `The thoughts of the wicked are an abomination
// to the LORD:` — a COLON, and a capital `The`. The span carried TWO defects at
// once, and that is exactly why my own terminal sweep had walked straight past
// it: that sweep's test was "does this become verbatim once the mark moves,"
// which answers NO for a span that also needs a case fix. A detector that
// normalises one thing at a time is blind to every span needing two.
//
// So the catalog was measured for the compound case rather than the single one.
//
//   spans >= 25 chars examined         24,905
//   already exact                      24,138
//   fixed by one existing gate             11
//   NEEDED A CASE FIX PLUS SOMETHING       95   <- no gate could see these
//   not Scripture at all                  661
//
// Classified, those 95 were four different things, and only two were this gate's
// business:
//
//   firstLetterOnly     52  the host-sentence capitalisation convention
//   firstPlusTerminal   17  a case fix AND a fabricated mark (the sweep's miss)
//   capsInside          17  the EMPHASIS class compounded with a case change,
//                           already recorded in quoted-emphasis-baseline.json
//   other                9  mostly caps+terminal together, plus two of OUR OWN
//                           section titles in title case ("Fearfully and
//                           Wonderfully Made,"), which are ours, not the Word
//
// WHY THE CASE CHANGE IS FIXED RATHER THAN ALLOWED. Lowercasing the first letter
// of a quotation woven into a host sentence is the most universal convention in
// English, it removes nothing, and it makes no claim about meaning — so it is
// genuinely milder than a fabricated comma, and milder still than added
// emphasis. It is nonetheless not what CLAUDE.md binds: quoted KJV is "fetched
// verbatim and left EXACTLY as written," with no carve-out. I had already tried
// holding a carve-out once, for terminal punctuation, and was corrected for
// applying the strict reading to gated lessons while calling it open elsewhere.
// The same reasoning settles this one, and restoring the verse's own case is
// mechanical, reads correctly inside quotation marks, and costs a reader
// nothing.
//
// THE CATALOG WAS ALREADY DISAGREEING WITH ITSELF, which is the strongest
// evidence that the capital is right. Of the 53 distinct spans swept, 33 were
// ALREADY PINNED IN THEIR VERBATIM FORM by some other lesson's gate — the same
// verse quoted correctly in one lesson and re-cased in another. That is the same
// shape of proof L95 turned on a misquoted person: a quotation appearing in two
// forms in one catalog cannot be verbatim in both.
//
// 60 occurrences were fixed. What remains is real work, not a judgment call:
// fragments inside a COMPOSITE or ELLIPSIS-JOINED quoted region, where the
// fragment is not itself wrapped in quotes so a span-level replace cannot reach
// it. Each needs a per-case edit of the surrounding quotation. Same residual
// category the terminal sweep recorded -- EXCEPT that those turned out to be
// reachable too, by matching the fragment against its region's delimiters
// rather than against a whole span. So this class is at ZERO and the gate
// asserts zero, not a ratchet: 69 occurrences in total, 60 by whole-span
// replace and 9 more inside composite or ellipsis-joined regions.
//
// THE GATE'S FIRST VERSION WAS BLIND TO ITS OWN FOUNDING EXAMPLE, and only its
// break test showed it. I excluded every span containing an ALL-CAPS word,
// reasoning that ALL-CAPS belongs to the emphasis class -- and
// `...abomination to the LORD,` contains `LORD`. So the one span that started
// this investigation was skipped, the reintroduced break left the suite green,
// and I had already written that blindness up in this header as an acceptable
// cost rather than noticing it voided the gate. The exclusion is now
// NAME-AWARE: `LORD` and `GOD` no longer exempt a span; only ALL-CAPS that is
// not the divine name does. That is the second time in two lessons that a check
// of mine tested a label instead of the thing, and both times the break test
// was the only reason I found out.
//
// A STRUCTURAL FINDING THAT OUTLIVES THIS CLASS. L104's gate PINS an altered
// quotation — 'and see if there be any wicked way in me', lowercase, where
// Psalms 139:24 has `And` — and L104's prose still matches it, so the gate
// passes and PROTECTS the alteration from correction. A per-lesson pinned
// fragment is only as good as the fetch that produced it. That is recorded here
// with a date rather than fixed in passing, because changing it means editing
// another lesson's gate and its prose together.
// re-review: 2026-10-24 — sweep the per-lesson gates' own pins against the
// corpus, so no gate can enshrine an altered quotation.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const spansOf = (text) => {
  const at = [...text.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(text.slice(at[i] + 1, at[i + 1]));
  return out;
};

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
};

const flipFirst = (s) => (/[a-z]/.test(s[0]) ? s[0].toUpperCase() : s[0].toLowerCase()) + s.slice(1);

// ALL-CAPS in this corpus means the divine name. ALL-CAPS anywhere else inside a
// quotation is OUR emphasis, which belongs to the emphasis ratchet. Telling them
// apart is not optional here: the span that motivated this entire gate is
// `the thoughts of the wicked are an abomination to the LORD,` — it carries the
// divine name, so a blanket ALL-CAPS exclusion made the gate blind to its own
// founding example. Its break test is what caught that, after I had already
// written the blindness up as an acceptable cost.
const DIVINE_CAPS = new Set(['LORD', 'GOD', 'JEHOVAH', 'JAH', 'I', 'AM']);
const hasAddedEmphasis = (s) => (s.match(/\b[A-Z]{2,}\b/g) || []).some((w) => !DIVINE_CAPS.has(w));

// DELIBERATELY NARROW. A span qualifies only when it is NOT corpus text, carries
// no ALL-CAPS word (that is the emphasis gate's class, not this one), and becomes
// verbatim once its FIRST LETTER's case is flipped — on its own, or after the
// host sentence's terminal mark is set aside. Anything else is invisible here.
export const findCaseDrifts = () => {
  const found = {};
  for (const module of LIVING_LESSONS_MODULES) {
    const hits = new Set();
    for (const text of strings(module)) {
      for (const span of spansOf(text)) {
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (part.length < 25) continue;                    // short spans are our own dialogue
          if (KJV_FLOW.includes(part)) continue;
          if (hasAddedEmphasis(part)) continue;              // the emphasis ratchet's business
          const stripped = part.replace(/[.,;:!?]+$/, '').trim();
          if (KJV_FLOW.includes(stripped)) continue;         // the terminal ratchet's business
          if (KJV_FLOW.includes(flipFirst(part)) || KJV_FLOW.includes(flipFirst(stripped))) hits.add(part);
        }
      }
    }
    if (hits.size) found[module.id] = [...hits].sort();
  }
  return found;
};

describe('a quotation of the Word keeps the verse\'s own capitalisation', () => {
  const found = findCaseDrifts();

  it('NO quoted span in the catalog has a re-cased first letter — ZERO, not a ratchet', () => {
    // This asserts zero rather than shrink-only, because unlike the emphasis
    // class the repair here is mechanical: restore the verse's own case, and
    // move any mark the host sentence wanted outside the closing quote. Nothing
    // editorial is at stake and nothing is lost, so there was no reason to carry
    // debt. 69 occurrences were fixed to get here -- 60 by whole-span replace,
    // then 9 more reachable only inside composite or ellipsis-joined regions.
    const report = Object.entries(found)
      .map(([id, spans]) => ` - ${id}\n${spans.map((s) => `     ${JSON.stringify(s.slice(0, 90))}`).join('\n')}`)
      .join('\n');
    expect(
      found,
      `a quoted span's first letter is not the verse's own. Restore the verse's case and put any host-sentence mark OUTSIDE the closing quote:\n${report}`,
    ).toEqual({});
  });

  it('the divine name can never be flagged, and the reason is structural', () => {
    // I first wrote this guard as a guess -- that `the LORD is my shepherd`
    // appears lowercase somewhere mid-verse -- and a corpus read disproved it.
    // It does not. That is the fourth assumption of mine about what the Word
    // does NOT say to die to a measurement in this pass, and the pattern is now
    // well established: my guesses about the corpus's absences are unreliable,
    // so the guard is written from the read instead.
    expect(KJV_FLOW.includes('The LORD is my shepherd')).toBe(true);
    expect(KJV_FLOW.includes('the LORD is my shepherd')).toBe(false);
    // What keeps the divine name safe is that the detector only ever changes the
    // FIRST letter's case and compares against the corpus; it never lowercases
    // `LORD` or `GOD`, and a verse beginning with the divine name already
    // matches the corpus exactly, so it is skipped before any flip.
    expect(KJV_FLOW.includes('The LORD is my shepherd')).toBe(true);
    // AND THE EXCLUSION IS NOW NAME-AWARE, which it was not on first writing.
    // A blanket ALL-CAPS skip made this gate blind to `...abomination to the
    // LORD,` -- the very span that motivated it. Only its break test revealed
    // that, after I had written the blindness up as an acceptable cost. So
    // `LORD` and `GOD` no longer exempt a span; ADDED emphasis still does.
    expect(hasAddedEmphasis('the thoughts of the wicked are an abomination to the LORD,')).toBe(false);
    expect(hasAddedEmphasis('let the peace of God RULE in your hearts')).toBe(true);
    expect(hasAddedEmphasis('whatsoever things are TRUE')).toBe(true);
    expect(hasAddedEmphasis('KING OF KINGS, AND LORD OF LORDS')).toBe(true);   // stays with emphasis
    //
    // And a second reason a per-span check cannot be absolute: some sentences
    // exist in the corpus in BOTH cases, at different places.
    expect(KJV_FLOW.includes('The LORD is good')).toBe(true);
    expect(KJV_FLOW.includes('the LORD is good')).toBe(true);
  });

  it('is PROVEN-TO-CATCH — on the span that started this, and on the sweep\'s own miss', () => {
    // L94's Proverbs 15:26, the double-defect span no existing gate could see.
    expect(KJV_FLOW.includes('The thoughts of the wicked are an abomination to the LORD:')).toBe(true);
    expect(KJV_FLOW.includes('the thoughts of the wicked are an abomination to the LORD,')).toBe(false);
    expect(KJV_FLOW.includes('the thoughts of the wicked are an abomination to the LORD')).toBe(false);
    // And a case+terminal span the terminal sweep walked past for the same reason.
    expect(KJV_FLOW.includes('Let no man despise thy youth')).toBe(true);
    expect(KJV_FLOW.includes('let no man despise thy youth,')).toBe(false);
    // The restored forms this sweep produced, each read from the corpus:
    expect(KJV_FLOW.includes('Casting all your care upon him')).toBe(true);
    expect(KJV_FLOW.includes('casting all your care upon him')).toBe(false);
    expect(KJV_FLOW.includes('It is not good that the man should be alone')).toBe(true);
    expect(KJV_FLOW.includes('it is not good that the man should be alone')).toBe(false);
  });
});

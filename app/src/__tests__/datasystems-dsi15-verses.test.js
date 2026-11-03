// @vitest-environment node
// =============================================================================
// dsi15 — Weighed into named hands: knowing what the house actually owns
// =============================================================================
// Darrell forwarded an IT Brew newsletter to himself on 2026-10-06 with one word
// typed above the body: Lessons. The edition was "The ghost of assets past", and
// its lead item is about knowing what hardware and software an organisation
// actually owns — the forgotten machines still answering on the network, and the
// inventory list that still carries what the house no longer has.
//
// THIS LESSON'S PARTICULAR DANGER IS NOT A BORROWED NUMBER, BECAUSE IT STAKES
// NONE. It is the opposite failure: a module about registers that quietly
// misstates its own provenance would be committing, in its own text, the exact
// defect it exists to name. So the source is said out loud on every reader-facing
// surface — the newsletter named, the day named, the one word named, the full
// article named as unopened, and the two experts named exactly as the newsletter
// named them. The counted worklist in the-third-pile-is-a-worklist.test.js holds
// the other half of that admission (GAP 12 -> 13 with its reason and date).
//
// The second danger is the one DR-0100 names: hedging a reported thing into
// "nobody knows". The newsletter's definition and its four causes are stated
// PLAINLY and attributed plainly. Attribution is not a hedge, and the checks
// below require both halves.
//
// The edition also carried advertising (a HUMAN Security sponsor block with
// every figure in the email, Adobe shopper percentages, a conversion multiple)
// and a patch-note stat from an unrelated story. None of it is germane, none is
// taught, and a check below refuses all of it a foothold in any string of the
// module.
//
// Quote pairing is done by splitting on the quote character, never by a {10,}
// regex, and the verbatim sweep asserts its own count so an empty scan cannot
// read as a pass.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATASYSTEMS_MODULES, DATASYSTEMS_META } from '../lib/datasystems-course.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'dsi15-weighed-into-named-hands';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = DATASYSTEMS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

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
/** The corpus text a reference names (plain or range), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. Contiguous only. */
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// THE SPINE, pinned by literal text. Every span was read out of the corpus on
// disk before it was written, and one span stands for each anchored reference
// the lesson quotes. Ezra 8 was at ZERO occurrences across every anchor in the
// catalog before this module — counted, not assumed — and the obvious
// alternatives were already taken: Numbers 1 (numbering the people) by two other
// weeks, John 10:3 (the shepherd by name), 2 Samuel 24 and Luke 16:2.
const SPINE = [
  ['Ezra 8:25', 'weighed unto them the silver, and the gold, and the vessels, even the offering of the house of our God'],
  ['Ezra 8:28', 'Ye are holy unto the LORD; the vessels are holy also'],
  ['Ezra 8:29', 'Watch ye, and keep them, until ye weigh them before the chief of the priests and the Levites'],
  ['Ezra 8:33', 'was the silver and the gold and the vessels weighed in the house of our God by the hand of Meremoth the son of Uriah the priest'],
  ['Ezra 8:34', 'By number and by weight of every one: and all the weight was written at that time'],
  ['Numbers 4:32', 'by name ye shall reckon the instruments of the charge of their burden'],
  ['Numbers 4:49', 'every one according to his service, and according to his burden'],
  ['Exodus 38:21', 'This is the sum of the tabernacle, even of the tabernacle of testimony, as it was counted'],
  ['1 Chronicles 9:28', 'had the charge of the ministering vessels, that they should bring them in and out by tale'],
  ['Luke 15:8', 'Either what woman having ten pieces of silver, if she lose one piece, doth not light a candle, and sweep the house, and seek diligently till she find it?'],
  ['Luke 16:11', 'If therefore ye have not been faithful in the unrighteous mammon, who will commit to your trust the true riches?'],
  ['Proverbs 27:17', 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
  ['Deuteronomy 6:7', 'teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way'],
  ['Malachi 4:6', 'he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
];

// THE NEWSLETTER'S REPORT AS DATA, not as memory. These are the claims the
// lesson carries from the source, each with the bands that must carry it. The
// child band carries the four causes as a nine-year-old meets them (a drawer, a
// worker who left, a thrown-out machine, a list written down wrong) rather than
// the adult clause, by design.
const REPORTED = [
  { claim: 'IT Brew', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
  { claim: 'Mitch Berk', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'Ivanti', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'Henrique Teixeira', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'Saviynt', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'October 6, 2026', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
];

describe('dsi15 is in the course, numbered, and whole', () => {
  it('exists exactly once as the fifteenth module with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(DATASYSTEMS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(DATASYSTEMS_MODULES).toHaveLength(15);
    expect(DATASYSTEMS_MODULES[DATASYSTEMS_MODULES.length - 1].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims dsi15 exactly once, and the course numbers stay 1 to 15 with no gap', () => {
    const numbers = DATASYSTEMS_MODULES.map((m) => Number(/^dsi(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('the course meta counts fifteen modules rather than the fourteen it carried before', () => {
    expect(DATASYSTEMS_META.weeks).toBe(15);
    expect(DATASYSTEMS_META.weeks).toBe(DATASYSTEMS_MODULES.length);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = anchorRefs(L);
    expect(refs.length).toBe(14);
    // Named exactly, or by a same-chapter reference whose verses overlap — the
    // rule every-anchor-is-named-in-the-lesson itself applies.
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`)
        || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b)
        || L.lesson.includes(`${p.book} ${p.ch}:${p.a}`);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('every quoted reference is covered by the anchor, so Search it out can reach every verse the lesson stands on', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = anchorRefs(L).map(parse).filter(Boolean);
    const quoted = [...new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref)).filter(Boolean))];
    expect(quoted.length).toBeGreaterThanOrEqual(14);
    const uncovered = quoted.filter((r) => {
      const p = parse(r);
      return !p || !anchors.some((a) => a.book === p.book && a.ch === p.ch && a.a <= p.b && p.a <= a.b);
    });
    expect(uncovered).toEqual([]);
  });
});

describe('the newsletter is the source, said out loud, and never worn as our own', () => {
  it('names the forward, the day, the one word on it, and the newsletter by name', () => {
    expect(L.lesson).toMatch(/forwarded an IT Brew newsletter to himself with one word typed above the body: Lessons/);
    expect(L.lesson).toMatch(/On October 6, 2026/);
    expect(L.levels.child).toMatch(/It had one word typed on top of it: Lessons/);
  });

  it('every attribution the lesson speaks is the newsletter’s, in the lesson and in each band that reports it', () => {
    const missing = [];
    for (const { claim, where } of REPORTED) {
      for (const place of where) {
        if (!TEXTS[place].includes(claim)) missing.push(`${place}: ${claim}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('names each expert WITH his organisation where the claim is attributed, not merely somewhere in the band', () => {
    // THE HOLE THE STRIP PROOF FOUND, and it is the same trap as the figure
    // that appears twice. The `includes` check above passed with Mitch Berk's
    // attribution replaced by "One vendor executive", because each band names
    // him a SECOND time in its own disclosure passage ("we have not
    // independently verified that Mitch Berk or Henrique Teixeira said...").
    // A bare-name pin therefore proves nothing about the sentence that does the
    // attributing. The attributive form does: it occurs once per band, exactly
    // where the claim is made, and break 5 destroys it.
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: Berk attributed with his company`).toMatch(/Mitch Berk of Ivanti/);
      expect(TEXTS[k], `${k}: Teixeira attributed with his company`).toMatch(/Henrique Teixeira of Saviynt/);
    }
  });

  it('PROVEN TO CATCH: one attribution dropped is named by its place', () => {
    const wrong = { ...TEXTS, teen: TEXTS.teen.replaceAll('Henrique Teixeira', 'a strategist') };
    expect(wrong.teen).not.toBe(TEXTS.teen);
    const missing = [];
    for (const { claim, where } of REPORTED) {
      for (const place of where) if (!wrong[place].includes(claim)) missing.push(`${place}: ${claim}`);
    }
    expect(missing).toEqual(['teen: Henrique Teixeira']);
  });

  it('states the definition PLAINLY and attributes it — neither asserted as ours nor hedged into nobody-knows', () => {
    // DR-0100: under-claiming a reported thing is as much a failure of truth as
    // over-claiming it. The definition is stated flat, with the reporter named.
    // Straight apostrophe, deliberately: the KJV corpus on disk carries the
    // typographic one (and the apostrophe proof below pins that), but this
    // file's own authored prose uses the straight form the rest of
    // datasystems-course.js uses. Our voice and the corpus are not the same
    // register, and a pin must match the text that actually ships.
    expect(L.lesson).toMatch(/IT Brew described a ghost asset as a thing that cannot be accounted for and yet still shows up on the organisation's inventory list/);
    expect(L.levels.teen).toMatch(/IT Brew described a ghost asset as a thing that cannot be accounted for and yet still shows up on the organisation's inventory list/);
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: no false-skeptical hedge`).not.toMatch(/nobody (really )?knows|some say|it is contested|may or may not be/i);
    }
    // The child band carries the same claim in a nine-year-old's words.
    expect(L.levels.child).toMatch(/It means something you own on paper that you cannot find/);
  });

  it('carries the four causes, and says how many of them are theft rather than leaving the reader to guess', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: the drawer`).toMatch(/desk drawer/);
      expect(TEXTS[k], `${k}: the departing worker`).toMatch(/departed the organisation|who took it when they left the organisation/);
      expect(TEXTS[k], `${k}: the unrecorded disposal`).toMatch(/recycled and never deleted from the systems/);
      expect(TEXTS[k], `${k}: the unreconciled record`).toMatch(/accounting or systems error/);
    }
    expect(L.lesson).toMatch(/Only one of those four is theft/);
    expect(L.levels.child).toMatch(/Only one of those four is stealing/);
  });

  it('says in its own prose, and in every band, exactly what was NOT verified', () => {
    for (const k of PLACES) {
      // These phrases occur ONLY in the disclosure passage of each place. Pinned
      // deliberately against a phrase and not against a name: "IT Brew" appears
      // all over every band, so pinning it would pass with the disclosure
      // deleted — which is the trap the strip proof below exists to close.
      expect(TEXTS[k], `${k}: says the full article was never opened`)
        .toMatch(/did not read the full IT Brew article|never got to read the whole story/);
      expect(TEXTS[k], `${k}: says nobody telephoned the three organisations`)
        .toMatch(/did not telephone IT Brew, Ivanti or Saviynt|never called IT Brew, or Ivanti, or Saviynt/);
    }
    // And the positive half of the same honesty: the lesson stakes no statistic,
    // so it says so rather than leaving a reader to wonder which number is soft.
    expect(L.lesson).toMatch(/This module stakes no statistic at all/);
    expect(L.levels.senior).toMatch(/stakes no statistic whatever/);
  });

  it('PROVEN TO CATCH: deleting the not-verified passage from one band is seen', () => {
    // Pinned against the live band, not a copy, so a reworded passage cannot
    // leave this proving nothing.
    const stripped = L.levels.youth.replace(/One honest limit, said plainly:[\s\S]*?this module states none\./, '');
    expect(stripped).not.toBe(L.levels.youth);
    expect(/did not read the full IT Brew article/.test(L.levels.youth)).toBe(true);
    expect(/did not read the full IT Brew article/.test(stripped)).toBe(false);
    // The trap, demonstrated rather than described: the publisher's NAME
    // survives the strip, so a check pinned on it would have read green.
    expect(/IT Brew/.test(stripped)).toBe(true);
  });

  it('teaches none of the edition’s advertising, and no figure of any kind reaches the teaching', () => {
    expect(L.lesson).toMatch(/Everything else in that email is advertising, and none of the advertising is taught here/);
    const all = EVERY_STRING.join(' ');
    for (const ad of ['HUMAN Security', 'Adobe', 'agentic', 'Bain', 'Morning Brew', 'CollabWORK', 'Anthropic', 'Amodei', 'Hugging Face', 'ArmorCode', 'Liquibase']) {
      expect(all, `the ad or unrelated item "${ad}" reached the teaching`).not.toContain(ad);
    }
    // THE WHOLE GROUND of this lesson's entry on the counted worklist: it stakes
    // no figure, so there is no percentage or money figure to be wrong about.
    // Every number in that edition was sponsor copy or another story's stat.
    for (const k of PLACES) {
      expect(TEXTS[k], `${k} carries a percentage`).not.toMatch(/\d+(\.\d+)?\s*(percent|%)/);
      expect(TEXTS[k], `${k} carries a money figure`).not.toMatch(/\$[\d,]/);
    }
  });

  it('traces to the real surface it teaches, not to a painted one', () => {
    // Reality-trace (DR-0061/P15): the lesson sends the reader at Inventory,
    // which is a real system of record on disk — an append-only movement ledger
    // with a derived on-hand (app/src/lib/inventory.js) — and the lesson teaches
    // its actual behaviour, including that the count governs over the record.
    expect(L.inApp).toMatch(/Open Inventory/);
    expect(L.lesson).toMatch(/append-only ledger of movements/);
    expect(L.lesson).toMatch(/DERIVED/);
    expect(L.lesson).toMatch(/received, used, adjusted, transferred out, transferred in/);
    expect(L.lesson).toMatch(/the shelf governs and the correction is itself a recorded movement/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(40);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(40);
  });

  it('every double-quoted span carries a reference: nothing of ours is dressed as Scripture', () => {
    // The newsletter's experts are attributed in our own prose rather than
    // quotation-marked, precisely so that no double-quoted span in this module
    // is anything but the Word.
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'By number and by weight of every one: and all the weight was written at that time',
      'By number and by measure of every one: and all the weight was written at that time',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.lesson.replace(
      '"by name ye shall reckon the instruments',
      '"By name ye shall reckon the instruments',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken])).toEqual([
      '(Numbers 4:32) is not the verse: By name ye shall reckon the instruments of the charge of their burden',
    ]);
  });

  it('PROVEN TO CATCH: a straight apostrophe where the corpus carries the typographic one is not the verse', () => {
    // The fault class a sibling builder found twelve of in one draft. This
    // corpus writes `king’s`, not `king's`, so a span retyped from memory fails
    // even when every word is right. Demonstrated on a real corpus verse rather
    // than asserted: Proverbs 17:6 carries `Children’s children`.
    const verse = corpusText('Proverbs 17:6');
    expect(verse).toContain('Children’s children');
    expect(verse).not.toContain("Children's children");
    const planted = 'He wrote "Children\'s children are the crown of old men" (Proverbs 17:6).';
    expect(verbatimFaults([planted]).length).toBe(1);
    const correct = 'He wrote "Children’s children are the crown of old men" (Proverbs 17:6).';
    expect(verbatimFaults([correct])).toEqual([]);
  });

  it('PROVEN TO CATCH: planting Yahweh inside a quotation is refused', () => {
    const planted = (texts) => {
      const out = [];
      for (const t of texts) for (const { inside, ref } of quotedPairs(t)) if (/\bYahweh\b/.test(inside)) out.push(ref || 'no ref');
      return out;
    };
    expect(planted(EVERY_STRING)).toEqual([]);
    const broken = L.lesson.replace('Ye are holy unto the LORD', 'Ye are holy unto Yahweh');
    expect(broken).not.toBe(L.lesson);
    expect(planted([broken])).toEqual(['Ezra 8:28']);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a decision-record identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

  it('no generic God, GOD or LORD in our authored voice', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('the offering of the house of our God');
    expect(inQuotes).toContain('Ye are holy unto the LORD');
    expect(inQuotes).toContain('weighed in the house of our God');
  });

  it('names Yahweh in our prose in every band', () => {
    for (const k of PLACES) expect(ourVoice(TEXTS[k]), k).toMatch(/\bYahweh\b/);
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the teen friend line names teen and only teen, while the pooled check still reads green', () => {
    const teen = L.levels.teen;
    const friend = /Friends, tell one friend this week one thing this lesson showed you about the difference[^.]*\./.exec(teen);
    expect(friend, 'the teen band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(friend[0], '') } };
    expect(stripped.levels.teen).not.toBe(teen);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });

  it('carries the skill and the rhythm in every band, not only the three addresses', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: listen to the end`).toMatch(/[Ll]isten (all the way )?to the end|[Ll]isten all the way/);
      expect(TEXTS[k], `${k}: retell`).toMatch(/in (their|your) own words/);
      expect(TEXTS[k], `${k}: the four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(TEXTS[k], `${k}: one friend this week`).toMatch(/one friend this week/);
      expect(TEXTS[k], `${k}: the aim`).toMatch(/until we see that Yahweh has been right/);
    }
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

  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of BANDS) {
      expect(TEXTS[k].startsWith('WEIGHED INTO NAMED HANDS — knowing what the house actually owns.'), k).toBe(true);
    }
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(13);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('PROVEN TO CATCH: an explicit ordinal marker dropped into the prose restarts the count and is seen', () => {
    // An explicit marker switches the capitalised-lead pass off entirely
    // (lesson-format's `hasExplicit`), so the whole lesson collapses to the one
    // number the marker names — here a THIRD with no first or second before it.
    const broken = L.lesson.replace('EZRA WEIGHED IT TWICE.', 'THIRD, EZRA WEIGHED IT TWICE.');
    expect(broken).not.toBe(L.lesson);
    const ns = formatLessonText(broken).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    const contiguousFromOne = ns.length > 0 && ns[0] === 1 && ns.every((v, i) => i === 0 || v === ns[i - 1] + 1);
    expect(contiguousFromOne).toBe(false);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as an explicit marker', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
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

describe('the two stories are the lesson’s own, on its own spine', () => {
  it('dsi15 carries two titled parables, each with a scene and a verse of this lesson’s anchor', async () => {
    const SIDE = (await import('../lib/lesson-stories.json')).default;
    const mine = SIDE.datasystems[ID];
    expect(mine, 'dsi15 has no stories').toBeTruthy();
    expect(mine).toHaveLength(2);
    const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
    const anchors = new Set(anchorRefs(L));
    for (const s of mine) {
      // Every entry in lesson-stories.json must be kind 'parable' — the census
      // gate in lesson-completeness.test.js refuses any other kind in this file.
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(words(s.body)).toBeGreaterThanOrEqual(100);
      expect(anchors.has(s.verse), `${s.verse} is not in dsi15's anchor`).toBe(true);
      expect(s.body).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
    }
    expect(mine.map((s) => s.title)).toEqual(['The Second Weighing', 'The Key She Never Gave Back']);
    // Both stand on THIS lesson's spine — a counted handover and an account
    // nobody closed — rather than on a neighbouring module's subject.
    expect(mine[0].body).toMatch(/count going out is what makes the count coming back mean anything/);
    expect(mine[1].body).toMatch(/belonged to nobody, which is why nobody closed it/);
  });
});

// @vitest-environment node
// =============================================================================
// L177 — Two Minds, and the One You Feed Is the One That Runs You
// =============================================================================
// Darrell spoke this into the channel on 2026-09-18 and marked it a lesson
// twice ("According to the word, this is a lesson" / "Lesson"). His own
// sequence is the spine of it:
//   everyone is double minded — a spiritual mind and a carnal mind — and
//   hardly anybody taps the spiritual one because nobody taught the method;
//   the method is that spiritual things are thought through by CAPTURING THE
//   DATA, which takes two layers, the one that observes and the one that acts
//   on the observation; you assume you know the truth before you act; testing
//   the thought means acting on it, which turns it into an experience; then you
//   pull the kinds of thought that give the outcomes His Word names and cast
//   down the kinds He says to cast down.
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. THOUGHT-STOPPING TAUGHT AS THE GOAL. He was explicit that you cannot
//      stop thoughts arriving and nobody ever has. A band that landed on
//      suppression would crush the reader it was written for, so every band
//      must carry OCCUPANCY instead — fewer get through because the room is
//      already taken.
//   2. THE CARNAL MIND TREATED AS A FIXER-UPPER. Romans 8:7 says it is not
//      subject to His law, "neither indeed can be". Every band must carry that
//      clause AND say what follows from it: the work is choosing which mind
//      runs, never repairing the one that cannot be repaired.
//   3. SHAME INSTEAD OF A CLASSROOM. Psalms 51:5 alone leaves a reader in
//      shame. Verse 6 puts the wisdom IN the hidden part. Both are required in
//      every band, as a pair.
//   4. HIS "SUBCONSCIOUS" SWAPPED FOR THE WORD'S "HEART". He named the
//      subconscious as his reading of the biblical heart. That is HIS bridge
//      for a modern reader and must never replace the Word's own word, so both
//      are asserted and the Word's is kept in front (DR-0098 / DR-0076).
//   5. ONE STUDY VERSE DROPPED. He reached for one, phrased it one way, then
//      corrected himself to the other — and BOTH are genuinely in the Word
//      (2 Timothy 2:15 and 1 Thessalonians 4:11). Keeping only one would have
//      silently edited what he said, so both are required in every band.
//   6. THE SLAVERY LINE SOFTENED INTO METAPHOR. It is not one. Every band must
//      say the natural mind keeps a man a slave and that the spiritual mind
//      shows him a way of escape that has been MADE.
//
// Check-writing rules in force: every claim check reads OUR prose with
// quotations AND their reference parentheses stripped, so no check can be
// answered by the verse beside it; no alternation branch is a title keyword
// (minds, feed, runs are ALL title keywords here); one claim per test; and
// every quoted span in the WHOLE module — benefits, quiz options,
// explanations, talking points — is walked, not only the five reader texts.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';
import quotationIntegrity from '../lib/quotation-integrity-baseline.json';
import bandDiff from '../lib/band-differentiation-baseline.json';

const ID = 'll177-two-minds-and-the-one-you-feed-is-the-one-that-runs-you';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);
const READER = { lesson: L.lesson, bigIdea: L.bigIdea, inApp: L.inApp, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i); else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (text) => {
  const out = []; SPAN_WITH_REF.lastIndex = 0; let m;
  while ((m = SPAN_WITH_REF.exec(text))) out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  return out;
};
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};

const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

// The movement count each band renders, MEASURED and pinned per band. Not "at
// least N": lesson-format.js only promotes a standalone caps clause of 2-9
// words that heads real prose, so a heading that runs long, carries an em dash,
// or sits glued behind a reference parenthesis is dropped from the page while
// every other gate stays green. Three were caught that way while this lesson
// was written — one promoted caps EMPHASIS, one 10-word heading, and one glued
// behind (Ephesians 4:23).
const SECTIONS = { adult: 24, child: 23, youth: 24, teen: 24, senior: 25 };

// The forty things this lesson must TEACH, each read from our prose alone.
// Every one lands in all five texts, measured before the check was written.
const CLAIMS = [
  ['everyone carries two minds, named', /two minds|two ways of thinking|spiritual mind and a carnal|carnal mind/i],
  ['the instability is not confined to one area', /ALL his ways|all of them|not only in the one|whole chair|never confines itself|reaches the marriage/i],
  ['the remedy is cleansing rather than amputation', /nothing is amputated|nothing gets chopped|not (?:amputated|cut out)|purify rather than remove|purify, not|cleaned, not/i],
  ['minding is an activity rather than an inheritance', /is a verb|as a verb|something you do/i],
  ['the carnal mind can never submit', /CAN be|never submit|will never submit|cannot obey/i],
  ['so the work is choice rather than repair', /which mind|not (?:trying to )?fix that mind|from repair to choice|relocates|moves the whole problem/i],
  ['one layer observes and another acts', /layer|watching job|one that watches/i],
  ['most people run only the acting layer', /only the second|layer two alone|second one|nearly everybody|overwhelming majority/i],
  ['you cannot cast down what you never saw', /never (?:saw|detected)|cannot cast down what|[Cc]asting down (?:requires|presupposes) (?:seeing|detection)/],
  ['a felt thought is not data', /not data|is weather|got away/i],
  ['a strong hold is a structure rather than a mood', /structure|fort/i],
  ['you assume you know the truth before acting', /assume you (?:already )?know|presume|already have the truth|think you already know/i],
  ['the test is the act', /acting on it|act on it|acting upon it|doing what it says/i],
  ['tasting comes before seeing', /[Tt]ast(?:e|ing) (?:comes |precedes )?(?:before|first|precedes)|Taste first|Taste, then see|Tasting comes before/],
  ['the hearer deceives himself rather than others', /own selves|fooling yourself|same person|runs back on itself|himself/i],
  ['the mirror reading was lost before the door', /before (?:he reached )?the door|reached the door|got to the door/i],
  ['the filters are named rather than left to taste', /filters|criteria|list/i],
  ['renewing makes the proving possible', /makes the proving possible|renewing is what|THEN you can prove|lets you test it/i],
  ['nobody can stop thoughts arriving', /cannot stop|can stop thoughts|cannot be (?:stopped|terminated)|nobody ever has|Nobody can/i],
  ['what changes is occupancy rather than suppression', /occupancy|less room|already full of/i],
  ['study happens with or without reading', /still studying|study still happens|studying too|study whatever you call it|is study/i],
  ['discernment comes by use', /by reason of USE|by use|repetition/i],
  ['both study verses are kept', /[Bb]oth (?:of them )?(?:are|exist)|keeping both|keeps both|both are really/i],
  ['the natural mind keeps a slave', /slave|servitude|in service/i],
  ['the spiritual mind shows another arrangement exists', /another (?:way|arrangement)|better way|there is another/i],
  ['the way of escape is made rather than imagined', /is MADE|is made|built|puts it there/i],
  ['the hidden part is where wisdom is taught', /hidden part/i],
  ['the search is handed back to Him', /Search ME|Search me|invitation|asking Him to (?:do|look)/i],
  ['the Word says HEART and his word is a bridge', /subconscious/i],
  ['without implementation you only assume you were right', /assume(?:d|ption)? (?:you|that you|of correctness)|only assume|just think you were right/i],
  ['abiding is a place rather than a feeling', /place you stay|a place rather than|location|Abide means stay|is a place/i],
  ['unrun code is an opinion', /never (?:actually )?run|syntax highlighting|opinion with/i],
  ['both men in the parable heard the same words', /same (?:words|sayings)|identical words|Same input|Identical input/i],
  ['finish it and document it for the next person', /document|write (?:it |down )?(?:plain|what happened)|next person|coming after/i],
  ['age was never the qualification', /age|young/i],
  ['the new spirit is given before the walking', /giving (?:comes )?first|given, not earned|before|precedes/i],
  ['you go to His side rather than the reverse', /His side|not coming (?:over )?to yours|not moving to your/i],
  ['His law converts rather than merely restricts', /CONVERTING|converting|not (?:described as )?a fence|only fencing/i],
  ['the natural man cannot receive it', /cannot receive|unable to receive|receiveth not|not receive/i],
  ['we have the mind of Christ', /HAVE it|HAVE the mind|have it/i],
];

describe('L177 — the shape of the lesson', () => {
  it('is mounted, and the painted week count moved with it', () => {
    expect(L, `${ID} is not in the series`).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries all four age bands', () => {
    for (const b of BANDS) expect(String(L.levels[b] || '').trim().length, `${b} is empty`).toBeGreaterThan(400);
  });

  it('has no band below the coverage floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('adds no entry to the coverage debt', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
  });

  it('adds no entry to the reading-level debt', () => {
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
  });

  it('adds no entry to the title-in-narrative debt', () => {
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
  });

  it('adds no entry to the quotation debt', () => {
    expect(Object.keys(quotationIntegrity.elided)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.recited)).not.toContain(ID);
  });

  it('runs a monotone reading ladder from child to senior', () => {
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('teen'), 'teen does not read above child').toBeGreaterThan(g('child'));
    expect(g('senior'), 'senior does not read above teen').toBeGreaterThan(g('teen'));
  });

  it('keeps the child band under the ceiling a NEW lesson is held to', () => {
    expect(fleschKincaidGrade(ourProseOnly(L.levels.child))).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('opens every band on the name of its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('writes four DIFFERENT bands rather than one repeated four times', () => {
    const m = measureDifferentiation(L);
    expect(m, 'the lesson is not being measured at all').toBeTruthy();
    expect(m.worst, `bands too alike: ${JSON.stringify(m.pairs)}`).toBeLessThan(DIFF_CEILING);
    expect(Object.keys(bandDiff.duplicated)).not.toContain(ID);
  });

  it('renders every movement the author wrote, in every band', () => {
    for (const k of ALL) {
      expect(formatLessonText(TEXTS[k]).sectionCount, `${k} lost a movement to the renderer`).toBe(SECTIONS[k]);
    }
  });

  it('promotes no caps EMPHASIS into a section heading', () => {
    // A real catch while writing this: "NEITHER INDEED CAN BE." was a four-word
    // emphasis inside the prose and the renderer promoted it to a movement.
    // These are the emphases this lesson uses; none of them may head a section.
    // THE HIDDEN PART is deliberately NOT on this list: it is a real movement
    // heading in the child band and a caps emphasis in the others, which is
    // allowed. Only clauses that are emphasis in EVERY band belong here.
    const EMPHASIS = ['NEITHER INDEED CAN BE', 'BY REASON OF USE', 'CONVERTING THE SOUL'];
    const bad = [];
    for (const k of ALL) {
      for (const h of formatLessonText(TEXTS[k]).items.filter((i) => i.kind === 'heading')) {
        for (const e of EMPHASIS) if (h.text.includes(e)) bad.push(`${k}: ${h.text}`);
      }
    }
    expect(bad, `caps emphasis promoted to a heading:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the section pin can SEE a heading the renderer drops (proven-to-catch)', () => {
    const broken = TEXTS.senior.replace('THE TEST IS THE ACT.', 'THE TEST IS THE ACT, AND THE ACT ALWAYS COSTS SOMETHING REAL.');
    expect(broken).not.toBe(TEXTS.senior);
    expect(formatLessonText(broken).sectionCount).toBeLessThan(SECTIONS.senior);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });

  it('carries the authored furniture a lesson is read and run from', () => {
    expect(L.benefits.length).toBe(15);
    expect(L.quiz.questions.length).toBe(15);
    expect(L.facilitator.talkingPoints.length).toBe(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length, `${q.q.slice(0, 40)} does not offer three options`).toBe(3);
      expect(q.options[q.answer], 'the answer index points at nothing').toBeTruthy();
    }
  });
});

describe('L177 — His words, exactly as He said them', () => {
  it('quotes every referenced span in the WHOLE module verbatim, not only the reader texts', () => {
    const bad = [];
    walkStrings(L, '', (node, path) => {
      for (const s of spansOf(node)) {
        const text = versesOf(s.book, s.ch, s.vs);
        if (text == null) { bad.push(`${path}: ${s.book} ${s.ch}:${s.vs} does not resolve`); continue; }
        if (!norm(text).includes(norm(s.quote))) bad.push(`${path}: ${s.book} ${s.ch}:${s.vs} — ${s.quote.slice(0, 60)}`);
      }
    });
    expect(bad, `spans that are not His words, anywhere in the module:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the verbatim walk can SEE the exact misquotation it caught here (proven-to-catch)', () => {
    // The real catch: this lesson's first draft wrote Jeremiah 17:10 as "even
    // to TRY every man according to his ways". The KJV says "even to GIVE".
    // It had spread to all five bands, a benefit and a quiz explanation — and
    // two of those seven sit outside the reader texts.
    const wrong = 'and he said, "I the LORD search the heart, I try the reins, even to try every man according to his ways" (Jeremiah 17:10)';
    const s = spansOf(wrong)[0];
    expect(norm(versesOf(s.book, s.ch, s.vs)).includes(norm(s.quote))).toBe(false);
    // And the corpus carries the right one.
    for (const k of ALL) expect(TEXTS[k], `${k} has the wrong verb in Jeremiah 17:10`).toContain('even to give every man according to his ways');
  });

  it('leaves no quoted span unreferenced ANYWHERE in the module', () => {
    const bad = [];
    walkStrings(L, '', (node, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(node))) if (!m[2]) bad.push(`${path}: ${m[1].slice(0, 60)}`);
    });
    expect(bad, `quoted spans carrying no reference:\n${bad.join('\n')}`).toEqual([]);
  });

  it('puts no double quotation marks around HIS words rather than the Word’s', () => {
    // A double-quoted span in this corpus MEANS Scripture. Darrell's own
    // phrases appear unquoted, or the strongest guarantee the gate makes is
    // diluted. Three were caught this way while the lesson was written.
    const bad = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*"/g) || []) {
        // NOT "neither indeed can be": that clause is Romans 8:7's own wording
        // and belongs inside quotation marks. Its first draft here listed it,
        // and this check reported the lesson for quoting Scripture correctly.
        if (/capture the data|think good thoughts|born and shaped in iniquity/i.test(q)) bad.push(`${path}: ${q}`);
      }
    });
    expect(bad, `his words wearing Scripture's quotation marks:\n${bad.join('\n')}`).toEqual([]);
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
    });
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('claims no paraphrase anywhere in the module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => { if (/paraphras/i.test(node)) found.push(path); });
    expect(found, `fields claiming a paraphrase: ${found.join(', ')}`).toEqual([]);
  });

  it('never capitalises an adversary name anywhere in the module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
        if (node.includes(bad)) found.push(`${path}: ${bad}`);
      }
    });
    expect(found, `capitalised adversary names:\n${found.join('\n')}`).toEqual([]);
  });

  it('says Yahweh in its own prose in every reader field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(ours(v), `${k} never names Him by His covenant name in our own voice`).toMatch(/Yahweh/i);
    }
  });

  it('never says the generic name in its own prose in any reader field', () => {
    const bad = [];
    for (const [k, v] of Object.entries(READER)) {
      for (const m of ours(v).match(/.{0,24}\bGod\b.{0,16}/g) || []) {
        if (!/of God|word of God|will of God|Son of God/.test(m)) bad.push(`${k}: ${m.trim()}`);
      }
    }
    expect(bad, `generic uses in our own prose:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves the KJV generic name untouched inside its quotations (DR-0076 bright line)', () => {
    for (const k of ALL) {
      expect(TEXTS[k], `${k} has scrubbed the KJV's own wording`).toContain('Draw nigh to God, and he will draw nigh to you');
    }
  });

  it('recites no record id to the reader', () => {
    for (const [k, v] of Object.entries(READER)) expect(v, `${k} recites a record id`).not.toMatch(/DR-\d{4}/);
  });

  it('names every anchor reference somewhere the reader meets it', () => {
    const body = [L.lesson, L.bigIdea, ...BANDS.map((b) => L.levels[b]), ...L.benefits].join(' ');
    const missing = L.anchor.ref.split(';').map((s) => s.trim()).filter((r) => r && !body.includes(r));
    expect(missing, `anchors never named: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('L177 — the verses the whole lesson rests on are in every band', () => {
  const REQUIRED = [
    ['the double minded man', 'A double minded man is unstable in all his ways'],
    ['the remedy in the same letter', 'purify your hearts, ye double minded'],
    ['the two directions of minding', 'but they that are after the Spirit the things of the Spirit'],
    ['what each mind produces', 'For to be carnally minded is death; but to be spiritually minded is life and peace'],
    ['the clause that settles it', 'neither indeed can be'],
    ['the weapons that are not carnal', 'the weapons of our warfare are not carnal'],
    ['casting down and captivity', 'bringing into captivity every thought to the obedience of Christ'],
    ['prove all things', 'Prove all things; hold fast that which is good'],
    ['taste and see', 'O taste and see that the LORD is good'],
    ['doers and not hearers only', 'not hearers only, deceiving your own selves'],
    ['the man at the glass', 'straightway forgetteth what manner of man he was'],
    ['the filters', 'whatsoever things are true, whatsoever things are honest'],
    ['the renewing of the mind', 'be ye transformed by the renewing of your mind'],
    ['affection set above', 'Set your affection on things above'],
    ['the mind stayed on Him', 'whose mind is stayed on thee'],
    ['senses exercised by use', 'by reason of use have their senses exercised'],
    ['study to shew thyself approved', 'Study to shew thyself approved unto God'],
    ['study to do your own business', 'study to be quiet, and to do your own business'],
    ['the law of the Spirit of life', 'hath made me free from the law of sin and death'],
    ['the yoke of bondage', 'be not entangled again with the yoke of bondage'],
    ['the way to escape', 'make a way to escape, that ye may be able to bear it'],
    ['shapen in iniquity', 'Behold, I was shapen in iniquity'],
    ['wisdom in the hidden part', 'in the hidden part thou shalt make me to know wisdom'],
    ['search me and know my heart', 'Search me, O God, and know my heart'],
    ['keep thy heart', 'Keep thy heart with all diligence'],
    ['who can know it', 'The heart is deceitful above all things'],
    ['He searches the heart', 'I the LORD search the heart, I try the reins'],
    ['abide in me', 'Abide in me, and I in you'],
    ['his words abiding in you', 'If ye abide in me, and my words abide in you'],
    ['the house on the rock', 'I will liken him unto a wise man, which built his house upon a rock'],
    ['the house on the sand', 'shall be likened unto a foolish man, which built his house upon the sand'],
    ['write the vision plain', 'Write the vision, and make it plain upon tables'],
    ['the four children', 'God gave them knowledge and skill in all learning and wisdom'],
    ['ten times better', 'ten times better than all the magicians and astrologers'],
    ['able to deliver us', 'is able to deliver us from the burning fiery furnace'],
    ['but if not', 'But if not, be it known unto thee, O king'],
    ['the handmaid of the Lord', 'Behold the handmaid of the Lord'],
    ['let no man despise thy youth', 'Let no man despise thy youth'],
    ['a new heart and a new spirit', 'a new spirit will I put within you'],
    ['and cause you to walk', 'and cause you to walk in my statutes'],
    ['renewed in the spirit of your mind', 'be renewed in the spirit of your mind'],
    ['the law of the LORD is perfect', 'The law of the LORD is perfect, converting the soul'],
    ['the natural man receiveth not', 'But the natural man receiveth not the things of the Spirit of God'],
    ['he that is spiritual judgeth', 'But he that is spiritual judgeth all things'],
    ['we have the mind of Christ', 'But we have the mind of Christ'],
  ];
  for (const [what, span] of REQUIRED) {
    it(`carries ${what} in every band`, () => {
      for (const k of ALL) expect(TEXTS[k], `${k} is missing ${what}`).toContain(span);
    });
  }
});

describe('L177 — what the lesson must TEACH, read from our prose alone', () => {
  for (const [what, re] of CLAIMS) {
    it(what, () => {
      const missing = ALL.filter((k) => !re.test(OURS[k]));
      expect(missing, `${what} — absent from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('the claim checks read OUR words, never the verse beside them (proven-to-catch)', () => {
    // "occupancy" is our word and appears in our prose; "double minded" is the
    // QUOTATION's. A claim check answerable by the quotation could pass a band
    // that quoted James 1:8 and taught nothing about it.
    expect(TEXTS.adult).toContain('A double minded man is unstable in all his ways');
    expect(OURS.adult.includes('A double minded man is unstable in all his ways')).toBe(false);
  });

  it('keeps BOTH study verses, because he said one and corrected himself to the other', () => {
    for (const k of ALL) {
      expect(TEXTS[k], `${k} dropped the workman`).toContain('Study to shew thyself approved unto God');
      expect(TEXTS[k], `${k} dropped your own business`).toContain('study to be quiet, and to do your own business');
    }
  });

  it('keeps Psalms 51:5 and 51:6 as a PAIR, so no band leaves a reader in shame', () => {
    for (const k of ALL) {
      const five = TEXTS[k].indexOf('Behold, I was shapen in iniquity');
      const six = TEXTS[k].indexOf('in the hidden part thou shalt make me to know wisdom');
      expect(five, `${k} is missing the shaping`).toBeGreaterThan(-1);
      expect(six, `${k} leaves the shaping without the hidden part`).toBeGreaterThan(five);
    }
  });

  it('never lets SUPPRESSION stand as the teaching, in any band', () => {
    // Found by the break harness, which is the point of running one: swapping
    // our word "occupancy" for "suppression" in one band left every check
    // green, because another band still carried an accepted paraphrase of the
    // claim. The teaching is not merely that occupancy is mentioned somewhere
    // — it is that suppression is REFUSED wherever it is named. So every
    // mention of suppressing must sit inside a denial.
    const bad = [];
    for (const k of ALL) {
      const re = /suppress\w*/gi;
      let m;
      while ((m = re.exec(OURS[k]))) {
        const around = OURS[k].slice(Math.max(0, m.index - 70), m.index + 70);
        if (!/not suppression|rather than suppression|suppression (?:exhausts|fails)|not (?:a )?suppress/i.test(around)) {
          bad.push(`${k}: …${around.trim()}…`);
        }
      }
    }
    expect(bad, `suppression taught rather than refused:\n${bad.join('\n')}`).toEqual([]);
    // And the denial-nearby rule above is not enough on its own, which the
    // harness proved: a band rewritten to RECOMMEND suppression still had the
    // refusal sitting in the next sentence, inside the window. So the
    // endorsing constructions are named and forbidden outright.
    const ENDORSES = /get good at suppress|learn to suppress|suppression is the (?:goal|point|skill|whole)|whole skill/i;
    const endorsed = ALL.filter((k) => ENDORSES.test(OURS[k]));
    expect(endorsed, `these bands recommend suppression: ${endorsed.join(', ')}`).toEqual([]);
  });

  it('the suppression check can SEE the teaching inverted (proven-to-catch)', () => {
    const inverted = 'What changes is that you get good at suppression, which is the whole skill.';
    const re = /suppress\w*/gi;
    const m = re.exec(inverted);
    const around = inverted.slice(Math.max(0, m.index - 70), m.index + 70);
    expect(/not suppression|rather than suppression|suppression (?:exhausts|fails)|not (?:a )?suppress/i.test(around)).toBe(false);
    // The second rung, proven against the exact text the harness produced.
    const ENDORSES = /get good at suppress|learn to suppress|suppression is the (?:goal|point|skill|whole)|whole skill/i;
    expect(ENDORSES.test('That is how you get good at suppression, which is the whole skill.')).toBe(true);
    for (const k of ALL) expect(ENDORSES.test(OURS[k]), `${k} recommends suppression`).toBe(false);
  });

  it('keeps the Word’s own word HEART in front of his modern word for it', () => {
    // DR-0098 / DR-0076: his "subconscious" is a bridge for a modern reader and
    // must never stand in place of Scripture's term. Both appear, and the
    // Word's own word is present in every band.
    for (const k of ALL) {
      expect(OURS[k], `${k} never offers his bridge`).toMatch(/subconscious/i);
      expect(TEXTS[k], `${k} lost the Word's own word`).toContain('Keep thy heart with all diligence');
    }
  });
});

// @vitest-environment node
// =============================================================================
// L261 — "Add Not, Diminish Not — the Giants, and the Edge of What Is Written"
// =============================================================================
// TWO SENDINGS, ONE LESSON. Darrell sent two links INSIDE the PoeTech app,
// hours apart, both on Genesis 6 and the giants of Canaan, and they pull
// opposite ways. `agent_inbox` row 031a898a-b98b-484e-8d06-0962dede6316
// (research item 12b9f985-c890-4ff7-a993-8743915ae972) carried a conversation
// between Michael Knowles and his guest Tim Alberino building an Enoch-sourced
// cosmology — the "sons of God" as a descending angelic faction, the giants as
// hybrid offspring, a demon defined as the disembodied spirit of a dead giant.
// `agent_inbox` row bee78650-c5bc-4701-9cb9-85a8faef8770 (research item
// e2174686-cb1f-4898-977a-829d9ae45ba5) carried a video teaching whose speaker
// the research road did not name, who identifies himself in it as a pastor, and
// who argues the Rephaim were formidable but fully human and the darkness was
// idolatry. The road returned, for each, an auto-generated YouTube caption
// transcript fetched on the NAS (that route carries NO timestamps) plus a
// summary; no reading was made.
//
// WHY ONE LESSON AND NOT A BOTH-SIDES PIECE (DR-0098, whose own worked example
// IS Genesis 6 "sons of God" read through Job 1:6 / 38:7). The two sendings are
// never staged against each other for a reader to score. They are held to ONE
// measure — Deuteronomy 4:2, add not AND diminish not — whose two directions
// are exactly the two failures in front of us, with Matthew 22:29 naming the
// single root. The dispute is NAMED only to educate past it, by the Word.
//
// WHAT THIS FILE PINS, and each pin is a thing that could go wrong:
//   * the measure is carried in EVERY band (Deuteronomy 4:2 + Matthew 22:29),
//     because a reader reads one band and a both-sides drift would show up as
//     that measure going missing from one of them;
//   * the Word defines its own phrase: Job 1:6 and Job 38:7 in every band;
//   * the EDGE is stated in every band — no verse ties Og or Goliath to Genesis
//     6, and the lesson says so instead of filling the silence (Deuteronomy
//     29:29; Colossians 2:18);
//   * the size is NOT softened: Deuteronomy 2:10 and 2:11 bind "accounted
//     giants" to "tall, as the Anakims" in one breath, and under-claiming a
//     plain statement is its own untruth (DR-0100);
//   * First Enoch is reported, never taught as the Word (Jude 1:14 beside
//     2 Timothy 3:16);
//   * no lesson text EVER says a demon is the spirit of a dead giant, while the
//     appointed time that IS in the text is kept (Matthew 8:29; 2 Peter 2:4);
//   * the watchers are never capitalised as a proper name, although BOTH source
//     transcripts capitalise them — the house typography is senior to the source
//     (CLAUDE.md), and quoted Scripture stays untouched.
//
// WHAT THE CHECKS MEASURED BEFORE COMMIT (scratchpad gate over the draft,
// before it touched the catalog): 323 referenced spans, 0 verbatim faults;
// fullness 0.54 / 0.60 / 0.72 / 0.91 against floors 0.50 / 0.60 / 0.60 / 0.60;
// authored-prose grades child 0.83, youth 4.25, teen 6.98, senior 8.80 (the
// ladder rises by more than one at each step; the child band is under 5.0);
// worst band overlap 0.05; every band names the lesson; every place carries all
// three directions; no generic "God" in our own prose in any band; no straight
// apostrophe anywhere.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};
const BANDS = ['child', 'youth', 'teen', 'senior'];
const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (L) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');
  return spans;
};
const verbatimFaults = (L) => {
  const bad = [];
  for (const s of spansOf(L)) {
    const nums = [];
    for (const part of s.label.split(',')) {
      const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
      else if (part.trim()) nums.push(Number(part.trim()));
    }
    const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
    if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
  }
  return bad;
};

const ID = 'll261-add-not-diminish-not-the-giants-and-the-edge-of-what-is-written';
const PREV = 'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"for the battle is the LORD’s, and he will give you into our hands" (1 Samuel 17:47).';

// THE SPINE, carried in every band. A both-sides drift, or a band quietly
// losing the edge, shows up here first.
const IN_EVERY_BAND = [
  ['the one measure, both directions', 'Deuteronomy', 4, 2, 'Ye shall not add unto the word which I command you, neither shall ye diminish ought from it'],
  ['the single root of both errors', 'Matthew', 22, 29, 'Ye do err, not knowing the scriptures, nor the power of God'],
  ['the phrase, by the Word’s own usage', 'Job', 1, 6, 'the sons of God came to present themselves before the LORD'],
  ['the phrase again, at creation', 'Job', 38, 7, 'all the sons of God shouted for joy?'],
  ['the event as Genesis reports it', 'Genesis', 6, 4, 'There were giants in the earth in those days'],
  ['the size, stated plainly', 'Deuteronomy', 2, 10, 'a people great, and many, and tall, as the Anakims'],
  ['Og, the remnant, with his iron bedstead', 'Deuteronomy', 3, 11, 'remained of the remnant of giants; behold, his bedstead was a bedstead of iron'],
  ['a measurement for the champion', '1 Samuel', 17, 4, 'whose height was six cubits and a span'],
  ['four men, one family, one city', '2 Samuel', 21, 22, 'These four were born to the giant in Gath'],
  ['the edge, with a promise on it', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God'],
  ['Enoch honoured, not canonised', 'Jude', 1, 14, 'And Enoch also, the seventh from Adam, prophesied of these'],
  ['the standard for doctrine', '2 Timothy', 3, 16, 'All scripture is given by inspiration of God'],
  ['the warning against filling a silence', 'Colossians', 2, 18, 'intruding into those things which he hath not seen'],
  ['what an unclean spirit craves', 'Matthew', 12, 43, 'seeking rest, and findeth none'],
  ['the appointed time, which IS in the text', 'Matthew', 8, 29, 'art thou come hither to torment us before the time?'],
  ['the darkness was worship', 'Deuteronomy', 32, 17, 'They sacrificed unto devils, not to God; to gods whom they knew not'],
  ['what the nations actually did', 'Deuteronomy', 18, 10, 'maketh his son or his daughter to pass through the fire'],
  ['the evidence rule the Word gave us', 'Deuteronomy', 19, 15, 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established'],
  ['prove all things', '1 Thessalonians', 5, 21, 'Prove all things; hold fast that which is good'],
  ['how a giant actually falls', '1 Samuel', 17, 45, 'but I come to thee in the name of the LORD of hosts'],
  ['the battle is His', '1 Samuel', 17, 47, 'for the battle is the LORD’s, and he will give you into our hands'],
  ['the standing promise', 'Deuteronomy', 3, 22, 'Ye shall not fear them: for the LORD your God he shall fight for you'],
  ['the open triumph', 'Colossians', 2, 15, 'And having spoiled principalities and powers, he made a shew of them openly'],
  ['the guard on the fascination', 'Luke', 10, 20, 'rather rejoice, because your names are written in heaven'],
  ['add thou not', 'Proverbs', 30, 6, 'Add thou not unto his words, lest he reprove thee, and thou be found a liar'],
];

// Carried somewhere in the lesson — the corroboration, the grading of the one
// fearful report, the worship strand, and the close.
const ELSEWHERE = [
  ['the calm war report', 'Genesis', 14, 5, 'smote the Rephaims in Ashteroth Karnaim, and the Zuzims in Ham'],
  ['the category bound to the height in one breath', 'Deuteronomy', 2, 11, 'Which also were accounted giants, as the Anakims'],
  ['and again, across the river', 'Deuteronomy', 2, 21, 'A people great, and many, and tall, as the Anakims'],
  ['Yahweh’s own physical description', 'Amos', 2, 9, 'whose height was like the height of the cedars, and he was strong as the oaks'],
  ['six fingers and six toes', '2 Samuel', 21, 20, 'that had on every hand six fingers, and on every foot six toes'],
  ['the Word grades the report', 'Numbers', 13, 32, 'And they brought up an evil report of the land which they had searched'],
  ['the lie was the verdict', 'Numbers', 13, 31, 'We be not able to go up against the people; for they are stronger than we'],
  ['and the slander named', 'Numbers', 14, 36, 'by bringing up a slander upon the land'],
  ['Caleb saw the same men and asked for their hill', 'Joshua', 14, 12, 'how the Anakims were there, and that the cities were great and fenced'],
  ['Moses quotes the saying without a tremor', 'Deuteronomy', 9, 2, 'Who can stand before the children of Anak!'],
  ['angels who left their own habitation', 'Jude', 1, 6, 'And the angels which kept not their first estate, but left their own habitation'],
  ['reserved unto judgment', '2 Peter', 2, 4, 'to be reserved unto judgment'],
  ['the category the Word does give us', 'Matthew', 25, 41, 'prepared for the devil and his angels'],
  ['they come in number', 'Mark', 5, 9, 'My name is Legion: for we are many'],
  ['orthodox belief without peace', 'James', 2, 19, 'the devils also believe, and tremble'],
  ['the worship at its most terrible', 'Psalms', 106, 37, 'they sacrificed their sons and their daughters unto devils'],
  ['not for Israel’s righteousness', 'Deuteronomy', 9, 4, 'but for the wickedness of these nations the LORD doth drive them out from before thee'],
  ['the Bereans ran it on an apostle', 'Acts', 17, 11, 'searched the scriptures daily, whether those things were so'],
  ['rightly dividing', '2 Timothy', 2, 15, 'rightly dividing the word of truth'],
  ['the Lamb of Yahweh', 'John', 1, 29, 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['the Eternal Son', 'Hebrews', 1, 8, 'Thy throne, O God, is for ever and ever'],
  ['greater is He that is in you', '1 John', 4, 4, 'greater is he that is in you, than he that is in the world'],
  ['teach them diligently', 'Deuteronomy', 6, 7, 'And thou shalt teach them diligently unto thy children'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

describe('L261 exists, is numbered, and sits after L258', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "262 is absent": a pin on the
  // catalog never growing is the one pin certain to break (L256's did, and
  // L257's "258 is absent" had to be amended the day L258 landed).
  it('is in the catalog exactly once, after L258, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV);
    expect(prev, 'L258 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L261 follows L258 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
  // THE PIN IS NUMBER-AGNOSTIC ON PURPOSE, and it took three goes to earn
  // that. This lesson was assigned ll252 (taken), then ll261, then "the
  // lowest free id" — and the first pin asserted which neighbouring numbers
  // were ABSENT, which was wrong every time the assignment moved. Contiguity
  // is held centrally (living-lessons-id-collision), so while ll259 and ll260
  // are mid-flight `unclaimedNumbers` names them as gaps beneath this lesson;
  // those holes are not this lesson's to fill. So this pin is a count, a
  // floor and a uniqueness check, and says nothing about what is missing.
  it('claims 261 exactly once, and never pins the catalog as finished', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 261)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(261); // a floor, never an equality
    expect(new Set(claimed).size, 'no number is claimed twice').toBe(claimed.length);
  });
  it('carries the build day, at or after L258’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-26');
    expect(LIVING_LESSONS_ADDED[PREV] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names both sendings honestly, and attaches nothing to a named person the source did not state', () => {
    expect(L.lesson).toContain('research road');
    expect(L.lesson).toContain('Michael Knowles');
    expect(L.lesson).toContain('Tim Alberino');
    // The second speaker is NOT named: the road did not return a name, and the
    // lesson says that rather than guessing one (the World Issues 21 correction).
    expect(L.lesson).toContain('whose speaker the research road did not name');
    // No faith label, affiliation or motive is attached to either named man.
    expect(/Knowles[^.]{0,120}\b(catholic|protestant|evangelical|jewish|atheist|heretic|grifter)\b/i.test(L.lesson)).toBe(false);
    expect(/Alberino[^.]{0,120}\b(catholic|protestant|evangelical|jewish|atheist|heretic|grifter)\b/i.test(L.lesson)).toBe(false);
  });
  it('the adult lesson walks eleven movements, in order', () => {
    const order = [
      'ONE. THE MEASURE, AND WHY IT CUTS BOTH WAYS',
      'TWO. WHO THE "sons of God" ARE, BY THE WORD’S OWN USAGE',
      'THREE. THE GIANTS WERE REAL, AND SHAVING THEM DOWN IS ALSO A LIE',
      'FOUR. AND THE WORD MAKES THEM OUTLIERS, NOT A RACE',
      'FIVE. THE EDGE, SAID OUT LOUD',
      'SIX. FIRST ENOCH, PLACED HONESTLY',
      'SEVEN. WHAT AN UNCLEAN SPIRIT IS, FROM THE WORD’S OWN ACCOUNT',
      'EIGHT. THE DARKNESS WAS WORSHIP, AND HE SAID SO HIMSELF',
      'NINE. EVIDENCE, AND THE TRAP OF FRIENDLY PROOF',
      'TEN. HOW A GIANT ACTUALLY FALLS',
      'ELEVEN. THE PRACTICE',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L261 teaches the Word and never stages a debate (DR-0098)', () => {
  it('refuses the pick-a-side posture in so many words', () => {
    expect(L.lesson).toContain('will not set them opposite each other and ask you to choose');
    expect(L.bigIdea).toContain('does not set them side by side and ask you to choose');
  });
  // The pattern matches the INVITATION, not the refusal. The child band says
  // "We are not going to pick a side", which a bare /pick a side/ flagged — a
  // check that cannot tell a refusal from an invitation is worse than none.
  const INVITES_A_VOTE = /\b(?:you decide|which view do you|decide for yourself which|choose (?:a|your) (?:side|view)|you (?:must|should|can|get to) pick|here are (?:two|three) views)\b/i;
  it.each(ALL)('%s never invites the reader to pick a view', (k) => {
    expect(INVITES_A_VOTE.test(TEXTS[k]), `${k} hands the reader a vote`).toBe(false);
  });
  it('would catch a both-sides invitation, and does not fire on the refusal of one (proven-to-catch)', () => {
    expect(INVITES_A_VOTE.test(`${TEXTS.teen} Here are two views; you decide.`)).toBe(true);
    expect(INVITES_A_VOTE.test('We are not going to pick a side. We are going to read the Book.')).toBe(false);
  });
  it.each(ALL)('%s states the edge instead of filling it', (k) => {
    expect(/never (?:ties|says) (?:Og|that about Og)|It never says that about Og|no verse|There is no verse|never tells you that Og/i.test(TEXTS[k]), `${k} drops the edge`).toBe(true);
  });
  it('never teaches the Enoch demon mechanism as the Word, in any band', () => {
    for (const k of ALL) {
      // the CLAIM may be reported; it may never be asserted.
      expect(/a demon is (?:specifically )?the (?:disembodied )?spirit of a dead giant/i.test(ourProseOnly(TEXTS[k])) && !/not in the Word|does not say|Scripture does not say|The Bible never says/i.test(TEXTS[k]), `${k} asserts the mechanism`).toBe(false);
    }
    expect(L.lesson).toContain('Scripture does not say that, anywhere, so this house does not teach it');
  });
  it('keeps the true element inside the claim — the appointed time', () => {
    expect(L.lesson).toContain('(Matthew 8:29)');
    expect(L.lesson).toContain('(2 Peter 2:4)');
  });
  it('does not soften the plain size language (DR-0100 — under-claiming is its own untruth)', () => {
    expect(L.lesson).toContain('accounted giants and tall as the Anakims');
    for (const k of ALL) expect(TEXTS[k].includes('(Deuteronomy 2:10)'), `${k} drops the plain size statement`).toBe(true);
  });
  it('handles Numbers 13:33 exactly: the verdict was the lie, the stature has other witnesses', () => {
    expect(L.lesson).toContain('(Numbers 13:31)');
    expect(L.lesson).toContain('(Numbers 13:32)');
    expect(L.lesson).toContain('(Joshua 14:12)');
    expect(L.lesson).toContain('(Deuteronomy 9:2)');
  });
});

describe('L261 — the house typography is senior to both sources', () => {
  // BOTH transcripts capitalise "Watchers", and the first capitalises "Satan"
  // and "Lucifer". None of it is copied through. Quoted Scripture is untouched:
  // the KJV on disk already renders "satan" lower case in Job 1:6.
  it.each(ALL)('%s never capitalises the watchers or the adversary in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\b(Watchers?|Satan|Lucifer|Devil|Adversary|Baal)\b/.test(ours), `${k} pays him a capital`).toBe(false);
  });
  it('does not use the Watchers title as a proper name anywhere in the lesson', () => {
    expect(/Book of the Watchers/.test(JSON.stringify(L))).toBe(false);
    expect(L.lesson).toContain('its opening section about the watchers');
  });
  it('would catch a capital smuggled in from the source (proven-to-catch)', () => {
    const copied = ourProseOnly(`${TEXTS.teen} The Watchers descended on Mount Hermon.`);
    expect(/\b(Watchers?|Satan|Lucifer)\b/.test(copied)).toBe(true);
  });
  it('leaves quoted Scripture exactly as the corpus has it, lower-case name included', () => {
    expect(verse('Job', 1, 6)).toContain('satan came also among them');
    expect(whole).toContain('and satan came also among them');
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
  });
  it('confesses Jesus as the Lamb of Yahweh, with John 1:29 beside it', () => {
    expect(L.lesson).toContain('the Lamb of Yahweh');
    expect(L.lesson).toContain('(John 1:29)');
  });
});

describe('L261 — every quoted span is the verse', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand of the spine', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(300);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('neither shall ye diminish ought from it"', 'and do not take anything away either"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Deuteronomy 4:2'))).toBe(true);
    const yahwehed = { ...L, lesson: L.lesson.replace('not knowing the scriptures, nor the power of God', 'not knowing the scriptures, nor the power of Yahweh') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Matthew 22:29'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, and Deuteronomy 4:2 is the first anchor', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`), `${ref} is anchored but never named`).toBe(true);
    }
    expect(L.anchor.ref.startsWith('Deuteronomy 4:2')).toBe(true);
  });
  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L261 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);
  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 600) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });
  it('sends the reader all three ways in every place, and would report a band that stops (proven-to-catch)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    const cut = { ...L, levels: { ...L.levels, senior: L.levels.senior.replace(/Tell a friend this week[^.]*\./, 'Think about it.') } };
    expect(cut.levels.senior).not.toBe(L.levels.senior);
    const gaps = placesMissingDirections(cut);
    expect(gaps.some((p) => p.place === 'senior' && p.missing.includes('friends')), 'the per-band check names the senior band').toBe(true);
    // and the module-pooled read still looks green, which is exactly why the
    // per-band check exists (DR-0795).
    expect(placesMissingDirections({ ...cut, levels: { ...cut.levels } }).every((p) => p.place === 'senior')).toBe(true);
  });
  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
  it.each(ALL)('%s closes on the battle being His', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on 1 Samuel 17:47`).toBe(true);
  });
});

describe('L261 — two stories and the full teaching shape', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach THIS lesson — one adds and one diminishes, in the same room', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    expect(light.title).toBe('The Notch on the Doorframe');
    expect(/one adding inches every afternoon, the other shaving them off/.test(light.body)).toBe(true);
    expect(solemn.title).toBe('The Two Surveyors');
    expect(/the one who drew what he had not seen or the one who erased what he had/.test(solemn.body)).toBe(true);
  });
  it('has the full teaching shape', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.benefits.length).toBeGreaterThanOrEqual(11);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(L.bigIdea.length).toBeGreaterThan(400);
    expect(L.inApp).toContain('TALK ABOUT IT TOGETHER');
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
  it('states the satire-sourced claim as settled fact rather than hedging it (DR-0100 tier 1)', () => {
    expect(/publishes fiction and satire/.test(L.lesson)).toBe(true);
    expect(/No such ruling exists in the public record/.test(L.lesson)).toBe(true);
    expect(/\b(may be|might be|some say|possibly) a hoax\b/i.test(L.lesson)).toBe(false);
  });
});

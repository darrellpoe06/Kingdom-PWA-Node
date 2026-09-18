// @vitest-environment node
// =============================================================================
// L178 — Terms Change, Not the Need
// =============================================================================
// Darrell put it in one line and marked it a lesson: terms change, not the
// need. A problem given a new name has not been repaired by the naming, and
// the need stands until it is actually fixed. He was insistent that the blade
// point at US as well as at the institutions outside — a measure of our own
// that has quietly stopped measuring is this lesson's own failure mode.
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. THE JAMES SENTENCE TREATED AS A LIE. It is not one. "Depart in peace,
//      be ye warmed and filled" is true, kind and correctly aimed at the real
//      lack, which is exactly what makes it the hard case. A band that made
//      the speaker a hypocrite would let every reader exempt himself, so every
//      band must say plainly that nothing in the sentence is false.
//   2. A LESSON ABOUT OTHER PEOPLE'S ANNOUNCEMENTS. Darrell required the
//      self-application, so every band carries it, and the two defects it
//      names are OURS and are named rather than gestured at.
//   3. SHAME WITHOUT A REMEDY. Revelation 3:17 alone leaves a reader in it.
//      Verse 18 answers with eyesalve — the ability to see the real state,
//      offered rather than withheld — and every band must carry both.
//   4. CRITICISM WITHOUT VERBS. Isaiah 1:16-17, James 1:27 and Zechariah 7:9-10
//      supply relieve, judge, plead and VISIT, each landing on a named person
//      in a named condition. Required in every band, or the lesson teaches
//      auditing instead of doing.
//   5. NO SHAPE TO AIM AT. Nehemiah 6:15 carries a date and a duration, which
//      is what a repair has and a renaming never does. Every band must carry
//      the working case, not only the failure.
//   6. THE MEASUREMENT COLLAPSED INTO RESOLVE. The prescription is Proverbs
//      27:23 — know the STATE, not the plan — because Proverbs 21:2 and 14:12
//      mark your own impression as the untrustworthy instrument.
//
// WHAT THIS LESSON'S OWN GATE CAUGHT, WHICH IS THE POINT OF HAVING ONE. Five
// quotations in the first draft were not His words: four one-word drifts
// (Matthew 23:28 missing "also", Nehemiah 4:6 as "a heart to work" where the
// KJV says "a MIND to work", Zechariah 7:9 as "compassion" for "compassions",
// Revelation 3:18 missing an "and"), and one span carrying Jeremiah 6:13's
// text under a Jeremiah 8:10 label. The correct text of all five was sitting
// in the fetched verse file the whole time and was typed from memory anyway —
// which is this lesson's own subject, committed while writing it.
//
// Check-writing rules in force: every claim check reads OUR prose with
// quotations AND their reference parentheses stripped; no alternation branch
// is a title keyword (terms, change, need are ALL title keywords here); one
// claim per test; every quoted span in the WHOLE module is walked, not only
// the five reader texts; and a claim that genuinely belongs to some bands and
// not others is SCOPED with its reason rather than quietly dropped.
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

const ID = 'll178-terms-change-not-the-need-a-renamed-problem-is-not-a-fixed-one';
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

// The movement count each band renders, MEASURED and pinned per band. A new
// instance of the invisible-movement class was caught here: the heading
// "LORD, LORD." looks perfect and renders as body text, because
// lesson-format.js requires two capitals separated by whitespace and the comma
// after the first word breaks that test. It was renamed rather than left
// invisible — which is, appropriately, this lesson's own subject.
const SECTIONS = { adult: 22, child: 22, youth: 22, teen: 22, senior: 23 };

// The forty-four things this lesson must TEACH, each read from our prose
// alone. Every one was measured to land before the check was written.
const CLAIMS = [
  ['the renaming is stated as the defect', /renam|new name|relabel|reclassif|a new label/i],
  ['nothing in the James sentence is false', /is a lie|no (?:falsehood|lie)|none of them is a lie|not a lie/i],
  ['and the person is unchanged when it ends', /still cold|still hungry|remains cold|same condition/i],
  ['the question asked is what it profits', /PROFITS|what good it did|what it profits/i],
  ['alone means nothing stood beside it', /nothing (?:standing |adjacent|beside|next to)|by itself|stood by itself|on its own/i],
  ['healed it slightly concedes something was done', /something was (?:genuinely )?done|an intervention|somebody did something|concedes/i],
  ['the announcement becomes a second layer', /second (?:layer|injury|problem)|on top of the first|over the first|two problems instead of one/i],
  ['the repetition is noted as deliberate', /twice|second time|again/i],
  ['untempered morter carries no load', /no (?:strength|load)|holds no load|carries no load/i],
  ['the coating fails in the weather it was built for', /(?:weather|conditions|storm) (?:it|the wall) (?:was|had been|existed|were)|only weather|not (?:fall )?on a (?:sunny|calm|ordinary)|precise conditions|exactly the conditions/i],
  ['whitewash is the certifying rather than the bones', /every tomb|bones, which|the labelling|the certif|the declaring|paint went on|inside stayed the same/i],
  ['a bag with holes means real effort leaving', /bag with holes/i],
  ['and nobody can name the cause', /nobody can (?:point|say)|no one can point|cannot point to the cause|never (?:named|entered)|Nobody even said|nobody notices/i],
  ['a false balance takes by reporting wrong', /report(?:ing|s) wrong|misreport|says the wrong number|registers another|steals by relabelling|extracts by/i],
  ['two weights in one bag is the mechanism', /two (?:weights|calibrations)|one heavy, one light|divers weights means/i],
  ['the books reconciled while the instrument lied', /books (?:balanced|reconciled)|ledger reconciled|numbers added up|scale was lying/i],
  ['covering and confessing are both available', /both (?:genuinely )?available|both of those|can cover a sin, or|both things you can do|available responses/i],
  ['confessing is still not the repair', /not the (?:repair|mend)|door the mend|what lets the fix/i],
  ['a renaming works on an audience and fails on a Judge', /audience and fails|before MEN|fool people/i],
  ['calling it something else is itself the offence', /the (?:whole|entire) (?:offence|crime|problem)|the relabelling IS/i],
  ['the mouth arrived and the heart did not', /mouth (?:came|arrived|showed up)|heart (?:did not|stayed)/i],
  ['professing and denying happen in one life', /one (?:man|person|life)|same people, same life|by the same people/i],
  ['His question is why use the word at all', /why use the word|why deploy the term|not (?:asking )?why (?:you |a man )?(?:failed|fell short)/i],
  ['mocking is drawing one harvest on another paperwork', /paperwork|does not (?:WORK|FUNCTION|work)|ground does not read/i],
  ['the seeing is already granted', /SEETH|SEES|seeing is (?:already )?granted|detection is already/i],
  ['word and tongue are the two places a renaming lives', /two (?:places|rooms|layers|addresses)/i],
  ['the instruction is to know the state not the plan', /the STATE/],
  ['your own sense of it is the untrustworthy input', /not to (?:be )?trust|not trustworthy|unreliable|cannot just trust|the wrong instrument/i],
  ['seemeth is the failure mode', /SEEMETH/],
  ['it seems most right to whoever renamed it', /whoever (?:did the renaming|renamed|filed)|who did the renaming|the person who renamed|especially to the person/i],
  ['a repair carries a date and a duration', /date|duration/i],
  ['the wall needed no persuading', /nobody (?:had to be|had to tell|required|needed)|without being told|no communications plan/i],
  ['the mockery is for an unfinished foundation in public', /foundation (?:with|carrying|sitting)|in (?:full )?public view|everybody (?:walking|who walks) (?:by|past)/i],
  ['finished is a word He used of Himself', /about (?:His own|Himself)|His own (?:work|assignment)|uses about Himself/i],
  ['the alternative is verbs that land on a person', /Relieve|specific person|named person|particular person|real person/],
  ['visiting is distinguished from mentioning', /[Nn]ot to (?:mention|cite)|Not mention/],
  ['the fire tests the work and not its description', /not the (?:description|write-up|account)|tries the work|what burns is the work|does not read the label|not the label/i],
  ['this is turned on us as well', /cuts at us|points at us|about us too|Nobody here|nobody here/i],
  ['a measure that stopped measuring was renamed', /stop(?:s|ped)? (?:measuring|reporting|being real)|stops being real|quietly relabelled|relabelled, not/i],
  // ADULT AND UP ONLY, with the reason stated rather than the band quietly
  // dropped: an allowance beside a logged defect is a governance idea, and the
  // child band teaches the same point concretely (a chart that stops being
  // real) without the abstraction. Scoped, not skipped.
  ['an allowance nobody lowers is peace peace', /allowance/i, ['adult', 'youth', 'teen', 'senior']],
  ['the two house defects are named rather than described', /three-character|three letters/i],
  ['neither was caught by good intent', /meaning well|good intent|intending well/i],
  ['what He offers is eyesight rather than shame', /eyesalve|eyesight|ability to (?:see|observe)/i],
  ['the endurance clause is faint not rather than announce', /faint not/i],
];

describe('L178 — the shape of the lesson', () => {
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
    // Caught here on the first pass: the senior band measured BELOW the teen
    // band (6.91 against 7.03) and was re-registered rather than the ladder
    // adjusted, because the ladder is the claim and the number is only its
    // proxy.
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
    // The youth band measured 0.27 against the adult on its first pass —
    // under the ceiling, but written by re-registering its neighbour, which is
    // the habit this corpus has paid for three times. Fifteen sentences were
    // re-conceived and it came to 0.16.
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

  it('the renderer still drops a heading whose first word ends in a comma (proven-to-catch)', () => {
    // The defect found while writing this lesson, kept as a live check because
    // nothing else in the house knows about it. "LORD, LORD." is two capital
    // words, ends in a period, and heads real prose — and it is NOT promoted,
    // because lesson-format.js tests for two capitals separated by whitespace
    // and the comma breaks that. A heading that looks perfect renders as body.
    const withComma = TEXTS.adult.replace('WHY CALL ME IT.', 'LORD, LORD.');
    expect(withComma).not.toBe(TEXTS.adult);
    expect(formatLessonText(withComma).sectionCount).toBeLessThan(SECTIONS.adult);
  });

  it('promotes no caps EMPHASIS into a section heading', () => {
    const EMPHASIS = ['BEFORE MEN', 'THOU SAYEST', 'SEEMETH'];
    const bad = [];
    for (const k of ALL) {
      for (const h of formatLessonText(TEXTS[k]).items.filter((i) => i.kind === 'heading')) {
        for (const e of EMPHASIS) if (h.text.includes(e)) bad.push(`${k}: ${h.text}`);
      }
    }
    expect(bad, `caps emphasis promoted to a heading:\n${bad.join('\n')}`).toEqual([]);
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

describe('L178 — His words, exactly as He said them', () => {
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

  it('the walk catches all five drifts it caught in the first draft (proven-to-catch)', () => {
    // Each of these is the exact wrong text this lesson shipped with before the
    // gate read it. Four one-word drifts and one span under the wrong label.
    const DRIFTS = [
      ['Even so ye outwardly appear righteous unto men, but within ye are full of hypocrisy and iniquity.', 'Matthew', 23, '28'],
      ['So built we the wall; and all the wall was joined together unto the half thereof: for the people had a heart to work.', 'Nehemiah', 4, '6'],
      ['Thus speaketh the LORD of hosts, saying, Execute true judgment, and shew mercy and compassion every man to his brother:', 'Zechariah', 7, '9'],
      ['I counsel thee to buy of me gold tried in the fire, that thou mayest be rich; and white raiment, that thou mayest be clothed, that the shame of thy nakedness do not appear; and anoint thine eyes with eyesalve, that thou mayest see.', 'Revelation', 3, '18'],
      ['For from the least of them even unto the greatest of them every one is given to covetousness; and from the prophet even unto the priest every one dealeth falsely.', 'Jeremiah', 8, '10'],
    ];
    for (const [wrong, book, ch, vs] of DRIFTS) {
      const real = versesOf(book, ch, vs);
      expect(real, `${book} ${ch}:${vs} does not resolve`).toBeTruthy();
      expect(norm(real).includes(norm(wrong)), `the walk would have passed ${book} ${ch}:${vs}`).toBe(false);
    }
    // And the corpus now carries the real ones, including the word the whole
    // lesson is about getting right.
    for (const k of ALL) {
      expect(TEXTS[k], `${k} still has the wrong word in Nehemiah 4:6`).toContain('for the people had a mind to work');
      expect(TEXTS[k], `${k} still drops "also" from Matthew 23:28`).toContain('Even so ye also outwardly appear righteous');
    }
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
    const bad = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*"/g) || []) {
        if (/terms change|renamed problem|untempered morter is|bag with holes\.$/i.test(q)) bad.push(`${path}: ${q}`);
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
      expect(TEXTS[k], `${k} has scrubbed the KJV's own wording`).toContain('that which is highly esteemed among men is abomination in the sight of God');
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

describe('L178 — the verses the whole lesson rests on are in every band', () => {
  const REQUIRED = [
    ['the naked and destitute brother', 'If a brother or sister be naked, and destitute of daily food'],
    ['depart in peace, be warmed and filled', 'Depart in peace, be ye warmed and filled'],
    ['what doth it profit', 'what doth it profit'],
    ['dead, being alone', 'dead, being alone'],
    ['healed the hurt slightly', 'healed also the hurt of the daughter of my people slightly'],
    ['and the repetition of it', 'For they have healed the hurt of the daughter of my people slightly'],
    ['untempered morter', 'others daubed it with untempered morter'],
    ['and its fall in the storm', 'there shall be an overflowing shower'],
    ['the whited sepulchres', 'ye are like unto whited sepulchres'],
    ['and the outward appearance', 'Even so ye also outwardly appear righteous unto men'],
    ['consider your ways', 'Now therefore thus saith the LORD of hosts; Consider your ways'],
    ['the bag with holes', 'earneth wages to put it into a bag with holes'],
    ['the false balance', 'A false balance is abomination to the LORD'],
    ['divers weights', 'Thou shalt not have in thy bag divers weights'],
    ['the deceitful weights', 'with the bag of deceitful weights'],
    ['covering and confessing', 'He that covereth his sins shall not prosper'],
    ['highly esteemed among men', 'that which is highly esteemed among men is abomination in the sight of God'],
    ['calling evil good', 'Woe unto them that call evil good, and good evil'],
    ['the mouth and the heart', 'honoureth me with their lips; but their heart is far from me'],
    ['profess and deny', 'They profess that they know God; but in works they deny him'],
    ['why call ye me Lord', 'And why call ye me, Lord, Lord, and do not the things which I say'],
    ['not every one that saith', 'Not every one that saith unto me, Lord, Lord'],
    ['God is not mocked', 'Be not deceived; God is not mocked'],
    ['seeth his brother have need', 'seeth his brother have need'],
    ['not in word, neither in tongue', 'let us not love in word, neither in tongue; but in deed and in truth'],
    ['the state of thy flocks', 'Be thou diligent to know the state of thy flocks'],
    ['right in his own eyes', 'Every way of a man is right in his own eyes'],
    ['the way which seemeth right', 'There is a way which seemeth right unto a man'],
    ['a mind to work', 'for the people had a mind to work'],
    ['fifty and two days', 'in fifty and two days'],
    ['they perceived the work', 'for they perceived that this work was wrought of our God'],
    ['count the cost', 'counteth the cost, whether he have sufficient to finish it'],
    ['was not able to finish', 'This man began to build, and was not able to finish'],
    ['I have finished the work', 'I have finished the work which thou gavest me to do'],
    ['I have finished my course', 'I have fought a good fight, I have finished my course'],
    ['cease to do evil', 'put away the evil of your doings from before mine eyes; cease to do evil'],
    ['learn to do well', 'Learn to do well; seek judgment, relieve the oppressed'],
    ['pure religion', 'To visit the fatherless and widows in their affliction'],
    ['execute true judgment', 'Execute true judgment, and shew mercy and compassions every man to his brother'],
    ['oppress not the widow', 'And oppress not the widow, nor the fatherless, the stranger, nor the poor'],
    ['the fire shall try it', 'the fire shall try every man'],
    ['thou sayest I am rich', 'Because thou sayest, I am rich, and increased with goods'],
    ['the eyesalve', 'anoint thine eyes with eyesalve, that thou mayest see'],
    ['faint not', 'let us not be weary in well doing'],
  ];
  for (const [what, span] of REQUIRED) {
    it(`carries ${what} in every band`, () => {
      for (const k of ALL) expect(TEXTS[k], `${k} is missing ${what}`).toContain(span);
    });
  }
});

describe('L178 — what the lesson must TEACH, read from our prose alone', () => {
  for (const [what, re, only] of CLAIMS) {
    it(what, () => {
      const scope = only || ALL;
      const missing = scope.filter((k) => !re.test(OURS[k]));
      expect(missing, `${what} — absent from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('every scoped claim names its bands explicitly, so none is quietly dropped', () => {
    // A claim scoped to fewer bands is a decision, and a decision with no
    // stated scope is exactly the renaming this lesson is about. Any scope
    // must be a real subset of the five texts, never an empty one.
    for (const [what, , only] of CLAIMS) {
      if (!only) continue;
      expect(only.length, `${what} is scoped to nothing`).toBeGreaterThan(0);
      for (const k of only) expect(ALL, `${what} scopes to an unknown band ${k}`).toContain(k);
    }
  });

  it('the claim checks read OUR words, never the verse beside them (proven-to-catch)', () => {
    expect(TEXTS.adult).toContain('Peace, peace; when there is no peace');
    expect(OURS.adult.includes('Peace, peace; when there is no peace')).toBe(false);
  });

  it('refuses to make the James speaker a liar, in every band', () => {
    // The whole lesson collapses if the sentence is false: a reader who can
    // call the speaker a hypocrite exempts himself in the same breath.
    for (const k of ALL) {
      expect(OURS[k], `${k} lets the reader treat it as a lie`).toMatch(/is a lie|no (?:falsehood|lie)|not a lie|none of them is a lie/i);
    }
  });

  it('carries Revelation 3:17 and 3:18 as a PAIR, so no band leaves a reader in shame', () => {
    for (const k of ALL) {
      const seventeen = TEXTS[k].indexOf('Because thou sayest, I am rich');
      const eighteen = TEXTS[k].indexOf('anoint thine eyes with eyesalve');
      expect(seventeen, `${k} is missing the self-issued label`).toBeGreaterThan(-1);
      expect(eighteen, `${k} leaves the reader in it with no remedy`).toBeGreaterThan(seventeen);
    }
  });

  it('turns the lesson on this house, with the two defects named rather than described', () => {
    for (const k of ALL) {
      expect(OURS[k], `${k} keeps this about other people`).toMatch(/cuts at us|points at us|about us too|Nobody here|nobody here/i);
      expect(OURS[k], `${k} gestures at our defects instead of naming one`).toMatch(/three-character|three letters/i);
    }
  });
});

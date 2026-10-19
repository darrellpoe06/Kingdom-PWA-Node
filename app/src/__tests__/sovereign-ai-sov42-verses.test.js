// =============================================================================
// sov42 — the three-year degree and the work that teaches: counting the forming
// years, the debt everybody is fleeing, and the stranger in the gate (DR-1115)
// =============================================================================
// Week 42 of Sovereign A.I., captured 2026-10-19 from SmartBrief for the Higher
// Ed Leader of that morning, which Darrell forwarded from dpoe@illinois.edu at
// 17:25 UTC with one word above it: "Lesson".
//
// OUR DISTANCE FROM THE SOURCES IS PART OF THE SUBJECT. We read the DIGEST and
// not one full article, telephoned nobody, read neither the California statute
// nor the disputed federal report, and reproduced no figure. The page says so
// out loud at the top of every band that weighs a claim, and the tests below
// require it to keep saying so.
//
// Word first, explaining the thing rather than decorating it: forming is bought
// with use over time (Hebrews 5:14; Luke 2:52; Isaiah 28:10); the three-year
// degree is obeying Luke 14:28-30 and counting the wrong number; Scripture's OWN
// three-year curriculum is recorded and blessed (Daniel 1:4-20), so this page
// may not pretend the Word forbids a short degree, and the text names the real
// causes - a purposed heart and knowledge GIVEN; work beside learning is
// apostolic (Acts 18:3; 2 Thessalonians 3:8-10) and Spirit-given with a teaching
// commission attached (Exodus 31:3-5; 35:30-35); debt is a change of standing
// with Yahweh's own scheduled release as the remedy (Proverbs 22:7;
// Deuteronomy 15:1-2); the wage standard is same-day and is not softened
// (Deuteronomy 24:14-15; Jeremiah 22:13; James 5:4) while one digest convicts
// nobody (Proverbs 18:13; 18:17; Deuteronomy 19:15); the harvest margin is
// somebody's whole access (Leviticus 19:9-10; Deuteronomy 24:19-21;
// Proverbs 13:23); a tier is a weight (Proverbs 11:1; 20:10) beside allotment by
// proven ability (Matthew 25:15; Luke 19:17); the sojourner among Yahweh's people
// is loved as one born among them (Leviticus 19:33-34; Exodus 22:21;
// Deuteronomy 10:18-19), taught rather than staged as a party argument; and
// retention is feeding, not keeping (Ezekiel 34:2-4; John 21:15-17; 1 Peter 5:2).
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by
// scripts/sov42-fill.mjs, never typed from memory, and every pin below is
// re-read from that corpus at test time so this file cannot drift either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice, SPAN_WITH_REFERENCE } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands, namesItsLesson, titleKeywords } from '../../../scripts/title-in-narrative.mjs';
import { measureLesson } from '../../../scripts/reading-level.mjs';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();

/** The verse exactly as the corpus on disk has it. No normalisation at all. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const name = m[1].trim().replace(/\s+/g, '');
  try {
    if (!bookCache.has(name)) {
      bookCache.set(name, JSON.parse(readFileSync(join(CORPUS, `${name}.json`), 'utf8')));
    }
  } catch { return null; }
  const chap = bookCache.get(name).chapters[Number(m[2]) - 1];
  if (!chap) return null;
  return chap[Number(m[3]) - 1] ?? null;
}

const SOV42_ID = 'sov42-the-three-year-degree-and-the-work-that-teaches';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV42_ID);

// The spans this week's teaching actually turns on, re-read from the corpus at
// test time so a pin can never be "what I remember the verse saying".
const PINNED = [
  'Luke 2:52', 'Hebrews 5:12', 'Hebrews 5:13', 'Hebrews 5:14', 'Isaiah 28:10',
  '1 Corinthians 13:11', 'Proverbs 22:6', 'Luke 6:40',
  'Luke 14:28', 'Luke 14:29', 'Luke 14:30',
  'Daniel 1:4', 'Daniel 1:5', 'Daniel 1:8', 'Daniel 1:17', 'Daniel 1:20',
  'Acts 18:3', '1 Thessalonians 2:9', '2 Thessalonians 3:8', '2 Thessalonians 3:9', '2 Thessalonians 3:10',
  'Exodus 35:30', 'Exodus 35:31', 'Exodus 35:34', 'Exodus 35:35', 'Exodus 31:3', 'Exodus 31:5',
  'Genesis 2:15', 'Ephesians 4:28', 'Colossians 3:23', '2 Timothy 2:15',
  'Proverbs 22:7', 'Romans 13:8', 'Deuteronomy 15:1', 'Deuteronomy 15:2',
  'Deuteronomy 24:14', 'Deuteronomy 24:15', 'Jeremiah 22:13', 'James 5:4', '1 Timothy 5:18', 'Luke 10:7',
  'Proverbs 18:13', 'Proverbs 18:17', 'Deuteronomy 19:15',
  'Leviticus 19:9', 'Leviticus 19:10', 'Deuteronomy 24:19', 'Deuteronomy 24:20', 'Deuteronomy 24:21', 'Proverbs 13:23',
  'Matthew 25:15', 'Luke 19:17', 'Luke 16:10', 'Proverbs 11:1', 'Proverbs 20:10',
  'Exodus 18:21', 'Exodus 18:22',
  'Leviticus 19:33', 'Leviticus 19:34', 'Exodus 22:21', 'Deuteronomy 10:18', 'Deuteronomy 10:19',
  'Ezekiel 34:2', 'Ezekiel 34:3', 'Ezekiel 34:4', 'John 21:15', 'John 21:16', 'John 21:17',
  '1 Peter 5:2', 'Proverbs 27:23', 'Proverbs 9:9',
  'Ecclesiastes 1:9', 'Proverbs 25:2', '1 Thessalonians 5:21', 'Proverbs 14:15',
  '1 Corinthians 13:1', 'Philippians 1:10', 'Proverbs 24:3', 'Proverbs 24:4', 'Proverbs 4:7', 'Proverbs 23:23',
  'Jeremiah 6:16', 'Galatians 5:22', 'Hebrews 3:13', 'Deuteronomy 6:7',
  'John 1:29', 'John 3:16', 'Hebrews 1:8', 'Psalms 19:14',
];

const PLACES = () => {
  const m = L();
  return ['lesson', 'child', 'youth', 'teen', 'senior'].map((k) => ({
    place: k,
    text: k === 'lesson' ? m.lesson : m.levels[k],
  }));
};

const EVERY_TEXT = () => {
  const m = L();
  const out = [m.lesson, m.bigIdea, m.inApp, m.title, m.anchor.theme, ...(m.benefits || [])];
  out.push(...Object.values(m.levels));
  out.push(...Object.values(m.rpe));
  out.push(m.facilitator.howToRun, ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts);
  for (const q of m.quiz.questions) out.push(q.q, q.explain, ...q.options);
  return out.filter((x) => typeof x === 'string');
};

describe('sov42 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 42, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov42 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV42_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov42-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  it('the weeks run in order and sov42 is the last of them', () => {
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(Math.max(...nums)).toBe(42);
    expect(SOVEREIGN_AI_MODULES[SOVEREIGN_AI_MODULES.length - 1].id).toBe(SOV42_ID);
  });

  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(200);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every pinned verse is quoted somewhere in the module, as the corpus has it', () => {
    const all = EVERY_TEXT().join('\n');
    const missing = [];
    for (const ref of PINNED) {
      const text = corpusText(ref);
      expect(text, `${ref} does not resolve in the corpus`).toBeTruthy();
      if (!all.includes(text)) missing.push(ref);
    }
    expect(missing, 'pinned verses the module never quotes verbatim').toEqual([]);
  });

  it('no quotation carries an ellipsis, so there is nothing to elide and nothing to stitch', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/"[^"]*(?:\.\.\.|…)[^"]*"\s*\(/.test(all), 'an elided span would need a human-judged baseline entry').toBe(false);
  });
});

describe('sov42 — the anchor holds in BOTH directions (DR-0734)', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBeGreaterThanOrEqual(85);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    const dead = refs.filter((r) => !corpusText(r));
    expect(dead, 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('and names nothing it does not quote — every anchor ref is quoted on the page', () => {
    // The other direction, which is the one that is easy to lose: a reference
    // named on the anchor but never quoted sends Search it out somewhere the
    // reader was never taken. The anchor is generated from the quotations, so
    // this must hold exactly.
    const quoted = new Set();
    for (const [, text] of quotedTexts(L())) {
      for (const sp of String(text).matchAll(SPAN_WITH_REFERENCE)) {
        quoted.add(`${sp[2].trim()} ${sp[3]}:${sp[4].trim()}`);
      }
    }
    const unquoted = anchorRefs(L()).filter((r) => !quoted.has(r));
    expect(unquoted, 'anchor refs named but never quoted').toEqual([]);
  });
});

describe('sov42 — the record is stated as the digest, with our distance named', () => {
  it('the source is named where a claim is weighed, and the child band still says who brought it', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/SmartBrief/.test(text), `${place} does not name the digest`).toBe(true);
      expect(/"Lesson"/.test(text), `${place} does not carry the one word he wrote`).toBe(true);
    }
    // At a child's level, naming a trade newsletter and a marked subject line is
    // noise rather than honesty; who brought it is the honest part.
    expect(/Darrell/.test(L().levels.child), 'the child band does not say who brought it').toBe(true);
  });

  it('says plainly that no full article was read, and refuses the sponsor copy', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/did not read (?:a single full article|one full article|any full article)/i.test(adult), 'the distance from the sources is not stated').toBe(true);
    expect(/reproduced no figure|reproduced none of the numbers|did not check a single number/i.test(adult)).toBe(true);
    expect(/sponsor copy[^.]*(?:advertis|is not taught)/i.test(adult)).toBe(true);
    expect(/A\.I\. agent drafted this page/i.test(adult)).toBe(true);
    // the youth band, which a younger reader may be the only one to read, carries
    // the same warning in its own words
    expect(/did not read any full article/i.test(L().levels.youth)).toBe(true);
  });

  it('names the outlets it attributes to, rather than reporting the figures as our own', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    for (const outlet of ['Inside Higher Ed', 'Hechinger Report', 'Higher Ed Dive', 'EdSource', 'Chalkbeat']) {
      expect(adult.includes(outlet), `${outlet} is never named`).toBe(true);
    }
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const place of ['lesson', 'teen']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
  });

  it('states the wage standard without asserting a verdict nobody proved', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Deuteronomy 24:15')); // the standard, unsoftened
    expect(/104 million/.test(adult), 'the reported payroll figure is missing').toBe(true);
    expect(/datum,? not a verdict/i.test(adult), 'the limit on the surplus is not named').toBe(true);
    expect(/do not assert (?:that anybody was defrauded|wage theft)/i.test(adult), 'the page does not refuse the accusation it declined to make').toBe(true);
    expect(adult).toContain(corpusText('Deuteronomy 19:15')); // one witness is not enough
  });

  it('keeps the counter-witness the Word itself gives, so a short degree is never called a sin', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/Daniel 1:5|three years/i.test(text), `${place} drops the Word's own three-year curriculum`).toBe(true);
    }
    expect(L().lesson).toContain(corpusText('Daniel 1:5'));
    expect(L().lesson).toContain(corpusText('Daniel 1:17'));
    // the correction runs in BOTH directions, in each place's own words
    expect(/shorter programme is not a sin and a longer programme is not a virtue/i.test(L().lesson)).toBe(true);
    expect(/shortness is not sin and length is not virtue/i.test(L().levels.teen)).toBe(true);
  });
});

describe('sov42 — the stranger is taught, not staged as a party argument (DR-0098)', () => {
  it('states the measured facts and then teaches the standard, in every band that weighs it', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/stranger|sojourner/i.test(text), `${place} never reaches the stranger`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/Texas, Kansas, Kentucky and Nebraska/.test(adult), 'the measured facts are not stated (DR-0100)').toBe(true);
    expect(adult).toContain(corpusText('Leviticus 19:34'));
    expect(adult).toContain(corpusText('Exodus 22:21'));
  });

  it('refuses the party frame in either direction, and names the Word\'s own reticence', () => {
    const all = EVERY_TEXT().join('\n');
    for (const party of ['Republican', 'Democrat', 'Democratic Party', 'left-wing', 'right-wing']) {
      expect(all.includes(party), `${party} turns the lesson into a partisan brief`).toBe(false);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/not a brief for or against any administration|not a page about any party|NOT doing, which is taking a party's side/i.test(adult)).toBe(true);
    expect(/not (?:a statute book|an immigration code)/i.test(adult), 'the Word is made to answer a question it does not address').toBe(true);
  });
});

describe('sov42 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210)', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Exodus 35:31'));      // "...the spirit of God..."
    expect(all).toContain(corpusText('Deuteronomy 24:15')); // "...cry against thee unto the LORD..."
    expect(all).toContain(corpusText('Leviticus 19:34'));   // "...I am the LORD your God."
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(/Eternal Son/.test(all)).toBe(true);
    expect(all).toContain(corpusText('John 1:29'));
    expect(all).toContain(corpusText('John 3:16'));
    expect(all).toContain(corpusText('Hebrews 1:8'));
  });

  it('no holy name is lowercased in our own voice', () => {
    for (const { place, text } of PLACES()) {
      expect(loweredHolyNames(ourVoice(text)), `${place} lowercases a holy name`).toEqual([]);
    }
  });

  it('no adversary name is capitalised, anywhere', () => {
    const all = EVERY_TEXT().join('\n');
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'Baal']) {
      expect(all.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });

  it('no decision-record id reaches a reader', () => {
    for (const { place, text } of PLACES()) {
      expect(/DR-\d{4}/.test(text), `${place} shows a DR id to a reader`).toBe(false);
    }
  });

  it('the Resources are capitalised where they are named as the Resources (DR-0530)', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/Wisdom, Understanding and Knowledge|Wisdom, Understanding, Knowledge/.test(adult)).toBe(true);
  });
});

describe('sov42 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band carries the skill and the rhythm in the lesson\'s own words', () => {
    for (const { place, text } of PLACES()) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen all the way (?:to the end|through)/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
      expect(/four places of Deuteronomy 6:7/.test(text), `${place} drops the four places`).toBe(true);
    }
  });

  it('growth is measured the Word\'s way, qualitative and quantitative', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(adult).toContain(corpusText('Galatians 5:22'));   // fruit
    expect(adult).toContain(corpusText('Deuteronomy 6:7'));  // occasions
    expect(adult).toContain(corpusText('Hebrews 3:13'));     // days
  });
});

// -----------------------------------------------------------------------------
// PROVEN TO CATCH (DR-0076 §3). A gate that always passes is itself a lie, so
// each case below breaks exactly one real thing AND re-asserts that the real
// module is clean — otherwise a "catch" could be a stuck failure nobody notices.
// -----------------------------------------------------------------------------
describe('sov42 — the gates are proven to catch, and neither catch is stuck', () => {
  it('a single altered word inside a quoted verse fails the verbatim scan', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace('by reason of use have their senses exercised', 'by reason of time have their senses exercised'),
    };
    expect(broken.lesson, 'the word this case alters is not in the lesson any more').not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Hebrews 5:14/);
    // ...and the real module is still clean, so this catch is not a stuck failure
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('stripping ONE band\'s friend line names that band while the pooled check still reads green', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, youth: m.levels.youth.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.youth, 'the youth friend line this case strips is not there any more').not.toBe(m.levels.youth);
    // the per-band check names the youth band — note these are RECORDS, not names
    const short = placesMissingDirections(stripped);
    expect(short.map((p) => p.place)).toContain('youth');
    expect(short.find((p) => p.place === 'youth').missing).toContain('friends');
    // ...while the pooled check still reads green, which is exactly why the
    // per-band check has to exist (DR-0795).
    expect(hasAllThree(stripped)).toBe(true);
    // ...and the real module is clean, so this catch is not a stuck failure
    expect(placesMissingDirections(m)).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// Every band names its own lesson in its opening, and the child band reads like
// a child's. This section exists because the FIRST draft failed it: the child
// band's opening 200 characters carried 5 of the title's 13 distinctive words
// and needed 7, so `unnamedBands` named `child`. It was fixed in the child's own
// register -- short sentences, words a small child already owns -- never a
// mechanical title prefix, and the reading grade was re-measured afterwards.
// Pinned here so the class cannot come back silently.
// -----------------------------------------------------------------------------
describe('sov42 — every band names its lesson, and the child band reads like one', () => {
  it('no band is unnamed in its opening window', () => {
    expect(unnamedBands(L())).toEqual([]);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(namesItsLesson(L().title, L().levels[band]), `${band} does not name its lesson`).toBe(true);
    }
  });

  it('PROVEN-TO-CATCH: an opening that drops the title is named, and the real child band is not', () => {
    const m = L();
    const drift = 'Here we begin somewhere else entirely. Nothing in these first lines says what we study today. We talk about the weather, the drive over, the snack table, the chairs, and the long slow week now behind us. ';
    expect(drift.length).toBeGreaterThan(200);
    const blind = { ...m, levels: { ...m.levels, child: drift + m.levels.child } };
    expect(unnamedBands(blind)).toContain('child');
    // ...and the real module is clean, so this catch is not a stuck failure
    expect(unnamedBands(m)).toEqual([]);
  });

  it('the child band stays under the new-lesson child ceiling, and the title is measurable', () => {
    expect(titleKeywords(L().title).length).toBeGreaterThanOrEqual(8);
    const rl = measureLesson(L());
    expect(rl.bands.child.authored, 'the child band reads above the 5.0 new-lesson ceiling').toBeLessThanOrEqual(5.0);
    expect(rl.bands.child.authored).toBeLessThan(rl.bands.youth.authored);
    expect(rl.bands.youth.authored).toBeLessThan(rl.bands.teen.authored);
  });
});

describe('sov42 — the facilitator guide and the quiz are whole', () => {
  it('carries all three facilitator fields', () => {
    const f = L().facilitator;
    expect(f.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(typeof f.howToRun).toBe('string');
    expect(f.discussionPrompts.length).toBeGreaterThanOrEqual(6);
  });

  it('every discussion prompt asks something', () => {
    for (const p of L().facilitator.discussionPrompts) {
      expect(/\?/.test(p), `prompt asks nothing: ${p.slice(0, 60)}`).toBe(true);
    }
  });

  it('the hands-on segment sends the room into the app', () => {
    expect(/Hands-on in the app/i.test(L().facilitator.howToRun)).toBe(true);
    expect(/Search it out/i.test(L().facilitator.howToRun)).toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(L().quiz.questions.length).toBeGreaterThanOrEqual(6);
  });

  it('the benefits are real takeaways rather than stubs', () => {
    expect(L().benefits.length).toBeGreaterThanOrEqual(6);
    for (const b of L().benefits) expect(b.length).toBeGreaterThan(80);
  });
});

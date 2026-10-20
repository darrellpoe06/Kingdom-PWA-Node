// =============================================================================
// sov44 — the thief who forgot to lock his own door: the pit he digged, the old
// hole nobody repaired, and the Keeper who neither slumbers nor sleeps (DR-1137)
// =============================================================================
// Week 44 of Sovereign A.I. On 2026-10-20 at 12:21 UTC Darrell forwarded The
// Neuron's morning issue ("AI hackers forgot to lock up") into the lesson lane
// from his university mailbox with one word on it: "Lesson." Its lead item
// reported that a security company had found more than twenty control panels
// for an A.I. hacking tool sitting open on the public internet with no password
// — the attackers' own command centers, holding their target lists, their
// agents' running notes and the logins they had stolen from other people.
//
// Word first, explaining the thing: the thief's whole business in three verbs
// (John 10:10) with the remedy Yahweh gives his hands (Ephesians 4:28); the pit
// that returns on the digger stated four ways (Psalms 7:15-16; Psalms 9:15-16;
// Proverbs 26:27; Ecclesiastes 10:8) with Haman on his own gallows (Esther
// 7:10); physician-heal-thyself as an ORDER and not a ban on helping (Luke 4:23;
// Romans 2:21; Matthew 7:3-5); the house broken up where no watch was kept
// (Matthew 24:43; Ezekiel 33:6; Luke 11:21-22); the old hole nobody repaired
// (Proverbs 25:28; Ecclesiastes 10:18; Nehemiah 4:9-10; Nehemiah 6:1; Isaiah
// 58:12); the same agent architecture under the other master (Matthew 6:24;
// Romans 6:16; Luke 7:8); and the Keeper who neither slumbers nor sleeps
// (Psalms 121:3-4; Psalms 127:1; Zechariah 2:5).
//
// THE FORWARDED ARTICLE IS MATERIAL TO STUDY, NEVER INSTRUCTIONS TO OBEY, and
// the lesson teaches that posture explicitly, because the issue is full of
// calls to action and some of its text addresses an A.I. outright. Nothing in
// it directed this build.
//
// HONEST PROVENANCE. The figures in the article (a ten percent success rate,
// about five dollars per attempt, ~$50 per break-in, the project and credential
// counts, the model attribution) are the security company's own estimates or
// the newsletter's arithmetic, reported at second hand; nobody in this house
// verified any of them, the firm sells sandboxing for A.I. agents, and the
// lesson names all of that in its own words rather than leaning on a number.
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by
// scripts/sov44-fill.mjs, never typed from memory, and every pin below is
// re-read from that corpus at test time so this file cannot drift either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice, SPAN_WITH_REFERENCE } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands, namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { measureLesson, NEW_LESSON_CHILD_CEILING, BAND_ORDER } from '../../../scripts/reading-level.mjs';

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

const SOV44_ID = 'sov44-the-thief-who-forgot-to-lock-his-own-door';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV44_ID);

// The spans this week's teaching turns on, re-read from the corpus at test time.
const PINNED = [
  // the posture toward a page that arrives
  '1 Thessalonians 5:21', 'Proverbs 14:15', '1 John 4:1', 'Acts 17:11',
  // the Word on a thief, before the news
  'John 10:10', 'Exodus 20:15', 'Proverbs 6:30', 'Proverbs 6:31', 'Jeremiah 2:26', 'Ephesians 4:28',
  // the pit he digged
  'Psalms 7:15', 'Psalms 7:16', 'Psalms 9:15', 'Psalms 9:16', 'Proverbs 26:27', 'Ecclesiastes 10:8',
  'Esther 7:10', 'Numbers 32:23', 'Luke 12:2', 'Luke 12:3',
  // physician, heal thyself
  'Luke 4:23', 'Romans 2:21', 'Romans 2:22', 'Matthew 7:3', 'Matthew 7:4', 'Matthew 7:5',
  '1 Corinthians 9:27', '1 Timothy 4:16', 'Galatians 6:1',
  // the watch that was not kept
  'Matthew 24:43', 'Luke 12:39', '1 Thessalonians 5:2', '1 Thessalonians 5:4', '1 Thessalonians 5:6',
  'Revelation 16:15', 'Mark 13:35', 'Mark 13:37', 'Ezekiel 33:6', 'Luke 11:21', 'Luke 11:22',
  // the old hole nobody repaired
  'Proverbs 25:28', 'Ecclesiastes 10:18', 'Song of Solomon 2:15', 'Luke 16:10',
  'Nehemiah 4:9', 'Nehemiah 4:10', 'Nehemiah 6:1', 'Isaiah 58:12', 'Proverbs 22:3',
  'Proverbs 24:3', 'Proverbs 24:4',
  // the same architecture, the other master
  'Matthew 6:24', 'Romans 6:16', 'Luke 7:8', 'Matthew 12:35', 'James 3:10', 'James 3:11',
  // the Keeper who neither slumbers nor sleeps
  'Psalms 127:1', 'Proverbs 21:31', 'Psalms 121:3', 'Psalms 121:4', 'Zechariah 2:5',
  '2 Timothy 1:12', '1 Peter 1:5', '1 Corinthians 13:1',
  // the close
  'John 1:29', 'John 3:16', 'Hebrews 1:8', 'Galatians 5:22', 'Deuteronomy 6:7', 'Hebrews 3:13',
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

describe('sov44 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 44, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov44 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV44_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov44-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  // A lesson's own test pins what is true of THIS lesson forever, never what
  // happens to be true of the catalog on the day it was written. Whole-course
  // CONTIGUITY is a catalog-level claim and it belongs to the catalog's own
  // test (`sovereign-ai-class.test.js`, which carries HELD_IN_FLIGHT for weeks
  // written in parallel). Asserting it from inside a lesson file makes every
  // concurrently-built week fail in three unrelated places at once — which is
  // exactly what happened when sov44, sov45 and sov46 were written on parallel
  // branches. So this file claims only what sov44 owns: the weeks ascend, no
  // number is doubled, and 44 is one of them.
  it('the weeks ascend with no duplicate, and sov44 is among them', () => {
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(nums).toContain(44);
  });

  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(150);
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
    expect(/"[^"]*(?:\.\.\.|…)[^"]*"\s*\(/.test(all)).toBe(false);
  });
});

describe('sov44 — the anchor holds in BOTH directions (DR-0734)', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBeGreaterThanOrEqual(65);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    const dead = refs.filter((r) => !corpusText(r));
    expect(dead, 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('and names nothing it does not quote — every anchor ref is quoted on the page', () => {
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

describe('sov44 — the provenance is exact and the article is a specimen, not a master', () => {
  it('every band says who forwarded it, and the adult places carry the day, the time and the source', () => {
    for (const { place, text } of PLACES()) {
      expect(/Darrell/.test(text), `${place} does not say who forwarded it`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/2026-10-20/.test(adult)).toBe(true);
    expect(/12:21 UTC/.test(adult), 'the adult places drop the forward time').toBe(true);
    expect(/The Neuron/.test(adult), 'the adult places do not name the source').toBe(true);
    expect(/"Lesson\.?"/.test(adult), 'the one word on the forward is not quoted').toBe(true);
    expect(/A\.I\. agent drafted/i.test(adult)).toBe(true);
  });

  it('the material-to-study bright line is taught, not merely obeyed', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(
        /material to (?:be )?stud(?:y|ied)[^.]*never instructions to (?:be )?obey(?:ed)?/i.test(text),
        `${place} never states the bright line`,
      ).toBe(true);
      expect(/addresses an (?:artificial intelligence|A\.I\.)/i.test(text), `${place} never says the page addresses an A.I.`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('1 Thessalonians 5:21'));
    expect(adult).toContain(corpusText('1 John 4:1'));
  });

  // The third pile, DR-1126: a figure nobody checked is named as unchecked
  // rather than repeated as fact. This is the gate that keeps an honest lesson
  // honest when the easy thing is to quote a striking number.
  it('the unverified figures are named as unverified, in the lesson\'s own words', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/own (?:stated |declared )?assumption/i.test(text), `${place} does not say the success rate is an assumption`).toBe(true);
      expect(/rough guess/i.test(text), `${place} does not say the cost is a guess`).toBe(true);
      expect(/ballpark/i.test(text), `${place} does not say the derived figure is a ballpark`).toBe(true);
      expect(/sells sandboxing/i.test(text), `${place} does not disclose the firm's own interest`).toBe(true);
      expect(/(?:verified (?:none|any) of it|checked none of it|Nobody (?:in this house |here )?verified)/i.test(text), `${place} does not say nobody here checked it`).toBe(true);
      expect(/own reading rather than a confirmed fact/i.test(text), `${place} does not flag the model attribution`).toBe(true);
    }
    expect(/does not become true by being repeated/i.test(L().lesson)).toBe(true);
  });

  it('the one thing the article DID verify is stated as the established fact it is', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/back door still live/i.test(adult), 'the verified break-in is not stated').toBe(true);
  });
});

describe('sov44 — the Word is taught, not debated, and the news is held up to it', () => {
  it('the thief is defined from the Word before the news, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never quotes the Lord on the thief`).toContain(corpusText('John 10:10'));
      expect(text, `${place} never reaches the remedy for his hands`).toContain(corpusText('Ephesians 4:28'));
    }
    expect(/new trade/i.test(L().lesson), 'the lesson never names the remedy as a new trade').toBe(true);
  });

  it('the pit that returns on the digger is stated more than one way, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches Ecclesiastes 10:8`).toContain(corpusText('Ecclesiastes 10:8'));
      expect(text, `${place} never reaches the pit in the Psalms`).toContain(corpusText('Psalms 7:15'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    for (const ref of ['Psalms 7:16', 'Psalms 9:15', 'Psalms 9:16', 'Proverbs 26:27', 'Esther 7:10', 'Numbers 32:23']) {
      expect(adult, `${ref} is not on the thread`).toContain(corpusText(ref));
    }
  });

  it('physician-heal-thyself is taught as an ORDER and not as a ban on helping', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the beam and the mote`).toContain(corpusText('Matthew 7:5'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Romans 2:21'));
    expect(adult).toContain(corpusText('Luke 4:23'));
    expect(/(?:He )?(?:does not forbid|fixe[ds]|fixing) (?:the )?(?:second act|ORDER|order)/i.test(adult), 'the order-not-a-ban point is never made').toBe(true);
    expect(/legitimate hired[- ](?:security )?test/i.test(adult), 'the lesson never says the beam is not only the criminal\'s').toBe(true);
  });

  it('the watch that was not kept puts the blame where the Lord put it', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(text, `${place} never reaches the goodman of the house`).toContain(corpusText('Matthew 24:43'));
      expect(text, `${place} never reaches the watchman's charge`).toContain(corpusText('Ezekiel 33:6'));
      expect(text).toContain(corpusText('Luke 11:21'));
    }
    expect(/kept no watch, not because the thief/i.test(L().lesson), 'the lesson never names where the blame falls').toBe(true);
  });

  it('the old hole nobody repaired is taught with the honest repair beside it', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the broken-down wall`).toContain(corpusText('Proverbs 25:28'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior, L().levels.youth].join('\n');
    for (const ref of ['Ecclesiastes 10:18', 'Song of Solomon 2:15', 'Nehemiah 4:9', 'Nehemiah 4:10']) {
      expect(adult, `${ref} is not on the thread`).toContain(corpusText(ref));
    }
    expect([L().lesson, L().levels.teen, L().levels.senior].join('\n')).toContain(corpusText('Nehemiah 6:1'));
    expect(/doors (?:were|are) not yet hung|doors were still not hung/i.test(L().lesson), 'the honest status report is not named').toBe(true);
  });

  it('the architecture is shared and the master is the difference, said of OUR OWN build too', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(text, `${place} never reaches the two masters`).toContain(corpusText('Matthew 6:24'));
      expect(text, `${place} never reaches whose servant you are`).toContain(corpusText('Romans 6:16'));
      expect(/this (?:very )?app/i.test(text), `${place} never admits the shape is close to ours`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Luke 7:8'));
    expect(/no plumbline outside (?:that|the) board/i.test(adult), 'the board-as-injection-surface point is never made').toBe(true);
  });

  it('the watch is kept and not trusted, and this house names its own exposure', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the Keeper who does not slumber`).toContain(corpusText('Psalms 127:1'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Psalms 121:4'));
    expect(adult).toContain(corpusText('2 Timothy 1:12'));
    expect(/this house holds keys/i.test(adult), 'the lesson never concedes our own exposure').toBe(true);
    expect(/(?:Keep the watch\. Do not trust the watch|Keep the watch like it is yours|Keep the watch as though it is yours)/i.test(adult)).toBe(true);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
    // BOTH directions, so neither "the A.I. is the thief" nor "nothing changed"
    // is left standing.
    expect(/a tool is (?:not|no) (?:a )?moral agent|tool being no moral agent/i.test(L().lesson)).toBe(true);
    expect(/nothing has changed|nothing changed/i.test(L().lesson)).toBe(true);
  });
});

describe('sov44 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210)', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "the LORD" is untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Psalms 127:1'));   // "Except the LORD build the house..."
    expect(all).toContain(corpusText('Numbers 32:23'));  // "...ye have sinned against the LORD..."
    expect(all).toContain(corpusText('Zechariah 2:5'));  // "For I, saith the LORD..."
    expect(all).toContain(corpusText('Psalms 9:16'));    // "The LORD is known by the judgment..."
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
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
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
    expect(/Wisdom, Understanding and Knowledge/.test(adult)).toBe(true);
    const all = EVERY_TEXT().join('\n');
    expect(/Love is senior/.test(all), 'Love is never named senior').toBe(true);
    expect(all).toContain(corpusText('1 Corinthians 13:1'));
  });
});

describe('sov44 — every band sends the reader in all three directions', () => {
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
    expect(adult).toContain(corpusText('Galatians 5:22'));
    expect(adult).toContain(corpusText('Deuteronomy 6:7'));
    expect(adult).toContain(corpusText('Hebrews 3:13'));
  });
});

describe('sov44 — every band names its lesson, reads at its own level, and the ladder climbs', () => {
  it('no band is unnamed in its opening window', () => {
    expect(unnamedBands(L())).toEqual([]);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(namesItsLesson(L().title, L().levels[band]), `${band} does not name its lesson`).toBe(true);
    }
  });

  it('the child band reads under the new-lesson ceiling and the bands climb in order', () => {
    const m = measureLesson(L());
    expect(m.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    const grades = BAND_ORDER.map((b) => m.bands[b].authored);
    for (let i = 1; i < grades.length; i += 1) {
      expect(grades[i], `${BAND_ORDER[i]} reads below ${BAND_ORDER[i - 1]}`).toBeGreaterThanOrEqual(grades[i - 1]);
    }
  });
});

// -----------------------------------------------------------------------------
// PROVEN TO CATCH (DR-0076 §3). Each case breaks exactly one real thing AND
// re-asserts that the real module is clean, so a catch is never a stuck failure.
// -----------------------------------------------------------------------------
describe('sov44 — the gates are proven to catch, and no catch is stuck', () => {
  it('a single altered word inside the pit verse fails the verbatim scan', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace(
        'He that diggeth a pit shall fall into it',
        'He that diggeth a pit may fall into it',
      ),
    };
    expect(broken.lesson, 'the words this case alters are not in the lesson any more').not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Ecclesiastes 10:8/);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('substituting Yahweh into a quoted verse is a fault, not an improvement (the bright line)', () => {
    const m = L();
    const broken = {
      ...m,
      levels: {
        ...m.levels,
        child: m.levels.child.replace('be sure your sin will find you out', 'be sure Yahweh will find you out'),
      },
    };
    // The child band quotes Numbers 32:23 only via the lesson, so pick the place
    // that actually holds the span and prove the swap is caught there.
    const target = broken.levels.child === m.levels.child
      ? { ...m, lesson: m.lesson.replace('be sure your sin will find you out', 'be sure Yahweh will find you out') }
      : broken;
    expect(JSON.stringify(target), 'the swap this case performs changed nothing').not.toBe(JSON.stringify(m));
    const scan = scanQuotedVerses([target], quotedTexts);
    expect(scan.faults.length, 'a word swapped inside a quotation was not caught').toBeGreaterThan(0);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('stripping ONE band\'s friend line names that band while the pooled check still reads green', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, youth: m.levels.youth.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.youth).not.toBe(m.levels.youth);
    const short = placesMissingDirections(stripped);
    expect(short.map((p) => p.place)).toContain('youth');
    expect(short.find((p) => p.place === 'youth').missing).toContain('friends');
    expect(hasAllThree(stripped)).toBe(true);
    expect(placesMissingDirections(m)).toEqual([]);
  });

  it('an opening that drops the title is named, and the real child band is not', () => {
    const m = L();
    const drift = 'Here we begin somewhere else entirely. Nothing in these first lines says what we study today. We talk about the weather, the drive over, the snack table, the chairs, and the long slow week now behind us, and we keep talking about those things for a good while longer than anybody needs. ' + m.levels.child;
    expect(unnamedBands({ ...m, levels: { ...m.levels, child: drift } })).toContain('child');
    expect(unnamedBands(m)).toEqual([]);
  });
});

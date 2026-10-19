// =============================================================================
// sov41 — the agent that drowned in its own output: a bigger window is not a
// sounder mind, the pointer that keeps what matters, and the clear "It is
// finished" (DR-1114)
// =============================================================================
// Week 41 of Sovereign A.I., captured 2026-10-19 by the Gmail-lesson-intake Way
// from The Neuron of that morning, which Darrell forwarded from
// dpoe@illinois.edu at 12:24 UTC with one word above it: "Lesson".
//
// The article's measured spine: one tool returned 214KB of logs, the answers got
// worse, and NOTHING THREW AN ERROR; eight log fetches left an agent holding
// about 252,000 tokens; one plugin cut that to about 9,000 by putting the pile
// in storage and handing back a short id; a smaller sliding window measured
// cheaper and was worse, because it throws away whole turns including what the
// agent learned; and an agent that retried the same call fourteen times dropped
// to two once it had a clear "done" signal.
//
// Word first: a sound mind, not a full one (2 Timothy 1:7; 2 Corinthians 10:5);
// the way that SEEMETH right and the church that knew not (Proverbs 14:12;
// Revelation 3:17); more is not the remedy (Ecclesiastes 1:18); the twelve
// stones that are a memory pointer with a retrieval protocol (Joshua 4:6-7)
// against the Word hidden IN the heart (Psalms 119:11); the cheap window that
// forgat (Psalms 106:13); the clearest "done" ever given (John 19:30) held
// carefully beside the importunity the Word commands (Luke 18:1; Luke 11:9);
// the price that never buys truth (Proverbs 23:23); the self-run scale
// (Proverbs 11:1); and the tower whose cost was not counted (Luke 14:28-30).
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by a
// generator, never typed from memory, and every pin below is re-read from that
// corpus at test time so this file cannot drift from the text either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';

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

const SOV41_ID = 'sov41-the-agent-that-drowned-in-its-own-output';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV41_ID);

// The spans this week's teaching actually turns on. Each is re-read from the
// corpus at test time, so a pin can never be "what I remember the verse saying".
const PINNED = [
  '2 Corinthians 10:5', '2 Timothy 1:7', 'Proverbs 4:23', 'Isaiah 26:3',
  'Proverbs 14:12', 'Revelation 3:17', 'Psalms 19:12', '1 Corinthians 4:2',
  'Ecclesiastes 1:18', 'Ecclesiastes 12:12', 'Matthew 6:7',
  'Joshua 4:6', 'Joshua 4:7', 'Exodus 17:14', 'Psalms 119:11', 'Luke 10:20',
  'Psalms 106:13', 'Deuteronomy 4:9', '2 Peter 1:9', 'Proverbs 4:7',
  'John 19:30', 'Genesis 2:2', 'Hebrews 4:10', 'Philippians 1:6', 'Proverbs 26:11',
  'Luke 18:1', 'Luke 11:9',
  'Proverbs 23:23', 'Acts 8:20', '1 Peter 1:18', '1 Peter 1:19', 'Proverbs 17:16',
  'Jeremiah 23:30', 'Proverbs 11:1', 'Proverbs 25:2',
  'Luke 14:28', 'Luke 14:29', 'Luke 14:30', 'Psalms 127:1',
  'Proverbs 24:3', 'Proverbs 24:4', '1 Corinthians 13:1', 'Psalms 19:14',
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

describe('sov41 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 41, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov41 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV41_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov41-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  it('the weeks run in order and sov41 is the last of them', () => {
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(Math.max(...nums)).toBe(41);
    expect(SOVEREIGN_AI_MODULES[SOVEREIGN_AI_MODULES.length - 1].id).toBe(SOV41_ID);
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

  it('anchor.ref names every verse the lesson stands on, and each one resolves (DR-0734)', () => {
    const m = L();
    const refs = anchorRefs(m);
    expect(refs.length).toBeGreaterThanOrEqual(80);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    const dead = refs.filter((r) => !corpusText(r));
    expect(dead, 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('PROVEN-TO-CATCH: a single altered word in a quoted verse is caught', () => {
    const m = L();
    const broken = { ...m, lesson: m.lesson.replace('bringing into captivity every thought', 'bringing into captivity some thoughts') };
    expect(broken.lesson).not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    // and the real module is still clean, so the catch is not a stuck failure
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });
});

describe('sov41 — the measured record is stated as the article, with the caveat kept', () => {
  it('every band carries the failure that threw no error', () => {
    for (const { place, text } of PLACES()) {
      expect(/threw no error|nothing threw an error|No red light|nothing beeped/i.test(text), `${place} never says the failure was silent`).toBe(true);
    }
  });

  it('the source is named where it is discussed as a source, and the child band still says who brought it', () => {
    // The child band carries the provenance at a child's level - "Darrell read
    // about..." - because naming a newsletter and a marked subject line to a
    // small child is noise, not honesty. The four places that actually weigh
    // the claim must name the letter and the one word he wrote on it.
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/The Neuron/.test(text), `${place} does not name the newsletter`).toBe(true);
      expect(/"Lesson"/.test(text), `${place} does not carry the one word he wrote`).toBe(true);
    }
    expect(/Darrell/.test(L().levels.child), 'the child band does not say who brought it').toBe(true);
  });

  it('the article\'s OWN caveat is kept in front of the reader, never buried', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/measure[sd]? how much text stays in context, (?:NOT|not) whether the answers improved|measured context size, not answer quality/i.test(adult)).toBe(true);
  });

  it('the self-run benchmark is named as self-run in every unit a reader meets it in', () => {
    // A unit is a prose place, or one quiz item taken whole (question, options
    // and explanation) - which is how a reader actually meets it on screen.
    const units = PLACES().map(({ place, text }) => [place, text]);
    units.push(['bigIdea', L().bigIdea], ['anchor.theme', L().anchor.theme], ['benefits', (L().benefits || []).join('\n')]);
    for (const q of L().quiz.questions) units.push(['quiz', [q.q, ...q.options, q.explain].join('\n')]);
    const named = /ran (?:those|that) tests? itself|self-run|ran the test itself|ran the benchmark on which/i;
    for (const [where, text] of units) {
      if (!/77\.0/.test(text)) continue;
      expect(named.test(text), `${where} quotes 77.0 without saying who ran the test`).toBe(true);
    }
    // and it is checking something: at least two units do carry the number
    expect(units.filter(([, t]) => /77\.0/.test(t)).length).toBeGreaterThanOrEqual(2);
  });

  it('what was never checked is said plainly, and the sponsor copy is refused', () => {
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(/did not watch/i.test(adult)).toBe(true);
    expect(/reproduce[d]? (?:none|no)|reproduced none of the numbers|reproduce a single number/i.test(adult)).toBe(true);
    expect(/sponsor copy[^.]*(?:advertis|is not taught)/i.test(adult)).toBe(true);
    expect(/A\.I\. agent drafted this page/i.test(adult)).toBe(true);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    const close = L().lesson;
    expect(/ESTABLISHED/i.test(close)).toBe(true);
    expect(/OPEN,/i.test(close)).toBe(true);
    expect(/OVER-REACH/i.test(close)).toBe(true);
  });
});

describe('sov41 — the pointer is taught without teaching the Word out of the heart', () => {
  it('the memorial pointer and its counterpart are both present', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(adult).toContain(corpusText('Joshua 4:7'));
    expect(adult).toContain(corpusText('Psalms 119:11'));
    expect(/pile goes outside|pile goes to|goes outside/i.test(adult), 'the distinction is never drawn').toBe(true);
  });

  it('importunity is protected, so nobody leaves this week praying less', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/Luke 18:1|importunity|always to pray/i.test(text), `${place} drops the guard on persistent prayer`).toBe(true);
    }
    expect(L().lesson).toContain(corpusText('Luke 18:1'));
    expect(/not a retry loop|is NOT a retry loop/i.test(L().lesson)).toBe(true);
  });

  it('our own house is named with its limit, not as a boast', () => {
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(/have not (?:instrumented|measured)/i.test(adult), 'the limit is not stated').toBe(true);
    expect(/252,000/.test(adult)).toBe(true);
  });
});

describe('sov41 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210)', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('2 Corinthians 10:5'));   // "...knowledge of God..."
    expect(all).toContain(corpusText('Joshua 4:7'));           // "...ark of the covenant of the LORD..."
    expect(all).toContain(corpusText('Psalms 127:1'));         // "Except the LORD build the house..."
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(all).toContain(corpusText('John 1:29'));
    expect(all).toContain(corpusText('John 3:16'));
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
});

describe('sov41 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band carries the skill and the rhythm in the lesson\'s own words', () => {
    for (const { place, text } of PLACES()) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen (?:all the way )?to the end|listen all the way through/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
    }
  });

  it('PROVEN-TO-CATCH: stripping ONE band\'s friend line names that band while the module still reads whole', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, youth: m.levels.youth.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.youth).not.toBe(m.levels.youth);
    // the per-band check names the youth band...
    expect(placesMissingDirections(stripped).map((p) => p.place)).toContain('youth');
    // ...while the pooled check still reads green, which is exactly why the
    // per-band check has to exist (DR-0795).
    expect(hasAllThree(stripped)).toBe(true);
    // and the real module is clean, so this catch is not a stuck failure
    expect(placesMissingDirections(m)).toEqual([]);
  });

  it('growth is measured the Word\'s way, qualitative and quantitative', () => {
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Galatians 5:22'));      // fruit
    expect(adult).toContain(corpusText('Deuteronomy 6:7'));     // occasions
    expect(/Hebrews 3:13/.test(adult)).toBe(true);              // days
  });
});

describe('sov41 — the facilitator guide is whole', () => {
  it('carries all three facilitator fields', () => {
    const f = L().facilitator;
    expect(f.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(typeof f.howToRun).toBe('string');
    expect(f.discussionPrompts.length).toBeGreaterThanOrEqual(6);
  });

  it('every discussion prompt opens on a verse or the record, then asks something', () => {
    for (const p of L().facilitator.discussionPrompts) {
      expect(/\?/.test(p), `prompt asks nothing: ${p.slice(0, 60)}`).toBe(true);
    }
  });

  it('the hands-on segment sends the room into the app', () => {
    expect(/Hands-on in the app/i.test(L().facilitator.howToRun)).toBe(true);
    expect(/Loop Health/i.test(L().facilitator.howToRun)).toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(L().quiz.questions.length).toBeGreaterThanOrEqual(5);
  });
});

// =============================================================================
// sov43 — work beside learning is apostolic, not experimental: the Lord's
// release, the Word-first algorithm run across the Word, what apostolic means,
// and context is King (DR-1129)
// =============================================================================
// Week 43 of Sovereign A.I., spoken by Darrell into the app on 2026-10-20 while
// he was reading week 42 at step 13 of 31, the step where Yahweh attaches His
// own name to a release of debt (Deuteronomy 15:2): "Work beside learning is
// apostolic, not experimental: Lords Release... Details Word first algorithms
// across the Word... explain apostolic etc... context is King..." And when the
// first draft began editing week 42: "This is a separate lesson... unique to
// what I'm asking!" So this is its own week, built on his five phrases.
//
// Word first, explaining the thing: the five-step method (Psalms 119:160;
// Nehemiah 8:8; Isaiah 28:10; 2 Timothy 2:15; Acts 17:11) run on the very verse
// he was reading, where the verse after it limits the release to the covenant
// family (Deuteronomy 15:3) and the floor of the chapter grounds it in
// redemption remembered (Deuteronomy 15:15); the release across the Word from
// Exodus 21:2 to Luke 4:21 and Colossians 2:14; "apostolic" explained as a sent
// one's pattern (John 13:16; Luke 6:13; Acts 2:42; 2 Thessalonians 3:9); work
// beside learning shown to be that pattern (Mark 6:3; Acts 18:3; 1 Thessalonians
// 2:9; Jeremiah 6:16) with the limit Paul named (1 Corinthians 9:14).
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by
// scripts/sov43-fill.mjs, never typed from memory, and every pin below is
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

const SOV43_ID = 'sov43-work-beside-learning-is-apostolic-and-the-release-that-carries-his-name';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV43_ID);

// The spans this week's teaching turns on, re-read from the corpus at test time.
const PINNED = [
  // the algorithm
  'Psalms 119:160', 'Nehemiah 8:8', 'Isaiah 28:10', '1 Corinthians 2:13', '2 Peter 1:20', '2 Peter 1:21',
  'Luke 24:27', 'Luke 24:44', 'Luke 24:45', '2 Timothy 2:15', 'Acts 17:11', 'John 5:39',
  // context is King, on the verse he was reading
  'Deuteronomy 15:1', 'Deuteronomy 15:2', 'Deuteronomy 15:3', 'Deuteronomy 15:4', 'Deuteronomy 15:5',
  'Deuteronomy 15:9', 'Deuteronomy 15:10', 'Deuteronomy 15:11', 'Deuteronomy 15:15',
  // the release across the Word
  'Exodus 21:2', 'Leviticus 25:10', 'Nehemiah 10:31',
  'Jeremiah 34:8', 'Jeremiah 34:9', 'Jeremiah 34:10', 'Jeremiah 34:11', 'Jeremiah 34:14', 'Jeremiah 34:17',
  'Isaiah 61:1', 'Isaiah 61:2', 'Luke 4:18', 'Luke 4:19', 'Luke 4:21', 'Matthew 6:12',
  'Matthew 18:27', 'Matthew 18:32', 'Matthew 18:33', 'Colossians 2:14', 'Philemon 1:18', 'Philemon 1:19',
  // apostolic, explained
  'John 13:16', 'Luke 6:13', 'Hebrews 3:1', 'John 20:21', 'Acts 2:42', 'Ephesians 2:20',
  'Galatians 1:11', 'Galatians 1:12', '1 Corinthians 11:1', '2 Thessalonians 3:9',
  // work beside learning
  'Mark 6:3', 'Luke 2:52', 'Matthew 4:18', 'Matthew 4:19', 'Acts 18:3', 'Acts 20:33', 'Acts 20:34', 'Acts 20:35',
  '1 Corinthians 4:12', '1 Thessalonians 2:9', '2 Thessalonians 3:7', '2 Thessalonians 3:8', '2 Thessalonians 3:10',
  '1 Thessalonians 4:11', '1 Thessalonians 4:12', 'Ephesians 4:28', 'Jeremiah 6:16', 'Ecclesiastes 1:9', 'Hebrews 5:14',
  // the limit Paul named
  '1 Corinthians 9:14', '1 Corinthians 9:15', '1 Corinthians 9:18', 'Matthew 10:10', 'Luke 10:7', '1 Timothy 5:18',
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

describe('sov43 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 43, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov43 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV43_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov43-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  // A lesson's own test pins what is true of that lesson forever, never what
  // happens to be true of the catalog on the day it was written (sov41's and
  // sov42's "is the last of them" each expired the day the next week landed).
  it('the weeks run in order, with no gaps, and sov43 is among them', () => {
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(nums).toContain(43);
    expect(nums).toEqual(Array.from({ length: Math.max(...nums) }, (_, i) => i + 1));
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

describe('sov43 — the anchor holds in BOTH directions (DR-0734)', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBeGreaterThanOrEqual(80);
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

describe('sov43 — the word is his, worked the way the Word explains it', () => {
  it('every band says who spoke it and that it is its own lesson, not an edit to week 42', () => {
    for (const { place, text } of PLACES()) {
      expect(/Darrell/.test(text), `${place} does not say who spoke it`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/2026-10-20/.test(adult)).toBe(true);
    expect(/week 42/.test(adult)).toBe(true);
    expect(/(?:not that lesson|separate lesson)/i.test(adult), 'the page does not say it is its own lesson').toBe(true);
    expect(/A\.I\. agent drafted/i.test(adult)).toBe(true);
  });

  it('his five phrases are all on the page, in the adult lesson and the teen band', () => {
    for (const place of ['lesson', 'teen']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      for (const phrase of [/work beside learning is apostolic/i, /not experimental/i, /Lord's release/i, /Word-first algorithm/i, /context is King/i, /apostolic/]) {
        expect(phrase.test(text), `${place} drops ${phrase}`).toBe(true);
      }
    }
  });

  it('the algorithm is five steps in order, and the diagnosis is stated', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    for (const step of ['Step one', 'Step two', 'Step three', 'Step four', 'Step five']) {
      expect(L().lesson.includes(step), `the lesson drops ${step}`).toBe(true);
    }
    expect(/ran step five first/.test(adult)).toBe(true);
    expect(L().lesson).toContain(corpusText('Nehemiah 8:8'));
    expect(L().lesson).toContain(corpusText('Acts 17:11'));
  });

  it('context is King is RUN on Deuteronomy 15:2, with the verse after it and the floor of the chapter, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never quotes the verse he was reading`).toContain(corpusText('Deuteronomy 15:2'));
      expect(text, `${place} never reads the verse after it`).toContain(corpusText('Deuteronomy 15:3'));
      expect(text, `${place} never reaches the floor of the chapter`).toContain(corpusText('Deuteronomy 15:15'));
    }
    expect(/redemption remembered on a calendar/i.test(L().lesson)).toBe(true);
  });

  it('the release is run across the Word and ends in Nazareth, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches Luke 4:21`).toContain(corpusText('Luke 4:21'));
    }
    const adult = [L().lesson, L().levels.teen].join('\n');
    for (const ref of ['Exodus 21:2', 'Nehemiah 10:31', 'Jeremiah 34:17', 'Isaiah 61:1', 'Matthew 6:12', 'Colossians 2:14', 'Philemon 1:18']) {
      expect(adult, `${ref} is not on the thread`).toContain(corpusText(ref));
    }
    expect(/He is the Releaser/.test(L().lesson)).toBe(true);
  });

  it('apostolic is explained before it is used, as a sent one\'s pattern, with the test stated', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never explains the word`).toContain(corpusText('Luke 6:13'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('John 13:16'));
    expect(adult).toContain(corpusText('Acts 2:42'));
    expect(adult).toContain(corpusText('2 Thessalonians 3:9'));
    expect(/received? it from Him, live(?:d)? it, and (?:leave|left) it to be followed/i.test(adult)).toBe(true);
  });

  it('work beside learning is shown apostolic and the difference from an experiment is stated', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches Paul's tents`).toContain(corpusText('Acts 18:3'));
      expect(text, `${place} never reaches the carpenter`).toContain(corpusText('Mark 6:3'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(/An experiment is (?:something )?tried to (?:find out|see) whether it works/i.test(adult)).toBe(true);
    expect(adult).toContain(corpusText('Jeremiah 6:16'));
  });

  it('the limit Paul named keeps the pattern from becoming a club', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(text, `${place} drops the right Paul laid down`).toContain(corpusText('1 Corinthians 9:14'));
    }
    expect(/not (?:against|forbid)[^.]*paid teacher|teachers? may not be paid/i.test(L().lesson)).toBe(true);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const place of ['lesson', 'teen']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
    expect(/not a statute book/i.test(L().lesson)).toBe(true);
  });
});

describe('sov43 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210)', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "the LORD" is untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Deuteronomy 15:2'));  // "...the LORD’s release."
    expect(all).toContain(corpusText('Jeremiah 34:17'));    // "...saith the LORD..."
    expect(all).toContain(corpusText('Isaiah 61:1'));       // "...the Lord GOD..."
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
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/Wisdom, Understanding and Knowledge/.test(adult)).toBe(true);
  });
});

describe('sov43 — every band sends the reader in all three directions', () => {
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

describe('sov43 — every band names its lesson, reads at its own level, and the ladder climbs', () => {
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
describe('sov43 — the gates are proven to catch, and neither catch is stuck', () => {
  it('a single altered word inside the verse he was reading fails the verbatim scan', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace('Every creditor that lendeth ought unto his neighbour shall release it', 'Every creditor that lendeth ought unto his neighbour may release it'),
    };
    expect(broken.lesson, 'the words this case alters are not in the lesson any more').not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Deuteronomy 15:2/);
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

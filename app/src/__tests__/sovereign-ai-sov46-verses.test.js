// =============================================================================
// sov46 — the helper that must see everything: Hezekiah's open treasure house,
// the goods that are another man's, and the sight that belongs to Yahweh alone
// =============================================================================
// Week 46 of Sovereign A.I., built from a teaching Darrell forwarded into the
// lesson lane on 2026-10-20: that morning's IT Brew (itbrew@morningbrew.com,
// sent 09:01, subject "Muse behind it all"), carried over from his university
// address with one word above it — "Lesson."
//
// WHICH STORY, AND WHY. The issue held FIVE unrelated items: the lead
// cybersecurity story on Meta's new agentic assistant Muse; a strategy piece on
// the forward-deployed engineer; an operations piece on data readiness; a short
// reading list (including a mass intrusion into hundreds of French
// supermarkets' refrigeration systems); and a sponsor's advertisement about
// agent autonomy. The lesson teaches the FIRST — the story the subject line
// named, the one the editors led with, and the one a course about building our
// own exists for: an assistant whose helpfulness is bought with permission to
// read everything. The page names the other four so no reader has to guess.
//
// The forwarded article is MATERIAL under study, never an instruction.
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by
// scripts/sov46-fill.mjs, never typed from memory, and every pin below is
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
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

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

const SOV46_ID = 'sov46-the-helper-that-must-see-everything';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV46_ID);

// The spans this week's teaching turns on, re-read from the corpus at test time.
const PINNED = [
  // total sight is His
  'Psalms 139:1', 'Psalms 139:2', 'Psalms 139:3', 'Psalms 139:4', 'Hebrews 4:13',
  'Proverbs 15:3', 'Jeremiah 17:10', '1 Chronicles 28:9', '1 Samuel 16:7', 'Matthew 10:26',
  // the king who shewed them everything
  '2 Kings 20:12', '2 Kings 20:13', '2 Kings 20:15', '2 Kings 20:16', '2 Kings 20:17',
  '2 Kings 20:18', 'Isaiah 39:2', '2 Chronicles 32:31',
  // another man's goods
  'Luke 16:10', 'Luke 16:11', 'Luke 16:12', 'Exodus 22:7', 'Exodus 22:8',
  'Genesis 39:4', 'Genesis 39:6', 'Genesis 39:8', 'Genesis 39:9', '1 Corinthians 4:2',
  // the chain of hands is a one-way door
  'Proverbs 25:9', 'Proverbs 25:10', 'Proverbs 11:13', 'Proverbs 20:19', 'Ecclesiastes 10:20',
  // the oldest pitch
  'Genesis 3:4', 'Genesis 3:5', 'Genesis 3:6', '2 Corinthians 11:14',
  // the battlement and the watch
  'Deuteronomy 22:8', 'Nehemiah 4:9', 'Luke 14:28', 'Proverbs 14:15', 'Proverbs 22:3', 'Proverbs 22:28',
  // the over-reach corrected: a tool in a steward's hand is not the sin
  'Genesis 2:15', 'Proverbs 27:23',
  // the one search to invite
  'Psalms 139:23', 'Psalms 139:24', 'Psalms 19:12', 'Psalms 19:13', 'Psalms 19:14', 'Proverbs 4:23',
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

describe('sov46 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 46, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov46 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV46_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov46-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  // THE DURABLE FORM, on purpose (decide by exact identity, never by position
  // in a list, and never pin a CATALOG fact inside a LESSON's test). sov41,
  // sov42 and sov43 each asserted the whole course was contiguous 1..max, a
  // claim no single branch can keep when three weeks are written in parallel.
  // Contiguity belongs to sovereign-ai-class.test.js, which has the mechanism
  // for an in-flight hold. What is pinned here is true of this lesson for ever.
  it('the weeks ascend, uniquely, and this lesson is week 46 alone', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    const weeks = SOVEREIGN_AI_MODULES.map((m) => n(m.id));
    expect(weeks.every((x) => Number.isFinite(x)), `a module id carries no week: ${weeks.join(',')}`).toBe(true);
    expect(weeks, `weeks ascend: ${weeks.join(',')}`).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
    expect(n(L().id)).toBe(46);
    expect(weeks.filter((w) => w === 46)).toHaveLength(1);
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

describe('sov46 — the anchor holds in BOTH directions', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBeGreaterThanOrEqual(55);
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

describe('sov46 — the provenance is honest, and it names which story', () => {
  it('every band says the teaching was forwarded, on the day, and by whom', () => {
    for (const { place, text } of PLACES()) {
      expect(/Darrell/.test(text), `${place} does not say who forwarded it`).toBe(true);
      expect(/2026-10-20/.test(text), `${place} does not carry the day it arrived`).toBe(true);
      expect(/forwarded/i.test(text), `${place} does not say it was forwarded`).toBe(true);
    }
  });

  it('the page says the newsletter carried several stories and WHICH one this is', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/five (?:separate |unrelated )?items/i.test(adult), 'the page never says the issue carried five items').toBe(true);
    expect(/lead (?:cybersecurity|security) story/i.test(adult), 'the page never names the story it teaches').toBe(true);
    // The four it did NOT teach are named, so nobody has to guess.
    expect(/forward-deployed engineer/i.test(adult)).toBe(true);
    expect(/French supermarkets/i.test(adult)).toBe(true);
    expect(/sponsor/i.test(adult)).toBe(true);
    expect(/data (?:is )?ready|ready to be read|ready for/i.test(adult)).toBe(true);
  });

  it('the subject of the story is named, with the quoted executive, in the adult bands', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/\bMuse\b/.test(adult), 'the product the report is about is never named').toBe(true);
    expect(/agentic/i.test(adult)).toBe(true);
    expect(/bring-your-own-device/i.test(adult)).toBe(true);
    expect(/Angerer/.test(adult), 'the named executive the report quotes is missing').toBe(true);
    expect(/third[- ]party/i.test(adult)).toBe(true);
  });

  it('the third pile is stated: what nobody here verified, and the advertisement is not leaned on', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(/entire source|whole source/i.test(adult), 'the page never says the forward is the whole source').toBe(true);
    expect(/advertis/i.test(adult), 'the page never marks the sponsor copy as advertising').toBe(true);
    expect(/(?:did not verify|nobody verified|we did not verify|nobody here)/i.test(adult)).toBe(true);
    // The sponsor's own statistics are deliberately absent from the teaching.
    for (const { place, text } of PLACES()) {
      expect(/46 ?%|18 ?%/.test(text), `${place} leans on an unverified sponsor statistic`).toBe(false);
    }
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated', () => {
    for (const place of ['lesson', 'teen']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
    // Both directions of over-reach, not only the easy one.
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(adult).toContain(corpusText('Genesis 2:15'));
    expect(adult).toContain(corpusText('Proverbs 27:23'));
    expect(/unscoped trust/i.test(adult), 'the page never names what the sin actually is').toBe(true);
    expect(/nothing has happened yet|nothing was lost/i.test(adult), 'the page never corrects the nothing-was-lost over-reach').toBe(true);
  });
});

describe('sov46 — the Word is taught, not debated, and it is run across the Word', () => {
  it('total sight is shown to be His before any product is discussed, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never opens on the One who already searches`).toContain(corpusText('Psalms 139:1'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Hebrews 4:13'));
    expect(adult).toContain(corpusText('1 Samuel 16:7'));
    expect(/attribute/i.test(adult), 'the page never says an attribute is what is being asked for').toBe(true);
    expect(/searches in order to heal/i.test(adult), 'the three guarantees are not named').toBe(true);
  });

  it('Hezekiah is read in sequence, and what he lost is named as the inventory, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the sentence the lesson turns on`).toContain(corpusText('2 Kings 20:15'));
      expect(text, `${place} never shows the complete read he gave`).toContain(corpusText('2 Kings 20:13'));
      expect(text, `${place} never reads the parallel account's motive`).toContain(corpusText('Isaiah 39:2'));
      expect(text, `${place} never reaches the consequence`).toContain(corpusText('2 Kings 20:17'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('2 Kings 20:12'));
    expect(adult).toContain(corpusText('2 Chronicles 32:31'));
    expect(/inventory/i.test(adult), 'the page never says what actually left the building').toBe(true);
    expect(/(?:permission|prompt|embassy|visit|permission was the examination)/i.test(adult)).toBe(true);
  });

  it('the goods are shown to be another man\'s, with the law and with Joseph, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never draws the line where He drew it`).toContain(corpusText('Luke 16:12'));
      expect(text, `${place} never reaches the law of goods delivered to keep`).toContain(corpusText('Exodus 22:7'));
      expect(text, `${place} never reaches Joseph's refusal`).toContain(corpusText('Genesis 39:9'));
      expect(text, `${place} drops the standard required in stewards`).toContain(corpusText('1 Corinthians 4:2'));
    }
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(adult).toContain(corpusText('Exodus 22:8'));
    expect(adult).toContain(corpusText('Luke 16:10'));
    expect(/stewardship/i.test(adult), 'the page never moves the question off privacy and onto stewardship').toBe(true);
  });

  it('the chain of hands is taught as a one-way door, with un-reading named as the impossible remedy', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the secret that does not come home`).toContain(corpusText('Proverbs 25:9'));
      expect(text, `${place} never reaches the bird of the air`).toContain(corpusText('Ecclesiastes 10:20'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Proverbs 25:10'));
    expect(adult).toContain(corpusText('Proverbs 20:19'));
    expect(/un-read/i.test(adult), 'the page never names the one remedy nobody can promise').toBe(true);
  });

  it('the oldest pitch is named, and the lure is explained rather than the engineers accused', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(adult).toContain(corpusText('Genesis 3:5'));
    expect(adult).toContain(corpusText('Genesis 3:6'));
    expect(adult).toContain(corpusText('2 Corinthians 11:14'));
    expect(/not an accusation against engineers/i.test(L().lesson)).toBe(true);
    expect(/capability while denying cost/i.test(adult)).toBe(true);
  });

  it('the answer is construction, and the six Monday actions are on the page', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never builds the battlement into the house`).toContain(corpusText('Deuteronomy 22:8'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.youth, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Nehemiah 4:9'));
    expect(adult).toContain(corpusText('Luke 14:28'));
    for (const action of [/scope/i, /separate/i, /owner/i, /record/i, /leaves|departs/i, /cost|price|reckon/i]) {
      expect(action.test(L().lesson), `the lesson drops ${action}`).toBe(true);
    }
    expect(/carried to Babylon/i.test(adult), 'the page never prices the exposure the way the prophet did').toBe(true);
  });

  it('sovereignty is claimed as custody and explicitly NOT as immunity', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/custody, not (?:safety|immunity)|Sovereignty is custody/i.test(adult), 'the page never says what sovereignty is').toBe(true);
    expect(/not immunity|is not immunity|emphatically not immunity/i.test(adult), 'the page claims more than it can prove').toBe(true);
    expect(/misconfigured/i.test(adult), 'the page never admits our own machine can be misconfigured').toBe(true);
  });

  it('the one search to invite is the close, and it is His to answer', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never invites the one Search`).toContain(corpusText('Psalms 139:23'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Psalms 139:24'));
    expect(adult).toContain(corpusText('Psalms 19:12'));
    expect(adult).toContain(corpusText('Proverbs 4:23'));
  });
});

describe('sov46 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "the LORD" and "God" are untouched inside the quotations', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Psalms 139:1'));     // "O LORD, thou hast searched me..."
    expect(all).toContain(corpusText('2 Kings 20:17'));    // "...saith the LORD."
    expect(all).toContain(corpusText('Psalms 139:23'));    // "Search me, O God..."
    expect(all).toContain(corpusText('Genesis 39:9'));     // "...sin against God?"
    expect(all).toContain(corpusText('Genesis 2:15'));     // "And the LORD God took the man..."
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
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Deceiver', 'Baal']) {
      expect(all.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });

  it('no decision-record id reaches a reader', () => {
    for (const { place, text } of PLACES()) {
      expect(/DR-\d{4}/.test(text), `${place} shows a DR id to a reader`).toBe(false);
    }
  });
});

describe('sov46 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one', () => {
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

describe('sov46 — four bands, genuinely differentiated, each at its own level', () => {
  it('no band is unnamed in its opening window', () => {
    expect(unnamedBands(L())).toEqual([]);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(namesItsLesson(L().title, L().levels[band]), `${band} does not name its lesson`).toBe(true);
    }
  });

  it('the child band reads under the new-lesson ceiling and the ladder climbs strictly', () => {
    const m = measureLesson(L());
    expect(m.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    const grades = BAND_ORDER.map((b) => m.bands[b].authored);
    for (let i = 1; i < grades.length; i += 1) {
      expect(grades[i], `${BAND_ORDER[i]} (${grades[i]}) reads below ${BAND_ORDER[i - 1]} (${grades[i - 1]})`).toBeGreaterThan(grades[i - 1]);
    }
  });

  it('the four bands are four texts, not one text re-registered four times', () => {
    const d = measureDifferentiation(L());
    expect(d.worst, `bands overlap ${d.worst}, ceiling ${DIFF_CEILING}`).toBeLessThan(DIFF_CEILING);
  });
});

// -----------------------------------------------------------------------------
// PROVEN TO CATCH. Each case breaks exactly one real thing AND re-asserts that
// the real module is clean, so a catch is never a stuck failure.
// -----------------------------------------------------------------------------
describe('sov46 — the gates are proven to catch, and no catch is stuck', () => {
  it('a single altered word inside the sentence this lesson turns on fails the verbatim scan', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace(
        'there is nothing among my treasures that I have not shewed them',
        'there is nothing among my treasures that I have not hidden from them',
      ),
    };
    expect(broken.lesson, 'the words this case alters are not in the lesson any more').not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/2 Kings 20:15/);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('substituting Yahweh into a KJV quotation fails the scan — the bright line, in the direction that corrupts the text', () => {
    const m = L();
    const broken = { ...m, lesson: m.lesson.replace('Search me, O God, and know my heart', 'Search me, O Yahweh, and know my heart') };
    expect(broken.lesson).not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Psalms 139:23/);
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

  it('re-registering the teen band as the youth band is caught as a duplicate', () => {
    const m = L();
    const doubled = { ...m, levels: { ...m.levels, youth: m.levels.teen } };
    expect(measureDifferentiation(doubled).worst).toBeGreaterThanOrEqual(DIFF_CEILING);
    expect(measureDifferentiation(m).worst).toBeLessThan(DIFF_CEILING);
  });
});

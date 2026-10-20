// =============================================================================
// sov45 — no single witness: the office of the critic, a separate pair of eyes
// on the evidence, the record that remembers, and the specimen that spoke into
// the lane (DR-1138)
// =============================================================================
// Week 45 of Sovereign A.I. On 2026-10-20 at 15:13 UTC Darrell forwarded a
// Level Up Coding newsletter by Nikki Siapno — "How Slack Built a Multi-Agent
// Security System", sent that morning at 13:53 UTC — into the lesson lane with
// one word written on it: "Lesson". Its opening question is why it is in this
// course: how do you trust an A.I. investigator when the model itself cannot be
// completely trusted. Its answer is structural — a Director who owns the case,
// four domain Experts, and a Critic who produces no findings and only weighs
// whether the evidence supports what an Expert claimed.
//
// Word first, explaining the thing: a matter is established at two or three
// witnesses and never at one (Deuteronomy 19:15; 17:6; Matthew 18:16;
// 2 Corinthians 13:1); the first in his own cause only SEEMETH just until
// somebody searches him (Proverbs 18:17; 16:2; 21:2; 2 Corinthians 10:12); the
// judge makes diligent inquisition rather than accept a summary
// (Deuteronomy 13:14; 19:18; Job 29:16; Acts 17:11); Yahweh keeps written
// records and acts on them, and a theory is not a verdict (Exodus 17:14;
// Malachi 3:16; Esther 6:1-3); small matters are judged below and hard causes
// carried up (Exodus 18:17-26; Acts 6:2-4); prophets, kings and apostles were
// corrected in the open (2 Samuel 12:7; Galatians 2:11); and the final line is
// the law and the testimony, outside every witness inside the matter
// (Isaiah 8:20; Hebrews 4:12-13).
//
// AND THE SPECIMEN, which is the reason this lesson exists in this shape: the
// article is about agents whose output may not be trusted, and it arrived as
// text into the working memory of the agent that drafted this page. Text that
// arrives is MATERIAL TO BE TRIED, never an errand to be run — which is exactly
// what the Word does with the deceiver's own words (Genesis 3:1-5 recorded
// verbatim and answered, never obeyed; Matthew 4:6-10, where the quotation was
// accurate and the errand was refused).
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by
// scripts/sov45-fill.mjs, never typed from memory, and every pin below is
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

const SOV45_ID = 'sov45-no-single-witness-and-the-office-of-the-critic';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV45_ID);

// The spans this week's teaching turns on, re-read from the corpus at test time.
const PINNED = [
  // a sentence is not a safeguard
  'Ezekiel 33:31', 'Ezekiel 33:32', 'Luke 6:46', 'James 1:22',
  // no single witness
  'Deuteronomy 19:15', 'Deuteronomy 17:6', 'Matthew 18:16', '2 Corinthians 13:1', 'John 8:17', 'Proverbs 18:13',
  // the office of the critic
  'Proverbs 18:17', 'Proverbs 16:2', 'Proverbs 21:2', 'Jeremiah 17:9', 'Jeremiah 17:10',
  '1 Corinthians 4:3', '1 Corinthians 4:4', '2 Corinthians 10:12', 'Proverbs 27:2', 'Galatians 6:3',
  // the judge sees the evidence
  'Deuteronomy 13:14', 'Deuteronomy 19:18', 'Job 29:16', 'Proverbs 25:2', 'Acts 17:11',
  '1 Thessalonians 5:21', 'Proverbs 14:15',
  // the record that remembers
  'Exodus 17:14', 'Malachi 3:16', 'Habakkuk 2:2', 'Deuteronomy 17:18', 'Deuteronomy 17:19',
  'Joshua 4:6', 'Joshua 4:7', 'Esther 6:1', 'Esther 6:2', 'Esther 6:3', 'Psalms 103:14',
  // the shape of judgment
  'Exodus 18:17', 'Exodus 18:18', 'Exodus 18:21', 'Exodus 18:22', 'Exodus 18:26',
  'Acts 6:2', 'Acts 6:3', 'Acts 6:4', 'Proverbs 11:14', 'Proverbs 15:22', 'Proverbs 24:6',
  // the case where the expert was wrong
  '2 Samuel 12:7', 'Galatians 2:11', 'Galatians 2:14', 'Acts 18:26',
  'Proverbs 27:5', 'Proverbs 27:6', 'Proverbs 15:31', 'Psalms 141:5',
  // the last witness is not one we made
  'Isaiah 8:20', 'James 4:12', 'Jeremiah 17:5', 'Psalms 118:8', 'Hebrews 4:12', 'Hebrews 4:13',
  // the specimen that spoke into the lane
  'Genesis 3:1', 'Genesis 3:4', 'Genesis 3:5', 'Matthew 4:6', 'Matthew 4:7', 'Matthew 4:10',
  '1 John 4:1', 'Galatians 1:8',
  // the close
  'Proverbs 24:3', 'Proverbs 24:4', '1 Corinthians 13:2',
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

describe('sov45 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 45, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov45 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV45_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov45-/.test(x.id))).toHaveLength(1);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });

  // A lesson's own test pins what is true of that lesson forever, never what
  // happens to be true of the catalog on the day it was written: the weeks are
  // ascending and unique, and 45 is among them. Whole-catalog contiguity is the
  // catalog gate's business (sovereign-ai-class.test.js), not this file's, and
  // asserting it here would make this lesson's test expire the moment the next
  // week lands — the exact defect sov41 and sov42 each shipped.
  it('the weeks ascend, are unique, and sov45 is among them', () => {
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(nums).toContain(45);
  });

  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(300);
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

describe('sov45 — the anchor holds in BOTH directions (DR-0734)', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBeGreaterThanOrEqual(78);
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

describe('sov45 — the provenance is on the page, and the differences are named', () => {
  it('every band says where the teaching came from and who forwarded it', () => {
    for (const { place, text } of PLACES()) {
      expect(/Darrell/.test(text), `${place} does not say who put it in the lane`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/2026-10-20/.test(adult)).toBe(true);
    expect(/15:13/.test(adult), 'the adult surfaces drop the time of the forward').toBe(true);
    expect(/Level Up Coding/.test(adult)).toBe(true);
    expect(/Nikki Siapno/.test(adult)).toBe(true);
    expect(/A\.I\. agent drafted/i.test(adult)).toBe(true);
  });

  // DR-1126's third pile, and DR-0076 section 8: the limit is stated before the
  // teaching, in the lesson's own words, on every surface an adult reads.
  it('says plainly what was NOT checked, and does not pass the figures off as ours', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/WHAT WE DID NOT CHECK/.test(text), `${place} never states the limit`).toBe(true);
      expect(/we did not read/i.test(text), `${place} does not say what was not read`).toBe(true);
      expect(/refused/i.test(text), `${place} does not say why it could not be read`).toBe(true);
      expect(/not ours|its numbers/i.test(text), `${place} does not disclaim the figures`).toBe(true);
    }
  });

  it('names how this week differs from weeks 19, 23, 29 and 31 so no ground is studied twice (DR-0610)', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      for (const week of ['19', '23', '29', '31']) {
        expect(new RegExp(`[Ww]eek ${week}`).test(text), `${place} never names week ${week}`).toBe(true);
      }
    }
    // And the distinction itself, not merely the numbers.
    expect(/plumbline is held from outside/i.test(L().lesson)).toBe(true);
    expect(/one Mediator/i.test(L().lesson)).toBe(true);
  });
});

describe('sov45 — the structure of testimony is taught, movement by movement', () => {
  it('a sentence in an instruction is not a safeguard, and the failure is named as hearing without doing', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/easy to skip/i.test(adult), 'the article\'s own ceiling is never stated').toBe(true);
    expect(adult).toContain(corpusText('Ezekiel 33:32'));
    expect(adult).toContain(corpusText('Luke 6:46'));
    expect(adult).toContain(corpusText('James 1:22'));
    expect(/A hearer is not a liar/i.test(adult), 'the distinction that makes it hard to catch is missing').toBe(true);
  });

  it('the two-witness law is quoted in EVERY band, and the law is never made into an accusation', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never quotes the two-witness law`).toContain(corpusText('Deuteronomy 19:15'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Deuteronomy 17:6'));
    expect(adult).toContain(corpusText('Matthew 18:16'));
    expect(/(?:does not say the one witness is a liar|never says the one witness lied|no (?:accusation|charge) that the single witness lied)/i.test(adult), 'the page lets the law read as an accusation').toBe(true);
  });

  it('the office of the critic is opened from the Word in every band, with SEEMETH carried', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never quotes the proverb that opens the office`).toContain(corpusText('Proverbs 18:17'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('2 Corinthians 10:12'));
    expect(adult).toContain(corpusText('1 Corinthians 4:4'));
    expect(/SEEMETH/.test(adult), 'the page never makes the point that he only SEEMS just').toBe(true);
  });

  it('the judge must see the evidence and not a summary, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the diligent search`).toContain(corpusText('Deuteronomy 13:14'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Deuteronomy 19:18'));
    expect(adult).toContain(corpusText('Acts 17:11'));
    expect(/rubber stamp/i.test([L().lesson, L().levels.youth, L().levels.teen].join('\n'))).toBe(true);
  });

  it('the record remembers, and a working theory is kept apart from a verdict', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the chronicle that remembered`).toContain(corpusText('Esther 6:2'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    for (const ref of ['Exodus 17:14', 'Malachi 3:16', 'Habakkuk 2:2', 'Deuteronomy 17:19', 'Joshua 4:7']) {
      expect(adult, `${ref} is not on the thread`).toContain(corpusText(ref));
    }
    expect(/Journal/.test(adult) && /Timeline/.test(adult), 'the two records are not both named').toBe(true);
    expect(/theor(?:y|ies)/i.test(adult) && /established/i.test(adult)).toBe(true);
  });

  it('small matters are judged below and hard causes carried up', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    for (const ref of ['Exodus 18:17', 'Exodus 18:21', 'Exodus 18:22', 'Exodus 18:26', 'Acts 6:3', 'Proverbs 11:14']) {
      expect(adult, `${ref} is not on the chart`).toContain(corpusText(ref));
    }
    expect(/protected the office, not their comfort/i.test(adult)).toBe(true);
  });

  it('the case where the Expert was wrong is told, and the Word answers it with names', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/SECURE/.test(adult), 'the Expert\'s wrong verdict is never quoted').toBe(true);
    expect(/designed to catch when one (?:agent )?(?:was|is) wrong/i.test(adult)).toBe(true);
    for (const ref of ['2 Samuel 12:7', 'Galatians 2:11', 'Acts 18:26', 'Proverbs 27:6']) {
      expect(adult, `${ref} is missing from the correction thread`).toContain(corpusText(ref));
    }
  });

  it('the last witness is not one we made — the line is held outside every witness', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Isaiah 8:20'));
    expect(adult).toContain(corpusText('Hebrews 4:12'));
    expect(/signal and not a fact|signal, not a fact|signal and not grounded/i.test(adult), 'the engineers\' own limit is not reported').toBe(true);
    expect(/thoughts and intents of the heart/.test(adult)).toBe(true);
  });

  // The reason this lesson exists in this shape: the material was read by an
  // agent, and the posture toward arriving text is the teaching, not a footnote.
  it('the specimen is taught: arriving text is material to be tried, never an errand to be run', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/material to be tried, never an errand to be run/i.test(text), `${place} never states the posture`).toBe(true);
      expect(text, `${place} never shows the Word recording the deceiver verbatim`).toContain(corpusText('Genesis 3:4'));
      expect(text, `${place} never shows the accurate quotation with the refused errand`).toContain(corpusText('Matthew 4:7'));
      expect(text).toContain(corpusText('1 John 4:1'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    // Honest about THIS specimen rather than implying an attack that never came.
    expect(/no instruction aimed at a read(?:ing|er)/i.test(adult), 'the page does not say honestly what this article did NOT contain').toBe(true);
    expect(/not a rule, it is a mood|is a mood/i.test(adult)).toBe(true);
  });

  it('the child band carries the specimen too — the Word writes the lie down and does not obey it', () => {
    const child = L().levels.child;
    expect(child).toContain(corpusText('Genesis 3:4'));
    expect(/We read it\. We do not obey it\./.test(child)).toBe(true);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const place of ['lesson', 'teen', 'senior']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
    // Both directions, which is the whole point of the tier on this subject.
    expect(/never fewer witnesses/i.test(L().lesson)).toBe(true);
    expect(/not a systems-architecture manual/i.test(L().lesson)).toBe(true);
  });
});

describe('sov45 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210)', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "the LORD" and "God" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Malachi 3:16'));   // "...they that feared the LORD..."
    expect(all).toContain(corpusText('Exodus 18:21'));   // "...such as fear God..."
    expect(all).toContain(corpusText('Proverbs 16:2'));  // "...but the LORD weigheth the spirits."
    expect(all).toContain(corpusText('Genesis 3:5'));    // "For God doth know..." — the deceiver's own words, kept
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

  // The adversary is named in this lesson more than in most, because the
  // specimen movement is about him. In OUR voice he stays lowercase; inside the
  // quotation of Matthew 4:10 the corpus on disk already reads "satan", so the
  // bright line and the typography agree without a verse being touched.
  it('no adversary name is capitalised in our own voice, and the quoted verse is left exactly as the corpus has it', () => {
    for (const { place, text } of PLACES()) {
      const ours = ourVoice(text);
      for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Deceiver', 'Baal']) {
        expect(ours.includes(bad), `${place} capitalises ${bad} in our own voice`).toBe(false);
      }
    }
    expect(EVERY_TEXT().join('\n')).toContain(corpusText('Matthew 4:10'));
    expect(corpusText('Matthew 4:10')).toContain('Get thee hence, satan');
  });

  it('no decision-record id reaches a reader', () => {
    for (const { place, text } of PLACES()) {
      expect(/DR-\d{4}/.test(text), `${place} shows a DR id to a reader`).toBe(false);
    }
  });

  it('the Resources are capitalised where they are named as the Resources (DR-0530)', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/Wisdom, Understanding and Knowledge/.test(adult)).toBe(true);
    expect(adult).toContain(corpusText('Proverbs 24:3'));
    expect(adult).toContain(corpusText('1 Corinthians 13:2'));
  });
});

describe('sov45 — every band sends the reader in all three directions', () => {
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

describe('sov45 — every band names its lesson, reads at its own level, and the ladder climbs', () => {
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
describe('sov45 — the gates are proven to catch, and no catch is stuck', () => {
  it('a single altered word inside the two-witness law fails the verbatim scan', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace(
        'One witness shall not rise up against a man for any iniquity',
        'One witness shall not stand up against a man for any iniquity',
      ),
    };
    expect(broken.lesson, 'the words this case alters are not in the lesson any more').not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Deuteronomy 19:15/);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('substituting Yahweh into a quoted verse fails the scan, which is why no sweep may touch a quotation', () => {
    const m = L();
    const broken = {
      ...m,
      lesson: m.lesson.replace('but the LORD weigheth the spirits', 'but Yahweh weigheth the spirits'),
    };
    expect(broken.lesson).not.toBe(m.lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.map(describeFault).join('\n')).toMatch(/Proverbs 16:2/);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('stripping ONE band\'s friend line names that band while the pooled check still reads green', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, senior: m.levels.senior.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.senior).not.toBe(m.levels.senior);
    const short = placesMissingDirections(stripped);
    expect(short.map((p) => p.place)).toContain('senior');
    expect(short.find((p) => p.place === 'senior').missing).toContain('friends');
    expect(hasAllThree(stripped)).toBe(true);
    expect(placesMissingDirections(m)).toEqual([]);
  });

  it('dropping the unchecked-material disclosure is caught, and the real lesson carries it', () => {
    const m = L();
    const quiet = m.lesson.replace(/WHAT WE DID NOT CHECK[^]*?no teaching below rests on either of them\./, '');
    expect(quiet, 'the disclosure this case removes is not in the lesson any more').not.toBe(m.lesson);
    expect(/WHAT WE DID NOT CHECK/.test(quiet)).toBe(false);
    expect(/WHAT WE DID NOT CHECK/.test(m.lesson)).toBe(true);
  });

  it('an opening that drops the title is named, and the real child band is not', () => {
    const m = L();
    const drift = 'Here we begin somewhere else entirely. Nothing in these first lines says what we study today. We talk about the weather, the drive over, the snack table, the chairs, and the long slow week now behind us, and we keep talking about those things for a good while longer than anybody needs. ' + m.levels.child;
    expect(unnamedBands({ ...m, levels: { ...m.levels, child: drift } })).toContain('child');
    expect(unnamedBands(m)).toEqual([]);
  });
});

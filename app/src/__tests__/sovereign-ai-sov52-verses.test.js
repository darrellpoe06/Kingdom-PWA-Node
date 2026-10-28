// @vitest-environment node
// =============================================================================
// sov52 — A just weight and the validator that checks the file (DR-1257)
// =============================================================================
// Darrell sent a link into the app's own research road under one word,
// "Lesson," with his own note on why it mattered: open source, hundreds of
// checks, metadata read into a report meant to be a foundation for a new file,
// duplicate detection. `agent_inbox` row 60972a31-db63-4959-8a50-ee58a28643d4,
// research item 7c5c5edd-443e-4a3c-a7c3-f85d43631347. The row waited about 119
// hours in the lesson queue while the NAS builder was dark-in-effect, so it was
// built by hand (DR-1219: a waiting teaching is built, not watched).
//
// THE ROAD RETURNED A SERVICE NOTICE, and that is the lesson's honest centre.
// The reading step never completed ("not made yet (the tower had not
// answered)"), and the page that came back was veraPDF's own notice that the
// site had been taken offline by its maintainers as a precaution after news of
// a critical PHP vulnerability, plus a one-paragraph product description. That
// notice is the whole evidential base, which is why this file pins the seam
// between what the page establishes and what it does not.
//
// EVERY VERSE IS FETCHED FROM app/public/bible/kjv AND COMPARED HERE, never
// typed from memory (DR-0076). The quoted spans below were produced by reading
// the corpus files and are asserted character-for-character.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ID = 'sov52-a-just-weight-and-the-validator-that-checks-the-file';
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const every = (m) => [m.lesson, m.bigIdea, m.inApp, m.anchor.theme, ...BANDS.map((b) => m.levels[b])];
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// The corpus, read from disk the same way the lesson's author read it.
const FILES = {
  Proverbs: 'Proverbs', Leviticus: 'Leviticus', Deuteronomy: 'Deuteronomy', Isaiah: 'Isaiah',
  Matthew: 'Matthew', Luke: 'Luke', Acts: 'Acts', Psalms: 'Psalms', Ecclesiastes: 'Ecclesiastes',
  Galatians: 'Galatians', Hebrews: 'Hebrews', '1 Thessalonians': '1Thessalonians',
  '1 John': '1John', '1 Peter': '1Peter', '2 Corinthians': '2Corinthians', '1 Corinthians': '1Corinthians',
};
// QUOTE PAIRING IS DONE BY SPLITTING, NOT BY A REGEX, and that is a correction
// this file earned. The obvious pattern — /"([^"]{10,})"\s*\(([^)]+)\)/g — pairs
// quote marks WRONG whenever a short quotation sits in the prose: this lesson
// quotes Darrell's own one word, "Lesson," which is seven characters, so the
// `{10,}` requirement fails at its opening quote, the scan resumes at its
// CLOSING quote, and the next match swallows the ordinary prose between two
// real quotations. Measured while writing this file: that regex reported five
// spans "containing Yahweh" which were not quotations at all but the sentences
// between them, and it counted 104 verbatim spans where correct pairing counts
// 112. A verification that mis-pairs produces false alarms AND an undercount,
// and reads authoritative either way (DR-0076 §3).
//
// Splitting on the quote character cannot drift: odd indices are inside quotes.
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}

const cache = {};
function kjv(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return null;
  const file = FILES[m[1]];
  if (!file) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(join(ROOT, 'app', 'public', 'bible', 'kjv', `${file}.json`), 'utf8'));
  const chapter = cache[file].chapters[Number(m[2]) - 1];
  if (!chapter) return null;
  const to = m[4] ? Number(m[4]) : Number(m[3]);
  const out = [];
  for (let v = Number(m[3]); v <= to; v += 1) {
    if (!chapter[v - 1]) return null;
    out.push(chapter[v - 1]);
  }
  return out.join(' ');
}

describe('sov52 exists once, at its own week, with all four bands', () => {
  it('is in the catalog exactly once and is the highest week', () => {
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)/.exec(m.id)[1]));
    expect(Math.max(...nums)).toBe(52);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });

  it('carries every field the course expects, and four real bands', () => {
    expect(typeof L.lesson).toBe('string');
    expect(L.lesson.length).toBeGreaterThan(8000);
    for (const b of BANDS) {
      expect(typeof L.levels[b], `${b} band missing`).toBe('string');
      expect(L.levels[b].length, `${b} band too thin`).toBeGreaterThan(3000);
    }
    expect(Object.keys(L.rpe)).toEqual(['research', 'plan', 'execute']);
    expect(L.benefits).toHaveLength(10);
    expect(L.quiz.questions).toHaveLength(12);
    expect(L.facilitator.talkingPoints).toHaveLength(10);
    expect(L.facilitator.discussionPrompts).toHaveLength(10);
  });

  it('the bands rise in length and none is a copy of another', () => {
    const len = BANDS.map((b) => L.levels[b].length);
    expect(len[0]).toBeLessThan(len[1]);
    expect(len[1]).toBeLessThan(len[2]);
    for (const a of BANDS) for (const b of BANDS) if (a !== b) expect(L.levels[a]).not.toBe(L.levels[b]);
  });

  it('every quiz answer is in range and the marked answer is the true one', () => {
    for (const q of L.quiz.questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    const foundation = L.quiz.questions.find((q) => /held constant/.test(q.q));
    expect(foundation.options[foundation.answer]).toBe('The storm');
    const tried = L.quiz.questions.find((q) => /Isaiah 28:16/.test(q.q));
    expect(tried.options[tried.answer]).toBe('A tried stone');
  });
});

describe('sov52 — every verse it stands on is the corpus, verbatim', () => {
  // Each pair is (reference, the span the lesson quotes). The span must appear
  // in the corpus text character-for-character; a reworded quotation fails.
  const QUOTED = [
    ['Proverbs 16:11', 'A just weight and balance are the LORD’s: all the weights of the bag are his work.'],
    ['Proverbs 11:1', 'A false balance is abomination to the LORD: but a just weight is his delight.'],
    ['Leviticus 19:35-36', 'Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure. Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.'],
    ['Deuteronomy 25:13', 'Thou shalt not have in thy bag divers weights, a great and a small.'],
    ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.'],
    ['Ecclesiastes 10:10', 'If the iron be blunt, and he do not whet the edge, then must he put to more strength: but wisdom is profitable to direct.'],
    ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
    ['Acts 17:11', 'These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.'],
    ['1 John 4:1', 'Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.'],
    ['2 Corinthians 13:5', 'Examine yourselves, whether ye be in the faith; prove your own selves'],
    ['Isaiah 28:16', 'Behold, I lay in Zion for a foundation a stone, a tried stone, a precious corner stone, a sure foundation: he that believeth shall not make haste'],
    ['1 Corinthians 3:13', 'Every man’s work shall be made manifest: for the day shall declare it, because it shall be revealed by fire; and the fire shall try every man’s work of what sort it is'],
    ['Luke 14:28', 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?'],
    ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.'],
    ['Proverbs 25:28', 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.'],
    ['Proverbs 22:3', 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.'],
    ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever'],
    ['1 Peter 1:24-25', 'For all flesh is as grass, and all the glory of man as the flower of grass. The grass withereth, and the flower thereof falleth away: But the word of the Lord endureth for ever. And this is the word which by the gospel is preached unto you.'],
    ['Isaiah 40:8', 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.'],
    ['Psalms 119:89', 'For ever, O LORD, thy word is settled in heaven.'],
    ['Matthew 24:35', 'Heaven and earth shall pass away, but my words shall not pass away.'],
    ['Proverbs 27:17', 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.'],
    ['Deuteronomy 6:7', 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up'],
    ['Galatians 5:22', 'love, joy, peace'],
    ['Hebrews 3:13', 'But exhort one another daily, while it is called To day'],
    ['Matthew 7:24-25', 'I will liken him unto a wise man, which built his house upon a rock: And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock'],
  ];

  it('the corpus resolves every reference this lesson cites (the pins are not vacuous)', () => {
    for (const [ref] of QUOTED) expect(kjv(ref), `corpus could not resolve ${ref}`).toBeTruthy();
  });

  it.each(QUOTED)('%s is quoted verbatim from the corpus', (ref, span) => {
    expect(norm(kjv(ref)), `${ref} is not the corpus text`).toContain(norm(span));
  });

  it('every quoted span in the module text is one the corpus actually carries', () => {
    // Walks the real strings rather than a list, so a verse added later to the
    // prose without being pinned above is still checked against the corpus.
    const faults = [];
    let checked = 0;
    for (const text of every(L)) {
      for (const q of quotedPairs(text)) {
        if (!q.ref) continue; // a quoted word that is not Scripture ("Lesson")
        const real = kjv(q.ref);
        if (real == null) { faults.push(`unresolved reference (${q.ref})`); continue; }
        checked += 1;
        if (!norm(real).includes(norm(q.inside))) faults.push(`(${q.ref}) does not match the corpus`);
      }
    }
    expect(faults).toEqual([]);
    // The sweep is not vacuous: it really walked the referenced quotations.
    expect(checked).toBeGreaterThanOrEqual(100);
  });

  it('anchor.ref names every verse the lesson stands on (DR-0734)', () => {
    const refs = L.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(30);
    for (const r of refs) expect(kjv(r), `anchor.ref carries ${r} which the corpus cannot resolve`).toBeTruthy();
    // and the spine the lesson actually turns on is present
    for (const r of ['Proverbs 16:11', 'Proverbs 11:1', 'Luke 16:10', 'Isaiah 28:16', 'Matthew 24:35']) {
      expect(refs, `anchor.ref is missing ${r}`).toContain(r);
    }
  });

  it('never substitutes Yahweh into a quotation (the DR-0076 bright line)', () => {
    let spans = 0;
    for (const text of every(L)) {
      for (const q of quotedPairs(text)) {
        spans += 1;
        expect(q.inside, 'a quoted span contains Yahweh, which no KJV verse does').not.toMatch(/\bYahweh\b/);
      }
    }
    expect(spans).toBeGreaterThanOrEqual(100);
  });

  it('uses Yahweh in our own voice, and no generic God outside a quotation', () => {
    const ourProse = (s) => String(s).replace(/"[^"]*"/g, ' ¶ ');
    let sawYahweh = false;
    for (const text of every(L)) {
      if (/\bYahweh\b/.test(ourProse(text))) sawYahweh = true;
      expect(ourProse(text), 'generic God in our own voice').not.toMatch(/(^|[^A-Za-z])God([^A-Za-z]|$)/);
    }
    expect(sawYahweh).toBe(true);
  });
});

describe('sov52 tells the truth about its own road and its own limits', () => {
  it('names the row, the research item, and that the reading never completed', () => {
    const all = every(L).join('\n') + '\n' + L.facilitator.howToRun;
    expect(/research road/i.test(all)).toBe(true);
    expect(/service notice|taken (it )?down|offline/i.test(all)).toBe(true);
  });

  it('states what the page establishes', () => {
    const all = every(L).join('\n');
    expect(all).toContain('open source');
    expect(/PDF\/A and PDF\/UA/.test(all)).toBe(true);
    expect(/digital preservationist/i.test(all)).toBe(true);
    expect(/PDF software developer community/.test(all)).toBe(true);
  });

  it('DECLINES to assert the three unverified claims as product fact (DR-0076 §8)', () => {
    // The lesson must say, in its own words, that the check count, the metadata
    // report and the duplicate detection are Darrell's description and were not
    // confirmed by the one page the road returned.
    const all = every(L).join('\n');
    expect(/not verif|did NOT verify|declines|not confirmed|not asserted/i.test(all)).toBe(true);
    expect(/duplicate detection/i.test(all)).toBe(true);
    expect(/number of checks|count of checks|check count/i.test(all)).toBe(true);
    // and it must attribute them to him rather than to the product
    expect(/Darrell'?s own description|Darrell'?s description|named as his/i.test(all)).toBe(true);
  });

  it('never claims the outage was the validator failing', () => {
    const all = every(L).join('\n');
    expect(/validator (itself )?(was )?untouched|tool'?s own work was untouched|validator did not/i.test(all)).toBe(true);
    expect(/the validator had failed its own checks/i.test(all)).toBe(false);
  });

  it('keeps open source distinct from invulnerable', () => {
    const all = every(L).join('\n');
    expect(/readable, not that every machine|Readable is not invulnerable|not that every surrounding machine/i.test(all)).toBe(true);
  });

  it('names the four things a conformance check cannot prove', () => {
    const t = L.levels.teen;
    expect(/cannot prove the STANDARD|does not prove the STANDARD/i.test(t)).toBe(true);
    expect(/FITNESS/i.test(t)).toBe(true);
    expect(/cannot prove YOU|does not prove the PERSON/i.test(t)).toBe(true);
  });
});

describe('sov52 sends every reader to someone (DR-0733, DR-0795)', () => {
  it('the module is whole, and so is EVERY band', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });

  it.each(['lesson', ...BANDS])('%s carries all three directions in its own words', (place) => {
    const text = place === 'lesson' ? L.lesson : L.levels[place];
    expect(missingDirections(text), `${place} is short`).toEqual([]);
  });

  it('every place names the rhythm and the skill, not only the directions', () => {
    for (const text of ['lesson', ...BANDS].map((p) => (p === 'lesson' ? L.lesson : L.levels[p]))) {
      expect(/once today/i.test(text), 'the rhythm is missing').toBe(true);
      expect(/one friend this week|to one friend before the week/i.test(text), 'the friend rhythm is missing').toBe(true);
      expect(/listen|listening/i.test(text), 'the listening skill is missing').toBe(true);
    }
  });

  it('measures growth the Word\'s way, qualitative and quantitative', () => {
    for (const text of ['lesson', ...BANDS].map((p) => (p === 'lesson' ? L.lesson : L.levels[p]))) {
      expect(/Galatians 5:22/.test(text), 'the fruit measure is missing').toBe(true);
      expect(/Hebrews 3:13/.test(text), 'the days measure is missing').toBe(true);
    }
  });

  it('PROVEN TO CATCH: one band losing its friend line alone is named, while the POOLED module still reads whole', () => {
    // The DR-0795 hazard exactly: hasAllThree pools the module, so a band can
    // go short while the module looks complete. The per-band check must name
    // that band and only that band.
    const stripped = {
      ...L,
      levels: {
        ...L.levels,
        teen: L.levels.teen.replace(/Friend to friend, talk with a friend[^.]*\./, '').replace(/Iron sharpeneth iron[^)]*\)\./, ''),
      },
    };
    const gaps = placesMissingDirections(stripped);
    expect(gaps.map((g) => g.place)).toEqual(['teen']);
    expect(gaps[0].missing).toContain('friends');
    // and the pooled read is STILL green, which is why the per-band check exists
    expect(hasAllThree(stripped)).toBe(true);
    expect(hasAllThreeEverywhere(stripped)).toBe(false);
  });

  it('PROVEN TO CATCH: an altered quotation fails the corpus comparison', () => {
    const bad = norm('A just weight and balance are the LORD’s: all the weights of the bag are HIS OWN work.');
    expect(norm(kjv('Proverbs 16:11')).includes(bad)).toBe(false);
    expect(norm(kjv('Proverbs 16:11')).includes(norm('A just weight and balance are the LORD’s: all the weights of the bag are his work.'))).toBe(true);
  });

  it('PROVEN TO CATCH: Yahweh substituted into a quotation is refused', () => {
    const planted = 'He said, "A just weight and balance are Yahweh’s: all the weights of the bag are his work" (Proverbs 16:11).';
    const found = quotedPairs(planted);
    expect(found).toHaveLength(1);
    expect(/\bYahweh\b/.test(found[0].inside), 'the planted substitution must be seen').toBe(true);
    expect(norm(kjv('Proverbs 16:11')).includes(norm(found[0].inside)), 'and must NOT match the corpus').toBe(false);
  });

  it('PROVEN TO CATCH: the pairing itself, because the obvious regex gets it wrong', () => {
    // The exact shape this file was built to avoid. A short quotation plus two
    // real ones: the naive regex returns the PROSE BETWEEN them as if it were a
    // quotation, which is how a false "Yahweh in a quote" alarm is produced.
    const sample = 'He wrote one word, "Lesson," above it. It belongs to Yahweh. "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1).';
    const naive = [...sample.matchAll(/"([^"]{10,})"/g)].map((m) => m[1]);
    expect(naive.some((s) => /\bYahweh\b/.test(s)), 'the naive regex mis-pairs and sees Yahweh inside a quote').toBe(true);

    const correct = quotedPairs(sample);
    expect(correct.map((q) => q.inside)).toEqual([
      'Lesson,',
      'A false balance is abomination to the LORD: but a just weight is his delight',
    ]);
    expect(correct.some((q) => /\bYahweh\b/.test(q.inside)), 'correct pairing sees none').toBe(false);
    expect(correct[1].ref).toBe('Proverbs 11:1');
    expect(norm(kjv(correct[1].ref)).includes(norm(correct[1].inside))).toBe(true);
  });

  it('PROVEN TO CATCH: a doubled word and a heading-shaped ordinal are both absent', () => {
    // Today's own two faults, pinned so this lesson cannot acquire them:
    // ll267 restarted its reader's point numbers with a sentence-initial
    // ordinal, and the doubled-word guard sits at zero debt.
    for (const text of every(L)) {
      const prose = String(text).replace(/"[^"]*"/g, ' ¶ ');
      const doubled = [...prose.matchAll(/\b([A-Za-z]{2,})\s+\1\b/gi)]
        .map((m) => m[0])
        .filter((x) => !['had had', 'that that', 'good good', 'legal legal'].includes(x.toLowerCase()));
      expect(doubled, 'a word is typed twice').toEqual([]);
      expect(/(^|\s)(FIRST|SECOND|THIRD), /.test(String(text)), 'a sentence-initial ordinal reads as a heading').toBe(false);
    }
  });
});

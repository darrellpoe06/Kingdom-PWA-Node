// @vitest-environment node
// =============================================================================
// pm13 — selected, designed, procured, built and steered: what a one-sentence
// teaser can and cannot teach, and the Word that carries the rest
// =============================================================================
// Lesson 13 of Project Management, captured 2026-10-19 from a McKinsey and
// Company Operations alert Darrell forwarded with one word above it: Lesson.
//
// THE THING THIS FILE EXISTS TO PROTECT. The forwarded item was a LINK-OUT
// TEASER, not an article. Its entire substance was a title, two bylines, a
// marketing phrase, two headlines with no bodies, and ONE sentence of claim:
// digital and AI are changing the way capital projects are selected, designed,
// procured, built and steered, and leaders are moving beyond pilots. The full
// article sat behind a link and was never read. So the lesson teaches no
// finding, figure, percentage or case study from it, and says so in the adult
// text and in the senior band — and the checks below make that honesty
// non-removable, because a thin source taught as a thick one is exactly the
// failure DR-0076 exists to stop. The teaching itself is the Word on building:
// the tower counted sitting down (Luke 14:28-30), the stalled temple finished
// by His Spirit rather than by might (Zechariah 4:6, 4:9), the only foundation
// (1 Corinthians 3:9-11), open rebuke instead of coddling (Proverbs 27:5-6,
// 15:22, 11:14; Jeremiah 6:14), the craftsmen called by name, filled AND
// taught (Exodus 31:2-5; 35:30-35), the plumbline and the measuring line held
// from OUTSIDE the wall (Amos 7:7-8; Zechariah 2:1-2; Ezekiel 40:3), diligence
// (Proverbs 22:29; 21:5; 13:4), the Resources that build a house (Proverbs
// 24:3-4; 1 Corinthians 13:1) and the steward's account (1 Corinthians 4:2;
// Luke 16:10-12).
//
// Every quoted verse in the module was FILLED from app/public/bible/kjv by a
// generator, never typed from memory, and every pin below is re-read from that
// corpus at test time so this file cannot drift from the text either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';
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

const PM13_ID = 'pm13-selected-designed-procured-built-and-steered';
const L = () => PROJECT_MANAGEMENT_MODULES.find((m) => m.id === PM13_ID);

// Every verse this lesson stands on. Each is re-read from the corpus at test
// time, so a pin can never be "what I remember the verse saying".
const PINNED = [
  '1 Corinthians 3:9', '1 Corinthians 3:10', '1 Corinthians 3:11', '1 Corinthians 4:2',
  '1 Corinthians 13:1', 'Amos 7:7', 'Amos 7:8', 'Deuteronomy 6:7', 'Exodus 31:2', 'Exodus 31:3',
  'Exodus 31:5', 'Exodus 35:30', 'Exodus 35:31', 'Exodus 35:34', 'Exodus 35:35', 'Ezekiel 40:3',
  'Galatians 5:22', 'Hebrews 3:13', 'Jeremiah 6:14', 'John 1:29', 'John 3:16', 'Luke 14:28',
  'Luke 14:29', 'Luke 14:30', 'Luke 16:10', 'Luke 16:11', 'Luke 16:12', 'Proverbs 11:14',
  'Proverbs 12:15', 'Proverbs 13:4', 'Proverbs 14:8', 'Proverbs 15:22', 'Proverbs 16:3',
  'Proverbs 18:13', 'Proverbs 20:18', 'Proverbs 21:5', 'Proverbs 22:29', 'Proverbs 24:3',
  'Proverbs 24:4', 'Proverbs 24:27', 'Proverbs 25:2', 'Proverbs 27:5', 'Proverbs 27:6',
  'Proverbs 27:17', 'Psalms 19:14', 'Zechariah 2:1', 'Zechariah 2:2', 'Zechariah 4:6',
  'Zechariah 4:9', 'Zechariah 4:10',
];

const BANDS = ['child', 'youth', 'teen', 'senior'];
const PLACES = () => BANDS.map((k) => ({ place: k, text: L().levels[k] }));

const EVERY_TEXT = () => {
  const m = L();
  const out = [m.title, m.bigIdea, m.inApp, m.anchor.theme, ...(m.benefits || [])];
  out.push(...Object.values(m.levels));
  for (const q of m.quiz.questions) out.push(q.q, q.explain, ...q.options);
  return out.filter((x) => typeof x === 'string');
};

describe('pm13 is in the Project Management course, with all four bands', () => {
  it('is the thirteenth lesson, uniquely, and the header count is the real one', () => {
    const m = L();
    expect(m, 'pm13 is not in PROJECT_MANAGEMENT_MODULES').toBeTruthy();
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => x.id === PM13_ID)).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => /^pm13-/.test(x.id))).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.indexOf(m)).toBe(12);
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  it('the lessons run in numeric order and pm13 is the last of them', () => {
    const nums = PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(Math.max(...nums)).toBe(13);
    expect(PROJECT_MANAGEMENT_MODULES[PROJECT_MANAGEMENT_MODULES.length - 1].id).toBe(PM13_ID);
  });

  it('every one of the four bands is written long enough to teach its reader', () => {
    for (const band of BANDS) {
      expect(typeof L().levels[band], `band ${band}`).toBe('string');
      expect(L().levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
  });
});

describe('pm13 — the verses are the corpus, verbatim', () => {
  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(100);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every pinned verse is quoted somewhere in the module, as the corpus has it', () => {
    const all = EVERY_TEXT().join('\n');
    const missing = [];
    for (const ref of PINNED) {
      const text = corpusText(ref);
      expect(text, `${ref} does not resolve in the corpus`).toBeTruthy();
      // A lesson quotes a contiguous span of a verse, not always the whole of
      // it, so the pin asks that SOME verbatim span of that verse is on the
      // page under its own reference.
      const spans = [...all.matchAll(new RegExp(`"([^"]+)"\\s*\\(${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'))];
      if (!spans.length || spans.some((s) => !text.includes(s[1]))) missing.push(ref);
    }
    expect(missing, 'pinned verses the module never quotes verbatim under their own reference').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on, and each one resolves (DR-0734)', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBe(PINNED.length);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    const dead = refs.filter((r) => !corpusText(r));
    expect(dead, 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('BOTH DIRECTIONS: nothing is quoted that anchor.ref does not name', () => {
    const refs = new Set(anchorRefs(L()));
    const quoted = new Set();
    for (const [, text] of quotedTexts(L())) {
      for (const x of String(text).matchAll(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g)) {
        quoted.add(`${x[2].trim()} ${x[3]}:${x[4].trim()}`);
      }
    }
    expect([...quoted].filter((r) => !refs.has(r)), 'quoted but not named in anchor.ref').toEqual([]);
    expect([...refs].filter((r) => !quoted.has(r)), 'named in anchor.ref but never quoted').toEqual([]);
  });

  it('PROVEN-TO-CATCH: a single altered word inside a quoted verse is caught', () => {
    const m = L();
    const broken = {
      ...m,
      levels: {
        ...m.levels,
        child: m.levels.child.replace('This man began to build, and was not able to finish', 'This man began to build, and was not able to afford it'),
      },
    };
    expect(broken.levels.child).not.toBe(m.levels.child);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    // and the real module is still clean, so the catch is not a stuck failure
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });
});

describe('pm13 — the source is reported at its real size, and the honesty cannot be edited out', () => {
  it('the adult text AND the senior band both say it was a one-sentence teaser', () => {
    for (const [where, text] of [['bigIdea', L().bigIdea], ['senior', L().levels.senior]]) {
      expect(/one-sentence teaser/i.test(text) || /link-out teaser/i.test(text), `${where} never calls it a teaser`).toBe(true);
      expect(/one-sentence teaser/i.test(text), `${where} never says it was ONE sentence`).toBe(true);
    }
  });

  it('the adult text AND the senior band both say the full article was NOT read', () => {
    for (const [where, text] of [['bigIdea', L().bigIdea], ['senior', L().levels.senior]]) {
      expect(/we did not read the full article/i.test(text), `${where} does not say the article was unread`).toBe(true);
    }
  });

  it('no finding, figure or case is claimed from the article anywhere on the page', () => {
    const all = EVERY_TEXT().join('\n');
    // The lesson says so out loud...
    expect(/teaches no finding|no finding, figure or case|reported as a finding of that article/i.test(all)).toBe(true);
    // ...and carries no percentage or survey-sized number, which is what an
    // invented finding would look like.
    expect(all.match(/\d+(?:\.\d+)?\s?(?:%|per cent|percent)/g), 'a percentage appears, and the source carried none').toBeNull();
  });

  it('the sponsor and marketing copy is named as such and refused', () => {
    const adult = [L().bigIdea, L().levels.senior].join('\n');
    expect(/Transform capital projects with AI/.test(adult), 'the marketing phrase is not quoted as the phrase it is').toBe(true);
    expect(/sponsor and marketing copy[^.]*not taught|marketing copy, and it is[^.]*not taught/i.test(adult), 'the sponsor copy is not refused').toBe(true);
  });

  it('the page says an A.I. agent drafted it and the gates decide', () => {
    const adult = [L().bigIdea, L().levels.senior].join('\n');
    expect(/An A\.I\. agent drafted this page/.test(adult)).toBe(true);
    expect(/the gates decide/.test(adult)).toBe(true);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const [where, text] of [['bigIdea', L().bigIdea], ['senior', L().levels.senior]]) {
      expect(/ESTABLISHED/.test(text), `${where} has no established tier`).toBe(true);
      expect(/OPEN,/.test(text), `${where} has no open tier`).toBe(true);
      expect(/OVER-REACH/.test(text), `${where} has no over-reach tier`).toBe(true);
    }
  });

  it('the letter is named, with the one word he wrote on it, in every band that weighs it', () => {
    for (const place of ['youth', 'teen', 'senior']) {
      expect(/McKinsey/.test(L().levels[place]), `${place} does not name the letter`).toBe(true);
      expect(/one word (?:written )?(?:above|on) it: Lesson/.test(L().levels[place]), `${place} drops the one word he wrote`).toBe(true);
    }
    // The child band carries the provenance at a child's level: naming a
    // consulting firm's mailing list to a small child is noise, not honesty.
    expect(/Darrell got a letter/.test(L().levels.child), 'the child band does not say who brought it').toBe(true);
    expect(/could not read the long story behind it/.test(L().levels.child), 'the child band hides the limit').toBe(true);
  });

  it('the one real claim is carried as the letter wrote it, as the occasion for the lesson', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/selected, designed, procured, built,? and steered/i.test(all)).toBe(true);
    expect(/moving beyond pilots/i.test(all)).toBe(true);
    expect(/Ruth Heuss and Sal Arora/.test(all), 'the bylines are never named').toBe(true);
  });
});

describe('pm13 — the Word is the substance, and the industry term is only a name', () => {
  it('the counting gate is the narrow one: sufficient to FINISH, before the foundation', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Luke 14:28'));  // the whole verse is quoted
    expect(all).toContain('whether he have sufficient to finish it');
    expect(all).toContain('This man began to build, and was not able to finish');
  });

  it('Who establishes it is taught in every band, over against what a tool changes', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never carries Zechariah 4:6`).toContain('Not by might, nor by power, but by my spirit, saith the LORD of hosts');
    }
    const adult = [L().bigIdea, L().levels.senior].join('\n');
    expect(adult).toContain('The hands of Zerubbabel have laid the foundation of this house; his hands shall also finish it');
    expect(adult).toContain('For other foundation can no man lay than that is laid, which is Jesus Christ');
  });

  it('challenge-not-coddle is taught from the Word, with the coddling named', () => {
    const adult = [L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('Open rebuke is better than secret love');
    expect(adult).toContain('Peace, peace; when there is no peace');
    expect(adult).toContain('Without counsel purposes are disappointed: but in the multitude of counsellors they are established');
    expect(/coddl/i.test(adult), 'the headline the Word stands behind is never worked').toBe(true);
  });

  it('steering is a standard held from OUTSIDE the work, not a report', () => {
    const adult = [L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('the Lord stood upon a wall made by a plumbline, with a plumbline in his hand');
    expect(adult).toContain('behold a man with a measuring line in his hand');
    expect(adult).toContain('with a line of flax in his hand, and a measuring reed; and he stood in the gate');
    expect(/outside/i.test(adult), 'the point of the plumbline is never stated').toBe(true);
    expect(/a wall never measures itself/i.test(L().levels.senior)).toBe(true);
  });

  it('the craftsmen are called by name, filled, AND taught', () => {
    const adult = [L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship');
    expect(adult).toContain('And he hath put in his heart that he may teach, both he, and Aholiab, the son of Ahisamach, of the tribe of Dan');
  });

  it('the Resources are named AND capitalised where they are named as the Resources (DR-0530)', () => {
    const adult = [L().anchor.theme, L().levels.senior].join('\n');
    expect(adult).toContain('Through wisdom is an house builded; and by understanding it is established');
    expect(adult).toContain('And by knowledge shall the chambers be filled with all precious and pleasant riches');
    expect(/Wisdom builds, Understanding establishes, Knowledge/.test(adult)).toBe(true);
    expect(/Love is senior/.test(L().levels.senior)).toBe(true);
    expect(L().levels.senior).toContain('Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal');
  });

  it('the project ends in an account, and the industry term is named as a name', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain('Moreover it is required in stewards, that a man be found faithful');
    expect(/PMBOK/.test(all), 'the industry is never named').toBe(true);
    expect(/the industry calls/.test(all), 'the term is never named as THEIR term').toBe(true);
  });

  it('growth is measured the Word\'s way, qualitative and quantitative', () => {
    const senior = L().levels.senior;
    expect(senior).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith'); // fruit
    expect(senior).toContain('when thou sittest in thine house');     // occasions
    expect(senior).toContain('But exhort one another daily, while it is called To day'); // days
  });
});

describe('pm13 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210), in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the generic name never appears in OUR voice, on any surface', () => {
    const ours = EVERY_TEXT().map(ourVoice).join('\n');
    expect([...ours.matchAll(/.{0,40}\bGod\b.{0,40}/g)].map((x) => x[0])).toEqual([]);
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain('For other foundation can no man lay than that is laid, which is Jesus Christ'); // 1 Corinthians 3:11
    expect(all).toContain('ye are God’s building');            // 1 Corinthians 3:9
    expect(all).toContain('saith the LORD of hosts');          // Zechariah 4:6
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(/Eternal Son of Yahweh/.test(all)).toBe(true);
    expect(all).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(all).toContain('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life');
  });

  it('no holy name is lowercased in our own voice', () => {
    for (const { place, text } of PLACES()) {
      expect(loweredHolyNames(text), `${place} lowercases a holy name`).toEqual([]);
    }
  });

  it('no adversary name is capitalised, anywhere', () => {
    const all = EVERY_TEXT().join('\n');
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Dragon', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
      expect(all.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });

  it('no decision-record id reaches a reader', () => {
    for (const text of EVERY_TEXT()) {
      expect(/DR-\d{4}/.test(text), 'a DR id is shown to a reader').toBe(false);
    }
  });
});

describe('pm13 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band carries TALK ABOUT IT TOGETHER with the skill and the rhythm, in the lesson\'s own words', () => {
    for (const { place, text } of PLACES()) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen all the way to the end/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/Once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
      expect(text, `${place} drops the four places`).toContain('when thou sittest in thine house');
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
    const named = placesMissingDirections(stripped);
    expect(named.map((p) => p.place)).toContain('youth');
    expect(named.find((p) => p.place === 'youth').missing).toContain('friends');
    // ...while the pooled check still reads green, which is exactly why the
    // per-band check has to exist (DR-0795).
    expect(hasAllThree(stripped)).toBe(true);
    // and the real module is clean, so this catch is not a stuck failure
    expect(placesMissingDirections(m)).toEqual([]);
  });
});

describe('pm13 — the lesson page is whole', () => {
  it('carries every field a lesson page renders', () => {
    const m = L();
    expect(m.bigIdea.length).toBeGreaterThan(200);
    expect(m.inApp.length).toBeGreaterThan(100);
    expect(m.anchor.theme.length).toBeGreaterThan(80);
    expect(m.benefits.length).toBeGreaterThanOrEqual(3);
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
  });

  it('the hands-on work sends the reader to a real project and a real page in the app', () => {
    expect(/five lines/.test(L().inApp)).toBe(true);
    expect(/Projects page/.test(L().inApp)).toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

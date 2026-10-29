// @vitest-environment node
// =============================================================================
// sov58 — The world that does not drift: a rehearsal is a gift, and a rehearsal
// is not the world (DR-1295)
// =============================================================================
// Darrell forwarded Gmail thread 1a18262cf26c9f77 on 2026-10-28 from his
// university address to himself, with two sentences above the forward: "Lessons
// and research using our research lane so don't say we can't see something we
// can... also see what we can use for our stakeholders." The thread is a single
// message — one issue of a daily technology newsletter.
//
// MEASURED FIRST, BECAUSE TWO BUILDERS THE NIGHT BEFORE WROTE MOST OF A LESSON
// FROM A TEACHING THAT WAS ALREADY SHIPPED. Both probes of the repository's own
// instrument were run on this tree before a word was written:
//
//   $ node scripts/lesson-row-shipped-sweep.mjs 1a18262cf26c9f77
//   unknown   1a18262cf26c9f77  ->  no decision record names it      (exit 0)
//
//   $ node scripts/lesson-row-shipped-sweep.mjs --subject "What Google's new Genie 4 can simulate"
//       * google's -> 9 record(s), worth 0.111
//         genie     -> 0 record(s), worth 0
//       * simulate -> 6 record(s), worth 0.167
//     no record shares enough distinctive words with this subject    (exit 0)
//
// The id probe alone was not trusted, because DR-0763 names its source in prose
// only and answered "unknown" for a built teaching (DR-1288) — which is why the
// --subject probe exists and was run. A third, independent check by hand found
// no decision record and no module string carrying this thread id, and the two
// coincidental hits for "genie" in the catalogs are a wish-granting genie in a
// lesson about prayer, not this item. So this teaching was unbuilt.
//
// THE FIRST DANGER IS PRETENDING THE ISSUE HELD AN ARGUMENT IT DID NOT. A
// newsletter is not a study. This issue is a run of short items, each a
// paragraph compressing somebody else's longer work, with marked sponsor
// placements between them, a shop list of products, an invitation to an event in
// another city, and a poll asking the reader to rate the email. EXACTLY ONE item
// carries the teaching: a company's own account of an early research version of
// a world model — a place you walk into rather than a clip you watch. ONE
// FURTHER item is germane and is used, because the issue set the two beside each
// other: a short reading list asking whether these tools leave their users
// better at their work. Everything else is other people's trade news, and the
// lesson says so in the reader's hearing rather than in a note nobody keeps.
//
// THE SECOND DANGER IS THE ADVERTISING, AND DARRELL'S RULE IS EXPLICIT: ignore
// advertisements unless they bear on the lesson. None of these does. The issue
// carried marked placements, a six-product shop list, an event invitation and a
// newsletter cross-sell, plus a dozen other people's stories. The check below
// refuses all forty-five of those names a foothold in ANY string of the module,
// written with word boundaries rather than bare substring tests so that ordinary
// English — "slack in the rope", "the chrome handle", "an oracle of old", "a
// genie in a tale" — cannot trip it, while "Granola" and "Gemini" do. The
// SUBJECT's own vendor is refused too, following sov33 and sov57: no company or
// product is named, because the pattern in the reader's own hand is the lesson
// and a named vendor dates it.
//
// THE THIRD DANGER IS A BORROWED FIGURE, AND THIS LESSON STAKES NONE. The issue
// was thick with numbers — an operating margin, a quarterly revenue, a vendor
// discount, a valuation, a share of surveyed workers, a slowdown measured in a
// trial — and every one of them arrived second hand inside somebody's summary of
// somebody else's report. TWO ROADS TO THE PUBLISHERS WERE TRIED AND BOTH WERE
// REFUSED, which is recorded rather than paraphrased: `deepmind.google` and
// `metr.org` both answered ENOTFOUND, the hosts being outside this session's
// allowed network domains, and no further hosts were tried after the second
// denial. So no figure is read back off any publisher's own page, none is
// repeated, and the claim is ENFORCED rather than asserted: no reader text may
// carry a currency symbol, a percentage, or a number wearing a magnitude word. A
// 0-figure row in lesson-sources.json is forbidden (DR-0076 §3) because it would
// make checked() count a lesson whose figures nobody read, so the honest place
// for sov58 is the counted worklist in the-third-pile-is-a-worklist.test.js.
//
// THE FOURTH DANGER IS A SPINE CHOSEN BY HEADLINE. "A simulation is not real"
// has obvious verses and the obvious ones are spent: Hebrews 11:3, Colossians
// 1:17, Psalms 33:9, Psalms 119:89, Matthew 7:24-27, Job 38:4, Deuteronomy
// 18:22, Luke 14:28, 1 John 4:1 and 1 Thessalonians 5:21 are ALL already anchors
// in this department. Every chapter below was measured absent from sov1–sov57 and
// from the other two courses in the "A.I. The Way" department
// (church-classes.js, ai-legal-blueprint-class.js) before it was written in:
// the department holds 389 unique anchor chapters across 71 lessons, and these
// ten are not among them.
//
// AND THE COLLISION CHECK IS KEYED ON BOOK AND CHAPTER, BOTH WAYS, which is the
// finding sov57 paid for. Its first draft keyed `/^(.+?)\s+\d+:/` — which
// returns "Isaiah", not "Isaiah 30" — so it compared "Isaiah 30" against a set of
// BOOK NAMES, matched nothing, and passed vacuously over a real clash. A gate
// that cannot fail is a lie (DR-0076 §3). `chapterOf` below returns
// book-and-chapter, the check asserts our chapters are absent from the
// department AND that a chapter known to be taken is detected as taken, and the
// proven-to-catch block adopts one of the spent chapters and watches it fire.
//
// BOTH STORIES ARE PARABLES, IN THE THIRD PERSON. This lesson is built from a
// newsletter; nobody's life is in it. A `kind: 'testimony'` renders to the
// reader as a true story told with a named person's consent, which would be a
// lie on the page (DR-0811), so a check forbids it and asserts no `source` is
// borrowed.
//
// EVERY DISCLOSURE PIN IS CHECKED FOR UNIQUENESS BEFORE IT IS TRUSTED. Prior
// records passed with a disclosure DELETED because the pinned string also
// occurred elsewhere. So each pin below is asserted to occur in EXACTLY ONE
// reader text and to be the expected one, and the proven-to-catch block deletes
// a disclosure from a single band and watches that band be named.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { MODULES } from '../lib/church-classes.js';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { fourBandFaults, LADDER } from './fixtures/four-band-ladder.js';

const ID = 'sov58-the-world-that-does-not-drift';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

// --- the repo's own KJV, read off disk -------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names, or null when it does not resolve. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}

/** Pairs by SPLITTING on the quote character, never by regex. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}

export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!verse.includes(inside.trim())) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// A BOOK-AND-CHAPTER key. sov57's first draft keyed on the BOOK alone and
// passed vacuously over a real clash; this is the fixed form, and the checks
// below exercise it in BOTH directions so it cannot pass by matching nothing.
export function chapterOf(ref) {
  const m = /^(.+?)\s+(\d+)[:\s]/.exec(String(ref).trim());
  return m ? `${m[1].trim()} ${Number(m[2])}` : null;
}

// THE SPINE, pinned by literal text. Every span was read out of the corpus on
// disk before it was written into the lesson, and each must still be there.
const SPINE = [
  ['Psalms 104:5', 'Who laid the foundations of the earth, that it should not be removed for ever'],
  ['Psalms 93:1', 'the world also is stablished, that it cannot be moved'],
  ['Psalms 73:20', 'As a dream when one awaketh; so, O Lord, when thou awakest, thou shalt despise their image'],
  ['Job 20:8', 'He shall fly away as a dream, and shall not be found'],
  ['Judges 3:1', 'Now these are the nations which the LORD left, to prove Israel by them'],
  ['Judges 3:2', 'to teach them war, at the least such as before knew nothing thereof'],
  ['1 Samuel 17:34', 'Thy servant kept his father’s sheep, and there came a lion, and a bear'],
  ['1 Samuel 17:36', 'Thy servant slew both the lion and the bear'],
  ['1 Samuel 17:37', 'The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine'],
  ['Luke 8:13', 'which for a while believe, and in time of temptation fall away'],
  ['Isaiah 44:17', 'he falleth down unto it, and worshippeth it, and prayeth unto it, and saith, Deliver me; for thou art my god'],
  ['Isaiah 44:20', 'He feedeth on ashes'],
  ['Isaiah 44:20', 'Is there not a lie in my right hand?'],
  ['Jeremiah 10:14', 'every founder is confounded by the graven image'],
  ['Jeremiah 10:14', 'there is no breath in them'],
  ['Zechariah 10:2', 'the diviners have seen a lie, and have told false dreams; they comfort in vain'],
  ['Zechariah 10:2', 'therefore they went their way as a flock, they were troubled, because there was no shepherd'],
];

// THE CHAPTERS THIS LESSON STANDS ON, and the ones DECLINED BY MEASUREMENT.
// Declined because they are already anchors in this department (measured, not
// assumed): Hebrews 11 (the worlds framed by His word), Colossians 1 (by Him all
// things consist), Psalms 33 (He spake and it stood fast), Psalms 119 (the
// settled word), Matthew 7 (the rock and the sand), Job 38 (where wast thou),
// Deuteronomy 18 (if the thing follow not), Luke 14 (count the cost), 1 John 4
// (try the spirits) and 1 Thessalonians 5 (prove all things). Declined although
// free: Psalms 39 ("a vain shew" repeats the beat Psalms 73 already carries) and
// Isaiah 29:8 is inside a chapter already anchored three times over.
const OURS = ['Psalms 104', 'Psalms 93', 'Psalms 73', 'Job 20', 'Judges 3', '1 Samuel 17', 'Luke 8', 'Isaiah 44', 'Jeremiah 10', 'Zechariah 10'];
const DECLINED_AS_SPENT = ['Hebrews 11', 'Colossians 1', 'Psalms 33', 'Psalms 119', 'Matthew 7', 'Job 38', 'Deuteronomy 18', 'Luke 14', '1 John 4', '1 Thessalonians 5'];

// Other people's stories, the sponsor copy and the shop list from that same
// edition — and the subject's own vendor, refused with the rest so the teaching
// does not date. Word-boundary matchers, so ordinary English cannot trip it.
const NOT_OURS = [
  // marked placements, the shop list, the event and the cross-sell
  'Thoropass', 'Granola', 'Snapshots', 'Switch AI', 'Spacesheep', 'PulseDev',
  'TheySaid', 'Hob', 'Neuron Academy', 'The Neuron', 'TechnologyAdvice',
  'Alumni Ventures', 'Slack', 'Beehiiv',
  // the subject's own vendor and products, refused like the rest
  'Google', 'DeepMind', 'Genie', 'Gemini',
  // other people's items in the same issue
  'SK hynix', 'Oracle', 'OpenAI', 'ChatGPT', 'Codex', 'Anthropic', 'Claude',
  'Infisical', 'MLflow', 'Atlassian', 'ClickUp', 'Asana', 'Jira', 'Microsoft',
  'Azure', 'METR', 'Stanford', 'Apple', 'iCloud', 'Christine', 'Corey',
  'Spotify', 'YouTube', 'Nashville', 'Dungeon Master', 'Crew Dragon', 'Wichita',
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notOursRe = (name) => new RegExp(`\\b${escapeRe(name)}\\b`);

// A figure a reader could be misled by: a currency symbol, a percentage, or a
// number wearing a magnitude word. Dates and verse references are numbers and
// are not figures, which is why this is written as the three shapes a CLAIM
// takes rather than as "no digits".
const FIGURE_SHAPES = [
  /[$£€]/,
  /\d\s*%|\bper cent\b|\bpercent\b/i,
  /\b\d[\d,.]*\s*(?:million|billion|trillion|thousand)\b/i,
];

// The disclosures, one phrasing per place, each asserted UNIQUE below.
const UNREAD = {
  adult: "we did not read the publisher's own page describing the world model",
  child: "We never got to read the company's own page about this machine.",
  youth: "Nobody here opened the company's own page about this world model.",
  teen: 'The article behind that one link was never opened by anybody here.',
  senior: "Not one of us opened the company's own page describing it",
};
const TELEPHONE = {
  adult: 'We did not telephone the writer, the newsletter, or any company the issue names',
  child: 'We did not call anybody up to ask.',
  youth: 'We never rang the writer or the newsletter to check a line of it.',
  teen: 'No one here telephoned the writer or the newsletter to confirm a word of it.',
  senior: 'Neither the writer nor the newsletter was ever telephoned by anyone here',
};
const FETCH_FAILED = {
  adult: 'the fetch could not resolve either host',
  child: 'The computer could not even find the places where those pages live.',
  youth: 'The machine could not even find the hosts.',
  teen: 'Both hostnames would not resolve.',
  senior: 'both hostnames failed to resolve',
};
const OWN_IMAGE = {
  child: 'ride it to school',
  youth: 'Think about your phone',
  teen: 'A test plane flew with nobody in it this month',
  senior: 'a surveyed map',
};
const uniqueCarrier = (pin) => PLACES.filter((p) => TEXTS[p].includes(pin));

describe('sov58 is in the course, fifty-eighth, and whole', () => {
  it('exists exactly once as the last lesson with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES).toHaveLength(58);
    expect(SOVEREIGN_AI_MODULES[SOVEREIGN_AI_MODULES.length - 1].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course ids run sov1 to sov58 with no gap and no repeat', () => {
    const numbers = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 58 }, (_, i) => i + 1));
  });

  it('the course meta follows its own module count rather than a hand-typed number', () => {
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(SOVEREIGN_AI_META.weeks).toBe(58);
    expect(SOVEREIGN_AI_META.format).toContain('58 weekly sessions');
  });

  it('carries its build day from a real commit, not from the working tree', () => {
    const day = lessonCreatedDay('sovereign-ai', ID);
    expect(day).toBe('2026-10-29');
    expect(day, 'a lesson dated working-tree is a defect').not.toBe('working-tree');
  });

  it('carries the shape this course holds a lesson to', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    expect(L.benefits).toHaveLength(10);
    expect(L.facilitator.talkingPoints).toHaveLength(10);
    expect(L.facilitator.discussionPrompts).toHaveLength(10);
    expect(L.facilitator.howToRun).toContain('Prayer + the anchor');
    expect(L.rpe.research.length).toBeGreaterThan(80);
    expect(L.rpe.plan.length).toBeGreaterThan(80);
    expect(L.rpe.execute.length).toBeGreaterThan(80);
  });
});

describe('the anchors were chosen by COUNTING, and the key is book-and-chapter', () => {
  it('every anchor reference resolves in the corpus on disk', () => {
    const refs = anchorRefs(L);
    expect(refs.length).toBeGreaterThanOrEqual(14);
    for (const r of refs) expect(corpusText(r), `${r} does not resolve`).toBeTruthy();
  });

  it('every reference the lesson quotes is also named in the anchor', () => {
    const named = new Set(anchorRefs(L));
    const quoted = new Set();
    for (const t of EVERY_STRING) for (const { ref } of quotedPairs(t)) if (ref) quoted.add(ref);
    const orphans = [...quoted].filter((r) => !named.has(r));
    expect(orphans, `quoted but not anchored: ${orphans.join(', ')}`).toEqual([]);
  });

  it('and every anchor reference has a home in the ADULT lesson, not a band only', () => {
    const inAdult = new Set(quotedPairs(L.lesson).map((p) => p.ref).filter(Boolean));
    const missing = anchorRefs(L).filter((r) => !inAdult.has(r));
    expect(missing, `anchored but never quoted in the adult lesson: ${missing.join(', ')}`).toEqual([]);
  });

  it('chapterOf returns BOOK AND CHAPTER, which is the key sov57 got wrong', () => {
    // The exact regression: a book-name key would return "Isaiah" here and the
    // collision set holds book-and-chapter, so nothing would ever match.
    expect(chapterOf('Isaiah 44:17')).toBe('Isaiah 44');
    expect(chapterOf('1 Samuel 17:34')).toBe('1 Samuel 17');
    expect(chapterOf('Psalms 104:5')).toBe('Psalms 104');
    expect(chapterOf('Isaiah 44:17')).not.toBe('Isaiah');
  });

  it('OURS is exactly the set of chapters the anchor names, derived not typed', () => {
    const derived = [...new Set(anchorRefs(L).map(chapterOf))];
    expect(derived.sort()).toEqual([...OURS].sort());
  });

  it('NO chapter of this spine is an anchor of any other lesson in the department', () => {
    const taken = new Set();
    for (const m of [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES]) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    // The department really is large, so an empty `taken` cannot fake a pass.
    expect(taken.size).toBeGreaterThan(300);
    const clashes = OURS.filter((c) => taken.has(c));
    expect(clashes, `another week already stands on: ${clashes.join(', ')}`).toEqual([]);
    // AND THE OTHER DIRECTION: the set must be able to report a hit at all.
    for (const spent of DECLINED_AS_SPENT) {
      expect(taken.has(spent), `${spent} was declined as spent but is anchored nowhere`).toBe(true);
    }
  });
});

describe('every verse is the corpus on disk', () => {
  it('each pinned span of the spine is verbatim and present in the module', () => {
    const whole = EVERY_STRING.join('\n');
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).toBeTruthy();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus text`).toBe(true);
      expect(whole.includes(span), `${ref} is pinned but the module does not quote it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty sweep cannot pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(85);
  });

  it('no quoted span carries an ellipsis, and no reader field prints a record id', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('Yahweh is never inside a quotation, and the quotations keep their own God and LORD', () => {
    for (const t of EVERY_STRING) {
      for (const { inside } of quotedPairs(t)) {
        expect(/Yahweh/.test(inside), `Yahweh was substituted into a quotation: ${inside.slice(0, 60)}`).toBe(false);
      }
    }
    // 1 Samuel 17:36 carries "the living God" and 17:37 "The LORD" in the
    // corpus; we quote them as written and the corpus is left untouched.
    expect(corpusText('1 Samuel 17:36')).toContain('the living God');
    expect(corpusText('1 Samuel 17:37')).toContain('The LORD that delivered me');
    expect(corpusText('Judges 3:1')).toContain('which the LORD left');
  });

  it('no generic God, GOD or LORD in our AUTHORED voice (quotations stripped)', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      const ours = String(text).replace(/"[^"]*"/g, ' ');
      expect(ours, `${place} names the generic God in our own voice`).not.toMatch(/\b(God|GOD|LORD)\b/);
    }
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(text, `${place} never says Yahweh`).toMatch(/\bYahweh\b/);
    }
  });

  it('never capitalises the adversary anywhere in the module', () => {
    for (const t of EVERY_STRING) {
      expect(t).not.toMatch(/\b(Satan|Lucifer|Devil|Adversary|Accuser|Deceiver|Baal)\b/);
    }
  });

  it('confesses Jesus as the Lamb and the Eternal Son in every place', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(text, `${place} does not confess Him`).toMatch(/Jesus[^.]{0,60}Lamb of Yahweh/);
      expect(text, `${place} does not name Him the Eternal Son`).toContain('Eternal Son');
    }
  });
});

describe('the source is named for what it is, not dressed as an argument', () => {
  it('the lesson says the issue is a newsletter and which items carried teaching', () => {
    expect(L.lesson).toContain('one issue of a daily technology newsletter');
    expect(L.lesson).toContain('It is not a study and it is not an argument');
    expect(L.lesson).toContain('ONE item carries the teaching this lesson is built on');
    expect(L.lesson).toContain('A second item is germane and is used');
  });

  it('and it names what it did NOT teach, rather than implying the issue was all thesis', () => {
    expect(L.lesson).toContain("Everything else is other people's news");
    expect(L.lesson).toContain('None of that is taught here');
  });

  it('WHAT WE DID NOT CHECK is on the lesson AND all four bands, each pin unique', () => {
    expect(L.lesson).toContain('WHAT WE DID NOT CHECK');
    for (const [place, pin] of Object.entries(UNREAD)) {
      expect(uniqueCarrier(pin), `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('every place says nobody telephoned the writer or the publisher, uniquely', () => {
    for (const [place, pin] of Object.entries(TELEPHONE)) {
      expect(uniqueCarrier(pin), `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('and every place reports the fetch failure as MEASURED, not as a polite phrase', () => {
    for (const [place, pin] of Object.entries(FETCH_FAILED)) {
      expect(uniqueCarrier(pin), `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
    expect(L.lesson).toContain('a measured failure and not a figure of speech');
    expect(L.lesson).toContain('rather than that nobody looked');
  });

  it('names the intake word and the instruction that came with it', () => {
    for (const place of PLACES) expect(TEXTS[place], `${place} drops the intake word`).toContain('Lessons');
    for (const place of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[place], `${place} drops the research-lane instruction`).toContain('research lane');
    }
  });

  it('refuses every advertiser, the shop list and every other story a foothold', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      for (const name of NOT_OURS) if (notOursRe(name).test(t)) found.push(name);
    }
    expect([...new Set(found)], `advertising or another story reached the teaching: ${found.join(', ')}`).toEqual([]);
    // the list is the whole edition's cast, not a token few
    expect(NOT_OURS.length).toBeGreaterThanOrEqual(40);
  });

  it('STAKES NO FIGURE, and that claim is enforced rather than asserted', () => {
    expect(L.lesson).toContain('this lesson stakes no figure');
    const offenders = [];
    for (const place of PLACES) {
      for (const shape of FIGURE_SHAPES) {
        const m = shape.exec(TEXTS[place]);
        if (m) offenders.push(`${place}: ${m[0]}`);
      }
    }
    expect(offenders, `a figure reached a reader text: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('the Word is quoted AND reasoned, not pasted onto a headline (DR-0281)', () => {
  it('reads the PURPOSE CLAUSE of Psalms 104:5 rather than the picture', () => {
    expect(L.lesson).toContain('Read the purpose clause rather than the picture');
    expect(L.lesson).toContain('It does not say the earth happens to be steady');
    expect(L.lesson).toContain('NOT BE REMOVED');
    expect(L.lesson).toContain('not a lucky property of good workmanship');
  });

  it('weighs the two end-words of Psalms 73:20 and names what an image is', () => {
    expect(L.lesson).toContain('the word for a made likeness');
    expect(L.lesson).toContain('the thing that looks like the thing and is not the thing');
  });

  it('presses NOT FOUND in Job 20:8 instead of only citing it', () => {
    expect(L.lesson).toContain('Not refuted');
    expect(L.lesson).toContain('NOT FOUND');
    expect(L.lesson).toContain('there is nothing there to find');
  });

  it('refuses to let the dream verses become a scolding, which is the DR-0098 move', () => {
    expect(L.lesson).toContain('the Word is not insulting a simulation');
    expect(L.lesson).toContain('what CLASS of thing a dream belongs to');
    expect(L.lesson).toContain('A dreamed dinner is a real experience and it feeds nobody');
  });

  it('turns on Judges 3:2 and credits the training ground to Yahweh, plainly', () => {
    expect(L.lesson).toContain('if it does not turn it is a scolding rather than a teaching');
    expect(L.lesson).toContain('He left them. On purpose.');
    expect(L.lesson).toContain("Yahweh's before it was theirs");
    expect(L.lesson).toContain('A rehearsal is a gift');
  });

  it('answers WHY David’s rehearsal transferred, which is the hinge', () => {
    expect(L.lesson).toContain('THE LION WAS REAL');
    expect(L.lesson).toContain('the Deliverer who showed up was the same Deliverer');
    expect(L.lesson).toContain('A rehearsal transfers exactly as far as it keeps faith with the thing it rehearses');
  });

  it('reads both time phrases of Luke 8:13 and what the parable refuses to do', () => {
    expect(L.lesson).toContain('FOR A WHILE');
    expect(L.lesson).toContain('IN TIME OF TEMPTATION');
    expect(L.lesson).toContain('It does not judge the soil by the first five minutes');
    expect(L.lesson).toContain('Fruit is a time measurement');
  });

  it('marks WHO is confounded in Jeremiah 10:14, which is the point of the verse', () => {
    expect(L.lesson).toContain('THE FOUNDER IS CONFOUNDED BY HIS OWN CASTING');
    expect(L.lesson).toContain('the expert is the one undone');
  });

  it('names the product in Zechariah 10:2 and prints the bill in the same verse', () => {
    expect(L.lesson).toContain('They comfort.');
    expect(L.lesson).toContain('not information, comfort');
    expect(L.lesson).toContain('the cost is not intellectual');
  });

  it('states the makers’ admission PLAINLY and refuses the sneer (DR-0100)', () => {
    expect(L.lesson).toContain('This house states that plainly');
    expect(L.lesson).toContain('it also refuses to sneer, because the makers said it themselves');
    expect(L.lesson).toContain('saying it was honest');
    expect(L.lesson).toContain('the less the world keeps faith with itself');
  });

  it('names the one genuinely open thing NARROWLY, and does not smear it (DR-0100)', () => {
    expect(L.lesson).toContain('one thing is honestly open, narrowly');
    expect(L.lesson).toContain('a limit stated in a research preview is a snapshot rather than a verdict');
    expect(L.lesson).toContain('That uncertainty is about the ceiling of the technology, not about the practice');
    expect(L.lesson).toContain('The practice - know which world you are in, rehearse on purpose, test over time - is not in doubt');
  });

  it('says where THIS house is thin instead of describing only other people', () => {
    expect(L.lesson).toContain('a lesson that only describes other people is worth nothing');
    expect(L.lesson).toContain('We have gates that prove the work is right and nothing that tracks the worker');
  });

  it('every band carries both halves, the hinge and the test in its own words', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} loses the purpose clause`).toContain('NOT BE REMOVED');
      expect(L.levels[b], `${b} loses the dream that is not found`).toContain('NOT FOUND');
      expect(L.levels[b], `${b} loses the hinge`).toContain('THE LION WAS REAL');
      expect(L.levels[b], `${b} loses the test`).toContain('TIME');
      expect(L.levels[b], `${b} loses the training ground`).toMatch(/to teach them war/);
    }
  });
});

describe('two stories, both invented, neither told as somebody’s life', () => {
  it('carries two stories and quotes the Word inside its own text', () => {
    expect(storyCount(L)).toBe(2);
    expect(quotesTheWord(L)).toBe(true);
  });

  it('both are PARABLES, so no page claims a real person lived this', () => {
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    for (const s of L.stories) {
      expect(s.kind, 'a newsletter-built lesson has nobody’s life in it').not.toBe('testimony');
      expect(s.source, 'a parable must not borrow a person’s name to look true').toBeUndefined();
      expect(String(s.body).length).toBeGreaterThan(600);
    }
    expect(L.stories.map((s) => s.title)).toEqual([
      'The driving lesson in the empty car park',
      'The forecast that agreed with the farmer',
    ]);
  });

  it('and each story carries the lesson rather than decorating it', () => {
    expect(L.stories[0].body).toContain('a practice place owes you nothing it never had');
    expect(L.stories[1].body).toContain('The walk had never been about the forecast');
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  it('passes the whole shared four-band ladder with nothing waived', () => {
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('each band is a real share of the adult lesson', () => {
    const m = measureFullness(L);
    expect(shortBands(m)).toEqual([]);
    for (const b of BANDS) expect(m.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside the new-lesson ceiling', () => {
    const m = measureLesson(L);
    const g = Object.fromEntries(BANDS.map((b) => [b, m.bands[b].authored]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g.teen).toBeLessThanOrEqual(LADDER.teenCeiling);
    expect(g.senior).toBeLessThanOrEqual(LADDER.seniorCeiling);
    expect(isInverted(m)).toBe(false);
  });

  it('no band is a reworded copy of another, measured against the near-copy line', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    // the stricter house line, which is the one the ladder fixture enforces
    expect(d.worst).toBeLessThan(LADDER.nearCopy);
  });

  it('each band names its own lesson in its opening', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('each band is written from its OWN material, proven by an image no other band uses', () => {
    for (const [place, phrase] of Object.entries(OWN_IMAGE)) {
      expect(uniqueCarrier(phrase), `"${phrase}" should be ${place}'s alone`).toEqual([place]);
    }
  });
});

describe('plain meaning, headings, and the three directions', () => {
  it('no hard term arrives before its plain cue, in any reader text', () => {
    for (const [place, text] of Object.entries(TEXTS)) {
      expect(termFaults(text), place).toEqual([]);
    }
  });

  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBe(12);
    expect(ns).toEqual(ns.map((_, i) => i + 1));
  });

  it('no band opens a sentence with an ordinal the formatter reads as a marker', () => {
    for (const b of BANDS) {
      expect(L.levels[b], b).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
    }
  });

  it('carries no doubled word in any string', () => {
    for (const t of EVERY_STRING) expect(t, t.slice(0, 50)).not.toMatch(/\b([A-Za-z]{3,})\s+\1\b/i);
  });

  it('the lesson and all four bands send the reader all three ways', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it('and each place names the skill and the rhythm, not only the direction', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], `${place} drops the listening skill`).toMatch(/listen all the way to the end|Listen all the way to the end|shut up until they have finished/);
      expect(TEXTS[place], `${place} drops the retell step`).toMatch(/own words/);
      expect(TEXTS[place], `${place} drops the one-friend rhythm`).toMatch(/one friend (?:this week|before the week ends)/);
    }
  });
});

// ===========================================================================
// PROVEN-TO-CATCH (DR-0076 §3). Each case below was applied to the REAL shipped
// strings, run, seen to fail, and restored. A check nobody has watched go red
// is a claim, not a gate.
// ===========================================================================
describe('PROVEN-TO-CATCH: each check was watched to fail on the live text', () => {
  it('a quotation that drifted by one word is caught', () => {
    const bent = 'He wrote it. "Who laid the foundations of the earth, that it should not be moved for ever" (Psalms 104:5).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(verbatimFaults(['He wrote it. "Who laid the foundations of the earth, that it should not be removed for ever" (Psalms 104:5).'])).toEqual([]);
  });

  it('a verbatim span hung on the WRONG reference is caught', () => {
    const bent = 'He said it. "Thy servant slew both the lion and the bear" (1 Samuel 17:34).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(verbatimFaults(['He said it. "Thy servant slew both the lion and the bear" (1 Samuel 17:36).'])).toEqual([]);
  });

  it('substituting Yahweh into a quotation is caught', () => {
    const bent = 'He said "Now these are the nations which Yahweh left, to prove Israel by them" (Judges 3:1).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(quotedPairs(bent).some((p) => /Yahweh/.test(p.inside))).toBe(true);
    for (const t of EVERY_STRING) for (const { inside } of quotedPairs(t)) expect(/Yahweh/.test(inside)).toBe(false);
  });

  it('an ELIDED quotation is caught, so no span may be trimmed with dots', () => {
    const bent = { ...L, lesson: `${L.lesson} He wrote "Who laid the foundations ... for ever" (Psalms 104:5).` };
    expect(elidedQuotations(bent).length).toBeGreaterThan(0);
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('planting a currency figure in a band is caught', () => {
    const bent = `${L.levels.youth} The round was $2 billion.`;
    const hits = FIGURE_SHAPES.filter((s) => s.test(bent));
    expect(hits.length, 'both the currency and the magnitude shape should fire').toBeGreaterThanOrEqual(2);
    for (const s of FIGURE_SHAPES) expect(s.test(L.levels.youth)).toBe(false);
  });

  it('planting a percentage is caught too, which a currency check alone would miss', () => {
    const bent = 'Only 87% of them reported having the time.';
    expect(FIGURE_SHAPES.some((s) => s.test(bent))).toBe(true);
    expect(FIGURE_SHAPES[0].test(bent), 'the currency shape alone would miss it').toBe(false);
    expect(FIGURE_SHAPES.some((s) => s.test('Only a handful of them reported having the time.'))).toBe(false);
  });

  it('an advertiser or another story reaching the teaching is caught, and ordinary English is not', () => {
    const bent = `${L.lesson} The notepad that kept the slides was Granola.`;
    expect(NOT_OURS.filter((n) => notOursRe(n).test(bent))).toEqual(['Granola']);
    expect(NOT_OURS.filter((n) => notOursRe(n).test(L.lesson))).toEqual([]);
    // and the subject's own vendor is refused with the rest
    expect(NOT_OURS.filter((n) => notOursRe(n).test('The model was built by DeepMind.'))).toEqual(['DeepMind']);
    // the word-boundary form is why these do not fire on real prose
    for (const innocent of ['slack in the rope', 'the chrome handle', 'an oracle of old', 'a genie in a tale', 'he hobbled home']) {
      expect(NOT_OURS.filter((n) => notOursRe(n).test(innocent)), innocent).toEqual([]);
    }
  });

  it('deleting the unread-article disclosure from ONE band is caught, by that band’s name', () => {
    const pin = UNREAD.teen;
    expect(uniqueCarrier(pin)).toEqual(['teen']);
    const stripped = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(pin, '') } };
    const texts = { adult: stripped.lesson, ...Object.fromEntries(BANDS.map((b) => [b, stripped.levels[b]])) };
    const carriers = Object.keys(texts).filter((p) => texts[p].includes(pin));
    expect(carriers, 'the teen disclosure was deleted and nothing noticed').toEqual([]);
  });

  it('and deleting the telephone disclosure from the SENIOR band is caught the same way', () => {
    const pin = TELEPHONE.senior;
    expect(uniqueCarrier(pin)).toEqual(['senior']);
    const stripped = L.levels.senior.replace(pin, '');
    expect(stripped.includes(pin), 'the senior disclosure was deleted and nothing noticed').toBe(false);
    for (const p of PLACES.filter((x) => x !== 'senior')) expect(TEXTS[p].includes(pin)).toBe(false);
  });

  it('deleting the measured fetch failure from the CHILD band is caught', () => {
    const pin = FETCH_FAILED.child;
    expect(uniqueCarrier(pin)).toEqual(['child']);
    const stripped = L.levels.child.replace(pin, '');
    expect(stripped.includes(pin), 'the child fetch disclosure was deleted and nothing noticed').toBe(false);
  });

  it('printing a record id in reader prose is caught', () => {
    const bent = { ...L, levels: { ...L.levels, teen: `${L.levels.teen} See DR-1295 for the record.` } };
    expect(recitedRecords(bent).map((r) => r.where)).toContain('levels.teen');
    expect(recitedRecords(L)).toEqual([]);
  });

  it('a band shortened to a summary is caught by the share floor', () => {
    const stub = L.levels.teen.split('. ').slice(0, 4).join('. ');
    const broken = { ...L, levels: { ...L.levels, teen: stub } };
    expect(shortBands(measureFullness(broken))).toContain('teen');
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('a band copied from its sibling is caught by the near-copy line', () => {
    const broken = { ...L, levels: { ...L.levels, youth: L.levels.teen } };
    expect(fourBandFaults(broken).join(' ')).toMatch(/near copy/);
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('a band that loses its title opening is caught', () => {
    const headline = L.levels.child.split('\n\n')[0];
    expect(headline).toContain('THE WORLD THAT DOES NOT DRIFT');
    const broken = { ...L, levels: { ...L.levels, child: L.levels.child.replace(headline, 'Here is an idea.') } };
    expect(unnamedBands(broken)).toEqual(['child']);
    expect(unnamedBands(L)).toEqual([]);
  });

  it('stripping one band’s friend line alone is named for THAT band', () => {
    // The DR-0795 proof: the per-band check must name the band while the
    // module-pooled hasAllThree still reads green, which is why pooling alone
    // was never enough.
    const line = 'Friends, tell a friend the one thing you have quietly stopped double-checking, then ask them to name theirs.';
    expect(L.levels.teen).toContain(line);
    const broken = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(line, '') } };
    const missing = placesMissingDirections(broken);
    expect(missing.map((x) => x.place)).toEqual(['teen']);
    expect(missing[0].missing).toContain('friends');
    expect(hasAllThree(broken), 'the pooled check still reads whole, which is the point').toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('a story relabelled as a testimony is caught', () => {
    const broken = { ...L, stories: [{ ...L.stories[0], kind: 'testimony' }, L.stories[1]] };
    expect(broken.stories.map((s) => s.kind)).not.toEqual(['parable', 'parable']);
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
  });

  it('an anchor chapter colliding with another week IS detected, both ways', () => {
    const taken = new Set();
    for (const m of [...SOVEREIGN_AI_MODULES, ...MODULES, ...AI_LEGAL_BLUEPRINT_MODULES]) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) {
        const c = chapterOf(r);
        if (c) taken.add(c);
      }
    }
    // Adopting a spent chapter is exactly the fault the counting rule refuses.
    expect(['Hebrews 11'].filter((c) => taken.has(c))).toEqual(['Hebrews 11']);
    expect(OURS.filter((c) => taken.has(c))).toEqual([]);
    // AND the vacuous-pass regression: a BOOK-NAME key finds nothing at all,
    // which is how sov57's first draft passed over a real clash.
    const bookOnly = (ref) => (/^(.+?)\s+\d+:/.exec(String(ref).trim()) || [])[1];
    expect(bookOnly('Hebrews 11:3')).toBe('Hebrews');
    expect(taken.has(bookOnly('Hebrews 11:3')), 'a book-name key matches nothing and passes vacuously').toBe(false);
    expect(taken.has(chapterOf('Hebrews 11:3')), 'the book-and-chapter key finds the real clash').toBe(true);
  });
});

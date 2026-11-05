// @vitest-environment node
// =============================================================================
// L280 — Whose Answer Comes in the Night: the channel Yahweh keeps, the
// technique that cannot open it, and chaff or wheat before you act
// =============================================================================
// SOURCE (DR-0312 intake): Gmail thread 1a163ce6aaf1fed5, one message, forwarded
// 2026-10-22 13:30:28 UTC from a university mailbox to a personal one, a morning
// news digest of that day, with one typed word above the forwarded From: header
// — Lessons — and that word is what the build is judged by, never the subject
// line. WHO TAUGHT (DR-0719): NOBODY. A forwarded newsletter is not a recording,
// so no teacher is identified, and this gate forbids the bare phrase "the
// teacher" and forbids crediting Bishop Gwin for a source that names nobody.
//
// WHAT WAS REFUSED, AND WHY THIS LESSON EXISTS AT ALL (DR-1324). Both of the
// digest's lead items were refused. The reported military planning between
// named nations is politics, and teaching it hands a reader a side to join,
// which is the staged two-sides posture DR-0098 exists to remove; it also rests
// on one unnamed source, so a report of a plan is not the plan. The corporate
// merger lands where sov50, sov51, sov55, sov56 and sov31 already land, and as
// the enrichment it lands on ll276. The hundred-million donation lands on ll274
// (price your own name; the pillar called after his own name). The licence-plate
// contract lands on sov46, sov49 and sov56. What is GENUINELY UNBUILT across all
// 44 courses is this lesson's ground: Genesis 40:8, Genesis 41:15-16, Daniel
// 2:19/22/23/27/28/30, Job 33:14-18, Job 4:12-16, Job 42:7, Numbers 12:6,
// Jeremiah 23:25-27, Jeremiah 23:32, Jeremiah 29:8, Ecclesiastes 5:7 and
// Deuteronomy 13:3 appear NOWHERE else in the repository.
//
// PER DR-1317 NO VERSE WAS DROPPED FOR APPEARING ELSEWHERE. Jeremiah 23:28 and
// Ecclesiastes 5:3 are carried by sov36, sov53 and sov41 in another course for
// entirely different landings, and the overlap is how the courses connect.
//
// THIS LESSON'S DANGERS are four, and each has its own case plus a proof that
// the case catches. (1) Flattening it into a blanket prohibition on dreams —
// the lesson must CONCEDE that Yahweh speaks in the night before it refuses
// anything, in the lesson and in every band, or the counterfeit is never
// explained. (2) Losing the control case: Job 33:15 and Job 4:13 describe the
// same hour in nearly the same words and only one speaker was approved, so
// Job 42:7 must survive in every band. (3) Letting accuracy become a credential
// — Deuteronomy 13:1-3 refuses a sign that came to pass, and that is the
// hardest sentence in the lesson. (4) Blurring DR-0100's three tiers, or
// smuggling a figure or a modern name out of a politically charged digest.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by a {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L279's, copied whole so the gates measure the same way.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { censusLesson } from '../lib/library-census.js';

const ID = 'll280-whose-answer-comes-in-the-night';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names (plain, range, or "Book c:v, c:v"), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it; odd split indices are inside quotes. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. Contiguous only: no elision is accepted. */
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);
const parseRef = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(String(r).trim()); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one of these was fetched from app/public/bible/kjv BEFORE it was written.
const SPINE = [
  ['Numbers 12:6', 'will speak unto him in a dream'],
  ['Job 33:14', 'For God speaketh once, yea twice, yet man perceiveth it not'],
  ['Job 33:15', 'when deep sleep falleth upon men'],
  ['Job 33:16', 'Then he openeth the ears of men, and sealeth their instruction'],
  ['1 Kings 3:5', 'Ask what I shall give thee'],
  ['Psalms 127:2', 'so he giveth his beloved sleep'],
  ['Genesis 40:8', 'Do not interpretations belong to God?'],
  ['Genesis 41:16', 'It is not in me'],
  ['Daniel 2:27', 'cannot the wise men, the astrologers, the magicians, the soothsayers, shew unto the king'],
  ['Daniel 2:28', 'But there is a God in heaven that revealeth secrets'],
  ['Daniel 2:30', 'not revealed to me for any wisdom that I have more than any living'],
  ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
  ['Ecclesiastes 5:3', 'For a dream cometh through the multitude of business'],
  ['Ecclesiastes 5:7', 'but fear thou God'],
  ['Isaiah 29:8', 'but he awaketh, and his soul is empty'],
  ['Jeremiah 29:8', 'neither hearken to your dreams which ye cause to be dreamed'],
  ['Jeremiah 23:25', 'I have dreamed, I have dreamed'],
  ['Jeremiah 23:26', 'they are prophets of the deceit of their own heart'],
  ['Jeremiah 23:27', 'forget my name by their dreams'],
  ['Jeremiah 23:28', 'What is the chaff to the wheat?'],
  ['Jeremiah 23:32', 'they shall not profit this people at all'],
  ['Job 4:13', 'when deep sleep falleth on men'],
  ['Job 4:12', 'mine ear received a little thereof'],
  ['Job 42:7', 'ye have not spoken of me the thing that is right'],
  ['Deuteronomy 13:2', 'And the sign or the wonder come to pass, whereof he spake unto thee'],
  ['Deuteronomy 13:3', 'Thou shalt not hearken unto the words of that prophet, or that dreamer of dreams'],
  ['Isaiah 8:20', 'To the law and to the testimony'],
  ['1 John 4:1', 'try the spirits whether they are of God'],
  ['James 1:5', 'If any of you lack wisdom, let him ask of God'],
  ['Proverbs 3:5', 'lean not unto thine own understanding'],
  ['Psalms 119:105', 'Thy word is a lamp unto my feet'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['1 Corinthians 2:16', 'But we have the mind of Christ'],
];

// The spans every reader must meet, whichever single version they open (DR-0795's
// principle applied to the teaching itself: a reader reads ONE band).
const IN_EVERY_PLACE = [
  'will speak unto him in a dream',          // the concession: the channel is real
  'when deep sleep falleth upon men',        // given, at the hour of least control
  'so he giveth his beloved sleep',
  'Do not interpretations belong to God?',   // the meaning was never the dreamer's
  'It is not in me',
  'But there is a God in heaven that revealeth secrets',
  'For a dream cometh through the multitude of business', // the deflation
  'but he awaketh, and his soul is empty',
  'neither hearken to your dreams which ye cause to be dreamed', // the counterfeit, named
  'forget my name by their dreams',          // and what it is actually after
  'when deep sleep falleth on men',          // the control case
  'ye have not spoken of me the thing that is right',
  'What is the chaff to the wheat?',         // the test
  'Thou shalt not hearken unto the words of that prophet, or that dreamer of dreams',
  'To the law and to the testimony',
  'If any of you lack wisdom, let him ask of God', // where to go instead
  'Behold the Lamb of God, which taketh away the sin of the world',
];

// Nothing the digest named may reach a reader. Checked against the WHOLE module,
// because none of these collides with any word of the KJV this lesson quotes.
const FORBIDDEN_NAMES = [
  'Iran', 'Israel', 'Israeli', 'NPR', 'SpaceX', 'Tesla', 'Musk', 'Elon', 'Trump',
  'Obama', 'Harris', 'Netanyahu', 'AIPAC', 'Flock', 'MacArthur', 'Cardi',
  'Illinois', 'Navajo', 'Gies', 'Chiricahua', 'Arizona', 'Denver', 'Parkinson',
  'West Bank', 'Up First', 'Morning Brew',
];

/** Scripture references, ISO dates and the lesson id scrubbed; then any figure left is a leak. */
export function figuresLeft(text) {
  const scrubbed = String(text)
    .replace(/\(?(?:[1-3] )?[A-Z][A-Za-z]+(?: of [A-Za-z]+)? \d+:\d+(?:-\d+)?\)?/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}/g, ' ');
  return scrubbed.match(/\d[\d,.]*%?/g) || [];
}

describe('L280 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 280 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 280)).toEqual([280]);
  });

  it('carries its build day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-05');
  });

  it('is WHOLE by the library census: every component and every version present', () => {
    const c = censusLesson(L);
    expect(c.missingComponents).toEqual([]);
    expect(c.missingVersions).toEqual([]);
    expect(c.whole).toBe(true);
    expect(c.adultWords).toBeGreaterThan(400);
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range, and a facilitator guide', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(6);
    expect(String(L.facilitator.howToRun).length).toBeGreaterThan(400);
  });

  it('the anchor resolves everywhere and every reference is named in the lesson (DR-0734)', () => {
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parseRef(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parseRef(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const anchors = String(L.anchor.ref).split(';').map((s) => parseRef(s)).filter(Boolean);
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref).filter(Boolean)));
    const missing = [...quoted].filter((r) => { const p = parseRef(r); return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b); });
    expect(missing).toEqual([]);
  });
});

describe('WHO TAUGHT: nobody, and the lesson says so rather than implying one (DR-0719)', () => {
  it('names no teacher, and never credits Bishop Gwin for a source that names nobody', () => {
    const all = EVERY_STRING.join(' ');
    expect(all).not.toMatch(/\bBishop\b|\bGwin\b|\bBG\b/);
    expect(all).not.toMatch(/\bthe teacher\b/i);
    expect(all).not.toMatch(/\bvoice:BG\b/);
  });

  it('states in the lesson and every band that nobody taught it, and why', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/not a recording/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bLessons\b/);
    expect(L.inApp).toMatch(/nobody taught it, so no teacher is identified/);
  });
});

describe('the lesson CONCEDES the channel before it refuses the technique', () => {
  it('states in the lesson and every band that Yahweh really does speak in the night', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('will speak unto him in a dream');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/does speak (in|at) the night|really does speak/);
    expect(L.lesson).toMatch(/THE CHANNEL IS REAL\./);
  });

  it('and says why the concession is the argument: a counterfeit is struck from something real', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/counterfeit|fake|forgery/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/only ever (made|manufactured|struck)/);
  });

  it('PROVEN TO CATCH: a band that drops the concession verse is named, band by band', () => {
    const SPAN = 'will speak unto him in a dream';
    for (const b of BANDS) {
      const broken = { ...L, levels: { ...L.levels, [b]: L.levels[b].replace(SPAN, 'will speak unto him') } };
      expect(broken.levels[b].includes(SPAN), b).toBe(false);
      expect(BANDS.filter((x) => !broken.levels[x].includes(SPAN))).toEqual([b]);
    }
  });
});

describe('given never operated, and the meaning was never the dreamer’s', () => {
  it('pins the hour of least control, and sleep as a gift, in every place', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('when deep sleep falleth upon men');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('so he giveth his beloved sleep');
  });

  it('keeps the dreamer’s own posture and the guild that could not supply it', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Do not interpretations belong to God?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('It is not in me');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But there is a God in heaven that revealeth secrets');
    expect(L.lesson).toContain('cannot the wise men, the astrologers, the magicians, the soothsayers, shew unto the king');
    expect(L.lesson).toContain('The secret things belong unto the LORD our God');
  });

  it('says in every place that unlock is the wrong verb, with the reason', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/unlock is (simply )?(the )?wrong (verb|word)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/lock (is|was) not (installed |fitted )?on our side|lock was never fitted on our side/i);
  });

  it('and keeps the Word’s own deflation rather than only the warning', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For a dream cometh through the multitude of business');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but he awaketh, and his soul is empty');
  });
});

describe('the counterfeit is named in Scripture, and its aim is stated', () => {
  it('carries the incubation verse and the aim in every place', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('neither hearken to your dreams which ye cause to be dreamed');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('forget my name by their dreams');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/caused to be dreamed/i);
  });

  it('PROVEN TO CATCH: dropping the aim from one band alone is caught, band by band', () => {
    const SPAN = 'forget my name by their dreams';
    const stripped = BANDS.filter((b) => !L.levels[b].replace(SPAN, '').includes(SPAN));
    expect(stripped).toEqual(BANDS);
    for (const b of BANDS) {
      const broken = { ...L, levels: { ...L.levels, [b]: L.levels[b].replace(SPAN, 'forget my name') } };
      expect(broken.levels[b].includes(SPAN), b).toBe(false);
      expect(BANDS.filter((x) => !broken.levels[x].includes(SPAN))).toEqual([b]);
    }
  });
});

describe('the control case, and accuracy refused as a credential', () => {
  it('keeps both night visions and Yahweh’s verdict on the second, in every place', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('when deep sleep falleth on men');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('ye have not spoken of me the thing that is right');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('What is the chaff to the wheat?');
  });

  it('says in every place that the experiences were indistinguishable and what separated them', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/said about Yahweh/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/felt real|how real it felt/i);
  });

  it('refuses accuracy as a credential: the sign came to pass and is still not followed', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And the sign or the wonder come to pass, whereof he spake unto thee');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not hearken unto the words of that prophet, or that dreamer of dreams');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/not a (credential|badge)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('To the law and to the testimony');
  });

  it('PROVEN TO CATCH: softening the came-to-pass clause in the lesson fails the sweep', () => {
    const broken = L.lesson.replace(
      'And the sign or the wonder come to pass, whereof he spake unto thee',
      'And the sign or the wonder may come to pass, whereof he spake unto thee',
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('and sends the reader awake to Yahweh with the Word open', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('If any of you lack wisdom, let him ask of God');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('lean not unto thine own understanding');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy word is a lamp unto my feet');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/awake/);
  });
});

describe('DR-0100: the three tiers are held apart, and the hedge is refused rather than used', () => {
  it('names documented, alleged and unchecked in the lesson and in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/DOCUMENTED|known for sure/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/ALLEGED|only a claim/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/UNCHECKED|not checked/);
  });

  it('every sentence containing the hedge is a REFUSAL of it, in every place', () => {
    for (const k of PLACES) {
      const sentences = TEXTS[k].split(/(?<=[.!?])\s+/).filter((s) => /some people say/.test(s));
      expect(sentences.length, `${k} never names the hedge`).toBeGreaterThan(0);
      for (const s of sentences) expect(s, `${k}: ${s.slice(0, 80)}`).toMatch(/(not|never) (softened|hedged) into/);
    }
  });

  it('keeps the allegation narrow: a report of a plan is not the plan, and no verdict is reached', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/report of a plan is not the plan|A plan is not the same as a thing that happened/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/one unnamed source|one person with no name|one source who was not named|one source|no name/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/no verdict about any (nation|land)/);
  });

  it('lists the unchecked items one by one rather than gesturing at them', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/publisher|paper’s own pages|paper's own pages/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/local/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/research|science/);
  });
});

describe('nothing out of a politically charged digest reaches the reader', () => {
  it('names no nation, person, party, company or publisher from the issue, anywhere in the module', () => {
    const all = EVERY_STRING.join(' ');
    const found = FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(all));
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: one planted modern name in one band is found', () => {
    const planted = `${L.levels.teen} The digest reported on Tesla.`;
    expect(FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(planted))).toEqual(['Tesla']);
  });

  it('states NOT ONE FIGURE from the issue in any reader place', () => {
    for (const k of PLACES) expect(figuresLeft(TEXTS[k]), `${k} leaked a figure`).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/[Nn]ot one (number|figure)/);
  });

  it('PROVEN TO CATCH: five planted figure shapes are each found, while a Scripture reference stays invisible', () => {
    for (const planted of ['a market cap of $3.7 trillion', 'about 80 people', '20 readers', 'a 100 million pledge', 'up 12%']) {
      expect(figuresLeft(planted).length, planted).toBeGreaterThan(0);
    }
    expect(figuresLeft('He said it Himself (Numbers 12:6), and again in Job 33:15, on 2026-10-22.')).toEqual([]);
  });

  it('and says in every place why the political items are refused', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/side to (join|take up)|pick a side/);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('and every span a single reader must meet is in the lesson AND in all four bands', () => {
    for (const span of IN_EVERY_PLACE) {
      for (const k of PLACES) expect(TEXTS[k].includes(span), `${k} is missing: ${span}`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(300);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(300);
    expect(new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref))).size).toBeGreaterThanOrEqual(60);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('What is the chaff to the wheat?', 'What is the chaff to the harvest?');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"when deep sleep falleth upon men', '"When deep sleep falleth upon men');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('Yahweh is never put inside a quotation, in any string of the module', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
      }
    }
    expect(planted).toEqual([]);
  });

  it('every double-quoted span carries a reference: our own words are never put in double quotes', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('the advertisement’s own sentence is rendered in our words, never dressed as a quotation', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/unlock the wisdom of your dreams/i);
    for (const t of EVERY_STRING) {
      for (const p of quotedPairs(t)) expect(/unlock the wisdom/i.test(p.inside), 'the advertisement is inside double quotes').toBe(false);
    }
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic "what God says in the night", copied through unquoted, is refused', () => {
    const planted = 'The question is whether God speaks in the night at all.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Do not interpretations belong to God?');
    expect(inQuotes).toContain('I the LORD will make myself known unto him in a vision');
    expect(inQuotes).toContain('The secret things belong unto the LORD our God');
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210), in every place', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world');
  });

  it('never capitalises the adversary, and never capitalises baal', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });

  it('carries the six names of the one discipline (MIND-OF-CHRIST register) in every place', () => {
    for (const k of PLACES) {
      for (const name of ['Mind of Christ', 'The Way', 'Sound Mind', 'Captive Thoughts', 'Renewed Mind', 'Mental Stewardship']) {
        expect(TEXTS[k], `${k}: ${name}`).toContain(name);
      }
    }
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the child friend line names child and only child, while the pooled check still reads green', () => {
    const child = L.levels.child;
    const friend = /Friends, tell one friend this week about the two men in Job[^.]*\./.exec(child);
    expect(friend, 'the child band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, child: child.replace(friend[0], '') } };
    expect(stripped.levels.child).not.toBe(child);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'child', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });

  it('and each place carries the skill and the rhythm in its own words', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/TALK ABOUT IT TOGETHER\./);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/at the table, on the way, at bedtime/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/one friend this week/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/teach them one verse back — Genesis 40:8/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/without interrupting|listen to the whole story|let them talk all the way to the end/);
  });
});

describe('growth is measured the Word’s way, never imported', () => {
  it('names fruit, and occasions and days, in the lesson and every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But exhort one another daily, while it is called To day');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And Jesus increased in wisdom and stature, and in favour with God and man');
  });

  it('and imports no outside measure of growth', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b|\bscore of\b|\bKPI\b/);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) {
      expect(TEXTS[k].startsWith('WHOSE ANSWER COMES IN THE NIGHT — the channel Yahweh keeps, the technique that cannot open it, and chaff or wheat before you act.'), k).toBe(true);
    }
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});

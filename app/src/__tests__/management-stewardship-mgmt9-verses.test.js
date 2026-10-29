// @vitest-environment node
// =============================================================================
// mgmt9 — Nobody is coming to define your work (DR-1281)
// =============================================================================
// Darrell forwarded a SmartBrief for the Higher Ed Leader edition of 5 October
// 2026 to himself on 6 October with one word typed above the body: Lessons. That
// word is the whole request, and it had been waiting three weeks.
//
// WHAT THE SOURCE ACTUALLY IS, because this gate exists mostly to keep that
// honest. A SmartBrief issue is a column of other people's headline summaries
// with sponsor placements set between them. ONE item in it carries a teaching: a
// guest column by Mara Woody of Riipen, reporting a conference remark that
// employers are asking higher education to develop AI literacy while the
// employers do not themselves know what AI literacy is. Everything else is other
// people's news or advertising, and a check below refuses every one of those
// names a foothold in any string of the module (Darrell's standing rule on ads).
//
// THE PARTICULAR DANGER HERE IS NOT A BORROWED NUMBER, BECAUSE THE LESSON STAKES
// NONE. The issue carried several figures — a campus gift, a privately funded
// academy, a national housing shortfall — and every one of them belongs to a
// DIFFERENT story. None is germane, none is taught, and the checks below pin
// that claim by requiring that no reader-facing text in this module carries a
// currency symbol, a percentage, or a magnitude word attached to a number. A
// claim of "we stake no figure" that nothing enforces is the theatre DR-0076 §3
// forbids. The counted worklist in the-third-pile-is-a-worklist.test.js holds the
// other half of the admission (GAP 13 -> 14, with its reason and its date).
//
// THE SECOND DANGER IS THE SUBJECT ITSELF. Education policy invites camps, and a
// lesson on it could easily end up staging three human schools for a reader to
// choose between and calling that balance (DR-0098). So the lesson says its own
// method out loud, and a check below requires that sentence to be present and
// requires the reported admission to be stated PLAINLY rather than hedged into
// "nobody knows" (DR-0100).
//
// BOTH STORIES ARE PARABLES, IN THE THIRD PERSON. This lesson is built from a
// newsletter; nobody's life is in it. A `kind: 'testimony'` here would render to
// the reader as "A true story... told with the person's consent" over an invented
// narrator, which is a lie on the page (DR-0811), so a check forbids it.
//
// EVERY PIN IS CHECKED FOR UNIQUENESS BEFORE IT IS TRUSTED. A phrase that occurs
// in two places cannot witness for one of them: the disclosure checks below
// assert that each pinned sentence occurs in EXACTLY ONE reader text and that it
// is the expected one, because a bare token that sits in two places passes while
// the thing it was pinning is deleted.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  MANAGEMENT_STEWARDSHIP_MODULES, MANAGEMENT_STEWARDSHIP_META,
} from '../lib/management-stewardship-course.js';
import { propertyPrincipleRefs } from '../lib/property-principle-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree, missingDirections } from '../lib/talk-together.js';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import { recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { fourBandFaults } from './fixtures/four-band-ladder.js';

const ID = 'mgmt9-nobody-is-coming-to-define-your-work';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = MANAGEMENT_STEWARDSHIP_MODULES.find((m) => m.id === ID);
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
/** Every quoted span with the reference that follows it, by splitting on the quote. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds, contiguous only. */
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

// THE SPINE, pinned by literal text. Every span was read out of
// app/public/bible/kjv/*.json before it was written.
//
// IT IS FREE ACROSS THE REAL ESTATE SHELF, WHICH IS THE QUESTION THE DEPARTMENT
// ACTUALLY ASKS, AND TWO DRAFTS WERE NOT. Several of these chapters are held by
// lessons in OTHER departments (Deuteronomy 6, Malachi 4, 2 Timothy 2,
// Proverbs 12, Proverbs 30 and 1 Thessalonians 4 all are), which the department's
// rule does not forbid and this gate does not claim otherwise. The first draft
// stood on Exodus 31:3 and Exodus 35:34 -- Bezaleel filled with the spirit of
// God, and the heart put in him that he may teach -- and CI caught it on shard
// 4/4: maintenance-trades-course.test.js asserts that course shares no
// book-and-chapter with ANY of the other four Real Estate courses, and the
// maintenance course already stands on Exodus 31 and Exodus 35, because the
// first Spirit-filled man in Scripture is a craftsman and that is its own
// lesson 2. My counting had been against the FOOTING course and mgmt1-mgmt8
// only, which is a narrower question than the department asks (DR-0076 s.4: a
// measurement answers only the question it was taken on).
//
// The teaching did not change; the chapters did. Exodus 36:1 keeps the same
// builders with the know-how put IN the man, and 1 Chronicles 25:8 carries the
// teach-half better than the first draft did: the roll that cast lots for the
// trained singers counted "the teacher as the scholar", so teaching sits inside
// the work rather than above it. 1 Chronicles 22:16 was added in the same pass
// because it is the lesson's own thesis in six words.
//
// THEN THE SECOND DRAFT FAILED THE SAME WAY ON ITS CENTRAL IMAGE, and this gate
// is what caught it rather than CI. The lesson stood on Proverbs 6:6-8, the ant
// with no guide, overseer or ruler -- and the BUYING-TERMS course holds
// Proverbs 6 for its surety lesson (buy4). Writing the check below is what
// surfaced it; reasoning about it twice had not. The remedy is better than what
// it replaced: Proverbs 30 carries the ant AND the locusts in one passage, and
// Proverbs 30:27 says what Proverbs 6:7 could not -- the locusts have no king
// "yet go they forth all of them by bands", which is ORDER without a ruler and
// not merely motion without one.
//
// Proverbs 27:17 was the obvious friend-prompt verse and was DELIBERATELY not
// used, because the footing course already stands on Proverbs 27 -- so every
// band's friend prompt carries no verse rather than a borrowed chapter.
const SPINE = [
  ['Proverbs 30:24', 'There be four things which are little upon the earth, but they are exceeding wise:'],
  ['Proverbs 30:25', 'The ants are a people not strong, yet they prepare their meat in the summer;'],
  ['Proverbs 30:27', 'The locusts have no king, yet go they forth all of them by bands;'],
  ['1 Thessalonians 4:11', 'your own business, and to work with your own hands, as we commanded you;'],
  ['Ecclesiastes 9:10', 'Whatsoever thy hand findeth to do, do it with thy might;'],
  ['Exodus 36:1', 'in whom the LORD put wisdom and understanding to know how to work all manner of work'],
  ['1 Chronicles 25:8', 'as well the small as the great, the teacher as the scholar'],
  ['1 Chronicles 12:32', 'had understanding of the times, to know what Israel ought to do;'],
  ['2 Timothy 2:2', 'to faithful men, who shall be able to teach others also.'],
  ['Proverbs 12:24', 'The hand of the diligent shall bear rule: but the slothful shall be under tribute.'],
  ['1 Chronicles 22:16', 'Arise therefore, and be doing, and the LORD be with thee.'],
  ['Deuteronomy 6:7', 'teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way'],
  ['Malachi 4:6', 'he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
];

// THE NEWSLETTER'S REPORT AS DATA. The child band meets the column as a
// nine-year-old does (a lady wrote about it; the companies could not say what
// they were asking for) rather than through the adult clause, by design, so
// Riipen is not required there.
const REPORTED = [
  { claim: 'Mara Woody', where: ['adult', 'child', 'youth', 'teen', 'senior'] },
  { claim: 'Riipen', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'SmartBrief', where: ['adult', 'youth', 'teen', 'senior'] },
  { claim: 'AI literacy', where: ['adult', 'youth', 'teen', 'senior'] },
];

// Other people's stories and the sponsor copy from that same edition. None is
// germane, none is taught, and none may appear anywhere in the module.
const NOT_OURS = [
  'Ken Griffin', 'Citadel', 'Carnegie Mellon', 'Wynwood', 'Andreessen', 'Horowitz',
  'Hillsdale', 'Tuskegee', 'Hegseth', 'Noodle', 'Hechinger', 'Delaware',
  'Eastern Nazarene', 'Lauren Graham', 'AJA', 'Automox', 'DNSFilter', 'Strike48',
  'Adobe', 'Lindsey Feth', 'Loss',
];

// A figure a reader could be misled by: a currency symbol, a percentage, or a
// number wearing a magnitude word. Dates and verse references are numbers and
// are not figures, which is why this is written as the three shapes a CLAIM
// takes rather than as "no digits".
const FIGURE_SHAPES = [
  /[$£€]/,
  /\d\s*%|\bper cent\b|\bpercent\b/i,
  /\b\d[\d,.]*\s*(?:million|billion|trillion|thousand)\b/i,
];

describe('mgmt9 is in the course, ninth, and whole', () => {
  it('exists exactly once as the ninth lesson with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(MANAGEMENT_STEWARDSHIP_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(MANAGEMENT_STEWARDSHIP_MODULES).toHaveLength(9);
    expect(MANAGEMENT_STEWARDSHIP_MODULES[MANAGEMENT_STEWARDSHIP_MODULES.length - 1].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course ids run mgmt1 to mgmt9 with no gap and no repeat', () => {
    const numbers = MANAGEMENT_STEWARDSHIP_MODULES.map((m) => Number(/^mgmt(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('the course meta follows its own module count rather than a hand-typed number', () => {
    expect(MANAGEMENT_STEWARDSHIP_META.weeks).toBe(MANAGEMENT_STEWARDSHIP_MODULES.length);
    expect(MANAGEMENT_STEWARDSHIP_META.weeks).toBe(9);
    expect(MANAGEMENT_STEWARDSHIP_META.format).toContain('9 lessons');
  });

  it('carries the shape the course holds every lesson to', () => {
    expect(L.quiz.questions).toHaveLength(2);
    for (const q of L.quiz.questions) {
      expect(q.options).toHaveLength(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    expect(L.facilitator.talkingPoints).toHaveLength(4);
    expect(L.facilitator.discussionPrompts).toHaveLength(3);
    expect(L.facilitator.howToRun).toContain('Prayer + the anchor');
    expect(L.benefits).toHaveLength(5);
  });
});

describe('His words, read off the corpus rather than remembered', () => {
  it('every referenced span in the WHOLE module is the verse, and the sweep is not empty', () => {
    const faults = verbatimFaults(EVERY_STRING);
    expect(faults, faults.join('\n')).toEqual([]);
    // Asserted so a scan that stopped finding quotations cannot read as a pass.
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(40);
  });

  it('each spine span is the corpus text, compared against the FILE and not against the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve in the corpus`).toBeTruthy();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus text`).toBe(true);
    }
  });

  it('and the lesson actually carries each spine span, so the pins above are not decoration', () => {
    const whole = EVERY_STRING.join(' ');
    for (const [ref, span] of SPINE) {
      expect(whole.includes(span), `${ref} is pinned but the module does not quote it`).toBe(true);
      expect(whole.includes(`(${ref})`), `${ref} is quoted but never cited`).toBe(true);
    }
  });

  it('never elides inside a quotation', () => {
    for (const t of EVERY_STRING) {
      for (const m of String(t).matchAll(/"([^"]*)"/g)) {
        expect(/\.\.\.|…/.test(m[1]), `elided quotation: ${m[1].slice(0, 60)}`).toBe(false);
      }
    }
  });

  it('says Yahweh in our voice and never puts "the LORD" or a generic God into it', () => {
    const ours = (t) => String(t).replace(/"[^"]*"/g, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
    for (const t of EVERY_STRING) {
      expect(/\bthe LORD\b/.test(ours(t)), `"the LORD" in our prose: ${t.slice(0, 60)}`).toBe(false);
      expect(/\bGod\b/.test(ours(t)), `generic "God" in our prose: ${t.slice(0, 60)}`).toBe(false);
    }
    expect(L.lesson).toContain('Yahweh');
    for (const b of BANDS) expect(L.levels[b], b).toContain('Yahweh');
  });

  it('never capitalises the adversary', () => {
    for (const t of EVERY_STRING) {
      for (const w of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'Baal']) {
        expect(t.includes(w), `capitalised ${w}`).toBe(false);
      }
    }
  });

  it('prints no decision-record id where a reader can see it', () => {
    expect(recitedRecords(L)).toEqual([]);
    for (const t of EVERY_STRING) expect(t).not.toContain('1a11253cf17a2bdf');
  });
});

describe('the anchor and the lesson name each other, both directions', () => {
  it('anchor.ref holds exactly the verses the lesson stands on, in order', () => {
    expect(anchorRefs(L)).toEqual(SPINE.map(([r]) => r));
    expect(anchorRefs(L)).toHaveLength(13);
  });

  it('every anchor reference is named in the lesson text', () => {
    for (const ref of anchorRefs(L)) {
      expect(L.lesson.includes(`(${ref})`), `${ref} is anchored but never named in the lesson`).toBe(true);
    }
  });

  it('every reference the lesson cites is covered by anchor.ref, so Search it out reaches it', () => {
    const anchored = new Set(anchorRefs(L));
    const cited = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z]+(?: [A-Za-z]+)? \d+:\d+)\)/g)].map((m) => m[1]);
    expect(cited.length).toBeGreaterThanOrEqual(12);
    for (const c of new Set(cited)) expect(anchored.has(c), `${c} is cited but not anchored`).toBe(true);
  });

  it('shares no chapter with the department footing course, which the capstone rule requires', () => {
    const first = new Set(propertyPrincipleRefs().map((r) => r.split(':')[0].trim()));
    const mine = anchorRefs(L).map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => first.has(bc));
    expect(shared, `mgmt9 re-uses the footing course's passages: ${shared.join(', ')}`).toEqual([]);
    // The check is live rather than nominal: the footing course really does hold
    // the chapter this lesson had to decline for its friend prompt.
    expect(first.has('Proverbs 27'), 'the footing course no longer cites Proverbs 27 - re-pin this').toBe(true);
    expect(mine).not.toContain('Proverbs 27');
  });

  // THE CHECK THAT WOULD HAVE CAUGHT THE FIRST DRAFT, and the reason it exists.
  // The first draft stood on Exodus 31 and Exodus 35 and passed everything in
  // this file, because the two chapter checks either side of this one ask only
  // about the FOOTING course and about mgmt1-mgmt8. The department asks a wider
  // question: maintenance-trades-course.test.js requires THAT course to share no
  // book-and-chapter with any of the other four Real Estate courses, and it
  // already stands on Exodus 31 and Exodus 35 -- so the collision was mine to
  // avoid and only CI shard 4/4 could see it. A finding that leaves no gate
  // behind recurs (DR-0239), so the gate is here now, DERIVED from the catalog
  // rather than listing the sibling courses by hand.
  it('shares no chapter with ANY other Real Estate course, derived from the catalog', () => {
    const shelf = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate');
    expect(shelf.length, 'the Real Estate shelf is empty - this check is measuring nothing').toBeGreaterThanOrEqual(5);
    const others = new Set();
    for (const course of shelf) {
      let rows;
      try { rows = course.buildScheduleRows() || []; } catch { continue; }
      for (const row of rows) {
        const m = row && (row.module || row);
        if (!m || !m.id || m.id === ID) continue;
        for (const r of anchorRefs(m)) others.add(r.split(':')[0].trim());
      }
    }
    expect(others.size, 'the sibling refs are empty - this check is measuring nothing').toBeGreaterThan(40);
    const mine = anchorRefs(L).map((r) => r.split(':')[0].trim());
    const shared = mine.filter((bc) => others.has(bc));
    expect(shared, `mgmt9 re-uses a Real Estate sibling's passages: ${shared.join(', ')}`).toEqual([]);
    // PROVEN TO CATCH on the real shelf: the two chapters the first draft used
    // are genuinely held by a sibling, so this is not a rule nobody can break.
    // PROVEN TO CATCH on the real shelf: all THREE chapters the two earlier
    // drafts used are genuinely held by siblings, so this is not a rule nobody
    // can break. Exodus 31 and Exodus 35 are the maintenance course's (its
    // lesson 2 is the craftsman); Proverbs 6 is the buying course's (its lesson
    // 4 is surety). Each is asserted by name so a sibling dropping one makes
    // this check say so rather than quietly weaken.
    for (const bc of ['Exodus 31', 'Exodus 35', 'Proverbs 6']) {
      expect(others.has(bc), `a sibling no longer holds ${bc} - re-pin this`).toBe(true);
      expect(mine, `${bc} is a sibling's chapter`).not.toContain(bc);
    }
  });

  it('reuses no chapter from mgmt1 to mgmt8 either', () => {
    const earlier = new Set();
    for (const m of MANAGEMENT_STEWARDSHIP_MODULES) {
      if (m.id === ID) continue;
      for (const r of anchorRefs(m)) earlier.add(r.split(':')[0].trim());
    }
    const mine = anchorRefs(L).map((r) => r.split(':')[0].trim());
    expect(mine.filter((bc) => earlier.has(bc))).toEqual([]);
  });
});

describe('the source is said out loud, and said where the reader is', () => {
  it('names the newsletter, the day, and the one word that was the request', () => {
    expect(L.lesson).toContain('SmartBrief for the Higher Ed Leader');
    expect(L.lesson).toContain('6 October 2026');
    expect(L.lesson).toContain('Lessons');
    for (const b of BANDS) expect(L.levels[b], `${b} does not date the forward`).toMatch(/October 6, 2026|6 October 2026/);
  });

  it('carries the newsletter’s report, attributed, in every band that owes it', () => {
    for (const { claim, where } of REPORTED) {
      for (const place of where) {
        expect(TEXTS[place].includes(claim), `${place} does not carry "${claim}"`).toBe(true);
      }
    }
  });

  it('attributes the column in its ATTRIBUTIVE form, which occurs once per place', () => {
    // A bare "Mara Woody" sits in every band twice (the report and the
    // disclosure), so pinning the bare name would stay green with the
    // attribution deleted. The attributive form is where the claim is made.
    const forms = {
      adult: 'Mara Woody, who signs herself Red, Director of Strategic Partnerships at Riipen',
      youth: 'A guest column by Mara Woody. She works on partnerships at a company called Riipen.',
      teen: 'Mara Woody, who works on partnerships at a company called Riipen, wrote a guest column',
      senior: 'a single guest column by Mara Woody of Riipen',
    };
    for (const [place, form] of Object.entries(forms)) {
      expect(TEXTS[place].includes(form), `${place} lost its attributive form`).toBe(true);
      const elsewhere = PLACES.filter((p) => p !== place && TEXTS[p].includes(form));
      expect(elsewhere, `the ${place} pin also occurs in ${elsewhere.join(', ')}`).toEqual([]);
    }
  });

  it('states the reported admission PLAINLY rather than hedging it (DR-0100)', () => {
    expect(L.lesson).toContain('the employers do not really know what AI literacy is either');
    expect(L.lesson).toContain('the people demanding the standard said they do not have it');
    // And the one genuinely open thing is named narrowly, not smeared.
    expect(L.lesson).toContain('what AI literacy will come to mean is unsettled');
  });

  it('says its method out loud, because this subject invites camps (DR-0098)', () => {
    expect(L.lesson).toContain('this house does not stage camps');
    expect(L.lesson).toContain('We teach what the Word shows and stop where the Word is silent');
    for (const b of ['youth', 'teen', 'senior']) {
      expect(L.levels[b], `${b} does not refuse the both-sides posture`).toMatch(/do not pick teams|do not stage teams|stages none/);
    }
  });

  it('WHAT WAS NOT VERIFIED is on the lesson AND on all four bands, each pin unique to its place', () => {
    const pins = {
      adult: 'We did not open the full column behind its link',
      child: 'We did not read the whole story it came from',
      youth: 'We never opened the full column behind its link',
      teen: 'Nobody here opened the full column sitting behind its link',
      senior: 'The full column behind its link was never opened',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('and every place says nobody telephoned the publisher or the column’s author', () => {
    const pins = {
      adult: 'We did not telephone SmartBrief, Riipen, Ms Woody, the historian she names',
      child: 'We did not call the lady, or her school, or the news people to ask them',
      youth: 'We never rang SmartBrief, Riipen or Ms Woody to check a word of it',
      teen: 'Nobody here telephoned SmartBrief, Riipen or Ms Woody to confirm a single line of it',
      senior: 'Nobody telephoned SmartBrief, Riipen, Ms Woody, the historian she cites',
    };
    for (const [place, pin] of Object.entries(pins)) {
      const carriers = PLACES.filter((p) => TEXTS[p].includes(pin));
      expect(carriers, `"${pin}" should witness for ${place} alone`).toEqual([place]);
    }
  });

  it('refuses the other stories and the advertising a foothold anywhere in the module', () => {
    const found = [];
    for (const t of EVERY_STRING) for (const name of NOT_OURS) if (t.includes(name)) found.push(name);
    expect(found, `advertising or another story reached the teaching: ${found.join(', ')}`).toEqual([]);
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

describe('two stories, both invented, neither told as somebody’s life', () => {
  it('carries two stories and quotes the Word inside its own text', () => {
    expect(storyCount(L)).toBe(2);
    expect(quotesTheWord(L)).toBe(true);
  });

  it('both are PARABLES, so no page claims a real person lived this (DR-0811)', () => {
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    for (const s of L.stories) {
      expect(s.kind, 'a newsletter-built lesson has nobody’s life in it').not.toBe('testimony');
      expect(s.source, 'a parable must not borrow a person’s name to look true').toBeUndefined();
      expect(String(s.body).length).toBeGreaterThan(600);
    }
    expect(L.stories.map((s) => s.title)).toEqual(['Waiting for the Guidance', 'The Page in the Cupboard']);
  });

  it('both are written in the third person, not in a borrowed first person', () => {
    for (const s of L.stories) {
      expect(/\bI\b|\bmy\b|\bwe\b/.test(s.body), `${s.title} slips into the first person`).toBe(false);
    }
  });
});

describe('the four-band ladder, measured on this lesson', () => {
  it('passes every band gate the course holds its lessons to', () => {
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('each band carries its share of the adult teaching', () => {
    const f = measureFullness(L);
    expect(shortBands(f), JSON.stringify(f.bands)).toEqual([]);
    for (const b of BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('the reading ladder rises strictly and the child band is under the new-lesson ceiling', () => {
    const g = measureLesson(L).bands;
    expect(g.child.authored).toBeLessThan(g.youth.authored);
    expect(g.youth.authored).toBeLessThan(g.teen.authored);
    expect(g.teen.authored).toBeLessThan(g.senior.authored);
    expect(g.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g.teen.authored, 'the course holds a teen band at grade 6 or under').toBeLessThanOrEqual(6.0);
    expect(g.senior.authored, 'the course holds a senior band at grade 10 or under').toBeLessThanOrEqual(10.0);
  });

  it('four versions rather than one repeated, and each names its lesson in its opening', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d), JSON.stringify(d.pairs)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
    expect(unnamedBands(L)).toEqual([]);
  });

  it('introduces no hard term before its plain meaning', () => {
    const fields = { lesson: L.lesson, bigIdea: L.bigIdea, inApp: L.inApp, ...L.levels };
    for (const [k, v] of Object.entries(fields)) expect(termFaults(v), k).toEqual([]);
  });

  it('renders without losing a word in any band', () => {
    for (const place of PLACES) {
      const text = TEXTS[place];
      const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
      const lost = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
      expect(lost, `${place} lost: ${lost.slice(0, 5).join(', ')}`).toEqual([]);
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

  it('and no band opens a sentence with an ordinal the formatter reads as an explicit marker', () => {
    for (const place of PLACES) {
      expect(TEXTS[place], place).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
    }
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and each band carry parents, children and friends in the lesson’s own words', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });
});

// ===========================================================================
// PROVEN-TO-CATCH (DR-0076 section 3). Each case below was applied to the REAL
// shipped strings, run, seen to fail, and restored. A check nobody has watched
// go red is a claim, not a gate.
// ===========================================================================
describe('PROVEN-TO-CATCH: each check was watched to fail on the live text', () => {
  it('a quotation that drifted by one word is caught', () => {
    const bent = 'He wrote it. "The locusts have no ruler, yet go they forth all of them by bands;" (Proverbs 30:27).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
    expect(verbatimFaults(['He wrote it. "The locusts have no king, yet go they forth all of them by bands;" (Proverbs 30:27).'])).toEqual([]);
  });

  it('a verbatim span hung on the WRONG reference is caught', () => {
    const bent = 'He wrote it. "The locusts have no king, yet go they forth all of them by bands;" (Proverbs 30:25).';
    expect(verbatimFaults([bent]).join(' ')).toMatch(/is not the verse/);
  });

  it('a straight apostrophe where the corpus carries a typographic one IS caught', () => {
    // The fault class a sibling hit twelve times in one draft: our own prose
    // writes `organisation's` with a straight mark and the corpus writes
    // `father’s` with a typographic one, so a span copied by hand drifts in a
    // way no reader sees.
    //
    // THIS CASE WAS HOLLOW ON ITS FIRST WRITING and is recorded rather than
    // quietly fixed. It probed Exodus 31:2, which carries NO apostrophe at all,
    // so the break was guarded by `if (withStraight !== real)` and never ran --
    // a proof that proves nothing is the anti-theatre case (DR-0076 s.3). It now
    // probes Proverbs 30:28, which is in the very chapter this lesson stands on
    // and really does carry `kings’`, and the break is asserted unconditionally.
    const real = corpusText('Proverbs 30:28');
    expect(real).toBeTruthy();
    expect(real, 'the probe verse must actually carry a typographic apostrophe').toMatch(/’/);
    expect(verbatimFaults([`He said "${real}" (Proverbs 30:28).`])).toEqual([]);
    const withStraight = real.replace(/’/g, "'");
    expect(withStraight).not.toBe(real);
    expect(verbatimFaults([`He said "${withStraight}" (Proverbs 30:28).`]).join(' ')).toMatch(/is not the verse/);
    // And every span this lesson actually ships is apostrophe-free, measured
    // rather than assumed, which is why none of them could carry this fault.
    for (const [ref, span] of SPINE) expect(/['’]/.test(span), ref).toBe(false);
  });

  it('deleting the disclosure from ONE band is caught, and by that band’s name', () => {
    const pin = 'Nobody here opened the full column sitting behind its link.';
    expect(L.levels.teen).toContain(pin);
    const stripped = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(pin, '') } };
    const texts = { adult: stripped.lesson, ...Object.fromEntries(BANDS.map((b) => [b, stripped.levels[b]])) };
    const carriers = Object.keys(texts).filter((p) => texts[p].includes('Nobody here opened the full column sitting behind its link'));
    expect(carriers, 'the teen disclosure was deleted and nothing noticed').toEqual([]);
    // The pin is unique, so no other band can cover for the deletion.
    expect(PLACES.filter((p) => TEXTS[p].includes(pin))).toEqual(['teen']);
  });

  it('planting a figure in a band is caught', () => {
    const bent = `${L.levels.youth} The gift was $2 billion.`;
    const hits = FIGURE_SHAPES.filter((s) => s.test(bent));
    expect(hits.length).toBeGreaterThanOrEqual(2);
    for (const s of FIGURE_SHAPES) expect(s.test(L.levels.youth)).toBe(false);
  });

  it('planting a percentage is caught too, which a currency check alone would miss', () => {
    expect(FIGURE_SHAPES.some((s) => s.test('Only 37% of them could say so.'))).toBe(true);
    expect(FIGURE_SHAPES.some((s) => s.test('Only a third of them could say so.'))).toBe(false);
  });

  it('a sponsor or another story’s name reaching the teaching is caught', () => {
    const bent = `${L.lesson} The campus was founded by Ken Griffin.`;
    expect(NOT_OURS.filter((n) => bent.includes(n))).toEqual(['Ken Griffin']);
    expect(NOT_OURS.filter((n) => L.lesson.includes(n))).toEqual([]);
  });

  it('stripping one band’s friend line is caught by name while the module still reads whole', () => {
    const line = 'Friends, tell one friend this week one thing you learned about not waiting, and ask them what they think.';
    expect(L.levels.child).toContain(line);
    const broken = { ...L, levels: { ...L.levels, child: L.levels.child.replace(line, '') } };
    expect(hasAllThree(broken), 'the module-level gate cannot see a single band go dark').toBe(true);
    expect(placesMissingDirections(broken)).toEqual([{ place: 'child', missing: ['friends'] }]);
  });

  it('a band that loses its title opening is caught', () => {
    const broken = { ...L, levels: { ...L.levels, youth: L.levels.youth.replace('NOBODY IS COMING TO DEFINE YOUR WORK.', 'Here is an idea.') } };
    expect(unnamedBands(broken)).toEqual(['youth']);
    expect(unnamedBands(L)).toEqual([]);
  });

  it('a band shortened to a summary is caught by the share floor', () => {
    const stub = L.levels.teen.split('. ').slice(0, 4).join('. ');
    const broken = { ...L, levels: { ...L.levels, teen: stub } };
    expect(shortBands(measureFullness(broken))).toContain('teen');
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('a band copied from its sibling is caught by the overlap ceiling', () => {
    const broken = { ...L, levels: { ...L.levels, youth: L.levels.teen } };
    expect(duplicatedBands(measureDifferentiation(broken)).length).toBeGreaterThan(0);
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
  });

  it('an anchor the lesson never names is caught', () => {
    const broken = { ...L, anchor: { ...L.anchor, ref: `${L.anchor.ref}; Job 1:6` } };
    const unnamed = anchorRefs(broken).filter((r) => !broken.lesson.includes(`(${r})`));
    expect(unnamed).toEqual(['Job 1:6']);
    expect(anchorRefs(L).filter((r) => !L.lesson.includes(`(${r})`))).toEqual([]);
  });

  it('a chapter borrowed back from the footing course is caught', () => {
    const first = new Set(propertyPrincipleRefs().map((r) => r.split(':')[0].trim()));
    const pretend = ['Proverbs 30:27', 'Proverbs 27:17'].map((r) => r.split(':')[0].trim());
    expect(pretend.filter((bc) => first.has(bc))).toEqual(['Proverbs 27']);
  });

  it('a generic God or "the LORD" drifting into our own prose is caught', () => {
    const ours = (t) => String(t).replace(/"[^"]*"/g, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
    expect(/\bGod\b/.test(ours('We teach that God requires faithfulness.'))).toBe(true);
    expect(/\bGod\b/.test(ours('The Word says "Thy word is a lamp unto my feet" (Psalms 119:105), and God is not in our prose there.'))).toBe(true);
    expect(/\bthe LORD\b/.test(ours('The men were those "in whom the LORD put wisdom and understanding" (Exodus 36:1).'))).toBe(false);
  });

  it('a testimony label on an invented story is caught', () => {
    const broken = { ...L, stories: [{ ...L.stories[0], kind: 'testimony' }, L.stories[1]] };
    expect(broken.stories.map((s) => s.kind)).not.toEqual(['parable', 'parable']);
    expect(broken.stories.some((s) => s.kind === 'testimony' && !s.source)).toBe(true);
  });

  it('a lesson short of its second story is caught', () => {
    expect(storyCount({ ...L, stories: [L.stories[0]] })).toBeLessThan(2);
  });

  it('the senior band’s own elder-direction wording really does count', () => {
    expect(missingDirections(L.levels.senior)).toEqual([]);
  });
});

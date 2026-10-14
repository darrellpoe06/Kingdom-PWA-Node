// @vitest-environment node
// =============================================================================
// L79 — A Gospel With a Hole In It (DR-1025)
// =============================================================================
// This lesson was a HOLE before it was a lesson. Living Lessons claimed 1-238
// and never claimed 79; the gap sat silent from 2026-08-14 until the gap check
// in living-lessons-numbers-are-unique.test.js went looking on 2026-10-13. The
// text meant to fill it was sitting in PR #1255, on a branch whose catalog held
// 81 modules against main's 238 — so the file could never be merged, only the
// module mined out of it, which is what this is.
//
// PROVENANCE, AND THE REGISTER IT IS CARRIED AT. A video teaching by Dr. Manny
// Scott, answering a clip on evangelicalism and race and relaying his mentor
// Dr. Bruce Fields. What reached this house was a transcription with a summary
// — never the video — so the lesson says so in its own first movement in every
// band. The experience is theirs; the Scripture work is ours.
//
// THE SEVEN THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. STAGING THE DEBATE. A lesson on this subject that lines up two camps and
//      invites the reader to pick is the both-sides-for-ratings posture the
//      house exists to remove. So every band must establish the pairing of
//      justice and righteousness from the TEXT — Amos 5:24, Proverbs 21:3,
//      Jeremiah 22:16 — rather than from anybody's framework, and must say out
//      loud that no outside framework was needed.
//   2. DROPPING THE DISSENT. The teaching's conclusion about multi-ethnic
//      churches is NOT what this house holds, and burying that would be a
//      different dishonesty than overstating it. Every band carries the
//      dissent, answered from Ephesians 2:14, Galatians 3:28 and Revelation
//      7:9, while granting the injury as real and naming it sin.
//   3. INVERTING THE ORDER. Works-righteousness is the opposite error and is
//      one verse away: Ephesians 2:8-9 states the priority and 2:10 the telos.
//      Every band must guard the order rather than only press the doing.
//   4. ONE COUNTERFEIT NAMED AND NOT THE OTHER. Hollow orthodoxy and
//      performed justice are both counterfeits — Micah 3:11 and Matthew 6:2 —
//      and a lesson that named only the first would flatter the room.
//   5. SILENCE TREATED AS NEUTRAL. Four men who said nothing is the hardest
//      case in the lesson, and Scripture has no category for committing
//      nothing: Proverbs 31:8-9 commands an open mouth, 1 Corinthians 12:26
//      describes a body that cannot not-feel, 1 John 3:17-18 shuts the exit
//      where feeling bad counts as having done something.
//   6. A LESSON ABOUT OTHER PEOPLE. Acts 6 is the model because the remedy was
//      redistribution of authority to the neglected group, not separation —
//      and every name chosen was Greek. Every band must carry what the
//      apostles DID, not only what they felt.
//   7. CITING OUR OWN BOOKKEEPING AT A READER. The first assembled draft
//      printed "DR-0076 §8" and "DR-0098" into the lesson and the senior band.
//      The rules were right; the record ids are ours, and a reader has no idea
//      what they are.
//
// WHAT THE GATES CAUGHT ON THE WAY IN, WHICH IS THE POINT OF HAVING THEM.
// Sixteen defects, every one of them inherited from the mined text or made by
// this assembly, none of them visible by reading:
//
//   · NINE ELIDED QUOTATIONS in reader-facing fields and SIX more in the
//     benefits, the quiz and the facilitator's notes — spans with "..." in
//     them, which DR-0459 forbids. Every one had a CONTIGUOUS verbatim span
//     available, usually by quoting a little MORE of the verse: Acts 6:5's
//     "a man full of faith and of the Holy Ghost", Galatians 3:28's "neither
//     male nor female", Leviticus 25:10's "it shall be a jubile unto you" —
//     which is the clause the surrounding prose was already asserting.
//   · SIX RECITED RECORD IDS, per defect 7 above.
//   · FOUR BANDS THAT NEVER NAMED THEIR OWN LESSON. Every band opened on
//     "ONE. WHERE THIS CAME FROM." and the title appeared nowhere in the
//     opening window, so a reader inside the narrative had nothing telling him
//     what he was in (Darrell 2026-09-17). All four now open on the title in
//     their own register.
//   · A PERIOD INSIDE GALATIANS 2:14, three times. The verse continues with a
//     comma; "the truth of the gospel." is not His punctuation.
//   · OUR CAPS EMPHASIS INSIDE HIS WORDS, twice — Ephesians 2:10 quoted as
//     "created in Christ Jesus UNTO good works" and 1 John 3:7 as "he that
//     DOETH". His text does not shout those. The emphasis moved OUT of the
//     quotation marks and the verses are quoted as written.
//   · THE HOST SENTENCE'S COMMA INSIDE ACTS 6:1, in the facilitator's run
//     sheet — caught by living-lessons-quoted-terminal.test.js, a ratchet this
//     file had not thought about, on a span the facilitator reads ALOUD.
//
// AND THREE CHECKS KEYED ON THE OPEN HOLE AS THEIR EVIDENCE, two of them
// DISARMED by this lesson arriving. living-lessons-order and
// continue-a-lesson-numbers both pinned "L192 sits at position 191" to prove
// that a lesson's number is its own and never its position — and filling 79
// moved every later lesson up one, so L192's position became exactly 192 and
// the defect those tests exist to catch went invisible at their own worked
// example. the-lesson-count-is-derived asserted the gap list contains 79. All
// three now find their example instead of pinning it. A check whose evidence
// can expire stops meaning something while still printing green.
//
// WHY THE EXPLICIT MOVEMENT MARKERS STAY. Every band is marked ONE. through
// TWELVE., which is the opposite of what sov39's gate demands of itself. The
// reason is lesson-format.js: explicit markers win outright and switch the
// caps-lead heading pass OFF entirely. This lesson uses ALL-CAPS for in-text
// emphasis in dozens of places (GOSPEL, BEFORE MEN, OPEN THY MOUTH), and with
// the caps pass live every one of them is a candidate heading. Removing the
// markers here would not tidy the lesson; it would shred it. So the markers are
// load-bearing and the check below pins them rather than forbidding them.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords, corpusText } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText, lessonShareText } from '../lib/lesson-format.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';
import quotationIntegrity from '../lib/quotation-integrity-baseline.json';
import bandDiff from '../lib/band-differentiation-baseline.json';

const ID = 'll79-justice-and-righteousness-travel-together';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  let k = String(book).replace(/\s+/g, '');
  if (/^Psalm$/i.test(k)) k = 'Psalms';
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const r = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) { for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i); } else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : norm(parts.join(' '));
};
const SPAN_WITH_REF = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};

// Our own phrases and the lesson's reported speech, which legitimately wear
// quotation marks without a verse reference. Enumerated rather than waved at,
// so that a MANGLED verse quoted without its reference cannot hide among them:
// the check below allows a quoted span only if it is verbatim KJV or is on this
// list, and every entry here was read before it was added.
const OUR_OWN_QUOTED = new Set([
  'A gospel with a hole in it',
  'A whole gospel, not a gospel with a hole in it',
  'I hope you get warm and get food!',
  'a gospel with a hole in it',
  'a gospel with a hole in it,',
  'did he mean well',
  'faith is private',
  'here are two sides, you pick one',
  'sincere but incomplete',
  'stop complaining.',
  'this keeps happening, not just once,',
  'we all love each other, so it is fine.',
  'whole gospel',
  'you are being divisive',
  'you are being divisive.',
  'you pick',
]);

// Twelve movements, in the same order, in every band — MEASURED. The band that
// was spliced wrong is the reason this is pinned per place instead of once: the
// child band first assembled as 1, 2, 5, 3, 4 because an inserted movement lost
// its leading blank line and glued itself onto the tail of another.
const MOVEMENTS = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.', 'ELEVEN.', 'TWELVE.'];

// The twenty-two things this lesson must TEACH, each read from OUR prose with
// the quotations stripped out — because the first draft of two of these checks
// was satisfied by the verse quotation itself, which proves nothing about
// whether the lesson taught anything.
const ALL_QUOTED = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_QUOTED, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

const CLAIMS = [
  ['the provenance is stated as a summary, not the teaching itself', /transcription|written notes|somebody.s written notes|summary/i],
  ['the experience is theirs and the Scripture work is ours', /experience is theirs|part that is theirs|looking it all up/i],
  ['the pairing is claimed from the text rather than from a framework', /lexical|side by side|keep showing up|paired|pairing/i],
  ['being fair is ranked above the offering', /ranked above|more acceptable than|above the offering|than an offering|than sacrifice/i],
  ['helping the poor is how the king was known', /how you could tell|part of knowing|was how .*knew|evidence that he knew|to know me/i],
  ['the hole is His own phrase and not a modern one', /His own phrase|Jesus talking|the teacher used a phrase|his own words/i],
  ['the weightier matters were omitted rather than failed', /omit|left (?:the other )?undone|skipping|skipped the big|not an error/i],
  ['and both were required rather than traded', /not to leave|TRADING|both|not get to pick/i],
  ['the apostles moved the machinery rather than preached about it', /moved the machinery|what the (?:leaders|apostles) (?:really )?did|handed it|redistribut|put the .*in charge/i],
  ['the neglected group received the authority', /neglected|skipped people|the exact group|getting skipped/i],
  ['every name chosen was Greek', /GREEK|Greek/],
  ['favoritism is named as sin rather than as a style', /sin|respect of persons|favouritism|favoritism|treating some people better/i],
  ['silence is not filed as neutral', /not neutral|committing nothing|said nothing|stayed quiet|did not say/i],
  ['a body cannot have one member suffering alone', /whole self says|suffer(?:s|ing)? (?:by|alone)|stub your toe|something is wrong with the body/i],
  ['feeling bad is shut out as a substitute for doing', /feel bad|not in word|in deed|deed and in truth|made (?:entirely )?of statements/i],
  ['the dissent is stated plainly rather than buried', /we do not just agree|holds something else|does not just agree|dissent|this house holds/i],
  ['and the injury is granted as real and named sin', /is REAL|really happened|real and is sin|sad things really happened|the failure is real/i],
  ['the wall came down rather than up', /knocked down|broken down|came down|not built/i],
  ['the ending already shows every nation together', /every kind of person|every nation|all nations|multitude|no man could number/i],
  ['the order is guarded: saved first, then the doing', /in that order|order|priority|not .*to make Yahweh love you|not of works/i],
  ['both counterfeits are named, not only the comfortable one', /both|other kind|cover for taking|two counterfeits|counterfeits/i],
  ['the labels are answered by showing the lesson’s own sources', /Amos|all Bible|every claim|stands on/i],
];

describe('L79 — the hole that was a number before it was a lesson', () => {
  it('is mounted, and the painted week count moved with it', () => {
    expect(L, `${ID} is not in the series`).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('claims 79, and no other module claims it', () => {
    const n = (id) => { const m = String(id).match(/^ll(\d+)-/); return m ? Number(m[1]) : null; };
    expect(n(L.id)).toBe(79);
    for (const m of LIVING_LESSONS_MODULES) {
      if (m.id === L.id) continue;
      expect(n(m.id), `${m.id} also claims 79`).not.toBe(79);
    }
  });

  it('sits between 78 and 80 rather than on the end of the file', () => {
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id).toMatch(/^ll78-/);
    expect(LIVING_LESSONS_MODULES[at + 1].id).toMatch(/^ll80-/);
  });

  it('carries all four age bands', () => {
    for (const b of BANDS) expect(String(L.levels[b] || '').trim().length, `${b} is empty`).toBeGreaterThan(400);
  });

  it('has no band below the coverage floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('adds no entry to the coverage debt', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
  });

  it('adds no entry to the reading-level debt', () => {
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
  });

  it('adds no entry to the title-in-narrative debt', () => {
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
  });

  it('adds no entry to the quotation debt', () => {
    expect(Object.keys(quotationIntegrity.elided)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.recited)).not.toContain(ID);
  });

  it('runs a reading ladder that never inverts', () => {
    // Held to the ladder the GATE holds, which rounds to a tenth of a grade.
    // Youth and teen measure 6.2 together here and that is a measured tie, not
    // a step: writing a strict youth < teen assertion would make 0.05 of a
    // grade level mean something it does not, and the two bands differ by
    // CONTENT (differentiation 0.16) rather than by difficulty. The real
    // claims are that child sits well below both and senior well above.
    expect(isInverted(measureLesson(L)), 'the ladder inverts').toBe(false);
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('youth'), 'youth does not read above child').toBeGreaterThan(g('child') + 1);
    expect(g('senior'), 'senior does not read above teen').toBeGreaterThan(g('teen') + 1);
  });

  it('keeps the child band under the ceiling a NEW lesson is held to', () => {
    expect(fleschKincaidGrade(ourProseOnly(L.levels.child))).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('opens every band on the name of its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('would still catch a band that stopped naming its lesson (proven-to-catch)', () => {
    // All four bands failed this when the module was first assembled, and the
    // failure is invisible by reading: the band looks fine, it just never tells
    // the reader which lesson he is in.
    const stripped = { ...L, levels: { ...L.levels, teen: L.levels.teen.replace(/^[\s\S]*?(?=ONE\. WHERE)/, '') } };
    expect(stripped.levels.teen).not.toBe(L.levels.teen);
    expect(unnamedBands(stripped)).toEqual(['teen']);
  });

  it('writes four DIFFERENT bands rather than one repeated four times', () => {
    const m = measureDifferentiation(L);
    expect(m, 'the lesson is not being measured at all').toBeTruthy();
    expect(m.worst, `bands too alike: ${JSON.stringify(m.pairs)}`).toBeLessThan(DIFF_CEILING);
    expect(Object.keys(bandDiff.duplicated)).not.toContain(ID);
  });

  it('carries the authored furniture a lesson is read and run from', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(14);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(7);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(13);
    expect(typeof L.facilitator.howToRun).toBe('string');
    expect(L.facilitator.howToRun.length).toBeGreaterThan(200);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length, `${q.q.slice(0, 40)} does not offer three options`).toBe(3);
      expect(q.options[q.answer], 'the answer index points at nothing').toBeTruthy();
    }
  });

  it('carries at least two stories, as every other Living Lesson does', () => {
    // It arrived with none. The other 238 modules all carry two or more, and a
    // lesson whose whole subject is a neglected group needed the light one and
    // the solemn one rather than an argument alone.
    expect(L.stories.length).toBeGreaterThanOrEqual(2);
    expect(new Set(L.stories.map((s) => s.tone)).size, 'both stories carry the same tone').toBeGreaterThan(1);
    for (const s of L.stories) expect(s.body.split(/\s+/).length, `${s.title} is too short to be a story`).toBeGreaterThan(150);
  });
});

describe('L79 — twelve movements, in the same order, everywhere', () => {
  it('renders twelve headings in every band and in the lesson', () => {
    for (const k of ALL) {
      expect(formatLessonText(TEXTS[k]).sectionCount, `${k} does not render twelve movements`).toBe(12);
    }
  });

  it('numbers them ONE to TWELVE in order, with none repeated', () => {
    for (const k of ALL) {
      const heads = formatLessonText(TEXTS[k]).items.filter((i) => i.kind === 'heading').map((i) => i.text);
      expect(heads.map((h) => h.split(' ')[0]), `${k} movements are out of order`).toEqual(MOVEMENTS);
    }
  });

  it('keeps the explicit markers that switch the caps-heading pass off', () => {
    // The inverse of sov39's own check, and deliberately so: see the note at
    // the head of this file. Remove the markers and every ALL-CAPS emphasis in
    // the lesson becomes a candidate heading.
    for (const k of ALL) {
      expect(TEXTS[k], `${k} lost its explicit movement markers`).toMatch(/(?:^|\n\n)ONE\.\s+[A-Z]/);
    }
  });

  it('would still catch the movements landing out of order (proven-to-catch)', () => {
    // The actual defect, reproduced. The child band first assembled as
    // 1, 2, 5, 3, 4 because an inserted movement lost its leading blank line
    // and glued onto the tail of the paragraph before it. Note what the COUNT
    // check does NOT catch: the renderer finds a marker mid-paragraph, so the
    // glued band still renders twelve headings and only the ORDER betrays it.
    // That is why both checks exist and why this one reproduces the order.
    const swapped = TEXTS.child
      .replace('\n\nTHREE.', '\n\n@@T3@@').replace('\n\nFIVE.', '\n\nTHREE.').replace('\n\n@@T3@@', '\n\nFIVE.');
    expect(swapped).not.toBe(TEXTS.child);
    const heads = formatLessonText(swapped).items.filter((i) => i.kind === 'heading').map((i) => i.text.split(' ')[0]);
    expect(heads).not.toEqual(MOVEMENTS);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });

  it('shares each band with its sections numbered and every word kept', () => {
    for (const k of ALL) {
      const share = lessonShareText(TEXTS[k]);
      expect(share, `${k} share text does not number its sections`).toMatch(/^1\. /m);
      expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim(), `${k} share text lost words`)
        .toBe(String(TEXTS[k]).replace(/\s+/g, ' ').trim());
    }
  });
});

describe('L79 — His words, exactly as He said them', () => {
  it('quotes every referenced span in the WHOLE module verbatim, not only the reader texts', () => {
    const bad = [];
    let pairs = 0;
    walkStrings(L, '', (node, path) => {
      SPAN_WITH_REF.lastIndex = 0; let g;
      while ((g = SPAN_WITH_REF.exec(node))) {
        pairs += 1;
        const verse = versesOf(g[2], g[3], g[4].trim());
        const ref = `${g[2]} ${g[3]}:${g[4].trim()}`;
        if (verse == null) { bad.push(`${path}: ${ref} does not resolve`); continue; }
        if (!verse.includes(norm(g[1]))) bad.push(`${path}: ${ref} — ${g[1].slice(0, 70)}`);
      }
    });
    expect(pairs, 'the walk is not reaching the lesson').toBeGreaterThan(200); // 248 on 2026-10-14
    expect(bad, `spans that are not His words, anywhere in the module:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the walk still catches the two drifts this assembly made (proven-to-catch)', () => {
    // Both were OUR emphasis pushed inside His quotation marks, which reads as
    // faithful and is not. The verses say neither word in capitals.
    const DRIFTS = [
      ['created in Christ Jesus UNTO good works', 'Ephesians', 2, '10'],
      ['he that DOETH righteousness is righteous', '1 John', 3, '7'],
      ['they walked not uprightly according to the truth of the gospel.', 'Galatians', 2, '14'],
    ];
    for (const [wrong, book, ch, vs] of DRIFTS) {
      const real = versesOf(book, ch, vs);
      expect(real, `${book} ${ch}:${vs} does not resolve`).toBeTruthy();
      expect(real.includes(norm(wrong)), `the walk would have passed ${book} ${ch}:${vs}`).toBe(false);
    }
    expect(L.levels.senior).toContain('created in Christ Jesus unto good works');
    expect(L.facilitator.talkingPoints.join(' ')).toContain('he that doeth righteousness is righteous');
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
    });
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('adds nothing to either quotation-integrity class', () => {
    const corpus = corpusText();
    expect(elidedQuotations(L, corpus)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('prints no record identifier at a reader, in any field of the module', () => {
    // Wider than the gate, which scopes the check to reader fields because a
    // record id is not noise to a facilitator. This lesson holds itself to the
    // whole module: if the id is not needed to teach, it is not needed at all.
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const id of node.match(/DR-\d{4}/g) || []) found.push(`${path}: ${id}`);
    });
    expect(found, `record ids printed in the lesson:\n${found.join('\n')}`).toEqual([]);
  });

  it('lets no quoted span be neither His words nor a named phrase of ours', () => {
    // The real danger an unreferenced quotation hides is a MANGLED verse. So
    // every quoted span without a reference must be verbatim KJV or be on the
    // enumerated list of our own phrases above — and the list was read, not
    // generated, which is what makes it a check rather than a rubber stamp.
    const corpus = corpusText();
    const bad = [];
    walkStrings(L, '', (node, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(node))) {
        if (m[2]) continue;
        const q = norm(m[1]);
        if (OUR_OWN_QUOTED.has(q)) continue;
        if (corpus.includes(q.replace(/^[,;:]+|[,;:]+$/g, ''))) continue;
        bad.push(`${path}: ${q.slice(0, 80)}`);
      }
    });
    expect(bad, `quoted spans that are neither His nor ours:\n${bad.join('\n')}`).toEqual([]);
  });
});

describe('L79 — what the lesson must actually teach', () => {
  for (const [name, re] of CLAIMS) {
    it(`teaches, in every band, that ${name}`, () => {
      const missing = ALL.filter((k) => !re.test(OURS[k]));
      expect(missing, `${name} is missing from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('reads the claims from our prose and not from the quotations (proven-to-catch)', () => {
    // Two of these checks passed on their first draft because the VERSE
    // contained the words, which proves nothing about whether the lesson
    // taught anything. Stripping the quotations is what makes them real.
    for (const k of ALL) {
      expect(OURS[k].length, `${k} has no prose of its own`).toBeGreaterThan(2000);
      expect(OURS[k], `${k} prose still carries a quotation`).not.toMatch(/"/);
    }
  });

  it('gives all three directions for talking it over, in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('names the house it is taught in and the dissent it holds', () => {
    for (const k of ALL) {
      expect(TEXTS[k], `${k} does not name the first community`).toMatch(/Church of the Living God|COLG/);
    }
  });
});

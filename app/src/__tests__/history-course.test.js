// @vitest-environment node
// =============================================================================
// HISTORICAL TRUTH — course one of the History department
// =============================================================================
// Darrell, 2026-09-22: "We need history to reflect actual history!!!!! Courses
// on Historical Truth Light from Yahweh's perspectives explicitly and
// comprehensive summary... American Historical accuracy from the beginning...
// least of these and fatherless and widows narratives... two or more gather
// together there He will be in the midst..." Then: "Build the History
// department." Measured before it was built: the school had ten departments
// and no History department, and no course in the catalog taught American
// history at all. This is the department's first course, and this file is what
// keeps it honest.
//
// WHAT THIS COURSE COULD MOST EASILY HAVE GOT WRONG, and what holds each one:
//
//   1. A HISTORY COURSE WITH A VERSE ON TOP. The arc is one argument in eight
//      moves — the standard, the measure, the land, the labour, the law, the
//      least, the person, the witnesses — and the order is pinned, because a
//      shuffled arc is a set of grievances rather than a way of reading.
//   2. SCRIPTURE FROM MEMORY. Every quoted span in the WHOLE module tree is
//      walked against the repo's own KJV, not only the reader texts.
//   3. "THE LORD" DRIFTING INTO OUR OWN VOICE. DR-0210's bright line runs both
//      ways: our prose says Yahweh; quoted Scripture is left as the KJV has it.
//   4. A BANDLESS LESSON. Every lesson carries teen and senior from the first
//      commit, measured on the ladder, the fullness floor and the overlap
//      ceiling (DR-0497).
//   5. BOTH-SIDES THEATRE. DR-0098 forbids staging schools of opinion for the
//      reader to pick from; DR-0100 forbids smearing "contested" over what is
//      documented. The dated facts are pinned as stated, and the ONE number
//      the course calls unsettled (the Tulsa dead) is pinned as unsettled —
//      narrowly, beside the destruction that is stated as documented.
//   6. HIS OWN WORD LANDING WHERE HE ASKED. Matthew 18:20 — "there am I in the
//      midst of them" — is pinned to lesson eight, and the fatherless, the
//      widow and the stranger to lesson two, because those were his words.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  HISTORY_MODULES, HISTORY_META, HISTORY_SESSION_FLOW, HISTORY_CARE_NOTE, HISTORY_TUTOR_META,
  buildHistorySchedule, historyProgressSummary, exportHistoryCurriculumMarkdown, historyRefs,
} from '../lib/history-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { COURSE_CROSS_LISTINGS, coursesWithNoShelfDeclaration } from '../lib/learn-crosslist.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

function elidedSpans(text) {
  const out = [];
  for (const m of String(text).matchAll(/"([^"]*)"/g)) {
    if (/\.\.\.|…/.test(m[1])) out.push(m[1]);
  }
  return out;
}

const M = HISTORY_MODULES;
const TEEN_CEILING = 6.0;
const SENIOR_CEILING = 10.0;
const FULL_FLOOR = 0.6;
const NEAR_COPY = 0.25;

const fk = (t) => fleschKincaidGrade(ourProseOnly(String(t || '')));
const words = (t) => (ourProseOnly(String(t || '')).match(/[A-Za-z’']+/g) || []).length;
const overlapOf = (a, b) => overlap(shingles(ourProseOnly(a)), shingles(ourProseOnly(b)));

// --- the repo's own KJV, read from disk -------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i); else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const norm = (s) => String(s).replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansWithRef = (text) => {
  const out = []; SPAN_WITH_REF.lastIndex = 0; let m;
  while ((m = SPAN_WITH_REF.exec(text))) out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  return out;
};
const quotationFaults = (text) => {
  const out = [];
  for (const sp of spansWithRef(String(text || ''))) {
    const real = versesOf(sp.book, sp.ch, sp.vs);
    if (!real) { out.push(`cannot load ${sp.book} ${sp.ch}:${sp.vs}`); continue; }
    if (!norm(real).toLowerCase().includes(norm(sp.quote).toLowerCase())) {
      out.push(`NOT VERBATIM "${sp.quote}" vs ${sp.book} ${sp.ch}:${sp.vs} — ${norm(real)}`);
    }
  }
  return out;
};
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text || '').replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');
const allText = () => { const out = []; for (const m of M) walkStrings(m, m.id, (t) => out.push(t)); return out.join('\n'); };

describe('the course exists, and it is shaped like a course', () => {
  it('carries eight lessons in the order the argument runs', () => {
    expect(M.map((m) => m.id)).toEqual([
      'hist1-the-standard-before-the-story',
      'hist2-the-fatherless-the-widow-and-the-stranger',
      'hist3-the-landmark-and-the-vineyard',
      'hist4-the-wage-that-could-not-wait',
      'hist5-two-weights-in-one-bag',
      'hist6-the-fields-of-the-fatherless',
      'hist7-no-respecter-of-persons',
      'hist8-two-or-three-witnesses',
    ]);
    expect(HISTORY_META.weeks).toBe(M.length);
  });

  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(words(m.bigIdea), `${m.id} bigIdea`).toBeGreaterThan(40);
      expect(words(m.inApp), `${m.id} inApp`).toBeGreaterThan(20);
      expect(m.anchor.ref, `${m.id} anchor ref`).toBeTruthy();
      expect(words(m.anchor.theme), `${m.id} anchor theme`).toBeGreaterThan(15);
      expect(words(m.lesson), `${m.id} lesson`).toBeGreaterThan(200);
      expect(m.stories.length, `${m.id} stories`).toBe(2);
      expect(m.benefits.length, `${m.id} benefits`).toBe(5);
      expect(m.quiz.questions.length, `${m.id} quiz`).toBe(2);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBe(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(words(q.explain), `${m.id} explain`).toBeGreaterThan(10);
      }
      expect(m.facilitator.talkingPoints.length, `${m.id} talking points`).toBe(4);
      expect(m.facilitator.discussionPrompts.length, `${m.id} prompts`).toBe(3);
      expect(m.facilitator.howToRun, `${m.id} howToRun`).toContain('Prayer + the anchor');
    }
  });

  it('states its limit on the meta, where every surface renders it', () => {
    expect(HISTORY_META.care).toBe(HISTORY_CARE_NOTE);
    expect(HISTORY_CARE_NOTE).toMatch(/not a substitute for the record/i);
    expect(HISTORY_CARE_NOTE).toMatch(/you are meant to check it/);
    expect(HISTORY_TUTOR_META.posture).toMatch(/[Nn]ever invent a date/);
    expect(HISTORY_TUTOR_META.posture).toMatch(/never stage two schools/);
  });

  it('opens Word-first, under His frame rather than any nation’s frame', () => {
    const wf = HISTORY_META.wordFirst;
    expect(wf.ref).toContain('Psalms 119:160');
    expect(quotationFaults('"Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever" (Psalms 119:160)')).toEqual([]);
    expect(wf.frame).toContain('Thy word is true from the beginning');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(HISTORY_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, not only the reader texts', () => {
    const bad = []; let spans = 0;
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        spans += spansWithRef(text).length;
        for (const f of quotationFaults(text)) bad.push(`${path}: ${f}`);
      });
    }
    expect(bad, bad.join('\n')).toEqual([]);
    expect(spans, 'the walk found no quotations at all — it is measuring nothing').toBeGreaterThan(90);
  });

  it('never elides inside a quotation (DR-0459)', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        expect(elidedSpans(text), `${path} elided a quotation`).toEqual([]);
      });
    }
    expect(elidedSpans('x "a ... b" y').length, 'a real elision passed').toBe(1);
    expect(elidedSpans('x "a … b" y').length, 'a unicode elision passed').toBe(1);
    expect(elidedSpans('he said "a" and then... then "b"'), 'our own prose was flagged').toEqual([]);
  });

  it('says Yahweh in OUR voice and leaves "the LORD" exactly where the KJV has it', () => {
    const stray = [];
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        if (/\bthe LORD\b/.test(ours(text))) stray.push(`${path}: "the LORD" in our own prose`);
      });
    }
    expect(stray, stray.join('\n')).toEqual([]);
    const quoted = M.map((m) => m.lesson).join(' ');
    expect(quoted).toContain('the LORD thy God giveth thee');
    for (const m of M) expect(m.lesson, `${m.id} names Him`).toContain('Yahweh');
  });

  it('never capitalises the adversary', () => {
    for (const m of M) {
      walkStrings(m, m.id, (text, path) => {
        for (const w of ['Satan', 'Lucifer', 'The Devil', 'The Adversary']) {
          expect(text.includes(w), `${path} capitalised ${w}`).toBe(false);
        }
      });
    }
  });
});

describe('two bands from the first commit, measured', () => {
  for (const m of M) {
    it(`${m.id}: the ladder, the floor and the ceiling all hold`, () => {
      const t = fk(m.levels.teen); const s = fk(m.levels.senior);
      expect(t, `teen ${t} does not read easier than senior ${s}`).toBeLessThan(s);
      expect(t, `teen grade ${t}`).toBeLessThanOrEqual(TEEN_CEILING);
      expect(s, `senior grade ${s}`).toBeLessThanOrEqual(SENIOR_CEILING);
      for (const band of ['teen', 'senior']) {
        const share = words(m.levels[band]) / words(m.lesson);
        expect(share, `${band} carries only ${share.toFixed(2)} of the adult text`).toBeGreaterThanOrEqual(FULL_FLOOR);
      }
      expect(NEAR_COPY).toBeLessThan(DIFF_CEILING);
      expect(overlapOf(m.levels.teen, m.levels.senior), 'teen~senior').toBeLessThanOrEqual(NEAR_COPY);
      expect(overlapOf(m.levels.teen, m.lesson), 'teen~adult').toBeLessThanOrEqual(NEAR_COPY);
      expect(overlapOf(m.levels.senior, m.lesson), 'senior~adult').toBeLessThanOrEqual(NEAR_COPY);
    });
  }

  it('renders both bands without losing a word (the L178 defect class)', () => {
    for (const m of M) {
      for (const band of ['teen', 'senior']) {
        const text = m.levels[band];
        const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
        const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
      }
    }
  });
});

describe('the eight moves each teach their own thing — and his words land where he put them', () => {
  it('lesson 1 sets the standard outside every telling and the chain that keeps the record', () => {
    expect(M[0].lesson).toContain('Thy word is true from the beginning');
    expect(M[0].lesson).toContain('ask thy father, and he will shew thee');
    expect(M[0].lesson).toMatch(/1619/);
  });

  it('lesson 2 carries the fatherless, the widow and the stranger, and the least of these', () => {
    const l = M[1];
    expect(l.title).toBe('The fatherless, the widow and the stranger');
    expect(l.lesson).toContain('He doth execute the judgment of the fatherless and widow, and loveth the stranger');
    expect(l.lesson).toContain('Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me');
    expect(l.lesson).toMatch(/Indian Removal Act/);
    expect(l.lesson).toMatch(/1830/);
  });

  it('lesson 3 is the Naboth test laid beside New Echota and the Dawes Act, with dates', () => {
    const l = M[2];
    expect(l.lesson).toContain('Hast thou killed, and also taken possession?');
    expect(l.lesson).toMatch(/New Echota/);
    expect(l.lesson).toMatch(/1835/);
    expect(l.lesson).toMatch(/Dawes Act of 1887/);
    expect(l.lesson).toMatch(/138 million/);
    expect(l.lesson).toMatch(/48 million/);
    // and it refuses the cheap conclusion in both directions
    expect(l.lesson).toMatch(/does not say that every transfer/);
  });

  it('lesson 4 puts the three laws first and the exact inversion of 1850 beside Deuteronomy 23:15', () => {
    const l = M[3];
    expect(l.lesson).toContain('shall not abide with thee all night until the morning');
    expect(l.lesson).toContain('he shall surely be put to death');
    expect(l.lesson).toContain('Thou shalt not deliver unto his master the servant which is escaped from his master unto thee');
    expect(l.lesson).toMatch(/Fugitive Slave Act/);
    expect(l.lesson).toMatch(/3,953,760/);
    expect(l.lesson).toMatch(/Juneteenth/);
    expect(l.lesson).toMatch(/except as a punishment for crime/);
    // the Word explains the Word, no debate staged
    expect(l.lesson).toContain('menstealers');
  });

  it('lesson 5 names two weights in one bag and dates both the weights and their removal', () => {
    const l = M[4];
    expect(l.lesson).toContain('Thou shalt not have in thy bag divers weights, a great and a small');
    expect(l.lesson).toContain('Woe unto them that decree unrighteous decrees');
    for (const y of ['1787', '1857', '1896', '1954', '1964', '1965', '1968']) expect(l.lesson, `year ${y}`).toContain(y);
    expect(l.lesson).toMatch(/Plessy/);
    expect(l.lesson).toMatch(/Brown v\. Board/);
    expect(l.lesson).toMatch(/remedy for two weights is one weight/);
  });

  it('lesson 6 states Greenwood’s destruction as documented and ONLY the count as unsettled (DR-0100)', () => {
    const l = M[5];
    expect(l.lesson).toContain('their redeemer is mighty');
    expect(l.lesson).toMatch(/destruction is documented beyond question/);
    expect(l.lesson).toMatch(/count of the dead is genuinely unsettled/);
    expect(l.lesson).toMatch(/Special Field Order No\. 15/);
    expect(l.lesson).toMatch(/Freedmen’s Bureau operated from 1865 to 1872/);
    // the gleaners' half is insisted on
    expect(l.lesson).toMatch(/the gleaners went into the fields/);
  });

  it('lesson 7 traces the founders’ sentence to the Word and lets the standard judge the nation', () => {
    const l = M[6];
    expect(l.lesson).toContain('God is no respecter of persons');
    expect(l.lesson).toContain('hath made of one blood all nations of men');
    expect(l.lesson).toMatch(/1776/);
    expect(l.lesson).toMatch(/Douglass/);
    expect(l.lesson).toMatch(/1852/);
    expect(l.lesson).toContain('if ye have respect to persons, ye commit sin');
  });

  it('lesson 8 lands his own word: two or three witnesses, and He in the midst', () => {
    const l = M[7];
    expect(l.title).toBe('Two or three witnesses');
    expect(l.lesson).toContain('at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established');
    expect(l.lesson).toContain('For where two or three are gathered together in my name, there am I in the midst of them');
    expect(l.lesson).toContain('He that is first in his own cause seemeth just');
    expect(l.lesson).toMatch(/Write the vision, and make it plain/);
  });

  it('never stages both-sides theatre and never smears "contested" over the documented (DR-0098 / DR-0100)', () => {
    const text = allText();
    expect(text).not.toMatch(/some (historians|scholars) (say|argue|believe)/i);
    expect(text).not.toMatch(/you decide/i);
    // "unsettled" / "contested" appear ONLY about the one number that is — or
    // in the course's own rule for how such a number is handled.
    const sentences = text.match(/[^.]*\b(unsettled|contested)\b[^.]*/gi) || [];
    expect(sentences.length).toBeGreaterThan(0);
    for (const s of sentences) {
      expect(s, `"unsettled/contested" used outside the Tulsa count: ${s.trim().slice(0, 120)}`).toMatch(/dead|count|number|Tulsa|Greenwood|figure/i);
    }
  });

  it('cites every anchor it names, and names them all in the refs list', () => {
    const refs = historyRefs();
    expect(refs.length).toBeGreaterThan(30);
    for (const m of M) {
      for (const part of String(m.anchor.ref).split(';')) {
        expect(refs, `${m.id} anchor ${part.trim()} missing from refs`).toContain(part.trim());
      }
    }
    // every anchor reference resolves in the corpus
    for (const ref of refs) {
      const m = /^([1-3]?\s?[A-Za-z]+)\s+(\d+):(.+)$/.exec(ref);
      expect(m, `unparseable ref ${ref}`).toBeTruthy();
      expect(versesOf(m[1], m[2], m[3]), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('it is wired into the school, and it OPENS the History department', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'history-truth');

  it('appears in the catalog as a self-paced course under History', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('History');
    expect(row.unitCap).toBe('Lesson');
  });

  it('creates the department with no new machinery — the category IS the shelf', () => {
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    expect(labels, 'History did not open as a department').toContain('History');
  });

  it('declares its shelves (DR-0540): home in History, cross-listed onto the Word’s own shelf', () => {
    expect(coursesWithNoShelfDeclaration(LEARN_CATALOG.map((c) => c.key))).not.toContain('history-truth');
    const x = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'history-truth');
    expect(x).toBeTruthy();
    expect(x.department).toBe('The Word & The Way');
    expect(x.why).toMatch(/measured: (\d+) Scripture anchors/);
    // the measurement in the why is the real one
    const n = Number(/measured: (\d+) Scripture anchors/.exec(x.why)[1]);
    expect(n).toBe(historyRefs().length);
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    for (const r of rows) expect(r.dateISO == null || r.dateISO === '').toBe(true);
    const done = historyProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportHistoryCurriculumMarkdown(null);
    expect(md).toContain('Historical Truth');
    expect(md).toContain('Two or three witnesses');
    expect(row.downloadName).toMatch(/\.md$/);
  });

  it('offers the interest door without promising to be the record', () => {
    expect(row.interestTag).toBe('[Historical Truth]');
    expect(row.interestCopy.blurb).toMatch(/not a substitute for the record/i);
    expect(row.interestText('Someone')).toContain('[Historical Truth]');
  });

  it('matches the schedule the shared framework builds directly', () => {
    expect(buildHistorySchedule(null)).toHaveLength(M.length);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  const m = M[7];

  it('catches a quotation that drifted by one word', () => {
    const drifted = 'He said. "For where two or three are gathered in my name, there am I in the midst of them" (Matthew 18:20).';
    expect(quotationFaults(drifted).join(' '), 'a drifted quotation passed').toMatch(/NOT VERBATIM/);
    const right = 'He said. "For where two or three are gathered together in my name, there am I in the midst of them" (Matthew 18:20).';
    expect(quotationFaults(right)).toEqual([]);
  });

  it('catches a quotation hung on the wrong reference', () => {
    const wrong = 'He said. "For where two or three are gathered together in my name, there am I in the midst of them" (Matthew 18:19).';
    expect(quotationFaults(wrong).join(' '), 'a mislabelled reference passed').toMatch(/NOT VERBATIM/);
  });

  it('catches "the LORD" drifting into our own prose', () => {
    const drifted = 'We teach that the LORD is the standard outside every telling.';
    expect(/\bthe LORD\b/.test(ours(drifted))).toBe(true);
    const quoted = 'The Word says "which knew not the LORD, nor yet the works which he had done for Israel" (Judges 2:10).';
    expect(/\bthe LORD\b/.test(ours(quoted))).toBe(false);
  });

  it('catches an inverted ladder', () => {
    expect(fk(m.levels.teen) < fk(m.levels.senior)).toBe(true);
    expect(fk(m.levels.senior) < fk(m.levels.teen)).toBe(false);
    expect(fk(m.lesson) <= TEEN_CEILING, 'the adult text would pass as a teen band').toBe(false);
  });

  it('catches a band that is a summary rather than a lesson', () => {
    const stub = m.levels.teen.split('. ').slice(0, 3).join('. ');
    expect(words(stub) / words(m.lesson) >= FULL_FLOOR, 'a three-sentence stub passed the floor').toBe(false);
  });

  it('catches a near-copy band', () => {
    expect(overlapOf(m.levels.senior, m.levels.senior) <= NEAR_COPY, 'a band identical to its sibling passed').toBe(false);
  });

  it('catches both-sides theatre if it were ever written in', () => {
    expect(/some (historians|scholars) (say|argue|believe)/i.test('Some historians argue the removal was voluntary; you decide.')).toBe(true);
  });
});

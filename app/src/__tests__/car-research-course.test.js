// @vitest-environment node
// =============================================================================
// car-research-course — "Historical Research, Level 1: Who Invented the Car?"
// (DR-1083). The History department's third course: the Level-1 craft of the
// 1619 course worked on a second case, from records a runner read first.
// =============================================================================
// Darrell, 2026-10-16: "who invented the driving car? Based on documentation
// of history etc... make sure we use all sources inside the app... research 1
// level context however the Higher Education Yahweh as the foundation of our
// comprehension of the world and dimensions" and "1619 historical events... in
// context historical accuracy and science of how we understand as a
// community". This gate pins what the case showed and how it was built:
// every verse verbatim from the repo's KJV, every voice and dated entry on a
// listed record host and in the runner probes' pages, four bands per lesson
// under the History department's ceilings, a worked case in every lesson, and
// the Library of Congress's own correction and revision as the spine of
// lesson one.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAR_RESEARCH_MODULES, CAR_RESEARCH_META, CAR_RESEARCH_SESSION_FLOW,
  CAR_RESEARCH_SESSION_MINUTES, CAR_RESEARCH_CARE_NOTE, CAR_RESEARCH_TUTOR_META,
  buildCarResearchSchedule, carResearchProgressSummary, exportCarResearchCurriculumMarkdown,
  carResearchRefs, carResearchTimeline, carResearchSources,
} from '../lib/car-research-course.js';
import { historyVoiceFaults, historyTimelineFaults, historyWorkedCaseFaults, HISTORY_SOURCE_HOSTS, HISTORY_RECORD_HOSTS, WORKED_CASE_PARTS } from '../lib/history-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { COURSE_CROSS_LISTINGS, coursesWithNoShelfDeclaration } from '../lib/learn-crosslist.js';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { shingles, overlap } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = CAR_RESEARCH_MODULES;
const BANDS = ['child', 'youth', 'teen', 'senior'];
const YOUTH_CEILING = 8.0;
const TEEN_CEILING = 6.0;
const SENIOR_CEILING = 10.0;
const CHILD_FLOOR = 0.5;
const FULL_FLOOR = 0.6;
const NEAR_COPY = 0.25;
const fk = (t) => fleschKincaidGrade(ourProseOnly(String(t || '')));
const words = (t) => (ourProseOnly(String(t || '')).match(/[A-Za-z’']+/g) || []).length;
const overlapOf = (a, b) => overlap(shingles(ourProseOnly(a)), shingles(ourProseOnly(b)));

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();
const load = (book) => {
  const key = String(book).replace(/\s+/g, '');
  if (!cache.has(key)) { const p = join(KJV, `${key}.json`); cache.set(key, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(key);
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
// Case-sensitive, as the Living Lessons quotation gate is: a verse that opens
// "And" is not quoted as "and".
const quotationFaults = (text) => {
  const out = [];
  for (const sp of spansWithRef(String(text || ''))) {
    const real = versesOf(sp.book, sp.ch, sp.vs);
    if (!real) { out.push(`cannot load ${sp.book} ${sp.ch}:${sp.vs}`); continue; }
    if (!norm(real).includes(norm(sp.quote))) out.push(`NOT VERBATIM "${sp.quote}" vs ${sp.book} ${sp.ch}:${sp.vs}`);
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
const byId = (id) => M.find((m) => m.id === id);
const lessonText = (m) => [m.bigIdea, m.lesson, ...BANDS.map((b) => m.levels[b])].join('\n');
const PROBED_HOSTS = ['blogs.loc.gov', 'web.archive.org', 'group.mercedes-benz.com', 'www.dpma.de', 'germanhistorydocs.org', 'news.un.org', 'nationalmotormuseum.org.uk', 'www.lindahall.org', 'www.thehenryford.org'];

describe('the course exists, in an order that makes sense, shaped like a course', () => {
  it('carries four competencies: define, go to the issuing record, give each their due, write it in order', () => {
    expect(M.map((m) => m.id)).toEqual([
      'car1-what-is-a-car',
      'car2-go-to-the-issuing-record',
      'car3-others-laboured',
      'car4-for-the-multitude-and-the-giver',
    ]);
  });
  it('gives every lesson the whole shape a reader and a facilitator both need', () => {
    for (const m of M) {
      for (const k of ['id', 'title', 'bigIdea', 'inApp', 'anchor', 'stories', 'benefits', 'levels', 'lesson', 'voices', 'timeline', 'workedCase', 'quiz', 'facilitator']) expect(m[k], `${m.id} lacks ${k}`).toBeTruthy();
      expect(m.stories.length).toBeGreaterThanOrEqual(2);
      expect(m.benefits.length).toBeGreaterThanOrEqual(4);
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(2);
      for (const q of m.quiz.questions) expect(q.options[q.answer], `${m.id}: a quiz answer points at no option`).toBeTruthy();
      expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(3);
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
      expect(m.facilitator.howToRun.length).toBeGreaterThan(200);
    }
  });
  it('states its limit on the meta, where every surface renders it', () => {
    expect(CAR_RESEARCH_META.care).toBe(CAR_RESEARCH_CARE_NOTE);
    expect(CAR_RESEARCH_CARE_NOTE).toMatch(/^Teaching, not a substitute for the record\./);
    expect(CAR_RESEARCH_META.weeks).toBe(M.length);
  });
  it('opens Word-first, and both spans are the verse', () => {
    expect(CAR_RESEARCH_META.wordFirst.ref).toBe('Proverbs 18:13; Proverbs 8:12');
    expect(quotationFaults(CAR_RESEARCH_META.wordFirst.frame)).toEqual([]);
    expect(spansWithRef(CAR_RESEARCH_META.wordFirst.frame)).toHaveLength(2);
  });
  it('runs a session flow that adds up to 65 minutes', () => {
    expect(CAR_RESEARCH_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(CAR_RESEARCH_SESSION_MINUTES);
    expect(CAR_RESEARCH_SESSION_MINUTES).toBe(65);
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the whole module — every one verbatim, case and all', () => {
    const bad = []; let n = 0;
    for (const m of M) walkStrings(m, m.id, (t, path) => { for (const f of quotationFaults(t)) bad.push(`${path}: ${f}`); n += spansWithRef(t).length; });
    expect(bad).toEqual([]);
    expect(n).toBeGreaterThan(120);
  });
  it('never elides inside a quotation', () => {
    for (const m of M) walkStrings(m, m.id, (t, path) => { for (const sp of spansWithRef(t)) expect(/\.\.\.|…/.test(sp.quote), path).toBe(false); });
  });
  it('says Yahweh in our voice, never the generic, and leaves "the LORD" only inside quotations', () => {
    for (const m of M) for (const t of [m.bigIdea, m.lesson, ...BANDS.map((b) => m.levels[b])]) {
      expect(/\bGod(?:'s|’s)?\b/.test(ours(t)), `${m.id}: the generic in our voice`).toBe(false);
      expect(/the LORD/.test(ours(t)), `${m.id}: "the LORD" in our voice`).toBe(false);
    }
    for (const m of M) for (const b of BANDS) expect(m.levels[b], `${m.id} ${b} never says Yahweh`).toMatch(/Yahweh/);
  });
  it('cites every anchor it names, and every anchor resolves in the corpus — 17, measured', () => {
    const refs = carResearchRefs();
    expect(refs).toHaveLength(17);
    for (const r of refs) {
      const m = r.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)$/);
      expect(m, r).toBeTruthy();
      expect(versesOf(m[1], m[2], m[3]), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('four bands on every lesson, measured', () => {
  for (const m of M) {
    it(`${m.id}: child, youth, teen and senior each carry the whole lesson, under the ceilings, none a near copy`, () => {
      for (const b of BANDS) expect(words(m.levels[b]), `${m.id} ${b} missing`).toBeGreaterThan(150);
      const c = fk(m.levels.child); const y = fk(m.levels.youth); const t = fk(m.levels.teen); const s = fk(m.levels.senior);
      expect(c, `child grade ${c}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
      expect(y, `youth grade ${y}`).toBeLessThanOrEqual(YOUTH_CEILING);
      expect(t, `teen grade ${t}`).toBeLessThanOrEqual(TEEN_CEILING);
      expect(s, `senior grade ${s}`).toBeLessThanOrEqual(SENIOR_CEILING);
      expect(c).toBeLessThan(s);
      expect(t).toBeLessThan(s);
      const L = words(m.lesson);
      expect(words(m.levels.child) / L).toBeGreaterThanOrEqual(CHILD_FLOOR);
      for (const band of ['youth', 'teen', 'senior']) expect(words(m.levels[band]) / L, `${band} share`).toBeGreaterThanOrEqual(FULL_FLOOR);
      for (let i = 0; i < BANDS.length; i += 1) {
        expect(overlapOf(m.levels[BANDS[i]], m.lesson), `${BANDS[i]}~adult`).toBeLessThanOrEqual(NEAR_COPY);
        for (let j = i + 1; j < BANDS.length; j += 1) expect(overlapOf(m.levels[BANDS[i]], m.levels[BANDS[j]]), `${BANDS[i]}~${BANDS[j]}`).toBeLessThanOrEqual(NEAR_COPY);
      }
    });
  }
  it('renders every band without losing a word', () => {
    for (const m of M) for (const band of BANDS) {
      const text = m.levels[band];
      const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
      const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
      expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
    }
  });
  it('every band of every lesson quotes the Word at least twice', () => {
    for (const m of M) for (const band of BANDS) expect(spansWithRef(m.levels[band]).length, `${m.id} ${band}`).toBeGreaterThanOrEqual(2);
  });
});

describe('the four competencies each teach their own thing — from the fetched record', () => {
  it('lesson 1 lets the Library of Congress correct how it was quoted, then revise its own page, both versions on the record', () => {
    const m = byId('car1-what-is-a-car');
    const said = m.voices.map((v) => v.words).join(' ');
    expect(said).toContain('I believe the nation that invented the automobile cannot walk away from it.');
    expect(said).toContain('If we had to give credit to one inventor, it would probably be Karl Benz from Germany.');
    expect(said).toContain('our knowledge of the invention of the true automobile continues to evolve');
    expect(m.voices.map((v) => v.year)).toEqual(expect.arrayContaining([2009, 2024]));
    expect(lessonText(m)).toContain('(Proverbs 18:13)');
  });
  it('lesson 2 sets four witnesses beside the museum’s transposed number and wrong verb, and the museum’s own correction', () => {
    const m = byId('car2-go-to-the-issuing-record');
    expect(m.workedCase.claim.words).toContain('German patent no. 37345');
    const eco = m.workedCase.economics.map((e) => e.figure);
    expect(eco).toEqual(expect.arrayContaining(['37435', '37345', '277 days']));
    expect(m.voices.map((v) => v.words).join(' ')).toContain('granted on November 2, 1886');
    expect(lessonText(m)).toContain('(Deuteronomy 19:15)');
    // 277 is measured, not asserted: January 29 to November 2, 1886.
    expect(Math.round((Date.UTC(1886, 10, 2) - Date.UTC(1886, 0, 29)) / 86400000)).toBe(277);
  });
  it('lesson 3 names everyone a single answer leaves out, and gives Bertha Benz her due in the patent office’s words', () => {
    const m = byId('car3-others-laboured');
    const t = lessonText(m);
    for (const name of ['Cugnot', 'Daimler', 'Maybach', 'Bertha Benz', 'Duryea', 'Selden']) expect(t, name).toContain(name);
    expect(m.voices.map((v) => v.words).join(' ')).toContain('without Bertha Benz, the history of mobility would have been different');
    expect(t).toContain('(Romans 13:7)');
    expect(t).toContain('(Proverbs 31:31)');
  });
  it('lesson 4 measures the method by the museum’s minutes and price, and names Yahweh as the Teacher of every invention', () => {
    const m = byId('car4-for-the-multitude-and-the-giver');
    expect(m.workedCase.economics.map((e) => e.figure)).toEqual(expect.arrayContaining(['$850', '93 minutes']));
    const t = lessonText(m);
    for (const ref of ['(Proverbs 8:12)', '(Isaiah 28:26)', '(Hebrews 11:3)', '(Deuteronomy 6:7)']) expect(t, ref).toContain(ref);
  });
  it('never stages both-sides theatre: the one open question is named narrowly, as a question of definition', () => {
    for (const m of M) {
      expect(/both sides|you decide|pick a side/i.test(lessonText(m)), m.id).toBe(false);
      expect(/\bcontested\b/i.test(lessonText(m)), m.id).toBe(false);
    }
    expect(byId('car1-what-is-a-car').workedCase.stillOpen).toMatch(/definition/);
  });
  it('the stories carry no quotation marks (a parable is ours, not a record)', () => {
    for (const m of M) for (const s of m.stories) expect(s.body, `${m.id}: ${s.title}`).not.toMatch(/"/);
  });
});

describe('work the case: an actual claim processed with the data, in every lesson (DR-0601)', () => {
  it('every lesson carries a worked case with all ten parts and no fault', () => {
    for (const m of M) {
      for (const k of WORKED_CASE_PARTS) expect(m.workedCase[k], `${m.id} ${k}`).toBeTruthy();
      expect(historyWorkedCaseFaults(m)).toEqual([]);
    }
  });
  it('the claim sits on a probed host, and the event is a year on the lesson’s own timeline', () => {
    for (const m of M) {
      expect(PROBED_HOSTS).toContain(new URL(m.workedCase.claim.source.url).host);
      expect(m.timeline.map((t) => t.year)).toContain(m.workedCase.event.year);
    }
  });
  it('the Word on why we do it is verbatim in every case', () => {
    for (const m of M) {
      expect(quotationFaults(m.workedCase.closedDoors.verse)).toEqual([]);
      expect(quotationFaults(m.workedCase.closedDoors.heart)).toEqual([]);
    }
  });
});

describe('voices of the time and the record, dated: probed on a runner before they were written in (DR-0580 / DR-0597)', () => {
  it('every lesson carries at least three voices and a dated timeline, with no fault', () => {
    for (const m of M) {
      expect(m.voices.length).toBeGreaterThanOrEqual(3);
      expect(historyVoiceFaults(m)).toEqual([]);
      expect(historyTimelineFaults(m)).toEqual([]);
    }
  });
  it('quotes only hosts the 2026-10-16 probes read, and every one is on the department’s listed hosts', () => {
    for (const s of carResearchSources()) {
      const host = new URL(s.url).host;
      expect(PROBED_HOSTS, s.url).toContain(host);
      expect([...HISTORY_SOURCE_HOSTS, ...HISTORY_RECORD_HOSTS], s.url).toContain(host);
    }
    expect(carResearchSources().length).toBe(12);
  });
  it('reads the two pages that refuse a runner only from the Wayback Machine’s copies', () => {
    for (const s of carResearchSources()) {
      expect(s.url.startsWith('https://www.loc.gov/'), s.url).toBe(false);
      expect(s.url.startsWith('https://www.si.edu/'), s.url).toBe(false);
    }
  });
  it('the whole course lines up on one timeline, from Cugnot’s model to the patent office’s page', () => {
    const tl = carResearchTimeline();
    expect(tl[0].year).toBe(1769);
    expect(tl[tl.length - 1].year).toBe(2026);
    for (let i = 1; i < tl.length; i += 1) expect(tl[i].year).toBeGreaterThanOrEqual(tl[i - 1].year);
    for (const t of tl) expect(t.source, `${t.lessonId} ${t.year}`).toBeTruthy();
  });
  it('proven-to-catch: an unlisted host, an unnamed year and an elided voice are refused', () => {
    const m = byId('car1-what-is-a-car');
    const offHost = { ...m, voices: [{ ...m.voices[0], source: { ...m.voices[0].source, url: 'https://example.com/x' } }, ...m.voices.slice(1)] };
    expect(historyVoiceFaults(offHost).join(' ')).toMatch(/not a listed primary-record host/);
    const extraYear = { ...m, timeline: [...m.timeline, { year: 2030, event: 'A year no prose names at all.', record: 'No such record here.' }] };
    expect(historyTimelineFaults(extraYear).join(' ')).toMatch(/2030/);
    const elided = { ...m, voices: [{ ...m.voices[0], words: 'I believe the nation ... cannot walk away from it today.' }, ...m.voices.slice(1)] };
    expect(historyVoiceFaults(elided).join(' ')).toMatch(/elision/);
    expect(quotationFaults('"he that answereth a matter before he heareth it" (Proverbs 18:13)')).not.toEqual([]);
  });
});

describe('it is wired into the school as the History department’s third course', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'car-research-who-invented-the-car');
  it('appears in the catalog as a self-paced course under History', () => {
    expect(row).toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('History');
  });
  it('the department holds three courses, in order', () => {
    expect(LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'History').map((c) => c.key))
      .toEqual(['history-truth', 'historical-research-1619', 'car-research-who-invented-the-car']);
  });
  it('declares its shelves (DR-0540): home in History, cross-listed onto the Word’s own shelf with the real count', () => {
    expect(coursesWithNoShelfDeclaration(['car-research-who-invented-the-car'])).toEqual([]);
    const x = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'car-research-who-invented-the-car');
    expect(x.department).toBe('The Word & The Way');
    expect(x.why).toContain(`${carResearchRefs().length} Scripture anchors across four lessons`);
  });
  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    expect(buildCarResearchSchedule(null)).toHaveLength(4);
    expect(carResearchProgressSummary({})).toBeTruthy();
    const md = exportCarResearchCurriculumMarkdown(null);
    expect(md).toContain(CAR_RESEARCH_META.title);
    expect(row.buildScheduleRows()).toHaveLength(4);
  });
  it('offers the tutor a posture that keeps the craft', () => {
    expect(CAR_RESEARCH_TUTOR_META.posture).toMatch(/two or three witnesses/);
    expect(CAR_RESEARCH_TUTOR_META.posture).toMatch(/Never quote a page the runner did not read/);
  });
});

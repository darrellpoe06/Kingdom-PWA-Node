// =============================================================================
// historical-research-course — the History department's second course, REBUILT
// from fetched records (DR-0597): "Historical Research, Level 1: The 1619
// Project as the Case"
// =============================================================================
// Darrell 2026-09-24 on the first build: "Where did the rigor for this lesson
// come from?! Not our process!" — "Why are we not discussing the experiences
// of the witnesses?!" — "The reason why cities are the way they are or bridges
// and highways are the way they are!" — "Watering down lessons and issues we
// need to comprehend!" — "We want the history of the American culture to be
// able to give our children sight to see Yahweh's perspectives." — and on the
// order: "some lessons may fit better with others."
//
// So this file pins what that correction demands, on the real module:
// every quoted span walked against the repo's KJV; FOUR bands on every
// lesson, each carrying the whole lesson, none a near copy, the child band
// under the new-lesson ceiling; a witness of the time in every lesson; every
// historical voice on a listed record host, dated, unelided, probed on a
// runner before it was written in; every dated timeline entry carrying a
// source the witness probes; every year the prose names on its timeline and
// every timeline year named; no both-sides theatre; the moral verdict never
// staged as open; the project's strength stated as plainly as its faults; the
// lessons in the order that makes sense, with the reason recorded.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  HISTORICAL_RESEARCH_MODULES, HISTORICAL_RESEARCH_META, HISTORICAL_RESEARCH_CARE_NOTE,
  HISTORICAL_RESEARCH_SESSION_FLOW, HISTORICAL_RESEARCH_TUTOR_META,
  buildHistoricalResearchSchedule, historicalResearchProgressSummary, exportHistoricalResearchCurriculumMarkdown,
  historicalResearchRefs, historicalResearchTimeline, historicalResearchSources,
} from '../lib/historical-research-course.js';
import { historyVoiceFaults, historyTimelineFaults, historyYearsNamed, historyVoiceYears, HISTORY_SOURCE_HOSTS, HISTORY_RECORD_HOSTS } from '../lib/history-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { COURSE_CROSS_LISTINGS, coursesWithNoShelfDeclaration } from '../lib/learn-crosslist.js';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = HISTORICAL_RESEARCH_MODULES;
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
    if (!norm(real).toLowerCase().includes(norm(sp.quote).toLowerCase())) out.push(`NOT VERBATIM "${sp.quote}" vs ${sp.book} ${sp.ch}:${sp.vs}`);
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
const byId = (id) => M.find((m) => m.id === id);
const lessonText = (m) => [m.bigIdea, m.lesson, ...BANDS.map((b) => m.levels[b])].join('\n');
const SRC_FILE = () => readFileSync(join(process.cwd(), 'src', 'lib', 'historical-research-course.js'), 'utf8');

describe('the course exists, in the order that makes sense, and it is shaped like a course', () => {
  it('carries eight competencies in three movements: the record, the project’s people, the built world and the children', () => {
    expect(M.map((m) => m.id)).toEqual([
      'hr1-the-standard-before-the-claim',
      'hr1-go-to-the-record',
      'hr1-the-witnesses',
      'hr1-two-or-three-witnesses-the-process',
      'hr1-fact-and-interpretation',
      'hr1-the-correction-and-the-quiet-edit',
      'hr1-the-city-they-built',
      'hr1-write-it-in-order-for-our-children',
    ]);
    expect(HISTORICAL_RESEARCH_META.weeks).toBe(M.length);
  });

  it('records WHY the order is what it is, in the module itself (his ask: "some lessons may fit better with others")', () => {
    const src = SRC_FILE();
    expect(src).toMatch(/THE ORDER — by sense, not only by date/);
    expect(src).toMatch(/Lesson 2 sits before lesson 3 because the record of the event/);
    expect(src).toMatch(/lesson 7 sits after the\s*\/\/ three process lessons/);
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
    expect(HISTORICAL_RESEARCH_META.care).toBe(HISTORICAL_RESEARCH_CARE_NOTE);
    expect(HISTORICAL_RESEARCH_CARE_NOTE).toMatch(/not a substitute for the record/i);
    expect(HISTORICAL_RESEARCH_CARE_NOTE).toMatch(/you are meant to check it/);
    expect(HISTORICAL_RESEARCH_TUTOR_META.posture).toMatch(/Never invent a date/);
    expect(HISTORICAL_RESEARCH_TUTOR_META.posture).toMatch(/never stage two schools/i);
    expect(HISTORICAL_RESEARCH_TUTOR_META.posture).toMatch(/settled by the Word and is not a research question/);
    expect(HISTORICAL_RESEARCH_TUTOR_META.posture).toMatch(/say so and do not quote it/);
  });

  it('opens Word-first: prove all things, two or three witnesses', () => {
    const wf = HISTORICAL_RESEARCH_META.wordFirst;
    expect(wf.ref).toContain('1 Thessalonians 5:21');
    expect(wf.ref).toContain('Deuteronomy 19:15');
    expect(quotationFaults(wf.frame)).toEqual([]);
    expect(wf.frame).toContain('Prove all things; hold fast that which is good');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(HISTORICAL_RESEARCH_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, not only the reader texts — 226 spans on 2026-09-24, none drifted', () => {
    let spans = 0; const faults = [];
    for (const m of M) walkStrings(m, m.id, (t, path) => { spans += spansWithRef(t).length; for (const f of quotationFaults(t)) faults.push(`${path}: ${f}`); });
    expect(spans).toBeGreaterThanOrEqual(220);
    expect(faults).toEqual([]);
  });

  it('never elides inside a quotation (DR-0459)', () => {
    walkStrings(M, '', (t, path) => {
      for (const q of t.match(/"[^"]*"/g) || []) expect(q, `${path}`).not.toMatch(/\.\.\.|…/);
    });
  });

  it('says Yahweh in OUR voice and leaves "the LORD" exactly where the KJV has it', () => {
    const text = allText();
    expect(text).toMatch(/Yahweh/);
    walkStrings(M, '', (t, path) => { expect(ours(t), `"the LORD" in our prose at ${path}`).not.toMatch(/\bthe LORD\b/); });
    expect(text).toMatch(/"to do justly, and to love mercy, and to walk humbly with thy God" \(Micah 6:8\)/);
  });

  it('never capitalises the adversary', () => {
    walkStrings(M, '', (t, path) => { expect(ours(t), path).not.toMatch(/\b(Satan|Devil|Lucifer)\b/); });
  });
});

describe('four bands on every lesson, measured — "watering down" is the failure this rebuild answers', () => {
  for (const m of M) {
    it(`${m.id}: child, youth, teen and senior each carry the whole lesson, on the ladder, under the ceilings, none a near copy`, () => {
      for (const b of BANDS) expect(words(m.levels[b]), `${m.id} ${b} missing`).toBeGreaterThan(150);
      const c = fk(m.levels.child); const y = fk(m.levels.youth); const t = fk(m.levels.teen); const s = fk(m.levels.senior);
      expect(c, `child grade ${c}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
      expect(y, `youth grade ${y}`).toBeLessThanOrEqual(YOUTH_CEILING);
      expect(t, `teen grade ${t}`).toBeLessThanOrEqual(TEEN_CEILING);
      expect(s, `senior grade ${s}`).toBeLessThanOrEqual(SENIOR_CEILING);
      expect(c, `child ${c} does not read easier than senior ${s}`).toBeLessThan(s);
      expect(t, `teen ${t} does not read easier than senior ${s}`).toBeLessThan(s);
      const L = words(m.lesson);
      expect(words(m.levels.child) / L, 'child carries under half the adult text').toBeGreaterThanOrEqual(CHILD_FLOOR);
      for (const band of ['youth', 'teen', 'senior']) {
        const share = words(m.levels[band]) / L;
        expect(share, `${band} carries only ${share.toFixed(2)} of the adult text`).toBeGreaterThanOrEqual(FULL_FLOOR);
      }
      expect(NEAR_COPY).toBeLessThan(DIFF_CEILING);
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

  it('every band of every lesson quotes the Word verbatim, and says Yahweh', () => {
    for (const m of M) for (const band of BANDS) {
      expect(quotationFaults(m.levels[band]), `${m.id} ${band}`).toEqual([]);
      expect(spansWithRef(m.levels[band]).length, `${m.id} ${band} carries no verse`).toBeGreaterThanOrEqual(2);
      expect(m.levels[band], `${m.id} ${band} never says Yahweh`).toMatch(/Yahweh/);
    }
  });
});

describe('the eight competencies each teach their own thing — from the fetched record, never from memory', () => {
  it('lesson 1 sorts the project’s own words into fact, frame and judgment under "Prove all things"', () => {
    const t = lessonText(byId('hr1-the-standard-before-the-claim'));
    expect(t).toContain('"Prove all things; hold fast that which is good" (1 Thessalonians 5:21)');
    expect(t).toMatch(/fact claim/i); expect(t).toMatch(/frame/i); expect(t).toMatch(/judgment/i);
    expect(t).toContain('understanding 1619 as our true founding');
    expect(t).toContain('"searched the scriptures daily, whether those things were so" (Acts 17:11)');
  });
  it('lesson 2 goes to the nearest fetched record, reads the fact-checker’s qualifiers, and names the record it could NOT fetch instead of quoting it', () => {
    const t = lessonText(byId('hr1-go-to-the-record'));
    expect(t).toMatch(/believed to be/); expect(t).toMatch(/British North America/);
    expect(t).toMatch(/John Rolfe/); expect(t).toMatch(/page not found/);
    expect(t).toContain('"He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13)');
    // the first build's remembered claims are gone
    expect(t).not.toMatch(/20\. and odd/); expect(t).not.toMatch(/1526/); expect(t).not.toMatch(/1565/);
  });
  it('lesson 3 lets the enslaved speak for themselves — four witnesses in their own fetched words', () => {
    const m = byId('hr1-the-witnesses');
    const t = lessonText(m);
    for (const n of ['Equiano', 'Jacobs', 'Douglass', 'Wells']) expect(t).toContain(n);
    expect(t).toContain('I was born a slave; but I never knew it till six years of happy childhood had passed away');
    expect(t).toContain('"the voice of thy brother’s blood crieth unto me from the ground" (Genesis 4:10)');
    expect(t).toMatch(/"[Hh]e that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death" \(Exodus 21:16\)/);
    expect(m.voices.map((v) => new URL(v.source.url).host)).toEqual(expect.arrayContaining(['www.gutenberg.org']));
  });
  it('lesson 4 judges the PROCESS by the testimony of the people inside it: Harris, Wood, the five historians, the editor', () => {
    const m = byId('hr1-two-or-three-witnesses-the-process');
    const t = lessonText(m);
    expect(t).toContain('I vigorously disputed the claim');
    expect(t).toContain('Despite my advice, the Times published the incorrect statement about the American Revolution anyway');
    expect(t).toContain('No one ever approached me');
    expect(t).toContain('the closed process behind it');
    expect(t).toMatch(/Silverstein/);
    expect(t).toContain('"at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15)');
    expect(m.voices.map((v) => v.speaker).join(' ')).toMatch(/Harris.*Harris.*Wood.*Five historians.*Silverstein/s);
  });
  it('lesson 5 tests the Revolution claim by its three supports, with the essay quoted before the record answers it', () => {
    const t = lessonText(byId('hr1-fact-and-interpretation'));
    expect(t).toContain('one of the primary reasons the colonists decided to declare their independence from Britain was because they wanted to protect the institution of slavery');
    expect(t).toContain('Britain was hardly conflicted at all in 1776');
    expect(t).toContain('formed only in 1787');
    expect(t).toMatch(/1769 to 1774/); expect(t).toMatch(/1772/);
    expect(t).toMatch(/cannot stand as printed/);
    expect(t).toMatch(/some colonists/i);
    expect(t).toContain('"Judge not according to the appearance, but judge righteous judgment" (John 7:24)');
    expect(t).not.toMatch(/Dunmore/); // not fetched this build — not quoted
  });
  it('lesson 6 tells the open correction from the quiet edit, from the pages themselves', () => {
    const t = lessonText(byId('hr1-the-correction-and-the-quiet-edit'));
    expect(t).toContain('some of the colonists');
    expect(t).toMatch(/March 11, 2020|March 2020/);
    expect(t).toContain('without explanation');
    expect(t).toMatch(/Stephens/); expect(t).toMatch(/metaphoric argument/);
    expect(t).toContain('"He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13)');
    expect(t).toContain('"he that regardeth reproof shall be honoured" (Proverbs 13:18)');
  });
  it('lesson 7 reads the city as a record and proves the project’s strength from the government’s own pages', () => {
    const m = byId('hr1-the-city-they-built');
    const t = lessonText(m);
    expect(t).toContain('The FHA was the architect of federally sponsored redlining from 1934 until the 1960s');
    expect(t).toContain('not of the Caucasian race'); expect(t).toMatch(/Shelley v\. Kraemer/); expect(t).toMatch(/1911/); expect(t).toMatch(/1948/);
    expect(t).toMatch(/Federal-Aid Highway Act of 1956/);
    expect(t).toContain('the boundary between the white and Negro communities');
    expect(t).toContain('urban renewal, which means moving the Negroes out');
    expect(t).toContain('reconnect communities harmed by past transportation infrastructure decisions');
    expect(t).toMatch(/Kruse was right/);
    expect(t).toContain('"Woe to him that buildeth a town with blood, and stablisheth a city by iniquity!" (Habakkuk 2:12)');
    expect(t).toContain('The repairer of the breach, The restorer of paths to dwell in');
    const hosts = new Set(m.voices.map((v) => new URL(v.source.url).host));
    for (const h of ['www.federalreservehistory.org', 'www.law.cornell.edu', 'americanarchive.org']) expect(hosts, h).toContain(h);
  });
  it('lesson 8 writes the finding in order for the children, with the settled and the narrow both in it, and gives the sight', () => {
    const t = lessonText(byId('hr1-write-it-in-order-for-our-children'));
    expect(t).toContain('"Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2)');
    expect(t).toContain('"thou shalt teach them diligently unto thy children" (Deuteronomy 6:7)');
    expect(t).toContain('"We will not hide them from their children" (Psalms 78:4)');
    expect(t).toMatch(/one blood/);
    expect(t).toMatch(/1852/); expect(t).toMatch(/1865/);
    expect(t).toMatch(/settled and the narrow/i);
  });

  it('a witness of the time — someone who was there, in his own words — speaks in EVERY lesson (his ask, twice)', () => {
    const WITNESS = /Harris|Wood|Equiano|Jacobs|Douglass|Wells|Baldwin|Hannah-Jones|Silverstein|Stephens|Continental Congress|Lincoln|Supreme Court/;
    for (const m of M) expect(m.voices.some((v) => WITNESS.test(v.speaker)), `${m.id} has no witness voice`).toBe(true);
  });

  it('credits the project’s aim plainly — in the course’s words and in its critics’ fetched words', () => {
    expect(HISTORICAL_RESEARCH_META.blurb).toMatch(/team of journalists led by Nikole Hannah-Jones/);
    const l8 = byId('hr1-write-it-in-order-for-our-children');
    expect(l8.voices.some((v) => /praiseworthy and urgent public service/.test(v.words))).toBe(true);
    expect(lessonText(byId('hr1-the-city-they-built'))).toMatch(/where the (1619 )?project is strongest/i);
  });

  it('never stages both-sides theatre, and the verdict on slavery is never staged as open (DR-0098 / DR-0100)', () => {
    const text = ours(allText()); // the lesson may NAME the theatre inside quotation marks to refuse it; it never speaks it
    expect(text).not.toMatch(/some (historians|scholars) (say|argue|believe)/i);
    expect(text).not.toMatch(/you decide/i);
    expect(text).not.toMatch(/\bcontested\b/i);
    expect(text).not.toMatch(/whether slavery was (wrong|evil|right)/i);
    expect(text).toMatch(/not a research (question|finding)/i);
    expect(allText()).toMatch(/That is not "you decide\."/);
  });

  it('cites every anchor it names, and every anchor resolves in the corpus — 31, measured', () => {
    const refs = historicalResearchRefs();
    expect(refs.length).toBe(31);
    for (const m of M) for (const part of String(m.anchor.ref).split(';')) expect(refs, `${m.id} anchor ${part.trim()}`).toContain(part.trim());
    for (const ref of refs) {
      const m = /^([1-3]?\s?[A-Za-z]+)\s+(\d+):(.+)$/.exec(ref);
      expect(m, `unparseable ref ${ref}`).toBeTruthy();
      expect(versesOf(m[1], m[2], m[3]), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('it is wired into the school as the History department’s second course', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'historical-research-1619');

  it('appears in the catalog as a self-paced course under History, beside the first', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('History');
    expect(row.unitCap).toBe('Lesson');
    const history = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'History').map((c) => c.key);
    expect(history).toEqual(['history-truth', 'historical-research-1619']);
  });

  it('the department holds two courses', () => {
    const dept = learnDepartments(LEARN_CATALOG).find((d) => d.label === 'History');
    expect(dept).toBeTruthy();
    expect(dept.courses ? dept.courses.length : 2).toBeGreaterThanOrEqual(2);
  });

  it('declares its shelves (DR-0540): home in History, cross-listed onto the Word’s own shelf with the real count', () => {
    expect(coursesWithNoShelfDeclaration(LEARN_CATALOG.map((c) => c.key))).not.toContain('historical-research-1619');
    const x = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'historical-research-1619');
    expect(x).toBeTruthy();
    expect(x.department).toBe('The Word & The Way');
    const n = Number(/measured: (\d+) Scripture anchors/.exec(x.why)[1]);
    expect(n).toBe(historicalResearchRefs().length);
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    const done = historicalResearchProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportHistoricalResearchCurriculumMarkdown(null);
    expect(md).toContain('Historical Research');
    expect(md).toContain('Prove all things');
    expect(row.downloadName).toMatch(/\.md$/);
    expect(buildHistoricalResearchSchedule(null)).toHaveLength(M.length);
  });

  it('offers the interest door without promising to be the record', () => {
    expect(row.interestTag).toBe('[Historical Research L1]');
    expect(row.interestCopy.blurb).toMatch(/not a substitute for the record/i);
    expect(row.interestText('Someone')).toContain('[Historical Research L1]');
  });
});

describe('voices of the time: their own words, dated, sourced, probed on a runner before they were written in (DR-0580 / DR-0597)', () => {
  it('every lesson carries at least three voices and none has a fault', () => {
    for (const m of M) {
      expect(m.voices.length, `${m.id} voices`).toBeGreaterThanOrEqual(3);
      expect(historyVoiceFaults(m), `${m.id}`).toEqual([]);
    }
  });

  it('measures something: 37 voices, 21 distinct records, every record on a listed primary-record or record host', () => {
    const all = M.flatMap((m) => m.voices);
    expect(all.length).toBe(37);
    const sources = historicalResearchSources();
    expect(sources.length).toBe(21);
    for (const s of sources) {
      const host = new URL(s.url).host;
      expect([...HISTORY_SOURCE_HOSTS, ...HISTORY_RECORD_HOSTS], s.url).toContain(host);
      expect(s.lessons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('quotes the newspaper, Politico and The Atlantic ONLY from the Wayback Machine’s dated copies — the live pages refuse a runner, and a dated copy is what makes a quiet edit visible', () => {
    for (const s of historicalResearchSources()) {
      expect(s.url).not.toMatch(/^https:\/\/(www\.)?(nytimes|politico|theatlantic|pulitzer)\.(com|org)/);
      if (/nytimes\.com|politico\.com|theatlantic\.com/.test(s.url)) expect(s.url).toMatch(/^https:\/\/web\.archive\.org\/web\/\d+\//);
    }
  });

  it('quotes only pages the runner probes answered — never the pages that 404ed or refused — and records the probe runs', () => {
    for (const s of historicalResearchSources()) {
      expect(s.url).not.toMatch(/Letter_from_John_Rolfe|encyclopediavirginia|nps\.gov\/articles|loc\.gov|mnopedia|64parishes|reconnecting-communities$|wsws\.org\/en\/articles\/2019\/11\/18\/mcph/);
    }
    const src = SRC_FILE();
    for (const run of ['35941837965', '35942295758', '35942609542', '35928051751']) expect(src).toContain(run);
  });

  it('the KJV walk does not mistake a historical quotation for Scripture, and the historical words carry no verse tag', () => {
    for (const m of M) for (const v of m.voices) {
      expect(spansWithRef(`"${v.words}" (${v.speaker}, ${v.year})`), `${m.id} ${v.speaker}`).toEqual([]);
      expect(v.words).not.toMatch(/\.\.\.|…/);
    }
  });
});

describe('the record, dated: every timeline entry carries a source the witness probes (DR-0597)', () => {
  it('every lesson carries a dated timeline with no fault, and every entry but the one it could not fetch carries a probed source', () => {
    let entries = 0; let sourced = 0;
    for (const m of M) {
      expect(m.timeline.length, `${m.id} timeline`).toBeGreaterThanOrEqual(3);
      expect(historyTimelineFaults(m), `${m.id}`).toEqual([]);
      for (const t of m.timeline) { entries += 1; if (t.source) sourced += 1; else expect(t.event, `${m.id} ${t.year} unsourced`).toMatch(/page not found|could not|answered/i); }
    }
    expect(entries).toBe(46);
    expect(sourced).toBe(45);
  });

  it('every year the lesson names is on its timeline, and every timeline year is named by the lesson or a voice', () => {
    for (const m of M) {
      const on = new Set(m.timeline.map((t) => t.year));
      for (const y of historyYearsNamed(m)) expect(on.has(y), `${m.id} names ${y}`).toBe(true);
      for (const y of historyVoiceYears(m)) expect(on.has(y), `${m.id} voice ${y}`).toBe(true);
      const known = new Set([...historyYearsNamed(m), ...historyVoiceYears(m)]);
      for (const y of on) expect(known.has(y), `${m.id} timeline ${y}`).toBe(true);
    }
  });

  it('the whole course lines up on one timeline, sorted, from the landing of 1619 to the record read in 2026', () => {
    const all = historicalResearchTimeline();
    expect(all.length).toBe(M.reduce((n, m) => n + m.timeline.length, 0));
    for (let i = 1; i < all.length; i += 1) expect(all[i].year).toBeGreaterThanOrEqual(all[i - 1].year);
    expect(all[0].year).toBe(1619);
    expect(all[all.length - 1].year).toBe(2026);
  });

  it('the dates the course states are on the record with the phrase the witness looks for', () => {
    const by = (id) => byId(id).timeline;
    expect(by('hr1-fact-and-interpretation').find((t) => t.year === 1787).source.phrase).toBe('formed only in 1787');
    expect(by('hr1-the-correction-and-the-quiet-edit').find((t) => t.year === 2020 && /March 11/.test(t.event)).source.phrase).toMatch(/some of the colonists/);
    expect(by('hr1-the-city-they-built').find((t) => t.year === 1911).source.phrase).toMatch(/February 16, 1911/);
    expect(by('hr1-the-city-they-built').find((t) => t.year === 1968).source.url).toMatch(/federalreservehistory/);
    expect(by('hr1-go-to-the-record').find((t) => t.year === 1620).source).toBeUndefined();
  });

  it('proven-to-catch: a dropped named year, an unnamed year, a disordered year, and a sourced entry on an unlisted host are refused', () => {
    const m = byId('hr1-the-city-they-built');
    expect(historyTimelineFaults({ ...m, timeline: m.timeline.filter((t) => t.year !== 1956) }).join('\n')).toMatch(/names 1956/);
    expect(historyTimelineFaults({ ...m, timeline: [...m.timeline, { year: 1999, event: 'nothing the lesson says at all', record: 'no record here' }] }).join('\n')).toMatch(/carries 1999/);
    expect(historyTimelineFaults({ ...m, timeline: [...m.timeline].reverse() }).join('\n')).toMatch(/out of order/);
    const t0 = { ...m.timeline[0], source: { title: 'some page', url: 'https://example.com/x', phrase: 'three words here' } };
    expect(historyTimelineFaults({ ...m, timeline: [t0, ...m.timeline.slice(1)] }).join('\n')).toMatch(/not a listed record host/);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('catches a quotation that drifted by one word, and one hung on the wrong reference', () => {
    expect(quotationFaults('"Prove all things; hold fast that which is true" (1 Thessalonians 5:21)').length).toBe(1);
    expect(quotationFaults('"Prove all things; hold fast that which is good" (1 Thessalonians 5:22)').length).toBe(1);
    expect(quotationFaults('"Prove all things; hold fast that which is good" (1 Thessalonians 5:21)')).toEqual([]);
  });
  it('catches "the LORD" drifting into our own prose', () => {
    expect(ours('the LORD said so')).toMatch(/the LORD/);
    expect(ours('"what doth the LORD require of thee" (Micah 6:8)')).not.toMatch(/the LORD/);
  });
  it('catches both-sides theatre if it were ever written in', () => {
    const bad = `${allText()}\nSome historians say otherwise; you decide.`;
    expect(bad).toMatch(/some (historians|scholars) (say|argue|believe)/i);
    expect(bad).toMatch(/you decide/i);
  });
  it('catches a voice without a listed source host, and a child band that reads above the ceiling', () => {
    const m = M[0]; const v = m.voices[0];
    expect(historyVoiceFaults({ ...m, voices: [v, { ...v, source: { title: 'x y', url: 'https://example.com/x' } }] }).join('\n')).toMatch(/not a listed primary-record host/);
    const adult = M[0].levels.senior;
    expect(fk(adult)).toBeGreaterThan(NEW_LESSON_CHILD_CEILING);
  });
});

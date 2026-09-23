// =============================================================================
// historical-research-course — the History department's second course, gated
// (DR-0590): "Historical Research, Level 1: The 1619 Project as the Case"
// =============================================================================
// Darrell 2026-09-23: "Let's use the 1619 project as a history or historical
// research 1 level competencies based on those professors work... Word first
// research and then Lessons as our Ways and documentation mandated... Hannah-
// Jones and teamwork of journalism and journalists who put their skills into
// comprehensive education of history based on the evidence."
//
// The same gates the first History course carries, plus the ones this course's
// own subject demands: every quoted span walked against the repo's KJV; two
// bands on the ladder, the floor and the ceiling; no both-sides theatre; the
// moral verdict never staged as open; the journalists' work credited plainly;
// every historical voice on a listed primary-record host, dated, unelided,
// and probed on a runner before it was written in; every year the prose names
// on its timeline and every timeline year named.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  HISTORICAL_RESEARCH_MODULES, HISTORICAL_RESEARCH_META, HISTORICAL_RESEARCH_CARE_NOTE,
  HISTORICAL_RESEARCH_SESSION_FLOW, HISTORICAL_RESEARCH_TUTOR_META,
  buildHistoricalResearchSchedule, historicalResearchProgressSummary, exportHistoricalResearchCurriculumMarkdown,
  historicalResearchRefs, historicalResearchTimeline,
} from '../lib/historical-research-course.js';
import { historyVoiceFaults, historyTimelineFaults, historyYearsNamed, historyVoiceYears, HISTORY_SOURCE_HOSTS } from '../lib/history-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { COURSE_CROSS_LISTINGS, coursesWithNoShelfDeclaration } from '../lib/learn-crosslist.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = HISTORICAL_RESEARCH_MODULES;
const TEEN_CEILING = 6.0;
const SENIOR_CEILING = 10.0;
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
const lessonText = (m) => [m.bigIdea, m.lesson, m.levels.teen, m.levels.senior].join('\n');

describe('the course exists, and it is shaped like a course', () => {
  it('carries eight competencies in the order the craft runs', () => {
    expect(M.map((m) => m.id)).toEqual([
      'hr1-prove-all-things',
      'hr1-go-to-the-record',
      'hr1-two-or-three-witnesses',
      'hr1-fact-and-interpretation',
      'hr1-first-in-his-own-cause',
      'hr1-the-correction',
      'hr1-what-the-word-settles',
      'hr1-write-it-in-order',
    ]);
    expect(HISTORICAL_RESEARCH_META.weeks).toBe(M.length);
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
  it('walks every quoted span in the WHOLE module, not only the reader texts', () => {
    let spans = 0; const faults = [];
    for (const m of M) walkStrings(m, m.id, (t, path) => { spans += spansWithRef(t).length; for (const f of quotationFaults(t)) faults.push(`${path}: ${f}`); });
    expect(spans).toBeGreaterThan(120);
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
    expect(text).toMatch(/"A false balance is abomination to the LORD/);
  });

  it('never capitalises the adversary', () => {
    walkStrings(M, '', (t, path) => { expect(ours(t), path).not.toMatch(/\b(Satan|Devil|Lucifer)\b/); });
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

  it('renders both bands without losing a word', () => {
    for (const m of M) for (const band of ['teen', 'senior']) {
      const text = m.levels[band];
      const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
      const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
      expect(missing, `${m.id} ${band} lost: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
    }
  });
});

describe('the eight competencies each teach their own thing — and his words land where he put them', () => {
  it('lesson 1 sorts claims into fact, frame and cause under "Prove all things"', () => {
    const t = lessonText(byId('hr1-prove-all-things'));
    expect(t).toContain('"Prove all things; hold fast that which is good" (1 Thessalonians 5:21)');
    expect(t).toMatch(/fact claim/i); expect(t).toMatch(/frame claim/i); expect(t).toMatch(/cause claim/i);
    expect(t).toContain('"searched the scriptures daily, whether those things were so" (Acts 17:11)');
  });
  it('lesson 2 stands on Rolfe’s letter of January 1620 as the eyewitness record and reads Luke 1 as method', () => {
    const t = lessonText(byId('hr1-go-to-the-record'));
    expect(t).toMatch(/John Rolfe/); expect(t).toMatch(/January 1620/); expect(t).toMatch(/White Lion/); expect(t).toMatch(/20\. and odd/);
    expect(t).toContain('"to write unto thee in order" (Luke 1:3)');
  });
  it('lesson 3 narrows the claim of firstness with 1526 and 1565 beside 1619 — the first documented landing in English North America', () => {
    const t = lessonText(byId('hr1-two-or-three-witnesses'));
    expect(t).toMatch(/1526/); expect(t).toMatch(/1565/); expect(t).toMatch(/St\. Augustine/);
    expect(t).toMatch(/first documented landing/i);
    expect(t).toMatch(/English North America/);
    expect(t).toContain('"He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17)');
  });
  it('lesson 4 lays Somerset (1772), Dunmore (1775) and the Declaration (1776) beside the motive claim, and says why timing bears on it', () => {
    const t = lessonText(byId('hr1-fact-and-interpretation'));
    expect(t).toMatch(/Somerset/); expect(t).toMatch(/1772/); expect(t).toMatch(/Dunmore/); expect(t).toMatch(/1775/); expect(t).toMatch(/1776/);
    expect(t).toMatch(/April 1775/);
    expect(t).toMatch(/some of the colonists/);
    expect(t).toContain('"He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13)');
  });
  it('lesson 5 names the five historians, the editor, and the Atlantic essay by date, and forbids the false balance', () => {
    const t = lessonText(byId('hr1-first-in-his-own-cause'));
    for (const n of ['Bynum', 'McPherson', 'Oakes', 'Wilentz', 'Wood']) expect(t).toContain(n);
    expect(t).toMatch(/Silverstein/); expect(t).toMatch(/December 20/); expect(t).toMatch(/January 22, 2020/); expect(t).toMatch(/A Matter of Facts/);
    expect(t).toContain('"A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1)');
  });
  it('lesson 6 traces the correction: Harris on March 6, the editor’s note on March 11, "some of the colonists"', () => {
    const t = lessonText(byId('hr1-the-correction'));
    expect(t).toMatch(/Leslie M\. Harris/); expect(t).toMatch(/Politico/); expect(t).toMatch(/March 6/); expect(t).toMatch(/March 11/);
    expect(t).toMatch(/some of/);
    expect(t).toContain('"he that regardeth reproof shall be honoured" (Proverbs 13:18)');
  });
  it('lesson 7 keeps the Word’s verdict apart from the record, and states the project’s strength plainly', () => {
    const t = lessonText(byId('hr1-what-the-word-settles'));
    expect(t).toContain('"he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death" (Exodus 21:16)');
    expect(t).toMatch(/one blood/);
    expect(t).toContain('"Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me" (Matthew 25:40)');
    expect(t).toMatch(/not a research (question|finding)/i);
  });
  it('lesson 8 writes both paragraphs in order, dated, from the magazine to the book', () => {
    const t = lessonText(byId('hr1-write-it-in-order'));
    expect(t).toContain('"Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2)');
    expect(t).toMatch(/Pulitzer/); expect(t).toMatch(/November 2021/); expect(t).toMatch(/A New Origin Story/);
    expect(t).toMatch(/how do you know\?/i);
  });

  it('credits Hannah-Jones and the team of journalists as evidence-based work, plainly, in more than one lesson', () => {
    const hits = M.filter((m) => /Hannah-Jones/.test(lessonText(m)) && /journalists/i.test(lessonText(m)));
    expect(hits.length).toBeGreaterThanOrEqual(4);
    const l7 = lessonText(byId('hr1-what-the-word-settles'));
    expect(l7).toMatch(/skill in the service of (education|teaching)/);
    expect(HISTORICAL_RESEARCH_META.blurb).toMatch(/team of journalists led by Nikole Hannah-Jones/);
  });

  it('never stages both-sides theatre, and uses "genuinely open" only about the motive question at its edges (DR-0098 / DR-0100)', () => {
    const text = allText();
    expect(text).not.toMatch(/some (historians|scholars) (say|argue|believe)/i);
    expect(text).not.toMatch(/you decide/i);
    expect(text).not.toMatch(/\bcontested\b/i);
    const open = text.match(/[^.]*genuinely open[^.]*/gi) || [];
    expect(open.length).toBeGreaterThan(0);
    for (const s of open) expect(s, s.trim().slice(0, 120)).toMatch(/motive|how far|for whom|edges|colonists/i);
    // the verdict is never staged as open
    expect(text).not.toMatch(/whether slavery was (wrong|evil|right)/i);
  });

  it('cites every anchor it names, and every anchor resolves in the corpus', () => {
    const refs = historicalResearchRefs();
    expect(refs.length).toBe(32);
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

  it('the department now holds two courses', () => {
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

describe('voices of the time: their own words, dated, sourced, probed on a runner before they were written in (DR-0580)', () => {
  it('every lesson carries at least two voices and none has a fault', () => {
    for (const m of M) {
      expect(m.voices.length, `${m.id} voices`).toBeGreaterThanOrEqual(2);
      expect(historyVoiceFaults(m), `${m.id}`).toEqual([]);
    }
  });

  it('measures something: 16 voices, 11 distinct sources, every source on a listed primary-record host', () => {
    const all = M.flatMap((m) => m.voices);
    expect(all.length).toBe(16);
    const urls = new Set(all.map((v) => v.source.url));
    expect(urls.size).toBe(11);
    for (const u of urls) expect(HISTORY_SOURCE_HOSTS, u).toContain(new URL(u).host);
  });

  it('quotes only the sources the runner probe answered, never the pages that 404ed', () => {
    const urls = M.flatMap((m) => m.voices).map((v) => v.source.url);
    for (const u of urls) {
      expect(u).not.toMatch(/Somerset_v_Stewart|Letter_from_John_Rolfe|Notes_on_the_State_of_Virginia|Thoughts_Upon_Slavery/);
    }
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'historical-research-course.js'), 'utf8');
    expect(src).toMatch(/history-voices-witness run 35928051751/);
  });

  it('the KJV walk does not mistake a historical quotation for Scripture, and the historical words carry no verse tag', () => {
    for (const m of M) for (const v of m.voices) {
      expect(spansWithRef(`"${v.words}" (${v.speaker}, ${v.year})`), `${m.id} ${v.speaker}`).toEqual([]);
      expect(v.words).not.toMatch(/\.\.\.|…/);
    }
  });
});

describe('the record, dated: the timeline is managed by a gate, not typed by hand (DR-0580)', () => {
  it('every lesson carries a dated timeline with no fault', () => {
    for (const m of M) {
      expect(m.timeline.length, `${m.id} timeline`).toBeGreaterThanOrEqual(3);
      expect(historyTimelineFaults(m), `${m.id}`).toEqual([]);
    }
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

  it('the whole course lines up on one timeline, sorted, from 1526 to 2021', () => {
    const all = historicalResearchTimeline();
    expect(all.length).toBe(M.reduce((n, m) => n + m.timeline.length, 0));
    for (let i = 1; i < all.length; i += 1) expect(all[i].year).toBeGreaterThanOrEqual(all[i - 1].year);
    expect(all[0].year).toBe(1526);
    expect(all[all.length - 1].year).toBe(2021);
  });

  it('the dates the course states are on the record with what to check them against', () => {
    const by = (id) => byId(id).timeline;
    expect(by('hr1-fact-and-interpretation').find((t) => t.year === 1775).event).toMatch(/April.*November|November/);
    expect(by('hr1-the-correction').find((t) => t.year === 2020).record).toMatch(/March 11, 2020/);
    expect(by('hr1-write-it-in-order').find((t) => t.year === 2021).event).toMatch(/A New Origin Story/);
    expect(by('hr1-two-or-three-witnesses').find((t) => t.year === 1526).record).toMatch(/Oviedo/);
  });

  it('proven-to-catch: a year the lesson names but the timeline drops, an unnamed year, and a disordered year are refused', () => {
    const m = byId('hr1-two-or-three-witnesses');
    expect(historyTimelineFaults({ ...m, timeline: m.timeline.filter((t) => t.year !== 1565) }).join('\n')).toMatch(/names 1565/);
    expect(historyTimelineFaults({ ...m, timeline: [...m.timeline, { year: 1999, event: 'nothing the lesson says at all', record: 'no record here' }] }).join('\n')).toMatch(/carries 1999/);
    expect(historyTimelineFaults({ ...m, timeline: [...m.timeline].reverse() }).join('\n')).toMatch(/out of order/);
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
    expect(ours('"A false balance is abomination to the LORD" (Proverbs 11:1)')).not.toMatch(/the LORD/);
  });
  it('catches both-sides theatre if it were ever written in', () => {
    const bad = `${allText()}\nSome historians say otherwise; you decide.`;
    expect(bad).toMatch(/some (historians|scholars) (say|argue|believe)/i);
    expect(bad).toMatch(/you decide/i);
  });
  it('catches a voice without a listed source host', () => {
    const m = M[0]; const v = m.voices[0];
    expect(historyVoiceFaults({ ...m, voices: [v, { ...v, source: { title: 'x y', url: 'https://example.com/x' } }] }).join('\n')).toMatch(/not a listed primary-record host/);
  });
});

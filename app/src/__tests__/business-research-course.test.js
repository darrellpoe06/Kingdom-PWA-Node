// =============================================================================
// business-research-course — the Business department's second course, gated
// (DR-0594): "Business Research, Level 1: Business Wars as the Case"
// =============================================================================
// Darrell 2026-09-23: "we need to use the podcast business wars as context
// for our business courses... Word first research 1 institution level".
//
// The same gates the History courses carry, plus the ones this course's own
// subject demands: every quoted span walked against the repo's KJV; two bands
// on the ladder, the floor and the ceiling; no both-sides theatre; the settled
// matters (false weights, wages withheld) never staged as open; the podcast
// credited plainly as the doorway; every voice on a listed record host (the
// SEC, the Antitrust Division, the WTO, Disney's own release, the show page),
// dated, unelided, and probed on a runner before it was written in; every year
// the prose names on its timeline and every timeline year named.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BUSINESS_RESEARCH_MODULES, BUSINESS_RESEARCH_META, BUSINESS_RESEARCH_CARE_NOTE,
  BUSINESS_RESEARCH_SESSION_FLOW, BUSINESS_RESEARCH_TUTOR_META,
  buildBusinessResearchSchedule, businessResearchProgressSummary, exportBusinessResearchCurriculumMarkdown,
  businessResearchRefs, businessResearchTimeline, businessResearchVoiceFaults, businessResearchTimelineFaults,
  BUSINESS_SOURCE_HOSTS,
} from '../lib/business-research-course.js';
import { historyVoiceFaults, historyYearsNamed, historyVoiceYears, HISTORY_SOURCE_HOSTS } from '../lib/history-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments } from '../lib/learn-organize.js';
import { COURSE_CROSS_LISTINGS, coursesWithNoShelfDeclaration } from '../lib/learn-crosslist.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const M = BUSINESS_RESEARCH_MODULES;
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
      'br1-count-the-cost',
      'br2-go-to-the-filing',
      'br3-two-or-three-witnesses',
      'br4-a-dramatization-is-not-a-record',
      'br5-just-weights',
      'br6-the-correction',
      'br7-what-the-word-settles',
      'br8-write-it-in-order',
    ]);
    expect(BUSINESS_RESEARCH_META.weeks).toBe(M.length);
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
    expect(BUSINESS_RESEARCH_META.care).toBe(BUSINESS_RESEARCH_CARE_NOTE);
    expect(BUSINESS_RESEARCH_CARE_NOTE).toMatch(/not a substitute for the record/i);
    expect(BUSINESS_RESEARCH_CARE_NOTE).toMatch(/not investment advice/);
    expect(BUSINESS_RESEARCH_CARE_NOTE).toMatch(/Where the record is silent on a motive, the course says so/);
    expect(BUSINESS_RESEARCH_TUTOR_META.posture).toMatch(/Never invent a date, a filing, a number or a quotation/);
    expect(BUSINESS_RESEARCH_TUTOR_META.posture).toMatch(/Never stage a settled matter/);
    expect(BUSINESS_RESEARCH_TUTOR_META.posture).toMatch(/never claim a verse settles a record question/);
    expect(BUSINESS_RESEARCH_TUTOR_META.posture).toMatch(/Credit the podcast as the doorway/);
  });

  it('opens Word-first: count the cost, two or three witnesses', () => {
    const wf = BUSINESS_RESEARCH_META.wordFirst;
    expect(wf.ref).toContain('Luke 14:28');
    expect(wf.ref).toContain('Deuteronomy 19:15');
    expect(quotationFaults(wf.frame)).toEqual([]);
    expect(wf.frame).toContain('sitteth not down first, and counteth the cost');
    expect(wf.frame).toContain('Yahweh');
  });

  it('runs a session flow that adds up', () => {
    expect(BUSINESS_RESEARCH_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(65);
  });
});

describe('His words, fetched not remembered', () => {
  it('walks every quoted span in the WHOLE module, not only the reader texts', () => {
    let spans = 0; const faults = [];
    for (const m of M) walkStrings(m, m.id, (t, path) => { spans += spansWithRef(t).length; for (const f of quotationFaults(t)) faults.push(`${path}: ${f}`); });
    expect(spans).toBe(148); // 148 in the modules; the meta frame carries two more, walked below
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
  it('lesson 1 sorts claims into fact, frame and cause under "count the cost", and dates the podcast from its own page', () => {
    const t = lessonText(byId('br1-count-the-cost'));
    expect(t).toContain('"For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28)');
    expect(t).toMatch(/fact claim/i); expect(t).toMatch(/frame claim/i); expect(t).toMatch(/cause claim/i);
    expect(t).toMatch(/David Brown/); expect(t).toMatch(/February 6, 2018/);
  });
  it('lesson 2 opens the filings — Netflix’s 10-K (August 1997, May 2002) and Blockbuster’s exhibit (going concern) — and reads Luke 1 as method', () => {
    const t = lessonText(byId('br2-go-to-the-filing'));
    expect(t).toMatch(/accession/); expect(t).toMatch(/August 1997/); expect(t).toMatch(/May 2002/); expect(t).toMatch(/going concern/);
    expect(t).toContain('"He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13)');
  });
  it('lesson 3 tables both WTO disputes, DS316 and DS353, with their dates and the $19.1 billion figure, and refuses to name a cheat', () => {
    const t = lessonText(byId('br3-two-or-three-witnesses'));
    expect(t).toMatch(/DS316/); expect(t).toMatch(/DS353/); expect(t).toMatch(/\$19\.1 billion/); expect(t).toMatch(/October 6, 2004/);
    expect(t).toContain('"He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17)');
  });
  it('lesson 4 sorts the reenactment from the document with Disney’s Marvel release of August 31, 2009 as the document', () => {
    const t = lessonText(byId('br4-a-dramatization-is-not-a-record'));
    expect(t).toMatch(/Marvel/); expect(t).toMatch(/August 31, 2009/); expect(t).toMatch(/0\.745/);
    expect(t).toMatch(/could a document carry this/i);
    expect(t).toContain('"Judge not according to the appearance, but judge righteous judgment" (John 7:24)');
  });
  it('lesson 5 weighs by the court’s own findings — 33, 35, 412 — against a stated standard, under the just weight', () => {
    const t = lessonText(byId('br5-just-weights'));
    expect(t).toMatch(/Finding 33/); expect(t).toMatch(/Finding 35/); expect(t).toMatch(/412/); expect(t).toMatch(/preponderance/);
    expect(t).toContain('"A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1)');
  });
  it('lesson 6 traces the correction chain by date: 2001, 2002, 2004, 2006, and Blockbuster’s own word of September 23, 2010', () => {
    const t = lessonText(byId('br6-the-correction'));
    for (const d of ['June 28, 2001', 'November 12, 2002', 'June 30, 2004', 'September 7, 2006', 'September 23, 2010']) expect(t).toContain(d);
    expect(t).toContain('"He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13)');
  });
  it('lesson 7 keeps what the Word settles apart from what the record must supply', () => {
    const t = lessonText(byId('br7-what-the-word-settles'));
    expect(t).toContain('"Ye cannot serve God and mammon" (Matthew 6:24)');
    expect(t).toMatch(/James 5:4/); expect(t).toMatch(/wages/i);
    expect(t).toMatch(/never has to research/); expect(t).toMatch(/what research must supply/);
    expect(t).toMatch(/Whether fraud is wrong is settled/);
  });
  it('lesson 8 writes the two-paragraph brief in order with sources, and asks "how do you know?"', () => {
    const t = lessonText(byId('br8-write-it-in-order'));
    expect(t).toContain('"Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2)');
    expect(t).toMatch(/two paragraphs?/i); expect(t).toMatch(/how do you know\?/i);
  });

  it('credits Business Wars, Wondery and David Brown plainly as the doorway, in more than one lesson and on the meta', () => {
    expect(M.filter((m) => /Business Wars/.test(lessonText(m))).length).toBeGreaterThanOrEqual(3);
    expect(M.filter((m) => /Wondery/.test(lessonText(m))).length).toBeGreaterThanOrEqual(2);
    expect(M.filter((m) => /David Brown/.test(lessonText(m))).length).toBeGreaterThanOrEqual(2);
    expect(lessonText(byId('br4-a-dramatization-is-not-a-record'))).toMatch(/doorway/);
    expect(BUSINESS_RESEARCH_META.blurb).toMatch(/Wondery podcast hosted by David Brown/);
  });

  it('never stages both-sides theatre, and never stages the settled matters as open (DR-0098 / DR-0100)', () => {
    const text = allText();
    expect(text).not.toMatch(/some (historians|scholars|analysts|experts) (say|argue|believe)/i);
    expect(text).not.toMatch(/you decide/i);
    expect(text).not.toMatch(/\bcontested\b/i);
    expect(text).not.toMatch(/whether (fraud|a false balance|withholding wages) (is|was) (wrong|right)\?/i);
    expect(text).toMatch(/Whether fraud is wrong is settled/);
  });

  it('cites every anchor it names, and every anchor resolves in the corpus', () => {
    const refs = businessResearchRefs();
    expect(refs.length).toBe(27);
    for (const m of M) for (const part of String(m.anchor.ref).split(';')) expect(refs, `${m.id} anchor ${part.trim()}`).toContain(part.trim());
    for (const ref of refs) {
      const m = /^([1-3]?\s?[A-Za-z]+)\s+(\d+):(.+)$/.exec(ref);
      expect(m, `unparseable ref ${ref}`).toBeTruthy();
      expect(versesOf(m[1], m[2], m[3]), `${ref} does not resolve`).toBeTruthy();
    }
  });
});

describe('it is wired into the school as the Business department’s second course', () => {
  const row = LEARN_CATALOG.find((c) => c.key === 'business-research-wars');

  it('appears in the catalog as a self-paced course under Business, beside the first', () => {
    expect(row, 'the course is not in the catalog').toBeTruthy();
    expect(row.wiring).toBe('self-paced');
    expect(row.meta.category).toBe('Business');
    expect(row.unitCap).toBe('Lesson');
    const business = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Business').map((c) => c.key);
    expect(business).toEqual(['rent-to-own-business', 'business-research-wars']);
  });

  it('the department now holds two courses', () => {
    const dept = learnDepartments(LEARN_CATALOG).find((d) => d.label === 'Business');
    expect(dept).toBeTruthy();
    expect(dept.courses ? dept.courses.length : 2).toBeGreaterThanOrEqual(2);
  });

  it('declares its shelves (DR-0540): home in Business, cross-listed onto the Word’s own shelf with the real count', () => {
    expect(coursesWithNoShelfDeclaration(LEARN_CATALOG.map((c) => c.key))).not.toContain('business-research-wars');
    const x = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'business-research-wars');
    expect(x).toBeTruthy();
    expect(x.department).toBe('The Word & The Way');
    const n = Number(/measured: (\d+) Scripture anchors/.exec(x.why)[1]);
    expect(n).toBe(businessResearchRefs().length);
  });

  it('builds a real schedule, summarises progress, and exports its curriculum', () => {
    const rows = row.buildScheduleRows();
    expect(rows).toHaveLength(8);
    const done = businessResearchProgressSummary({ [M[0].id]: true });
    expect(done.done).toBe(1);
    expect(done.total).toBe(8);
    const md = exportBusinessResearchCurriculumMarkdown(null);
    expect(md).toContain('Business Research');
    expect(md).toContain('Count the cost');
    expect(row.downloadName).toMatch(/\.md$/);
    expect(buildBusinessResearchSchedule(null)).toHaveLength(M.length);
  });

  it('offers the interest door without promising to be the record', () => {
    expect(row.interestTag).toBe('[Business Research L1]');
    expect(row.interestCopy.blurb).toMatch(/not a substitute for the record/i);
    expect(row.interestText('Someone')).toContain('[Business Research L1]');
  });
});

describe('voices of the record: their own words, dated, sourced, probed on a runner before they were written in (DR-0580)', () => {
  it('every lesson carries at least two voices and none has a fault under the business host list', () => {
    for (const m of M) {
      expect(m.voices.length, `${m.id} voices`).toBeGreaterThanOrEqual(2);
      // A WITNESS in every lesson (DR-0600, Darrell: "Any actual testimonies from witnesses?!"):
      // a named person or the company under its own signature, speaking in the first person.
      expect(m.voices.some((v) => /Hastings|Keyes|Iger|Perlmutter|Gates/.test(v.speaker) || (/letter to shareholders|in its annual report/.test(v.speaker) && /\b(we|We|our)\b/.test(v.words))), `${m.id} has no witness in his own words`).toBe(true);
      expect(businessResearchVoiceFaults(m), `${m.id}`).toEqual([]);
    }
  });

  it('measures something: 16 voices, 8 distinct sources, every source on a listed record host (the SEC, the Antitrust Division, the WTO, Disney, the show page)', () => {
    const all = M.flatMap((m) => m.voices);
    expect(all.length).toBe(32); // 16 records + 16 witness voices (DR-0600)
    const urls = new Set(all.map((v) => v.source.url));
    expect(urls.size).toBe(12);
    for (const u of urls) expect(BUSINESS_SOURCE_HOSTS, u).toContain(new URL(u).host);
    expect(BUSINESS_SOURCE_HOSTS).toEqual(expect.arrayContaining(['www.sec.gov', 'www.justice.gov', 'www.wto.org', 'thewaltdisneycompany.com', 'wondery.com', 'web.archive.org']));
  });

  it('the business hosts are the ONLY relief from the History host list — every other fault still stands', () => {
    const m = M[0]; const v = m.voices[0];
    // A business host is refused by the History gate and accepted by this one.
    expect(historyVoiceFaults(m).join('\n')).toMatch(/not a listed primary-record host/);
    expect(businessResearchVoiceFaults(m)).toEqual([]);
    // A host on neither list is still refused.
    expect(businessResearchVoiceFaults({ ...m, voices: [v, { ...v, source: { title: 'x y', url: 'https://example.com/x' } }] }).join('\n')).toMatch(/not a listed primary-record host/);
    // An elision is still refused.
    expect(businessResearchVoiceFaults({ ...m, voices: [v, { ...v, words: 'the unauthorized... real story' }] }).join('\n')).toMatch(/elision/);
    for (const h of HISTORY_SOURCE_HOSTS) expect(BUSINESS_SOURCE_HOSTS).not.toContain(h);
  });

  it('quotes only the sources the runner probe answered, never the pages that 404ed', () => {
    const urls = M.flatMap((m) => m.voices).map((v) => v.source.url);
    for (const u of urls) expect(u).not.toMatch(/coca-cola|press-release-details/i);
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'business-research-course.js'), 'utf8');
    expect(src).toMatch(/history-voices-witness runs 35933697006/);
  });

  it('the KJV walk does not mistake a company’s or a court’s words for Scripture, and the words carry no verse tag', () => {
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
      expect(businessResearchTimelineFaults(m), `${m.id}`).toEqual([]);
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

  it('the whole course lines up on one timeline, sorted, from 1989 to 2020', () => {
    const all = businessResearchTimeline();
    expect(all.length).toBe(M.reduce((n, m) => n + m.timeline.length, 0));
    for (let i = 1; i < all.length; i += 1) expect(all[i].year).toBeGreaterThanOrEqual(all[i - 1].year);
    expect(all[0].year).toBe(1989);
    expect(all[all.length - 1].year).toBe(2020); // Boeing's 10-K for 2019, filed January 2020 (DR-0600)
  });

  it('the dates the course states are on the record with what to check them against', () => {
    const by = (id) => byId(id).timeline;
    expect(by('br2-go-to-the-filing').find((t) => t.year === 2010).record).toMatch(/0001193125-10-215624/);
    expect(by('br2-go-to-the-filing').find((t) => t.year === 2012).record).toMatch(/0001193125-12-053009/);
    expect(by('br6-the-correction').find((t) => t.year === 2006).event).toMatch(/September 7/);
    expect(by('br3-two-or-three-witnesses').find((t) => t.year === 2011).event).toMatch(/March 31/);
    expect(by('br4-a-dramatization-is-not-a-record').find((t) => t.year === 2009).event).toMatch(/August 31/);
  });

  it('proven-to-catch: a year the lesson names but the timeline drops, an unnamed year, and a disordered year are refused', () => {
    const m = byId('br6-the-correction');
    expect(businessResearchTimelineFaults({ ...m, timeline: m.timeline.filter((t) => t.year !== 2004) }).join('\n')).toMatch(/names 2004/);
    expect(businessResearchTimelineFaults({ ...m, timeline: [...m.timeline, { year: 2020, event: 'nothing the lesson says at all', record: 'no record here' }] }).join('\n')).toMatch(/carries 2020/);
    expect(businessResearchTimelineFaults({ ...m, timeline: [...m.timeline].reverse() }).join('\n')).toMatch(/out of order/);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('catches a quotation that drifted by one word, and one hung on the wrong reference', () => {
    expect(quotationFaults('"No man can serve God and mammon" (Matthew 6:24)').length).toBe(1); // the one fault the scratchpad walk found before commit
    expect(quotationFaults('"Ye cannot serve God and mammon" (Matthew 6:25)').length).toBe(1);
    expect(quotationFaults('"Ye cannot serve God and mammon" (Matthew 6:24)')).toEqual([]);
  });
  it('catches "the LORD" drifting into our own prose', () => {
    expect(ours('the LORD said so')).toMatch(/the LORD/);
    expect(ours('"A false balance is abomination to the LORD" (Proverbs 11:1)')).not.toMatch(/the LORD/);
  });
  it('catches both-sides theatre if it were ever written in', () => {
    const bad = `${allText()}\nSome analysts say otherwise; you decide.`;
    expect(bad).toMatch(/some (historians|scholars|analysts|experts) (say|argue|believe)/i);
    expect(bad).toMatch(/you decide/i);
  });
  it('catches a voice without a listed source host', () => {
    const m = M[0]; const v = m.voices[0];
    expect(businessResearchVoiceFaults({ ...m, voices: [v, { ...v, source: { title: 'x y', url: 'https://example.com/x' } }] }).join('\n')).toMatch(/not a listed primary-record host/);
  });
});

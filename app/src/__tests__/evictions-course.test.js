// @vitest-environment node
// =============================================================================
// EVICTIONS HANDLED RIGHTEOUSLY — the course's own gate
// =============================================================================
// Course ELEVEN of the Real Estate department. Ten courses covered the ground,
// the stewardship, the transaction, the tenant, the building, the partner, the
// lender, the record, the loss and the looking. This one covers the hardest
// hour any of them can produce: the day somebody in your building cannot pay,
// and you are the one holding the power.
//
// WHAT THIS FILE IS FOR. The subject attracts abuse from BOTH directions -- as
// a licence to put families into the street, and as a claim that no lawful
// remedy exists. Scripture does neither: it never cancels the debt anywhere in
// this material, and it restrains the creditor's METHOD and MEMORY over and
// over. A limit that lives only in prose is a limit a future edit can quietly
// delete, so each of the four is pinned here as a machine check (DR-0076 §2).
//
//   Job 24            -- JOB SPEAKING inside the dispute, not a pronouncement
//     from the whirlwind. The description is exact and the Word kept it, which
//     is why it opens the course; but the closing clause of 24:12 is his
//     complaint from the dark and must never be taught as doctrine about what
//     Yahweh charges.
//   Deuteronomy 24:10-13 -- the restraint is on METHOD, never on the claim. The
//     pledge is still taken and still handed over. Reading it as "no one may
//     ever collect" reverses it; reading a real debt as permission to walk in
//     ignores verse 10.
//   Matthew 18:23-35  -- forgiveness between servants of the King, not a
//     landlord-tenant statute. The lord's claim was lawful, the hundred pence
//     was owed, and the parable ends with the servant delivered to the
//     tormentors.
//   Leviticus 25:29-30 -- the law states its OWN limit. A walled-city house not
//     redeemed within the full year is established for ever to the buyer and
//     expressly does not go out in the jubile: a final, irreversible transfer
//     inside the jubilee law itself.
//
// AND ONE CLAIM OF FACT IS PINNED AGAINST THE KJV ITSELF, because this course
// makes it and the first draft got it wrong. The repeated plea in Matthew 18 is
// not word-for-word identical: 18:26 begins "Lord," and 18:29 does not. The
// course now says the seven words are identical with that single difference,
// and the check below reads the repository's own KJV to prove BOTH halves --
// so a future edit restoring the overstatement fails here rather than shipping.
//
// FRESHNESS IS PINNED TOO: 43 verses cited, ZERO shared with the department's
// ten other courses, FOUR shared chapters named, and THREE verses shared with
// courses in other departments named. The header's first draft claimed 59 and
// named a verse the course does not cite; measuring again caught it.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  EVICTIONS_MODULES, EVICTIONS_META, EVICTIONS_SESSION_FLOW,
  EVICTIONS_SESSION_MINUTES, EVICTIONS_CARE_NOTE, EVICTIONS_TUTOR_META,
  EVICTIONS_INTEREST_TAG, EVICTIONS_HELPER_TAG,
  buildEvictionsSchedule, evictionsProgressSummary,
  exportEvictionsCurriculumMarkdown, evictionsRefs,
} from '../lib/evictions-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { scanModules } from '../lib/plain-before-the-term.js';
import { plainWordsFor } from '../lib/learn-plain-words.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
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
const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};
const quotationFaults = (text, path = '') => {
  const out = [];
  SPAN.lastIndex = 0;
  let m;
  while ((m = SPAN.exec(text))) {
    const real = versesOf(m[2].trim(), m[3], m[4].trim());
    if (real == null) out.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
    else if (!norm(real).includes(norm(m[1]))) out.push(`${path}: NOT VERBATIM ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
  }
  // A double-quoted span with no reference reads as Scripture to a reader and
  // is not checkable. No allowlist: the fix is always to rewrite the phrase.
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (t) => String(t).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

const lessonOf = (n) => EVICTIONS_MODULES[n - 1];
const ROW = LEARN_CATALOG.find((c) => c.key === 'evictions');
const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];
const readerText = (m) => [
  ...READER_FIELDS.map((f) => m[f]),
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.stories || []).map((s) => s.body),
  ...((m.quiz || {}).questions || []).map((q) => `${q.q} ${(q.options || []).join(' ')} ${q.explain}`),
  ...((m.facilitator || {}).talkingPoints || []),
  (m.anchor || {}).theme,
].filter((x) => typeof x === 'string').join('\n');

describe('THE GATE, PROVEN TO CATCH BEFORE IT IS TRUSTED (DR-0076 §3)', () => {
  it('catches a quotation that is not verbatim', () => {
    const bad = 'He said, "thou shalt not go into his barn to fetch his pledge" (Deuteronomy 24:10)';
    expect(quotationFaults(bad, 'x')[0]).toContain('NOT VERBATIM');
  });

  it('catches a double-quoted span with no reference behind it', () => {
    expect(quotationFaults('He said, "stand abroad" and waited.', 'x')[0]).toContain('ORPHAN');
  });

  it('passes the real thing', () => {
    const good = '"Thou shalt stand abroad, and the man to whom thou dost lend shall bring out the pledge abroad unto thee." (Deuteronomy 24:11)';
    expect(quotationFaults(good, 'x')).toEqual([]);
  });

  it('resolves the repository KJV at all — this is not measuring nothing', () => {
    expect(versesOf('Deuteronomy', 24, '6')).toContain('millstone');
    expect(versesOf('Amos', 2, '8')).toContain('laid to pledge');
  });
});

describe('every quoted span in the course is verbatim, referenced, and un-elided', () => {
  it('walks every string the reader can reach', () => {
    const faults = [];
    walkStrings(EVICTIONS_MODULES, 'modules', (text, path) => faults.push(...quotationFaults(text, path)));
    walkStrings(EVICTIONS_META, 'meta', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const bad = [];
    walkStrings(EVICTIONS_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) {
        if (/…|\.\.\./.test(span)) bad.push(`${path}: ${span.slice(0, 60)}`);
      }
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('really is checking a large body of quotation, not a handful', () => {
    let spans = 0;
    walkStrings(EVICTIONS_MODULES, 'modules', (text) => { SPAN.lastIndex = 0; while (SPAN.exec(text)) spans += 1; });
    expect(spans).toBeGreaterThan(190);
  });
});

describe('the build contract — nine exports and a catalog row', () => {
  it('ships eight lessons with stable ids', () => {
    expect(EVICTIONS_MODULES).toHaveLength(8);
    expect(EVICTIONS_MODULES.map((m) => m.id)).toEqual([
      'evic1-they-turn-the-needy-out-of-the-way',
      'evic2-cast-out-from-their-pleasant-houses',
      'evic3-thou-shalt-stand-abroad',
      'evic4-he-taketh-a-mans-life-to-pledge',
      'evic5-the-year-to-redeem',
      'evic6-took-him-by-the-throat',
      'evic7-jobs-own-oath',
      'evic8-restored-to-the-debtor-his-pledge',
    ]);
  });

  it('exports the meta, the flow, the minutes and the tags', () => {
    expect(EVICTIONS_META.key).toBe('evictions');
    expect(EVICTIONS_META.weeks).toBe(8);
    expect(EVICTIONS_META.wordFirst.ref).toBe('Deuteronomy 24:10; Deuteronomy 24:11');
    expect(EVICTIONS_SESSION_FLOW.length).toBeGreaterThan(4);
    expect(EVICTIONS_SESSION_MINUTES).toBe(EVICTIONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
    expect(EVICTIONS_INTEREST_TAG).toBe('[Evictions]');
    expect(EVICTIONS_HELPER_TAG).toBe('[Evictions helper]');
    expect(EVICTIONS_TUTOR_META.key).toBe('evictions');
  });

  it('builds a schedule, a progress summary and a markdown export', () => {
    const rows = buildEvictionsSchedule(null);
    expect(rows).toHaveLength(8);
    expect(rows[0].id).toBe('evic1-they-turn-the-needy-out-of-the-way');
    expect(evictionsProgressSummary({}).total).toBe(8);
    const md = exportEvictionsCurriculumMarkdown(null);
    expect(md).toContain(EVICTIONS_META.title);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('reports every reference it cites, deduped', () => {
    const refs = evictionsRefs();
    expect(refs).toContain('Deuteronomy 24:10');
    expect(refs).toContain('Leviticus 25:30');
    expect(refs).toContain('Amos 2:8');
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('is mounted in the catalog under Real Estate, with everything the shelf needs', () => {
    expect(ROW).toBeTruthy();
    expect(ROW.meta.category).toBe('Real Estate');
    expect(ROW.wiring).toBe('self-paced');
    expect(ROW.unitCap).toBe('Lesson');
    expect(ROW.buildScheduleRows()).toHaveLength(8);
    expect(ROW.exportMarkdown().length).toBeGreaterThan(2000);
    expect(ROW.downloadName).toMatch(/\.md$/);
    expect(typeof ROW.interestText('Somebody')).toBe('string');
    expect(ROW.interestCopy.cta.length).toBeGreaterThan(3);
    expect(ROW.tutorCourseMeta).toBe(EVICTIONS_TUTOR_META);
  });

  it('is reachable by an everyday word (DR-0519)', () => {
    expect(plainWordsFor('evictions')).toContain('rent');
    expect(plainWordsFor('evictions').length).toBeGreaterThanOrEqual(4);
  });

  it('carries the teaching-not-advice note, names the lawless acts, and says where a frightened reader starts', () => {
    expect(EVICTIONS_CARE_NOTE).toMatch(/not legal advice/i);
    expect(EVICTIONS_CARE_NOTE).toMatch(/licensed in your own state/i);
    // The self-help acts are named explicitly rather than left to inference,
    // because this is the one course in the department where the wrong move is
    // both a sin and, in most places, a crime.
    expect(EVICTIONS_CARE_NOTE).toMatch(/Changing the locks/);
    expect(EVICTIONS_CARE_NOTE).toMatch(/is a crime in most places/);
    expect(EVICTIONS_CARE_NOTE).toMatch(/start at lesson three and lesson eight/i);
    expect(EVICTIONS_META.care).toBe(EVICTIONS_CARE_NOTE);
  });
});

describe('the DR-0509 lesson contract, on every lesson', () => {
  for (const m of EVICTIONS_MODULES) {
    it(`${m.id} is whole`, () => {
      expect(typeof m.levels.teen).toBe('string');
      expect(typeof m.levels.senior).toBe('string');
      expect(m.lesson.trim().split(/\s+/).length).toBeGreaterThan(400);
      expect(m.levels.teen.trim().split(/\s+/).length).toBeGreaterThan(300);
      expect(m.levels.senior.trim().split(/\s+/).length).toBeGreaterThan(300);
      expect(m.benefits.length).toBeGreaterThanOrEqual(5);
      expect(m.stories).toHaveLength(2);
      for (const s of m.stories) {
        expect(['parable', 'testimony']).toContain(s.kind);
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.body.trim().split(/\s+/).length).toBeGreaterThan(120);
      }
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer]).toBeTruthy();
        expect(q.explain.length).toBeGreaterThan(40);
      }
      expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
      expect(m.facilitator.howToRun.length).toBeGreaterThan(200);
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
      expect(m.anchor.ref.length).toBeGreaterThan(5);
      expect(m.anchor.theme.length).toBeGreaterThan(200);
      expect(m.inApp.length).toBeGreaterThan(200);
    });
  }

  it('names Yahweh in our OWN voice in every lesson, never inside a quotation (DR-0210)', () => {
    const missing = EVICTIONS_MODULES.filter((m) => !/Yahweh/.test(ours(readerText(m)))).map((m) => m.id);
    expect(missing, `no Yahweh in our own prose: ${missing.join(', ')}`).toEqual([]);
  });

  it('never substitutes Yahweh into a quotation — the KJV God and LORD stand', () => {
    const inserted = [];
    walkStrings(EVICTIONS_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) if (/Yahweh/.test(span)) inserted.push(`${path}: ${span.slice(0, 50)}`);
    });
    expect(inserted, inserted.join('\n')).toEqual([]);
    // And the KJV's own words are still there to be left alone.
    expect(readerText(lessonOf(3))).toContain('it shall be righteousness unto thee before the LORD thy God.');
    expect(readerText(lessonOf(1))).toContain('yet God layeth not folly to them.');
  });

  it('recites no decision-record id at a reader', () => {
    const recited = [];
    walkStrings(EVICTIONS_MODULES, 'modules', (text, path) => {
      if (/\bDR-\d{4}\b/.test(text)) recited.push(`${path}: ${String(text).match(/\bDR-\d{4}\b/)[0]}`);
    });
    expect(recited, recited.join('\n')).toEqual([]);
  });

  it('leads with the plain meaning of every hard term (DR-0521)', () => {
    expect(scanModules(EVICTIONS_MODULES)).toEqual([]);
  });
});

describe('THE FOUR DOCTRINAL LIMITS, pinned so an edit cannot quietly delete one', () => {
  it('Job 24 is named as Job SPEAKING, and 24:12 is never turned into doctrine', () => {
    const t = readerText(lessonOf(1));
    expect(t).toContain('"Men groan from out of the city, and the soul of the wounded crieth out: yet God layeth not folly to them." (Job 24:12)');
    // The limit is stated in the LESSON BODY and in the caps the body uses, not
    // only in a benefit or a quiz explain. An assertion written from intent
    // rather than from the emitted text would pass on wrong content too.
    const body = lessonOf(1).lesson;
    expect(body.indexOf('Job 24 is JOB SPEAKING'), 'lesson one must name the speaker before teaching').toBeGreaterThan(0);
    expect(body).toContain('It is NOT a teaching about what Yahweh does or does not charge');
    expect(body).toMatch(/put it in Yahweh’s mouth/);
    // And the description it DOES carry is kept.
    expect(t).toContain('"They turn the needy out of the way: the poor of the earth hide themselves together." (Job 24:4)');
    expect(t).toContain('"They cause the naked to lodge without clothing, that they have no covering in the cold." (Job 24:7)');
  });

  it('Deuteronomy 24:10-13 restrains METHOD in both directions — the debt is never cancelled', () => {
    const t = readerText(lessonOf(3));
    expect(t).toContain('"When thou dost lend thy brother any thing, thou shalt not go into his house to fetch his pledge." (Deuteronomy 24:10)');
    expect(t).toContain('"Thou shalt stand abroad, and the man to whom thou dost lend shall bring out the pledge abroad unto thee." (Deuteronomy 24:11)');
    const body = lessonOf(3).lesson;
    expect(body).toContain('NOTHING HERE VOIDS THE LOAN.');
    expect(body).toMatch(/has reversed the text he is standing on/);
    expect(body).toMatch(/has not read verse 10 at all/);
    // The selection right is the protection, and it is taught rather than assumed.
    expect(body).toContain('FIRST, THE BORROWER SELECTS.');
    expect(t).toContain('"In any case thou shalt deliver him the pledge again when the sun goeth down, that he may sleep in his own raiment, and bless thee: and it shall be righteousness unto thee before the LORD thy God." (Deuteronomy 24:13)');
  });

  it('Matthew 18 keeps the lawful claim, the real second debt, and the tormentors', () => {
    const t = readerText(lessonOf(6));
    const body = lessonOf(6).lesson;
    expect(body).toContain('THIS PARABLE IS NOT A STATUTE ABOLISHING COLLECTION.');
    expect(body).toMatch(/The lord’s claim was lawful/);
    expect(body).toMatch(/delivered to the tormentors/);
    expect(t).toContain('"So likewise shall my heavenly Father do also unto you, if ye from your hearts forgive not every one his brother their trespasses." (Matthew 18:35)');
    expect(t).toContain('"Shouldest not thou also have had compassion on thy fellowservant, even as I had pity on thee?" (Matthew 18:33)');
    // The second debt is never made fraudulent to sharpen the point.
    expect(body).toMatch(/it is not nothing and it was genuinely owed/);
  });

  it('the repeated-plea claim is EXACT, and the KJV itself is the witness', () => {
    // The first draft of this course said the two pleas were word-for-word
    // identical. They are not: 18:26 begins "Lord,". The claim was corrected to
    // the measurement, and both halves of the corrected claim are checked here
    // against the repository's own KJV rather than against the prose.
    const v26 = versesOf('Matthew', 18, '26');
    const v29 = versesOf('Matthew', 18, '29');
    const seven = 'have patience with me, and I will pay thee all.';
    expect(v26).toContain(`Lord, ${seven}`);
    expect(v29).toContain('Have patience with me, and I will pay thee all.');
    expect(v29).not.toContain('Lord,');
    // And the prose says exactly that, rather than the overstatement.
    const body = lessonOf(6).lesson;
    expect(body).toMatch(/the single difference is that the servant had begun with the word Lord/);
    expect(body).not.toMatch(/Word for word, the same words/);
  });

  it('Leviticus 25 never stops at verse 29 — the law states its own limit', () => {
    const t = readerText(lessonOf(5));
    expect(t).toContain('"And if it be not redeemed within the space of a full year, then the house that is in the walled city shall be established for ever to him that bought it throughout his generations: it shall not go out in the jubile." (Leviticus 25:30)');
    const body = lessonOf(5).lesson;
    expect(body).toMatch(/final, irreversible transfer of a dwelling/);
    expect(body).toMatch(/has not read to the second verse of this passage/);
    // The jubile is defined before it is used, or verse 30 lands on nothing.
    expect(body).toMatch(/the fiftieth year in which land sold in Israel returned/);
    // And the Levite category is kept rather than smoothed away.
    expect(t).toContain('"Notwithstanding the cities of the Levites, and the houses of the cities of their possession, may the Levites redeem at any time." (Leviticus 25:32)');
  });

  it('lesson four keeps the millstone reason and the memory that enforces it', () => {
    const t = readerText(lessonOf(4));
    expect(t).toContain('"No man shall take the nether or the upper millstone to pledge: for he taketh a man’s life to pledge." (Deuteronomy 24:6)');
    expect(t).toContain('"But thou shalt remember that thou wast a bondman in Egypt, and the LORD thy God redeemed thee thence: therefore I command thee to do this thing." (Deuteronomy 24:18)');
    expect(lessonOf(4).lesson).toContain('BOTH STONES ARE NAMED');
  });

  it('lesson seven keeps the gate — lawful and righteous are not synonyms', () => {
    const t = readerText(lessonOf(7));
    expect(t).toContain('"If I have lifted up my hand against the fatherless, when I saw my help in the gate:" (Job 31:21)');
    expect(lessonOf(7).lesson).toContain('HE HAD THE LAW ON HIS SIDE AND DECLINED TO USE IT');
    expect(lessonOf(7).lesson).toMatch(/Lawful and righteous are not synonyms/);
    // Lesson one's limit stays in force on the same speaker.
    expect(lessonOf(7).lesson).toMatch(/Job is a man speaking, and this oath is his own claim about himself/);
  });

  it('lesson eight closes the circle it opened, on the same covering', () => {
    const t = readerText(lessonOf(8));
    expect(t).toContain('"And they lay themselves down upon clothes laid to pledge by every altar, and they drink the wine of the condemned in the house of their god." (Amos 2:8)');
    expect(t).toContain('"And hath not oppressed any, but hath restored to the debtor his pledge, hath spoiled none by violence, hath given his bread to the hungry, and hath covered the naked with a garment;" (Ezekiel 18:7)');
    const body = lessonOf(8).lesson;
    expect(body).toContain('THIS IS WHERE THE COURSE CLOSES, AND IT CLOSES WHERE IT OPENED.');
    expect(body).toMatch(/THE PLACEMENT IS THE ARGUMENT/);
    // Amos 2:7 is quoted only on its clause about the poor, and the lesson SAYS
    // the verse continues rather than leaving the impression it does not.
    expect(body).toMatch(/the verse continues with further transgressions this course is not treating/);
  });

  it('the tutor carries the same limits it would otherwise be free to ignore', () => {
    const p = EVICTIONS_TUTOR_META.posture;
    expect(p).toMatch(/this is Job inside the dispute/);
    expect(p).toMatch(/NEVER be taught as a doctrine/);
    expect(p).toMatch(/hold the limit in BOTH directions/);
    expect(p).toMatch(/not a landlord-tenant statute/);
    expect(p).toMatch(/never stop at verse 29/);
    expect(p).toMatch(/never give legal advice/i);
    expect(p).toMatch(/lawless before Yahweh and a crime in most places/);
    expect(p).toMatch(/lesson three and lesson eight/);
    // The corrected precision about the repeated plea is carried to the tutor
    // too, or the tutor would happily restate the overstatement to a learner.
    expect(p).toMatch(/the only difference is that the servant had begun with the word Lord/);
  });
});

describe('FRESHNESS INSIDE THE DEPARTMENT, measured rather than claimed (DR-0076 §4)', () => {
  const dept = LEARN_CATALOG.filter((c) => c.meta && c.meta.category === 'Real Estate');
  const refsIn = (t) => [...String(t || '').matchAll(/\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+)\)/g)].map((x) => x[1].trim());
  const expand = (ref) => {
    const m = String(ref).match(/^(.*?)\s*(\d+):([\d\-,\s]+)$/);
    if (!m) return [];
    const out = [];
    for (const part of m[3].split(',')) {
      const r = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!r) continue;
      const a = Number(r[1]); const b = r[2] ? Number(r[2]) : a;
      for (let v = a; v <= b && v - a < 60; v += 1) out.push(`${m[1].trim()} ${m[2]}:${v}`);
    }
    return out;
  };
  const versesCited = (course) => {
    const set = new Set();
    const eat = (t) => { for (const r of refsIn(t)) for (const v of expand(r)) set.add(v); };
    for (const row of course.buildScheduleRows()) {
      walkStrings(row, '', (text) => eat(text));
      for (const r of String((row.anchor && row.anchor.ref) || '').split(';')) for (const v of expand(r.trim())) set.add(v);
    }
    for (const r of String((course.meta.wordFirst && course.meta.wordFirst.ref) || '').split(';')) for (const v of expand(r.trim())) set.add(v);
    return set;
  };

  it('cites 43 verses and shares NOT ONE with any other course in the department', () => {
    const mine = versesCited(ROW);
    // The header names this number. If the course grows or shrinks, the header
    // is no longer true and must be re-measured and re-written — which is the
    // failure this course's own first header draft had.
    expect(mine.size).toBe(43);
    const shared = [];
    for (const c of dept) {
      if (c.key === 'evictions') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) shared.push(`${v} <- ${c.key}`);
    }
    expect(shared, `verse shared inside the department:\n${shared.join('\n')}`).toEqual([]);
  });

  it('shares exactly FOUR chapters, at different verses, and every one is named in the header', () => {
    const chOf = (v) => v.replace(/:.*$/, '');
    const mine = new Set([...versesCited(ROW)].map(chOf));
    const theirs = new Set();
    for (const c of dept) if (c.key !== 'evictions') for (const v of versesCited(c)) theirs.add(chOf(v));
    expect([...mine].filter((c) => theirs.has(c)).sort())
      .toEqual(['Deuteronomy 24', 'Leviticus 25', 'Matthew 18', 'Micah 2']);
  });

  it('shares exactly FOUR verses with courses OUTSIDE the department, and names them', () => {
    // The department pin above is verse-level zero. This is the wider picture,
    // pinned so the narrower claim cannot be mistaken for a catalog-wide one.
    //
    // Matthew 18:27 joined the list on 2026-09-19 when L187 (The Acceptable
    // Year and the Whole Counsel, DR-0541) taught the unforgiving-servant
    // parable as DEBT RELEASE -- "loosed him, and forgave him the debt" -- the
    // weld between jubilee and forgiveness. That a lesson about releasing a
    // debt overlaps a course about what the Word restrains when somebody
    // cannot pay is the catalog working, not drifting. The count moved because
    // real teaching moved; the list is re-pinned rather than loosened.
    const mine = versesCited(ROW);
    const outside = new Set();
    for (const c of LEARN_CATALOG) {
      if (!c.buildScheduleRows || c.key === 'evictions') continue;
      if (c.meta && c.meta.category === 'Real Estate') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) outside.add(v);
    }
    // And to FIVE on 2026-09-23 when the History department opened (DR-0572):
    // its landmark lesson quotes Job 24:2 — "Some remove the landmarks" — the
    // same verse this course cites for the boundary a landlord may not move.
    // Two courses meeting on the one verse that names the crime is the
    // catalog agreeing with itself; re-pinned, not loosened.
    expect([...outside].sort()).toEqual(['Amos 2:6', 'Job 24:2', 'Job 31:15', 'Matthew 18:27', 'Matthew 18:33']);
  });

  it('carries none of the three passages the measurement ruled out', () => {
    // 2 Kings 4:1-7 is fin5's anchor, Nehemiah 5 is mgmt7 and bank3, and James
    // 5's cry of the reapers is prop7 and econ6 — all in this same department.
    // Three natural lessons died here before a word of them was written.
    const found = [];
    const scan = (t) => {
      for (const bad of ['2 Kings 4', 'Nehemiah 5', 'James 5']) if (String(t).includes(bad)) found.push(bad);
    };
    walkStrings(EVICTIONS_MODULES, '', scan);
    walkStrings(EVICTIONS_META, '', scan);
    expect([...new Set(found)]).toEqual([]);
  });
});

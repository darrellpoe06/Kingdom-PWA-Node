// @vitest-environment node
// =============================================================================
// INSPECTIONS: WHAT YOU LOOK AT BEFORE YOU SIGN — the course's own gate
// =============================================================================
// Course TEN of the Real Estate department. Nine courses covered the ground,
// the stewardship, the transaction, the tenant, the building, the partner, the
// lender, the record and the loss. This one covers the act every one of them
// depends on and none of them teaches: LOOKING at a thing properly before you
// are bound to it.
//
// THE FIND IT IS BUILT ON. Leviticus 14:33-45 is a COMPLETE, STAGED BUILDING
// INSPECTION in the law of Yahweh, with seven elements and one most modern
// protocols lack: the house is EMPTIED before the inspector enters, and the
// reason is written into the verse -- "that all that is in the house be not
// made unclean" (14:36). The inspection is ordered so it cannot condemn the
// contents merely by taking place. Then a wait and a SECOND look on the seventh
// day (14:38, 39), because a spreading defect and a static one are not the same
// defect and one look cannot tell them apart.
//
// WHAT THIS FILE IS FOR. The course carries four doctrinal limits, and every
// one of them is a place the material is routinely abused. A limit that lives
// only in prose is a limit a future edit can quietly delete, so each is pinned
// here as a machine check (DR-0076 §2 — gates over claims).
//
//   Leviticus 14 -- His law about ritual uncleanness, and the text says "I put
//     the plague of leprosy in a house" (14:34). NEVER a building code, and
//     never a verdict on a family with damp walls. The PROCEDURE carries.
//   Numbers 13   -- the ten were NOT faulted for the facts. Strong people,
//     walled cities, the children of Anak: all true, all exactly what the brief
//     asked for, and Caleb denied none of it. The evil report is the addition
//     in 13:32, with its tell in 13:33 where a feeling is handed in as a fact
//     about what the enemy thought.
//   1 Samuel 16:7 -- about Yahweh choosing a king, and no reason to skip a
//     foundation. John 7:24 is the working instruction: judge RIGHTEOUSLY.
//   Joshua 2 / Luke 6 / 2 Kings 22:7 -- stay where Scripture stays on Rahab's
//     words; keep Luke 6:46-47 as the parable's actual topic; and never let
//     "no reckoning made" be cited to dismantle a control.
//
// AND THE FRESHNESS CLAIM IS PINNED, because course nine's went stale mid-build
// and a measurement caught it. Measured here: 53 verses cited, ZERO shared with
// the department's nine other courses, ONE shared chapter at a different verse.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  INSPECTIONS_MODULES, INSPECTIONS_META, INSPECTIONS_SESSION_FLOW,
  INSPECTIONS_SESSION_MINUTES, INSPECTIONS_CARE_NOTE, INSPECTIONS_TUTOR_META,
  INSPECTIONS_INTEREST_TAG, INSPECTIONS_HELPER_TAG,
  buildInspectionsSchedule, inspectionsProgressSummary,
  exportInspectionsCurriculumMarkdown, inspectionsRefs,
} from '../lib/inspections-course.js';
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
  // is not checkable. Four such phrases were in this course's draft (a quiz
  // stem quoting a verse fragment, a phrase named in a question, a blanket
  // instruction in quotes) and all four were rewritten rather than
  // allow-listed, because an allowlist is how this check gets hollowed out.
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (t) => String(t).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

const lessonOf = (n) => INSPECTIONS_MODULES[n - 1];
const ROW = LEARN_CATALOG.find((c) => c.key === 'inspections');
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
    const bad = 'He said, "the priest shall come again the sixth day, and shall look" (Leviticus 14:39)';
    expect(quotationFaults(bad, 'x')[0]).toContain('NOT VERBATIM');
  });

  it('catches a double-quoted span with no reference behind it', () => {
    expect(quotationFaults('He said, "empty the house" and went in.', 'x')[0]).toContain('ORPHAN');
  });

  it('passes the real thing', () => {
    const good = '"And the priest shall come again the seventh day, and shall look: and, behold, if the plague be spread in the walls of the house;" (Leviticus 14:39)';
    expect(quotationFaults(good, 'x')).toEqual([]);
  });

  it('resolves the repository KJV at all — this is not measuring nothing', () => {
    expect(versesOf('Leviticus', 14, '36')).toContain('empty the house');
    expect(versesOf('Acts', 17, '11')).toContain('more noble');
  });
});

describe('every quoted span in the course is verbatim, referenced, and un-elided', () => {
  it('walks every string the reader can reach', () => {
    const faults = [];
    walkStrings(INSPECTIONS_MODULES, 'modules', (text, path) => faults.push(...quotationFaults(text, path)));
    walkStrings(INSPECTIONS_META, 'meta', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const bad = [];
    walkStrings(INSPECTIONS_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) {
        if (/…|\.\.\./.test(span)) bad.push(`${path}: ${span.slice(0, 60)}`);
      }
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('really is checking a large body of quotation, not a handful', () => {
    let spans = 0;
    walkStrings(INSPECTIONS_MODULES, 'modules', (text) => { SPAN.lastIndex = 0; while (SPAN.exec(text)) spans += 1; });
    expect(spans).toBeGreaterThan(200);
  });
});

describe('the build contract — nine exports and a catalog row', () => {
  it('ships eight lessons with stable ids', () => {
    expect(INSPECTIONS_MODULES).toHaveLength(8);
    expect(INSPECTIONS_MODULES.map((m) => m.id)).toEqual([
      'insp1-the-plague-in-the-walls',
      'insp2-i-viewed-the-walls',
      'insp3-see-the-land-what-it-is',
      'insp4-two-reports-one-land',
      'insp5-they-came-to-search-it-out',
      'insp6-man-looketh-on-the-outward-appearance',
      'insp7-he-digged-deep',
      'insp8-prove-all-things',
    ]);
  });

  it('exports the meta, the flow, the minutes and the tags', () => {
    expect(INSPECTIONS_META.key).toBe('inspections');
    expect(INSPECTIONS_META.weeks).toBe(8);
    expect(INSPECTIONS_META.wordFirst.ref).toBe('Leviticus 14:36; Leviticus 14:39');
    expect(INSPECTIONS_SESSION_FLOW.length).toBeGreaterThan(4);
    expect(INSPECTIONS_SESSION_MINUTES).toBe(INSPECTIONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0));
    expect(INSPECTIONS_INTEREST_TAG).toBe('[Inspections]');
    expect(INSPECTIONS_HELPER_TAG).toBe('[Inspections helper]');
    expect(INSPECTIONS_TUTOR_META.key).toBe('inspections');
  });

  it('builds a schedule, a progress summary and a markdown export', () => {
    const rows = buildInspectionsSchedule(null);
    expect(rows).toHaveLength(8);
    expect(rows[0].id).toBe('insp1-the-plague-in-the-walls');
    expect(inspectionsProgressSummary({}).total).toBe(8);
    const md = exportInspectionsCurriculumMarkdown(null);
    expect(md).toContain(INSPECTIONS_META.title);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('reports every reference it cites, deduped', () => {
    const refs = inspectionsRefs();
    expect(refs).toContain('Leviticus 14:36');
    expect(refs).toContain('Numbers 13:32');
    expect(refs).toContain('2 Kings 22:7');
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
    expect(ROW.tutorCourseMeta).toBe(INSPECTIONS_TUTOR_META);
  });

  it('is reachable by an everyday word (DR-0519)', () => {
    expect(plainWordsFor('inspections')).toContain('house');
    expect(plainWordsFor('inspections').length).toBeGreaterThanOrEqual(4);
  });

  it('carries the teaching-not-advice note, and says where a hurt reader should start', () => {
    expect(INSPECTIONS_CARE_NOTE).toMatch(/not inspection, legal or engineering advice/i);
    expect(INSPECTIONS_CARE_NOTE).toMatch(/licensed in your own state/i);
    expect(INSPECTIONS_CARE_NOTE).toMatch(/start at lesson four and lesson eight/i);
    expect(INSPECTIONS_META.care).toBe(INSPECTIONS_CARE_NOTE);
  });
});

describe('the DR-0509 lesson contract, on every lesson', () => {
  for (const m of INSPECTIONS_MODULES) {
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
    const missing = INSPECTIONS_MODULES.filter((m) => !/Yahweh/.test(ours(readerText(m)))).map((m) => m.id);
    expect(missing, `no Yahweh in our own prose: ${missing.join(', ')}`).toEqual([]);
  });

  it('never substitutes Yahweh into a quotation — the KJV God and LORD stand', () => {
    const inserted = [];
    walkStrings(INSPECTIONS_MODULES, 'modules', (text, path) => {
      for (const span of String(text).match(ALL_SPANS) || []) if (/Yahweh/.test(span)) inserted.push(`${path}: ${span.slice(0, 50)}`);
    });
    expect(inserted, inserted.join('\n')).toEqual([]);
    expect(readerText(lessonOf(8))).toContain('the money that was delivered into their hand');
  });

  it('recites no decision-record id at a reader', () => {
    const recited = [];
    walkStrings(INSPECTIONS_MODULES, 'modules', (text, path) => {
      if (/\bDR-\d{4}\b/.test(text)) recited.push(`${path}: ${String(text).match(/\bDR-\d{4}\b/)[0]}`);
    });
    expect(recited, recited.join('\n')).toEqual([]);
  });

  it('leads with the plain meaning of every hard term (DR-0521)', () => {
    expect(scanModules(INSPECTIONS_MODULES)).toEqual([]);
  });
});

describe('THE FOUR DOCTRINAL LIMITS, pinned so an edit cannot quietly delete one', () => {
  it('Leviticus 14 keeps the whole procedure — seven stages, in order', () => {
    const t = readerText(lessonOf(1));
    expect(t).toContain('"And he that owneth the house shall come and tell the priest, saying, It seemeth to me there is as it were a plague in the house:" (Leviticus 14:35)');
    expect(t).toContain('that all that is in the house be not made unclean');
    expect(t).toContain('"And he shall look on the plague, and, behold, if the plague be in the walls of the house with hollow strakes, greenish or reddish, which in sight are lower than the wall;" (Leviticus 14:37)');
    expect(t).toContain('"And the priest shall come again the seventh day, and shall look: and, behold, if the plague be spread in the walls of the house;" (Leviticus 14:39)');
    expect(t).toContain('"And he shall break down the house, the stones of it, and the timber thereof, and all the morter of the house; and he shall carry them forth out of the city into an unclean place." (Leviticus 14:45)');
    // The step that is better than modern practice is named as a principle.
    expect(t).toMatch(/an inspection must not do harm merely by taking place/);
  });

  it('Leviticus 14 refuses to become a building code or a verdict on a family', () => {
    const t = readerText(lessonOf(1));
    expect(t).toContain('and I put the plague of leprosy in a house of the land of your possession;');
    expect(t).toMatch(/not a building code/);
    expect(t).toMatch(/damp walls/);
    // The limit is stated in the LESSON BODY, not only in a benefit or a quiz
    // explain — and it is stated in the caps the body actually uses. This
    // assertion was first written from intent (lowercase) and failed on correct
    // content, which is the defect a check written from imagination always has:
    // it would equally have passed on wrong content.
    const body = lessonOf(1).lesson;
    const at = body.indexOf('This chapter is NOT a building code.');
    expect(at, 'the limit is missing from lesson one\'s body').toBeGreaterThan(0);
    expect(body).toMatch(/must never be used to tell a family/);
  });

  it('Numbers 13 says plainly that the facts were TRUE and the ten were not faulted for them', () => {
    const t = readerText(lessonOf(4));
    expect(t).toContain('"Nevertheless the people be strong that dwell in the land, and the cities are walled, and very great: and moreover we saw the children of Anak there." (Numbers 13:28)');
    expect(t).toMatch(/EVERY CLAUSE OF THAT IS TRUE/);
    expect(t).toMatch(/Caleb never contradicted/);
    // And the evil report is named by Scripture, with its tell.
    expect(t).toContain('is a land that eateth up the inhabitants thereof');
    expect(t).toContain('"And there we saw the giants, the sons of Anak, which come of the giants: and we were in our own sight as grasshoppers, and so we were in their sight." (Numbers 13:33)');
    expect(t).toMatch(/Nobody interviewed a giant|nobody interviewed a giant|Nobody asked a giant/);
  });

  it('Numbers 14 keeps the hard facts and adds the one the ten left out', () => {
    const t = readerText(lessonOf(4));
    expect(t).toContain('"The land, which we passed through to search it, is an exceeding good land." (Numbers 14:7)');
    expect(t).toMatch(/never deny the giants/);
    expect(t).toContain('"But my servant Caleb, because he had another spirit with him, and hath followed me fully, him will I bring into the land whereinto he went; and his seed shall possess it." (Numbers 14:24)');
  });

  it('1 Samuel 16:7 carries its limit, and John 7:24 carries the working instruction', () => {
    const t = readerText(lessonOf(6));
    expect(t).toContain('for man looketh on the outward appearance, but the LORD looketh on the heart.');
    expect(t).toMatch(/YAHWEH CHOOSING A KING|Yahweh choosing a king/);
    expect(t).toMatch(/no reason to skip a foundation|is no reason to skip a foundation/);
    expect(t).toContain('"Judge not according to the appearance, but judge righteous judgment." (John 7:24)');
    expect(t).toMatch(/JUDGE appears in both halves|judge appears in both halves/);
  });

  it('Joshua 2 stays where Scripture stays about Rahab, and keeps the complete return', () => {
    const t = readerText(lessonOf(5));
    expect(t).toMatch(/stop where it stops/);
    expect(t).toMatch(/commends her faith/);
    expect(t).toMatch(/no defence|no defence of it/);
    expect(t).toContain('told him all things that befell them:');
    expect(t).toContain('"And they said unto Joshua, Truly the LORD hath delivered into our hands all the land; for even all the inhabitants of the country do faint because of us." (Joshua 2:24)');
  });

  it('Luke 6 keeps hearing-and-doing as the topic rather than masonry', () => {
    const t = readerText(lessonOf(7));
    expect(t).toContain('"And why call ye me, Lord, Lord, and do not the things which I say?" (Luke 6:46)');
    expect(t).toMatch(/the smaller half/);
    expect(t).toContain('"He is like a man which built an house, and digged deep, and laid the foundation on a rock: and when the flood arose, the stream beat vehemently upon that house, and could not shake it: for it was founded upon a rock." (Luke 6:48)');
    expect(t).toContain('a tried stone, a precious corner stone, a sure foundation');
  });

  it('2 Kings 22:7 is never allowed to dismantle a control', () => {
    const t = readerText(lessonOf(8));
    expect(t).toContain('"Howbeit there was no reckoning made with them of the money that was delivered into their hand, because they dealt faithfully." (2 Kings 22:7)');
    expect(t).toMatch(/BECAUSE THEY DEALT FAITHFULLY/);
    expect(t).toMatch(/dismantle a control/);
    expect(t).toMatch(/who benefits/);
    // And the Bereans are commended rather than merely tolerated.
    expect(t).toContain('"These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so." (Acts 17:11)');
  });

  it('the tutor carries the same limits it would otherwise be free to ignore', () => {
    const p = INSPECTIONS_TUTOR_META.posture;
    expect(p).toMatch(/NEVER a building code/);
    expect(p).toMatch(/not faulted for reporting the facts/);
    expect(p).toMatch(/Yahweh choosing a king/);
    expect(p).toMatch(/stay where Scripture stays/);
    expect(p).toMatch(/dismantle a control/);
    expect(p).toMatch(/never give inspection, legal or engineering advice/i);
    expect(p).toMatch(/lesson four and lesson eight/);
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

  it('shares NOT ONE verse with any other course in the department', () => {
    const mine = versesCited(ROW);
    expect(mine.size).toBeGreaterThan(45);
    const shared = [];
    for (const c of dept) {
      if (c.key === 'inspections') continue;
      const theirs = versesCited(c);
      for (const v of mine) if (theirs.has(v)) shared.push(`${v} <- ${c.key}`);
    }
    expect(shared, `verse shared inside the department:\n${shared.join('\n')}`).toEqual([]);
  });

  it('shares exactly ONE chapter, at a different verse, and it is named', () => {
    const chOf = (v) => v.replace(/:.*$/, '');
    const mine = new Set([...versesCited(ROW)].map(chOf));
    const theirs = new Set();
    for (const c of dept) if (c.key !== 'inspections') for (const v of versesCited(c)) theirs.add(chOf(v));
    // If this grows, the header comment is no longer true and must be
    // re-measured and re-written — the failure course nine's first claim had.
    expect([...mine].filter((c) => theirs.has(c)).sort()).toEqual(['Proverbs 14']);
  });

  it('carries none of the three passages the measurement ruled out', () => {
    // Ezekiel 13 is maint3's anchor, Proverbs 20:14 is buy3's, and Haggai 1 is
    // maint6's — all in this same department. Three planned lessons died here.
    let found = [];
    const scan = (t) => {
      for (const bad of ['Ezekiel 13', 'Proverbs 20:14', 'Haggai 1']) if (String(t).includes(bad)) found.push(bad);
    };
    walkStrings(INSPECTIONS_MODULES, '', scan);
    walkStrings(INSPECTIONS_META, '', scan);
    expect([...new Set(found)]).toEqual([]);
  });
});

// @vitest-environment node
// =============================================================================
// L186 — Glory to Glory: One Letter Holds Both Sides
// =============================================================================
//
// RENUMBERED ON MERGE (2026-09-19, DR-0052 — allocate against live main).
// A concurrent session landed its own L185 (Knowledge Was Never the Savior)
// on main first, so this lesson and the two after it each moved up one.
// The content is untouched; only the number moved.
// Darrell 2026-09-19, across eleven messages, sending a Trackstarz podcast that
// worked the viral confrontation where a man challenged a preacher mid-service
// over sin and perfection. Then one question: "Christians still fussing about
// this and need clarification... can the Word clear this up?"
//
// And, mid-build, two sharpenings that shaped every band: "Holy Spirit's
// telling us when we are wrong..." and "Results show up... in you..." — the
// second of which is the lesson's answer to the whole evidence question.
//
// Then he answered the draft with three words: "Glory to glory..." — which is
// 2 Corinthians 3:18 and is the exact frame both men on that stage were
// missing. It became the title and the spine.
//
// THE MOVE THIS LESSON TURNS ON. Both men held a REAL verse, so this is not
// truth against error. It is two true things, each used as though it cancelled
// the other — and the settling move is not a clever synthesis, it is one short
// letter. John wrote 1 John 1:8 and 1 John 3:9 a few paragraphs apart. Any
// reading that makes either cancel the other is wrong before the argument
// opens, which disqualifies BOTH stage positions as stated. That is DR-0098's
// own standard: the Word explains the Word.
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//   1. SCORING THE FIGHT. Naming the men turns a passage into a team sport.
//      Every band says both held a true verse before it says anything else.
//   2. QUOTING ONLY THE COMFORTABLE COLUMN. Hebrews 6 and 2 Peter 2 are in the
//      Word and addressed to churches. Leaving them out would do to Hebrews
//      exactly what the challenger did to Romans 8 — so they are carried.
//   3. SENDING THE READER INWARD. Jeremiah 17:9 says the instrument is not
//      reliable, so the answer is a REQUEST to be searched, never a verdict.
//   4. SOFTENING "I never knew you". It is not softened, and the lesson names
//      who it lands on: the entirely confident, never the one lying awake.
//   5. FLATTENING THE PRODIGAL. The father's own words are "was dead, and is
//      alive again" — sonship and the language of death in one sentence. A
//      teacher who smooths that over is editing.
//
// WHAT THE REFERENCE GATE CAUGHT DURING THE BUILD, recorded because a gate that
// has never caught anything is not evidence: TWENTY spans quoted across a verse
// boundary while citing only the first verse — Galatians 5:22 running into
// 5:23, Psalm 139:23 into :24, Ephesians 2:8 into :9, Ephesians 1:13 into :14,
// Hebrews 6:4 into :6. The QUOTATIONS were verbatim; the REFERENCES were wrong,
// which is precisely the defect scripts/quoted-verse-is-the-verse.mjs was built
// to see and which the older blob-search gate could never have found.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { lessonSectionPlan } from '../lib/lesson-format.js';

const ID = 'll186-glory-to-glory-one-letter-holds-both-sides';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const book = (b) => {
  const k = String(b).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  return cache.get(k);
};
// Resolves a single verse OR a range, because a span that legitimately runs
// across a verse boundary must cite the range — that is what the build caught.
const verse = (b, ch, spec) => {
  const bk = book(b); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const [a, z] = String(spec).split('-').map((n) => Number(n));
  const last = Number.isFinite(z) ? z : a;
  const out = [];
  for (let n = a; n <= last; n += 1) {
    if (chap[n - 1] == null) return null;
    out.push(chap[n - 1]);
  }
  return norm(out.join(' '));
};
let CORPUS = null;
const corpus = () => {
  if (CORPUS === null) {
    let all = '';
    for (const f of readdirSync(KJV)) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      const bk = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
      if (Array.isArray(bk.chapters)) for (const ch of bk.chapters) all += ` ${ch.join(' ')}`;
    }
    CORPUS = norm(all);
  }
  return CORPUS;
};
const walk = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, fn);
};

// Quoted spans that are deliberately NOT Scripture: the terms the podcast used
// and the sentence a self-deceived person says. Enumerated exactly (DR-0076).
const NOT_SCRIPTURE = new Set([
  'once saved, always saved',
  'dying to the flesh',
  'What is an assay?',
]);

describe('the lesson exists and is wired', () => {
  it('is the newest Living Lesson and the count stays honest', () => {
    expect(L, 'L185 is not in the series').toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(here, 'L185 is not in the series').toBeGreaterThan(-1);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll185-/);
  });

  it('carries every field, and every band clears its floor and differs from its neighbours', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
    expect(shortBands(measureFullness(L))).toEqual([]);
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });

  it('every authored caps heading actually renders as a numbered point', () => {
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      const plan = lessonSectionPlan(t);
      expect(plan.total, `${k} renders too few numbered points`).toBeGreaterThanOrEqual(12);
      for (const h of plan.headings) {
        const head = h.text.split(/[.:—]/)[0].trim();
        expect(head.split(/\s+/).length, `${k}: heading too long -- ${head}`).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('EVERY quotation is His words, and names the verses it actually spans', () => {
  it('every referenced span is letter-for-letter the verse or range it names', () => {
    const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+(?:-\d+)?)\)/g;
    const faults = []; let checked = 0;
    walk(L, '', (text, path) => {
      SPAN.lastIndex = 0; let m;
      while ((m = SPAN.exec(text))) {
        checked += 1;
        const real = verse(m[2].trim(), m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!real.includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked).toBeGreaterThan(150);
    expect(faults).toEqual([]);
  });

  it('a span that crosses a verse boundary cites the RANGE, not just the first verse', () => {
    // The exact defect the build caught, twenty times. Pinned so it cannot
    // return: each of these is verbatim across two or three verses, and each
    // FAILS against its opening verse alone.
    const cases = [
      ['Galatians', 5, '22-23', 'Meekness, temperance'],
      ['Psalm', 139, '23-24', 'And see if there be any wicked way in me'],
      ['Ephesians', 2, '8-9', 'Not of works, lest any man should boast'],
      ['Ephesians', 1, '13-14', 'Which is the earnest of our inheritance'],
      ['Hebrews', 6, '4-6', 'If they shall fall away'],
    ];
    for (const [b, ch, range, tail] of cases) {
      const whole = verse(b, ch, range);
      expect(whole, `${b} ${ch}:${range} did not resolve`).toBeTruthy();
      expect(whole, `${b} ${ch}:${range} is missing its later clause`).toContain(tail);
      const first = verse(b, ch, String(range).split('-')[0]);
      expect(first, `${b} ${ch} opening verse did not resolve`).toBeTruthy();
      expect(first, `${tail} is NOT in ${b} ${ch}:${range.split('-')[0]} alone — the range is required`).not.toContain(tail);
    }
  });

  it('an unreferenced quotation is either declared non-Scripture or verbatim KJV', () => {
    const bad = [];
    walk(L, '', (text, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(text))) {
        if (m[2]) continue;
        const q = m[1];
        if (NOT_SCRIPTURE.has(q)) continue;
        const bare = norm(q).replace(/[.,]+$/, '');
        if (!corpus().includes(bare)) bad.push(`${path}: ${q.slice(0, 60)}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    walk(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${path}: ${m[1].slice(0, 50)}`);
    });
    expect(elided).toEqual([]);
  });
});

describe('the move the whole lesson turns on', () => {
  it('both halves are in ONE short letter, from one pen', () => {
    // If this ever stopped being true the lesson would lose its spine, so it is
    // pinned against the corpus rather than asserted in prose.
    expect(verse('1 John', 1, '8'))
      .toBe('If we say that we have no sin, we deceive ourselves, and the truth is not in us.');
    expect(verse('1 John', 3, '9'))
      .toContain('Whosoever is born of God doth not commit sin');
  });

  it('and the same letter supplies the advocate for when we do', () => {
    expect(verse('1 John', 2, '1')).toContain('we have an advocate with the Father, Jesus Christ the righteous');
  });

  it('Romans 8:1 does not end where it is usually quoted', () => {
    const r = verse('Romans', 8, '1');
    expect(r).toContain('There is therefore now no condemnation to them which are in Christ Jesus');
    expect(r, 'the second clause is in the SAME verse').toContain('who walk not after the flesh, but after the Spirit');
  });

  it('glory to glory is a PASSIVE verb with a named agent — Darrell’s own three words', () => {
    const v = verse('2 Corinthians', 3, '18');
    expect(v).toContain('are changed into the same image from glory to glory');
    expect(v).toContain('even as by the Spirit of the Lord');
  });
});

describe('the guards that keep this lesson out of both ditches', () => {
  it('every band says BOTH men held a true verse before it resolves anything', () => {
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      expect(t, `${k} never grants that both sides held real Scripture`)
        .toMatch(/both .{0,40}(true verse|real verse|something true)|true things/i);
    }
  });

  it('the hard column is carried, not hidden', () => {
    // Quoting only the keeping verses would repeat the exact error the lesson
    // corrects. Hebrews 6 and 2 Peter 2 must appear in our own registers.
    for (const t of [L.lesson, L.levels.teen, L.levels.senior]) {
      expect(t).toMatch(/Hebrews 6:4-6/);
      expect(t).toMatch(/2 Peter 2:20/);
    }
  });

  it('assurance rests on HIS hand, never on the reader’s grip', () => {
    for (const t of [L.lesson, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t).toMatch(/John 10:28/);
      expect(t).toMatch(/never perish/);
    }
  });

  it('it sends the reader to ASK rather than to self-diagnose', () => {
    for (const t of [L.lesson, L.levels.child, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t).toMatch(/Jeremiah 17:9|deceitful above all things/);
      expect(t).toMatch(/Psalm 139:23-24|Search me, O God/);
    }
  });

  it('carries Darrell’s two sharpenings — the Spirit convicts, and the results show up in you', () => {
    for (const t of [L.lesson, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t, 'the results-show-up-in-you answer is missing').toMatch(/results show up in you/i);
      expect(t, 'the Spirit reproving is missing').toMatch(/John 16:8|reprove the world of sin/);
    }
  });

  it('does not soften I never knew you, and names who it lands on', () => {
    for (const t of [L.lesson, L.levels.teen, L.levels.senior]) {
      expect(t).toContain('I never knew you');
      // Two parts rather than one literal sentence: the registers phrase the
      // turn differently ("Notice what He does not say" / "Read what He does
      // not say"), and pinning one wording would fail on correct prose.
      expect(t, 'it must point at what He does NOT say').toMatch(/(?:Notice|Read) what He does not say/i);
      expect(t, 'it must name the thing He did not say — that you did too little').toMatch(/too little/);
      expect(t, 'it must name who the warning lands on').toMatch(/confident/i);
    }
  });

  it('the child band teaches the move without the doctrinal vocabulary', () => {
    const c = L.levels.child;
    expect(c).not.toMatch(/justification|sanctification|glorification|eternal security/i);
    expect(c).toContain('1 John 1:8');
    expect(c).toContain('1 John 3:9');
  });
});

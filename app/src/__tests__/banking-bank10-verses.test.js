// @vitest-environment node
// =============================================================================
// bank10 — every quotation is the corpus verbatim, both halves of Ezekiel 33:6
// are taught in every band, the tiers are held apart, and no party is staged
// (DR-1563)
// =============================================================================
// Banking lesson 10, "The watchman who went quiet", was built from one word
// Darrell typed above a forwarded Fintech Takes newsletter recap of 2026-11-11:
// Lesson. Gmail thread 1a1f08bfcac456b1. Built 2026-11-18 by
// scripts/bank10-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) run on this Banking module by name, so the verbatim, voice,
// adversary, band, ladder, quiz and parable rules that bind a Living Lesson
// bind this one too; then the checks particular to this lesson.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BANKING_MODULES } from '../lib/banking-course.js';
import { fourBandFaults, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';
import {
  lessonGateFaults,
  stringsOf,
  corpusText,
  quotedPairs,
  verbatimFaults,
  voiceFaults,
  adversaryFaults,
  bareQuoteFaults,
  spineFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'bank10-the-watchman-who-went-quiet';
const MODULE = BANKING_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (FOUR_BANDS.includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Ezekiel 33:3', 'he blow the trumpet, and warn the people'],
  ['Ezekiel 33:6', 'he is taken away in his iniquity; but his blood will I require at the watchman’s hand'],
  ['Ecclesiastes 8:11', 'Because sentence against an evil work is not executed speedily'],
  ['Numbers 32:23', 'be sure your sin will find you out'],
  ['Ezekiel 33:11', 'turn ye, turn ye from your evil ways'],
  ['Mark 13:37', 'And what I say unto you I say unto all, Watch.'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
];
const REVIEW = 're-review: 2026-12-16';

// MEASURED 2026-11-18 on the spliced module (scripts/bank10-fill.mjs output):
// 15 anchor references. The anchor exact; the sweep floor a little low.
const ANCHOR_COUNT = 15;
const QUOTED_FLOOR = 40;

describe('bank10 is in the course and is the whole lesson', () => {
  it('the module exists, as lesson ten, with all four bands, each opening on its title', () => {
    expect(MODULE, `${ID} is in BANKING_MODULES`).toBeTruthy();
    expect(BANKING_MODULES.indexOf(MODULE)).toBe(9);
    for (const b of FOUR_BANDS) {
      expect(typeof MODULE.levels[b]).toBe('string');
      expect(MODULE.levels[b].startsWith(MODULE.title), b).toBe(true);
    }
  });
});

describe('the shared Living Lesson gate, run on this lesson check by check', () => {
  it('every check is empty', () => {
    const all = lessonGateFaults(MODULE, { spine: SPINE });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });

  it(`at least ${QUOTED_FLOOR} referenced quotations are swept, so the sweep is not vacuous`, () => {
    const n = stringsOf(MODULE).reduce((a, t) => a + quotedPairs(t).filter((p) => p.ref).length, 0);
    expect(n).toBeGreaterThanOrEqual(QUOTED_FLOOR);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quotation is caught', () => {
    const L = clone();
    L.quiz.questions[0].explain += ' "be sure your sin will find you not out." (Numbers 32:23)';
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the guest’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The guest said "the pendulum could swing back hard."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God sees the ledger. Satan keeps the books.';
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });

  it('PROVEN-TO-CATCH: the second half of Ezekiel 33:6 dropped from one band is caught', () => {
    const L = clone();
    const verse = corpusText('Ezekiel 33:6');
    L.levels.youth = L.levels.youth.split(`"${verse}" (Ezekiel 33:6)`).join('');
    expect(spineFaults(L, SPINE)).toContain('youth drops Ezekiel 33:6');
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const refs = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = new Set(
    READER_PLACES.flatMap((p) =>
      quotedPairs(place(MODULE, p))
        .map((q) => q.ref)
        .filter(Boolean)
    )
  );

  it(`the anchor carries exactly ${ANCHOR_COUNT} references, each resolving in the corpus`, () => {
    expect(refs.length).toBe(ANCHOR_COUNT);
    for (const r of refs) expect(corpusText(r), r).not.toBeNull();
  });

  it('both ways: nothing on the anchor a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });
});

describe('the Word opens the hour, and both halves of Ezekiel 33:6 are taught', () => {
  it('in every teaching place the watchman verses stand before the newsletter is mentioned', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const verse = t.indexOf('(Ezekiel 33:6)');
      const news = t.search(/newsletter|letter about banks/i);
      expect(verse, `${p} quotes Ezekiel 33:6`).toBeGreaterThan(0);
      expect(news, `${p} names its source`).toBeGreaterThan(0);
      expect(verse, `${p}: the Word stands before the news`).toBeLessThan(news);
    }
  });

  it('every teaching place says the man is still answerable, not only the watchman', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p).split('"').filter((_, i) => i % 2 === 0).join(' ');
      // The child band says it in its own words (his wrong thing was still wrong);
      // the older bands name the verse's own phrase in our voice.
      expect(t, p).toMatch(p === 'child' ? /wrong thing was still wrong/ : /taken away in his iniquity/);
      expect(t, p).toMatch(/still (his|wrong)|still his own|still a fee|was still/i);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('one teaching, one lesson: lesson six owns who pays the fees, and is pointed to rather than re-taught', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/lesson six/i);
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(/\(Amos 8:\d+\)|ephah/);
  });
});

describe('teach the Word, do not debate it (DR-0098): no party staged, no official named, no forecast taught', () => {
  const NAMES = /Warren|Vought|Kraninger|Trump|Blackwell|Brian Johnson|Pulte|Stephen Miller|Alex Johnson|Synapse|IntraFi/;
  const PARTIES = /\b(Democrat|Democrats|Democratic|Republican|Republicans|GOP|blue wave|red wave)\b/i;

  it('no public official, commentator or company from the newsletter is named anywhere in the lesson', () => {
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(NAMES);
  });

  it('no party is named anywhere in the lesson', () => {
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(PARTIES);
  });

  it('no figure from the newsletter is printed (seats, ratings, percentages)', () => {
    for (const p of READER_PLACES) {
      const ours = place(MODULE, p).split('"').filter((_, i) => i % 2 === 0).join(' ');
      expect(ours, p).not.toMatch(/\d+\s?(%|percent|seats)|\b\d+\s?(out of|\/)\s?10\b|three out of ten/i);
    }
  });

  it('every teaching place says it will not take a side and that the forecasts are guesses or opinion', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(/which (party|leaders?)/i);
      expect(t, p).toMatch(/guess|forecast|opinion|prediction/i);
    }
  });

  it('PROVEN-TO-CATCH: a party name or an official slipped into a band is caught', () => {
    const L = clone();
    L.levels.senior += ' The Democrats will fix it, says Senator Warren.';
    expect(stringsOf(L).some((s) => PARTIES.test(s))).toBe(true);
    expect(stringsOf(L).some((s) => NAMES.test(s))).toBe(true);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the reported tier, and what is sure', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names one guest or one man as the source`).toMatch(/one (podcast )?guest|one man|his story|one person/i);
      expect(t, `${p} says the rule stays a rule`).toMatch(/still (a|the) (rule|law)|stop being the law|stays in force|does not lapse/i);
    }
  });

  it('the senior band and the adult lesson say it is teaching, not legal advice', () => {
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/teaching, not legal advice/i);
  });

  it('the lesson carries no unchecked-material admission phrase (DR-1126): no figure was taken on trust', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });

  it('no verse in this lesson was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/bank10-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });
});

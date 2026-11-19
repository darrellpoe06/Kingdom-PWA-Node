// @vitest-environment node
// =============================================================================
// sov97 — every quotation is the corpus verbatim, the house is traced to its
// real records, the tiers are held apart, and the lesson is whole in every
// band (DR-1572)
// =============================================================================
// Sovereign A.I. week 97, "The staff of this broken reed", was built from one
// word Darrell typed above a forwarded business newsletter: Lesson. Gmail
// thread 1a1f08f5aa0b9f68. Built 2026-11-19 by scripts/sov97-fill.mjs.
//
// ONE TEACHING, ONE LESSON (DR-0610). Week 1 owns local-first as a whole,
// week 66 the risk ranked low, week 85 testing the storm. This week owns
// LEANING: the few the world leans on, and the new cloth on the old garment.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
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
  yahwehInQuoteFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'sov97-the-staff-of-this-broken-reed';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Isaiah 36:6', 'the staff of this broken reed'],
  ['Ezekiel 29:7', 'when they leaned upon thee, thou brakest'],
];
const REVIEW = 're-review: 2026-12-03';

// MEASURED 2026-11-19 on the spliced module (scripts/sov97-fill.mjs output):
// 23 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 23;
const QUOTED_FLOOR = 70;

describe('sov97 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 97, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) {
      expect(typeof MODULE.levels[b]).toBe('string');
      expect(MODULE.levels[b].startsWith(MODULE.title), b).toBe(true);
    }
  });
});

describe('the shared Living Lesson gate, run on this week check by check', () => {
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
    L.quiz.questions[0].explain += ` "Lo, thou trustest in the staff of this broken cane, on Egypt" (Isaiah 36:6)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the newsletter’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The newsletter said "one company can mess with an entire planet."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: Yahweh substituted inside Scripture, the generic name in our voice, and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' "the Egyptians are men, and not Yahweh" (Isaiah 31:3) God holds the cloud. Satan pulls the plug.';
    expect(yahwehInQuoteFaults(L).length).toBe(1);
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
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
    expect(refs.slice(0, 2)).toEqual(['Isaiah 36:6', 'Ezekiel 29:7']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('neither frame verse is the anchor of an earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('Isaiah 36:6');
    expect(earlier).not.toContain('Ezekiel 29:7');
  });
});

describe('the Word opens and frames the hour; no cloud stands above it', () => {
  it('in every teaching place the reed is quoted before a server, a cloud or an upgrade is taught', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const start = t.indexOf('THE WORD FIRST') >= 0 ? t.indexOf('THE WORD FIRST') : t.indexOf('THE FRAME');
      expect(start, `${p} has a Word-first section`).toBeGreaterThan(0);
      // From the end of the heading, so its own words (BEFORE ANY CLOUD) are not counted.
      const body = t.slice(t.indexOf('.', start) + 1);
      const tech = body.search(/\b(server|cloud|upgrade|backup|second road)\b/i);
      expect(tech, `${p} teaches the house`).toBeGreaterThan(0);
      expect(body.indexOf('(Isaiah 36:6)'), `${p}: the reed stands before the machines`).toBeGreaterThan(-1);
      expect(body.indexOf('(Isaiah 36:6)')).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the reed in Yahweh’s own word, the new wine, the trust, and a second road', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(Isaiah 36:6)',
        '(Ezekiel 29:6)',
        '(Ezekiel 29:7)',
        '(Matthew 9:17)',
        '(Isaiah 37:14)',
        '(Isaiah 37:15)',
        '(John 1:29)',
        '(Colossians 1:17)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
      expect(t, `${p} names a second road`).toMatch(/second road|fallback|another way/i);
      expect(t, `${p} keeps outside help as support`).toMatch(/never the only way|never the sole means|never a must|not the only way|extra, not the only way/i);
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) {
      expect(place(MODULE, p), p).toContain('(Isaiah 31:3)');
      expect(place(MODULE, p), p).toContain('(Isaiah 30:15)');
      expect(place(MODULE, p), p).toMatch(/Eternal Son/);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
  });

  it('one teaching, one lesson: the earlier weeks are named as theirs', () => {
    expect(MODULE.lesson).toMatch(/Week one of this course is the generator in the garage/);
    expect(MODULE.lesson).toMatch(/Week sixty-six is the risk ranked low/);
    expect(MODULE.lesson).toMatch(/Week eighty-five is testing the storm/);
    for (const id of ['sov1-generator-in-the-garage', 'sov66-they-dwelt-careless-and-there-was-no-deliverer', 'sov85-and-it-fell-not']) {
      expect(
        SOVEREIGN_AI_MODULES.some((m) => m.id === id),
        id
      ).toBe(true);
    }
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the newsletter: its partisan items stay out, and no person is named', () => {
  it('no official, party, link or thread id reaches any string', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/https?:\/\/|www\.|1a1f08f5aa0b9f68|Duffy|Mullin|Trump|Biden|Congress|Democrat|Republican|White House|Nvidia/i);
    }
  });

  it('the generator, which records provenance, names the thread id', () => {
    expect(src('scripts/sov97-fill.mjs')).toMatch(/1a1f08f5aa0b9f68/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the documented, the reported, and the unverified cause', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says what the reports agree on`).toMatch(/documented|many of them told it the same way/i);
      expect(t, `${p} holds the newsletter's numbers as reported`).toMatch(/reported|could not check/i);
      expect(t, `${p} says the cause is not verified`).toMatch(/not verified|not confirmed|unconfirmed|no final cause/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the records', () => {
  const nasRoads = src('docs/decisions/DR-1360-the-proof-of-the-work-is-readable-inside-the-app-and-the-nas-initiates-every-road.md');
  const voice = src('docs/decisions/DR-1538-my-voice-is-made-on-the-nas-when-the-tower-is-dark.md');

  it('96 workflows, 64 on one key, expired 2026-11-04, unseen two days; the other-outside-service proposal withdrawn', () => {
    expect(nasRoads).toMatch(/96 workflows on `\.github\/workflows`, 64 of them join the tailnet on `TS_AUTHKEY`/);
    expect(nasRoads).toMatch(/that key expired 2026-11-04 and every one of the 64 went red, unseen for two days/);
    expect(nasRoads).toMatch(/it changes which outside system the house depends on, not whether it depends/);
    expect(nasRoads).toMatch(/a system we do not control is support, never a necessity/);
    expect(MODULE.lesson).toMatch(
      /Ninety-six of our automated workflows were counted then, and sixty-four of them reached our home server through one outside key/
    );
  });

  it('the reading voice got a second engine on the home server, and its first live reading is said to be unobserved', () => {
    expect(voice).toMatch(/\*\*Not yet observed:\*\* the first live read in his voice from the NAS/);
    expect(MODULE.lesson).toMatch(/We have not yet heard the first live reading from it, and we say so/);
  });

  it('the build-day count is what the lesson says: 64 of 103 workflow files still named the key (MEASURED 2026-11-19)', () => {
    // A dated measurement, not a live claim: the lesson says "on the day this
    // lesson was built". As roads are reversed the live count will fall; the
    // test pins the sentence and that the folder count was real at build.
    expect(MODULE.lesson).toMatch(
      /On the day this lesson was built, sixty-four of the one hundred and three workflow files in our folder still named that same outside key/
    );
    const dir = join(REPO, '.github', 'workflows');
    const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    expect(MODULE.lesson).toMatch(/The rule is written; the work is not done/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov97-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-19 by scripts/sov97-fill.mjs: adult 1,993 prose words;
    // child 0.510 / youth 0.612 / teen 0.614 / senior 0.617; grades 1.58 <
    // 4.50 < 5.23 < 8.87. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(1900);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });
});

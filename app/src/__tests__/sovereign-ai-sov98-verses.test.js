// @vitest-environment node
// =============================================================================
// sov98 — every quotation is the corpus verbatim, the Word stands before the
// tool, the honesty line is drawn in every band, the house is traced to its
// real code, and the lesson is whole in every band (DR-1576)
// =============================================================================
// Sovereign A.I. week 98, "He wrought a work on the wheels", was built from one
// word Darrell typed above a forwarded technology newsletter: Lesson. Gmail
// thread 1a1f090d679841cd. Built 2026-11-19 by scripts/sov98-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// ONE TEACHING, ONE LESSON (DR-0610). sov28 quotes Jeremiah 18:4 once (iteration
// is not failure); ll67 teaches why A.I. is not a soul; sov58 that a rehearsal is
// not the world; ll329 (PR #2777) is the same newsletter's other episode. This
// week owns the wheel itself: hands on the work while it turns.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
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
} from './helpers/living-lesson-gate.js';

const ID = 'sov98-he-wrought-a-work-on-the-wheels';
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
  ['Jeremiah 18:3', 'he wrought a work on the wheels'],
  ['Jeremiah 18:4', 'so he made it again another vessel'],
];
const REVIEW = 're-review: 2026-12-03';

// MEASURED 2026-11-19 on the spliced module (scripts/sov98-fill.mjs output):
// 16 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 16;
const QUOTED_FLOOR = 60;

describe('sov98 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 98, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID).length).toBe(1);
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
    L.quiz.questions[0].explain += ` "Then I went down to the potter’s house, and, behold, he wrought a work on the table." (Jeremiah 18:3)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the newsletter’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The recap called prompting "the old way."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God is the Potter. Satan forges a face.';
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
    expect(refs.slice(0, 2)).toEqual(['Jeremiah 18:3', 'Jeremiah 18:4']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('the frame verse is the anchor of no earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('Jeremiah 18:3');
    expect(earlier).not.toContain('Jeremiah 18:4');
  });
});

describe('the Word opens and frames the hour; no tool stands above it', () => {
  it('in every teaching place the potter at the wheel is quoted before a video, a camera, an actor or a prompt is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const body = t.slice(t.indexOf('THE WORD FIRST'));
      const frame = body.indexOf('(Jeremiah 18:3)');
      const tech = body.search(/\b(video|videos|camera|actors?|prompt|movies?)\b/i);
      expect(t.indexOf('THE WORD FIRST'), `${p} has THE WORD FIRST`).toBeGreaterThan(0);
      expect(frame, `${p} quotes Jeremiah 18:3`).toBeGreaterThan(0);
      expect(tech, `${p} teaches the tool`).toBeGreaterThan(0);
      expect(frame, `${p}: the wheel stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the wheel, the remaking, the clay, the cost, the breath and the Lamb', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(Jeremiah 18:3)',
        '(Jeremiah 18:4)',
        '(Jeremiah 18:6)',
        '(Isaiah 64:8)',
        '(Luke 14:28)',
        '(Genesis 2:7)',
        '(Jeremiah 10:14)',
        '(John 1:29)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
    }
  });

  it('THE HONESTY LINE: every reader place says a generated person is not a person, and none implies one is alive', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(
        /(generated|made up|pretend) (person|actor) (is|on a screen is|in the movie is) not a (real )?person|a generated person is not a person/i
      );
      expect(t, `${p} names the note-tracking as bookkeeping`).toMatch(/just a list|keeping a list|maintaining a list|bookkeeping|context in software/i);
    }
    expect(MODULE.bigIdea).toMatch(/A generated person is not a person/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/\b(the|a|our|your) (generated|A\.I\.|AI) (actor|person|character)s? (is|are) (alive|conscious|a person|living)\b/i);
      expect(s).not.toMatch(/\b(she|he|they) (felt|wanted|understood|chose) the note\b/i);
    }
  });

  it('the trade-off is taught as reported, never sold away', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/lower in (image )?quality|lower image quality|does not look as nice/i);
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('one teaching, one lesson: the earlier weeks are named as theirs', () => {
    expect(MODULE.lesson).toMatch(/Week twenty-eight of this course quotes the marred vessel once/);
    expect(MODULE.lesson).toMatch(/A Living Lesson already teaches why A\.I\. is not a soul/);
    expect(MODULE.lesson).toMatch(/week fifty-eight teaches that a rehearsal is not the world/);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov28-holding-the-hand-of-the-process-until-it-is-finished')).toBe(true);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov58-the-world-that-does-not-drift')).toBe(true);
    expect(src('app/src/lib/living-lessons-class.js')).toMatch(/ll67-made-in-his-image-we-make-why-ai-is-not-a-soul/);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the forward is material: no links, names or advertising reach the lesson', () => {
  it('no link, address, thread id, company, product, guest, host or newsletter name reaches any string', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/@|https?:\/\/|www\.|\.com\b|1a1f090d679841cd|Pika|Enact|Neuron|H3 Flex|Demi|Matan|Lindsay|Corey|Sarah|Darren\b/i);
    }
  });

  it('the generator, which records provenance, names the thread id', () => {
    const g = src('scripts/sov98-fill.mjs');
    expect(g).toMatch(/1a1f090d679841cd/);
    expect(g).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the tool as reported and unused, and the unverified question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says the tool was not used`).toMatch(/did not use the tool|not used or observed/i);
      expect(t, `${p} says the tool's claims are not verified`).toMatch(/not verified/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  const g = src('scripts/sov98-fill.mjs');

  it('the generator measures before it splices, refuses a lesson that fails, and a dry run writes nothing', () => {
    expect(g).toMatch(/const faults = fourBandFaults\(filled\);/);
    expect(g).toMatch(/refusing to splice a lesson that fails the four-band ladder/);
    expect(g).toMatch(/--dry measures and reports, and writes nothing/);
    expect(g.indexOf("process.argv.includes('--dry')")).toBeLessThan(g.indexOf('writeFileSync(CATALOG, next)'));
    expect(MODULE.lesson).toMatch(/the generator refuses to splice it and says why/);
  });

  it('the anchor is derived from a list of where each verse appears, which the lesson names as bookkeeping', () => {
    expect(g).toMatch(/filled\.anchor\.ref = readerRefs\.join\('; '\);/);
    expect(MODULE.lesson).toMatch(/That list is bookkeeping too/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-19 by scripts/sov98-fill.mjs: adult 1,687 prose words;
    // child 0.527 / youth 0.622 / teen 0.622 / senior 0.622; grades 1.67 <
    // 4.41 < 4.84 < 7.71. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(1600);
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

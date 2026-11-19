// @vitest-environment node
// =============================================================================
// sov96 — every quotation is the corpus verbatim, the house is traced to its
// real files, and the lesson is whole in every band (DR-1570)
// =============================================================================
// Sovereign A.I. week 96, "He shall order the lamps continually", was built
// from one word Darrell typed above a forwarded system design newsletter:
// Lesson. Gmail thread 1a1daf286df06d06. Built 2026-11-19 by
// scripts/sov96-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// ONE TEACHING, ONE LESSON (DR-0610). Exodus 25:40 is already in this course:
// week 86 reads the pattern that came in writing, week 91 uses a written
// pattern as a grading rubric. This week owns the KEEPING: the keeper who
// returns every cycle (Leviticus 24:3-4) and the copy that must be fresh
// (2 Kings 22). Neither frame verse is the FIRST anchor of an earlier week.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names, and that every claim about the house is still true of
// the files. It cannot prove the home server's loop is firing today; the
// lesson says so, with a date.
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

const ID = 'sov96-he-shall-order-the-lamps-continually';
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
  ['Exodus 25:40', 'make them after their pattern, which was shewed thee in the mount'],
  ['Leviticus 24:4', 'He shall order the lamps upon the pure candlestick before the LORD continually'],
];
const REVIEW = 're-review: 2026-12-03';

// MEASURED 2026-11-19 on the spliced module (scripts/sov96-fill.mjs output):
// 27 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 27;
const QUOTED_FLOOR = 90;

describe('sov96 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 96, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id.startsWith('sov95-'))).toBe(true);
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id.startsWith('sov96-')).length).toBe(1);
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
    L.quiz.questions[0].explain += ` "He shall order the lamps upon the golden candlestick before the LORD continually." (Leviticus 24:4)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the newsletter’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The newsletter said "the controllers ensure that four Pods are created."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalized adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God declared the pattern. Satan forged the copy.';
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
    expect(refs.slice(0, 2)).toEqual(['Exodus 25:40', 'Leviticus 24:4']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('neither frame verse is the first anchor of an earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('Exodus 25:40');
    expect(earlier).not.toContain('Leviticus 24:4');
  });
});

describe('the Word opens and frames the hour; no machine stands above it', () => {
  it('in every teaching place the pattern and the lamps are quoted before Kubernetes or the server is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const body = t.slice(t.indexOf('THE WORD FIRST'));
      const tech = body.search(/\b(Kubernetes|server|controller|computer)/i);
      expect(body.indexOf('(Exodus 25:40)'), `${p} quotes Exodus 25:40`).toBeGreaterThan(0);
      expect(body.indexOf('(Leviticus 24:4)'), `${p} quotes Leviticus 24:4`).toBeGreaterThan(0);
      expect(tech, `${p} teaches the machine`).toBeGreaterThan(0);
      expect(body.indexOf('(Exodus 25:40)'), `${p}: the pattern stands before the machines`).toBeLessThan(tech);
      expect(body.indexOf('(Leviticus 24:4)'), `${p}: the lamps stand before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the inspection, the lost book, the mirror, the keeper who never leaves, and repeat-safe keeping', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of ['(Exodus 39:43)', '(2 Kings 22:8)', '(2 Kings 22:11)', '(James 1:24)', '(James 1:25)', '(Hebrews 7:25)', '(Hebrews 13:8)']) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
      expect(t, `${p} teaches a step safe to repeat`).toMatch(/idempotent|safe to repeat|leaves? it alone|left alone|leave the full one/i);
      expect(t, `${p} teaches the fresh copy`).toMatch(
        /newest (copy|list|plan)|current (copy|one)|copy must be fresh|keep the (copy|spec|pattern) (fresh|current)/i
      );
      expect(t, `${p} names the thermostat`).toMatch(/thermostat|keeps a room warm/i);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('one teaching, one lesson: the earlier weeks on the same verse are named as theirs', () => {
    expect(MODULE.lesson).toMatch(/Week eighty-six read the pattern that came in writing/);
    expect(MODULE.lesson).toMatch(/Week ninety-one used a written pattern as the rubric/);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov86-all-the-works-of-this-pattern')).toBe(true);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov91-know-the-state-of-thy-flocks')).toBe(true);
  });

  it('no decision record is recited at a reader, and no link reaches any string', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(/https?:\/\/|www\.|1a1daf286df06d06/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the newsletter as forwarded, and the unverified loop', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says no cluster was tested`).toMatch(/did not (test|run) a cluster|no cluster was run|did not test one/i);
      expect(t, `${p} says the home server's loop is not verified`).toMatch(/not verified/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the files', () => {
  const manifest = JSON.parse(src('infra/nas-loops/services.json') || '{"services":[]}');
  const registry = JSON.parse(src('infra/nas-loops/registry.json') || '{"loops":[]}');
  const loops = registry.loops || registry.entries || Object.values(registry).find(Array.isArray) || [];
  const sync = loops.find((l) => l.name === 'services-sync') || {};
  const sh = src('infra/nas-loops/loops/services-sync.sh');
  const way = src('docs/00-foundations/_root/THE-WAY-A-SERVICE-COMES-HOME.md');

  it('one list: each service names an installer and an enabled flag, and merging the list is the deploy', () => {
    expect(manifest.services.length).toBeGreaterThan(30);
    for (const s of manifest.services) {
      expect(typeof s.install, s.name).toBe('string');
      expect(typeof s.enabled, s.name).toBe('boolean');
    }
    expect(manifest._comment).toMatch(/Adding a service here \+ merging to main IS its deploy/);
    expect(manifest._comment).toMatch(/'enabled' is the committed greenlight/);
    expect(manifest._comment).toMatch(/IDEMPOTENT installer script/);
  });

  it('one keeper: services-sync is enabled, every fifteen minutes, and runs every enabled installer, skipping the rest by name', () => {
    expect(sync.enabled).toBe(true);
    expect(sync.schedule).toBe('every 15 minutes');
    expect(sh).toMatch(/if not svc\.get\("enabled"\):\n\s+print\(f"services-sync: \{svc\.get\('name'\)\} disabled, skip"\)/);
    expect(sh).toMatch(/subprocess\.run\(\["sh", path\]/);
  });

  it('the copy kept fresh: the pull comes first, runs as the files’ owner, and says why on both channels when it fails', () => {
    expect(sh).toMatch(/FRESHEN THE MIRROR FIRST \(2026-08-04/);
    expect(sh).toMatch(/2026-08-15 \(run 31871686957\)/);
    expect(sh).toMatch(/sudo -n -u dpoe git -C "\$REPO" pull --ff-only/);
    expect(sh).toMatch(/a silent stale deploy looks exactly like a\s+(#\s+)?healthy one/);
    expect(sh.indexOf('pull --ff-only')).toBeLessThan(sh.indexOf('python3 - "$MANIFEST"'));
  });

  it('say why: the reason is captured, and a degraded service is named without turning the fleet red', () => {
    expect(sh).toMatch(/CAPTURE THE REASON, NOT JUST THE VERDICT \(2026-08-14\)/);
    expect(sh).toMatch(/Six identical\s+(#\s+)?failures over a week/);
    expect(sh).toMatch(/DEGRADED, NOT FAILED \(2026-09-23\)/);
    expect(sh).toMatch(/if r\.returncode == 3:/);
  });

  it('the October cap: a camera service ran thirteen-hour-old code while the new code sat on disk', () => {
    expect(sync.description).toMatch(/CAP 120, NOT 96 \(2026-10-07/);
    expect(sync.description).toMatch(/camera forwarder running 13-hour-old code while new code sat on disk/);
  });

  it('the Way a service comes home: the restart follows the code on every path, and the witness shows running beside repo', () => {
    expect(way).toMatch(/the running code follows the repo on every path/);
    expect(way).toMatch(/the code the service is running against the code in the repo/);
    expect(src('docs/decisions/DR-1119-a-service-comes-home-by-one-way.md')).toMatch(/^# DR-1119/);
  });

  it('the lesson claims no count of services and does not claim the loop is firing today', () => {
    expect(MODULE.lesson).toMatch(/this lesson does not claim that the loop is firing today/);
    expect(MODULE.lesson).not.toMatch(/\b(thirty|forty)[- ]\w*\s+services\b/i);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov96-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
    expect(g).toMatch(/1a1daf286df06d06/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-19 by scripts/sov96-fill.mjs: adult 2,124 prose words;
    // child 0.511 / youth 0.614 / teen 0.609 / senior 0.658; grades 1.73 <
    // 4.40 < 4.87 < 8.55. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(2000);
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

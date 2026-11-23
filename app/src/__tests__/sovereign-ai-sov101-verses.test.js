// @vitest-environment node
// =============================================================================
// sov101 — every quotation is the corpus verbatim, the Word frames the hour,
// the house is traced to its real files, the notice stays reported, and the
// lesson is whole in every band (DR-1615)
// =============================================================================
// Sovereign A.I. week 101, "A little leaven leaveneth the whole lump", is built
// from a university technology-services security notice on a flaw in the Java
// runtime that Darrell forwarded with one word, Lesson (thread
// 1a208f5960ac285d). Built by scripts/sov101-fill.mjs, every verse filled from
// the KJV on disk.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names, and that what the lesson says of infra/ and of the
// build workflows is what those files say. It cannot prove the notice's CVE
// details against each vendor's advisory, nor what is packed inside an image
// someone else built; those are the re-review.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
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

const ID = 'sov101-a-little-leaven-leaveneth-the-whole-lump';
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
  ['1 Corinthians 5:6', 'a little leaven leaveneth the whole lump'],
  ['Exodus 12:19', 'no leaven found in your houses'],
];
const REVIEW = 're-review: 2026-12-07';

// MEASURED 2026-11-23 on the spliced module (scripts/sov101-fill.mjs output):
// 17 anchor references and 91 referenced quotations. The anchor exact; the
// quoted floor a little low.
const ANCHOR_COUNT = 17;
const QUOTED_FLOOR = 85;

describe('sov101 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 101, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => /^sov101-/.test(m.id))).toHaveLength(1);
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
    L.lesson = L.lesson.replace('a little leaven leaveneth the whole lump', 'a little yeast leaveneth the whole lump');
    expect(verbatimFaults(stringsOf(L)).length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: the notice quoted with no reference is caught', () => {
    const L = clone();
    L.lesson += ' The notice said "Review these systems and update affected runtimes."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God patches the runtime. Satan breaks it.';
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
    expect(refs.slice(0, 2)).toEqual(['1 Corinthians 5:6', 'Exodus 12:19']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('neither spine verse is the anchor of an earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('1 Corinthians 5:6');
    expect(earlier).not.toContain('Exodus 12:19');
  });
});

describe('the Word frames the hour, the teaching is whole, and the bright line is held', () => {
  it('in every teaching place 1 Corinthians 5:6 is quoted before the first word about Java or a runtime', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const at = t.indexOf('THE WORD FIRST');
      expect(at, `${p} has a Word-first section`).toBeGreaterThan(0);
      const body = t.slice(at);
      const tech = body.search(/\b(Java|runtime)\b/);
      expect(tech, `${p} teaches the runtime`).toBeGreaterThan(0);
      expect(body.indexOf('(1 Corinthians 5:6)'), `${p}: the Word stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place names the hiding places: bundled inside programs, containers and appliances', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, `${p} bundled / carry its own`).toMatch(/bundled|bring their own Java|carry its own copy/i);
      expect(t, `${p} container`).toMatch(/container/i);
      expect(t, `${p} appliance`).toMatch(/appliance|time clock/i);
    }
  });

  it('every teaching place teaches the four works: find, open wall first, patch and restart and rebuild, guard while waiting', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, `${p} restart`).toMatch(/restart|turn the program off and on again|start(s)? again/i);
      expect(t, `${p} rebuild`).toMatch(/rebuil|build a new box/i);
      expect(t, `${p} internet first`).toMatch(/internet/i);
      expect(t, `${p} guard while waiting`).toMatch(/guard/i);
    }
  });

  it('every teaching place carries the lump, the house, the candles, the flock, the wall, the bottles, the trumpet and the watchman', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(1 Corinthians 5:6)',
        '(Exodus 12:19)',
        '(Zephaniah 1:12)',
        '(Proverbs 27:23)',
        '(Nehemiah 4:13)',
        '(Matthew 9:17)',
        '(Nehemiah 4:17)',
        '(Ezekiel 33:6)',
        '(Psalms 127:1)',
        '(1 Corinthians 5:7)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
    }
  });

  it('the honest limit is in every teaching place: a mitigation guards and does not repair', () => {
    for (const p of ['lesson', 'youth', 'teen', 'senior']) {
      expect(place(MODULE, p), p).toMatch(/not a (rebuilt wall|repair)|not its repair|guards; it does not repair/i);
    }
    expect(place(MODULE, 'child')).toMatch(/When the real fix comes, you take the chair away/);
  });

  it('THE BRIGHT LINE: every teaching place says the work is not the Keeper', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/keeps the city|for the hand that keeps us|is not the Keeper|for the Keeper/);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
      expect(place(MODULE, p), p).toContain('(Colossians 1:17)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('no decision record is recited at a reader, and the notice is not linked or its sender named', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/https?:|www\.|@[a-z0-9-]+\.(edu|com)|Technology Services/i);
    }
  });

  it('outage and business continuity are left to the sibling lesson', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).not.toMatch(/business continuity|air.traffic|outage/i);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, what was told to us, and what is not verified', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says what is not verified`).toMatch(/not verified/i);
      expect(t, `${p} marks the notice as reported`).toMatch(/reported|told to us|not tested/i);
    }
  });

  it('the CVE number and the startup flag appear only as the notice states them, never as tested', () => {
    for (const p of ['lesson', 'teen']) {
      const t = place(MODULE, p);
      expect(t, p).toContain('CVE-2026-114938');
      const at = t.indexOf('CVE-2026-114938');
      expect(t.slice(Math.max(0, at - 160), at), `${p}: the number is introduced as the notice's`).toMatch(/notice/i);
    }
    expect(MODULE.lesson).toContain('-XX:-UseBASE64Intrinsics');
    expect(MODULE.lesson).toMatch(/As the notice presents it/);
  });
});

// -----------------------------------------------------------------------------
// The house, measured. If one of these fails, infra/ or the build workflows
// changed: rebuild the lesson's words (node scripts/sov101-fill.mjs --rebuild
// after editing them) so the page keeps telling the truth, in either direction
// (DR-0100).
// -----------------------------------------------------------------------------
function composeFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...composeFiles(p));
    else if (/^(docker-)?compose[\w.-]*\.ya?ml$/.test(name)) out.push(p);
  }
  return out;
}

function allFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...allFiles(p));
    else if (!/\.md$/.test(name)) out.push(p);
  }
  return out;
}

describe('our own house: every claim the lesson makes is still true of the repository', () => {
  const INFRA = join(REPO, 'infra');
  const compose = composeFiles(INFRA).map((p) => ({ rel: relative(REPO, p), text: readFileSync(p, 'utf8') }));
  const live = (t) =>
    t
      .split('\n')
      .filter((l) => !/^\s*#/.test(l))
      .join('\n');

  it('fifteen container recipes, and none names a Java image', () => {
    expect(compose.length, compose.map((f) => f.rel).join('\n')).toBe(15);
    const images = compose.flatMap((f) => [...live(f.text).matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]));
    expect(images.length).toBeGreaterThan(20);
    expect(images.filter((i) => /java|jdk|jre|temurin|openjdk|corretto|graalvm|tomcat|jetty|keycloak|elasticsearch/i.test(i))).toEqual([]);
    expect(MODULE.lesson).toMatch(/fifteen container recipes in this repository\. None of them names a Java image/);
  });

  it('a search of infra/ for every common name of a Java runtime finds only the word JavaScript', () => {
    const hits = [];
    for (const p of allFiles(INFRA)) {
      const t = readFileSync(p, 'utf8');
      for (const m of t.matchAll(/\b(java|jdk|jre|temurin|openjdk|corretto|graalvm)\w*/gi)) {
        if (!/^javascript$/i.test(m[0])) hits.push(`${relative(REPO, p)}: ${m[0]}`);
      }
    }
    expect(hits).toEqual([]);
    expect(MODULE.lesson).toMatch(/finds only the word JavaScript/);
  });

  it('Java appears only on the build runners: Temurin 17 for Android packaging, Temurin 21 for the native shell', () => {
    const android = src('.github/workflows/android-package.yml');
    const shell = src('.github/workflows/native-shell.yml');
    expect(android).toMatch(/actions\/setup-java@/);
    expect(android).toMatch(/distribution:\s*temurin[\s\S]{0,80}?java-version:\s*'17'/);
    expect(shell).toMatch(/actions\/setup-java@/);
    expect(shell).toMatch(/distribution:\s*temurin[\s\S]{0,80}?java-version:\s*'21'/);
    expect(MODULE.lesson).toMatch(/One build asks for Temurin 17, and another asks for Temurin 21/);
    // Corrected 2026-11-23: a fresh runner is not a fresh runtime (a cached copy can lag).
    expect(MODULE.lesson).toMatch(/a fresh machine is not the same as a fresh runtime/);
    expect(MODULE.lesson).not.toMatch(/asking for a major version takes the newest build/);
  });

  it('the lesson names the gap inside third-party images, and does not claim it closed', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/inside every box|deep inside|bundles Java inside|hides Java|carries a Java runtime/i);
    }
  });
});

describe('provenance: the generator', () => {
  it('names the thread, fills every verse from the KJV on disk, and measures before it splices', () => {
    const g = src('scripts/sov101-fill.mjs');
    expect(g).toMatch(/1a208f5960ac285d/);
    expect(g).toMatch(/import \{ kjvText \} from '\.\/lib\/kjv\.mjs'/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
    expect(g.indexOf('fourBandFaults(filled)')).toBeGreaterThan(0);
    expect(g.indexOf('fourBandFaults(filled)')).toBeLessThan(g.indexOf('writeFileSync(CATALOG'));
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-23 by scripts/sov101-fill.mjs: adult 2,428 prose words;
    // child 0.527 / youth 0.613 / teen 0.609 / senior 0.698; grades 2.15 <
    // 4.93 < 5.21 < 9.66. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(2200);
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

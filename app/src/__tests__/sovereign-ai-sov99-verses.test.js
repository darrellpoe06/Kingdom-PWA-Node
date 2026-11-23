// @vitest-environment node
// =============================================================================
// sov99 — every quotation is the corpus verbatim, his spoken framing leads and
// is never put in quotation marks, the house is traced to its real code, and
// the lesson is whole in every band (DR-1578)
// =============================================================================
// Sovereign A.I. week 99, "The song that goes with you", is Darrell's SPOKEN
// teaching of 2026-09-24 (4:57pm), marked "Lesson." It was first built as sov29
// under DR-0634 on PR #1814, which never landed (the slot and the number went
// to other work; the branch has no merge base with main). Rebuilt on fresh
// main by scripts/sov99-fill.mjs, every verse filled from the KJV on disk.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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

const ID = 'sov99-the-song-that-goes-with-you';
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
  ['Proverbs 6:22', 'when thou sleepest, it shall keep thee'],
  ['Exodus 33:14', 'My presence shall go with thee'],
];
const REVIEW = 're-review: 2026-12-03';

// MEASURED 2026-11-19 on the spliced module (scripts/sov99-fill.mjs output):
// 28 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 28;
const QUOTED_FLOOR = 100;

describe('sov99 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 99, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    // Re-pinned 2026-11-23 (DR-1615): a later week now follows this one
    // (sov101 on this branch; sov100, DR-1611, may land first), so the pin is
    // the neighbor, not the tail: the week after 99 is a higher week.
    const at = SOVEREIGN_AI_MODULES.indexOf(MODULE);
    expect(at).toBeGreaterThanOrEqual(0);
    expect(SOVEREIGN_AI_MODULES[at + 1].id).toMatch(/^sov10[01]-/);
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
    L.lesson = L.lesson.replace('when thou sleepest, it shall keep thee', 'when thou sleepest, it shall guard thee');
    expect(verbatimFaults(stringsOf(L)).length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: his spoken words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' He said "Leaving a tab should not make the player stop playing."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God keeps the radio playing. Satan stops it.';
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
    expect(refs.slice(0, 2)).toEqual(['Proverbs 6:22', 'Exodus 33:14']);
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
    expect(earlier).not.toContain('Proverbs 6:22');
    expect(earlier).not.toContain('Exodus 33:14');
  });
});

describe('his framing leads, the Word frames the hour, and the bright line is held', () => {
  it('every teaching place carries his framing (the tab, the radio) without quotation marks', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, `${p} names the radio`).toMatch(/radio/i);
      expect(t, `${p} names leaving the tab or page`).toMatch(/another tab|leave the tab|leaving a tab|new page|left the tab/i);
    }
  });

  it('in every teaching place Proverbs 6:22 is quoted before the house’s code is described', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const body = t.slice(t.indexOf('THE WORD FIRST'));
      const tech = body.search(/\b(engine|code)\b/i);
      expect(t.indexOf('THE WORD FIRST'), `${p} has a Word-first section`).toBeGreaterThan(0);
      expect(tech, `${p} teaches the house`).toBeGreaterThan(0);
      expect(body.indexOf('(Proverbs 6:22)'), `${p}: the Word stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the presence, the Keeper, the song, the servant and the good in your hand', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(Proverbs 6:22)',
        '(Exodus 33:14)',
        '(Exodus 13:22)',
        '(Psalms 121:4)',
        '(Matthew 28:20)',
        '(Acts 16:25)',
        '(Mark 10:45)',
        '(Proverbs 3:27)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
    }
  });

  it('THE BRIGHT LINE: every teaching place says no tool is Yahweh, and the older places that no player is a Keeper', () => {
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/(is not|no tool is|no instrument of ours is) (the presence of )?Yahweh/i);
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/no player is a Keeper|a player is not a Keeper/i);
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
      expect(place(MODULE, p), p).toContain('(Colossians 1:17)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the not-re-run test and the unverified phone', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says the browser test was not run again`).toMatch(/not run again|not test it again|not re-run|not repeated/i);
      expect(t, `${p} says the phone is not verified`).toMatch(/not verified/i);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  const tts = src('app/src/lib/tts.js');
  const control = src('app/src/components/TTSControl.jsx');

  it('an engine that is not speaking cancels nothing; only the reader’s own Stop stops the reader', () => {
    const stop = tts.slice(tts.indexOf('    stop() {'), tts.indexOf('    setRate(r) {'));
    expect(stop).toMatch(/if \(this\.status !== 'idle'\) \{\s*try \{ this\.synth\.cancel\(\); \}/);
    expect(MODULE.lesson).toMatch(/a part of the app that is not speaking may not stop the voice; only the reader's own Stop stops the reader/);
  });

  it('the small player rides along on every tab and offers the way back to the voice', () => {
    expect(control).toMatch(/Back to the voice/);
    expect(MODULE.lesson).toMatch(/A small player now goes with you to every tab while the Word plays/);
  });

  it('the browser measurement is told as recorded, and the phone as not verified', () => {
    expect(MODULE.lesson).toMatch(/That measurement was not run again for this lesson/);
    expect(MODULE.lesson).toMatch(/his own phone, leaving a tab and switching apps - is not verified here/);
  });

  it('provenance: the generator names PR #1814 and its never-landed record, and fills every verse from the KJV on disk', () => {
    const g = src('scripts/sov99-fill.mjs');
    expect(g).toMatch(/PR #1814/);
    // The original record (written for PR #1814) never landed, so the generator
    // names it without its number: decision-citation-guard fails any cited DR
    // that has no file (re-pinned 2026-11-19 when sov99 met main).
    expect(g).toMatch(/first built as sov29 under its own decision record/);
    expect(g).toMatch(/never\s+(\/\/\s+)?landed/);
    expect(g).toMatch(/import \{ kjvText \} from '\.\/lib\/kjv\.mjs'/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-19 by scripts/sov99-fill.mjs: adult 1,953 prose words;
    // child 0.524 / youth 0.614 / teen 0.607 / senior 0.633; grades 1.26 <
    // 4.82 < 5.03 < 8.85. Pinned with tolerance.
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

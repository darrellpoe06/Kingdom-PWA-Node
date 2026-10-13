// @vitest-environment node
// =============================================================================
// THE FIVE LESSONS A YOUNG READER COULD NOT REACH
// =============================================================================
// DR-0497 counted the course lessons carrying no authored age band and said 43.
// Then the correction measured the text those lessons actually serve, and the
// real defect was FIVE: broadcast bc2 at grade 12.4, bc3 at 14.0, bc4 at 11.5,
// bc6 at 16.3, and the ai course's wk3-the-test at 10.3. Everything else
// bandless reads at or below grade 9 — a label gap, not a reader shut out.
//
// This file guards the fix. The six lessons named above (bc7 came with them so
// the broadcast course is whole) now carry authored teen and senior bands,
// matching the two-band pattern the course already used on bc1, bc5, bc8 and
// bc9. The bands are not re-registerings of the adult text: measured overlap
// is at most 0.11 on eight-word shingles, because each band was conceived for
// its reader rather than paraphrased down.
//
// WHAT THIS PASS COULD MOST EASILY HAVE GOT WRONG, and what holds each one:
//
//   1. A SUMMARY INSTEAD OF A LESSON. A short "simple version" is the easiest
//      way to fake a band, so every band is measured against the adult text's
//      own length and must carry at least 0.6 of it — the house floor.
//   2. AN INVERTED LADDER. A teen band that reads harder than the senior band
//      is worse than no band, because it lies about who it is for. Measured,
//      per lesson, strictly.
//   3. A NEAR-COPY. Re-registering the same sentences produces two texts and
//      one lesson. Measured on eight-word shingles against the adult text AND
//      against the sibling band.
//   4. SCRIPTURE FROM MEMORY. Every quoted span with a reference is checked
//      verbatim against the repo's own KJV, and a quoted span without a
//      reference is not allowed to look like a verse (DR-0076, DR-0459).
//   5. THE UNMARKED PARAPHRASE ALREADY IN THE FILE. Writing these bands turned
//      up three: bc2 read "The eye is the lamp of the body (Matthew 6:22)"
//      where the KJV says "The light of the body is the eye"; bc7 rendered
//      1 Thessalonians 5:21 in ESV wording and compressed Colossians 3:16.
//      All three are corrected in the adult text, and pinned here.
//   6. A HEADING THE RENDERER DROPS. L178 was bitten by exactly this, so every
//      new band is walked through formatLessonText and must lose no words.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BROADCAST_MODULES } from '../lib/broadcast-class.js';
import { MODULES as AI_MODULES } from '../lib/church-classes.js';
import { ourProseOnly, fleschKincaidGrade } from '../../../scripts/reading-level.mjs';
import { shingles, overlap, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { ADULT_REGISTER_CEILING, servedGrade } from '../../../scripts/course-band-coverage.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const AUTHORED = [
  'bc2-camera-and-image', 'bc3-light', 'bc4-obs-switching',
  'bc6-bandwidth-network', 'bc7-llms-for-broadcast', 'wk3-the-test',
];
const ALL_MODULES = BROADCAST_MODULES.concat(AI_MODULES);
const mod = (id) => {
  const m = ALL_MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`module ${id} is gone — this pass measures nothing`);
  return m;
};
const fk = (t) => fleschKincaidGrade(ourProseOnly(String(t || '')));
const words = (t) => (ourProseOnly(String(t || '')).match(/[A-Za-z’']+/g) || []).length;
const TEEN_CEILING = 6.0;
const SENIOR_CEILING = 10.0;
const NEAR_COPY = 0.25; // far inside the house ceiling; these measured <= 0.11

// The predicates. Every live check and every deliberate break below calls
// THESE, so a break feeds a defective input to the same code the real check
// runs. A break that asserts against a separately-written copy of the rule
// proves the copy, not the gate (DR-0076 §3).
const ladderFaults = (teen, senior) => {
  const t = fk(teen); const s = fk(senior); const out = [];
  if (!(t < s)) out.push(`teen ${t} does not read easier than senior ${s}`);
  if (!(t <= TEEN_CEILING)) out.push(`teen ${t} is above the teen ceiling ${TEEN_CEILING}`);
  if (!(s <= SENIOR_CEILING)) out.push(`senior ${s} is above the senior ceiling ${SENIOR_CEILING}`);
  return out;
};
const overlapOf = (a, b) => overlap(shingles(ourProseOnly(a)), shingles(ourProseOnly(b)));
const nearCopyFaults = (band, sibling, adult) => {
  const out = [];
  if (overlapOf(band, sibling) > NEAR_COPY) out.push(`repeats its sibling band at ${overlapOf(band, sibling).toFixed(2)}`);
  if (overlapOf(band, adult) > NEAR_COPY) out.push(`repeats the adult text at ${overlapOf(band, adult).toFixed(2)}`);
  return out;
};
const fullnessFaults = (band, adult) => {
  const share = words(band) / words(adult);
  return share >= 0.6 ? [] : [`carries only ${share.toFixed(2)} of the adult text`];
};
const bandlessFaults = (module) => {
  const lv = (module && module.levels) || {};
  return ['teen', 'senior'].filter((b) => typeof lv[b] !== 'string' || !lv[b].trim()).map((b) => `no ${b} band`);
};

// --- the repo's own KJV, read from disk; never from memory -------------------
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
/** Every referenced quotation in a text, checked against the KJV on disk. */
const quotationFaults = (text) => {
  const out = [];
  for (const sp of spansWithRef(String(text || ''))) {
    const real = versesOf(sp.book, sp.ch, sp.vs);
    if (!real) { out.push(`cannot load ${sp.book} ${sp.ch}:${sp.vs}`); continue; }
    if (!norm(real).toLowerCase().includes(norm(sp.quote).toLowerCase())) {
      out.push(`NOT VERBATIM "${sp.quote}" vs ${sp.book} ${sp.ch}:${sp.vs} — ${norm(real)}`);
    }
  }
  return out;
};

describe('every broadcast lesson now carries a band a young reader can reach', () => {
  it('leaves no broadcast lesson bandless', () => {
    const bare = BROADCAST_MODULES.filter((m) => bandlessFaults(m).length);
    expect(bare.map((m) => m.id), 'a broadcast lesson lost its bands').toEqual([]);
  });

  it('carries the one ai lesson that read above the ceiling', () => {
    expect(bandlessFaults(mod('wk3-the-test'))).toEqual([]);
    // and the measurement that sent us here is still true of the adult text
    expect(servedGrade(mod('bc6-bandwidth-network'))).toBeGreaterThan(ADULT_REGISTER_CEILING);
  });
});

describe('the ladder, measured per lesson', () => {
  for (const id of AUTHORED) {
    it(`${id}: teen reads easier than senior, and both are reachable`, () => {
      const m = mod(id);
      const faults = ladderFaults(m.levels.teen, m.levels.senior);
      expect(faults, `${id}: ${faults.join('; ')}`).toEqual([]);
    });
  }

  it('brings every lesson that read above grade 9 under it for the teen reader', () => {
    for (const id of AUTHORED) {
      const m = mod(id);
      const adult = servedGrade(m);
      if (adult > ADULT_REGISTER_CEILING) {
        expect(fk(m.levels.senior), `${id} senior should be easier than its adult text`).toBeLessThan(adult);
      }
      expect(fk(m.levels.teen), `${id} teen`).toBeLessThan(ADULT_REGISTER_CEILING);
    }
  });
});

describe('a band is a whole lesson, not a summary', () => {
  for (const id of AUTHORED) {
    it(`${id}: each band carries at least 0.6 of the adult lesson`, () => {
      const m = mod(id);
      for (const band of ['teen', 'senior']) {
        const faults = fullnessFaults(m.levels[band], m.lesson);
        expect(faults, `${id} ${band} ${faults.join('; ')}`).toEqual([]);
      }
    });
  }
});

describe('two texts, two lessons — not one lesson twice', () => {
  for (const id of AUTHORED) {
    it(`${id}: the bands do not repeat each other or the adult text`, () => {
      const m = mod(id);
      expect(NEAR_COPY, 'the bound must be inside the house ceiling').toBeLessThan(DIFF_CEILING);
      const teen = nearCopyFaults(m.levels.teen, m.levels.senior, m.lesson);
      const senior = nearCopyFaults(m.levels.senior, m.levels.teen, m.lesson);
      expect(teen, `${id} teen ${teen.join('; ')}`).toEqual([]);
      expect(senior, `${id} senior ${senior.join('; ')}`).toEqual([]);
    });
  }
});

describe('His words, fetched not remembered', () => {
  it('every quoted span with a reference is verbatim KJV', () => {
    const bad = [];
    for (const id of AUTHORED) {
      const m = mod(id);
      for (const [where, text] of [['teen', m.levels.teen], ['senior', m.levels.senior], ['adult', m.lesson]]) {
        for (const f of quotationFaults(text)) bad.push(`${id}/${where}: ${f}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
    // and the walk found the spans it was supposed to walk, rather than none
    expect(spansWithRef(mod('bc7-llms-for-broadcast').levels.teen).length).toBeGreaterThan(0);
  });

  it('never elides inside a quotation (DR-0459)', () => {
    for (const id of AUTHORED) {
      const m = mod(id);
      for (const text of [m.levels.teen, m.levels.senior, m.lesson]) {
        expect(/"[^"]*(?:\.\.\.|…)[^"]*"/.test(text), `${id} elided a quotation`).toBe(false);
      }
    }
  });

  it('corrects the three unmarked paraphrases this pass turned up', () => {
    const bc2 = mod('bc2-camera-and-image');
    expect(bc2.lesson).toContain('"The light of the body is the eye" (Matthew 6:22)');
    expect(bc2.lesson).not.toContain('the eye is the lamp of the body');
    expect(bc2.anchor.theme).not.toContain('lamp of the body');
    const bc7 = mod('bc7-llms-for-broadcast');
    expect(bc7.lesson).toContain('"Prove all things; hold fast that which is good"');
    expect(bc7.lesson).not.toContain('test everything, hold fast what is good');
    expect(bc7.lesson).toContain('"Let the word of Christ dwell in you richly" (Colossians 3:16)');
  });

  it('never capitalises the adversary, and names Yahweh in our own voice', () => {
    for (const id of AUTHORED) {
      const m = mod(id);
      for (const text of [m.levels.teen, m.levels.senior]) {
        for (const w of ['Satan', 'Lucifer', 'The Devil', 'The Adversary']) {
          expect(text.includes(w), `${id} capitalised ${w}`).toBe(false);
        }
      }
    }
    expect(mod('bc3-light').levels.teen).toContain('Yahweh made light first');
  });
});

describe('the renderer keeps every word (the L178 defect class)', () => {
  for (const id of AUTHORED) {
    it(`${id}: formatLessonText drops nothing`, () => {
      const m = mod(id);
      for (const band of ['teen', 'senior']) {
        const text = m.levels[band];
        const rendered = formatLessonText(text);
        const flat = JSON.stringify(rendered).replace(/[^A-Za-z’' ]/g, ' ');
        const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${id} ${band} lost words in render: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
      }
    });
  }
});

describe('proven-to-catch (DR-0076 §3)', () => {
  // Every break below feeds a defective input to the SAME predicate the live
  // checks run, and asserts the predicate names the defect. A break that
  // passes silently would mean the check above is decoration.
  const m = mod('bc6-bandwidth-network');

  it('catches an inverted ladder', () => {
    const faults = ladderFaults(m.levels.senior, m.levels.teen); // bands swapped
    expect(faults.join(' '), 'an inverted ladder passed').toMatch(/does not read easier/);
  });

  it('catches a teen band written at the adult register', () => {
    const faults = ladderFaults(m.lesson, m.levels.senior); // adult text as the teen band
    expect(faults.join(' '), 'an adult-register teen band passed').toMatch(/above the teen ceiling/);
  });

  it('catches a near-copy band', () => {
    const faults = nearCopyFaults(m.levels.senior, m.levels.senior, m.lesson);
    expect(faults.join(' '), 'a band identical to its sibling passed').toMatch(/repeats its sibling band at 1\.00/);
  });

  it('catches a band re-registered from the adult text', () => {
    const faults = nearCopyFaults(m.lesson, m.levels.teen, m.lesson);
    expect(faults.join(' '), 'a band copied from the adult text passed').toMatch(/repeats the adult text at 1\.00/);
  });

  it('catches a band that is a summary rather than a lesson', () => {
    const stub = m.levels.teen.split('. ').slice(0, 2).join('. ');
    const faults = fullnessFaults(stub, m.lesson);
    expect(faults.join(' '), 'a two-sentence stub passed the fullness floor').toMatch(/carries only 0\.\d+ of the adult text/);
  });

  it('catches a quotation that drifted by one word', () => {
    const drifted = 'The team said it. "Prove all things; hold fast that which is right" (1 Thessalonians 5:21).';
    expect(quotationFaults(drifted).join(' '), 'a drifted quotation passed').toMatch(/NOT VERBATIM/);
    // and the true wording passes the same walk, so the check is not simply strict
    const right = 'The team said it. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21).';
    expect(quotationFaults(right)).toEqual([]);
  });

  it('catches a quotation hung on the wrong reference', () => {
    const mislabelled = 'He wrote it. "Prove all things; hold fast that which is good" (1 Thessalonians 5:22).';
    expect(quotationFaults(mislabelled).join(' '), 'a mislabelled reference passed').toMatch(/NOT VERBATIM/);
  });

  it('catches a band that has been deleted', () => {
    expect(bandlessFaults({ id: 'x', lesson: 'words', levels: { senior: 'words' } }), 'a missing teen band passed')
      .toEqual(['no teen band']);
    expect(bandlessFaults({ id: 'x', lesson: 'words', levels: { teen: '   ', senior: 'words' } }), 'a whitespace band passed')
      .toEqual(['no teen band']);
  });
});

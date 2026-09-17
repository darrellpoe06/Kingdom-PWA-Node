// @vitest-environment node
//
// L165 — "I Always Had Love": gratitude measured against a real lack, and
// suffering with Him before reigning with Him.
//
// Darrell, 2026-09-17, spoken into this channel: a coworker told him he does
// not really have contact with his family; he answered with his own count —
// thirteen uncles and aunts, an interesting life, and love the whole way — then
// "you suffer with me and you reign with me", "he don't give you the spirit of
// fear, but a love, peace, joy, and sound mind", and "get down with the team,
// stay with the king, let's get home." (DR-0331: rendered for meaning.)
//
// THE ONE THING THIS LESSON COULD MOST EASILY HAVE LIED ABOUT, and the reason
// several checks below are shaped the way they are: he named FIVE things the
// Spirit gives — love, peace, joy, and a sound mind, against fear. 2 Timothy
// 1:7 carries three of them (power, love, a sound mind) and does NOT carry
// peace or joy. The easy, invisible sin here was to quote the verse with five
// words in it. Instead every band teaches the handling out loud: the verse says
// what it says, and the other two words are fetched from Galatians 5:22-23.
// So the gate checks that the DISCIPLINE is taught in each band, not merely
// that the verses appear — because a band that dropped the teaching and kept
// the references would read fine and teach nothing (DR-0076).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll165-i-always-had-love-gratitude-measured-against-a-real-lack-and-suffering-with-him-before-reigning-with-him';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

// ── the corpus, KJV_FLOW ────────────────────────────────────────────────────
// Each chapter's verses joined with a SPACE, so a contiguous-verse quotation is
// a true substring while one stitched across chapters is not.
const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
// STRICT: whitespace only. NOT apostrophes, and that is a correction rather
// than a preference. The batch that verified these spans before authoring
// normalised U+2019 to an ASCII apostrophe in BOTH directions, so it happily
// passed "one another’s burdens" and "Christ’s sufferings" written with ASCII
// apostrophes where the corpus carries the typographic ones. Nine spans across
// four bands were altered that way, this gate could not see it, and the
// catalog-wide apostrophe gate is what caught them. A comparison that forgives
// the very character it is checking is not a check (DR-0076).
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase();
const flow = (name, ch) => {
  const c = chapters[bookKey(name)];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

/** Every field of the PARSED module that carries authored text, flattened with
 *  its path. Audited field by field rather than as one raw source slice: a
 *  sequential quote-pairing over the source desynchronises on a field boundary
 *  or a backslash-escaped apostrophe and manufactures phantom findings. */
const FLAT = [];
(function flatten(node, path) {
  if (typeof node === 'string') { FLAT.push([path, node]); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${path}[${i}]`)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k);
  }
}(L, ''));

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;

describe('L165 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('I Always Had Love — Gratitude Measured Against a Real Lack, and Suffering With Him Before Reigning With Him');
  });

  it('carries all four age bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1000);
    for (const b of BANDS) {
      const ratio = proseWords(L.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the reading ladder rises and the child band clears the NEW-lesson ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    // child <= teen <= senior is the order the series gate gauges; measured
    // here too so this lesson cannot be the one that inverts it.
    expect(fk.child).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen).toBeLessThanOrEqual(fk.senior);
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
});

describe('L165 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(160);
    expect(quoted - referenced, `${quoted - referenced} unreferenced span(s)`).toBe(0);
  });

  it('every referenced span is verbatim in the KJV corpus', () => {
    const bad = [];
    let checked = 0;
    for (const [path, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        checked += 1;
        const [, span, book, ch] = m;
        const f = flow(book, ch);
        if (!f) { bad.push(`${path}: no such book ${book}`); continue; }
        if (!f.includes(norm(span))) bad.push(`${path}: ${book} ${ch} — ${norm(span).slice(0, 70)}`);
      }
    }
    expect(checked).toBeGreaterThan(160);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    // The false-attribution class, twelve of which have been stripped from this
    // catalog. His spoken lines are his — they carry the teaching, they are not
    // quotations of the Word, and a reader must never be able to mistake one
    // for the other.
    const his = [
      'get down with the team', 'stay with the king', 'let us get home',
      'put your head down and go get the information', 'thirteen uncles and aunts',
      'an interesting life',
    ];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase)) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

// ── the teaching, checked per band ─────────────────────────────────────────
// Each of these was written against a SPECIFIC band's text, never the lesson as
// a whole. A lesson-wide match proves a phrase exists somewhere; with four full
// bands repeating the same teaching, it proves nothing about the band that lost
// it (the finding that leaked three times in this pass).
const band = (b) => String(L.levels[b]);
const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);

describe('L165 — the provenance discipline is TAUGHT, in every band', () => {
  it('each band quotes 2 Timothy 1:7 exactly as it stands', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." (2 Timothy 1:7)');
    }
  });

  it('each band SAYS the verse does not carry peace and joy', () => {
    // The teaching, not the reference. A band could keep both verses and drop
    // the sentence that explains why there are two — and then it would look
    // complete while teaching the reader nothing about handling His Word.
    for (const b of BANDS) {
      const says = sentences(band(b)).some((s) => /does not say peace and joy|not say peace|different spot|somewhere else in the same Word|elsewhere in the same Word/i.test(s));
      expect(says, `${b} never says 2 Timothy 1:7 lacks peace and joy`).toBe(true);
    }
  });

  it('each band then fetches the SECOND verse rather than editing the first', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('(Galatians 5:22)');
      const rule = sentences(band(b)).some((s) => /never edit|not going to shove|refuse to push|did not squeeze|went and found|find the verse that does|found the second/i.test(s));
      expect(rule, `${b} never states the rule: go find the other verse, never edit the quotation`).toBe(true);
    }
  });
});

describe('L165 — the order nothing reverses', () => {
  it('each band carries 2 Timothy 2:12 verbatim', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('"If we suffer, we shall also reign with him: if we deny him, he also will deny us:" (2 Timothy 2:12)');
    }
  });

  it('each band states that the suffering comes FIRST and that the order is fixed', () => {
    // SCOPED PAST THE OPENING, AND THE PATTERN DEMANDS FIXITY. The first
    // version of this check accepted "before reigning" anywhere in the band and
    // so was held green by the band's own OPENING LINE — the title, restated to
    // satisfy the title-in-narrative rule. Deleting every sentence that fixed
    // the order left the gate perfectly green. That is the failure this pass
    // keeps finding in new clothes: a match proves a phrase exists, never that
    // it is doing its job where it stands.
    for (const b of BANDS) {
      const afterOpening = band(b).slice(220);
      const ordered = sentences(afterOpening).some((s) => /(order is (fixed|locked)|order does not change|not negotiable|not open to negotiation|no maturity exempts|comes first|precedes)/i.test(s));
      expect(ordered, `${b} never fixes the order`).toBe(true);
    }
  });

  it('each band carries the inheritance form, so nobody reads the suffering as the price', () => {
    for (const b of BANDS) expect(band(b), b).toContain('(Romans 8:17)');
    // Jesus paid it in full — said in our own voice, in the three bands that
    // carry the clause; the child band teaches the same thing as being His kid.
    for (const b of ['youth', 'teen', 'senior']) {
      expect(/already paid|paid that in full|paid it in full/i.test(band(b)), b).toBe(true);
    }
  });
});

describe('L165 — the lesson lands on the man with no contact', () => {
  it("each band brings all three of the Word's answers to him", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 68:6`).toContain('(Psalms 68:6)');
      expect(band(b), `${b} Psalms 27:10`).toContain('(Psalms 27:10)');
      expect(band(b), `${b} Matthew 12:50`).toContain('(Matthew 12:50)');
    }
  });

  it('each band offers him a SEAT and not sympathy', () => {
    for (const b of BANDS) {
      const seat = sentences(band(b)).some((s) => /seat/i.test(s));
      expect(seat, `${b} never offers a seat`).toBe(true);
    }
  });
});

describe('L165 — the honour, rendered where Darrell renders it', () => {
  it('the mother and the thirteen are named, and the fifth commandment is quoted', () => {
    expect(L.lesson).toContain('(Exodus 20:12)');
    expect(L.lesson).toMatch(/thirteen uncles and aunts/);
    for (const b of BANDS) expect(band(b), `${b} Exodus 20:12`).toContain('(Exodus 20:12)');
  });

  it("Uncle Russell's line is credited to him and shown as Proverbs in his own idiom", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Uncle Russell`).toMatch(/Uncle Russell/);
      expect(band(b), `${b} Proverbs 18:15`).toContain('(Proverbs 18:15)');
    }
  });
});

describe('L165 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God in OUR prose, in any band or the base', () => {
    // Case-insensitive on purpose: a heading in our own voice writing GOD in
    // capitals walked past a case-sensitive version of this check once already.
    const offences = [];
    for (const [path, text] of FLAT) {
      const ours = text.replace(ALL_SPANS, ' ');
      if (/\bGOD\b|\bGod\b/.test(ours)) offences.push(path);
    }
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('and Yahweh is named in our voice, not merely absent of the alternative', () => {
    // The mirror of the check above. Stripping "God" out of our prose without
    // ever naming Him would pass the first check and fail the rule.
    for (const b of BANDS) expect(band(b).match(/Yahweh/g) || [], b).not.toHaveLength(0);
    expect((L.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it("the KJV's own God and LORD are left exactly as written inside every quotation", () => {
    // The bright line (DR-0076 / DR-0210): the covenant-name rule governs our
    // authored voice and NEVER a quotation. This is the check that would catch a
    // blind God -> Yahweh sweep of the quoted text.
    let sawGod = 0; let sawLord = 0;
    for (const [, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\bGod\b/.test(span)) sawGod += 1;
        if (/\bLORD\b/.test(span)) sawLord += 1;
        expect(/Yahweh/.test(span), `Yahweh substituted into a quotation: ${span.slice(0, 60)}`).toBe(false);
      }
    }
    expect(sawGod, 'no quotation carries the KJV God — the sweep this guards against may already have run').toBeGreaterThan(5);
    expect(sawLord).toBeGreaterThan(3);
  });
});

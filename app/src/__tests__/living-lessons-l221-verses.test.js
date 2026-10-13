// @vitest-environment node
//
// L221 — "Owning the Light Instead of Renting It": count the cost, carry the
// risk honestly, and follow His Wisdom first.
//
// Darrell forwarded a utility-industry newsletter into the app by email on
// 2026-10-08 with one word on top, Lesson, and his own teaching under it
// (rendered for meaning, DR-0331): solar panel costs, and switching to owning
// them rather than renting power from a utility; paying that off in twenty
// years or less at two percent interest will save money against an
// ever-increasing electrical energy cost, because the grid cannot keep up with
// the demand or the projected future demand; also using electric vehicles,
// where the energy to move a car four hundred miles comes from one charge, so
// the difference between the two is night and day; however, there is risk in
// all things, and following His Wisdom is most important.
//
// The last clause governs the first ones, and the lesson is built in that
// order. Two gates run here that no other lesson needs: every quoted span is
// verbatim KJV from the in-repo corpus (DR-0076), AND every real-world number
// is attributed in the prose rather than floated as a bare claim or waved away
// as unknowable (DR-0100 — the lesson must state established fact plainly and
// name the genuinely open part narrowly). DR-0821.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThreeEverywhere } from '../lib/talk-together.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll221-owning-the-light-instead-of-renting-it-count-the-cost-carry-the-risk-honestly-and-follow-his-wisdom-first';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase();
const flow = (name, ch) => {
  const c = chapters[bookKey(name)];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

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
const band = (b) => String(L.levels[b]);
const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);
const grown = `${L.lesson} ${band('teen')} ${band('senior')}`;

describe('L221 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Owning the Light Instead of Renting It — Count the Cost, Carry the Risk Honestly, and Follow His Wisdom First');
  });
  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
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
    expect(fk.child).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen).toBeLessThanOrEqual(fk.senior);
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('every band and the lesson send the reader to someone: parents to children, children to parents, friend to friend (DR-0733)', () => {
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });
});

describe('L221 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(80);
    expect(quoted - referenced, `${quoted - referenced} unreferenced span(s)`).toBe(0);
  });
  it('every referenced span is verbatim in the KJV corpus, strictly', () => {
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
    expect(checked).toBeGreaterThan(80);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ['night and day', 'risk in all things', 'projected future demand', 'solar panel'];
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

describe('L221 — the teaching that makes this lesson itself, per band', () => {
  it('each band starts with whose light it is, before any price', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Genesis 1`).toMatch(/\(Genesis 1:(14|16)\)/);
      expect(band(b), `${b} Psalms 24:1`).toContain('(Psalms 24:1)');
      const says = sentences(band(b)).some((s) => /receives|receiving|originates nothing|made the light|invents? nothing/i.test(s));
      expect(says, `${b} never says a panel receives rather than originates`).toBe(true);
    }
  });
  it('each band gives the Lord His own command to count the cost', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 14:28`).toMatch(/\(Luke 14:28(-30)?\)/);
      const says = sentences(band(b)).some((s) => /count(ing)? (the )?cost|counting is/i.test(s));
      expect(says, `${b} never tells the reader to count`).toBe(true);
    }
  });
  it('each band says what borrowing does, with the word Scripture chose', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 22:7`).toContain('(Proverbs 22:7)');
      const says = sentences(band(b)).some((s) => /servant/i.test(s));
      expect(says, `${b} never says servant`).toBe(true);
    }
  });
  it('each band separates the diligent from the hasty', () => {
    for (const b of BANDS) expect(band(b), `${b} Proverbs 21:5`).toContain('(Proverbs 21:5)');
  });
  it('each band carries the risk teaching as Scripture gives it: sow anyway, and spread it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ecclesiastes 11:2`).toContain('(Ecclesiastes 11:2)');
      expect(band(b), `${b} Ecclesiastes 11:4`).toContain('(Ecclesiastes 11:4)');
      expect(band(b), `${b} Ecclesiastes 11:6`).toContain('(Ecclesiastes 11:6)');
      expect(band(b), `${b} James 4`).toMatch(/\(James 4:(14|13-15)\)/);
    }
  });
  it('each band puts Wisdom first and keeps the Resources in order', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 4:7`).toContain('(Proverbs 4:7)');
      expect(band(b), `${b} Proverbs 24:3-4`).toContain('(Proverbs 24:3-4)');
      const says = sentences(band(b)).some((s) => /built|builds/i.test(s) && /establish|filled|fills/i.test(s));
      expect(says, `${b} never says built, established, filled`).toBe(true);
    }
  });
  it('each band sends the reader for counsel rather than deciding alone', () => {
    for (const b of BANDS) expect(band(b), `${b} Proverbs 11:14`).toContain('(Proverbs 11:14)');
  });
  it('each band carries the heart check and the standard for a steward', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 12:15`).toContain('(Luke 12:15)');
      expect(band(b), `${b} Deuteronomy 8:18`).toContain('(Deuteronomy 8:18)');
      expect(band(b), `${b} 1 Corinthians 4:2`).toContain('(1 Corinthians 4:2)');
    }
  });
  it('the grown bands read what Scripture says about interest, which is rarely read', () => {
    expect(grown).toContain('(Exodus 22:25)');
    expect(grown).toContain('(Deuteronomy 23:19-20)');
    expect(grown).toContain('(Nehemiah 5:10-11)');
  });
  it('the adult lesson carries the rest of the spine', () => {
    for (const ref of ['(Proverbs 13:11)', '(Proverbs 27:23-24)', '(Romans 13:8)', '(Proverbs 28:20)',
      '(Psalms 127:1)', '(Proverbs 16:9)', '(Proverbs 19:21)', '(Matthew 6:21)', '(Ecclesiastes 11:5)']) {
      expect(L.lesson, `adult ${ref}`).toContain(ref);
    }
  });
});

// The reason this lesson needs a gate the others do not: it carries real-world
// money numbers, and DR-0100 forbids BOTH a bare claim and a "nobody knows"
// hedge over documented fact. Every figure below is researched and attributed
// in the prose; the genuinely contested part is named narrowly, not smeared.
describe('L221 — the real-world numbers are stated plainly AND attributed (DR-0100)', () => {
  it('names who reported the installed cost per watt rather than floating a figure', () => {
    expect(grown).toMatch(/\$2\.60 per watt/);
    expect(grown).toMatch(/\$3\.36 per watt/);
    expect(grown, 'the marketplace is named').toMatch(/EnergySage/);
    expect(grown, 'the industry source is named').toMatch(/Wood Mackenzie/);
    expect(grown).toMatch(/Solar Energy Industries Association/);
  });
  it('gives the payback range AND says what governs it', () => {
    expect(grown).toMatch(/seven and fifteen years/);
    expect(grown, 'the local rate is named as the driver').toMatch(/29 cents/);
    expect(grown).toMatch(/fourteen to sixteen/);
  });
  it('states the expired federal credit and sends the reader to a professional, not a brochure', () => {
    expect(grown).toMatch(/thirty-percent federal residential credit expired/);
    expect(grown).toMatch(/tax professional/);
  });
  it('exposes the dealer fee under a two-percent rate, with the arithmetic worked', () => {
    expect(grown).toMatch(/dealer fee/);
    expect(grown).toMatch(/\$1\.50 to \$3\.00 per watt/);
    expect(grown).toMatch(/\$26,000/);
    expect(grown).toMatch(/\$32,500/);
    const says = sentences(grown).some((s) => /CASH price|cash price/.test(s) && /writing/i.test(s));
    expect(says, 'the one question that exposes it is never asked plainly').toBe(true);
  });
  it('states the rate trend with the agency named, and the contested part NARROWLY', () => {
    expect(grown).toMatch(/Energy Information Administration/);
    expect(grown).toMatch(/17\.30 cents/);
    expect(grown).toMatch(/18\.29 cents/);
    expect(grown).toMatch(/\$18\.6 billion/);
    // DR-0100 tier 2: the open part is named precisely, never as a blanket.
    expect(grown).toMatch(/contested/);
    expect(grown, 'the downward revision is not hidden').toMatch(/revised/);
    expect(grown).toMatch(/eleven gigawatts/);
  });
  it('gives the cents-per-mile gap AND the condition that erases it', () => {
    expect(grown).toMatch(/four to six cents a mile/);
    expect(grown).toMatch(/twelve to sixteen/);
    expect(grown).toMatch(/35 to 48 cents/);
    const says = sentences(grown).some((s) => /equal or exceed|equal or beat/i.test(s) && /gasoline/i.test(s));
    expect(says, 'fast charging is never said to erase the advantage').toBe(true);
  });
  it('answers his four-hundred-mile claim with the real EPA figures', () => {
    expect(grown).toMatch(/Lucid Air Grand Touring/);
    expect(grown).toMatch(/512 miles/);
    expect(grown).toMatch(/Silverado EV Max Range/);
    expect(grown).toMatch(/493/);
    // and the honest middle of the market, so nobody plans a trip on the top of it
    expect(grown).toMatch(/290 (to|and) 361/);
    const says = sentences(grown).some((s) => /freezing|cold/i.test(s) && /180/.test(s));
    expect(says, 'the cold-weather loss is never stated').toBe(true);
  });
  it("Darrell's own framing is carried, not paraphrased away", () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said).toMatch(/night and day/i);
    expect(said).toMatch(/risk in all things/i);
    expect(said).toMatch(/His Wisdom is most important/);
    expect(said).toMatch(/2026-10-08/);
    expect(said).toMatch(/two percent/i);
  });
});

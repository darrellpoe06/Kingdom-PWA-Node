// @vitest-environment node
//
// L222 — "The Only Incorruptible One": every other being fell wanting His
// wisdom, and He is proving He is good.
//
// Darrell spoke this into the app on 2026-10-08 and closed it in prayer.
// Rendered for meaning, never his voice (DR-0331): the only incorruptible
// being is Yahweh, the Godhead, the Father, the Son, the Holy Spirit. Every
// other being, the angels and the humans, was corrupted, and the corruption
// came through one desire — to be as wise and as knowledgeable as Yahweh. That
// desire is the main thing that puts a creature at odds with Him, and the
// trouble was never that He cannot be trusted. The irony he named is exact:
// you cannot trust the seat you sit on, or the air you breathe, on their own
// account — everything exists and all things consist because of Him and for
// Him. So it is a strange thing for people to pigeonhole the Being who made
// all this beauty as the evil one because evil exists, when He is plainly
// saying there is a way for evil not to exist: let Me show you, taste and see
// that I am good, rather than you will do what I say now. And if you sit back
// and look at how the world is set up, He is letting people prove they are
// evil and letting people prove they are good, and nobody proves either
// without turmoil. His closing prayer thanked Him for the lessons, for the
// ability to comprehend, and for a spiritual mind to discern these things,
// because the carnal mind would be at war all day; for bringing peace when war
// is the first instinct; and for the King's counsel and His way, in Jesus'
// name.
//
// Every double-quoted span in the module must be verbatim KJV from the in-repo
// corpus under a STRICT comparison (whitespace only, never apostrophes), every
// band must carry the full message in its own register, and the teaching that
// makes this lesson ITSELF is checked per band. DR-0822.
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

const ID = 'll222-the-only-incorruptible-one-every-other-being-fell-wanting-his-wisdom-and-he-is-proving-he-is-good';
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

describe('L222 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('The Only Incorruptible One — Every Other Being Fell Wanting His Wisdom, and He Is Proving He Is Good');
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

describe('L222 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(100);
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
    expect(checked).toBeGreaterThan(100);
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ['seat you sit on', 'all this beauty', 'war all day', 'pigeonhole', 'societal'];
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

describe('L222 — the teaching that makes this lesson itself, per band', () => {
  it('each band makes the exclusive claim about Yahweh, in the Word’s own words', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Timothy 1:17`).toContain('(1 Timothy 1:17)');
      expect(band(b), `${b} Malachi 3:6`).toContain('(Malachi 3:6)');
      expect(band(b), `${b} James 1:17`).toContain('(James 1:17)');
      const says = sentences(band(b)).some((s) => /\bONLY\b|only wise|shadow of turning|does not change|never can/i.test(s));
      expect(says, `${b} never says the claim is exclusive`).toBe(true);
    }
  });
  it('each band says every OTHER being was corruptible, angels included', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Jude 1:6`).toContain('(Jude 1:6)');
      expect(band(b), `${b} Romans 1:23`).toContain('(Romans 1:23)');
      const says = sentences(band(b)).some((s) => /angels/i.test(s));
      expect(says, `${b} never names the angels`).toBe(true);
    }
  });
  it('each band names the ONE desire, and Ezekiel’s word for what it did to wisdom', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Genesis 3:5`).toMatch(/\(Genesis 3:(5|4-5)\)/);
      expect(band(b), `${b} Isaiah 14`).toMatch(/\(Isaiah 14:(13|14|13-14)\)/);
      expect(band(b), `${b} Ezekiel 28:17`).toContain('(Ezekiel 28:17)');
      const says = sentences(band(b)).some((s) => /corrupted (his|thy|their) (own )?wisdom|corrupted it/i.test(s));
      expect(says, `${b} never says the wisdom was corrupted rather than lost`).toBe(true);
    }
  });
  it('each band shows the bait was WISDOM, from Genesis 3:6 itself', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Genesis 3:6`).toContain('(Genesis 3:6)');
      const says = sentences(band(b)).some((s) => /wise|the smart one|one who knows/i.test(s));
      expect(says, `${b} never names wisdom as the bait`).toBe(true);
    }
  });
  it('each band carries the irony: nothing holds on its own account', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Colossians 1:17`).toMatch(/\(Colossians 1:(17|16-17)\)/);
      expect(band(b), `${b} Acts 17:28`).toContain('(Acts 17:28)');
      expect(band(b), `${b} Hebrews 1:3`).toContain('(Hebrews 1:3)');
      const says = sentences(band(b)).some((s) => /consist/i.test(s));
      expect(says, `${b} never explains consist`).toBe(true);
    }
  });
  it('each band answers the charge about evil from the text, not by argument (DR-0098)', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 John 1:5`).toContain('(1 John 1:5)');
      expect(band(b), `${b} James 1:13`).toContain('(James 1:13)');
      expect(band(b), `${b} Genesis 50:20`).toContain('(Genesis 50:20)');
    }
  });
  it('each band gives His actual posture: taste and see, reason, knock, choose', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 34:8`).toContain('(Psalms 34:8)');
      expect(band(b), `${b} Isaiah 1:18`).toContain('(Isaiah 1:18)');
      expect(band(b), `${b} Revelation 3:20`).toContain('(Revelation 3:20)');
      expect(band(b), `${b} Deuteronomy 30:19`).toContain('(Deuteronomy 30:19)');
      expect(band(b), `${b} Joshua 24:15`).toContain('(Joshua 24:15)');
      const says = sentences(band(b)).some((s) => /knock/i.test(s));
      expect(says, `${b} never says He knocks`).toBe(true);
    }
  });
  it('each band says He is letting it be PROVEN, wheat and tares and wilderness', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Matthew 13:30`).toContain('(Matthew 13:30)');
      expect(band(b), `${b} Deuteronomy 8:2`).toContain('(Deuteronomy 8:2)');
      const says = sentences(band(b)).some((s) => /prove thee|being proven|being shown|show what/i.test(s));
      expect(says, `${b} never says the proving is deliberate`).toBe(true);
    }
  });
  it('each band carries the turmoil honestly, and the order tribulation works in', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 16:33`).toContain('(John 16:33)');
      expect(band(b), `${b} Romans 5`).toMatch(/\(Romans 5:(3-4|3-5)\)/);
      const says = sentences(band(b)).some((s) => /patience/i.test(s));
      expect(says, `${b} never names what tribulation works`).toBe(true);
    }
  });
  it('each band says why the carnal mind would be at war, and what the spiritual mind gives', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Corinthians 2:14`).toContain('(1 Corinthians 2:14)');
      expect(band(b), `${b} Romans 8:6`).toMatch(/\(Romans 8:(6|6-7)\)/);
      expect(band(b), `${b} 1 Corinthians 2:16`).toContain('(1 Corinthians 2:16)');
      expect(band(b), `${b} 2 Timothy 1:7`).toContain('(2 Timothy 1:7)');
    }
  });
  it('each band ends in peace and counsel rather than in a war won', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Philippians 4:7`).toContain('(Philippians 4:7)');
      expect(band(b), `${b} Romans 12:21`).toContain('(Romans 12:21)');
      expect(band(b), `${b} Psalms 73:24`).toContain('(Psalms 73:24)');
      expect(band(b), `${b} John 14:6`).toContain('(John 14:6)');
    }
  });
  it('the grown bands name the real opponent and the exclusive immortality', () => {
    expect(grown).toContain('(Ephesians 6:12)');
    expect(grown).toMatch(/\(1 Timothy 6:(15-16|16)\)/);
    expect(grown).toContain('(2 Peter 2:4)');
    expect(grown).toContain('(1 Peter 1:7)');
    expect(grown).toContain('(James 1:12)');
    expect(grown).toContain('(Revelation 4:11)');
  });
  it("Darrell's own framing is carried, not paraphrased away, and his prayer is the ending", () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said).toMatch(/seat you sit on/i);
    expect(said).toMatch(/air you breathe/i);
    expect(said).toMatch(/war all day/i);
    expect(said).toMatch(/let Me show you/i);
    expect(said).toMatch(/2026-10-08/);
    // His closing prayer is part of the word, so the lesson ends where it ended.
    expect(L.lesson).toMatch(/prayer (closed|ended)/i);
    expect(L.lesson).toMatch(/not a point won/i);
  });
});

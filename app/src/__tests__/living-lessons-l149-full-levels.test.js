// @vitest-environment node
//
// L149 — ALL FOUR LEVELS MADE FULL (DR-0418), and the three ellipses that had
// already shipped inside this lesson's quotations.
// =============================================================================
// THIS FILE SITS BESIDE living-lessons-l149-verses.test.js AND DOES NOT REPLACE
// IT. That gate was written when the lesson was authored and pins what the
// TEACHING must keep — the four readings with their count asserted, the
// told-in-advance explanation, the order of Him and then her. It still passes
// against the bands authored here, which is the first thing this pass checked.
// This file adds what the full-levels pass is responsible for: that every band
// carries the whole message, that the quotations inside the new bands are the
// Word verbatim, and that the properties most likely to be lost in a
// shortening edit are held per band rather than once.
//
// WHAT WAS MEASURED BEFORE ANY WORK. The adult lesson runs 3,036 prose words
// and the four bands held 161 / 0 / 328 / 377 — a child band at 5% of the
// message, a youth band that did not exist at all, and two more at about a
// tenth each. A reader who chose a level was handed a summary of a lesson while
// being told it was the lesson.
//
// FIVE PLACES THIS COULD HAVE GONE WRONG, and every one is a checked property.
//
//   1. THE THESIS SPLIT IN HALF. "There are different ways to play it, but
//      there is one Way to win" collapses in either direction: drop the first
//      half and you get a man who cannot hear anyone unlike him, drop the
//      second and every reading is equally true and nothing needs saving. Both
//      halves are checked in every band, with Matthew 7:13-14 and John 14:6.
//   2. THE SUSPICION MADE INTO SMALL-HEARTEDNESS. The room that disbelieved
//      Saul was reasonable: he had held coats at a stoning. A band that made
//      them the villains would teach the reader to feel wronged instead of
//      understood, so "EARNED by his own past" is checked per band.
//   3. BARNABAS REDUCED TO WARMTH. What he supplied was EVIDENCE, and he staked
//      his name on it. "Be like Barnabas, be nice" is the sentimental misread
//      this refuses; the evidence word is checked per band.
//   4. THE ORDER REVERSED. She is among the things ADDED (Matthew 6:33), never
//      the foundation. A band that lost that teaches a man to build on a person
//      and call it faith.
//   5. AN ELLIPSIS INSIDE A QUOTATION. Three of them were already shipped in
//      this lesson before this pass touched it — two clauses of 2 Corinthians 6
//      joined across two verses, Proverbs 1:2 joined to 1:4, and 1 Corinthians
//      9:19 joined to 9:22 — each presenting a truncation as the Word's own
//      words (DR-0459). They are split into genuinely verbatim spans and this
//      gate refuses any ellipsis anywhere in the module.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll149-'));
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
  if (d && d.chapters) chapters[f.replace(/\.json$/, '').toLowerCase()] = d.chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();            // STRICT (DR-0456)
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase(); // no numeral rewriting (DR-0457)
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

// THE BOOK PATTERN ALLOWS INTERNAL WORDS, and it has to: this lesson quotes
// Song of Solomon 8:7, and a `[A-Za-z]+` book name silently skipped it — the
// span read as unreferenced and was never checked against the corpus at all.
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;
const band = (b) => String(L.levels[b]);
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g, ' ');
// The quotations come out FIRST and the references stay, so a window is cut out
// of OUR prose and can never be satisfied by the Word's own words (DR-0462).
const near = (text, marker, pad = 600) => {
  const noQuotes = String(text).replace(ALL_SPANS, ' ');
  const i = noQuotes.indexOf(marker);
  if (i < 0) return '';
  const w = noQuotes.slice(Math.max(0, i - pad), i + marker.length + pad);
  return w.replace(/\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g, ' ');
};

describe('L149 full levels — all four levels carry the full message (DR-0418)', () => {
  it('is the lesson this gate is about', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Cultural Competency — the Same Word in Three Mouths, and the Man Nobody Believed');
  });

  it('EVERY BAND CLEARS THE FLOOR, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(2900);
    for (const b of BANDS) {
      const ratio = proseWords(L.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('and the youth band EXISTS, which it did not before this pass', () => {
    expect(typeof L.levels.youth).toBe('string');
    expect(proseWords(L.levels.youth)).toBeGreaterThan(1800);
  });

  it('the reading ladder rises and the child band clears the corpus ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(CHILD_CEILING);
    expect(fk.child).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen).toBeLessThanOrEqual(fk.senior);
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
});

describe('L149 full levels — every quoted span is the Word, verbatim', () => {
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
    expect(checked).toBeGreaterThan(380);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('and Song of Solomon is actually CHECKED rather than skipped as unparseable', () => {
    // The multi-word book name made this span invisible to a `[A-Za-z]+`
    // pattern: it read as unreferenced and was never compared to anything.
    const found = [];
    for (const [, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) if (m[2] === 'Song of Solomon') found.push(norm(m[1]));
    }
    expect(found.length, 'the Song of Solomon span is not being parsed').toBeGreaterThan(3);
    for (const s of found) expect(flow('Song of Solomon', 8)).toContain(s);
  });

  it('NO QUOTED SPAN ANYWHERE CARRIES AN ELLIPSIS — three of them used to', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\.\.\.|…/.test(span)) offences.push(`${path}: ${span.slice(0, 70)}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });

  it('and the three joined quotations are now SEPARATE verbatim spans', () => {
    const whole = FLAT.map(([, t]) => t).join(' ');
    for (const pair of [
      ['"as deceivers, and yet true" (2 Corinthians 6:8)', '"As sorrowful, yet alway rejoicing" (2 Corinthians 6:10)'],
      ['"To know wisdom and instruction; to perceive the words of understanding" (Proverbs 1:2)', '(Proverbs 1:4)'],
      ['(1 Corinthians 9:19)', '(1 Corinthians 9:22)'],
    ]) {
      for (const part of pair) expect(whole, `missing ${part}`).toContain(part);
    }
  });
});

describe('L149 full levels — the thesis keeps BOTH halves, in every band', () => {
  it('each band carries the one-Way half from the Word', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Matthew 7:13-14`).toContain('(Matthew 7:13-14)');
      expect(band(b), `${b} John 14:6`).toContain('(John 14:6)');
    }
  });

  it('AND EACH BAND SAYS THE OTHER HALF IN OUR OWN WORDS', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Matthew 7:13-14)', 900);
      expect(around, `${b} never says people use words differently`).toMatch(/(different|many) ways to play|(do|does) not use words the same|does not know the game the same/i);
      expect(around, `${b} never says there is one way to win`).toMatch(/one Way to win|one way to win|ONE way/i);
    }
  });
});

describe('L149 full levels — all the readings of the word survive in every band', () => {
  it('each band carries the insult reading, the endurance reading and the too-early reading', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never gives the talk-he-cannot-back reading`).toMatch(/cannot back|talks big/i);
      expect(ours, `${b} never gives the endurance reading`).toMatch(/game of LIFE|game of life/);
      expect(ours, `${b} never gives the told-too-early reading`).toMatch(/too early|too soon|too complete/i);
    }
  });

  it('and the FOURTH reading, which is the Book itself', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 1:2-4`).toContain('(Proverbs 1:2-4)');
      const around = near(band(b), '(Proverbs 1:2-4)', 700);
      expect(around, `${b} never draws out subtilty to the simple`).toMatch(/subtilty/i);
      expect(around, `${b} never names who wrote it down`).toMatch(/Father|Yahweh/);
    }
  });
});

describe('L149 full levels — the failure the Word names, and the order of ear and mouth', () => {
  it('each band carries all four verses of the listening discipline', () => {
    for (const b of BANDS) {
      for (const ref of ['(Proverbs 18:13)', '(James 1:19)', '(John 7:24)', '(Proverbs 18:17)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('and each band says the searching is the WORK', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Proverbs 18:17)', 500);
      expect(around, `${b} never says the searching is the work`).toMatch(/searching is the work|somebody checks|checking is the work/i);
    }
  });
});

describe('L149 full levels — Paul as method, not instinct', () => {
  it('each band itemises the policy rather than quoting the slogan alone', () => {
    for (const b of BANDS) {
      for (const ref of ['(1 Corinthians 9:19)', '(1 Corinthians 9:22)', '(1 Corinthians 9:23)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('each band walks Athens, and says what the study actually bought', () => {
    for (const b of BANDS) {
      for (const ref of ['(Acts 17:22)', '(Acts 17:23)', '(Acts 17:28)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(Acts 17:28)', 700);
      expect(around, `${b} never says it bought a hearing`).toMatch(/hearing|listened to/i);
      expect(around, `${b} never says it was not compromise`).toMatch(/not compromise|not going soft|still (told|preached)/i);
    }
  });

  it('and each band carries BOTH honourable readings from his own life, as two spans', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Corinthians 6:8`).toContain('(2 Corinthians 6:8)');
      expect(band(b), `${b} 2 Corinthians 6:10`).toContain('(2 Corinthians 6:10)');
    }
  });
});

describe('L149 full levels — joy under weight, counted before it is chosen', () => {
  it('each band carries the chain and the source', () => {
    for (const b of BANDS) {
      for (const ref of ['(James 1:2)', '(James 1:3)', '(James 1:4)', '(Romans 5:3)', '(Romans 5:4)', '(Romans 5:5)', '(Nehemiah 8:10)', '(Acts 5:41)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('EACH BAND COUNTS THE LOSS BEFORE THE CHOOSING — Habakkuk in that order', () => {
    for (const b of BANDS) {
      const t = band(b);
      const counting = t.indexOf('(Habakkuk 3:17)');
      const choosing = t.indexOf('(Habakkuk 3:18)');
      expect(counting, `${b} has no Habakkuk 3:17`).toBeGreaterThanOrEqual(0);
      expect(choosing, `${b} has no Habakkuk 3:18`).toBeGreaterThanOrEqual(0);
      expect(counting, `${b} chooses the joy before it counts the loss`).toBeLessThan(choosing);
      expect(near(t, '(Habakkuk 3:18)', 400), `${b} never says it is not denial`).toMatch(/not denial|not pretending/i);
    }
  });
});

describe('L149 full levels — the scene that is the whole lesson', () => {
  it('each band carries the disbelief and what Barnabas did', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Acts 9:26`).toContain('(Acts 9:26)');
      expect(band(b), `${b} Acts 9:27`).toContain('(Acts 9:27)');
    }
  });

  it('EACH BAND SAYS THE SUSPICION WAS EARNED, not small-hearted', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Acts 9:26)', 800);
      expect(around, `${b} never says the suspicion was earned by his past`).toMatch(/earned|made sense|reasonable/i);
      expect(around, `${b} never names what he had done`).toMatch(/stoning|arrest|hunt|helped kill/i);
    }
  });

  it('AND EACH BAND SAYS BARNABAS SUPPLIED EVIDENCE, not sincerity', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Acts 9:27)', 700);
      expect(around, `${b} never says evidence`).toMatch(/EVIDENCE|evidence|PROOF|proof/);
      expect(around, `${b} never says he did not ask them to be less careful`).toMatch(/less careful|not a feeling|not sincerity|his own name|put his own name/i);
    }
  });

  it('and each band lets TIME finish the work', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Galatians 1:23`).toContain('(Galatians 1:23)');
      expect(band(b), `${b} 2 Corinthians 5:17`).toContain('(2 Corinthians 5:17)');
      const around = near(band(b), '(Galatians 1:23)', 600);
      expect(around, `${b} never says they added rather than forgot`).toMatch(/added what he became|added what he had become|did not (stop remembering|forget)/i);
    }
  });
});

describe('L149 full levels — proof rather than volume, and the order', () => {
  it('each band carries the Son offering His own works', () => {
    for (const b of BANDS) {
      for (const ref of ['(John 14:11)', '(John 10:37)', '(John 10:38)', '(1 John 3:18)', '(Ephesians 5:25)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('EACH BAND KEEPS THE ORDER: she is ADDED, never the foundation', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Matthew 6:33`).toContain('(Matthew 6:33)');
      const around = near(band(b), '(Matthew 6:33)', 700);
      expect(around, `${b} never says she is added`).toMatch(/ADDED|added/);
      expect(around, `${b} never says she is not the foundation`).toMatch(/not the foundation|not the floor|idol/i);
    }
  });

  it('and each band gives the reason she is worth wanting, from the Word', () => {
    for (const b of BANDS) {
      for (const ref of ['(Proverbs 31:30)', '(Proverbs 18:22)', '(Genesis 2:18)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('and each band puts Yahweh in the same position as the man', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 5:8`).toContain('(Romans 5:8)');
      expect(band(b), `${b} 1 John 4:19`).toContain('(1 John 4:19)');
      const around = near(band(b), '(Romans 5:8)', 600);
      expect(around, `${b} never says He answered with a receipt rather than volume`).toMatch(/receipt|not (shout|answer the suspicion with volume)|did not shout/i);
    }
  });
});

describe('L149 full levels — the method, the telling, and the word that evaporates', () => {
  it('each band carries prove-and-hold-fast and the promise on asking', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Thessalonians 5:21`).toContain('(1 Thessalonians 5:21)');
      expect(band(b), `${b} James 1:5`).toContain('(James 1:5)');
      expect(band(b), `${b} Proverbs 3:5-6`).toContain('(Proverbs 3:5-6)');
      expect(band(b), `${b} Proverbs 3:3`).toContain('(Proverbs 3:3)');
      const around = near(band(b), '(James 1:5)', 500);
      expect(around, `${b} never draws out upbraideth not`).toMatch(/upbraideth not|stupid for (needing to ask|asking)/i);
    }
  });

  it('EACH BAND GIVES THE DEEPEST REASON — he was TOLD', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Psalms 25:14`).toContain('(Psalms 25:14)');
      expect(band(b), `${b} Psalms 32:8`).toContain('(Psalms 32:8)');
      const around = near(band(b), '(Psalms 32:8)', 700);
      expect(around, `${b} never says certainty with no visible basis`).toMatch(/no visible basis|nobody else can see|nothing to show/i);
      expect(around, `${b} never says better wording will not fix it`).toMatch(/better wording|not solved by|will not fix/i);
    }
  });

  it('and each band lets the word EVAPORATE at Samaria', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 4:42`).toContain('(John 4:42)');
      const around = near(band(b), '(John 4:42)', 700);
      expect(around, `${b} never says they stopped needing her`).toMatch(/stopped needing her|met Him/i);
      expect(around, `${b} never tells the told-one to go and see`).toMatch(/see for yourself|go and see/i);
    }
  });
});

describe('L149 full levels — integrity, both halves on trial, and the Way', () => {
  it('each band carries integrity as the steering rather than the brake', () => {
    for (const b of BANDS) {
      for (const ref of ['(Proverbs 11:3)', '(Proverbs 10:9)', '(Psalms 25:21)', '(Proverbs 2:10-11)', '(Proverbs 20:7)', '(Galatians 5:22-23)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(Proverbs 11:3)', 500);
      expect(around, `${b} never says integrity guides`).toMatch(/GUIDE|guide|steering/);
    }
  });

  it('and each band holds BOTH HALVES on trial, using their word and refusing their verdict', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Acts 24:14`).toContain('(Acts 24:14)');
      const around = near(band(b), '(Acts 24:14)', 700);
      expect(around, `${b} never says he used their word`).toMatch(/their word|THEY CALL/i);
      expect(around, `${b} never says he refused their verdict`).toMatch(/refuse|said no|declined/i);
    }
  });

  it('and each band names what Saul was hunting — those of this WAY', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Acts 9:2`).toContain('(Acts 9:2)');
      const around = near(band(b), '(Acts 9:2)', 600);
      expect(around, `${b} never says the name this house uses`).toMatch(/this house|before anyone called them Christians|called first/i);
    }
  });

  it('and each band closes on saying the old self out loud, then ask and read', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Timothy 1:13`).toContain('(1 Timothy 1:13)');
      expect(band(b), `${b} 1 Timothy 1:16`).toContain('(1 Timothy 1:16)');
      expect(band(b), `${b} Proverbs 4:7`).toContain('(Proverbs 4:7)');
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says hiding it asks to be taken on his word`).toMatch(/hides the old self|hides his old self/i);
    }
  });
});

describe('L149 full levels — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God in OUR prose, in any band', () => {
    const offences = [];
    for (const b of BANDS) if (/\bGOD\b|\bGod\b/.test(ourVoice(band(b)))) offences.push(b);
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('Yahweh is named several times in every band', () => {
    for (const b of BANDS) {
      const n = (band(b).match(/Yahweh/g) || []).length;
      expect(n, `${b} names Yahweh only ${n} time(s)`).toBeGreaterThanOrEqual(3);
    }
  });

  it("the KJV's own God and LORD are left exactly as written inside every quotation", () => {
    let sawGod = 0; let sawLord = 0;
    for (const b of BANDS) {
      for (const span of band(b).match(ALL_SPANS) || []) {
        if (/\bGod\b/.test(span)) sawGod += 1;
        if (/\bLORD\b/.test(span)) sawLord += 1;
        expect(/Yahweh/.test(span), `Yahweh substituted into a quotation: ${span.slice(0, 60)}`).toBe(false);
      }
    }
    expect(sawGod, 'no quotation carries the KJV God — a sweep may already have run').toBeGreaterThan(10);
    expect(sawLord).toBeGreaterThan(10);
  });
});

// @vitest-environment node
//
// L170 — "Through the Eyes of the People Closest to Him", and the history
// pulled out.
//
// Darrell, 2026-09-17, spoken into this channel and marked lesson twice
// (rendered for meaning, DR-0331): see the Word through the eyes of the people
// nearest Jesus, so His will and His way and who He was are accented and we see
// Him clearer. Peter in vivid detail — the man who can say taste and see
// because he actually walked it, and the same man who said he did not know Him
// while the bird did what it did. His brothers, who did not believe until after
// He was gone. Who is my mother, my sister, my brother. The local community not
// showing Him love. The people present at the death. The burial details. The
// resurrection witnesses including the five hundred. The history and
// archaeology — when it was pulled out of the ground, what did they see. And a
// claim of his to check carefully: more data about Jesus than about Julius
// Caesar, while people accept Caesar.
//
// SIX PLACES THIS LESSON COULD HAVE GONE WRONG, and every one is a checked
// property below rather than a note in a record nobody reads.
//
//   1. HALF A PETER. Either half alone is a man who never existed: the
//      confession without the cursing, or the denial without the restoration.
//      Both halves and the look (Luke 22:61) are checked per band.
//   2. "WHO IS MY MOTHER" WITHOUT ITS SETTING. The saying is quoted constantly
//      without the detail that His own family was standing outside asking for
//      Him, and without the fact that the same Man housed His mother from the
//      cross. The setting is checked per band.
//   3. AN INVENTED-LOOKING BURIAL. The burial is the most checkable material in
//      the account, and the Word's own record of the RIVAL story — priced, and
//      conceded to have spread (Matthew 28:12-15) — is the part that no
//      invented account would carry. Checked per band.
//   4. SCRIPTURE AND ARCHAEOLOGY BLURRED TOGETHER. The material that is not
//      Scripture is separated and said at its own strength. Every band states
//      that the section is not Scripture.
//   5. A DISPUTED ARTEFACT USED AS PROOF. The James ossuary was judged a
//      forgery by an IAA committee in 2003; the 2012 acquittal of its owner did
//      not establish that the inscription is ancient. Every band names it,
//      labels it disputed, and refuses it (DR-0076).
//   6. THE CAESAR CLAIM OVERSTATED. The manuscript form of it is true and
//      strong. "More data of every kind" is not: Caesar has lifetime coinage,
//      his own writings and contemporary inscriptions. Every band carries BOTH
//      halves, because under-claiming and over-claiming are both lying
//      (DR-0076 with DR-0100).
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

const ID = 'll170-through-the-eyes-of-the-people-closest-to-him-and-the-history-pulled-out';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
  if (!d || !d.chapters) continue;
  chapters[f.replace(/\.json$/, '').toLowerCase()] = d.chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();       // STRICT (DR-0456)
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

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;
const band = (b) => String(L.levels[b]);
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
// Quotations come OUT FIRST and the references stay, so the window is cut out of
// our own prose. Slicing the raw band and stripping afterwards puts the whole
// quotation back into the window through an unbalanced quote mark — that was a
// real defect in L169's first version of this helper (DR-0462).
const near = (text, marker, pad = 500) => {
  const noQuotes = String(text).replace(ALL_SPANS, ' ');
  const i = noQuotes.indexOf(marker);
  if (i < 0) return '';
  const w = noQuotes.slice(Math.max(0, i - pad), i + marker.length + pad);
  return w.replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
};

describe('L170 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Through the Eyes of the People Closest to Him — and the History Pulled Out');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(14);
    expect(L.benefits.length).toBeGreaterThanOrEqual(13);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(12);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1800);
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
});

describe('L170 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(320);
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
    expect(checked).toBeGreaterThan(320);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('NO QUOTED SPAN CARRIES AN ELLIPSIS — a truncation is not a quotation', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\.\.\.|…/.test(span)) offences.push(`${path}: ${span.slice(0, 60)}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });

  it("DARRELL'S OWN WORDS, and the outside history, are never dressed as Scripture", () => {
    const notTheWord = [
      'pulled out of the ground', 'see Him clearer', 'more data', 'Julius Caesar', 'ossuary',
      'Tacitus', 'Josephus', 'Caesarea Maritima', 'Yehohanan', 'manuscripts',
    ];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of notTheWord) if (inner.includes(phrase.toLowerCase())) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

describe('L170 — Peter, both halves, because one half is a man who never existed', () => {
  it('each band carries the taste, the confession, the denial and the look', () => {
    for (const b of BANDS) {
      for (const ref of ['(1 Peter 2:3)', '(Psalms 34:8)', '(Matthew 16:16)', '(Matthew 26:34)',
        '(Matthew 26:74)', '(Luke 22:61)', '(Luke 22:62)', '(Mark 14:72)', '(John 21:16)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('EACH BAND SAYS IN OUR WORDS that the restoration came after the denial, to the same man', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(John 21:16)', 700);
      expect(around, `${b} never joins the two halves`).toMatch(/same man|both are true|restored by name|both halves|gave him a (flock|job)|did not throw him away/i);
    }
  });
});

describe('L170 — the brothers, the family, and the town', () => {
  it('each band carries the unbelief and what changed it', () => {
    for (const b of BANDS) {
      for (const ref of ['(John 7:5)', '(Acts 1:14)', '(1 Corinthians 15:7)', '(Galatians 1:19)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(1 Corinthians 15:7)', 600);
      expect(around, `${b} never says unbelief close up is not the end`).toMatch(/not the end|was not finished|changed/i);
    }
  });

  it('EACH BAND KEEPS THE SETTING of "who is my mother" — His family was outside', () => {
    for (const b of BANDS) {
      for (const ref of ['(Mark 3:33)', '(Mark 3:34)', '(Mark 3:35)', '(Matthew 12:50)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(Mark 3:33)', 700);
      expect(around, `${b} never says they stood outside`).toMatch(/outside/i);
    }
  });

  it('and each band keeps Him caring for His mother anyway', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 19:26-27 beside the redefinition`).toMatch(/\(John 19:26-27\)|\(John 19:26\)/);
      // WINDOWED, and a break proved it had to be: matched against the whole
      // band, "home" was satisfied by "home town" three sections away, so the
      // check survived a band that had stopped saying what He actually did.
      const around = near(band(b), '(John 19:27)', 500);
      expect(around, `${b} never says what He did for His mother`).toMatch(/housing|somewhere to live|her care|a home|took care/i);
    }
  });

  it('each band carries the town, in His own three circles', () => {
    for (const b of BANDS) {
      for (const ref of ['(Mark 6:3)', '(Mark 6:4)', '(Luke 4:24)', '(John 4:44)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(John 4:44)', 600);
      expect(around, `${b} never says familiarity is not knowledge`).toMatch(/familiarity|knowing about|too well|not the same/i);
    }
  });
});

describe('L170 — the death and the burial, which is the checkable part', () => {
  it('each band names who was there', () => {
    for (const b of BANDS) {
      for (const ref of ['(Matthew 27:54)', '(Luke 23:48)', '(Luke 23:49)', '(John 19:25)', '(John 19:27)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('each band carries the whole burial chain', () => {
    for (const b of BANDS) {
      for (const ref of ['(Mark 15:43)', '(Mark 15:44)', '(Mark 15:45)', '(Mark 15:46)',
        '(Luke 23:53)', '(John 19:39)', '(John 19:41)', '(Matthew 27:64)', '(Matthew 27:65)', '(Matthew 27:66)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('EACH BAND CARRIES THE RIVAL STORY THE WORD ITSELF RECORDS, and says what that means', () => {
    // The property that does the most work in the whole lesson: a document
    // inventing a resurrection does not write down the competing explanation,
    // name the money, and concede that it spread.
    for (const b of BANDS) {
      for (const ref of ['(Matthew 28:12)', '(Matthew 28:13)', '(Matthew 28:15)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(Matthew 28:15)', 700);
      expect(around, `${b} never draws the conclusion`).toMatch(/invent|made-up|would not (write|record|do that)|not do that/i);
    }
  });
});

describe('L170 — the witnesses, counted while they were alive', () => {
  it('each band carries the list, the five hundred and the checking clause', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Corinthians 15:5`).toContain('(1 Corinthians 15:5)');
      expect(band(b), `${b} 1 Corinthians 15:6`).toContain('(1 Corinthians 15:6)');
      const around = near(band(b), '(1 Corinthians 15:6)', 500);
      expect(around, `${b} never points at the clause that invites checking`).toMatch(/ask them|still alive|greater part remain|go and ask/i);
    }
  });

  it('each band keeps Thomas being GIVEN the evidence rather than rebuked', () => {
    for (const b of BANDS) {
      for (const ref of ['(John 20:25)', '(John 20:27)', '(John 20:28)', '(John 20:29)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(John 20:27)', 500);
      expect(around, `${b} never says he was not rebuked`).toMatch(/not rebuked|did not get mad|handed it|given it|let him check|was given/i);
    }
  });

  it('each band keeps the physical proofs and the forty days', () => {
    for (const b of BANDS) {
      for (const ref of ['(Luke 24:39)', '(Luke 24:42)', '(Luke 24:43)', '(Acts 1:3)', '(Acts 4:20)', '(2 Peter 1:16)', '(1 John 1:1)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });
});

describe("L170 — the Word's own history, pulled out first", () => {
  it("each band carries Luke's method, purpose and date", () => {
    for (const b of BANDS) {
      for (const ref of ['(Luke 1:2)', '(Luke 1:4)', '(Luke 3:1)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('each band carries the public notice in three languages', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 19:19`).toContain('(John 19:19)');
      expect(band(b), `${b} John 19:20`).toContain('(John 19:20)');
      expect(ourVoice(band(b)), `${b} never says three languages`).toMatch(/three (working )?languages/i);
    }
  });
});

describe('L170 — the outside history, at the strength it actually has', () => {
  it('EVERY BAND SAYS THIS SECTION IS NOT SCRIPTURE', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never separates it from the Word`).toMatch(/not Scripture|not the Bible/i);
    }
  });

  it('every band names the written outside witnesses AND the editing question', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never names Tacitus`).toMatch(/Tacitus/);
      expect(ours, `${b} never names Josephus`).toMatch(/Josephus/);
      expect(ours, `${b} never admits the later editing in the longer passage`).toMatch(/editing|edited/i);
    }
  });

  it('every band names the two solid finds, with their years', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never names the Pilate inscription`).toMatch(/Pontius Pilatus|Pontius Pilate/);
      expect(ours, `${b} never dates it`).toMatch(/1961/);
      expect(ours, `${b} never names the heel bone`).toMatch(/heel bone/i);
      expect(ours, `${b} never dates it`).toMatch(/1968/);
    }
  });

  it('EVERY BAND LABELS THE JAMES OSSUARY DISPUTED AND REFUSES IT AS PROOF', () => {
    // The check Darrell asked for by name. An acquittal is not an
    // authentication, and a disputed artefact used as proof damages the case it
    // was meant to help — so the refusal is stated, per band, beside the item.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      const i = ours.search(/James son of Joseph/i);
      expect(i, `${b} never names the disputed item`).toBeGreaterThanOrEqual(0);
      const around = ours.slice(Math.max(0, i - 200), i + 900);
      expect(around, `${b} never says a committee judged it a forgery`).toMatch(/forgery|faked/i);
      expect(around, `${b} never says the acquittal is not an authentication`).toMatch(/does not (prove|establish)/i);
      expect(around, `${b} never refuses it as proof`).toMatch(/not use it as proof|not used as proof|set aside|do not use it/i);
    }
  });
});

describe('L170 — the Caesar claim, in the form that is TRUE (DR-0076 with DR-0100)', () => {
  it('every band states the manuscript comparison with its numbers', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never gives the Greek manuscript count`).toMatch(/5,800|five thousand eight hundred/);
      expect(ours, `${b} never dates the earliest Caesar manuscript`).toMatch(/ninth century|nine hundred years/i);
    }
  });

  it('AND EVERY BAND SAYS WHAT CAESAR HAS THAT JESUS DOES NOT — the half that keeps it honest', () => {
    // Under-claiming a verified truth and over-claiming an unverified one are
    // both failures of truth (DR-0100). The manuscript half is stated plainly;
    // the coinage half is stated in the same breath, in every band, or the
    // lesson is teaching a claim that collapses under one hostile question.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never names the lifetime coinage`).toMatch(/coin/i);
      expect(ours, `${b} never says a provincial leaves none`).toMatch(/no coinage|nobody made coins|leaves no coin/i);
      // WINDOWED at the manuscript number, and a break proved it had to be:
      // matched against the whole band, "both" was satisfied by "both halves of
      // him" in the Peter section, so the check survived a band that had
      // dropped the concession entirely.
      // WINDOWED on the Caesar mention itself, and a break proved it had to
      // be: matched against the whole band, "both" was satisfied by "both
      // halves of him" in the Peter section, so the check survived a band that
      // had dropped the concession entirely. "Julius Caesar" occurs once per
      // band, in this section only, so the window is that section and nothing
      // else — the pad is wide because the section is long, not because the
      // check needed room to pass.
      const around = near(band(b), 'Julius Caesar', 1600);
      expect(around, `${b} never names the lifetime coinage beside the claim`).toMatch(/coin/i);
      expect(around, `${b} never says both halves are true beside the claim`).toMatch(/both|and the honest part|the sentence that (holds|survives)/i);
    }
  });
});

describe('L170 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God anywhere in OUR prose', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      if (/\bGOD\b|\bGod\b/.test(ourVoice(text))) offences.push(path);
    }
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('Yahweh is named several times in every band, not merely once', () => {
    for (const b of BANDS) {
      const n = (band(b).match(/Yahweh/g) || []).length;
      expect(n, `${b} names Yahweh only ${n} time(s)`).toBeGreaterThanOrEqual(3);
    }
    expect((L.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it("the KJV's own God and LORD are left exactly as written inside every quotation", () => {
    let sawGod = 0; let sawLord = 0;
    for (const [, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\bGod\b/.test(span)) sawGod += 1;
        if (/\bLORD\b/.test(span)) sawLord += 1;
        expect(/Yahweh/.test(span), `Yahweh substituted into a quotation: ${span.slice(0, 60)}`).toBe(false);
      }
    }
    expect(sawGod, 'no quotation carries the KJV God — the sweep this guards against may already have run').toBeGreaterThan(10);
    expect(sawLord).toBeGreaterThan(3);
  });
});

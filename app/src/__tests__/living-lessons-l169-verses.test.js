// @vitest-environment node
//
// L169 — "Pour It Out": every seat worked, feed my sheep, and be the best in
// this too.
//
// Darrell, 2026-09-17, spoken into this channel and marked Lesson twice
// (rendered for meaning, DR-0331): at Rent-A-Center he started as an account
// manager and went account manager, assistant manager, general manager — every
// single position, with a story out of each one, because Yahweh taught him
// something through every season. Love Him with your whole mind, will, soul and
// emotion. His purpose now: pour out the knowledge, wisdom and understanding he
// already has, as much and as humbly as he can while maintaining a quality
// life — give away as much as I possibly can before I pass. He reads that as
// feed my sheep. He wants you to have a sound mind, and he loves sound-mind
// people who will still get in and take some stress, because he loves to work.
// And yet peace is the point, because He is the Prince of Peace. The close: if
// something is off with what the King says, it makes no sense not to fall in
// line — like being in the military and skipping the exercises, left, left,
// right, left. Be the best in this too.
//
// FIVE PLACES THIS LESSON COULD HAVE GONE WRONG, and every one is a checked
// property below rather than a note in a record nobody reads.
//
//   1. BORROWING JOEL'S WEIGHT FOR A DIFFERENT POURING. "Pour out" in the Word
//      is mostly Yahweh pouring His Spirit (Joel 2:28) or a man pouring his
//      heart to Him (Psalms 62:8). Neither is a man handing his understanding
//      to those behind him. That sense IS in the Word — the drink offering
//      already being poured (2 Timothy 4:6; Philippians 2:17) and the hand-off
//      (2 Timothy 2:2) — so the lesson says which is which, in every band.
//   2. HIS FRAMING QUOTED AS THOUGH IT WERE THE VERSE. Mind, will, soul and
//      emotion is his four-part way of saying ALL of you. Mark 12:30 names
//      four faculties and Deuteronomy 6:5 names three. Both verses are quoted
//      and the framing is named as his, per band.
//   3. THE LADDER AS A CAREER STORY. The parable's reward is a bigger job, not
//      a bonus (Matthew 25:21), and the placing is His (1 Corinthians 12:18).
//      Checked in our own voice, because a band that only quoted the verses
//      would still leave the reader with an ambition story.
//   4. FEED MY SHEEP WITHOUT THE FENCE. Willingly, not by constraint, and never
//      as lords over His heritage (1 Peter 5:2-3). A feeding lesson with no
//      fence produces an owner.
//   5. "THE BIBLE SAYS DO DRILLS." The military picture is his. The Word's own
//      soldier language (2 Timothy 2:3-4) is what carries it, and the honest
//      attribution is checked per band.
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

const ID = 'll169-pour-it-out-every-seat-worked-feed-my-sheep-and-be-the-best-in-this-too';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
  if (!d || !d.chapters) continue;
  chapters[f.replace(/\.json$/, '').toLowerCase()] = d.chapters;
}
// STRICT: whitespace only, never apostrophes (the DR-0456 finding).
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// NO leading-numeral rewriting (the DR-0457 finding).
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
// OUR voice only: the quotations and their references removed, so a check can
// never be satisfied by the Word's own words (the recurring finding of this
// pass, in all five of its shapes).
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
// A property has to be doing its job WHERE it is supposed to: this returns our
// prose within `pad` characters either side of a marker, so a phrase that lives
// in a different section of the band cannot satisfy the check (the DR-0461
// finding — a limit check that passed on the wrong paragraph).
// The quotations come out FIRST and the references stay, so the window is cut
// out of our own prose and can never be satisfied by the Word's words. Slicing
// the raw text and stripping afterwards does not work: the cut lands inside a
// quotation, the quote marks are unbalanced, and the whole quotation survives
// into the window. That was a real defect in the first version of this helper.
const near = (text, marker, pad = 500) => {
  const noQuotes = String(text).replace(ALL_SPANS, ' ');
  const i = noQuotes.indexOf(marker);
  if (i < 0) return '';
  const w = noQuotes.slice(Math.max(0, i - pad), i + marker.length + pad);
  return w.replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');
};

describe('L169 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Pour It Out — Every Seat Worked, Feed My Sheep, and Be the Best in This Too');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(13);
    expect(L.benefits.length).toBeGreaterThanOrEqual(12);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1400);
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

describe('L169 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(280);
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
    expect(checked).toBeGreaterThan(280);
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

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = [
      'left, left, right, left', 'sound-mind people', 'account manager', 'general manager',
      'be the best in this too', 'mind, will, soul and emotion', 'pour it out', 'quality life',
    ];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase.toLowerCase())) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

describe('L169 — the two notes said first, so nothing is borrowed that was not lent', () => {
  it('EVERY BAND names the two senses of pouring out that this is NOT', () => {
    // The temptation here was to quote Joel 2:28 and let its weight carry a
    // lesson about a man handing on what he knows. Both other senses are named
    // and set aside IN OUR OWN VOICE, beside the references themselves.
    for (const b of BANDS) {
      expect(band(b), `${b} Joel 2:28`).toContain('(Joel 2:28)');
      expect(band(b), `${b} Psalms 62:8`).toContain('(Psalms 62:8)');
      const around = near(band(b), '(Psalms 62:8)', 700);
      expect(around, `${b} never says those senses are not this one`).toMatch(/not this lesson|neither[a-z ,]{0,20}is a man handing/i);
    }
  });

  it('and every band gives the sense it DOES use, from its own places', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Timothy 4:6`).toContain('(2 Timothy 4:6)');
      expect(band(b), `${b} Philippians 2:17`).toContain('(Philippians 2:17)');
      expect(band(b), `${b} 2 Timothy 2:2`).toContain('(2 Timothy 2:2)');
      expect(ourVoice(band(b)), `${b} never names the drink offering`).toMatch(/drink/i);
    }
  });

  it('EVERY BAND keeps mind-will-soul-emotion as HIS framing, with both verses quoted', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Mark 12:30`).toContain('(Mark 12:30)');
      expect(band(b), `${b} Deuteronomy 6:5`).toContain('(Deuteronomy 6:5)');
      const around = near(band(b), '(Deuteronomy 6:5)', 700);
      expect(around, `${b} never says ALL is what both press`).toMatch(/\bALL\b/);
      expect(around, `${b} never counts the two lists honestly`).toMatch(/four .*three|three .*four|four in one/i);
    }
  });
});

describe('L169 — the ladder, and why it is a credential rather than a career', () => {
  it('each band carries the rule and the parable', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 16:10`).toContain('(Luke 16:10)');
      expect(band(b), `${b} Matthew 25:21`).toContain('(Matthew 25:21)');
      expect(band(b), `${b} Proverbs 22:29`).toContain('(Proverbs 22:29)');
    }
  });

  it('EACH BAND SAYS IN OUR WORDS that the reward is a bigger job, not a bonus', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Matthew 25:21)', 600);
      expect(around, `${b} never says the reward is a bigger job`).toMatch(/bigger job|larger assignment|bigger assignment|not (a )?money|not money/i);
    }
  });

  it('each band carries the differing seats AND names who does the placing', () => {
    for (const b of BANDS) {
      for (const ref of ['(1 Corinthians 12:4)', '(1 Corinthians 12:5)', '(1 Corinthians 12:6)', '(1 Corinthians 12:18)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(1 Corinthians 12:18)', 500);
      expect(around, `${b} never says the placing is His`).toMatch(/He does|His doing|who puts you|placing is His|He is the one/i);
    }
  });

  it("each band gives the shepherd's reason the seats matter at all", () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 27:23`).toContain('(Proverbs 27:23)');
      expect(near(band(b), '(Proverbs 27:23)', 400), `${b} never says why`).toMatch(/chair/i);
    }
  });
});

describe('L169 — the work itself is under the first commandment', () => {
  it('each band puts the job under it, for the employer they actually have', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Colossians 3:23`).toContain('(Colossians 3:23)');
      expect(band(b), `${b} Colossians 3:24`).toContain('(Colossians 3:24)');
      expect(band(b), `${b} Ephesians 6:6`).toContain('(Ephesians 6:6)');
      expect(band(b), `${b} Ephesians 6:7`).toContain('(Ephesians 6:7)');
    }
  });

  it('each band answers the fear that stops a person pouring out', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 11:25`).toContain('(Proverbs 11:25)');
      expect(band(b), `${b} Acts 20:35`).toContain('(Acts 20:35)');
      expect(band(b), `${b} Galatians 6:6`).toContain('(Galatians 6:6)');
      const around = near(band(b), '(Proverbs 11:25)', 600);
      expect(around, `${b} never names the cost or the promise`).toMatch(/not (run )?dr(y|ained)|only one|drained/i);
    }
  });
});

describe('L169 — feed my sheep, with the fence the Word puts on it', () => {
  it('EACH BAND carries all three askings', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 21:15`).toContain('(John 21:15)');
      expect(band(b), `${b} John 21:16`).toContain('(John 21:16)');
      expect(band(b), `${b} John 21:17 (the grief)`).toContain('(John 21:17)');
    }
  });

  it('each band says love was handed work rather than asked for a feeling', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(John 21:17)', 700);
      expect(around, `${b} never says love was given work`).toMatch(/handed (a flock|work|sheep)|given a flock|love got a job|not asked (for|to produce) (a )?(feeling|warmth)|never asked for a feeling/i);
    }
  });

  it('EACH BAND KEEPS THE FENCE — willingly, and never as lords over His heritage', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Peter 5:2`).toContain('(1 Peter 5:2)');
      expect(band(b), `${b} 1 Peter 5:3`).toContain('(1 Peter 5:3)');
      const around = near(band(b), '(1 Peter 5:3)', 500);
      expect(around, `${b} never says whose sheep they are`).toMatch(/His sheep|not yours|ownership|own/i);
    }
  });
});

describe('L169 — who it is for, and the qualifier the text actually gives', () => {
  it('each band carries the milk and the strong meat', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Hebrews 5:12`).toContain('(Hebrews 5:12)');
      expect(band(b), `${b} Hebrews 5:14`).toContain('(Hebrews 5:14)');
      expect(band(b), `${b} Colossians 1:9`).toContain('(Colossians 1:9)');
      expect(band(b), `${b} Colossians 1:10`).toContain('(Colossians 1:10)');
    }
  });

  it('EACH BAND names USE rather than age as the qualifier', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(Hebrews 5:14)', 600);
      expect(around, `${b} never names use`).toMatch(/\bUSE\b|by use|practice/i);
      expect(around, `${b} never rules out age`).toMatch(/not (about )?age|rather than age|not by age/i);
    }
  });
});

describe('L169 — a sound mind, and the peace that is a person', () => {
  it('each band reads the sound mind as the verse lists it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 2 Timothy 1:7`).toContain('(2 Timothy 1:7)');
      const around = near(band(b), '(2 Timothy 1:7)', 500);
      expect(around, `${b} never names what comes with it`).toMatch(/power/i);
      expect(around, `${b} never says a settled mind is not a soft one`).toMatch(/(not|never) a soft|cleared to work|can work/i);
    }
  });

  it('each band carries the work verses that follow from it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ecclesiastes 9:10`).toContain('(Ecclesiastes 9:10)');
      expect(band(b), `${b} 1 Corinthians 10:31`).toContain('(1 Corinthians 10:31)');
    }
  });

  it('EACH BAND gives peace as a person with a working government', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Isaiah 9:6`).toContain('(Isaiah 9:6)');
      expect(band(b), `${b} Isaiah 9:7`).toContain('(Isaiah 9:7)');
      const around = near(band(b), '(Isaiah 9:7)', 600);
      expect(around, `${b} never says the government is not idle`).toMatch(/not (sitting still|idle)|runs things|working King|He runs/i);
    }
  });

  it('each band carries His own handing over, and the one condition', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 14:27`).toContain('(John 14:27)');
      expect(band(b), `${b} Philippians 4:7`).toContain('(Philippians 4:7)');
      expect(band(b), `${b} Isaiah 26:3`).toContain('(Isaiah 26:3)');
      const around = near(band(b), '(Isaiah 26:3)', 500);
      expect(around, `${b} never draws the stayed-on contrast`).toMatch(/stayed on/i);
    }
  });
});

describe('L169 — fall in line, and whose picture the drill is', () => {
  it('EACH BAND attributes the military picture to HIM, not to the Word', () => {
    // The whole of DR-0331 in one property: his picture is honoured as his, and
    // the Word's own soldier language is what carries the point.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never uses his picture`).toMatch(/military/i);
      expect(ours, `${b} never says the picture is his`).toMatch(/picture is his|his picture|belongs to him|That picture is his/i);
      expect(band(b), `${b} 2 Timothy 2:3`).toContain('(2 Timothy 2:3)');
      expect(band(b), `${b} 2 Timothy 2:4`).toContain('(2 Timothy 2:4)');
    }
  });

  it('each band carries order, the oldest correction, and the doing', () => {
    for (const b of BANDS) {
      for (const ref of ['(1 Corinthians 14:40)', '(1 Samuel 15:22)', '(Luke 6:46)', '(James 1:22)', '(James 1:25)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
      const around = near(band(b), '(James 1:25)', 500);
      expect(around, `${b} never fastens the blessing to the doing`).toMatch(/on the doing|blessing is|doing/i);
    }
  });
});

describe('L169 — be the best in this too, by the method the Word gives', () => {
  it('each band carries the method, the supply and the standard', () => {
    for (const b of BANDS) {
      for (const ref of ['(1 Timothy 4:15)', '(1 Timothy 4:16)', '(James 1:5)', '(Proverbs 2:6)', '(Proverbs 4:7)', '(2 Timothy 3:17)']) {
        expect(band(b), `${b} ${ref}`).toContain(ref);
      }
    }
  });

  it('EACH BAND says it is not talent — wholly given, and visibly improving', () => {
    for (const b of BANDS) {
      const around = near(band(b), '(1 Timothy 4:15)', 600);
      expect(around, `${b} never says wholly or all in`).toMatch(/wholly|all in/i);
      expect(around, `${b} never says the improvement shows`).toMatch(/visibly improving|people can see|appear to all|see you get better/i);
    }
  });
});

describe('L169 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God anywhere in OUR prose', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      const ours = ourVoice(text);
      if (/\bGOD\b|\bGod\b/.test(ours)) offences.push(path);
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
    expect(sawLord).toBeGreaterThan(5);
  });
});

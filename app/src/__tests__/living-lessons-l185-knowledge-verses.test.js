// @vitest-environment node
// =============================================================================
// L185 — Knowledge Was Never the Savior
// =============================================================================
// Darrell 2026-09-19, five messages in a row, mid IP-conversion work: a
// Trackstarz discussion of a spiritual center, gnosticism, "Christ
// consciousness", the emptying of the self, and syncretism. "Lesson."
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. SLANDER WEARING A DOCTRINE COAT. The source material names living
//      people and assigns them beliefs. A lesson that repeats those verdicts
//      from a video summary would fail the Test on HONORABLE, JUST and
//      COMMENDABLE at once, and would become the accusing thing it warns
//      against. The doctrine is public and answerable; the heart is Yahweh's.
//      This is the load-bearing gate here, and it is DERIVED — the names are
//      taken from the source material, not from a remembered list.
//   2. TEACHING THAT KNOWLEDGE IS THE ENEMY. The same house capitalized
//      Knowledge as a Resource Yahweh supplies (DR-0530) hours earlier. A
//      lesson against gnosticism that flinches from study would contradict
//      Proverbs 2:6 and quietly repeal a standing rule. The thesis is a
//      DIRECTION — supply descending vs. source climbing — not a retreat.
//   3. THE RATINGS PANEL. DR-0098 permits NAMING a debate to educate past it
//      and forbids staging views as co-equal for the reader to pick from.
//      Every limb of the system gets an answer FROM THE TEXT here.
//   4. LOSING GENESIS 3. Without it the lesson is a history unit about an
//      ancient sect. With it, it is the oldest sales pitch on earth and the
//      reader is in it. Genesis 3:5 is the thesis, not a decoration.
//   5. LETTING THE MAKER AND THE SAVIOR STAY SPLIT. The two-creator
//      architecture needs them separate. John 1:3 and John 1:14 must appear
//      TOGETHER or the answer is not actually given.
//   6. DUCKING THE JEALOUSY QUESTION. Darrell asked it mid-build: "Yahweh is
//      jealous.... what does that mean ... how do we read that?" It is not a
//      side question here. The system enters His jealousy as its EXHIBIT --
//      the Creator as "jealous, arrogant and oppressive" is offered as the
//      proof He is the lesser god. A lesson that answered everything else and
//      left this attribute unhandled would leave the hinge in place. So the
//      covenant reading is required in every band, and with it the naming of
//      the TECHNIQUE: Genesis 3:5 introduces no new fact, it re-reads a
//      MOTIVE. Do not deny Him, re-motive Him. That is the same move the
//      demiurge doctrine runs at scale, and seeing it is worth more than
//      winning the argument.
//   7. SMOOTHING ISAIAH 45:7. The comfortable move is to quote 45:5 and stop.
//      Verse 7 is the one that removes the second power's territory, and it is
//      hard on purpose. Cutting it would hand dualism its exit.
//
// SHAPE: measured before insertion, as L180's revert taught. Four bands, each
// above its fullness floor, child under the new-lesson reading ceiling, bands
// differentiated, every band naming its own title in its opening window.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll185-knowledge-was-never-the-savior';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book);
  if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1];
  if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i);
    else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
  }
};

/** Quoted-with-reference spans that do not match the corpus verbatim. */
const quotationFaults = (text, path = '') => {
  const out = [];
  SPAN_WITH_REF.lastIndex = 0;
  let m;
  while ((m = SPAN_WITH_REF.exec(text))) {
    const real = versesOf(m[2].trim(), m[3], m[4].trim());
    if (real == null) out.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
    else if (!norm(real).includes(norm(m[1]))) {
      out.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
    }
  }
  return out;
};

const ALL_TEXT = (() => { const a = []; walkStrings(L, '', (t) => a.push(t)); return a.join(' \n '); })();

describe('L185 — wired, and the series count stays honest', () => {
  it('is in the catalog with every contract field and all four bands', () => {
    expect(L, 'L185 not found in LIVING_LESSONS_MODULES').toBeTruthy();
    for (const k of ['title', 'bigIdea', 'anchor', 'benefits', 'inApp', 'levels', 'quiz', 'facilitator', 'lesson']) {
      expect(L[k], `L185 missing ${k}`).toBeTruthy();
    }
    for (const b of BANDS) expect(L.levels[b], `L185 missing the ${b} band`).toBeTruthy();
  });

  it('the declared week count equals the real series length', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('anchors on 1 Timothy 6:20, verbatim from the corpus', () => {
    expect(L.anchor.ref).toBe('1 Timothy 6:20');
    expect(norm(versesOf('1 Timothy', 6, '20'))).toBe(norm(L.anchor.text));
  });
});

describe('L185 — every quoted verse is verbatim', () => {
  it('no quotation in any field drifts from the KJV', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an altered quotation fails', () => {
    expect(quotationFaults('"I am the LORD, and there is ONE OTHER beside me" (Isaiah 45:5)', 't').length)
      .toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a real verse cited to the wrong reference fails', () => {
    expect(quotationFaults('"All things were made by him" (John 3:1)', 't').length).toBeGreaterThan(0);
  });
});

describe('L185 — teaches the doctrine, never a verdict on a person', () => {
  // THE LOAD-BEARING GATE. Taken from the source material Darrell pasted, not
  // from memory: these are the people and the institution the broadcast named.
  // The lesson answers what is TAUGHT and leaves every one of them alone.
  const NAMED_IN_THE_SOURCE = ['Sterling', 'Brown', 'Beckwith', 'Agape', 'Trackstarz'];

  it('no person or institution from the source material is named anywhere in the lesson', () => {
    const present = NAMED_IN_THE_SOURCE.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(ALL_TEXT));
    expect(present, `L185 names people it must not judge: ${present.join(', ')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the same scan fires on a sentence that does name one', () => {
    const probe = 'The teaching at Agape is what this lesson answers.';
    expect(NAMED_IN_THE_SOURCE.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(probe))).not.toEqual([]);
  });

  it('says out loud WHY it withholds the verdict, so the restraint is teaching and not omission', () => {
    expect(ALL_TEXT).toMatch(/We take the DOCTRINE/);
    expect(ALL_TEXT).toMatch(/hearts? belongs? to Yahweh|Hearts belong to Yahweh/i);
  });
});

describe('L185 — the six things it could most easily have got wrong', () => {
  it('keeps Knowledge a Resource (DR-0530) rather than making study the enemy', () => {
    expect(ALL_TEXT).toMatch(/out of his mouth cometh knowledge and understanding/);
    expect(L.bigIdea).toMatch(/RESOURCE/);
    // The thesis is a DIRECTION, and the negation is the actual property.
    expect(L.bigIdea).toMatch(/NEVER THE SOURCE|OPPOSITE DIRECTION/);
    expect(ALL_TEXT).toMatch(/Knowledge puffeth up, but charity edifieth/);
  });

  it('names the error once to educate past it, rather than staging a panel (DR-0098)', () => {
    expect(ALL_TEXT).toMatch(/name gnosticism once|Name gnosticism once|We name gnosticism once/);
    // Never capitalized as a proper name — the adversary's kingdom keeps no honour.
    expect(ALL_TEXT, 'gnosticism capitalized as a proper name').not.toMatch(/Gnosticism/);
  });

  it('puts the first version of the offer in Genesis 3, where it actually is', () => {
    expect(ALL_TEXT).toMatch(/then your eyes shall be opened, and ye shall be as gods, knowing good and evil/);
    expect(ALL_TEXT).toMatch(/Ye shall not surely die/);
  });

  it('refuses to split the Maker from the Savior — John 1:3 AND John 1:14 together', () => {
    expect(ALL_TEXT).toMatch(/All things were made by him; and without him was not any thing made that was made/);
    expect(ALL_TEXT).toMatch(/And the Word was made flesh, and dwelt among us/);
    expect(ALL_TEXT).toMatch(/fulness of the Godhead bodily/);
  });

  it('carries Isaiah 45:7, the hard verse that removes the second power territory', () => {
    expect(ALL_TEXT).toMatch(/I form the light, and create darkness/);
    expect(ALL_TEXT).toMatch(/there is no God beside me/);
  });

  it('supplies the apostolic test the reader can actually run', () => {
    expect(ALL_TEXT).toMatch(/Every spirit that confesseth that Jesus Christ is come in the flesh is of God/);
    expect(ALL_TEXT).toMatch(/try the spirits whether they are of God/);
  });

  it('answers Christ-consciousness with a confession and a Person, not an altitude', () => {
    expect(ALL_TEXT).toMatch(/Thou art the Christ, the Son of the living God/);
    expect(ALL_TEXT).toMatch(/flesh and blood hath not revealed it unto thee/);
    expect(ALL_TEXT).toMatch(/one mediator between God and men, the man Christ Jesus/);
  });

  it('defends the creation instead of conceding that matter is the problem', () => {
    expect(ALL_TEXT).toMatch(/behold, it was very good/);
    expect(ALL_TEXT).toMatch(/every creature of God is good, and nothing to be refused/);
  });
});

describe('L185 — the shape invariants, measured not asserted', () => {
  it('no band is short of its fullness floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('the child band is under the new-lesson reading ceiling', () => {
    const g = fleschKincaidGrade(ourProseOnly(L.levels.child));
    expect(g, `child band reads at grade ${g}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
  });

  it('the bands are differentiated, not lightly-edited copies of each other', () => {
    const d = measureDifferentiation(L);
    expect(d, 'differentiation unmeasurable — a band is missing').toBeTruthy();
    expect(d.worst, `worst pair overlap ${d.worst}`).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson in its opening window', () => {
    const unnamed = BANDS.filter((b) => !namesItsLesson(L.title, L.levels[b]));
    expect(unnamed, `bands not naming the lesson: ${unnamed.join(', ')}`).toEqual([]);
  });
});

describe('L185 — the jealousy of Yahweh, answered in every register', () => {
  // Darrell asked this directly, mid-build. The system's own account calls the
  // Creator "jealous, arrogant, and oppressive" and offers that as the evidence
  // for a demiurge, so the attribute is EXHIBIT A and not an aside. A band that
  // skipped it would hand the reader everything except the hinge.
  const BAND_TEXT = Object.fromEntries(BANDS.map((b) => [b, L.levels[b]]));

  it('every band answers it — none of the four leaves the hinge unhandled', () => {
    const silent = BANDS.filter((b) => !/jealous/i.test(BAND_TEXT[b]));
    expect(silent, `bands that never address His jealousy: ${silent.join(', ')}`).toEqual([]);
  });

  it('every band grounds it in the verse where He takes it as a NAME', () => {
    const missing = BANDS.filter((b) => !/whose name is Jealous/.test(BAND_TEXT[b]));
    expect(missing, `bands not grounding on Exodus 34:14: ${missing.join(', ')}`).toEqual([]);
  });

  it('reads it as covenant and marriage, never as insecurity', () => {
    expect(ALL_TEXT).toMatch(/thy Maker is thine husband/);
    expect(ALL_TEXT).toMatch(/I am jealous over you with godly jealousy/);
    // Paul's own jealousy is a VIRTUE, and the next verse aims it at this
    // exact deception. Dropping 11:3 loses the reason 11:2 is quoted here.
    expect(ALL_TEXT).toMatch(/as the serpent beguiled Eve through his subtilty/);
  });

  it('holds that the opposite of Love is indifference, not jealousy', () => {
    expect(ALL_TEXT).toMatch(/love is strong as death; jealousy is cruel as the grave/);
  });

  it('keeps the preposition: He is jealous FOR, not only jealous of', () => {
    expect(ALL_TEXT).toMatch(/I was jealous for Zion with great jealousy/);
    expect(ALL_TEXT).toMatch(/jealous FOR/);
  });

  it('names the TECHNIQUE — a re-read of motive, not a new fact', () => {
    // This is the load-bearing teaching of the section, and the thing that
    // makes it transferable: the serpent never denies that Yahweh spoke.
    expect(ALL_TEXT).toMatch(/re-motive Him/);
    expect(ALL_TEXT).toMatch(/no new fact|nothing new on the table|not one new fact|introduces no new fact/i);
    expect(ALL_TEXT).toMatch(/For God doth know that in the day ye eat thereof/);
  });

  it('PROVEN-TO-CATCH: the band scan fires when a band is silent on it', () => {
    const probe = { child: 'no mention here', youth: BAND_TEXT.youth, teen: BAND_TEXT.teen, senior: BAND_TEXT.senior };
    expect(BANDS.filter((b) => !/jealous/i.test(probe[b]))).toEqual(['child']);
  });
});

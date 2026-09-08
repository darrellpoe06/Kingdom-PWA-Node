// @vitest-environment node
// =============================================================================
// L136 — Touched With the Feeling. Verbatim KJV, and the three claims this
// lesson may never lose.
// =============================================================================
// THE QUESTION, asked 2026-09-08: our High Priest is touched with the feeling of
// our infirmity — so does He feel like a sinner without sinning, so He can
// relate experientially, so His judgment is as true as it can ever be?
//
// Three propositions, and the lesson answers each differently. This gate exists
// because every one of the three can drift into a real error:
//
//   1. THE SYMPATHY IS FACT and may never be softened. Hebrews 4:15 is built as
//      a DOUBLE NEGATIVE (not... cannot) precisely to block the thought that He
//      is unable to relate. Losing that is losing the verse's own argument.
//   2. YET WITHOUT SIN COMPLETES HIS EXPERIENCE — it does not shrink it.
//      Hebrews 12:4 is written to US ("Ye have not yet resisted unto blood") and
//      Luke 22:44 of HIM. Whoever quits first knows least. A lesson that lets
//      sinlessness imply an easier trial has inverted the text.
//   3. THE JUDGMENT IS NOT GROUNDED IN SAMPLED EXPERIENCE. Scripture never once
//      gives that as the reason; it gives righteousness and the Father (John
//      5:30, John 8:16, Revelation 19:11) — and Isaiah 11:3 says outright that
//      He does NOT judge by sight or hearing. Teaching the popular version would
//      make His verdict only as wide as His samples.
//
// AND THE CORRECTION DARRELL PRESSED MID-BUILD, which is load-bearing here:
// "He can't desire sin so how can He... without desire and His Nature is not
// pulled by it... He was impacted and ultimately killed because of our sins."
// He was right, and it corrected an earlier draft of this very lesson, which had
// used the word PULL. Nothing in Him leaned — "hath nothing in me" (John 14:30).
// So the measurement is not desire resisted but DAMAGE ABSORBED: the verb
// Scripture attaches is that He SUFFERED being tempted (Hebrews 2:18). The
// inversion that follows is the heart of the lesson and is asserted below: sin
// reaches us as an ADVERTISEMENT and reached Him as the article itself, so He
// knows what sin IS while we know only what it CLAIMS.
//
// PROVEN-TO-CATCH, from this lesson's own authoring:
//   • The word PULL, used in an early draft of the temptation movement, is now
//     forbidden in that sense and the ban is asserted.
//   • One generic "God" in our authored voice (a quiz question paraphrasing
//     James 1:13). The check strips quoted spans first — DR-0210 governs our
//     prose only, and the KJV's own "God" must survive untouched inside every
//     quotation, which is asserted as the complement.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll136-touched-with-the-feeling-the-high-priest-who-felt-the-whole-weight-and-why-his-judgment-never-needed-your-experience-to-be-true';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

/** Our authored voice = the text with every quotation removed. */
const ourVoiceOnly = (text) => text.replace(/"[^"]*"/g, ' ');

// Deliberately EMPTY: every double-quoted span in L136 is verbatim KJV. Darrell's
// spoken correction is rendered for meaning without quotation marks (DR-0331),
// and our own emphasis uses capitals, never quotes.
const NOT_SCRIPTURE = [];

const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L136 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L136 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L136 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    const m = mod();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Hebrews 4:15-16/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of mod().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('every quoted span is letter-for-letter KJV', () => {
  it('the quotation marks are balanced (an unclosed quote silently swallows text)', () => {
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L136 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L136 must actually contain quotations').toBeGreaterThan(120);
    const bad = [];
    for (const span of spans) {
      const parts = span.includes('...') ? span.split('...').map((p) => p.trim()) : [span];
      for (const part of parts) {
        if (!part || NOT_SCRIPTURE.includes(part)) continue;
        if (!WHOLE_KJV.includes(part)) bad.push(part);
      }
    }
    expect(bad, `non-verbatim quoted spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the allowlist is EMPTY and stays honest', () => {
    expect(NOT_SCRIPTURE).toEqual([]);
  });
});

describe('CLAIM ONE — the sympathy is fact, and the double negative survives', () => {
  it('Hebrews 4:15 is quoted in full, including the yet without sin clause', () => {
    const v = 'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.';
    expect(WHOLE_KJV).toContain(v);
    expect(l, 'the anchor must be quoted whole — the qualifier is not optional').toContain(v);
  });

  it('the lesson TEACHES the double negative rather than merely quoting it', () => {
    expect(l).toMatch(/double negative/i);
    expect(l, 'and names what it blocks').toMatch(/not\.\.\. cannot|not... cannot/);
  });

  it('IN ALL POINTS is taught with no schedule of exceptions offered', () => {
    expect(l).toMatch(/IN ALL POINTS/);
    expect(l).toMatch(/no (list|schedule) of exceptions/i);
  });
});

describe('CLAIM TWO — sinlessness COMPLETES the experience; it never shrinks it', () => {
  it('the two measuring verses are both present and both verbatim', () => {
    expect(l, 'written to US').toContain('Ye have not yet resisted unto blood, striving against sin.');
    expect(l, 'written of HIM').toContain('his sweat was as it were great drops of blood falling down to the ground.');
  });

  it('the lesson states the mechanism: yielding is an EXIT, so whoever quits first knows least', () => {
    expect(l).toMatch(/EXIT/);
    expect(l).toMatch(/quits? first knows least|never (learns|find out) what|no idea what/i);
  });

  it('Luke 4:13 is used for the point that the ADVERSARY ran out, not Jesus', () => {
    expect(l).toContain('And when the devil had ended all the temptation, he departed from him for a season.');
    expect(l).toMatch(/ran out of material|exhausted his repertoire/i);
  });

  it('NEVER teaches that sinlessness made the trial easier', () => {
    // The inversion this lesson exists to prevent.
    expect(l).not.toMatch(/easier version|got the easy version(?! )/);
    expect(l, 'the easy-version idea may only appear as the instinct being CORRECTED').toMatch(/instinct says/i);
  });
});

describe('DARRELL’S CORRECTION — no desire, no pull; the measure is damage', () => {
  it('the correction is carried in the lesson and attributed to him', () => {
    expect(l).toMatch(/Darrell/);
    expect(l, 'his actual point').toMatch(/cannot desire sin/i);
  });

  it('PROVEN-TO-CATCH: the word PULL is not used for what temptation did to Him', () => {
    // An earlier draft wrote "A pull you have no wish to follow". Nothing in Him
    // leaned, so the word is wrong. It may appear ONLY as the word being retired.
    const uses = [...l.matchAll(/pull(ed|s|ing)?\b/gi)].map((m) => l.slice(Math.max(0, m.index - 90), m.index + 40));
    for (const ctx of uses) {
      expect(
        /the word pull|used the word pull|not pulled|nature is not pulled|did not pull/i.test(ctx),
        `the word pull appears in a live claim rather than as the retired word:\n${ctx}`,
      ).toBe(true);
    }
  });

  it('the verb Scripture attaches is SUFFERED, and the lesson says so', () => {
    expect(l).toContain('For in that he himself hath suffered being tempted, he is able to succour them that are tempted.');
    expect(l).toMatch(/SUFFERED being tempted/);
    expect(l, 'and the measurement is relocated').toMatch(/DAMAGE ABSORBED/);
  });

  it('John 14:30 carries the reconciliation with James 1:13', () => {
    expect(l).toContain('the prince of this world cometh, and hath nothing in me.');
    expect(l).toContain('God cannot be tempted with evil');
  });

  it('THE INVERSION is taught: sin reaches us as an advertisement, Him as the article', () => {
    expect(l).toMatch(/ADVERTISEMENT/);
    expect(l).toMatch(/what sin CLAIMS|what sin professes/);
    expect(l).toMatch(/what sin IS/);
  });

  it('the impact is measured in wounds and a death, not in appetite', () => {
    expect(l).toContain('But he was wounded for our transgressions, he was bruised for our iniquities');
    expect(l).toContain('the LORD hath laid on him the iniquity of us all.');
    expect(l).toContain('Who his own self bare our sins in his own body on the tree');
    expect(l, 'and it ended in a death — the second half of his point').toContain('while we were yet sinners, Christ died for us.');
  });

  it('sin has ALWAYS landed on Yahweh as grief, shown across the canon', () => {
    expect(l).toContain('it grieved him at his heart.');
    expect(l).toContain('being grieved for the hardness of their hearts');
    expect(l).toContain('grieve not the holy Spirit of God');
  });
});

describe('CLAIM THREE — the judgment is grounded in righteousness, never in sampling', () => {
  it('the judgment texts are quoted verbatim and give the Father or righteousness as the reason', () => {
    expect(l).toContain('my judgment is just; because I seek not mine own will, but the will of the Father which hath sent me.');
    expect(l).toContain('my judgment is true: for I am not alone, but I and the Father that sent me.');
    expect(l).toContain('in righteousness he doth judge and make war.');
  });

  it('Isaiah 11:3 is present — the two channels He does NOT use', () => {
    expect(l).toContain('he shall not judge after the sight of his eyes, neither reprove after the hearing of his ears:');
    expect(l, 'and what He uses instead').toContain('But with righteousness shall he judge the poor, and reprove with equity for the meek of the earth');
  });

  it('the lesson states plainly that Scripture NEVER grounds the verdict in sampled experience', () => {
    expect(l).toMatch(/NEVER (ONCE )?GROUNDS|NOWHERE GROUNDS/);
  });

  it('and explains why that is BETTER news rather than a demotion', () => {
    expect(l).toMatch(/as wide as|bounded by the sample|as reliable as the sample/i);
    expect(l).toMatch(/arrives (already )?total|arrives entire/i);
  });

  it('it does NOT leave Him distant — direct knowledge is asserted immediately after', () => {
    expect(l).toContain('And needed not that any should testify of man: for he knew what was in man.');
    expect(l).toContain('all things are naked and opened unto the eyes of him with whom we have to do.');
    expect(l).toContain('For he knoweth our frame; he remembereth that we are dust.');
  });
});

describe('the PURPOSE of the sympathy, taken from the next verse rather than inferred', () => {
  it('Hebrews 4:16 is quoted whole and its THEREFORE is taught', () => {
    expect(l).toContain('Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.');
    expect(l).toMatch(/THEREFORE/);
    expect(l).toMatch(/BOLDLY/);
  });

  it('the architecture line is present in the lesson', () => {
    expect(l).toMatch(/ACCURACY NEVER (NEEDED|REQUIRED) YOUR EXPERIENCE/);
  });

  it('the earthly-priest arithmetic is named and removed', () => {
    expect(l).toContain('for that he himself also is compassed with infirmity.');
    expect(l).toContain('And by reason hereof he ought, as for the people, so also for himself, to offer for sins.');
    expect(l).toContain('who is holy, harmless, undefiled, separate from sinners, and made higher than the heavens;');
  });

  it('separate from sinners and touched with the feeling are held together, not traded off', () => {
    expect(l).toMatch(/both (simply )?true of the same Person|never (treats them|presents them) as (being )?in (tension|conflict)/i);
  });
});

describe('the reticence — where the Word stops, the lesson stops', () => {
  it('only the recorded emotions are used', () => {
    expect(l).toContain('Jesus wept.');
    expect(l).toContain('My soul is exceeding sorrowful, even unto death');
    expect(l).toContain('with strong crying and tears');
  });

  it('the lesson says out loud that it declines to narrate His inner life', () => {
    expect(l).toMatch(/does not narrate|declines to (supply|narrate)|Scripture is quiet|the record is quiet/i);
    expect(l, 'and hands the reader the test').toMatch(/ask for the verse|request the verse/i);
  });

  it('Hebrews 5:8 and 2:10 are guarded against the disobedience misreading', () => {
    expect(l).toContain('Though he were a Son, yet learned he obedience by the things which he suffered;');
    expect(l).toMatch(/Neither (asserts|says) (prior )?disobedien|never says He was ever disobedient/i);
  });
});

describe('DR-0210 typography — Yahweh in our voice, the KJV untouched inside quotes', () => {
  it('PROVEN-TO-CATCH: no generic "God" survives in our AUTHORED voice', () => {
    const ours = ourVoiceOnly(l);
    const hits = [...ours.matchAll(/\bGod\b/g)].map((m) => ours.slice(Math.max(0, m.index - 70), m.index + 30));
    expect(hits, `generic "God" in our own voice:\n${hits.join('\n---\n')}`).toEqual([]);
  });

  it('our voice does name Him by His covenant name', () => {
    expect((ourVoiceOnly(l).match(/Yahweh/g) || []).length).toBeGreaterThan(3);
  });

  it('the KJV "God" and "the LORD" ARE preserved inside quotations', () => {
    // The complement. Without this, a blind find-replace would satisfy the rule
    // above while corrupting the text DR-0210 exists to protect.
    expect(l).toContain('God cannot be tempted with evil');
    expect(l).toContain('the LORD hath laid on him the iniquity of us all.');
  });

  it('no adversary name is ever capitalised', () => {
    expect(l).not.toMatch(/\b(Satan|Lucifer|The devil|Baal)\b/);
  });

  it('Jesus is confessed as the Lamb of Yahweh', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  it('child, teen and senior levels are all authored, and none is a stub', () => {
    const m = mod();
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    const m = mod();
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId).toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('each band gets genuinely different prose', () => {
    const m = mod();
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child).not.toBe(m.levels.senior);
    expect(m.levels.child.length).toBeLessThan(m.levels.senior.length);
  });

  it('the child level carries the WHOLE argument, including Darrell’s correction', () => {
    const c = mod().levels.child;
    expect(c, 'the sympathy').toContain('touched with the feeling of our infirmities');
    expect(c, 'whoever quits first knows least').toMatch(/quit/i);
    expect(c, 'no desire in Him').toContain('hath nothing in me.');
    expect(c, 'sin hurt Him rather than pulling Him').toMatch(/sin did not pull Him|Sin HURT Him/i);
    expect(c, 'the advertisement inversion, in child words').toMatch(/what sin PROMISES|it lies/);
    expect(c, 'the judgment correction').toContain('he shall not judge after the sight of his eyes');
    expect(c, 'and the payoff').toContain('come boldly unto the throne of grace');
  });

  it('the child level does NOT carry freight it cannot hold', () => {
    const c = mod().levels.child;
    expect(c, 'no made-to-be-sin abstraction at child level').not.toMatch(/made him to be sin/);
    expect(c, 'no Levitical priesthood comparison at child level').not.toMatch(/compassed with infirmity/);
  });

  it('the payoff verse reaches every band, because it is the point', () => {
    const m = mod();
    for (const t of [m.lesson, m.levels.child, m.levels.teen, m.levels.senior]) {
      expect(t).toContain('come boldly unto the throne of grace');
    }
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('child reads simpler than teen, and teen simpler than senior', async () => {
    const { measureLesson, isInverted, breachesChildCeiling } = await import('../../../scripts/reading-level.mjs');
    const measured = measureLesson(mod());
    expect(isInverted(measured)).toBe(false);
    expect(breachesChildCeiling(measured)).toBe(false);
    expect(measured.bands.child.authored).toBeLessThan(measured.bands.teen.authored);
    expect(measured.bands.teen.authored).toBeLessThan(measured.bands.senior.authored);
  });
});

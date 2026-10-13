// @vitest-environment node
// =============================================================================
// L179 — Heartfelt: The Heart Is the Deep Mind
// =============================================================================
// Darrell 2026-09-19: "We need a lesson that explains the heart is the
// subconscious and then a review of the heart as the subconscious and see how
// it works based on the Word and our latest neuroplasticity understanding
// because at times I hear things that I wish would have been more beneficial
// if heard as subconscious instead of heart because people understand them
// differently so it's not as impactful... what does that mean in that Light
// Of The Word?"
//
// He had located a TRANSLATION loss, not a Scripture problem. English split one
// thing in two and handed thinking to the mind and feeling to the heart, so a
// command about the machinery of an entire life gets filed under sentiment.
// Measured before writing: across the 177 existing Living Lessons the words
// subconscious / neuroplastic / rewir / deep layer appear in 16 lessons and are
// the thesis of none. His instinct was right and the gap was real.
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. THE EQUATION STATED FLAT. "The heart IS the subconscious" is mostly
//      right and wrong twice, and a lesson that skipped the precision to make
//      the point land would be the exact over-claim DR-0076 forbids. The
//      biblical heart is LARGER (the deliberate will lives there — Daniel
//      purposed, Solomon judged) and its posture is opposite (a basement
//      nobody answers for versus "Keep thy heart with all diligence"). Every
//      band must carry both corrections, or the lesson is a slogan.
//   2. JEREMIAH 17:9 READ AS ONLY AN ACCUSATION. The four words everybody
//      skips are the hinge: who can know it. That is ACCESS before it is
//      morals, and verse 10 answers the question one line later. A band that
//      stopped at "deceitful" would teach self-loathing instead of the reason
//      David asks for an inspection rather than filing a self-assessment.
//   3. AUTOMATIC READ AS UNACCOUNTABLE. The strongest real finding in the
//      science is the most dangerous conclusion: because it runs by itself,
//      it is not mine. DR-0100 tier three — the data stands, the over-reach
//      is corrected by the Word — so every band must reach KEEP rather than
//      catch, a command about years of intake and not about one second.
//   4. A BORROWED STATISTIC. The famous percentage of behaviour said to be
//      subconscious is not well sourced. Propping a true doctrine on an
//      untraceable number is the failure this house exists to remove, so every
//      band REFUSES it out loud rather than quietly omitting it.
//   5. SELF-IMPROVEMENT WITH VERSES ATTACHED. Every discipline the Word gives
//      for writing to the deep layer is real, and none of them manufactures a
//      new heart. Ezekiel 36:26 is all His verbs. Required in every band.
//   6. HEARTFELT LEFT MEANING TRUE. It is a claim about SOURCE. It is real
//      evidence about a speaker and no evidence at all about the subject,
//      which is exactly why Jeremiah 17:9 has to sit beside Luke 6:45.
//
// Check-writing rules in force: every claim check reads OUR prose with
// quotations AND their reference parentheses stripped; every quoted span in the
// WHOLE module is walked, not only the reader texts; every number below was
// MEASURED from the emitted module rather than typed from intent.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const ID = 'll179-heartfelt-the-heart-is-the-deep-mind-and-what-heartfelt-actually-claims';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
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
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};
// The gate, written once and used BOTH on the real module and on the two
// defects this lesson actually shipped in draft (DR-0076 §3 — a gate that has
// never been shown to catch is not evidence of anything).
const quotationFaults = (text, path = '') => {
  const out = [];
  SPAN_WITH_REF.lastIndex = 0;
  let m;
  while ((m = SPAN_WITH_REF.exec(text))) {
    const real = versesOf(m[2].trim(), m[3], m[4].trim());
    if (real == null) out.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
    else if (!norm(real).includes(norm(m[1]))) out.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
  }
  const orphan = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
  let o;
  while ((o = orphan.exec(text))) if (!o[2]) out.push(`${path}: ORPHAN — ${o[1].slice(0, 60)}`);
  return out;
};

const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

describe('the lesson exists and is wired', () => {
  it('is in the series and the count stays honest', () => {
    // Relaxed 2026-09-19 when L180 landed: the hard-coded 178 and the
    // "is last" assertion were only ever true until the next lesson shipped,
    // and they are not what this gate is for. L178 received exactly this
    // relaxation when L179 landed. What stays pinned is the invariant that
    // does not expire — the declared week count equals the real series length.
    expect(L, 'L179 is not in the series').toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    // And the RELATIVE order pin is kept, which main's version dropped: it is
    // the part that catches an accidental reorder or a duplicate insert, and
    // it does not expire the way a hardcoded total does. L179 still sits
    // immediately before whatever holds the 180 slot -- which, after the
    // concurrent-branch merge, is He Giveth Thee Power to Get Wealth.
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(here, 'L179 is not in the series').toBeGreaterThan(-1);
    expect(LIVING_LESSONS_MODULES[here + 1].id).toMatch(/^ll180-/);
  });

  it('carries every field a lesson is required to carry', () => {
    expect(L.title).toBe('Heartfelt: The Heart Is the Deep Mind');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(String(L[f]).length, f).toBeGreaterThan(400);
    for (const b of BANDS) expect(String(L.levels[b]).length, b).toBeGreaterThan(400);
    expect(L.benefits.length).toBeGreaterThanOrEqual(5);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(4);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
  });
});

describe('THE GATE, PROVEN TO CATCH BEFORE IT IS TRUSTED (DR-0076 §3)', () => {
  it('catches a two-verse span filed under one reference — the defect this lesson shipped in draft', () => {
    // The first draft carried James 1:23 and 1:24 as ONE quotation with both
    // references trailing it, which reads perfectly and is not what 1:23 says.
    const bad = '"For if any be a hearer of the word, and not a doer, he is like unto a man beholding his natural face in a glass: For he beholdeth himself, and goeth his way, and straightway forgetteth what manner of man he was." (James 1:23)';
    expect(quotationFaults(bad).join(' ')).toMatch(/NOT VERBATIM/);
    // The same draft did it to Psalms 139:23-24.
    const bad2 = '"Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting." (Psalms 139:23)';
    expect(quotationFaults(bad2).join(' ')).toMatch(/NOT VERBATIM/);
  });

  it('catches a quotation with no reference at all — the other draft defect', () => {
    const bad = 'because "Search me, O God, and know my heart" is a request for information you do not have.';
    expect(quotationFaults(bad).join(' ')).toMatch(/ORPHAN/);
  });

  it('catches a reference that does not resolve', () => {
    expect(quotationFaults('"whatever" (Proverbs 99:1)').join(' ')).toMatch(/does not resolve/);
  });

  it('passes correct text, so a green result means something', () => {
    expect(quotationFaults('"Keep thy heart with all diligence; for out of it are the issues of life." (Proverbs 4:23)')).toEqual([]);
  });
});

describe('every quoted span in the WHOLE module is His words', () => {
  it('walks every string field and finds no drift', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.slice(0, 8).join('\n')).toEqual([]);
  });

  it('quotes enough of the Word to be a Word-first lesson, measured', () => {
    let spans = 0;
    walkStrings(L, '', (text) => {
      SPAN_WITH_REF.lastIndex = 0;
      while (SPAN_WITH_REF.exec(text)) spans += 1;
    });
    // Measured on the emitted module, not intended: a floor, so authoring can
    // only add.
    expect(spans).toBeGreaterThanOrEqual(200);
  });

  it('names every anchor reference somewhere a reader will meet it', () => {
    const body = [L.lesson, L.bigIdea, ...Object.values(L.levels), ...L.benefits].join(' ');
    const missing = L.anchor.ref.split(';').map((s) => s.trim()).filter((r) => r && !body.includes(r));
    expect(missing).toEqual([]);
  });
});

describe('the claim Darrell asked for, in every band', () => {
  const inEvery = (label, re) => it(label, () => {
    for (const band of ALL) expect(OURS[band], `${band}: ${label}`).toMatch(re);
  });

  inEvery('names the everyday word out loud — the whole reason he asked', /subconscious/i);
  inEvery('reads Jeremiah 17:9 for ACCESS, not only for the accusation', /who can know it|access|cannot (get in|see in|look|peek)|no window/i);
  inEvery('keeps the overflow image so the reader can picture the mechanism', /cup/i);
  inEvery('carries the size correction — the heart is LARGER than the subconscious', /\b(bigger|larger)\b/i);
  inEvery('keeps the deliberate will in evidence, which is what makes it larger', /Daniel/);
  inEvery('refuses the untraceable percentage out loud (DR-0100)', /percent/i);
  inEvery('reaches KEEP rather than catch, so automatic never reads as unaccountable', /\bkeep\b/i);
  inEvery('carries the spacing reading of Deuteronomy 6:7 in its four ordinary settings', /sitting[\s\S]{0,60}walking[\s\S]{0,90}lying down[\s\S]{0,90}(rising|getting) up/i);
  inEvery('draws the boundary — a new heart is GIVEN, not built', /will give/i);
  inEvery('names neuroplasticity and explains it in context at first use', /neuroplastic/i);
  inEvery('answers the question that started it, by name', /heartfelt/i);
  inEvery('speaks His covenant name in our own voice', /Yahweh/);

  it('never substitutes Yahweh into a quotation (DR-0076 bright line)', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => {
      const spans = String(text).match(ALL_SPANS) || [];
      for (const s of spans) if (/Yahweh/.test(s)) faults.push(`${path}: ${s.slice(0, 50)}`);
    });
    expect(faults).toEqual([]);
  });

  it('never elides inside a quotation (DR-0459)', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => {
      for (const s of String(text).match(ALL_SPANS) || []) if (/\.\.\.|…/.test(s)) faults.push(`${path}: ${s.slice(0, 50)}`);
    });
    expect(faults).toEqual([]);
  });

  it('never capitalises the adversary, anywhere in the module', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => {
      for (const w of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
        if (String(text).includes(w)) faults.push(`${path}: ${w}`);
      }
    });
    expect(faults).toEqual([]);
  });
});

describe('the three tiers, handled as three tiers (DR-0100)', () => {
  it('states the established findings plainly rather than hedging them', () => {
    const t = `${OURS.adult} ${OURS.senior}`;
    expect(t).toMatch(/established|settled/i);
    expect(t).toMatch(/implicit memory/i);
    expect(t).toMatch(/sleep/i);
  });

  it('flags what is genuinely open NARROWLY — the construct, not the whole subject', () => {
    for (const band of ALL) {
      expect(OURS[band], `${band} never says the subconscious is not a structure`)
        .toMatch(/not (a|an) (body part|structure|organ|part of the brain)|no organ|nobody can point/i);
    }
  });

  it('corrects the over-reach while leaving the finding standing', () => {
    for (const band of ALL) {
      expect(OURS[band], `${band} never corrects automatic-means-unaccountable`)
        .toMatch(/(not responsible|not my fault|unaccountable|not their fault)/i);
    }
  });
});

describe('heartfelt is answered as a claim about SOURCE, not about truth', () => {
  it('says source in every band', () => {
    for (const band of ALL) {
      expect(OURS[band], `${band} never locates heartfelt as a source claim`)
        .toMatch(/(came (up )?out of|came from) the deep|claim about (where|source|SOURCE)/i);
    }
  });

  it('says plainly, in every band, that heartfelt does not settle whether it is true', () => {
    for (const band of ALL) {
      expect(OURS[band], `${band} lets heartfelt mean true`)
        .toMatch(/(does not mean right|does not mean true|settles nothing|not proof|no evidence at all about)/i);
    }
  });

  it('keeps Jeremiah 17:9 beside Luke 6:45, which is what makes the answer hold', () => {
    for (const band of ALL) {
      expect(TEXTS[band], `${band} is missing one half of the pair`).toContain('(Jeremiah 17:9)');
      expect(TEXTS[band], `${band} is missing one half of the pair`).toContain('(Luke 6:45)');
    }
  });
});

describe('the measures, taken on the emitted module', () => {
  it('every band is a full version of the message, not a fragment', () => {
    const m = measureFullness(L);
    expect(shortBands(m)).toEqual([]);
    for (const b of BANDS) expect(m.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('the bands are four authored versions, not one re-registered four times', () => {
    const d = measureDifferentiation(L);
    expect(d.worst).toBeLessThanOrEqual(DIFF_CEILING);
    // Measured at authoring: the worst pair sits far under the ceiling because
    // each band was composed from the situations that band actually lives in
    // rather than by re-registering its neighbour.
    expect(d.worst).toBeLessThanOrEqual(0.2);
  });

  it('the reading ladder steps at every level, which is the point of having levels', () => {
    const fk = (t) => fleschKincaidGrade(ourProseOnly(t));
    const child = fk(L.levels.child);
    const youth = fk(L.levels.youth);
    const teen = fk(L.levels.teen);
    const senior = fk(L.levels.senior);
    expect(child).toBeLessThan(youth);
    expect(youth).toBeLessThan(teen);
    expect(teen).toBeLessThan(senior);
    expect(child).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(teen).toBeLessThanOrEqual(6.0);
    expect(senior).toBeLessThanOrEqual(10.0);
  });
});

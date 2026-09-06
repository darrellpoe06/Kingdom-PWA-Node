// =============================================================================
// L128 — The Prudent Man Studies: systematic analysis, the Ways that protect,
// and seeing Him while blind. Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Built from Darrell's spoken teaching of 2026-09-06, delivered in eleven
// messages across one sitting. The two opening words looked like separate
// lessons — a prudent man who studies systematically, and actions protected by
// the Ways of Yahweh recognised while blind — until Hosea 14:9 turned out to
// carry PRUDENT and THE WAYS OF THE LORD in a single sentence. That verse is the
// weld, and it is the anchor.
//
// TRANSCRIPTION RULE, declared by Darrell in the same sitting: "my writing is
// supposed to be fixed also to reflect the meaning not my typos... unless it
// works... without fixing". So his quoted words are rendered for MEANING —
// spoken artifacts and truncations removed — and left alone wherever the raw
// form already carries it. Three spans were cleaned under that rule (a
// "studies"/"studied" slip, a trailing "if...", and a "because of His Ways are"
// spoken construction); the rest stand exactly as spoken.
//
// WHAT THIS GATE GUARDS. Every double-quoted span in the lesson must be verbatim
// KJV from the in-repo corpus, byte for byte, or be a declared non-Scripture
// span. The corpus joins verses with a newline, so a span crossing a verse
// boundary must be split — the defect class that bit L112/L113/L114.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll128-the-prudent-man-studies-systematic-analysis-the-ways-that-protect-and-seeing-him-while-blind';
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

// Quoted spans that are NOT Scripture. Every entry is Darrell's own spoken word
// from 2026-09-06, rendered for meaning per his transcription rule above. Our
// own emphasis is deliberately NOT on this list — emphasis wearing quotation
// marks reads as a citation, and that is a defect rather than an exemption.
const NOT_SCRIPTURE = [
  'A prudent man studies and does not get into trouble because he is systematically analyzing what Yahweh said to us humans',
  'study to show yourself what He has hidden, so you don’t fail to see the same thing His children studied to see.',
  'Actions are protected by the Ways of Yahweh',
  'they speak louder because you actually know you would have done something differently if it wasn’t for His Voice',
  'not audible to me',
  'but I see it like I saw 2Pac back in the day',
  'never met him but understood his perspectives because we had similarities',
  'now I see Yahweh, because His Ways are keeping me protected',
  'while blind.',
];

describe('L128 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L128 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L128 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
  });

  it('is anchored on the verse that welds the two spoken words together', () => {
    expect(m.anchor.ref, 'Hosea 14:9 carries PRUDENT and THE WAYS in one verse').toMatch(/Hosea 14:9/);
    expect(m.anchor.theme).toContain('prudent, and he shall know them?');
    expect(m.anchor.theme).toContain('for the ways of the LORD are right');
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('child, teen and senior levels are all authored, and none is a stub', () => {
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    expect(typeof m.lesson, 'L128 must carry a base lesson for the adult band').toBe('string');
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId, 'the adult band must resolve to its own depth').toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('no band anywhere in the series falls back — the debt stays closed', () => {
    for (const band of AGE_BANDS) {
      const gaps = LIVING_LESSONS_MODULES
        .filter((x) => resolveForAge(x, band.id, null).levelId !== band.depth)
        .map((x) => x.id.split('-')[0]);
      expect(gaps, `${band.label} must read prose authored for it`).toEqual([]);
    }
  });
});

describe('both spoken words are actually taught, not just cited', () => {
  it('the study half carries its load-bearing texts', () => {
    expect(l).toContain('A prudent man foreseeth the evil, and hideth himself');
    expect(l).toContain('rightly dividing the word of truth');
    expect(l).toContain('searched the scriptures daily, whether those things were so');
    expect(l).toContain('It is the glory of God to conceal a thing');
    expect(l).toContain('that we may do all the words of this law');
    expect(l).toContain('not unto themselves, but unto us they did minister');
  });

  it('the Ways half carries its load-bearing texts', () => {
    expect(l).toContain('He made known his ways unto Moses, his acts unto the children of Israel.');
    expect(l).toContain('and after the fire a still small voice.');
    expect(l).toContain('for they know not the voice of strangers.');
    expect(l).toContain('Surely the LORD is in this place; and I knew it not.');
    expect(l).toContain('And I will bring the blind by a way that they knew not');
  });

  it('the hinge that joins the two halves is present and named', () => {
    // Words abiding is the causal link: what is studied abides in the heart,
    // which is the temple, which is the layer that produces the defaults.
    expect(l).toContain('If ye abide in me, and my words abide in you');
    expect(l).toContain('Thy word have I hid in mine heart');
    expect(l).toContain('ye are the temple of God');
  });

  it('the deterministic doing Darrell asked for is answered concretely', () => {
    expect(l).toContain('He that dwelleth in the secret place of the most High');
    expect(l).toContain('Because he hath set his love upon me, therefore will I deliver him');
    expect(l).toContain('who shall abide in thy tabernacle?');
    expect(l).toContain('If ye be willing and obedient, ye shall eat the good of the land:');
    expect(l).toContain('for the mouth of the LORD hath spoken it.');
  });

  it("can't-see is taught as CANNOT, and as curable rather than fated", () => {
    expect(l).toContain('neither indeed can be.');
    expect(l).toContain('neither can he know them, because they are spiritually discerned.');
    expect(l).toContain('when it shall turn to the Lord, the vail shall be taken away.');
  });

  it('the guard rails are present — this teaching is not shipped without them', () => {
    // A sense of being led is TESTED; protection is not an untouched life; and
    // the same ways cut both directions. Removing any one of these turns the
    // lesson into a licence, which is exactly how this material gets misused.
    expect(l).toContain('the word of the LORD is tried');
    expect(l).toContain('Though he fall, he shall not be utterly cast down');
    expect(l).toContain('but the transgressors shall fall therein.');
  });

  it('keeps the 2Pac analogy as recognition-by-resemblance, with its fence attached', () => {
    expect(l).toContain('2Pac');
    expect(l).toContain('being understood by the things that are made');
    // The resemblance runs one direction only.
    expect(l).toContain('so are my ways higher than your ways');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  it("the lesson's double quotes are balanced", () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or a declared spoken-word span', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(80);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (NOT_SCRIPTURE.includes(part)) continue;
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('the allowlist is honest — no declared span is secretly Scripture', () => {
    // If one of these turns out to be in the corpus, it should be treated as a
    // quotation and cited, not carried as Darrell's own words.
    for (const s of NOT_SCRIPTURE) {
      expect(WHOLE_KJV.includes(s), `declared as spoken word but found in the KJV: ${s}`).toBe(false);
    }
  });

  it('the allowlist is not a dumping ground — every entry appears in the lesson', () => {
    const { spans } = quotedSpans(l);
    const flat = spans.flatMap((s) => s.split('...').map((x) => x.trim()));
    for (const s of NOT_SCRIPTURE) {
      expect(flat, `stale allowlist entry: ${s}`).toContain(s);
    }
  });
});

describe('typographic theology and our authored voice', () => {
  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice (DR-0210)').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });

  it('confesses Jesus as the Lamb and Eternal Son of Yahweh (DR-0210)', () => {
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
    expect(l).toContain('the Lamb of Yahweh');
  });
});

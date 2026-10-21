// =============================================================================
// sov48 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// Darrell forwarded a ByteByteGo issue into the app on 2026-10-21 at 17:12 UTC
// with one word above it: "Lesson." Its subject was "LLM Prompt Caching Versus
// Semantic Caching."
//
// THE GROUND WAS CHOSEN BY MEASUREMENT, and this test pins the reason. Counted
// in sovereign-ai-class.js BEFORE a word was written, the obvious lesson from
// that article was already taught four times over: prompt caching is sov20's
// ground, embeddings and similarity are sov22's, the one critical word that
// flips a meaning is sov32's (Judges 12 and James 2), and the order of a prompt
// is sov39's. Occurrences of the course's worked common vocabulary confirmed
// which verses may NOT carry a new spine: Matthew 24:35 31, Isaiah 40:8 33,
// Psalms 119:89 40, Acts 17:11 81, 1 Thessalonians 5:21 186. What was free,
// counted and not guessed at: "invalidat" 0, Joshua 9 0, Exodus 16 0, "manna"
// 0, Lamentations 3:22-23 0, Matthew 6:11 0, John 6:49 and 6:51 0, Haggai 1:5
// 0. So the untaught seam is INVALIDATION — deciding a stored answer has
// stopped being true — and the spine is Joshua 9 + Exodus 16 + Lamentations
// 3:22-23 + Matthew 6:11 + John 6:49-51 + Haggai 1:5.
//
// What this pins beyond the seventeen verses:
//   * the curly apostrophe, because sov47 shipped "watchman's" for the corpus's
//     "watchman’s" three times in three files before a checker caught it. A
//     straight apostrophe inside a quoted verse is an un-verbatim quote.
//   * the DR-0210 bright line: "Yahweh" in OUR prose, "God" and "the LORD" only
//     ever inside a quotation, where the KJV's wording is left exactly alone.
//   * that the lesson body is not the teen band wearing a second label. First
//     draft read 0.995 overlap against it; no gate in the house compares those
//     two, so this one does.
//   * that the modules array has no HOLE in it. The splice that added this
//     lesson left "},," behind and put an `undefined` in the catalog, because a
//     refusal written for duplicate week NUMBERS could not see a trailing
//     comma. Same defect class as the grep that hid sov43.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const PINNED = {
  'Joshua 9:4': 'They did work wilily, and went and made as if they had been ambassadors, and took old sacks upon their asses, and wine bottles, old, and rent, and bound up;',
  'Joshua 9:5': 'And old shoes and clouted upon their feet, and old garments upon them; and all the bread of their provision was dry and mouldy.',
  'Joshua 9:12': 'This our bread we took hot for our provision out of our houses on the day we came forth to go unto you; but now, behold, it is dry, and it is mouldy:',
  'Joshua 9:13': 'And these bottles of wine, which we filled, were new; and, behold, they be rent: and these our garments and our shoes are become old by reason of the very long journey.',
  'Joshua 9:14': 'And the men took of their victuals, and asked not counsel at the mouth of the LORD.',
  'Joshua 9:16': 'And it came to pass at the end of three days after they had made a league with them, that they heard that they were their neighbours, and that they dwelt among them.',
  'Exodus 16:19': 'And Moses said, Let no man leave of it till the morning.',
  'Exodus 16:20': 'Notwithstanding they hearkened not unto Moses; but some of them left of it until the morning, and it bred worms, and stank: and Moses was wroth with them.',
  'Exodus 16:21': 'And they gathered it every morning, every man according to his eating: and when the sun waxed hot, it melted.',
  'Numbers 11:6': 'But now our soul is dried away: there is nothing at all, beside this manna, before our eyes.',
  'Lamentations 3:22': 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not.',
  'Lamentations 3:23': 'They are new every morning: great is thy faithfulness.',
  'Matthew 6:11': 'Give us this day our daily bread.',
  'John 6:49': 'Your fathers did eat manna in the wilderness, and are dead.',
  'John 6:51': 'I am the living bread which came down from heaven: if any man eat of this bread, he shall live for ever: and the bread that I will give is my flesh, which I will give for the life of the world.',
  'Haggai 1:5': 'Now therefore thus saith the LORD of hosts; Consider your ways.',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m && m.id && m.id.startsWith('sov48-'));

/** Every authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('lesson', lesson.lesson);
  for (const k of ['child', 'youth', 'teen', 'senior']) push(k, lesson.levels[k]);
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  ((lesson.facilitator || {}).talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', (lesson.facilitator || {}).howToRun);
  ((lesson.facilitator || {}).discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
  });
  (lesson.stories || []).forEach((s, i) => push(`stories[${i}].body`, s.body));
  return out;
};

/** 8-word phrases, the same window the band-differentiation gate uses. */
const shingles = (text, n = 8) => {
  const w = String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(' '));
  return out;
};
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let hit = 0;
  for (const s of small) if (big.has(s)) hit += 1;
  return hit / small.size;
};

describe('sov48 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      expect(lesson.levels[k].length, k).toBeGreaterThan(1500);
    }
  });

  // What is sov48's to guarantee is its own number, and that nobody else claims
  // it. A newest-forever pin is what broke sov38's equivalent on arrival, so
  // this asserts nothing about 48 being the highest.
  it('is week 48, and no other week claims that number', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(lesson.id)).toBe(48);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (!m || m.id === lesson.id) continue;
      expect(n(m.id), m.id).not.toBe(48);
    }
  });

  // PROVEN TO CATCH. The splice that added this lesson left a double comma
  // behind, which put an `undefined` in the array. Every id-based check above
  // would have thrown rather than failed, and the catalog would have rendered a
  // hole to a reader.
  it('PROVEN TO CATCH: the modules array has no hole in it', () => {
    expect(SOVEREIGN_AI_MODULES.every((m) => m && typeof m.id === 'string' && m.id)).toBe(true);
    expect(SOVEREIGN_AI_MODULES.length).toBe(Object.keys(SOVEREIGN_AI_MODULES).length);
  });

  it('every verse it declares is the corpus on disk, verbatim', () => {
    const declared = lesson.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(declared.length).toBe(Object.keys(PINNED).length);
    for (const ref of declared) {
      expect(PINNED, ref).toHaveProperty(ref);
      expect(PINNED[ref], ref).toBe(corpusText(ref));
    }
  });

  it('every quoted span, in EVERY authored string, is that verse verbatim', () => {
    const re = /"([^"]{10,900})"\s*\(([1-3]?\s?[A-Z][a-z]+\s+\d+:\d+)\)/g;
    let checked = 0;
    for (const { place, text } of EVERY_TEXT()) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const real = PINNED[m[2]] || corpusText(m[2]);
        expect(real.includes(m[1]), `${place}: ${m[2]} — ${m[1].slice(0, 70)}`).toBe(true);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(80);
  });

  // PROVEN TO CATCH. sov47 shipped a straight apostrophe inside Ezekiel 33:6
  // three times across three files; a span check cannot see it when the whole
  // span is consistently wrong.
  it('PROVEN TO CATCH: no quoted verse carries a straight apostrophe where the corpus has a curly one', () => {
    const offenders = [];
    for (const { place, text } of EVERY_TEXT()) {
      for (const [ref, txt] of Object.entries(PINNED)) {
        if (!txt.includes('’')) continue;
        const words = txt.split(' ');
        for (let i = 0; i + 5 <= words.length; i += 1) {
          const win = words.slice(i, i + 5).join(' ');
          const straight = win.replace(/’/g, "'");
          if (straight !== win && text.includes(straight)) offenders.push(`${place}: ${ref} — ${straight}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // DR-0210 / DR-0076: "Yahweh" is ours to say; "God" and "the LORD" belong to
  // the quotation and are never substituted or introduced into our own prose.
  // Joshua 9:14, Lamentations 3:22 and Haggai 1:5 all carry "the LORD" inside
  // the quotation, which is exactly where it stays.
  it('names Yahweh in our prose and leaves God and the LORD inside the quotations', () => {
    const strip = (t) => t.replace(/"[^"]*"/g, ' ');
    let yahweh = 0;
    for (const { place, text } of EVERY_TEXT()) {
      const ours = strip(text);
      expect(/\bGod\b/.test(ours), `${place}: "God" in our own prose`).toBe(false);
      expect(/\bthe LORD\b/.test(ours), `${place}: "the LORD" in our own prose`).toBe(false);
      yahweh += (ours.match(/\bYahweh\b/g) || []).length;
    }
    expect(yahweh).toBeGreaterThan(0);
  });

  // PROVEN TO CATCH. The first draft built the lesson body out of the teen band
  // and read 0.995 against it. band-differentiation compares the four bands to
  // each other and never the lesson, so nothing in the house would have said so.
  it('PROVEN TO CATCH: the lesson body is not a band wearing a second label', () => {
    const body = shingles(lesson.lesson);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      const o = overlap(body, shingles(lesson.levels[k]));
      expect(o, `lesson~${k} overlap ${o.toFixed(3)}`).toBeLessThan(0.5);
    }
  });

  it('keeps the provenance honest: the source, its advertising, and the expiry on its own numbers', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/ByteByteGo/);
    expect(all).toMatch(/advertis/i);
    // The pricing figures are reported, dated, and marked as carrying their own
    // expiry — which is the lesson demonstrating itself (DR-0076 section 8).
    expect(all).toMatch(/one tenth of the ordinary input rate/);
    expect(all).toMatch(/re-fetch/i);
    // The score-is-not-a-probability sentence, stated plainly per DR-0100.
    expect(all).toMatch(/similarity score is not a probability/);
  });

  it('does not re-teach the ground sov20, sov22, sov32 and sov39 already hold', () => {
    const mine = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    // The verses that would have made this a duplicate of sov32's Shibboleth
    // teaching and of the word-given-in-place-of-the-deed.
    expect(mine.has('Judges 12:6')).toBe(false);
    expect(mine.has('James 2:15')).toBe(false);
    expect(mine.has('James 2:16')).toBe(false);
    // And it NAMES those weeks instead, so a reader is sent rather than served
    // the same teaching a fifth time.
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/week twenty\b/);
    expect(all).toMatch(/week thirty-two/);
    for (const other of SOVEREIGN_AI_MODULES) {
      if (!other || other.id === lesson.id) continue;
      const theirs = new Set(String((other.anchor || {}).ref || '').split(';').map((s) => s.trim()).filter(Boolean));
      let shared = 0;
      for (const r of mine) if (theirs.has(r)) shared += 1;
      // DR-1185's rule flags a pair at ten or more shared verses in one course.
      expect(shared, `${other.id} shares ${shared} verses with sov48`).toBeLessThan(10);
    }
  });
});

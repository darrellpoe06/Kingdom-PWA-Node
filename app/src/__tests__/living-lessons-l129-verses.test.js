// =============================================================================
// L129 — You Have a Destiny: the Giver, the window, covenant authority, the
// heart of flesh, and the me that has to die. Verbatim KJV, and the rules this
// lesson is bound by.
// =============================================================================
// TWO SOURCES, ONE LESSON. The OCCASION is a message by Joseph Prince, "You Have
// A Destiny" (part one of four), brought in by Darrell on 2026-09-06. It is
// credited by name and NOT reproduced: every line of the lesson is our own prose
// taught from the Scriptures the message opened. The second source is Darrell,
// who spoke four words into the same sitting — the heart of stone, the thoughts
// brought to obey, the death of me, and the double choosing. Those four are not
// an appendix to the sermon outline; they are the machinery it assumes and never
// describes, which is why they are movements six through eight and why the
// hardened heart is called the HINGE. Rendered for MEANING per DR-0331, not for
// his typos, and left alone wherever the raw form already carried it.
//
// WHAT THIS GATE GUARDS.
//   1. Every double-quoted span in the module is verbatim KJV from the in-repo
//      corpus, byte for byte, or is one of ten declared non-Scripture spans
//      (Darrell's own words, plus the attributed sermon title). Our own emphasis
//      is deliberately NOT on that list — emphasis wearing quotation marks reads
//      as a citation, and that is a defect, not an exemption.
//   2. The cross-verse defect class. The corpus joins verses with a newline, so
//      a span crossing a verse boundary is NOT a substring of it and must be
//      split on an ellipsis. Authoring this lesson produced EIGHT of them at
//      once (John 11:41-42, Hebrews 2:14-15, Zechariah 7:11-12, Mark 8:17-18,
//      Hebrews 3:7-8 twice, 1 Corinthians 15:3-4, Ezekiel 36:26-27 twice, Luke
//      9:23-24) — the same class that bit L112/L113/L114 — plus a ninth defect
//      of a different kind: John 3:16 quoted as "for God so loved..." with the
//      capital lowered to fit our sentence, which is editing Scripture.
//   3. The pastoral fences. This is faith-and-authority material, the kind that
//      wounds people when it is preached without its guard rails. Three are
//      asserted below as load-bearing and may not be removed: Sceva's sons (the
//      name is not a password), Paul's thorn (a clean prayer can be answered
//      No), and Luke 10:20 (the authority is real and is not the treasure).
//   4. Exegetical restraint. It is commonly preached that Jesus took the keys
//      back from the adversary between the cross and the resurrection. The Word
//      says He HAS them and that He DESTROYED him that had the power of death;
//      it narrates no handover. The lesson must teach the written sentences and
//      decline to supply the unwritten one (DR-0098's "where the Word is
//      reticent, stay with what it says").
//   5. The ORDER of righteousness. Received by one obedience (Romans 5:19),
//      then walked by captive thoughts (2 Corinthians 10:5). Inverted, movement
//      seven becomes a treadmill, so both halves are asserted together.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll129-you-have-a-destiny-the-giver-the-window-covenant-authority-the-heart-of-flesh-and-the-me-that-has-to-die';
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

// Quoted spans that are NOT Scripture. Nine are Darrell's own spoken words from
// 2026-09-06, rendered for meaning per DR-0331; the tenth is the title of the
// message that occasioned the lesson, which is a citation of a real source and
// not our own emphasis.
const NOT_SCRIPTURE = [
  'You Have A Destiny',
  'hearts of stone changed to hearts of flesh',
  'life situations make us have hard or stone hearts',
  'only believing Yahweh about the Good News of His Son',
  'we can’t get helped',
  'Only righteousness because of bringing thoughts to obey Him',
  'like He Obeyed the Father',
  'to the death of me',
  'self me to His version of the me',
  'each one chosen and need to also choose Him',
];

describe('L129 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L129 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L129 must be in LIVING_LESSONS_MODULES').toBeTruthy();
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

  it('is anchored on the chain of His verbs, not on the authority material', () => {
    // Romans 8:30 leads deliberately: a room that meets exousia first hears a
    // technique. The Giver and the covenant come before the authority.
    expect(m.anchor.ref).toMatch(/Romans 8:30/);
    expect(m.anchor.theme).toContain('them he also justified: and whom he justified, them he also glorified.');
    expect(m.anchor.theme).toContain('I will give you an heart of flesh.');
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
    expect(typeof m.lesson, 'L129 must carry a base lesson for the adult band').toBe('string');
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

describe('the sermon spine is actually taught, not merely cited', () => {
  it('the Giver is established from rank before a word is said about prayer', () => {
    expect(l).toContain('And without all contradiction the less is blessed of the better.');
    expect(l).toContain('how shall he not with him also freely give us all things?');
    expect(l).toContain('how much more shall your Father which is in heaven give good things to them that ask him?');
  });

  it('the window is a real mechanism, shown open AND shut from the inside', () => {
    expect(l).toContain('if I will not open you the windows of heaven');
    expect(l).toContain('Behold, if the LORD would make windows in heaven, might this thing be?');
    expect(l).toContain('thou shalt see it with thine eyes, but shalt not eat thereof.');
  });

  it('what Jesus rebuked is quoted precisely — the audience and the volume, never brevity', () => {
    expect(l).toContain('that they may be seen of men.');
    expect(l).toContain('for they think that they shall be heard for their much speaking.');
    // The counter-witness must stay, or the lesson invents a rule against long
    // prayer that the Word does not give.
    expect(l).toContain('continued all night in prayer to God.');
    expect(l).toContain('Pray without ceasing.');
    expect(l).toContain('Lazarus, come forth.');
  });

  it('exousia and dunamis are taught from the vocabulary of the verse itself', () => {
    expect(l).toContain('Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy');
    expect(l).toContain('exousia');
    expect(l).toContain('dunamis');
    expect(l).toContain('All power is given unto me in heaven and in earth.');
  });

  it('grace runs to glory, in that order, and the destiny is named from the text', () => {
    expect(l).toContain('the LORD will give grace and glory');
    expect(l).toContain('Bring forth the best robe');
    expect(l).toContain('Ye also, as lively stones, are built up a spiritual house');
    expect(l).toContain('which God hath before ordained that we should walk in them.');
  });
});

describe("Darrell's four spoken words are taught as movements, not footnotes", () => {
  it('the heart of stone carries its texts, in both registers — chosen and incremental', () => {
    expect(l).toContain('they made their hearts as an adamant stone, lest they should hear the law');
    expect(l).toContain('For they considered not the miracle of the loaves: for their heart was hardened.');
    expect(l).toContain('lest any of you be hardened through the deceitfulness of sin.');
  });

  it('his exact point — no believing, no help — lands on Hebrews 4:2 and the mixing', () => {
    expect(l).toContain('the word preached did not profit them, not being mixed with faith in them that heard it.');
    expect(l).toContain('faith cometh by hearing, and hearing by the word of God.');
  });

  it('the exchange of the heart is stated in HIS verbs, not as another assignment', () => {
    expect(l).toContain('I will take away the stony heart out of your flesh, and I will give you an heart of flesh');
    expect(l).toContain('not in tables of stone, but in fleshy tables of the heart.');
  });

  it('the captive thought is taught with the pattern he named — like He obeyed the Father', () => {
    expect(l).toContain('bringing into captivity every thought to the obedience of Christ');
    expect(l).toContain('he humbled himself, and became obedient unto death, even the death of the cross.');
    expect(l).toContain('not to do mine own will, but the will of him that sent me.');
  });

  it('the death of me is taught with its alternative — abiding alone, not staying safe', () => {
    expect(l).toContain('let him deny himself, and take up his cross daily, and follow me');
    expect(l).toContain('I die daily.');
    expect(l).toContain('it abideth alone');
    // Not deletion — a specified replacement. This is his "His version of the me".
    expect(l).toContain('predestinate to be conformed to the image of his Son');
  });

  it('chosen AND choosing are both taught, with no contest staged between them (DR-0098)', () => {
    expect(l).toContain('Ye have not chosen me, but I have chosen you');
    expect(l).toContain('choose you this day whom ye will serve');
    expect(l).toContain('called, and chosen, and faithful.');
  });

  it('the two stones are welded — the one removed and the one you are built into', () => {
    expect(l).toMatch(/stony heart[\s\S]{0,600}LIVELY/);
  });
});

describe('the fences are attached — this material is not shipped without them', () => {
  it("Sceva's sons: the name is not a password", () => {
    expect(l).toContain('We adjure you by Jesus whom Paul preacheth.');
    expect(l).toContain('Jesus I know, and Paul I know; but who are ye?');
  });

  it("Paul's thorn: a clean prayer can be answered No, and the lesson says so", () => {
    expect(l).toContain('For this thing I besought the Lord thrice, that it might depart from me.');
    expect(l).toContain('My grace is sufficient for thee: for my strength is made perfect in weakness.');
    expect(l).toContain('ye have not, because ye ask not.');
    expect(l).toContain('Ye ask, and receive not, because ye ask amiss');
  });

  it('the authority is bounded by His will, and is explicitly not the treasure', () => {
    expect(l).toContain('if we ask any thing according to his will, he heareth us');
    expect(l).toContain('rather rejoice, because your names are written in heaven.');
  });

  it('the ORDER of righteousness is kept — received first, then walked', () => {
    expect(l).toContain('so by the obedience of one shall many be made righteous.');
    expect(l).toContain('that we might be made the righteousness of God in him.');
    expect(l).toContain('whether of sin unto death, or of obedience unto righteousness?');
  });

  it('exegetical restraint on the keys — what is written, and no more', () => {
    expect(l).toContain('and have the keys of hell and of death.');
    expect(l).toContain('that through death he might destroy him that had the power of death');
    // The lesson must say out loud that the handover scene is not narrated.
    expect(l).toMatch(/does not narrate/i);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  it("the lesson's double quotes are balanced", () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or a declared non-Scripture span', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (NOT_SCRIPTURE.includes(part)) continue;
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a cross-verse span is rejected, because the corpus joins verses with a newline', () => {
    // This is the exact class authoring L129 produced eight times. Hebrews 3:7
    // ends "To day if ye will hear his voice," and 3:8 begins "Harden not your
    // hearts," — each is in the corpus, the join of the two is not.
    const crossing = 'To day if ye will hear his voice, Harden not your hearts';
    expect(WHOLE_KJV.includes(crossing), 'a cross-verse span must NOT read as verbatim').toBe(false);
    expect(WHOLE_KJV.includes('To day if ye will hear his voice,')).toBe(true);
    expect(WHOLE_KJV.includes('Harden not your hearts')).toBe(true);
    // …and the lesson carries the SPLIT form, not the joined one.
    expect(l.includes(crossing)).toBe(false);
    expect(l).toContain('To day if ye will hear his voice,... Harden not your hearts');
  });

  it('PROVEN-TO-CATCH: lowering a capital inside a quotation is rejected', () => {
    // The second real defect this lesson produced: John 3:16 quoted as "for God
    // so loved..." so it would read smoothly mid-sentence. That edits the text.
    expect(WHOLE_KJV.includes('for God so loved the world, that he gave')).toBe(false);
    expect(WHOLE_KJV.includes('For God so loved the world, that he gave')).toBe(true);
    expect(l).toContain('"For God so loved the world, that he gave"');
  });

  it('the allowlist is honest — no declared span is secretly Scripture', () => {
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

  it('credits the occasion by name and does not pass the message off as ours', () => {
    expect(l).toContain('Joseph Prince');
    expect(l).toMatch(/not reproduced/i);
  });
});

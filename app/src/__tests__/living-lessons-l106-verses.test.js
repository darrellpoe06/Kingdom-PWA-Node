// =============================================================================
// L106 — Wise as Serpents, Harmless as Doves: knowing the enemy, denying the
// flesh, doing only Yahweh's will, and the one directed way. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken questions 2026-08-30 — a spoken teaching is
// build input (DR-0089). What Yahweh means by "wise as serpents": know the enemy
// (the roaring lion that is NOT the Lion of Judah; he only bruised the heel)
// without adopting his nature — wise unto good, simple concerning evil; deny the
// flesh where he works; the Word divides soul from spirit so we discern flesh
// from Spirit; be capable but do only Yahweh's will; lean not on our own
// understanding; acknowledge Him and He directs the one way. Typographic theology
// held: in the lesson's own voice the adversary is named low; KJV quotes keep
// their casing verbatim (DR-0076 bright line). Every KJV line FETCHED from the
// repo's own KJV this session; a drift fails the build. Companion to L102/L104/L105.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll106-wise-as-serpents-harmless-as-doves-know-the-enemy-deny-the-flesh-and-the-one-way'");
// Bound the slice to THIS module only — a later lesson quotes "Satan himself…"
// (2 Cor 11:14), which must not bleed into L106's low-naming check.
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'be ye therefore wise as serpents, and harmless as doves',               // Matt 10:16
  'I would have you wise unto that which is good, and simple concerning evil', // Rom 16:19
  'it shall bruise thy head, and thou shalt bruise his heel',              // Gen 3:15
  'your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour', // 1 Pet 5:8
  'we are not ignorant of his devices',                                    // 2 Cor 2:11
  'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil', // Eph 6:11
  'He was a murderer from the beginning',                                  // John 8:44
  'the Lion of the tribe of Juda, the Root of David, hath prevailed',      // Rev 5:5
  'This wisdom descendeth not from above, but is earthly, sensual, devilish', // Jas 3:15
  'Resist the devil, and he will flee from you',                          // Jas 4:7
  'let him deny himself, and take up his cross, and follow me',             // Matt 16:24
  'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',      // Gal 5:16
  'bringing into captivity every thought to the obedience of Christ',       // 2 Cor 10:5
  'out of the heart proceed evil thoughts',                               // Matt 15:19
  'piercing even to the dividing asunder of soul and spirit',              // Heb 4:12
  'as many as are led by the Spirit of God, they are the sons of God',      // Rom 8:14
  'he shall presently give me more than twelve legions of angels',          // Matt 26:53
  'I seek not mine own will, but the will of the Father which hath sent me', // John 5:30
  'Be ye holy; for I am holy',                                            // 1 Pet 1:16
  'lean not unto thine own understanding',                                // Prov 3:5
  'In all thy ways acknowledge him, and he shall direct thy paths',        // Prov 3:6
  'I am the way, the truth, and the life',                                // John 14:6
  'This is the way, walk ye in it',                                        // Isa 30:21
];

describe('L106 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 10:16; Romans 16:19; Proverbs 3:5-6'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — nine movements + THE WHOLE OF IT', () => {
    const order = [
      '1) WISE AS SERPENTS, HARMLESS AS DOVES',
      '2) KNOW THE ENEMY',
      '3) THE ROARING LION IS NOT THE LION OF JUDAH',
      '4) SERPENT-WISDOM, NOT SERPENT-NATURE',
      '5) DENY THE FLESH',
      '6) THE WORD DIVIDES SOUL FROM SPIRIT',
      '7) CAPABLE, BUT ONLY YAHWEH',
      '8) LEAN NOT ON YOUR OWN UNDERSTANDING',
      '9) ACKNOWLEDGE HIM',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers Darrell\'s threads and keeps the typographic theology in its own voice', () => {
    expect(l).toContain('Darrell brought');
    expect(l).toContain('roaring lion');
    // Darrell's soul/spirit question answered explicitly
    expect(l).toContain('divide soul from spirit');
    // in the lesson's OWN prose the adversary is named low — declared, and the
    // name itself stays lowercase (KJV quotes keep their verbatim casing, DR-0076).
    expect(l).toContain('the adversary named low');
    // no capitalized adversary NAME in our authored prose (Satan/Lucifer as a proper
    // name); "Satan" only ever appears inside the fetched KJV quote of 2 Cor 2:11.
    expect((l.match(/Lucifer/g) || []).length).toBe(0);
    // every "Satan" sits inside the verbatim KJV quote of 2 Cor 2:11 ("Lest Satan…"),
    // never introduced as a capitalized proper name in the lesson's own prose.
    for (const m of l.matchAll(/\bSatan\b/g)) {
      expect(l.slice(m.index - 5, m.index)).toBe('Lest ');
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry wise-and-harmless and the one-way threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries wise/harmless`).toMatch(/wise as serpents|wise unto that which is good/);
      expect(t, `${band} carries the one way`).toContain('I am the way, the truth, and the life');
    }
    // teen and senior additionally carry the counterfeit-lion and deny-the-flesh threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('hath prevailed');            // the true Lion of Judah
      expect(t).toContain('deny himself');              // deny the flesh
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Matthew', 10, 16)).toBe('Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.');
    expect(verse('Romans', 16, 19)).toContain('wise unto that which is good, and simple concerning evil');
    expect(verse('Genesis', 3, 15)).toContain('it shall bruise thy head, and thou shalt bruise his heel');
    expect(verse('1Peter', 5, 8)).toContain('your adversary the devil, as a roaring lion');
    expect(verse('Ephesians', 6, 11)).toContain('the whole armour of God');
    expect(verse('Hebrews', 4, 12)).toContain('the dividing asunder of soul and spirit');
    expect(verse('Romans', 8, 14)).toBe('For as many as are led by the Spirit of God, they are the sons of God.');
    expect(verse('Matthew', 26, 53)).toContain('twelve legions of angels');
    expect(verse('1Peter', 1, 16)).toContain('Be ye holy; for I am holy');
    expect(verse('Proverbs', 3, 5)).toBe('Trust in the LORD with all thine heart; and lean not unto thine own understanding.');
    expect(verse('Proverbs', 3, 6)).toBe('In all thy ways acknowledge him, and he shall direct thy paths.');
    expect(verse('John', 14, 6)).toContain('I am the way, the truth, and the life');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111/L110/L109/L108/L107 the same day. The module arrived clean
// on the span gate — all 197 quotations verbatim — and the voice check found
// the generic name in two places in bands that were rewritten anyway.
//
// The span gate also earned its keep BEFORE the apply this time, which is the
// point of running it on the drafts: the new teen and senior bands were
// written with `Christ's` where Galatians 5:24 carries `Christ’s` (U+2019).
// It was typed rather than pasted, which is exactly the mechanism DR-0418's
// L112 note named, and it never reached the file.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a quotation of contiguous verses is a true substring
// while a phrase stitched from two chapters still is not.
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
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

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(180);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — including the apostrophe caught in this lesson\'s own drafts', () => {
    expect(KJV_FLOW.includes('they that are Christ\u2019s have crucified the flesh')).toBe(true);
    expect(KJV_FLOW.includes("they that are Christ's have crucified the flesh")).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('wise as serpents, and harmless as doves')).toBe(true);
    expect(KJV_FLOW.includes('wise as serpents, and gentle as doves')).toBe(false);
    expect(KJV_FLOW.includes('wise unto that which is good, and simple concerning evil')).toBe(true);
    expect(KJV_FLOW.includes('wise unto that which is good, and simple concerning the evil')).toBe(false);
    expect(KJV_FLOW.includes('lean not unto thine own understanding')).toBe(true);
    expect(KJV_FLOW.includes('lean not upon thine own understanding')).toBe(false);
    expect(KJV_FLOW.includes('dividing asunder of soul and spirit')).toBe(true);
    expect(KJV_FLOW.includes('dividing asunder of soul and of spirit')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name, and never capitalizes him', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(10);
  });
});

describe('every band is the FULL message, in that age\'s own words (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('youth exists beside the other three, and none is a summary', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1600);
    }
  });

  it('every band carries all nine movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries both halves together`).toContain('wise as serpents, and harmless as doves');
      expect(t, `${band} splits the two objects`).toContain('simple concerning evil');
      expect(t, `${band} carries the head-for-heel asymmetry`).toContain('bruise thy head, and thou shalt bruise his heel');
      expect(t, `${band} names the liar and the father of it`).toContain('the father of it');
      expect(t, `${band} distinguishes the counterfeit from the Lion of Judah`).toContain('the Lion of the tribe of Juda');
      expect(t, `${band} rejects the counterfeit wisdom`).toContain('earthly, sensual, devilish');
      expect(t, `${band} denies the flesh`).toContain('deny himself, and take up his cross');
      expect(t, `${band} says why the Word divides`).toContain('sharper than any twoedged sword');
      expect(t, `${band} carries the legions He did not call`).toContain('twelve legions of angels');
      expect(t, `${band} leans not on its own understanding`).toContain('lean not unto thine own understanding');
      expect(t, `${band} carries the one directed way`).toContain('he shall direct thy paths');
      expect(t, `${band} names the Way as a Person`).toContain('I am the way, the truth, and the life');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as discernment-under-the-Word (companion to
    // L102 ... L104 ... L105)", the capture date, and a checklist of what the
    // phrases mean. Those belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as discernment-under-the-Word');
    expect(senior).not.toMatch(/companion to L\d+/i);
    expect(senior).not.toContain('2026-08-30');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

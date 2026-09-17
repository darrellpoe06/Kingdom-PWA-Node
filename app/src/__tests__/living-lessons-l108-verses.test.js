// =============================================================================
// L108 — Why We Name Him Low: the typography of a defeated enemy. Verbatim KJV.
// =============================================================================
// Captured from Darrell's teaching + directive 2026-08-30 — a spoken teaching is
// build input (DR-0089). Records WHY the app lowercases the adversary's names
// everywhere, including inside the Bible text: he forfeited the honor (Isaiah
// 14:12), he is a defeated creature and no peer of Yahweh (Genesis 3:15; Rev
// 12:10; Col 2:15), all honor is Yahweh's alone (Isaiah 42:8; Phil 2:9-10), it
// disciples the eye to reserve fear for Yahweh (James 4:7; Isaiah 8:13), and it
// agrees with Heaven's verdict rather than calling evil good (Isaiah 5:20). The
// KJV fetched from the app's own corpus, which now writes his names low — so this
// test doubles as the witness that the corpus was lowercased (lucifer, satan).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll108-why-we-name-him-low-the-typography-of-a-defeated-enemy'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'How art thou fallen from heaven, O lucifer, son of the morning',         // Isa 14:12 (lowercased)
  'I will exalt my throne above the stars of God',                         // Isa 14:13
  'it shall bruise thy head, and thou shalt bruise his heel',              // Gen 3:15
  'the accuser of our brethren is cast down',                             // Rev 12:10
  'having spoiled principalities and powers, he made a shew of them openly', // Col 2:15
  'I beheld satan as lightning fall from heaven',                          // Luke 10:18 (lowercased)
  'my glory will I not give to another',                                   // Isa 42:8
  'Thou shalt have no other gods before me',                              // Exo 20:3
  'Get thee hence, satan',                                                 // Matt 4:10 (lowercased)
  'Thou art worthy, O Lord, to receive glory and honour and power',        // Rev 4:11
  'given him a name which is above every name',                            // Phil 2:9
  'That at the name of Jesus every knee should bow',                       // Phil 2:10
  'Resist the devil, and he will flee from you',                          // Jas 4:7
  'greater is he that is in you, than he that is in the world',            // 1 John 4:4
  'let him be your fear, and let him be your dread',                       // Isa 8:13
  'Woe unto them that call evil good, and good evil',                      // Isa 5:20
  'the devil that deceived them was cast into the lake of fire',            // Rev 20:10 (lowercased)
  'the God of peace shall bruise satan under your feet shortly',           // Rom 16:20 (lowercased)
  'the name of the wicked shall rot',                                     // Prov 10:7
];

describe('L108 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 14:12; James 4:7; Philippians 2:9-10'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — five reasons + THE WHOLE OF IT', () => {
    const order = [
      '1) HE FORFEITED THE HONOR',
      '2) HE IS A CREATURE, NOT A PEER OF YAHWEH',
      '3) ALL HONOR BELONGS TO YAHWEH ALONE',
      '4) DISCIPLE THE EYE',
      '5) AGREE WITH HEAVEN',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('names the directive and the bright line — his name low even inside the Bible, meaning untouched', () => {
    expect(l).toContain('Darrell');
    expect(l).toContain('inside the Bible');
    expect(l).toContain('the KJV words stand');
    // the adversary's name is written LOW throughout this lesson, including its quotes.
    expect((l.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((l.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect(l).toContain('lucifer');
    expect(l).toContain('satan');
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
  it('child, teen, and senior each carry the forfeited-honor and honor-is-Yahwehs threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the fall`).toContain('How art thou fallen from heaven');
      expect(t, `${band} carries resist/flee`).toContain('Resist the devil, and he will flee from you');
    }
    // teen and senior additionally carry the name-above-every-name and fear-is-Yahwehs threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('a name which is above every name');
    }
  });
});

describe('corpus witness — the corpus itself now writes the adversary low (the sweep landed)', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('adversary names are lowercased in the KJV corpus, and place/person names are preserved', () => {
    expect(verse('Isaiah', 14, 12)).toContain('O lucifer, son of the morning');
    expect(verse('Luke', 10, 18)).toBe('And he said unto them, I beheld satan as lightning fall from heaven.');
    expect(verse('Matthew', 4, 10)).toContain('Get thee hence, satan');
    expect(verse('Romans', 16, 20)).toContain('the God of peace shall bruise satan under your feet shortly');
    expect(verse('1Kings', 18, 21)).toContain('if baal, then follow him');          // false god lowered
    expect(verse('Matthew', 12, 24)).toContain('beelzebub the prince of the devils'); // false god lowered
    // place/person names PRESERVED (whole-word matching never touched them):
    expect(verse('Joshua', 15, 9)).toContain('Baalah');   // a place
    expect(verse('1Chronicles', 1, 49)).toContain('Baalhanan'); // a person (king of Edom)
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111/L110/L109 the same day. On THIS lesson — the one that
// argues for the typography in the first place — the checks matter most, and
// they found two real things on arrival:
//
//   1. A discussion question put OUR OWN phrase in double quotes and followed
//      it with verse references, so it read as a quotation of Isaiah 5:20 and
//      Revelation 12:10 when it was not Scripture at all. The quotation marks
//      came off; the references stayed references.
//   2. The generic name stood in our own prose in four places (three in the
//      child band, one in a facilitator talking point), in a lesson whose
//      whole subject is which names get honor.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a legitimate quotation of contiguous verses is a true
// substring while a phrase stitched from two chapters still is not.
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

  it('EVERY double-quoted span is verbatim KJV — nothing of ours wears quotation marks', () => {
    // No allowlist here on purpose. In a lesson about whose name gets honor,
    // a double-quoted phrase of our own beside verse references is exactly the
    // confusion we must not create, so the fix was to un-quote ours.
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(80);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — plausible drifts of this lesson\'s own hinges are not the text', () => {
    expect(KJV_FLOW.includes('it shall bruise thy head, and thou shalt bruise his heel')).toBe(true);
    expect(KJV_FLOW.includes('it shall bruise thy heel, and thou shalt bruise his head')).toBe(false);
    expect(KJV_FLOW.includes('O lucifer, son of the morning')).toBe(true);
    expect(KJV_FLOW.includes('O lucifer, son of the mourning')).toBe(false);
    expect(KJV_FLOW.includes('my glory will I not give to another')).toBe(true);
    expect(KJV_FLOW.includes('my glory I will not give to another')).toBe(false);
    // And the corpus keeps him LOW inside the Bible text itself (DR-0108's
    // 2026-08-30 sweep) — the practice this lesson argues for, checked.
    expect(KJV_FLOW.includes('I beheld satan as lightning fall from heaven')).toBe(true);
    expect(KJV_FLOW.includes('I beheld Satan as lightning fall from heaven')).toBe(false);
  });
});

describe('our own authored voice honors the right names (DR-0210, Layer 0 typography)', () => {
  it('says Yahweh, and never capitalizes him — in the lesson that argues for it', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/\bSatan\b/g) || []).length, 'capitalized adversary name in our voice').toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bDevil\b/g) || []).length).toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1200);
    }
  });

  it('every band carries all five reasons, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the forfeited honor`).toContain('O lucifer, son of the morning');
      expect(t, `${band} carries the head-for-heel asymmetry`).toContain('bruise thy head, and thou shalt bruise his heel');
      expect(t, `${band} carries the glory He will not share`).toContain('my glory will I not give to another');
      expect(t, `${band} carries the Name above every name`).toContain('above every name');
      expect(t, `${band} carries the resist-and-he-flees fact`).toContain('he will flee from you');
      expect(t, `${band} reassigns the fear by name`).toContain('let him be your fear');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as the rationale behind the platform's
    // typography...", "Pairs with the Typographic Theology...", ordinal
    // movements addressed to whoever was leading. Those belong in
    // `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as the rationale');
    expect(senior).not.toContain('Pairs with the Typographic Theology');
    expect(senior).not.toMatch(/\bL10[0-9]\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

// =============================================================================
// L100 — Guard the Little Ones: children as a trust, the millstone warning, and
// being mastered by nothing. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 forwarded the Meta teen-safety settlement (NPR / 1440 /
// Morning Brew, 2026-08-27) with "Lesson." Held Word-first and two tiers honest
// (DR-0100): the settlement (~$17B, reported $16.7B-$18B) and the documented
// harm to the developing teen brain are stated plainly; the exact figure and
// Meta's denial are held as contested, not asserted. Non-partisan — the headline
// is the occasion, the eternal duty to guard children is the lesson. Every KJV
// line FETCHED from the repo's own KJV this session; a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const QUOTED_FRAGMENTS = [
  // children are the Lord's heritage
  'Lo, children are an heritage of the LORD: and the fruit of the womb is his reward',
  // the millstone warning — all three
  'But whoso shall offend one of these little ones which believe in me, it were better for him that a millstone were hanged about his neck',
  'And whosoever shall offend one of these little ones that believe in me',
  'than that he should offend one of these little ones',
  // guard the eye and the heart
  'I will set no wicked thing before mine eyes',
  'Keep thy heart with all diligence; for out of it are the issues of life',
  'The light of the body is the eye: if therefore thine eye be single',
  'But if thine eye be evil, thy whole body shall be full of darkness',
  // the praise of men
  'For they loved the praise of men more than the praise of God',
  'or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ',
  'And be not conformed to this world: but be ye transformed by the renewing of your mind',
  // parents teach diligently
  'And thou shalt teach them diligently unto thy children',
  'Train up a child in the way he should go: and when he is old, he will not depart from it',
  'bring them up in the nurture and admonition of the Lord',
  // mastered by nothing
  'All things are lawful unto me, but all things are not expedient',
  'He that hath no rule over his own spirit is like a city that is broken down, and without walls',
  // treasure and rest
  'For where your treasure is, there will your heart be also',
  'for so he giveth his beloved sleep',
  'Come unto me, all ye that labour and are heavy laden, and I will give you rest',
];

describe('L100 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 127:3; Matthew 18:6; 1 Corinthians 6:12'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) CHILDREN ARE THE LORD',   // "LORD'S HERITAGE" — apostrophe-free anchor
      '2) THE MILLSTONE WARNING',
      '3) GUARD THE EYE AND THE HEART',
      '4) REFUSE THE TYRANNY OF LIKES',
      '5) PARENTS TEACH DILIGENTLY',
      '6) MASTERED BY NOTHING',
      '7) SET THE TREASURE AND THE REST',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the news two tiers honest (DR-0100) and stays non-partisan', () => {
    expect(l).toContain('DR-0100');
    // Tier 1 — the real event named plainly
    expect(l).toContain('August 26, 2026');
    expect(l).toContain('two-hour');
    // Tier 2 — the contested edges held, not asserted
    expect(l).toContain('denies');
    expect(l).toMatch(/16\.7 billion|16\.7B/);
    expect(l).toContain('contested');
    expect(l).toContain('non-partisan');
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
  it('child, teen, and senior each carry the trust-and-guard threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries children-as-heritage`).toContain('an heritage of the LORD');
      expect(t, `${band} carries guard the gate`).toMatch(/set no wicked thing before mine eyes|Keep thy heart|guard/i);
    }
    // teen and senior additionally carry the mastered-by-nothing tier and the praise-of-men snare.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('All things are lawful unto me');
      expect(t).toContain('the praise of men more than the praise of God');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Psalms', 127, 3)).toBe('Lo, children are an heritage of the LORD: and the fruit of the womb is his reward.');
    expect(verse('Matthew', 18, 6)).toContain('it were better for him that a millstone were hanged about his neck');
    expect(verse('Proverbs', 4, 23)).toBe('Keep thy heart with all diligence; for out of it are the issues of life.');
    expect(verse('Matthew', 6, 22)).toContain('The light of the body is the eye');
    expect(verse('John', 12, 43)).toBe('For they loved the praise of men more than the praise of God.');
    expect(verse('Romans', 12, 2)).toContain('be not conformed to this world: but be ye transformed by the renewing of your mind');
    expect(verse('Deuteronomy', 6, 7)).toContain('And thou shalt teach them diligently unto thy children');
    expect(verse('Ephesians', 6, 4)).toContain('bring them up in the nurture and admonition of the Lord');
    expect(verse('1Corinthians', 6, 12)).toBe('All things are lawful unto me, but all things are not expedient: all things are lawful for me, but I will not be brought under the power of any.');
    expect(verse('Proverbs', 25, 28)).toBe('He that hath no rule over his own spirit is like a city that is broken down, and without walls.');
    expect(verse('Psalms', 127, 2)).toContain('for so he giveth his beloved sleep');
    expect(verse('Matthew', 11, 28)).toBe('Come unto me, all ye that labour and are heavy laden, and I will give you rest.');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L101 the same day. This lesson's quotations
// arrived CLEAN — the first in the pass to do so with no in-quote alteration
// at all, after nine found in the lessons above it. What it produced instead
// is a THIRD category of quoted span, which the two allowlists built so far
// do not describe.
//
// The categories, now that all three exist:
//   1. QUOTED SCRIPTURE — must be verbatim KJV. The default; everything below
//      is an exception that has to earn its place.
//   2. A QUOTED SPEAKER — Darrell's own words (L103, L101). Real quotations of
//      a real person, correct as marks, and deleting them would erase the
//      attribution (DR-0331).
//   3. OUR OWN QUOTED TERMS AND REPORTED REFLEXES — this lesson. `"parental
//      controls"` names an industry term we are re-framing; `"likes"` names a
//      product feature; and the inApp block quotes the two reflexes a news
//      story like this provokes — `"the platforms are the enemy"` and
//      `"everyone's on it, what can you do"` — in order to TEST both against
//      the Word rather than endorse either. That is ordinary English: a term
//      held at arm's length, and reported speech.
//
// What keeps category 3 from becoming a hole is where it may NOT appear: not
// beside a verse reference, and not reading as Scripture. That is the L108
// line — there, a phrase of OUR OWN wore quotation marks next to verse
// references and had them removed. None of the four below sits anywhere near
// a reference, which is why they are correct as they stand.
//
// And the honesty assertion below EARNED ITS KEEP while this gate was being
// written. My draft allowlist also carried `"some say"` (from a senior-band
// sentence about softening documented harm into a hedge) — and `some say` IS
// in the KJV. An allowlist entry that is real Scripture would excuse a real
// quotation from the gate, so the sentence was rewritten to drop the marks
// rather than the assertion being relaxed. Two of my own rhetorical questions
// in the senior draft were unquoted for the same reason, before the apply.
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

const OUR_OWN_QUOTED = [
  'likes',                                   // the product feature, named
  'parental controls',                       // the industry term, re-framed
  'the platforms are the enemy',             // reflex one, quoted to be TESTED
  "everyone's on it, what can you do",       // reflex two, quoted to be TESTED
];

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(100);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;   // a term or a reflex, not a verse
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('a verse quotation can never hide behind the allowlist', () => {
    // Every entry must be OURS, which means none may be Scripture. This is
    // the assertion that caught `some say` in the draft allowlist.
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('is PROVEN-TO-CATCH — on the two drift classes this pass has actually found', () => {
    // The apostrophe class (eight found in the lessons above this one):
    expect(KJV_FLOW.includes('Judah is a lion’s whelp')).toBe(true);
    expect(KJV_FLOW.includes("Judah is a lion's whelp")).toBe(false);
    // The borrowed-full-stop class (found in L101, one lesson below):
    expect(KJV_FLOW.includes('For I am the LORD, I change not;')).toBe(true);
    expect(KJV_FLOW.includes('For I am the LORD, I change not.')).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('children are an heritage of the LORD')).toBe(true);
    expect(KJV_FLOW.includes('children are a heritage of the LORD')).toBe(false);
    expect(KJV_FLOW.includes('but I will not be brought under the power of any')).toBe(true);
    expect(KJV_FLOW.includes('but I will not be brought under the power of sin')).toBe(false);
    expect(KJV_FLOW.includes('is like a city that is broken down, and without walls')).toBe(true);
    expect(KJV_FLOW.includes('is like a city that is broken down and without walls')).toBe(false);
    expect(KJV_FLOW.includes('Train up a child in the way he should go')).toBe(true);
    expect(KJV_FLOW.includes('Train up a child in the way she should go')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(3);
  });

  it('and the covenant name is NEVER pushed INTO the quotation', () => {
    // The L104 pairing, asserted in both directions. Our prose must carry no
    // generic name AND John 12:43 must still read exactly as the corpus has
    // it. Two of our own PARAPHRASES of that verse carried the generic name
    // (facilitator howToRun and a discussion prompt: "one act done for the
    // praise of God, not men" / "than the praise of God?"); a paraphrase in
    // our voice is our voice, so both now say Yahweh. The QUOTED verse is
    // untouched, and a well-meant sweep that "fixed" the quotation too would
    // corrupt the Word in the opposite direction from the one DR-0210 guards
    // — the bright line in DR-0076. It fails here.
    expect(l, 'John 12:43 must still read as the corpus has it')
      .toContain('they loved the praise of men more than the praise of God.');
    expect(l, 'the covenant name was pushed into the quotation')
      .not.toContain('the praise of men more than the praise of Yahweh');
    expect(KJV_FLOW.includes('they loved the praise of men more than the praise of God')).toBe(true);
    expect(KJV_FLOW.includes('they loved the praise of men more than the praise of Yahweh')).toBe(false);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(3000);
    }
  });

  it('every band carries all seven movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries children as heritage`).toContain('children are an heritage of the LORD');
      expect(t, `${band} carries the millstone`).toContain('a millstone were hanged about his neck');
      expect(t, `${band} carries the pre-commitment`).toContain('I will set no wicked thing before mine eyes');
      expect(t, `${band} carries keeping the heart`).toContain('Keep thy heart with all diligence');
      expect(t, `${band} carries the eye as lamp`).toContain('The light of the body is the eye');
      expect(t, `${band} carries the praise of men`).toContain('they loved the praise of men more than the praise of God');
      expect(t, `${band} carries the renewed mind`).toContain('renewing of your mind');
      expect(t, `${band} carries teach-diligently`).toContain('thou shalt teach them diligently unto thy children');
      expect(t, `${band} carries train-up-a-child`).toContain('Train up a child in the way he should go');
      expect(t, `${band} carries mastered-by-nothing`).toContain('I will not be brought under the power of any');
      expect(t, `${band} carries the city without walls`).toContain('a city that is broken down, and without walls');
      expect(t, `${band} carries the treasure`).toContain('where your treasure is, there will your heart be also');
      expect(t, `${band} carries the gift of sleep`).toContain('so he giveth his beloved sleep');
      expect(t, `${band} carries the rest that is a Person`).toContain('Come unto me, all ye that labour and are heavy laden');
    }
  });

  it('every band holds BOTH TIERS of the occasion honestly (DR-0100)', () => {
    // The two-tier split is the whole reason this lesson can touch a live news
    // story at all, and dropping either half is a failure of truth in a
    // different direction. Soften the documented harm and the reader is misled
    // about something real (DR-0100 under-claiming); assert the disputed
    // figure and the reader is misled about something unproven (over-claiming).
    // So one check holds both — a band gets neither tier for free.
    //
    // Worth recording: the senior band USED to fail the second half. It
    // asserted "reported at up to roughly $17 billion, with outlets ranging
    // about $16.7B to $18B" while the adult body deliberately refused to name
    // a figure. A single lesson disagreeing with itself about what is settled
    // is exactly what this check now prevents.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      // Tier one, stated plainly: the guards and the developing-brain harm.
      expect(t, `${band} lost the documented guards`).toMatch(/two-hour|two hour/i);
      expect(t, `${band} lost the nighttime block`).toMatch(/night/i);
      expect(t, `${band} lost the documented harm to a developing mind`)
        .toMatch(/developing|growing brain|popularity/i);
      // Tier two, flagged not asserted: the denial and the contested figure.
      expect(t, `${band} lost the company's denial`).toMatch(/denies|not true/i);
      expect(t, `${band} lost that the figure is contested`)
        .toMatch(/contested|varies|different news stories|not sure of|cannot stand behind/i);
      // And no band may name a dollar figure the body holds as contested.
      expect(t, `${band} asserted a dollar figure the lesson holds as contested`)
        .not.toMatch(/\$\s?\d|\d+(\.\d+)?\s?(billion|B\b)/i);
    }
  });

  it('every band keeps the UNCOMFORTABLE half of the millstone warning', () => {
    // The warning is easy to aim outward at a corporation, and a band that
    // did only that would leave a lesson about other people — the most
    // comfortable kind and the least useful. It also lands on what WE
    // carelessly set in front of them.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} aimed the millstone only outward`)
        .toMatch(/careless/i);
    }
  });

  it('every band keeps the line Paul actually draws in 1 Corinthians 6:12', () => {
    // Lawful and still taking power: the line is at the POWER, not at the
    // lawfulness. A band that quoted the verse without that reading would
    // leave the reader asking the wrong question of a feed.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the lawful-yet-still-takes-power reading`)
        .toMatch(/perfectly okay to do and STILL|entirely lawful and still|entirely lawful and STILL|lawful and STILL take/i);
      expect(level(band), `${band} lost that the outward walls do not travel`)
        .toMatch(/travels with|goes with you everywhere/i);
    }
  });

  it('every band says a feed is a gate, whether or not anyone calls it one', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the gate`).toMatch(/is a gate/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // TWELFTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this as a Word-first,
    // non-partisan response to a real event (pairs with the Sovereign A.I.
    // course and L99, a sound mind not fear)" and closed on "CLOSE:".
    const senior = level('senior');
    expect(senior).not.toContain('Teach this as a Word-first');
    expect(senior).not.toMatch(/\bL(99|10[0-9])\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toContain('CLOSE:');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

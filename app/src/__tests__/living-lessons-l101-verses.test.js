// =============================================================================
// L101 — The Real Champion: action not theory, die once live forever, and the
// solid mind of Christ. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken testimony 2026-08-29 ("Lesson.") — a spoken
// teaching is build input (DR-0089). Yahweh sets life and death before us and we
// choose life; Jesus did it in ACTION not theory (laid His life down and took it
// up by His own power); His Crown/Nature was never truly at risk yet the
// obedience was fully real; die once, live forever; not Superman — the real
// Champion upholds all things and is solid, the same for ever; think like the
// Father, the sound Christlike mind. His 3rd/4th-dimensional frame is HIS
// testimony's language laid alongside the Word, never substituted for it
// (DR-0098). Every KJV line FETCHED from the repo's own KJV this session; a drift
// fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll101-the-real-champion-action-not-theory-die-once-live-forever-and-the-mind-of-christ'");
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
  // choose life
  'therefore choose life, that both thou and thy seed may live',
  'I have set before thee this day life and good, and death and evil',
  // action not theory
  'because I lay down my life, that I might take it again',
  'No man taketh it from me, but I lay it down of myself. I have power to lay it down, and I have power to take it again',
  'Greater love hath no man than this, that a man lay down his life for his friends',
  'Who, being in the form of God, thought it not robbery to be equal with God',
  'But made himself of no reputation, and took upon him the form of a servant',
  'he humbled himself, and became obedient unto death, even the death of the cross',
  // crown secure, obedience real
  'For I am the LORD, I change not',
  'Wherefore God also hath highly exalted him, and given him a name which is above every name',
  'That at the name of Jesus every knee should bow',
  'KING OF KINGS, AND LORD OF LORDS',
  'who for the joy that was set before him endured the cross',
  // die once, live forever
  'And as it is appointed unto men once to die, but after this the judgment',
  'Christ being raised from the dead dieth no more; death hath no more dominion over him',
  'I am he that liveth, and was dead; and, behold, I am alive for evermore',
  // not Superman — He holds all things
  'For by him were all things created, that are in heaven, and that are in earth',
  'And he is before all things, and by him all things consist',
  // solid, unchanging
  'Jesus Christ the same yesterday, and to day, and for ever',
  // think like the Father
  'Let this mind be in you, which was also in Christ Jesus',
  'But we have the mind of Christ',
  'but of power, and of love, and of a sound mind',
  'Set your affection on things above, not on things on the earth',
];

describe('L101 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Deuteronomy 30:19; John 10:18; Hebrews 13:8'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) YAHWEH SETS LIFE AND DEATH BEFORE US',
      '2) JESUS DID IT IN ACTION, NOT THEORY',
      '3) HIS CROWN WAS NEVER TRULY AT RISK',
      '4) DIE ONCE, LIVE FOREVER',
      '5) NOT SUPERMAN',
      '6) HE IS SOLID',
      '7) THINK LIKE THE FATHER',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the doctrine reverently (DR-0098) and honors the testimony provenance (DR-0089)', () => {
    expect(l).toContain('DR-0098');
    expect(l).toContain('spoken testimony');
    // the careful line kept, not collapsed: deity secure AND obedience real
    expect(l).toContain('Deity secure');
    expect(l).toContain('obedience real');
    // his own framing acknowledged as testimony language
    expect(l).toContain('3rd/4th-dimensional');
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
  it('child, teen, and senior each carry the real-Champion and action-not-theory threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries alive for evermore`).toContain('alive for evermore');
      expect(t, `${band} carries laid it down / power`).toMatch(/lay it down|lay down his life|laid it down|took it up|take it again/i);
    }
    // teen and senior additionally carry the immutable-Nature line and the sound mind.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('For I am the LORD, I change not');
      expect(t).toContain('sound mind');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Deuteronomy', 30, 19)).toContain('therefore choose life, that both thou and thy seed may live');
    expect(verse('John', 10, 18)).toBe('No man taketh it from me, but I lay it down of myself. I have power to lay it down, and I have power to take it again. This commandment have I received of my Father.');
    expect(verse('John', 15, 13)).toBe('Greater love hath no man than this, that a man lay down his life for his friends.');
    expect(verse('Philippians', 2, 8)).toBe('And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.');
    expect(verse('Philippians', 2, 5)).toBe('Let this mind be in you, which was also in Christ Jesus:');
    expect(verse('Malachi', 3, 6)).toContain('For I am the LORD, I change not');
    expect(verse('Revelation', 1, 18)).toContain('I am he that liveth, and was dead; and, behold, I am alive for evermore');
    expect(verse('Revelation', 19, 16)).toContain('KING OF KINGS, AND LORD OF LORDS');
    expect(verse('Romans', 6, 9)).toBe('Knowing that Christ being raised from the dead dieth no more; death hath no more dominion over him.');
    expect(verse('Colossians', 1, 17)).toBe('And he is before all things, and by him all things consist.');
    expect(verse('Hebrews', 13, 8)).toBe('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(verse('1Corinthians', 2, 16)).toContain('But we have the mind of Christ');
    expect(verse('2Timothy', 1, 7)).toBe('For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L102 the same day, and this lesson produced a
// NEW subclass of in-quote alteration. The eight found before it were every
// one an ASCII apostrophe standing where the KJV carries U+2019. This one is
// punctuation inside the quotation: the body quoted Malachi 3:6 as
// `"For I am the LORD, I change not."` — a full stop where the verse carries a
// semicolon and keeps going ("...therefore ye sons of Jacob are not
// consumed."). A period closes a sentence the Word did not close there, which
// is a small edit with a real effect: it presents a clause as the whole verse.
// The lesson quotes the same verse correctly twenty lines earlier with no
// terminal punctuation at all, which is the form both now use.
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

// DARRELL'S OWN WORDS ARE QUOTED HERE, AND THEY STAY QUOTED.
// ---------------------------------------------------------------------------
// This lesson IS his spoken testimony of 2026-08-29, so his phrases are
// quoted throughout — and one of them carries the lesson: "He is a G", which
// from his neighbourhood means SOLID, a soldier who will die for what is
// right by the Word. That is why the sixth movement is about immutability
// rather than about toughness: he had already made the connection, and the
// lesson follows his word to Hebrews 13:8 rather than the other way round.
// It is named here so the span gate can tell a quoted SPEAKER from a quoted
// VERSE rather than being loosened for both (DR-0331; the L103 and L111
// pattern, the opposite of L108's).
const DARRELL_QUOTED = ['He is a G'];

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
        if (DARRELL_QUOTED.includes(part)) continue;   // a quoted speaker, not a quoted verse
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — starting with the punctuation this lesson actually shipped', () => {
    // The exact drift found in this module and restored in this commit: a full
    // stop closing a clause the verse continues with a semicolon.
    expect(KJV_FLOW.includes('For I am the LORD, I change not;')).toBe(true);
    expect(KJV_FLOW.includes('For I am the LORD, I change not.')).toBe(false);
    // The apostrophe class, eight of which this pass has found in other lessons:
    expect(KJV_FLOW.includes('Judah is a lion’s whelp')).toBe(true);
    expect(KJV_FLOW.includes("Judah is a lion's whelp")).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('No man taketh it from me, but I lay it down of myself')).toBe(true);
    expect(KJV_FLOW.includes('No man taketh it from me, for I lay it down of myself')).toBe(false);
    expect(KJV_FLOW.includes('and by him all things consist')).toBe(true);
    expect(KJV_FLOW.includes('and by him all things are held')).toBe(false);
    expect(KJV_FLOW.includes('death hath no more dominion over him')).toBe(true);
    expect(KJV_FLOW.includes('death hath no dominion over him')).toBe(false);
    expect(KJV_FLOW.includes('have the keys of hell and of death')).toBe(true);
    expect(KJV_FLOW.includes('have the keys of death and of hell')).toBe(false);
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

  it('keeps the adversary lowercase in our voice', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect(ours).not.toMatch(/\b(Satan|Lucifer|Devil|Dragon|Accuser|Deceiver|Baal)\b/);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(2000);
    }
  });

  it('every band carries all seven movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries choose life`).toContain('therefore choose life');
      expect(t, `${band} carries the laying down`).toContain('No man taketh it from me, but I lay it down of myself');
      expect(t, `${band} carries greater love`).toContain('Greater love hath no man than this');
      expect(t, `${band} carries the death of the cross`).toContain('became obedient unto death, even the death of the cross');
      expect(t, `${band} carries the immutable Nature`).toContain('For I am the LORD, I change not');
      expect(t, `${band} carries the exaltation`).toContain('given him a name which is above every name');
      expect(t, `${band} carries the crown`).toContain('KING OF KINGS, AND LORD OF LORDS');
      expect(t, `${band} carries death's end`).toContain('death hath no more dominion over him');
      expect(t, `${band} carries the keys`).toContain('have the keys of hell and of death');
      expect(t, `${band} carries the Sustainer`).toContain('by him all things consist');
      expect(t, `${band} carries the same for ever`).toContain('the same yesterday, and to day, and for ever');
      expect(t, `${band} carries the mind of Christ`).toContain('Let this mind be in you');
      expect(t, `${band} carries the sound mind`).toContain('of power, and of love, and of a sound mind');
      expect(t, `${band} carries things above`).toContain('Set your affection on things above');
    }
  });

  it('every band keeps BOTH halves of the hard doctrine, uncollapsed', () => {
    // The careful line Darrell drew, and the one a compressed band drops: the
    // Crown was never truly at risk AND the obedience was fully real. Collapse
    // the first and the cross becomes a tragedy that might have gone the other
    // way; collapse the second and it becomes theatre. Every band must hold
    // both, which is why the immutability verse and the cross verse are BOTH
    // required above and the explicit both-halves sentence is required here.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} collapsed the paradox`)
        .toMatch(/[Bb]oth are true|Both halves|keep BOTH|Both things are true|both halves kept|obedience was fully real|it still really happened/);
    }
  });

  it('every band keeps the not-Superman displacement and WHY it lands', () => {
    // A fictional hero is a wish someone wrote down; the real One upholds even
    // the person imagining the cartoon. The reason is the point — without it
    // the movement is just a scolding about comics.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the cartoon displacement`)
        .toMatch(/cartoon/i);
      expect(level(band), `${band} lost why it lands`)
        .toMatch(/wish (someone|somebody) wrote down|wish written on paper|person (imagining|who drew) the cartoon/i);
    }
  });

  it('every band says what SOLID means, rather than only asserting it', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the definition of solid`)
        .toMatch(/full weight|never changes/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It WAS the notes, opening "Teach this as worship-grade doctrine drawn
    // from a member's testimony (Darrell, 2026-08-29), pairing with
    // MIND-OF-CHRIST and the Godhead studies" and closing on "CLOSE:". That is
    // the ELEVENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. The build references belong in
    // `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach this as worship-grade doctrine');
    expect(senior).not.toContain('MIND-OF-CHRIST');
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toContain('CLOSE:');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

describe('his own words stay in the lesson, and stay attributed', () => {
  it('the phrase that carries the lesson is present and attributed', () => {
    const text = l.replace(/\\'/g, "'");
    expect(text).toContain('He is a G');
    expect(text, 'the phrase must be attributed, not floated').toMatch(/Darrell/);
    // And it must reach the reader in every band, because the sixth movement
    // is built on it.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const i = l.indexOf(`${band}: '`);
      expect(l.slice(i, l.indexOf("',\n", i)), `${band} lost his phrase`).toContain('He is a G');
    }
  });

  it('a verse quotation can never hide behind that allowlist', () => {
    for (const q of DARRELL_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });
});

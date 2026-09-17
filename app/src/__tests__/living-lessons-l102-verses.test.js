// =============================================================================
// L102 — Bold as a Lion: righteousness kept by integrity, His good will
// live-or-die, a Word-trained mind, suffering to reign, loving enemies, and
// discerning the destroyer. Verbatim KJV.
// =============================================================================
// Captured from Darrell's sustained spoken teaching 2026-08-29 (he brought
// Proverbs 28:1 and poured the roots in live) — a spoken teaching is build input
// (DR-0089). Boldness from a clear conscience KEPT by integrity (confess, truth,
// grow from failure — "perfect" = maturing, not flawless); the account settled and
// live-or-die surrendered to a GOOD will; the mind trained on His Word; grief held
// with hope (suffer with Him to reign with Him); love even enemies, the Blood
// makes the family; yet discern the destroyer who only steals, kills, destroys.
// Every KJV line FETCHED from the repo's own KJV this session; a drift fails the
// build. Pairs with L101, L99, the Test (Philippians 4:8), and DR-0076.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear'");
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
  'The wicked flee when no man pursueth',                                  // Prov 28:1
  'whoso confesseth and forsaketh them shall have mercy',                  // Prov 28:13
  'If we confess our sins, he is faithful and just to forgive us',         // 1 John 1:9
  'they that deal truly are his delight',                                  // Prov 12:22
  'For a just man falleth seven times, and riseth up again',               // Prov 24:16
  'Not as though I had already attained, either were already perfect',     // Phil 3:12
  'to be sin for us, who knew no sin',                                     // 2 Cor 5:21
  'the Lion of the tribe of Juda, the Root of David, hath prevailed',      // Rev 5:5
  'whether we live therefore, or die, we are the Lord',                    // Rom 14:8
  'all things work together for good to them that love God',               // Rom 8:28
  'But if not, be it known unto thee, O king',                            // Dan 3:18
  'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind', // 2 Tim 1:7
  'Looking unto Jesus the author and finisher of our faith',              // Heb 12:2
  'if there be any virtue, and if there be any praise, think on these things', // Phil 4:8
  'Jesus wept',                                                            // John 11:35
  'If we suffer, we shall also reign with him',                            // 2 Tim 2:12
  'It is finished',                                                        // John 19:30
  'Love your enemies, bless them that curse you',                          // Matt 5:44
  'while we were yet sinners, Christ died for us',                         // Rom 5:8
  'are made nigh by the blood of Christ',                                  // Eph 2:13
  'he maketh even his enemies to be at peace with him',                    // Prov 16:7
  'The thief cometh not, but for to steal, and to kill, and to destroy',   // John 10:10
  'wise as serpents, and harmless as doves',                              // Matt 10:16
  'we are not ignorant of his devices',                                   // 2 Cor 2:11
  'your adversary the devil, as a roaring lion',                          // 1 Pet 5:8
  'with all boldness they may speak thy word',                            // Acts 4:29
  'come boldly unto the throne of grace',                                 // Heb 4:16
];

describe('L102 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 28:1; Proverbs 28:13; Romans 14:8'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — twelve movements + THE WHOLE OF IT', () => {
    const order = [
      '1) GUILT FLEES, RIGHTEOUSNESS STANDS',
      '2) NOT BRAVADO',
      '3) THE RIGHTEOUSNESS IS IMPUTED',
      '4) THE LION OF JUDAH IS THE SOURCE',
      '5) LIVING OR DYING IS HIS WILL',
      '6) FEAR NOT',
      '7) HE LEADS AND GUIDES',
      '8) ABIDE',
      '9) SUFFER WITH HIM TO REIGN WITH HIM',
      '10) LOVE EVEN ENEMIES',
      '11) DISCERN THE DESTROYER',
      '12) BOLDNESS IN ACTION',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the distinctive teaching threads Darrell brought', () => {
    expect(l).toContain('Darrell brought');   // spoken-teaching provenance (DR-0089)
    expect(l).toContain('Blood In Blood Out');
    expect(l).toContain('perfect');   // "perfect" = maturing, not flawless
    expect(l).toContain('discern the destroyer');
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
  it('child, teen, and senior each carry the bold-as-a-lion and confess-your-faults threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries bold as a lion`).toContain('bold as a lion');
      expect(t, `${band} carries confess/forsake`).toContain('whoso confesseth and forsaketh them shall have mercy');
    }
    // teen and senior additionally carry the discern-the-destroyer tier and love-enemies.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('to steal, and to kill, and to destroy');
      expect(t).toContain('Love your enemies');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 28, 1)).toBe('The wicked flee when no man pursueth: but the righteous are bold as a lion.');
    expect(verse('Proverbs', 28, 13)).toBe('He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.');
    expect(verse('Proverbs', 24, 16)).toContain('For a just man falleth seven times, and riseth up again');
    expect(verse('Romans', 14, 8)).toContain('whether we live therefore, or die, we are the Lord');
    expect(verse('John', 11, 35)).toBe('Jesus wept.');
    expect(verse('2Timothy', 2, 12)).toContain('If we suffer, we shall also reign with him');
    expect(verse('Matthew', 5, 44)).toContain('Love your enemies, bless them that curse you');
    expect(verse('Ephesians', 2, 13)).toBe('But now in Christ Jesus ye who sometimes were far off are made nigh by the blood of Christ.');
    expect(verse('John', 10, 10)).toContain('The thief cometh not, but for to steal, and to kill, and to destroy');
    expect(verse('Matthew', 10, 16)).toContain('wise as serpents, and harmless as doves');
    expect(verse('1Peter', 5, 8)).toContain('your adversary the devil, as a roaring lion');
    expect(verse('Proverbs', 16, 7)).toContain('he maketh even his enemies to be at peace with him');
    expect(verse('Hebrews', 4, 16)).toBe('Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.');
  });
});

// =============================================================================
// THE CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L103 the same day. This lesson's module
// arrived with THREE altered quotations — Genesis 49:9 (`lion's whelp`),
// Romans 14:8 (`we are the Lord's.`) and Proverbs 16:7 (`When a man's ways`)
// each carrying an ASCII apostrophe where the KJV carries U+2019 — all three
// in the adult body, all three restored in the same commit that added this
// gate. Five lessons in this pass have now shipped with that class of drift;
// the gate below is what makes it impossible to ship a sixth here.
//
// A METHOD CORRECTION WORTH RECORDING. The pre-apply auditor I ran on the raw
// SOURCE SLICE reported 18 non-verbatim spans for this lesson; auditing the
// PARSED module field-by-field reported 3. The slice version is wrong in a
// specific way: quote pairing is sequential, so a field boundary (or a `\'`
// escape) shifts the odd/even alignment and every subsequent "span" is an
// arbitrary cut of unquoted prose — 15 phantom findings. The parsed,
// per-field audit has no alignment to lose. It is also what the checker in
// THIS file does, because `l` is one contiguous slice and the allowlist below
// names the real speaker quotations rather than papering over phantoms.
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
// `bigIdea` carries his spoken teaching of 2026-08-29 as one attributed run
// ("Darrell brought the word (2026-08-29) and its roots, live: ..."), and one
// quiz question quotes two of his phrases back to the reader. Those are real
// quotations of a real person — the source this lesson was built from — so
// the marks are correct and removing them would erase the attribution
// (DR-0331: his words are rendered for meaning, and quoted). They are named
// one by one so the span gate can tell a quoted SPEAKER from a quoted VERSE
// rather than being loosened for both. Note the first entry especially: it is
// HIS rendering of Proverbs 28:1, and the verbatim verse stands beside it in
// the same field, introduced "Word first, verbatim:" — his paraphrase is his
// voice, and the Word is quoted exactly. This is the L103 and L111 pattern,
// and the opposite of L108's, where a phrase of OUR OWN wore quotation marks
// beside verse references and had them removed.
const DARRELL_QUOTED = [
  'the righteous are as bold as a lion',
  'bold because if we live or die it was His will',
  'His Will is Good no matter what',
  'He leads and guides, author and finisher',
  'abide, the subconscious come from His Word, think on these things',
  'we love Him because He first loved us',
  'cry with Him when you need to, just stay Word solid',
  'love even the enemies - they switch sides and are better family than family, Blood In Blood Out',
  "it's amazing how much Yahweh can do with enemies",
  'however other enemies only come to steal kill and destroy, Yahweh documented these ways',
  "keep perfect integrity by admitting faults, truth gets outcomes faster, lies corrupt everything, don't practice undermining ways",
  'perfect with learning from failure and changing strategies to improve.',
  'Blood In Blood Out,',
  'perfect integrity',
  'perfect with learning from failure.',
];

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(200);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (DARRELL_QUOTED.includes(part)) continue;   // a quoted speaker, not a quoted verse
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — starting with the three apostrophes this lesson actually shipped', () => {
    // The exact drift found in this module and restored in this commit. The
    // wrong form reads perfectly and is invisible at a glance, which is the
    // whole reason a machine holds this line and not an eye.
    expect(KJV_FLOW.includes('Judah is a lion’s whelp')).toBe(true);
    expect(KJV_FLOW.includes("Judah is a lion's whelp")).toBe(false);
    expect(KJV_FLOW.includes('or die, we are the Lord’s.')).toBe(true);
    expect(KJV_FLOW.includes("or die, we are the Lord's.")).toBe(false);
    expect(KJV_FLOW.includes('When a man’s ways please the LORD')).toBe(true);
    expect(KJV_FLOW.includes("When a man's ways please the LORD")).toBe(false);
    // And Matthew 7:15, restored in this same pass one lesson earlier:
    expect(KJV_FLOW.includes('come to you in sheep’s clothing')).toBe(true);
    expect(KJV_FLOW.includes("come to you in sheep's clothing")).toBe(false);
    // Drifts of this lesson's own hinges, each reading perfectly:
    expect(KJV_FLOW.includes('the righteous are bold as a lion')).toBe(true);
    expect(KJV_FLOW.includes('the righteous are as bold as a lion')).toBe(false);
    expect(KJV_FLOW.includes('whoso confesseth and forsaketh them shall have mercy')).toBe(true);
    expect(KJV_FLOW.includes('whoso confesseth and forsaketh them shall find mercy')).toBe(false);
    expect(KJV_FLOW.includes('For a just man falleth seven times, and riseth up again')).toBe(true);
    expect(KJV_FLOW.includes('For a just man falleth seven times, and rises up again')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(5);
  });

  it('keeps the adversary lowercase in our voice, and never sentence-initial', () => {
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(2200);
    }
  });

  it('every band carries all twelve movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the anchor`).toContain('the righteous are bold as a lion');
      expect(t, `${band} carries confess-not-cover`).toContain('whoso confesseth and forsaketh them shall have mercy');
      expect(t, `${band} carries truth-over-lies`).toContain('Lying lips are abomination to the LORD');
      expect(t, `${band} carries perfect-means-maturing`).toContain('For a just man falleth seven times, and riseth up again');
      expect(t, `${band} carries the imputed righteousness`).toContain('made the righteousness of God in him');
      expect(t, `${band} carries the Lion of Judah`).toContain('the Lion of the tribe of Juda');
      expect(t, `${band} carries live-or-die`).toContain('we are the Lord’s.');
      expect(t, `${band} carries the good will`).toContain('all things work together for good');
      expect(t, `${band} carries He-loved-us-first`).toContain('We love him, because he first loved us');
      expect(t, `${band} carries fear not`).toContain('hath not given us the spirit of fear');
      expect(t, `${band} carries the Author and Finisher`).toContain('the author and finisher of our faith');
      expect(t, `${band} carries the Word-trained mind`).toContain('think on these things');
      expect(t, `${band} carries abide`).toContain('If ye abide in me, and my words abide in you');
      expect(t, `${band} carries Jesus wept`).toContain('Jesus wept.');
      expect(t, `${band} carries the hope under grief`).toContain('wipe away all tears from their eyes');
      expect(t, `${band} carries love-your-enemies`).toContain('Love your enemies');
      expect(t, `${band} carries the Blood making family`).toContain('made nigh by the blood of Christ');
      expect(t, `${band} carries HE reconciles`).toContain('he maketh even his enemies to be at peace with him');
      expect(t, `${band} carries the destroyer`).toContain('to steal, and to kill, and to destroy');
      expect(t, `${band} carries both halves`).toContain('wise as serpents, and harmless as doves');
      expect(t, `${band} carries the fruit test`).toContain('Ye shall know them by their fruits');
      expect(t, `${band} carries boldness-for-witness`).toContain('with all boldness they may speak thy word');
    }
  });

  it('every band keeps the diagnosis, not only the exhortation', () => {
    // The first clause of Proverbs 28:1 is the hinge of this lesson: nobody is
    // chasing, and he runs anyway. A band that carried only "be bold" would
    // have dropped the reason boldness is available at all.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the guilt-manufactures-pursuers diagnosis`)
        .toMatch(/manufactures its own pursuers|makes up its own chasers|invents its own pursuers|Guilt makes up its own chasers/i);
      expect(level(band), `${band} lost that the standing is not nerve`)
        .toMatch(/not nerve|not a personality trait|not showing off|settled account/i);
    }
  });

  it('every band keeps the not-naive half beside the love-enemies half', () => {
    // Loving enemies without discernment is the failure this lesson names
    // outright: a doormat on one side, a cynic on the other.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the counterfeit-lion or the both-halves warning`)
        .toMatch(/doormat|roaring lion|Watch what a person DOES/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It WAS the notes, opening "Teach as boldness rightly sourced - sequel to
    // L101, mate to L99 and the Test (Philippians 4:8), and a Scripture-voiced
    // echo of DR-0076" and closing on "CLOSE:". A reader was being handed the
    // teacher's clipboard. The build references belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as boldness rightly sourced');
    expect(senior).not.toMatch(/\bL(99|10[0-9])\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toContain('CLOSE:');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});

describe('his own words stay in the lesson, and stay attributed', () => {
  it('the capture line and every quoted phrase of his are present', () => {
    // Unescape first: an apostrophe inside a JS single-quoted string is stored
    // as \\' in the source, so "it's amazing" is only findable once the
    // escaping is undone — the same normalisation quotedSpans() does.
    const text = l.replace(/\\'/g, "'");
    expect(text).toContain('Darrell brought the word (2026-08-29)');
    for (const q of DARRELL_QUOTED) {
      expect(text, `Darrell's quoted words went missing: ${q}`).toContain(q);
    }
  });

  it('a verse quotation can never hide behind that allowlist', () => {
    // Every entry is his speech. None of them is Scripture, so none may appear
    // in the corpus — if one ever did, the allowlist would be excusing a real
    // quotation from the gate. The first entry is the live case: his rendering
    // of Proverbs 28:1 is NOT the verse, and the verse is quoted exactly
    // beside it.
    for (const q of DARRELL_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });
});

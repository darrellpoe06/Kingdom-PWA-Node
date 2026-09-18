// @vitest-environment node
// L80 + L81 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l68/l78 pins). Without
// these pins the lessons ride the suite green while quoting from memory —
// the vacuous-gate class this file exists to keep dead.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

function pinSuite(lessonId, label, PINS) {
  describe(label, () => {
    const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === lessonId);

    it('the lesson is published', () => {
      expect(lesson).toBeTruthy();
    });

    it('every pinned fragment is an exact substring of the cited KJV verse', () => {
      const failures = [];
      for (const [book, ch, vs, frag] of PINS) {
        if (!norm(kjv(book, ch, vs)).includes(norm(frag))) failures.push(`${book} ${ch}:${vs} — "${frag}"`);
      }
      expect(failures).toEqual([]);
    });

    it('every fragment actually appears in the lesson (no stale pin list)', () => {
      const blob = JSON.stringify(lesson).replace(/[’‘]/g, "'");
      const missing = PINS.filter(([, , , frag]) => !blob.includes(frag)).map(([b, c, v]) => `${b} ${c}:${v}`);
      expect(missing).toEqual([]);
    });
  });
}

pinSuite('ll80-the-four-warnings-of-a-hardening-heart', 'L80 — the four warnings of a hardening heart: verses verbatim', [
  ['Hebrews', 4, 12, 'a discerner of the thoughts and intents of the heart'],
  ['John', 12, 6, 'was a thief, and had the bag'],
  ['1Timothy', 6, 10, 'the love of money is the root of all evil'],
  ['1Timothy', 4, 2, 'having their conscience seared with a hot iron'],
  ['Ephesians', 4, 19, 'past feeling'],
  ['Matthew', 26, 50, 'Friend, wherefore art thou come?'],
  ['Matthew', 27, 3, 'repented himself'],
  ['Matthew', 27, 4, 'I have sinned'],
  ['2Corinthians', 7, 9, 'ye sorrowed to repentance: for ye were made sorry after a godly manner'],
  ['2Corinthians', 7, 10, 'the sorrow of the world worketh death'],
  ['Luke', 22, 62, 'wept bitterly'],
  ['John', 21, 17, 'Feed my sheep'],
  ['2Corinthians', 13, 5, 'Examine yourselves, whether ye be in the faith'],
  ['Hebrews', 3, 13, 'lest any of you be hardened through the deceitfulness of sin'],
  ['Proverbs', 4, 23, 'Keep thy heart with all diligence; for out of it are the issues of life'],
  ['1John', 1, 9, 'If we confess our sins, he is faithful and just to forgive us our sins'],
]);

pinSuite('ll81-tongues-weighed-word-first', 'L81 — tongues weighed Word-first: verses verbatim', [
  ['Acts', 2, 6, 'every man heard them speak in his own language'],
  ['Acts', 2, 8, 'in our own tongue, wherein we were born'],
  ['Acts', 2, 11, 'we do hear them speak in our tongues the wonderful works of God'],
  ['1Corinthians', 14, 19, 'five words with my understanding'],
  ['1Corinthians', 14, 23, 'will they not say that ye are mad'],
  ['1Corinthians', 14, 27, 'by two, or at the most by three, and that by course; and let one interpret'],
  ['1Corinthians', 14, 28, 'if there be no interpreter, let him keep silence in the church'],
  ['1Corinthians', 14, 33, 'God is not the author of confusion, but of peace'],
  ['1Corinthians', 14, 39, 'forbid not to speak with tongues'],
  ['1Corinthians', 14, 40, 'Let all things be done decently and in order'],
  ['1Corinthians', 12, 30, 'do all speak with tongues?'],
  ['1Corinthians', 13, 1, 'the tongues of men and of angels'],
  ['Romans', 8, 26, 'the Spirit itself maketh intercession for us with groanings which cannot be uttered'],
  ['Ephesians', 6, 18, 'Praying always with all prayer and supplication in the Spirit'],
  ['Jude', 1, 20, 'praying in the Holy Ghost'],
  ['Psalms', 62, 8, 'pour out your heart before him'],
]);

describe('PROVEN-TO-CATCH: a one-word tamper fails', () => {
  it('catches a tampered fragment', () => {
    expect(norm(kjv('2Corinthians', 7, 10)).includes('the sorrow of the world worketh life')).toBe(false);
    expect(norm(kjv('2Corinthians', 7, 10)).includes('the sorrow of the world worketh death')).toBe(true);
  });
});

// =============================================================================
// L81'S FOUR BANDS, AND AN ELISION THE RATCHET NEVER LOOKED AT (DR-0481)
// =============================================================================
// The pass reached L81 with child at 0.30 of the adult lesson against a 0.50
// floor, teen at 0.49 against 0.60, youth absent — and the child band reading at
// FK 8.28, OVER the 7.0 ceiling and ABOVE the teen band at 6.17. It was the
// first lesson in this pass carrying both defects at once. Senior read 13.84.
//
// THE FINDING THAT OUTLIVES THIS LESSON: a fifth elision was found in a QUIZ
// OPTION, a field the DR-0473 ratchet does not read. Its READER_FIELDS are
// lesson, bigIdea and inApp plus the bands, so an elision in a quiz answer, a
// benefit line, a story, or a facilitator talking point is invisible to it. The
// local installation of that finding is the check below: NO elision anywhere in
// this lesson's block, not merely in the fields the ratchet happens to scan.
//
// The five check-writing rules, all paid for, govern the claim checks: read OUR
// prose with quotations stripped (DR-0474); no branch may be a word the passage
// contains (DR-0476), a phrase our prose echoes out of the quotation beside it
// (DR-0478), or a title keyword (DR-0479); never two claims in one test
// (DR-0478); and a check must not narrow the Word's own options (DR-0480).
import { formatLessonText } from '../lib/lesson-format.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L81 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll81-tongues-weighed-word-first');
const L81_BANDS = ['child', 'youth', 'teen', 'senior'];
const L81_TEXTS = Object.fromEntries(L81_BANDS.map((b) => [b, String(L81.levels[b])]));
const L81_READER = {
  ...L81_TEXTS,
  lesson: String(L81.lesson),
  bigIdea: String(L81.bigIdea),
  inApp: String(L81.inApp),
};
const l81Ours = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('L81 — every band is the whole study, in that age’s words', () => {
  it('all four bands are present and none is short of its floor', () => {
    expect(shortBands(measureFullness(L81)), 'a band is missing or below its floor').toEqual([]);
  });

  it('reads in a rising ladder', () => {
    const ladder = L81_BANDS.map((b) => fleschKincaidGrade(ourProseOnly(L81_TEXTS[b])));
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i], `${L81_BANDS[i]} (${ladder[i].toFixed(2)}) reads below ${L81_BANDS[i - 1]} (${ladder[i - 1].toFixed(2)})`)
        .toBeGreaterThanOrEqual(ladder[i - 1]);
    }
  });

  it('keeps the child band under the ceiling it used to breach', () => {
    expect(fleschKincaidGrade(ourProseOnly(L81_TEXTS.child))).toBeLessThanOrEqual(CHILD_CEILING);
  });

  it('EVERY band renders all FIVE movements as numbered sections', () => {
    for (const b of L81_BANDS) {
      const { items, sectionCount } = formatLessonText(L81_TEXTS[b]);
      expect(sectionCount, `${b} does not render five movements`).toBe(5);
      expect(items.filter((i) => i.n).map((i) => i.n)).toEqual([1, 2, 3, 4, 5]);
      for (const i of items) {
        expect(i.text.length, `${b} has a chunk over the house wall limit`).toBeLessThanOrEqual(420);
      }
    }
  });

  it('names its own lesson in the opening of every band', () => {
    for (const b of L81_BANDS) {
      expect(namesItsLesson(L81.title, L81_TEXTS[b]), `${b} does not open by naming its lesson`).toBe(true);
    }
  });
});

describe('L81 — no elision ANYWHERE in the lesson, not just where the ratchet looks', () => {
  it('carries no ellipsis inside any quotation, in any reader-facing field', () => {
    for (const [k, v] of Object.entries(L81_READER)) {
      const elided = String(v).match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || [];
      expect(elided, `${k} elides His words: ${elided.join(' | ')}`).toEqual([]);
    }
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    // THE DR-0481 CHECK. The ratchet reads lesson, bigIdea, inApp and the bands.
    // L81's fifth elision was in quiz.questions[].options[] — a string a
    // LEARNER reads while answering — and it was therefore invisible to the
    // measure that reports this debt. This walks every string in the module, so
    // benefits, quiz questions, options, explanations, stories and facilitator
    // notes are all in scope here even while the corpus-wide ratchet catches up.
    const found = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
      }
    };
    walk(L81, '');
    expect(found, `elided quotations outside the reader fields:\n${found.join('\n')}`).toEqual([]);
  });

  it('gives 1 Corinthians 14:19 back the reason the five words matter', () => {
    // The elision cut "that by my voice I might teach others also" — which is
    // the stated PURPOSE of preferring five understood words, and therefore the
    // whole argument of the movement quoting it.
    const whole = 'Yet in the church I had rather speak five words with my understanding, that by my voice I might teach others also, than ten thousand words in an unknown tongue';
    for (const k of ['lesson', 'bigIdea', ...L81_BANDS]) {
      expect(L81_READER[k], `${k} still cuts the reason out of 14:19`).toContain(whole);
    }
  });

  it('quotes the three Pentecost witnesses SEPARATELY, each with its own reference', () => {
    // The quiz option had chained three DIFFERENT verses under one ellipsis, so
    // no longer span could ever have been contiguous. Three verses need three
    // quotations, which is what the answer was claiming all along.
    const block = JSON.stringify(L81);
    expect(block, 'the three witnesses are not separately referenced')
      .toContain('\\"in his own language\\" (Acts 2:6), \\"in our own tongue\\" (Acts 2:8) and \\"in our tongues\\" (Acts 2:11)');
  });

  it('recites no record id to a reader, in any band or field', () => {
    for (const [k, v] of Object.entries(L81_READER)) {
      expect(String(v).match(/DR-\d{4}/g) || [], `${k} recites a record id`).toEqual([]);
    }
  });
});

describe('L81 — the covenant name, in OUR voice only', () => {
  it('says Yahweh in each band’s own prose', () => {
    for (const b of L81_BANDS) expect(l81Ours(L81_TEXTS[b]), `${b} never names Yahweh in its own voice`).toMatch(/Yahweh/);
  });

  it('never uses the generic name in our own prose, in any reader field', () => {
    // The old child band used it six times in our own voice — "God's Holy
    // Spirit", "hear about God", "God built a bridge", "God is never
    // confusing", "God gives different gifts", "close to God".
    for (const [k, v] of Object.entries(L81_READER)) {
      expect(ourProseOnly(v).match(/\bGod\b/g) || [], `${k} uses the generic name in our own voice`).toEqual([]);
    }
  });

  it('leaves the generic name EXACTLY as the KJV wrote it, inside the quotations', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} altered 1 Corinthians 14:33`).toContain('For God is not the author of confusion, but of peace');
    }
  });

  it('never capitalises an adversary name anywhere in the lesson', () => {
    // ADDED after the break harness found this check MISSING from L81's suite
    // entirely. Appending "Satan is." to the child band left the gate green,
    // because I had written the paraphrase check in its place and never wrote
    // this one. A gate is only as complete as its list of properties, and the
    // harness is what proves the list is complete rather than plausible.
    for (const [k, v] of Object.entries(L81_READER)) {
      for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver']) {
        expect(String(v).includes(bad), `${k} capitalises ${bad}`).toBe(false);
      }
    }
  });

  it('carries no unmarked paraphrase where the old child band had one', () => {
    // The old child band rendered Acts 2:8 as "How can we each hear about God
    // in our OWN language?" with "(paraphrasing Acts 2:8)" attached. Marking a
    // paraphrase is honest, but the verse is short and plain enough to quote,
    // so the child now gets His actual words.
    expect(L81_TEXTS.child, 'the child band no longer quotes Acts 2:8 verbatim')
      .toContain('And how hear we every man in our own tongue, wherein we were born?');
    expect(L81_TEXTS.child, 'a paraphrase is standing in for the verse').not.toMatch(/paraphras/i);
  });
});

describe('L81 — FIRST MOVEMENT: the hearers do the defining', () => {
  it('every band carries all THREE of Luke’s definitions', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} drops Acts 2:6`).toContain('every man heard them speak in his own language');
      expect(L81_TEXTS[b], `${b} drops Acts 2:8`).toContain('how hear we every man in our own tongue, wherein we were born?');
      expect(L81_TEXTS[b], `${b} drops Acts 2:11`).toContain('we do hear them speak in our tongues the wonderful works of God');
    }
  });

  it('every band says the HEARERS are the ones defining it', () => {
    // That is the exegetical move of the movement. A band that quotes the three
    // verses without saying who is speaking has left the argument unmade.
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} does not credit the hearers`)
        .toMatch(/(HEARERS|LISTENERS|the crowd says)/);
    }
  });

  it('every band reads them as understood human languages aimed OUTWARD', () => {
    for (const b of L81_BANDS) {
      const o = l81Ours(L81_TEXTS[b]);
      expect(o, `${b} does not say they were real languages`)
        .toMatch(/(real languages|human languages)/i);
      expect(o, `${b} does not aim the gift outward`)
        .toMatch(/(OUTWARD|outward|had not heard yet|had not yet)/);
    }
  });
});

describe('L81 — SECOND MOVEMENT: Paul governed it rather than banning it', () => {
  it('every band says Paul did NOT ban it', () => {
    // The single most load-bearing sentence in the lesson, and the one a
    // shorter version most easily loses.
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} lets Paul ban the gift`)
        .toMatch(/(did NOT|did not ban|declined to do)/);
    }
  });

  it('every band carries the governing rules and the silence fallback', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} drops 14:27`).toContain('let it be by two, or at the most by three, and that by course; and let one interpret');
      expect(L81_TEXTS[b], `${b} drops 14:28`).toContain('But if there be no interpreter, let him keep silence in the church');
    }
  });

  it('every band grounds the rules in who Yahweh IS, not in tidiness', () => {
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} makes the rules administrative`)
        .toMatch(/(not because Yahweh likes tidy|not administrative tidiness|character of Yahweh)/i);
    }
  });
});

describe('L81 — THIRD MOVEMENT: the status question, closed', () => {
  it('every band says 12:30 expects the answer NO', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} drops 12:30`).toContain('do all speak with tongues?');
      expect(l81Ours(L81_TEXTS[b]), `${b} does not say the question expects no`)
        .toMatch(/expects the answer/i);
    }
  });

  it('every band denies that the gift is a spiritual tier', () => {
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} lets the gift become a rank`)
        .toMatch(/(never a spiritual tier|NOT a gold star|not a gold star)/i);
    }
  });

  it('every band forbids pressing a believer to perform', () => {
    // This is the pastoral teeth of the movement.
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} does not forbid the pressure`)
        .toMatch(/(may push|may press|allowed to push)/i);
    }
  });

  it('every band names the genuine difference WITHOUT staging a fight', () => {
    // DR-0098 in its exact form: name a disagreement to educate past it, never
    // as a both-sides contest. The band must do both halves — name it, and say
    // why it need not be a fight.
    for (const b of L81_BANDS) {
      const o = l81Ours(L81_TEXTS[b]);
      expect(o, `${b} does not name the reading difference`)
        .toMatch(/(believers genuinely differ|some hear|reading difference|grown-ups argue)/i);
      expect(o, `${b} does not disarm it`)
        .toMatch(/(cuts identically either way|nothing pastoral hangs|not going to argue|decline to stage)/i);
    }
  });
});

describe('L81 — FOURTH MOVEMENT: the both-hands command', () => {
  it('every band carries BOTH halves of 14:39-40', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} drops the forbid-not half`).toContain('forbid not to speak with tongues');
      expect(L81_TEXTS[b], `${b} drops the order half`).toContain('Let all things be done decently and in order');
    }
  });

  it('every band says a church keeping ONE of them is disobeying the verse', () => {
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} drops the sharp conclusion`)
        .toMatch(/(breaking the very verse|disobeying the same verse|disobeying the very verse)/i);
    }
  });
});

describe('L81 — FIFTH MOVEMENT: for anyone who has felt short-changed', () => {
  it('every band answers the private-channel fear directly', () => {
    // The reason the lesson exists, in Darrell's own framing. A band that
    // teaches the doctrine without answering the person has missed the point.
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} does not answer the fear`)
        .toMatch(/(private channel|secret way|You do not|It was not)/);
    }
  });

  it('every band carries the intercession that needed no performance', () => {
    for (const b of L81_BANDS) {
      expect(L81_TEXTS[b], `${b} drops Romans 8:26`).toContain('the Spirit itself maketh intercession for us with groanings which cannot be uttered');
      expect(l81Ours(L81_TEXTS[b]), `${b} does not say it needed no performance`)
        .toMatch(/(no performance|did not have to turn Him on|required no performance)/i);
    }
  });

  it('every band defines praying in the Spirit as DEPENDENCE, not a technique', () => {
    for (const b of L81_BANDS) {
      const o = l81Ours(L81_TEXTS[b]);
      expect(o, `${b} lets it be a technique`).toMatch(/(not a technique|not a trick)/i);
      expect(o, `${b} does not name dependence`).toMatch(/(DEPENDENCE|leaning on Yahweh)/i);
    }
  });

  it('every band closes on there being no ordinary prayer', () => {
    for (const b of L81_BANDS) {
      expect(l81Ours(L81_TEXTS[b]), `${b} drops the closing claim`)
        .toMatch(/never been an ordinary prayer/i);
    }
  });
});

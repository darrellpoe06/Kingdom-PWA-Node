// =============================================================================
// L124 — "Equipped to Win": the hour you are losing, the word AGAIN, and the man
// who did not want the job. Verbatim KJV.
// =============================================================================
// SOURCE. Captured from a Wednesday Bible Study taught by Bishop Lloyd E. Gwin at
// The Love Corner, 2026-09-02, brought in by Darrell from the church's own
// channel. Two things follow from that and are pinned below:
//   • The message is the OCCASION and is CREDITED BY NAME; it is not reproduced.
//     Everything taught is drawn from the Scriptures it opened, in our own prose,
//     with every quotation verbatim KJV from the in-repo public-domain corpus.
//   • The service announced trivia winners by name. Those are private people and
//     are deliberately NOT carried into a published lesson. The test asserts the
//     omission rather than listing the names (listing them here would defeat the
//     point of leaving them out).
//
// The five things this lesson had to get right, and which are pinned here:
//   • THE ADDRESSEE. This is wartime provision, not post-victory encouragement:
//     the decisive hour is the hour you are LOSING, because identity forgotten
//     inside a loss outlives the loss (2 Corinthians 4:8-9).
//   • THE WAVES, AND THE ARITHMETIC. Judah fell in stages on an announced term,
//     and the seventy years were CALCULATED — 2 Chronicles 36:21 measures them
//     against the sabbaths the land was denied (Leviticus 26:34-35). The hard
//     half is stated rather than softened: the good went with the bad (Daniel
//     1:6; Ezekiel 21:3), and the righteous man's response is "We have sinned"
//     (Daniel 9:5), not an exemption.
//   • THE CAUSE. Darrell supplied it mid-build: the world goes crazy where the
//     Word is not there. Jeremiah 36:23-24 is the scene — the scroll cut with a
//     penknife and burned, and nobody flinched — and the turn is the preserving
//     office: salt that has lost its savour is good for nothing (Matthew 5:13).
//     That is what makes 1 Peter 2:9 a COMMISSION, not a compliment.
//   • THE TENSION HELD, NOT RESOLVED AWAY. Jeremiah 19:11 says the broken vessel
//     "cannot be made whole again"; Jeremiah 31:4 says "Again I will build thee".
//     Both are His words. What is beyond MENDING is not beyond MAKING.
//   • AGAIN COSTS SOMETHING. Restoration language is only coherent to the
//     bereaved, and it requires a second exposure to a known injury — so refusing
//     it is frequently exhaustion rather than unbelief, and the lesson says so
//     out loud (Isaiah 61:3) instead of adding shame to grief.
//
// The whole-span gate rides again. Authoring L124 produced two real in-quote
// alterations, both asserted below as proven-to-catch and both a class worth
// naming: (1) a CAPITALIZATION change inside a quotation — Jeremiah 31:2 reads
// "The people which were left of the sword" and it was quoted with a lowered
// capital, which is editing Scripture; (2) our own vocabulary wearing
// Scripture's quotation marks — the word "equipped" is not in the KJV at all.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job';
const start = src.indexOf(`id: '${ID}'`);
// Bound the slice to THIS lesson. It previously ran to the END of the array,
// so every lesson added after this one was silently swept by this file's
// gates — checks written for one lesson judging another's prose. Each
// lesson carries its own verses test; this one tests only its own.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
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

const QUOTED_FRAGMENTS = [
  'He sent his word, and healed them, and delivered them from their destructions.', // Ps 107:20
  'We are troubled on every side, yet not distressed',                     // 2 Cor 4:8
  'Persecuted, but not forsaken; cast down, but not destroyed;',           // 2 Cor 4:9
  'even ten thousand captives, and all the craftsmen and smiths',          // 2 Kgs 24:14
  'did Nebuzaradan the captain of the guard carry away',                   // 2 Kgs 25:11
  'these nations shall serve the king of Babylon seventy years.',          // Jer 25:11
  'as one breaketh a potter’s vessel, that cannot be made whole again',    // Jer 19:11
  'But every man is tempted, when he is drawn away of his own lust, and enticed.', // Jas 1:14
  'sin, when it is finished, bringeth forth death',                        // Jas 1:15
  'to whom ye yield yourselves servants to obey, his servants ye are to whom ye obey', // Rom 6:16
  'For the wages of sin is death',                                         // Rom 6:23
  'until the land had enjoyed her sabbaths',                               // 2 Chr 36:21
  'to fulfil threescore and ten years',                                    // 2 Chr 36:21
  'because it did not rest in your sabbaths, when ye dwelt upon it',       // Lev 26:35
  'I Daniel understood by books the number of the years',                  // Dan 9:2
  'Now among these were of the children of Judah, Daniel, Hananiah, Mishael, and Azariah:', // Dan 1:6
  'will cut off from thee the righteous and the wicked',                   // Ezek 21:3
  'We have sinned, and have committed iniquity, and have done wickedly, and have rebelled', // Dan 9:5
  'he cut it with the penknife, and cast it into the fire that was on the hearth', // Jer 36:23
  'Yet they were not afraid, nor rent their garments',                     // Jer 36:24
  'ask for the old paths, where is the good way, and walk therein',        // Jer 6:16
  'But they said, We will not walk therein.',                              // Jer 6:16
  'I have found the book of the law in the house of the LORD',             // 2 Kgs 22:8
  'without a teaching priest, and without law',                            // 2 Chr 15:3
  'My people are destroyed for lack of knowledge',                         // Hos 4:6
  'Where there is no vision, the people perish',                           // Prov 29:18
  'every man did that which was right in his own eyes.',                   // Judg 21:25
  'but of hearing the words of the LORD:',                                 // Amos 8:11
  'shall run to and fro to seek the word of the LORD, and shall not find it', // Amos 8:12
  'Ye are the salt of the earth',                                          // Matt 5:13
  'if the salt have lost his savour',                                      // Matt 5:13
  'Ye are the light of the world.',                                        // Matt 5:14
  'Let your light so shine before men',                                    // Matt 5:16
  'Thy word is a lamp unto my feet, and a light unto my path.',            // Ps 119:105
  'The people which were left of the sword found grace in the wilderness', // Jer 31:2
  'Yea, I have loved thee with an everlasting love',                       // Jer 31:3
  'The LORD hath appeared of old unto me',                                 // Jer 31:3
  'Before I formed thee in the belly I knew thee',                         // Jer 1:5
  'It is of the LORD’s mercies that we are not consumed',                  // Lam 3:22
  'They are new every morning: great is thy faithfulness.',                // Lam 3:23
  'Again I will build thee, and thou shalt be built, O virgin of Israel',  // Jer 31:4
  'shalt go forth in the dances of them that make merry',                  // Jer 31:4
  'they shall raise up the former desolations',                            // Isa 61:4
  'I will restore to you the years that the locust hath eaten',            // Joel 2:25
  'to give unto them beauty for ashes, the oil of joy for mourning',       // Isa 61:3
  'Ah, Lord GOD! behold, I cannot speak: for I am a child.',               // Jer 1:6
  'Who am I, that I should go unto Pharaoh',                               // Ex 3:11
  'I am not eloquent, neither heretofore, nor since thou hast spoken unto thy servant', // Ex 4:10
  'my family is poor in Manasseh, and I am the least in my father’s house', // Judg 6:15
  'God hath chosen the weak things of the world to confound the things which are mighty', // 1 Cor 1:27
  'Say not, I am a child: for thou shalt go to all that I shall send thee', // Jer 1:7
  'Then the LORD put forth his hand, and touched my mouth.',               // Jer 1:9
  'Be not afraid of their faces: for I am with thee to deliver thee',      // Jer 1:8
  'all that will live godly in Christ Jesus shall suffer persecution',     // 2 Tim 3:12
  'Oh that my head were waters, and mine eyes a fountain of tears',        // Jer 9:1
  'He healeth the broken in heart, and bindeth up their wounds.',          // Ps 147:3
  'thoughts of peace, and not of evil, to give you an expected end',       // Jer 29:11
  'he which hath begun a good work in you will perform it',                // Phil 1:6
  'A brother offended is harder to be won than a strong city',             // Prov 18:19
  'their contentions are like the bars of a castle',                       // Prov 18:19
  'lest any root of bitterness springing up trouble you',                  // Heb 12:15
  'Pride goeth before destruction, and an haughty spirit before a fall.',  // Prov 16:18
  'But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people', // 1 Pet 2:9
  'Put on the whole armour of God',                                        // Eph 6:11
  'having done all, to stand',                                             // Eph 6:13
  'we are more than conquerors through him that loved us',                 // Rom 8:37
  'they have forsaken me the fountain of living waters',                   // Jer 2:13
  'hewed them out cisterns, broken cisterns, that can hold no water',      // Jer 2:13
  'I will visit you, and perform my good word toward you',                 // Jer 29:10
  'Behold the Lamb of God, which taketh away the sin of the world.',       // John 1:29
];

describe('L124 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Jeremiah 31:3-4; Jeremiah 1:5-9; 1 Peter 2:9'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L124 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('every quiz question has a real answer index and an explanation', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('teaches the whole arc in order — thirteen movements and the close', () => {
    const order = [
      '1) WHERE THE WORD CAME FROM',
      '2) THE HOUR THE WORD IS FOR - WHEN YOU ARE LOSING',
      '3) THE THREE WAVES - HOW A NATION, AND A MAN, GO INTO CAPTIVITY',
      '4) WHY THE WAVES CAME - THE WORD WAS NOT THERE',
      '5) HIS LOVE IS OLDER THAN YOUR FAILURE',
      '6) THE WORD THAT CHANGES EVERYTHING - AGAIN',
      '7) THE MAN WHO DID NOT WANT THE JOB',
      '8) TELLING THE TRUTH MAKES ENEMIES - AND HE SAID SO FIRST',
      '9) THE WEEPING PROPHET - WHY THE TEARS ARE NOT WEAKNESS',
      '10) WHAT THE BUYER SEES THAT THE PASSER-BY DOES NOT',
      '11) THE TWO THINGS TO PUT DOWN - OFFENCE AND PRIDE',
      '12) WHAT YOU ALREADY ARE - THE EQUIPMENT IS ISSUED',
      '13) THE TWO EVILS - THE QUESTION LEFT ON THE TABLE',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('credits the teaching by name as the OCCASION, and does not reproduce it', () => {
    expect(l, 'the teacher is named').toContain('Bishop Lloyd E. Gwin');
    expect(l, 'the assembly is named').toContain('The Love Corner');
    expect(l, 'the date is named').toContain('2026-09-02');
    expect(l).toMatch(/OCCASION|occasion/);
    expect(l, 'the message itself is not reproduced').toMatch(/not reproduced/);
  });

  it('leaves the congregants named in the service OUT of a published lesson', () => {
    // The service announced trivia winners by name. They are private people.
    // The trivia QUESTION is taught (it is Scripture); the winners are not named.
    //
    // NOTE ON HOW THIS IS CHECKED. The first version banned the word "winners"
    // outright and failed on the lesson's OWN note recording that the names were
    // deliberately left out — a gate cannot tell "the names are omitted" from
    // "here are the names" by keyword alone. So it checks the real property: an
    // announced list looks like congregational honorifics followed by names. The
    // teacher IS credited by name (Bishop), which is the whole point of the
    // attribution rule, so that honorific is not in the pattern.
    const CONGREGANT_NAME = /\b(Deacon|Deaconess|Eldest|Elder|Sister|Brother|Minister)\s+[A-Z][a-z]+/;
    expect(CONGREGANT_NAME.test(l), 'a congregant named in a published lesson').toBe(false);
    expect(l, 'the omission is recorded, not silent').toMatch(/deliberately (left out|not carr)/);
    expect(l, 'but the question itself is answered from the Word').toContain('For my people have committed two evils');
    // proven-to-catch, with invented names so no real person is written down here
    expect(CONGREGANT_NAME.test('the winners were Deacon Someone and Sister Example')).toBe(true);
  });

  it('carries the waves, the calculated term, and the hard half said plainly', () => {
    expect(l).toMatch(/THREE WAVES/);
    expect(l, 'pleasure, bondage, death').toMatch(/PLEASURE/);
    expect(l).toMatch(/BONDAGE/);
    expect(l).toMatch(/DEATH stage|bringeth forth death/);
    expect(l, 'the seventy years were calculated, not arbitrary').toMatch(/NOT AN ARBITRARY NUMBER/);
    expect(l).toContain('until the land had enjoyed her sabbaths');
    expect(l, 'the good went with the bad, unsoftened').toMatch(/the good went with the bad/);
    expect(l, 'and the righteous man does not exempt himself').toContain('We have sinned, and have committed iniquity');
  });

  it('names the CAUSE — the Word was not there — and turns it to the preserving office', () => {
    expect(l).toContain('he cut it with the penknife');
    expect(l).toContain('Yet they were not afraid');
    expect(l, 'the way was offered and refused').toContain('But they said, We will not walk therein.');
    expect(l, 'the severest sentence is the Word withdrawn').toContain('but of hearing the words of the LORD:');
    expect(l, 'the turn: salt preserves, it does not decorate').toContain('Ye are the salt of the earth');
    expect(l).toMatch(/COMMISSION, not a compliment|commission, not a compliment/i);
  });

  it('holds the mending/making tension instead of resolving it away', () => {
    expect(l).toContain('cannot be made whole again');
    expect(l).toContain('Again I will build thee');
    expect(l).toMatch(/beyond MENDING is not beyond MAKING/);
  });

  it('grounds it in a love OLDER than the failure, and keeps AGAIN honest about its cost', () => {
    expect(l).toMatch(/OLDER THAN YOUR FAILURE|OLDER than your failure/);
    expect(l).toContain('The LORD hath appeared of old unto me');
    expect(l).toContain('Before I formed thee in the belly I knew thee');
    expect(l, 'again costs a second exposure').toMatch(/second exposure/i);
    expect(l, 'refusing it is often exhaustion, not unbelief').toMatch(/resisting the risk|refusing the risk/i);
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });

  it('confesses Jesus as the Lamb of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
      expect(WHOLE_KJV, 'the pin itself must exist in the corpus').toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the two alterations actually made while authoring THIS lesson', () => {
    // (1) A LOWERED CAPITAL inside a quotation. Jeremiah 31:2 reads "The people
    // which were left of the sword"; it was first quoted mid-sentence with a
    // lowercase t, which is editing Scripture to fit our grammar.
    expect(WHOLE_KJV.includes('the people which were left of the sword')).toBe(false);
    expect(WHOLE_KJV.includes('The people which were left of the sword')).toBe(true);
    // (2) OUR OWN VOCABULARY wearing Scripture's quotation marks. The lesson's
    // title word is not in the KJV at all, and it had been sitting in quotes.
    expect(WHOLE_KJV.includes('equipped')).toBe(false);
    expect(l.includes('"equipped"')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the losing-hour thesis and the word AGAIN', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the losing hour`).toMatch(/losing|LOSING/);
      expect(t, `${band} carries again`).toMatch(/Again I will build thee|AGAIN/);
    }
  });

  it('each band carries the identity in the present tense and the salt commission', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the identity`).toMatch(/royal priesthood|1 Peter 2:9/);
      expect(t, `${band} carries salt`).toMatch(/salt of the earth|Matthew 5:13/);
    }
  });

  it('teen and senior additionally carry the waves, the cause, and offence/pride', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, 'the three stages').toMatch(/James 1:14|James 1:15|drawn away of his own lust/);
      expect(t, 'the Word was not there').toMatch(/penknife|Jeremiah 36:2[34]/);
      expect(t, 'offence and pride').toMatch(/offended|Proverbs 18:19/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child, 'no captivity/death arithmetic for a six-year-old').not.toMatch(/captivity|seventy years|wages of sin/i);
    expect(child, 'but it carries the love that predates the failure').toContain('Before I formed thee in the belly I knew thee');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Jeremiah', 31, 3)).toBe('The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.');
    expect(verse('Jeremiah', 31, 4)).toContain('Again I will build thee, and thou shalt be built');
    expect(verse('Jeremiah', 1, 6)).toBe('Then said I, Ah, Lord GOD! behold, I cannot speak: for I am a child.');
    expect(verse('Jeremiah', 1, 9)).toContain('Then the LORD put forth his hand, and touched my mouth.');
    expect(verse('Jeremiah', 36, 23)).toContain('he cut it with the penknife');
    expect(verse('Jeremiah', 36, 24)).toContain('Yet they were not afraid');
    expect(verse('Jeremiah', 19, 11)).toContain('that cannot be made whole again');
    expect(verse('2Chronicles', 36, 21)).toContain('to fulfil threescore and ten years');
    expect(verse('Daniel', 9, 5)).toContain('We have sinned, and have committed iniquity');
    expect(verse('Matthew', 5, 13)).toContain('Ye are the salt of the earth');
    expect(verse('Proverbs', 18, 19)).toBe('A brother offended is harder to be won than a strong city: and their contentions are like the bars of a castle.');
    expect(verse('Jeremiah', 2, 13)).toContain('hewed them out cisterns, broken cisterns, that can hold no water');
    expect(verse('1Peter', 2, 9)).toContain('a royal priesthood, an holy nation');
  });
});

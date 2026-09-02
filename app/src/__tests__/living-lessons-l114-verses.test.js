// =============================================================================
// L114 — The thirty-day experiment: "action produces information," the Word that
// does its own work, and the grace that met a man who was only pretending.
// Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken teaching, 2026-09-02: a man who did not believe
// ran a thirty-day experiment — act as though Yahweh is real and see what
// happens. Four practices (a short prayer, gratitude, reading the Word, applying
// it). By day twenty he stopped calling it an experiment. An eight-year nicotine
// habit quietly faded; bad dreams started that he had never had before. Darrell
// brought two Scriptures with it — Jeremiah 29:13 (the seeking clause) and the
// outpouring on all flesh (Joel 2:28) — and closed on his grief that people will
// still argue the Word after evidence like this.
//
// The four things this lesson had to get right, and which are pinned here:
//   • SOURCE DISCIPLINE. The account is a RELAYED TESTIMONY. It is a witness to
//     what Scripture already claims about itself, never an authority standing
//     beside Scripture — and no detail may be added in the retelling.
//   • THE CREDIT GOES TO THE WORD, NOT THE MAN. He began with no sincerity, so
//     the variable is isolated: Hebrews 4:12, Isaiah 55:11, John 6:63,
//     1 Thessalonians 2:13. Any reading that makes the seeker's sincerity the
//     operative power is the failure this lesson exists to prevent.
//   • THE TENSION IN JEREMIAH 29:13 IS NOT RESOLVED CHEAPLY. "with all your
//     heart" stands, and Hebrews 11:6 stands with it; the term is taught as the
//     APPROACH that crossed the line, answered by a Father who runs while the
//     son is still "yet a great way off" (Luke 15:20).
//   • DR-0098. Darrell's closing grief is answered the Word's own way — we do
//     not take up the argument (2 Timothy 2:23-24; Titus 3:9), we hand over
//     demonstration and testimony (1 Corinthians 2:4-5; John 9:25).
//
// The whole-span gate from L112/L113 rides again here: no quoted span in this
// lesson may differ from the in-repo KJV by a single character. Authoring L114
// produced two real in-quote alterations of a kind this series had not caught
// before — CROSS-VERSE spans quoted as one continuous quotation (Mark 4:26-27
// and Psalm 103:2-3), which silently deletes the verse boundary. Both were
// caught by the sweep and split on an explicit ellipsis; both are asserted below
// as proven-to-catch.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll114-the-thirty-day-experiment-action-produces-information-and-the-grace-that-met-a-pretender';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

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
  'If any man will do his will, he shall know of the doctrine',              // John 7:17
  'prove me now herewith, saith the LORD of hosts',                          // Mal 3:10
  'Prove thy servants, I beseech thee, ten days',                            // Dan 1:12
  'So he consented to them in this matter, and proved them ten days.',       // Dan 1:14
  'their countenances appeared fairer and fatter in flesh',                  // Dan 1:15
  'O taste and see that the LORD is good',                                   // Ps 34:8
  'All that the LORD hath said will we do, and be obedient.',                // Ex 24:7
  'Pray without ceasing.',                                                   // 1 Thess 5:17
  'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', // 1 Thess 5:18
  'let your requests be made known unto God',                                // Phil 4:6
  'Enter into his gates with thanksgiving, and into his courts with praise', // Ps 100:4
  'So then faith cometh by hearing, and hearing by the word of God.',        // Rom 10:17
  'But be ye doers of the word, and not hearers only, deceiving your own selves.', // Jas 1:22
  'but a doer of the work, this man shall be blessed in his deed.',          // Jas 1:25
  'quick, and powerful, and sharper than any twoedged sword',                // Heb 4:12
  'is a discerner of the thoughts and intents of the heart',                 // Heb 4:12
  'it shall not return unto me void, but it shall accomplish that which I please', // Isa 55:11
  'the words that I speak unto you, they are spirit, and they are life',     // John 6:63
  'effectually worketh also in you that believe',                            // 1 Thess 2:13
  'Father, forgive them; for they know not what they do.',                   // Luke 23:34
  'For if ye forgive men their trespasses, your heavenly Father will also forgive you:', // Matt 6:14
  'And when ye stand praying, forgive, if ye have ought against any',        // Mark 11:25
  'even as God for Christ’s sake hath forgiven you',                         // Eph 4:32
  'the seed should spring and grow up, he knoweth not how',                  // Mark 4:27
  'first the blade, then the ear, after that the full corn in the ear',      // Mark 4:28
  'If the Son therefore shall make you free, ye shall be free indeed.',      // John 8:36
  'old things are passed away; behold, all things are become new',           // 2 Cor 5:17
  'Who forgiveth all thine iniquities; who healeth all thy diseases',        // Ps 103:3
  'the goodness of God leadeth thee to repentance',                          // Rom 2:4
  'For by grace are ye saved through faith',                                 // Eph 2:8
  'satan cometh immediately, and taketh away the word that was sown in their hearts', // Mark 4:15
  'when affliction or persecution ariseth for the word’s sake',              // Mark 4:17
  'This is my beloved Son, in whom I am well pleased.',                      // Matt 3:17
  'Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.', // Matt 4:1
  'Be sober, be vigilant; because your adversary the devil, as a roaring lion', // 1 Pet 5:8
  'Whom resist stedfast in the faith',                                       // 1 Pet 5:9
  'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.', // Eph 6:11
  'For we wrestle not against flesh and blood, but against principalities, against powers', // Eph 6:12
  'Submit yourselves therefore to God. Resist the devil, and he will flee from you.', // Jas 4:7
  'I will both lay me down in peace, and sleep',                             // Ps 4:8
  'No weapon that is formed against thee shall prosper',                     // Isa 54:17
  'the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds', // 2 Cor 10:4
  'And ye shall seek me, and find me, when ye shall search for me with all your heart.', // Jer 29:13
  'Then shall ye call upon me, and ye shall go and pray unto me, and I will hearken unto you.', // Jer 29:12
  'if thou seek him with all thy heart and with all thy soul',               // Deut 4:29
  'he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him', // Heb 11:6
  'Ask, and it shall be given you; seek, and ye shall find',                 // Matt 7:7
  'though he be not far from every one of us',                               // Acts 17:27
  'Seek ye the LORD while he may be found, call ye upon him while he is near:', // Isa 55:6
  'his father saw him, and had compassion, and ran, and fell on his neck, and kissed him', // Luke 15:20
  'Jesus I know, and Paul I know; but who are ye?',                          // Acts 19:15
  'he findeth it empty, swept, and garnished',                               // Matt 12:44
  'the last state of that man is worse than the first',                      // Matt 12:45
  'he which hath begun a good work in you will perform it',                  // Phil 1:6
  'be ye transformed by the renewing of your mind',                          // Rom 12:2
  'I will pour out my spirit upon all flesh',                                // Joel 2:28
  'I will pour out of my Spirit upon all flesh',                             // Acts 2:17
  'how much more shall your heavenly Father give the Holy Spirit to them that ask him?', // Luke 11:13
  'But foolish and unlearned questions avoid, knowing that they do gender strifes.', // 2 Tim 2:23
  'the servant of the Lord must not strive; but be gentle unto all men, apt to teach, patient', // 2 Tim 2:24
  'for they are unprofitable and vain',                                      // Titus 3:9
  'but in demonstration of the Spirit and of power',                         // 1 Cor 2:4
  'That your faith should not stand in the wisdom of men, but in the power of God.', // 1 Cor 2:5
  'one thing I know, that, whereas I was blind, now I see',                  // John 9:25
  'Behold the Lamb of God, which taketh away the sin of the world.',         // John 1:29
];

describe('L114 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Jeremiah 29:13; John 7:17; Malachi 3:10'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L114 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
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

  it('teaches the whole arc in order — account, order, practices, why, forgiveness, chain, warfare, seeking, outpouring, no-debate', () => {
    const order = [
      '1) THE ACCOUNT, AS IT WAS TOLD',
      '2) THE ORDER YAHWEH ALREADY BUILT - DO, THEN KNOW',
      '3) THE FOUR THINGS HE ACTUALLY DID',
      '4) WHY IT WORKED - THE WORD DOES ITS OWN WORK',
      '5) THE FIRST FRUIT WAS FORGIVENESS',
      '6) THE CHAIN THAT QUIETLY FELL OFF',
      '7) THE WARFARE THAT STARTED AFTER HE TURNED',
      '8) THE SEEKING CLAUSE - WITH ALL YOUR HEART',
      '9) POURED OUT UPON ALL FLESH',
      '10) WHY WE DO NOT ARGUE THIS',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries every element of the spoken teaching that was actually given', () => {
    expect(l).toContain('Darrell');
    expect(l, 'his own phrase').toMatch(/ACTION PRODUCES INFORMATION|action produces information/);
    expect(l, 'the term').toMatch(/thirty[- ]day|thirty days/);
    expect(l, 'the four practices').toMatch(/gratitude/i);
    expect(l, 'day twenty').toMatch(/day twenty/);
    expect(l, 'the friend he had not forgiven').toMatch(/ghosting|unforgiven/);
    expect(l, 'the eight-year habit').toMatch(/eight[- ]year|eight years/);
    expect(l, 'the dreams after the turn').toMatch(/bad dreams|nightmares/);
    expect(l, 'his first Scripture').toContain('Jeremiah 29:13');
    expect(l, 'his second Scripture — the outpouring').toContain('Joel 2:28');
  });

  it('keeps SOURCE DISCIPLINE — the account is a witness, never an authority beside Scripture', () => {
    expect(l).toMatch(/RELAYED TESTIMONY|relayed testimony/);
    expect(l).toMatch(/never as an authority|never an authority/);
    expect(l, 'no detail added in the retelling').toMatch(/do not add|does not add/i);
  });

  it('puts the credit on the Word and NOT on the seeker’s sincerity — the doctrinal centre', () => {
    expect(l).toMatch(/no sincerity/);
    expect(l).toContain('quick, and powerful, and sharper than any twoedged sword');
    expect(l).toContain('it shall not return unto me void');
    expect(l).toContain('effectually worketh also in you that believe');
  });

  it('holds the Jeremiah 29:13 tension honestly instead of resolving it cheaply', () => {
    expect(l).toContain('when ye shall search for me with all your heart');
    expect(l, 'Hebrews 11:6 is not dropped to make the story easier').toContain('he that cometh to God must believe that he is');
    expect(l, 'the term is the approach, not the qualification').toMatch(/approach/i);
    expect(l, 'the Father runs first').toContain('his father saw him, and had compassion, and ran');
  });

  it('carries the caution that keeps a term from becoming a formula', () => {
    expect(l, 'the Name is not a technique').toContain('Jesus I know, and Paul I know; but who are ye?');
    expect(l, 'the emptied house').toContain('he findeth it empty, swept, and garnished');
    expect(l).toMatch(/doorway, not a destination/);
  });

  it('answers the closing grief the Word’s own way — teach, do not debate (DR-0098)', () => {
    expect(l).toMatch(/Word first/i);
    expect(l).toContain('But foolish and unlearned questions avoid');
    expect(l).toContain('one thing I know, that, whereas I was blind, now I see');
    expect(l, 'demonstration replaces the argument').toContain('but in demonstration of the Spirit and of power');
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
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
    expect(spans.length).toBeGreaterThan(120);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the CROSS-VERSE alterations actually made while authoring THIS lesson', () => {
    // A cross-verse quotation silently deletes the verse boundary. Both of these
    // were written as one continuous quotation in the first draft and caught by
    // the sweep above; each HALF is real, the JOIN is not.
    const mark = 'as if a man should cast seed into the ground; And should sleep, and rise night and day';
    expect(WHOLE_KJV.includes(mark), 'Mark 4:26-27 joined across the verse boundary').toBe(false);
    expect(WHOLE_KJV.includes('as if a man should cast seed into the ground;')).toBe(true);
    expect(WHOLE_KJV.includes('And should sleep, and rise night and day')).toBe(true);

    const psalm = 'forget not all his benefits: Who forgiveth all thine iniquities';
    expect(WHOLE_KJV.includes(psalm), 'Psalm 103:2-3 joined across the verse boundary').toBe(false);
    expect(WHOLE_KJV.includes('forget not all his benefits:')).toBe(true);
    expect(WHOLE_KJV.includes('Who forgiveth all thine iniquities')).toBe(true);

    // and our own framing wearing Scripture's quotation marks
    expect(WHOLE_KJV.includes('action produces information')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the do-then-know order and the living Word', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries John 7:17`).toMatch(/he shall know of the doctrine|John 7:17/);
      expect(t, `${band} carries the Word doing its own work`).toMatch(/Hebrews 4:12|twoedged sword|Isaiah 55:11|alive/);
    }
  });

  it('each band carries the forgiveness that moved first and the chain that fell off', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the forgiveness`).toMatch(/Father, forgive them|forgiv/);
      expect(t, `${band} carries the quiet deliverance`).toMatch(/he knoweth not how|Mark 4:2[678]/);
    }
  });

  it('each band prepares the reader for the resistance that comes AFTER the turn', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} names the post-turn pressure`).toMatch(/dreams|wilderness|Mark 4:15|resist/i);
      expect(t, `${band} gives the submit-then-resist order`).toMatch(/Submit yourselves therefore to God|James 4:7/);
    }
  });

  it('teen and senior additionally carry the seeking clause and the outpouring on all flesh', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toMatch(/with all your heart|Jeremiah 29:13/);
      expect(t).toMatch(/pour out my spirit upon all flesh|Joel 2:28/);
      expect(t, 'the caution rides with the invitation').toMatch(/who are ye|Acts 19:1[356]|Matthew 12:4[345]/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    // the eight-year habit is taught WITHOUT naming the substance to a six-year-old
    expect(child).not.toMatch(/nicotine|smoking|cigarette/i);
    expect(child).toMatch(/could not stop/);
    expect(child, 'a child gets the bedtime verse, not just the warning').toContain('I will both lay me down in peace, and sleep');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Jeremiah', 29, 13)).toBe('And ye shall seek me, and find me, when ye shall search for me with all your heart.');
    expect(verse('John', 7, 17)).toBe('If any man will do his will, he shall know of the doctrine, whether it be of God, or whether I speak of myself.');
    expect(verse('Malachi', 3, 10)).toContain('prove me now herewith, saith the LORD of hosts');
    expect(verse('Daniel', 1, 12)).toContain('Prove thy servants, I beseech thee, ten days');
    expect(verse('Psalms', 34, 8)).toContain('O taste and see that the LORD is good');
    expect(verse('Hebrews', 4, 12)).toContain('is a discerner of the thoughts and intents of the heart');
    expect(verse('Isaiah', 55, 11)).toContain('it shall not return unto me void');
    expect(verse('Luke', 23, 34)).toContain('Father, forgive them; for they know not what they do.');
    expect(verse('Mark', 4, 27)).toBe('And should sleep, and rise night and day, and the seed should spring and grow up, he knoweth not how.');
    expect(verse('Matthew', 4, 1)).toBe('Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.');
    expect(verse('James', 4, 7)).toBe('Submit yourselves therefore to God. Resist the devil, and he will flee from you.');
    expect(verse('Luke', 15, 20)).toContain('when he was yet a great way off, his father saw him');
    expect(verse('Joel', 2, 28)).toContain('I will pour out my spirit upon all flesh');
    expect(verse('John', 9, 25)).toContain('whereas I was blind, now I see');
  });

  it('the corpus keeps the adversary named low — the typography is in the text we quote', () => {
    expect(verse('Mark', 4, 15)).toContain('satan cometh immediately');
    expect(verse('Mark', 4, 15)).not.toContain('Satan');
  });
});

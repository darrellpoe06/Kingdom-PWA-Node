// =============================================================================
// L90 — No respecter of persons: the image, the unrighteous decree, the Judge
// =============================================================================
// This is the most politically live lesson in the catalog, and the gate exists
// because that is exactly the condition under which a lesson drifts into a
// jersey. Its base prose already does the hard thing: it sets Yahweh's justice
// standard ABOVE the case ("in any hand, of any colour, on any side"), teaches
// impartiality in BOTH directions (Leviticus 19:15 forbids favouring the poor as
// firmly as honouring the mighty), holds TWO TIERS OF HONESTY (documented harm
// stated plainly; unverified 2026 court-case specifics named as reported, never
// baptised as settled fact and never waved away), marks the landmark analogy as
// "a picture, not a proof-text about modern maps", and refuses to name a march,
// a group or a party -- "The Word commissions the DUTY. The HOW -- lawful,
// peaceable, honest -- is yours to walk out under the King."
//
// Every one of those properties is now REQUIRED IN ALL FOUR BANDS, because a
// child reading the child band is the reader least able to supply a missing
// caveat for himself, and because a lesson that only holds its discipline at
// adult level does not hold it at all.
//
// Every KJV line below was FETCHED from the repo's own KJV this session, not
// recalled. A drifted quote fails the build.
//
// ONE HONEST LIMIT, RECORDED RATHER THAN HIDDEN. The whole-span gate asks
// whether a quoted span is a substring of the corpus, and this lesson is a live
// example of why that is not the same as asking whether it is a quotation. Our
// own denied phrase "some say" -- which we quote in order to REFUSE it -- is
// also, by pure coincidence, a substring of Luke 9:19 ("but some say, Elias").
// It therefore passes the verbatim check for the wrong reason. Nothing is wrong
// here (it is our phrase either way), but the coincidence is the argument for
// the verse-boundary check tracked at re-review: 2026-10-08.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll90-no-respecter-of-persons-the-image-the-unrighteous-decree-and-the-judge'");
// Bound the slice to THIS lesson. L90 is the lesson an L97 break test once
// edited by accident, so the scoping here is deliberate in both directions:
// too small and the gate stops seeing the end of its own lesson, too large and
// it judges the next lesson's prose as though it were this one's.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
const l = lesson.replace(/’/g, "'");

// Fetched verbatim from app/public/bible/kjv (this session), curly apostrophes
// normalized. Where the lesson quotes a mid-verse fragment, the FULL verse is
// recorded here so a future reader can see what was cut and check that the cut
// did not change the sense.
const KJV = {
  'Genesis 1:27': 'So God created man in his own image, in the image of God created he him; male and female created he them.',
  'Genesis 18:25': 'That be far from thee to do after this manner, to slay the righteous with the wicked: and that the righteous should be as the wicked, that be far from thee: Shall not the Judge of all the earth do right?',
  'Leviticus 19:15': 'Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.',
  'Deuteronomy 10:17': 'For the LORD your God is God of gods, and Lord of lords, a great God, a mighty, and a terrible, which regardeth not persons, nor taketh reward:',
  'Deuteronomy 16:19': 'Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise, and pervert the words of the righteous.',
  'Deuteronomy 27:17': 'Cursed be he that removeth his neighbour’s landmark. And all the people shall say, Amen.',
  'Deuteronomy 27:19': 'Cursed be he that perverteth the judgment of the stranger, fatherless, and widow. And all the people shall say, Amen.',
  '1 Samuel 2:8': 'He raiseth up the poor out of the dust, and lifteth up the beggar from the dunghill, to set them among princes, and to make them inherit the throne of glory: for the pillars of the earth are the LORD’s, and he hath set the world upon them.',
  'Esther 4:14': 'For if thou altogether holdest thy peace at this time, then shall there enlargement and deliverance arise to the Jews from another place; but thou and thy father’s house shall be destroyed: and who knoweth whether thou art come to the kingdom for such a time as this?',
  'Psalms 82:3': 'Defend the poor and fatherless: do justice to the afflicted and needy.',
  'Psalms 82:4': 'Deliver the poor and needy: rid them out of the hand of the wicked.',
  'Proverbs 14:31': 'He that oppresseth the poor reproacheth his Maker: but he that honoureth him hath mercy on the poor.',
  'Proverbs 17:15': 'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.',
  'Proverbs 22:28': 'Remove not the ancient landmark, which thy fathers have set.',
  'Proverbs 31:8': 'Open thy mouth for the dumb in the cause of all such as are appointed to destruction.',
  'Proverbs 31:9': 'Open thy mouth, judge righteously, and plead the cause of the poor and needy.',
  'Ecclesiastes 5:8': 'If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth; and there be higher than they.',
  'Isaiah 1:17': 'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.',
  'Isaiah 10:1': 'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed;',
  'Isaiah 10:2': 'To turn aside the needy from judgment, and to take away the right from the poor of my people, that widows may be their prey, and that they may rob the fatherless!',
  'Jeremiah 17:9': 'The heart is deceitful above all things, and desperately wicked: who can know it?',
  'Jeremiah 22:3': 'Thus saith the LORD; Execute ye judgment and righteousness, and deliver the spoiled out of the hand of the oppressor: and do no wrong, do no violence to the stranger, the fatherless, nor the widow, neither shed innocent blood in this place.',
  'Amos 5:24': 'But let judgment run down as waters, and righteousness as a mighty stream.',
  'Micah 6:8': 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  'Zechariah 4:6': 'Then he answered and spake unto me, saying, This is the word of the LORD unto Zerubbabel, saying, Not by might, nor by power, but by my spirit, saith the LORD of hosts.',
  'Zechariah 4:10': 'For who hath despised the day of small things? for they shall rejoice, and shall see the plummet in the hand of Zerubbabel with those seven; they are the eyes of the LORD, which run to and fro through the whole earth.',
  'Zechariah 7:9': 'Thus speaketh the LORD of hosts, saying, Execute true judgment, and shew mercy and compassions every man to his brother:',
  'Zechariah 7:10': 'And oppress not the widow, nor the fatherless, the stranger, nor the poor; and let none of you imagine evil against his brother in your heart.',
  'Luke 21:3': 'And he said, Of a truth I say unto you, that this poor widow hath cast in more than they all:',
  'Acts 10:34': 'Then Peter opened his mouth, and said, Of a truth I perceive that God is no respecter of persons:',
  'Acts 17:26': 'And hath made of one blood all nations of men for to dwell on all the face of the earth, and hath determined the times before appointed, and the bounds of their habitation;',
  'Romans 2:11': 'For there is no respect of persons with God.',
  '1 Corinthians 1:27': 'But God hath chosen the foolish things of the world to confound the wise; and God hath chosen the weak things of the world to confound the things which are mighty;',
  '2 Corinthians 5:17': 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  'Galatians 3:28': 'There is neither Jew nor Greek, there is neither bond nor free, there is neither male nor female: for ye are all one in Christ Jesus.',
  'Galatians 6:9': 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'Ephesians 2:14': 'For he is our peace, who hath made both one, and hath broken down the middle wall of partition between us;',
  'Colossians 3:11': 'Where there is neither Greek nor Jew, circumcision nor uncircumcision, Barbarian, Scythian, bond nor free: but Christ is all, and in all.',
  'James 2:1': 'My brethren, have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.',
  'James 2:9': 'But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.',
  'Revelation 7:9': 'After this I beheld, and, lo, a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb, clothed with white robes, and palms in their hands;',
};

const QUOTED_FRAGMENTS = [
  'So God created man in his own image, in the image of God created he him; male and female created he them.',
  'And hath made of one blood all nations of men for to dwell on all the face of the earth',
  'Of a truth I perceive that God is no respecter of persons',
  'For there is no respect of persons with God.',
  'But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.',
  'Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.',
  'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed; To turn aside the needy from judgment, and to take away the right from the poor of my people, that widows may be their prey, and that they may rob the fatherless!',
  'Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise',
  'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.',
  "Cursed be he that removeth his neighbour's landmark. And all the people shall say, Amen.",
  'Remove not the ancient landmark, which thy fathers have set.',
  'Cursed be he that perverteth the judgment of the stranger, fatherless, and widow.',
  'He that oppresseth the poor reproacheth his Maker',
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction. Open thy mouth, judge righteously, and plead the cause of the poor and needy.',
  'Defend the poor and fatherless: do justice to the afflicted and needy.',
  'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.',
  'The heart is deceitful above all things, and desperately wicked: who can know it?',
  'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  'For he is our peace, who hath made both one, and hath broken down the middle wall of partition between us',
  'ye are all one in Christ Jesus.',
  'If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth; and there be higher than they.',
  'But God hath chosen the foolish things of the world to confound the wise; and God hath chosen the weak things of the world to confound the things which are mighty',
  'He raiseth up the poor out of the dust, and lifteth up the beggar from the dunghill, to set them among princes',
  'who hath despised the day of small things?',
  'this poor widow hath cast in more than they all',
  'who knoweth whether thou art come to the kingdom for such a time as this?',
  'Not by might, nor by power, but by my spirit, saith the LORD of hosts.',
  'let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'Shall not the Judge of all the earth do right?',
  'a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb',
  'But let judgment run down as waters, and righteousness as a mighty stream.',
  'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
];

// -----------------------------------------------------------------------------
// The corpus, joined as a reader meets it: chapter verses joined with a SPACE,
// so a contiguous multi-verse quotation (Isaiah 10:1-2, Proverbs 31:8-9) is a
// true substring while one stitched across a chapter break is not.
// -----------------------------------------------------------------------------
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all.replace(/’/g, "'");
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// NON-SCRIPTURE QUOTED SPANS, EVERY ONE ACCOUNTED FOR. Four categories, and the
// fourth is the one this lesson depends on most:
//   1. the creator's own terms of art, quoted as HIS terms;
//   2. a title;
//   3. our own claim or provenance marker, quoted back;
//   4. A PHRASE QUOTED IN ORDER TO BE DENIED -- `well, some people say` is the
//      gaslight this lesson refuses, so it appears in quotation marks precisely
//      because we are rejecting it. Removing the marks would make us appear to
//      assert it.
// Plus the child band's SIGNPOSTED GLOSS (the L93 pattern): the words
// `- that means,` stand immediately before it, so a child is told in the
// sentence itself that a plain-English restatement follows, and it is NOT
// presented as the verse. It is kept for that reason and gated below.
const OUR_OWN_QUOTED = [
  'packing and cracking',              // the creator's term of art
  'partisan proxy',                    // the creator's term of art
  'complete exclusion,',               // the video's phrase, attributed to it
  '1000 Miles to Memphis',             // the march's name, a title
  'a landmark waiting to be moved again', // our own phrase, quoted back in the quiz
  'Legal',                             // scare-quoted by us, to be examined
  'as reported.',                      // our provenance marker
  'well, some people say',             // QUOTED IN ORDER TO BE DENIED
  'It is very bad to make unfair laws.', // the child band's signposted gloss
];

describe('L90 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, four bands, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
  });

  it('the nine movements run in order', () => {
    const order = [
      '1) THE IMAGE AND THE ONE BLOOD',
      '2) YAHWEH IS NO RESPECTER OF PERSONS',
      '3) THE UNRIGHTEOUS DECREE',
      '4) THE ANCIENT LANDMARK',
      '5) THE DOCUMENTED HISTORY',
      '6) OPEN THY MOUTH FOR THE VOICELESS',
      '7) THE DEEPER DIAGNOSIS',
      '8) THE MYTH OF MERITOCRACY',
      '9) THE JUDGE OF ALL THE EARTH',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 54)}${frag.length > 54 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }

  it('the pinned fragments above are themselves corpus text — the gate audits ITSELF', () => {
    // A gate can protect an alteration: pin a drifted fragment, watch the prose
    // match it, and the check passes while the reader is served the wrong text.
    // So every fragment this file pins is asserted against the corpus too.
    const notInCorpus = QUOTED_FRAGMENTS.filter((f) => !KJV_FLOW.includes(f));
    expect(notInCorpus, `pinned fragments that are NOT corpus text:\n${notInCorpus.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('the recorded full verses match the corpus, so a cut fragment can be checked', () => {
    const drifted = Object.entries(KJV).filter(([, text]) => !KJV_FLOW.includes(text.replace(/’/g, "'")));
    expect(drifted.map(([ref]) => ref), 'recorded verses that do not match the repo KJV').toEqual([]);
  });
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or one of the listed non-Scripture spans', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(180);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('a verse quotation can never hide behind the allowlist', () => {
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('NO bracketed inflection is presented as the verse — Isaiah 10:2 restored', () => {
    // The bigIdea carried `the law itself is what "turn[s] aside the needy from
    // judgment."` -- TWO alterations inside one pair of quotation marks. The
    // verse reads `To turn aside the needy from judgment,` and CONTINUES, so the
    // bracket changed the word and the period invented a sentence end. The claim
    // is kept; the marks are gone, which is what the base prose already did in
    // every other place it says the same thing.
    expect(l).not.toContain('turn[s]');
    expect(l).not.toContain('"turn aside the needy from judgment."');
    expect(l, 'the teaching itself is kept, unquoted').toMatch(/turns aside the needy from judgment/);
    // And the real verse is still quoted in full, with its own punctuation.
    expect(l).toContain('To turn aside the needy from judgment, and to take away the right from the poor of my people');
  });

  it('the child band\'s gloss is SIGNPOSTED, never passed off as the verse', () => {
    const child = l.slice(l.indexOf("child: '"), l.indexOf("youth: '"));
    expect(child).toContain('It is very bad to make unfair laws.');
    // The signpost must stand immediately before it. Without `- that means,` the
    // sentence would read as though the quotation marks were quoting Isaiah.
    expect(child).toMatch(/- that means, "It is very bad to make unfair laws\."/);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });
});

describe('every band is the FULL message, in that age\'s own words (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  const BANDS = ['child', 'youth', 'teen', 'senior'];

  it('youth exists beside the other three, and none is a summary', () => {
    for (const band of BANDS) {
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(8000);
    }
  });

  it('every band carries all nine movements, not a subset', () => {
    const EVERY_BAND = [
      'So God created man in his own image',              // 1 the image
      'And hath made of one blood all nations of men',    // 1 one blood
      'God is no respecter of persons',                   // 2 no favourites
      'ye commit sin',                                    // 2 partiality is sin
      'thou shalt not respect the person of the poor, nor honor the person of the mighty', // 2 BOTH ways
      'Woe unto them that decree unrighteous decrees',    // 3 the decree
      'even they both are abomination to the LORD',       // 3 the flat verdict
      "Cursed be he that removeth his neighbour's landmark", // 4 the landmark
      'Remove not the ancient landmark',                  // 4
      'He that oppresseth the poor reproacheth his Maker', // 5 tier one
      'Open thy mouth for the dumb',                      // 6 the commission
      'The heart is deceitful above all things',          // 7 the root
      'he is a new creature',                             // 7 the remedy
      'hath broken down the middle wall of partition between us', // 7 the wall
      'marvel not at the matter',                         // 8 not the last court
      'who hath despised the day of small things?',       // 8 the ordinary person
      'Shall not the Judge of all the earth do right?',   // 9 the Judge
      'a great multitude, which no man could number',     // 9 the terminus
      'to do justly, and to love mercy, and to walk humbly with thy God', // the whole of it
    ];
    for (const band of BANDS) {
      const text = level(band);
      const missing = EVERY_BAND.filter((f) => !text.includes(f));
      expect(missing, `${band} is missing movements:\n${missing.map((m) => ` - ${m}`).join('\n')}`).toEqual([]);
    }
  });
});

describe('the properties that keep a politically live lesson from becoming a jersey', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  const BANDS = ['child', 'youth', 'teen', 'senior'];
  const inEveryBand = (label, test) => {
    const failing = BANDS.filter((b) => !test(level(b)));
    expect(failing, `${label} is missing from: ${failing.join(', ')}`).toEqual([]);
  };

  it('THE STANDARD IS SET ABOVE THE CASE, and it convicts on EVERY side', () => {
    // The clause that makes the lesson trustworthy rather than partisan. A
    // standard that only ever convicts the other side is a loyalty, not a
    // standard -- and the lesson says so at teen and senior in as many words.
    // The child band teaches the SAME clause without the adult idiom: `no
    // matter whose hand is doing it, no matter what colour they are, and no
    // matter which side they are on`. The check watches the teaching -- all
    // three axes (hand, colour, side) -- in whichever register the band uses.
    inEveryBand('the any-hand/any-colour/any-side clause', (t) =>
      /in any hand, of any colou?r, o[nf] any side/.test(t)
      || (/(whose|what) hand/i.test(t) && /colou?r/i.test(t) && /which side/i.test(t)));
    inEveryBand('the refusal of a party as the standard', (t) =>
      /not a (political )?party/i.test(t) && /not a (march|slogan)/i.test(t));
  });

  it('IMPARTIALITY RUNS BOTH DIRECTIONS — the half most advocacy omits', () => {
    // Leviticus 19:15 forbids favouring the POOR as firmly as honouring the
    // MIGHTY, and the poor are named FIRST. Every band must carry the verse AND
    // say out loud that it cuts both ways, or the lesson becomes an argument for
    // one side with a verse attached.
    inEveryBand('Leviticus 19:15 in full', (t) =>
      t.includes('thou shalt not respect the person of the poor, nor honor the person of the mighty'));
    // Senior states it harder than the word 'both' does -- it PROHIBITS
    // favouring the poor 'precisely as firmly as' honouring the mighty -- so the
    // check accepts that construction as well as the both-ways idiom.
    inEveryBand('the both-directions teaching in our own words', (t) =>
      /both (ways|directions)/i.test(t)
      || /(precisely |just )?as firmly as/i.test(t));
  });

  it('THE TWO TIERS OF HONESTY are both present, in every band', () => {
    // Tier one: documented harm stated plainly, never softened (DR-0100 --
    // under-claiming a verified truth is as much a failure as over-claiming).
    inEveryBand('tier one, documented harm named as established fact', (t) =>
      /established historical facts/.test(t));
    // The MECHANISM is what must survive into every band, not the proper noun.
    // A six-year-old is told what the rule DID -- counted people who were denied
    // the vote in order to hand the slave states more seats -- which is the
    // teaching; naming the compromise is not. Senior says 'inflate' in lower
    // case, so the emphasis form cannot be required either.
    inEveryBand('tier one, the Three-Fifths mechanism named specifically', (t) =>
      (/inflate/i.test(t) || /more seats/i.test(t))
      && /(denied|denying|refusing|disenfranchised)/i.test(t));
    // Tier two: the unverified 2026 specifics named as reported -- neither
    // canonised nor dismissed (DR-0076).
    inEveryBand('tier two, carried as reported', (t) =>
      /(AS HE REPORTED|AS THE CREATOR REPORTED|carried as reported)/.test(t));
    inEveryBand('tier two, and NOT dismissed either', (t) =>
      /(neither settle|not settle|will not settle)/.test(t) && /(dismiss|waved away|throw them away)/.test(t));
  });

  it('THE PRINCIPLE DOES NOT NEED THE HEADLINE — the discipline that makes both tiers workable', () => {
    // This is the sentence that lets the lesson be honest about an unverifiable
    // 2026 ruling WITHOUT going quiet on the Word: Isaiah 10 already answered
    // the decree, whoever wrote it. Lose it and the two tiers collapse into
    // either credulity or silence.
    inEveryBand('the principle-not-the-headline discipline', (t) =>
      /(principle|truth) does not (need|require) the headline/.test(t));
    inEveryBand('Isaiah 10 already answered it, whoever wrote it', (t) =>
      /Isaiah 10 (has )?(already )?answered it/.test(t)
      && /no matter who wrote it|whoever wrote it/i.test(t));
  });

  it('THE LANDMARK IS MARKED AS A PICTURE, never a proof-text about modern maps', () => {
    // The analogy is the lesson's most quotable move and therefore its most
    // abusable one. Every band says out loud that it is a picture, so nobody
    // can cite this lesson as Scripture ruling on a district map.
    // Three registers for one disclaimer: 'a PICTURE, not a proof', 'a picture
    // and not a proof-text', 'a picture rather than a proof-text'. All three say
    // the same thing, and the check must not privilege the comma.
    inEveryBand('the analogy marked as a picture', (t) =>
      /a (picture|PICTURE)[,]? (is |remains )?(not|and not|rather than) a proof/i.test(t));
    inEveryBand('and the heart is what is actually cursed', (t) =>
      /heart Yahweh curses is (identically )?the same/i.test(t));
  });

  it('THE DUTY IS COMMISSIONED AND THE SPECIFIC ACTION IS NOT DICTATED', () => {
    // The Word commissions advocacy; this lesson refuses the partisan
    // altar-call. It must never name a march, a fund or a party -- and it must
    // say that it is refusing, so the silence reads as principle and not as
    // timidity.
    inEveryBand('the commission to speak', (t) => t.includes('Open thy mouth for the dumb'));
    inEveryBand('silence is not neutrality', (t) =>
      /not (being )?neutral/i.test(t) || /not constitute neutrality/i.test(t));
    // Senior refuses in the other grammatical direction -- it names what it
    // will NOT name ('it will not name the march, the fund, or the party')
    // rather than listing what it declines to choose for you. Same refusal.
    inEveryBand('the explicit refusal to name march, group or party', (t) =>
      (/which march to join/i.test(t) && /which party to (back|pick|support)/i.test(t))
      || /not name the march, the fund, or the party/i.test(t));
    // The child walks it out 'with Him' rather than 'under the King' -- the
    // same submission in a six-year-old's words.
    inEveryBand('the DUTY given, the HOW left to the reader under the King', (t) =>
      /(DUTY|JOB)/.test(t) && /lawful/i.test(t) && /(under the King|under Him|with Him)/i.test(t));
  });

  it('A POWER-SWAP IS NOT ENOUGH — the root is the heart, and the remedy reaches it', () => {
    // The point at which this lesson stops being a political analysis. If the
    // root is the heart, then handing the monopoly to the other side re-arms the
    // same disease, and the only remedy that reaches it is a new heart.
    inEveryBand('Jeremiah 17:9, the root', (t) => t.includes('The heart is deceitful above all things'));
    // Senior drops the pen image for a stronger one drawn from his own decades:
    // a monopoly 'merely transferred to new management re-arms the identical
    // disease beneath a friendlier name'. Same teaching, different picture -- so
    // the check requires the TEACHING (the sickness survives the transfer) and
    // accepts either image.
    inEveryBand('the transfer of power re-arms the same disease', (t) =>
      /(disease|sickness)/i.test(t)
      && (/(travels|travel).{0,40}whoever/i.test(t) || /re-arms the identical|re-arms the same/i.test(t)));
    inEveryBand('just laws AND changed hearts, both', (t) =>
      /(fair|just) laws? and (for )?changed hearts/i.test(t)
      || /just laws and new hearts together/i.test(t));
    inEveryBand('a just law over an unjust heart is a landmark waiting to be moved', (t) =>
      /landmark (waiting|awaiting)/.test(t));
  });

  it('THE JUDGE GUARANTEES JUSTICE — so the reader labours without despair AND without vengeance', () => {
    inEveryBand('Abraham\'s question', (t) => t.includes('Shall not the Judge of all the earth do right?'));
    inEveryBand('without despair and without vengeance', (t) =>
      /(despair|giving up)/i.test(t) && /(vengeance|revenge)/i.test(t));
    inEveryBand('the every-nation terminus', (t) =>
      t.includes('a great multitude, which no man could number'));
    inEveryBand('we do justice now because that is where history is going', (t) =>
      /history is (already )?(going|headed|travelling)/i.test(t)
      || /direction (in which )?history is already travelling/i.test(t));
  });
});

describe('the senior band is a READER\'S LESSON, not facilitator\'s notes', () => {
  const senior = (() => {
    const i = l.indexOf("senior: '");
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  })();

  it('it does not open by instructing a teacher how to deliver it', () => {
    // It used to begin `Teach this the way the platform exists to teach:` --
    // notes to be delivered, handed to the reader as though he were staff. The
    // twenty-second band in this pass to be turned back toward its reader.
    expect(senior).not.toContain('Teach this the way');
    expect(senior).not.toMatch(/^senior: 'TEACH/i);
  });

  it('it addresses the elder reader and uses the decades he actually has', () => {
    expect(senior).toMatch(/You have watched this argument come around before/);
    expect(senior, 'the long memory named as an asset, not a liability').toMatch(/long memory is not a disadvantage/);
    expect(senior, 'the power-swap proven by his own lifetime').toMatch(/lived long enough to have watched this demonstrated/);
    expect(senior, 'Galatians 6:9 aimed at the long-serving').toMatch(/written for the long-serving/);
    expect(senior, 'the discipline handed on to someone younger').toMatch(/worth handing to anyone younger/);
  });
});

// =============================================================================
// CARRIED FORWARD from the 210-line gate this file replaced.
// =============================================================================
// A NEAR-MISS WORTH RECORDING. This file was written as though L90 had no gate,
// and it overwrote one. The replacement is broader — 54 checks against 12, and
// every property now required in ALL FOUR bands rather than only in the adult
// prose — but "broader" is not "a superset", and four of the old file's checks
// guarded specifics nothing here touched: the case named as reported, the
// early-1900s purge, the meritocracy claim, and the icons the creator invoked.
// Dropping them silently would have been a regression hidden inside an
// improvement. They are restored below, unchanged in substance, and the full
// movement headings are pinned at full length rather than by prefix — the prefix
// form would have let a heading be quietly rewritten past the middle.
describe('the specifics the replaced gate guarded — restored, not dropped', () => {
  // A LESSON-WIDE toContain CANNOT PROVE WHERE A PROPERTY LIVES, and with four
  // full bands now repeating the lesson's phrases it barely proves anything:
  // break the bigIdea's only copy of a caveat and the bands' copies keep the
  // check green. Two of these restored checks were caught doing exactly that
  // (the named 2026 case, and the meritocracy claim), so the two that must hold
  // IN THE bigIdea are scoped to it. The fuller the bands get, the weaker every
  // unscoped contains-check becomes -- that is a property of this whole pass,
  // not a quirk of this lesson.
  const bigIdea = (() => {
    const i = l.indexOf("bigIdea: '");
    const j = l.indexOf("',\n", i);
    return l.slice(i, j).replace(/\\'/g, "'");
  })();
  it('the bigIdea still opens with the standard set above the video', () => {
    expect(l).toContain('THE VIDEO, AND THE STANDARD ABOVE IT');
    expect(l).toContain('no respecter of persons');
    expect(l).toContain('on every side');
  });

  it('the nine movement headings are pinned at FULL length, not by prefix', () => {
    const order = [
      '1) THE IMAGE AND THE ONE BLOOD — WHERE EVERY VOTE\'S WORTH BEGINS',
      '2) YAHWEH IS NO RESPECTER OF PERSONS — SO PARTIALITY IS SIN',
      '3) THE UNRIGHTEOUS DECREE — WHEN THE LAW ITSELF IS THE WEAPON',
      '4) THE ANCIENT LANDMARK — THE OLDEST PICTURE OF A REDRAWN LINE',
      '5) THE DOCUMENTED HISTORY, SPOKEN PLAINLY',
      '6) OPEN THY MOUTH FOR THE VOICELESS — THE COMMAND TO ACT, AND ITS LIMIT',
      '7) THE DEEPER DIAGNOSIS AND THE DEEPER REMEDY — WHY A POWER-SWAP IS NOT ENOUGH',
      '8) THE MYTH OF MERITOCRACY, AND THE DAY OF SMALL THINGS',
      '9) THE JUDGE OF ALL THE EARTH — THE ONE WHO GUARANTEES JUSTICE',
    ];
    // Match against an UNESCAPED view. The source stores \'  for an
    // apostrophe inside a single-quoted JS string, so a full-length pin
    // containing VOTE'S would never match the raw slice -- which is precisely
    // why the replaced gate settled for prefixes. Unescaping lets the pin stay
    // full-length instead.
    const lu = l.replace(/\\'/g, "'");
    let cursor = 0;
    for (const h of order) {
      const at = lu.indexOf(h, cursor);
      expect(at, `movement heading rewritten, out of order, or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('the 2026 case is NAMED and marked unverified IN THE SAME FIELD', () => {
    // Naming it is the honest thing; naming it WITHOUT the non-verification
    // beside it would canonise a ruling this study cannot check (DR-0076).
    // Scoped to the bigIdea, because that is the field that names the case --
    // a caveat living only in the child band does not caveat the bigIdea.
    expect(bigIdea).toContain('Louisiana v. Callais');
    expect(bigIdea).toContain('AS THE CREATOR REPORTED THEM');
    expect(bigIdea).toContain('cannot confirm');
    expect(bigIdea, 'named as reported, and NOT settled as fact').toMatch(/not settle them as fact/);
  });

  it('the rest of the video is answered Word-first, and none of it is dropped', () => {
    expect(l).toContain('complete exclusion');   // the early-1900s purge, named
    expect(bigIdea).toContain('no true meritocracy');  // answered by Ecclesiastes 5:8
    // The icons the creator invoked, answered by the day of small things rather
    // than by pretending he did not invoke them.
    for (const icon of ['Malcolm X', 'Fred Hampton', 'Martin Luther King Jr.']) {
      expect(l, `icon dropped from the lesson: ${icon}`).toContain(icon);
    }
    expect(l).toContain('sanitation workers');
    expect(l).toContain('day of small things');
  });

  it('the partisan call-to-action is refused in the exact words that were pinned', () => {
    expect(l).toContain('will not tell you which march to join, which group to fund, or which party to back');
    expect(l).toContain('under the King');
  });
});

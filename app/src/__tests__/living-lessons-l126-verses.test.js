// =============================================================================
// L126 — Feelings are fruit, not root: belief, the renewed mind, and
// declarations bounded by His Word. Verbatim KJV.
// =============================================================================
// Captured from Darrell's nine messages of 2026-09-05, feeding in a second
// long-form conversation — a host and a guest teacher on emotions, belief
// systems, identity, declarations, reasoning with Yahweh, and honesty in prayer.
//
// The five things this lesson had to get right, and which are pinned here:
//   • THE TEACHER IS NOT NAMED. She is a living author. The lesson affirms her
//     mechanism plainly AND fences one element of her practice; naming a living
//     minister to a public correction is what this series does not do (Titus
//     3:2; the L120/L125 precedent). A privacy gate enforces it structurally.
//   • THE AFFIRMATION IS PLAIN, NOT HEDGED. Her core claim — feelings are the
//     fruit of belief, not an act of will — is Scripture's own picture and
//     order (Luke 6:43-45; Matthew 7:17-18; Romans 15:13; Galatians 5:22-23;
//     John 15:4-5). Under-claiming a true thing is as much a failure of truth
//     as over-claiming a false one (DR-0100).
//   • THE DECLARATION FENCE IS DRAWN BY GRAMMAR, NOT BY SUSPICION. Romans 4:17
//     has YAHWEH as the subject who "calleth those things which be not as
//     though they were"; it says what Abraham believed ABOUT Him and does not
//     transfer the prerogative. What Abraham did is Romans 4:20-21 — he
//     believed "what he had promised". Bounded by Isaiah 55:11, 1 John 5:14,
//     James 4:13,15. The fence aims the practice; it does not gut it, and the
//     lesson affirms speaking the Word aloud first (Joshua 1:8; Deuteronomy
//     6:7; Romans 10:17) so the room does not discard the good with the bounded.
//   • THE SIXTY-DAY CLAIM IS HELD IN TIERS. Repetition really does automate a
//     response — said plainly. No study is attached to a round number we have
//     not verified; honest uncertainty is a required output (DR-0076 §8), and
//     Scripture's "day and night" (Joshua 1:8) plus Hebrews 5:14's senses
//     exercised "by reason of use" is the better instruction anyway.
//   • FEAR IS NOT SHAMED. Psalm 56:3 says WHEN, Mark 9:24 holds both halves in
//     one breath, and Gethsemane speaks the reluctance FIRST (Matthew 26:38-39).
//     A room that leaves believing maturity means never feeling fear will
//     produce performers, which is the opposite of the lesson.
//
// PROVEN-TO-CATCH, from THIS lesson's authoring. The whole-span sweep caught
// TEN real alterations in the first draft — all of one family: the author's own
// framing and emphasis wearing Scripture's quotation marks. Our phrases
// ("who told you that", "what are you trying to prove") read as citations, and
// three emphasis-quotes bent real verses ("I shall YET praise him" capitalises
// a word the KJV has in lowercase; "what he had promised." and "by reason of
// use." append a full stop the verse does not have mid-sentence). Pinned below.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll126-feelings-are-fruit-not-root-belief-the-renewed-mind-and-declarations-bounded-by-his-word';
const start = src.indexOf(`id: '${ID}'`);
// Bound the slice to THIS lesson. It previously ran to the end of the array,
// so every lesson added after L126 was silently swept by L126's gates — which
// is how L127 tripped checks that were never written for it. Each lesson now
// carries its own verses test (see living-lessons-l127-verses.test.js).
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

// Fragment → the verse it is attributed to. Checked against THAT verse.
const ATTRIBUTED = [
  ['For every tree is known by his own fruit. For of thorns men do not gather figs, nor of a bramble bush gather they grapes.', 'Luke', 6, 44],
  ['A good man out of the good treasure of his heart bringeth forth that which is good; and an evil man out of the evil treasure of his heart bringeth forth that which is evil: for of the abundance of the heart his mouth speaketh.', 'Luke', 6, 45],
  ['Even so every good tree bringeth forth good fruit; but a corrupt tree bringeth forth evil fruit.', 'Matthew', 7, 17],
  ['A good tree cannot bring forth evil fruit, neither can a corrupt tree bring forth good fruit.', 'Matthew', 7, 18],
  ['Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.', 'Romans', 15, 13],
  ['For as he thinketh in his heart, so is he', 'Proverbs', 23, 7],
  ['But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,', 'Galatians', 5, 22],
  ['Meekness, temperance: against such there is no law.', 'Galatians', 5, 23],
  ['Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me.', 'John', 15, 4],
  ['I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.', 'John', 15, 5],
  ['for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.', 'Nehemiah', 8, 10],
  ['The heart is deceitful above all things, and desperately wicked: who can know it?', 'Jeremiah', 17, 9],
  ['There is a way which seemeth right unto a man, but the end thereof are the ways of death.', 'Proverbs', 14, 12],
  ['Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.', 'Psalms', 42, 11],
  ['And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.', 'Romans', 12, 2],
  ['And be renewed in the spirit of your mind;', 'Ephesians', 4, 23],
  ['Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;', '2Corinthians', 10, 5],
  ['Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.', 'Philippians', 4, 8],
  ['For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.', 'Hebrews', 4, 12],
  ['Let us search and try our ways, and turn again to the LORD.', 'Lamentations', 3, 40],
  ['Examine yourselves, whether ye be in the faith; prove your own selves.', '2Corinthians', 13, 5],
  ['Search me, O God, and know my heart: try me, and know my thoughts:', 'Psalms', 139, 23],
  ['And see if there be any wicked way in me, and lead me in the way everlasting.', 'Psalms', 139, 24],
  ['The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.', 'Proverbs', 29, 25],
  ['For do I now persuade men, or God? or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ.', 'Galatians', 1, 10],
  ['How can ye believe, which receive honour one of another, and seek not the honour that cometh from God only?', 'John', 5, 44],
  ['For they loved the praise of men more than the praise of God.', 'John', 12, 43],
  ['If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.', '1John', 1, 9],
  ['The LORD is with thee, thou mighty man of valour.', 'Judges', 6, 12],
  ['behold, my family is poor in Manasseh, and I am the least in my father’s house.', 'Judges', 6, 15],
  ['Surely I will be with thee, and thou shalt smite the Midianites as one man.', 'Judges', 6, 16],
  ['Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee', 'Jeremiah', 1, 5],
  ['For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.', 'Ephesians', 2, 10],
  ['I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.', 'Psalms', 139, 14],
  ['for man looketh on the outward appearance, but the LORD looketh on the heart.', '1Samuel', 16, 7],
  ['Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.', '2Corinthians', 5, 17],
  ['We be not able to go up against the people; for they are stronger than we.', 'Numbers', 13, 31],
  ['and we were in our own sight as grasshoppers, and so we were in their sight.', 'Numbers', 13, 33],
  ['Let us go up at once, and possess it; for we are well able to overcome it.', 'Numbers', 13, 30],
  ['Arise and eat; because the journey is too great for thee.', '1Kings', 19, 7],
  ['a still small voice.', '1Kings', 19, 12],
  ['Bless the LORD, O my soul, and forget not all his benefits:', 'Psalms', 103, 2],
  ['I will remember the works of the LORD: surely I will remember thy wonders of old.', 'Psalms', 77, 11],
  ['I will meditate also of all thy work, and talk of thy doings.', 'Psalms', 77, 12],
  ['And thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness', 'Deuteronomy', 8, 2],
  ['This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein', 'Joshua', 1, 8],
  ['But his delight is in the law of the LORD; and in his law doth he meditate day and night.', 'Psalms', 1, 2],
  ['a tree planted by the rivers of water, that bringeth forth his fruit in his season', 'Psalms', 1, 3],
  ['And these words, which I command thee this day, shall be in thine heart:', 'Deuteronomy', 6, 6],
  ['and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.', 'Deuteronomy', 6, 7],
  ['David encouraged himself in the LORD his God.', '1Samuel', 30, 6],
  ['So then faith cometh by hearing, and hearing by the word of God.', 'Romans', 10, 17],
  ['even God, who quickeneth the dead, and calleth those things which be not as though they were.', 'Romans', 4, 17],
  ['He staggered not at the promise of God through unbelief; but was strong in faith, giving glory to God;', 'Romans', 4, 20],
  ['And being fully persuaded that, what he had promised, he was able also to perform.', 'Romans', 4, 21],
  ['So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall accomplish that which I please', 'Isaiah', 55, 11],
  ['if we ask any thing according to his will, he heareth us:', '1John', 5, 14],
  ['Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain:', 'James', 4, 13],
  ['For that ye ought to say, If the Lord will, we shall live, and do this, or that.', 'James', 4, 15],
  ['Now faith is the substance of things hoped for, the evidence of things not seen.', 'Hebrews', 11, 1],
  ['And being not weak in faith, he considered not his own body now dead, when he was about an hundred years old, neither yet the deadness of Sarah’s womb:', 'Romans', 4, 19],
  ['Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.', 'Isaiah', 26, 3],
  ['Set your affection on things above, not on things on the earth.', 'Colossians', 3, 2],
  ['For he that wavereth is like a wave of the sea driven with the wind and tossed.', 'James', 1, 6],
  ['A double minded man is unstable in all his ways.', 'James', 1, 8],
  ['those who by reason of use have their senses exercised to discern both good and evil.', 'Hebrews', 5, 14],
  ['What time I am afraid, I will trust in thee.', 'Psalms', 56, 3],
  ['Lord, I believe; help thou mine unbelief.', 'Mark', 9, 24],
  ['Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', 'Philippians', 4, 6],
  ['And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', 'Philippians', 4, 7],
  ['Casting all your care upon him; for he careth for you.', '1Peter', 5, 7],
  ['Come now, and let us reason together, saith the LORD: though your sins be as scarlet, they shall be as white as snow; though they be red like crimson, they shall be as wool.', 'Isaiah', 1, 18],
  ['Behold now, I have taken upon me to speak unto the Lord, which am but dust and ashes:', 'Genesis', 18, 27],
  ['Shall not the Judge of all the earth do right?', 'Genesis', 18, 25],
  ['Oh let not the Lord be angry, and I will speak yet but this once', 'Genesis', 18, 32],
  ['LORD, why doth thy wrath wax hot against thy people, which thou hast brought forth out of the land of Egypt with great power, and with a mighty hand?', 'Exodus', 32, 11],
  ['shew me now thy way, that I may know thee', 'Exodus', 33, 13],
  ['If thy presence go not with me, carry us not up hence.', 'Exodus', 33, 15],
  ['I beseech thee, shew me thy glory.', 'Exodus', 33, 18],
  ['O LORD, how long shall I cry, and thou wilt not hear!', 'Habakkuk', 1, 2],
  ['I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me, and what I shall answer when I am reproved.', 'Habakkuk', 2, 1],
  ['My wrath is kindled against thee, and against thy two friends: for ye have not spoken of me the thing that is right, as my servant Job hath.', 'Job', 42, 7],
  ['Though he slay me, yet will I trust in him', 'Job', 13, 15],
  ['And he said, Who told thee that thou wast naked?', 'Genesis', 3, 11],
  ['Where art thou?', 'Genesis', 3, 9],
  ['Hagar, Sarai’s maid, whence camest thou? and whither wilt thou go?', 'Genesis', 16, 8],
  ['What doest thou here, Elijah?', '1Kings', 19, 9],
  ['When I kept silence, my bones waxed old through my roaring all the day long.', 'Psalms', 32, 3],
  ['I acknowledged my sin unto thee, and mine iniquity have I not hid.', 'Psalms', 32, 5],
  ['Trust in him at all times; ye people, pour out your heart before him: God is a refuge for us.', 'Psalms', 62, 8],
  ['I poured out my complaint before him; I shewed before him my trouble.', 'Psalms', 142, 2],
  ['How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me?', 'Psalms', 13, 1],
  ['But I have trusted in thy mercy; my heart shall rejoice in thy salvation.', 'Psalms', 13, 5],
  ['My soul is exceeding sorrowful, even unto death', 'Matthew', 26, 38],
  ['O my Father, if it be possible, let this cup pass from me: nevertheless not as I will, but as thou wilt.', 'Matthew', 26, 39],
  ['with strong crying and tears', 'Hebrews', 5, 7],
  ['For we have not an high priest which cannot be touched with the feeling of our infirmities', 'Hebrews', 4, 15],
  ['Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.', 'Hebrews', 4, 16],
  ['The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise.', 'Psalms', 51, 17],
  ['The LORD is nigh unto them that are of a broken heart', 'Psalms', 34, 18],
  ['God is a Spirit: and they that worship him must worship him in spirit and in truth.', 'John', 4, 24],
  ['But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him', '1Corinthians', 2, 14],
  ['The Spirit itself beareth witness with our spirit, that we are the children of God:', 'Romans', 8, 16],
  ['While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal.', '2Corinthians', 4, 18],
  ['Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.', 'Hebrews', 11, 3],
  ['Fear not: for they that be with us are more than they that be with them.', '2Kings', 6, 16],
  ['LORD, I pray thee, open his eyes, that he may see. And the LORD opened the eyes of the young man; and he saw: and, behold, the mountain was full of horses and chariots of fire round about Elisha.', '2Kings', 6, 17],
  ['even so we also should walk in newness of life.', 'Romans', 6, 4],
  ['Likewise reckon ye also yourselves to be dead indeed unto sin, but alive unto God through Jesus Christ our Lord.', 'Romans', 6, 11],
  ['If ye then be risen with Christ, seek those things which are above, where Christ sitteth on the right hand of God.', 'Colossians', 3, 1],
  ['And hath raised us up together, and made us sit together in heavenly places in Christ Jesus:', 'Ephesians', 2, 6],
  ['A son honoureth his father, and a servant his master: if then I be a father, where is mine honour?', 'Malachi', 1, 6],
  ['Give unto the LORD the glory due unto his name; worship the LORD in the beauty of holiness.', 'Psalms', 29, 2],
  ['Bless the LORD, O my soul: and all that is within me, bless his holy name.', 'Psalms', 103, 1],
  ['And the very God of peace sanctify you wholly; and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ.', '1Thessalonians', 5, 23],
  ['Behold the Lamb of God, which taketh away the sin of the world.', 'John', 1, 29],
  ['Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.', 'Hebrews', 1, 8],
];

describe('L126 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Romans 15:13; Luke 6:45; Romans 12:2'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L126 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('every lesson id in the series is unique', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size, 'duplicate lesson id in the catalog').toBe(ids.length);
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

  it('teaches the whole arc in order', () => {
    const order = [
      '1) WHAT DARRELL BROUGHT, AND HOW WE WEIGH IT',
      '2) FEELINGS ARE FRUIT, NOT ROOT',
      '3) YOU CANNOT WORK UP JOY - AND SCRIPTURE NEVER ASKS YOU TO',
      '4) EMOTIONS VALIDATE WHAT YOU BELIEVE, NOT WHAT IS TRUE',
      '5) YOU ARE NOT YOUR THOUGHTS - THE OLD PROGRAM AND THE RENEWED MIND',
      '6) QUESTION THE REACTION - THE WORD IS THE INSTRUMENT',
      '7) WHAT ARE YOU TRYING TO PROVE',
      '8) DEFINED BY DESIGN, NOT BY STATE',
      '9) WHEN A LIE IS THREATENED, THE BODY DEFENDS IT',
      '10) REHEARSE THE TRUTH - AND WRITE THE EVIDENCE DOWN',
      '11) DECLARATIONS, BOUNDED - DECLARE WHAT HE SAID',
      '12) FAITH IS VISIONARY, AND ITS SUBSTANCE IS HIS PROMISE',
      '13) SIXTY DAYS - WHAT IS DOCUMENTED, AND WHAT IS NOT',
      '14) FEAR WILL STILL ARISE - PROCESS IT, DO NOT PRETEND',
      '15) COME NOW, AND LET US REASON TOGETHER',
      '16) WHO TOLD THEE THAT - THE QUESTION THAT FINDS THE LIE',
      '17) HONESTY IS NOT IRREVERENCE - AND SILENCE HAS A PRICE',
      '18) SPIRIT TO SPIRIT - AND THE UNSEEN IS THE MORE SUBSTANTIAL',
      '19) FROM NEED TO HONOUR - AND THE FEAR YOU DEAL WITH FIRST',
      '20) WHOLE SPIRIT AND SOUL AND BODY - THE UNITY ALL OF THIS IS FOR',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });
});

describe('the mechanism is AFFIRMED plainly — under-claiming a true thing is also a failure (DR-0100)', () => {
  it('says outright that Scripture agrees, and that the affirmation is not hedged', () => {
    expect(l).toMatch(/affirm the first part plainly and without hedging/);
    expect(l, 'the thesis verse').toContain('Now the God of hope fill you with all joy and peace in believing');
    expect(l, 'IN BELIEVING is the route').toMatch(/IN BELIEVING/);
    expect(l).toContain('For as he thinketh in his heart, so is he');
  });

  it('files joy as FRUIT and gives the reason a branch cannot self-produce', () => {
    expect(l).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,');
    expect(l).toContain('As the branch cannot bear fruit of itself, except it abide in the vine');
    expect(l, 'the pastoral sentence').toMatch(/branch trying to be a root/);
  });

  it('says a strong feeling proves what you BELIEVE, not what is true', () => {
    expect(l).toContain('The heart is deceitful above all things, and desperately wicked: who can know it?');
    expect(l).toContain('There is a way which seemeth right unto a man, but the end thereof are the ways of death.');
    expect(l, 'SEEMETH is the warning').toMatch(/SEEMETH right/);
    expect(l, 'he speaks TO his soul, not FROM it').toMatch(/TO his soul/);
    expect(l, 'and does not deny the state').toMatch(/not denying the state|does not deny the state/);
  });

  it('makes the logical point that you cannot arrest what you ARE', () => {
    expect(l).toContain('bringing into captivity every thought to the obedience of Christ;');
    expect(l).toMatch(/cannot take captive something you (believe you )?ARE/);
    expect(l).toContain('be ye transformed by the renewing of your mind');
  });
});

describe('THE FENCE — declarations bounded by grammar, and the practice affirmed first', () => {
  it('affirms speaking the Word aloud BEFORE fencing it', () => {
    expect(l).toContain('So then faith cometh by hearing, and hearing by the word of God.');
    expect(l, 'affirm first is explicit').toMatch(/AFFIRM FIRST/);
    expect(l, 'the fence does not gut the practice').toMatch(/It aims it|aim rather than as loss|does not weaken/);
  });

  it('reads Romans 4:17 by its grammar — Yahweh is the subject', () => {
    expect(l).toContain('even God, who quickeneth the dead, and calleth those things which be not as though they were.');
    expect(l, 'HE calls them, not the believer').toMatch(/HE calls things that are not as though they were/);
    expect(l, 'it does not transfer the prerogative').toMatch(/does not hand the believer the same creative prerogative|does not transfer the prerogative/);
  });

  it('shows what Abraham actually did, and bounds the practice', () => {
    expect(l).toContain('And being fully persuaded that, what he had promised, he was able also to perform.');
    expect(l, 'the rule').toMatch(/DECLARE WHAT HE SAID, not what you want/);
    expect(l).toContain('it shall not return unto me void, but it shall accomplish that which I please');
    expect(l).toContain('if we ask any thing according to his will, he heareth us:');
    expect(l).toContain('For that ye ought to say, If the Lord will, we shall live, and do this, or that.');
  });

  it('separates faith from pretending by OBJECT, not by denial of facts', () => {
    expect(l).toContain('he considered not his own body now dead');
    expect(l, 'he declined to weigh them, he did not deny them').toMatch(/DECLINED TO WEIGH THEM|declined to WEIGH them/);
    expect(l, 'the difference is of object').toMatch(/difference of object/);
  });
});

describe('THE SIXTY-DAY CLAIM — two tiers, neither collapsed (DR-0076 / DR-0100)', () => {
  it('states the documented mechanism plainly', () => {
    expect(l).toMatch(/WHAT IS DOCUMENTED AND SHOULD BE SAID PLAINLY/);
    expect(l).toMatch(/repetition really does change what a brain does automatically/);
  });

  it('refuses to attach a study to a round number, and says so out loud', () => {
    expect(l).toMatch(/WHAT THIS LESSON DOES NOT CLAIM/);
    expect(l).toMatch(/not attaching a study to sixty days/);
    expect(l, 'honest uncertainty is stated, not papered over').toMatch(/we have not verified a citation/);
    expect(l, 'no number wearing a lab coat').toMatch(/wearing a lab coat/);
  });

  it('gives Scripture’s better instruction — a practice, not a countdown', () => {
    expect(l).toContain('those who by reason of use have their senses exercised to discern both good and evil.');
    expect(l).toMatch(/Do it day and night and stop counting|Practise, and stop counting|Practice, not a countdown/);
  });
});

describe('reasoning with Yahweh, and His own first question', () => {
  it('opens the invitation and shows who it is addressed to', () => {
    expect(l).toContain('Come now, and let us reason together, saith the LORD: though your sins be as scarlet');
    expect(l, 'the reasoning is the way IN').toMatch(/the way IN, not a reward/);
  });

  it('stacks the witnesses who actually did it, including the one who stood for the reproof', () => {
    expect(l).toContain('Behold now, I have taken upon me to speak unto the Lord, which am but dust and ashes:');
    expect(l).toContain('LORD, why doth thy wrath wax hot against thy people');
    expect(l).toContain('I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me, and what I shall answer when I am reproved.');
    expect(l, 'reasoning is not venting').toMatch(/difference between reasoning and venting/);
    expect(l).toContain('ye have not spoken of me the thing that is right, as my servant Job hath.');
    expect(l, 'candour is not irreverence').toMatch(/candour is (not )?irreverence/);
  });

  it('locates "who told you that" in Genesis 3:11 as His own question', () => {
    expect(l).toContain('And he said, Who told thee that thou wast naked?');
    expect(l).toContain('Where art thou?');
    expect(l, 'He asked for the SOURCE').toMatch(/asked for the SOURCE/);
    expect(l).toContain('What doest thou here, Elijah?');
  });

  it('puts a price on stuffing it, and keeps honesty accountable', () => {
    expect(l).toContain('When I kept silence, my bones waxed old through my roaring all the day long.');
    expect(l).toContain('Trust in him at all times; ye people, pour out your heart before him: God is a refuge for us.');
    expect(l).toContain('How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me?');
    expect(l, 'Gethsemane spoke reluctance first').toContain('My soul is exceeding sorrowful, even unto death');
    expect(l).toContain('O my Father, if it be possible, let this cup pass from me: nevertheless not as I will, but as thou wilt.');
    expect(l, 'both sinless').toMatch(/both were sinless|both sinless/);
    expect(l, 'the boundary').toMatch(/Honest is not the same as unaccountable|honest is not unaccountable/i);
  });
});

describe('spirit-to-spirit, substance, and the unity it is all for', () => {
  it('grounds the faculty and the substance claim in the text', () => {
    expect(l).toContain('God is a Spirit: and they that worship him must worship him in spirit and in truth.');
    expect(l).toContain('The Spirit itself beareth witness with our spirit, that we are the children of God:');
    expect(l).toContain('for the things which are seen are temporal; but the things which are not seen are eternal.');
    expect(l).toContain('Through faith we understand that the worlds were framed by the word of God');
  });

  it('stages the demonstration and ties it back to the thesis', () => {
    expect(l).toContain('behold, the mountain was full of horses and chariots of fire round about Elisha.');
    expect(l, 'nothing changed but the eyes').toMatch(/the eyes did|Nothing about the situation changed/);
    expect(l, 'the chariots were already there').toMatch(/were there the whole time/);
    expect(l, 'same shape as the thesis').toMatch(/the root determined the report|root decided the report/);
  });

  it('holds BOTH halves of the resurrected-life framing so nobody hears half a gospel', () => {
    expect(l).toContain('even so we also should walk in newness of life.');
    expect(l).toContain('And hath raised us up together, and made us sit together in heavenly places in Christ Jesus:');
    expect(l, 'the daily dying is not cancelled').toMatch(/daily dying is real and is never cancelled|daily dying is not cancelled/);
  });

  it('names the unity by its parts and makes even that FRUIT', () => {
    expect(l).toContain('and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ.');
    expect(l).toContain('A double minded man is unstable in all his ways.');
    expect(l, 'unity is not achieved by deciding to be unified').toMatch(/not achieved by deciding to be unified/);
  });

  it('keeps honour-before-the-list from becoming a gate', () => {
    expect(l).toContain('A son honoureth his father, and a servant his master: if then I be a father, where is mine honour?');
    expect(l).toContain('Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.');
    expect(l, 'wisdom, not a gate').toMatch(/is wisdom, not a gate|never a gate/);
  });
});

describe('it refuses to shame fear', () => {
  it('says WHEN, not if — and keeps the honest prayer', () => {
    expect(l).toContain('What time I am afraid, I will trust in thee.');
    expect(l, 'WHEN not if').toMatch(/WHEN, not if/);
    expect(l).toContain('Lord, I believe; help thou mine unbelief.');
    expect(l, 'and the child was healed anyway').toMatch(/healed anyway/);
    expect(l).toContain('And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.');
    expect(l, 'received, not manufactured').toMatch(/received, not manufactured|is not manufactured/);
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

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toMatch(/Eternal Son of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('PRIVACY gate — the teaching is weighed, never the woman', () => {
  it('states the non-naming commitment explicitly', () => {
    expect(l).toMatch(/she is not named here/);
    expect(l).toMatch(/is NOT named here/);
    expect(l).toMatch(/we weigh teaching, never the woman/);
  });

  it('carries no surname, no ministry name, no channel, no contact detail', () => {
    expect(l, 'an email address').not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(l, 'a URL').not.toMatch(/https?:\/\//);
    for (const token of ['Backlund', 'Wendy', 'Welch', 'Taylor', 'Bethel', 'YouTube', 'podcast', 'Victorious Emotions']) {
      expect(l, `identifying token: ${token}`).not.toContain(token);
    }
  });

  it('credits her where she is right, and fences only what needs fencing', () => {
    expect(l).toMatch(/the teacher/);
    expect(l, 'the mechanism is credited').toMatch(/Scripture agrees with her so thoroughly|her mechanism is unusually sound|unusually good on mechanism/);
    expect(l, 'exactly ONE thing is fenced').toMatch(/On ONE point/);
  });
});

describe('every attributed fragment is letter-for-letter KJV, in the verse it is hung on', () => {
  for (const [frag, book, ch, v] of ATTRIBUTED) {
    it(`${book} ${ch}:${v} — "${frag.slice(0, 44)}${frag.length > 44 ? '…' : ''}"`, () => {
      expect(l, 'the lesson must actually contain the fragment').toContain(frag);
      expect(verse(book, ch, v), 'the fragment must be in THAT verse').toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(250);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the EMPHASIS-QUOTE family this authoring actually produced', () => {
    // Ten real alterations, all of one family: our own framing and our own
    // emphasis wearing Scripture's quotation marks.
    // (a) our framing, which would read as a citation
    for (const ours of ['question your reactions', 'what are you trying to prove', 'who told you that', 'what am I trying to prove, and to whom']) {
      expect(WHOLE_KJV.includes(ours), `our framing must not be quotable as Scripture: ${ours}`).toBe(false);
      expect(l, `and must not still wear quotation marks: ${ours}`).not.toContain(`"${ours}"`);
    }
    // (b) emphasis capitalisation bending a real verse — KJV has lowercase "yet"
    expect(WHOLE_KJV.includes('I shall YET praise him')).toBe(false);
    expect(WHOLE_KJV.includes('for I shall yet praise him')).toBe(true);
    expect(l).not.toContain('"I shall YET praise him');
    // (c) an appended full stop the verse does not have mid-sentence
    expect(WHOLE_KJV.includes('what he had promised.')).toBe(false);
    expect(WHOLE_KJV.includes('what he had promised, he was able also to perform.')).toBe(true);
    expect(WHOLE_KJV.includes('by reason of use.')).toBe(false);
    expect(WHOLE_KJV.includes('by reason of use have their senses exercised')).toBe(true);
  });

  it('is PROVEN-TO-CATCH against wrong-reference and cross-verse joins from this lesson’s texts', () => {
    // Psalm 42:11 and 43:5 differ by two words; the lesson cites 42:11
    expect(WHOLE_KJV.includes('why art thou disquieted in me? hope thou in God: for I shall yet praise him, who is the health')).toBe(false);
    expect(verse('Psalms', 42, 11)).toContain('disquieted within me');
    // Genesis 3:11 KJV reads "Who told thee", not "Who told you"
    expect(WHOLE_KJV.includes('Who told you that thou wast naked')).toBe(false);
    expect(WHOLE_KJV.includes('Who told thee that thou wast naked')).toBe(true);
    // cross-verse joins delete a verse boundary silently
    expect(WHOLE_KJV.includes('my bones waxed old through my roaring all the day long. I acknowledged my sin unto thee')).toBe(false);
    expect(WHOLE_KJV.includes('and I pray God your whole spirit and soul and body be preserved blameless')).toBe(true);
  });

  it('never lets our own framing wear Scripture’s quotation marks', () => {
    for (const ours of [
      'feelings are fruit, not root',
      'the old software',
      'inner unity',
      'declare what he said, not what you want',
      'a branch trying to be a root',
    ]) {
      expect(WHOLE_KJV.includes(ours), `our framing must not be quotable as Scripture: ${ours}`).toBe(false);
    }
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the fruit picture and the abide answer', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the tree/fruit picture`).toMatch(/known by his own fruit|fruit of the Spirit|good tree/);
      expect(t, `${band} carries abide rather than strain`).toMatch(/Abide in me|abide in the vine|John 15:4/);
    }
  });

  it('each band teaches speaking to your own soul rather than from it', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries Psalm 42`).toMatch(/Why art thou cast down, O my soul|Psalm 42:11/);
    }
  });

  it('each band carries the reasoning invitation and the who-told-thee question', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries Isaiah 1:18`).toMatch(/let us reason together|Isaiah 1:18/);
      expect(t, `${band} carries Genesis 3:11`).toMatch(/Who told thee that thou wast naked|Genesis 3:11/);
    }
  });

  it('teen and senior carry the declaration fence and the identity-by-design case', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the Romans 4:17 grammar`).toMatch(/Romans 4:17|calleth those things which be not/);
      expect(t, `${band} carries Gideon greeted before obedience`).toMatch(/thou mighty man of valour|Judges 6:12/);
      expect(t, `${band} carries the chariots`).toMatch(/chariots of fire|2 Kings 6:1[67]/);
    }
  });

  it('the senior band carries source discipline and the three pastoral failure modes', () => {
    const t = level('senior');
    expect(t).toMatch(/SOURCE DISCIPLINE FIRST/);
    expect(t, 'the strainer').toMatch(/STRAINER/);
    expect(t, 'the performer').toMatch(/PERFORMER/);
    expect(t, 'the declarer, handed the fence as aim not loss').toMatch(/DECLARER/);
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(800);
    expect(child, 'no clinical or adult framing for a small child').not.toMatch(/subconscious|neural|self-sabotage|declaration/i);
    expect(child, 'the child is given the fruit picture').toMatch(/fruit/);
    expect(child, 'the child is told he may be honest with Him').toContain('I poured out my complaint before him; I shewed before him my trouble.');
    expect(child, 'the child gets the who-told-you question for a mean thought').toContain('Who told thee that thou wast naked?');
    expect(child, 'and fear is not shamed').toContain('What time I am afraid, I will trust in thee.');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Romans', 15, 13)).toContain('fill you with all joy and peace in believing');
    expect(verse('Galatians', 5, 22)).toContain('the fruit of the Spirit is love, joy, peace');
    expect(verse('John', 15, 4)).toContain('As the branch cannot bear fruit of itself');
    expect(verse('Isaiah', 1, 18)).toContain('Come now, and let us reason together, saith the LORD');
    expect(verse('Genesis', 3, 11)).toContain('Who told thee that thou wast naked?');
    expect(verse('Job', 42, 7)).toContain('as my servant Job hath');
    expect(verse('Psalms', 32, 3)).toContain('my bones waxed old');
    expect(verse('Judges', 6, 12)).toContain('thou mighty man of valour');
    expect(verse('Numbers', 13, 33)).toContain('in our own sight as grasshoppers');
    expect(verse('2Kings', 6, 17)).toContain('chariots of fire round about Elisha');
    expect(verse('1Thessalonians', 5, 23)).toContain('whole spirit and soul and body');
  });

  it('Romans 4:17 has Yahweh as the subject of the calling — the ground of the fence', () => {
    const r = verse('Romans', 4, 17);
    expect(r).toContain('even God, who quickeneth the dead, and calleth those things which be not as though they were.');
    // the verse never makes the believer the one who calls
    expect(r).not.toMatch(/thou shalt call those things/);
    expect(verse('Romans', 4, 21)).toContain('what he had promised, he was able also to perform');
  });
});

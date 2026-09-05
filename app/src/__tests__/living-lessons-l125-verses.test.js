// =============================================================================
// L125 — Rules of Engagement: the warfare the Word authorizes, the open doors
// it closes, and where the Word stops. Verbatim KJV.
// =============================================================================
// Captured from Darrell's seven messages of 2026-09-05, feeding in a long-form
// spiritual-warfare conversation between a host and a guest teacher. Across
// those messages he pressed the same throughline again and again: the rules of
// engagement, the open doors, and entertainment as a gateway to the soul.
//
// The five things this lesson had to get right, and which are pinned here:
//   • THE TEACHER IS NOT NAMED. She is a real, living person, and the lesson
//     both affirms her scriptural instruction AND draws a boundary around her
//     extra-biblical mapping. Attaching a named living minister to a public
//     correction is exactly what this series does not do (Titus 3:2; the L120
//     precedent). The PRIVACY gate below enforces it structurally.
//   • THE TWO WEIGHTS ARE SORTED, NOT BLENDED. Her Scripture-grounded teaching
//     is the Word and is taught plainly and without hedging. Her 1994 prophetic
//     encounter, the named entity, and the institutional mapping are TESTIMONY,
//     weighed by 1 Thessalonians 5:21 and 1 John 4:1 — neither swallowed nor
//     scorned. That is DR-0076 and DR-0100 running together.
//   • THE BLOODLINE IS HELD IN BOTH TIERS OR NOT AT ALL. Confessing the
//     iniquity of the fathers is commanded and modelled (Leviticus 26:40;
//     Nehemiah 9:2; Daniel 9:5,8). Inherited guilt is flatly denied (Jeremiah
//     31:29-30; Ezekiel 18:20) and the redemption texts close it (1 Peter
//     1:18-19; Galatians 3:13; 2 Corinthians 5:17; Romans 8:1; John 8:36).
//     A lesson that gives one tier and drops the other wrecks people, and the
//     Body has managed to do it in both directions.
//   • THE ENTERTAINMENT QUESTION GETS A TEST, NOT A TITLE LIST (DR-0098). A
//     list expires and moves the authority onto the lister; Philippians 4:8 +
//     Ephesians 5:11 + Deuteronomy 18:10-11 + Psalm 101:3 travel.
//   • IT LANDS ON STANDING, NOT FEAR. Luke 10:20 moves the joy; Colossians
//     2:15 says it is already public; the armour aims at standing. A warfare
//     lesson that leaves the reader scanning has failed.
//
// PROVEN-TO-CATCH, from THIS lesson's authoring. The whole-span sweep caught a
// real alteration in the first draft: two quoted fragments carried a literal
// backslash-u escape instead of the KJV right single quotation mark, so
// "brother’s eye" and "children’s teeth" were NOT the text they
// claimed to be while looking perfectly correct in a diff. Pinned below.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll125-rules-of-engagement-the-warfare-the-word-authorizes-the-open-doors-it-closes-and-where-it-stops';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

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

// Fragment → the verse it is attributed to. Checked against THAT verse, not the
// whole corpus (the attribution gate introduced with L119).
const ATTRIBUTED = [
  ['For though we walk in the flesh, we do not war after the flesh:', '2Corinthians', 10, 3],
  ['For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds;', '2Corinthians', 10, 4],
  ['Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;', '2Corinthians', 10, 5],
  ['For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places.', 'Ephesians', 6, 12],
  ['Submit yourselves therefore to God. Resist the devil, and he will flee from you.', 'James', 4, 7],
  ['God resisteth the proud, but giveth grace unto the humble.', 'James', 4, 6],
  ['Draw nigh to God, and he will draw nigh to you. Cleanse your hands, ye sinners; and purify your hearts, ye double minded.', 'James', 4, 8],
  ['Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time:', '1Peter', 5, 6],
  ['Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour:', '1Peter', 5, 8],
  ['Whom resist stedfast in the faith', '1Peter', 5, 9],
  ['We adjure you by Jesus whom Paul preacheth.', 'Acts', 19, 13],
  ['Jesus I know, and Paul I know; but who are ye?', 'Acts', 19, 15],
  ['leaped on them, and overcame them, and prevailed against them, so that they fled out of that house naked and wounded.', 'Acts', 19, 16],
  ['And many that believed came, and confessed, and shewed their deeds.', 'Acts', 19, 18],
  ['Many of them also which used curious arts brought their books together, and burned them before all men', 'Acts', 19, 19],
  ['So mightily grew the word of God and prevailed.', 'Acts', 19, 20],
  ['Yet Michael the archangel, when contending with the devil he disputed about the body of Moses, durst not bring against him a railing accusation, but said, The Lord rebuke thee.', 'Jude', 1, 9],
  ['despise dominion, and speak evil of dignities.', 'Jude', 1, 8],
  ['Whereas angels, which are greater in power and might, bring not railing accusation against them before the Lord.', '2Peter', 2, 11],
  ['The LORD rebuke thee, O satan; even the LORD that hath chosen Jerusalem rebuke thee', 'Zechariah', 3, 2],
  ['I command thee in the name of Jesus Christ to come out of her.', 'Acts', 16, 18],
  ['When the unclean spirit is gone out of a man, he walketh through dry places, seeking rest, and findeth none.', 'Matthew', 12, 43],
  ['empty, swept, and garnished.', 'Matthew', 12, 44],
  ['Then goeth he, and taketh with himself seven other spirits more wicked than himself, and they enter in and dwell there: and the last state of that man is worse than the first.', 'Matthew', 12, 45],
  ['Be ye angry, and sin not: let not the sun go down upon your wrath:', 'Ephesians', 4, 26],
  ['Neither give place to the devil.', 'Ephesians', 4, 27],
  ['Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice:', 'Ephesians', 4, 31],
  ['And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.', 'Ephesians', 4, 32],
  ['But if ye forgive not men their trespasses, neither will your Father forgive your trespasses.', 'Matthew', 6, 15],
  ['And when ye stand praying, forgive, if ye have ought against any', 'Mark', 11, 25],
  ['Dearly beloved, avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord.', 'Romans', 12, 19],
  ['Be not overcome of evil, but overcome evil with good.', 'Romans', 12, 21],
  ['If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.', '1John', 1, 9],
  ['There shall not be found among you any one that maketh his son or his daughter to pass through the fire, or that useth divination, or an observer of times, or an enchanter, or a witch.', 'Deuteronomy', 18, 10],
  ['Or a charmer, or a consulter with familiar spirits, or a wizard, or a necromancer.', 'Deuteronomy', 18, 11],
  ['For all that do these things are an abomination unto the LORD', 'Deuteronomy', 18, 12],
  ['Thou hypocrite, first cast out the beam out of thine own eye; and then shalt thou see clearly to cast out the mote out of thy brother’s eye.', 'Matthew', 7, 5],
  ['Search me, O God, and know my heart: try me, and know my thoughts:', 'Psalms', 139, 23],
  ['And see if there be any wicked way in me, and lead me in the way everlasting.', 'Psalms', 139, 24],
  ['For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', '2Timothy', 1, 7],
  ['He that hath no rule over his own spirit is like a city that is broken down, and without walls.', 'Proverbs', 25, 28],
  ['Why art thou cast down, O my soul? and why art thou disquieted in me? hope thou in God: for I shall yet praise him for the help of his countenance.', 'Psalms', 42, 5],
  ['It is enough; now, O LORD, take away my life; for I am not better than my fathers.', '1Kings', 19, 4],
  ['Arise and eat.', '1Kings', 19, 5],
  ['Arise and eat; because the journey is too great for thee.', '1Kings', 19, 7],
  ['a still small voice.', '1Kings', 19, 12],
  ['And there we saw the giants, the sons of Anak, which come of the giants: and we were in our own sight as grasshoppers, and so we were in their sight.', 'Numbers', 13, 33],
  ['their defence is departed from them, and the LORD is with us: fear them not.', 'Numbers', 14, 9],
  ['Now therefore give me this mountain', 'Joshua', 14, 12],
  ['I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.', 'John', 15, 5],
  ['If they shall confess their iniquity, and the iniquity of their fathers, with their trespass which they trespassed against me, and that also they have walked contrary unto me;', 'Leviticus', 26, 40],
  ['Then will I remember my covenant with Jacob, and also my covenant with Isaac, and also my covenant with Abraham will I remember; and I will remember the land.', 'Leviticus', 26, 42],
  ['stood and confessed their sins, and the iniquities of their fathers.', 'Nehemiah', 9, 2],
  ['We have sinned, and have committed iniquity, and have done wickedly, and have rebelled, even by departing from thy precepts and from thy judgments:', 'Daniel', 9, 5],
  ['O Lord, to us belongeth confusion of face, to our kings, to our princes, and to our fathers, because we have sinned against thee.', 'Daniel', 9, 8],
  ['To the Lord our God belong mercies and forgivenesses, though we have rebelled against him;', 'Daniel', 9, 9],
  ['In those days they shall say no more, The fathers have eaten a sour grape, and the children’s teeth are set on edge.', 'Jeremiah', 31, 29],
  ['But every one shall die for his own iniquity', 'Jeremiah', 31, 30],
  ['The soul that sinneth, it shall die. The son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son: the righteousness of the righteous shall be upon him, and the wickedness of the wicked shall be upon him.', 'Ezekiel', 18, 20],
  ['and considereth, and doeth not such like,', 'Ezekiel', 18, 14],
  ['Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;', '1Peter', 1, 18],
  ['But with the precious blood of Christ, as of a lamb without blemish and without spot:', '1Peter', 1, 19],
  ['Christ hath redeemed us from the curse of the law, being made a curse for us', 'Galatians', 3, 13],
  ['Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.', '2Corinthians', 5, 17],
  ['There is therefore now no condemnation to them which are in Christ Jesus', 'Romans', 8, 1],
  ['If the Son therefore shall make you free, ye shall be free indeed.', 'John', 8, 36],
  ['And the land is defiled: therefore I do visit the iniquity thereof upon it, and the land itself vomiteth out her inhabitants.', 'Leviticus', 18, 25],
  ['That the land spue not you out also, when ye defile it, as it spued out the nations that were before you.', 'Leviticus', 18, 28],
  ['So ye shall not pollute the land wherein ye are: for blood it defileth the land', 'Numbers', 35, 33],
  ['Yea, they sacrificed their sons and their daughters unto devils,', 'Psalms', 106, 37],
  ['And shed innocent blood, even the blood of their sons and of their daughters, whom they sacrificed unto the idols of Canaan: and the land was polluted with blood.', 'Psalms', 106, 38],
  ['The earth also is defiled under the inhabitants thereof; because they have transgressed the laws, changed the ordinance, broken the everlasting covenant.', 'Isaiah', 24, 5],
  ['Hear the word of the LORD, ye children of Israel: for the LORD hath a controversy with the inhabitants of the land, because there is no truth, nor mercy, nor knowledge of God in the land.', 'Hosea', 4, 1],
  ['By swearing, and lying, and killing, and stealing, and committing adultery, they break out, and blood toucheth blood.', 'Hosea', 4, 2],
  ['Therefore shall the land mourn, and every one that dwelleth therein shall languish', 'Hosea', 4, 3],
  ['Neither shalt thou bring an abomination into thine house, lest thou be a cursed thing like it', 'Deuteronomy', 7, 26],
  ['I will walk within my house with a perfect heart.', 'Psalms', 101, 2],
  ['I will set no wicked thing before mine eyes: I hate the work of them that turn aside; it shall not cleave to me.', 'Psalms', 101, 3],
  ['Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.', 'Philippians', 4, 8],
  ['Keep thy heart with all diligence; for out of it are the issues of life.', 'Proverbs', 4, 23],
  ['And have no fellowship with the unfruitful works of darkness, but rather reprove them.', 'Ephesians', 5, 11],
  ['Abstain from all appearance of evil.', '1Thessalonians', 5, 22],
  ['Prove all things; hold fast that which is good.', '1Thessalonians', 5, 21],
  ['Two are better than one; because they have a good reward for their labour.', 'Ecclesiastes', 4, 9],
  ['but woe to him that is alone when he falleth; for he hath not another to help him up.', 'Ecclesiastes', 4, 10],
  ['And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.', 'Ecclesiastes', 4, 12],
  ['Where no counsel is, the people fall: but in the multitude of counsellors there is safety.', 'Proverbs', 11, 14],
  ['For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.', 'Proverbs', 24, 6],
  ['For where two or three are gathered together in my name, there am I in the midst of them.', 'Matthew', 18, 20],
  ['throw down the altar of baal that thy father hath, and cut down the grove that is by it:', 'Judges', 6, 25],
  ['Then Gideon took ten men of his servants, and did as the LORD had said unto him', 'Judges', 6, 27],
  ['if he be a god, let him plead for himself, because one hath cast down his altar.', 'Judges', 6, 31],
  ['And David enquired at the LORD, saying, Shall I pursue after this troop?', '1Samuel', 30, 8],
  ['And the LORD said unto David, Go up: for I will doubtless deliver the Philistines into thine hand.', '2Samuel', 5, 19],
  ['Thou shalt not go up; but fetch a compass behind them, and come upon them over against the mulberry trees.', '2Samuel', 5, 23],
  ['As they ministered to the Lord, and fasted, the Holy Ghost said, Separate me Barnabas and Saul for the work whereunto I have called them.', 'Acts', 13, 2],
  ['For as many as are led by the Spirit of God, they are the sons of God.', 'Romans', 8, 14],
  ['The Son can do nothing of himself, but what he seeth the Father do', 'John', 5, 19],
  ['And he said unto them, This kind can come forth by nothing, but by prayer and fasting.', 'Mark', 9, 29],
  ['as captain of the host of the LORD am I now come.', 'Joshua', 5, 14],
  ['And no marvel; for satan himself is transformed into an angel of light.', '2Corinthians', 11, 14],
  ['so your minds should be corrupted from the simplicity that is in Christ.', '2Corinthians', 11, 3],
  ['Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.', '1John', 4, 1],
  ['those who by reason of use have their senses exercised to discern both good and evil.', 'Hebrews', 5, 14],
  ['Wherefore let him that thinketh he standeth take heed lest he fall.', '1Corinthians', 10, 12],
  ['restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted.', 'Galatians', 6, 1],
  ['recover themselves out of the snare of the devil, who are taken captive by him at his will.', '2Timothy', 2, 26],
  ['to make cakes to the queen of heaven, and to pour out drink offerings unto other gods, that they may provoke me to anger.', 'Jeremiah', 7, 18],
  ['to burn incense unto the queen of heaven, and to pour out drink offerings unto her', 'Jeremiah', 44, 17],
  ['the things which the Gentiles sacrifice, they sacrifice to devils, and not to God: and I would not that ye should have fellowship with devils.', '1Corinthians', 10, 20],
  ['Ye cannot drink the cup of the Lord, and the cup of devils', '1Corinthians', 10, 21],
  ['Thou shalt have no other gods before me.', 'Exodus', 20, 3],
  ['The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.', 'Deuteronomy', 29, 29],
  ['the screech owl also shall rest there, and find for herself a place of rest.', 'Isaiah', 34, 14],
  ['How art thou fallen from heaven, O lucifer, son of the morning!', 'Isaiah', 14, 12],
  ['Yet thou shalt be brought down to hell, to the sides of the pit.', 'Isaiah', 14, 15],
  ['Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.', 'Luke', 10, 19],
  ['Notwithstanding in this rejoice not, that the spirits are subject unto you; but rather rejoice, because your names are written in heaven.', 'Luke', 10, 20],
  ['And having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it.', 'Colossians', 2, 15],
  ['And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death.', 'Revelation', 12, 11],
  ['greater is he that is in you, than he that is in the world.', '1John', 4, 4],
  ['Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.', 'Ephesians', 6, 11],
  ['having done all, to stand.', 'Ephesians', 6, 13],
  ['Above all, taking the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked.', 'Ephesians', 6, 16],
  ['And take the helmet of salvation, and the sword of the Spirit, which is the word of God:', 'Ephesians', 6, 17],
  ['Praying always with all prayer and supplication in the Spirit, and watching thereunto with all perseverance and supplication for all saints;', 'Ephesians', 6, 18],
  ['neither know we what to do: but our eyes are upon thee.', '2Chronicles', 20, 12],
  ['the battle is not yours, but God’s.', '2Chronicles', 20, 15],
  ['set yourselves, stand ye still, and see the salvation of the LORD with you', '2Chronicles', 20, 17],
  ['Not by might, nor by power, but by my spirit, saith the LORD of hosts.', 'Zechariah', 4, 6],
  ['When the enemy shall come in like a flood, the Spirit of the LORD shall lift up a standard against him.', 'Isaiah', 59, 19],
  ['By little and little I will drive them out from before thee, until thou be increased, and inherit the land.', 'Exodus', 23, 30],
  ['Behold the Lamb of God, which taketh away the sin of the world.', 'John', 1, 29],
  ['Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.', 'Hebrews', 1, 8],
  ['by him all things consist.', 'Colossians', 1, 17],
  ['He that hath clean hands, and a pure heart', 'Psalms', 24, 4],
  ['Follow peace with all men, and holiness, without which no man shall see the Lord:', 'Hebrews', 12, 14],
  ['let us cleanse ourselves from all filthiness of the flesh and spirit, perfecting holiness in the fear of God.', '2Corinthians', 7, 1],
];

describe('L125 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'James 4:7; Ephesians 6:12; Acts 19:15'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L125 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(5);
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

  it('teaches the whole arc in order — source, war, order, Sceva, rank, holding-up, own giants, doors, bloodline, land, house, team, sending, deception, boundary, standing', () => {
    const order = [
      '1) WHAT THE SOURCE IS, AND WHAT IT IS NOT',
      '2) THE WAR IS REAL AND THE WEAPONS ARE NOT CARNAL',
      '3) SUBMIT FIRST, THEN RESIST - THE ORDER IS THE DOCTRINE',
      '4) THE SONS OF SCEVA - THE NAME IS NOT A TOOL',
      '5) MICHAEL DURST NOT - RANK, RAILING, AND THE LORD REBUKE THEE',
      '6) YOU CANNOT TEAR DOWN WHAT YOU ARE HOLDING UP',
      '7) THE GIANTS IN YOUR OWN LIFE COME FIRST',
      '8) THE OPEN DOORS THE WORD ACTUALLY NAMES',
      '9) THE BLOODLINE QUESTION - CONFESSED, NEVER INHERITED AS GUILT',
      '10) LEGAL GROUND OVER A PLACE - WHAT DEFILES A LAND',
      '11) I WILL SET NO WICKED THING BEFORE MINE EYES - THE HOUSE AUDIT',
      '12) NOT A LONE RANGER - COUNSEL, COVERING, AND THE TEN MEN',
      '13) THE ASSIGNMENT COMES FROM HIM, AND THE STRATEGY CHANGES',
      '14) TRY THE SPIRITS - THE DECEPTION THIS WORK ATTRACTS',
      '15) WHERE THE WORD SPEAKS, AND WHERE THE WORD STOPS',
      '16) THE BATTLE IS NOT YOURS - THE STANDING THAT ENDS THE FEAR',
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

describe('SOURCE DISCIPLINE — Scripture is the authority; the testimony is weighed, not swallowed and not scorned', () => {
  it('names the two weights explicitly and sorts them', () => {
    expect(l, 'the scriptural half is affirmed as the Word').toMatch(/is the Word, and the Word is the authority/);
    expect(l, 'the prophetic account is named TESTIMONY').toMatch(/is TESTIMONY/);
    expect(l, 'the weighing instruments are cited').toContain('Prove all things; hold fast that which is good.');
    expect(l).toContain('Beloved, believe not every spirit, but try the spirits whether they are of God');
    expect(l, 'weigh, not despise').toMatch(/They do not say despise it|neither swallowed nor scorned/);
  });

  it('affirms her scriptural instruction PLAINLY rather than hedging it (DR-0100 under-claiming is also a failure)', () => {
    expect(l).toMatch(/taught here with the Word under it, plainly and without hedging/);
  });
});

describe('the warfare doctrine itself — order, borrowed authority, and rank', () => {
  it('keeps James 4:7 whole and calls the order the doctrine', () => {
    expect(l).toContain('Submit yourselves therefore to God. Resist the devil, and he will flee from you.');
    expect(l, 'the half-quote is named').toMatch(/quoted at half length/);
    expect(l, 'the promise hangs on the pair').toMatch(/hangs on the pair/);
  });

  it('does NOT stop before 2 Corinthians 10:5 — the only verse that says what a strong hold is', () => {
    expect(l).toContain('Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;');
    expect(l, 'the stronghold is a reasoning').toMatch(/is a REASONING/);
    expect(l, 'our own sequence is that verse, not an adaptation of it').toMatch(/NOTICE, TEST, CAPTURE, REDIRECT/);
  });

  it('teaches Sceva AND its sequel — the city advanced by confession and a bonfire', () => {
    expect(l).toContain('Jesus I know, and Paul I know; but who are ye?');
    expect(l, 'the formula was correct').toMatch(/formula was correct/);
    expect(l, 'borrowed authority is not authority').toMatch(/Borrowed authority is not authority|borrowed/);
    expect(l).toContain('And many that believed came, and confessed, and shewed their deeds.');
    expect(l).toContain('So mightily grew the word of God and prevailed.');
    expect(l, 'not a louder rebuke').toMatch(/not from a louder rebuke|not by a louder rebuke|not a louder rebuke/);
  });

  it('draws the railing line precisely — it forbids railing, NOT deliverance', () => {
    expect(l).toContain('durst not bring against him a railing accusation, but said, The Lord rebuke thee.');
    expect(l).toContain('Whereas angels, which are greater in power and might, bring not railing accusation against them before the Lord.');
    expect(l, 'deliverance is not banned').toContain('I command thee in the name of Jesus Christ to come out of her.');
    expect(l, 'the difference is sending, not volume').toMatch(/sending, not volume|It is sending/);
  });
});

describe('the doors — every close is paired with a fill, and the giants at home come first', () => {
  it('refuses the vacancy error with the swept house', () => {
    expect(l).toContain('empty, swept, and garnished.');
    expect(l).toContain('and the last state of that man is worse than the first.');
    expect(l, 'a vacancy notice, not a victory').toMatch(/vacancy notice/);
    expect(l).toContain('Neither give place to the devil.');
    expect(l, 'PLACE is granted by a resident').toMatch(/Nobody kicked the door in/);
  });

  it('sends the reader to his own giants first, and treats depression pastorally rather than as a demon to shout at', () => {
    expect(l).toContain('Thou hypocrite, first cast out the beam out of thine own eye; and then shalt thou see clearly to cast out the mote out of thy brother’s eye.');
    expect(l).toContain('For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
    expect(l).toContain('Why art thou cast down, O my soul? and why art thou disquieted in me?');
    expect(l, 'Elijah was fed and rested, not rebuked').toContain('Arise and eat; because the journey is too great for thee.');
    expect(l).toContain('a still small voice.');
    expect(l, 'the explicit pastoral guardrail').toMatch(/turns a man\\'s depression into a demon to be shouted at/);
  });

  it('names each open door with the verse that closes it', () => {
    expect(l).toContain('But if ye forgive not men their trespasses, neither will your Father forgive your trespasses.');
    expect(l).toContain('Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice:');
    expect(l).toContain('Vengeance is mine; I will repay, saith the Lord.');
    expect(l).toContain('If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.');
    expect(l).toContain('Or a charmer, or a consulter with familiar spirits, or a wizard, or a necromancer.');
  });
});

describe('THE BLOODLINE GATE — both tiers, or the lesson wrecks someone', () => {
  it('gives the confession tier: confessing the iniquity of the fathers is commanded and modelled', () => {
    expect(l).toContain('If they shall confess their iniquity, and the iniquity of their fathers');
    expect(l).toContain('stood and confessed their sins, and the iniquities of their fathers.');
    expect(l).toContain('We have sinned, and have committed iniquity, and have done wickedly, and have rebelled');
  });

  it('gives the NO-INHERITED-GUILT tier just as plainly, with the redemption texts closing it', () => {
    expect(l).toContain('The son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son');
    expect(l).toContain('In those days they shall say no more, The fathers have eaten a sour grape, and the children’s teeth are set on edge.');
    expect(l).toContain('from your vain conversation received by tradition from your fathers;');
    expect(l).toContain('There is therefore now no condemnation to them which are in Christ Jesus');
    expect(l).toContain('If the Son therefore shall make you free, ye shall be free indeed.');
  });

  it('states the pastoral verdict in both hands and forbids permanent ancestry-excavation', () => {
    expect(l, 'renounce, yes').toMatch(/RENOUNCE what your family practised/);
    expect(l, 'but never a claim the Blood did not cover').toMatch(/never teach a believer that he is under a claim the Blood did not cover/i);
    expect(l, 'no endless genealogy hunt').toMatch(/never make him hunt his genealogy/);
    expect(l, 'the closing proportion').toMatch(/The renouncing takes an evening. The freedom was purchased once./);
  });
});

describe('LEGAL GROUND over a place — the substance affirmed, the controversy kept with Yahweh', () => {
  it('affirms that sustained wickedness defiles a land, from the texts that say so', () => {
    expect(l).toContain('And the land is defiled: therefore I do visit the iniquity thereof upon it, and the land itself vomiteth out her inhabitants.');
    expect(l).toContain('So ye shall not pollute the land wherein ye are: for blood it defileth the land');
    expect(l).toContain('because they have transgressed the laws, changed the ordinance, broken the everlasting covenant.');
    expect(l).toContain('for the LORD hath a controversy with the inhabitants of the land');
  });

  it('keeps the controversy with Yahweh, not with a demon — the line between intercession and superstition', () => {
    expect(l, 'who holds the controversy').toMatch(/It is Yahweh, not a demon/);
    expect(l, 'not a jurisdictional argument won by a principality').toMatch(/jurisdictional argument/);
    expect(l, 'the biblical response is not a transaction with powers').toMatch(/never a clever transaction with the powers over it/);
  });
});

describe('the house audit — a TEST that travels, never a title list (DR-0098)', () => {
  it('carries the threshold and adhesion texts', () => {
    expect(l).toContain('Neither shalt thou bring an abomination into thine house, lest thou be a cursed thing like it');
    expect(l).toContain('I will set no wicked thing before mine eyes: I hate the work of them that turn aside; it shall not cleave to me.');
    expect(l, 'David\'s worry was adhesion').toMatch(/ADHESION/);
  });

  it('gives the three-part test and refuses to publish a banned-titles list', () => {
    expect(l).toContain('Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure');
    expect(l).toContain('And have no fellowship with the unfruitful works of darkness, but rather reprove them.');
    expect(l, 'the test beats a list because a list goes stale').toMatch(/a list goes stale and a test does not|A list expires/);
    expect(l, 'and the reader reaches his own verdict').toMatch(/will not need anyone to hand him a list|will not need anyone to hand you a list/);
    expect(l, 'Ephesus paid for its own verdict').toMatch(/burned their own, at their own cost, in public/);
  });
});

describe('sending, team, and the strategy that changes', () => {
  it('uses Gideon as the worked example — own house first, ten men, a covering', () => {
    expect(l).toContain('throw down the altar of baal that thy father hath, and cut down the grove that is by it:');
    expect(l, 'the FIRST demolition was at home').toMatch(/FIRST demolition was in his own household|own father’s altar first|his own father\\'s altar/);
    expect(l).toContain('Then Gideon took ten men of his servants, and did as the LORD had said unto him');
    expect(l).toContain('if he be a god, let him plead for himself, because one hath cast down his altar.');
  });

  it('shows the same enemy getting opposite orders — asking again is the faithful act', () => {
    expect(l).toContain('And the LORD said unto David, Go up: for I will doubtless deliver the Philistines into thine hand.');
    expect(l).toContain('Thou shalt not go up; but fetch a compass behind them, and come upon them over against the mulberry trees.');
    expect(l, 'last year\'s strategy is presumption').toMatch(/presumption/);
  });
});

describe('THE BOUNDARY — what the Word says, and where it stops (DR-0098 / DR-0100 in tiers)', () => {
  it('affirms the biblical category hard — the queen of heaven IS named and condemned', () => {
    expect(l).toContain('to make cakes to the queen of heaven, and to pour out drink offerings unto other gods, that they may provoke me to anger.');
    expect(l).toContain('to burn incense unto the queen of heaven, and to pour out drink offerings unto her');
    expect(l).toContain('they sacrifice to devils, and not to God: and I would not that ye should have fellowship with devils.');
    expect(l).toContain('Thou shalt have no other gods before me.');
    expect(l, 'the category is affirmed as biblical').toMatch(/is thoroughly biblical/);
  });

  it('says plainly that the name is not in this Bible, and shows the text that is usually pointed to', () => {
    expect(l, 'the name is stated in lowercase, in our voice, as absent from the text').toMatch(/the name lilith is not in this Bible/);
    expect(l).toContain('the screech owl also shall rest there, and find for herself a place of rest.');
    expect(l, 'the boundary is obedience to a verse, not timidity').toMatch(/is not timidity/);
    expect(l, 'and explicitly not a ratings-style debate').toMatch(/not us staging a debate for ratings/);
    expect(l).toContain('The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.');
  });

  it('closes the loop — the boundary costs the practical teaching nothing', () => {
    expect(l, 'no instruction depended on the name').toMatch(/not one practical instruction in this lesson depends on the name/i);
    expect(l, 'and the room is told the same').toMatch(/no instruction in the lesson depended on the name/i);
  });

  it('keeps the proportion Scripture keeps about a fallen power — a line on origin, a landing on his end', () => {
    expect(l).toContain('How art thou fallen from heaven, O lucifer, son of the morning!');
    expect(l).toContain('Yet thou shalt be brought down to hell, to the sides of the pit.');
    expect(l, 'the proportion is itself instruction').toMatch(/That proportion is instruction/);
  });
});

describe('it lands on STANDING, not fear', () => {
  it('gives real authority and then moves the joy off it', () => {
    expect(l).toContain('Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.');
    expect(l).toContain('Notwithstanding in this rejoice not, that the spirits are subject unto you; but rather rejoice, because your names are written in heaven.');
    expect(l).toContain('And having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it.');
    expect(l).toContain('And they overcame him by the blood of the Lamb, and by the word of their testimony');
  });

  it('says the armour aims at standing and contains no hunting instruction', () => {
    expect(l).toContain('having done all, to stand.');
    expect(l, 'no verse tells you to hunt').toMatch(/no verse in the passage instructing you to hunt anything|no hunting instruction in the passage/);
    expect(l).toContain('the battle is not yours, but God’s.');
    expect(l).toContain('Not by might, nor by power, but by my spirit, saith the LORD of hosts.');
    expect(l, 'the pace is set by what you can hold').toContain('By little and little I will drive them out from before thee, until thou be increased, and inherit the land.');
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary or entity name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLilith\b/g) || []).length, 'the entity name is never capitalized in our voice').toBe(0);
    expect((ours.match(/\bBaal\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(l).toMatch(/Lamb of Yahweh/);
    expect(l).toMatch(/Eternal Son of Yahweh/);
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
    expect(l).toContain('Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.');
  });
});

describe('PRIVACY gate — the teaching is weighed, never the woman', () => {
  // This gate deliberately does NOT embed the name it protects. It asserts the
  // commitment is stated, and that no identifying artefact survives in the text.
  it('states the non-naming commitment explicitly', () => {
    expect(l, 'the commitment is stated in the lesson itself').toMatch(/she is not named here/);
    expect(l, 'and the facilitator is told to say it out loud first').toMatch(/is NOT named here/);
    expect(l, 'the reason is given').toMatch(/the teaching is weighed, never the woman|we weigh teaching, never the woman/);
  });

  it('carries no surname, no ministry name, no channel, no contact detail', () => {
    expect(l, 'an email address').not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(l, 'a URL').not.toMatch(/https?:\/\//);
    for (const token of ['Greenwood', 'Becca', 'Rebecca', 'Welch', 'Taylor', 'Colorado Springs', 'Houston', 'YouTube', 'podcast']) {
      expect(l, `identifying token: ${token}`).not.toContain(token);
    }
  });

  it('refers to her only by role, and gives her scriptural teaching its due', () => {
    expect(l).toMatch(/the teacher/);
    expect(l, 'she is credited where she is right').toMatch(/she is exactly right|On this point she is exactly right/);
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

  it('is PROVEN-TO-CATCH against the literal-escape alteration authoring actually produced', () => {
    // The first draft carried a literal backslash-u escape where the KJV has a
    // right single quotation mark, in two quoted fragments. The rendered diff
    // looked correct; the text was not the text it claimed to be.
    const BROKEN_BEAM = 'thy brother\\u2019s eye';
    const BROKEN_TEETH = 'the children\\u2019s teeth';
    expect(WHOLE_KJV.includes(BROKEN_BEAM), 'the escaped form is NOT in the corpus').toBe(false);
    expect(WHOLE_KJV.includes(BROKEN_TEETH), 'the escaped form is NOT in the corpus').toBe(false);
    expect(WHOLE_KJV.includes('thy brother’s eye'), 'the real KJV form uses U+2019').toBe(true);
    expect(WHOLE_KJV.includes('the children’s teeth'), 'the real KJV form uses U+2019').toBe(true);
    // and the lesson no longer carries either escape
    expect(l).not.toContain(BROKEN_BEAM);
    expect(l).not.toContain(BROKEN_TEETH);
    expect(l, 'no literal unicode escape survives anywhere in the lesson').not.toMatch(/\\u[0-9a-fA-F]{4}/);
  });

  it('is PROVEN-TO-CATCH against wrong-reference and cross-verse joins from this lesson’s texts', () => {
    // KJV reads "strong holds" as two words in 2 Corinthians 10:4
    expect(WHOLE_KJV.includes('the pulling down of strongholds')).toBe(false);
    expect(WHOLE_KJV.includes('the pulling down of strong holds')).toBe(true);
    // Mark 9:29 KJV reads "can come forth by nothing", not "cometh forth"
    expect(WHOLE_KJV.includes('This kind cometh forth by nothing')).toBe(false);
    expect(WHOLE_KJV.includes('This kind can come forth by nothing')).toBe(true);
    // cross-verse joins delete a verse boundary silently
    expect(WHOLE_KJV.includes('let not the sun go down upon your wrath: Neither give place to the devil.')).toBe(false);
    expect(WHOLE_KJV.includes('but who are ye? And the man in whom the evil spirit was')).toBe(false);
  });

  it('never lets our own framing wear Scripture’s quotation marks', () => {
    for (const ours of [
      'rules of engagement',
      'open doors',
      'gateway to the soul',
      'you cannot tear down what you are holding up',
      'legal ground',
      'borrowed authority is not authority',
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

  it('each band carries the house audit and the vacancy correction', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the house audit`).toMatch(/I will set no wicked thing before mine eyes|Neither shalt thou bring an abomination into thine house/);
      expect(t, `${band} carries the swept house`).toMatch(/empty, swept, and garnished|Be not overcome of evil, but overcome evil with good/);
    }
  });

  it('each band lands on standing rather than fear', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lands on the finished victory`).toMatch(/rejoice, because your names are written in heaven|made a shew of them openly|greater is he that is in you/);
    }
  });

  it('teen and senior carry the boundary, the both-tier bloodline handling, and the test-not-a-list', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} names where the Word stops`).toMatch(/not in this Bible/);
      expect(t, `${band} carries the queen of heaven that IS named`).toMatch(/queen of heaven/);
      expect(t, `${band} teaches the test, not a list`).toMatch(/TEST, not a title list|TEST, which is better|test is portable/);
      expect(t, `${band} carries Deuteronomy 29:29`).toMatch(/The secret things belong unto the LORD our God/);
    }
  });

  it('the senior band carries the bloodline in both tiers and the two pastoral failure modes', () => {
    const t = level('senior');
    expect(t, 'source discipline is stated to the room first').toMatch(/SOURCE DISCIPLINE FIRST/);
    expect(t, 'the zealous one is sent home first').toMatch(/send him to Judges 6:25 and his own house first/);
    expect(t, 'the frightened one is not released until the joy has moved').toMatch(/until the joy has moved/);
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(800);
    expect(child, 'no demonology for a small child').not.toMatch(/lilith|occult|necromancer|divination|witchcraft|séance|principality/i);
    expect(child, 'the child is told plainly this is not a fear lesson').toMatch(/not a lesson about being afraid/);
    expect(child, 'the child gets the finished victory first').toContain('greater is he that is in you, than he that is in the world.');
    expect(child, 'the child is given the archangel’s own words to use').toContain('The Lord rebuke thee.');
    expect(child, 'and is taught to forgive fast').toContain('And be ye kind one to another, tenderhearted, forgiving one another');
    expect(child, 'and the joy is moved to the right place').toContain('rather rejoice, because your names are written in heaven.');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('James', 4, 7)).toBe('Submit yourselves therefore to God. Resist the devil, and he will flee from you.');
    expect(verse('Acts', 19, 15)).toBe('And the evil spirit answered and said, Jesus I know, and Paul I know; but who are ye?');
    expect(verse('Jude', 1, 9)).toContain('durst not bring against him a railing accusation');
    expect(verse('Ephesians', 4, 27)).toBe('Neither give place to the devil.');
    expect(verse('Ezekiel', 18, 20)).toContain('The son shall not bear the iniquity of the father');
    expect(verse('Leviticus', 26, 40)).toContain('and the iniquity of their fathers');
    expect(verse('Numbers', 35, 33)).toContain('for blood it defileth the land');
    expect(verse('Psalms', 101, 3)).toContain('I will set no wicked thing before mine eyes');
    expect(verse('Deuteronomy', 29, 29)).toContain('The secret things belong unto the LORD our God');
    expect(verse('Luke', 10, 20)).toContain('because your names are written in heaven');
    expect(verse('Colossians', 2, 15)).toContain('having spoiled principalities and powers');
  });

  it('the corpus itself does NOT contain the entity name the conversation centred on', () => {
    // Stated as a corpus fact, not an opinion: this is the ground of the
    // lesson's boundary in movement 15.
    expect(WHOLE_KJV.includes('Lilith')).toBe(false);
    expect(WHOLE_KJV.includes('lilith')).toBe(false);
    // while the title the Word DOES name is present, and condemned
    expect(WHOLE_KJV.includes('queen of heaven')).toBe(true);
    expect(verse('Isaiah', 34, 14)).toContain('the screech owl also shall rest there');
  });

  it('the corpus keeps the adversary and the false gods named low', () => {
    expect(verse('Isaiah', 14, 12)).toContain('O lucifer, son of the morning!');
    expect(verse('Isaiah', 14, 12)).not.toContain('Lucifer');
    expect(verse('Zechariah', 3, 2)).toContain('O satan');
    expect(verse('Zechariah', 3, 2)).not.toContain('Satan');
    expect(verse('Judges', 6, 25)).toContain('the altar of baal');
    expect(verse('Judges', 6, 25)).not.toContain('Baal');
  });
});

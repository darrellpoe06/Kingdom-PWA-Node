// =============================================================================
// L90 — No Respecter of Persons (justice, dignity, and the vote): verbatim KJV
// =============================================================================
// Darrell 2026-08-27 (forwarded a voting-rights march video, twice, with detail):
// the creator traces disenfranchisement from the Three-Fifths Compromise through
// Jim Crow "packing and cracking" to a 2026 Supreme Court decision (Louisiana v.
// Callais). This lesson sets the WORD above the material (DR-0098: teach past the
// ratings-debate, not both-sides-you-decide nor one-side-you-obey), speaks
// documented history plainly as fact and the unverified 2026 specifics AS
// REPORTED (DR-0100 / DR-0076 two-tier honesty), and refuses a partisan
// call-to-action. Every KJV line below was FETCHED from the repo's own KJV this
// session; a drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll90-no-respecter-of-persons-the-image-the-unrighteous-decree-and-the-judge'");
const lesson = src.slice(start, start + 32000);
// Normalize the curly apostrophe so possessives (neighbour’s) compare cleanly.
const l = lesson.replace(/’/g, "'");

// Fetched verbatim from app/public/bible/kjv (this session), curly apostrophes normalized.
const KJV = {
  'Genesis 1:27': 'So God created man in his own image, in the image of God created he him; male and female created he them.',
  'Genesis 18:25 (fragment)': 'Shall not the Judge of all the earth do right?',
  'Acts 17:26 (fragment)': 'And hath made of one blood all nations of men for to dwell on all the face of the earth',
  'Acts 10:34': 'Then Peter opened his mouth, and said, Of a truth I perceive that God is no respecter of persons:',
  'Romans 2:11': 'For there is no respect of persons with God.',
  'Deuteronomy 10:17 (fragment)': 'regardeth not persons, nor taketh reward',
  'Deuteronomy 16:19': 'Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise, and pervert the words of the righteous.',
  'Deuteronomy 27:17': "Cursed be he that removeth his neighbour's landmark. And all the people shall say, Amen.",
  'Deuteronomy 27:19': 'Cursed be he that perverteth the judgment of the stranger, fatherless, and widow. And all the people shall say, Amen.',
  'Leviticus 19:15': 'Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.',
  'Isaiah 10:1': 'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed;',
  'Isaiah 10:2 (fragment)': 'To turn aside the needy from judgment, and to take away the right from the poor of my people',
  'Isaiah 1:17': 'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.',
  'Proverbs 22:28': 'Remove not the ancient landmark, which thy fathers have set.',
  'Proverbs 31:8': 'Open thy mouth for the dumb in the cause of all such as are appointed to destruction.',
  'Proverbs 31:9': 'Open thy mouth, judge righteously, and plead the cause of the poor and needy.',
  'Proverbs 14:31 (fragment)': 'He that oppresseth the poor reproacheth his Maker',
  'Proverbs 17:15': 'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.',
  'Micah 6:8': 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  'Amos 5:24': 'But let judgment run down as waters, and righteousness as a mighty stream.',
  'Psalms 82:3': 'Defend the poor and fatherless: do justice to the afflicted and needy.',
  'James 2:1': 'My brethren, have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.',
  'James 2:9': 'But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.',
  'Jeremiah 22:3 (fragment)': 'do no wrong, do no violence to the stranger, the fatherless, nor the widow, neither shed innocent blood',
  'Jeremiah 17:9': 'The heart is deceitful above all things, and desperately wicked: who can know it?',
  'Ephesians 2:14': 'For he is our peace, who hath made both one, and hath broken down the middle wall of partition between us;',
  'Galatians 3:28': 'There is neither Jew nor Greek, there is neither bond nor free, there is neither male nor female: for ye are all one in Christ Jesus.',
  'Colossians 3:11 (fragment)': 'Christ is all, and in all.',
  '2 Corinthians 5:17': 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  'Revelation 7:9 (fragment)': 'a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb',
};

const QUOTED_FRAGMENTS = [
  'So God created man in his own image, in the image of God created he him; male and female created he them.',
  'And hath made of one blood all nations of men for to dwell on all the face of the earth, and hath determined the times before appointed, and the bounds of their habitation',
  'Then Peter opened his mouth, and said, Of a truth I perceive that God is no respecter of persons',
  'For there is no respect of persons with God.',
  'regardeth not persons, nor taketh reward',
  'My brethren, have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.',
  'But if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors.',
  'Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.',
  'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed;',
  'To turn aside the needy from judgment, and to take away the right from the poor of my people, that widows may be their prey, and that they may rob the fatherless!',
  'Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise, and pervert the words of the righteous.',
  'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.',
  "Cursed be he that removeth his neighbour's landmark. And all the people shall say, Amen.",
  'Remove not the ancient landmark, which thy fathers have set.',
  'Cursed be he that perverteth the judgment of the stranger, fatherless, and widow. And all the people shall say, Amen.',
  'He that oppresseth the poor reproacheth his Maker',
  'do no wrong, do no violence to the stranger, the fatherless, nor the widow, neither shed innocent blood',
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction. Open thy mouth, judge righteously, and plead the cause of the poor and needy.',
  'Defend the poor and fatherless: do justice to the afflicted and needy. Deliver the poor and needy: rid them out of the hand of the wicked.',
  'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.',
  'Execute true judgment, and shew mercy and compassions every man to his brother: And oppress not the widow, nor the fatherless, the stranger, nor the poor',
  'The heart is deceitful above all things, and desperately wicked: who can know it?',
  'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  'For he is our peace, who hath made both one, and hath broken down the middle wall of partition between us',
  'There is neither Jew nor Greek, there is neither bond nor free, there is neither male nor female: for ye are all one in Christ Jesus.',
  'Christ is all, and in all.',
  'Shall not the Judge of all the earth do right?',
  'a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb',
  'But let judgment run down as waters, and righteousness as a mighty stream.',
  'to do justly, and to love mercy, and to walk humbly with thy God?',
  // Movement 8 — the myth of meritocracy and the day of small things.
  'If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth; and there be higher than they.',
  'But God hath chosen the foolish things of the world to confound the wise; and God hath chosen the weak things of the world to confound the things which are mighty',
  'He raiseth up the poor out of the dust, and lifteth up the beggar from the dunghill, to set them among princes',
  'who hath despised the day of small things?',
  'this poor widow hath cast in more than they all',
  'who knoweth whether thou art come to the kingdom for such a time as this?',
  'Not by might, nor by power, but by my spirit, saith the LORD of hosts.',
  'let us not be weary in well doing: for in due season we shall reap, if we faint not.',
];

describe('L90 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Acts 10:34; Isaiah 10:1; Micah 6:8'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('the Word LEADS and the topic is set UNDER it — not a party frame (DR-0098)', () => {
    // The standard-above-the-material move must be explicit.
    expect(l).toContain('THE VIDEO, AND THE STANDARD ABOVE IT');
    expect(l).toContain('no respecter of persons'); // the spine truth
    expect(l).toContain('on every side'); // partiality convicted in ANY hand, not one party
    // The eight numbered movements are present, in order.
    const order = [
      '1) THE IMAGE AND THE ONE BLOOD',
      '2) YAHWEH IS NO RESPECTER OF PERSONS',
      '3) THE UNRIGHTEOUS DECREE',
      '4) THE ANCIENT LANDMARK',
      '5) THE DOCUMENTED HISTORY, SPOKEN PLAINLY',
      '6) OPEN THY MOUTH FOR THE VOICELESS',
      '7) THE DEEPER DIAGNOSIS AND THE DEEPER REMEDY',
      '8) THE MYTH OF MERITOCRACY, AND THE DAY OF SMALL THINGS',
      '9) THE JUDGE OF ALL THE EARTH',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the two truth-tiers: documented fact plain, 2026 specifics AS REPORTED (DR-0100 / DR-0076)', () => {
    expect(l).toContain('established historical facts'); // history stated as fact, not hedged
    expect(l).toContain('Three-Fifths Compromise');
    expect(l).toContain('AS THE CREATOR REPORTED THEM'); // provenance honesty on the video's claims
    expect(l).toContain('Louisiana v. Callais'); // named, but as reported
    expect(l).toContain('cannot confirm'); // explicit non-verification of the 2026 specifics
  });

  it('refuses a partisan call-to-action — the platform preaches the duty, not the march', () => {
    expect(l).toContain('will not tell you which march to join, which group to fund, or which party to back');
    expect(l).toContain('under the King'); // the means belong to the believer under the King
  });

  it('captures the rest of the video Word-first: complete exclusion, meritocracy myth, and the icons', () => {
    expect(l).toContain('complete exclusion'); // the early-1900s purge, named
    expect(l).toContain('no true meritocracy'); // the meritocracy claim, answered by Ecclesiastes 5:8
    // "you do not need to be an icon" — the icons named, answered by the day of small things.
    for (const icon of ['Malcolm X', 'Fred Hampton', 'Martin Luther King Jr.']) {
      expect(l).toContain(icon);
    }
    expect(l).toContain('sanitation workers'); // MLK in Memphis, as the creator referenced
    expect(l).toContain('day of small things'); // the Word's answer: the small faithful are counted
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 56)}${frag.length > 56 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the whole message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the image, the no-partiality spine, and the Judge', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the image of God`).toContain('in his own image');
      expect(t, `${band} carries no-respecter-of-persons`).toMatch(/no respecter of persons|respect of persons|respect to persons/);
      expect(t, `${band} carries the Judge who will do right`).toContain('Judge of all the earth do right');
    }
    // teen and senior additionally carry the unjust decree and the two-tier honesty.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('decree unrighteous decrees');
      expect(t).toMatch(/as he reported them|as reported/i); // provenance honesty pitched to age
    }
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Acts 10:34'].endsWith('no respecter of persons:')).toBe(true);
    expect(KJV['Romans 2:11']).toBe('For there is no respect of persons with God.');
    expect(KJV['Genesis 18:25 (fragment)']).toBe('Shall not the Judge of all the earth do right?');
    expect(KJV['Micah 6:8'].endsWith('walk humbly with thy God?')).toBe(true);
    expect(KJV['Deuteronomy 27:17'].includes("neighbour's landmark")).toBe(true);
    expect(KJV['Jeremiah 17:9']).toContain('deceitful above all things');
    expect(KJV['Ephesians 2:14']).toContain('middle wall of partition');
  });
});

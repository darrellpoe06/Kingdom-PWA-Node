// @vitest-environment node
// =============================================================================
// L140 — The People of Judah and the People of the Way. Verbatim KJV, and the
// claims this lesson may never lose.
// =============================================================================
// THE QUESTION, asked 2026-09-09, in eleven lines Darrell spoke while it was
// being written: who and where are the people of Judah and the Way; the one
// tribe from every nation; whom to listen to from Scripture and history;
// psychological wars, liars, psyops; their Ways and suffering give them away;
// known by love; more than conquerors, the loving still slaughtered unless
// their Ways align and Yahweh raises them; keep the Way to live good,
// longsuffering under stolen wages; which country stands against His Ways,
// Harriet Tubman died still believing; a means of making money while others
// died keeping Jesus as Lord under duress.
//
// The claims that can drift, each pinned below:
//   1. Judah's timeline is the Word's own (1 Kings 12:20; 2 Kings 17:18;
//      2 Kings 25:21; Ezra 1:5; Luke 21:24) with settled dates stated plainly.
//   2. SCATTERED, NEVER LOST (Amos 9:9; James 1:1; Luke 2:36; Revelation 7:4);
//      the lost-tribes debate named to teach past it (Ezra 2:62; 1 Timothy
//      1:4; Deuteronomy 29:29) — no modern nation named a tribe.
//   3. The Way defined by Acts 24:14; the name is His (John 14:6).
//   4. A tribe from every nation has its precedent inside Judah (Caleb,
//      Numbers 13:6 / Joshua 14:14; Ruth, Rahab) — JOINED, NEVER REPLACING
//      (Romans 11:17-18, 11:28). The replacement reading is refused.
//   5. Whom to listen to: one Voice (Matthew 17:5) and one test (Isaiah 8:20);
//      never genealogy.
//   6. Psyops named from the Word (John 8:44; 2 Corinthians 11:14; Revelation
//      12:9; Revelation 3:9 read to its end); KNOWN BY LOVE (John 13:35).
//   7. More than conquerors AFTER sheep for the slaughter (Romans 8:36-37);
//      Proverbs 16:7; the raising His (Psalms 75:7); mischief by a law
//      (Psalms 94:20).
//   8. Stolen wages (James 5:4; Genesis 31:7); which country = the measure
//      (Proverbs 14:34; Deuteronomy 23:15); Tubman as established history;
//      souls of men as merchandise (Revelation 18:13); BUT IF NOT (Daniel 3:18).
//
// Typography (DR-0210): Yahweh in our voice; the KJV untouched inside quotes.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll140-the-people-of-judah-and-the-people-of-the-way-who-they-are-where-they-are-and-whom-to-listen-to';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

// The whole KJV, joined two ways: verse-by-line, and verse-by-space, so a
// quotation that runs across a verse boundary ("...shall live. And Moses
// made...") is still checked letter for letter rather than refused.
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const { BY_LINE, BY_SPACE } = (() => {
  let byLine = '';
  let bySpace = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) { byLine += `${ch.join('\n')}\n`; bySpace += `${ch.join(' ')}\n`; }
  }
  return { BY_LINE: byLine, BY_SPACE: bySpace };
})();
const inKjv = (part) => BY_LINE.includes(part) || BY_SPACE.includes(part);

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

/** Our authored voice = the text with every quotation removed. */
const ourVoiceOnly = (text) => text.replace(/"[^"]*"/g, ' ');

// Deliberately EMPTY: every double-quoted span in L137 is verbatim KJV.
const NOT_SCRIPTURE = [];

const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L140 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L140 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L140 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    const m = mod();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Amos 9:9/);
    expect(m.anchor.ref).toMatch(/Matthew 17:5/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of mod().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('every age band resolves to authored prose of its own', () => {
    const m = mod();
    for (const band of AGE_BANDS) {
      const r = resolveForAge(m, band.id);
      expect(typeof r.text === 'string' && r.text.length > 400, `${band.id} must carry real prose`).toBe(true);
    }
  });
});

describe('every quoted span is letter-for-letter KJV', () => {
  it('the quotation marks are balanced', () => {
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L140 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L140 must actually contain quotations').toBeGreaterThan(100);
    const bad = [];
    for (const span of spans) {
      const parts = span.includes('...') ? span.split('...').map((p) => p.trim()) : [span];
      for (const part of parts) {
        if (!part || NOT_SCRIPTURE.includes(part)) continue;
        if (!inKjv(part)) bad.push(part);
      }
    }
    expect(bad, `non-verbatim quoted spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the allowlist is EMPTY and stays honest', () => {
    expect(NOT_SCRIPTURE).toEqual([]);
  });
});

describe('ONE — who Judah is, and the timeline the Word carries', () => {
  it('Judah means praise, in the Word’s own sentence', () => {
    expect(l).toContain('Now will I praise the LORD: therefore she called his name Judah');
    expect(l).toMatch(/Yehudah/);
  });
  it('the timeline is quoted, not summarised', () => {
    expect(l).toContain('there was none that followed the house of David, but the tribe of Judah only.');
    expect(l).toContain('there was none left but the tribe of Judah only.');
    expect(l).toContain('So Judah was carried away out of their land.');
    expect(l).toContain('Then rose up the chief of the fathers of Judah and Benjamin, and the priests, and the Levites');
    expect(l).toContain('many of the people of the land became Jews');
    expect(l).toContain('Jerusalem shall be trodden down of the Gentiles, until the times of the Gentiles be fulfilled.');
  });
  it('the settled dates are stated plainly (DR-0100)', () => {
    for (const d of ['931 BC', '722 BC', '586 BC', '538 BC', 'AD 70']) expect(l).toContain(d);
  });
});

describe('TWO — scattered, never lost', () => {
  it('Amos 9:9 whole, and the tribes known in the King’s day and sealed at the end', () => {
    expect(l).toContain('I will sift the house of Israel among all nations, like as corn is sifted in a sieve, yet shall not the least grain fall upon the earth.');
    expect(l).toContain('to the twelve tribes which are scattered abroad');
    expect(l).toContain('of the tribe of Aser');
    expect(l).toContain('there were sealed an hundred and forty and four thousand of all the tribes of the children of Israel.');
    expect(l).toMatch(/SCATTERED, NEVER LOST/);
  });
  it('PROVEN-TO-CATCH: the lost-tribes debate is named to teach past it, and no modern nation is named a tribe', () => {
    expect(l).toContain('These sought their register among those that were reckoned by genealogy, but they were not found: therefore were they, as polluted, put from the priesthood.');
    expect(l).toContain('Neither give heed to fables and endless genealogies');
    expect(l).toContain('The secret things belong unto the LORD our God');
    expect(l).toMatch(/never names a modern nation as a tribe/);
    // No modern people group asserted to BE a tribe of Israel.
    expect(l).not.toMatch(/\b(Britain|British|America|Americans|Africans?|Europeans?|Japanese|Irish|Pashtun|Igbo|Lemba)\b[^.]{0,80}\b(are|is) (the|a) (lost )?tribe/i);
  });
});

describe('THREE — the Way', () => {
  it('the first name of the believers, defined by Acts 24:14; the name is His', () => {
    expect(l).toContain('any of this way');
    expect(l).toContain('after the way which they call heresy, so worship I the God of my fathers, believing all things which are written in the law and in the prophets');
    expect(l).toContain('I am the way, the truth, and the life: no man cometh unto the Father, but by me.');
    expect(l).toContain('the disciples were called Christians first in Antioch.');
    expect(l).toMatch(/BELIEVING ALL THINGS WHICH ARE WRITTEN/);
  });
});

describe('FOUR — a tribe from every nation: the precedent inside Judah, joined never replacing', () => {
  it('Caleb, Ruth and Rahab are the precedent', () => {
    expect(l).toContain('Of the tribe of Judah, Caleb the son of Jephunneh.');
    expect(l).toContain('because that he wholly followed the LORD God of Israel.');
    expect(l).toContain('thy people shall be my people, and thy God my God');
    expect(l).toContain('Salmon begat Booz of Rachab; and Booz begat Obed of Ruth');
    expect(l).toContain('One law shall be to him that is homeborn, and unto the stranger');
    expect(l).toContain('The LORD shall count, when he writeth up the people, that this man was born there.');
  });
  it('the Word’s shape: grafted in, fellowcitizens, seed, nation, one fold — and Revelation 7 whole', () => {
    expect(l).toContain('wert graffed in among them, and with them partakest of the root and fatness of the olive tree');
    expect(l).toContain('ye are no more strangers and foreigners, but fellowcitizens with the saints');
    expect(l).toContain('if ye be Christ’s, then are ye Abraham’s seed, and heirs according to the promise.');
    expect(l).toContain('a chosen generation, a royal priesthood, an holy nation, a peculiar people');
    expect(l).toContain('there shall be one fold, and one shepherd.');
    expect(l).toContain('a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues');
  });
  it('PROVEN-TO-CATCH: joined, never replacing', () => {
    expect(l).toContain('Boast not against the branches. But if thou boast, thou bearest not the root, but the root thee.');
    expect(l).toContain('as touching the election, they are beloved for the fathers’ sakes. For the gifts and calling of God are without repentance.');
    expect(l).toContain('God is able to graff them in again.');
    expect(l).toContain('Hath God cast away his people? God forbid.');
    expect(l).toMatch(/JOINED, NEVER REPLACING/);
    expect(l).not.toMatch(/the church (has )?replaced Israel|Israel (is|was) replaced by the church/i);
  });
});

describe('FIVE — whom to listen to: one Voice, one test, never genealogy', () => {
  it('the Voice', () => {
    expect(l).toContain('This is my beloved Son, in whom I am well pleased; hear ye him.');
    expect(l).toContain('a Prophet from the midst of thee, of thy brethren, like unto me; unto him ye shall hearken');
    expect(l).toContain('him shall ye hear in all things whatsoever he shall say unto you.');
    expect(l).toContain('My sheep hear my voice, and I know them, and they follow me');
  });
  it('the test', () => {
    expect(l).toContain('To the law and to the testimony: if they speak not according to this word, it is because there is no light in them.');
    expect(l).toContain('searched the scriptures daily, whether those things were so.');
    expect(l).toContain('try the spirits whether they are of God');
    expect(l).toContain('Ye shall know them by their fruits.');
  });
  it('Judah’s honour kept, with the condition inside Zechariah 8:23', () => {
    expect(l).toContain('unto them were committed the oracles of God');
    expect(l).toContain('to the Jew first, and also to the Greek.');
    expect(l).toContain('for we have heard that God is with you.');
    expect(l).toMatch(/never by genealogy|not by its genealogy|never by its genealogy/i);
  });
});

describe('SIX — psyops named from the Word; known by love', () => {
  it('the war, the lie’s father, the disguise, the reach, the inversion, the cost', () => {
    expect(l).toContain('we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world');
    expect(l).toContain('he is a liar, and the father of it.');
    expect(l).toContain('satan himself is transformed into an angel of light.');
    expect(l).toContain('which deceiveth the whole world');
    expect(l).toContain('Woe unto them that call evil good, and good evil');
    expect(l).toContain('because they received not the love of the truth, that they might be saved. And for this cause God shall send them strong delusion, that they should believe a lie');
  });
  it('identity forged — Revelation 3:9 read to its end; the exposing is His', () => {
    expect(l).toContain('which say they are Jews, and are not, but do lie');
    expect(l).toContain('I will make them to come and worship before thy feet, and to know that I have loved thee.');
    expect(l).toMatch(/does not hand us a list to accuse/);
  });
  it('two groups: neither fear ye their fear; reasoning from known history is the Word’s discipline', () => {
    expect(l).toContain('neither fear ye their fear, nor be afraid. Sanctify the LORD of hosts himself; and let him be your fear');
    expect(l).toContain('thy word is truth.');
    expect(l).toContain('Prove all things; hold fast that which is good.');
    expect(l).toContain('having had perfect understanding of all things from the very first, to write unto thee in order');
    expect(l).toContain('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.');
    expect(l).toContain('at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.');
  });
  it('their Ways and their suffering give them away — with the precision that suffering alone proves nothing', () => {
    expect(l).toContain('Wherefore by their fruits ye shall know them.');
    expect(l).toContain('In this the children of God are manifest, and the children of the devil');
    expect(l).toContain('Judge not according to the appearance, but judge righteous judgment.');
    expect(l).toContain('thou shalt become an astonishment, a proverb, and a byword, among all nations');
    expect(l).toContain('You only have I known of all the families of the earth: therefore I will punish you for all your iniquities.');
    expect(l).toContain('I will correct thee in measure');
    expect(l).toContain('If the world hate you, ye know that it hated me before it hated you.');
    expect(l).toContain('the remnant of her seed, which keep the commandments of God, and have the testimony of Jesus Christ.');
    expect(l).toMatch(/suffering alone proves nothing/i);
  });
  it('KNOWN BY LOVE — Darrell’s two words are the Lord’s mark, all men can see it, without dissimulation', () => {
    expect(l).toContain('By this shall all men know that ye are my disciples, if ye have love one to another.');
    expect(l).toContain('We know that we have passed from death unto life, because we love the brethren.');
    expect(l).toContain('Let love be without dissimulation.');
    expect(l).toContain('bringing into captivity every thought to the obedience of Christ');
    expect(l).toMatch(/known by love/i);
    expect(l).toMatch(/psyops/i);
  });
});

describe('SEVEN — more than conquerors: the loving slaughtered, and raised', () => {
  it('Romans 8:36 stands before 8:37, in one quotation', () => {
    expect(l).toContain('For thy sake we are killed all the day long; we are accounted as sheep for the slaughter. Nay, in all these things we are more than conquerors through him that loved us.');
    expect(l).toContain('I am for peace: but when I speak, they are for war.');
    expect(l).toContain('all they that take the sword shall perish with the sword.');
    expect(l).toContain('they loved not their lives unto the death.');
  });
  it('unless their Ways align — Proverbs 16:7 — and Yahweh raises them, over governments', () => {
    expect(l).toContain('When a man’s ways please the LORD, he maketh even his enemies to be at peace with him.');
    expect(l).toContain('There is no king saved by the multitude of an host');
    expect(l).toContain('Put not your trust in princes, nor in the son of man, in whom there is no help.');
    expect(l).toContain('But God is the judge: he putteth down one, and setteth up another.');
    expect(l).toContain('He raiseth up the poor out of the dust, and lifteth the needy out of the dunghill; That he may set him with princes');
    expect(l).toContain('I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live');
  });
  it('undermined by their own governments — mischief by a law — and the counsel', () => {
    expect(l).toContain('Shall the throne of iniquity have fellowship with thee, which frameth mischief by a law?');
    expect(l).toContain('Woe unto them that decree unrighteous decrees');
    expect(l).toContain('marvel not at the matter: for he that is higher than the highest regardeth; and there be higher than they.');
    expect(l).toContain('We ought to obey God rather than men.');
    expect(l).toContain('But the meek shall inherit the earth');
  });
});

describe('EIGHT — keep the Way to live good; stolen wages; which country; Tubman; souls of men; but if not', () => {
  it('keep the Way to live good is a promise with a condition', () => {
    expect(l).toContain('What man is he that desireth life, and loveth many days, that he may see good? Keep thy tongue from evil, and thy lips from speaking guile. Depart from evil, and do good; seek peace, and pursue it.');
    expect(l).toContain('that ye may live, and that it may be well with you');
    expect(l).toMatch(/not the price of living good; it is the shape of it/);
  });
  it('the stolen wage has a verse and a Judge; Jacob under Laban', () => {
    expect(l).toContain('the wages of him that is hired shall not abide with thee all night until the morning.');
    expect(l).toContain('the cries of them which have reaped are entered into the ears of the Lord of sabaoth.');
    expect(l).toContain('those that oppress the hireling in his wages');
    expect(l).toContain('changed my wages ten times; but God suffered him not to hurt me.');
    expect(l).toContain('Thus God hath taken away the cattle of your father, and given them to me.');
    expect(l).toContain('Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.');
    expect(l).toContain('let us not be weary in well doing: for in due season we shall reap, if we faint not.');
  });
  it('which country: the measure, applied live, and the laws the Word judges', () => {
    expect(l).toContain('Righteousness exalteth a nation: but sin is a reproach to any people.');
    expect(l).toContain('If that nation, against whom I have pronounced, turn from their evil, I will repent of the evil that I thought to do unto them');
    expect(l).toContain('he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death.');
    expect(l).toContain('Thou shalt not deliver unto his master the servant which is escaped from his master unto thee');
    expect(l).toMatch(/DOES NOT NAME A MODERN COUNTRY/);
    expect(l).toMatch(/the one we live in included|ours included/);
  });
  it('Harriet Tubman as established history (DR-0100), not as a quotation', () => {
    expect(l).toMatch(/Harriet Tubman/);
    expect(l).toMatch(/1849/);
    expect(l).toMatch(/Fugitive Slave Act/);
    expect(l).toMatch(/1913/);
    expect(l).toMatch(/died still believing/i);
    // Her words are never placed inside quotation marks (only the Word is quoted).
    expect(l).not.toMatch(/Tubman[^.]{0,120}said, "/);
  });
  it('they died still believing — Hebrews 11 and the crown', () => {
    expect(l).toContain('These all died in faith, not having received the promises, but having seen them afar off, and were persuaded of them, and embraced them');
    expect(l).toContain('be thou faithful unto death, and I will give thee a crown of life.');
    expect(l).toContain('Precious in the sight of the LORD is the death of his saints.');
    expect(l).toContain('their works do follow them.');
  });
  it('a means of making money — souls of men as merchandise; and but if not', () => {
    expect(l).toContain('and slaves, and souls of men.');
    expect(l).toContain('they traded the persons of men');
    expect(l).toContain('they sold the righteous for silver, and the poor for a pair of shoes');
    expect(l).toContain('the love of money is the root of all evil');
    expect(l).toContain('Ye cannot serve God and mammon.');
    expect(l).toContain('Ye have condemned and killed the just; and he doth not resist you.');
    expect(l).toContain('Come out of her, my people, that ye be not partakers of her sins');
    expect(l).toContain('But if not, be it known unto thee, O king, that we will not serve thy gods');
    expect(l).toContain('Esteeming the reproach of Christ greater riches than the treasures in Egypt');
    expect(l).toMatch(/BUT IF NOT/);
  });
});

describe('NINE — sold to all nations; because we aren’t loved; if My people; for all ages', () => {
  it('the selling was written first, the guise named, the stranger loved', () => {
    expect(l).toContain('there ye shall be sold unto your enemies for bondmen and bondwomen, and no man shall buy you.');
    expect(l).toContain('Thou sellest thy people for nought');
    expect(l).toContain('if ye have respect to persons, ye commit sin');
    expect(l).toContain('thou shalt love him as thyself; for ye were strangers in the land of Egypt');
    expect(l).toContain('Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.');
  });
  it('because we aren’t loved is answered by name, in Malachi 1:2 and its company', () => {
    expect(l).toContain('I have loved you, saith the LORD. Yet ye say, Wherein hast thou loved us?');
    expect(l).toContain('But because the LORD loved you');
    expect(l).toContain('Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.');
    expect(l).toContain('Behold, I have graven thee upon the palms of my hands');
    expect(l).toContain('When my father and my mother forsake me, then the LORD will take me up.');
    expect(l).toContain('We love him, because he first loved us.');
  });
  it('if My people — 2 Chronicles 7:14 whole, and His ears already attent', () => {
    expect(l).toContain('If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.');
    expect(l).toContain('Now mine eyes shall be open, and mine ears attent unto the prayer that is made in this place.');
    expect(l).toContain('Thy face, LORD, will I seek.');
    expect(l).toContain('seek his face evermore.');
    expect(l).toMatch(/Four verbs on our side; three on His|Four verbs on our side, three on His/);
  });
  it('for all timelines over all ages — Daniel, Nehemiah, Lamentations, Psalms 80; He holds every age', () => {
    expect(l).toContain('We have sinned, and have committed iniquity, and have done wickedly, and have rebelled');
    expect(l).toContain('both I and my father’s house have sinned.');
    expect(l).toContain('Turn thou us unto thee, O LORD, and we shall be turned; renew our days as of old.');
    expect(l).toContain('Turn us again, O LORD God of hosts, cause thy face to shine; and we shall be saved.');
    expect(l).toContain('even from everlasting to everlasting, thou art God.');
    expect(l).toContain('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(l).toContain('I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.');
    expect(l).toMatch(/for all timelines, over all ages|for all timelines over all ages/i);
  });
});

describe('typography — Yahweh in our voice, the KJV untouched inside quotes (DR-0210); the adversary lowercase', () => {
  it('our authored voice never says the generic God', () => {
    const ours = ourVoiceOnly(l);
    const hits = [...ours.matchAll(/\bGod\b/g)].map((m) => ours.slice(Math.max(0, m.index - 40), m.index + 20));
    expect(hits, `generic God in our voice:\n${hits.join('\n')}`).toEqual([]);
    expect(ours).toMatch(/Yahweh/);
  });
  it('the KJV’s own God and LORD survive inside the quotations', () => {
    const { spans } = quotedSpans(l);
    expect(spans.some((s) => /\bGod\b/.test(s))).toBe(true);
    expect(spans.some((s) => /\bLORD\b/.test(s))).toBe(true);
  });
  it('satan and the devil are never capitalised as proper names, in our voice or in the quotations', () => {
    expect(l).not.toMatch(/\bSatan\b/);
    expect(l).not.toMatch(/\bThe Devil\b/);
  });
});

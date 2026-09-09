// @vitest-environment node
// =============================================================================
// L139 — The Sceptre of Judah. Verbatim KJV, and the claims this lesson may never lose.
// =============================================================================
// THE QUESTION, asked 2026-09-09. Darrell: whoever Judah is still matters until
// the end — humans will listen to Judah; Judah has the sceptre? until Shiloh?
//
// The lesson answers all three from Genesis 49:10 and its echoes, and each
// part can drift:
//   1. THE VERSE AND ITS FRAME — Genesis 49:10 whole; Genesis 49:1 "the last
//      days" is the heading, so "until the end" is the text's own frame.
//   2. WHO JUDAH IS — man (praise), tribe (first), kingdom (David's house),
//      people (salvation is of the Jews); surety, then "instead of the lad".
//   3. THE SCEPTRE BY CHOICE AND OATH — 1 Chronicles 28:4; Psalms 60:7;
//      2 Samuel 7:16; Psalms 89:34-36; kept for David's sake.
//   4. SHILOH DEFINED BY THE WORD — the gathering clause and Ezekiel 21:27;
//      then the Word points: Revelation 5:5, Hebrews 7:14, Luke 1:32-33.
//      No derivation of the name is added; the town is a different use.
//   5. UNTIL MEANS ARRIVAL, NOT EXPIRY — Psalms 110:1 the tutor; the sceptre
//      stays (Hebrews 1:8; Luke 1:33; Revelation 22:16). The "Judah is
//      finished" reading is the drift this pins against.
//   6. THE GATHERING — humans will listen to Judah, in the Word's words;
//      Judah the people still in the ending.
//   7. THE LION IS THE LAMB — Revelation 5:5-6 beside Genesis 44:33;
//      the priesthood by a changed law (Hebrews 7:14, 7:17).
//   8. THE DEVIL AND THE SCEPTRE (Genesis 3:15 → Revelation 12:4-5, 12:12);
//      ONE Lawgiver who wants His Ways (Isaiah 33:22; James 4:12; Deuteronomy
//      10:12-13); a whole tribe that CARRIES His law (Exodus 19:6; 2 Corinthians
//      3:3; Acts 17:6) — never authors it.
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
const ID = 'll139-the-sceptre-of-judah-who-judah-is-why-judah-still-matters-until-the-end-and-who-shiloh-is';
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

describe('L139 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L139 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L139 must be in LIVING_LESSONS_MODULES').toBeTruthy();
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
    expect(m.anchor.ref).toMatch(/Genesis 49:10/);
    expect(m.anchor.ref).toMatch(/Revelation 5:5/);
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
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L139 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L139 must actually contain quotations').toBeGreaterThan(100);
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

describe('ONE — the verse and its frame', () => {
  it('Genesis 49:10 is quoted whole', () => {
    expect(l).toContain('The sceptre shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh come; and unto him shall the gathering of the people be.');
  });
  it('the last-days heading of Genesis 49:1 is the frame for "until the end"', () => {
    expect(l).toContain('that I may tell you that which shall befall you in the last days.');
    expect(l).toMatch(/THE LAST DAYS/);
  });
  it('Darrell’s three lines are carried for meaning (DR-0331)', () => {
    expect(l).toMatch(/whoever Judah is still matters until the end/i);
    expect(l).toMatch(/humans will listen to Judah/i);
    expect(l).toMatch(/Judah has the sceptre\?/);
    expect(l).toMatch(/[Uu]ntil Shiloh\?/);
  });
  it('the blessing is read whole — the lion, the colt, the garments', () => {
    expect(l).toContain('Judah is a lion’s whelp: from the prey, my son, thou art gone up');
    expect(l).toContain('Binding his foal unto the vine, and his ass’s colt unto the choice vine; he washed his garments in wine, and his clothes in the blood of grapes:');
  });
});

describe('TWO — who Judah is', () => {
  it('the man named praise, the tribe that went first, the kingdom, the people', () => {
    expect(l).toContain('Now will I praise the LORD: therefore she called his name Judah');
    expect(l).toContain('And the LORD said, Judah shall go up: behold, I have delivered the land into his hand.');
    expect(l).toContain('These shall first set forth.');
    expect(l).toContain('there was none that followed the house of David, but the tribe of Judah only.');
    expect(l).toContain('we know what we worship: for salvation is of the Jews.');
  });
  it('the record is not cleaned up — Joseph sold, and the breach of Pharez', () => {
    expect(l).toContain('Come, and let us sell him to the Ishmeelites');
    expect(l).toMatch(/Genesis 38/);
    expect(l).toContain('but the birthright was Joseph’s');
  });
  it('surety, then instead of the lad', () => {
    expect(l).toContain('I will be surety for him; of my hand shalt thou require him');
    expect(l).toContain('Now therefore, I pray thee, let thy servant abide instead of the lad a bondman to my lord; and let the lad go up with his brethren.');
    expect(l).toMatch(/INSTEAD OF THE LAD/);
  });
});

describe('THREE — the sceptre, by choice and by oath', () => {
  it('Judah holds it by name', () => {
    expect(l).toContain('he hath chosen Judah to be the ruler');
    expect(l).toContain('Judah is my lawgiver');
    expect(l).toContain('there shall come a Star out of Jacob, and a Sceptre shall rise out of Israel');
  });
  it('fixed to David by a covenant Yahweh swore not to break', () => {
    expect(l).toContain('And thine house and thy kingdom shall be established for ever before thee: thy throne shall be established for ever.');
    expect(l).toContain('by a covenant of salt');
    expect(l).toContain('My covenant will I not break, nor alter the thing that is gone out of my lips. Once have I sworn by my holiness that I will not lie unto David. His seed shall endure for ever, and his throne as the sun before me.');
    expect(l).toContain('Then may also my covenant be broken with David my servant, that he should not have a son to reign upon his throne');
  });
  it('kept through the worst kings for David’s sake', () => {
    expect(l).toContain('Yet the LORD would not destroy Judah for David his servant’s sake, as he promised him to give him alway a light, and to his children.');
  });
});

describe('FOUR — Shiloh, defined by the Word and pointed at by the Word', () => {
  it('defined by the gathering clause and by Ezekiel 21:27', () => {
    expect(l).toContain('I will overturn, overturn, overturn, it: and it shall be no more, until he come whose right it is; and I will give it him.');
    expect(l).toMatch(/HE WHOSE RIGHT IT IS/);
  });
  it('the Word points at the Person', () => {
    expect(l).toContain('behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book');
    expect(l).toContain('For it is evident that our Lord sprang out of Juda');
    expect(l).toContain('Jacob begat Judas and his brethren; And Judas begat Phares');
    expect(l).toContain('though thou be little among the thousands of Judah, yet out of thee shall he come forth unto me that is to be ruler in Israel; whose goings forth have been from of old, from everlasting.');
    expect(l).toContain('lowly, and riding upon an ass, and upon a colt the foal of an ass.');
    expect(l).toContain('And he was clothed with a vesture dipped in blood: and his name is called The Word of God.');
    expect(l).toContain('the Lord God shall give unto him the throne of his father David: And he shall reign over the house of Jacob for ever; and of his kingdom there shall be no end.');
  });
  it('the name is said, and the title on the cross is the sceptre displayed', () => {
    expect(l).toMatch(/Shiloh is Jesus/);
    expect(l).toMatch(/Eternal Son of Yahweh/);
    expect(l).toContain('JESUS OF NAZARETH THE KING OF THE JEWS.');
  });
  it('PROVEN-TO-CATCH: no derivation of the name is invented; the town is a different use', () => {
    expect(l).toMatch(/does not translate the name Shiloh/);
    expect(l).toContain('assembled together at Shiloh, and set up the tabernacle of the congregation there');
    expect(l).not.toMatch(/Shiloh (means|is Hebrew for|comes from the Hebrew)/i);
  });
});

describe('FIVE — until means arrival, not expiry', () => {
  it('Psalms 110:1 is the tutor', () => {
    expect(l).toContain('Sit thou at my right hand, until I make thine enemies thy footstool.');
    expect(l).toMatch(/arrival, not (the )?expiry/i);
  });
  it('the sceptre stays in the hand of the Son of David for ever', () => {
    expect(l).toContain('Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.');
    expect(l).toContain('his dominion is an everlasting dominion, which shall not pass away');
    expect(l).toContain('and he shall reign for ever and ever.');
    expect(l).toContain('KING OF KINGS, AND LORD OF LORDS.');
    expect(l).toContain('I am the root and the offspring of David, and the bright and morning star.');
  });
  it('PROVEN-TO-CATCH: the lesson never teaches that Judah is finished when Shiloh comes', () => {
    expect(l).not.toMatch(/Judah (is|was) (then )?(finished|done|dismissed|replaced)(?![^.]*(not|never|no))/i);
    expect(l).toMatch(/UNTIL DOES NOT MEAN THE SCEPTRE LEAVES JUDAH/);
  });
});

describe('SIX — the gathering: humans will listen to Judah, and Judah is still in the ending', () => {
  it('the nations gather to the Lawgiver from Judah', () => {
    expect(l).toContain('to it shall the Gentiles seek');
    expect(l).toContain('he will teach us of his ways, and we will walk in his paths: for out of Zion shall go forth the law, and the word of the LORD from Jerusalem.');
    expect(l).toContain('the isles shall wait for his law.');
    expect(l).toContain('shall take hold of the skirt of him that is a Jew, saying, We will go with you: for we have heard that God is with you.');
    expect(l).toContain('Every one that is of the truth heareth my voice.');
  });
  it('Judah the people remains in the ending', () => {
    expect(l).toContain('In his days Judah shall be saved');
    expect(l).toContain('The LORD also shall save the tents of Judah first');
    expect(l).toContain('Of the tribe of Juda were sealed twelve thousand');
    expect(l).toContain('the names of the twelve tribes of the children of Israel');
    expect(l).toContain('And so all Israel shall be saved: as it is written, There shall come out of Sion the Deliverer');
  });
});

describe('SEVEN — the Lion is the Lamb; the priesthood by a changed law', () => {
  it('hear Lion, see Lamb', () => {
    expect(l).toContain('a Lamb as it had been slain');
    expect(l).toContain('for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation');
    expect(l).toMatch(/The Lion (of Judah )?prevailed by being the Lamb/);
  });
  it('the King of Judah is a priest only after Melchisedec', () => {
    expect(l).toContain('of which tribe Moses spake nothing concerning priesthood');
    expect(l).toContain('a priest for ever after the order of Melchisedec.');
  });
  it('the whole answer is gathered on the one sentence', () => {
    expect(l).toMatch(/the sceptre reached the hand it was made for, and it is not leaving/i);
  });
});

describe('EIGHT — the devil and the sceptre; the one Lawgiver; a whole tribe that carries His law', () => {
  it('the war on the sceptre is recorded by name, and the dragon behind it', () => {
    expect(l).toContain('I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head');
    expect(l).toContain('Every son that is born ye shall cast into the river');
    expect(l).toContain('she arose and destroyed all the seed royal');
    expect(l).toContain('hid in the house of the LORD six years');
    expect(l).toContain('Haman sought to destroy all the Jews that were throughout the whole kingdom');
    expect(l).toContain('slew all the children that were in Bethlehem, and in all the coasts thereof, from two years old and under');
    expect(l).toContain('the dragon stood before the woman which was ready to be delivered, for to devour her child as soon as it was born. And she brought forth a man child, who was to rule all nations with a rod of iron');
    expect(l).toMatch(/THE ROD OF IRON IS THE SCEPTRE/);
  });
  it('the counterfeit sceptre refused; the cross his loss; a short time', () => {
    expect(l).toContain('If thou therefore wilt worship me, all shall be thine.');
    expect(l).toContain('Get thee behind me, satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.');
    expect(l).toContain('had they known it, they would not have crucified the Lord of glory.');
    expect(l).toContain('that through death he might destroy him that had the power of death, that is, the devil');
    expect(l).toContain('because he knoweth that he hath but a short time.');
  });
  it('the Lawgiver is ONE, and He wants His Ways walked, for our good', () => {
    expect(l).toContain('For the LORD is our judge, the LORD is our lawgiver, the LORD is our king; he will save us.');
    expect(l).toContain('There is one lawgiver, who is able to save and to destroy');
    expect(l).toContain('to walk in all his ways, and to love him, and to serve the LORD thy God with all thy heart and with all thy soul, To keep the commandments of the LORD, and his statutes, which I command thee this day for thy good?');
    expect(l).toContain('If ye love me, keep my commandments.');
    expect(l).toContain('his commandments are not grievous.');
    expect(l).toMatch(/FOR THY GOOD/);
  });
  it('PROVEN-TO-CATCH: the whole tribe CARRIES His law; it does not author it', () => {
    expect(l).toContain('ye shall be unto me a kingdom of priests, and an holy nation.');
    expect(l).toContain('for this is your wisdom and your understanding in the sight of the nations');
    expect(l).toContain('written not with ink, but with the Spirit of the living God; not in tables of stone, but in fleshy tables of the heart.');
    expect(l).toContain('These that have turned the world upside down are come hither also');
    expect(l).toMatch(/the tribe does not make law; it CARRIES His/);
    expect(l).not.toMatch(/(each|every) (member|believer) (writes|makes|authors) (the )?law/i);
  });
  it('a certain percentage — the Word’s numbers, and the correction: alignment, not percentage', () => {
    expect(l).toContain('Peradventure ten shall be found there. And he said, I will not destroy it for ten’s sake.');
    expect(l).toContain('if ye can find a man, if there be any that executeth judgment, that seeketh the truth; and I will pardon it.');
    expect(l).toContain('stand in the gap before me for the land, that I should not destroy it: but I found none.');
    expect(l).toContain('By the three hundred men that lapped will I save you');
    expect(l).toContain('there is no restraint to the LORD to save by many or by few.');
    expect(l).toContain('hid in three measures of meal, till the whole was leavened.');
    expect(l).toContain('to be rulers of thousands, and rulers of hundreds, rulers of fifties, and rulers of tens');
    expect(l).toContain('the same commit thou to faithful men, who shall be able to teach others also.');
    expect(l).toMatch(/The Word does not give a percentage/);
    expect(l).toMatch(/the leverage is never the percentage; it is the alignment/);
  });
  it('the god of this world versus the Law — the civil rights movement as established history, no leader quoted', () => {
    expect(l).toContain('the god of this world hath blinded the minds of them which believe not');
    expect(l).toContain('the lust of the flesh, and the lust of the eyes, and the pride of life, is not of the Father, but is of the world.');
    expect(l).toContain('And the world passeth away, and the lust thereof: but he that doeth the will of God abideth for ever.');
    expect(l).toContain('Let my people go');
    expect(l).toContain('let judgment run down as waters, and righteousness as a mighty stream');
    expect(l).toContain('Every valley shall be exalted, and every mountain and hill shall be made low: and the crooked shall be made straight');
    expect(l).toMatch(/civil rights movement/);
    expect(l).toMatch(/1964/);
    expect(l).toMatch(/1965/);
    expect(l).not.toMatch(/King (said|wrote), "/);
  });
  it('media and music are tools; not ours yet His; stars defined by the Word; the millstone guards the children', () => {
    expect(l).toContain('David took an harp, and played with his hand: so Saul was refreshed, and was well, and the evil spirit departed from him.');
    expect(l).toContain('ye fall down and worship the golden image');
    expect(l).toContain('neither is it in our power to redeem them; for other men have our lands and vineyards.');
    expect(l).toContain('The silver is mine, and the gold is mine, saith the LORD of hosts.');
    expect(l).toContain('they that turn many to righteousness as the stars for ever and ever.');
    expect(l).toContain('wandering stars, to whom is reserved the blackness of darkness for ever.');
    expect(l).toContain('it were better for him that a millstone were hanged about his neck');
    expect(l).toContain('he shall turn the heart of the fathers to the children, and the heart of the children to their fathers');
    expect(l).toMatch(/the tool is not the problem; the hand is/);
  });
});

describe('typography — Yahweh in our voice, the KJV untouched inside quotes (DR-0210)', () => {
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
});

// =============================================================================
// L91 — The Author's Own Code (DNA lead-sensor): verbatim KJV
// =============================================================================
// Darrell 2026-08-27 (forwarded an Economic Times science piece): University of
// Illinois chemists taught a strand of DNA to detect lead in water (Yi Lu & Jing
// Li, reported JACS Oct 2000). This lesson sets the Author ABOVE the artifact
// (Word-first): they repurposed a molecule Yahweh authored, so wonder runs up —
// concealment is God's glory and the search our honour (Prov 25:2), the fear of
// the LORD is the wisdom under the knowledge (Job 28:28), detection serves
// protection and the body is His temple. The article's figures are carried AS
// REPORTED (DR-0076); every KJV line below was FETCHED from the repo's own KJV
// this session. A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll91-the-authors-own-code-searched-out-to-guard-his-image'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
const l = lesson.replace(/’/g, "'");

// Fetched verbatim from app/public/bible/kjv (this session), curly apostrophes normalized.
const KJV = {
  'Psalms 139:1': 'O LORD, thou hast searched me, and known me.',
  'Psalms 139:14': 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'Psalms 139:16': 'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written, which in continuance were fashioned, when as yet there was none of them.',
  'Psalms 139:23': 'Search me, O God, and know my heart: try me, and know my thoughts:',
  'Psalms 139:24': 'And see if there be any wicked way in me, and lead me in the way everlasting.',
  'Proverbs 25:2': 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Job 28:3': 'He setteth an end to darkness, and searcheth out all perfection: the stones of darkness, and the shadow of death.',
  'Job 28:12': 'But where shall wisdom be found? and where is the place of understanding?',
  'Job 28:28': 'And unto man he said, Behold, the fear of the Lord, that is wisdom; and to depart from evil is understanding.',
  'Genesis 2:15': 'And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.',
  'Hebrews 4:12': 'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.',
  '1 Corinthians 6:19': 'What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?',
  'Colossians 1:17 (fragment)': 'he is before all things, and by him all things consist',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'Luke 8:17': 'For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad.',
  'Psalms 19:7': 'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
  'Colossians 2:3 (fragment)': 'are hid all the treasures of wisdom and knowledge',
  'Proverbs 2:4-5': 'If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD, and find the knowledge of God.',
};

const QUOTED_FRAGMENTS = [
  'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written, which in continuance were fashioned, when as yet there was none of them.',
  'he is before all things, and by him all things consist',
  'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Surely there is a vein for the silver, and a place for gold where they fine it.',
  'Iron is taken out of the earth, and brass is molten out of the stone.',
  'He setteth an end to darkness, and searcheth out all perfection: the stones of darkness, and the shadow of death.',
  'where shall wisdom be found? and where is the place of understanding?',
  'Behold, the fear of the Lord, that is wisdom; and to depart from evil is understanding.',
  'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.',
  'For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad.',
  'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own',
  'to dress it and to keep it',
  'O LORD, thou hast searched me, and known me. Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.',
  'are hid all the treasures of wisdom and knowledge',
  'Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.',
  // Verse 5 opens "Then" — the lesson once lowercased it mid-sentence; restored 2026-09-06.
  'If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD, and find the knowledge of God.',
  'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
];

// -----------------------------------------------------------------------------
// The corpus, joined as a reader meets it.
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
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// OUR OWN WORDS AND ONE TERM OF ART. `DNAzyme` is the researchers' own term for
// the molecule, quoted as a term rather than as a claim. `breakthrough` is
// scare-quoted by us, to be examined. `hidden lead` is our coined metaphor, and
// `as reported,` is our own provenance marker. None of the four bands needs any
// allowlist at all -- every quoted span in all four is verbatim corpus text.
const OUR_OWN_QUOTED = [
  'DNAzyme', 'DNAzyme,',          // the researchers' term of art
  'breakthrough',                  // scare-quoted by us
  'hidden lead',                   // our coined metaphor
  'as reported,',                  // our provenance marker
];

describe('L91 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 139:14; Proverbs 25:2; Job 28:28'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('the Word LEADS the science, in order, and keeps provenance honest', () => {
    expect(l).toContain('THE ARTICLE, AND THE AUTHOR ABOVE IT');
    expect(l).toContain('AS THE ARTICLE REPORTED THEM'); // figures carried as reported (DR-0076)
    expect(l).toContain('not independently verified');
    const order = [
      '1) WHOSE CODE IS IT?',
      '2) THE GLORY OF THE HIDDEN',
      '3) MAN MINES THE DARKNESS',
      '4) DETECTING THE HIDDEN POISON',
      '5) GUARDING THE TEMPLE',
      '6) THE SEARCH THAT NEVER ENDS',
      '7) THE FEAR OF THE LORD UNDER THE KNOWLEDGE',
      '8) SEARCH ME',
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
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or one of the listed non-Scripture spans', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(80);
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

  it('NO claim is attributed to the paper inside quotation marks — the eleventh false attribution', () => {
    // Found by this lesson's audit, and the proof needed no outside source: the
    // SAME purported quotation appeared in THREE different forms --
    //
    //   bigIdea    the first sensor "was not a finished product,"
    //   senior     the paper's own honesty — "not a finished product,"
    //   prompt     The paper admitted its sensor was "not a finished product."
    //
    // A verbatim quotation cannot have three forms, so at most one could be
    // right, and no paper text exists in this repo for any of them. This is the
    // same class as L95's misquoted executive, now pointed at a research paper:
    // the defect appears wherever we quote a source we do not hold. The claim is
    // KEPT -- paraphrased, attributed, and carried under this lesson's own
    // provenance marker -- because the claim is almost certainly true and its
    // exact wording is what we cannot vouch for.
    expect(l).not.toContain('"was not a finished product');
    expect(l).not.toContain('"not a finished product');
    expect(l, 'the claim itself is kept, unquoted').toMatch(/not a finished product/);
  });

  it('the PROVENANCE SPLIT is stated, and it is this lesson\'s own integrity marker', () => {
    // The base prose does the thing every lesson built on an outside report
    // should do: name which figures are carried as reported and which text is
    // quoted verbatim. That asymmetry is the whole of DR-0076 in one sentence,
    // and it is the reason the Word's quotations in this lesson can be trusted
    // while the article's numbers are only relayed.
    expect(l, 'the figures are marked as the report\'s').toMatch(/as it reported them|come from the report/i);
    expect(l, 'and explicitly not verified by us').toMatch(/not independently verified here|have not checked them ourselves/i);
    expect(l, 'while the Word is marked as verbatim').toMatch(/quoted verbatim|copied word for word/i);
  });

  it('is PROVEN-TO-CATCH — on this lesson\'s own hinges, each read from the corpus', () => {
    expect(KJV_FLOW.includes('It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.')).toBe(true);
    expect(KJV_FLOW.includes('It is the glory of God to conceal a thing, but the honour of kings is to search out a matter.')).toBe(false);
    expect(KJV_FLOW.includes('Behold, the fear of the Lord, that is wisdom')).toBe(true);
    expect(KJV_FLOW.includes('Behold, the fear of the LORD, that is wisdom')).toBe(false);   // Job 28:28 reads `Lord`, not `LORD`
    expect(KJV_FLOW.includes('And see if there be any wicked way in me')).toBe(true);
    expect(KJV_FLOW.includes('and see if there be any wicked way in me')).toBe(false);
    expect(KJV_FLOW.includes('making wise the simple')).toBe(true);
    expect(KJV_FLOW.includes('making the simple wise')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(3500);
    }
  });

  it('every band carries all the movements, not a subset', () => {
    const EVERY_BAND = [
      'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
      'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written',
      'he is before all things, and by him all things consist',
      'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
      'Surely there is a vein for the silver, and a place for gold where they fine it.',
      'He setteth an end to darkness, and searcheth out all perfection',
      'where shall wisdom be found? and where is the place of understanding?',
      'Behold, the fear of the Lord, that is wisdom; and to depart from evil is understanding.',
      'For the word of God is quick, and powerful, and sharper than any twoedged sword',
      'is a discerner of the thoughts and intents of the heart.',
      'For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad.',
      'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
      'know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?',
      'to dress it and to keep it',
      'unperfect',
      'O LORD, thou hast searched me, and known me. Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.',
      'are hid all the treasures of wisdom and knowledge',
      'If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD, and find the knowledge of God.',
      'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
      'Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.',
      'KNOWLEDGE',
      'a light nobody obeys',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) expect(t, `${band} lost: ${frag}`).toContain(frag);
    }
  });

  it('every band keeps KNOWLEDGE and WISDOM as DIFFERENT faculties', () => {
    // The distinction the lesson exists to make, and the one the age collapses.
    // Each band may phrase it its own way, so the check watches the teaching --
    // the L92 discipline: never require the adult's wording from a child's band.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the sensor is knowledge, not wisdom`)
        .toMatch(/sensor is KNOWLEDGE|clever sensor is KNOWLEDGE/i);
      expect(t, `${band} lost what wisdom actually is`)
        .toMatch(/whose world you are (searching|digging in)|whose world one is searching/i);
      expect(t, `${band} lost that they are not the same faculty`)
        .toMatch(/not the same faculty|two different things/i);
    }
  });

  it('every band keeps CONCEALMENT AS INVITATION, not hostility', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the hiding was never hostility`)
        .toMatch(/never hostility|never Him being mean/i);
      expect(t, `${band} lost that it was an invitation`).toMatch(/an invitation/i);
    }
  });

  it('every band keeps DETECTION AS MERCY ONLY IF IT ACTS', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that a sensor changing nothing is a light nobody obeys`)
        .toMatch(/a light nobody obeys/);
    }
  });

  it('every band keeps DOMINION AS KEEPING, not plundering', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the keeping/plundering distinction`)
        .toMatch(/KEEPING, not plundering|KEEPING it - not wrecking it/);
    }
  });

  it('every band keeps OUR knowing provisional and HIS complete', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that ours stays unperfect`).toContain('unperfect');
      expect(t, `${band} lost that He knew each before there was one`)
        .toMatch(/before there was one|before there WAS one/);
    }
  });

  it('every band carries the provenance discipline in its own words', () => {
    // A lesson built on an outside report must say which parts are relayed and
    // which are verbatim -- in EVERY band, not only the adult prose, because a
    // child reading the child band is the reader least able to supply the
    // caveat for himself.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that the figures are the report's`)
        .toMatch(/as it reported them|come from the report/i);
      expect(t, `${band} lost that we have not verified them`)
        .toMatch(/not independently verified here|have not checked them ourselves/i);
      expect(t, `${band} lost that the Word is verbatim`)
        .toMatch(/quoted verbatim|copied word for word/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // TWENTY-FIRST consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. Its old form was a labelled outline --
    // `WHOSE CODE (Psalm 139):`, `THE LIMIT AND THE COMPLETENESS (...)` -- notes
    // to be delivered rather than prose to be read.
    const senior = level('senior');
    expect(senior).not.toMatch(/senior: 'Teach /);
    expect(senior).not.toMatch(/\bTeach this\b/);
    expect(senior).not.toMatch(/\bClose on\b/);
    expect(senior).not.toMatch(/WHOSE CODE \(Psalm/);
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });

  it('the senior band turns each movement toward a reader who HAS the decades', () => {
    const senior = level('senior');
    expect(senior, 'the members were written before they were fashioned, so the writing does not depend on their present condition')
      .toMatch(/did not depend on the condition they are in now/i);
    expect(senior, 'an invitation to a lifetime of searching does not expire partway')
      .toMatch(/does not expire partway/i);
    expect(senior, 'the long searcher is best placed to feel Job 28\'s limit as true')
      .toMatch(/best placed to feel that limit/i);
    expect(senior, 'the Genesis mandate still reads the same when the body kept is one\'s own')
      .toMatch(/begun to need keeping/i);
    expect(senior, 'provisional knowing is a release, not an indictment')
      .toMatch(/release rather than an indictment/i);
    expect(senior, 'one hands the searching on rather than running out of time')
      .toMatch(/hands the searching on/i);
    expect(senior, 'and the entry fee was never cleverness nor is it failing memory')
      .toMatch(/not failing memory/i);
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Proverbs 25:2'].endsWith('search out a matter.')).toBe(true);
    expect(KJV['Job 28:28']).toContain('the fear of the Lord, that is wisdom');
    expect(KJV['Psalms 139:14']).toContain('fearfully and wonderfully made');
    expect(KJV['Psalms 139:23'].startsWith('Search me, O God')).toBe(true);
    expect(KJV['Hebrews 4:12']).toContain('discerner of the thoughts and intents of the heart');
    expect(KJV['Psalms 19:7'].endsWith('making wise the simple.')).toBe(true);
  });
});

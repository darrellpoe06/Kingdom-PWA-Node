// @vitest-environment node
// =============================================================================
// L259 — "His Name Kept in Stone and Silver": five witnesses to the name that
// endured. DR-1221.
// =============================================================================
// Darrell sent a link into the PoeTech app's own lesson queue with one word on
// it, Lesson. The research road fetched the whole reading on our own machines
// (the cloud path to that source is blocked), and the row waited about
// eighty-eight hours before it was built. What came back was a MACHINE
// transcription of a video teaching — a machine's hearing, not the speaker's
// own text — so nothing in the lesson quotes his wording.
//
// THE DIVISION OF LABOUR WITH ll155. ll155 (Yahweh — His Name, and Why This
// House Says It) is the DOCTRINAL case for the house rule on the name: the
// generic word is a category the Word itself uses of judges, idols and the
// adversary, while the name is His alone. THIS lesson is the EVIDENTIAL case,
// and it cites ll155 rather than restating it. The one-teaching-one-lesson
// guard is satisfied structurally: the title openings differ ("his name kept"
// against "yahweh his name"), which is what that guard reads alongside shared
// ground.
//
// WHY THIS LESSON IS BUILT AROUND ITS OWN HONESTY. The source is one speaker's
// claims about five dated finds, and a lesson that oversells one stone has
// taught its reader to trust a thing that cannot hold. So the pins below cover
// the CORRECTIONS as hard as they cover the verses:
//   • SOLEB is the contested one and is named as contested in every band —
//     the temple, the list and the four signs are established; whether those
//     signs there name the One, and whether those nomads are Israelites, is
//     genuinely argued by people who read Egyptian. Nothing is built on it.
//   • THE DATING of Amenhotep the third is corrected in every band: about 1390
//     to 1350 before Christ, the fourteenth century, where the source said the
//     end of the fifteenth.
//   • THE VOCALISATION LIMIT is stated rather than left: the consonants are
//     certain, the vowels are not transmitted, and "Yahweh" is a reconstruction
//     rather than a recording. The house rule was never about the sound.
//   • THE BRIGHT LINE is the whole craft of the lesson. The speaker says on
//     camera that he will substitute the name into the verses as he reads them.
//     We do not: every "God" and every "LORD" the King James prints stands
//     exactly as printed, and Yahweh appears only in sentences of our own. The
//     checks below assert BOTH halves — the name present in our prose, the
//     generic word absent from it, and no quotation altered.
//
// MEASURED BEFORE THE SPLICE (scratchpad run over the draft, before it touched
// the catalog): 233 referenced spans, 0 verbatim faults; fullness 0.58 / 0.87 /
// 0.96 / 1.13 against floors 0.5 / 0.6 / 0.6 / 0.6; authored-prose grades child
// 1.11, youth 6.02, teen 9.41, senior 11.35 (rising, child under 5.0); worst
// band overlap 0.26 against a 0.5 ceiling; every band names the lesson; every
// place carries all three directions; 0 generic "God" in our own prose in any
// of the seven reader places.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { titleOpening, sharedGround, duplicatePairsIn, MIN_SHARED_VERSES } from '../lib/one-teaching-one-lesson.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};
const BANDS = ['child', 'youth', 'teen', 'senior'];
const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (mod) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(mod, '');
  return spans;
};
const verbatimFaults = (mod) => {
  const bad = [];
  for (const s of spansOf(mod)) {
    const nums = [];
    for (const part of s.label.split(',')) {
      const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
      else if (part.trim()) nums.push(Number(part.trim()));
    }
    const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
    if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
  }
  return bad;
};

const ID = 'll259-his-name-kept-in-stone-and-silver';
const PREV = 'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants';
const DOCTRINAL = 'll155-yahweh-his-name-and-why-this-house-says-it';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

// The 31 strands every reader meets, whichever band they read. One verse per
// load-bearing point, so a band cannot quietly drop a movement.
const IN_EVERY_BAND = [
  ['the tenure clause He attached Himself', 'Exodus', 3, 15, 'this is my name for ever, and this is my memorial unto all generations.'],
  ['the tenure repeated in the psalms', 'Psalms', 135, 13, 'Thy name, O LORD, endureth for ever; and thy memorial, O LORD, throughout all generations.'],
  ['the name outlasts the sun', 'Psalms', 72, 17, 'His name shall endure for ever'],
  ['the name is not transferable', 'Isaiah', 42, 8, 'I am the LORD: that is my name'],
  ['the plurality requirement', 'Deuteronomy', 19, 15, 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.'],
  ['stones set out so a child would ask', 'Joshua', 4, 6, 'when your children ask their fathers in time to come, saying, What mean ye by these stones?'],
  ['where He is silent we are silent', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever'],
  ['the Word names Mesha', '2 Kings', 3, 4, 'And Mesha king of Moab was a sheepmaster'],
  ['the Word names Moab by its god', 'Numbers', 21, 29, 'Woe to thee, Moab! thou art undone, O people of Chemosh'],
  ['the blessing on the silver, first line', 'Numbers', 6, 24, 'The LORD bless thee, and keep thee:'],
  ['the blessing, second line', 'Numbers', 6, 25, 'The LORD make his face shine upon thee, and be gracious unto thee:'],
  ['the blessing, third line', 'Numbers', 6, 26, 'The LORD lift up his countenance upon thee, and give thee peace.'],
  ['why anyone would wear it', 'Numbers', 6, 27, 'And they shall put my name upon the children of Israel; and I will bless them.'],
  ['the city He had already named', '2 Kings', 21, 7, 'In this house, and in Jerusalem, which I have chosen out of all tribes of Israel, will I put my name for ever:'],
  ['the ground is not the foundation', 'Isaiah', 40, 8, 'but the word of our God shall stand for ever.'],
  ['His word settled, not dug up', 'Psalms', 119, 89, 'For ever, O LORD, thy word is settled in heaven.'],
  ['His words outlast the earth', 'Matthew', 24, 35, 'Heaven and earth shall pass away, but my words shall not pass away.'],
  ['the name guarded by commandment', 'Exodus', 20, 7, 'Thou shalt not take the name of the LORD thy God in vain'],
  ['the taunt that named the forgotten', '2 Kings', 18, 34, 'Where are the gods of Hamath, and of Arpad?'],
  ['why those names went out of use', '2 Kings', 19, 18, 'for they were no gods, but the work of men’s hands, wood and stone'],
  ['He puts out a name', 'Psalms', 9, 5, 'thou hast put out their name for ever and ever.'],
  ['the name that saves, with its reason', 'Matthew', 1, 21, 'thou shalt call his name JESUS: for he shall save his people from their sins.'],
  ['salvation attaches to a name', 'Acts', 4, 12, 'Neither is there salvation in any other'],
  ['the Lamb of Yahweh', 'John', 1, 29, 'Behold the Lamb of God, which taketh away the sin of the world.'],
  ['the Eternal Son of Yahweh', 'Hebrews', 1, 8, 'Thy throne, O God, is for ever and ever'],
  ['the name above every name', 'Philippians', 2, 9, 'given him a name which is above every name'],
  ['every knee at that name', 'Philippians', 2, 10, 'That at the name of Jesus every knee should bow'],
  ['one LORD', 'Deuteronomy', 6, 4, 'Hear, O Israel: The LORD our God is one LORD:'],
  ['talk of them in the four places', 'Deuteronomy', 6, 7, 'And thou shalt teach them diligently unto thy children'],
  ['friend to friend', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.'],
  ['fathers and children turned toward each other', 'Malachi', 4, 6, 'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
];

// Carried somewhere in the lesson rather than in every band.
const ELSEWHERE = [
  ['I AM THAT I AM', 'Exodus', 3, 14, 'I AM THAT I AM'],
  ['the name made known at the exodus', 'Exodus', 6, 3, 'but by my name JEHOVAH was I not known to them.'],
  ['He endures, and so does the remembrance', 'Psalms', 102, 12, 'But thou, O LORD, shalt endure for ever; and thy remembrance unto all generations.'],
  ['a memorial for the children', 'Joshua', 4, 7, 'and these stones shall be for a memorial unto the children of Israel for ever.'],
  ['the ancestry was itinerant', 'Deuteronomy', 26, 5, 'A Syrian ready to perish was my father'],
  ['declared in front of an enemy', 'Exodus', 9, 16, 'that my name may be declared throughout all the earth.'],
  ['the taunt opens', '2 Kings', 18, 33, 'Hath any of the gods of the nations delivered at all his land out of the hand of the king of Assyria?'],
  ['the taunt lands on Him', '2 Kings', 18, 35, 'that the LORD should deliver Jerusalem out of mine hand?'],
  ['Hezekiah grants the premise', '2 Kings', 19, 17, 'Of a truth, LORD, the kings of Assyria have destroyed the nations and their lands,'],
  ['so the kingdoms may know', '2 Kings', 19, 19, 'that all the kingdoms of the earth may know that thou art the LORD God, even thou only.'],
  ['the answer that night was not an argument', '2 Kings', 19, 35, 'the angel of the LORD went out, and smote in the camp of the Assyrians an hundred fourscore and five thousand'],
  ['their memorial perished', 'Psalms', 9, 6, 'and thou hast destroyed cities; their memorial is perished with them.'],
];

describe('L259 is in the catalog once, numbered, dated, and placed', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "260 is absent": a pin on the
  // catalog never growing is the one pin certain to break.
  it('appears exactly once, after L258, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV);
    expect(prev, 'L258 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L259 follows L258 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 259 once, leaves no new hole, and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 259)).toHaveLength(1);
    expect(claimed.includes(258), '259 follows 258 — no number was jumped').toBe(true);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(259); // a floor, never an equality
    for (const n of [211, 212, 235]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });

  it('carries 2026-10-27, the day it joined the course, at or after L258’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    expect(LIVING_LESSONS_ADDED[PREV] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('names its road honestly: the app’s own queue, the research road, a machine transcription', () => {
    expect(L.lesson).toContain('sent a link into the PoeTech app itself');
    expect(L.lesson).toContain('the app’s own lesson queue');
    expect(L.lesson).toContain('research road then fetched the whole of the reading on our own machines');
    expect(L.lesson).toContain('a machine’s hearing of a man’s voice, not his own written text');
  });

  it('names the speaker only on the basis the source gives, and attaches no label to him', () => {
    // The transcript never names him; he names his own book on camera, which is
    // catalogued under one author. That is the whole basis, and it is stated as
    // the basis. Nothing about his beliefs, affiliations or motives is asserted
    // — the exact correction World Issues 21 needed.
    expect(L.lesson).toContain('Joel P. Kramer');
    expect(L.lesson).toContain('that is the only basis on which he is named here');
    expect(L.lesson).toContain('Nothing about his beliefs, his affiliations or his motives is asserted');
    for (const bad of [/evangelical/i, /fundamentalist/i, /denomination/i, /grift/i, /for the money/i]) {
      expect(bad.test(whole), `a label or motive the source does not state: ${bad}`).toBe(false);
    }
  });

  it('the adult lesson walks its eleven movements, in order', () => {
    const order = [
      'WHERE THIS CAME FROM, PLAINLY',
      'ONE. HE NAMED HIMSELF, AND HE ATTACHED A TENURE CLAUSE',
      'TWO. WHAT A WITNESS CAN DO, AND WHAT IT CANNOT',
      'THREE. THE FIRST WITNESS: SOLEB, AND THE ONE THAT IS HONESTLY ARGUED',
      'FOUR. THE SECOND WITNESS: AN ENEMY CUT IT IN STONE',
      'FIVE. THE THIRD WITNESS: SILVER, WORN AT THE THROAT',
      'SIX. THE FOURTH WITNESS: THE SCROLLS IN THE CAVES',
      'SEVEN. THE FIFTH WITNESS: THE BOOK ON THE SHELF THIS WEEK, AND THE LIMIT STATED',
      'EIGHT. THE NAMES THAT WERE NOT KEPT, AND THE REASON THE WORD GIVES',
      'NINE. THE NAME THAT SAVES',
      'TEN. WHY THIS HOUSE SAYS THE NAME, AND NEVER INSIDE A QUOTE',
      'ELEVEN. TALK ABOUT IT TOGETHER',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L259 carries all five witnesses, and its corrections, in every band', () => {
  it.each([
    [/Soleb/, 'the first witness by name'],
    [/Moabite Stone|Mesha/, 'the second witness by name'],
    [/Ketef Hinnom/, 'the third witness by name'],
    [/Qumran|Dead Sea/, 'the fourth witness by name'],
    [/Hebrew Bible/, 'the fifth witness by name'],
    [/silver/i, 'the silver'],
    [/basalt|black rock/i, 'the material of the slab'],
    [/\bfive witnesses\b/i, 'the count'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });

  it.each(ALL)('%s names Soleb as genuinely argued and refuses to build on it', (k) => {
    expect(/argue/i.test(TEXTS[k]), `${k} does not say the Soleb reading is argued`).toBe(true);
    expect(/Egyptian/.test(TEXTS[k]), `${k} does not say who argues it`).toBe(true);
    expect(/would still stand|other four would still|Four witnesses remain|four witnesses would still/i.test(TEXTS[k]),
      `${k} never says the lesson survives Soleb being struck off`).toBe(true);
  });

  it.each(ALL)('%s corrects the dating the source got wrong', (k) => {
    // The source said the end of the 15th century; Amenhotep III is normally
    // placed about 1390-1350 BC, the 14th. Every band says so in its own words.
    expect(/1390|1300s|fourteenth/i.test(TEXTS[k]), `${k} drops the corrected dating`).toBe(true);
    expect(/fifteenth|1400s/i.test(TEXTS[k]), `${k} does not say what the source said`).toBe(true);
  });

  it.each(ALL)('%s states the vocalisation limit rather than leaving it', (k) => {
    expect(/reconstruction|best guess/i.test(TEXTS[k]), `${k} presents the sound as certain`).toBe(true);
    expect(/consonants are certain|letters are sure/i.test(TEXTS[k]), `${k} does not say what IS certain`).toBe(true);
    expect(/never about the sound|not about the sound|the point/i.test(TEXTS[k]), `${k} does not say why the limit costs nothing`).toBe(true);
  });

  it.each(ALL)('%s says the ground is not the foundation', (k) => {
    expect(TEXTS[k].includes('(Isaiah 40:8)'), `${k} drops Isaiah 40:8`).toBe(true);
  });

  it.each(ALL)('%s quotes every strand every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n})`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
});

describe('L259 — the bright line, which is the whole craft of this lesson', () => {
  it.each(ALL)('%s names Him by covenant name and never the generic in our own prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });

  it('the generic-name check is PROVEN TO CATCH "God" dropped into our voice', () => {
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(TEXTS.child))).toBe(false);
  });

  it('bigIdea and inApp hold the same line as the bands', () => {
    for (const [k, t] of [['bigIdea', L.bigIdea], ['inApp', L.inApp]]) {
      const ours = ourProseOnly(t);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him`).toBe(true);
      expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic in our voice`).toBe(false);
    }
  });

  it.each(ALL)('%s says plainly that we never substitute the name into a quotation', (k) => {
    expect(/substitut|swap/i.test(TEXTS[k]), `${k} never names the substitution`).toBe(true);
    expect(/We do not\b|we leave it just like that/i.test(TEXTS[k]), `${k} never says we refuse it`).toBe(true);
  });

  it('teaches the typography as theology: Chemosh keeps its capital inside the verse, chemosh carries none in ours', () => {
    // Numbers 21:29 prints Chemosh capitalised. Inside the quotation it stays
    // exactly as printed; in any sentence of our own it is lower case, and so
    // are the rest of them (CLAUDE.md, senior to the source).
    for (const k of ALL) {
      expect(TEXTS[k].includes('O people of Chemosh'), `${k} drops the quoted capital`).toBe(true);
      expect(/\bchemosh\b/.test(ourProseOnly(TEXTS[k])), `${k} never writes it lower case in our prose`).toBe(true);
      expect(/\bChemosh\b/.test(ourProseOnly(TEXTS[k])), `${k} capitalises a false god in our own prose`).toBe(false);
    }
    const ours = ALL.map((k) => ourProseOnly(TEXTS[k])).join('\n') + ourProseOnly(L.bigIdea);
    for (const name of ['Marduk', 'Asshur', 'Baal', 'Molech', 'Amun']) {
      expect(ours.includes(name), `${name} is capitalised in our own prose`).toBe(false);
    }
    for (const name of ['marduk', 'asshur', 'baal']) {
      expect(ours.includes(name), `${name} is never named`).toBe(true);
    }
  });
});

describe('L259 — every quoted span is the verse it names', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];

  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(200);
  });

  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('would catch an altered quotation, and a Yahweh substituted into a verse (proven-to-catch)', () => {
    const altered = {
      ...L,
      levels: { ...L.levels, child: L.levels.child.replace('The LORD bless thee, and keep thee:"', 'The LORD bless you and keep you:"') },
    };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Numbers 6:24'))).toBe(true);
    // The bright line itself, as a machine check: the name must never be put
    // inside a quotation, even where the four letters are what stands behind it.
    const yahwehed = { ...L, lesson: L.lesson.replace('I am the LORD: that is my name', 'I am Yahweh: that is my name') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Isaiah 42:8'))).toBe(true);
  });

  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });

  it('marks no elision and recites no record number to a reader', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on, and every anchor is really quoted', () => {
    const anchored = L.anchor.ref.split(';').map((r) => r.trim());
    const quoted = new Set(spansOf(L).map((s) => `${s.book} ${s.ch}:${s.label}`));
    const unanchored = [...quoted].filter((r) => !anchored.includes(r));
    expect(unanchored, 'a verse is taught but not in anchor.ref (Search it out derives its links from these)').toEqual([]);
    const unquoted = anchored.filter((r) => !quoted.has(r));
    expect(unquoted, 'an anchor names a verse the lesson never quotes').toEqual([]);
    expect(L.anchor.ref.startsWith('Exodus 3:14')).toBe(true);
  });

  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L259 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 600) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });

  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });

  it('sends the reader all three ways in every place, and would report a band that stops (proven-to-catch)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    // Strip every sentence in ONE band that supplies the friend direction. The
    // pooled check still reads whole — that is the hazard DR-0795 names.
    const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);
    const friendless = sentences(L.levels.teen)
      .filter((s) => placesMissingDirections({ lesson: s }).some((p) => p.missing.includes('friends')))
      .join(' ');
    const mutated = { ...L, levels: { ...L.levels, teen: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is the hazard').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'teen', missing: ['friends'] }]);
  });
});

describe('L259 — the doctrinal half is cited, not restated', () => {
  it('ll155 is in the catalog and this lesson sends the reader to it rather than re-arguing it', () => {
    const doctrinal = LIVING_LESSONS_MODULES.find((m) => m.id === DOCTRINAL);
    expect(doctrinal, 'll155 carries the doctrinal case').toBeTruthy();
    expect(/taught in full elsewhere in this course|taught at length elsewhere within this course/i.test(whole),
      'the lesson does not point at the doctrinal half').toBe(true);
    expect(L.facilitator.talkingPoints.some((t) => /doctrinal half/i.test(t)),
      'the facilitator is not told where the doctrinal half lives').toBe(true);
  });

  it('the pair clears the duplicate guard on BOTH of its conditions, measured — not by luck', () => {
    const doctrinal = LIVING_LESSONS_MODULES.find((m) => m.id === DOCTRINAL);
    // MEASURED 2026-10-27 rather than assumed (DR-0076 §4). The guard fires only
    // when a pair shares a three-word title opening AND at least
    // MIN_SHARED_VERSES of ground. This pair clears it twice over, which is the
    // real reason the two lessons can sit beside each other:
    //   openings differ — "his name kept" against "yahweh his name"
    //   ground is 4 shared verses of 43 and 15, which is 27% of the smaller and
    //   well under the 10-verse floor. The evidential case stands on Numbers 6,
    //   2 Kings 18-19, Joshua 4 and the five finds; the doctrinal case stands on
    //   Psalms 82, John 10, 1 Corinthians 8 and Isaiah 44. They argue the same
    //   rule from different texts, which is what a pair is supposed to be.
    const g = sharedGround(L, doctrinal);
    expect(titleOpening(L.title)).not.toBe(titleOpening(doctrinal.title));
    expect(g.shared).toBe(4);
    expect(g.shared).toBeLessThan(MIN_SHARED_VERSES);
    expect(duplicatePairsIn([L, doctrinal])).toEqual([]);
  });

  it('PROVEN TO CATCH: the guard fires on the real hazard shape — this title opening over this ground', () => {
    // A title collision alone cannot fire the guard on this pair, because the
    // ground is only 4 verses; asserting that it would is the kind of test that
    // reads green while proving nothing. So the break is built to the shape the
    // guard actually exists for: THIS lesson's own name and THIS lesson's own
    // anchor, claimed twice — the 2026-10-21 defect (DR-1185) that made Darrell
    // ask "Same lesson from before?!!!!!!!!" with two screenshots up.
    const twin = { ...L, id: 'll999-his-name-kept-in-stone-and-silver-again', title: 'His Name Kept in Stone and Silver — the Five Finds' };
    expect(titleOpening(twin.title)).toBe(titleOpening(L.title));
    expect(sharedGround(L, twin).shared).toBeGreaterThanOrEqual(MIN_SHARED_VERSES);
    const pairs = duplicatePairsIn([L, twin]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].opening).toBe('his name kept');
    // And the guard does NOT fire on the same ground under a different name,
    // which is the distinction that killed two earlier designs of it.
    expect(duplicatePairsIn([L, { ...twin, title: 'The Five Finds and the Name They Carry' }])).toEqual([]);
  });
});

describe('L259 — two stories, the full teaching shape', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });

  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    expect(light.title).toBe('The Name in the Back-Step Concrete');
    expect(/Soft things keep a name for a while\. Hard things keep handing it back\./.test(light.body)).toBe(true);
    expect(solemn.title).toBe('The Hall Where Nobody Prays');
    expect(/not one living soul anywhere would get on their knees/.test(solemn.body)).toBe(true);
    // The museum cards are the control group of the lesson, in lower case.
    expect(/chemosh\. marduk\. asshur\. baal\. amun\./.test(solemn.body)).toBe(true);
  });

  it('has the full teaching shape', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.benefits.length).toBeGreaterThanOrEqual(11);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(L.bigIdea.length).toBeGreaterThan(400);
    expect(L.inApp).toContain('TALK ABOUT IT TOGETHER');
  });

  it('the quiz asks about the honesty, not only the facts, and its answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
    const quiz = JSON.stringify(L.quiz);
    expect(/weakest/.test(quiz), 'the quiz never asks which witness is weakest').toBe(true);
    expect(/reconstruction/.test(quiz), 'the quiz never asks about the stated limit').toBe(true);
    expect(/hostile testimony/.test(quiz), 'the quiz never asks why the enemy’s stone is strongest').toBe(true);
  });
});

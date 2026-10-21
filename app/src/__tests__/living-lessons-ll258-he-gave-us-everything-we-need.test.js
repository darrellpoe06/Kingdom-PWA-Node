// @vitest-environment node
// =============================================================================
// L258 — "He Gave Us Everything We Need — Until We Want What He Wants": what
// Darrell spoke into the house on 2026-10-21, built the same session (a spoken
// teaching is build input). DR-1181.
// =============================================================================
// One spoken word, closed in Jesus' name. Rendered for meaning (DR-0331):
// Yahweh expects us to crown ourselves; He gave us the instructions, the
// systems, the blueprint, the Holy Spirit, His Son, Himself, and love, so He
// gave us everything we need to fulfill what HE wants, not necessarily what we
// want; until we want what He wants our desires do not change, and when we get
// it, His priority becomes the highest priority; till we get Him right we do
// not get right, and after that we can get right, real right.
//
// THE WORD EXPLAINS THE WORD (DR-0098). The one line that could be misread —
// "crown ourselves" — is taught from 2 Timothy 4:7-8 (the crown is laid up by
// Him; the fighting, finishing and keeping are ours), Revelation 3:11 (a crown
// can be let go), Philippians 2:12-13 (He works in; we work out) and Revelation
// 4:10 (a received crown is cast before the throne). It is never taught as
// pride, and the gate pins the verse that keeps it from being.
//
// WHAT THE CHECKS MEASURED BEFORE COMMIT (scratchpad gate over the draft,
// before it touched the catalog): 297 referenced spans, 0 verbatim faults;
// fullness 0.66 / 0.72 / 0.77 / 1.04 against floors 0.5 / 0.6 / 0.6 / 0.6;
// authored-prose grades child -0.34, youth 2.69, teen 3.82, senior 7.28 (the
// ladder rises by more than one at each step; the child band is under 5.0);
// worst band overlap 0.21; every band names the lesson; every place carries
// all three directions; one straight apostrophe in the teen band, fixed
// before the splice.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

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
const spansOf = (L) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');
  return spans;
};
const verbatimFaults = (L) => {
  const bad = [];
  for (const s of spansOf(L)) {
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

const ID = 'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants';
const PREV = 'll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you" (Matthew 6:33).';

// Quoted in every band — his list, one verse under each gift, and the hinge.
const IN_EVERY_BAND = [
  ['the crown is laid up by Him', '2 Timothy', 4, 8, 'there is laid up for me a crown of righteousness'],
  ['the running is ours', '2 Timothy', 4, 7, 'I have fought a good fight, I have finished my course, I have kept the faith'],
  ['run to obtain', '1 Corinthians', 9, 24, 'So run, that ye may obtain'],
  ['a crown can be let go', 'Revelation', 3, 11, 'hold that fast which thou hast, that no man take thy crown'],
  ['He works in, we work out', 'Philippians', 2, 13, 'For it is God which worketh in you both to will and to do of his good pleasure'],
  ['crowns are cast before the throne', 'Revelation', 4, 10, 'cast their crowns before the throne'],
  ['the instructions are near', 'Deuteronomy', 30, 14, 'But the word is very nigh unto thee, in thy mouth, and in thy heart, that thou mayest do it'],
  ['a lamp for the next step', 'Psalms', 119, 105, 'Thy word is a lamp unto my feet, and a light unto my path'],
  ['throughly furnished', '2 Timothy', 3, 17, 'throughly furnished unto all good works'],
  ['the pattern', 'Hebrews', 8, 5, 'that thou make all things according to the pattern shewed to thee in the mount'],
  ['the Resources for the build', 'Exodus', 31, 3, 'in wisdom, and in understanding, and in knowledge, and in all manner of workmanship'],
  ['except the LORD build', 'Psalms', 127, 1, 'Except the LORD build the house, they labour in vain that build it'],
  ['the Teacher moved in', 'John', 14, 26, 'he shall teach you all things'],
  ['He gave His Son', 'John', 3, 16, 'he gave his only begotten Son'],
  ['He gave Himself', 'John', 14, 23, 'we will come unto him, and make our abode with him'],
  ['the greatest gift proves the rest', 'Romans', 8, 32, 'how shall he not with him also freely give us all things?'],
  ['love came first', '1 John', 4, 19, 'We love him, because he first loved us'],
  ['while we were yet sinners', 'Romans', 5, 8, 'while we were yet sinners, Christ died for us'],
  ['Love is senior', '1 Corinthians', 13, 2, 'and have not charity, I am nothing'],
  ['all things that pertain', '2 Peter', 1, 3, 'his divine power hath given unto us all things that pertain unto life and godliness'],
  ['not my will', 'Luke', 22, 42, 'not my will, but thine, be done'],
  ['ask amiss', 'James', 4, 3, 'Ye ask, and receive not, because ye ask amiss'],
  ['delight precedes desire', 'Psalms', 37, 4, 'Delight thyself also in the LORD: and he shall give thee the desires of thine heart'],
  ['a new heart', 'Ezekiel', 36, 26, 'A new heart also will I give you'],
  ['according to His will', '1 John', 5, 14, 'if we ask any thing according to his will, he heareth us'],
  ['seek first', 'Matthew', 6, 33, 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you'],
  ['cieled houses', 'Haggai', 1, 4, 'Is it time for you, O ye, to dwell in your cieled houses, and this house lie waste?'],
  ['it came to little', 'Haggai', 1, 9, 'Ye looked for much, and lo, it came to little'],
  ['no other foundation', '1 Corinthians', 3, 11, 'For other foundation can no man lay than that is laid, which is Jesus Christ'],
  ['founded upon a rock', 'Matthew', 7, 25, 'it fell not: for it was founded upon a rock'],
  ['in My name', 'John', 14, 13, 'And whatsoever ye shall ask in my name, that will I do'],
  ['teach me to do Thy will', 'Psalms', 143, 10, 'Teach me to do thy will; for thou art my God'],
];
const ELSEWHERE = [
  ['an incorruptible crown', '1 Corinthians', 9, 25, 'an incorruptible'],
  ['the crown of life', 'James', 1, 12, 'he shall receive the crown of life'],
  ['work out', 'Philippians', 2, 12, 'work out your own salvation with fear and trembling'],
  ['Thou art worthy', 'Revelation', 4, 11, 'Thou art worthy, O Lord, to receive glory and honour and power'],
  ['not hidden', 'Deuteronomy', 30, 11, 'it is not hidden from thee, neither is it far off'],
  ['all scripture', '2 Timothy', 3, 16, 'All scripture is given by inspiration of God'],
  ['meditate therein', 'Joshua', 1, 8, 'thou shalt meditate therein day and night'],
  ['the pattern of the tabernacle', 'Exodus', 25, 9, 'after the pattern of the tabernacle'],
  ['in writing by His hand', '1 Chronicles', 28, 19, 'the LORD made me understand in writing by his hand upon me'],
  ['through wisdom', 'Proverbs', 24, 3, 'Through wisdom is an house builded; and by understanding it is established'],
  ['by knowledge', 'Proverbs', 24, 4, 'And by knowledge shall the chambers be filled with all precious and pleasant riches'],
  ['count the cost', 'Luke', 14, 28, 'counteth the cost, whether he have sufficient to finish it?'],
  ['another Comforter', 'John', 14, 16, 'he shall give you another Comforter'],
  ['He dwelleth with you', 'John', 14, 17, 'for he dwelleth with you, and shall be in you'],
  ['the Lamb of God', 'John', 1, 29, 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['Thy throne, O God', 'Hebrews', 1, 8, 'Thy throne, O God, is for ever and ever'],
  ['created by Him and for Him', 'Colossians', 1, 16, 'all things were created by him, and for him'],
  ['by Him all things consist', 'Colossians', 1, 17, 'by him all things consist'],
  ['herein is love', '1 John', 4, 10, 'Herein is love, not that we loved God, but that he loved us'],
  ['shed abroad', 'Romans', 5, 5, 'the love of God is shed abroad in our hearts by the Holy Ghost which is given unto us'],
  ['love one another', 'John', 13, 34, 'as I have loved you, that ye also love one another'],
  ['all sufficiency', '2 Corinthians', 9, 8, 'always having all sufficiency in all things'],
  ['His workmanship', 'Ephesians', 2, 10, 'created in Christ Jesus unto good works, which God hath before ordained that we should walk in them'],
  ['make you perfect in every good work', 'Hebrews', 13, 21, 'Make you perfect in every good work to do his will'],
  ['not Mine own will', 'John', 6, 38, 'not to do mine own will, but the will of him that sent me'],
  ['His ways higher', 'Isaiah', 55, 9, 'so are my ways higher than your ways'],
  ['I delight to do Thy will', 'Psalms', 40, 8, 'I delight to do thy will, O my God'],
  ['walk in My statutes', 'Ezekiel', 36, 27, 'cause you to walk in my statutes'],
  ['the renewed mind proves His will', 'Romans', 12, 2, 'be ye transformed by the renewing of your mind'],
  ['ask what ye will', 'John', 15, 7, 'ye shall ask what ye will, and it shall be done unto you'],
  ['with all your heart', 'Jeremiah', 29, 13, 'when ye shall search for me with all your heart'],
  ['your Father knoweth', 'Matthew', 6, 32, 'for your heavenly Father knoweth that ye have need of all these things'],
  ['the first commandment', 'Matthew', 22, 38, 'This is the first and great commandment'],
  ['consider your ways', 'Haggai', 1, 7, 'Consider your ways'],
  ['build the house', 'Haggai', 1, 8, 'build the house; and I will take pleasure in it, and I will be glorified, saith the LORD'],
  ['Thy kingdom come', 'Matthew', 6, 10, 'Thy kingdom come. Thy will be done in earth, as it is in heaven'],
  ['built upon a rock', 'Matthew', 7, 24, 'which built his house upon a rock'],
  ['the fear of the LORD', 'Proverbs', 9, 10, 'The fear of the LORD is the beginning of wisdom'],
  ['Lord, Lord', 'Matthew', 7, 21, 'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven'],
  ['He is a rewarder', 'Hebrews', 11, 6, 'he is a rewarder of them that diligently seek him'],
  ['He shall direct thy paths', 'Proverbs', 3, 6, 'In all thy ways acknowledge him, and he shall direct thy paths'],
  ['He will perform it', 'Philippians', 1, 6, 'he which hath begun a good work in you will perform it until the day of Jesus Christ'],
  ['the hoary head', 'Proverbs', 16, 31, 'The hoary head is a crown of glory, if it be found in the way of righteousness'],
  ['in the name of the Lord Jesus', 'Colossians', 3, 17, 'do all in the name of the Lord Jesus'],
  ['these words in thine heart', 'Deuteronomy', 6, 6, 'And these words, which I command thee this day, shall be in thine heart'],
  ['teach them diligently', 'Deuteronomy', 6, 7, 'And thou shalt teach them diligently unto thy children'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

describe('L258 exists, is numbered, and is dated the day it was spoken', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "259 is absent": a pin on the
  // catalog never growing is the one pin certain to break (L256's did, and
  // L257's "258 is absent" had to be amended the day this lesson landed).
  it('is in the catalog exactly once, after L257, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV);
    expect(prev, 'L257 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L258 follows L257 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
  it('claims 258 once, right after 257, and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 258)).toHaveLength(1);
    expect(claimed.includes(257), '258 follows 257 — no number was jumped').toBe(true);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(258); // a floor, never an equality
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });
  it('carries 2026-10-21, the day it was spoken, at or after L257’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-21');
    expect(LIVING_LESSONS_ADDED[PREV] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who brought it, rendered for meaning, closed in Jesus’ name', () => {
    expect(L.lesson).toContain('Darrell brought into this house on the twenty-first of October');
    expect(L.lesson).toContain('closed in Jesus’ name');
    expect(L.lesson).toContain('Rendered for meaning');
  });
  it('the adult lesson walks ten sections, in his order', () => {
    const order = [
      'ONE. HE EXPECTS US TO CROWN OURSELVES', 'TWO. HE GAVE US THE INSTRUCTIONS', 'THREE. HE GAVE US THE SYSTEMS AND THE BLUEPRINT',
      'FOUR. HE GAVE US THE HOLY SPIRIT, HIS SON, AND HIMSELF', 'FIVE. HE GAVE US LOVE', 'SIX. EVERYTHING WE NEED, FOR WHAT HE WANTS',
      'SEVEN. UNTIL WE WANT WHAT HE WANTS', 'EIGHT. HIS PRIORITIES ARE THE HIGHEST PRIORITY', 'NINE. TILL WE GET HIM RIGHT, WE DO NOT GET RIGHT',
      'TEN. THE PRACTICE, IN JESUS’ NAME',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L258 carries his message in every band', () => {
  it.each([
    [/Darrell/, 'Darrell by name'],
    [/crown ourselves/i, 'crown ourselves'],
    [/instructions|rules/i, 'the instructions'],
    [/blueprint|plan\b/i, 'the blueprint'],
    [/Holy Spirit/, 'the Holy Spirit'],
    [/His Son/, 'His Son'],
    [/Himself/, 'Himself'],
    [/\blove\b/i, 'love'],
    [/everything we need|all we need/i, 'everything we need'],
    [/want what He wants/i, 'until we want what He wants'],
    [/get Him right/i, 'till we get Him right'],
    [/real right/i, 'real right'],
    [/Jesus’ name/, 'his closing in Jesus’ name'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(ALL)('%s says the crown is His to lay up and ours to run for, never pride', (k) => {
    expect(/\(2 Timothy 4:8\)/.test(TEXTS[k]) && /\(2 Timothy 4:7\)/.test(TEXTS[k]), `${k} drops the two halves of the crown`).toBe(true);
    expect(/\(Revelation 4:10\)/.test(TEXTS[k]), `${k} never lays the crown back down`).toBe(true);
  });
  it.each(ALL)('%s closes on Matthew 6:33, His priority first', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Matthew 6:33`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
});

describe('L258 — every quoted span is the verse', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(250);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('that no man take thy crown"', 'so nobody takes your crown"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Revelation 3:11'))).toBe(true);
    const yahwehed = { ...L, lesson: L.lesson.replace('For it is God which worketh in you', 'For it is Yahweh which worketh in you') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Philippians 2:13'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, and the shelf book is the first anchor', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      const head = ref.replace(/-\d+$/, '');
      expect(L.lesson.includes(`(${head})`) || L.lesson.includes(`(${head}`), `${ref} is anchored but never named`).toBe(true);
    }
    expect(L.anchor.ref.startsWith('2 Timothy 4:8')).toBe(true);
  });
  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L258 — four bands, each carrying the whole message', () => {
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
  it('sends the reader all three ways in every place, and would report a band that stops (proven-to-catch)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    const cut = { ...L, levels: { ...L.levels, youth: L.levels.youth.replace(/Parents, ask your children[^.]*\./, 'Think about it.') } };
    expect(cut.levels.youth).not.toBe(L.levels.youth);
    expect(placesMissingDirections(cut).some((p) => p.place === 'youth' && p.missing.includes('parents'))).toBe(true);
  });
  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('L258 — two stories, the full teaching shape, and Yahweh in our voice', () => {
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
    expect(light.title).toBe('The Birdhouse Kit');
    expect(/the kit had not changed at all; she had/.test(light.body)).toBe(true);
    expect(solemn.title).toBe('The Plans in the Drawer');
    expect(/according to the pattern/.test(solemn.body)).toBe(true);
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
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God was glad.`))).toBe(true);
  });
  it('confesses Jesus as the Lamb of Yahweh in our voice, with John 1:29 beside it', () => {
    expect(L.lesson).toContain('the Lamb of Yahweh');
    expect(L.lesson).toContain('(John 1:29)');
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});

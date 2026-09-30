// @vitest-environment node
// =============================================================================
// L203 — The Whole Line of Promise — Every Promise from Eden to Malachi, and
// the Years to Jesus (DR-0698)
// =============================================================================
// Darrell read L201 on 2026-09-30 and asked, as a lesson: "How is David first
// and not Moses or even Noah?", then "Isaiah? Job? Etc?", then "You can create
// an new lesson with all of them from the beginning...." This lesson answers
// the question first and walks the whole line from Eden to Malachi.
//
// What is pinned here, and why:
//   * THE RULE for "all of them" is DERIVED from the KJV New Testament, never
//     typed: every verse that joins "fulfilled" with spoken / written /
//     scripture / prophet / prophecy, or says "this is he/that which was spoken
//     / of whom it is written", or "as/thus it is written". Each rule verse is
//     classified (a named passage on the line, the Scriptures in general, or
//     another matter); a verse the rule finds that is not accounted for fails.
//   * THE YEARS before the kings are DERIVED from the Word's own numbers, each
//     number parsed out of its KJV verse (Genesis 5 and 11, Genesis 12:4; 21:5;
//     25:26; 47:9; 47:28; 17:17; 23:1; 9:28; Exodus 12:41 with Galatians 3:17;
//     1 Kings 6:1; Acts 13:21; 1 Samuel 7:2) and added to L201's anchor.
//   * THE INTERVALS are recomputed from both ends (no year zero) and must be
//     what the timeline, the lesson's table and the senior, teen and youth
//     tables print, word for word.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const INDEX = JSON.parse(readFileSync(join(KJV, 'index.json'), 'utf8'));
const DR_DIR = join(HERE, '..', '..', '..', 'docs', 'decisions');
const books = new Map();
const book = (name) => {
  const entry = INDEX.find((b) => b.name === name || b.name === name.replace(/^Psalms$/, 'Psalm'));
  const file = entry ? entry.file : name.replace(/ /g, '');
  if (!books.has(file)) books.set(file, JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')));
  return books.get(file);
};
const verse = (b, c, v) => book(b).chapters[c - 1][v - 1] || '';
// "Acts 2:27, 31; Acts 13:35" / "Galatians 3:8, 16" / "Matthew 4:13-16" -> [[book, c, v], ...]
const expand = (ref) => {
  const out = [];
  for (const part of ref.split(/;\s*/)) {
    const m = /^((?:[1-3] )?[A-Za-z]+) (\d+):(.+)$/.exec(part.trim());
    if (!m) throw new Error(`unparsed ref ${ref}`);
    for (const piece of m[3].split(/,\s*/)) {
      const [a, b] = piece.split('-').map(Number);
      for (let v = a; v <= (b || a); v += 1) out.push([m[1], Number(m[2]), v]);
    }
  }
  return out;
};
const textOf = (ref) => expand(ref).map((x) => verse(...x)).join(' ');
const norm = (s) => ` ${String(s).toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `;

const ID = 'll203-the-whole-line-of-promise-every-promise-from-eden-to-malachi-and-the-years-to-jesus';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L203 must be in the series').toBeTruthy();
  return m;
};
const L201 = () => LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll201-'));
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS_AND_LESSON = () => [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])];

// ---- the arithmetic, stated once: no year zero ----
const astro = (y) => (y < 0 ? y + 1 : y);
const fmt = (n) => n.toLocaleString('en-US');
const interval = ([sFrom, sTo], [kFrom, kTo]) => [astro(kFrom) - astro(sTo), astro(kTo) - astro(sFrom)];
const yearsText = ([a, b]) => (a === b ? `${fmt(a)} years` : `${fmt(a)} to ${fmt(b)} years`);
const span = ([a, b]) => {
  if (a === b) return a < 0 ? `c. ${-a} BC` : `AD ${a}`;
  if (a < 0 && b < 0) return `c. ${-a} to ${-b} BC`;
  return `AD ${a} to ${b}`;
};
const gap = (p) => {
  if (p.spoken && p.kept) return yearsText(interval(p.spoken, p.kept));
  if (p.spokenBefore && p.kept) return `more than ${fmt(astro(p.kept[0]) - astro(p.spokenBefore))} years`;
  return null;
};
const spokenLabel = (p) => (p.spoken ? span(p.spoken) : p.spokenBefore ? `before c. ${-p.spokenBefore} BC` : 'no year given by the Word');
const keptLabel = (p) => (p.kept ? span(p.kept) : p.keptNote);
const rows = () => L().timeline.filter((t) => t.prophecy);
const row = (ref) => rows().find((t) => t.prophecy.ref === ref).prophecy;

// ---- the KJV's number words, read the way the text writes them ----
const UNITS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, seventeen: 17, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, threescore: 60, fourscore: 80, eightieth: 80, fortieth: 40, twentieth: 20 };
const kjvNumber = (phrase) => {
  let total = 0;
  let cur = 0;
  for (const w of phrase.toLowerCase().split(/[^a-z]+/)) {
    if (w in UNITS) cur += UNITS[w];
    else if (w === 'hundred' || w === 'hundredth') { total += (cur || 1) * 100; cur = 0; }
  }
  return total + cur;
};
// [verse, the words as the KJV writes them, the number they say]
const WORD = {
  g5: [['Genesis 5:3', 'an hundred and thirty years', 130], ['Genesis 5:6', 'an hundred and five years', 105], ['Genesis 5:9', 'ninety years', 90], ['Genesis 5:12', 'seventy years', 70], ['Genesis 5:15', 'sixty and five years', 65], ['Genesis 5:18', 'an hundred sixty and two years', 162], ['Genesis 5:21', 'sixty and five years', 65], ['Genesis 5:25', 'an hundred eighty and seven years', 187], ['Genesis 5:28', 'an hundred eighty and two years', 182]],
  noahAtFlood: ['Genesis 7:6', 'six hundred years old', 600],
  enochDays: ['Genesis 5:23', 'three hundred sixty and five years', 365],
  g11: [['Genesis 11:10', 'two years after the flood', 2], ['Genesis 11:12', 'five and thirty years', 35], ['Genesis 11:14', 'thirty years', 30], ['Genesis 11:16', 'four and thirty years', 34], ['Genesis 11:18', 'thirty years', 30], ['Genesis 11:20', 'two and thirty years', 32], ['Genesis 11:22', 'thirty years', 30], ['Genesis 11:24', 'nine and twenty years', 29]],
  terahDays: ['Genesis 11:32', 'two hundred and five years', 205],
  abramAtCall: ['Genesis 12:4', 'seventy and five years old', 75],
  abrahamAtIsaac: ['Genesis 21:5', 'an hundred years old', 100],
  sarahAtIsaac: ['Genesis 17:17', 'ninety years old', 90],
  sarahDays: ['Genesis 23:1', 'an hundred and seven and twenty years old', 127],
  isaacAtJacob: ['Genesis 25:26', 'threescore years old', 60],
  jacobAtEgypt: ['Genesis 47:9', 'an hundred and thirty years', 130],
  jacobDays: ['Genesis 47:28', 'an hundred forty and seven years', 147],
  noahAfterFlood: ['Genesis 9:28', 'three hundred and fifty years', 350],
  exodus430: ['Exodus 12:41', 'four hundred and thirty years', 430],
  galatians430: ['Galatians 3:17', 'four hundred and thirty years after', 430],
  temple480: ['1 Kings 6:1', 'four hundred and eightieth year', 480],
  wilderness: ['Deuteronomy 1:3', 'fortieth year', 40],
  saul: ['Acts 13:21', 'forty years', 40],
  ark: ['1 Samuel 7:2', 'twenty years', 20],
};
const read = ([ref, words, n]) => {
  const [[b, c, v]] = expand(ref);
  expect(verse(b, c, v), ref).toContain(words);
  expect(kjvNumber(words), `${ref}: ${words}`).toBe(n);
  return kjvNumber(words);
};
const sum = (a) => a.reduce((x, y) => x + y, 0);
const add = ([a, b], n) => [a + n, b + n];
// The chain, derived only from the numbers read out of the KJV and L201's anchor.
const derive = () => {
  const n = Object.fromEntries(Object.entries(WORD).map(([k, v]) => [k, Array.isArray(v[0]) ? v.map(read) : read(v)]));
  expect(n.exodus430).toBe(n.galatians430); // the Word explains the Word
  const solomon4 = [-967, -966];
  const exodus = add(solomon4, -(n.temple480 - 1));
  const fortieth = add(exodus, n.wilderness - 1);
  const call = add(exodus, -n.galatians430);
  const isaac = add(call, n.abrahamAtIsaac - n.abramAtCall);
  const sarahDeath = add(isaac, n.sarahDays - n.sarahAtIsaac);
  const jacob = add(isaac, n.isaacAtJacob);
  const egypt = add(jacob, n.jacobAtEgypt);
  const jacobDeath = add(jacob, n.jacobDays);
  const terahAtAbram = n.terahDays - n.abramAtCall;
  const floodToAbram = sum(n.g11) + terahAtAbram;
  const abram = add(call, -n.abramAtCall);
  const flood = add(abram, -floodToAbram);
  const adamToFlood = sum(n.g5) + n.noahAtFlood;
  const creation = add(flood, -adamToFlood);
  const seth = add(creation, n.g5[0]);
  const enochBorn = add(creation, sum(n.g5.slice(0, 6)));
  const enochTaken = add(enochBorn, n.enochDays);
  const noahDeath = add(flood, n.noahAfterFlood);
  return { n, solomon4, exodus, fortieth, call, isaac, sarahDeath, jacob, egypt, jacobDeath, terahAtAbram, floodToAbram, abram, flood, adamToFlood, creation, seth, enochBorn, enochTaken, noahDeath, canaanYears: egypt[0] - call[0], egyptYears: exodus[0] - egypt[0] };
};

// ---- the rule, derived from the KJV New Testament ----
const NT = INDEX.slice(INDEX.findIndex((b) => b.name === 'Matthew'));
const byRule = () => {
  const out = [];
  for (const b of NT) {
    book(b.name).chapters.forEach((ch, ci) => ch.forEach((t, vi) => {
      const r1 = /fulfilled/.test(t) && /(spoken|written|scripture|prophecy|prophet)/i.test(t);
      const r2 = /this is (he|that),? (that|which|of whom) (was spoken|it is written)/i.test(t);
      const r3 = /(as|thus) it is written/i.test(t);
      if (r1 || r2 || r3) out.push(`${b.name} ${ci + 1}:${vi + 1}`);
    }));
  }
  return out;
};
// Rule verses that name no single passage but say the Scriptures were fulfilled in Him.
const OF_HIM = ['Matthew 2:23', 'Matthew 26:24', 'Matthew 26:54', 'Matthew 26:56', 'Mark 14:21', 'Mark 14:49', 'Luke 24:44', 'Luke 24:46', 'Acts 3:18', 'Acts 13:27', 'Acts 13:29'];
// Rule verses that use the same words of another matter (with the reason, for the reader of this test).
const OTHER = {
  'Mark 7:6': 'hypocrites (Isaiah 29:13)', 'Luke 2:23': 'the law of the firstborn, kept for Him: a command, not a promise', 'Luke 21:22': 'Jerusalem’s days of vengeance',
  'John 6:31': 'the crowd’s words of the manna', 'John 17:12': 'the son of perdition', 'Acts 1:16': 'Judas (Acts 1:20)', 'Acts 7:42': 'Israel’s idols (Amos 5:25)',
  'Romans 1:17': 'the just by faith', 'Romans 2:24': 'the Name blasphemed', 'Romans 3:4': 'Yahweh true', 'Romans 3:10': 'none righteous', 'Romans 4:17': 'Abraham, father of nations',
  'Romans 8:36': 'believers as sheep for the slaughter', 'Romans 9:13': 'Jacob and Esau', 'Romans 10:15': 'the feet of preachers', 'Romans 11:8': 'the spirit of slumber',
  'Romans 15:9': 'the Gentiles’ praise', '1 Corinthians 1:31': 'glorying in the Lord', '1 Corinthians 2:9': 'what is prepared for those who love Him', '1 Corinthians 10:7': 'Israel’s idolatry',
  '2 Corinthians 4:13': 'the spirit of faith', '2 Corinthians 8:15': 'the manna shared', '2 Corinthians 9:9': 'giving to the poor', 'James 2:23': 'Abraham’s faith (Genesis 15:6)',
};

describe('L203 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and a dated timeline', () => {
    const m = L();
    expect(m.title).toBe('The Whole Line of Promise — Every Promise from Eden to Malachi, and the Years to Jesus');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Genesis 3:15', 'Genesis 12:3', 'Deuteronomy 18:15', 'Job 19:25', 'Malachi 3:1', 'Galatians 3:17', '1 Kings 6:1', 'Luke 24:27']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(8);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
    for (const t of m.timeline) {
      expect(typeof t.year).toBe('string');
      expect(t.event.split(/\s+/).length).toBeGreaterThanOrEqual(5);
      expect(t.record.split(/\s+/).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('is numbered after L201, carries its day, and is the one lesson with its number', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    expect(num(L())).toBe(203);
    expect(num(L())).toBeGreaterThan(num(L201()));
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(L201()));
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll203-/.test(m.id))).toHaveLength(1);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length); // derived (DR-0677)
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-30');
  });

  it('L201 points to it in one line near its start, and L203 links its neighbours rather than repeating them', () => {
    const l201 = L201().lesson;
    const line = 'The promise itself is older than David: the whole line from Eden is in L203, The Whole Line of Promise.';
    expect(l201).toContain(line);
    expect(l201.indexOf(line)).toBeLessThan(l201.indexOf('ONE. HE DECLARES THE END FROM THE BEGINNING'));
    const l = L().lesson;
    expect(l).toMatch(/beside L201, which counts the years from David and the prophets and teaches Daniel’s weeks/);
    expect(l).toMatch(/beside L200, How Did They Know\?/);
    expect(l).toMatch(/beside L196/);
    expect(l).toMatch(/the Who He Is course walks the whole Word on its own timeline/);
    for (const n of ['ll196-', 'll200-']) expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith(n))).toBe(true);
  });
});

describe('Darrell’s question is answered first, plainly', () => {
  it('the lesson says why L201 began with David, and that the promise is older, before any other movement', () => {
    const l = L().lesson;
    const answer = 'L201 began at David because the question that made it named David first';
    expect(l).toContain(answer);
    expect(l).toContain('David was where the question started, not where the promise started. The promise is far older.');
    expect(l.indexOf(answer)).toBeLessThan(l.indexOf('TWO.'));
    for (const b of FULL_BANDS) expect(L().levels[b], b).toMatch(/David/);
    expect(L().quiz.questions[0].q).toMatch(/Why did L201 begin with David/);
  });

  it('provenance: his words are rendered in the lesson and recorded verbatim in the decision record', () => {
    const l = L().lesson;
    expect(l).toMatch(/On 2026-09-30 Darrell read L201, How Long Before It Came\?, and spoke back into the app/);
    expect(l).toMatch(/how is David first, and not Moses, or even Noah\?/);
    expect(l).toMatch(/Then he asked about Isaiah, and Job, and the rest/);
    expect(l).toMatch(/make a new lesson with all of them, from the beginning/);
    const dr = readdirSync(DR_DIR).find((f) => f.startsWith('DR-0698-'));
    expect(dr, 'DR-0698 is written').toBeTruthy();
    const body = readFileSync(join(DR_DIR, dr), 'utf8');
    for (const w of ['How is David first and not Moses or even Noah?', 'Isaiah? Job? Etc?', 'You can create an new lesson with all of them from the beginning....']) expect(body).toContain(w);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(200);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference — a quote means Scripture, and no man is quoted', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('straight quotation marks, no ellipsis inside a quotation, no record id, no percentage', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const s of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(s[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });

  it('the new verses of the line are in the lesson exactly as the KJV writes them', () => {
    const carries = (ref, words) => {
      expect(textOf(ref), ref).toContain(words);
      expect(ALL(), ref).toContain(`"${words}" (${ref})`);
    };
    carries('Genesis 3:15', 'And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel');
    carries('Genesis 9:26', 'Blessed be the LORD God of Shem');
    carries('Luke 3:36', 'which was the son of Sem, which was the son of Noe');
    carries('Genesis 12:3', 'in thee shall all families of the earth be blessed');
    carries('Galatians 3:16', 'He saith not, And to seeds, as of many; but as of one, And to thy seed, which is Christ');
    carries('Genesis 49:10', 'The sceptre shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh come');
    carries('Numbers 24:17', 'there shall come a Star out of Jacob, and a Sceptre shall rise out of Israel');
    carries('Deuteronomy 18:15', 'The LORD thy God will raise up unto thee a Prophet from the midst of thee, of thy brethren, like unto me; unto him ye shall hearken');
    carries('Galatians 3:17', 'the covenant, that was confirmed before of God in Christ, the law, which was four hundred and thirty years after');
    carries('Job 19:25', 'For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth');
    carries('Jude 1:14', 'Behold, the Lord cometh with ten thousands of his saints');
    carries('1 Samuel 2:10', 'he shall give strength unto his king, and exalt the horn of his anointed');
    carries('Luke 24:27', 'And beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself');
  });
});

describe('the rule for "all of them" is derived from the New Testament, and every verse it finds is accounted for', () => {
  it('the rule finds exactly the verses the lesson counts, and each is classified once', () => {
    const found = byRule();
    const other = Object.keys(OTHER);
    const toPassage = found.filter((r) => !OF_HIM.includes(r) && !other.includes(r));
    for (const r of [...OF_HIM, ...other]) expect(found, `${r} is not a rule verse`).toContain(r);
    const l = L().lesson;
    expect(l).toContain(`Read the whole New Testament by that rule and it gives ${found.length} verses. ${toPassage.length} of them point to a named Old Testament passage kept in Jesus or set on Him. ${OF_HIM.length} say that the Scriptures were fulfilled in Him without naming one passage: ${OF_HIM.join(', ')}.`);
    expect(l).toContain(`The other ${other.length} use the same words for something else, and we name them so nothing is hidden: ${other.join(', ')}.`);
    // every rule verse that names a passage is the ground of a row on the line
    const vias = new Set(rows().flatMap((t) => t.prophecy.via || []));
    for (const r of toPassage) expect(vias.has(r), `${r} finds a passage with no row`).toBe(true);
    // and every row that claims the rule really stands on a rule verse
    for (const t of rows().filter((x) => ['fulfilled', 'this-is', 'written'].includes(x.prophecy.basis))) {
      expect(t.prophecy.via.some((v) => found.includes(v)), t.prophecy.ref).toBe(true);
    }
    // the counts by ground
    const by = (b) => rows().filter((t) => t.prophecy.basis === b).length;
    const ruleRows = by('fulfilled') + by('this-is') + by('written');
    expect(l).toContain(`The ${toPassage.length} verses name ${ruleRows} distinct passages, the four sermons add ${by('sermon')} more, and ${by('other-words')} more are promises Darrell named`);
    expect(l).toContain(`That makes ${rows().length} promises on one line.`);
    expect(rows().length).toBe(ruleRows + by('sermon') + by('other-words'));
    for (const b of ['youth', 'teen', 'senior']) expect(L().levels[b], b).toContain(`${found.length} verses`);
  });

  it('each row the New Testament quotes shares its words with the verse it quotes (checked in the KJV)', () => {
    let checked = 0;
    for (const t of rows()) {
      const p = t.prophecy;
      if (!p.echo) continue;
      const nt = [...expand(p.keptRef), ...(p.via || []).flatMap((r) => { const [[b, c, v]] = expand(r); return [[b, c, v], [b, c, v + 1], [b, c, v + 2]]; })].map((x) => verse(...x)).join(' ');
      expect(norm(textOf(p.ref)), `${p.ref} carries "${p.echo}"`).toContain(` ${p.echo} `);
      expect(norm(nt), `${p.keptRef} carries "${p.echo}"`).toContain(` ${p.echo} `);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(35);
  });

  it('what the rule does not reach is named honestly: Haggai 2:7 and Daniel’s weeks', () => {
    const l = L().lesson;
    expect(l).toMatch(/Haggai 2:7 is not on it: the New Testament does not quote that verse/);
    expect(textOf('Hebrews 12:26')).toContain('Yet once more I shake not the earth only, but also heaven');
    expect(l).toMatch(/Daniel’s seventy weeks are not reached by the rule either; L201 teaches them in full/);
    expect(rows().some((t) => /^Haggai/.test(t.prophecy.ref))).toBe(false);
  });
});

describe('the years before the kings: the Word’s numbers, added to L201’s anchor', () => {
  it('L201’s anchor is the one used: Solomon’s fourth year, c. 967–966 BC', () => {
    expect(L201().timeline.some((t) => t.year === 'c. 967–966 BC' && /1 Kings 6:1/.test(t.event))).toBe(true);
  });

  it('every number is read from its KJV verse, and the sums are what the lesson prints', () => {
    const d = derive();
    expect(d.adamToFlood).toBe(1656);
    expect(d.floodToAbram).toBe(352);
    expect(d.terahAtAbram).toBe(130);
    expect(d.canaanYears + d.egyptYears).toBe(d.n.galatians430);
    const l = L().lesson;
    expect(l).toContain(`So the exodus falls c. ${-d.exodus[0]} to ${-d.exodus[1]} BC.`);
    expect(l).toContain(`That puts the promise of Genesis 12:3 c. ${-d.call[0]} to ${-d.call[1]} BC.`);
    expect(l).toContain(`That is ${d.canaanYears} years from the promise to Egypt, and ${d.egyptYears} more in Egypt`);
    expect(l).toContain(`So Abram was born in Terah’s ${d.terahAtAbram}th year, and from the flood to Abram’s birth is ${d.floodToAbram} years. The flood falls c. ${-d.flood[0]} to ${-d.flood[1]} BC.`);
    expect(l).toContain(`Those numbers add to ${fmt(d.adamToFlood)} years from Adam to the flood, which places the beginning c. ${-d.creation[0]} to ${-d.creation[1]} BC.`);
    expect(l).toMatch(/before the kings, the calendar year comes from adding the Word’s own numbers to the fixed anchors already in L201/);
    expect(l).toMatch(/we do not stage a debate about them/);
    for (const b of ['teen', 'senior']) {
      expect(L().levels[b], b).toContain(`${fmt(d.adamToFlood)} years from Adam to the flood`);
      expect(L().levels[b], b).toContain(`${d.floodToAbram} years`);
    }
    expect(L().levels.youth).toContain(`${fmt(d.adamToFlood)} years`);
  });

  it('every row before the kings sits exactly where the derived chain puts it', () => {
    const d = derive();
    expect(row('Genesis 3:15').spoken).toEqual([d.creation[0], d.seth[1]]);
    expect(row('Jude 1:14-15').spoken).toEqual([d.enochBorn[0], d.enochTaken[1]]);
    expect(row('Genesis 9:26').spoken).toEqual([d.flood[0] + 1, d.noahDeath[1]]);
    expect(row('Genesis 12:3').spoken).toEqual(d.call);
    expect(row('Genesis 22:18').spoken).toEqual([d.isaac[0], d.sarahDeath[1]]);
    expect(row('Genesis 49:10').spoken).toEqual(d.jacobDeath);
    expect(row('Exodus 12:46').spoken).toEqual(d.exodus);
    expect(row('Numbers 24:17').spoken).toEqual(d.fortieth);
    expect(row('Deuteronomy 18:15').spoken).toEqual(d.fortieth);
    // Hannah: before the ark's twenty years, before Saul's forty, before David (L201's c. 1010 BC).
    const davidStart = row('Psalms 22:18').spoken[0];
    expect(davidStart).toBe(L201().timeline.find((t) => t.prophecy && t.prophecy.ref === 'Psalms 22:18').prophecy.spoken[0]);
    expect(row('1 Samuel 2:10').spokenBefore).toBe(davidStart - d.n.saul - d.n.ark);
    expect(row('1 Samuel 2:10').spoken).toBe(null);
  });

  it('every interval is recomputed from its two ends and matches the timeline, the lesson and three band tables word for word', () => {
    const m = L();
    expect(rows().length).toBe(49);
    for (const t of rows()) {
      const p = t.prophecy;
      const g = gap(p);
      if (p.spoken && p.kept) {
        const [a, b] = interval(p.spoken, p.kept);
        expect(a, p.ref).toBeGreaterThan(0);
        expect(b, p.ref).toBeGreaterThanOrEqual(a);
      }
      expect(t.event, p.ref).toContain(`(${p.ref}).`);
      if (g) expect(t.event, p.ref).toContain(`${span(p.kept)}: ${g} later.`);
      else expect(t.event, p.ref).toMatch(/no span is counted\.$/);
      expect(m.lesson, `lesson table: ${p.ref}`).toContain(`${p.ref}, ${p.speaker}, ${spokenLabel(p)}; kept `);
      expect(m.lesson, `lesson table: ${p.ref}`).toContain(`(${p.keptRef}), ${keptLabel(p)}; ${g ? `${g} later` : 'no span counted'}.`);
      expect(m.levels.senior, `senior: ${p.ref}`).toContain(`${p.speaker} spoke ${p.ref}, and the New Testament records its keeping in ${p.keptRef}, ${g ? `${g} afterwards` : 'with no interval counted'}.`);
      expect(m.levels.teen, `teen: ${p.ref}`).toContain(`${p.ref} to ${p.keptRef}: ${g || 'no span counted'}.`);
      expect(m.levels.youth, `youth: ${p.ref}`).toContain(`${p.speaker}: ${p.ref}, kept in ${p.keptRef}, ${g ? `${g} later` : 'no span counted'}.`);
    }
  });

  it('where the Word gives no year, none is given: Job, Joel and four psalms', () => {
    const undated = rows().filter((t) => !t.prophecy.spoken && !t.prophecy.spokenBefore).map((t) => t.prophecy.ref);
    expect(undated).toEqual(['Job 19:25-26', 'Joel 2:28-32', 'Psalms 45:6-7', 'Psalms 78:2', 'Psalms 102:25-27', 'Psalms 118:22']);
    for (const t of rows().filter((x) => undated.includes(x.prophecy.ref))) expect(t.year).toBe('No year in the Word');
    expect(L().lesson).toMatch(/Job names no king and no date\./);
    expect(L().lesson).toMatch(/but it gives no year, so we give none/);
    expect(L().levels.child).toMatch(/The Word does not tell us when Job lived, so we do not make one up/);
    // a year typed into Job would be a lie the arithmetic cannot check
    expect(rows().find((t) => t.prophecy.ref === 'Job 19:25-26').prophecy.spoken).toBe(null);
  });

  it('the timeline runs in order, earliest first, era by era, and every calendar year before the kings says c.', () => {
    const start = (label) => { const m = /(\d+)/.exec(label); if (!m) return null; return /BC/.test(label) ? -Number(m[1]) : Number(m[1]); };
    const starts = L().timeline.map((t) => start(t.year)).filter((x) => x !== null);
    expect([...starts].sort((x, y) => x - y)).toEqual(starts);
    const heads = L().timeline.filter((t) => /^[A-Z ]+\. /.test(t.event)).map((t) => t.event.split('.')[0]);
    expect(heads).toEqual(['BEFORE THE FLOOD', 'THE PATRIARCHS', 'MOSES AND THE LAW', 'JUDGES AND KINGS', 'THE PROPHETS BEFORE THE EXILE', 'AFTER THE EXILE', 'NOT DATED BY THE WORD']);
    for (const t of L().timeline) if (/BC/.test(t.year)) expect(t.year, t.event).toMatch(/c\. /);
    // the lesson's table is grouped by the same eras, in order
    const l = L().lesson;
    let last = l.indexOf('ELEVEN.');
    for (const h of ['BEFORE THE FLOOD.', 'THE PATRIARCHS.', 'MOSES AND THE LAW.', 'JUDGES AND KINGS.', 'THE PROPHETS BEFORE THE EXILE.', 'AFTER THE EXILE.', 'NOT DATED BY THE WORD.']) {
      const at = l.indexOf(h, last);
      expect(at, h).toBeGreaterThan(last);
      last = at;
    }
  });

  it('the child band gets the line and a few promises, in round words that sit inside the derived ranges', () => {
    const within = (ref, n) => { const [x, y] = interval(row(ref).spoken, row(ref).kept); return x - 50 <= n && n <= y + 50; };
    expect(within('Genesis 3:15', 3900)).toBe(true);
    expect(within('Genesis 12:3', 1870)).toBe(true);
    expect(within('Exodus 12:46', 1475)).toBe(true);
    expect(within('Psalms 22:18', 1000)).toBe(true);
    expect(within('Isaiah 9:6-7', 700)).toBe(true);
    expect(within('Zechariah 9:9', 500)).toBe(true);
    expect(within('Malachi 3:1', 470)).toBe(true);
    const c = L().levels.child;
    expect(c).toMatch(/The garden promise, Genesis 3:15: about 3,900 years/);
    expect(c).toMatch(/Abraham’s promise, Genesis 12:3: about 1,870 years/);
    expect(c).toMatch(/The donkey of Zechariah 9:9: about five hundred years/);
    expect(c.includes('Jonah 1:17 to')).toBe(false); // no whole table for a child
  });

  it('the quiz asks why the promise starts before David, and its derived answer is the derived number', () => {
    const d = derive();
    const qs = L().quiz.questions;
    expect(qs.some((q) => /Why did L201 begin with David/.test(q.q))).toBe(true);
    const g5 = qs.find((q) => /Genesis 5/.test(q.q));
    expect(g5.options[g5.answer]).toBe(`${fmt(d.adamToFlood)} years`);
  });
});

describe('the Word first, and the movements are in order', () => {
  it('the Word leads, and all eleven movements plus the close come in order', () => {
    const t = L().lesson;
    const heads = ['ONE. WHY DAVID CAME FIRST, AND WHY THE LINE IS OLDER', 'TWO. HOW WE KNOW WHICH PROMISES ARE HIS', 'THREE. THE YEARS BEFORE THE KINGS', 'FOUR. BEFORE THE FLOOD', 'FIVE. THE PATRIARCHS', 'SIX. MOSES AND THE LAW', 'SEVEN. JUDGES AND KINGS', 'EIGHT. THE PROPHETS BEFORE THE EXILE', 'NINE. AFTER THE EXILE', 'TEN. THE PROMISES THE WORD DOES NOT DATE', 'ELEVEN. THE WHOLE LINE ON ONE PAGE', 'THE CLOSE.'];
    expect(t.indexOf('We begin in the Word.')).toBeGreaterThan(0);
    expect(t.indexOf('We begin in the Word.')).toBeLessThan(t.indexOf(heads[0]));
    let last = -1;
    for (const h of heads) {
      const at = t.indexOf(h);
      expect(at, h).toBeGreaterThan(last);
      last = at;
    }
  });

  it('the key promises are carried in the lesson and in every band', () => {
    for (const t of BANDS_AND_LESSON()) {
      for (const r of ['Genesis 3:15', 'Genesis 12:3', 'Exodus 12:46', 'Deuteronomy 18:15', 'Psalms 22:18', 'Isaiah 9:6', 'Job 19:25', 'Malachi 3:1', 'Joshua 21:45', 'Luke 24:27']) expect(t, r).toContain(r);
    }
  });

  it('the close: every band ends the way this house ends', () => {
    for (const t of BANDS_AND_LESSON()) expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
    const timeline = L().timeline.map((t) => `${t.event} ${t.record}`).join(' ');
    expect(timeline.match(/\bGod\b/g)).toBe(null);
  });

  it('PROVEN-TO-CATCH: a changed word, a wrong reference, a wrong Word number, a moved span, a typed interval, an unaccounted rule verse and a dropped era each fire', () => {
    // a changed word in a quotation
    const changed = { ...L(), lesson: L().lesson.replace('"Blessed be the LORD God of Shem" (Genesis 9:26)', '"Blessed be the LORD God of Japheth" (Genesis 9:26)') };
    expect(changed.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([changed], quotedTexts).faults.length).toBeGreaterThan(0);
    // a wrong reference
    const wrongRef = { ...L(), lesson: L().lesson.replace('until Shiloh come" (Genesis 49:10)', 'until Shiloh come" (Genesis 49:11)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);
    // a Word number mis-read (481 for the 480th year) moves the whole chain off the rows
    expect(kjvNumber('four hundred and eightieth year')).toBe(480);
    const d = derive();
    const wrongExodus = add([-967, -966], -(481 - 1));
    expect(wrongExodus).not.toEqual(d.exodus);
    expect(row('Exodus 12:46').spoken).not.toEqual(wrongExodus);
    // a span moved without re-deriving: the printed interval no longer matches
    const t = rows().find((x) => x.prophecy.ref === 'Genesis 12:3');
    const moved = { ...t.prophecy, spoken: [-1880, -1879] };
    expect(t.event.includes(`${gap(moved)} later.`)).toBe(false);
    // an interval typed by hand, off by one, fails the lesson-table pin
    const [a, b] = interval(t.prophecy.spoken, t.prophecy.kept);
    const typed = L().lesson.replace(`${yearsText([a, b])} later.`, `${yearsText([a, b + 1])} later.`);
    expect(typed).not.toBe(L().lesson);
    expect(typed.includes(`(${t.prophecy.keptRef}), ${span(t.prophecy.kept)}; ${yearsText([a, b])} later.`)).toBe(false);
    // a rule verse nobody accounted for: drop one classification and the passage check fails
    const found = byRule();
    const vias = new Set(rows().flatMap((x) => x.prophecy.via || []));
    const unclassified = found.filter((r) => !OF_HIM.slice(1).includes(r) && !Object.keys(OTHER).includes(r));
    expect(unclassified.some((r) => !vias.has(r))).toBe(true);
    // a dropped era heading
    const dropped = L().lesson.replace('JUDGES AND KINGS.', '');
    expect(dropped.indexOf('JUDGES AND KINGS.', dropped.indexOf('ELEVEN.'))).toBe(-1);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, `${b} share ${f.bands[b].share}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING), `child reads ${m.bands.child.authored}`).toBe(false);
  });

  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), b).toBe(true);
  });
});

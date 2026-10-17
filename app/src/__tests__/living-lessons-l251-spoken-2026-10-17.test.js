// @vitest-environment node
// =============================================================================
// L251 — "That Rock Was Christ": what Darrell sent into the house on
// 2026-10-17, built the same session (a spoken teaching is build input).
// DR-1096.
// =============================================================================
// He sent two messages. The first was the word "Lesson" above the summary of
// an episode of The Deep End with Lecrae (Lecrae hosting Zadok, a Christian
// hip-hop artist who identifies with the Hebrew Israelite movement, and
// Jerome Gay Jr., a pastor and theologian): the movement's claim of
// flesh-and-blood descent, why people come (ancestry, suffering, feeling
// neglected, packaged answers), the Twelve Tribes Chart, the curse of Ham,
// racial idolatry, and the deity of Christ. The second was his own line
// while it was being built: "Rock Of Yahweh in the wilderness in Old
// Testament times etc..." — rendered for meaning, not for its capitals
// (DR-0331).
//
// THE WORD EXPLAINS THE WORD, NOT A DEBATE (DR-0098), and this gate pins the
// spine in every place a reader reads: the Rock in the wilderness
// (Exodus 17:6) before Paul names it (1 Corinthians 10:4); "not of blood"
// (John 1:13); Genesis 9:25's own words, "Cursed be Canaan"; and every band
// closing on "that Rock was Christ". The episode's claims are attributed to
// the episode, with its name and its guests, never stated as ours.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: against a
// 2,174-word adult lesson the first draft's bands were all short (child 0.36,
// youth 0.49, teen 0.52, senior 0.56). The adult practice section was
// tightened and the bands deepened in plainer sentences (the mixed multitude
// that drank from the same rock, the many who drank and still fell, Paul the
// Hebrew of the Hebrews, the wall broken down, Rahab in Jesus' line), which
// brought them to 0.51 / 0.61 / 0.61 / 0.62 against 2,098 words. The house on
// the rock (Matthew 7:24-27; Luke 6:46-49) and Isaiah 28:16 belong to the
// inspections course, and Luke 13:1-5 (the tower of Siloam, the obvious
// suffering text) to the insurance-risk course, so L251 quotes none of them.
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

const ID = 'll251-that-rock-was-christ-identity-not-of-blood';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"for they drank of that spiritual Rock that followed them: and that Rock was Christ" (1 Corinthians 10:4).';

const STRANDS = [
  ['Yahweh stands on the rock', 'Exodus', 17, 6, 'Behold, I will stand before thee there upon the rock in Horeb'],
  ['the question at the rock', 'Exodus', 17, 7, 'Is the LORD among us, or not?'],
  ['a mixed multitude drank too', 'Exodus', 12, 38, 'And a mixed multitude went up also with them'],
  ['speak to the rock', 'Numbers', 20, 8, 'speak ye unto the rock before their eyes'],
  ['water abundantly', 'Numbers', 20, 11, 'the water came out abundantly'],
  ['rocks cleft', 'Psalms', 78, 15, 'He clave the rocks in the wilderness'],
  ['streams from the rock', 'Psalms', 78, 16, 'He brought streams also out of the rock'],
  ['He is the Rock', 'Deuteronomy', 32, 4, 'He is the Rock, his work is perfect'],
  ['the Rock that begat thee', 'Deuteronomy', 32, 18, 'Of the Rock that begat thee thou art unmindful'],
  ['no rock save our God', 'Psalms', 18, 31, 'or who is a rock save our God?'],
  ['that Rock was Christ', '1 Corinthians', 10, 4, 'for they drank of that spiritual Rock that followed them: and that Rock was Christ'],
  ['all our fathers', '1 Corinthians', 10, 1, 'how that all our fathers were under the cloud'],
  ['many fell who drank', '1 Corinthians', 10, 5, 'But with many of them God was not well pleased'],
  ['flee from idolatry', '1 Corinthians', 10, 14, 'Wherefore, my dearly beloved, flee from idolatry'],
  ['ye were Gentiles', '1 Corinthians', 12, 2, 'Ye know that ye were Gentiles'],
  ['the Word was God', 'John', 1, 1, 'In the beginning was the Word, and the Word was with God, and the Word was God'],
  ['the Word made flesh', 'John', 1, 14, 'And the Word was made flesh, and dwelt among us'],
  ['before Abraham, I am', 'John', 8, 58, 'Before Abraham was, I am'],
  ['I AM THAT I AM', 'Exodus', 3, 14, 'I AM THAT I AM'],
  ['the fulness of the Godhead', 'Colossians', 2, 9, 'For in him dwelleth all the fulness of the Godhead bodily'],
  ['my Lord and my God', 'John', 20, 28, 'My Lord and my God'],
  ['received him', 'John', 1, 12, 'But as many as received him, to them gave he power to become the sons of God'],
  ['not of blood', 'John', 1, 13, 'Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God'],
  ['ye must be born again', 'John', 3, 7, 'Ye must be born again'],
  ['children out of stones', 'Matthew', 3, 9, 'God is able of these stones to raise up children unto Abraham'],
  ['not all Israel', 'Romans', 9, 6, 'For they are not all Israel, which are of Israel'],
  ['the children of faith', 'Galatians', 3, 7, 'Know ye therefore that they which are of faith, the same are the children of Abraham'],
  ['all one in Christ', 'Galatians', 3, 28, 'for ye are all one in Christ Jesus'],
  ['Abraham’s seed', 'Galatians', 3, 29, 'And if ye be Christ’s, then are ye Abraham’s seed'],
  ['the wall broken down', 'Ephesians', 2, 14, 'hath broken down the middle wall of partition between us'],
  ['a chosen generation', '1 Peter', 2, 9, 'But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people'],
  ['one blood', 'Acts', 17, 26, 'And hath made of one blood all nations of men'],
  ['an Hebrew of the Hebrews', 'Philippians', 3, 5, 'an Hebrew of the Hebrews'],
  ['counted loss', 'Philippians', 3, 7, 'But what things were gain to me, those I counted loss for Christ'],
  ['endless genealogies', '1 Timothy', 1, 4, 'Neither give heed to fables and endless genealogies'],
  ['keep yourselves from idols', '1 John', 5, 21, 'Little children, keep yourselves from idols'],
  ['the twelve tribes', 'Genesis', 49, 28, 'All these are the twelve tribes of Israel'],
  ['Cursed be Canaan', 'Genesis', 9, 25, 'Cursed be Canaan; a servant of servants shall he be unto his brethren'],
  ['the four sons of Ham', 'Genesis', 10, 6, 'Cush, and Mizraim, and Phut, and Canaan'],
  ['a woman of Canaan', 'Matthew', 15, 28, 'O woman, great is thy faith'],
  ['Rachab in His line', 'Matthew', 1, 5, 'And Salmon begat Booz of Rachab'],
  ['the son shall not bear', 'Ezekiel', 18, 20, 'The son shall not bear the iniquity of the father'],
  ['sour grapes', 'Ezekiel', 18, 2, 'The fathers have eaten sour grapes'],
  ['neither this man nor his parents', 'John', 9, 3, 'Neither hath this man sinned, nor his parents'],
  ['redeemed from the curse', 'Galatians', 3, 13, 'Christ hath redeemed us from the curse of the law, being made a curse for us'],
  ['once offered', 'Hebrews', 9, 28, 'So Christ was once offered to bear the sins of many'],
  ['it is finished', 'John', 19, 30, 'It is finished'],
  ['by grace through faith', 'Ephesians', 2, 8, 'For by grace are ye saved through faith'],
  ['repent', 'Acts', 3, 19, 'Repent ye therefore, and be converted'],
  ['whosoever shall call', 'Romans', 10, 13, 'For whosoever shall call upon the name of the Lord shall be saved'],
  ['every nation before the Lamb', 'Revelation', 7, 9, 'a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues'],
];

describe('L251 exists, is numbered, and is dated the day it was sent', () => {
  it('is in the catalog exactly once, and the number is its own', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 251)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(251);
    // 211 and 212 were never minted in this catalog (DR-0760, DR-0761), so
    // nobody may fill them by accident. ll79 is being paid on another branch,
    // so it is held to "at most once", which is true before and after it lands.
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
    expect(claimed.filter((n) => n === 79).length).toBeLessThanOrEqual(1);
    // ll251 is this lesson: the next number on main. A held branch (#2166) had
    // reserved 251 and 252; the id-collision gate makes it renumber loudly when
    // it is released, rather than this lesson leaving a gap the ratchet forbids.
    expect(claimed.filter((x) => x === 252).length).toBeLessThanOrEqual(1);
  });
  it('carries the day it was sent, on or after L250', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-17');
    expect(LIVING_LESSONS_ADDED['ll250-they-which-do-hunger-shall-be-filled-and-the-critical-path'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who brought it, with both of his messages', () => {
    expect(/brought into this house by Darrell/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('The first was a single word, Lesson,');
    expect(L.lesson).toMatch(/the Rock of Yahweh in the wilderness in Old Testament times/i);
  });
});

describe('L251 carries both of Darrell’s messages in every band', () => {
  it.each(ALL)('%s carries his line, the Rock of Yahweh in the wilderness in Old Testament times', (k) => {
    expect(/Rock of Yahweh in the wilderness in Old Testament times/i.test(TEXTS[k]), `${k} drops his line`).toBe(true);
  });
  it.each([
    [/Darrell/, 'Darrell by name'],
    [/wilderness/i, 'the wilderness'],
    [/identity/i, 'identity'],
    [/curse of Ham|Cursed be Canaan/, 'the curse of Ham, corrected'],
    [/twelve tribes/i, 'the twelve tribes'],
    [/idol/i, 'idolatry'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(['adult', 'youth', 'teen', 'senior'])('%s attributes the episode by name, with its host and both guests', (k) => {
    for (const name of ['The Deep End with Lecrae', 'Zadok', 'Jerome Gay Jr.', 'Hebrew Israelite movement']) {
      expect(TEXTS[k].includes(name), `${k} drops ${name}`).toBe(true);
    }
  });
  it('the adult lesson attributes the episode’s claims with its timestamps, and says the movement is not monolithic', () => {
    for (const t of ['6:04 to 8:31', '6:32 to 7:02', '28:39 to 29:12', '58:48 to 59:06', '1:17:18 to 1:19:56', '1:16:51 to 1:17:16', '1:25:47 to 1:26:02', '1:45:49 to 1:46:06']) {
      expect(L.lesson.includes(t), `the adult lesson drops the timestamp ${t}`).toBe(true);
    }
    expect(L.lesson).toContain('the movement is not monolithic');
    expect(L.lesson).toContain('Zadok affirms the deity of Christ');
    expect(L.lesson).toContain('this lesson will not stage the conversation as two sides for you to choose between');
  });
});

describe('L251 — the Rock was Christ, not of blood, and Genesis 9 read as written', () => {
  it.each(ALL)('%s goes to the wilderness rock (Exodus 17:6) before Paul names it (1 Corinthians 10:4)', (k) => {
    const t = TEXTS[k];
    const rock = t.indexOf('(Exodus 17:6)');
    const named = t.indexOf('and that Rock was Christ"');
    expect(rock, `${k} never quotes Exodus 17:6`).toBeGreaterThan(-1);
    expect(named, `${k} never quotes 1 Corinthians 10:4`).toBeGreaterThan(rock);
  });
  it.each(ALL)('%s closes on that Rock was Christ', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on 1 Corinthians 10:4`).toBe(true);
  });
  it.each(ALL)('%s teaches identity not of blood (John 1:13)', (k) => {
    expect(/"Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God" \(John 1:1[23]|\(John 1:12-13\)/.test(TEXTS[k]), `${k} drops John 1:13`).toBe(true);
    expect(TEXTS[k].includes('not of blood'), `${k} drops not of blood`).toBe(true);
  });
  it.each(ALL)('%s reads Genesis 9:25 as written: Cursed be Canaan', (k) => {
    expect(TEXTS[k].includes('Cursed be Canaan'), `${k} drops the verse`).toBe(true);
    expect(TEXTS[k].includes('(Genesis 9:25)'), `${k} drops the reference`).toBe(true);
  });
  it.each(['adult', 'youth', 'teen', 'senior'])('%s states plainly that the misreading was used to defend slavery (DR-0100)', (k) => {
    expect(/slaver/i.test(TEXTS[k]) && /curse of Ham/i.test(TEXTS[k]), `${k} softens the documented harm`).toBe(true);
  });
  it.each(ALL)('%s teaches the deity of Christ from the Word (John 1:1)', (k) => {
    expect(TEXTS[k].includes('"In the beginning was the Word, and the Word was with God, and the Word was God" (John 1:1)'), `${k} drops John 1:1`).toBe(true);
  });
  it.each(ALL)('%s answers suffering with the Word (John 9:3), never a bloodline curse', (k) => {
    expect(TEXTS[k].includes('(John 9:3)'), `${k} drops John 9:3`).toBe(true);
  });
});

describe('L251 — every quoted span is the verse', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
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
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('Cursed be Canaan"', 'Cursed be Ham"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Genesis 9:25'))).toBe(true);
    const yahwehed = { ...L, lesson: L.lesson.replace('and the Word was God"', 'and the Word was Yahweh"') };
    expect(verbatimFaults(yahwehed).some((f) => f.includes('John 1:1'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('leaves "God" exactly as the verses carry it', () => {
    for (const u of ['and the Word was God', 'that God is able of these stones', 'but of God', 'Is the LORD among us, or not?', 'or who is a rock save our God?']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
  });
  it('leaves the house on the rock and Isaiah 28:16 to the inspections course, and Luke 13 to insurance-risk', () => {
    const json = JSON.stringify(L);
    for (const ref of ['(Matthew 7:24', '(Matthew 7:25', '(Luke 6:48', '(Isaiah 28:16', '(Luke 13:', '(Joshua 2:']) {
      expect(json.includes(ref), `${ref} belongs to another course`).toBe(false);
    }
  });
});

describe('L251 — four bands, each carrying the whole message', () => {
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
  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
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

describe('L251 — two stories, and Yahweh in our voice', () => {
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
    // the short family tree is honoured, and the Rock drawn under it is what holds her up
    expect(/it is not what holds you up\. The Rock is\./.test(light.body)).toBe(true);
    // the grandson reads Genesis 9 itself, and the sermon was preached over the Word
    expect(/It named Canaan, not Ham, and it named no color at all\./.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the generic-name check would catch "God" in our voice (proven-to-catch)', () => {
    const ours = ourProseOnly(`${TEXTS.child} Then God was glad.`);
    expect(/\bGod(?:'s|’s)?\b/.test(ours)).toBe(true);
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});

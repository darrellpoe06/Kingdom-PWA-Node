// @vitest-environment node
// =============================================================================
// sov54 — Cheating became an industry: the watchman Yahweh sets, the gate he
// must actually stand at, and the name no forger can buy (DR-1272)
// =============================================================================
// Darrell forwarded an IT Brew issue, "Cheat codes" (16 September 2026), with
// two words over it: "Lessons." and "Research first." The second word is an
// instruction to the builder, and this file is where it is kept honest.
//
// THIS LESSON'S FIRST DANGER IS REPEATING A NEWSLETTER AS THOUGH IT WERE A
// FINDING. Five named people are quoted in it and none of them is us. So the
// gate below requires each quotation to be present verbatim AND attributed to
// the speaker and the publication, requires the reported sandbox-escape
// incident to carry both its strength (several outlets report the company
// disclosed it) and its unsettled parts (the dates, the escape route, whether
// customer data was reached), and requires the two-hundred-dollar identity to
// name the two research firms and the trade site rather than stand as our own
// number. The honest limit of the research — the publishers' pages would not
// resolve from this sandbox, so no primary wording was ever read — is required
// in the lesson's own text, because a finding that hides its blind stretch is
// an advertisement rather than a watch report.
//
// THE SECOND DANGER IS REPEATING sov52'S SPINE. sov52 (DR-1258) already taught
// the just weight and the false balance; a second lesson on cheating would
// reach for Proverbs 11:1 by reflex. This week is built on the watchman
// instead, and the four verses that carry it — Ezekiel 3:17, Jeremiah 6:17,
// Isaiah 21:6 and 2 Samuel 18:24 — were measured across the course first and
// were used by NO existing week. The gate pins the spine by literal text and
// asserts that neither Proverbs 11:1 nor Deuteronomy 25:13 is anywhere in the
// module, so a later edit cannot quietly slide it back onto sov52's ground.
//
// THE THIRD DANGER is a quotation that is nearly the verse. Every quoted span
// in every string of the module, at any depth, is compared with the corpus on
// disk; pairing is done by SPLITTING on the quote character (DR-1259), never
// by a regex; and the sweep asserts its own count so a sweep that stopped
// looking cannot pass. Spans with no reference after them are the newsletter's
// own speakers, and they are pinned separately by literal text.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords, quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const ID = 'sov54-cheating-became-an-industry-and-the-watchman-who-will-not-climb';
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const PLACES = L ? { lesson: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names, joined exactly as the gates join it. */
export function corpusText(ref) {
  const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref).trim());
  if (!m) return null;
  const chap = chapter(m[1], m[2]);
  if (!chap) return null;
  const out = [];
  for (let v = Number(m[3]); v <= Number(m[4] || m[3]); v += 1) { if (chap[v - 1] == null) return null; out.push(chap[v - 1]); }
  return out.join(' ');
}
/** Pairs by SPLITTING on the quote character, never by regex (DR-1258 / DR-1259). */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue; // a named speaker, pinned by literal text below
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!verse.includes(inside.trim())) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// The spine, pinned by literal text. Every span was read out of the corpus on
// disk before it was written into the lesson.
const SPINE = [
  ['Ezekiel 3:17', 'Son of man, I have made thee a watchman unto the house of Israel: therefore hear the word at my mouth, and give them warning from me'],
  ['Ezekiel 33:2', 'if the people of the land take a man of their coasts, and set him for their watchman'],
  ['Ezekiel 33:3', 'he blow the trumpet, and warn the people'],
  ['Ezekiel 33:6', 'but his blood will I require at the watchman’s hand'],
  ['Isaiah 21:6', 'Go, set a watchman, let him declare what he seeth'],
  ['2 Samuel 18:24', 'And David sat between the two gates'],
  ['Nehemiah 7:3', 'every one in his watch, and every one to be over against his house'],
  ['Nehemiah 4:18', 'he that sounded the trumpet was by me'],
  ['Jeremiah 6:17', 'Also I set watchmen over you, saying, Hearken to the sound of the trumpet. But they said, We will not hearken'],
  ['Habakkuk 1:16', 'Therefore they sacrifice unto their net, and burn incense unto their drag'],
  ['Proverbs 1:19', 'So are the ways of every one that is greedy of gain; which taketh away the life of the owners thereof'],
  ['Isaiah 59:4', 'None calleth for justice, nor any pleadeth for truth: they trust in vanity, and speak lies'],
  ['Jude 1:6', 'And the angels which kept not their first estate, but left their own habitation'],
  ['2 Kings 5:20', 'as the LORD liveth, I will run after him, and take somewhat of him'],
  ['2 Kings 5:25', 'Thy servant went no whither'],
  ['Ecclesiastes 7:1', 'A good name is better than precious ointment'],
  ['Proverbs 21:6', 'The getting of treasures by a lying tongue is a vanity tossed to and fro of them that seek death'],
  ['Leviticus 19:11', 'Ye shall not steal, neither deal falsely, neither lie one to another'],
  ['Isaiah 56:5', 'I will give them an everlasting name, that shall not be cut off'],
  ['Isaiah 29:15', 'Who seeth us? and who knoweth us?'],
  ['Job 24:16', 'In the dark they dig through houses, which they had marked for themselves in the daytime'],
  ['Judges 7:2', 'The people that are with thee are too many'],
  ['Judges 7:7', 'the three hundred men that lapped'],
  ['1 Corinthians 3:13', 'the fire shall try every man’s work of what sort it is'],
  ['Matthew 7:16', 'Ye shall know them by their fruits'],
];

// The newsletter's own speakers. None of these is our finding, and none of
// them is Scripture, so each is pinned by literal text instead of against the
// corpus — and the attribution is asserted beside it.
const SPEAKERS = [
  ["There's not a lot of other industries where you have to do things like fight cheaters and try and keep the experience super fair.", /Mike Reavey/],
  ["There's a real commercial enterprise at play here that we're up against. It's no longer the left-right, left-right kind of fun cheats.", /Electronic Arts/],
  ['You get them in the room, you identify who is in the room.', /Tim Rawlins[\s\S]*NCC Group/],
  ['because you want to figure out, have you got the right people in the room.', /NCC Group/],
  ["You need a layer of tooling that says I can make my data safe to use with these models or vendors. If those models and vendors aren't providing those tools, the enterprise should be investing in it.", /Cillian Kieran[\s\S]*Ethyca/],
  ["I'd personally find it much more interesting to learn about someone who has built one to two agents that have completely changed the way a person operates, as opposed to someone who has opened the floodgates to 100 thrown together agents that maybe aren't great.", /Aryeh Needle[\s\S]*LevelUp Growth Consulting/],
];

describe('sov54 exists once, at its own week, with every field the course expects', () => {
  it('is in the catalog exactly once and claims its own number once (which week is newest belongs to the course, not to this spec)', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const nums = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)/.exec(m.id)[1]));
    expect(nums.filter((n) => n === 54)).toEqual([54]);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });

  it('carries every field the course expects, and four real bands that rise', () => {
    expect(L.lesson.length).toBeGreaterThan(20000);
    for (const b of BANDS) expect(L.levels[b].length, `${b} band too thin`).toBeGreaterThan(9000);
    const len = BANDS.map((b) => L.levels[b].length);
    expect(len[0]).toBeLessThan(len[1]);
    expect(len[1]).toBeLessThan(len[2]);
    for (const a of BANDS) for (const b of BANDS) if (a !== b) expect(L.levels[a]).not.toBe(L.levels[b]);
    expect(Object.keys(L.rpe)).toEqual(['research', 'plan', 'execute']);
    expect(L.benefits).toHaveLength(10);
    expect(L.quiz.questions).toHaveLength(12);
    expect(L.facilitator.talkingPoints).toHaveLength(10);
    expect(L.facilitator.discussionPrompts).toHaveLength(10);
    expect(typeof L.facilitator.howToRun).toBe('string');
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(String(s.body).trim().split(/\s+/).length, `${s.title} is too short to be a story`).toBeGreaterThanOrEqual(100);
      expect(quotedPairs(s.body).filter((p) => p.ref).length, `${s.title} quotes no verse`).toBeGreaterThan(0);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
  });

  it('every quiz answer is in range, and the marked answers are the true ones', () => {
    for (const q of L.quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    const fail = L.quiz.questions.find((q) => /one way a watchman fails/.test(q.q));
    expect(fail.options[fail.answer]).toMatch(/blows no trumpet/);
    const price = L.quiz.questions.find((q) => /two-hundred-dollar figure/.test(q.q));
    expect(price.options[price.answer]).toMatch(/Coveron and NordLayer/);
    const sort = L.quiz.questions.find((q) => /1 Corinthians 3:13/.test(q.q));
    expect(sort.options[sort.answer]).toMatch(/What sort it is/);
  });
});

describe('sov54 — every verse it stands on is the corpus, verbatim', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(170);
    for (const place of Object.keys(PLACES)) {
      expect(referencedCount([PLACES[place]]), `${place} quotes almost nothing`).toBeGreaterThanOrEqual(20);
    }
  });

  it('the catalog gate itself reads this lesson clean', () => {
    const scan = scanQuotedVerses([L], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans).toBeGreaterThan(150);
    expect(scan.uncheckable).toEqual([]);
  });

  it('PROVEN TO CATCH: a quotation that is nearly the verse is refused', () => {
    const near = L.lesson.replace('let him declare what he seeth', 'let him declare what he sees');
    expect(near).not.toBe(L.lesson);
    expect(verbatimFaults([near]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: one altered word inside the governing verse fails the sweep', () => {
    const broken = L.lesson.replace('blow not the trumpet', 'blow not the horn');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('anchor.ref names every verse the lesson stands on, and every anchor is named in the lesson (DR-0734)', () => {
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(30);
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      const p = parse(r);
      expect(p, `anchor ${r} does not parse`).toBeTruthy();
      if (p.a === p.b) expect(corpusText(r), `anchor ${r} does not resolve`).not.toBeNull();
      expect(named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('never substitutes Yahweh into a quotation, and uses Yahweh in our own voice with no generic term outside one', () => {
    const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');
    const inside = []; const generic = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const p of quotedPairs(t)) if (/\bYahweh\b/.test(p.inside)) inside.push(p.inside.slice(0, 50));
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) generic.push(`${m} :: ${t.slice(0, 50)}`);
    }
    expect(inside).toEqual([]);
    expect(generic).toEqual([]);
    expect(L.lesson).toMatch(/\bYahweh\b/);
    for (const b of BANDS) expect(L.levels[b], `${b} never says Yahweh`).toMatch(/\bYahweh\b/);
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('but his blood will I require at the watchman’s hand');
    expect(inQuotes).toContain('for they say, The LORD seeth us not');
  });

  it('PROVEN TO CATCH: Yahweh planted inside a quotation is found and refused', () => {
    const tampered = L.lesson.replace('Go, set a watchman, let him declare what he seeth', 'Go, set Yahweh’s watchman, let him declare what he seeth');
    expect(tampered).not.toBe(L.lesson);
    expect(quotedPairs(tampered).some((p) => /\bYahweh\b/.test(p.inside))).toBe(true);
    expect(verbatimFaults([tampered]).length).toBeGreaterThan(0);
  });

  it('no elision, no record id, no capitalised adversary and no doubled word anywhere', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
    const doubled = [];
    for (const t of EVERY_STRING) for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    expect(doubled).toEqual([]);
  });
});

describe('sov54 does not rebuild sov52’s spine (band differentiation’s sibling, at the level of the Word)', () => {
  it('the watchman is the spine, in every register', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(text, `${place} does not carry the watchman’s appointment`).toMatch(/I have made thee a watchman|set him for their watchman|set a watchman/);
      expect(text, `${place} does not carry the one way to fail`).toContain('blow not the trumpet');
      expect(text, `${place} does not distribute the watch`).toContain('every one in his watch, and every one to be over against his house');
    }
  });

  it('and the just-weight spine sov52 used is nowhere in this module', () => {
    const all = EVERY_STRING.join(' ');
    expect(all).not.toMatch(/Proverbs 11:1\b/);
    expect(all).not.toMatch(/Deuteronomy 25:1[3-6]/);
    expect(all).not.toMatch(/Proverbs 16:11/);
    expect(all).not.toMatch(/false balance/i);
    expect(all).not.toMatch(/divers weights/i);
  });
});

describe('sov54 attributes every borrowed word, and says what it could not verify', () => {
  it('each quotation from the newsletter is present verbatim, with its speaker named', () => {
    const all = EVERY_STRING.join('\n');
    for (const [quote, attribution] of SPEAKERS) {
      expect(all.includes(quote), `missing quotation: ${quote.slice(0, 50)}`).toBe(true);
      expect(all, `unattributed quotation: ${quote.slice(0, 40)}`).toMatch(attribution);
    }
    expect(L.lesson).toMatch(/IT Brew/);
    expect(L.lesson).toMatch(/sixteenth of September, 2026/);
  });

  it('no quotation from a named speaker is dressed as Scripture', () => {
    for (const [quote] of SPEAKERS) {
      for (const t of EVERY_STRING) {
        for (const p of quotedPairs(t)) {
          if (p.inside.includes(quote.slice(0, 30))) expect(p.ref, `a speaker’s words carry a verse reference: ${quote.slice(0, 40)}`).toBeNull();
        }
      }
    }
  });

  it('names the advertising it refused rather than quietly teaching from it', () => {
    expect(L.lesson).toMatch(/the advertising is not material/);
    expect(L.lesson).toMatch(/network-security vendor/);
    expect(L.lesson).toMatch(/which paragraphs it threw away/);
    expect(L.levels.senior).toMatch(/advertising is set aside/);
  });

  it('works the three tiers in the open, and refuses to under-claim as well as over-claim', () => {
    expect(L.lesson).toMatch(/Established, and therefore stated plainly/);
    expect(L.lesson).toMatch(/Genuinely open, and flagged narrowly/);
    expect(L.lesson).toMatch(/Over-reaching, with the true thing underneath still standing/);
    expect(L.lesson).toMatch(/Under-claiming any of that would be as much a failure of truth as inventing it/);
    expect(L.levels.teen).toMatch(/Under-claiming a truth is as much a failure as/);
  });

  it('carries the reported incident at its real strength AND names what is still unsettled, in every register', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(text, `${place} does not say the company itself is reported to have disclosed it`).toMatch(/itself disclosed|company itself said|men who made them say it did happen/i);
      expect(text, `${place} does not flag what is unsettled`).toMatch(/not clear|unsettled|do not agree|disagree|open investigation/i);
    }
    expect(L.lesson).toMatch(/dates disagree across the accounts/);
    expect(L.lesson).toMatch(/package-proxy system/);
    expect(L.lesson).toMatch(/still under investigation/);
  });

  it('says plainly that the primary pages could not be read from this machine', () => {
    expect(L.lesson).toMatch(/could not open the publishers’ pages|could not reach the publishers’ pages/);
    expect(L.lesson).toMatch(/host names refusing to resolve|the host names would not resolve/);
    expect(L.lesson).toMatch(/primary wording was never read here/);
    expect(L.inApp).toMatch(/would not open from the machine this/);
    for (const b of BANDS) expect(L.levels[b], `${b} hides the blind stretch`).toMatch(/would not open|could not open|could not reach/);
  });

  it('attributes the two-hundred-dollar identity to its vendors and the trade site, and leaves the price open', () => {
    expect(L.lesson).toMatch(/Coveron and\s+NordLayer/);
    expect(L.lesson).toMatch(/TechRadar Pro/);
    expect(L.lesson).toMatch(/a vendor-sourced statistic reported by a trade site/);
    expect(L.lesson).toMatch(/The established part is not the\s+price/);
    expect(L.lesson).toMatch(/Both companies named sell identity and network\s+security products/);
  });

  it('keeps the seller’s interest on the record beside his true observation', () => {
    expect(L.lesson).toMatch(/Mr\. Kieran sells\s+governance tooling/);
    expect(L.lesson).toMatch(/his commercial interest is real/);
    expect(L.lesson).toMatch(/practitioner’s judgment about scheduling, not a measured/);
  });

  it('names this house’s own low wall rather than preaching only at other people', () => {
    expect(L.lesson).toMatch(/Where the wall is low, named rather than implied/);
    expect(L.lesson).toMatch(/enforcing without\s+reporting/);
    expect(L.lesson).toMatch(/has never once been held in this house/);
    for (const b of BANDS) expect(L.levels[b], `${b} names no low place of our own`).toMatch(/low spot in our wall|where the wall is low|low places|where our own wall is low|OUR OWN WALL/i);
  });
});

describe('sov54 sends every reader to someone (DR-0733, DR-0795)', () => {
  it('the module is whole, and so is EVERY band', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });

  it.each(['lesson', ...BANDS])('%s carries all three directions in its own words', (place) => {
    expect(missingDirections(PLACES[place]), `${place} is short`).toEqual([]);
  });

  it('every place names the rhythm and the skill, not only the directions', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(/once today/i.test(text), `${place}: the rhythm is missing`).toBe(true);
      expect(/one friend this week/i.test(text), `${place}: the friend rhythm is missing`).toBe(true);
      expect(/listen/i.test(text), `${place}: the listening skill is missing`).toBe(true);
      expect(/teach (them |him )?one verse back/i.test(text), `${place}: teaching one verse back is missing`).toBe(true);
    }
  });

  it('measures growth the Word’s way, qualitative and quantitative', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      expect(/Galatians 5:22/.test(text), `${place}: the fruit measure is missing`).toBe(true);
      expect(/Hebrews 3:13/.test(text), `${place}: the days measure is missing`).toBe(true);
      expect(/Deuteronomy 6:7/.test(text), `${place}: the four places are missing`).toBe(true);
    }
  });

  it('PROVEN TO CATCH: one band losing its friend line alone is named, while the POOLED module still reads whole', () => {
    const child = L.levels.child;
    const friend = /Friends, tell one friend this week[^.]*\./.exec(child);
    expect(friend, 'the child band’s friend sentence is not where this spec expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, child: child.replace(friend[0], '').replace(/"Iron sharpeneth iron[^)]*\)/, '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'child', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(0.2);
  });

  it('PROVEN TO CATCH: pasting the teen band over the senior band is refused', () => {
    const cloned = { ...L, levels: { ...L.levels, senior: L.levels.teen } };
    const d = measureDifferentiation(cloned);
    expect(duplicatedBands(d, DIFF_CEILING)).toContain('teen~senior');
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBe(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const [place, text] of Object.entries(PLACES)) {
      if (place === 'lesson') continue;
      expect(text, place).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('the renderer keeps every word of every band', () => {
    for (const b of BANDS) {
      const text = L.levels[b];
      const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
      const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
      expect(missing, `${b}`).toEqual([]);
    }
  });
});

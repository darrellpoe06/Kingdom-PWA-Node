// @vitest-environment node
// =============================================================================
// L265 — "Jericho's Barred Gates — A City's Fear and One Woman's Faith": built
// from a link Darrell sent in for a lesson on the research road (agent_inbox row
// b92957a6-4b8b-4b27-a5de-6f74cb6c0e54, research item
// bc549bd8-f06e-472b-87c1-4f13c21c977e). DR-1226.
// =============================================================================
// WHAT THE ROAD RETURNED, AND WHAT IT DID NOT. An auto-caption transcript of a
// YouTube video (youtube-asr, 5,116 words, fetched on the NAS because the CI
// path is YouTube-IP-blocked). No timestamps on that route, so nothing here is
// cited to a minute mark. The speaker is NOWHERE IDENTIFIED in the material, so
// this lesson describes him as what he is and attaches no name, affiliation,
// faith label or motive to him (the World Issues 21 correction). The captions
// are a machine's hearing of a man, so no wording is quoted from him as his own.
//
// THE HONEST CENTRE, AND WHY IT NEEDS NO EMBELLISHMENT (DR-0098). Jericho heard
// the same report Rahab heard — she says so herself about the whole population,
// Joshua 2:9-11 — and the city barred its gate while she hid two men under flax.
// Hebrews 4:2 names the difference: the word did not profit them, not being
// mixed with faith. The gate pins that contrast in every band.
//
// THREE PLACES THIS LESSON REFUSES TO GO FURTHER THAN THE WORD (DR-0076 §8):
//   1. THE HILL COUNTRY. Numbers 13:28 / Deuteronomy 9:1-3 are taught as
//      written: tall peoples, fortified cities, and Yahweh crossing over first.
//      Scripture never places one of them on Jericho's wall, and this lesson
//      builds nothing on that silence (Deuteronomy 29:29). No Nephilim frame is
//      imported here; Genesis 6 is another lesson's ground.
//   2. THE ARCHAEOLOGY. Established and stated plainly: Tell es-Sultan is among
//      the oldest settled sites excavated, its early tower and wall are real,
//      and the mound is city upon city, walled and burned. NOT claimed: that the
//      destruction layer's date proves the biblical one. That dating is the most
//      argued point in the field and the lesson says so instead of resolving it.
//   3. THE SPEAKER'S CLOSING APPLICATION. He has Rahab reading a hopeless city
//      correctly and getting out before the walls fell. The text has her
//      STAYING — Joshua 2:15, 2:21 — and being carried out of the ruin
//      afterwards, Joshua 6:22-23, 6:25. The Word corrects that claim while the
//      true thing under it stands (DR-0100 tier 3), and the correction is pinned.
//
// TYPOGRAPHIC THEOLOGY, SOURCE CONFLICT SURFACED. The source material writes
// "Baal worship" capitalised. CLAUDE.md is senior to the source, so the false
// god is never capitalised here; in the event, that strand (Hiel's Bethel and
// the house of Ahab) is carried by 1 Kings 16:34 alone and the name is not used.
//
// WHAT THE CHECKS MEASURED BEFORE COMMIT (scratchpad gate over the draft,
// before it touched the catalog): 322 referenced spans, 0 verbatim faults;
// fullness 0.53 / 0.63 / 0.89 / 1.21 against floors 0.5 / 0.6 / 0.6 / 0.6;
// authored-prose grades child -0.31, youth 3.20, teen 5.42, senior 8.56 (the
// ladder rises by more than one at each step and the child band is under 5.0);
// worst band overlap 0.10; every band names its lesson; every place carries all
// three directions; 0 elisions, 0 recited records, 0 straight apostrophes inside
// a quotation, and no generic "God" in our own prose in any band.
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

const ID = 'll265-jerichos-barred-gates-a-citys-fear-and-one-womans-faith';
const PREV = 'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');
const CLOSING = '"And the gates of it shall not be shut at all by day: for there shall be no night there" (Revelation 21:25).';

// Quoted in EVERY band: the gate, the report, the hinge, the token, the rescue,
// the curse and its landing, and the mercy that kept coming back to that ground.
const IN_EVERY_BAND = [
  ['the spies lodge in the least likely house', 'Joshua', 2, 1, 'came into an harlot’s house, named Rahab, and lodged there'],
  ['the king’s order to her door', 'Joshua', 2, 3, 'Bring forth the men that are come to thee, which are entered into thine house'],
  ['the gate as the city clock', 'Joshua', 2, 5, 'about the time of shutting of the gate, when it was dark'],
  ['and it shuts again', 'Joshua', 2, 7, 'they shut the gate'],
  ['the flax on the roof', 'Joshua', 2, 6, 'hid them with the stalks of flax'],
  ['her confession, about the whole city', 'Joshua', 2, 9, 'I know that the LORD hath given you the land, and that your terror is fallen upon us'],
  ['every heart in the place', 'Joshua', 2, 11, 'our hearts did melt, neither did there remain any more courage in any man'],
  ['she names her family one by one', 'Joshua', 2, 13, 'And that ye will save alive my father, and my mother, and my brethren, and my sisters'],
  ['she lived in the defences', 'Joshua', 2, 15, 'Then she let them down by a cord through the window'],
  ['safety is inside the marked house', 'Joshua', 2, 19, 'and whosoever shall be with thee in the house, his blood shall be on our head'],
  ['the token goes up', 'Joshua', 2, 21, 'and she bound the scarlet line in the window'],
  ['it was not only Jericho', 'Joshua', 5, 1, 'their heart melted, neither was there spirit in them any more'],
  ['the habit becomes total', 'Joshua', 6, 1, 'Now Jericho was straitly shut up because of the children of Israel: none went out, and none came in'],
  ['handed over before a weapon was lifted', 'Joshua', 6, 2, 'See, I have given into thine hand Jericho, and the king thereof, and the mighty men of valour'],
  ['one house carved out by name', 'Joshua', 6, 17, 'only Rahab the harlot shall live, she and all that are with her in the house'],
  ['the wall fell with her behind it', 'Joshua', 6, 20, 'the wall fell down flat, so that the people went up into the city'],
  ['she is fetched out of the ruin', 'Joshua', 6, 22, 'Go into the harlot’s house, and bring out thence the woman, and all that she hath, as ye sware unto her'],
  ['saved, not evacuated', 'Joshua', 6, 25, 'And Joshua saved Rahab the harlot alive'],
  ['the curse over the rubble', 'Joshua', 6, 26, 'Cursed be the man before the LORD, that riseth up and buildeth this city Jericho'],
  ['the difference named', 'Hebrews', 4, 2, 'the word preached did not profit them, not being mixed with faith in them that heard it'],
  ['the walls fell by faith', 'Hebrews', 11, 30, 'By faith the walls of Jericho fell down, after they were compassed about seven days'],
  ['heaven’s verdict on her', 'Hebrews', 11, 31, 'By faith the harlot Rahab perished not with them that believed not'],
  ['and its other half', 'James', 2, 25, 'was not Rahab the harlot justified by works'],
  ['the hill country as written', 'Numbers', 13, 28, 'the people be strong that dwell in the land, and the cities are walled, and very great'],
  ['the answer is a Person going first', 'Deuteronomy', 9, 3, 'Understand therefore this day, that the LORD thy God is he which goeth over before thee'],
  ['where the Word is quiet, we stop', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God'],
  ['a token any family out of Egypt knew', 'Exodus', 12, 13, 'when I see the blood, I will pass over you'],
  ['the real strong tower', 'Proverbs', 18, 10, 'The name of the LORD is a strong tower: the righteous runneth into it, and is safe'],
  ['the word landed four centuries later', '1 Kings', 16, 34, 'In his days did Hiel the Bethelite build Jericho'],
  ['mercy on the same ground', '2 Kings', 2, 21, 'I have healed these waters; there shall not be from thence any more death or barren land'],
  ['called down by name', 'Luke', 19, 5, 'Zacchaeus, make haste, and come down; for to day I must abide at thy house'],
  ['a house in Jericho, saved again', 'Luke', 19, 9, 'This day is salvation come to this house'],
  ['why He came', 'Luke', 19, 10, 'For the Son of man is come to seek and to save that which was lost'],
  ['the harlot of Jericho in the King’s line', 'Matthew', 1, 5, 'And Salmon begat Booz of Rachab'],
  ['not the spirit the city had', '2 Timothy', 1, 7, 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind'],
  ['the gates He promised', 'Isaiah', 60, 11, 'Therefore thy gates shall be open continually; they shall not be shut day nor night'],
  ['and the gate question retired', 'Revelation', 21, 25, 'And the gates of it shall not be shut at all by day: for there shall be no night there'],
  ['teach them diligently', 'Deuteronomy', 6, 7, 'And thou shalt teach them diligently unto thy children'],
  ['iron sharpeneth iron', 'Proverbs', 27, 17, 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];
const ELSEWHERE = [
  ['the woman hid the two men', 'Joshua', 2, 4, 'And the woman took the two men, and hid them'],
  ['her sources named', 'Joshua', 2, 10, 'For we have heard how the LORD dried up the water of the Red sea for you'],
  ['the oath she asked for', 'Joshua', 2, 12, 'swear unto me by the LORD, since I have shewed you kindness'],
  ['the scarlet thread and the gathering in', 'Joshua', 2, 18, 'thou shalt bind this line of scarlet thread in the window which thou didst let us down by'],
  ['where she sent them, and did not go', 'Joshua', 2, 16, 'Get you to the mountain, lest the pursuers meet you; and hide yourselves there three days'],
  ['and that is where they went', 'Joshua', 2, 22, 'and came unto the mountain, and abode there three days'],
  ['the spies’ whole report', 'Joshua', 2, 24, 'Truly the LORD hath delivered into our hands all the land'],
  ['the method', 'Joshua', 6, 5, 'all the people shall shout with a great shout; and the wall of the city shall fall down flat'],
  ['the shout', 'Joshua', 6, 16, 'Shout; for the LORD hath given you the city'],
  ['her household brought out', 'Joshua', 6, 23, 'And the young men that were spies went in, and brought out Rahab, and her father, and her mother, and her brethren'],
  ['He said the news would travel', 'Exodus', 15, 14, 'The people shall hear, and be afraid'],
  ['Canaan shall melt away', 'Exodus', 15, 15, 'all the inhabitants of Canaan shall melt away'],
  ['fear and dread', 'Exodus', 15, 16, 'Fear and dread shall fall upon them'],
  ['He did it on purpose', 'Deuteronomy', 2, 25, 'This day will I begin to put the dread of thee and the fear of thee upon the nations'],
  ['faith comes by hearing', 'Romans', 10, 17, 'So then faith cometh by hearing, and hearing by the word of God'],
  ['faith defined', 'Hebrews', 11, 1, 'Now faith is the substance of things hoped for, the evidence of things not seen'],
  ['He rewards the ones who come', 'Hebrews', 11, 6, 'he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him'],
  ['faith without works', 'James', 2, 26, 'faith without works is dead also'],
  ['the conclusion He had not authorised', 'Numbers', 13, 31, 'We be not able to go up against the people; for they are stronger than we'],
  ['the evil report', 'Numbers', 13, 32, 'all the people that we saw in it are men of a great stature'],
  ['as grasshoppers', 'Numbers', 13, 33, 'and we were in our own sight as grasshoppers, and so we were in their sight'],
  ['what the people said to each other', 'Deuteronomy', 1, 28, 'The people is greater and taller than we; the cities are great and walled up to heaven'],
  ['the size of the problem conceded', 'Deuteronomy', 9, 1, 'to go in to possess nations greater and mightier than thyself, cities great and fenced up to heaven'],
  ['who can stand', 'Deuteronomy', 9, 2, 'A people great and tall, the children of the Anakims, whom thou knowest'],
  ['Caleb went in on that basis', 'Joshua', 14, 12, 'if so be the LORD will be with me, then I shall be able to drive them out'],
  ['saved, and thy house', 'Acts', 16, 31, 'Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house'],
  ['a wall in his own conceit', 'Proverbs', 18, 11, 'The rich man’s wealth is his strong city, and as an high wall in his own conceit'],
  ['the old sorting line', 'Psalms', 20, 7, 'Some trust in chariots, and some in horses: but we will remember the name of the LORD our God'],
  ['the judgment was deferred a long time', 'Genesis', 15, 16, 'for the iniquity of the Amorites is not yet full'],
  ['the city chose its side and fought', 'Joshua', 24, 11, 'and the men of Jericho fought against you'],
  ['bad water in a pleasant place', '2 Kings', 2, 19, 'the situation of this city is pleasant, as my lord seeth: but the water is naught, and the ground barren'],
  ['healed unto this day', '2 Kings', 2, 22, 'So the waters were healed unto this day'],
  ['the road kept its hard name', 'Luke', 10, 30, 'A certain man went down from Jerusalem to Jericho, and fell among thieves'],
  ['the beggar outside the city', 'Luke', 18, 35, 'as he was come nigh unto Jericho, a certain blind man sat by the way side begging'],
  ['he would not be quiet', 'Luke', 18, 38, 'Jesus, thou Son of David, have mercy on me'],
  ['and received his sight', 'Luke', 18, 42, 'Receive thy sight: thy faith hath saved thee'],
  ['He entered the city Himself', 'Luke', 19, 1, 'And Jesus entered and passed through Jericho'],
  ['what He is like', '2 Peter', 3, 9, 'not willing that any should perish, but that all should come to repentance'],
  ['somewhere for fear to go', 'Psalms', 56, 3, 'What time I am afraid, I will trust in thee'],
  ['the charge to the man who marched', 'Joshua', 1, 9, 'Be strong and of a good courage; be not afraid, neither be thou dismayed'],
  ['checked the way the Bereans checked', 'Acts', 17, 11, 'and searched the scriptures daily, whether those things were so'],
];

describe('L265 exists, is numbered, dated, and carries all four bands', () => {
  // DELIBERATELY NOT "is the last lesson" and NOT "266 is absent": a pin on the
  // catalog never growing is the one pin certain to break. Several builders are
  // working ll265-ll267 in parallel, so this lesson pins only its OWN facts.
  it('is in the catalog exactly once, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
  it('claims 265 once and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 265)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(265); // a floor, never an equality
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });
  it('sits after L258 in reading order and carries the day it was built', () => {
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id === PREV);
    expect(prev, 'L258 is in the catalog').toBeGreaterThan(-1);
    expect(at).toBeGreaterThan(prev);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    expect(LIVING_LESSONS_ADDED[PREV] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names its road honestly and claims nothing on the speaker’s authority', () => {
    expect(L.lesson).toContain('sent in for a lesson');
    expect(L.lesson).toContain('fetched and studied on our own machines');
    expect(L.lesson).toContain('is not named in what came back');
    expect(L.anchor.theme).toContain('fetched and studied on our own machines');
    expect(L.facilitator.howToRun).toContain('nowhere identified');
    expect(L.facilitator.howToRun).toContain('Nothing he claims is asserted on his authority');
  });
  it('the adult lesson walks ten movements, in order', () => {
    const order = [
      'ONE. THE GATE WAS SHUT EVERY NIGHT',
      'TWO. THE WHOLE CITY HAD ALREADY HEARD',
      'THREE. THE SAME REPORT, TWO ANSWERS',
      'FOUR. WHAT THE WORD SAYS ABOUT THE HILL COUNTRY, AND WHERE IT STOPS',
      'FIVE. A TOKEN IN THE WINDOW, AND A HOUSE THAT HELD',
      'SIX. SHE WAS NOT SAVED BY LEAVING',
      'SEVEN. THE WALLS CAME DOWN BY FAITH, NOT BY SIEGE',
      'EIGHT. THE CURSE OVER THE RUINS, AND THE MAN WHO TESTED IT',
      'NINE. MERCY KEPT COMING BACK TO THAT GROUND',
      'TEN. THE PRACTICE',
    ];
    let at = -1;
    for (const h of order) {
      const i = L.lesson.indexOf(h);
      expect(i, `${h} is missing or out of order`).toBeGreaterThan(at);
      at = i;
    }
  });
});

describe('L265 — the contrast is the lesson, and every band carries it', () => {
  it.each([
    [/barred gates/i, 'the barred gates'],
    [/Jericho/, 'Jericho by name'],
    [/Rahab/, 'Rahab by name'],
    [/\bfaith\b/i, 'faith'],
    [/\bfear|afraid|scared\b/i, 'fear'],
    [/Yahweh/, 'Yahweh by covenant name'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it.each(ALL)('%s sets the city’s answer beside hers: the same report, two answers', (k) => {
    // The whole city heard (Joshua 2:9 / 2:11 / 5:1) …
    for (const ref of ['Joshua 2:9', 'Joshua 2:11', 'Joshua 5:1']) {
      expect(TEXTS[k].includes(`(${ref})`), `${k} drops ${ref}, so the city's hearing is not shown`).toBe(true);
    }
    // … the gate was its answer (Joshua 2:5 / 2:7 / 6:1) …
    for (const ref of ['Joshua 2:5', 'Joshua 2:7', 'Joshua 6:1']) {
      expect(TEXTS[k].includes(`(${ref})`), `${k} drops ${ref}, so the barred gate is not shown`).toBe(true);
    }
    // … hers was to hide the men (Joshua 2:6), and Hebrews 4:2 names why.
    expect(TEXTS[k].includes('(Joshua 2:6)'), `${k} drops her answer`).toBe(true);
    expect(TEXTS[k].includes('(Hebrews 4:2)'), `${k} drops the verse that names the difference`).toBe(true);
  });
  it.each(ALL)('%s holds faith and works together over her one act', (k) => {
    expect(TEXTS[k].includes('(Hebrews 11:31)') && TEXTS[k].includes('(James 2:25)'), `${k} drops one half of the verdict`).toBe(true);
  });
  it.each(ALL)('%s teaches that she was NOT saved by leaving but carried out of the ruin', (k) => {
    for (const ref of ['Joshua 2:21', 'Joshua 6:20', 'Joshua 6:22', 'Joshua 6:25']) {
      expect(TEXTS[k].includes(`(${ref})`), `${k} drops ${ref}, so the rescue reads as an escape`).toBe(true);
    }
  });
  it.each(ALL)('%s stops where the Word stops on the hill country', (k) => {
    expect(TEXTS[k].includes('(Numbers 13:28)'), `${k} drops what the Word does say`).toBe(true);
    expect(TEXTS[k].includes('(Deuteronomy 9:3)'), `${k} drops the answer to the report`).toBe(true);
    expect(TEXTS[k].includes('(Deuteronomy 29:29)'), `${k} drops the restraint`).toBe(true);
  });
  it('no band imports a Nephilim frame, and none puts a giant at Jericho', () => {
    expect(/Nephilim|nephilim/.test(whole), 'Genesis 6 is another lesson’s ground').toBe(false);
    expect(/giant[^.]{0,80}Jericho|Jericho[^.]{0,80}giant/i.test(whole), 'Scripture never places one at Jericho').toBe(false);
  });
  it('never asserts that the archaeology proves the biblical date, and names the dispute', () => {
    expect(/\bmost argued\b|\bmost contested\b/.test(whole), 'the dating dispute is named').toBe(true);
    expect(/does not claim (that )?the spade proved the Book/.test(whole), 'the claim is explicitly refused').toBe(true);
    expect(/(archaeology|excavation|spade|dig\w*)[^.]{0,60}(proves|proved|confirms|confirmed) the (biblical|Bible)/i.test(whole)).toBe(false);
  });
  it('never capitalises a false god, anywhere, however the source wrote it', () => {
    const everything = JSON.stringify(L);
    for (const bad of ['Baal', 'Satan', 'Lucifer', 'the Devil', 'the Adversary']) {
      expect(everything.includes(bad), `${bad} is capitalised somewhere in L265`).toBe(false);
    }
  });
  it.each(ALL)('%s closes on Revelation 21:25, the city whose gates never shut', (k) => {
    expect(TEXTS[k].trim().endsWith(CLOSING), `${k} does not close on Revelation 21:25`).toBe(true);
  });
  it.each(ALL)('%s quotes every strand every band carries', (k) => {
    for (const [why, book, ch, n] of IN_EVERY_BAND) {
      expect(TEXTS[k].includes(`(${book} ${ch}:${n}`), `${k} drops ${why} (${book} ${ch}:${n})`).toBe(true);
    }
  });
});

describe('L265 — every quoted span is the verse, from the corpus on disk', () => {
  it.each([...IN_EVERY_BAND, ...ELSEWHERE])('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });
  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(280);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = verbatimFaults(L);
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('would catch an altered quotation (proven-to-catch)', () => {
    const altered = { ...L, levels: { ...L.levels, child: L.levels.child.replace('when it was dark, that the men went out"', 'when it got dark, the men left"') } };
    expect(altered.levels.child).not.toBe(L.levels.child);
    expect(verbatimFaults(altered).some((f) => f.includes('Joshua 2:5'))).toBe(true);
    // The DR-0076 bright line: "Yahweh" must never be substituted INTO a quote.
    const yahwehed = { ...L, lesson: L.lesson.replace('for the LORD your God, he is God in heaven above', 'for Yahweh your God, he is God in heaven above') };
    expect(yahwehed.lesson).not.toBe(L.lesson);
    expect(verbatimFaults(yahwehed).some((f) => f.includes('Joshua 2:11'))).toBe(true);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('every anchor reference is named in the lesson, and the gate verse is the first anchor', () => {
    for (const ref of L.anchor.ref.split(';').map((r) => r.trim())) {
      expect(L.lesson.includes(`(${ref})`), `${ref} is anchored but never named`).toBe(true);
    }
    expect(L.anchor.ref.startsWith('Joshua 2:5')).toBe(true);
  });
  it('each story’s verse is one the lesson anchors on', () => {
    for (const s of L.stories) expect(L.anchor.ref.split(';').map((r) => r.trim())).toContain(s.verse);
  });
});

describe('L265 — four bands, each carrying the whole message', () => {
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
    const cut = { ...L, levels: { ...L.levels, senior: L.levels.senior.replace(/Friend to friend, name for one friend this week[^.]*\./, 'Think about it.') } };
    expect(cut.levels.senior).not.toBe(L.levels.senior);
    expect(placesMissingDirections(cut).some((p) => p.place === 'senior' && p.missing.includes('friends'))).toBe(true);
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

describe('L265 — two stories, the full teaching shape, and Yahweh in our voice', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach THIS lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    expect(light.title).toBe('The Key on the Kitchen Nail');
    expect(/They had all held the same card/.test(light.body), 'the light story is the same report, two answers').toBe(true);
    expect(light.verse).toBe('Hebrews 4:2');
    expect(solemn.title).toBe('The Stake in the Grass');
    expect(/a warning he was given and never acted on/.test(solemn.body), 'the solemn story is Hiel’s shape').toBe(true);
    expect(solemn.verse).toBe('Joshua 6:26');
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
    expect(/\bGod(?:'s|’s)?\b/.test(ourProseOnly(`${TEXTS.child} Then God shut the gate.`))).toBe(true);
  });
  it('confesses Jesus as the Lamb of Yahweh in our voice', () => {
    expect(L.levels.senior).toContain('the Lamb of Yahweh');
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});

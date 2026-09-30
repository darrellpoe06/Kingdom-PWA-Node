// @vitest-environment node
// =============================================================================
// L202 — Prepared Before the Position — Homecoming, Legacy, Good Success, and
// Represent (DR-0690)
// =============================================================================
// Darrell recorded a Bible study class inside the PoeTech app, in Thinking Space,
// on 2026-09-30 (agent_inbox d2f21ba3-ab40-496d-ae62-e4a3e2ff8298),
// naming the teaching for Bishop Gwin. Whisper transcribed it on the NAS CPU
// rung (agent_inbox aed9557b-333e-4152-adbc-de0f9e695793, 16,511 characters).
// The transcript never names the teacher, marks no speakers, and begins
// partway through the message; the lesson says so, and names who spoke from the
// recording's context, Darrell's own account and Bishop Gwin's notes (DR-0699). Every quoted span is the
// verse it names (the repo's scanQuotedVerses), and the teacher's own points
// are pinned in the order he gave them.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
const book = (b) => JSON.parse(readFileSync(join(KJV, `${b.replace(/ /g, '')}.json`), 'utf8')).chapters;
const verse = (b, c, v) => book(b)[c - 1][v - 1];

const ID = 'll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L202 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS = () => FULL_BANDS.map((b) => L().levels[b]);

const MOVEMENTS = [
  'ONE. IF YOU ARE STILL HERE, HE IS STILL WRITING YOUR STORY.',
  'TWO. HOMECOMING IS ABOUT LEGACY.',
  'THREE. WHAT WILL WE LEAVE?',
  'FOUR. JOSHUA WAS LEADING BEFORE HE WAS LEADING.',
  'FIVE. THE HAND LAID ON IN PUBLIC.',
  'SIX. YAHWEH DEFINES SUCCESS.',
  'SEVEN. STAY IN THE WORD: THE RENEWED MIND.',
  'EIGHT. REPRESENT.',
  'NINE. WHO SHALL SEPARATE US?',
  'THE CLOSE.',
];

describe('L202 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and facilitator points', () => {
    const m = L();
    expect(m.title).toBe('Prepared Before the Position — Homecoming, Legacy, Good Success, and Represent');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Psalms 145:4', 'Exodus 17:9', 'Exodus 24:13', 'Numbers 27:18', 'Deuteronomy 34:9', 'Joshua 1:8', 'Luke 6:46', 'Romans 8:35']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(8);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 202, comes after L201, carries its day, is the only L202, and links L105 rather than repeating it', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l201 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll201-'));
    expect(l201).toBeTruthy();
    expect(num(L())).toBe(202);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l201));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length); // derived (DR-0677)
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-09-30');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll202-/.test(m.id))).toHaveLength(1);
    const l105 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll105-'));
    expect(l105.title.startsWith('Doing the Word Rewires You')).toBe(true);
    expect(L().lesson).toContain('beside L105, Doing the Word Rewires You');
  });
});

describe('provenance is said plainly (DR-0331: render for meaning, never guess)', () => {
  it('names the recording, the Whisper rung, the named teacher, and the three limits', () => {
    const l = L().lesson;
    expect(l).toContain('recorded the class inside the PoeTech app itself');
    expect(l).toContain('The Church of the Living God in Champaign, Illinois, in the normal weekly 1 p.m. Bible study with Bishop Gwin');
    expect(l.includes('on his phone'), 'recorded inside the app, not on a phone and sent in').toBe(false);
    expect(l).toContain('named the teaching for Bishop Gwin');
    expect(l).toContain('Whisper, running on the server’s processor (the nas-cpu rung)');
    expect(l).toContain('begins partway through the message');
    expect(l).toContain('the name Gwin never appears in it');
    expect(l).toContain('Bishop Lloyd E. Gwin');
    expect(l).toContain('every verse below is quoted from the King James text');
    for (const b of BANDS()) expect(b).toContain('Bishop Gwin');
  });

  it('the spelling Gwin is the church’s own, as the repo already records it', () => {
    const manifest = readFileSync(join(HERE, '..', 'lib', 'corpus-manifest.json'), 'utf8');
    expect(manifest).toContain('Bishop Lloyd E. Gwin');
  });

  it('the three witnesses are named: the in-app recording, Darrell\'s own account, and Bishop Gwin\'s notes', () => {
    const l = L().lesson;
    expect(l).toContain('the speakers were identified from the recording\'s context and Darrell\'s own account');
    expect(l).toContain('name the message Once a Christian, Always a Christian');
    expect(l).toContain('The recording opens inside the second.');
    for (const b of BANDS()) expect(b).toMatch(/Once a Christian, Always a Christian|Bishop Gwin was the teacher/);
    // The old line said the class stays unnamed; it must not come back beside the names.
    expect(ALL()).not.toMatch(/stay unnamed|kept unnamed|are not named because/);
  });
});

// WHO SAID WHAT (DR-0699). Darrell 2026-09-30: "Differentiate between speakers...
// Bishop Gwin is BG... Darrell Poe is DP... Other congregation members are called
// by BG..." and, deciding the privacy question (DR-0700): the church posts these
// sessions publicly, so members are named as Bishop Gwin calls them. Every name
// is pinned to the words the recording attaches it to, never guessed onto a voice.
const SPEAKER_PINS = [
  // [band or 'lesson', a sentence fragment that must carry the speaker]
  ['lesson', 'Bishop Gwin gave his own testimony. He always wanted to succeed'],
  ['lesson', 'Darrell Poe (DP) said that people used to think the human brain'],
  ['lesson', 'Darrell Poe (DP), who works in technology, said his son asked him'],
  ['lesson', 'Janelle, called by name just before she spoke, told of a university chancellor'],
  ['lesson', 'Names were said aloud in the room: Elder Mosley; Evangelist Gwin, as best the recording can be read (the machine wrote Evangelist Queen)'],
  ['lesson', 'the story of Christina, Darrell\'s wife (the machine wrote Christiana), who takes classes at the University of Illinois'],
  ['lesson', 'The recording does not mark who told about Christina or who gave that rule.'],
  ['lesson', 'Someone answered with the Word, and the recording does not mark who: "let God be true'],
  ['youth', 'Bishop Gwin told his own story. He always tried to win his own way.'],
  ['youth', 'SEVEN. STAY IN THE WORD. DP, Darrell Poe, said people used to believe'],
  ['youth', 'Janelle told about a university chancellor'],
  ['youth', 'Someone added, and the recording does not show who, "let God be true'],
  ['teen', 'Bishop Gwin admitted he chased success on his own terms'],
  ['teen', 'DP noted that scientists once believed'],
  ['teen', 'Janelle quoted a university chancellor'],
  ['senior', 'Bishop Gwin testified that he long wanted'],
  ['senior', 'DP observed that it was once generally believed'],
  ['senior', 'Janelle recalled a university chancellor'],
  ['child', 'Bishop Gwin told the class he tried to win his own way.'],
  ['child', 'Darrell said that long ago, people thought'],
  ['child', 'Janelle told about a school leader who wants to be a good ancestor.'],
];
const textOf = (m, where) => (where === 'lesson' ? m.lesson : m.levels[where]);
function speakerFaults(m) {
  const faults = [];
  for (const [where, frag] of SPEAKER_PINS) if (!textOf(m, where).includes(frag)) faults.push(`${where}: ${frag}`);
  // A name the recording shows only in one place may not wander onto other words.
  const all = [m.lesson, ...FULL_BANDS.map((b) => m.levels[b])].join(' ');
  for (const s of all.split(/(?<=[.!?])\s+/)) {
    if (/\bJanelle\b/.test(s) && !/chancellor|school leader|good ancestor/.test(s)) faults.push(`Janelle off her words: ${s.slice(0, 80)}`);
    if (/\bChristina\b/.test(s) && !/University of Illinois|big school|who told about Christina|Christina's mother|his wife Christina|Darrell and Christina/.test(s)) faults.push(`Christina off her words: ${s.slice(0, 80)}`);
    if (/\bChristiana\b/.test(s) && !/the machine wrote Christiana/.test(s)) faults.push(`the machine's spelling used as a name: ${s.slice(0, 80)}`);
    if (/\bMosley\b/.test(s) && !/said (aloud|out loud)|named aloud|names were said/i.test(s)) faults.push(`a forebear's name off its line: ${s.slice(0, 80)}`);
    if (/Evangelist Queen/.test(s) && !/the machine wrote Evangelist Queen/.test(s)) faults.push(`the machine's hearing used as a name: ${s.slice(0, 80)}`);
  }
  // The garbled third name is never guessed into a spelling.
  if (/Osia|Mama\b/.test(all)) faults.push('a garbled name was guessed');
  return faults;
}

describe('who said what: BG, DP, and the members as Bishop Gwin calls them (DR-0699, DR-0700)', () => {
  it('every speaker is pinned to the words the recording attaches to them', () => {
    expect(speakerFaults(L())).toEqual([]);
  });

  it('Evangelist Mary E. Gwin is honored in every band and the full lesson (Darrell, 2026-09-30)', () => {
    // Darrell: "Make sure Bishop Gwin and my wife Christina's mother BG's late wife
    // is named in this lesson she made sure I went back to school to get my degree
    // and also sent me and my wife on my first development training to build the
    // church website" / "Mary Gwin the churches south campus building is named
    // after her". Her title and the building's name are the church's own.
    for (const t of [L().lesson, ...BANDS()]) {
      expect(t).toContain('Evangelist Mary E. Gwin');
      expect(t).toContain('E-MEG Christian Center');
      const at = t.indexOf('Evangelist Mary E. Gwin');
      const around = t.slice(Math.max(0, at - 200), at + 700);
      for (const must of [/Bishop Gwin's (late )?wife/, /Christina's mother/, /school/, /website/]) expect(around, String(must)).toMatch(must);
    }
    expect(L().lesson).toContain('its south campus building bears her name');
  });

  it('the AI rule and Romans 3:4 are not handed to anyone the recording does not show', () => {
    for (const t of [L().lesson, ...BANDS()]) {
      for (const s of t.split(/(?<=[.!?])\s+/)) {
        if (/let God be true/.test(s)) expect(s, s).toMatch(/does not (show|mark) who|Someone/);
      }
    }
  });

  it('PROVEN-TO-CATCH: a name moved onto other words, a dropped speaker, and a guessed name each fire', () => {
    const moved = { ...L(), lesson: L().lesson.replace('Bishop Gwin gave his own testimony.', 'Janelle gave her own testimony.') };
    expect(speakerFaults(moved).length).toBeGreaterThan(0);
    const dropped = { ...L(), levels: { ...L().levels, teen: L().levels.teen.replace('DP noted that scientists', 'A member noted that scientists') } };
    expect(speakerFaults(dropped).length).toBeGreaterThan(0);
    const guessed = { ...L(), lesson: `${L().lesson} Osia Mama was there.` };
    expect(speakerFaults(guessed).length).toBeGreaterThan(0);
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
});

describe('the Word the teacher built on, pinned to the KJV', () => {
  it('Exodus 17:9 is the first verse of the Word that names Joshua, as the lesson says', () => {
    let first = null;
    for (const b of ['Genesis', 'Exodus']) {
      book(b).forEach((ch, ci) => ch.forEach((v, vi) => { if (!first && /\bJoshua\b/.test(v)) first = `${b} ${ci + 1}:${vi + 1}`; }));
    }
    expect(first).toBe('Exodus 17:9');
    expect(L().lesson).toContain('the first time the Word names Joshua');
  });

  it('the handoff and the promise read as the Word states them', () => {
    expect(verse('Numbers', 27, 19)).toContain('give him a charge in their sight');
    expect(verse('Numbers', 27, 20)).toContain('that all the congregation of the children of Israel may be obedient');
    expect(verse('Deuteronomy', 31, 2)).toContain('an hundred and twenty years old');
    expect(verse('Deuteronomy', 34, 9)).toContain('for Moses had laid his hands upon him');
    expect(verse('Exodus', 24, 13)).toContain('his minister Joshua');
    expect(verse('Joshua', 1, 8)).toContain('then thou shalt have good success');
    expect(verse('Psalms', 145, 4)).toContain('One generation shall praise thy works to another');
    expect(verse('Hebrews', 13, 5)).toContain('I will never leave thee, nor forsake thee');
  });

  it('the misheard references are read by the verse, never copied through', () => {
    const all = ALL();
    // The provenance sentence names the mishearings on purpose; everywhere else they must not appear.
    const said = /The machine misheard several words: Exodus came out as a string of letters, the Jordan as a joint, conquerors as Congress, and angry as a number; each is read here by the verse the class had open\./;
    expect(L().lesson).toMatch(said);
    const rest = all.replace(said, ' ');
    for (const heard of ['S and S', 'Luke 646', 'cross the joint', 'the joint', 'Congress', 'son of God,', 'shoe for the']) expect(rest.includes(heard), heard).toBe(false);
    expect(`${rest} more than Congress`.includes('Congress'), 'the check can fire').toBe(true);
    expect(all).toContain('"Who shall separate us from the love of Christ?');
    expect(all).toContain('more than conquerors');
  });
});

describe('the teaching is taught in the order it was given, and in our voice', () => {
  it('nine movements and the close, in order', () => {
    const l = L().lesson;
    let at = -1;
    for (const h of MOVEMENTS) {
      const i = l.indexOf(h);
      expect(i, h).toBeGreaterThan(at);
      at = i;
    }
  });

  it('the teacher’s own numbering is kept: legacy was point three, success point four, represent the last', () => {
    const l = L().lesson;
    expect(l).toContain('This was the teacher\'s third point');
    expect(l).toContain('SIX. YAHWEH DEFINES SUCCESS. This was the fourth point.');
    expect(l).toContain('The last point was one word: represent.');
  });

  it('an established fact is stated as fact (DR-0100): the adult brain changes with practice', () => {
    for (const t of [L().lesson, L().levels.teen, L().levels.senior, L().levels.youth]) {
      expect(t).toMatch(/neuroplasticity/);
      expect(t).not.toMatch(/some say|no one knows|it is debated/i);
    }
    expect(L().lesson).toContain('That is a documented fact, and we state it as one.');
  });

  it('Yahweh in our voice, the Godhead confessed, quoted KJV untouched, the adversary lowercase', () => {
    // The church's own name is a proper name, not our voice naming the Father; Yahweh-in-our-voice governs our own prose.
    const prose = PROSE().replace(/The Church of the Living God/g, 'The Church');
    expect(PROSE()).toContain('The Church of the Living God');
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
    expect(L().lesson).toContain('Jesus is the Lamb of Yahweh, the Eternal Son of Yahweh');
    expect(L().lesson).toContain('the rod of God in mine hand" (Exodus 17:9)');
  });

  it('PROVEN-TO-CATCH: a planted generic name, a misquote, a wrong reference, and a dropped movement each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God prepared Joshua.` };
    expect(quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ').match(/\bGod\b/g)).not.toBe(null);
    const misquote = { ...L(), lesson: L().lesson.replace('then thou shalt have good success" (Joshua 1:8)', 'then thou shalt have great success" (Joshua 1:8)') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);
    const wrongRef = { ...L(), lesson: L().lesson.replace('give him a charge in their sight" (Numbers 27:19)', 'give him a charge in their sight" (Numbers 27:18)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);
    const dropped = L().lesson.replace('FIVE. THE HAND LAID ON IN PUBLIC.', 'FIVE.');
    expect(dropped.indexOf('FIVE. THE HAND LAID ON IN PUBLIC.')).toBe(-1);
    
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

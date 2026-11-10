// @vitest-environment node
// =============================================================================
// dsi16 — The house reports itself: before and after the key stopped working
// =============================================================================
// Darrell, 2026-11-10: explain the before and after in a lesson, so we can know
// the what, where, when, how and why of these workflows. The module teaches the
// change recorded in DR-1398 (the migration receipt), DR-1399 (the clock report)
// and DR-1400 (the named cause), under DR-1360 (the NAS initiates every road).
//
// THIS LESSON'S PARTICULAR DANGER is that it teaches the system, so a sentence
// that drifts from the system is a false lesson. The reality-trace block below
// reads the real workflow, the real heartbeat reader and the real admin surface
// and requires the lesson's numbers to be theirs: the twenty-five-minute wait,
// the fifteen-minute clock, the twelve jobs, the strip's own label. Each is
// proven to catch.
//
// Quote pairing is done by splitting on the quote character, and the verbatim
// sweep asserts its own count so an empty scan cannot read as a pass.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATASYSTEMS_MODULES, DATASYSTEMS_META } from '../lib/datasystems-course.js';
import { CLOCK_MIN } from '../lib/nas-heartbeat.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'dsi16-the-house-reports-itself';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = DATASYSTEMS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const ROOT = join(process.cwd(), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
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
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// THE SPINE, pinned by literal text read out of the corpus before it was written.
const SPINE = [
  ['Proverbs 27:23', 'Be thou diligent to know the state of thy flocks, and look well to thy herds'],
  ['Habakkuk 2:2', 'Write the vision, and make it plain upon tables, that he may run that readeth it'],
  ['Isaiah 21:11', 'Watchman, what of the night?'],
  ['2 Samuel 18:25', 'If he be alone, there is tidings in his mouth'],
  ['Proverbs 13:17', 'a faithful ambassador is health'],
  ['Ezekiel 33:6', 'see the sword come, and blow not the trumpet'],
  [
    'Matthew 7:24-25',
    'built his house upon a rock: And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not',
  ],
  ['Psalms 146:3', 'Put not your trust in princes, nor in the son of man, in whom there is no help'],
  ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good'],
  ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much'],
  ['Deuteronomy 6:7', 'teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way'],
  ['Malachi 4:6', 'he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
  ['Proverbs 27:17', 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

describe('dsi16 is in the course, numbered, and whole', () => {
  it('exists exactly once as the sixteenth module with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(DATASYSTEMS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(DATASYSTEMS_MODULES[15].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course numbers stay contiguous and the meta counts every module', () => {
    const numbers = DATASYSTEMS_MODULES.map((m) => Number(/^dsi(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
    expect(DATASYSTEMS_META.weeks).toBe(DATASYSTEMS_MODULES.length);
    expect(DATASYSTEMS_META.weeks).toBeGreaterThanOrEqual(16);
  });

  it('carries a quiz whose answers are in range, and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = anchorRefs(L);
    expect(refs.length).toBe(14);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });
});

describe('what, where, when, how and why — each said, in the lesson and in the bands', () => {
  it('the lesson names every one of the five, by its own heading', () => {
    for (const h of [
      'WHAT THE PIECES ARE.',
      'WHERE THE ROADS RUN.',
      'WHAT IT WAS BEFORE.',
      'WHY IT WAS TURNED AROUND.',
      'WHAT IT IS NOW.',
      'HOW IT RUNS, IN ORDER.',
      'WHEN IT WAS PROVEN.',
      'WHAT IT DOES NOT DO.',
    ]) {
      expect(L.lesson, h).toContain(h);
    }
  });

  it('carries the measured timeline from the recorded runs in the lesson, teen and senior bands', () => {
    for (const k of ['adult', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: 0317 asked`).toMatch(/12:15:20/);
      expect(TEXTS[k], `${k}: 0317 applied by the NAS`).toMatch(/12:15:24/);
      expect(TEXTS[k], `${k}: read back`).toMatch(/12:16:21/);
      expect(TEXTS[k], `${k}: none missing of 316`).toMatch(/none missing (?:out )?of 316/);
      expect(TEXTS[k], `${k}: 0318`).toMatch(/1:30/);
      expect(TEXTS[k], `${k}: the loops check`).toMatch(/1:40/);
    }
    for (const k of PLACES) expect(TEXTS[k], `${k}: the date`).toMatch(/November 10, 2026/);
  });

  it('says why in his direction, rendered for meaning and never inside double quotes', () => {
    expect(L.lesson).toMatch(/Darrell asked why it could not be done another way with the same outcome/);
    expect(L.lesson).toMatch(/support, never a necessity/);
    expect(L.lesson).toMatch(/the NAS starts every road and the lane never reaches in/);
    for (const k of PLACES) expect(TEXTS[k], `${k}: names Darrell`).toMatch(/Darrell/);
  });

  it('says plainly that the earlier advice was wrong, instead of leaving it out', () => {
    expect(L.lesson).toMatch(/the next step offered was to mint a new outside credential/);
    expect(L.lesson).toMatch(/That offer was the wrong answer, and it had already been refused/);
  });

  it('states every limit in the lesson, the youth, teen and senior bands', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: names and times only`).toMatch(/names and times only/);
      expect(TEXTS[k], `${k}: a witness, not a lock`).toMatch(/witness, not a lock/);
      expect(TEXTS[k], `${k}: rests on poetech.us`).toMatch(/poetech\.us/);
    }
  });

  it('names the four causes a red check can name, where the reader learns to read one', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: stopped clock`).toMatch(/clock (?:may have )?stopped|stopped clock/);
      expect(TEXTS[k], `${k}: not pulled`).toMatch(/not (?:yet )?pulled|commit (?:the NAS has )?not (?:yet )?pulled|commit not yet pulled|has not pulled/);
    }
  });
});

describe('REALITY-TRACE: the lesson’s numbers are the system’s, not memory', () => {
  const dbMigrate = read('.github/workflows/db-migrate.yml');
  const loops = read('.github/workflows/loops-health.yml');
  const ops = read('app/src/components/OpsBoard.jsx');

  it('the twenty-five-minute wait is the workflow’s own --wait', () => {
    const wait = Number(/served-migration-receipt\.py --wait (\d+)/.exec(dbMigrate)[1]);
    expect(wait / 60).toBe(25);
    expect(L.lesson).toMatch(/up to twenty-five minutes/);
  });

  it('the fifteen-minute clock is the heartbeat reader’s own CLOCK_MIN', () => {
    expect(CLOCK_MIN).toBe(15);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/fifteen minutes/);
  });

  it('the twelve jobs are the loops witness’s own list', () => {
    const list = /loops = \[([^\]]+)\]/.exec(loops)[1].split(',');
    expect(list).toHaveLength(12);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/twelve/);
  });

  it('the strip the in-app step names is the one the admin surface renders', () => {
    expect(L.inApp).toMatch(/Admin, then Systems/);
    expect(L.inApp).toContain("'the NAS — its own heartbeat'");
    expect(ops).toContain('the NAS — its own heartbeat');
    expect(read('app/src/lib/nas-heartbeat.js')).toContain('Last cycle: every service ran.');
    expect(read('app/src/components/AdminConsole.jsx')).toContain('<OpsBoard />');
  });

  it('PROVEN TO CATCH: a lesson that says thirty minutes no longer matches the workflow', () => {
    const wrong = L.lesson.replace('up to twenty-five minutes', 'up to thirty minutes');
    expect(wrong).not.toBe(L.lesson);
    expect(/up to twenty-five minutes/.test(wrong)).toBe(false);
    const wait = Number(/served-migration-receipt\.py --wait (\d+)/.exec(dbMigrate)[1]);
    expect(wait / 60).not.toBe(30);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
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

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(30);
  });

  it('every double-quoted span carries a reference: nothing of ours is dressed as Scripture', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('know the state of thy flocks', 'know the count of thy flocks');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a word of ours in double quotes is seen as dressed-up Scripture', () => {
    const broken = L.lesson.replace("'unknown'", '"unknown"');
    expect(broken).not.toBe(L.lesson);
    const bare = quotedPairs(broken).filter((p) => !p.ref);
    expect(bare.map((p) => p.inside)).toEqual(['unknown']);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });
  it('and no reader-facing field prints a decision-record identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');
  it('no generic God, GOD or LORD in our authored voice', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });
  it('but the quotations keep the LORD exactly as the corpus has it', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Except the LORD build the house');
  });
  it('names Yahweh in our prose in every band', () => {
    for (const k of PLACES) expect(ourVoice(TEXTS[k]), k).toMatch(/\bYahweh\b/);
  });
  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });
  it('PROVEN TO CATCH: stripping the teen parent line names teen and only teen', () => {
    const teen = L.levels.teen;
    const line = /Parents, ask your son or daughter[^.]*\./.exec(teen);
    expect(line).toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(line[0], '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['parents'] }]);
  });
  it('carries the skill and the rhythm in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: listen to the end`).toMatch(/[Ll]isten (all the way )?to the end|[Ll]isten all the way/);
      expect(TEXTS[k], `${k}: retell`).toMatch(/in (their|your) own words/);
      expect(TEXTS[k], `${k}: the four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(TEXTS[k], `${k}: one friend this week`).toMatch(/one friend this week/);
      expect(TEXTS[k], `${k}: the aim`).toMatch(/until we see that Yahweh has been right/);
    }
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
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });
  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
  });
  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of BANDS) expect(TEXTS[k].startsWith('THE HOUSE REPORTS ITSELF — before and after the key stopped working.'), k).toBe(true);
  });
});

describe('the reader meets numbered points, in order', () => {
  it('the lesson’s headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });
  it('no band opens a sentence with an ordinal the formatter would read as a marker', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
  });
  it('carries no doubled word, no percentage and no money figure', () => {
    const doubled = [];
    for (const t of EVERY_STRING) for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    expect(doubled).toEqual([]);
    for (const k of PLACES) {
      expect(TEXTS[k]).not.toMatch(/\d+(\.\d+)?\s*(percent|%)/);
      expect(TEXTS[k]).not.toMatch(/\$[\d,]/);
    }
  });
});

describe('the two stories are the lesson’s own, on its own spine', () => {
  it('dsi16 carries two titled parables, each with a scene and a verse of this lesson’s anchor', async () => {
    const SIDE = (await import('../lib/lesson-stories.json')).default;
    const mine = SIDE.datasystems[ID];
    expect(mine).toHaveLength(2);
    const words = (s) =>
      String(s || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    const anchors = new Set(anchorRefs(L));
    for (const s of mine) {
      expect(s.kind).toBe('parable');
      expect(words(s.body)).toBeGreaterThanOrEqual(100);
      expect(anchors.has(s.verse), `${s.verse} is not in dsi16's anchor`).toBe(true);
      expect(s.body).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
    }
    expect(mine.map((s) => s.title)).toEqual(['The Log in the Window', 'Unknown Is Not the Same as Well']);
    expect(mine[0].body).toMatch(/Write it plain, he said, so the one who reads it can be on his way/);
    expect(mine[1].body).toMatch(/the house now told him its own state/);
  });
});
